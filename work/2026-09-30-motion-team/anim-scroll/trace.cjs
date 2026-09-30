// long tasks breakdown via trace. usage: node trace.cjs <port> <path> <w> <cpu> <load|scroll>
const { chromium } = require('playwright'); const fs = require('fs');
const [port, path, W, cpu, phase] = process.argv.slice(2);
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await br.newContext({ viewport: { width: +W, height: +W < 768 ? 844 : 900 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu });
  if (phase === 'load') await br.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
  await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(+(process.env.WAIT || 2000));
  if (phase === 'scroll') { await br.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
    await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(1500); }
  const buf = await br.stopTracing(); const ev = JSON.parse(buf).traceEvents;
  const tasks = ev.filter(e => e.name === 'RunTask' && e.dur > +(process.env.MIN || 40) * 1000);
  for (const t of tasks) { const inside = ev.filter(e => e.tid === t.tid && e.ts >= t.ts && e.ts < t.ts + t.dur && e.dur && e.name !== 'RunTask');
    const agg = {}; inside.forEach(e => { let k = e.name; const d = e.args && e.args.data; if (d && d.url) k += ' ' + d.url.split('/').pop(); if (d && d.functionName) k += ' ' + d.functionName + ':' + d.lineNumber; if (d && d.stackTrace && d.stackTrace[0]) k += ' <' + d.stackTrace[0].functionName + ':' + d.stackTrace[0].lineNumber; agg[k] = (agg[k] || 0) + e.dur / 1000; });
    console.log('TASK', (t.dur / 1000).toFixed(0), Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + '=' + v.toFixed(0)).join(' | ')); }
  await br.close(); })();
