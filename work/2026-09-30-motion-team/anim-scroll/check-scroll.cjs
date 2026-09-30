// anim-scroll: hidden [data-reveal] after full scroll, price opacity during reveal, console errors, resize 1440->1200->390 mid-story
const { chromium } = require('playwright');
const port = process.argv[2] || 8911;
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = [];
  for (const page of ['/', '/restaurants/', '/hosts/']) for (const w of [390, 1440]) for (const mode of ['normal', 'reduce']) {
    const ctx = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(`http://localhost:${port}${page}`, { waitUntil: 'load' }); await p.waitForTimeout(600);
    let minPrice = 1;
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += 120) {
      await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(40);
      const o = await p.evaluate(() => { let m = 1; document.querySelectorAll('[data-total],.s-price,.p-calc-fig,[data-price]').forEach(e => { let n = e; while (n && n.nodeType === 1) { m = Math.min(m, +getComputedStyle(n).opacity); n = n.parentElement; } }); return m; });
      minPrice = Math.min(minPrice, o);
    }
    await p.waitForTimeout(1200);
    const hidden = await p.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-reveal="stagger"]>*,[data-product-reveal],[data-door]')].filter(e => +getComputedStyle(e).opacity < .99 || (e.style.transform && e.style.transform !== 'none' && !/translate\(0px, 0px\)|^$/.test(e.style.transform))).map(e => e.className.toString().slice(0, 40)));
    // stepper during reveal (hosts)
    let step = null;
    if (page === '/hosts/') step = await p.evaluate(async () => { const b = document.querySelector('.p-calc-step[data-step="1"]'), u = document.querySelector('[data-units]'); if (!b || b.offsetParent === null) return 'hidden-stepper'; const a = u.textContent; b.click(); return a + '->' + u.textContent; });
    // resize mid story
    let rs = null;
    if (mode === 'normal' && w === 1440) {
      await p.setViewportSize({ width: 1440, height: 900 });
      const st = await p.evaluate(() => { const s = document.querySelector('#experience,#tap-lab'); const y = s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2; scrollTo(0, y); return y; });
      await p.waitForTimeout(500);
      const m = async () => p.evaluate(() => { const s = document.querySelector('#experience,#tap-lab'); return { y: Math.round(scrollY), top: Math.round(s.getBoundingClientRect().top) }; });
      const a = await m(); rs = [a];
      for (const W of [1200, 390]) { await p.setViewportSize({ width: W, height: W < 768 ? 844 : 900 }); await p.waitForTimeout(900); rs.push(await m()); }
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1500);
      rs.push('hiddenAfterResize=' + await p.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-reveal="stagger"]>*')].filter(e => +getComputedStyle(e).opacity < .99).length));
    }
    out.push({ page, w, mode, errs, minPrice, hidden, step, rs: rs && JSON.stringify(rs) });
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await br.close();
})();
