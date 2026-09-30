/* .p-sign (brief §4): once on view, replay on tap/hover, no loop. */
(function () {
  var sign = document.querySelector('[data-sign-motion]');
  if (!sign) return;
  var frame = sign.querySelector('.p-sign-frame'), tap = sign.querySelector('.p-sign-tap'),
    row = sign.querySelector('.p-sign-row'), lab = tap && tap.querySelector('small'),
    arcs = tap ? [].slice.call(tap.querySelectorAll('path')) : [];
  if (!frame || !tap || !row) return;
  var K = 1.25, waits = [], busy = false, IDLE = lab ? lab.textContent : '', DONE = 'تم الخروج';
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function go(el, kf, ms, ease) {
    if (!el) return;
    var G = window.gsap;
    if (G) G.fromTo(el, kf[0], Object.assign({}, kf[1], { duration: ms / 1000, ease: ease[0], overwrite: true }));
    else if (el.animate) el.animate(kf.map(function (k) { var o = { opacity: k.opacity }; if (k.y != null) o.transform = 'translateY(' + k.y + 'px) rotate(-1.5deg)'; return o; }), { duration: ms, easing: ease[1] });
  }
  var XO = ['expo.out', 'cubic-bezier(.16,1,.3,1)'], LIN = ['power1.out', 'ease-out'];
  function done(on) {
    sign.setAttribute('data-sign-state', on ? 'done' : 'idle');
    if (lab) lab.textContent = on ? DONE : IDLE;
  }
  // waves: dash set by JS only, so visible with JS off
  function waves() {
    arcs.forEach(function (p, i) {
      if (i === 0 && arcs.length > 1) return; // أول path = جسم الجوال
      p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1';
      var a = p.animate && p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 240 * K, delay: 60 * i, easing: 'ease-out', fill: 'backwards' });
      if (a) a.onfinish = function () { p.style.strokeDasharray = ''; p.removeAttribute('pathLength'); };
    });
  }
  function play(rise) {
    if (busy) return;
    waits.forEach(clearTimeout); waits = [];
    if (reduced()) { done(true); return; }
    busy = true; done(false);
    if (rise) go(frame, [{ y: 20, opacity: 1 }, { y: 0, opacity: 1 }], 600 * K, XO);
    waits.push(setTimeout(function () {
      tap.classList.remove('is-tap'); void tap.offsetWidth; tap.classList.add('is-tap'); waves();
    }, 300));
    waits.push(setTimeout(function () {
      go(row, [{ opacity: 1 }, { opacity: 0 }], 100, LIN);
      waits.push(setTimeout(function () { done(true); go(row, [{ opacity: 0 }, { opacity: 1 }], 100, LIN); busy = false; }, 100));
    }, 780));
  }
  var rise = true;
  if (reduced() || !('IntersectionObserver' in window)) { done(true); rise = false; }
  else {
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect(); play(rise);
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(sign);
  }
  sign.addEventListener('click', function () { play(false); });
  sign.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') play(false); });
})();
