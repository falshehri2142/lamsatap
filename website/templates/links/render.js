// صفحة الروابط: المنطق كله هنا. يستخدمه القالب (templates/links/) ونسخة العرض (demo/links/)، والرئيسية للشاشة المصغرة.
// المواصفة: موجز المدير الفني §5.7 (الروابط): لوحة مجمّعة وحدة، كل رابط صف 56px (النص + سهم)، و«واتساب» أول صف.
// بدون أيقونات في كل الصفوف (icon-style-consistent). «قيّمنا في قوقل» صف عادي بدون أي كلام عن مقابل (legal/register.md بند 4 و6).
// العرض (demo:true، web-ux ر4-1): «واتساب» أول القائمة دايماً، وكل صف يكتب سطر الحالة بدل ما يفتح.
(function (w) {
  var R = w.LT_RENDER = w.LT_RENDER || {};

  R.links = function (D, o) {
    D = D || {}; o = o || {};
    var p = o.p || '', demo = D.demo === true && !o.mini, name = str(D.name), rows = [];
    var brand = cBrand(D.brand, name);
    var ok = function (u) { return /^https:\/\/[^\s"'<>]+$/.test(u); };
    var still = D.demo === true || o.mini;   // العرض والشاشة المصغرة: الصفوف ما تفتح شي
    var row = function (label, href) {
      return still ? cRow({ tag: o.mini ? 'div' : 'button', attrs: o.mini ? '' : ' data-demo-link', title: esc(label), chevron: true })
        : cRow({ tag: 'a', attrs: ' href="' + esc(href) + '" rel="noopener"', title: esc(label), chevron: true });
    };
    var wa = waHref(D.whatsapp, str(D.waText) || 'السلام عليكم، عندي استفسار');
    if (still || wa) rows.push(row('واتساب', wa));
    (Array.isArray(D.links) ? D.links : []).forEach(function (k) {
      var label = str(k && k.label), url = str(k && k.url);
      if (label && (still || ok(url))) rows.push(row(label, url));
    });
    var h = cIdentity(brand) + '<h1 class="c-sr">' + esc(name ? 'روابط ' + name : 'روابطنا') + '</h1>' +
      (str(D.tagline) ? '<p class="c-sub l-tag">' + esc(D.tagline) + '</p>' : '') +
      (rows.length ? cPanel(rows, ' aria-label="الروابط"') : '') +
      '<p class="c-status" id="' + p + 'st" role="status" aria-live="polite"></p>' +
      (demo ? cOwner('لصاحب المحل', 'هذي الصفحة اللي يشوفها زبونك لما يقرّب جواله من الستاند أو يمسح الباركود. ونسويها بشعار محلك وألوانه.', 'أبغى صفحة روابط مثلها لمحلي', 'demoLinks') : '');
    return {
      title: name || 'روابطنا',
      bar: demo ? cDemoBar(name || 'محل مثال', 'demoLinks') : '',
      html: h, brand: brand, poweredBy: D.poweredBy,
      bind: function () {
        [].forEach.call(document.querySelectorAll('[data-demo-link]'), function (b) {
          b.addEventListener('click', function () { $(p + 'st').textContent = 'عرض تجريبي: في النسخة الحقيقية يفتح حساب المحل.'; });
        });
      }
    };
  };

  if (!w.LT_NO_MOUNT && document.getElementById('app')) {
    var D = w.LINKS_DATA || {}, r = R.links(D, {});
    applyShop(r.brand);
    document.title = r.title;
    cMount(r.bar, r.html, r.poweredBy);
    r.bind();
  }
})(window);
