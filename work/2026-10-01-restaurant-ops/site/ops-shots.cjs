// لقطات وفحص قسم #ops: NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-restaurant-ops/site/ops-shots.cjs <port>
// اللقطات في shots/: ops-<ar|en>-<width>.png (القسم كامل)، وhero-<ar|en>-390.png (أول شاشة 390×844)، وpriced-*.png (config معبّى بنسخة مؤقتة عن طريق route).
// config.js الحقيقي ما يتغير: التعبئة تصير بإبدال الرد في المتصفح بس.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PORT = process.argv[2] || 8871, B = `http://127.0.0.1:${PORT}`;
const SH = path.join(__dirname, 'shots'); fs.mkdirSync(SH, { recursive: true });
const PAGES = { ar: '/ar/restaurants/', en: '/restaurants/' };
const FILL = 'restaurantOpsPrices: { order: { s: "249", m: "329", l: "449" }, pro: { s: "349", m: "449", l: "549" }, setup: "499", perTable: "25" },';
const log = []; const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);

async function walk(p) {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(60); }
}
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [lang, u] of Object.entries(PAGES)) {
    for (const w of [320, 390, 1280]) {
      const ctx = await br.newContext({ viewport: { width: w, height: 844 } }); const p = await ctx.newPage();
      const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      await p.goto(B + u, { waitUntil: 'networkidle' });
      if (w === 390) {
        const f = await p.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); return { h1: r('#hero-h').bottom, btn: r('.r-hero-demo').bottom, rnew: r('.r-new').bottom, rnewH: r('.r-new').height, href: document.querySelector('.r-new').getAttribute('href') }; });
        ok(f.h1 <= 844 && f.btn <= 844, `${lang} 390 h1+primary above fold ${JSON.stringify(f)}`);
        ok(f.rnewH >= 44 && f.href === '#ops', `${lang} .r-new >=44 and -> #ops`);
        await p.screenshot({ path: path.join(SH, `hero-${lang}-390.png`) });
      }
      await walk(p);
      const s = await p.evaluate(() => {
        const ops = document.getElementById('ops'), prev = ops.previousElementSibling, next = ops.nextElementSibling;
        const ways = [...document.querySelectorAll('.r-ops-way')].map((e) => e.getBoundingClientRect());
        const soon = [...document.querySelectorAll('[data-ops-price]')].map((e) => e.textContent.trim());
        const imgs = [...ops.querySelectorAll('img')].map((i) => i.loading + '/' + i.complete + '/' + i.naturalWidth);
        return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, prev: prev && prev.id, next: next && next.id, order: !!document.getElementById('order'),
          side: ways.length === 2 && Math.abs(ways[0].top - ways[1].top) < 2, soon, setup: document.querySelector('[data-ops-setup]').hidden, imgs,
          nav: [...document.querySelectorAll('.a-section-nav a')].map((a) => a.getAttribute('href')).join(' ') };
      });
      ok(s.sw <= s.cw, `${lang} ${w} no h-scroll ${s.sw}/${s.cw}`);
      ok(s.prev === 'plan' && s.next === 'faq' && !s.order, `${lang} ${w} #ops between #plan and #faq, no #order`);
      ok(s.side, `${lang} ${w} two options side by side`);
      ok(s.soon.every((t) => /قريباً|coming soon/.test(t)) && s.setup, `${lang} ${w} empty config: ${s.soon.join(' | ')} setupHidden=${s.setup}`);
      ok(s.imgs.every((x) => /^lazy\/true\/\d+/.test(x) && !/\/0$/.test(x)), `${lang} ${w} images lazy+loaded ${s.imgs.join(' ')}`);
      ok(s.nav === '#demo #plan #ops #faq', `${lang} ${w} section nav ${s.nav}`);
      ok(errs.length === 0, `${lang} ${w} no errors ${errs.join('|')}`);
      if (w === 390) {   // أول شاشة لما يوصل #ops من شريط الأقسام: اسم الخيارين لازم يبان (web-qa M1)
        await p.evaluate(() => scrollTo(0, 0)); await p.click('.a-section-nav a[href="#ops"]'); await p.waitForTimeout(1500);
        const f = await p.evaluate(() => [...document.querySelectorAll('.r-ops-wt')].map((e) => Math.round(e.getBoundingClientRect().bottom)));
        ok(f.every((b) => b > 0 && b <= 844), `${lang} 390 option titles in first #ops screen ${f}`);
        await p.screenshot({ path: path.join(SH, `fold-${lang}-390.png`) });
      }
      // switch: «لمين» line follows
      await p.locator('#ops [data-value="m"]').click(); await p.waitForTimeout(400);
      const forM = await p.textContent('#ops .r-ops-for');
      ok(/16/.test(forM), `${lang} ${w} switch -> m: ${forM}`);
      await p.locator('#ops [data-value="s"]').click(); await p.waitForTimeout(400);
      await p.addStyleTag({ content: '.s-top{visibility:hidden!important}' }); if (w !== 320) await p.locator('#ops').screenshot({ path: path.join(SH, `ops-${lang}-${w}.png`) });
      await ctx.close();
    }
    // priced (temporary config via route)
    for (const w of [390, 1280]) {
      const ctx = await br.newContext({ viewport: { width: w, height: 844 } }); const p = await ctx.newPage();
      await p.route('**/config.js*', async (r) => { const res = await r.fetch(); let t = await res.text(); t = t.replace(/restaurantOpsPrices: \{[^\n]*\},/, FILL); await r.fulfill({ response: res, body: t }); });
      await p.goto(B + u, { waitUntil: 'networkidle' }); await walk(p);
      const read = () => p.evaluate(() => ({ o: document.querySelector('[data-ops-price="order"]').textContent, pr: document.querySelector('[data-ops-price="pro"]').textContent, f: document.querySelector('.r-ops-for').textContent, unit: document.querySelector('[data-ops-unit]').hidden, setup: document.querySelector('[data-ops-setup]').hidden ? null : document.querySelector('[data-ops-setup]').textContent }));
      const a = await read();
      await p.locator('#ops [data-value="m"]').click(); await p.waitForTimeout(300); const b = await read();
      await p.locator('#ops [data-value="l"]').click(); await p.waitForTimeout(400); const c = await read();
      const thumb = await p.evaluate(() => { const t = document.querySelector('#ops .s-switch-thumb').getBoundingClientRect(), o = document.querySelector('#ops [data-value="l"]').getBoundingClientRect(); return Math.abs((t.left + t.width / 2) - (o.left + o.width / 2)) < 4; });
      ok(a.o === '249' && a.pr === '349' && b.o === '329' && b.pr === '449' && c.o === '449' && c.pr === '549' && !a.unit && a.setup && /499/.test(a.setup) && /25/.test(a.setup), `${lang} ${w} priced: ${JSON.stringify([a, b, c])}`);
      ok(thumb, `${lang} ${w} thumb under 3rd option`);
      await p.locator('#ops .r-ops-plans').screenshot({ path: path.join(SH, `priced-${lang}-${w}.png`) });
      // keyboard: arrow moves selection
      await p.focus('#ops [data-value="l"]'); await p.keyboard.press('Home');
      ok(await p.evaluate(() => document.activeElement.dataset.value) === 's', `${lang} ${w} keyboard Home -> s`);
      await ctx.close();
    }
  }
  // reduced motion + no JS
  for (const [lang, u] of Object.entries(PAGES)) for (const mode of ['reduce', 'nojs']) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference', javaScriptEnabled: mode !== 'nojs' }); const p = await ctx.newPage();
    await p.goto(B + u, { waitUntil: 'networkidle' }); await walk(p);
    const v = await p.evaluate(() => { const vis = (e) => { for (let x = e; x; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === 'none' || +cs.opacity < 0.9) return false; } return true; };
      return { cards: [...document.querySelectorAll('.r-ops-card, .r-ops-tab')].every(vis), soon: [...document.querySelectorAll('[data-ops-price]')].map((e) => e.textContent), period: getComputedStyle(document.querySelector('#ops .s-period')).display }; });
    ok(v.cards && v.soon.every((t) => /قريباً|coming soon/.test(t)) && (mode === 'reduce' || v.period === 'none'), `${lang} ${mode} final state ${JSON.stringify(v)}`);
    await ctx.close();
  }
  await br.close();
  console.log(log.join('\n')); console.log(log.filter((l) => l.startsWith('FAIL')).length + ' fail / ' + log.length);
})().catch((e) => { console.error(e); process.exit(1); });
