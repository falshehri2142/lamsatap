// M9 r4: jump at 3 positions, 1440->1200 and 1200->1440, like qa (no pre-scroll). usage: node m9b.cjs <port> [reduce]
const { chromium } = require('playwright'); const port = process.argv[2] || 8941; const rm = process.argv[3] === 'reduce' ? 'reduce' : 'no-preference';
const POS = { calc: "document.querySelector('.p-calc, [data-calc], #calc')", mid: null, story: "({getBoundingClientRect:()=>({top:2700-scrollY+100})})", faq: "document.querySelector('#faq, .faq, [id*=faq]')" };
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of (process.argv[4] || '/hosts/').split(',')) for (const pos of (process.argv[5]||'calc,mid,faq').split(',')) for (const [w0, w1] of [[1440, 1200], [1200, 1440]]) {
    const ctx = await br.newContext({ viewport: { width: w0, height: 900 }, reducedMotion: rm }); const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(800);
    const y = await p.evaluate(s => { const e = s ? eval(s) : null; const y = e ? e.getBoundingClientRect().top + scrollY - 100 : document.documentElement.scrollHeight * .5; scrollTo(0, y); return Math.round(scrollY); }, POS[pos]);
    await p.waitForTimeout(400);
    const a = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); window.__a = e; return e ? e.getBoundingClientRect().top : 0; });
    await p.setViewportSize({ width: w1, height: 900 }); await p.waitForTimeout(800);
    const t = await p.evaluate(() => window.__a ? window.__a.getBoundingClientRect().top : 0);
    console.log(rm, path, pos, w0 + '->' + w1, 'y', y, 'jump', Math.round(t - a)); await ctx.close(); }
  await br.close(); })();
