// web-qa probe لقسم #ops (إدارة المطعم). ما يعدّل أي ملف في الموقع؛ التسعير المؤقت بإبدال رد config.js في المتصفح بس.
// التشغيل: NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-restaurant-ops/site/qa/probe.cjs <port>
// المخرجات: qa/results.json وصور qa/*.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PORT = process.argv[2] || 8893, B = `http://127.0.0.1:${PORT}`;
const OUT = __dirname;
const PAGES = { ar: '/ar/restaurants/', en: '/restaurants/' };
const WIDTHS = [320, 390, 768, 1280, 1440];
const FILL = 'restaurantOpsPrices: { order: { s: "249", m: "329", l: "449" }, pro: { s: "349", m: "449", l: "549" }, setup: "499", perTable: "25" },';
const R = { checks: [], data: {} };
const ONLY = (process.env.ONLY || 'widths,price,links,nojs,html').split(',');
const ok = (c, m, d) => { R.checks.push({ pass: !!c, m, d }); console.log((c ? 'PASS ' : 'FAIL ') + m + (d && !c ? ' ' + JSON.stringify(d).slice(0, 400) : '')); };

async function walk(p) {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(40); }
  await p.waitForTimeout(300);
}
function watch(p, bag) {
  p.on('pageerror', (e) => bag.errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') bag.errors.push(m.type() + ': ' + m.text()); });
  p.on('request', (r) => { const u = r.url(); if (!u.startsWith(B) && !u.startsWith('data:') && !u.startsWith('blob:')) bag.external.push(u); });
  p.on('response', (r) => { if (r.status() >= 400) bag.bad.push(r.status() + ' ' + r.url()); });
}

// قياس داخل الصفحة
const MEASURE = () => {
  const vw = document.documentElement.clientWidth, ops = document.getElementById('ops');
  const rgb = (s) => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 1]; };
  const lum = (c) => { const a = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length < 4 || c[3] > 0.5) return c; } return [255, 255, 255, 1]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const out = { vw, sw: document.documentElement.scrollWidth, overflow: [], small: [], contrast: [], imgs: [], wraps: [], clipped: [] };
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const scopeEls = [...ops.querySelectorAll('*')].concat([...document.querySelectorAll('.r-new, .r-new *, .a-section-nav a')]);
  for (const e of scopeEls) {
    if (!vis(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.right > vw + 0.5 || r.left < -0.5) out.overflow.push({ el: e.className || e.tagName, l: Math.round(r.left), r: Math.round(r.right) });
    // نص مقصوص داخل عنصره
    if (e.children.length === 0 && e.textContent.trim() && (e.scrollWidth > e.clientWidth + 1) && getComputedStyle(e).overflow !== 'visible') out.clipped.push({ el: e.className || e.tagName, t: e.textContent.trim().slice(0, 40) });
  }
  // أهداف اللمس
  for (const e of [...ops.querySelectorAll('a, button'), ...document.querySelectorAll('.r-new, .a-section-nav a')]) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect();
    if (r.height < 44 || r.width < 44) out.small.push({ el: (e.className || e.tagName) + ' ' + e.textContent.trim().slice(0, 25), w: Math.round(r.width), h: Math.round(r.height) });
  }
  // تباين النصوص
  const walker = document.createTreeWalker(ops, NodeFilter.SHOW_TEXT);
  const seen = new Set(); let n;
  while ((n = walker.nextNode())) {
    const e = n.parentElement; if (!n.textContent.trim() || seen.has(e) || !vis(e)) continue; seen.add(e);
    const cs = getComputedStyle(e); const fg = rgb(cs.color), th = e.closest('.s-switch-opt[aria-checked="true"]') && e.closest('.s-switch').querySelector('.s-switch-thumb'), bg = th ? rgb(getComputedStyle(th).backgroundColor) : bgOf(e); const cr = ratio(fg, bg); const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    if (cr < (large ? 3 : 4.5)) out.contrast.push({ t: n.textContent.trim().slice(0, 30), cr: +cr.toFixed(2), fs, fg: cs.color, bg: bg.join(',') });
  }
  // الصور: نسبة الإطار مقابل الأصل (object-fit:cover يقص ولا يمط)
  for (const i of ops.querySelectorAll('img')) { const r = i.getBoundingClientRect(); out.imgs.push({ src: i.src.split('/').pop(), nat: i.naturalWidth + 'x' + i.naturalHeight, box: Math.round(r.width) + 'x' + Math.round(r.height), natAR: +(i.naturalWidth / i.naturalHeight).toFixed(3), boxAR: +(r.width / r.height).toFixed(3), fit: getComputedStyle(i).objectFit, loading: i.loading, complete: i.complete }); }
  // أسطر الأزرار والعناوين
  const lines = (e) => { const cs = getComputedStyle(e); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5; const rects = [...e.getClientRects()]; const range = document.createRange(); range.selectNodeContents(e); const rs = [...range.getClientRects()]; const tops = new Set(rs.map((x) => Math.round(x.top))); return tops.size; };
  for (const e of ops.querySelectorAll('.lt-btn > span, .s-switch-opt, .r-ops-wt, .r-ops-st, .s-h2, .s-h3, .r-ops-price, .r-ops-trust > li, .r-ops-more')) { if (!vis(e)) continue; out.wraps.push({ el: e.className || e.tagName, t: e.textContent.trim().slice(0, 40), lines: lines(e) }); }
  const rn = document.querySelector('.r-new'); if (rn) out.wraps.push({ el: 'r-new', t: rn.textContent.trim(), lines: lines(rn) });
  const hrs = [...document.querySelectorAll('.a-section-nav a')]; out.nav = hrs.map((a) => ({ t: a.textContent.trim(), lines: lines(a), h: Math.round(a.getBoundingClientRect().height) }));
  // ترتيب الخيارين (بداية السطر)
  const ways = [...ops.querySelectorAll('.r-ops-way')].map((w) => ({ t: w.querySelector('.r-ops-wt').textContent.trim(), x: Math.round(w.getBoundingClientRect().left), top: Math.round(w.getBoundingClientRect().top) }));
  out.ways = ways;
  out.prev = ops.previousElementSibling && ops.previousElementSibling.id; out.next = ops.nextElementSibling && ops.nextElementSibling.id; out.order = !!document.getElementById('order');
  out.opsBg = getComputedStyle(ops).backgroundColor; out.bodyBg = getComputedStyle(document.body).backgroundColor;
  out.reveal = [...ops.querySelectorAll('[data-reveal]')].map((e) => { const cs = getComputedStyle(e); return { op: cs.opacity, tf: cs.transform }; });
  return out;
};

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const allBag = { errors: [], external: [], bad: [] };
  // 1) المقاسات × اللغات × الأوضاع
  if (ONLY.includes('widths')) for (const [lang, u] of Object.entries(PAGES)) {
    for (const w of WIDTHS) {
      for (const mode of ['normal', 'reduce', 'dark']) {
        if (mode !== 'normal' && ![390, 1280].includes(w)) continue;
        const ctx = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference', colorScheme: mode === 'dark' ? 'dark' : 'light', deviceScaleFactor: w < 768 ? 2 : 1 });
        const p = await ctx.newPage(); const bag = { errors: [], external: [], bad: [] }; watch(p, bag);
        await p.goto(B + u, { waitUntil: 'networkidle' });
        if (mode === 'reduce') { // بدون تمرير: كل شي لازم يكون على حالته النهائية
          await p.evaluate(() => document.getElementById('ops').scrollIntoView()); await p.waitForTimeout(150);
        } else await walk(p);
        const m = await p.evaluate(MEASURE);
        const tag = `${lang} ${w} ${mode}`;
        R.data[tag] = m;
        ok(m.sw <= m.vw, `${tag} no horizontal scroll`, { sw: m.sw, vw: m.vw });
        ok(m.overflow.length === 0, `${tag} nothing past viewport edge`, m.overflow);
        ok(m.small.length === 0, `${tag} touch targets >=44`, m.small);
        ok(m.contrast.length === 0, `${tag} text contrast AA`, m.contrast);
        ok(m.clipped.length === 0, `${tag} no clipped text`, m.clipped);
        ok(m.prev === 'plan' && m.next === 'faq' && !m.order, `${tag} #ops between #plan/#faq and no #order`);
        ok(m.imgs.every((i) => i.complete && i.loading === 'lazy' && i.fit === 'cover'), `${tag} imgs lazy+loaded+cover`, m.imgs);
        if (mode === 'reduce') ok(m.reveal.every((r) => r.op === '1' && (r.tf === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.tf))), `${tag} reveal items final state without scroll`, m.reveal);
        ok(bag.errors.length === 0, `${tag} no console errors/warnings`, bag.errors);
        ok(bag.external.length === 0, `${tag} no external requests`, bag.external);
        ok(bag.bad.length === 0, `${tag} no 4xx/5xx`, bag.bad);
        await p.addStyleTag({ content: '.s-top{visibility:hidden!important}' });
        const shot = `ops-${lang}-${w}${mode === 'normal' ? '' : '-' + mode}.png`;
        await p.locator('#ops').screenshot({ path: path.join(OUT, shot) });
        if (mode === 'normal' && w <= 390) { // أول شاشة من القسم على الجوال (اختبار الخمس ثواني)
          await p.evaluate(() => { const o = document.getElementById('ops'); scrollTo(0, o.getBoundingClientRect().top + scrollY); }); await p.waitForTimeout(400);
          await p.screenshot({ path: path.join(OUT, `fold-${lang}-${w}.png`) });
          await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
          await p.screenshot({ path: path.join(OUT, `hero-${lang}-${w}.png`) });
          const hero = await p.evaluate(() => { const g = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().bottom) : null; }; return { h1: g('h1'), primary: g('.r-hero-demo'), rnew: g('.r-new'), vh: innerHeight }; });
          R.data[`hero ${tag}`] = hero; ok(hero.h1 <= hero.vh && hero.primary <= hero.vh, `${tag} h1+primary above fold`, hero);
        }
        await ctx.close();
      }
    }
  }
  // 2) التسعير: فاضي ثم مؤقت عبر route
  if (ONLY.includes('price')) for (const [lang, u] of Object.entries(PAGES)) {
    for (const priced of [false, true]) {
      for (const w of [390, 1280]) {
        const ctx = await br.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); const bag = { errors: [], external: [], bad: [] }; watch(p, bag);
        if (priced) await p.route('**/config.js*', async (r) => { const res = await r.fetch(); let t = await res.text(); const t2 = t.replace(/restaurantOpsPrices: \{[^\n]*\},/, FILL); if (t2 === t) throw new Error('FILL regex missed'); await r.fulfill({ response: res, body: t2 }); });
        await p.goto(B + u, { waitUntil: 'networkidle' }); await walk(p);
        const read = () => p.evaluate(() => { const q = (s) => document.querySelector(s); return { order: q('[data-ops-price="order"]').textContent.trim(), pro: q('[data-ops-price="pro"]').textContent.trim(), for: q('.r-ops-for').textContent.trim(), forPro: document.querySelectorAll('.r-ops-for')[1].textContent.trim(), unit: [...document.querySelectorAll('[data-ops-unit]')].map((x) => x.hidden), setup: q('[data-ops-setup]').hidden ? null : q('[data-ops-setup]').textContent.replace(/\s+/g, ' ').trim(), priced: [...document.querySelectorAll('[data-ops-card]')].map((c) => c.classList.contains('is-priced')), on: q('#ops [data-price-switch]').getAttribute('data-on'), checked: [...document.querySelectorAll('#ops [role=radio]')].map((b) => b.getAttribute('aria-checked')).join(',') }; });
        const seq = {};
        seq.s = await read();
        for (const v of ['m', 'l', 's']) { await p.locator(`#ops [data-value="${v}"]`).click(); await p.waitForTimeout(350); seq[v + '2'] = await read(); }
        const tag = `${lang} ${w} ${priced ? 'priced' : 'empty'}`;
        R.data[tag] = seq;
        if (!priced) {
          const soon = lang === 'ar' ? 'السعر قريباً' : 'Pricing coming soon';
          ok([seq.s, seq.m2, seq.l2].every((x) => x.order === soon && x.pro === soon && x.setup === null && x.unit.every(Boolean) && !x.priced.some(Boolean)), `${tag} all prices "${soon}", setup+unit hidden in s/m/l`, seq);
          ok(/15/.test(seq.s.for) && /16/.test(seq.m2.for) && /31/.test(seq.l2.for), `${tag} "for" line follows switch`, [seq.s.for, seq.m2.for, seq.l2.for]);
        } else {
          ok(seq.s.order === '249' && seq.s.pro === '349' && seq.m2.order === '329' && seq.m2.pro === '449' && seq.l2.order === '449' && seq.l2.pro === '549' && seq.s2.order === '249', `${tag} switch swaps prices 249/329/449 & 349/449/549`, seq);
          ok(seq.s.setup && /499/.test(seq.s.setup) && /25/.test(seq.s.setup), `${tag} setup line shown`, seq.s.setup);
          ok(seq.s.unit.every((x) => !x) && seq.s.priced.every(Boolean), `${tag} unit visible + is-priced`, seq.s);
          await p.addStyleTag({ content: '.s-top{visibility:hidden!important}' });
          await p.locator('#ops [data-value="m"]').click(); await p.waitForTimeout(400);
          await p.locator('#ops .r-ops-plans').screenshot({ path: path.join(OUT, `priced-${lang}-${w}-m.png`) });
          const mm = await p.evaluate(MEASURE); ok(mm.sw <= mm.vw && mm.overflow.length === 0, `${tag} priced no overflow`, mm.overflow);
          R.data[tag + ' wraps'] = mm.wraps.filter((x) => /price|setup/.test(x.el));
        }
        ok(bag.errors.length === 0 && bag.external.length === 0, `${tag} no errors/external`, bag);
        await ctx.close();
      }
    }
  }
  // 2ب) سعر ناقص (كرت واحد ناقص): الكل أو لا شي
  if (ONLY.includes('price')) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    await p.route('**/config.js*', async (r) => { const res = await r.fetch(); let t = await res.text(); t = t.replace(/restaurantOpsPrices: \{[^\n]*\},/, 'restaurantOpsPrices: { order: { s: "249", m: "", l: "449" }, pro: { s: "349", m: "449", l: "549" }, setup: "499", perTable: "" },'); await r.fulfill({ response: res, body: t }); });
    await p.goto(B + PAGES.ar, { waitUntil: 'networkidle' });
    const x = await p.evaluate(() => ({ o: document.querySelector('[data-ops-price="order"]').textContent.trim(), pr: document.querySelector('[data-ops-price="pro"]').textContent.trim(), setup: document.querySelector('[data-ops-setup]').hidden }));
    ok(x.o === 'السعر قريباً' && x.pr === '349' && x.setup === true, 'ar partial config: order stays coming-soon, pro priced, setup hidden (perTable empty)', x);
    await ctx.close();
  }
  // 3) الروابط والكيبورد
  if (ONLY.includes('links')) for (const [lang, u] of Object.entries(PAGES)) {
    for (const w of [390, 1280]) {
      const ctx = await br.newContext({ viewport: { width: w, height: 844 } }); const p = await ctx.newPage(); const bag = { errors: [], external: [], bad: [] }; watch(p, bag);
      await p.goto(B + u, { waitUntil: 'networkidle' });
      const tag = `${lang} ${w}`;
      // r-new
      await p.locator('.r-new').click(); await p.waitForTimeout(1200);
      const a = await p.evaluate(() => { const o = document.getElementById('ops').getBoundingClientRect(); const top = document.querySelector('.s-top'); const th = top ? top.getBoundingClientRect().bottom : 0; const h2 = document.getElementById('ops-h').getBoundingClientRect(); return { hash: location.hash, opsTop: Math.round(o.top), h2Top: Math.round(h2.top), headerBottom: Math.round(th) }; });
      ok(a.hash === '#ops' && a.h2Top >= a.headerBottom && a.h2Top < innerHeightSafe(w), `${tag} .r-new -> #ops, h2 visible below sticky header`, a);
      // section nav
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
      const navLink = p.locator('.a-section-nav a[href="#ops"]');
      const navVisible = await navLink.isVisible();
      if (navVisible) { await navLink.click(); await p.waitForTimeout(1200); }
      else { await p.evaluate(() => document.querySelector('.a-section-nav a[href="#ops"]').click()); await p.waitForTimeout(1200); }
      const b = await p.evaluate(() => { const top = document.querySelector('.s-top'); return { hash: location.hash, h2Top: Math.round(document.getElementById('ops-h').getBoundingClientRect().top), headerBottom: top ? Math.round(top.getBoundingClientRect().bottom) : 0, isNew: getComputedStyle(document.querySelector('.a-section-nav a[href="#ops"]'), '::after').content }; });
      ok(b.hash === '#ops' && b.h2Top >= b.headerBottom, `${tag} section nav -> #ops (visible=${navVisible})`, b);
      // demo + wa hrefs
      const links = await p.evaluate(() => ({ demo: [...document.querySelectorAll('#ops .r-ops-try a')].map((x) => [x.textContent.trim(), x.href]), wa: (() => { const x = document.querySelector('#ops [data-wa]'); return { hidden: x.hidden, href: x.href, text: x.textContent.trim() }; })() }));
      R.data['links ' + tag] = links;
      ok(/\/demo\/order\/$/.test(links.demo[0][1]) && /\/demo\/order\/staff\/$/.test(links.demo[1][1]), `${tag} demo buttons -> demo/order/ & demo/order/staff/`, links.demo);
      for (const [, href] of links.demo) { const r = await p.request.get(href); ok(r.status() === 200, `${tag} ${href.replace(B, '')} 200`, r.status()); }
      const waTxt = decodeURIComponent((links.wa.href.split('text=')[1] || '').replace(/\+/g, ' '));
      ok(!links.wa.hidden && /wa\.me\/966507250396/.test(links.wa.href) && (lang === 'ar' ? /إدارة المطعم/.test(waTxt) : /Restaurant Ops/.test(waTxt)), `${tag} WA button -> shopOrder text`, { href: links.wa.href.slice(0, 60), waTxt });
      R.data['wa ' + tag] = waTxt;
      // demo pages open without errors
      if (w === 390) for (const [, href] of links.demo) { const p2 = await ctx.newPage(); const b2 = { errors: [], external: [], bad: [] }; watch(p2, b2); await p2.goto(href, { waitUntil: 'networkidle' }); ok(b2.errors.length === 0 && b2.external.length === 0 && b2.bad.length === 0, `${tag} demo page ${href.replace(B, '')} clean`, b2); await p2.close(); }
      // keyboard: switch + buttons focus ring
      await p.evaluate(() => document.querySelector('#ops .r-ops-try a').scrollIntoView({ block: 'center' }));
      await p.evaluate(() => { const a = document.querySelector('#ops .r-ops-try a'); const prev = a.closest('.r-ops-try').previousElementSibling; prev.setAttribute('tabindex', '-1'); prev.focus(); prev.removeAttribute('tabindex'); });
      const seq = [];
      for (let i = 0; i < 6; i++) {
        await p.keyboard.press('Tab'); await p.waitForTimeout(120);
        seq.push(await p.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'); return { t: e.textContent.trim().slice(0, 30), cls: e.className, ring, outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, fv: e.matches(':focus-visible') }; }));
        if (i === 2) await p.screenshot({ path: path.join(OUT, `focus-${lang}-${w}-switch.png`), clip: await p.evaluate(() => { const r = document.querySelector('#ops .s-switch').getBoundingClientRect(); return { x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 20), width: Math.min(innerWidth, r.width + 40), height: r.height + 40 }; }) });
      }
      R.data['tab ' + tag] = seq;
      const tabs = seq.map((s) => s.t);
      ok(seq.filter((s) => /s-switch-opt|lt-btn/.test(s.cls)).every((s) => s.ring && s.fv), `${tag} focus ring visible on buttons/switch`, seq);
      ok(seq.filter((s) => /s-switch-opt/.test(s.cls)).length === 1, `${tag} switch is one tab stop (roving tabindex)`, tabs);
      // arrows on switch
      const sw = p.locator('#ops .s-switch-opt[aria-checked="true"]'); await sw.focus();
      await p.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight'); await p.waitForTimeout(200);
      const k1 = await p.evaluate(() => ({ f: document.activeElement.getAttribute('data-value'), c: document.querySelector('#ops [aria-checked="true"]').getAttribute('data-value'), for: document.querySelector('.r-ops-for').textContent }));
      await p.keyboard.press('End'); await p.waitForTimeout(200);
      const k2 = await p.evaluate(() => document.querySelector('#ops [aria-checked="true"]').getAttribute('data-value'));
      ok(k1.f === 'm' && k1.c === 'm' && /16/.test(k1.for) && k2 === 'l', `${tag} arrow keys move along reading direction + End`, { k1, k2 });
      // thumb under checked option
      const th = await p.evaluate(() => { const t = document.querySelector('#ops .s-switch-thumb').getBoundingClientRect(); const o = document.querySelector('#ops [aria-checked="true"]').getBoundingClientRect(); return { dx: Math.round(Math.abs((t.left + t.width / 2) - (o.left + o.width / 2))) }; });
      const thAll = [];
      for (const v of ['s', 'm', 'l']) { await p.locator(`#ops [data-value="${v}"]`).click(); await p.waitForTimeout(500); thAll.push(await p.evaluate(() => { const t = document.querySelector('#ops .s-switch-thumb').getBoundingClientRect(); const o = document.querySelector('#ops [aria-checked="true"]').getBoundingClientRect(); return { v: document.querySelector('#ops [aria-checked="true"]').dataset.value, thumbL: +t.left.toFixed(1), thumbR: +t.right.toFixed(1), optL: +o.left.toFixed(1), optR: +o.right.toFixed(1), dCenter: +Math.abs((t.left + t.width / 2) - (o.left + o.width / 2)).toFixed(1) }; })); }
      R.data['thumb ' + tag] = thAll;
      ok(thAll.every((x) => x.dCenter <= 2), `${tag} thumb centred under each option (<=2px)`, thAll);
      ok(bag.errors.length === 0 && bag.external.filter((x) => !/wa\.me/.test(x)).length === 0, `${tag} links run: no errors/external`, bag);
      await ctx.close();
    }
  }
  function innerHeightSafe() { return 844; }
  // 4) بدون JS
  if (ONLY.includes('nojs')) for (const [lang, u] of Object.entries(PAGES)) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false }); const p = await ctx.newPage();
    await p.goto(B + u, { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.waitForTimeout(800);
    const x = await p.evaluate(() => { const o = document.getElementById('ops'); const r = o.getBoundingClientRect(); return { h: Math.round(r.height), sw: getComputedStyle(o.querySelector('.s-period')).display, soon: o.querySelector('[data-ops-price]').textContent.trim(), setup: o.querySelector('[data-ops-setup]').hidden, sws: document.documentElement.scrollWidth }; });
    ok(x.h > 500 && x.sw === 'none' && x.setup && x.sws <= 390, `${lang} no-JS: section readable, switch hidden, setup hidden`, x);
    await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '.s-top{visibility:hidden!important}'; document.head.appendChild(st); });
    await p.locator('#ops').screenshot({ path: path.join(OUT, `nojs-${lang}-390.png`), timeout: 20000 });
    await ctx.close();
  }
  await br.close();
  // 5) أرقام في HTML القسم
  if (ONLY.includes('html')) for (const [lang, f] of [['ar', 'website/ar/restaurants/index.html'], ['en', 'website/restaurants/index.html']]) {
    const html = fs.readFileSync(path.join(__dirname, '../../../../', f), 'utf8');
    const sec = html.slice(html.indexOf('id="ops"'), html.indexOf('id="faq"'));
    const nums = (sec.match(/(?<![\w-])\d{2,}(?![\w-])/g) || []).filter((n) => !['15', '16', '30', '31', '60', '24', '20', '19', '18', '17', '12', '13', '14', '10', '11', '390', '844', '960', '600', '2', '4'].includes(n));
    const bad = sec.replace(/<[^>]+>/g, ' ').match(/مجاني|تزيد|%|دفع أونلاين|free tablet|increase/gi);
    ok(nums.length === 0 && !bad, `${lang} #ops HTML: no riyal numbers / banned words`, { nums, bad });
  }
  fs.writeFileSync(path.join(OUT, 'results-' + ONLY.join('+') + '.json'), JSON.stringify(R, null, 1));
  const f = R.checks.filter((c) => !c.pass).length; console.log(`\n${R.checks.length - f}/${R.checks.length} pass`);
})().catch((e) => { console.error(e); process.exit(1); });
