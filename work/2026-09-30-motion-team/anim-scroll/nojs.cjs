// baseline: max load frame at 390 CPU x4 with GSAP blocked (page cost without motion)
const { chromium } = require('playwright'); const port = process.argv[2] || 8931;
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of ['/', '/restaurants/', '/hosts/']) for (const block of [false, true]) { const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    if (block) await p.route(/vendor\/gsap|motion\.js/, r => r.abort());
    await p.addInitScript(() => { window.__f = []; let l = performance.now(); const t = n => { window.__f.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    console.log(path, block ? 'no-gsap' : 'normal', JSON.stringify(await p.evaluate(() => window.__f.slice(2).filter(x => x > 33).map(Math.round)))); await ctx.close(); }
  await br.close(); })();
