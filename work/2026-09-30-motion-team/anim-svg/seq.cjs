const { chromium } = require('playwright');
const OUT = __dirname + '/shots/', B = 'http://localhost:8913';
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = {}, errs = [];
  for (const [w, rm] of [[1440, 'no-preference'], [390, 'no-preference'], [1440, 'reduce']]) {
    const tag = w + '-' + rm;
    const p = await br.newPage({ viewport: { width: w, height: 900 }, reducedMotion: rm });
    p.on('pageerror', e => errs.push(tag + ' ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(tag + ' ' + m.text()));
    await p.goto(B + '/'); await p.locator('#tap-lab').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
    const r = [];
    for (const k of ['review', 'wifi']) {
      await p.click(`[data-tl-opt=${k}]`);
      const t0 = Date.now();
      for (const ms of [0, 150, 300, 520, 900]) {
        const d = ms - (Date.now() - t0); if (d > 0) await p.waitForTimeout(d);
        const s = await p.evaluate(() => { const q = s => document.querySelector(s); return { st: q('[data-tl-stage]').dataset.state, so: getComputedStyle(q('.tl__frame')).opacity, pt: getComputedStyle(q('.tl__phone')).transform, ro: getComputedStyle(q('.tl__ripple')).opacity }; });
        r.push([k, ms, s]);
        if (w !== 390 || k === 'review') await p.locator('[data-tl-phone]').screenshot({ path: `${OUT}tl-${tag}-${k}-${ms}.png` });
      }
    }
    // 4 clicks in 300ms
    let ripples = 0;
    await p.exposeFunction('rip', () => ripples++);
    await p.evaluate(() => { let last = 0; const el = document.querySelector('.tl__ripple'); (function f() { const o = +getComputedStyle(el).opacity; if (o > .45 && last <= .45) rip(); last = o; if (performance.now() < 1e9) requestAnimationFrame(f); })(); });
    await p.evaluate(() => ['menu', 'review', 'wifi', 'guide'].forEach((k, i) => setTimeout(() => document.querySelector(`[data-tl-opt=${k}]`).click(), i * 100)));
    await p.waitForTimeout(1000);
    const fin = await p.evaluate(() => ({ st: document.querySelector('[data-tl-stage]').dataset.state, sel: document.querySelector('[aria-selected=true]').dataset.tlOpt, src: document.querySelector('[data-tl-frame]').getAttribute('src'), so: getComputedStyle(document.querySelector('.tl__frame')).opacity, pt: getComputedStyle(document.querySelector('.tl__phone')).transform }));
    res[tag] = { seq: r, rapid: { ...fin, ripplePeaks: ripples } };
    // hosts .p-sign
    const h = await br.newPage({ viewport: { width: w, height: 900 }, reducedMotion: rm });
    h.on('pageerror', e => errs.push(tag + ' hosts ' + e.message));
    await h.goto(B + '/hosts/');
    if (!(await h.evaluate(() => !!document.querySelector('script[src*=svg-motion]')))) await h.addScriptTag({ url: B + '/assets/svg-motion.js' });
    const box = await h.evaluate(() => { const r = document.querySelector('.p-sign').getBoundingClientRect(); return r.top + scrollY; });
    await h.evaluate(y => scrollTo(0, y - 500), box);
    const ps = [];
    for (const ms of [0, 300, 600, 900, 1400]) { await h.waitForTimeout(ms ? 300 + (ms === 1400 ? 200 : 0) : 50); ps.push([ms, await h.evaluate(() => ({ st: document.querySelector('.p-sign').dataset.signState, lab: document.querySelector('.p-sign-tap small').textContent }))]); await h.locator('.p-sign').screenshot({ path: `${OUT}sign-${tag}-${ms}.png` }); }
    res[tag].sign = ps;
    await p.close(); await h.close();
  }
  console.log(JSON.stringify(res, null, 1)); console.log('ERRORS', errs);
  await br.close();
})();
