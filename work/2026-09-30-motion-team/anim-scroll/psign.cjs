// .p-sign: min opacity of descendants + script loaded, in normal / reduce / gsap-blocked
const { chromium } = require('playwright');
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const mode of ['normal', 'reduce', 'nogsap']) for (const w of [390, 1440]) { const ctx = await br.newContext({ viewport: { width: w, height: 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    if (mode === 'nogsap') await p.route('**/vendor/gsap/**', r => r.abort());
    await p.goto('http://localhost:8931/hosts/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.evaluate(() => document.querySelector('.p-sign').scrollIntoView({ block: 'center' })); await p.waitForTimeout(3500);
    const r = await p.evaluate(() => { const s = document.querySelector('.p-sign'); let m = 1; s.querySelectorAll('*').forEach(e => { if (e.closest('[aria-hidden="true"]') && e.getBBox === undefined && false) return; }); const txt = [...s.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()).map(e => { let o = 1, n = e; while (n && n.nodeType === 1) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } return o; }); return { svgMotion: !!document.querySelector('script[src*="svg-motion.js"]'), minTextOpacity: Math.min(...txt), n: txt.length }; });
    console.log(mode, w, JSON.stringify(r), errs.join(';')); await ctx.close(); }
  await br.close(); })();
