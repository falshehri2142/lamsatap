/* لمسة تاب — نظام الحركة 2 (web-motion): مكتبة «المسح» لصفحات الشركة بس (GM-039 و GM-040 و GM-043). GSAP 3.15 و ScrollTrigger محليين.
   الشرح والجدول «أي حركة، على أي attribute، في أي صفحة وقسم»: work/2026-09-27-brand-identity/web-motion.md «النظام 2».
   القواعد (web-art-director.md «الاتجاه 2» §7 و«الاتجاه 3» §6، و ui-ux-pro-max §7، و skills/gsap.md):
   - fail-open: أي خطأ في التهيئة أو وقت الحركة يرجّع كل شي لحالته النهائية الظاهرة (تنشال m و mh أول شي، وبعدها mm.revert).
   - transform و opacity و clip-path بس. ولا قراءة layout داخل الحلقات: القياس مرة وحدة وعند refresh (داخل الدوال).
   - خط مسح واحد في الشاشة بأي لحظة (طابور)، ويمر على الوسائط بس (صور، شاشات، باركود)، ما يمر على النص أبداً.
   - النص ظاهر من أول لحظة. بدون JS ومع تقليل الحركة: الشكل النهائي.
   - أي حركة أو ScrollTrigger ينبني بعدين (IntersectionObserver، rAF، حدث، onComplete) يمر بـ later() = contextSafe، فيرجع مع matchMedia. */
(function (w, d) {
  'use strict';
  var H = d.documentElement, g = w.gsap, ST = w.ScrollTrigger, mm = null, junk = [], ios = [], offs = [], dead = false, CS = null, splits = [], moved = [];

  // ===== fail-open: أي خطأ = كل شي يرجع ظاهر ونهائي =====
  // العناصر اللي الحركة تكتب عليها بالضبط (مو كل الأبناء: الشاشات المصغرة فيها transform خاص فيها ما ينمسح)
  var HERO = ['[data-open-qr]', '[data-open-qr] svg', '[data-open-sym]', '[data-open-word]', '[data-open-cap] > *', '[data-open-logo] img',
    '[data-reveal]', '[data-reveal="stagger"] > *', '[data-scan="reveal"]', '[data-scan="list"] > *', '[data-scan="media"]', '[data-tint]',
    '[data-scan="check"] li svg', '[data-door]', '[data-expand-media]', '[data-expand-media] > *', '[data-expand-title]', '[data-expand-title] > *', '[data-expand-sheet]',
    '[data-expand-in]', '[data-expand-phone]', '[data-story-phone]', '[data-story-ring]', '[data-story-card]', '[data-pulse]', '[data-parallax] img',
    '[data-editorial-camera]', '[data-editorial-reveal]', '[data-product-reveal]', '[data-how-photo] img'].join(', ');
  function restore() {
    try { if (g) g.set([].slice.call(d.querySelectorAll(HERO)), { clearProps: 'opacity,visibility,transform,clipPath' }); } catch (x) {}
    try { if (g && moved.length) g.set(moved, { clearProps: 'transform' }); } catch (x) {} moved = [];
  }
  // عناوين الكلمات (data-words): يرجع العنوان لنصه الأصلي بالحرف (بدون الأجزاء ولا aria-label المضاف)
  function unsplit() {
    splits.forEach(function (r) { try { r.el.innerHTML = r.html; if (!r.had) r.el.removeAttribute('aria-label'); r.el.classList.remove('m-words'); r.el.__mSplit = null;
      if (r.band) r.band.classList.remove('m-words-band'); } catch (x) {} });
    splits = [];
  }
  function unjunk() {
    unsplit();
    try { junk.forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); }); } catch (x) {} junk = [];
    try { ios.forEach(function (o) { o.disconnect(); }); } catch (x) {} ios = [];
    try { offs.forEach(function (f) { f(); }); } catch (x) {} offs = [];
    try { [].slice.call(d.querySelectorAll('[data-story].is-live, [data-story] .is-on')).forEach(function (el) { el.classList.remove('is-live', 'is-pinned', 'is-on'); }); } catch (x) {}
    try { [].slice.call(d.querySelectorAll('.m-docked')).forEach(function (el) { el.classList.remove('m-docked'); }); } catch (x) {}
    try { [].slice.call(d.querySelectorAll('[data-expand]')).forEach(function (el) { el.classList.remove('m-band', 'm-x'); el.style.removeProperty('--m-xh');   // شريط البطل على الجوال (AD-37)
      var md = el.querySelector('[data-expand-media]'); if (md) { md.style.removeProperty('--m-bt'); md.style.removeProperty('--m-bh'); } }); } catch (x) {}
  }
  // FO-4: المحتوى يبان الحين (الكلاسات والقيم المكتوبة)، والإرجاع بعد setTimeout عشان ما يصير وسط حلقة refresh حق ScrollTrigger
  function fail(e) {
    if (dead) return; dead = true;
    H.classList.remove('m', 'mh'); restore(); unsplit();
    setTimeout(function () { try { if (mm) mm.revert(); } catch (x) {} unjunk(); H.classList.remove('m', 'mh'); restore(); }, 0);
    if (w.console) console.warn('[motion] fail-open:', e && (e.stack || e.message || e));
  }
  function safe(fn) { return function guarded() { if (dead) return; try { return fn.apply(this, arguments); } catch (e) { fail(e); } }; }
  // later: للي ينبني بعدين. يمر بـ contextSafe حق آخر تشغيل لـ matchMedia، فأي tween أو ScrollTrigger داخله يرجع مع الإرجاع (CL-1، CL-2)
  function later(fn) { var f = CS ? CS(fn) : fn; return safe(f); }
  if (!g || !ST) { H.classList.remove('m', 'mh'); return; }
  // FO-8: شبكة أخيرة لخطأ يطلع داخل رسم GSAP (من الدوال اللي ترجع قيم) واللي safe() ما توصله
  w.addEventListener('error', function (ev) { if (/motion\.js|vendor\/gsap/.test((ev && ev.filename) || '')) fail(ev.error || ev.message); });

  try {
    g.registerPlugin(ST);
    // إطار ثقيل (تحميل الصفحة مثلاً): الحركة تستنى بدل ما تقفز (أي إطار فوق 120ms ينحسب 16ms). مقاس في web-motion.md «التركيب»
    g.ticker.lagSmoothing(120, 16);

    // ===== سلّم واحد للتوقيت والتسارع (ui-ux-pro-max §7 motion-consistency، والمدير الفني «الاتجاه 2» §7 و«الاتجاه 3» §6) =====
    // المزاج من data-audience على <body> أو <html>: hosts هادي (×1.25 و quint.out)، restaurants دافي فيه نبض، وبدونه (البوابة) محايد
    var aud = (d.body && d.body.getAttribute('data-audience')) || H.getAttribute('data-audience') || '';
    var CALM = aud === 'hosts', K = CALM ? 1.25 : 1;
    var T = { press: .15, acc: .24, draw: .24 * K, rise: .6 * K, scan: .8 * K, pulse: .4, fade: .2 * K, exit: .65 };   // الضغط والأكورديون ثابتين (CSS)
    var OUT = CALM ? 'quint.out' : 'expo.out', IN = 'expo.in', SCAN = 'quad.inOut', MOVE = 'power2.inOut', AWAY = 'power2.in', PULSE = 'sine.inOut';
    var STAG = .06, MAXG = CALM ? 3 : 4, SCRUB = .3, RISE = 20;   // SCRUB: المدير الفني 0.3 (قرار جولة التجهيز). المضيفين: التتابع 3 بالكثير
    var MODR = .06;   // استدارة زاوية وحدة الحقل: 6 من 100 (زوايا قطع الرمز في brand/logo/v1.0.0/symbol-black.svg). «§11» عند المدير الفني يغلبها
    var stag = function (i) { return Math.min(i, MAXG - 1) * STAG; };   // 60ms، و4 بالكثير (3 للمضيفين): 0، 60، 120، 180، 180… (TL-9)

    var $ = function (s, r) { return (r || d).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var vh = function () { return w.innerHeight; }, desk = function () { return w.innerWidth >= 1024; };
    // الجزء الثابت من الرأس بس (64 / 80). صف روابط الجوال برّاه ويمشي مع الصفحة (PIN-5)
    var headerH = function () { var hd = $('.s-top') || $('header'); return hd ? hd.offsetHeight : 0; };
    function mk(tag, cls, parent) { var e = d.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); if (parent) parent.appendChild(e); junk.push(e); return e; }
    function on(t, type, fn, opt) { t.addEventListener(type, fn, opt); offs.push(function () { t.removeEventListener(type, fn, opt); }); }
    // لما العنصر يدخل الشاشة فعلاً (مو حسب مكانه المحسوب): threshold نسبة الظاهر منه، و bottom كم من تحت الشاشة ما يُحسب
    function onView(el, fn, threshold, bottom) {
      if (!('IntersectionObserver' in w)) { fn(); return; }
      var go = later(fn);
      var io = new IntersectionObserver(later(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); go(); } }); }), { threshold: threshold || 0, rootMargin: '0px 0px ' + (-(bottom || 0)) + '% 0px' });
      io.observe(el); ios.push(io);
    }
    // watch: أول نداء من IntersectionObserver يقرر (بدون قراءة layout وقت التهيئة):
    // لو العنصر تحت الشاشة وقت التحميل → hide()، ولما يدخل → show(). لو كان ظاهر أصلاً → now() (أو ولا شي).
    // FO-7: اللي ينتظر وهو داخل الشاشة لما الصفحة توصل آخرها (ما يوصل خط الدخول أبداً) يشتغل من الحارس (sentinel)
    var waiting = [];
    function watch(el, hide, show, threshold, bottom, now) {
      if (!('IntersectionObserver' in w)) return;
      var first = true, hidden = false, fired = false, io;
      var fire = later(function () { if (fired) return; fired = true; io.disconnect(); show(); });
      io = new IntersectionObserver(later(function (es) { es.forEach(function (e) {
        if (first) { first = false;
          if (e.boundingClientRect.top > vh() * .92) { hidden = true; if (hide) hide(); waiting.push({ el: el, fire: fire, done: function () { return fired; } }); return; }
          fired = true; io.disconnect(); if (now) now(); return; }
        if (hidden && e.isIntersecting) fire();
      }); }), { threshold: threshold || 0, rootMargin: '0px 0px ' + (-(bottom || 0)) + '% 0px' });
      io.observe(el); ios.push(io);
    }
    function sentinel() {
      if (!('IntersectionObserver' in w) || !d.body) return;
      var s = mk('i', 'm-end', d.body);
      var io = new IntersectionObserver(later(function (es) { if (!es[es.length - 1].isIntersecting) return;
        waiting.forEach(function (it) { if (it.done()) return; var r = it.el.getBoundingClientRect(); if (r.top < vh() && r.bottom > 0) it.fire(); }); }));
      io.observe(s); ios.push(io);
    }
    function scanTime(h) { return Math.min(.9, Math.max(.7, .7 + (h - 240) / 1800)) * K; }  // 700 إلى 900ms حسب الطول (المضيفين ×1.25)
    function hash(x, y, s) { var t = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return t - Math.floor(t); }  // seed ثابت
    function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    function docLeft(el) { var x = 0; while (el) { x += el.offsetLeft; el = el.offsetParent; } return x; }
    function offscreen(el) { var r = el.getBoundingClientRect(); return r.bottom < 0 || r.top > vh(); }

    // ===== خط المسح: قلبه 2px بلون --lt-accent وذيله --lt-accent-glow (توكنز web-brand حسب data-audience). البوابة بدونه: حبر =====
    function line(host, light) { return mk('i', 'm-line' + (light ? ' m-line--light' : ''), host); }

    // ===== طابور المسح: خط مسح واحد بس في الشاشة، والثاني يستنى. أي لمس أو زر يكمّل الحالي على طول (interruptible).
    // لما يجي دور مسح وعنصره طلع من الشاشة (تمرير سريع): يكمل على طول بدون خط، عشان ما يبقى مقصوص وهو ينتظر (M20) =====
    var Q = [], running = null;
    function queue(make, el) { Q.push({ f: later(make), el: el }); if (!running) next(); }
    var next = safe(function () {
      running = null; var it = Q.shift(); if (!it) return;
      var tl = it.f(); if (!tl) return next();
      running = tl; var own = tl.eventCallback('onComplete');   // نكمّل تنظيف الحركة نفسها (شيل الخط والطبقة) وبعدها اللي بعدها
      tl.eventCallback('onComplete', function () { if (own) own.apply(tl, arguments); if (running === tl) next(); });
      if (it.el && offscreen(it.el)) tl.progress(1);
    });
    function finishRunning() { if (running && !dead) running.progress(1); }
    ['pointerdown', 'keydown'].forEach(function (t) { w.addEventListener(t, safe(finishRunning), { passive: true }); });

    // ===== طبقة شاشة الجوال (phone-frame.svg): غطا مطفي بلون الجوال وخط فاتح، فوق الـ svg بدون ما نرسمه من جديد =====
    function kit(box, on) {
      var root = mk('span', 'm-kit', box), scr = mk('span', 'm-kit-screen', root), cover = mk('span', 'm-kit-cover', scr), ln = line(scr, true);
      g.set(cover, { clipPath: on ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }); g.set(ln, { opacity: 0 });
      return {
        root: root, cover: cover, line: ln, screen: scr,
        open: function (dur) {   // الشاشة تنفتح بالمسح من فوق لتحت
          var h = scr.offsetHeight, t = dur || scanTime(h);
          return g.timeline()
            .fromTo(cover, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: t, ease: SCAN }, 0)
            .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: t, ease: SCAN }, 0)
            .to(ln, { opacity: 0, duration: T.fade }, t - T.fade);
        }
      };
    }

    // ===== 1) البداية (data-open، GM-040 §1 و«الاتجاه 3» §3): «باركودنا هو شعارنا» =====
    // 0 → 0.7s: خط المسح المحايد ينزل على الحقل، ووراه الوحدات ترتب نفسها باركود حقيقي (H)، والزايد يختفي.
    // 0.7 → 1.3s: وحدات الوسط تتجمع على شكل الرمز، ثم يتبدل بالرمز الحقيقي (تلاشي 200ms).
    // 1.3 → 1.7s: LAMSATAP تنكشف من اليسار لليمين، والسطر يطلع. بعدها مع التمرير: القسم يتثبت 60vh (40vh على الجوال)،
    // والرمز والكلمة يطيرون ويصغرون لخانة الشعار في الرأس الثابت، والباركود يتلاشى، والوعد ثابت مكانه.
    var OPEN_HIDDEN = '[data-open-qr] svg, [data-open-sym], [data-open-word], [data-open-cap] > *, [data-open-logo] img';
    // AD-07: الرأس يرجع رملي بخطه وظله (motion.css .m-docked) لما يكون الشعار الحقيقي ظاهر فيه
    function dock(on) { var hd = $('[data-open-logo]'); hd = hd && hd.closest('header'); if (hd) hd.classList.toggle('m-docked', !!on); }
    function showOpening() { var targets = $$(OPEN_HIDDEN); if (targets.length) g.set(targets, { opacity: 1, clipPath: 'none' }); dock(true); }   // M3: hook ناقص = الحالة النهائية، مو مخفي بدون خطأ
    function opening(c) {
      var sec = $('[data-open]');
      if (!sec) { if ($('[data-open-logo]')) showOpening(); return; }
      if (sec.hasAttribute('data-symbol-flight')) return;
      if (!c.tall) return;
      var qr = $('[data-open-qr]', sec), svg = qr && $('svg', qr), sym = $('[data-open-sym]', sec), word = $('[data-open-word]', sec),
          cap = $$('[data-open-cap] > :not(a)', sec), btn = $$('[data-open-cap] > a', sec), art = $('[data-open-art]', sec) || qr, dest = $('[data-open-logo]'), destImg = dest && $('img', dest);
      if (!svg || !sym || !word) { showOpening(); return; }
      var F = field(art, svg, sym), flightRef = null;
      var st = { s: 0, q: 0, x: 0 }, draw = safe(function () { F.draw(st.s, st.q, st.x); });
      var intro = g.timeline({ paused: true, onUpdate: draw, onComplete: safe(function () { introPlayed = true; F.remove(); g.set([svg, sym].concat(cap), { opacity: 1 }); g.set(word, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }); if (flightRef) flightRef(); }) });
      intro.addLabel('scan', 0).addLabel('assemble', .7).addLabel('swap', 1.1).addLabel('word', 1.3)
        .set([svg, sym].concat(cap), { opacity: 0 }, 'scan').set(word, { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' }, 'scan')
        .to(st, { s: 1, duration: .7, ease: SCAN }, 'scan')                          // المسح يرتّب الحقل باركود
        .to(st, { q: 1, duration: .4, ease: MOVE }, 'assemble')                      // الوسط يتجمع رمز
        .to(st, { x: 1, duration: .2, ease: MOVE }, 'swap')                          // يتبدل بالرمز الحقيقي
        .to(sym, { opacity: 1, duration: .2, ease: MOVE }, 'swap')
        .set(svg, { opacity: 1 }, 'word')
        .to(word, { clipPath: 'inset(0% 0% 0% 0%)', duration: .4, ease: MOVE }, 'word')   // LAMSATAP من اليسار لليمين (كلمة لاتينية)
        .fromTo(cap, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, ease: OUT }, 'word');
      // أي تمرير أو لمس أو زر يكمّل التسلسل على طول، والتمرير ما ينقفل أبداً (no-blocking-animation، interruptible)
      var skip = safe(function () { if (intro.progress() < 1) intro.progress(1); });
      ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (t) { on(w, t, skip, { passive: true, once: true }); });
      // يبدأ بعد أول رسم (إطارين). وهو أول مهمة في طابور المسح، فما يطلع خط مسح ثاني معه (M21)
      if (w.scrollY > 4 || introPlayed) intro.progress(1);
      else requestAnimationFrame(function () { requestAnimationFrame(later(function () { if (intro.progress() === 0) { draw(); queue(function () { if (intro.progress() >= 1) return null; intro.play(); return intro; }); } })); });

      // التثبيت والطيران للرأس (shared-element، transform بس). القياس داخل دوال القيم (بعد ما التثبيت ينفك في refresh، §2.1)
      if (!destImg) { dock(true); return; }
      var R = { s: {}, w: {}, d: {}, t: {}, drop: 0 }, txt = $('h1', sec);
      txt = txt && txt.parentNode !== art && !txt.parentNode.contains(art) ? txt.parentNode : txt;   // الوعد كله (h1 وسطره وسطر الثقة)، أو h1 لحاله
      // AD-31 (قرار المدير الفني يعدّل §3 للجوال): تحت 1024 الفن فوق بعض مع الوعد، فآخر التثبيت كان نص الشاشة فاضي تحت الوعد.
      // الحين: القسم يتثبت وأعلى حشوته (24 من 40) تحت الرأس، و min-height الفن 380 (motion.css)، وفي النص الثاني من التثبيت الوعد
      // ينزل بـ transform لين يتوسط المساحة بين الرأس وأول القسم اللي بعده. القاعدة: آخر التثبيت ولا فراغ أكثر من 30% من الشاشة
      var PK = function () { return desk() ? 0 : 24; };
      var measure = function () {
        var secTop = docTop(sec), hb = headerH(), top = hb - PK(), di = destImg.getBoundingClientRect(), vw = 1068.75;   // viewBox logo-horizontal.svg
        // الرمز (0..200) والكلمة (260..1068.75، 47.4..152.4) داخل ملف الشعار الأفقي نفسه (مجمّد v1.0.0)، فالوصول بالبكسل
        R.d.s = { x: di.left, y: di.top, w: di.width * 200 / vw };
        R.d.w = { x: di.left + di.width * 260 / vw, y: di.top + di.height * 47.4 / 200, w: di.width * 808.75 / vw };
        [['s', sym], ['w', word]].concat(txt ? [['t', txt]] : []).forEach(function (p) { var el = p[1]; R[p[0]] = { x: docLeft(el) - w.scrollX, y: docTop(el) - secTop + top, w: el.offsetWidth, h: el.offsetHeight }; });
        R.hb = hb;
        R.drop = !desk() && txt && R.t.h ? Math.max(0, Math.round((hb + Math.min(vh(), top + sec.offsetHeight)) / 2 - (R.t.y + R.t.h / 2))) : 0;
      };
      var layer = mk('div', 'm-fly', d.body), fly = {};
      [['s', sym], ['w', word]].forEach(function (p) {
        var cl = p[1].cloneNode(true); cl.removeAttribute('data-open-sym'); cl.removeAttribute('data-open-word'); cl.removeAttribute('style');
        $$('img', cl).forEach(function (im) { im.alt = ''; im.removeAttribute('data-company-alt'); });
        layer.appendChild(cl); fly[p[0]] = cl;
      });
      var place = function () { ['s', 'w'].forEach(function (k) { g.set(fly[k], { left: R[k].x, top: R[k].y, width: R[k].w, height: R[k].h }); }); };
      measure(); place(); g.set([fly.s, fly.w], { transformOrigin: '0 0' });
      // AD-05: المسار قوس (bezier مكعب) بممر بين الرأس والوعد: الرمز يطلع بدري لـ 40% من المسافة بين أسفل الرأس وأعلى الوعد، يمشي
      // أفقي فوق الوعد (وتحت روابط الرأس)، وآخر شي يطلع لخانته. التصغير بدري (power3.out). الكلمة تمشي مع الرمز، ومكانها منه يتبدل
      // من «تحت» (الباركود) لـ «جنب» (الشعار): الأفقي أسرع (expo.out) من العمودي، فما تركب على الرمز أبداً.
      // على الجوال الممر ضيق والمسار لازم يعبر الوعد، فالتخفيف لـ .15 تحت (hits). كله من القياس وقيم محسوبة، ولا قراءة layout في الإطار
      var EO = g.parseEase('power3.out'), EX = g.parseEase('expo.out'), fp = { q: 0 }, cur = { s: { x: 0, y: 0, k: 1 }, w: { x: 0, y: 0, k: 1 } }, setF = {};
      ['s', 'w'].forEach(function (k) { setF[k] = { x: g.quickSetter(fly[k], 'x', 'px'), y: g.quickSetter(fly[k], 'y', 'px'), kx: g.quickSetter(fly[k], 'scaleX'), ky: g.quickSetter(fly[k], 'scaleY') }; });
      var bez = function (a, c1, c2, b, t) { var u = 1 - t; return u * u * u * a + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * b; };
      var move = function (q) {
        var S = R.s, Wd = R.w, D = R.d, tt = txt && R.t.w ? R.t.y : NaN, e = EO(q);
        var yc = tt > R.hb + 8 ? R.hb + (tt - R.hb) * .4 : D.s.y;
        var sx = bez(S.x, S.x, D.s.x, D.s.x, q), sy = bez(S.y, yc, yc, D.s.y, q);
        var rx0 = Wd.x - S.x, ry0 = Wd.y - S.y, rx1 = D.w.x - D.s.x, ry1 = D.w.y - D.s.y;
        cur.s = { x: sx - S.x, y: sy - S.y, k: 1 + e * (D.s.w / S.w - 1) };
        cur.w = { x: sx + rx0 + EX(q) * (rx1 - rx0) - Wd.x, y: sy + ry0 + e * (ry1 - ry0) - Wd.y, k: 1 + e * (D.w.w / Wd.w - 1) };
        ['s', 'w'].forEach(function (k) { setF[k].x(cur[k].x); setF[k].y(cur[k].y); setF[k].kx(cur[k].k); setF[k].ky(cur[k].k); });
      };
      // الشفافية تنكتب من التقدّم مباشرة (مو من قيم بداية مسجّلة). TL-11: quickSetter للي يتغير كل إطار، والباقي بس لما يتبدل.
      // AD-06: زر «افتح المثال» جزء من مجموعة الفن، فيتلاشى معها، ولما يوصل 0 يصير visibility: hidden (ما ينضغط ولا ينوصل له
      // بالكيبورد وهو مخفي)، ويرجع مع الرجوع. قاعدة «النص ما ينخفي» للوعد بس (قرار المدير الفني)
      var fade = g.quickSetter([svg].concat(cap, btn), 'opacity'), last = {}, dim = {};
      // الباركود رابط (بديل الكيبورد والضغط): لما يختفي مع الفن ما يبقى رابط شفاف ينضغط أو ينوصل له بالكيبورد، مثل زر «افتح المثال»
      var hideAt0 = btn.concat(qr && qr.tagName === 'A' ? [qr] : []);
      // AD-31: نزول الوعد (transform بس) من نص التثبيت لآخره، بنفس منحنى الحركة
      var EM = g.parseEase(MOVE), setDrop = txt ? g.quickSetter(txt, 'y', 'px') : null, dropNow = 0;
      if (txt) moved.push(txt);
      // AD-05: النسخة الطايرة تخف لين .15 طول ما مستطيلها يقطع مستطيل الوعد (على الجوال المسار لازم يعبر النص). الحساب من قيم GSAP
      // المخزنة ومن القياس (ولا قراءة layout في الإطار)
      var hits = function (k) {
        var t = R.t; if (!txt || !t.w) return false;
        var x = R[k].x + cur[k].x, y = R[k].y + cur[k].y, s = cur[k].k, ty = t.y + dropNow;
        return x < t.x + t.w + 4 && x + R[k].w * s > t.x - 4 && y < ty + t.h + 4 && y + R[k].h * s > ty - 4;
      };
      var dimFly = function (k, on) { if (dim[k] === on) return; dim[k] = on; g.to(fly[k], { opacity: on ? .15 : 1, duration: on ? T.press : T.fade, ease: on ? OUT : MOVE, overwrite: 'auto' }); };
      var flightState = safe(function (p) {
        if (!introPlayed && p <= .001) return;   // التسلسل ماسك الفن لين يخلص
        move(fp.q);
        var f = 1 - clamp(p / .5); fade(f);
        var dr = Math.round(R.drop * EM(clamp((p - .5) / .5)) * 10) / 10;
        if (setDrop && dr !== dropNow) { dropNow = dr; setDrop(dr); }
        var o = p > .001 ? 0 : 1, a = p > .001 && p < .999 ? 1 : 0, l = p >= .999 ? 1 : 0, b = f > .001 ? 1 : 0;
        if (o !== last.o) { last.o = o; g.set([sym, word], { opacity: o }); }
        if (a !== last.a) { last.a = a; g.set([fly.s, fly.w], { visibility: a ? 'visible' : 'hidden' });
          if (!a) { dim = {}; g.killTweensOf([fly.s, fly.w], 'opacity'); g.set([fly.s, fly.w], { opacity: 1 }); } }
        if (a) { dimFly('s', hits('s')); dimFly('w', hits('w')); }
        if (b !== last.b && hideAt0.length) { last.b = b; g.set(hideAt0, { visibility: b ? 'inherit' : 'hidden' }); }
        if (l !== last.l) { last.l = l; g.set(destImg, { opacity: l }); dock(l); }   // الشعار الحقيقي يظهر ونسخة الطيران تختفي بنفس اللحظة، والرأس يرجع رملي
      });
      var tl = g.timeline({ onUpdate: function () { flightState(this.progress()); }, scrollTrigger: {
        trigger: sec, pin: true, start: function () { return 'top top+=' + (headerH() - PK()); }, end: function () { return '+=' + Math.round(vh() * (desk() ? .6 : .4)); },
        scrub: SCRUB, invalidateOnRefresh: true, refreshPriority: 3, anticipatePin: 1
      } });
      // الطيران نفسه يمشي من fp.q (0 لين 1) في move(). M10: القياس داخل دالة القيمة (التثبيت منفك وقتها)، مو في onRefreshInit
      tl.fromTo(fp, { q: 0 }, { q: function () { measure(); place(); return 1; }, ease: 'none', duration: 1, immediateRender: false }, .001);
      flightRef = function () { last = {}; flightState(tl.progress()); };   // الشعار الحقيقي يظهر ونسخة الطيران تختفي بنفس اللحظة
    }

    // ===== حقل الوحدات (canvas وحدة، بدون آلاف عناصر): عشوائي بـ seed ثابت، كثافة 45%، والوحدة = وحدة الباركود =====
    function field(art, svg, sym) {
      var vb = svg.viewBox.baseVal, V = Math.round(vb.width), ox = Math.round(vb.x), oy = Math.round(vb.y), n = V + 2 * ox;
      var Q2 = new Uint8Array(n * n);
      $$('path', svg).forEach(function (p) { var re = /M(\d+) (\d+)h(\d+)/g, m, dd = p.getAttribute('d') || '';
        while ((m = re.exec(dd))) { for (var c = 0; c < +m[3]; c++) Q2[+m[2] * n + (+m[1]) + c] = 1; } });
      var hs = (svg.getAttribute('data-qr-hole') || '').split(' ').map(Number), h0 = hs[0] || 0, hk = hs[1] || 0;
      var host = svg.parentNode, cv = mk('canvas', 'm-field', host), ctx = cv.getContext('2d');
      var hr = host.getBoundingClientRect(), sr = svg.getBoundingClientRect(), ar = art.getBoundingClientRect(), m = sr.width / V;
      var dpr = Math.min(w.devicePixelRatio || 1, 1.5), ink = getComputedStyle(svg).color, last = '';
      // الشبكة على حدود وحدات الباركود بالضبط، وتغطي مساحة الفن كلها
      var u0 = Math.floor((ar.left - sr.left) / m), u1 = Math.ceil((ar.right - sr.left) / m), v0 = Math.floor((ar.top - sr.top) / m), v1 = Math.ceil((ar.bottom - sr.top) / m);
      var CW = u1 - u0, CH = v1 - v0, W2 = CW * m, H2 = CH * m;
      cv.width = Math.round(W2 * dpr); cv.height = Math.round(H2 * dpr);
      cv.style.width = W2 + 'px'; cv.style.height = H2 + 'px';
      cv.style.left = (sr.left - hr.left + u0 * m) + 'px'; cv.style.top = (sr.top - hr.top + v0 * m) + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var N = CW * CH, A = new Uint8Array(N), B = new Uint8Array(N), J = new Float32Array(N), HOLE = new Uint8Array(N);
      for (var j = 0; j < CH; j++) for (var i = 0; i < CW; i++) {
        var k = j * CW + i, u = i + u0, v = j + v0, qc = u + ox, qr = v + oy;
        A[k] = hash(u, v, 11) < .45 ? 1 : 0;
        B[k] = qc >= 0 && qr >= 0 && qc < n && qr < n ? Q2[qr * n + qc] : 0;
        J[k] = hash(u, v, 29);
        HOLE[k] = hk && qc >= h0 && qr >= h0 && qc < h0 + hk && qr < h0 + hk ? 1 : 0;
      }
      // تجمّع الرمز: وحدات الوسط الغامقة تروح لخانات الرمز على شبكته (كل خانة 2×2 وحدات)، والنهاية ملف الشعار نفسه
      var S = [], TG = [], inner = hk - 2, cx = h0 + hk / 2, cy = cx;
      if (hk) {
        for (j = 0; j < CH; j++) for (i = 0; i < CW; i++) { k = j * CW + i; if (HOLE[k] && B[k]) S.push([i, j]); }
        // شبكة الرمز 4×4 (المدير الفني §11.2): كل قطعة 3 خانات من ربعها، والخانة الناقصة تدور مع القطع (مثل symbol-black.svg)
        var NOTCH = { '0,1': 1, '2,0': 1, '3,2': 1, '1,3': 1 }, cellM = inner / 4;
        for (var gy = 0; gy < 4; gy++) for (var gx = 0; gx < 4; gx++) { if (NOTCH[gx + ',' + gy]) continue;
          for (var my = 0; my < cellM; my++) for (var mx = 0; mx < cellM; mx++) TG.push([h0 + 1 + gx * cellM + mx - ox - u0, h0 + 1 + gy * cellM + my - oy - v0]); }
        var ang = function (p) { return Math.atan2(p[1] - (cy - oy - v0), p[0] - (cx - ox - u0)); };
        S.sort(function (a, b) { return ang(a) - ang(b); }); TG.sort(function (a, b) { return ang(a) - ang(b); });
      }
      var EZ = g.parseEase(MOVE);
      function px(a) { return Math.round(a * m); }
      // التدوير 6% يبان من بكسل جهاز وحد وفوق (شاشات عالية الدقة). تحته مربع حاد مثل الـ SVG النهائي، وأسرع بكثير
      var RAD = MODR * m, round = RAD * dpr >= 1 && ctx.roundRect;
      function cell(i, j, k) { var x = px(i), y = px(j), ww = px(i + 1) - x, hh2 = px(j + 1) - y, hh3 = hh2 * k;
        if (round) ctx.roundRect(x, y + (hh2 - hh3) / 2, ww, hh3, Math.min(RAD, hh3 / 2)); else ctx.fillRect(x, y + (hh2 - hh3) / 2, ww, hh3); }
      return {
        remove: function () { if (cv.parentNode) cv.parentNode.removeChild(cv); },
        draw: function (s, q, x) {
          var key = s.toFixed(4) + q.toFixed(4) + x.toFixed(3); if (key === last) return; last = key;   // ولا رسم لو ما تغيّر شي
          ctx.clearRect(0, 0, W2, H2); ctx.fillStyle = ink; ctx.globalAlpha = 1;
          var FL = .1, ly = s * H2;
          if (round) ctx.beginPath();   // كل الوحدات المدورة في مسار واحد وتعبئة وحدة
          for (var j = 0; j < CH; j++) {
            var t0 = ((j + .5) / CH) * (1 - FL);
            for (var i = 0; i < CW; i++) {
              var k = j * CW + i; if (q > 0 && HOLE[k]) continue;
              var a = A[k], b = B[k], f = clamp((s - t0 - J[k] * .03) / FL);
              if (f <= 0) { if (a) cell(i, j, 1); }
              else if (f >= 1 || a === b) { if (b) cell(i, j, 1); }
              else if (f < .5 ? a : b) cell(i, j, Math.abs(1 - 2 * f));   // الوحدة تنقلب (scaleY) من العشوائي للباركود
            }
          }
          if (round) ctx.fill();
          if (q > 0 && S.length && TG.length) {   // موجات مجمعة، مو وحدة وحدة
            ctx.globalAlpha = 1 - x;
            for (var t = 0; t < TG.length; t++) {
              var src = S[Math.floor(t * S.length / TG.length)], dst = TG[t], e = EZ(clamp((q - (t % 4) * .06) / .82));
              var X = (src[0] + (dst[0] - src[0]) * e) * m, Y = (src[1] + (dst[1] - src[1]) * e) * m;
              ctx.fillRect(Math.round(X), Math.round(Y), Math.ceil(m), Math.ceil(m));
            }
            ctx.globalAlpha = 1;
          }
          if (s > 0 && s < 1) {   // خط المسح المحايد: قلبه حبر 2px، وذيله حبر 12% على 32px
            var gr = ctx.createLinearGradient(0, ly - 32, 0, ly);
            gr.addColorStop(0, 'rgba(20,32,31,0)'); gr.addColorStop(1, 'rgba(20,32,31,.12)');
            ctx.fillStyle = gr; ctx.fillRect(0, ly - 32, W2, 32); ctx.fillStyle = ink; ctx.fillRect(0, ly - 2, W2, 2);
          }
        }
      };
    }

    // ===== 2) ظهور النص والبطاقات (data-reveal، و"stagger" للأبناء): ارتفاع 20px وشفافية 600ms، بدون خط مسح =====
    var pending = [], focusBound = false, introPlayed = false;
    function reveals() {
      var one = $$('[data-reveal]:not([data-reveal="stagger"]), [data-scan="reveal"]');
      var kids = [];
      $$('[data-reveal="stagger"], [data-scan="list"]').forEach(function (gr) { kids = kids.concat([].slice.call(gr.children)); });
      var all = one.concat(kids); if (!all.length) return;
      // اللي يدخلون مع بعض في نفس الإطار ينحسبون مجموعة وحدة (60ms بينهم، و4 بالكثير)
      var batch = [], tick = null;
      // PERF-11: دفعة كبيرة (تمرير سريع) تنقسم على إطارات، 8 بالإطار، عشان ما يصير task فوق 50ms
      var flush = later(function () { var b = batch.splice(0, 8); tick = batch.length ? requestAnimationFrame(flush) : null;
        g.to(b, { opacity: 1, y: 0, duration: T.rise, ease: OUT, stagger: stag, overwrite: true, clearProps: 'opacity,transform' }); });
      // data-reveal="rise": ارتفاع بس بدون شفافية (بطاقات فيها سعر: السعر يبقى بشفافية 1 في كل إطار، brief §6 مهمة 3)
      all.forEach(function (el) { var up = el.getAttribute('data-reveal') === 'rise'; watch(el, function () { g.set(el, up ? { y: RISE } : { opacity: 0, y: RISE }); }, function () { batch.push(el); if (!tick) tick = requestAnimationFrame(flush); }, 0, 12); });
      // التركيز بالكيبورد يظهر العنصر على طول
      pending = all; if (focusBound) return; focusBound = true;
      d.addEventListener('focusin', safe(function (e) { var t = e.target; pending.forEach(function (el) { if (el.contains(t) && H.classList.contains('m')) g.to(el, { opacity: 1, y: 0, duration: T.press, overwrite: true, clearProps: 'opacity,transform' }); }); }));
    }

    // ===== 3) المسح على الوسائط (data-scan="media" | "tint" | "phone")، و"check" بدون خط =====
    // media: الصورة أو المشهد ينكشف من فوق لتحت وخط المسح على حافته. مرة وحدة لكل تحميل، وبالطابور
    function scanMedia(el) {
      watch(el, function () { g.set(el, { clipPath: 'inset(0% 0% 100% 0%)' }); }, function () { queue(function () { return reveal(el); }, el); }, 0, 35);
    }
    // خط المسح ينشال في كل نهاية: اكتمال، أو مقاطعة (overwrite أو kill عبر الطابور)، و unjunk مع الإرجاع (M10)
    function drop(ln) { if (ln && ln.parentNode) ln.parentNode.removeChild(ln); }
    function scanTl(ln, end) { var f = safe(function () { drop(ln); if (end) end(); }); return g.timeline({ onComplete: f, onInterrupt: f }); }
    function reveal(el) {
      var ln = line(el), h = el.offsetHeight, t = scanTime(h);
      return scanTl(ln, function () { g.set(el, { clearProps: 'clipPath' }); })
        .fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: t, ease: SCAN }, 0)
        .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: t, ease: SCAN }, 0).to(ln, { opacity: 0, duration: T.fade }, t - T.fade);
    }
    // tint: طبقتين (الأبيض والأسود تحت، و img[data-tint] الملونة فوق). اللون ينكشف مع الخط ويبقى، والمسح يبدأ بعد img.decode()
    function tintScan(el, dur) {
      var col = $('[data-tint]', el); if (!col) return null;
      var ln = line(el), h = el.offsetHeight, t = dur || scanTime(h);
      return scanTl(ln, function () { g.set(col, { clipPath: 'inset(0% 0% 0% 0%)' }); })
        .fromTo(col, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: t, ease: SCAN }, 0)
        .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: t, ease: SCAN }, 0).to(ln, { opacity: 0, duration: T.fade }, t - T.fade);
    }
    // طبقة اللون: تنزل قبل القسم بنص شاشة (المدير الفني §4). وهي مقصوصة كلها، فالتحميل الكسول ما يشوفها: نطلبها بنفسنا
    function prefetch(img) { if (!img || img.loading !== 'lazy') return; onView(img.parentNode, function () { img.loading = 'eager'; }, 0, -50); }
    // المسح يبدأ بعد img.decode()، وبحد 1.5 ثانية عشان الطابور ما يعلق أبداً
    function decoded(img, fn) {
      var done = false, go = later(function () { if (!done) { done = true; fn(); } });
      if (!img || !img.decode) return go();
      if (img.loading === 'lazy') img.loading = 'eager';
      img.decode().then(go, go); setTimeout(go, 1500);
    }
    // مسح اللون العادي على حاوية (المسرح أو الإطار اللي فيه الطبقتين)، لما تدخل الشاشة
    function tintWhenSeen(el) {
      var col = $('[data-tint]', el); if (!col) return;
      var done = false, go = function () { if (done) return; done = true; decoded(col, function () { queue(function () { return tintScan(el); }, el); }); };
      watch(el, null, go, 0, 35, go);
    }
    function scanTint(el) {
      var col = $('[data-tint]', el); if (!col) return; prefetch(col);
      // البابين يحركونها بنفسهم، والبطل والقصة كذلك: مربوطين بالتمرير، وعلى الشاشات القصيرة بالمسح العادي من expand() و story() (M7)
      if (el.closest('[data-door], [data-expand], [data-story]')) return;
      tintWhenSeen(el);
    }
    // phone: الشاشة تنفتح بالمسح مرة وحدة (المضيفين 1100ms)
    function scanPhone(el) {
      if (!$('.fo-screen', el) || el.closest('[data-story]')) return;
      var kt = null;
      watch(el, function () { kt = kit(el, false); }, function () {
        queue(function () { return kt.open(CALM ? 1.1 : null).eventCallback('onComplete', safe(function () { kt.root.parentNode && kt.root.parentNode.removeChild(kt.root); })); }, el);
      }, 0, 35);
    }
    // check: علامات الصح تنرسم وحدة بعد وحدة (clip من اليسار، مثل اتجاه رسمها)، 60ms بينها و4 بالكثير. بدون خط على النص
    function scanCheck(el) {
      var ic = $$('li svg', el); if (!ic.length) return;
      watch(el, function () { g.set(ic, { clipPath: 'inset(0% 100% 0% 0%)' }); }, function () {
        g.to(ic, { clipPath: 'inset(0% 0% 0% 0%)', duration: T.draw, ease: OUT, stagger: stag, clearProps: 'clipPath' });
      }, 0, 15);
    }

    // ===== 4) البابين (data-doors و data-door، «أقوى لحظة»، «الاتجاه 3» §6): لما الباب يبان 35%، يرتفع 24px في 600ms (الثاني بعده بـ 120ms
    // لو دخلوا مع بعض)، وبعد الارتفاع: مسح صورة الأول بالدفا (المطاعم) ثم الثاني بالضوء (المضيفين)، 900ms لكل واحد، واحد بعد الثاني.
    // المجموع 0.6 + 0.9 + 0.9 = 2.4 ثانية (الحد 2.5). على الجوال (فوق بعض) كل باب لحاله لما يدخل الشاشة.
    // التحويم أو التركيز يعيد خط المسح على الصورة (بحركة من المستخدم) =====
    function doors() {
      $$('[data-doors]').forEach(function (wrap) {
        var ds = $$('[data-door]', wrap); if (!ds.length) return;
        var stageOf = function (dr) { return $('[data-scan="tint"]', dr); };
        var scans = function (list, delay) {   // بعد ما تنزل كل الصور (بحد 1.5 ثانية) وبعد الارتفاع، بالترتيب: دافي ثم مضيء
          var left = list.length + 1, go = later(function () { if (--left) return;
            list.forEach(function (dr) { var ph = stageOf(dr); if (ph && $('[data-tint]', ph)) queue(function () { return tintScan(ph, .9 * K); }, ph); }); });
          list.forEach(function (dr) { var ph = stageOf(dr), col = ph && $('[data-tint]', ph); if (col) decoded(col, go); else go(); });
          if (delay) g.delayedCall(delay, go); else go();
        };
        var batch = [], rise = false, tick = null;
        var flush = later(function () { var b = batch.sort(function (a, z) { return ds.indexOf(a) - ds.indexOf(z); }), up = rise; batch = []; rise = false; tick = null;
          if (up) g.to(b, { opacity: 1, y: 0, duration: T.rise, ease: OUT, stagger: .12, clearProps: 'opacity,transform' });
          scans(b, up ? T.rise : 0); });
        var add = function (dr, up) { batch.push(dr); rise = rise || up; if (!tick) tick = requestAnimationFrame(flush); };
        ds.forEach(function (dr) {
          watch(dr, function () { g.set(dr, { opacity: 0, y: 24 }); }, function () { add(dr, true); }, .35, 0, function () { add(dr, false); });
          var again = later(function () { var ph = stageOf(dr); if (!ph || running) return; var ln = line(ph), h = ph.offsetHeight;
            queue(function () { return scanTl(ln)
              .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: .7 * K, ease: SCAN }).to(ln, { opacity: 0, duration: T.fade }, '>-' + T.fade); }, ph); });
          if (w.matchMedia('(hover: hover) and (pointer: fine)').matches) { on(dr, 'mouseenter', again); on(dr, 'focusin', again); }
        });
      });
    }

    // ===== 5) البطل المتوسع (data-expand) انشال في جولة الإصلاح 2: الصفحتين الحين inline (data-expand-inline) وما فيه صفحة تستخدمه، فكان كود ميت يزيد الحجم =====

    // Only the square mark flies. Photo scenes use native image coordinates;
    // the home QR uses its actual DOM box. The card and wordmark stay in place.
    function symbolFlight(c) {
      var sec = $('[data-symbol-flight]'); if (!sec || !c.tall) return;
      var stage = $('[data-lift-stage]', sec), symbol = $('[data-lift-object], [data-open-sym]', sec), plate = $('[data-lift-photo], .r-hero-photo [data-tint], .p-hero-photo [data-tint]', sec), dest = $('.s-logo-h');
      var card = $('[data-card-symbol-box]', sec), box = card && card.getAttribute('data-card-symbol-box').split(' ').map(Number);
      var nativeSource = symbol && symbol.hasAttribute('data-open-sym');
      if (!stage || !symbol || !dest || (!nativeSource && (!plate || !box || box.length !== 3 || !box.every(Number.isFinite)))) return;
      var originalStyle = symbol.getAttribute('style');
      var sourceImage = symbol.tagName === 'IMG' ? symbol : $('img', symbol);
      function restoreSymbol() { if (originalStyle === null) symbol.removeAttribute('style'); else symbol.setAttribute('style', originalStyle); }
      var crop = Number(sec.getAttribute('data-lift-position') || .46);
      if (!Number.isFinite(crop)) crop = .46;
      var cancelled = false, assetsReady = false, draw = null, flightMedia = g.matchMedia(), listeners = [];
      function ready(img) {
        function decode() { return img.decode ? img.decode() : Promise.resolve(); }
        if (img.complete) return img.naturalWidth ? decode() : Promise.reject();
        return new Promise(function (resolve, reject) {
          function clean() { img.removeEventListener('load', loaded); img.removeEventListener('error', failed); }
          function loaded() { clean(); decode().then(resolve, reject); }
          function failed() { clean(); reject(); }
          img.addEventListener('load', loaded); img.addEventListener('error', failed); listeners.push(clean);
        });
      }
      offs.push(function () {
        cancelled = true; listeners.forEach(function (clean) { clean(); });
        flightMedia.revert(); sec.classList.remove('is-lift-ready'); dest.classList.remove('is-symbol-away');
        restoreSymbol();
      });
      // Create the scroll trigger synchronously, before the initial-hash refresh.
      // Image decoding only switches layers; it never changes document geometry.
      flightMedia.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023.98px)' }, function (ctx) {
        if (cancelled || dead) return;
        var desktop = ctx.conditions.desktop, host = desktop ? sec : stage;
        var layer = mk('div', 'm-fly r-symbol-flight', d.body), fly = symbol.cloneNode(true);
        fly.removeAttribute('data-lift-object'); fly.removeAttribute('data-open-sym'); fly.removeAttribute('style');
        fly.className = (nativeSource ? symbol.className + ' ' : '') + 'r-symbol-fly'; layer.appendChild(fly);
        var R = {}, fp = { q: 0 }, last = '', ease = g.parseEase('power3.out');
        var setX = g.quickSetter(fly, 'x', 'px'), setY = g.quickSetter(fly, 'y', 'px');
        var setScaleX = g.quickSetter(fly, 'scaleX'), setScaleY = g.quickSetter(fly, 'scaleY');
        function measure() {
          var sw = stage.clientWidth, sh = stage.clientHeight;
          var scale = Math.max(sw / 1600, sh / 900), ox = (sw - 1600 * scale) * crop, oy = (sh - 900 * scale) * .5;
          var left, top, size;
          if (nativeSource) {
            left = docLeft(symbol) - docLeft(stage); top = docTop(symbol) - docTop(stage); size = symbol.offsetWidth;
          } else {
            left = ox + box[0] * scale; top = oy + box[1] * scale; size = box[2] * scale;
            symbol.style.left = left + 'px'; symbol.style.top = top + 'px';
            symbol.style.width = size + 'px'; symbol.style.height = size + 'px';
          }
          var pinTop = headerH() + (desktop ? 0 : 24), di = dest.getBoundingClientRect();
          R = { x: docLeft(stage) - w.scrollX + left, y: docTop(stage) - docTop(host) + pinTop + top,
            size: size, dx: di.left, dy: di.top, ds: di.width * 200 / 1068.75 };
          // Rise first, then cross above the headline, just like the old opening.
          var heading = $('h1', sec), textTop = desktop ? docTop(heading) - docTop(host) + pinTop : pinTop;
          R.lane = desktop ? headerH() + Math.max(0, textTop - headerH()) * .28 : headerH() + 12;
          g.set(fly, { left: R.x, top: R.y, width: size, height: size, transformOrigin: '0 0' });
          last = '';
        }
        function bez(a, b, c1, z, t) { var u = 1 - t; return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c1 + t*t*t*z; }
        var paint = safe(function () {
          var q = clamp(fp.q), moving = q > .0001 && q < .9999, docked = q >= .9999;
          var k = 1 + ease(q) * (R.ds / R.size - 1);
          setX(bez(R.x, R.x, R.dx, R.dx, q) - R.x);
          setY(bez(R.y, R.lane, R.lane, R.dy, q) - R.y);
          setScaleX(k); setScaleY(k);
          var state = assetsReady + ':' + moving + ':' + docked;
          if (state === last) return; last = state;
          sec.classList.toggle('is-lift-ready', assetsReady);
          dest.classList.toggle('is-symbol-away', assetsReady && !docked);
          symbol.style.opacity = assetsReady && (moving || docked) ? '0' : '1';
          fly.style.visibility = assetsReady && moving ? 'visible' : 'hidden';
          fly.style.willChange = assetsReady && moving ? 'transform' : 'auto';
        });
        measure();
        var tl = g.timeline({ onUpdate: paint, scrollTrigger: {
          // Mobile keeps native scrolling: pinning the photo adds half a screen
          // of empty space. Only the detached symbol flies while the scene scrolls.
          id: 'audience-symbol-flight', trigger: host, pin: false,   // site-wow: no pin, no spacer gap under hero
          start: function () { return 'top top+=' + (headerH() + (desktop ? 0 : 24)); },
          end: function () { return '+=' + Math.round(vh() * (desktop ? .72 : .5)); },
          // The unpinned mobile source moves with the document. Catch-up easing
          // would leave its fixed clone at stale coordinates on a fast reversal.
          scrub: true, invalidateOnRefresh: true, refreshPriority: 3, anticipatePin: 1,
          onRefresh: paint
        } });
        // Refresh measures while GSAP has reverted pin positioning.
        tl.fromTo(fp, { q: 0 }, { q: function () { measure(); return 1; }, duration: 1, ease: 'none', immediateRender: false });
        draw = paint; paint();
        return function () {
          if (draw === paint) draw = null;
          layer.remove(); sec.classList.remove('is-lift-ready'); dest.classList.remove('is-symbol-away'); restoreSymbol();
        };
      });
      Promise.all([plate, sourceImage].filter(Boolean).map(ready)).then(safe(function () {
        if (cancelled || dead) return;
        assetsReady = true; if (draw) draw();
      })).catch(function () {
        // A missing optional asset keeps the complete, ordinary hero photograph.
        if (cancelled || dead) return;
        var anchor = $$('main section, main nav').find(function (el) {
          var r = el.getBoundingClientRect(); return r.top < vh() && r.bottom > headerH();
        });
        var before = anchor && anchor.getBoundingClientRect().top;
        flightMedia.revert(); ST.refresh();
        if (anchor) w.scrollBy(0, anchor.getBoundingClientRect().top - before);
      });
    }

    // ===== 6) القصة المثبّتة (data-story): ثلاث خطوات مربوطة بالتمرير، وترجع طبيعي مع الرجوع.
    // خطوة 1: المشهد ينكشف بلون جمهوره وخط المسح على حافته. خطوة 2: الجوال يقرّب ويلمس ([data-story-target])، والنقطة تنبض مرة (المطاعم).
    // خطوة 3: الشاشة تنفتح بالمسح. النص ظاهر كله، والخطوة الحالية واضحة والباقي أخف وقت التثبيت بس.
    // AD-41 (بدون جوال مرسوم، GM-054): خطوة 2 حلقة اللمس [data-story-ring] تطلع على منطقة اللمس (.36 لين .42)، وفي المطاعم تنبض مرة
    // (1 ← 1.08 ← 1 في 400ms، بالوقت) عند .44 للأمام، وتبقى. خطوة 3 بطاقة الشاشة [data-story-card] تدخل بـ transform والشفافية
    // (.56 لين .68، من تحت 32px ومن .96) فاضية بيضاء، وبعدها تنفتح بالمسح (.70 لين .92): غطا أبيض ينقص من فوق لتحت (clip-path)
    // وخط المسح باللمسة على حافته. مكان البطاقة من CSS الصفحة (جنب المنتج، وما تغطيه)، والحركة عمودية ومقياس بس، فما تقرب منه.
    // الحالة النهائية (تقليل الحركة، وبدون JS، والشاشات القصيرة): الحلقة والبطاقة ظاهرين (site.css). motion.css يخفيهم تحت .mh بس.
    // الهدف: عنصر (مثل .p-touch) = وسطه وأعلاه. خانة طباعة (.lt-slot) = نقطة اللمس فيها (--tx و --ty من scenes.css أو print-art.js) =====
    function touchPoint(t) {
      var r = t.getBoundingClientRect(); if (!t.classList.contains('lt-slot')) return { x: r.left + r.width / 2, y: r.top };   // نقطة أو عنصر: وسطه وأعلاه
      var cs = getComputedStyle(t), tx = parseFloat(cs.getPropertyValue('--tx')), ty = parseFloat(cs.getPropertyValue('--ty'));
      return { x: r.left + r.width * (isNaN(tx) ? 50 : tx) / 100, y: r.top + r.height * (isNaN(ty) ? 50 : ty) / 100 };
    }
    // النبض (المدير الفني §6 و§10): نقطة اللمس تكبر من 1 لـ 1.08 وترجع في 400ms، مرة وحدة لكل حدث. على خانة طباعة: حلقة على نقطة اللمس
    // (مو رسم على اللوحة، وتختفي بعد النبض). على عنصر ثاني (نقطة جاهزة): العنصر نفسه
    function pulseOnce(dot) {
      if (dot.classList.contains('lt-slot')) {
        var ring = dot.__mRing && dot.__mRing.parentNode ? dot.__mRing : (dot.__mRing = mk('span', 'm-dot', dot));
        return g.timeline({ onComplete: function () { g.set(ring, { opacity: 0, scale: 1 }); } })
          .fromTo(ring, { opacity: 0, scale: 1 }, { opacity: 1, duration: .1, ease: OUT }, 0)
          .to(ring, { scale: 1.08, duration: T.pulse / 2, ease: PULSE }, 0).to(ring, { scale: 1, duration: T.pulse / 2, ease: PULSE })
          .to(ring, { opacity: 0, duration: T.pulse * T.exit, ease: IN }, '+=.2');
      }
      return g.timeline().to(dot, { scale: 1.08, duration: T.pulse / 2, ease: PULSE }).to(dot, { scale: 1, duration: T.pulse / 2, ease: PULSE, clearProps: 'transform' });
    }
    // A continuous camera move through the cafe visit, without the old scan layer.
    function editorialStory(sec, c) {
      var grid = $('[data-story-pin]', sec), media = $('[data-editorial-reveal]', sec), camera = $('[data-editorial-camera]', sec), steps = $$('[data-step]', sec);
      if (!grid || !media || !camera || !steps.length) return;
      $$('img', camera).forEach(prefetch);
      var chapter = null, timeline = null, pinned = null, frame = 0, observer = null, disposed = false, rebuilding = false;
      function fits() {
        // The pinned element can retain a fixed height until ScrollTrigger refreshes.
        // Include overflowing content, with 2px hysteresis to avoid rounding oscillation.
        var height = Math.max.apply(null, [grid.offsetHeight].concat([].slice.call(grid.children).map(function (child) { return child.offsetHeight; }))), room = vh() - headerH() - 48;
        return desk() && vh() >= 640 && room - height >= (pinned ? -2 : 2);
      }
      function build(desktop) {
        pinned = desktop;
        chapter = g.context(function () {
        var state = { p: 0 }, current = -1;
        var setters = steps.map(function (step) { return g.quickSetter(step, '--step-progress'); });
        sec.classList.add('is-editorial');
        var paint = safe(function () {
          var active = Math.min(steps.length - 1, Math.floor(state.p * steps.length));
          if (active !== current) { current = active; steps.forEach(function (step, i) { step.classList.toggle('is-on', i === active); }); }
          setters.forEach(function (set, i) { set(clamp(state.p * steps.length - i)); });
        });
        g.fromTo(media, { y: 20, scale: .985, opacity: .72 }, { y: 0, scale: 1, opacity: 1, ease: 'none', scrollTrigger: {
          trigger: sec, start: 'top 88%', end: 'top 28%', scrub: SCRUB, invalidateOnRefresh: true
        } });
        var tl = timeline = g.timeline({ onUpdate: paint, scrollTrigger: {
          id: 'restaurant-visit', trigger: desktop ? grid : sec, pin: desktop ? grid : false,
          start: function () { return desktop ? 'top top+=' + (headerH() + Math.max(24, (vh() - headerH() - grid.offsetHeight) / 2)) : 'top 55%'; },
          end: function () { return desktop ? '+=' + Math.round(vh() * 1.5) : 'bottom 65%'; },
          scrub: .6, invalidateOnRefresh: true, refreshPriority: 1, anticipatePin: 1,
          onToggle: safe(function (s) { camera.style.willChange = s.isActive ? 'transform' : 'auto'; })
        } });
        tl.fromTo(camera, { scale: 1, yPercent: 0 }, { scale: desktop ? 1.065 : 1.035, yPercent: desktop ? -1 : -.5, transformOrigin: '48% 48%', duration: 1, ease: 'none' }, 0)
          .to(state, { p: 1, duration: 1, ease: 'none' }, 0);
        paint();
        return function () {
          sec.classList.remove('is-editorial');
          steps.forEach(function (step) { step.classList.remove('is-on'); step.style.removeProperty('--step-progress'); });
          camera.style.removeProperty('will-change');
        };
        });
      }
      var check = later(function () {
        frame = 0;
        if (disposed || rebuilding) return;
        var next = fits(); if (next === pinned) return;
        var previous = timeline && timeline.scrollTrigger, progress = previous ? previous.progress : 0;
        var active = previous && previous.isActive, scroll = w.scrollY;
        var anchor = previous && scroll >= previous.end ? sec.nextElementSibling : null;
        var anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
        rebuilding = true;
        try {
          chapter.revert(); build(next); ST.sort(); ST.refresh();
          var trigger = timeline.scrollTrigger;
          // Preserve the current chapter while it is active, or the following
          // content's viewport position when added/removed pin space is above it.
          var target = active ? trigger.start + progress * (trigger.end - trigger.start) :
            anchor ? scroll + anchor.getBoundingClientRect().top - anchorTop : scroll;
          if (Math.abs(w.scrollY - target) > 1) w.scrollTo(w.scrollX, Math.max(0, target));
          ST.update();
          if (active) {
            var scrub = trigger.getTween(); if (scrub) scrub.progress(1);
            timeline.progress(progress);
          }
        } finally { rebuilding = false; }
      });
      function schedule() {
        if (!disposed && !rebuilding && !frame) frame = w.requestAnimationFrame(check);
      }
      offs.push(function () {
        disposed = true;
        if (frame) w.cancelAnimationFrame(frame);
        if (observer) observer.disconnect();
        ST.removeEventListener('refresh', schedule);
        if (chapter) chapter.revert();
      });
      build(fits());
      on(w, 'resize', schedule, { passive: true });
      ST.addEventListener('refresh', schedule);
      if ('ResizeObserver' in w) {
        observer = new ResizeObserver(schedule);
        observer.observe(grid);
        [].slice.call(grid.children).forEach(function (child) { observer.observe(child); });
      }
    }
    function howMotion() {
      $$('[data-how-motion]').forEach(function (section) {
        var steps = $$('[data-how-step]', section), photo = $('[data-how-photo] img', section);
        steps.forEach(function (step) {
          var state = { p: 0 }, set = g.quickSetter(step, '--how-progress');
          g.to(state, { p: 1, ease: 'none', onUpdate: safe(function () { set(state.p); }), scrollTrigger: {
            trigger: step, start: 'top 82%', end: 'bottom 48%', scrub: .45, invalidateOnRefresh: true
          } });
        });
        if (photo) g.fromTo(photo, { scale: 1, yPercent: 0 }, { scale: 1.08, yPercent: -2, ease: 'none', scrollTrigger: {
          trigger: section, start: 'top 85%', end: 'bottom 25%', scrub: .6, invalidateOnRefresh: true
        } });
        offs.push(function () { steps.forEach(function (step) { step.style.removeProperty('--how-progress'); }); });
      });
    }
    function productReveals() {
      $$('[data-product-stage]').forEach(function (stage) {
        var objects = $$('[data-product-reveal]', stage); if (!objects.length) return;
        objects.forEach(function (object, index) {
          // Observe each product so a viewport change cannot reveal its sibling
          // off-screen; desktop timing is chosen when this product actually enters.
          watch(object, function () { g.set(object, { y: RISE, opacity: 0 }); }, function () {
            g.to(object, { y: 0, opacity: 1, duration: T.rise, delay: desk() ? stag(index) : 0, ease: OUT, clearProps: 'transform,opacity' });
          }, 0, 12);
        });
      });
    }
    function story(c) {
      $$('[data-story]').forEach(function (sec) {
        if (sec.getAttribute('data-story') === 'editorial') { editorialStory(sec, c); return; }
        var steps = $$('[data-step]', sec), n = steps.length, pinEl = $('[data-story-pin]', sec);
        var scene = $('[data-story-scene]', sec), col = scene && $('[data-tint]', scene);
        var ring = $('[data-story-ring]', sec), card = $('[data-story-card]', sec);
        if (!c.tall || n < 2 || !pinEl) {   // M7: الشاشات القصيرة تتلوّن بالمسح العادي. M3: hook ناقص = الحلقة والبطاقة ظاهرين (motion.css يخفيهم تحت .mh)
          if (col) tintWhenSeen(col.parentNode);
          if (ring || card) g.set([ring, card].filter(Boolean), { opacity: 1 });
          return;
        }
        var run = $('[data-story-run]', sec) || steps[0].parentNode;
        var phone = $('[data-story-phone]', sec), target = $('[data-story-target]', sec), dot = !CALM && $('[data-pulse]', sec);
        var rail = mk('span', 'h-story-rail', run), fill = mk('b', '', rail), kt = phone && $('.fo-screen', phone) ? kit(phone, false) : null;
        var sl = col ? line(col.parentNode) : null;   // خط المسح على المسرح (وسيط، بعيد عن النص)
        // M10: الخط موجود في DOM بس والقصة مثبّتة (العنصر نفسه يبقى مرجع الـ tween وهو منفصل)
        var slOn = function (on) { if (!sl) return; if (on && !sl.parentNode) col.parentNode.appendChild(sl); else if (!on) drop(sl); };
        slOn(false);
        sec.classList.add('is-live');
        var cur = -1, go = function (i) { if (i === cur) return; cur = i; steps.forEach(function (li, j) { li.classList.toggle('is-on', j === i); }); };
        // AD-08: اللمس بمقياس حقيقي. عرض الجوال 72mm (phone-frame.svg = phone-tap.svg) على مقياس المسرح (--stage-mm في scenes.css)،
        // ومايل -20 إلى -30 (--rot حق الخانة محصور فيها)، وحافته العليا على نقطة اللمس من الجنب، و60% من وجه المنتج أو أكثر يبقى ظاهر
        // (نقطة الإمساك على الحافة العليا تمشي لطرفها لين يتغطى 40% بالكثير). خطوة 3: الجوال يقرب للكاميرا (مقاسه في CSS الصفحة،
        // وبحد 86% من طول المشهد) ويبعد عن المنتج للجنب الثاني، عدل، عشان الشاشة تنقرى. الدخول transform بس، من تحت المشهد ومقصوص فيه.
        // الحساب مرة وحدة لكل refresh (داخل دوال القيم، بعد ما التثبيت ينفك)، والإحداثيات كلها من نفس اللحظة فالتثبيت ما يأثر
        var face = target ? (target.classList.contains('lt-slot') ? target : target.closest('.lt-slot')) : null, stage = scene && $('.lt-scene-stage', scene);
        var PM = 72, P = null, rad = Math.PI / 180;
        var corners = function (L, Tp, W, Hh, q) {   // زوايا الجوال على الشاشة بعد translate(x,y) rotate(r) scale(s) من زاويته العليا
          var c = Math.cos(q.r * rad), sn = Math.sin(q.r * rad);
          return [[0, 0], [W, 0], [W, Hh], [0, Hh]].map(function (v) { return [L + q.x + q.s * (v[0] * c - v[1] * sn), Tp + q.y + q.s * (v[0] * sn + v[1] * c)]; });
        };
        var covered = function (poly, r) {   // كم من مساحة المستطيل r يغطيها المضلع (قص Sutherland-Hodgman ثم shoelace)
          var cut = function (pts, inside, hit) { var out = []; for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b);
            if (ia) out.push(a); if (ia !== ib) out.push(hit(a, b)); } return out; };
          var atX = function (x) { return function (a, b) { var t = (x - a[0]) / (b[0] - a[0]); return [x, a[1] + (b[1] - a[1]) * t]; }; };
          var atY = function (y) { return function (a, b) { var t = (y - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, y]; }; };
          var q = cut(poly, function (v) { return v[0] >= r.left; }, atX(r.left));
          q = cut(q, function (v) { return v[0] <= r.right; }, atX(r.right));
          q = cut(q, function (v) { return v[1] >= r.top; }, atY(r.top));
          q = cut(q, function (v) { return v[1] <= r.bottom; }, atY(r.bottom));
          for (var A = 0, i = 0; i < q.length; i++) { var u = q[i], v = q[(i + 1) % q.length]; A += u[0] * v[1] - v[0] * u[1]; }
          return Math.abs(A / 2) / Math.max(1, r.width * r.height);
        };
        var calc = function () {
          if (P) return P;
          var none = { x: 0, y: 0, r: 0, s: 1 }; P = { from: none, touch: none, near: none, cover: 0 };
          if (!phone || !scene) return P;
          var keep = phone.style.transform; phone.style.transform = 'none';
          var pr = phone.getBoundingClientRect(), sr = scene.getBoundingClientRect(), W = phone.offsetWidth, Hh = phone.offsetHeight;
          phone.style.transform = keep;
          var L = pr.left, Tp = pr.top, touch = none, cover = 0;
          if (target && !face && W && Hh) {   // هدف برّا خانة طباعة: الحافة العليا (نصها) على الهدف، بمقاسه وميلان -25، وبدون خطوة الابتعاد
            var t0 = touchPoint(target), c0 = Math.cos(-25 * rad), s0 = Math.sin(-25 * rad);
            touch = { x: t0.x - L - .5 * W * c0, y: t0.y - Tp - .5 * W * s0, r: -25, s: 1 };
          }
          if (face && W && Hh) {
            var fr = face.getBoundingClientRect(), tp = touchPoint(target), fcs = getComputedStyle(face);
            var mmv = stage ? parseFloat(getComputedStyle(stage).getPropertyValue('--stage-mm')) : NaN, sw = stage ? stage.offsetWidth : 0;
            var s = mmv > 0 && sw ? (PM / mmv * sw) / W : 1, r = parseFloat(fcs.getPropertyValue('--rot'));
            r = isNaN(r) ? -25 : Math.max(-30, Math.min(-20, r));
            var c = Math.cos(r * rad), sn = Math.sin(r * rad);
            [.5, .42, .34, .26, .18].some(function (a) {   // 14% من كل طرف زاوية مدورة، فالإمساك على الحافة المستقيمة بس
              touch = { x: tp.x - L - s * a * W * c, y: tp.y - Tp - s * a * W * sn, r: r, s: s };
              cover = covered(corners(L, Tp, W, Hh, touch), fr); return cover <= .4;
            });
            // خطوة 3: عدل، أكبر، وفي الجنب الثاني من المشهد بعيد عن الوجه
            // الجنب: data-story-near="right" أو "left" على المشهد لو يكفي فيه الجوال (مثلاً عشان ما يغطي الباب)، وإلا الجنب الأوسع
            var sN = Math.max(s, Math.min(1, sr.height * .86 / Hh)), hw = sN * W / 2, hh = sN * Hh / 2, fitR = sr.right - fr.right, fitL = fr.left - sr.left;
            var pref = scene.getAttribute('data-story-near'), left = fitR >= fitL;   // left = الوجه يسار، والجوال يمين
            if (pref === 'right' && fitR >= 2 * hw + 20) left = true; else if (pref === 'left' && fitL >= 2 * hw + 20) left = false;
            var cx = sr.left + sr.width * (left ? .76 : .24);
            cx = left ? Math.max(cx, fr.right + 12 + hw) : Math.min(cx, fr.left - 12 - hw);
            cx = Math.max(sr.left + hw + 8, Math.min(sr.right - hw - 8, cx));
            var cy = Math.max(sr.top + hh + 8, Math.min(sr.bottom - hh - 8, (sr.top + sr.bottom) / 2));
            P.near = { x: cx - hw - L, y: cy - hh - Tp, r: 0, s: sN };
          }
          P.touch = touch; P.cover = cover;
          var top = Math.min.apply(null, corners(L, Tp, W, Hh, touch).map(function (v) { return v[1]; }));
          P.from = { x: touch.x, y: touch.y + Math.max(0, sr.bottom - top) + 4, r: touch.r, s: touch.s };   // تحت حافة المشهد بالضبط
          if (!face) P.near = touch;   // بدون وجه منتج ما فيه شي نبعد عنه
          return P;
        };
        // PIN-5: الكتلة الأقصر من الشاشة تتوسط تحت الرأس، والأطول تبدأ تحته بـ 24
        var free = function () { return vh() - headerH(); };
        var armed = true, fire = later(function () { if (dot && armed) { armed = false; pulseOnce(dot); } });
        var tl = g.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
          trigger: pinEl, pin: true, start: function () { var hh = headerH(); return pinEl.offsetHeight < free() - 48 ? 'center center+=' + Math.round(hh / 2) : 'top top+=' + (hh + 24); },
          end: function () { return '+=' + Math.round(vh() * (desk() ? 1.5 : 1.1)); }, scrub: SCRUB, invalidateOnRefresh: true, refreshPriority: 1, anticipatePin: 1,
          onRefreshInit: safe(function () { P = null; }),
          onUpdate: safe(function (s) { go(Math.min(n - 1, Math.floor(s.progress * n * .9999))); if (s.progress < .36) armed = true; }),
          onToggle: safe(function (s) { sec.classList.toggle('is-pinned', s.isActive); slOn(s.isActive); if (s.isActive) finishRunning(); })   // خط واحد: أي مسح شغال يكمل
        } });
        tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
        if (col) {
          tl.fromTo(col, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .3, ease: SCAN }, .02)
            .fromTo(sl, { y: 0 }, { y: function () { return col.parentNode.offsetHeight; }, duration: .3, ease: SCAN }, .02)
            .fromTo(sl, { opacity: 0 }, { opacity: 1, duration: .01 }, .02).to(sl, { opacity: 0, duration: .03 }, .29);
        }
        // M4: الهدف ينقاس داخل دالة القيمة (بعد ما التثبيت ينفك في refresh)، مو في onRefresh
        if (phone) {   // خطوة 2: من تحت المشهد لين يلمس (.36 إلى .62). خطوة 3: يقرب للكاميرا ويبعد (.67 إلى .82). transform بس، بدون شفافية
          var pv = function (st, k) { var get = function () { return calc()[st][k]; }; return get; };
          tl.fromTo(phone, { x: pv('from', 'x'), y: pv('from', 'y'), rotation: pv('touch', 'r'), scale: pv('touch', 's'), transformOrigin: '0px 0px' },
            { x: pv('touch', 'x'), y: pv('touch', 'y'), rotation: pv('touch', 'r'), scale: pv('touch', 's'), duration: .26, ease: OUT }, .36)
            .fromTo(phone, { x: pv('touch', 'x'), y: pv('touch', 'y'), rotation: pv('touch', 'r'), scale: pv('touch', 's') },
              { x: pv('near', 'x'), y: pv('near', 'y'), rotation: pv('near', 'r'), scale: pv('near', 's'), duration: .15, ease: MOVE, immediateRender: false }, .67);
        }
        // AD-41: الحلقة (خطوة 2) والبطاقة (خطوة 3). المراحل labels بأجزاء من مسافة التثبيت (TL-5)
        tl.addLabel('ring', .36).addLabel('pulse', .44).addLabel('card', .56).addLabel('open', .70);
        if (ring) tl.fromTo(ring, { opacity: 0 }, { opacity: 1, duration: .06 }, 'ring');
        if (card) {
          var cover = mk('span', 'm-card-cover', card), cl = line(card);   // الغطا والخط داخل البطاقة (مقصوصين بزاويتها 22)
          g.set(cl, { opacity: 0 });
          tl.fromTo(card, { opacity: 0, y: 32, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .12, ease: OUT }, 'card')
            .fromTo(cover, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: .22, ease: SCAN }, 'open')
            .fromTo(cl, { y: 0 }, { y: function () { return card.clientHeight; }, duration: .22, ease: SCAN, immediateRender: false }, 'open')
            .fromTo(cl, { opacity: 0 }, { opacity: 1, duration: .01, immediateRender: false }, 'open').to(cl, { opacity: 0, duration: .02 }, .90);   // الخط مع المسح بس
        }
        if (dot) tl.call(function () { if (tl.scrollTrigger && tl.scrollTrigger.direction > 0) fire(); }, null, ring ? 'pulse' : .64);   // TL-6: حدث مرة وحدة بالوقت، مو tween مربوط بالتمرير
        if (kt) tl.fromTo(kt.cover, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: .22, ease: SCAN }, .74)
          .fromTo(kt.line, { y: 0 }, { y: function () { return kt.screen.offsetHeight; }, duration: .22, ease: SCAN, immediateRender: false }, .74)
          .fromTo(kt.line, { opacity: 0 }, { opacity: 1, duration: .01, immediateRender: false }, .74).to(kt.line, { opacity: 0, duration: .02 }, .94);   // الخط يطلع مع المسح بس، ويرجع مخفي مع الرجوع
        go(0);
      });
    }

    // ===== نبض نقطة الستاند (data-pulse برّا القصة): مرة وحدة لما يطلع الستاند، في المطاعم بس (§10). 1 ← 1.08 ← 1 في 400ms =====
    function pulses() {
      if (CALM) return;
      $$('[data-pulse]').forEach(function (dot) { if (dot.closest('[data-story]')) return; onView(dot, function () { pulseOnce(dot); }, 1, 20); });
    }

    // ===== 7) عمق الصور (data-parallax): الصور داخل إطارها (الطبقتين مع بعض)، ±5% (parallax-subtle). ما ينحط على نص =====
    function depth() {
      $$('[data-parallax]').forEach(function (el) { var imgs = $$('img', el); if (!imgs.length) return;
        var make = function () { g.fromTo(imgs, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: SCRUB } }); };
        watch(el, null, make, 0, -100, make); });
    }

    // ===== 9) عناوين الأقسام بالكلمات (data-words، مرجعين صاحب المشروع في brief-gm040.md، AD-28) =====
    // "gather": الكلمات تبدأ متفرقة (كل كلمة مزاحة بقدر بعدها عن وسط سطرها، ومايلة rotateX داخل perspective) وتتجمع مع التمرير (scrub)
    // لين تستقر لما أعلى العنوان يوصل 45% من الشاشة. "cut": الكلمات تطلع كلمة كلمة من تحت خط قص (عنوان الأسعار)، مرة وحدة لما يدخل.
    // القواعد: بالكلمات بس (ولا تقسيم للحروف العربية)، transform بس، aria-label على العنوان بالنص كامل والأجزاء aria-hidden،
    // تقليل الحركة وبدون JS: العنوان ثابت كامل (التقسيم يصير هنا بس، ويرجع النص الأصلي بالحرف مع أي إرجاع)، والإزاحة أقل على الجوال.
    // ممنوع على h1 (لازم ينقرى من أول لحظة)
    function split(h) {
      if (h.__mSplit) return h.__mSplit;
      var cut = h.getAttribute('data-words') === 'cut', words = [];
      var rec = { el: h, html: h.innerHTML, had: h.hasAttribute('aria-label'), band: null, words: words };
      var label = (h.textContent || '').replace(/\s+/g, ' ').trim();
      var walk = function (node) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 1) { walk(n); return; }
          if (n.nodeType !== 3 || !n.nodeValue) return;
          var frag = d.createDocumentFragment();
          n.nodeValue.split(/([ \t\n\r]+)/).forEach(function (p) {   // المسافة العادية بس تفصل (المسافة غير القابلة للكسر تبقى داخل الكلمة)
            if (!p) return;
            if (/^[ \t\n\r]+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var o = d.createElement('span'); o.setAttribute('aria-hidden', 'true');
            if (cut) { o.className = 'm-wc'; var i = d.createElement('span'); i.className = 'm-wi'; i.textContent = p; o.appendChild(i); words.push(i); }
            else { o.className = 'm-w'; o.textContent = p; words.push(o); }
            frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        });
      };
      splits.push(rec); h.__mSplit = rec;
      if (!rec.had) h.setAttribute('aria-label', label);
      walk(h); h.classList.add('m-words');
      return rec;
    }
    function gather(h) {
      var r = split(h), ws = r.words; if (!ws.length) return;
      r.band = h.closest('section'); if (r.band) r.band.classList.add('m-words-band');   // ولا تمرير أفقي من كلمة مزاحة (motion.css)
      var P = null;
      var calc = function () {
        if (P) return P; P = [];
        var mob = !desk(), KX = mob ? .35 : .9, BX = mob ? 16 : 64, RX = mob ? 40 : 55, vw = H.clientWidth, hl = docLeft(h) - w.scrollX, lines = {};
        ws.forEach(function (e, i) { var k = e.offsetTop; (lines[k] = lines[k] || []).push(i); });
        Object.keys(lines).forEach(function (k) {
          var ix = lines[k], lo = Infinity, hi = -Infinity;
          ix.forEach(function (i) { lo = Math.min(lo, ws[i].offsetLeft); hi = Math.max(hi, ws[i].offsetLeft + ws[i].offsetWidth); });
          var c = (lo + hi) / 2, half = Math.max(1, (hi - lo) / 2), f = 1;
          ix.forEach(function (i) {
            var e = ws[i], dx = e.offsetLeft + e.offsetWidth / 2 - c, sg = dx > .5 ? 1 : dx < -.5 ? -1 : 0, n = Math.max(-1, Math.min(1, dx / half));
            var x = sg * (Math.abs(dx) * KX + BX), left = hl + e.offsetLeft, room = x > 0 ? vw - 8 - left - e.offsetWidth : 8 - left;
            if (x && Math.abs(room) < Math.abs(x)) f = Math.min(f, Math.max(0, room / x));
            P[i] = { x: x, r: Math.round(n * RX) };
          });
          // الكلمة تبقى داخل الشاشة: لو وحدة ما لها مكان، السطر كله يتفرق أقل بنفس النسبة (ما تركب كلمة على جارتها)
          ix.forEach(function (i) { P[i].x = Math.round(P[i].x * f); });
        });
        return P;
      };
      var wc = function (on) { g.set(ws, { willChange: on ? 'transform' : 'auto' }); };   // will-change وقت الحركة بس
      g.timeline({ scrollTrigger: { trigger: h, start: 'clamp(top bottom)', end: 'clamp(top 45%)', scrub: SCRUB, invalidateOnRefresh: true,
        onRefreshInit: safe(function () { P = null; }), onToggle: safe(function (s) { wc(s.isActive); }) } })
        .fromTo(ws, { x: function (i) { return calc()[i].x; }, rotationX: function (i) { return calc()[i].r; }, transformPerspective: 600, transformOrigin: '50% 60%' },
          { x: 0, rotationX: 0, ease: 'none', duration: 1 });
    }
    function cutWords(h) {
      var ws = split(h).words; if (!ws.length) return;
      watch(h, function () { g.set(ws, { yPercent: 150 }); }, function () {
        g.to(ws, { yPercent: 0, duration: T.rise, ease: OUT, stagger: .07, clearProps: 'transform' });
      }, 0, 12);
    }
    function words() {
      $$('[data-words]').forEach(function (h) { if (h.tagName === 'H1') return; var k = h.getAttribute('data-words');
        if (k === 'gather') gather(h); else if (k === 'cut') cutWords(h); });
    }

    // ===== 8) الأسئلة (data-accordion): الفتح 240ms والقفل 65% منه، بكلاسات و CSS (cubic-bezier(.2,0,0,1))، مرة وحدة للمستمعين =====
    $$('[data-accordion] details').forEach(function (q) {
      var sm = $('summary', q); if (!sm) return;
      sm.addEventListener('click', safe(function (e) {
        if (!H.classList.contains('m')) return;
        if (q.open) { e.preventDefault(); q.classList.add('m-closing'); setTimeout(function () { q.open = false; q.classList.remove('m-closing'); }, T.acc * T.exit * 1000); }
        else { q.classList.add('m-opening'); requestAnimationFrame(function () { requestAnimationFrame(function () { q.classList.remove('m-opening'); }); }); }
      }));
    });

    // ===== التشغيل: gsap.matchMedia (تقليل الحركة = ولا شي). tall = الشاشة 640 أو أطول (البداية والبطل والقصة المثبّتة) =====
    mm = g.matchMedia();
    // الشروط: تقليل الحركة، والطول (640). العرض مو شرط هنا: عبوره كان يعيد بناء التثبيت ويرجّع الصفحة لفوق، والمسافات تنحسب وقت refresh
    var keepY = null, gen = 0, setupDone = false;
    var idle = function (fn) { if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 200 }); else setTimeout(fn, 16); };
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', tall: '(prefers-reduced-motion: no-preference) and (min-height: 640px)' }, function (ctx, contextSafe) {
      var c = ctx.conditions;
      if (dead) return;
      CS = contextSafe;
      if (!c.motion) { H.classList.remove('m', 'mh'); restore(); return; }
      H.classList.add('m'); H.classList.toggle('mh', !!c.tall);
      waiting = [];
      // PERF (M5): البطل أول (نفس الـ task عشان إطار 0% = الحالة النهائية)، والباقي كل قسم بـ task لحاله وقت الفراغ
      // (requestIdleCallback، وبدونه setTimeout)، وآخرها refresh واحد. gen يلغي الباقي لو matchMedia رجّع قبل ما يخلص
      var my = ++gen, steps = [
        function () { reveals(); },
        function () { $$('[data-scan="media"]').forEach(scanMedia); $$('[data-scan="tint"]').forEach(scanTint); },
        function () { $$('[data-scan="phone"]').forEach(scanPhone); $$('[data-scan="check"]').forEach(scanCheck); doors(); },
        function () { story(c); },
        function () { productReveals(); howMotion(); },
        function () { pulses(); depth(); },
        function () { words(); sentinel(); },
        function () { setupDone = true; ST.sort(); ST.refresh();
          if (keepY !== null) { var y0 = keepY; keepY = null; if (Math.abs(w.scrollY - y0) > 2) w.scrollTo(0, y0); } }
      ];
      try {
        opening(c);

        symbolFlight(c);
      } catch (e) { fail(e); }
      var step = function () { if (dead || my !== gen) return; var f = steps.shift(); if (!f) return;
        try { later(f)(); } catch (e) { fail(e); } if (steps.length) idle(step); };
      idle(step);
      // التنظيف (MM-2 و CL-3 و CL-4): يشتغل آخر شي بعد ما GSAP يرجّع الحركات. الحالة النهائية على طول، بدون setTimeout (M1 و M9)
      return function () { gen++; keepY = w.scrollY; H.classList.remove('m', 'mh'); unjunk(); restore(); Q = []; running = null; waiting = []; CS = null; };
    });
    // ===== مرساة القراءة عند تغيير العرض (M9): العنصر اللي تحت منتصف الشاشة وإزاحته، تنحفظ بعد ما يوقف التمرير (مو داخل callback التمرير).
    // resize يمر بـ debounce 200ms ثم ST.refresh() مرة وحدة، ونرجّع المرساة لمكانها. resize الخاص بـ ScrollTrigger مطفي عشان ما يصير refresh مرتين
    ST.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });
    var anc = null, ancTop = 0, sizing = 0, ancT = 0;
    // السبب الحقيقي للقفزة (r4): getBoundingClientRect يشمل transform ظهور لسا شغّال (y) على أب المرساة، فالمرساة تنحفظ منزاحة 7px.
    // الحل: مكان التخطيط بـ offsetTop (ما يتأثر بـ transform)، وإذا فيه أب fixed (مثبّت وسط القصة) نرجع لـ getBoundingClientRect
    var lay = function (e) { var t = 0, o = e; while (o) { if (o.offsetParent === null && o !== d.body && getComputedStyle(o).position === 'fixed') return e.getBoundingClientRect().top; t += o.offsetTop; o = o.offsetParent; } return t - w.scrollY; };
    var grab = safe(function () { if (sizing || dead) return; var e = d.elementFromPoint(w.innerWidth / 2, w.innerHeight / 2);
      if (!e || e === H || e === d.body) { anc = null; return; } anc = e; ancTop = lay(e); });
    w.addEventListener('scroll', function () { if (sizing) return; clearTimeout(ancT); ancT = setTimeout(grab, 150); }, { passive: true });
    w.addEventListener('resize', function () {
      if (!sizing && !anc) grab(); clearTimeout(sizing); clearTimeout(ancT);
      sizing = setTimeout(safe(function () { ST.refresh();
        if (anc && anc.isConnected) { var dy = lay(anc) - ancTop; if (Math.abs(dy) > 1) w.scrollBy(0, dy); }
        sizing = 0; }), 200);
    }, { passive: true });
    ST.addEventListener('refresh', function () { if (!sizing) { clearTimeout(ancT); ancT = setTimeout(grab, 150); } });
    if (d.fonts && d.fonts.status !== 'loaded') d.fonts.ready.then(safe(function () { ST.refresh(); }));
    // الفتح على رابط داخلي (index.html#pricing): التثبيت يضيف مسافة فوق الأقسام، فنرجع للقسم المطلوب مرة وحدة بعد أول refresh.
    // هذا رجوع لطلب الزائر نفسه، مو سرقة تمرير
    if (w.location.hash.length > 1) {
      var goal = null; try { goal = d.getElementById(decodeURIComponent(w.location.hash.slice(1))); } catch (x) {}
      if (goal) { var fix = safe(function () { if (!setupDone) return; ST.removeEventListener('refresh', fix);
        var pad = parseFloat(getComputedStyle(H).scrollPaddingTop) || 0; if (Math.abs(goal.getBoundingClientRect().top - pad) > 24) goal.scrollIntoView(); });
        ST.addEventListener('refresh', fix); }
    }
    w.__ltMotion = 1;
  } catch (e) { fail(e); }
})(window, document);
