// فحص حركة لمسة تاب (motion.js و motion.css) ضد GSAP 3.15.0 المحلي. محلي بالكامل: بدون تنزيل ولا شبكة ولا تعديل ملفات.
// الشرح والقواعد: work/2026-09-27-brand-identity/skills/gsap.md (القسم 6).
// التشغيل من جذر المشروع:
//   node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs            (الكل)
//   node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs S R1 R2    (الثابت كله، و R1 و R2 بس)
//   ... --page website/restaurants/index.html   (الصفحة الحقيقية لـ R2 و R8 و R9 و R10 و R11، والافتراضي البوابة)
// النتيجة: PASS أو FAIL أو INFO لكل فحص، وآخر سطر المجموع. ما يحتاج إلا Edge أو Chrome مثبت (نفس ui-probe).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');
const WEB = path.join(ROOT, 'website');
const args = process.argv.slice(2);
const pageArg = args.includes('--page') ? args[args.indexOf('--page') + 1] : 'website/index.html';
const ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--page');
const want = (id) => !ids.length || ids.includes(id) || (id.startsWith('S') && ids.includes('S')) || (id.startsWith('R') && ids.includes('R'));
const results = [];
const put = (id, status, title, detail) => { results.push({ id, status, title, detail }); console.log(`${status.padEnd(4)} ${id.padEnd(4)} ${title}${detail ? '\n          ' + detail : ''}`); };

// ===== واجهة GSAP 3.15.0 الموجودة فعلاً (من gsap.min.js و ScrollTrigger.min.js المحليين، 2026-09-28) =====
const API = {
  gsap: 'addEventListener config context core defaults delayedCall effects exportRoot from fromTo getById getProperty getTweensOf globalTimeline install isTweening killTweensOf matchMedia matchMediaRefresh parseEase plugins quickSetter quickTo registerEase registerEffect registerPlugin removeEventListener set ticker timeline to updateRoot utils version'.split(' '),
  utils: 'checkPrefix clamp distribute getUnit interpolate mapRange normalize pipe random selector shuffle snap splitColor toArray unitize wrap wrapYoyo'.split(' '),
  ticker: 'add deltaRatio fps frame lagSmoothing remove sleep tick time wake'.split(' '),
  st: 'addEventListener batch clearMatchMedia clearScrollMemory config core create defaults disable enable getAll getById getScrollFunc isInViewport isScrolling killAll maxScroll normalizeScroll observe positionInViewport refresh register removeEventListener revert saveStyles scrollerProxy snapDirectional sort update version'.split(' '),
};
const NOT_VENDORED = /\b(SplitText|Flip|Observer|ScrollToPlugin|ScrollSmoother|CustomEase|CustomWiggle|CustomBounce|DrawSVGPlugin|MorphSVGPlugin|MotionPathPlugin|MotionPathHelper|InertiaPlugin|Draggable|GSDevTools|Physics2DPlugin|PhysicsPropsPlugin|ScrambleTextPlugin|TextPlugin|EasePack)\b/g;

function staticChecks() {
  const jsPath = path.join(WEB, 'assets', 'motion.js'), cssPath = path.join(WEB, 'assets', 'motion.css');
  const js = fs.readFileSync(jsPath, 'utf8'), css = fs.readFileSync(cssPath, 'utf8');
  // بدون التعليقات، مع الحفاظ على أرقام الأسطر (التعليق يصير مسافات)
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  const code = js.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:])(\/\/.*)$/gm, (all, p, c) => p + blank(c));
  const find = (re, src = js) => { const out = []; let m; const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    while ((m = r.exec(src))) out.push({ m, line: src.slice(0, m.index).split('\n').length }); return out; };
  const alias = (js.match(/(\w+)\s*=\s*w\.gsap\b/) || [])[1] || 'gsap', stAlias = (js.match(/(\w+)\s*=\s*w\.ScrollTrigger\b/) || [])[1] || 'ScrollTrigger';

  if (want('S1')) {   // gsap.utils.extend وأي util مو موجود
    const bad = find(new RegExp(`\\b(?:${alias}|gsap)\\.utils\\.(\\w+)`, 'g'), code).filter((x) => !API.utils.includes(x.m[1]));
    put('S1', bad.length ? 'FAIL' : 'PASS', 'gsap.utils: كل دالة مستخدمة موجودة في 3.15 (ولا utils.extend)', bad.map((x) => `utils.${x.m[1]}`).join(', '));
  }
  if (want('S2')) {   // كل نداء على gsap و ticker و ScrollTrigger موجود في النسخة المحلية
    const bad = [];
    find(new RegExp(`\\b(?:${alias}|gsap)\\.(\\w+)`, 'g'), code).forEach((x) => { if (!API.gsap.includes(x.m[1])) bad.push(`gsap.${x.m[1]}`); });
    find(new RegExp(`\\b(?:${alias}|gsap)\\.ticker\\.(\\w+)`, 'g'), code).forEach((x) => { if (!API.ticker.includes(x.m[1])) bad.push(`ticker.${x.m[1]}`); });
    find(new RegExp(`\\b(?:${stAlias}|ScrollTrigger)\\.(\\w+)`, 'g'), code).forEach((x) => { if (!API.st.includes(x.m[1])) bad.push(`ScrollTrigger.${x.m[1]}`); });
    put('S2', bad.length ? 'FAIL' : 'PASS', 'نداءات gsap و ticker و ScrollTrigger كلها موجودة في 3.15', [...new Set(bad)].join(', '));
  }
  if (want('S3')) { const hits = [...new Set((code.match(NOT_VENDORED) || []))]; put('S3', hits.length ? 'FAIL' : 'PASS', 'ولا plugin غير ScrollTrigger (غيرها يحتاج موافقة صاحب المشروع على التنزيل)', hits.join(', ')); }
  if (want('S4')) { const h = find(/markers\s*:\s*true/g, code); put('S4', h.length ? 'FAIL' : 'PASS', 'ولا markers: true', h.map((x) => 'L' + x.line).join(' ')); }
  if (want('S5')) { const h = find(/lagSmoothing\(\s*0\s*[,)]/g, code); const lag = find(/lagSmoothing\(([^)]*)\)/g, code);
    put('S5', h.length ? 'FAIL' : lag.length ? 'INFO' : 'PASS', 'lagSmoothing: ممنوع 0، والافتراضي (500, 33)', lag.map((x) => `L${x.line} lagSmoothing(${x.m[1]})`).join(' ')); }
  if (want('S6')) {   // المنحنيات: لازم من التوكنز
    const tokens = (js.match(/var\s+OUT\s*=[^;]+;/) || [''])[0];
    const raw = find(/ease\s*:\s*'([^']+)'/g, code).filter((x) => x.m[1] !== 'none' && !tokens.includes(`'${x.m[1]}'`));
    put('S6', raw.length ? 'INFO' : 'PASS', 'كل ease من التوكنز (OUT و IN و SCAN و MOVE و none)', raw.map((x) => `L${x.line} '${x.m[1]}'`).join(', '));
  }
  if (want('S7')) {   // scrub مع toggleActions في نفس الإعداد
    const h = find(/scrollTrigger\s*:\s*\{[^{}]*\}/g, code).filter((x) => /\bscrub\b/.test(x.m[0]) && /\btoggleActions\b/.test(x.m[0]));
    put('S7', h.length ? 'FAIL' : 'PASS', 'ولا scrub مع toggleActions في نفس ScrollTrigger', h.map((x) => 'L' + x.line).join(' '));
  }
  if (want('S8')) {   // GM-011: صفحات الزبون بدون GSAP
    const hits = [];
    const walk = (dir) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p); else if (/\.(html|js)$/.test(f.name) && /gsap|ScrollTrigger|motion\.js/.test(fs.readFileSync(p, 'utf8'))) hits.push(path.relative(ROOT, p)); } };
    ['templates', 'demo'].forEach((d) => { const p = path.join(WEB, d); if (fs.existsSync(p)) walk(p); });
    put('S8', hits.length ? 'FAIL' : 'PASS', 'GM-011: ولا GSAP في templates/ و demo/', hits.join(', '));
  }
  if (want('S9')) {   // eventCallback يبدّل onComplete القديم: لازم يكمّله
    const sets = find(/eventCallback\(\s*'onComplete'\s*,/g, code), reads = find(/eventCallback\(\s*'onComplete'\s*\)/g, code);
    put('S9', sets.length && !reads.length ? 'FAIL' : 'PASS', "eventCallback('onComplete', fn) يكمّل الـ onComplete القديم (ما يبدّله)", sets.map((x) => 'L' + x.line).join(' '));
  }
  if (want('S10')) { const h = find(/stagger\s*:\s*\{[^}]*\beach\b[^}]*\bamount\b[^}]*\}/g, code);
    put('S10', h.length ? 'INFO' : 'PASS', 'stagger فيه each و amount مع بعض (amount يغلب: 10 عناصر = 20ms بينها مو 60ms)', h.map((x) => 'L' + x.line).join(' ')); }
  const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (want('S11')) { const wc = find(/([^{}]+)\{[^}]*will-change\s*:\s*([^;}]+)/g, cssCode).map((x) => `${x.m[1].trim().replace(/\s+/g, ' ')} → ${x.m[2].trim()}`);
    put('S11', 'INFO', 'will-change في motion.css (راجع إن كل واحد يحرّك transform أو opacity فعلاً، ومو دايم)', wc.join(' | ')); }
  if (want('S12')) {   // المخفي بالـ CSS تحت m و mh يرجع ظاهر لما matchMedia يرجّع وما فيه شرط منطبق (تقليل الحركة وقت التصفح)
    const hidden = [...new Set(find(/(\.mh?\s[^{,]+)(?=[^{]*\{[^}]*(opacity\s*:\s*0|clip-path\s*:\s*inset\(0 0 100% 0\)))/g, cssCode).map((x) => x.m[1].trim()))];
    const cleanup = (code.match(/return function \(\) \{[^\n]*\};/) || [''])[0];
    const removesClasses = /classList\.remove\(\s*'m'\s*,\s*'mh'\s*\)/.test(cleanup);
    const syncRestore = /(^|[;{]\s*)restore\(\)/.test(cleanup) || /removeProperty|clearProps/.test(cleanup);
    put('S12', removesClasses ? 'PASS' : 'FAIL', "دالة الـ cleanup (ترجع من mm.add) تشيل m و mh وترجّع الـ inline بنفسها (هي تشتغل آخر شي بعد revert)",
      `تشيل الكلاسات: ${removesClasses ? 'نعم' : 'لا'}، ترجّع الـ inline بدون تأخير: ${syncRestore ? 'نعم' : 'لا'}. المخفي بالـ CSS: ${hidden.join(' | ')}`);
  }
}

async function runtimeChecks() {
  let launch, sleep, fileUrl;
  try { ({ launch, sleep, fileUrl } = require('./cdp.cjs')); } catch (e) { put('R', 'INFO', 'ما قدرت أشغّل المتصفح: ' + e.message); return; }
  const P = (f) => fileUrl(path.join(__dirname, 'pages', f)), REAL = fileUrl(path.join(ROOT, pageArg));
  const SCROLL_ALL = `new Promise(async r=>{for(let y=0;y<=document.documentElement.scrollHeight;y+=150){scrollTo(0,y);await new Promise(s=>setTimeout(s,60))}r(1)})`;
  const PREHID = `[data-open-qr] svg, [data-open-sym], [data-open-word], [data-open-cap] > :not(a), [data-open-logo] img, [data-expand-sheet], [data-expand-phone]`;
  const HIDDEN = `(() => { const bad = []; document.querySelectorAll('${PREHID}').forEach(e => { const cs = getComputedStyle(e); if (+cs.opacity < .99 || cs.visibility === 'hidden') bad.push((e.getAttribute('class') || e.tagName) + ' op=' + cs.opacity); }); return { cls: document.documentElement.className.trim(), bad }; })()`;
  const b = await launch();
  try {
    if (want('R1')) {
      await b.viewport(1440, 900); await b.media(false); await b.go(P('t-queue.html'), 1000);
      await b.ev(SCROLL_ALL); await sleep(7000);
      const a = await b.ev(`({lines: document.querySelectorAll('.m-line').length, clip: ['mA','mB','mC'].map(id=>document.getElementById(id).style.clipPath||'')})`);
      for (let i = 0; i < 5; i++) { await b.ev(`document.getElementById('d1').dispatchEvent(new MouseEvent('mouseenter')), 1`); await sleep(1300); }
      const c = await b.ev(`document.querySelectorAll('.m-line').length`);
      const ok = a.lines === 0 && c === 0 && a.clip.every((x) => !x);
      put('R1', ok ? 'PASS' : 'FAIL', 'الطابور: بعد كل مسح ما يبقى .m-line ولا clip-path inline (ومع 5 تحويمات على الباب)', `بعد المسح: ${a.lines} خط، clip=[${a.clip.join(', ')}]. بعد 5 تحويمات: ${c} خط`);
    }
    if (want('R2')) {
      const out = [];
      for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
        await b.viewport(w, h, { mobile }); await b.media(false); await b.go(REAL, 3000);
        await b.media(true); await sleep(1200); const s = await b.ev(HIDDEN); out.push({ w, ...s }); await b.media(false);
      }
      const ok = out.every((x) => !/\bmh?\b/.test(x.cls) && !x.bad.length);
      put('R2', ok ? 'PASS' : 'FAIL', 'تشغيل «تقليل الحركة» والصفحة مفتوحة: الكل يرجع ظاهر ونهائي (390 و 1440)', out.map((x) => `${x.w}: html="${x.cls}" مخفي=[${x.bad.join('; ')}]`).join(' || '));
    }
    if (want('R3') || want('R4')) {
      const M = `(() => { const p=document.querySelector('[data-story-phone]').getBoundingClientRect(), t=document.querySelector('[data-story-target]').getBoundingClientRect(); return { dx: Math.round((t.left+t.width/2)-(p.left+p.width/2)), dy: Math.round(t.top-(p.top+p.height*.12)) }; })()`;
      const ST = `(() => { const s = ScrollTrigger.getAll().find(x => x.pin && x.pin.hasAttribute('data-story-pin')); return s ? { start: Math.round(s.start), end: Math.round(s.end) } : null; })()`;
      await b.viewport(1440, 900); await b.media(false); await b.go(P('t-story.html'), 1500);
      const s1 = await b.ev(ST);
      if (!s1) { put('R3', 'FAIL', 'القصة: ما لقيت ScrollTrigger مثبّت على [data-story-pin]'); }
      else {
        await b.ev(`scrollTo(0, ${Math.round((s1.start + s1.end) / 2)}), 1`); await sleep(900);
        const mid = await b.ev(`({pinTop: Math.round(document.querySelector('[data-story-pin]').getBoundingClientRect().top), headerBottom: Math.round(document.querySelector('.hdr').getBoundingClientRect().bottom)})`);
        if (want('R4')) put('R4', mid.pinTop >= mid.headerBottom ? 'PASS' : 'FAIL', 'القصة المثبّتة ما تنحشر تحت الرأس الثابت (1440×900، كتلة 800px)', `أعلى الكتلة ${mid.pinTop}px، وتحت الرأس ${mid.headerBottom}px`);
        if (want('R3')) {
          await b.ev(`scrollTo(0, ${s1.end - 5}), 1`); await sleep(1600); const a = await b.ev(M);
          await b.viewport(1200, 900); await sleep(1800); const s2 = await b.ev(ST);
          await b.ev(`scrollTo(0, ${s2.end - 5}), 1`); await sleep(1600); const c = await b.ev(M);
          const ok = Math.abs(a.dx) <= 2 && Math.abs(a.dy) <= 2 && Math.abs(c.dx) <= 2 && Math.abs(c.dy) <= 2;
          put('R3', ok ? 'PASS' : 'FAIL', 'القصة: الجوال يوصل الهدف بالضبط، وبعد تغيير العرض 1440 → 1200 (بدون عبور 1024)', `1440: dx=${a.dx} dy=${a.dy}. بعد 1200: dx=${c.dx} dy=${c.dy}`);
        }
      }
    }
    if (want('R5')) {
      await b.viewport(1280, 600); await b.media(false); await b.go(P('t-story.html'), 1200); await b.ev(SCROLL_ALL); await sleep(2500);
      const r = await b.ev(`({cls: document.documentElement.className.trim(), clip: getComputedStyle(document.querySelector('[data-story] [data-tint]')).clipPath})`);
      const ok = r.clip === 'none' || /inset\(0(px|%)?\)/.test(r.clip);
      put('R5', ok ? 'PASS' : 'FAIL', 'شاشة قصيرة (أقل من 640) والحركة شغالة: طبقة اللون تطلع (مو أبيض وأسود للأبد)', `html="${r.cls}" clip-path=${r.clip}`);
    }
    if (want('R6')) {
      await b.viewport(1440, 900); await b.media(false); await b.go(P('t-early.html'), 2500);
      const r = await b.ev(`({cls: document.documentElement.className.trim(), logo: getComputedStyle(document.getElementById('hlogo')).opacity, qr: getComputedStyle(document.getElementById('qr')).opacity, word: getComputedStyle(document.querySelector('[data-open-word]')).opacity})`);
      const ok = +r.logo > .99 && +r.qr > .99 && +r.word > .99;
      put('R6', ok ? 'PASS' : 'FAIL', 'fail-open: البداية ناقصها hook (data-open-sym) → ولا شي يبقى مخفي', `html="${r.cls}" شعار الرأس=${r.logo} الباركود=${r.qr} الكلمة=${r.word}`);
    }
    if (want('R7')) {
      await b.viewport(1440, 900); await b.media(false); await b.go(P('t-bottom.html'), 1200);
      await b.ev(SCROLL_ALL); await b.ev(`scrollTo(0, document.documentElement.scrollHeight), 1`); await sleep(2500);
      const r = await b.ev(`({top: Math.round(document.getElementById('last').getBoundingClientRect().top), vh: innerHeight, clip: getComputedStyle(document.getElementById('last')).clipPath})`);
      const ok = r.clip === 'none' || /inset\(0(px|%)?\)/.test(r.clip);
      put('R7', ok ? 'PASS' : 'FAIL', 'آخر الصفحة: وسيط أعلاه ما يوصل 65% (عند أقصى تمرير) ما يبقى مقصوص', `أعلاه عند أقصى تمرير ${r.top} من ${r.vh}، clip-path=${r.clip}`);
    }
    if (want('R8')) {
      await b.viewport(1440, 900); await b.media(false); await b.go(REAL, 3000);
      const has = await b.ev(`!!document.querySelector('[data-open]')`);
      if (!has) put('R8', 'INFO', 'الصفحة ما فيها [data-open]، فحص إعادة البداية ما ينطبق');
      else { await b.viewport(1000, 900); await sleep(400); const f = await b.ev(`!!document.querySelector('.m-field')`);
        put('R8', f ? 'FAIL' : 'PASS', 'البداية ما تنعاد لما الشاشة تعبر 1024 بعد ما خلصت (مرة وحدة لكل تحميل)', f ? 'رجع الحقل (.m-field) وانعاد التسلسل' : ''); }
    }
    if (want('R9')) {   // قياس: مؤشر بس (Edge بدون واجهة وبدون GPU، والمعالج أبطأ 4 مرات)
      const src = `(() => { const P = CanvasRenderingContext2D.prototype, c = {fill:0, fillRect:0, roundRect:0};
        for (const k of Object.keys(c)) { const o = P[k]; if (!o) continue; P[k] = function () { c[k]++; return o.apply(this, arguments); }; }
        window.__frames = []; const t0 = performance.now();
        function f(t) { window.__frames.push({ t: t - t0, n: c.fill + c.fillRect, rr: c.roundRect }); c.fill = c.fillRect = c.roundRect = 0; if (t - t0 < 3500) requestAnimationFrame(f); }
        requestAnimationFrame(f); })()`;
      const { identifier } = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: src });
      const rows = [];
      for (const [label, w, h, dpr, mobile] of [['1440@2x', 1440, 900, 2, false], ['390@2x', 390, 844, 2, true]]) {
        await b.viewport(w, h, { dpr, mobile }); await b.media(false); await b.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await b.go(REAL, 4200); await b.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        rows.push(label + ' ' + JSON.stringify(await b.ev(`(() => { const F = window.__frames || []; const idx = F.map((x,i)=>x.n>0&&i>0?i:-1).filter(i=>i>0); const d = idx.map(i=>F[i].t-F[i-1].t);
          return { introFrames: d.length, maxCallsPerFrame: Math.max(0, ...F.map(x=>x.n)), maxRoundRect: Math.max(0, ...F.map(x=>x.rr)), over20ms: d.filter(x=>x>20).length, over33ms: d.filter(x=>x>33.4).length }; })()`)));
      }
      await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
      put('R9', 'INFO', 'كلفة حقل البداية (canvas) لكل إطار، والإطارات الطويلة وقت التسلسل (مؤشر، مو جهاز حقيقي)', rows.join(' || '));
    }
    if (want('R10')) {
      const out = [];
      for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
        await b.viewport(w, h, { mobile }); await b.media(true); await b.go(REAL, 2000);
        const s = await b.ev(HIDDEN); const f = await b.ev(`!!document.querySelector('.m-field, .m-line, .m-fly')`); out.push({ w, f, ...s });
      }
      await b.media(false);
      const ok = out.every((x) => !/\bmh?\b/.test(x.cls) && !x.bad.length && !x.f);
      put('R10', ok ? 'PASS' : 'FAIL', 'تقليل الحركة من التحميل: الشكل النهائي على طول، وولا عنصر حركة مضاف', out.map((x) => `${x.w}: html="${x.cls}" مخفي=[${x.bad.join('; ')}] عناصر حركة=${x.f}`).join(' || '));
    }
    if (want('R11')) {
      const errs = [];
      for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
        await b.viewport(w, h, { mobile }); await b.media(false); await b.go(REAL, 2500); await b.ev(SCROLL_ALL); await sleep(1500);
        b.logs.filter((l) => l.type === 'exception' || l.type === 'error' || /fail-open/.test(l.text)).forEach((l) => errs.push(`${w}: ${l.type} ${l.text.slice(0, 160)}`));
      }
      put('R11', errs.length ? 'FAIL' : 'PASS', 'ولا خطأ ولا fail-open في الكونسول (تحميل وتمرير للآخر، 1440 و 390)', errs.join(' || '));
    }
  } catch (e) { put('R', 'FAIL', 'الفحص نفسه طاح: ' + (e && e.message)); }
  finally { await b.close(); }
}

(async () => {
  console.log(`motion.js: ${path.relative(ROOT, path.join(WEB, 'assets', 'motion.js'))}  الصفحة الحقيقية: ${pageArg}\n`);
  staticChecks();
  if (!ids.length || ids.some((i) => i.startsWith('R'))) await runtimeChecks();
  const n = (s) => results.filter((r) => r.status === s).length;
  console.log(`\nالمجموع: PASS ${n('PASS')}  FAIL ${n('FAIL')}  INFO ${n('INFO')}`);
  if (args.includes('--json')) fs.writeFileSync(path.join(__dirname, 'last-run.json'), JSON.stringify(results, null, 1));
})();
