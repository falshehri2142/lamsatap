/* لمسة تاب — نظام الحركة 2 (web-motion): مكتبة «المسح» لصفحات الشركة بس (GM-039 و GM-040 و GM-043). GSAP 3.15 و ScrollTrigger محليين.
   الشرح والجدول «أي حركة، على أي attribute، في أي صفحة وقسم»: work/2026-09-27-brand-identity/web-motion.md «النظام 2».
   القواعد (web-art-director.md «الاتجاه 2» §7 و«الاتجاه 3» §6، و ui-ux-pro-max §7):
   - fail-open: أي خطأ في التهيئة أو وقت الحركة يرجّع كل شي لحالته النهائية الظاهرة (mm.revert وتنشال m و mh).
   - transform و opacity و clip-path بس. ولا قراءة layout داخل الحلقات: القياس مرة وحدة وعند refresh.
   - خط مسح واحد في الشاشة بأي لحظة (طابور)، ويمر على الوسائط بس (صور، شاشات، باركود)، ما يمر على النص أبداً.
   - النص ظاهر من أول لحظة. بدون JS ومع تقليل الحركة: الشكل النهائي. */
(function (w, d) {
  'use strict';
  var H = d.documentElement, g = w.gsap, ST = w.ScrollTrigger, mm = null, junk = [], dead = false;

  // ===== fail-open: أي خطأ = كل شي يرجع ظاهر ونهائي =====
  // يمسح القيم المكتوبة على عناصر الحركة، فترجع لـ CSS الحالة النهائية (بعد mm.revert، وفي fail-open)
  // العناصر اللي الحركة تكتب عليها بالضبط (مو كل الأبناء: الشاشات المصغرة فيها transform خاص فيها ما ينمسح)
  var HERO = ['[data-open-qr] svg', '[data-open-sym]', '[data-open-word]', '[data-open-cap] > *', '[data-open-logo] img',
    '[data-reveal]', '[data-reveal="stagger"] > *', '[data-scan="reveal"]', '[data-scan="list"] > *', '[data-scan="media"]', '[data-tint]',
    '[data-scan="check"] li svg', '[data-door]', '[data-expand-media]', '[data-expand-media] > img', '[data-expand-title] > *', '[data-expand-sheet]',
    '[data-expand-in]', '[data-expand-phone]', '[data-story-phone]', '[data-pulse]', '[data-parallax] img'].join(', ');
  function restore() { try { if (g) g.set([].slice.call(d.querySelectorAll(HERO)), { clearProps: 'opacity,visibility,transform,clipPath' }); } catch (x) {} }
  function fail(e) {
    if (dead) return; dead = true;
    try { if (mm) mm.revert(); } catch (x) {}
    restore();
    try { junk.forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); }); } catch (x) {}
    H.classList.remove('m', 'mh');
    if (w.console) console.warn('[motion] fail-open:', e && (e.stack || e.message || e));
  }
  function safe(fn) { return function () { if (dead) return; try { return fn.apply(this, arguments); } catch (e) { fail(e); } }; }
  if (!g || !ST) { H.classList.remove('m', 'mh'); return; }

  try {
    g.registerPlugin(ST);
    // إطار ثقيل (تحميل الصفحة مثلاً): الحركة تستنى بدل ما تقفز (أي إطار فوق 120ms ينحسب 16ms)، فما يضيع شي من التسلسل
    g.ticker.lagSmoothing(120, 16);

    // ===== سلّم واحد للتوقيت والتسارع (ui-ux-pro-max §7 motion-consistency، والمدير الفني «الاتجاه 2» §7) =====
    // المزاج من data-audience على <html> أو <body>: hosts هادي (×1.25 و quint.out)، restaurants دافي فيه نبض، وبدونه محايد
    var aud = (d.body && d.body.getAttribute('data-audience')) || H.getAttribute('data-audience') || '';
    var CALM = aud === 'hosts', K = CALM ? 1.25 : 1;
    var T = { press: .15, acc: .24, draw: .24 * K, rise: .6 * K, scan: .8 * K, pulse: .4, fade: .2 * K, exit: .65 };   // الضغط والأكورديون ثابتين (CSS)
    var OUT = CALM ? 'quint.out' : 'expo.out', IN = 'expo.in', SCAN = 'quad.inOut', MOVE = 'power2.inOut';
    var STAG = .06, MAXG = CALM ? 3 : 4, SCRUB = .5, RISE = 20;   // المضيفين: التتابع 3 بالكثير (المدير الفني §6)
    var MODR = .06;   // استدارة زاوية وحدة الحقل: 6 من 100 (زوايا قطع الرمز في brand/logo/v1.0.0/symbol-black.svg). «§11» عند المدير الفني يغلبها

    var $ = function (s, r) { return (r || d).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var vh = function () { return w.innerHeight; }, desk = function () { return w.innerWidth >= 1024; };
    function mk(tag, cls, parent) { var e = d.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); if (parent) parent.appendChild(e); junk.push(e); return e; }
    // لما العنصر يدخل الشاشة فعلاً (مو حسب مكانه المحسوب): threshold نسبة الظاهر منه، و bottom كم من تحت الشاشة ما يُحسب
    function onView(el, fn, threshold, bottom) {
      if (!('IntersectionObserver' in w)) { fn(); return; }
      var io = new IntersectionObserver(safe(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }), { threshold: threshold || 0, rootMargin: '0px 0px ' + (-(bottom || 0)) + '% 0px' });
      io.observe(el); ios.push(io);
    }
    var ios = [];
    // watch: أول نداء من IntersectionObserver يقرر (بدون قراءة layout وقت التهيئة، فما نجبر تخطيط الأقسام اللي عليها content-visibility):
    // لو العنصر تحت الشاشة وقت التحميل → hide()، ولما يدخل → show(). لو كان ظاهر أصلاً → now() (أو ولا شي)
    function watch(el, hide, show, threshold, bottom, now) {
      if (!('IntersectionObserver' in w)) return;
      var first = true, hidden = false;
      var io = new IntersectionObserver(safe(function (es) { es.forEach(function (e) {
        if (first) { first = false;
          if (e.boundingClientRect.top > vh() * .92) { hidden = true; if (hide) hide(); return; }
          io.disconnect(); if (now) now(); return; }
        if (hidden && e.isIntersecting) { io.disconnect(); show(); }
      }); }), { threshold: threshold || 0, rootMargin: '0px 0px ' + (-(bottom || 0)) + '% 0px' });
      io.observe(el); ios.push(io);
    }
    function scanTime(h) { return Math.min(.9, Math.max(.7, .7 + (h - 240) / 1800)) * K; }  // 700 إلى 900ms حسب الطول
    function hash(x, y, s) { var t = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return t - Math.floor(t); }  // seed ثابت
    function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
    function docLeft(el) { var x = 0; while (el) { x += el.offsetLeft; el = el.offsetParent; } return x; }

    // ===== خط المسح: قلبه 2px بلون --lt-accent وذيله --lt-accent-glow (توكنز web-brand حسب data-audience). البوابة بدونه: حبر =====
    function line(host, light) { return mk('i', 'm-line' + (light ? ' m-line--light' : ''), host); }

    // ===== طابور المسح: خط مسح واحد بس في الشاشة، والثاني يستنى. أي لمس أو زر يكمّل الحالي على طول (interruptible) =====
    var Q = [], running = null;
    function queue(make) { Q.push(make); if (!running) next(); }
    var next = safe(function () {
      running = null; var f = Q.shift(); if (!f) return;
      var tl = f(); if (!tl) return next();
      running = tl; var own = tl.eventCallback('onComplete');   // نكمّل تنظيف الحركة نفسها (شيل الخط والطبقة) وبعدها اللي بعدها
      tl.eventCallback('onComplete', function () { if (own) own.apply(tl, arguments); next(); });
    });
    ['pointerdown', 'keydown'].forEach(function (t) { w.addEventListener(t, safe(function () { if (running && !dead) running.progress(1); }), { passive: true }); });

    // ===== طبقة شاشة الجوال (phone-frame.svg): غطا مطفي بلون الجوال وخط فاتح، فوق الـ svg بدون ما نرسمه من جديد =====
    function kit(box, on) {
      var root = mk('span', 'm-kit', box), scr = mk('span', 'm-kit-screen', root), cover = mk('span', 'm-kit-cover', scr), ln = line(scr, true);
      g.set(cover, { clipPath: on ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }); g.set(ln, { opacity: 0 });
      return {
        root: root, cover: cover, line: ln,
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
    function opening(c) {
      var sec = $('[data-open]'); if (!sec || !c.tall) return;
      var qr = $('[data-open-qr]', sec), svg = qr && $('svg', qr), sym = $('[data-open-sym]', sec), word = $('[data-open-word]', sec),
          cap = $$('[data-open-cap] > :not(a)', sec), art = $('[data-open-art]', sec) || qr, dest = $('[data-open-logo]'), destImg = dest && $('img', dest);
      if (!svg || !sym || !word) return;
      var F = field(art, svg, sym), flightRef = null;
      var st = { s: 0, q: 0, x: 0 }, draw = safe(function () { F.draw(st.s, st.q, st.x); });
      var intro = g.timeline({ paused: true, onUpdate: draw, onComplete: safe(function () { introPlayed = true; F.remove(); g.set([svg, sym].concat(cap), { opacity: 1 }); g.set(word, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }); if (flightRef) flightRef(); }) });
      intro.set([svg, sym].concat(cap), { opacity: 0 }, 0).set(word, { opacity: 1, clipPath: 'inset(0% 100% 0% 0%)' }, 0)
        .to(st, { s: 1, duration: .7, ease: SCAN }, 0)                          // المسح يرتّب الحقل باركود
        .to(st, { q: 1, duration: .4, ease: MOVE }, .7)                         // الوسط يتجمع رمز
        .to(st, { x: 1, duration: .2, ease: MOVE }, 1.1)                        // يتبدل بالرمز الحقيقي
        .to(sym, { opacity: 1, duration: .2, ease: MOVE }, 1.1)
        .set(svg, { opacity: 1 }, 1.3)
        .to(word, { clipPath: 'inset(0% 0% 0% 0%)', duration: .4, ease: MOVE }, 1.3)   // LAMSATAP من اليسار لليمين (كلمة لاتينية)
        .fromTo(cap, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4, ease: OUT }, 1.3);
      // أي تمرير أو لمس أو زر يكمّل التسلسل على طول، والتمرير ما ينقفل أبداً (no-blocking-animation، interruptible)
      var skip = safe(function () { if (intro.progress() < 1) intro.progress(1); });
      ['wheel', 'touchstart', 'pointerdown', 'keydown', 'scroll'].forEach(function (t) { w.addEventListener(t, skip, { passive: true, once: true }); });
      // يبدأ بعد أول رسم (إطارين)، عشان تخطيط الصفحة الأول ما ياكل أول إطارات التسلسل
      if (w.scrollY > 4 || introPlayed) intro.progress(1); else requestAnimationFrame(function () { requestAnimationFrame(safe(function () { if (intro.progress() === 0) { draw(); intro.play(); } })); });

      // التثبيت والطيران للرأس (shared-element، transform بس). القياس عند refresh بس (مو داخل الحلقة)
      if (!destImg) return;
      var hh = function () { var hd = dest.closest('header'); return hd ? hd.offsetHeight : 0; };
      var R = { s: {}, w: {}, d: {} };
      var measure = safe(function () {
        var secTop = docTop(sec), top = hh(), di = destImg.getBoundingClientRect(), vw = 1068.75;   // viewBox logo-horizontal.svg
        // الرمز (0..200) والكلمة (260..1068.75، 47.4..152.4) داخل ملف الشعار الأفقي نفسه، فالوصول بالبكسل
        R.d.s = { x: di.left, y: di.top, w: di.width * 200 / vw };
        R.d.w = { x: di.left + di.width * 260 / vw, y: di.top + di.height * 47.4 / 200, w: di.width * 808.75 / vw };
        [['s', sym], ['w', word]].forEach(function (p) { var el = p[1]; R[p[0]] = { x: docLeft(el) - w.scrollX, y: docTop(el) - secTop + top, w: el.offsetWidth }; });
      });
      var layer = mk('div', 'm-fly', d.body), fly = {};
      [['s', sym], ['w', word]].forEach(function (p) {
        var cl = p[1].cloneNode(true); cl.removeAttribute('data-open-sym'); cl.removeAttribute('data-open-word'); cl.removeAttribute('style');
        $$('img', cl).forEach(function (im) { im.alt = ''; im.removeAttribute('data-company-alt'); });
        layer.appendChild(cl); fly[p[0]] = cl;
      });
      var place = function () { ['s', 'w'].forEach(function (k) { var el = k === 's' ? sym : word; g.set(fly[k], { left: R[k].x, top: R[k].y, width: el.offsetWidth, height: el.offsetHeight }); }); };
      measure(); place();
      var flightState = safe(function (p) {
        if (!introPlayed && p <= .001) return;   // التسلسل ماسك الفن لين يخلص
        g.set([svg].concat(cap), { opacity: 1 - clamp(p / .5) });
        g.set([sym, word], { opacity: p > .001 ? 0 : 1 });
        g.set([fly.s, fly.w], { autoAlpha: p > .001 && p < .999 ? 1 : 0 });
        g.set(destImg, { opacity: p >= .999 ? 1 : 0 });   // الشعار الحقيقي يظهر ونسخة الطيران تختفي بنفس اللحظة
      });
      var tl = g.timeline({ onUpdate: function () { flightState(this.progress()); }, scrollTrigger: {
        trigger: sec, pin: true, start: function () { return 'top top+=' + hh(); }, end: function () { return '+=' + Math.round(vh() * (desk() ? .6 : .4)); },
        scrub: SCRUB, invalidateOnRefresh: true, refreshPriority: 3, anticipatePin: 1, onRefreshInit: safe(function () { measure(); place(); })
      } });
      [['s', sym], ['w', word]].forEach(function (p) {
        var k = p[0];
        tl.fromTo(fly[k], { x: 0, y: 0, scale: 1 }, {
          x: function () { return R.d[k].x - R[k].x; }, y: function () { return R.d[k].y - R[k].y; }, scale: function () { return R.d[k].w / R[k].w; },
          transformOrigin: '0 0', ease: MOVE, duration: 1, immediateRender: false }, .001);
      });
      flightRef = function () { flightState(tl.progress()); };   // الشعار الحقيقي يظهر ونسخة الطيران تختفي بنفس اللحظة
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
      all.forEach(function (el) { watch(el, function () { g.set(el, { opacity: 0, y: RISE }); }, function () { batch.push(el); if (!tick) tick = requestAnimationFrame(safe(function () { var b = batch; batch = []; tick = null;
        g.to(b, { opacity: 1, y: 0, duration: T.rise, ease: OUT, stagger: { each: STAG, amount: Math.min(b.length - 1, MAXG - 1) * STAG }, overwrite: true, clearProps: 'opacity,transform' }); })); }, 0, 12); });
      // التركيز بالكيبورد يظهر العنصر على طول
      pending = all; if (focusBound) return; focusBound = true;
      d.addEventListener('focusin', safe(function (e) { var t = e.target; pending.forEach(function (el) { if (el.contains(t)) g.to(el, { opacity: 1, y: 0, duration: T.press, overwrite: true }); }); }));
    }

    // ===== 3) المسح على الوسائط (data-scan="media" | "tint" | "phone")، و"check" بدون خط =====
    // media: الصورة أو المشهد ينكشف من فوق لتحت وخط المسح على حافته. مرة وحدة لكل تحميل، وبالطابور
    function scanMedia(el) {
      watch(el, function () { g.set(el, { clipPath: 'inset(0% 0% 100% 0%)' }); }, function () { queue(function () { return reveal(el); }); }, 0, 35);
    }
    function reveal(el) {
      var ln = line(el), h = el.offsetHeight, t = scanTime(h);
      return g.timeline({ onComplete: safe(function () { ln.parentNode && ln.parentNode.removeChild(ln); g.set(el, { clearProps: 'clipPath' }); }) })
        .fromTo(el, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: t, ease: SCAN }, 0)
        .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: t, ease: SCAN }, 0).to(ln, { opacity: 0, duration: T.fade }, t - T.fade);
    }
    // tint: طبقتين (الأبيض والأسود تحت، و img[data-tint] الملونة فوق). اللون ينكشف مع الخط ويبقى، والمسح يبدأ بعد img.decode()
    function tintScan(el, dur) {
      var col = $('[data-tint]', el); if (!col) return null;
      var ln = line(el), h = el.offsetHeight, t = dur || scanTime(h);
      return g.timeline({ onComplete: safe(function () { ln.parentNode && ln.parentNode.removeChild(ln); g.set(col, { clipPath: 'inset(0% 0% 0% 0%)' }); }) })
        .fromTo(col, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: t, ease: SCAN }, 0)
        .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: t, ease: SCAN }, 0).to(ln, { opacity: 0, duration: T.fade }, t - T.fade);
    }
    // طبقة اللون: تنزل قبل القسم بنص شاشة (المدير الفني §4). وهي مقصوصة كلها، فالتحميل الكسول ما يشوفها: نطلبها بنفسنا
    function prefetch(img) { if (!img || img.loading !== 'lazy') return; onView(img.parentNode, function () { img.loading = 'eager'; }, 0, -50); }
    // المسح يبدأ بعد img.decode()، وبحد 1.5 ثانية عشان الطابور ما يعلق أبداً
    function decoded(img, fn) {
      var done = false, go = safe(function () { if (!done) { done = true; fn(); } });
      if (!img || !img.decode) return go();
      if (img.loading === 'lazy') img.loading = 'eager';
      img.decode().then(go, go); setTimeout(go, 1500);
    }
    function scanTint(el) {
      var col = $('[data-tint]', el); if (!col) return; prefetch(col);
      if (el.closest('[data-door], [data-expand], [data-story]')) return;   // الأبواب والبطل والقصة يحركونها بنفسهم
      var go = function () { decoded(col, function () { queue(function () { return tintScan(el); }); }); };
      watch(el, null, go, 0, 35, go);
    }
    // phone: الشاشة تنفتح بالمسح مرة وحدة (المضيفين 1100ms)
    function scanPhone(el) {
      if (!$('.fo-screen', el)) return;
      var kt = null;
      watch(el, function () { kt = kit(el, false); }, function () {
        queue(function () { return kt.open(CALM ? 1.1 : null).eventCallback('onComplete', safe(function () { kt.root.parentNode && kt.root.parentNode.removeChild(kt.root); })); });
      }, 0, 35);
    }
    // check: علامات الصح تنرسم وحدة بعد وحدة (clip من اليسار، مثل اتجاه رسمها)، 60ms بينها و4 بالكثير. بدون خط على النص
    function scanCheck(el) {
      var ic = $$('li svg', el); if (!ic.length) return;
      watch(el, function () { g.set(ic, { clipPath: 'inset(0% 100% 0% 0%)' }); }, function () {
        g.to(ic, { clipPath: 'inset(0% 0% 0% 0%)', duration: T.draw, ease: OUT, stagger: { each: STAG, amount: Math.min(ic.length - 1, MAXG - 1) * STAG }, clearProps: 'clipPath' });
      }, 0, 15);
    }

    // ===== 4) البابين (data-doors و data-door، «أقوى لحظة»): لما القسم يبان 35%، الأول يرتفع 24px في 600ms والثاني بعده بـ 120ms،
    // وبعدها مسح صورة الأول (بلمسته) ثم الثاني، واحد بعد الثاني. التحويم أو التركيز يعيد خط المسح على الصورة (بحركة من المستخدم) =====
    function doors() {
      $$('[data-doors]').forEach(function (wrap) {
        var ds = $$('[data-door]', wrap); if (!ds.length) return;
        var scans = function () { ds.forEach(function (dr) { var ph = $('[data-scan="tint"]', dr) || dr, col = $('[data-tint]', ph);
          if (col) decoded(col, function () { queue(function () { return tintScan(ph, .9 * K); }); }); }); };
        watch(wrap, function () { g.set(ds, { opacity: 0, y: 24 }); }, function () {
          g.to(ds, { opacity: 1, y: 0, duration: T.rise, ease: OUT, stagger: .12, clearProps: 'opacity,transform' }); scans();
        }, .35, 0, scans);
        ds.forEach(function (dr) {
          var again = safe(function () { var ph = $('[data-scan="tint"]', dr); if (!ph || running) return; var ln = line(ph), h = ph.offsetHeight;
            queue(function () { return g.timeline({ onComplete: function () { ln.parentNode && ln.parentNode.removeChild(ln); } })
              .fromTo(ln, { y: 0, opacity: 1 }, { y: h, duration: .7 * K, ease: SCAN }).to(ln, { opacity: 0, duration: T.fade }, '>-' + T.fade); }); });
          if (w.matchMedia('(hover: hover) and (pointer: fine)').matches) { dr.addEventListener('mouseenter', again); dr.addEventListener('focusin', again); }
        });
      });
    }

    // ===== 5) البطل المتوسع (data-expand، GM-037) لصفحتي الجمهور: البطاقة تتوسع لين تعبّي الشاشة مع التمرير (pin و scrub)،
    // والعنوانين يتباعدون (محسوبين RTL)، واللون ينكشف مع التوسع، وبعد التوسع الكامل يطلع اللوح والجوال =====
    function expand(c) {
      var sec = $('[data-expand]'); if (!sec || !c.tall) return;
      var media = $('[data-expand-media]', sec), pic = media && media.firstElementChild, card = $('[data-expand-card]', sec), title = $('[data-expand-title]', sec),
          sheet = $('[data-expand-sheet]', sec), ins = $$('[data-expand-in]', sec), phone = $('[data-expand-phone]', sec), col = media && $('[data-tint]', media);
      if (!media || !card) return;
      var dir = getComputedStyle(sec).direction === 'rtl' ? 1 : -1, halves = title ? [].slice.call(title.children) : [];
      var inset = function () { var W = sec.clientWidth, Hh = sec.clientHeight, t = card.offsetTop, l = card.offsetLeft;
        return 'inset(' + t + 'px ' + (W - l - card.offsetWidth) + 'px ' + (Hh - t - card.offsetHeight) + 'px ' + l + 'px round 22px)'; };
      var shown = false, content = g.timeline({ paused: true, defaults: { ease: OUT, duration: T.rise } });
      if (sheet) content.fromTo(sheet, { opacity: 0, y: RISE }, { opacity: 1, y: 0 }, 0);
      if (ins.length) content.fromTo(ins, { opacity: 0, y: RISE }, { opacity: 1, y: 0, stagger: STAG }, .1);
      if (phone) content.fromTo(phone, { opacity: 0, y: 48 }, { opacity: 1, y: 0 }, .12);
      var tl = g.timeline({ defaults: { ease: 'none' }, onUpdate: safe(function () {
        var p = tl.progress();
        if (p > .66 && !shown) { shown = true; content.timeScale(1).play(); } else if (p < .5 && shown) { shown = false; content.timeScale(1 / T.exit).reverse(); }
      }), scrollTrigger: { trigger: sec, pin: true, start: 'top top', end: function () { return '+=' + Math.round(vh() * (desk() ? 1.3 : 1)); }, scrub: SCRUB, invalidateOnRefresh: true, refreshPriority: 2, anticipatePin: 1 } });
      tl.fromTo(media, { clipPath: inset }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: .62, ease: MOVE }, 0);
      if (pic) tl.fromTo(pic, { scale: 1.12 }, { scale: 1, duration: .62, ease: MOVE }, 0);
      if (col) tl.fromTo(col, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .62, ease: 'none' }, 0);
      halves.forEach(function (hf, i) { tl.fromTo(hf, { x: 0, opacity: 1 }, { x: function () { return (i ? -dir : dir) * sec.clientWidth * .55; }, opacity: 0, duration: .42, ease: 'power2.in' }, i * .02); });
      tl.to({}, { duration: .38 }, .62);
    }

    // ===== 6) القصة المثبّتة (data-story): ثلاث خطوات مربوطة بالتمرير، وترجع طبيعي مع الرجوع.
    // خطوة 1: المشهد ينكشف بلون جمهوره. خطوة 2: الجوال يقرّب ويلمس ([data-story-target])، والنقطة تنبض مرة (المطاعم).
    // خطوة 3: الشاشة تنفتح بالمسح. النص ظاهر كله، والخطوة الحالية واضحة والباقي أخف وقت التثبيت بس =====
    function story(c) {
      $$('[data-story]').forEach(function (sec) {
        if (!c.tall) return;
        var steps = $$('[data-step]', sec), n = steps.length; if (n < 2) return;
        var pinEl = $('[data-story-pin]', sec); if (!pinEl) return;
        var run = $('[data-story-run]', sec) || steps[0].parentNode;
        var scene = $('[data-story-scene]', sec), col = scene && $('[data-tint]', scene), phone = $('[data-story-phone]', sec), target = $('[data-story-target]', sec), dot = $('[data-pulse]', sec);
        var rail = mk('span', 'h-story-rail', run), fill = mk('b', '', rail), kt = phone && $('.fo-screen', phone) ? kit(phone, false) : null;
        sec.classList.add('is-live');
        var cur = -1, go = function (i) { if (i === cur) return; cur = i; steps.forEach(function (li, j) { li.classList.toggle('is-on', j === i); }); };
        var move = function () { if (!phone || !target) return { x: 0, y: 0 };
          var pr = phone.getBoundingClientRect(), tr = target.getBoundingClientRect(), cx = g.getProperty(phone, 'x'), cy = g.getProperty(phone, 'y');
          return { x: tr.left + tr.width / 2 - (pr.left - cx + pr.width / 2), y: tr.top - (pr.top - cy + pr.height * .12) }; };
        var M = { x: 0, y: 0 };
        var tl = g.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
          trigger: pinEl, pin: true, start: function () { return pinEl.offsetHeight < vh() - 48 ? 'center center' : 'top top+=24'; },
          end: function () { return '+=' + Math.round(vh() * (desk() ? 1.5 : 1.1)); }, scrub: SCRUB, invalidateOnRefresh: true, refreshPriority: 1, anticipatePin: 1,
          onRefreshInit: safe(function () { if (phone) g.set(phone, { x: 0, y: 0 }); }), onRefresh: safe(function () { M = move(); }),
          onUpdate: safe(function (s) { go(Math.min(n - 1, Math.floor(s.progress * n * .9999))); }), onToggle: safe(function (s) { sec.classList.toggle('is-pinned', s.isActive); })
        } });
        tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
        if (col) tl.fromTo(col, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .3, ease: SCAN }, .02);
        if (phone) tl.fromTo(phone, { x: 0, y: function () { return vh() * .35; }, opacity: 0 }, { x: function () { return M.x; }, y: function () { return M.y; }, opacity: 1, duration: .28, ease: MOVE }, .36);
        if (dot && !CALM) tl.to(dot, { scale: 1.08, duration: .03, ease: 'sine.out' }, .64).to(dot, { scale: 1, duration: .03, ease: 'sine.in' }, .67);   // نبض مرة وحدة (2% حد النوابض ما ينطبق على نبض 8% المطلوب من المدير الفني)
        if (kt) tl.fromTo(kt.cover, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', duration: .26, ease: SCAN }, .7)
          .fromTo(kt.line, { y: 0, opacity: 1 }, { y: function () { return kt.cover.parentNode.offsetHeight; }, duration: .26, ease: SCAN }, .7).to(kt.line, { opacity: 0, duration: .02 }, .94);
        go(0);
      });
    }

    // ===== نبض نقطة الستاند (data-pulse برّا القصة): مرة وحدة لما يطلع الستاند، في المطاعم بس (§10). 1 ← 1.08 ← 1 في 400ms =====
    function pulses() {
      if (CALM) return;
      $$('[data-pulse]').forEach(function (dot) { if (dot.closest('[data-story]')) return;
        onView(dot, function () { g.timeline().to(dot, { scale: 1.08, duration: T.pulse / 2, ease: 'sine.out' }).to(dot, { scale: 1, duration: T.pulse / 2, ease: 'sine.in', clearProps: 'transform' }); }, 1, 20); });
    }

    // ===== 7) عمق الصور (data-parallax): الصورة بس، داخل إطارها، ±5% (parallax-subtle). ما ينحط على نص =====
    function depth() {
      $$('[data-parallax]').forEach(function (el) { var img = $('img', el); if (!img) return;
        var make = function () { g.fromTo(img, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: SCRUB } }); };
        watch(el, null, make, 0, -100, make); });
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

    // ===== التشغيل: gsap.matchMedia (تقليل الحركة = ولا شي). tall = الشاشة 640 أو أطول (البطل المثبّت) =====
    mm = g.matchMedia();
    // الشروط: تقليل الحركة، والطول (640). العرض مو شرط هنا: عبوره كان يعيد بناء التثبيت ويرجّع الصفحة لفوق، والمسافات تنحسب وقت refresh
    var keepY = null;
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', tall: '(prefers-reduced-motion: no-preference) and (min-height: 640px)' }, function (ctx) {
      var c = ctx.conditions;
      if (dead) return;
      if (!c.motion) { H.classList.remove('m', 'mh'); return; }
      H.classList.add('m'); H.classList.toggle('mh', !!c.tall);
      try {
        opening(c);
        reveals();
        $$('[data-scan="media"]').forEach(scanMedia);
        $$('[data-scan="tint"]').forEach(scanTint);
        $$('[data-scan="phone"]').forEach(scanPhone);
        $$('[data-scan="check"]').forEach(scanCheck);
        doors();
        expand(c);
        story(c);
        pulses();
        depth();
      } catch (e) { setTimeout(function () { fail(e); }, 0); }
      if (keepY !== null) { var y0 = keepY; keepY = null; requestAnimationFrame(safe(function () { ST.refresh(); if (Math.abs(w.scrollY - y0) > 2) w.scrollTo(0, y0); })); }
      return function () { keepY = w.scrollY; ios.forEach(function (o) { o.disconnect(); }); ios = []; setTimeout(restore, 0); junk.forEach(function (nd) { if (nd && nd.parentNode) nd.parentNode.removeChild(nd); }); junk = []; Q = []; running = null; $$('.is-live, .is-pinned, .is-on').forEach(function (el) { el.classList.remove('is-live', 'is-pinned', 'is-on'); }); };
    });
    if (d.fonts && d.fonts.status !== 'loaded') d.fonts.ready.then(safe(function () { ST.refresh(); }));
    // الفتح على رابط داخلي (index.html#pricing): التثبيت يضيف مسافة فوق الأقسام، فنرجع للقسم المطلوب مرة وحدة بعد أول refresh.
    // هذا رجوع لطلب الزائر نفسه، مو سرقة تمرير
    if (w.location.hash.length > 1) {
      var goal = null; try { goal = d.getElementById(decodeURIComponent(w.location.hash.slice(1))); } catch (x) {}
      if (goal) { var fix = safe(function () { ST.removeEventListener('refresh', fix);
        var pad = parseFloat(getComputedStyle(H).scrollPaddingTop) || 0; if (Math.abs(goal.getBoundingClientRect().top - pad) > 24) goal.scrollIntoView(); });
        ST.addEventListener('refresh', fix); }
    }
    w.__ltMotion = 1;
  } catch (e) { fail(e); }
})(window, document);
