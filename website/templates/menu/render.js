// المنيو: المنطق كله هنا. يستخدمه القالب (templates/menu/) ونسخة العرض (demo/menu/).
// المواصفة: web-ux.md ر3-4 (الصنف سطر مو بطاقة، شريط أقسام ثابت، «السعرات: {cal}» تحت كل صنف، ر4-7) و ر3-5 (وضع العرض).
(function () {
  var D = window.MENU_DATA || {}, demo = D.demo === true, name = str(D.name), h = [];
  var secs = (Array.isArray(D.sections) ? D.sections : []).filter(function (s) { return s && Array.isArray(s.items) && s.items.length; });
  var sid = function (s, i) { var x = String(s.id || '').replace(/[^\w-]/g, ''); return 's' + i + (x ? '-' + x : ''); };

  document.title = (name ? name + ' — ' : '') + 'المنيو';
  if (demo) h.push(demoBar('عرض تجريبي: محل مثال', 'demoMenu'));
  h.push('<h1>' + esc(name || 'المنيو') + '</h1>');
  if (str(D.note)) h.push('<p class="note">' + esc(D.note) + '</p>');

  // شريط الأقسام: يطلع بس مع قسمين أو أكثر، ويثبت فوق وقت التمرير
  if (secs.length > 1) h.push('<nav class="tabs" aria-label="أقسام المنيو">' +
    secs.map(function (s, i) { return '<a href="#' + sid(s, i) + '">' + esc(s.title) + '</a>'; }).join('') + '</nav>');

  secs.forEach(function (s, i) {
    var id = sid(s, i);
    h.push('<section class="sec" id="' + id + '" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h">' + esc(s.title) + '</h2><ul class="items">');
    s.items.forEach(function (it) {
      it = it || {};
      var price = str(it.price), desc = str(it.desc), cal = str(it.cal);
      h.push('<li class="item"><div class="row"><h3>' + esc(it.name) + '</h3>' +
        (price ? '<span class="price">' + esc(price) + '</span>' : '') + '</div>' +
        (desc ? '<p class="desc">' + esc(desc) + '</p>' : '') +
        (cal ? '<p class="cal">السعرات: ' + esc(cal) + '</p>' : '') + '</li>');
    });
    h.push('</ul></section>');
  });

  // صفحة عميل: واتساب المحل آخر المنيو (زر أساسي). العرض: الزر الكبير حقنا
  if (!demo) { var wa = shopWa(D, 'lt-wa', 'تواصل معنا على الواتساب'); if (wa) h.push('<div class="shop-wa">' + wa + '</div>'); }
  if (demo) h.push(demoEnd('زبونك', 'أبغى منيو مثل هذا لمطعمي', 'demoMenu'));
  mount(h.join(''));
})();
