const { chromium } = require('playwright');
const port = process.argv[2] || 8921, B = `http://localhost:${port}`;
const PAGES = ['/', '/restaurants/', '/hosts/'];
const DEMOS = ['/demo/'];
const out = [];
const rec = (id, page, w, mode, pass, val) => { out.push({ id, page, w, mode, pass, val }); console.log(pass ? 'PASS' : 'FAIL', id, page, w, mode, JSON.stringify(val)); };
async function scrollAll(p) { await p.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } }); }
const heroState = () => { const sel = ['[data-open-qr]', '[data-open-sym]', '[data-open-word]', '[data-open-cap] > *', '[data-open-logo] img', 'h1', 'h2', '.lt-btn']; const bad = []; for (const s of sel) for (const e of document.querySelectorAll(s)) { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) continue; if (+cs.opacity < .99 || (cs.clipPath !== 'none' && /inset\((?!0px\)|0%)/.test(cs.clipPath))) bad.push(s + ':' + cs.opacity + ':' + cs.clipPath); } const run = window.gsap ? gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive()).length : 0; const pins = window.ScrollTrigger ? ScrollTrigger.getAll().filter(s => s.pin).length : 0; const c = document.documentElement.classList; return { m: c.contains('m'), mh: c.contains('mh'), bad: bad.slice(0, 5), run, pins }; };
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const path of PAGES) for (const [w, h] of [[390, 844], [1440, 900]]) {
    // M1
    let ctx = await br.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); let p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(B + path, { waitUntil: 'load' }); await p.waitForTimeout(2000); let s = await p.evaluate(heroState);
    rec('M1', path, w, 'reduce-load', !s.m && !s.mh && !s.bad.length && !s.run && !s.pins, s); await ctx.close();
    // M2 toggle mid-page
    ctx = await br.newContext({ viewport: { width: w, height: h } }); p = await ctx.newPage();
    await p.goto(B + path, { waitUntil: 'load' }); await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2)); await p.waitForTimeout(600);
    await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(500); s = await p.evaluate(() => { const hidden = [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && +getComputedStyle(e).opacity < .99; }).length; const c = document.documentElement.classList; const run = window.gsap ? gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive()).length : 0; return { m: c.contains('m'), mh: c.contains('mh'), hidden, run }; });
    rec('M2', path, w, 'reduce-toggle', !s.m && !s.mh && !s.hidden && !s.run, s); await ctx.close();
    // M3 no gsap
    ctx = await br.newContext({ viewport: { width: w, height: h } }); p = await ctx.newPage(); const e3 = []; p.on('pageerror', e => e3.push(e.message));
    await p.route('**/vendor/gsap/**', r => r.abort()); await p.goto(B + path, { waitUntil: 'load' }); await p.waitForTimeout(1000); await scrollAll(p);
    s = await p.evaluate(() => { const c = document.documentElement.classList; const hid = [...document.querySelectorAll('h1,h2,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).length; return { m: c.contains('m'), mh: c.contains('mh'), hid }; });
    rec('M3', path, w, 'nogsap', !s.m && !s.mh && !s.hid && !e3.length, { ...s, errs: e3 }); await ctx.close();
    // normal: M6 M7 M10 M11 props
    ctx = await br.newContext({ viewport: { width: w, height: h } }); p = await ctx.newPage(); const e4 = []; p.on('pageerror', e => e4.push(e.message));
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    await p.goto(B + path, { waitUntil: 'load' }); await p.waitForTimeout(800);
    const m0 = (await cdp.send('Performance.getMetrics')).metrics; await scrollAll(p); const m1 = (await cdp.send('Performance.getMetrics')).metrics;
    const g = (m, n) => m.find(x => x.name === n).value;
    await p.waitForTimeout(5000);
    s = await p.evaluate(() => { const run = window.gsap ? gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive() && !t.scrollTrigger).length : 0; const bad = []; for (const e of document.querySelectorAll('*')) { const cs = getComputedStyle(e); if (cs.transitionDuration.split(',').every(d => parseFloat(d) === 0)) continue; cs.transitionProperty.split(',').map(x => x.trim()).forEach((pr, i) => { if (!/^(transform|opacity|clip-path|translate|scale|rotate)$/.test(pr)) bad.push((e.className && e.className.baseVal === undefined ? '.' + String(e.className).split(' ')[0] : e.tagName) + ':' + pr); }); } const hidden = [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).length; return { cls: +window.__cls.toFixed(4), lt: window.__lt, run, mline: document.querySelectorAll('.m-line,.m-field').length, badTrans: [...new Set(bad)].slice(0, 12), hidden, hscroll: document.documentElement.scrollWidth > innerWidth }; });
    rec('M7', path, w, 'normal', s.cls < .1, s.cls);
    rec('M10', path, w, 'normal', !s.run && !s.mline && !s.hidden, { run: s.run, mline: s.mline, hidden: s.hidden });
    rec('PROPS', path, w, 'normal', !s.badTrans.length, s.badTrans);
    rec('M6', path, w, 'info', true, { layout: g(m1, 'LayoutCount') - g(m0, 'LayoutCount'), style: g(m1, 'RecalcStyleCount') - g(m0, 'RecalcStyleCount'), longtasks: s.lt, errs: e4 });
    // M11 focus
    await p.evaluate(() => scrollTo(0, 0)); const f = []; for (let i = 0; i < 80; i++) { await p.keyboard.press('Tab'); const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); let op = 1, n = e; while (n && n.nodeType === 1) { op *= +getComputedStyle(n).opacity; n = n.parentElement; } return { t: e.tagName + '.' + String(e.className).split(' ')[0], ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none', op: +op.toFixed(2) }; }); if (r && (!r.ring || r.op < .99)) f.push(r); }
    rec('M11', path, w, 'kbd', !f.length, [...new Map(f.map(x => [x.t, x])).values()].slice(0, 6));
    // M9 resize
    if (w === 1440) { const y0 = await p.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight * .5); return scrollY; }); await p.waitForTimeout(400); const anchor = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2); return e ? e.getBoundingClientRect().top : 0; });
      await p.setViewportSize({ width: 1200, height: 900 }); await p.waitForTimeout(800); const r1 = await p.evaluate(() => ({ hs: document.documentElement.scrollWidth > innerWidth }));
      await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800); const r2 = await p.evaluate(() => ({ hs: document.documentElement.scrollWidth > innerWidth, hid: [...document.querySelectorAll('h1,h2,h3,p,.lt-btn,[data-reveal]')].filter(e => +getComputedStyle(e).opacity < .99).length }));
      await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(800); const r3 = await p.evaluate(() => ({ hs: document.documentElement.scrollWidth > innerWidth }));
      rec('M9', path, 1440, 'resize', !r1.hs && !r2.hs && !r3.hs && !r2.hid, { r1, r2, r3 }); }
    await ctx.close();
  }
  // M5 + M8 throttled 390
  for (const path of PAGES) { const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.addInitScript(() => { window.__f = []; let l = performance.now(); const t = n => { window.__f.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); window.__lt = []; new PerformanceObserver(x => x.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); window.__ev = 0; new PerformanceObserver(x => x.getEntries().forEach(e => { if (e.interactionId) window.__ev = Math.max(window.__ev, e.duration); })).observe({ type: 'event', durationThreshold: 16, buffered: true }); });
    await p.goto(B + path, { waitUntil: 'load' }); await p.waitForTimeout(1500); const load = await p.evaluate(() => { const f = window.__f.slice(2); return { maxF: Math.round(Math.max(...f)), over33: f.filter(x => x > 33).length }; });
    await p.evaluate(() => { window.__lt = []; }); await scrollAll(p); const sc = await p.evaluate(() => window.__lt.slice());
    for (const sel of ['.tl__opt', '.s-switch-opt', '.p-calc-step']) { const els = await p.$$(sel); for (const e of els.slice(0, 3)) { try { await e.scrollIntoViewIfNeeded(); await e.click({ timeout: 2000 }); await p.waitForTimeout(150); } catch (x) {} } }
    await p.waitForTimeout(500); const inp = await p.evaluate(() => Math.round(window.__ev));
    rec('M5', path, 390, 'cpu4x', load.over33 === 0 && !sc.some(x => x > 50), { load, scrollLongTasks: sc });
    rec('M8', path, 390, 'cpu4x', inp <= 200, { maxInteraction: inp, target: 100 });
    await ctx.close(); }
  // demos regression: no gsap, no errors
  const ctx = await br.newContext(); const p = await ctx.newPage(); const de = []; p.on('pageerror', e => de.push(e.message)); const reqs = []; p.on('request', r => { if (/gsap|motion\.js/.test(r.url())) reqs.push(r.url()); });
  const demos = require('fs').readdirSync(__dirname + '/../../../website/demo').filter(x => !x.includes('.')); for (const d of demos) { await p.goto(`${B}/demo/${d}/`, { waitUntil: 'load' }).catch(() => {}); }
  rec('DEMO', 'demo/*', 0, String(demos.length), !de.length && !reqs.length, { errs: de, gsapReqs: reqs });
  require('fs').writeFileSync(__dirname + '/motion-check.out.json', JSON.stringify(out, null, 1));
  console.log('TOTAL', out.filter(x => x.pass).length + '/' + out.length); await br.close();
})();
