// Minimal CDP driver for local, offline motion tests (mirrors ~/.claude/tools/ui-probe.cjs launch/cleanup).
'use strict';
const { spawn, execSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), net = require('net');

const EXE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function freePort() { return new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); }); }

async function launch() {
  const port = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gsap-digest-'));
  const proc = spawn(EXE, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }); wsUrl = (await r.json()).webSocketDebuggerUrl; } catch { await sleep(200); }
  }
  if (!wsUrl) throw new Error('browser did not open the debugging port');
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    else if (d.method) listeners.forEach((f) => f(d));
  };
  const send = (method, params = {}, ms = 30000) => new Promise((res, rej) => {
    const i = ++id; const t = setTimeout(() => { pending.delete(i); rej(new Error(`${method} timed out`)); }, ms);
    pending.set(i, { res: (v) => { clearTimeout(t); res(v); }, rej: (e) => { clearTimeout(t); rej(e); } });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const logs = [];
  listeners.push((d) => {
    if (d.method === 'Runtime.consoleAPICalled') logs.push({ type: d.params.type, text: d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300) });
    if (d.method === 'Runtime.exceptionThrown') logs.push({ type: 'exception', text: (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text || '').slice(0, 300) });
  });
  await Promise.all(['Page.enable', 'Runtime.enable'].map((m) => send(m)));
  const api = {
    send, logs,
    async viewport(width, height, opts = {}) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: opts.dpr || 1, mobile: !!opts.mobile });
    },
    async media(reduced) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }, { name: 'prefers-color-scheme', value: 'light' }] });
    },
    async go(url, waitMs = 800) {
      logs.length = 0;
      const loaded = new Promise((res) => { const f = (d) => { if (d.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(f), 1); res(); } }; listeners.push(f); });
      const nav = await send('Page.navigate', { url });
      if (nav && nav.errorText) throw new Error('navigate: ' + nav.errorText);
      await Promise.race([loaded, sleep(15000)]);
      await sleep(waitMs);
    },
    async ev(expr, awaitPromise = true) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise, returnByValue: true }, 60000);
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async close() {
      try { const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); const b = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => { b.onopen = r; b.onerror = r; }); b.send(JSON.stringify({ id: 1, method: 'Browser.close' })); } catch {}
      await sleep(1200);
      try { proc.kill('SIGKILL'); } catch {}
      const tag = path.basename(profile);
      try { execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${tag}*' -and $_.Name -in 'msedge.exe','chrome.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' }); } catch {}
      await sleep(400);
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch {}
    },
  };
  return api;
}
const fileUrl = (p) => 'file:///' + path.resolve(p).replace(/\\/g, '/');
module.exports = { launch, sleep, fileUrl };
