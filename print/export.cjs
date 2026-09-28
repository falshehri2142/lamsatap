#!/usr/bin/env node
// print/export.cjs: تصدير قوالب الطباعة (أداة داخلية، GM-023 بند 3). الشرح والأمثلة: print/EXPORT.md
//  (أ) PDF بالمقاس الحقيقي من @page حق الصفحة نفسها (ومعه وضع الـ bleed)، بالخلفيات، بدون هوامش ولا ترويسة ولا تذييل.
//  (ب) PNG لكل ورقة (.p-sheet)، اسمها من data-sign، بأي دقة: 2x للموقع و 300dpi للمطبعة، وبخلفية شفافة لو تبي.
//  (ج) وضع السوشال: صفحة مقاسها بالبكسل (مثل 1080×1080) تطلع بنفس المقاس بالضبط، بدون شفافية.
// بدون npm: Node 22 أو أحدث (فيه fetch و WebSocket) + Chrome أو Edge المثبت، عن طريق DevTools protocol.
// يشغّل سيرفر محلي على 127.0.0.1 لجذر المشروع (القوالب تقرا ../../website/...)، ويمنع أي طلب برّا الجهاز،
// وبروفايل المتصفح مؤقت وينحذف. كل ملف ينفحص بعد الكتابة، والنتيجة في <name>.export.json.
//
//   node print/export.cjs --url "print/host-stickers/index.html?client=example-flats" --out <dir> --pdf --png 2x,300dpi --transparent
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const zlib = require('zlib');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');            // جذر المشروع (print/ داخله)
const VIEW_W = 1280, VIEW_H = 800;                      // نافذة سطح مكتب وقت التحميل
// القياس في نافذة عريضة جداً: الورقة تاخذ مقاسها الطبيعي حتى لو المعاينة flex تضغطها في نافذة أضيق (مثل منشور 1080 جنب منشور)
const MEASURE_W = 4096;
const FEATURES = [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (v) => Math.round(v * 100) / 100;
const pxToMM = (px) => px * 25.4 / 96;                  // CSS: 1in = 96px = 25.4mm
const mmToPt = (mm) => mm * 72 / 25.4;                  // PDF: 1pt = 1/72in
const ptToMM = (pt) => pt * 25.4 / 72;
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const relPath = (f) => { const r = path.relative(ROOT, path.resolve(f)); return r.startsWith('..') || path.isAbsolute(r) ? path.resolve(f) : r.split(path.sep).join('/'); };

const USAGE = `usage: node print/export.cjs --url <path?query> --out <dir> [options]
  --url <p>          template path from the project root, with its query
                     e.g. "print/host-stickers/index.html?client=example-flats"
  --out <dir>        output folder (created if missing)
  --name <base>      file name base (default: <folder>[-<client>][-mono])
  --sign-names       PNG files named by the sheet only: <sign>@2x.png (e.g. print/host-signs/png/wifi-stand@2x.png)
  --file <name.png>  exact PNG file name for one sheet at one scale (e.g. --file wifi-stand.png for print/renders/);
                     the page must show one sheet (template parameter such as sign=wifi, or --only <sheet>)
  --check            dry run: open the page, list sheets, fonts and warnings, export nothing
  --pdf              PDF at the page's own @page size: print media, backgrounds, no margins,
                     no header/footer; the page box is corrected to the exact @page size
  --png <scales>     one PNG per sheet at each scale: 1x,2x,3x (website) or 300dpi,600dpi (print)
  --transparent      PNG with a transparent page background (RGBA); default is opaque RGB
  --social           social images: sheets sized in whole CSS px, captured at 1x to that exact
                     pixel size, opaque, screen media (no --pdf)
  --bleed            the template's print-shop mode (bleed and crop marks): adds bleed=1 to the URL,
                     checks the trim box (.s-trim or [data-trim]) against the page without bleed,
                     and writes PDF TrimBox/BleedBox from the template's own boxes
  --bleed-param <k=v> URL parameter for bleed mode (default: bleed=1)
  --param <k=v>      extra URL parameter, repeatable (e.g. --param mono=1)
  --selector <css>   sheet selector (default: .p-sheet)
  --only <a,b>       only these sheets (names as in the file names)
  --media <m>        media for PNGs: auto (default: screen for 1x/2x website images, print for dpi
                     scales), print or screen
  --wait <ms>        extra wait after the page is ready (default 0)
  --timeout <ms>     page ready timeout (default 30000)
  --browser <exe>    Chrome or Edge executable (default: found automatically; or env PRINT_EXPORT_BROWSER)
  --allow-net        allow requests outside the local server (blocked by default)
  --force            export even when the page had errors (failed requests, script or font errors)
  --no-pdf-fix       keep the page size exactly as Chrome rounded it
  --no-manifest      do not write <name>.export.json
Exit code: 0 all checks passed, 1 page error or a failed check, 2 usage error.
Details: print/EXPORT.md`;

// ---------------------------------------------------------------- الخيارات
function usageError(msg) { const e = new Error(msg); e.usage = true; return e; }
function num(v, a, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw usageError(`${a} must be a number from ${min} to ${max}`);
  return n;
}
// "2x" = 2 بكسل لكل بكسل CSS (الموقع @2x)، و "300dpi" = 300/96 (المطبعة)
function parseScales(list) {
  const out = [];
  for (const t of String(list).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    let m, s;
    if ((m = /^(\d+(?:\.\d+)?)x$/.exec(t))) s = { label: m[1] + 'x', scale: +m[1], dpi: 96 * +m[1], kind: 'web' };
    else if ((m = /^(\d+(?:\.\d+)?)dpi$/.exec(t))) s = { label: m[1] + 'dpi', scale: +m[1] / 96, dpi: +m[1], kind: 'print' };
    else throw usageError(`bad scale "${t}": use 1x, 2x, 3x or 300dpi, 600dpi`);
    if (!(s.scale >= 0.25 && s.scale <= 10)) throw usageError('scale out of range (0.25x to 10x): ' + t);
    if (!out.some((x) => x.label === s.label)) out.push(s);
  }
  if (!out.length) throw usageError('--png needs at least one scale, e.g. --png 2x,300dpi');
  return out;
}
function parseArgs(argv) {
  const o = { params: [], pdf: false, png: null, transparent: false, social: false, bleed: false, bleedParam: ['bleed', '1'], selector: '.p-sheet',
    only: null, media: 'auto', wait: 0, timeout: 30000, browser: process.env.PRINT_EXPORT_BROWSER || null, allowNet: false, force: false,
    pdfFix: true, manifest: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { const v = argv[++i]; if (v === undefined || /^--[a-z]/.test(v)) throw usageError(a + ' needs a value'); return v; };
    if (a === '--help' || a === '-h') o.help = true;
    else if (a === '--url') o.url = val();
    else if (a === '--out') o.out = val();
    else if (a === '--name') o.name = val();
    else if (a === '--sign-names') o.signNames = true;
    else if (a === '--file') o.file = val();
    else if (a === '--check') o.check = true;
    else if (a === '--pdf') o.pdf = true;
    else if (a === '--png') o.png = parseScales(val());
    else if (a === '--transparent') o.transparent = true;
    else if (a === '--social') o.social = true;
    else if (a === '--bleed') o.bleed = true;
    else if (a === '--bleed-param') { const m = /^([\w-]+)=(.+)$/.exec(val()); if (!m) throw usageError('--bleed-param takes key=value, e.g. bleed=1'); o.bleedParam = [m[1], m[2]]; }
    else if (a === '--param') { const m = /^([\w-]+)=(.*)$/.exec(val()); if (!m) throw usageError('--param takes key=value'); o.params.push([m[1], m[2]]); }
    else if (a === '--selector') o.selector = val();
    else if (a === '--only') o.only = val().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--media') { o.media = val(); if (!/^(auto|print|screen)$/.test(o.media)) throw usageError('--media is auto, print or screen'); }
    else if (a === '--wait') o.wait = num(val(), a, 0, 60000);
    else if (a === '--timeout') o.timeout = num(val(), a, 1000, 600000);
    else if (a === '--browser') o.browser = val();
    else if (a === '--allow-net') o.allowNet = true;
    else if (a === '--force') o.force = true;
    else if (a === '--no-pdf-fix') o.pdfFix = false;
    else if (a === '--no-manifest') o.manifest = false;
    else throw usageError('unknown option: ' + a);
  }
  if (o.help) return o;
  if (!o.url) throw usageError('--url is required');
  if (o.check) { if (o.pdf || o.png) throw usageError('--check exports nothing: drop --pdf/--png'); o.manifest = !!o.out && o.manifest; return o; }
  if (!o.out) throw usageError('--out is required');
  if (o.social) {
    if (o.pdf) throw usageError('--social makes images only (drop --pdf)');
    if (o.transparent) throw usageError('--social images are opaque (drop --transparent)');
    if (o.bleed) throw usageError('--social has no bleed');
    if (o.png && o.png.some((s) => s.scale !== 1)) throw usageError('--social captures at 1x only: the page sets the pixel size');
    o.png = [{ label: '1x', scale: 1, dpi: null, kind: 'social' }];
  }
  if (!o.pdf && !o.png) throw usageError('nothing to export: add --pdf and/or --png <scales>');
  if (o.transparent && !o.png) throw usageError('--transparent is for PNGs: add --png <scales>');
  if (o.name && !/^[a-z0-9][a-z0-9._-]*$/i.test(o.name)) throw usageError('--name: Latin letters, digits, dot, dash and underscore only');
  // --file: اسم ملف PNG بالضبط (مثل صور الموقع print/renders/wifi-stand.png)، لورقة وحدة بدقة وحدة
  if (o.file !== undefined) {
    if (!/^[a-z0-9][a-z0-9._-]*\.png$/i.test(o.file)) throw usageError('--file: a PNG file name only (Latin letters, digits, dot, dash, underscore; ends in .png), no folder: the folder is --out');
    if (!o.png || o.png.length !== 1) throw usageError('--file names one PNG: use it with exactly one --png scale (e.g. --png 2x)');
    if (o.signNames) throw usageError('--file and --sign-names both set the PNG name: use one');
  }
  // الوسيط لكل دقة: صور الموقع (1x و 2x) بشكل المعاينة (screen، مثل زاوية اللوح المدوّرة)، وصور المطبعة (dpi) بشكل الطباعة (print)
  if (o.png) for (const s of o.png) s.media = o.media !== 'auto' ? o.media : s.kind === 'print' ? 'print' : 'screen';
  return o;
}

// الرابط: مسار داخل المشروع (مو موقع برّا)، ومعه الـ query حق القالب
function resolveTarget(u) {
  const q = u.indexOf('?'), p0 = q >= 0 ? u.slice(0, q) : u, query = q >= 0 ? u.slice(q + 1) : '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(p0)) throw usageError('--url is a path inside the project (like print/stand/index.html?client=x), not a web address');
  let abs = path.resolve(process.cwd(), p0);
  if (!path.isAbsolute(p0) && !fs.existsSync(abs)) abs = path.resolve(ROOT, p0);
  const r = path.relative(ROOT, abs);
  if (r.startsWith('..') || path.isAbsolute(r)) throw usageError('--url must be inside the project folder: ' + ROOT);
  if (!fs.existsSync(abs)) throw usageError('not found: ' + r.split(path.sep).join('/'));
  const parts = r ? r.split(path.sep) : [];
  if (parts.some((s) => s.startsWith('.'))) throw usageError('--url cannot point inside a hidden folder');
  const isDir = fs.statSync(abs).isDirectory(), file = isDir ? path.join(abs, 'index.html') : abs;
  if (!fs.existsSync(file)) throw usageError('no index.html in ' + parts.join('/'));
  return { path: '/' + parts.map(encodeURIComponent).join('/') + (isDir && parts.length ? '/' : ''), query: new URLSearchParams(query), file };
}
function defaultName(t) {
  const base = path.basename(t.file, path.extname(t.file));
  let n = base === 'index' ? path.basename(path.dirname(t.file)) : base;
  if (t.query.get('client')) n += '-' + t.query.get('client');
  if (t.query.get('mono') === '1') n += '-mono';
  return slug(n) || 'export';
}

// ---------------------------------------------------------------- سيرفر محلي لجذر المشروع
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
function startServer(root) {
  const realRoot = fs.realpathSync(root);
  const srv = http.createServer((req, res) => {
    const deny = (code) => { res.writeHead(code, { 'content-type': 'text/plain' }); res.end(String(code)); };
    if (req.method !== 'GET' && req.method !== 'HEAD') return deny(405);
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return deny(400); }
    // ولا ملف مخفي (.git و .claude) ولا شي برّا المشروع
    if (p.includes('\0') || p.split('/').some((s) => s.startsWith('.'))) return deny(403);
    let f = path.join(realRoot, p);
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); f = fs.realpathSync(f); } catch (e) { return deny(404); }
    const r = path.relative(realRoot, f);
    if (r.startsWith('..') || path.isAbsolute(r)) return deny(403);
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) return deny(404);
      res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'content-length': st.size,
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(f).pipe(res);
    });
  });
  return new Promise((resolve, reject) => {
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, origin: 'http://127.0.0.1:' + srv.address().port }));
  });
}

// ---------------------------------------------------------------- المتصفح (Chrome أو Edge) عن طريق DevTools protocol
function findBrowser(explicit) {
  if (explicit) return fs.existsSync(explicit) ? explicit : null;
  const PF = process.env.PROGRAMFILES || 'C:\\Program Files', PF86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', LA = process.env.LOCALAPPDATA || '';
  const c = [path.join(PF, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(PF86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    LA && path.join(LA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(PF86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(PF, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return c.find((p) => p && fs.existsSync(p)) || null;
}
class CDP {
  constructor(url) { this.url = url; this.seq = 0; this.pending = new Map(); this.handlers = []; this.closed = false; }
  open() {
    return new Promise((resolve, reject) => {
      const ws = this.ws = new WebSocket(this.url);
      ws.onopen = () => resolve(this);
      ws.onerror = () => reject(new Error('DevTools socket error'));
      ws.onclose = () => { this.closed = true; for (const p of this.pending.values()) p.rej(new Error('browser connection closed')); this.pending.clear(); };
      ws.onmessage = (m) => {
        const d = JSON.parse(typeof m.data === 'string' ? m.data : Buffer.from(m.data).toString('utf8'));
        if (d.id !== undefined) {
          const p = this.pending.get(d.id);
          if (p) { this.pending.delete(d.id); if (d.error) p.rej(new Error(p.method + ': ' + d.error.message)); else p.res(d.result); }
        } else if (d.method) for (const h of this.handlers.slice()) h(d.method, d.params || {});
      };
    });
  }
  send(method, params = {}, ms = 60000) {
    if (this.closed) return Promise.reject(new Error('browser connection closed'));
    return new Promise((res, rej) => {
      const id = ++this.seq;
      const t = setTimeout(() => { this.pending.delete(id); rej(new Error(`${method} timed out after ${ms} ms`)); }, ms);
      this.pending.set(id, { method, res: (v) => { clearTimeout(t); res(v); }, rej: (e) => { clearTimeout(t); rej(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(fn) { this.handlers.push(fn); return () => { const i = this.handlers.indexOf(fn); if (i >= 0) this.handlers.splice(i, 1); }; }
  waitFor(method, ms) {
    return new Promise((res, rej) => {
      const off = this.on((m, p) => { if (m === method) { clearTimeout(t); off(); res(p); } });
      const t = setTimeout(() => { off(); rej(new Error(`${method} did not arrive within ${ms} ms`)); }, ms);
    });
  }
  close() { try { this.ws.close(); } catch (e) { /* already closed */ } }
}
async function launchBrowser(exe) {
  // بروفايل مؤقت خاص فينا (مو بروفايل صاحب الجهاز)، ومنفذ DevTools يختاره المتصفح (0) ويكتبه في DevToolsActivePort
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-export-'));
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
    '--disable-features=Translate,MediaRouter,OptimizationHints', '--force-color-profile=srgb',
    // تنعيم الحروف رمادي بس: بدونه كروم ينعّم النص الصغير بالبكسلات الفرعية (LCD)، فتطلع حواف ملونة (برتقالي وأزرق)
    // حول النص الأسود في PNG: تبان في مشاهد الموقع، وتطلع هالات ألوان في الطباعة (قسناها 2026-09-28: لين 192 في الفرق بين القنوات)
    '--disable-lcd-text',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'];
  const proc = spawn(exe, args, { stdio: 'ignore', windowsHide: true });
  const b = { exe, profile, proc, exited: false };
  proc.on('exit', () => { b.exited = true; });
  proc.on('error', () => { b.exited = true; });
  const portFile = path.join(profile, 'DevToolsActivePort');
  try {
    let port = null;
    // Edge يطلق نفسه من جديد ويقفل أول عملية، فما نعتمد على خروجها؛ ننتظر ملف المنفذ لين 30 ثانية
    for (let t = Date.now(); Date.now() - t < 30000 && !port; ) {
      try { port = +fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0]; } catch (e) { /* not written yet */ }
      if (!port) { if (b.exited && Date.now() - t > 15000) break; await sleep(100); }
    }
    if (!port) throw new Error('the browser did not open its DevTools port: ' + exe);
    const base = 'http://127.0.0.1:' + port;
    const ver = await (await fetch(base + '/json/version')).json();
    b.version = ver.Browser;
    b.browserWs = ver.webSocketDebuggerUrl;
    const target = await (await fetch(base + '/json/new?about:blank', { method: 'PUT' })).json();
    b.page = await new CDP(target.webSocketDebuggerUrl).open();
    return b;
  } catch (e) { await closeBrowser(b); throw e; }   // ولا متصفح يبقى شغال لو فشل الاتصال
}
async function closeBrowser(b) {
  if (!b || b.closing) return; b.closing = true;
  if (b.page) b.page.close();
  if (b.browserWs) {
    let c = null;
    try { c = await new CDP(b.browserWs).open(); c.send('Browser.close').catch(() => {}); } catch (e) { /* gone */ }
    for (let i = 0; i < 30 && !b.exited; i++) await sleep(100);
    if (c) c.close();
  }
  try { b.proc.kill(); } catch (e) { /* gone */ }
  // أي عملية باقية ببروفايلنا المؤقت بس (مو متصفح صاحب الجهاز). Edge يعيد تشغيل نفسه، فنمسك بالبروفايل مو بالـ pid
  const tag = path.basename(b.profile);
  try {
    if (process.platform === 'win32') execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${tag}*' -and $_.Name -in 'msedge.exe','chrome.exe' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore', timeout: 20000 });
    else execSync(`pkill -f -- '--user-data-dir=.*${tag}' || true`, { stdio: 'ignore' });
  } catch (e) { /* nothing left */ }
  for (let i = 0; i < 6; i++) {
    try { fs.rmSync(b.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); b.profileLeft = null; break; }
    catch (e) { b.profileLeft = path.basename(b.profile) + ' in the system temp folder (' + e.code + ')'; await sleep(700); }
  }
}

// ---------------------------------------------------------------- داخل الصفحة (كل دالة مستقلة، تنرسل نصاً)
async function evalIn(cdp, fn, arg, ms = 60000) {
  const r = await cdp.send('Runtime.evaluate', { expression: `(${fn.toString()})(${JSON.stringify(arg === undefined ? null : arg)})`,
    awaitPromise: true, returnByValue: true }, ms);
  if (r.exceptionDetails) {
    const d = r.exceptionDetails;
    throw new Error('page script failed: ' + ((d.exception && d.exception.description) || d.text));
  }
  return r.result ? r.result.value : undefined;
}
// تنتظر: الصفحة تكمل، والأوراق تطلع، والـ DOM يهدأ، والخطوط، والصور، والحركات المحدودة، و PRINT_READY لو القالب حطه.
// وإشارة القالب: html[data-ready] لو موجودة بقيمة غير "1" (مثل "0")، ننتظرها تصير "1" (markReady في print.js)
function pageReady(a) {
  return (async () => {
    const t0 = performance.now(), left = () => a.timeout - (performance.now() - t0), notes = new Set();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const within = (p) => Promise.race([p, sleep(Math.max(0, left()))]);
    const de = document.documentElement, signalPending = () => de.hasAttribute('data-ready') && de.getAttribute('data-ready') !== '1';
    while (document.readyState !== 'complete' && left() > 0) await sleep(25);
    while (!document.querySelector(a.sel) && left() > 0) await sleep(25);
    for (const im of document.images) if (im.loading === 'lazy') im.loading = 'eager';
    let lastChange = performance.now();
    const mo = new MutationObserver(() => { lastChange = performance.now(); });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    for (let round = 1; ; round++) {
      while ((performance.now() - lastChange < a.quiet || signalPending()) && left() > 0) await sleep(25);
      const mark = lastChange;
      if (window.PRINT_READY && typeof window.PRINT_READY.then === 'function') await within(Promise.resolve(window.PRINT_READY).catch(() => {}));
      if (document.fonts) await within(document.fonts.ready);
      await within(Promise.all([...document.images].map((im) => (im.complete ? (im.naturalWidth ? im.decode().catch(() => {}) : null)
        : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })))));
      const anims = document.getAnimations ? document.getAnimations() : [];
      const finite = anims.filter((x) => { try { return isFinite(x.effect.getComputedTiming().endTime); } catch (e) { return false; } });
      if (anims.length > finite.length) notes.add('endless animations: ' + (anims.length - finite.length));
      await within(Promise.all(finite.map((x) => x.finished.catch(() => {}))));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (lastChange === mark || left() <= 0 || round >= 8) { if (lastChange !== mark) notes.add('page kept changing'); break; }
    }
    mo.disconnect();
    if (signalPending()) notes.add('the template did not set data-ready="1"');
    if (left() <= 0) notes.add('ready timeout');
    return { ms: Math.round(performance.now() - t0), notes: [...notes], signal: de.getAttribute('data-ready') };
  })();
}
// مقاس @page (آخر قاعدة بدون اسم فيها size، ومنها اللي داخل @media print)، والأوراق، والخطوط، وتنبيهات القالب
function pageInfo(a) {
  const sizes = [];
  // وسيط ما يشمل الطباعة: screen أو speech بدون print/all، أو "not print"
  const screenOnly = (m) => { m = (m || '').toLowerCase(); return !!m && (/\bnot\s+print\b/.test(m) || (!/\b(print|all)\b/.test(m) && /\b(screen|speech)\b/.test(m))); };
  const walk = (rules) => {
    for (const r of rules) {
      if (typeof CSSPageRule !== 'undefined' && r instanceof CSSPageRule) { const v = r.style.getPropertyValue('size').trim(); if (v && !r.selectorText) sizes.push(v); }
      else if (typeof CSSMediaRule !== 'undefined' && r instanceof CSSMediaRule) { if (!screenOnly(r.media.mediaText)) walk(r.cssRules); }
      else if (typeof CSSImportRule !== 'undefined' && r instanceof CSSImportRule) { if (r.styleSheet && !screenOnly(r.media.mediaText)) { try { walk(r.styleSheet.cssRules); } catch (e) { /* blocked */ } } }
      else if (r.cssRules && !(typeof CSSKeyframesRule !== 'undefined' && r instanceof CSSKeyframesRule)) walk(r.cssRules);
    }
  };
  for (const ss of document.styleSheets) {
    if (ss.media && screenOnly(ss.media.mediaText)) continue;
    let rules = null; try { rules = ss.cssRules; } catch (e) { /* cross-origin */ }
    if (rules) walk(rules);
  }
  // صندوق القص وصندوق النزف داخل الورقة (لو القالب حددهم): [data-trim] أو .s-trim، و [data-bleed-box] أو .s-art
  const inner = (el, q) => {
    const t = el.querySelector(q); if (!t) return null;
    const r0 = el.getBoundingClientRect(), r = t.getBoundingClientRect();
    return { x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height };
  };
  const sheets = [...document.querySelectorAll(a.sel)].map((el, i) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return { i, sign: (el.getAttribute('data-sign') || el.id || '').trim(), w: r.width, h: r.height, radius: cs.borderRadius,
      shown: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
      trim: inner(el, '[data-trim], .s-trim'), art: inner(el, '[data-bleed-box], .s-art') };
  });
  let report = null;
  try { report = window.PRINT_REPORT ? JSON.parse(JSON.stringify(window.PRINT_REPORT)) : null; } catch (e) { report = null; }
  return {
    title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    pageSize: sizes.length ? sizes[sizes.length - 1] : '', sheets, report,
    fonts: document.fonts ? [...document.fonts].map((f) => ({ family: f.family.replace(/^["']|["']$/g, ''), weight: f.weight, style: f.style, status: f.status })) : [],
    warnings: [...document.querySelectorAll('.p-warn li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)
  };
}
function measureSheets(a) {
  return [...document.querySelectorAll(a.sel)].map((el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
}
function injectCss(a) {
  let s = document.getElementById('ltx-style');
  if (!s) { s = document.createElement('style'); s.id = 'ltx-style'; document.head.appendChild(s); }
  s.textContent = a.css;
  document.documentElement.classList.toggle('ltx-clear', !!a.clear);
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))));
}
// ورقة وحدة: تنثبت في زاوية الشاشة (0,0) بنفس مقاسها، وكل شي غيرها يختفي. عشان حافتها تبدأ على بكسل كامل.
// ترجّع أكبر فرق في مكان أو مقاس أي عنصر داخلها قبل وبعد (لازم صفر تقريباً، وإلا نرجع للتصوير في مكانها)
function soloOn(a) {
  const el = document.querySelectorAll(a.sel)[a.i];
  if (!el) return { error: 'sheet not found' };
  const X = window.__ltx = { el, saved: [] };
  const set = (n, p, v) => { X.saved.push([n, p, n.style.getPropertyValue(p), n.style.getPropertyPriority(p)]); n.style.setProperty(p, v, 'important'); };
  // العناصر المرسومة بس (display: none ما له مكان، ومقارنته تعطي فرق كاذب)
  const geo = () => { const r0 = el.getBoundingClientRect(); return [...el.querySelectorAll('*')].filter((e) => e.getClientRects().length).map((e) => { const r = e.getBoundingClientRect(); return [r.left - r0.left, r.top - r0.top, r.width, r.height]; }); };
  for (const p of ['transform', 'translate', 'rotate', 'scale']) set(el, p, 'none');
  const r = el.getBoundingClientRect(), before = geo();
  set(el, 'box-sizing', 'border-box'); set(el, 'width', r.width + 'px'); set(el, 'height', r.height + 'px');
  set(el, 'min-width', '0'); set(el, 'max-width', 'none'); set(el, 'min-height', '0'); set(el, 'max-height', 'none');
  for (let n = el; n.parentElement; n = n.parentElement) {
    for (const s of n.parentElement.children) if (s !== n && !/^(HEAD|SCRIPT|STYLE|LINK|META|TITLE|TEMPLATE|NOSCRIPT)$/.test(s.tagName)) set(s, 'display', 'none');
  }
  set(el, 'position', 'fixed'); set(el, 'left', '0'); set(el, 'top', '0'); set(el, 'right', 'auto'); set(el, 'bottom', 'auto');
  set(el, 'margin', '0'); set(el, 'z-index', '2147483647');
  el.classList.add('ltx-target'); document.documentElement.classList.add('ltx-solo');
  window.scrollTo(0, 0);
  let r2 = el.getBoundingClientRect();
  if (Math.abs(r2.left) > 0.01 || Math.abs(r2.top) > 0.01) {
    // جد فيه transform أو filter أو contain يغيّر مرجع position: fixed
    for (let n = el.parentElement; n; n = n.parentElement) for (const p of ['transform', 'translate', 'rotate', 'scale', 'filter', 'backdrop-filter', 'perspective', 'contain', 'will-change', 'container-type']) set(n, p, p === 'will-change' ? 'auto' : p === 'container-type' ? 'normal' : 'none');
    r2 = el.getBoundingClientRect();
  }
  const after = geo();
  let delta = Math.max(Math.abs(r2.width - r.width), Math.abs(r2.height - r.height));
  if (after.length !== before.length) delta = 9999;
  else for (let k = 0; k < before.length; k++) for (let j = 0; j < 4; j++) delta = Math.max(delta, Math.abs(before[k][j] - after[k][j]));
  X.geo = geo; X.after = after; X.size = [r2.width, r2.height];
  return { x: r2.left, y: r2.top, w: r2.width, h: r2.height, delta, parts: before.length };
}
// بعد تغيير النافذة: الورقة المثبتة لازم تبقى نفسها بالضبط (مكانها في 0,0 ومقاسها وعناصرها)
function soloCheck() {
  const X = window.__ltx; if (!X) return { x: 1, y: 1, delta: 9999 };
  const r = X.el.getBoundingClientRect(), g = X.geo();
  let delta = Math.max(Math.abs(r.width - X.size[0]), Math.abs(r.height - X.size[1]));
  if (g.length !== X.after.length) delta = 9999;
  else for (let k = 0; k < g.length; k++) for (let j = 0; j < 4; j++) delta = Math.max(delta, Math.abs(g[k][j] - X.after[k][j]));
  return { x: r.left, y: r.top, delta };
}
function soloOff() {
  const X = window.__ltx; if (!X) return true;
  for (let k = X.saved.length - 1; k >= 0; k--) { const [n, p, v, pr] = X.saved[k]; if (v) n.style.setProperty(p, v, pr); else n.style.removeProperty(p); }
  X.el.classList.remove('ltx-target'); document.documentElement.classList.remove('ltx-solo'); delete window.__ltx;
  return true;
}
function rectOf(a) {
  const el = document.querySelectorAll(a.sel)[a.i], r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height,
    docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight };
}
function nextFrame() { return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); }
// وقت التصوير: المعاينة وحدود الأمان ما تطلع، وإطار المعاينة حول الورقة يروح، والخلفية شفافة لو مطلوب
function captureCss(sel) {
  return `.p-screen, .p-guide, [data-export="hide"] { display: none !important; }
${sel} { outline: none !important; }
html.ltx-clear, html.ltx-clear body { background: transparent !important; }
html.ltx-solo, html.ltx-solo body { overflow: hidden !important; }
html.ltx-solo body { visibility: hidden !important; }
html.ltx-solo .ltx-target { visibility: visible !important; }
* { caret-color: transparent !important; }`;
}

// ---------------------------------------------------------------- مقاس @page
const PAGE_KEYWORDS = { a6: [105, 148], a5: [148, 210], a4: [210, 297], a3: [297, 420], b5: [176, 250], b4: [250, 353], 'jis-b5': [182, 257], 'jis-b4': [257, 364],
  letter: [215.9, 279.4], legal: [215.9, 355.6], ledger: [279.4, 431.8] };
const UNIT_MM = { mm: 1, cm: 10, q: 0.25, in: 25.4, pt: 25.4 / 72, pc: 25.4 / 6, px: 25.4 / 96 };
function parseCssPageSize(v) {
  const t = String(v || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  let orient = null, kw = null; const lens = [];
  for (const x of t) {
    if (x === 'portrait' || x === 'landscape') orient = x;
    else if (PAGE_KEYWORDS[x]) kw = PAGE_KEYWORDS[x];
    else { const m = /^(\d*\.?\d+)(mm|cm|q|in|pt|pc|px)$/.exec(x); if (!m) return null; lens.push(+m[1] * UNIT_MM[m[2]]); }
  }
  let w, h;
  if (lens.length) { w = lens[0]; h = lens.length > 1 ? lens[1] : lens[0]; } else if (kw) [w, h] = kw; else return null;
  if ((orient === 'landscape' && w < h) || (orient === 'portrait' && w > h)) [w, h] = [h, w];
  return w > 0 && h > 0 ? { w, h } : null;
}

// ---------------------------------------------------------------- PNG (فك وتركيب بدون مكتبات: 8 بت، RGB أو RGBA)
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function pngChunk(type, data) {
  const head = Buffer.alloc(8); head.writeUInt32BE(data.length, 0); head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function decodePNG(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('not a PNG');
  let o = 8, ihdr = null, dpi = null, srgb = false; const idat = [];
  while (o + 8 <= buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') ihdr = { w: d.readUInt32BE(0), h: d.readUInt32BE(4), depth: d[8], ct: d[9], il: d[12] };
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'pHYs' && d[8] === 1) dpi = Math.round(d.readUInt32BE(0) * 0.0254 * 100) / 100;
    else if (type === 'sRGB') srgb = true;
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  if (!ihdr) throw new Error('PNG without IHDR');
  if (ihdr.depth !== 8 || (ihdr.ct !== 2 && ihdr.ct !== 6) || ihdr.il) throw new Error('unsupported PNG (need 8-bit RGB or RGBA, not interlaced)');
  const ch = ihdr.ct === 6 ? 4 : 3, stride = ihdr.w * ch, raw = zlib.inflateSync(Buffer.concat(idat)), px = Buffer.alloc(stride * ihdr.h);
  if (raw.length < (stride + 1) * ihdr.h) throw new Error('PNG data too short');
  for (let y = 0; y < ihdr.h; y++) {
    const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, d = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[d + x - ch] : 0, b = y ? px[d - stride + x] : 0, c = x >= ch && y ? px[d - stride + x - ch] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[d + x] = v & 255;
    }
  }
  return { w: ihdr.w, h: ihdr.h, ch, px, dpi, srgb };
}
// فلتر لكل سطر (الأقل مجموعاً، طريقة libpng)، ثم ضغط zlib. ومعه sRGB و pHYs (الـ dpi) عشان برامج الطباعة تقرا المقاس صح
function encodePNG(img, dpi) {
  const { w, h, ch, px } = img, stride = w * ch, out = Buffer.alloc((stride + 1) * h), cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < h; y++) {
    const row = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    let best = 0, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const t = cand[f]; let sum = 0, x = 0;
      for (; x < stride; x++) {
        const a = x >= ch ? row[x - ch] : 0, b = prev ? prev[x] : 0, c = prev && x >= ch ? prev[x - ch] : 0;
        let v = row[x];
        if (f === 1) v -= a; else if (f === 2) v -= b; else if (f === 3) v -= (a + b) >> 1;
        else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v -= pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        v &= 255; t[x] = v; sum += v < 128 ? v : 256 - v;
        if (sum >= bestSum) break;
      }
      if (x === stride && sum < bestSum) { bestSum = sum; best = f; }
    }
    out[y * (stride + 1)] = best; cand[best].copy(out, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = ch === 4 ? 6 : 2;
  const parts = [PNG_SIG, pngChunk('IHDR', ihdr), pngChunk('sRGB', Buffer.from([0]))];
  if (dpi) { const ppm = Math.round(dpi / 0.0254), p = Buffer.alloc(9); p.writeUInt32BE(ppm, 0); p.writeUInt32BE(ppm, 4); p[8] = 1; parts.push(pngChunk('pHYs', p)); }
  parts.push(pngChunk('IDAT', zlib.deflateSync(out, { level: 9 })), pngChunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}
function cropImg(img, x0, y0, w, h) {
  if (x0 < 0 || y0 < 0 || x0 + w > img.w || y0 + h > img.h) throw new Error(`capture too small: got ${img.w}x${img.h}, need ${w}x${h} from ${x0},${y0}`);
  const px = Buffer.alloc(w * h * img.ch);
  for (let y = 0; y < h; y++) img.px.copy(px, y * w * img.ch, ((y0 + y) * img.w + x0) * img.ch, ((y0 + y) * img.w + x0 + w) * img.ch);
  return { w, h, ch: img.ch, px };
}
function toRGB(img) {   // بدون شفافية: أي بكسل مو كامل ينخلط على أبيض
  if (img.ch === 3) return { img, semi: 0 };
  const n = img.w * img.h, px = Buffer.alloc(n * 3); let semi = 0;
  for (let i = 0; i < n; i++) {
    const a = img.px[i * 4 + 3];
    if (a !== 255) semi++;
    for (let c = 0; c < 3; c++) px[i * 3 + c] = Math.round((img.px[i * 4 + c] * a + 255 * (255 - a)) / 255);
  }
  return { img: { w: img.w, h: img.h, ch: 3, px }, semi };
}
function isBlank(img) {
  const { px, ch } = img;
  for (let i = ch; i < px.length; i += ch) for (let c = 0; c < ch; c++) if (px[i + c] !== px[c]) return false;
  return true;
}
function alphaStats(img) {
  if (img.ch !== 4) return null;
  let clear = 0, partial = 0;
  for (let i = 3; i < img.px.length; i += 4) { const a = img.px[i]; if (a === 0) clear++; else if (a < 255) partial++; }
  const at = (x, y) => img.px[(y * img.w + x) * 4 + 3], n = img.w * img.h;
  return { clearPct: r2(100 * clear / n), partialPct: r2(100 * partial / n), corners: [at(0, 0), at(img.w - 1, 0), at(0, img.h - 1), at(img.w - 1, img.h - 1)] };
}

// ---------------------------------------------------------------- PDF (قراءة وتصحيح المقاس، بدون مكتبات)
function strEnd(s, k) {   // (literal string) من s[k] === '('
  let d = 0;
  do { if (s[k] === '\\') k++; else if (s[k] === '(') d++; else if (s[k] === ')') d--; k++; } while (d > 0 && k < s.length);
  return k;
}
function dictEnd(s, i) {  // نهاية << ... >> المتوازنة من s[i]
  let depth = 0, k = i;
  while (k < s.length) {
    const c = s[k];
    if (c === '(') { k = strEnd(s, k); continue; }
    if (c === '%') { while (k < s.length && s[k] !== '\n' && s[k] !== '\r') k++; continue; }
    if (c === '<') { if (s[k + 1] === '<') { depth++; k += 2; continue; } const e = s.indexOf('>', k); if (e < 0) return -1; k = e + 1; continue; }
    if (c === '>' && s[k + 1] === '>') { depth--; k += 2; if (depth === 0) return k; continue; }
    k++;
  }
  return -1;
}
function arrayEnd(s, i) {
  let depth = 0, k = i;
  while (k < s.length) {
    const c = s[k];
    if (c === '(') { k = strEnd(s, k); continue; }
    if (c === '<') { if (s[k + 1] === '<') { k = dictEnd(s, k); if (k < 0) return -1; continue; } const e = s.indexOf('>', k); if (e < 0) return -1; k = e + 1; continue; }
    if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) return k + 1; }
    k++;
  }
  return -1;
}
const DELIM = /[\s\0/[\]<>(){}%]/;
function topEntries(d) {  // مفاتيح المستوى الأول في القاموس: [{ key, kStart, vStart, vEnd }] (المواقع داخل d)
  const out = [], n = d.length - 2; let i = 2;
  const ws = () => { while (i < n && /[\s\0]/.test(d[i])) i++; };
  for (;;) {
    ws(); if (i >= n || d[i] !== '/') break;
    const kStart = i; i++; while (i < n && !DELIM.test(d[i])) i++;
    const key = d.slice(kStart + 1, i); ws(); const vStart = i, c = d[i];
    if (c === '<' && d[i + 1] === '<') i = dictEnd(d, i);
    else if (c === '<') i = d.indexOf('>', i) + 1;
    else if (c === '[') i = arrayEnd(d, i);
    else if (c === '(') i = strEnd(d, i);
    else if (c === '/') { i++; while (i < n && !DELIM.test(d[i])) i++; }
    else {
      while (i < n && !DELIM.test(d[i])) i++;
      const m = /^\s+(\d+)\s+R(?![A-Za-z0-9])/.exec(d.slice(i, i + 24));   // مرجع: N G R
      if (m && /^\d+$/.test(d.slice(vStart, i))) i += m[0].length;
    }
    if (i < 0) break;
    out.push({ key, kStart, vStart, vEnd: i });
  }
  return out;
}
function pdfRead(buf) {
  const s = buf.toString('latin1');
  const sx = s.lastIndexOf('startxref'); if (sx < 0) throw new Error('no startxref');
  const xoff = +((/startxref\s+(\d+)/.exec(s.slice(sx)) || [])[1]);
  if (s.slice(xoff, xoff + 4) !== 'xref') throw new Error('cross-reference stream PDF (not supported)');
  const entries = []; let p = xoff + 4;
  const head = /\s*(\d+)\s+(\d+)[ \t]*\r?\n/y;
  for (;;) {
    head.lastIndex = p; const m = head.exec(s); if (!m) break; p = head.lastIndex;
    for (let k = 0, start = +m[1], count = +m[2]; k < count; k++, p += 20) {
      const e = /^(\d{10}) (\d{5}) ([nf])/.exec(s.slice(p, p + 20)); if (!e) throw new Error('bad xref entry');
      entries[start + k] = { off: +e[1], gen: +e[2], used: e[3] === 'n' };
    }
  }
  const t = s.indexOf('trailer', p); if (t < 0) throw new Error('no trailer');
  const td0 = s.indexOf('<<', t), trailer = s.slice(td0, dictEnd(s, td0));
  if (/\/Prev\b/.test(trailer)) throw new Error('incrementally updated PDF (not supported)');
  const objs = [];
  entries.forEach((e, n) => {
    if (!e || !e.used) return;
    const h = new RegExp('^' + n + '\\s+' + e.gen + '\\s+obj\\b').exec(s.slice(e.off, e.off + 40));
    if (!h) throw new Error('xref offset does not match object ' + n);
    let k = e.off + h[0].length; while (/\s/.test(s[k])) k++;
    const o = { n, gen: e.gen, off: e.off, start: k, dict: null };
    if (s.startsWith('<<', k)) {
      const de = dictEnd(s, k); o.dict = s.slice(k, de);
      let q = de; while (/\s/.test(s[q])) q++;
      if (s.startsWith('stream', q)) { q += 6; if (s[q] === '\r') q++; if (s[q] === '\n') q++; o.streamStart = q; }
    } else o.value = s.slice(k, s.indexOf('endobj', k)).trim();
    objs[n] = o;
  });
  return { s, buf, xoff, entries, trailer, size: +((/\/Size\s+(\d+)/.exec(trailer) || [])[1]) || entries.length, objs };
}
function pdfVal(o, key) { const e = topEntries(o.dict).find((x) => x.key === key); return e ? o.dict.slice(e.vStart, e.vEnd).trim() : null; }
function pdfStream(P, n) {
  const o = P.objs[n]; if (!o || o.streamStart === undefined) return null;
  let len = pdfVal(o, 'Length'); const ref = /^(\d+)\s+\d+\s+R$/.exec(len || '');
  if (ref) len = P.objs[+ref[1]] && P.objs[+ref[1]].value;
  const raw = P.buf.subarray(o.streamStart, o.streamStart + (+len));
  if (/FlateDecode/.test(pdfVal(o, 'Filter') || '')) { try { return zlib.inflateSync(raw); } catch (e) { return null; } }
  return raw;
}
const pdfNums = (v) => (v ? v.replace(/[[\]]/g, ' ').trim().split(/\s+/).map(Number) : null);
const boxMM = (b) => (b ? [r2(ptToMM(b[2] - b[0])), r2(ptToMM(b[3] - b[1]))] : null);
function pdfPages(P) {  // الصفحات بترتيب /Kids
  const isPage = (o) => o && o.dict && pdfVal(o, 'Type') === '/Page';
  const root = +((/\/Root\s+(\d+)\s+\d+\s+R/.exec(P.trailer) || [])[1]);
  const order = [];
  const visit = (n, depth) => {
    const o = P.objs[n]; if (!o || !o.dict || depth > 30) return;
    if (isPage(o)) { order.push(o); return; }
    const kids = pdfVal(o, 'Kids'); if (kids) for (const m of kids.matchAll(/(\d+)\s+\d+\s+R/g)) visit(+m[1], depth + 1);
  };
  const cat = P.objs[root]; const pages = cat && cat.dict && /(\d+)\s+\d+\s+R/.exec(pdfVal(cat, 'Pages') || '');
  if (pages) visit(+pages[1], 0);
  return order.length ? order : P.objs.filter(isPage);
}
function pdfInfo(buf) {
  const P = pdfRead(buf);
  const info = { version: (/^%PDF-(\d\.\d)/.exec(P.s) || [])[1] || null, pages: [], fonts: {}, fontFiles: 0, type3BitmapFonts: 0, images: [], producer: null, tagged: false };
  info.pages = pdfPages(P).map((o) => ({ obj: o.n, media: pdfNums(pdfVal(o, 'MediaBox')), trim: pdfNums(pdfVal(o, 'TrimBox')), bleed: pdfNums(pdfVal(o, 'BleedBox')) }));
  for (const o of P.objs) {
    if (!o || !o.dict) continue;
    const type = pdfVal(o, 'Type'), sub = pdfVal(o, 'Subtype');
    if (type === '/Font' && sub && sub !== '/CIDFontType0' && sub !== '/CIDFontType2') {
      const k = sub.slice(1); info.fonts[k] = (info.fonts[k] || 0) + 1;
      if (k === 'Type3') {   // هل الحروف مسارات فكتور ولا صور؟
        let cp = pdfVal(o, 'CharProcs') || ''; const ref = /^(\d+)\s+\d+\s+R$/.exec(cp);
        if (ref && P.objs[+ref[1]]) cp = P.objs[+ref[1]].dict || '';
        for (const m of cp.matchAll(/(\d+)\s+\d+\s+R/g)) { const st = pdfStream(P, +m[1]); if (st && /(^|\s)(BI|Do)(\s|$)/.test(st.toString('latin1'))) { info.type3BitmapFonts++; break; } }
      }
    } else if (type === '/FontDescriptor') { if (pdfVal(o, 'FontFile') || pdfVal(o, 'FontFile2') || pdfVal(o, 'FontFile3')) info.fontFiles++; }
    else if (sub === '/Image') info.images.push([+pdfVal(o, 'Width'), +pdfVal(o, 'Height')]);
    else if (type === '/Catalog') info.tagged = /\/Marked\s+true/.test(o.dict);
    const pr = pdfVal(o, 'Producer'); if (pr) info.producer = pr.replace(/^\(|\)$/g, '');
  }
  return info;
}
// كروم يقرّب مقاس الصفحة (لنقطة كاملة ثم لوحدات 1/300 إنش): 100mm يطلع 99.82mm. المحتوى نفسه مرسوم بالمقاس الصحيح
// ومثبت من فوق، فنصحح MediaBox للمقاس الحقيقي، وننزّل المحتوى بالفرق (سطر cm قبل محتوى الصفحة)، ونكتب TrimBox و BleedBox،
// ونعيد جدول xref. لو أي شي مو متوقع: نخلي الملف مثل ما طلع من كروم ونكتب السبب.
// boxes (اختياري): { trim: [يسار، فوق، يمين، تحت], bleed: [...] } بالنقطة من حواف الصفحة، من صناديق القالب نفسه
function fixPdf(buf, want, boxes) {
  const P = pdfRead(buf), s = P.s, edits = [], notes = [], added = [];
  const fmt = (v) => String(Math.round(v * 10000) / 10000);
  const box = (a) => '[' + a.map(fmt).join(' ') + ']';
  let nextNum = P.size, fixed = 0;
  const shiftObj = new Map();
  for (const o of pdfPages(P)) {
    const ents = topEntries(o.dict), get = (k) => ents.find((e) => e.key === k);
    const mb = get('MediaBox'), ct = get('Contents');
    if (!mb || !ct) { notes.push(`page obj ${o.n}: no MediaBox or Contents`); continue; }
    const b = pdfNums(o.dict.slice(mb.vStart, mb.vEnd));
    if (!b || b.length !== 4 || b.some((x) => !Number.isFinite(x))) { notes.push(`page obj ${o.n}: bad MediaBox`); continue; }
    const W0 = b[2] - b[0], H0 = b[3] - b[1];
    if (b[0] !== 0 || b[1] !== 0) { notes.push(`page obj ${o.n}: MediaBox does not start at 0 0, left as is`); continue; }
    if (Math.abs(W0 - want.w) > 2 || Math.abs(H0 - want.h) > 2) { notes.push(`page obj ${o.n}: ${r2(ptToMM(W0))} x ${r2(ptToMM(H0))} mm is not the @page size, left as is`); continue; }
    const first = /(\d+)\s+\d+\s+R/.exec(o.dict.slice(ct.vStart, ct.vEnd));
    const cs = first && pdfStream(P, +first[1]);
    const cm = cs && /^\s*([-+\d.]+)\s+0\s+0\s+([-+\d.]+)\s+([-+\d.]+)\s+([-+\d.]+)\s+cm/.exec(cs.toString('latin1', 0, 300));
    if (!cm || +cm[2] >= 0 || Math.abs(+cm[3]) > 0.01 || Math.abs(+cm[4] - H0) > 0.01) { notes.push(`page obj ${o.n}: content is not anchored at the page top as expected, left as is`); continue; }
    const at = (i) => o.start + i;
    edits.push([at(mb.vStart), at(mb.vEnd), box([0, 0, want.w, want.h])]);
    for (const k of ['CropBox', 'TrimBox', 'BleedBox', 'ArtBox']) { const e = get(k); if (e) edits.push([at(e.kStart), at(e.vEnd), '']); }
    // [يسار، فوق، يمين، تحت] من الحواف → [x0 y0 x1 y1] في PDF (y من تحت)
    const rect = (s) => (s ? [s[0], s[3], want.w - s[2], want.h - s[1]] : [0, 0, want.w, want.h]);
    edits.push([at(mb.vEnd), at(mb.vEnd), '\n/TrimBox ' + box(rect(boxes && boxes.trim)) + '\n/BleedBox ' + box(rect(boxes && boxes.bleed))]);
    const dy = want.h - H0;
    if (Math.abs(dy) > 0.00005) {
      const key = fmt(dy);
      let n = shiftObj.get(key);
      if (n === undefined) {
        n = nextNum++; shiftObj.set(key, n);
        const body = `1 0 0 1 0 ${key} cm\n`;
        added.push([n, `${n} 0 obj\n<</Length ${body.length}>>\nstream\n${body}endstream\nendobj\n`]);
      }
      const cv = o.dict.slice(ct.vStart, ct.vEnd).trim();
      edits.push([at(ct.vStart), at(ct.vEnd), `[${n} 0 R ${cv.startsWith('[') ? cv.slice(1, -1).trim() : cv}]`]);
    }
    fixed++;
  }
  if (!fixed) return { buf, fixed, notes };
  edits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let out = '', last = 0; const shifts = [];
  for (const [a, b, t] of edits) {
    if (a < last) throw new Error('overlapping PDF edits');
    out += s.slice(last, a) + t; shifts.push([a, t.length - (b - a)]); last = b;
  }
  out += s.slice(last, P.xoff);
  if (!out.endsWith('\n')) out += '\n';
  const newOff = (off) => { let d = 0; for (const [p, dl] of shifts) if (p < off) d += dl; return off + d; };
  const addedOff = new Map();
  for (const [n, text] of added) { addedOff.set(n, out.length); out += text; }
  const size = nextNum, pad = (v, w) => String(v).padStart(w, '0');
  let x = 'xref\n0 ' + size + '\n';
  for (let n = 0; n < size; n++) {
    const e = P.entries[n];
    if (addedOff.has(n)) x += pad(addedOff.get(n), 10) + ' 00000 n \n';
    else if (e && e.used) x += pad(newOff(e.off), 10) + ' ' + pad(e.gen, 5) + ' n \n';
    else if (e) x += pad(e.off, 10) + ' ' + pad(e.gen, 5) + ' f \n';
    else x += '0000000000 65535 f \n';
  }
  const xoff = out.length;
  out += x + 'trailer\n' + P.trailer.replace(/\/Size\s+\d+/, '/Size ' + size) + '\nstartxref\n' + xoff + '\n%%EOF\n';
  const nb = Buffer.from(out, 'latin1');
  pdfRead(nb);   // يرمي خطأ لو أي مرجع في xref ما يطابق كائنه
  return { buf: nb, fixed, notes };
}

// ---------------------------------------------------------------- مراقبة الصفحة: أخطاء، طلبات، ومنع أي طلب برّا
function watchPage(cdp, origin, allowNet) {
  const st = { errors: [], warnings: [], inflight: new Map(), blocked: new Set(), docStatus: null };
  const short = (u) => (u && u.startsWith(origin) ? u.slice(origin.length) : u || '');
  const clip = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 240);
  const add = (list, t) => { if (!list.includes(t)) list.push(t); };
  cdp.on((m, p) => {
    if (m === 'Fetch.requestPaused') {
      const u = p.request.url;
      if (u.startsWith(origin + '/') || /^(data|blob):/i.test(u)) cdp.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      else { st.blocked.add(u); cdp.send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' }).catch(() => {}); }
    } else if (m === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails || {};
      add(st.errors, 'script error: ' + clip((d.exception && d.exception.description) || d.text) + (d.url ? ' (' + short(d.url) + ':' + (d.lineNumber + 1) + ')' : ''));
    } else if (m === 'Runtime.consoleAPICalled') {
      const t = clip((p.args || []).map((x) => (x.value !== undefined ? x.value : x.description || '')).join(' '));
      if (p.type === 'error' || p.type === 'assert') add(st.errors, 'console.' + p.type + ': ' + t);
      else if (p.type === 'warning') add(st.warnings, 'console.warn: ' + t);
    } else if (m === 'Log.entryAdded') {
      const e = p.entry || {};
      if (e.level === 'error' && e.source !== 'network') add(st.errors, 'browser: ' + clip(e.text) + (e.url ? ' (' + short(e.url) + ')' : ''));
    } else if (m === 'Network.requestWillBeSent') st.inflight.set(p.requestId, p.request.url);
    else if (m === 'Network.loadingFinished') st.inflight.delete(p.requestId);
    else if (m === 'Network.loadingFailed') {
      // طلب ما شفنا بدايته = طلب داخلي من المتصفح نفسه (مو من الصفحة)، نتجاهله
      const u = st.inflight.get(p.requestId); st.inflight.delete(p.requestId);
      if (u && !p.canceled && !st.blocked.has(u)) add(st.errors, 'request failed: ' + short(u) + ' (' + p.errorText + ')');
    } else if (m === 'Network.responseReceived') {
      const r = p.response || {};
      if (p.type === 'Document') st.docStatus = r.status;
      if (r.status >= 400 && !/\/favicon\.ico$/.test(r.url)) add(st.errors, 'HTTP ' + r.status + ': ' + short(r.url));
    }
  });
  st.finish = () => { for (const u of st.blocked) add(st.errors, 'blocked request outside the project: ' + u + (allowNet ? '' : ' (use --allow-net only if this is intended)')); };
  return st;
}
async function setView(cdp, w, h) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: Math.ceil(w), height: Math.ceil(h), deviceScaleFactor: 1, mobile: false, screenWidth: Math.ceil(w), screenHeight: Math.ceil(h) });
}
async function openPage(cdp, st, url, opt) {
  st.docStatus = null;
  await setView(cdp, VIEW_W, VIEW_H);   // التحميل في نافذة سطح مكتب عادية
  const loaded = cdp.waitFor('Page.loadEventFired', opt.timeout);
  const nav = await cdp.send('Page.navigate', { url });
  if (nav.errorText) { loaded.catch(() => {}); throw new Error('page did not open: ' + nav.errorText); }
  await loaded;
  if (st.docStatus >= 400) throw new Error('page not found (HTTP ' + st.docStatus + ')');
  let ready = null;
  for (let k = 0; k < 3; k++) {
    ready = await evalIn(cdp, pageReady, { sel: opt.selector, quiet: 300, timeout: opt.timeout }, opt.timeout + 15000);
    for (let t = Date.now(); st.inflight.size && Date.now() - t < 5000; ) await sleep(50);
    if (!st.inflight.size) break;
  }
  if (st.inflight.size) st.warnings.push('requests still open after waiting: ' + [...st.inflight.values()].join(', '));
  if (opt.wait) await sleep(opt.wait);
  await setView(cdp, MEASURE_W, VIEW_H); await evalIn(cdp, nextFrame);   // القياس بالمقاس الطبيعي للأوراق
  const info = await evalIn(cdp, pageInfo, { sel: opt.selector });
  return { ready, info };
}
// الخطوط الفعلية اللي انرسم فيها النص داخل الأوراق: لو حرف ناقص في خط الهوية، كروم يرسمه بخط النظام (fallback)
async function platformFonts(cdp, sel) {
  const agg = new Map();
  try {
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `${sel}, ${sel} *` });
    for (const nodeId of nodeIds) {
      let r; try { r = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); } catch (e) { continue; }
      for (const f of r.fonts || []) {
        const k = f.familyName + '|' + !!f.isCustomFont, e = agg.get(k) || { family: f.familyName, custom: !!f.isCustomFont, glyphs: 0 };
        e.glyphs += f.glyphCount; agg.set(k, e);
      }
    }
  } catch (e) { return { error: e.message, fonts: [] }; }
  finally { await cdp.send('CSS.disable').catch(() => {}); await cdp.send('DOM.disable').catch(() => {}); }
  return { fonts: [...agg.values()] };
}

// ---------------------------------------------------------------- التصدير
// boxes: صناديق القص والنزف من القالب (بالمليمتر من حواف الصفحة) أو null = الصفحة كلها
async function exportPdf(cdp, size, sheetCount, opt, file, report, boxes) {
  const r = await cdp.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, landscape: false, scale: 1,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, paperWidth: size.w / 25.4, paperHeight: size.h / 25.4 }, 180000);
  let buf = Buffer.from(r.data, 'base64');
  const rec = { kind: 'pdf', file: relPath(file), want: [r2(size.w), r2(size.h)], ok: false, checks: [] };
  try { rec.chromeMM = pdfInfo(buf).pages.map((p) => boxMM(p.media)); } catch (e) { rec.chromeMM = null; }
  rec.sizeFixed = false;
  if (opt.pdfFix) {
    try {
      const pt = (a) => (a ? a.map(mmToPt) : null);
      const f = fixPdf(buf, { w: mmToPt(size.w), h: mmToPt(size.h) }, boxes ? { trim: pt(boxes.trim), bleed: pt(boxes.bleed) } : null);
      buf = f.buf; rec.sizeFixed = f.fixed > 0; for (const n of f.notes) report.warnings.push('PDF: ' + n);
    } catch (e) { report.warnings.push('PDF page size not corrected (' + e.message + '); Chrome\'s rounded size kept'); }
  }
  fs.writeFileSync(file, buf);
  // الفحص من الملف نفسه بعد الكتابة
  const v = pdfInfo(fs.readFileSync(file));
  const tol = rec.sizeFixed ? 0.01 : 0.3;
  rec.bytes = fs.statSync(file).size; rec.version = v.version; rec.pages = v.pages.length; rec.pageMM = v.pages.map((p) => boxMM(p.media));
  rec.trimMM = v.pages.map((p) => (p.trim ? boxMM(p.trim) : null));
  rec.fonts = v.fonts; rec.fontFiles = v.fontFiles; rec.type3BitmapFonts = v.type3BitmapFonts; rec.images = v.images; rec.producer = v.producer; rec.tagged = v.tagged;
  const okSize = v.pages.length > 0 && v.pages.every((p) => { const m = boxMM(p.media); return Math.abs(m[0] - size.w) <= tol && Math.abs(m[1] - size.h) <= tol; });
  rec.checks.push((okSize ? 'ok' : 'FAIL') + ` page size ${rec.pageMM.map((m) => m.join(' x ')).join(', ')} mm (want ${rec.want.join(' x ')} mm, tolerance ${tol} mm)`);
  rec.bleedBoxMM = v.pages.map((p) => (p.bleed ? boxMM(p.bleed) : null));
  if (opt.bleed && !rec.sizeFixed) { rec.checks.push('FAIL no TrimBox: the page box was not corrected (see warnings or drop --no-pdf-fix)'); rec.ok = false; }
  else if (opt.bleed && boxes) {
    const want = [r2(size.w - boxes.trim[0] - boxes.trim[2]), r2(size.h - boxes.trim[1] - boxes.trim[3])];
    const okTrim = rec.trimMM.every((t) => t && Math.abs(t[0] - want[0]) <= 0.01 && Math.abs(t[1] - want[1]) <= 0.01);
    rec.checks.push((okTrim ? 'ok' : 'FAIL') + ` TrimBox ${rec.trimMM.map((t) => (t ? t.join(' x ') : 'none')).join(', ')} mm (want ${want.join(' x ')} mm, the trim size); BleedBox ${rec.bleedBoxMM.map((t) => (t ? t.join(' x ') : 'none')).join(', ')} mm`);
    rec.ok = okSize && okTrim;
  } else rec.ok = okSize;
  if (v.pages.length > Math.max(1, sheetCount)) report.warnings.push(`PDF has ${v.pages.length} pages for ${sheetCount} sheets: check for a blank page (content taller than @page)`);
  if (v.type3BitmapFonts) report.warnings.push(`PDF: ${v.type3BitmapFonts} Type3 font(s) with bitmap glyphs (text will not be sharp)`);
  report.files.push(rec);
  return rec;
}
async function shoot(cdp, x, y, w, h, scale) {
  await evalIn(cdp, nextFrame);
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale }, captureBeyondViewport: false, fromSurface: true }, 180000);
  return decodePNG(Buffer.from(r.data, 'base64'));
}
async function exportPngs(cdp, sheets, opt, outDir, baseName, suffix, report) {
  if (opt.transparent) await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  // كل وسيط (screen أو print) مرة وحدة، وتحته الدقات اللي تبيه
  for (const media of ['screen', 'print']) {
    const scales = opt.png.filter((s) => s.media === media);
    if (!scales.length) continue;
    await cdp.send('Emulation.setEmulatedMedia', { media, features: FEATURES });
    await evalIn(cdp, injectCss, { css: captureCss(opt.selector), clear: opt.transparent });
    // المقاس بهالوسيط في نافذة عريضة، مرتين بعرضين: الورقة لازم مقاسها ثابت (mm أو px)، مو يتبع النافذة
    await setView(cdp, MEASURE_W, VIEW_H);
    const sizes = await evalIn(cdp, measureSheets, { sel: opt.selector });
    await setView(cdp, MEASURE_W + 64, VIEW_H + 64);
    const sizesB = await evalIn(cdp, measureSheets, { sel: opt.selector });
    const todo = [];
    for (const s of sheets.filter((x) => x.selected)) {
      const a = sizes[s.i], b = sizesB[s.i];
      if (!a || a.w < 1 || a.h < 1) report.warnings.push(`${s.name}: zero size in ${media} media, skipped`);
      else if (Math.abs(a.w - b.w) > 0.01 || Math.abs(a.h - b.h) > 0.01) {
        const msg = `${s.name}: its size follows the browser window (${r2(a.w)} x ${r2(a.h)} CSS px, then ${r2(b.w)} x ${r2(b.h)} in a wider window), so it is not a fixed-size sheet; give it an explicit width and height (and flex: none inside a flex row). Not exported`;
        if (!report.errors.includes(msg)) report.errors.push(msg);
      } else todo.push(s);
    }
    if (!todo.length) { report.errors.push(`no sheet to capture in ${media} media`); continue; }
    for (const sh of todo) {
      const sz = sizes[sh.i];
      // نثبّت الورقة بمقاسها الطبيعي (النافذة العريضة)، وبعدين نافذة التصوير على قدها بس (أخف على الذاكرة في 300dpi)
      await setView(cdp, MEASURE_W, Math.max(VIEW_H, Math.ceil(sz.h) + 4));
      const solo = await evalIn(cdp, soloOn, { sel: opt.selector, i: sh.i });
      let mode = 'solo';
      const capW = Math.max(VIEW_W, Math.ceil(sz.w) + 4), capH = Math.max(VIEW_H, Math.ceil(sz.h) + 4);
      if (solo.error || Math.abs(solo.x) > 0.01 || Math.abs(solo.y) > 0.01 || solo.delta > 0.1) {
        await evalIn(cdp, soloOff);
        report.warnings.push(`${sh.name} (${media}): sheet could not be isolated (${solo.error || 'layout moved ' + r2(solo.delta) + ' px'}); captured in place, edges may be softer`);
        mode = 'in-place';
      } else {
        await setView(cdp, capW, capH);
        const chk = await evalIn(cdp, soloCheck);
        if (chk.delta > 0.1 || Math.abs(chk.x) > 0.01 || Math.abs(chk.y) > 0.01) {
          await setView(cdp, MEASURE_W, capH);   // الورقة تتغير في النافذة الأضيق: نصوّرها في العريضة
          report.warnings.push(`${sh.name} (${media}): the sheet changes in a ${capW} px window, captured in a ${MEASURE_W} px window`);
        }
      }
      for (const sc of scales) {
        const pre = opt.signNames ? '' : baseName + '-';
        const file = path.join(outDir, opt.file ? opt.file : opt.social ? `${pre}${sh.name}.png` : `${pre}${sh.name}${suffix}@${sc.label}.png`);
        const rec = { kind: 'png', file: relPath(file), sheet: sh.name, scale: sc.label, media, mode, ok: false, checks: [] };
        report.files.push(rec);
        try {
          let w, h, img, sx = 0, sy = 0;
          if (mode === 'solo') {
            // الورقة في (0,0): نصوّر أكبر منها ببكسل، ونقص بالضبط على مقاسها (كروم يقرّب القص لبكسل CSS كامل)
            w = solo.w; h = solo.h;
            img = await shoot(cdp, 0, 0, Math.ceil(w) + 1, Math.ceil(h) + 1, sc.scale);
          } else {
            // في مكانها: النافذة بقد الصفحة كلها (بدون تمرير)، ونقص الورقة من الصورة
            await setView(cdp, MEASURE_W, VIEW_H);
            const r = await evalIn(cdp, rectOf, { sel: opt.selector, i: sh.i });
            const vw = Math.max(MEASURE_W, r.docW), vh = Math.max(VIEW_H, r.docH);
            if (vw * vh * sc.scale * sc.scale > 120e6) throw new Error(`page too big to capture this sheet in place at ${sc.label}; make the sheet isolatable (fixed size, no transform on its parents)`);
            await setView(cdp, vw, vh);
            const rr = await evalIn(cdp, rectOf, { sel: opt.selector, i: sh.i });
            w = rr.w; h = rr.h;
            const x0 = Math.floor(rr.x), y0 = Math.floor(rr.y);
            img = await shoot(cdp, x0, y0, Math.ceil(rr.x + w) - x0 + 1, Math.ceil(rr.y + h) - y0 + 1, sc.scale);
            sx = Math.round((rr.x - x0) * sc.scale); sy = Math.round((rr.y - y0) * sc.scale);
          }
          rec.cssPx = [r2(w), r2(h)]; rec.mm = [r2(pxToMM(w)), r2(pxToMM(h))];
          if (opt.social && (Math.abs(w - Math.round(w)) > 0.01 || Math.abs(h - Math.round(h)) > 0.01)) throw new Error(`social sheet is ${r2(w)} x ${r2(h)} CSS px; size it in whole px (e.g. width:1080px)`);
          const expW = Math.round(w * sc.scale), expH = Math.round(h * sc.scale);
          if (expW > 16384 || expH > 16384) throw new Error(`too big for one image: ${expW} x ${expH} px`);
          rec.expected = [expW, expH];
          let out = cropImg(img, sx, sy, expW, expH);
          if (opt.transparent) { if (out.ch !== 4) throw new Error('the browser returned no alpha channel'); }
          else if (out.ch === 4) { const f = toRGB(out); out = f.img; if (f.semi) report.warnings.push(`${sh.name}@${sc.label}: ${f.semi} semi-transparent pixels flattened on white`); }
          if (isBlank(out)) throw new Error('blank image (one flat colour): the sheet did not render');
          fs.writeFileSync(file, encodePNG(out, sc.dpi));
          // الفحص من الملف نفسه
          const v = decodePNG(fs.readFileSync(file));
          rec.px = [v.w, v.h]; rec.channels = v.ch === 4 ? 'RGBA' : 'RGB'; rec.dpi = v.dpi; rec.bytes = fs.statSync(file).size;
          const okSize = v.w === expW && v.h === expH;
          rec.checks.push((okSize ? 'ok' : 'FAIL') + ` ${v.w} x ${v.h} px = ${rec.cssPx.join(' x ')} CSS px x ${r2(sc.scale)}` + (opt.social ? '' : ` (${rec.mm.join(' x ')} mm at ${sc.dpi} dpi, ${media} media)`));
          let okAlpha = true;
          if (opt.transparent) {
            rec.alpha = alphaStats(v); okAlpha = v.ch === 4;
            rec.checks.push((okAlpha ? 'ok' : 'FAIL') + ` alpha channel; corners alpha ${rec.alpha.corners.join(',')}; fully transparent ${rec.alpha.clearPct}%`);
          } else { okAlpha = v.ch === 3; rec.checks.push((okAlpha ? 'ok' : 'FAIL') + ' opaque RGB, no alpha'); }
          const okDpi = sc.dpi ? Math.abs(v.dpi - sc.dpi) < 0.5 : true;
          if (sc.dpi) rec.checks.push((okDpi ? 'ok' : 'FAIL') + ` pHYs ${v.dpi} dpi`);
          rec.ok = okSize && okAlpha && okDpi;
        } catch (e) { rec.error = e.message; rec.checks.push('FAIL ' + e.message); }
      }
      if (mode === 'solo') await evalIn(cdp, soloOff);
    }
  }
}

// ---------------------------------------------------------------- التشغيل
function printSummary(report, manifestFile) {
  const L = [];
  L.push('export:  ' + report.url);
  if (report.browser) L.push('browser: ' + report.browser);
  if (report.page) {
    const p = report.page;
    const size = (s) => (report.options.social ? `${s.cssPx.join('x')}px` : `${s.mm.join('x')}mm`);
    L.push(`page:    @page ${p.cssSize || '(none)'}${p.mm ? ` = ${p.mm.join(' x ')} mm` : ''} | ${p.sheets.length} sheet(s) ${p.sheets.map((s) => `${s.name} ${size(s)}`).join(', ')} | ready in ${p.readyMs} ms${p.readySignal ? ' (data-ready=' + p.readySignal + ')' : ''}`);
    if (report.options.bleed) {
      const s0 = p.sheets.find((s) => s.trimMM) || {};
      L.push(`bleed:   ${report.options.bleedParam} | page without it ${p.withoutBleedMM ? p.withoutBleedMM.join(' x ') + ' mm' : '?'} | trim ${s0.trimMM ? s0.trimMM.join(' x ') : '?'} mm at ${s0.trimInsetMM ? s0.trimInsetMM.join('/') : '?'} mm from the edges (l/t/r/b) | bleed ${s0.bleedMM ? s0.bleedMM.join('/') : '?'} mm`);
    }
  }
  if (report.fonts) L.push('fonts:   ' + (report.fonts.faces.map((f) => `${f.family} ${f.weight} ${f.status}`).join(' | ') || 'no web fonts') +
    (report.fonts.drawn && report.fonts.drawn.length ? ' | drawn with: ' + report.fonts.drawn.map((f) => `${f.family}${f.custom ? '' : ' (system)'} ${f.glyphs} glyphs`).join(', ') : ''));
  if (report.templateWarnings && report.templateWarnings.length) { L.push(`template warnings (${report.templateWarnings.length}):`); for (const w of report.templateWarnings) L.push('  - ' + w); }
  for (const f of report.files) {
    if (f.kind === 'pdf') {
      L.push(`PDF  ${f.file}  ${f.pages} page(s)${f.chromeMM ? `  (the browser made ${f.chromeMM.map((m) => m.join(' x ')).join(', ')} mm${f.sizeFixed ? ', corrected' : ''})` : ''}`);
      L.push(`     fonts ${JSON.stringify(f.fonts)} embedded files ${f.fontFiles}, raster images ${f.images.length}${f.images.length ? ' ' + JSON.stringify(f.images) : ''}, ${f.bytes} bytes`);
    } else L.push(`PNG  ${f.file}  ${f.px ? f.px.join(' x ') + ' ' + f.channels : ''}${f.mode === 'in-place' ? ' (in place)' : ''}`);
    for (const c of f.checks) L.push('     ' + c);
  }
  for (const w of report.warnings) L.push('warning: ' + w);
  for (const e of report.errors) L.push('ERROR: ' + e);
  const failed = report.errors.length || report.files.some((f) => !f.ok);
  L.push(`result:  ${failed ? 'FAILED' : 'OK'} (${report.options.check ? 'check only, nothing exported' : `${report.files.filter((f) => f.ok).length}/${report.files.length} files passed${report.exported === false ? ', nothing exported' : ''}`})` + (manifestFile ? ' | manifest ' + relPath(manifestFile) : ''));
  console.log(L.join('\n'));
  return failed ? 1 : 0;
}
async function main() {
  let opt, target;
  try { opt = parseArgs(process.argv.slice(2)); if (opt.help) { console.log(USAGE); return 0; } target = resolveTarget(opt.url); }
  catch (e) { console.error('error: ' + e.message + (e.usage ? '\n\n' + USAGE : '')); return 2; }
  if (typeof WebSocket !== 'function' || typeof fetch !== 'function') { console.error('error: needs Node 22 or newer (built-in fetch and WebSocket)'); return 2; }
  for (const [k, v] of opt.params) target.query.set(k, v);
  const exe = findBrowser(opt.browser);
  if (!exe) { console.error('error: no Chrome or Edge found' + (opt.browser ? ' at ' + opt.browser : '') + '; pass --browser <path to chrome.exe or msedge.exe>'); return 2; }
  const baseName = opt.name || defaultName(target), suffix = opt.bleed ? '-bleed' : '';
  const outDir = opt.out ? path.resolve(opt.out) : null;
  if (outDir) fs.mkdirSync(outDir, { recursive: true });
  const q0 = target.query.toString();
  const report = { tool: 'print/export.cjs', date: new Date().toISOString(), node: process.version, url: target.path.slice(1) + (q0 ? '?' + q0 : ''),
    options: { check: !!opt.check, pdf: opt.pdf, png: opt.png ? opt.png.map((s) => s.label + ' (' + s.media + ')') : null, file: opt.file, transparent: opt.transparent, social: opt.social, bleed: opt.bleed,
      bleedParam: opt.bleed ? opt.bleedParam.join('=') : undefined, selector: opt.selector, only: opt.only, pdfFix: opt.pdf ? opt.pdfFix : undefined },
    errors: [], warnings: [], files: [] };
  const server = await startServer(ROOT);
  let br = null, stopping = null;
  const stop = () => stopping || (stopping = (async () => { if (br) await closeBrowser(br); await new Promise((r) => server.srv.close(() => r())); })());
  const onSignal = () => { stop().then(() => process.exit(130)); };
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
  try {
    br = await launchBrowser(exe);
    report.browser = br.version + ' (' + (/msedge/i.test(exe) ? 'Edge' : 'Chrome') + ')';
    const cdp = br.page, st = watchPage(cdp, server.origin, opt.allowNet);
    // بدون كاش أصلاً: البروفايل جديد كل مرة، والسيرفر يرسل no-store
    await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable'].map((m) => cdp.send(m)));
    if (!opt.allowNet) await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await setView(cdp, VIEW_W, VIEW_H);
    await cdp.send('Emulation.setEmulatedMedia', { media: '', features: FEATURES });
    const urlFor = (bleed) => { const q = new URLSearchParams(target.query); if (bleed) q.set(opt.bleedParam[0], opt.bleedParam[1]); const s = q.toString(); return server.origin + target.path + (s ? '?' + s : ''); };
    // وضع المطبعة: نفتح الصفحة بدونه أول (مقاس القص الحقيقي)، وبعدين معه
    let trimSize = null;
    if (opt.bleed) { const t = await openPage(cdp, st, urlFor(false), opt); trimSize = parseCssPageSize(t.info.pageSize); }
    const { ready, info } = await openPage(cdp, st, urlFor(opt.bleed), opt);
    if (opt.bleed) report.url = urlFor(true).slice(server.origin.length + 1);
    const size = parseCssPageSize(info.pageSize);
    const insets = (s, b) => (b ? [b.x, b.y, s.w - b.x - b.w, s.h - b.y - b.h].map(pxToMM) : null);   // [يسار، فوق، يمين، تحت] بالمليمتر
    // أسماء الأوراق: data-sign (حروف لاتينية) أو id، وإلا sheet-1، sheet-2...
    const used = new Map();
    const sheets = info.sheets.map((s) => {
      let name = slug(s.sign);
      if (s.sign && !name) report.warnings.push(`sheet ${s.i + 1}: data-sign "${s.sign}" has no Latin letters; named sheet-${s.i + 1}`);
      if (!name) name = 'sheet-' + (s.i + 1);
      const n = (used.get(name) || 0) + 1; used.set(name, n); if (n > 1) name += '-' + n;
      return Object.assign({}, s, { name, selected: s.shown && (!opt.only || opt.only.includes(name)), trimIn: insets(s, s.trim), artIn: insets(s, s.art) });
    });
    report.page = { title: info.title, lang: info.lang, dir: info.dir, cssSize: info.pageSize || null, mm: size ? [r2(size.w), r2(size.h)] : null,
      withoutBleedMM: trimSize ? [r2(trimSize.w), r2(trimSize.h)] : undefined, readyMs: ready.ms, readySignal: ready.signal, readyNotes: ready.notes,
      sheets: sheets.map((s) => ({ name: s.name, sign: s.sign || null, mm: [r2(pxToMM(s.w)), r2(pxToMM(s.h))], cssPx: [r2(s.w), r2(s.h)], radius: s.radius,
        trimMM: s.trim ? [r2(pxToMM(s.trim.w)), r2(pxToMM(s.trim.h))] : undefined, trimInsetMM: s.trimIn ? s.trimIn.map(r2) : undefined,
        bleedMM: s.trimIn && s.artIn ? s.trimIn.map((v, k) => r2(v - s.artIn[k])) : undefined })) };
    report.templateWarnings = info.warnings;
    if (info.report) report.templateReport = info.report;
    for (const n of ready.notes) report.warnings.push('page: ' + n);
    for (const s of sheets) if (!s.shown) report.warnings.push(`${s.name}: hidden or zero size, skipped`);
    if (opt.only) for (const n of opt.only) if (!sheets.some((s) => s.name === n)) report.errors.push(`--only: no sheet named "${n}" (sheets: ${sheets.map((s) => s.name).join(', ')})`);
    // الخطوط: لازم تنزل، والنص ما ينرسم بخط النظام
    const drawn = await platformFonts(cdp, opt.selector);
    report.fonts = { faces: info.fonts, drawn: drawn.fonts };
    for (const f of info.fonts) if (f.status === 'error') report.errors.push(`font failed to load: ${f.family} ${f.weight}`);
    for (const f of drawn.fonts) if (!f.custom && f.glyphs > 0) report.warnings.push(`${f.glyphs} glyph(s) drawn with the system font "${f.family}", not the template font (a character missing from the font file?)`);
    if (drawn.error) report.warnings.push('could not read the fonts used: ' + drawn.error);
    if (opt.png && !sheets.some((s) => s.selected)) report.errors.push(`no sheets to capture (selector ${opt.selector})`);
    if (opt.file) {
      const sel = sheets.filter((s) => s.selected);
      if (sel.length > 1) report.errors.push(`--file ${opt.file} names one PNG, but ${sel.length} sheets are selected (${sel.map((s) => s.name).join(', ')}): pick one with the template parameter (e.g. sign=wifi) or --only <sheet>`);
    }
    if (opt.pdf && !size) report.errors.push('the page has no @page size, so the PDF size is unknown (the template must set @page { size: W H })');
    // وضع المطبعة: الصفحة كبرت، وصندوق القص = مقاس الصفحة بدون نزف، وفي النص بالضبط (علامات القص حوله)، والنزف يغطيه
    const bp = opt.bleedParam.join('=');
    if (opt.bleed) {
      if (!trimSize || !size) report.errors.push('bleed mode: the page has no @page size ' + (trimSize ? 'with' : 'without') + ' ' + bp);
      else if (!(size.w > trimSize.w + 0.5 && size.h > trimSize.h + 0.5)) report.errors.push(`bleed mode not applied: with ${bp} the page is ${r2(size.w)} x ${r2(size.h)} mm, without it ${r2(trimSize.w)} x ${r2(trimSize.h)} mm (does the template read "${opt.bleedParam[0]}"?)`);
      for (const s of sheets.filter((x) => x.selected || (opt.pdf && x.shown))) {
        if (!s.trim) { report.errors.push(`${s.name}: no trim box in bleed mode (the template marks it with .s-trim or [data-trim])`); continue; }
        const tw = pxToMM(s.trim.w), th = pxToMM(s.trim.h), [l, t, r, b] = s.trimIn;
        if (trimSize && (Math.abs(tw - trimSize.w) > 0.05 || Math.abs(th - trimSize.h) > 0.05)) report.errors.push(`${s.name}: trim box ${r2(tw)} x ${r2(th)} mm is not the page size without bleed (${r2(trimSize.w)} x ${r2(trimSize.h)} mm)`);
        if (Math.abs(l - r) > 0.05 || Math.abs(t - b) > 0.05) report.errors.push(`${s.name}: trim box is not centred on the sheet (left ${r2(l)}, right ${r2(r)}, top ${r2(t)}, bottom ${r2(b)} mm), so the crop marks and the bleed do not line up with the trim`);
        if (!s.artIn) report.warnings.push(`${s.name}: no bleed box (.s-art or [data-bleed-box]); PDF BleedBox = whole page`);
        else {
          const bl = s.trimIn.map((v, k) => v - s.artIn[k]);
          if (bl.some((v) => v < -0.05)) report.errors.push(`${s.name}: the bleed box does not cover the trim box (bleed ${bl.map(r2).join('/')} mm left/top/right/bottom)`);
          else if (Math.max(...bl) - Math.min(...bl) > 0.05) report.warnings.push(`${s.name}: bleed is not the same on all sides: ${bl.map(r2).join('/')} mm (left/top/right/bottom)`);
        }
      }
    }
    // صناديق PDF من القالب نفسه: لو كل الأوراق بنفس الشكل وكل ورقة = صفحة
    let boxes = null;
    const withTrim = sheets.filter((s) => s.shown && s.trim);
    if (opt.pdf && size && withTrim.length) {
      const f = withTrim[0];
      const same = withTrim.every((s) => Math.abs(s.w - f.w) < 0.4 && Math.abs(s.h - f.h) < 0.4 && s.trimIn.every((v, k) => Math.abs(v - f.trimIn[k]) <= 0.05));
      const fills = Math.abs(pxToMM(f.w) - size.w) <= 0.1 && Math.abs(pxToMM(f.h) - size.h) <= 0.1;
      // المتصفح يقرّب الأماكن لـ 1/64 بكسل (حوالي 0.004mm)، فنقرّب لـ 0.01mm. وفي وضع المطبعة، لو القص في النص وبالمقاس الصحيح:
      // الهامش = (الصفحة − الصفحة بدون نزف) ÷ 2 بالضبط
      const round2 = (a) => a.map((v) => Math.round(v * 100) / 100);
      let trim = round2(f.trimIn);
      const centred = Math.abs(f.trimIn[0] - f.trimIn[2]) <= 0.05 && Math.abs(f.trimIn[1] - f.trimIn[3]) <= 0.05;
      if (opt.bleed && trimSize && centred && Math.abs(pxToMM(f.trim.w) - trimSize.w) <= 0.05 && Math.abs(pxToMM(f.trim.h) - trimSize.h) <= 0.05) {
        const ix = (size.w - trimSize.w) / 2, iy = (size.h - trimSize.h) / 2; trim = [ix, iy, ix, iy];
      }
      if (same && fills) boxes = { trim, bleed: f.artIn ? round2(f.artIn.map((v, k) => Math.max(0, Math.min(v, f.trimIn[k])))) : null };
      else if (opt.bleed) report.errors.push('bleed mode: the sheets differ in size or trim position, or a sheet is not the page size, so the PDF TrimBox cannot be set');
    }
    st.finish();
    report.errors.push(...st.errors); report.warnings.push(...st.warnings);
    if (opt.check) report.exported = false;
    else if (report.errors.length && !opt.force) report.exported = false;
    else {
      if (report.errors.length) report.warnings.push('exported despite page errors (--force)');
      if (opt.pdf && size) await exportPdf(cdp, size, sheets.length, opt, path.join(outDir, `${baseName}${suffix}.pdf`), report, boxes);
      if (opt.png && sheets.some((s) => s.selected)) await exportPngs(cdp, sheets, opt, outDir, baseName, suffix, report);
      st.finish();
      for (const e of st.errors) if (!report.errors.includes(e)) report.errors.push(e);
    }
  } catch (e) {
    report.errors.push(e.message);
  } finally {
    await stop();
    if (br && br.profileLeft) report.warnings.push('temporary browser profile not deleted: ' + br.profileLeft);
  }
  let manifest = null;
  if (opt.manifest) { manifest = path.join(outDir, `${baseName}${suffix}.export.json`); fs.writeFileSync(manifest, JSON.stringify(report, null, 2) + '\n', 'utf8'); }
  return printSummary(report, manifest);
}
// لو بقى شي مفتوح (اتصال أو متصفح ما قفل)، نطلع بعد 5 ثواني بنفس النتيجة بدل ما نعلّق
const done = (code) => { process.exitCode = code; setTimeout(() => process.exit(code), 5000).unref(); };
main().then(done, (e) => { console.error('error: ' + ((e && e.stack) || e)); done(1); });
