// لقطات الحركة (فريق الحركة، 2026-09-30): يصوّر الشاشة، مو الصفحة كاملة، عند نقاط تمرير على 390 و1440،
// عادي أو مع تقليل الحركة أو بدون GSAP. ليش: اللقطة الكاملة تخبي حركة التمرير (pin يترك فراغ، والـ iframe كسول)،
// وهنا التمرير حقيقي بالعجلة فـ ScrollTrigger يتحدث مثل المستخدم. ما يعدّل أي ملف في website/.
// التشغيل من جذر المشروع، والسيرفر شغال قبله: python3 -m http.server <port> --directory website
//   NODE_PATH=/tmp/claude-0/sp/node_modules node tools/motion-frames.cjs --port 8851 --out work/<task>/<agent>/shots
//     [--pages /,/restaurants/,/hosts/] [--widths 390,1440] [--stops 0,25,50,75,100]
//     [--mode normal|reduce|nogsap|all] [--section "#tap-lab"] [--settle 700]
// --section: النقاط نسبة من مرور القسم (من أول ما يدخل تحت الشاشة لين يطلع فوق)، بدل الصفحة كاملة.
// المخرجات: PNG لكل صفحة×عرض×وضع×نقطة، و frames.json (صنف html، والحركات الشغالة، والـ triggers، والأخطاء).
// يطلع بكود 1 لو صار خطأ JS (pageerror) في أي وضع. طلبات GSAP المقطوعة في nogsap ما تنحسب خطأ.
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = arg('port', '8831'), BASE = 'http://localhost:' + PORT;
const OUT = path.resolve(arg('out', 'motion-frames'));
const PAGES = arg('pages', '/,/restaurants/,/hosts/').split(',');
const WIDTHS = arg('widths', '390,1440').split(',').map(Number);
const STOPS = arg('stops', '0,25,50,75,100').split(',').map(Number);
const MODE = arg('mode', 'normal'), MODES = MODE === 'all' ? ['normal', 'reduce', 'nogsap'] : [MODE];
const SECTION = arg('section', ''), SETTLE = Number(arg('settle', '700'));
if (!MODES.every((m) => ['normal', 'reduce', 'nogsap'].includes(m))) throw new Error('--mode: normal | reduce | nogsap | all');
fs.mkdirSync(OUT, { recursive: true });

const range = (sel) => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const el = sel && document.querySelector(sel);
  if (sel && !el) return null;
  if (!el) return [0, max];
  const r = el.getBoundingClientRect(), top = r.top + scrollY;
  return [Math.max(0, top - innerHeight), Math.min(max, top + r.height)];
};
const state = () => {
  const g = window.gsap, st = window.ScrollTrigger;
  return {
    y: Math.round(scrollY), html: document.documentElement.className,
    activeTweens: g ? g.globalTimeline.getChildren(true, true, false).filter((t) => t.isActive()).length : null,
    triggers: st ? st.getAll().length : null, pins: st ? st.getAll().filter((s) => s.pin).length : null
  };
};
async function scrollTo(p, y) {
  for (let i = 0; i < 80; i++) {
    const cur = await p.evaluate(() => scrollY), d = y - cur;
    if (Math.abs(d) < 2) return;
    await p.mouse.wheel(0, Math.max(-240, Math.min(240, d)));
    await p.waitForTimeout(24);
    if (i > 40 && cur === await p.evaluate(() => scrollY)) return;   // وصل حد الصفحة
  }
}

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const log = [];
  let crashed = 0;
  for (const mode of MODES) for (const page of PAGES) for (const w of WIDTHS) {
    const ctx = await br.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage(), errors = [];
    if (mode === 'nogsap') await p.route('**/vendor/gsap/**', (r) => r.abort());
    p.on('pageerror', (e) => { errors.push('pageerror: ' + e.message); crashed++; });
    p.on('console', (m) => { if (m.type() === 'error' && !(mode === 'nogsap' && /Failed to load resource/.test(m.text()))) errors.push('console: ' + m.text()); });
    await p.goto(BASE + page, { waitUntil: 'networkidle' });
    await p.mouse.move(5, 5);
    await p.waitForTimeout(SETTLE);
    const rg = await p.evaluate(range, SECTION);
    const slug = (page.replace(/\/+/g, '_').replace(/^_|_$/g, '') || 'home') + (SECTION ? '-' + SECTION.replace(/[^a-z0-9-]+/gi, '') : '');
    if (!rg) { log.push({ page, w, mode, error: 'section not found: ' + SECTION }); await ctx.close(); continue; }
    for (const s of STOPS) {
      await scrollTo(p, Math.round(rg[0] + (rg[1] - rg[0]) * s / 100));
      await p.waitForTimeout(SETTLE);
      const file = `${slug}-${w}-${mode}-${String(s).padStart(3, '0')}.png`;
      await p.screenshot({ path: path.join(OUT, file) });
      log.push(Object.assign({ page, w, mode, stop: s, file }, await p.evaluate(state)));
    }
    if (errors.length) log.push({ page, w, mode, errors });
    console.log(`${errors.length ? 'ERR ' : 'ok  '} ${mode.padEnd(6)} ${page} @${w}: ${STOPS.length} لقطة${errors.length ? ' | ' + errors.join(' | ') : ''}`);
    await ctx.close();
  }
  await br.close();
  fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify(log, null, 1));
  console.log('\nالمخرجات: ' + path.relative(process.cwd(), OUT) + ' (PNG و frames.json)');
  process.exit(crashed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
