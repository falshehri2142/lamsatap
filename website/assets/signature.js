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

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, cur = null, token = 0, timer = 0, started = false;
  var SPRING = 'cubic-bezier(.2,.9,.25,1.15)';

  function anim(el, from, to, ms, ease, delay) {
    return new Promise(function (res) {
      if (!el) return res();
      if (G) {
        G.fromTo(el, from, Object.assign({}, to, { duration: ms / 1000, delay: (delay || 0) / 1000, ease: ease === SPRING ? 'back.out(1.4)' : 'power2.out', onComplete: res, overwrite: true }));
      } else if (el.animate) {
        var a = el.animate([css(from), css(to)], { duration: ms, delay: delay || 0, easing: ease, fill: 'forwards' });
        a.onfinish = res; a.oncancel = res;
      } else res();
    });
  }
  function css(o) {
    var t = 'translateY(' + (o.y || 0) + 'px) rotate(' + (o.rotation || 0) + 'deg) scale(' + (o.scale == null ? 1 : o.scale) + ')';
    return o.opacity == null ? { transform: t } : { transform: t, opacity: o.opacity };
  }
  function setState(s) { stage.setAttribute('data-state', s); }

  function load(src, t) {
    stage.removeAttribute('data-loaded');
    clearTimeout(timer);
    frame.onload = function () {
      if (t !== token || frame.getAttribute('src') === 'about:blank') return;
      clearTimeout(timer); stage.setAttribute('data-loaded', '');
      try { var st = frame.contentDocument.createElement('style'); st.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar{display:none}'; frame.contentDocument.head.appendChild(st); } catch (e) {}
    };
    timer = setTimeout(function () { if (t === token) stage.setAttribute("data-slow", ""); }, 1500);
    frame.setAttribute('src', src);
  }

  function play(tab) {
    var key = tab.getAttribute('data-tl-opt'), src = tab.getAttribute('data-tl-src'), t = ++token;
    if (cap) cap.textContent = TEXT[key] || '';
    if (open) open.setAttribute('href', src);
    if (reduce) { setState('open'); load(src, t); return; }
    setState('approach');
    stage.removeAttribute('data-loaded');
    anim(phone, { y: 24, rotation: -4 }, { y: 0, rotation: 0 }, 520, SPRING).then(function () {
      if (t !== token) return;
      setState('tap');
      var r1 = anim(ripple, { scale: .2, opacity: .5 }, { scale: 1.6, opacity: 0 }, 640, 'ease-out');
      var r2 = r1.then(function () { return t === token && anim(ripple, { scale: .2, opacity: .5 }, { scale: 1.6, opacity: 0 }, 640, 'ease-out', 120); });
      setTimeout(function () { if (t === token) { setState('open'); load(src, t); } }, 380);
      return r2;
    });
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
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); first(); }
    }, { threshold: .4 });
    io.observe(stage);
  } else first();
})();
