// الواي فاي: المنطق كله هنا. يستخدمه القالب (templates/wifi/) ونسخة العرض (demo/wifi/).
// المواصفة: web-ux.md ر3-4: نفس صندوق الواي فاي حق دليل الوحدة، والأساسي في الصفحة زر النسخ.
(function () {
  var D = window.WIFI_DATA || {}, demo = D.demo === true, place = str(D.place), wf = { ssid: D.ssid, password: D.password }, h = [];

  document.title = place ? 'واي فاي ' + place : 'الواي فاي';
  if (demo) h.push(demoBar('عرض تجريبي: محل مثال', 'demoWifi'));
  h.push('<h1>' + (place ? 'واي فاي ' + esc(place) : 'الواي فاي') + '</h1>');
  h.push(wifiBox(wf, false));
  // صفحة عميل: واتساب المحل آخر الصفحة، زر ثانوي بإطار (الأساسي هنا زر النسخ)
  if (!demo) { var wa = shopWa(D, 'lt-wa lt-wa--quiet', 'تواصل معنا على الواتساب'); if (wa) h.push('<div class="shop-wa">' + wa + '</div>'); }
  if (demo) h.push(demoEnd('زبونك', 'أبغى صفحة واي فاي مثل هذي لمحلي', 'demoWifi'));
  mount(h.join(''));
  bindWifi(wf);
})();
