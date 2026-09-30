// resize 1440 -> 1200 -> 390 (+ rotate 844x390) mid-page and mid-story: anchor element drift in px and hidden count
const { chromium } = require('playwright'); const port = process.argv[2] || 8931;
(async () => { const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const path of ['/', '/restaurants/', '/hosts/']) for (const where of ['half', 'story']) { const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const ok = await p.evaluate(where => { if (where === 'story') { const s = ScrollTrigger.getAll().find(t => t.pin && t.trigger.closest('[data-story]')); if (!s) return false; scrollTo(0, (s.start + s.end) / 2); } else scrollTo(0, document.documentElement.scrollHeight * .5); return true; }, where);
    if (!ok) { await ctx.close(); continue; }
    await p.waitForTimeout(600);
    const pick = () => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); const a = e && (e.closest('h2,h3,p,li,figure,img,section') || e); window.__a = a; return { tag: a && a.tagName + '.' + String(a.className).split(' ')[0], top: Math.round(a.getBoundingClientRect().top), y: Math.round(scrollY) }; };
    const top = () => ({ top: Math.round(window.__a.getBoundingClientRect().top), y: Math.round(scrollY), hid: [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).length, hs: document.documentElement.scrollWidth > innerWidth });
    const a0 = await p.evaluate(pick); const res = [where, a0.tag, 'y' + a0.y, 'top' + a0.top];
    for (const [w, h] of [[1200, 900], [390, 844], [844, 390]]) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(1000); const r = await p.evaluate(top); res.push(`${w}: top${r.top} (drift ${r.top - a0.top}) hid${r.hid}${r.hs ? ' HSCROLL' : ''}`); if (w === 1200) a0.top = a0.top; }
    console.log(path, res.join(' | ')); await ctx.close(); }
  await br.close(); })();
