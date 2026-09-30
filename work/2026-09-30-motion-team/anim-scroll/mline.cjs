// M10 subset: .m-line left after full scroll + 5s (per page, 390/1440), and where
const { chromium } = require('playwright'); const port = process.argv[2] || 8931;
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of ['/', '/restaurants/', '/hosts/']) for (const w of [390, 1440]) { const ctx = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); await p.waitForTimeout(5000);
    const r = await p.evaluate(() => ({ lines: [...document.querySelectorAll('.m-line,.m-field')].map(e => (e.parentNode.className || '').toString().split(' ')[0] + '>' + e.className + ' op' + getComputedStyle(e).opacity), run: gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive() && !t.scrollTrigger).length, hidden: [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).length, pins: ScrollTrigger.getAll().filter(s => s.pin).length }));
    console.log(path, w, JSON.stringify(r), errs.join(';')); await ctx.close(); }
  await br.close(); })();
