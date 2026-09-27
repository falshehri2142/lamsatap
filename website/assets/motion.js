/* لمسة تاب — نظام الحركة 2 (web-motion): GSAP 3.15 + ScrollTrigger، محلي، في index.html بس.
   الفكرة وحدة: «تلمس، وتنفتح الصفحة». الشرح والـ hooks: work/2026-09-27-brand-identity/web-motion.md «النظام 2». */
(function (w, d) {
  var H = d.documentElement, g = w.gsap, ST = w.ScrollTrigger, introDone = 0;
  if (!g || !ST || !H.classList.contains('m')) { H.classList.remove('m'); return; }
  g.registerPlugin(ST);
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return g.utils.toArray((r || d).querySelectorAll(s)); };
  var OUT = 'expo.out', CHECK = '<svg class="lt-btn-icon" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.2 10.4 8.2 14.3 15.8 6"/></svg><span>تم النسخ</span>';

  // شاشة جوال فيها الدليل المصغّر: نفس حالات الصفحة الحقيقية (النسخ، والخروج)
  function screen(wrap, strip) {
    var q = function (s) { return $(s, wrap); }, o = { main: q('.c-main'), cp: q('[id$="wifi-copy"]'), st: q('[id$="wifi-st"]'), out: q('[id$="-out"]'), box: q('[id$="out-confirm"]'), oh: q('[id$="out-h"]') };
    if (!o.main || !o.cp || !o.out || !o.box) return null;
    if (strip) $$('[id]', wrap).forEach(function (e) { e.removeAttribute('id'); });
    var label = o.cp.innerHTML, dot = d.createElement('span');
    dot.className = 'm-touch';
    o.copy = function (on) { o.cp.innerHTML = on ? CHECK : label; if (o.st) o.st.textContent = on ? 'تم النسخ. اختر الشبكة من إعدادات الواي فاي، والصق كلمة المرور.' : ''; };
    o.check = function (on) { o.box.hidden = !on; o.out.hidden = on; };
    o.y = function () { return o.oh ? Math.max(0, o.oh.offsetTop - 40) : 0; };
    o.tap = function (el) {
      el.appendChild(dot);
      return g.timeline().fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'scale' }, 0)
        .fromTo(dot, { scale: 0.4, opacity: 0.35 }, { scale: 1.5, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0);
    };
    o.reset = function () { o.copy(0); o.check(0); g.set(o.main, { clearProps: 'transform' }); g.set(o.box, { clearProps: 'opacity,visibility,transform' }); };
    return o;
  }

  // 1) دخول البطل: timeline وحدة، مرة وحدة، وتنتهي على الصورة الثابتة
  function hero() {
    var sec = $('.h-hero');
    if (!sec) return;
    var items = $$('[data-intro]', sec), img = $('.h-photo--hero img', sec), ph = $('.h-phone--hero', sec), svg = ph && $('.h-phone-svg', ph), scr = ph && $('.fo-screen', ph);
    if (introDone) { g.set(items.concat([img, svg]).filter(Boolean), { opacity: 1 }); return; }
    var tl = g.timeline({ defaults: { ease: OUT, duration: 0.8 }, onComplete: function () { introDone = 1; } });
    if (img) tl.fromTo(img, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.4, clearProps: 'scale' }, 0);
    tl.fromTo(items, { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: 0.09, clearProps: 'transform' }, 0.1);
    if (svg) tl.fromTo(svg, { opacity: 0, y: 56 }, { opacity: 1, y: 0, duration: 1, clearProps: 'transform' }, 0.28);
    if (scr) tl.fromTo(scr, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, clearProps: 'clipPath' }, 0.78);
    var s = ph && screen(ph);
    if (s) {
      tl.add(s.tap(s.cp), 1.6).call(s.copy, [1], 1.72).call(s.copy, [0], 3.4)
        .to(s.main, { y: function () { return -s.y(); }, duration: 0.8, ease: 'power2.inOut' }, 3.4)
        .add(s.tap(s.out), 4.35).call(s.check, [1], 4.47)
        .fromTo(s.box, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, 4.47)
        .call(s.check, [0], 6).to(s.main, { y: 0, duration: 0.8, ease: 'power2.inOut', clearProps: 'transform' }, 6);
    }
    rotator(sec);
  }

  // العبارة المتبدلة (التقييم 2): متتالية، 150ms تطلع ثم 150ms تدخل، وتقف على الأخيرة عند 3.8 ثانية
  function rotator(sec) {
    var p = $$('.h-rot-i', sec);
    if (p.length < 3 || $('.h-rot.is-end', sec)) return;
    var i = { opacity: 0, y: '-0.18em', duration: 0.15, ease: 'power2.in' }, n = { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' };
    var tl = g.timeline().set(p, { opacity: 0 }).set(p[0], { opacity: 1 })
      .to(p[0], i, 1.6).fromTo(p[1], { opacity: 0, y: '0.18em' }, n, 1.75)
      .to(p[1], i, 3.5).fromTo(p[2], { opacity: 0, y: '0.18em' }, Object.assign({ clearProps: 'all' }, n), 3.65);
    ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { sec.addEventListener(t, function () { tl.progress(1); }, { passive: true, once: true }); });
  }

  // 2) الظهور مع التمرير (batch): بس اللي تحت الشاشة، والشاشات في البطاقات تنفتح بعدها
  function reveals() {
    var vh = w.innerHeight, list = $$('[data-reveal], [data-reveal-group] > *').filter(function (e) { return e.getBoundingClientRect().top > vh * 0.92; });
    if (!list.length) return;
    g.set(list, { opacity: 0, y: 16 });
    list.forEach(function (e) { var s = $('.fo-screen', e); if (s) g.set(s, { clipPath: 'inset(0% 0% 100% 0%)' }); });
    ST.batch(list, {
      start: 'top 90%', once: true, batchMax: 6,
      onEnter: function (b) {
        g.to(b, { opacity: 1, y: 0, duration: 0.7, ease: OUT, stagger: 0.06, overwrite: true, clearProps: 'opacity,transform' });
        b.forEach(function (e, k) { var s = $('.fo-screen', e); if (s) g.to(s, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: OUT, delay: 0.26 + k * 0.06, clearProps: 'clipPath' }); });
      }
    });
    // التركيز بالكيبورد يظهر العنصر فوراً
    d.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-reveal], [data-reveal-group] > *'); if (t && list.indexOf(t) > -1) g.to(t, { opacity: 1, y: 0, duration: 0.2, overwrite: true }); });
  }

  // 3) قصة الضيف: القسم يتثبّت (pin)، والخطوات تتبدل مع التمرير (scrub)، والجوال يعيش نفس اللحظات
  function story(desk) {
    var sec = $('[data-story]'), src = $('.h-phone--hero .h-phone-svg');
    if (!sec || !src) return;
    var run = $('.h-story-run', sec), steps = $$('[data-step]', sec), n = steps.length, pin = desk ? $('.h-aud-grid', sec) : run;
    if (!run || n < 2) return;
    var box = d.createElement('div'), rail = d.createElement('span'), cur = -1;
    box.className = 'h-story-phone'; box.setAttribute('aria-hidden', 'true');
    box.appendChild(src.cloneNode(true));
    rail.className = 'h-story-rail'; rail.setAttribute('aria-hidden', 'true'); rail.innerHTML = '<i></i>';
    (desk ? $('.h-aud-grid', sec) : run).appendChild(box);
    run.appendChild(rail);
    var s = screen(box, 1);
    sec.classList.add('is-live');
    function state(k) {
      if (k === cur || !s) return;
      cur = k;
      steps.forEach(function (li, j) { li.classList.toggle('is-on', j === k); });
      s.copy(k === 1); s.check(k === 2);
      g.to(s.main, { y: k === 2 ? -s.y() : 0, duration: 0.7, ease: 'power2.inOut', overwrite: 'auto' });
      if (k === 2) g.fromTo(s.box, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: OUT });
      if (k === 1) s.tap(s.cp); if (k === 2) s.tap(s.out);
    }
    g.set(steps.slice(1), { opacity: 0, y: 24 });
    var tl = g.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: pin, pin: pin, start: desk ? 'center center' : 'top top+=16', end: '+=' + n * 70 + '%', scrub: 0.6, anticipatePin: 1,
      onUpdate: function (t) { state(Math.min(n - 1, Math.floor(t.progress * n))); }, onRefresh: function (t) { state(Math.min(n - 1, Math.floor(t.progress * n))); }
    } });
    tl.fromTo($('i', rail), { scaleY: 0 }, { scaleY: 1, duration: n }, 0);
    for (var i = 1; i < n; i++) tl.to(steps[i - 1], { opacity: 0, y: -24, duration: 0.25 }, i - 0.25).to(steps[i], { opacity: 1, y: 0, duration: 0.25 }, i - 0.1);
    return function () { if (s) s.reset(); box.remove(); rail.remove(); sec.classList.remove('is-live'); steps.forEach(function (li) { li.classList.remove('is-on'); }); };
  }

  // 4) عمق الصور: الصورة تتحرك داخل إطارها أبطأ من الصفحة (scrub)
  function depth() {
    $$('[data-parallax]').forEach(function (el) {
      var img = $('img', el);
      if (img) g.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // 5) الأسئلة: فتح ناعم 350ms، وقفل 150ms (مرة وحدة للمستمعين)
  $$('.h-q').forEach(function (q) {
    var a = $('.h-q-a', q), sm = $('summary', q);
    if (a && sm) sm.addEventListener('click', function (e) {
      if (!H.classList.contains('m')) return;
      if (q.open) { e.preventDefault(); q.classList.add('m-closing'); g.to(a, { opacity: 0, y: -4, duration: 0.15, ease: 'power2.in', onComplete: function () { q.open = false; q.classList.remove('m-closing'); g.set(a, { clearProps: 'opacity,transform' }); } }); }
      else g.fromTo(a, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.35, ease: OUT, clearProps: 'opacity,transform' });
    });
  });

  // 6) الروابط بسطر واحد: خط تحت يمسح مع التحويم (m-ul)
  function lines() { $$('.lt-link').forEach(function (a) { var r = d.createRange(); r.selectNodeContents(a); a.classList.toggle('m-ul', r.getClientRects().length === 1); }); }

  var mm = g.matchMedia();
  mm.add({ ok: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 1024px)' }, function (c) {
    if (!c.conditions.ok) { H.classList.remove('m'); return; }
    H.classList.add('m');
    hero(); w.__motionReady = 1;
    reveals(); depth(); lines();
    return story(c.conditions.desk);
  });
  w.addEventListener('resize', g.utils.debounce ? g.utils.debounce(lines, 200) : lines);
})(window, document);
