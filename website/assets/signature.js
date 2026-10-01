/* Tap Lab — مختبر اللمسة. IIFE بدون مكتبات؛ يستخدم window.gsap إن وُجد وإلا WAAPI. */
(function () {
  var root = document.querySelector('[data-tl]');
  if (!root) return;
  var stage = root.querySelector('[data-tl-stage]'),
    tabs = [].slice.call(root.querySelectorAll('[data-tl-opt]')),
    phone = root.querySelector('[data-tl-phone]'),
    ripple = root.querySelector('[data-tl-ripple]'),
    frame = root.querySelector('[data-tl-frame]'),
    cap = root.querySelector('[data-tl-caption]'),
    open = root.querySelector('[data-tl-open]'),
    stand = root.querySelector('[data-tl-stand]');
  if (!stage || !tabs.length || !frame) return;

  var TEXT = {
    menu: 'زبونك يقرّب جواله من الستاند، وتنفتح المنيو فوراً. بدون تطبيق.',
    review: 'لمسة وحدة، وتنفتح صفحة تقييمك في قوقل مباشرة.',
    wifi: 'أندرويد يتصل باللمسة، والآيفون يفتح صفحة فيها كلمة المرور.',
    guide: 'ضيفك يلقى الواي فاي ووقت الخروج وبلاغ الصيانة، بدون ما يتصل عليك.'
  };
  var SYM = 'M0.1 46.81A50 50 0 0 1 50 0L97 0A3 3 0 0 1 100 3L100 50A50 50 0 0 1 51.02 99.99A1 1 0 0 1 50 98.99L50 50L3.1 50A3 3 0 0 1 0.1 46.81ZM153.19 0.1A50 50 0 0 1 200 50L200 97A3 3 0 0 1 197 100L150 100A50 50 0 0 1 100.01 51.02A1 1 0 0 1 101.01 50L150 50L150 3.1A3 3 0 0 1 153.19 0.1ZM199.9 153.19A50 50 0 0 1 150 200L103 200A3 3 0 0 1 100 197L100 150A50 50 0 0 1 148.98 100.01A1 1 0 0 1 150 101.01L150 150L196.9 150A3 3 0 0 1 199.9 153.19ZM46.81 199.9A50 50 0 0 1 0 150L0 103A3 3 0 0 1 3 100L50 100A50 50 0 0 1 99.99 148.98A1 1 0 0 1 98.99 150L50 150L50 196.9A3 3 0 0 1 46.81 199.9Z';
  if (stand && !stand.firstElementChild) {
    stand.innerHTML = '<svg viewBox="0 0 220 200" focusable="false"><path d="M30 196h160" stroke="var(--lt-sand-200)" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M40 190L62 8h96l22 182z" fill="var(--lt-ink)"/><path d="M62 8h96l3 24H59z" fill="var(--lt-surface)" opacity=".08"/>' +
      '<g transform="translate(86 70) scale(.24)"><path fill="var(--lt-surface)" d="' + SYM + '"/></g>' +
      '<rect x="80" y="140" width="60" height="4" rx="2" fill="var(--lt-surface)" opacity=".35"/></svg>';
  }

  // brief §4 Tap Lab: out → meet → tap → open، المجموع 650ms. التفضيل ينقرى وقت كل تشغيل.
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  var G = window.gsap, cur = null, token = 0, timer = 0, started = false, tl = null, waits = [];
  var poster = root.querySelector('[data-tl-poster]'), screen = null;
  var EASE = {
    in: ['expo.in', 'cubic-bezier(.7,0,.84,0)'], io: ['power2.inOut', 'cubic-bezier(.45,0,.55,1)'],
    out: ['power2.out', 'cubic-bezier(.33,1,.68,1)'], xo: ['expo.out', 'cubic-bezier(.16,1,.3,1)'],
    spring: ['back.out(1.2)', 'cubic-bezier(.2,.9,.25,1.15)']
  };
  // [ms, el, from (null = القيمة الحالية), to, المدة, المنحنى]
  function steps() {
    // fade the page layer only (the screen keeps its light surface, not the ink body)
    screen = stage.hasAttribute('data-loaded') || !poster ? frame : poster;
    return [
      [0, screen, null, { opacity: 0 }, 150, 'in'],
      [0, phone, null, { x: -12 }, 240, 'io'],
      [170, ripple, { scale: .6, opacity: .5 }, { scale: 1.6, opacity: 0 }, 480, 'out'],
      [170, stand, { y: 0 }, { y: -2 }, 120, 'out'],
      [290, stand, { y: -2 }, { y: 0 }, 120, 'out'],
      [400, screen, { opacity: 0 }, { opacity: 1 }, 240, 'xo'],
      [400, phone, { x: -12 }, { x: 0 }, 240, 'spring']
    ];
  }
  function css(o) {
    var r = { transform: 'translate(' + (o.x || 0) + 'px,' + (o.y || 0) + 'px) scale(' + (o.scale == null ? 1 : o.scale) + ')' };
    if (o.opacity != null) r.opacity = o.opacity;
    if (o.x == null && o.y == null && o.scale == null) delete r.transform;
    return r;
  }
  function stop() {
    G = window.gsap;
    if (tl) { tl.kill(); tl = null; }
    waits.forEach(clearTimeout); waits = [];
    [frame, poster, phone, ripple, stand].forEach(function (el) {
      if (!el) return;
      if (G) G.killTweensOf(el);
      if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }
  function finalState() {
    stop();
    [frame, poster, phone, ripple, stand].forEach(function (el) { if (el) { el.style.transform = ''; el.style.opacity = ''; } });
    if (G) G.set([frame, poster, phone, stand].filter(Boolean), { clearProps: 'transform,opacity' });
  }
  function run(t) {
    stop();
    var list = steps();
    if (G) {
      tl = G.timeline();
      list.forEach(function (s) {
        if (!s[1]) return;
        // overwrite:false inside the timeline (overwrite:true would kill sibling steps on the same target); stop() kills all tweens first.
        var to = Object.assign({}, s[3], { duration: s[4] / 1000, ease: EASE[s[5]][0], overwrite: false, immediateRender: false });
        s[2] ? tl.fromTo(s[1], s[2], to, s[0] / 1000) : tl.to(s[1], to, s[0] / 1000);
      });
      tl.call(setState, ['tap'], .17).call(setState, ['open'], .4).call(function () { G.set([frame, poster], { clearProps: 'opacity' }); });
      return;
    }
    list.forEach(function (s) {
      var el = s[1]; if (!el || !el.animate) return;
      waits.push(setTimeout(function () {
        if (t !== token) return;
        var from = s[2] || (s[3].opacity != null ? { opacity: getComputedStyle(el).opacity } : { x: 0 });
        var last = s[3].opacity === 1;
        if (last) el.getAnimations().forEach(function (a) { a.cancel(); });
        el.animate([css(from), css(s[3])], { duration: s[4], easing: EASE[s[5]][1], fill: last ? 'backwards' : 'forwards' });
      }, s[0]));
    });
    waits.push(setTimeout(function () { if (t === token) setState('tap'); }, 170));
    waits.push(setTimeout(function () { if (t === token) setState('open'); }, 400));
  }
  function setState(s) { stage.setAttribute('data-state', s); }

  // The poster only covers the very first load; after that the previous demo stays visible until the next one is ready.
  function load(src, t) {
    if (frame.getAttribute('src') === src && stage.hasAttribute('data-loaded')) return;   // already preloaded at idle
    clearTimeout(timer);
    frame.onload = function () {
      if (t !== token || frame.getAttribute('src') === 'about:blank') return;
      clearTimeout(timer); stage.setAttribute('data-loaded', '');
      prefetchRest();
      try { var st = frame.contentDocument.createElement('style'); st.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'; frame.contentDocument.head.appendChild(st); } catch (e) {}
    };
    timer = setTimeout(function () { if (t === token) stage.setAttribute("data-slow", ""); }, 1500);
    frame.setAttribute('src', src);
  }

  var prefetched = false;
  function prefetchRest() {
    if (prefetched) return; prefetched = true;
    tabs.forEach(function (b) {
      var l = document.createElement('link'); l.rel = 'prefetch'; l.href = b.getAttribute('data-tl-src'); document.head.appendChild(l);
    });
  }

  function play(tab) {
    var key = tab.getAttribute('data-tl-opt'), src = tab.getAttribute('data-tl-src'), t = ++token;
    if (cap) cap.textContent = tab.getAttribute('data-tl-cap') || TEXT[key] || '';   // data-tl-cap: نص الصفحة الإنجليزية (GM-070)
    if (open) open.setAttribute('href', src);
    load(src, t);
    if (reduced()) { finalState(); setState('open'); return; }
    setState('approach');
    run(t);
  }

  function select(tab, focus) {
    tabs.forEach(function (b) {
      var on = b === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    stage.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    if (tab === cur && started) return;
    cur = tab; started = true;
    play(tab);
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { select(b); });
    b.addEventListener('keydown', function (e) {
      var rtl = getComputedStyle(root).direction === 'rtl', n = tabs.length, j = null;
      if (e.key === 'ArrowLeft') j = rtl ? i + 1 : i - 1;
      else if (e.key === 'ArrowRight') j = rtl ? i - 1 : i + 1;
      else if (e.key === 'ArrowDown') j = i + 1;
      else if (e.key === 'ArrowUp') j = i - 1;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j === null) return;
      e.preventDefault();
      select(tabs[(j + n) % n], true);
    });
  });

  function first() {
    if (started) return;
    select(tabs.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || tabs[0]);
  }
  // Preload the first demo while the browser is idle after load, so its parse/layout never lands mid-scroll (M5 long task).
  function preload() {
    if (started || frame.getAttribute('src') !== 'about:blank') return;
    var t0 = tabs.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    frame.onload = function () { if (!started || cur === t0) stage.setAttribute('data-loaded', ''); };
    frame.setAttribute('src', t0.getAttribute('data-tl-src'));
  }
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(preload, { timeout: 4000 }); }
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); first(); }
    }, { rootMargin: '600px 0px' });
    io.observe(stage);
  } else first();
})();
