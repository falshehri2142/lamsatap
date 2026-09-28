// مشاهد المنتج (GM-050): يحط صور قسم الطباعة في خاناتها. الخانة (.lt-slot[data-print="<الاسم>"]) تبقى مستطيل أبيض نظيف
// لين الصورة تنكتب في assets/mockups/print-art.js، وبعدها ياخذ assets/print/<الاسم>.png ونسبته الطبيعية.
// ما يطلب ملف مو مكتوب في القائمة، فما يطلع 404 ولا خطأ. بدون fetch، ويشتغل من file://. بدون JS: المستطيلات البيضاء.
(function () {
  'use strict';
  var me = document.currentScript, base = (me && me.src) || location.href;
  function set(el, k, v) { el.style.setProperty(k, String(v)); }
  function place(el) {
    var name = el.getAttribute('data-print'), a = (window.LT_PRINT_ART || {})[name];
    if (!a || el.classList.contains('has-art')) return;
    var face = el.querySelector('.lt-slot-face'); if (!face) return;
    if (a.w && a.h) set(el, '--ar', a.w + ' / ' + a.h);            // النسبة قبل ما تنزل الصورة، عشان ما يتحرك شي
    if (a.mm) set(el, '--mm', a.mm);                                  // العرض الحقيقي بالمليمتر (A5 أو A4 أو أكريليك)
    if (a.touch) { set(el, '--tx', a.touch[0] + '%'); set(el, '--ty', a.touch[1] + '%'); }   // منطقة اللمس في تصميمهم
    var img = new Image();
    img.className = 'lt-slot-art'; img.alt = ''; img.decoding = 'async';
    if (a.w && a.h) { img.width = a.w; img.height = a.h; }
    img.onload = function () {
      if (!(a.w && a.h) && img.naturalWidth) set(el, '--ar', img.naturalWidth + ' / ' + img.naturalHeight);
      face.appendChild(img); el.classList.add('has-art');
    };
    img.src = a.src ? new URL(a.src, location.href).href : new URL('print/' + name + '.png', base).href;
  }
  function run() { var s = document.querySelectorAll('.lt-slot[data-print]'); for (var i = 0; i < s.length; i++) place(s[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
