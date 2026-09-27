// الواي فاي: المنطق كله هنا. يستخدمه القالب (templates/wifi/) ونسخة العرض (demo/wifi/)، والرئيسية للشاشة المصغرة.
// المواصفة: موجز المدير الفني §5.7 (الواي فاي): رأس الهوية ← «الواي فاي» ← نفس صندوق دليل الوحدة ← واتساب المحل.
(function (w) {
  var R = w.LT_RENDER = w.LT_RENDER || {};

  R.wifi = function (D, o) {
    D = D || {}; o = o || {};
    var p = o.p || '', demo = D.demo === true && !o.mini, place = str(D.place), h = [];
    var brand = cBrand(D.brand, place), wf = { ssid: D.ssid, password: D.password };
    h.push(cIdentity(brand));
    h.push('<h1>الواي فاي</h1>');
    h.push(cWifi(wf, false, p));
    // صفحة عميل: واتساب المحل زر ثانوي (الأساسي هنا زر النسخ)
    if (!D.demo && !o.mini) { var wa = cShopWa(D, 'c-btn2'); if (wa) h.push('<div class="w-wa">' + wa + '</div>'); }
    if (demo) h.push(cOwner('لصاحب المحل', 'هذي الصفحة اللي يشوفها زبونك لما يقرّب جواله من الستاند أو يمسح الباركود. ونسويها بشعار محلك وألوانه.', 'أبغى صفحة واي فاي مثلها لمحلي', 'demoWifi'));
    return {
      title: place ? 'واي فاي ' + place : 'الواي فاي',
      bar: demo ? cDemoBar(place || 'محل مثال', 'demoWifi') : '',
      html: h.join(''), brand: brand, poweredBy: D.poweredBy,
      bind: function () { cBindWifi(wf, p); }
    };
  };

  if (!w.LT_NO_MOUNT && document.getElementById('app')) {
    var D = w.WIFI_DATA || {}, r = R.wifi(D, {});
    applyShop(r.brand);
    document.title = r.title;
    cMount(r.bar, r.html, r.poweredBy);
    r.bind();
  }
})(window);
