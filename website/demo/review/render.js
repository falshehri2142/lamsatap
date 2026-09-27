// صفحة التقييم (نسخة عرض بس: الشريحة الحقيقية تفتح صفحة التقييم في قوقل مباشرة، GM-002).
// المواصفة: موجز المدير الفني §5.7 (التقييم): رأس الهوية، «شكراً لزيارتك»، وزر واحد للكل «قيّمنا على قوقل».
// ولا شي ثاني فوق الطي (سياسة قوقل، legal/register.md بند 5، ودرس «زر واحد للكل»). زر البيع داخل «لصاحب المحل» بس.
(function (w) {
  var R = w.LT_RENDER = w.LT_RENDER || {};

  R.review = function (D, o) {
    D = D || {}; o = o || {};
    var p = o.p || '', demo = D.demo === true && !o.mini, brand = cBrand(D.brand, D.name);
    var h = cIdentity(brand) +
      '<section class="r-main" aria-labelledby="' + p + 'r-h"><h1 id="' + p + 'r-h">شكراً لزيارتك</h1>' +
      '<p class="r-sub">رأيك يهمنا ويساعد غيرك.</p>' +
      '<button class="lt-btn lt-btn--shop" type="button" id="' + p + 'go">قيّمنا على قوقل</button>' +
      '<p class="c-status" id="' + p + 'r-st" role="status" aria-live="polite"></p></section>';
    if (demo) h += '<section class="c-owner r-owner" aria-labelledby="owner-h"><h2 id="owner-h">لصاحب المحل</h2>' +
      '<p>هذي الصفحة اللي يشوفها زبونك لما يقرّب جواله من الستاند أو يمسح الباركود.</p>' +
      '<p>الستاند فيه شريحة NFC وباركود QR، والاثنين يفتحون نفس الصفحة.</p>' +
      '<a class="lt-wa" data-wa="demoReview" hidden><span>أبغى ستاند تقييم مثل هذا لمحلي</span></a></section>';
    return {
      title: brand.name ? 'قيّم ' + brand.name : 'قيّمنا',
      // شريط العرض بدون زر «أبغى مثله»: زر البيع في «لصاحب المحل» بس (قرار رئيس القسم)
      bar: demo ? '<aside class="c-demo" aria-label="عرض تجريبي"><div class="c-demo-in"><span>عرض تجريبي · ' + esc(brand.name || 'محل مثال') + '</span></div></aside>' : '',
      html: h, brand: brand, poweredBy: D.poweredBy,
      bind: function () {
        var go = $(p + 'go');
        if (go) go.addEventListener('click', function () {
          $(p + 'r-st').textContent = 'هذا عرض تجريبي. في النسخة الحقيقية يفتح هذا الزر صفحة تقييم محلك في قوقل مباشرة.';
        });
      }
    };
  };

  if (!w.LT_NO_MOUNT && document.getElementById('app')) {
    var D = w.REVIEW_DATA || {}, r = R.review(D, {});
    applyShop(r.brand);
    document.title = r.title;
    cMount(r.bar, r.html, r.poweredBy);
    r.bind();
  }
})(window);
