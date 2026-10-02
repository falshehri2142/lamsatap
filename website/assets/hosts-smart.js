/* حاسبة المضيف (site-wow 2026-09-30، brief-ux §1). الأسعار من services/pricing.md (GM-045) بدون ضريبة:
   1–4 وحدات 49.5 شهري أو 544.5 سنوي للوحدة، و5 فأكثر 39.5 أو 434.5 على كل الوحدات. بدون JS: الجدول يكفي. */
(function (d) {
  var box = d.querySelector('[data-host-calc]');
  if (!box) return;
  var live = box.querySelector('[data-calc-live]'), out = box.querySelector('[data-units]');
  if (!live || !out) return;
  var n = 3, MIN = 1, MAX = 50;
  // GM-070: الصفحة الإنجليزية (<html lang="en">) بكلماتها، والكسر بخانتين (148.50). العربي زي ما هو
  var EN = /^en\b/i.test(d.documentElement.lang || '');
  var T = EN ? {
    per: ['/ month', '/ year'], perUnit: ['per month', 'per year'],
    bulk: 'The 5+ unit rate, applied to all your units.', tier: function (y) { return 'At 5 units or more, every unit drops to SAR ' + (y ? '434.50' : '39.50') + '.'; },
    tail: function (k, y) { return ' I have ' + k + ' ' + word(k) + (y ? ', billed yearly.' : ', billed monthly.'); }
  } : {
    per: ['بالشهر', 'بالسنة'], perUnit: ['بالشهر', 'بالسنة'],
    bulk: 'سعر 5 وحدات أو أكثر، على كل وحداتك.', tier: function (y) { return 'من 5 وحدات يصير سعر الوحدة ' + (y ? '434.5' : '39.5') + ' على كل وحداتك.'; },
    tail: function (k, y) { return ' عندي ' + (k === 2 ? '' : k + ' ') + word(k) + (y ? '، والدفع سنوي.' : '، والدفع شهري.'); }
  };
  function fmt(v) {
    v = Math.round(v * 100) / 100;
    var p = (EN && v % 1 ? v.toFixed(2) : String(Math.round(v * 10) / 10)).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.');
  }
  function word(k) { return EN ? (k === 1 ? 'unit' : 'units') : (k === 2 ? 'وحدتين' : (k > 2 && k < 11 ? 'وحدات' : 'وحدة')); }
  function q(s) { return box.querySelector(s); }
  function yearly() { var r = box.querySelector('input[name="bill"]:checked'); return !!r && r.value === 'y'; }
  function waMsg() {
    var a = q('[data-calc-wa]');
    if (!a || !a.href || a.href.indexOf('text=') < 0) return;
    try {
      var u = new URL(a.href), t = a.getAttribute('data-base-text');
      if (t == null) { t = u.searchParams.get('text') || ''; a.setAttribute('data-base-text', t); }
      u.searchParams.set('text', t + T.tail(n, yearly()));
      a.href = u.toString();
    } catch (e) {}
  }
  function render() {
    var y = yearly(), bulk = n >= 5, rate = bulk ? (y ? 434.5 : 39.5) : (y ? 544.5 : 49.5);
    out.textContent = String(n);
    q('.p-calc-n span').textContent = word(n);
    q('[data-total]').textContent = fmt(rate * n);
    q('[data-per]').textContent = T.per[y ? 1 : 0];
    q('[data-rate]').textContent = fmt(rate);
    q('[data-per-unit]').textContent = T.perUnit[y ? 1 : 0];
    q('[data-tier-note]').textContent = bulk ? T.bulk : T.tier(y);
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

// GM-067 النظافة (cleaningPrices) ومقترح GM-068 الإقامة الذكية (smartStayPrices) من config.js. فاضي = يبقى «السعر قريباً» اللي في HTML.
// 2026-10-02 (بق الجوال): الرقم والعملة بس بالخط الكبير، والباقي سطر صغير تحته، وكل « · » سطر جديد. قبل كان النص كله 32px وينكسر 3–4 أسطر.
(function (d) {
  var S = window.SITE || {}, en = d.documentElement.lang === 'en';
  [['clean', S.cleaningPrices], ['stay', S.smartStayPrices]].forEach(function (g) {
    var P = g[1] || {};
    d.querySelectorAll('[data-' + g[0] + '-price]').forEach(function (el) {
      var k = el.getAttribute('data-' + g[0] + '-price'), v = String((en && P[k + 'En']) || P[k] || '').trim();
      if (!v) return;
      var m = v.match(/^((?:SAR )?[\d.,]+%?(?: ريال)?)\s*(.*)$/) || [v, v, ''];
      el.textContent = m[1]; el.classList.remove('p-clean-soon');
      if (m[2]) { var t = d.createElement('small'); t.textContent = m[2].split(' · ').join('\n'); el.parentNode.appendChild(t); }
    });
  });
})(document);
