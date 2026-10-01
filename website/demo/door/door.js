// افتح الباب (عرض، مقترح GM-068): كل شي محلي، بدون fetch ولا رابط برا. ما يفتح باب حقيقي.
(function (d) {
  var $ = function (i) { return d.getElementById(i); };
  var st = $('d-status'), hold = $('d-hold'), HOLD_MS = 1000;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(id) {
    ['d-verify', 'd-open', 'd-done', 'd-pin'].forEach(function (x) { $(x).hidden = x !== id; });
  }
  $('d-check').addEventListener('click', function () {
    show('d-open'); st.textContent = 'حجزك مؤكد. اضغط مطوّل على زر الفتح.'; hold.focus();
  });
  var t0 = 0, raf = 0, busy = false;
  function set(p) { hold.style.setProperty('--p', p); }
  function tick(now) {
    var p = Math.min(1, (now - t0) / HOLD_MS);
    set(reduce ? 0 : p);
    if (p >= 1) { done(); return; }
    raf = requestAnimationFrame(tick);
  }
  function start(e) {
    if (busy) return;
    if (e && e.type === 'keydown') { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); if (e.repeat) return; }
    busy = true; hold.setAttribute('aria-busy', 'true'); st.textContent = 'خلّك ضاغط…';
    t0 = performance.now(); raf = requestAnimationFrame(tick);
  }
  function cancel() {
    if (!busy) return;
    cancelAnimationFrame(raf); busy = false; hold.removeAttribute('aria-busy'); set(0);
    st.textContent = 'تركت الزر بدري. اضغط وخلّك ضاغط ثانية.';
  }
  function done() {
    busy = false; hold.removeAttribute('aria-busy'); set(0);
    var fail = $('d-fail').checked, box = fail ? 'd-pin' : 'd-done';
    show(box);
    st.textContent = fail ? 'القفل ما رد. استخدم الرمز الاحتياطي.' : 'انفتح الباب. وصل تنبيه للمضيف.';
    $(box).focus();
  }
  hold.addEventListener('pointerdown', function (e) { hold.setPointerCapture && hold.setPointerCapture(e.pointerId); start(e); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { hold.addEventListener(n, cancel); });
  hold.addEventListener('keydown', start);
  hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') cancel(); });
  hold.addEventListener('blur', cancel);
  hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  $('d-retry').addEventListener('click', function () { $('d-fail').checked = false; show('d-open'); st.textContent = ''; hold.focus(); });
})(document);
