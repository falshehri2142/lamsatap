// anim-micro (GM-070) states check on the English pages and their /ar/ twins: hover (1440, mouse), active (mouse.down),
// focus-visible (Tab), normal + reduced motion, 390 + 1440. Reads transform / opacity / outline of the element and of its arrow
// (the one-sided part), screenshots each element, then 10 fast clicks on the price switch and the Tap Lab options.
// Same launch as tools/motion-frames.cjs. Read-only.
//   NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-english-site/anim-micro/states.js 8853
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const port = process.argv[2] || 8853, base = 'http://localhost:' + port;
const out = path.join(__dirname, 'states'); fs.mkdirSync(out, { recursive: true });
// [page, [selector, arrow-inside (or '')]]
const HOME = [['.h-nav-action', '.h-arrow'], ['.s-lang', ''], ['.h-pick a', ''], ['.h-doors .s-door', '.h-door-more .h-arrow'], ['.tl__opt', ''], ['.tl__open', '']];
const REST = [['.s-lang', ''], ['.s-head-wa', ''], ['.s-switch-opt', ''], ['.s-q summary', ''], ['.r-lab-link', 'svg']];
const HOST = [['.s-lang', ''], ['.p-calc-step', ''], ['.s-q summary', ''], ['.p-lab-link', 'svg']];
const T = [['/', HOME], ['/ar/', HOME], ['/restaurants/', REST], ['/ar/restaurants/', REST], ['/hosts/', HOST], ['/ar/hosts/', HOST]];
const probe = (el, sub) => {
  const c = getComputedStyle(el), a = sub ? el.querySelector(sub) : null;
  return { t: c.transform, o: c.opacity, ol: c.outlineStyle === 'none' ? 'none' : c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineOffset + ' ' + c.outlineColor,
    tr: c.transitionProperty + ' ' + c.transitionDuration, arrow: a ? getComputedStyle(a).transform : undefined };
};
const tx = (m) => { if (!m || m === 'none') return 0; const v = m.match(/matrix\(([^)]+)\)/); return v ? +v[1].split(',')[4] : 0; };

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = [], errs = [], bad = [];
  for (const rm of ['no-preference', 'reduce']) for (const W of [390, 1440]) {
    const ctx = await br.newContext({ viewport: { width: W, height: 900 }, reducedMotion: rm });
    const pg = await ctx.newPage(); pg.setDefaultTimeout(5000);
    pg.on('pageerror', (e) => errs.push(W + ' ' + rm + ' ' + e.message));
    pg.on('console', (m) => { if (m.type() === 'error') errs.push(W + ' ' + rm + ' ' + m.text()); });
    for (const [url, sels] of T) {
      await pg.goto(base + url, { waitUntil: 'load' }); await pg.waitForTimeout(400);
      const rtl = await pg.evaluate(() => getComputedStyle(document.documentElement).direction === 'rtl');
      await pg.evaluate(() => document.addEventListener('click', (e) => { if (e.target.closest('a')) e.preventDefault(); }, true));
      for (const [sel, sub] of sels) {
        const loc = pg.locator(sel).filter({ visible: true }).first();
        if (!(await loc.count())) { res.push({ url, sel, W, rm, missing: true }); continue; }
        await loc.scrollIntoViewIfNeeded(); await pg.waitForTimeout(700);
        const row = { url, sel, W, rm, rest: await loc.evaluate(probe, sub) };
        if (W === 1440) { await loc.hover(); await pg.waitForTimeout(300); row.hover = await loc.evaluate(probe, sub); }
        const box = await loc.boundingBox();
        await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.down(); await pg.waitForTimeout(200);
        row.active = await loc.evaluate(probe, sub); await pg.mouse.up(); await pg.mouse.move(0, 0); await pg.waitForTimeout(400);
        await loc.evaluate((e) => e.blur()); await loc.focus(); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
        row.focus = await loc.evaluate(probe, sub);
        row.focusIsEl = await loc.evaluate((e) => document.activeElement === e);
        const name = (url.replace(/\W+/g, '_').replace(/^_|_$/g, '') || 'home') + '__' + sel.replace(/\W+/g, '-').replace(/^-|-$/g, '') + '_' + W + '_' + rm + '.png';
        try { await loc.screenshot({ path: path.join(out, name) }); } catch (e) {}
        await loc.evaluate((e) => e.blur());
        // rules: arrow nudge 4px toward reading (normal hover) / none (reduce); element hover lift ≤ 2px; no transform on hover or press in reduce;
        // focus ring 2px offset 3px (summary and nav keep their own ring)
        if (row.hover && sub) {
          const a = tx(row.hover.arrow), want = rm === 'reduce' ? 0 : (rtl ? -4 : 4);
          if (a !== want) bad.push(`${url} ${sel} ${W} ${rm}: arrow on hover ${a}, want ${want}`);
        }
        if (row.hover && row.hover.t !== 'none') { const m = row.hover.t.match(/matrix\(([^)]+)\)/), y = m ? +m[1].split(',')[5] : 0;
          if (rm === 'reduce' || y < -2.01) bad.push(`${url} ${sel} ${W} ${rm}: hover transform ${row.hover.t}`); }
        if (rm === 'reduce' && row.active.t !== 'none') bad.push(`${url} ${sel} ${W} ${rm}: active transform ${row.active.t}`);
        if (row.focusIsEl && row.focus.ol === 'none') bad.push(`${url} ${sel} ${W} ${rm}: no focus ring`);
        res.push(row);
      }
    }
    // 10 fast clicks: price switch (restaurants, both languages) and Tap Lab options (home, both languages)
    for (const url of ['/restaurants/', '/ar/restaurants/']) {
      await pg.goto(base + url); await pg.waitForTimeout(400);
      const sw = pg.locator('.s-switch-opt').filter({ visible: true });
      if (await sw.count() > 1) { await sw.first().scrollIntoViewIfNeeded(); for (let i = 0; i < 10; i++) await sw.nth(i % 2).click({ delay: 0 }); await pg.waitForTimeout(400);
        const st = await pg.evaluate(() => { const s = document.querySelector('.s-switch'); return { on: s.getAttribute('data-on'), checked: [...s.querySelectorAll('[role="radio"]')].map((o) => o.getAttribute('aria-checked')),
          figs: [...document.querySelectorAll('[data-roll]')].map((e) => e.getAttribute('data-now') + '|' + getComputedStyle(e).opacity) }; });
        if (st.on !== '1' || st.checked[1] !== 'true' || st.figs.some((f) => !/\|1$/.test(f))) bad.push(`${url} ${W} ${rm}: price switch after 10 clicks ${JSON.stringify(st)}`);
        res.push({ rapid: 'price', url, W, rm, st }); }
    }
    for (const url of ['/', '/ar/']) {
      await pg.goto(base + url); await pg.waitForTimeout(400);
      const op = pg.locator('.tl__opt');
      if (await op.count() > 1) { await op.first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(800); for (let i = 0; i < 10; i++) await op.nth(i % 3).click({ delay: 0 }); await pg.waitForTimeout(900);
        const st = await pg.evaluate(() => ({ sel: [...document.querySelectorAll('.tl__opt')].map((o) => o.getAttribute('aria-selected')), state: document.querySelector('[data-tl-stage]').getAttribute('data-state'),
          phone: getComputedStyle(document.querySelector('[data-tl-phone]')).transform }));
        if (st.sel[0] !== 'true' || st.state !== 'open' || tx(st.phone) !== 0) bad.push(`${url} ${W} ${rm}: Tap Lab after 10 clicks ${JSON.stringify(st)}`);
        res.push({ rapid: 'taplab', url, W, rm, st }); }
    }
    await ctx.close();
  }
  await br.close();
  fs.writeFileSync(path.join(__dirname, 'states.json'), JSON.stringify({ res, errs, bad }, null, 1));
  console.log('rows', res.length, 'console errors', errs.length, 'rule breaks', bad.length);
  errs.slice(0, 10).forEach((e) => console.log(' ERR', e)); bad.forEach((b) => console.log(' BAD', b));
  process.exit(errs.length || bad.length ? 1 : 0);
})();
