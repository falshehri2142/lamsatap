// anim-scroll perf: load frame at 390 CPU x4, scroll long tasks at CPU x1 (+ CPU profile top functions). usage: node perf.cjs <port> [path] [prof]
const { chromium } = require('playwright');
const port = process.argv[2] || 8931, only = process.argv[3], prof = process.argv[4];
const init = () => { window.__f = []; let l = performance.now(); const t = n => { window.__f.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); window.__lt = []; new PerformanceObserver(x => x.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); };
async function scrollAll(p) { await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(1500); }
function top(profile) { const self = {}, byId = {}; profile.nodes.forEach(n => byId[n.id] = n); const dt = {}; profile.samples.forEach((s, i) => dt[s] = (dt[s] || 0) + (profile.timeDeltas[i] || 0));
  for (const id in dt) { const n = byId[id], cf = n.callFrame; const k = cf.functionName + ' ' + cf.url.split('/').pop() + ':' + (cf.lineNumber + 1); self[k] = (self[k] || 0) + dt[id] / 1000; }
  return Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => k + ' ' + v.toFixed(0) + 'ms'); }
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of only ? [only] : ['/', '/restaurants/', '/hosts/']) {
    let ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); let p = await ctx.newPage(); let cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await p.addInitScript(init);
    if (prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    const load = await p.evaluate(() => { const f = window.__f.slice(2); return { maxF: Math.round(Math.max(...f)), over33: f.filter(x => x > 33).map(Math.round), lt: window.__lt }; });
    if (prof) { const r = await cdp.send('Profiler.stop'); console.log('LOADPROF', top(r.profile).join(' | ')); }
    await ctx.close();
    const scr = [];
    for (const w of [390, 1440]) { ctx = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } }); p = await ctx.newPage(); cdp = await ctx.newCDPSession(p); await p.addInitScript(init);
      await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => { window.__lt = []; });
      if (prof && w === 390) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); }
      await scrollAll(p); scr.push(w + ':' + JSON.stringify(await p.evaluate(() => window.__lt)));
      if (prof && w === 390) { const r = await cdp.send('Profiler.stop'); console.log('SCROLLPROF', top(r.profile).join(' | ')); }
      await ctx.close(); }
    console.log(path, 'load390x4', JSON.stringify(load), 'scroll x1', scr.join(' '));
  }
  await br.close();
})();
