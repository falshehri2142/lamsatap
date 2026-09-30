// M9 exactly as qa/motion-check.js (1440 -> 1200 jump, 390 hidden, rotate hscroll). usage: node m9.cjs <port>
const { chromium } = require('playwright'); const port = process.argv[2] || 8931;
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of ['/', '/restaurants/', '/hosts/']) { const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(1500);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * .5)); await p.waitForTimeout(400);
    const a = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); window.__a = e; return e ? e.getBoundingClientRect().top : 0; });
    await p.setViewportSize({ width: 1200, height: 900 }); await p.waitForTimeout(800);
    const r1 = await p.evaluate(() => ({ hs: document.documentElement.scrollWidth > innerWidth, top: window.__a ? window.__a.getBoundingClientRect().top : 0 }));
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800);
    const r2 = await p.evaluate(() => ({ hs: document.documentElement.scrollWidth > innerWidth, hid: [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).map(e => e.tagName + '.' + e.className).slice(0, 5) }));
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(800); const r3 = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(path, 'jump', Math.round(r1.top - a), 'hs', r1.hs, r2.hs, r3, 'hid', JSON.stringify(r2.hid), 'errs', errs.length); await ctx.close(); }
  await br.close(); })();
