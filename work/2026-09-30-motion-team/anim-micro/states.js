// anim-micro states check: hover / focus / active per element, normal + reduced, 390 + 1440, plus rapid clicks.
// NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-09-30-motion-team/anim-micro/states.js 8912
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const port = process.argv[2] || 8912, base = 'http://localhost:' + port;
const out = path.join(__dirname, 'states'); fs.mkdirSync(out, { recursive: true });
const T = [
  ['index.html', ['.s-top .lt-btn, .h-nav-action', '.h-pick a', '.h-doors .s-door', '.tl__opt', '.tl__open', '#contact .lt-btn', '.s-nav a']],
  ['restaurants/', ['.s-head-wa', '.s-switch-opt', '.s-q summary', '.r-close .lt-btn, .s-cta', '.r-lab-link']],
  ['hosts/', ['.s-head-wa', '.p-calc-step', '.p-calc-bill label', '.s-q summary', '.p-lab-link']],
];
const probe = (el) => { const c = getComputedStyle(el), r = el.getBoundingClientRect(); return { t: c.transform, o: c.opacity, ol: c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineOffset, tr: c.transitionProperty + ' ' + c.transitionDuration, w: Math.round(r.width), h: Math.round(r.height) }; };
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const res = [], errs = [];
  for (const rm of ['no-preference', 'reduce']) for (const W of [390, 1440]) {
    const ctx = await br.newContext({ viewport: { width: W, height: 900 }, reducedMotion: rm, hasTouch: W === 390 });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(W + ' ' + rm + ' ' + e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push(W + ' ' + rm + ' ' + m.text()); });
    for (const [url, sels] of T) {
      await pg.goto(base + '/' + url, { waitUntil: 'load' }); await pg.waitForTimeout(400);
      await pg.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); }, true));
      for (const sel of sels) {
        const loc = pg.locator(sel).filter({ visible: true }).first(); pg.setDefaultTimeout(5000);
        if (!(await loc.count())) { res.push({ url, sel, W, rm, missing: true }); continue; }
        await loc.scrollIntoViewIfNeeded(); await pg.waitForTimeout(700);
        const row = { url, sel, W, rm, rest: await loc.evaluate(probe) };
        if (W === 1440) { await loc.hover(); await pg.waitForTimeout(250); row.hover = await loc.evaluate(probe); }
        const box = await loc.boundingBox();
        await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.down(); await pg.waitForTimeout(200);
        row.active = await loc.evaluate(probe); await pg.mouse.up(); await pg.mouse.move(0, 0); await pg.waitForTimeout(400);
        await loc.evaluate(e => { e.blur(); }); await loc.focus(); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
        row.focus = await loc.evaluate(probe);
        const name = (url.replace(/\W/g, '') || 'home') + '_' + sel.replace(/\W+/g, '-').slice(0, 30) + '_' + W + '_' + rm + '.png';
        try { await loc.screenshot({ path: path.join(out, name) }); } catch (e) {}
        await pg.keyboard.press('Escape'); await loc.evaluate(e => e.blur());
        res.push(row);
      }
    }
    // rapid clicks: price switch (restaurants) + Tap Lab tabs (home)
    await pg.goto(base + '/restaurants/'); await pg.waitForTimeout(400);
    const sw = pg.locator('.s-switch-opt').filter({ visible: true });
    if (await sw.count() > 1) { await sw.first().scrollIntoViewIfNeeded(); for (let i = 0; i < 10; i++) await sw.nth(i % 2).click({ delay: 0 }); await pg.waitForTimeout(300);
      res.push({ rapid: 'price', W, rm, state: await pg.evaluate(() => { const s = document.querySelector('.s-switch'); const on = s.getAttribute('data-on'); const figs = [...document.querySelectorAll('[data-roll]')].map(e => e.textContent.trim() + '|' + getComputedStyle(e).opacity); return { on, checked: [...s.querySelectorAll('[aria-checked="true"]')].length, figs }; }) }); }
    await pg.goto(base + '/index.html'); await pg.waitForTimeout(400);
    const op = pg.locator('.tl__opt');
    if (await op.count() > 1) { await op.first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(800); for (let i = 0; i < 10; i++) await op.nth(i % 3).click({ delay: 0 }); await pg.waitForTimeout(900);
      res.push({ rapid: 'taplab', W, rm, expect: 0, state: await pg.evaluate(() => [...document.querySelectorAll('.tl__opt')].map(o => o.getAttribute('aria-selected') + '|' + getComputedStyle(o, '::before').opacity + '|' + getComputedStyle(o, '::before').transform)) }); }
    await pg.goto(base + '/hosts/'); await pg.waitForTimeout(400);
    const st = pg.locator('.p-calc-step').filter({ visible: true });
    if (await st.count()) { await st.first().scrollIntoViewIfNeeded(); await pg.waitForTimeout(800); for (let i = 0; i < 10; i++) await pg.locator('[data-step="1"]').click({ delay: 0 }); await pg.waitForTimeout(300);
      res.push({ rapid: 'calc', W, rm, state: await pg.evaluate(() => { const t = document.querySelector('[data-total]'); return [document.querySelector('[data-units]').textContent, t.textContent, getComputedStyle(t).opacity]; }) }); }
    await ctx.close();
  }
  await br.close();
  fs.writeFileSync(path.join(__dirname, 'states.json'), JSON.stringify({ res, errs }, null, 1));
  console.log('rows', res.length, 'errors', errs.length); errs.slice(0, 10).forEach(e => console.log(' ERR', e));
})();
