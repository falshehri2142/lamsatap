// anim-micro (GM-070): direction probe for the motion layer. Checks every one-sided motion against the page direction
// (English pages dir="ltr", Arabic pages in /ar/ dir="rtl"). Read-only: it never edits website/.
// Run (server first):  python3 -m http.server 8853 --directory <website>
//   NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-english-site/anim-micro/dir-probe.js --port 8853 [--out <dir>]
// Exit code 1 when any check fails or any console/page error shows up.
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = 'http://localhost:' + arg('port', '8853');
const OUT = path.resolve(arg('out', path.join(__dirname, 'probe')));
const PAGES = arg('pages', '/,/ar/,/restaurants/,/ar/restaurants/,/hosts/,/ar/hosts/').split(',');
const WIDTHS = arg('widths', '390,1440').split(',').map(Number);
const MODES = arg('modes', 'normal,reduce').split(',');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
let fails = 0;
function check(ctx, name, ok, info) {
  results.push(Object.assign({ ok: !!ok, name }, ctx, { info }));
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${ctx.mode.padEnd(6)} ${ctx.page.padEnd(17)} @${String(ctx.w).padEnd(4)} ${name}${info !== undefined ? ' | ' + JSON.stringify(info) : ''}`);
}
const txOf = (m) => { if (!m || m === 'none') return 0; const v = m.match(/matrix\(([^)]+)\)/); return v ? +v[1].split(',')[4] : 0; };

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const mode of MODES) for (const page of PAGES) for (const w of WIDTHS) {
    const ctx = { page, w, mode };
    const bc = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference', hasTouch: false });
    const p = await bc.newPage(), errors = [];
    p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /fail-open/.test(m.text()))) errors.push(m.type() + ': ' + m.text()); });
    await p.goto(BASE + page, { waitUntil: 'networkidle' });
    await p.mouse.move(2, 2);
    await p.waitForTimeout(500);
    const dir = await p.evaluate(() => getComputedStyle(document.documentElement).direction);
    const fwd = dir === 'rtl' ? -1 : 1;   // reading-forward sign on the x axis
    check(ctx, 'dir', page.startsWith('/ar/') ? dir === 'rtl' : dir === 'ltr', dir);

    // 1) arrow nudges on hover: toward the reading direction (normal), none (reduce). Arrow glyph must point the same way.
    const ARROWS = [
      ['.h-nav-action', '.h-arrow'], ['[data-door]', '.h-door-more .h-arrow'], ['.r-lab-link', 'svg'], ['.p-lab-link', 'svg']
    ];
    for (const [hostSel, arrSel] of ARROWS) {
      const host = p.locator(hostSel).first();
      if (!(await host.count()) || !(await host.isVisible())) continue;
      const arrow = host.locator(arrSel).first();
      if (!(await arrow.count()) || !(await arrow.isVisible())) continue;
      await host.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
      const point = await arrow.evaluate((e) => { const pth = e.querySelector('path'); const d = pth ? pth.getAttribute('d') : ''; return d; });
      // glyph direction: the path is drawn on a 24 box; tip side = where the arrow head vertices sit
      const nums = (point.match(/-?\d+(\.\d+)?/g) || []).map(Number);
      await host.hover(); await p.waitForTimeout(400);
      const tx = txOf(await arrow.evaluate((e) => getComputedStyle(e).transform));
      await p.mouse.move(2, 2); await p.waitForTimeout(300);
      if (mode === 'reduce') check(ctx, `nudge ${hostSel} (reduce: none)`, Math.abs(tx) < .01, { tx });
      else check(ctx, `nudge ${hostSel} toward reading`, Math.sign(tx) === fwd, { tx, fwd, d: point.slice(0, 40), nums: nums.length });
    }

    // 2) progress hairlines grow from the reading start
    const LINES = [['[data-how-step]', '::before'], ['.r-story[data-story="editorial"] .r-steps > li', '::after']];
    for (const [sel, pseudo] of LINES) {
      const r = await p.evaluate(([s, ps]) => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e, ps);
        return { origin: cs.transformOrigin, w: e.getBoundingClientRect().width }; }, [sel, pseudo]);
      if (!r) continue;
      const ox = parseFloat(r.origin);
      const start = fwd === 1 ? ox < 1 : Math.abs(ox - r.w) < 2;
      check(ctx, `line ${sel}${pseudo} grows from reading start`, start, r);
    }

    // 3) FAQ plus: the vertical stroke (::before) sits on the minus (::after, end of the row)
    const faq = await p.evaluate(() => {
      const s = document.querySelector('[data-accordion] summary'); if (!s) return null;
      if (!document.documentElement.classList.contains('m')) return { skip: 'no .m' };
      const r = s.getBoundingClientRect(), b = getComputedStyle(s, '::before'), a = getComputedStyle(s, '::after'), cs = getComputedStyle(s);
      const bx = r.left + parseFloat(cs.borderLeftWidth) + parseFloat(b.left);
      const aw = parseFloat(a.width);
      const ax = cs.direction === 'rtl' ? r.left + parseFloat(cs.paddingLeft) : r.right - parseFloat(cs.paddingRight) - aw;
      return { bx: Math.round(bx), ax: Math.round(ax) };
    });
    if (faq && !faq.skip) check(ctx, 'FAQ + stroke on the minus', Math.abs(faq.bx - faq.ax) <= 2, faq);

    // 4) Tap Lab (home): stand on the outer edge (away from the picker), phone nudges toward it, ripple on the stand side,
    //    arrow keys follow dir
    if (await p.locator('[data-tl]').count()) {
      const tl = p.locator('[data-tl]');
      await tl.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
      const geo = await p.evaluate(() => {
        const q = (s) => document.querySelector(s), R = (e) => e && e.getBoundingClientRect();
        const st = q('[data-tl-stand]'), ph = q('[data-tl-phone]'), rp = q('[data-tl-ripple]'), pk = q('.tl__picker');
        const vis = (e) => e && getComputedStyle(e).display !== 'none';
        const c = (r) => r.left + r.width / 2;
        // waves on the stand: drawn bulging to +x; a scaleX(-1) on the path (matrix(-1, …)) turns them to -x
        const wv = st && st.querySelector('path[stroke]'), wr = vis(st) && wv ? wv.getBoundingClientRect() : null;
        const m = wv && getComputedStyle(wv).transform, flip = m && m !== 'none' && /^matrix\(-1/.test(m) ? -1 : 1;
        return { stand: vis(st) ? c(R(st)) : null, phone: c(R(ph)), ripple: vis(rp) ? c(R(rp)) : null, picker: c(R(pk)), waves: wr ? flip : null };
      });
      if (geo.stand != null) {
        const standSide = Math.sign(geo.stand - geo.phone), pickerSide = Math.sign(geo.picker - geo.phone);
        // desktop (picker beside the stage): the stand sits on the side away from the picker, like the Arabic layout
        if (w >= 1024) check(ctx, 'Tap Lab stand on the outer edge', standSide === -pickerSide, geo);
        // the ripple is display:none on the page today (home.css :where(.tl__ripple)); only check it when it shows
        if (geo.ripple != null) check(ctx, 'Tap Lab ripple on the stand side', Math.sign(geo.ripple - geo.phone) === standSide, geo);
        // the drawn arcs bulge to +x; flipped (-1) they bulge to -x. They must bulge toward the phone
        check(ctx, 'Tap Lab stand waves face the phone', geo.waves === -standSide, geo);
        if (mode === 'normal') {
          // pick an option that is not the current one, then sample the phone during the approach (0–240ms)
          const idx = await p.evaluate(() => [].findIndex.call(document.querySelectorAll('[data-tl-opt]'), (b) => b.getAttribute('aria-selected') !== 'true'));
          await p.locator('[data-tl-opt]').nth(idx).click();
          await p.waitForTimeout(160);
          const ptx = txOf(await p.evaluate(() => getComputedStyle(document.querySelector('[data-tl-phone]')).transform));
          check(ctx, 'Tap Lab phone nudges toward the stand', Math.sign(ptx) === standSide, { ptx, standSide });
          await p.waitForTimeout(700);
          const end = await p.evaluate(() => getComputedStyle(document.querySelector('[data-tl-phone]')).transform);
          check(ctx, 'Tap Lab phone rests at 0', txOf(end) === 0, end);
        }
      }
      // keyboard: the key that points forward in the reading direction goes to the next option
      await p.evaluate(() => { const b = document.querySelector('[data-tl-opt]'); b.click(); });
      await p.waitForTimeout(100);
      await p.locator('[data-tl-opt]').first().focus();
      await p.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await p.waitForTimeout(50);
      const sel = await p.evaluate(() => [].findIndex.call(document.querySelectorAll('[data-tl-opt]'), (b) => b.getAttribute('aria-selected') === 'true'));
      check(ctx, 'Tap Lab forward arrow key = next option', sel === 1, { sel });
      // 10 fast clicks across options: final state = last clicked, phone at rest
      const n = await p.locator('[data-tl-opt]').count();
      for (let i = 0; i < 10; i++) await p.locator('[data-tl-opt]').nth(i % n).click({ delay: 0 });
      await p.waitForTimeout(900);
      const fin = await p.evaluate(() => ({ sel: [].findIndex.call(document.querySelectorAll('[data-tl-opt]'), (b) => b.getAttribute('aria-selected') === 'true'),
        state: document.querySelector('[data-tl-stage]').getAttribute('data-state'), tf: getComputedStyle(document.querySelector('[data-tl-phone]')).transform }));
      check(ctx, 'Tap Lab 10 fast clicks settle', fin.sel === (9 % n) && fin.state === 'open' && txOf(fin.tf) === 0, fin);
      await tl.screenshot({ path: path.join(OUT, `tl-${page.replace(/\W+/g, '_')}-${w}-${mode}.png`) });
    }

    // 5) price switch thumb under the checked option
    if (await p.locator('[data-price-switch]').count()) {
      const sw = p.locator('[data-price-switch]').first();
      await sw.scrollIntoViewIfNeeded();
      const opts = sw.locator('[role="radio"]');
      for (let i = 0; i < 10; i++) await opts.nth(i % 2).click({ delay: 0 });
      await opts.nth(1).click(); await p.waitForTimeout(500);
      const t = await p.evaluate(() => { const s = document.querySelector('[data-price-switch]'), th = s.querySelector('.s-switch-thumb'), on = s.querySelector('[aria-checked="true"]');
        if (!th) return null; const a = th.getBoundingClientRect(), b = on.getBoundingClientRect(); return { thumb: Math.round(a.left + a.width / 2), opt: Math.round(b.left + b.width / 2) }; });
      if (t) check(ctx, 'price thumb under the checked option', Math.abs(t.thumb - t.opt) <= 4, t);
    }

    // 6) symbol flight lands on the header symbol (normal, tall screens only)
    if (mode === 'normal') {
      const fl = await p.evaluate(async () => {
        const ST = window.ScrollTrigger; const t = ST && ST.getById('audience-symbol-flight'); if (!t) return null;
        // last pixel before the dock: the clone must sit on the header symbol (scrub: true, so no catch-up lag)
        const y = Math.floor(t.end) - 1; window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 500));
        if (t.progress < .99) return { missing: true, progress: t.progress };
        const fly = document.querySelector('.r-symbol-fly'), dest = document.querySelector('.s-logo-h');
        if (!fly || !dest) return { missing: true };
        const a = fly.getBoundingClientRect(), b = dest.getBoundingClientRect();
        return { vis: getComputedStyle(fly).visibility, fx: Math.round(a.left), fy: Math.round(a.top), fw: Math.round(a.width), dx: Math.round(b.left), dy: Math.round(b.top), dw: Math.round(b.width * 200 / 1068.75) };
      });
      if (fl && !fl.missing) check(ctx, 'symbol flight lands on the header symbol', Math.abs(fl.fx - fl.dx) <= 6 && Math.abs(fl.fy - fl.dy) <= 6 && Math.abs(fl.fw - fl.dw) <= 4, fl);
      else if (fl && fl.missing) check(ctx, 'symbol flight clone', false, fl);
    }

    if (errors.length) check(ctx, 'console', false, errors); else check(ctx, 'console', true);
    await bc.close();
  }
  await br.close();
  fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(results, null, 1));
  console.log(`\n${results.length - fails}/${results.length} ok → ${path.relative(process.cwd(), OUT)}/probe.json`);
  process.exit(fails ? 1 : 0);
})();
