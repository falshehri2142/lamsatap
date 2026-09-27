// صفحة الروابط: المنطق كله هنا. يستخدمه القالب (templates/links/) ونسخة العرض (demo/links/).
// المواصفة: web-ux.md ر3-4: القائمة بدون بطاقة، كل رابط زر بإطار عرض كامل، بدون أيقونات ولا شعارات منصات،
// وأول عنصر واتساب المحل لو رقمه موجود. «قيّمنا في قوقل» رابط عادي بدون أي كلام عن مقابل (legal/register.md بند 4 و6).
// العرض (demo:true، ر4-1): «واتساب» أول القائمة دايماً، وكل زر يكتب سطر الحالة بدل ما يفتح (حتى لو رابطه صحيح).
(function () {
  var D = window.LINKS_DATA || {}, demo = D.demo === true, name = str(D.name), items = [];
  var ok = function (u) { return /^https:\/\/[^\s"'<>]+$/.test(u); };
  var demoBtn = function (cls, inner) { return '<button class="' + cls + '" type="button" data-demo-link>' + inner + '</button>'; };

  document.title = name || 'روابطنا';
  if (demo) items.push(demoBtn('lt-wa lt-wa--quiet', '<span>واتساب</span>'));
  else { var wa = shopWa(D, 'lt-wa lt-wa--quiet', 'واتساب'); if (wa) items.push(wa); }
  (Array.isArray(D.links) ? D.links : []).forEach(function (k) {
    var label = str(k && k.label), url = str(k && k.url);
    if (!label) return;
    if (demo) items.push(demoBtn('btn alt', esc(label)));
    else if (ok(url)) items.push('<a class="btn alt" href="' + esc(url) + '" rel="noopener">' + esc(label) + '</a>');
    // صفحة عميل: الرابط الفاضي أو الغلط ما يطلع
  });

  mount((demo ? demoBar('عرض تجريبي: محل مثال', 'demoLinks') : '') +
    '<h1>' + esc(name || 'روابطنا') + '</h1>' +
    (str(D.tagline) ? '<p class="tagline">' + esc(D.tagline) + '</p>' : '') +
    (items.length ? '<ul class="links">' + items.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '') +
    '<p class="status" id="st" role="status" aria-live="polite"></p>' +
    (demo ? demoEnd('زبونك', 'أبغى صفحة روابط مثل هذي لمحلي', 'demoLinks') : ''));

  [].forEach.call(document.querySelectorAll('[data-demo-link]'), function (b) {
    b.addEventListener('click', function () { $('st').textContent = 'عرض تجريبي: في النسخة الحقيقية يفتح حساب المحل.'; });
  });
})();
