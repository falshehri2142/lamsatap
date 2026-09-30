// M5 scroll long tasks at 390 (CPU x4 and x1), 3 runs each, + CPU profile top of scroll phase. usage: node scrollperf.cjs <port> [path] [prof]
const { chromium } = require('playwright'); const port = process.argv[2] || 8931, path = process.argv[3] || '/', prof = process.argv[4];
function top(profile) { const self = {}, byId = {}; profile.nodes.forEach(n => byId[n.id] = n); const dt = {}; profile.samples.forEach((s, i) => dt[s] = (dt[s] || 0) + (profile.timeDeltas[i] || 0));
  for (const id in dt) { const cf = byId[id].callFrame; const k = cf.functionName + ' ' + cf.url.split('/').pop() + ':' + (cf.lineNumber + 1); self[k] = (self[k] || 0) + dt[id] / 1000; }
  return Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ' ' + v.toFixed(0) + 'ms'); }
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const rate of [4]) for (let run = 0; run < 12; run++) { const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.addInitScript(() => { window.__lt = []; new PerformanceObserver(x => x.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); });
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => { window.__lt = []; });
    if (prof && run === 0) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
    await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
    const lt = await p.evaluate(() => window.__lt.slice());
    if (prof && run === 0) { const r = await cdp.send('Profiler.stop'); console.log('PROF', top(r.profile).join(' | ')); }
    console.log(path, 'x' + rate, 'run', run, 'max', Math.max(0, ...lt), JSON.stringify(lt)); await ctx.close(); }
  await br.close(); })();
