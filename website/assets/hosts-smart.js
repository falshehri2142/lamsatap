/* حاسبة المضيف (site-wow 2026-09-30، brief-ux §1). الأسعار من services/pricing.md (GM-045) بدون ضريبة:
   1–4 وحدات 49.5 شهري أو 544.5 سنوي للوحدة، و5 فأكثر 39.5 أو 434.5 على كل الوحدات. بدون JS: الجدول يكفي. */
(function (d) {
  var box = d.querySelector('[data-host-calc]');
  if (!box) return;
  var live = box.querySelector('[data-calc-live]'), out = box.querySelector('[data-units]');
  if (!live || !out) return;
  var n = 3, MIN = 1, MAX = 50;
  function fmt(v) { v = Math.round(v * 10) / 10; var p = String(v).split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  function word(k) { return k === 2 ? 'وحدتين' : (k > 2 && k < 11 ? 'وحدات' : 'وحدة'); }
  function q(s) { return box.querySelector(s); }
  function yearly() { var r = box.querySelector('input[name="bill"]:checked'); return !!r && r.value === 'y'; }
  function waMsg() {
    var a = q('[data-calc-wa]');
    if (!a || !a.href || a.href.indexOf('text=') < 0) return;
    try {
      var u = new URL(a.href), t = a.getAttribute('data-base-text');
      if (t == null) { t = u.searchParams.get('text') || ''; a.setAttribute('data-base-text', t); }
      u.searchParams.set('text', t + ' عندي ' + (n === 2 ? '' : n + ' ') + word(n) + (yearly() ? '، والدفع سنوي.' : '، والدفع شهري.'));
      a.href = u.toString();
    } catch (e) {}
  }
  function render() {
    var y = yearly(), bulk = n >= 5, rate = bulk ? (y ? 434.5 : 39.5) : (y ? 544.5 : 49.5);
    out.textContent = n === 2 ? '2' : n;
    q('.p-calc-n span').textContent = word(n);
    q('[data-total]').textContent = fmt(rate * n);
    q('[data-per]').textContent = y ? 'بالسنة' : 'بالشهر';
    q('[data-rate]').textContent = fmt(rate);
    q('[data-per-unit]').textContent = y ? 'بالسنة' : 'بالشهر';
    q('[data-tier-note]').textContent = bulk ? 'سعر 5 وحدات أو أكثر، على كل وحداتك.' : 'من 5 وحدات يصير سعر الوحدة ' + (y ? '434.5' : '39.5') + ' على كل وحداتك.';
    box.classList.toggle('is-bulk', bulk);
    box.querySelectorAll('[data-step]').forEach(function (b) {
      var s = +b.getAttribute('data-step');
      b.disabled = s < 0 ? n <= MIN : n >= MAX;
    });
    waMsg();
    // anim-micro (brief §3): المجموع يتبدل فوري، والرقم بس يظهر من .4 لين 1 في 150ms (بدون حركة ولا عدّ). التفضيل ينقرى كل مرة،
    // والضغط السريع يلغي الظهور اللي قبله
    var f = q('[data-total]');
    if (fade) { try { fade.cancel(); } catch (e) {} fade = null; }
    if (f && f.animate && w.matchMedia && w.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      fade = f.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
    }
  }
  var w = window, fade = null;
  box.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () { n = Math.min(MAX, Math.max(MIN, n + +b.getAttribute('data-step'))); render(); });
  });
  box.querySelectorAll('input[name="bill"]').forEach(function (r) { r.addEventListener('change', render); });
  // الرسالة تنبني وقت الضغط كمان، عشان لو app.js عبّى الرابط بعدنا
  var wa = q('[data-calc-wa]');
  if (wa) { wa.addEventListener('pointerdown', waMsg); wa.addEventListener('focus', waMsg); wa.addEventListener('click', waMsg); }
  w.addEventListener('load', waMsg);
  live.hidden = false;
  box.classList.add('is-live');
  // app.js يعبّي رابط واتساب عند DOMContentLoaded، فنرسم بعده عشان نضيف عدد الوحدات للرسالة
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', render); else render();
})(document);

// GM-067: سعر النظافة من config.js ‏cleaningPrices. فاضي = يبقى «السعر قريباً» اللي في HTML.
(function () {
  var P = (window.SITE && window.SITE.cleaningPrices) || {};
  document.querySelectorAll('[data-clean-price]').forEach(function (el) {
    var v = String(P[el.getAttribute('data-clean-price')] || '').trim();
    if (v) { el.textContent = v; el.classList.remove('p-clean-soon'); }
  });
})();
