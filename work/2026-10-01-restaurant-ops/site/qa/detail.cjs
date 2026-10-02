// لقطات مكبّرة لأجزاء #ops (web-qa). NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-restaurant-ops/site/qa/detail.cjs <port>
const { chromium } = require('playwright');
const path = require('path');
const PORT = process.argv[2] || 8893, B = `http://127.0.0.1:${PORT}`, OUT = __dirname;
const PAGES = { ar: '/ar/restaurants/', en: '/restaurants/' };
const PARTS = { ways: '#ops .r-ops-ways', join: '#ops .r-ops-s3', pick: '#ops .r-ops-pick', wa: '#ops .r-ops-wa', trust: '#ops .r-ops-trust', try: '#ops .r-ops-try', head: '#ops .r-ops-head' };
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const info = {};
  for (const [lang, u] of Object.entries(PAGES)) for (const w of [320, 390]) {
    const ctx = await br.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.goto(B + u, { waitUntil: 'networkidle' });
    const h = await p.evaluate(() => document.body.scrollHeight); for (let y = 0; y < h; y += 400) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(30); }
    await p.waitForTimeout(400);
    await p.addStyleTag({ content: '.s-top{visibility:hidden!important}' });
    for (const [k, s] of Object.entries(PARTS)) { const l = p.locator(s); if (await l.isVisible()) await l.screenshot({ path: path.join(OUT, `d-${k}-${lang}-${w}.png`) }); }
    info[`${lang} ${w}`] = await p.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top + scrollY) }; };
      const ways = [...document.querySelectorAll('#ops .r-ops-way')].map((w) => ({ phone: w.querySelector('.r-ops-phone').getBoundingClientRect().width | 0, title: w.querySelector('.r-ops-wt').getBoundingClientRect().top + scrollY | 0, phoneTop: w.querySelector('.r-ops-phone').getBoundingClientRect().top + scrollY | 0 }));
      const ops = document.getElementById('ops').getBoundingClientRect().top + scrollY;
      return { opsTop: ops | 0, ways, h2: r('#ops-h'), tab: r('#ops .r-ops-tab'), wa: r('#ops .r-ops-wa'), waLines: (() => { const s = document.querySelector('#ops .r-ops-wa span'); const rg = document.createRange(); rg.selectNodeContents(s); return new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size; })(), joinColor: getComputedStyle(document.querySelector('#ops .r-ops-join'), '::before').borderBottomColor, bandBg: getComputedStyle(document.getElementById('ops')).backgroundColor };
    });
    await ctx.close();
  }
  console.log(JSON.stringify(info, null, 1));
  await br.close();
})();
