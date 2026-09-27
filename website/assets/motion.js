/* موجة «لمسة تاب»: الرئيسية فقط، على الأزرار اللي عليها data-motion="wave". الشرح: work/2026-09-27-brand-identity/web-motion.md */
(function (d, w) {
  var mq = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)');
  // حلقة من نقطة الضغط (ومن وسط الزر مع الكيبورد). ما توقف الرابط ولا تأخره، ولا تعدّل الزر
  d.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-motion="wave"]'), x = e.clientX, y = e.clientY, r, s;
    if (!el || el.disabled || el.getAttribute('aria-disabled') == 'true' || !mq || mq.matches) return;
    if (!e.detail) { r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    s = d.createElement('span');
    s.className = 'lt-wave';
    s.setAttribute('aria-hidden', 'true');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    d.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 600);
  }, true);
})(document, window);
