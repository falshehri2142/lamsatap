// قالب ستاند العميل (الموجز الفني §6، GM-023 و GM-025 و GM-027). المقاسات كلها من print/dims.js (stand).
// الوجه: شعار المحل (أو اسمه على لوح رملي)، والعنوان حسب الغرض، ونقطة اللمس على مركز الشريحة، وسطرين، والباركود.
// الخلف: «بواسطة {companyName}» بس لو poweredBy: true بموافقة العميل. ولا زعفران ولا ألوان لمسة تاب.
(function (w, d) {
  var D = w.PRINT_DIMS.stand, mono = isMono();
  // العناوين من web-copy.md §3
  var TITLES = { review: 'قيّمنا في قوقل', menu: 'المنيو', wifi: 'الواي فاي', links: 'تابعنا' };
  var mm = function (v) { return (+v).toFixed(2) + 'mm'; };

  // مقاس صفحة الطباعة من ملف المقاسات
  var pg = d.createElement('style');
  pg.textContent = '@page{size:' + D.sheetW + 'mm ' + D.sheetH + 'mm;margin:0}';
  d.head.appendChild(pg);

  loadClient('example-cafe', function (id, found) {
    var C = w.STAND_DATA || {}, brand = C.brand || {}, warn = [];
    var title = String(C.title || TITLES[C.purpose] || '').trim();
    if (!found) warn.push('ما لقيت ملف العميل: print/stand/clients/' + id + '.js');
    if (!localLogo(brand.logo)) warn.push('ما فيه شعار: اسم المحل بيطلع نص.');
    else if (mono && !/\.svg$/i.test(brand.logo)) warn.push('يحتاج شعار فكتور (SVG) للحفر.');
    if (!validColor(brand.color)) warn.push('ما فيه لون للمحل: علامة اللمس بتطلع بالأسود.');
    else if (!mono && dotColor(brand, false) === '#000000') warn.push('لون المحل فاتح على الأبيض: علامة اللمس بتطلع بالأسود.');
    if (!mono && !String(brand.print || '').trim()) warn.push('لون الطباعة (CMYK أو Pantone) ناقص. اطلب بروفة قبل الطباعة.');

    // الباركود: المربع 30mm من qrTop، والمسافة الهادئة برّاه. لو قاعدة الحامل تغطي أسفل الورقة، يطلع لفوق
    var qr = qrSvg(C.url, D.qrSize, D.qrQuiet), qrTop = D.qrTop - (+D.baseCover || 0);
    if (!qr) warn.push('تعذّر توليد الباركود. تأكد من الرابط في ملف العميل ووجود website/vendor/qrcode-generator.js.');
    var chipBottom = D.chipY + D.chipD / 2, quietTop = qr ? qrTop - qr.quietMM : qrTop;
    if (qr && quietTop - chipBottom < D.gapMin) warn.push('الفراغ بين ملصق الشريحة والباركود أقل من ' + D.gapMin + 'mm.');

    var face =
      // حدود الأمان (المعاينة بس): هامش الأمان، ومنطقة الشعار، وملصق الشريحة، ومنطقة الباركود
      '<span class="p-guide" style="top:' + mm(D.safe) + ';right:' + mm(D.safe) + ';bottom:' + mm(D.safe) + ';left:' + mm(D.safe) + '"></span>' +
      '<span class="p-guide" style="top:0;right:0;left:0;height:' + mm(D.logoZoneEnd) + '"></span>' +
      '<span class="p-guide p-guide--chip" style="top:' + mm(D.chipY - D.chipD / 2) + ';left:' + mm(D.sheetW / 2 - D.chipD / 2) + ';width:' + mm(D.chipD) + ';height:' + mm(D.chipD) + '"></span>' +
      (qr ? '<span class="p-guide" style="top:' + mm(quietTop) + ';left:' + mm(D.sheetW / 2 - qr.totalMM / 2) + ';width:' + mm(qr.totalMM) + ';height:' + mm(qr.totalMM) + '"></span>' : '') +
      // الشعار في صندوقه، ألوانه الأصلية (في الحفر أسود)
      '<div class="p-el p-logo-box" style="top:' + mm(D.logoTop) + ';left:' + mm(D.sheetW / 2 - D.logoW / 2) + ';width:' + mm(D.logoW) + ';height:' + mm(D.logoH) + '">' + logoHtml(brand, mono) + '</div>' +
      // العنوان سطر واحد
      (title ? '<p class="p-el p-title p-center" id="p-title" style="top:' + mm(D.titleTop) + ';margin:0 auto;width:' + mm(D.titleW) + ';font-size:' + D.titlePt + 'pt">' + escP(title) + '</p>' : '') +
      // نقطة اللمس (GM-027): نقطة مصمتة بس، مركزها مركز الشريحة
      '<span class="p-el p-dot" style="top:' + mm(D.chipY - D.dotD / 2) + ';left:' + mm(D.sheetW / 2 - D.dotD / 2) + ';width:' + mm(D.dotD) + ';height:' + mm(D.dotD) + ';background:' + dotColor(brand, mono) + '"></span>' +
      '<p class="p-el p-line p-center" style="top:' + mm(D.touchTop) + ';font-size:' + D.touchPt + 'pt;font-weight:600">قرّب جوالك هنا</p>' +
      '<p class="p-el p-line p-center" style="top:' + mm(D.qrLineTop - (+D.baseCover || 0)) + ';font-size:' + D.qrLinePt + 'pt;font-weight:500">أو امسح الباركود</p>' +
      (qr ? '<div class="p-el" style="top:' + mm(quietTop) + ';left:' + mm(D.sheetW / 2 - qr.totalMM / 2) + '">' + qr.html + '</div>' : '');

    var sheet = function (inner, label) {
      return '<section class="p-sheet' + (mono ? ' p-mono' : '') + '" aria-label="' + label + '" style="width:' + mm(D.sheetW) + ';height:' + mm(D.sheetH) + '">' + inner + '</section>';
    };
    var back = C.poweredBy === true
      ? sheet('<p class="p-el p-line p-center" style="bottom:' + mm(D.safe) + ';font-size:' + D.byPt + 'pt;font-weight:500">بواسطة ' + escP(companyNameP()) + '</p>', 'خلف الستاند')
      : '';
    $p('p-sheets').innerHTML = sheet(face, 'وجه الستاند') + back;

    // القياس بعد ما ينزل خط Readex Pro (قبله يقيس بخط احتياطي أضيق، فيطلع النص أعرض بعد التحميل)
    afterFont(function () {
      // العنوان: 18pt، ولو أطول من سطر ينزل لـ 16pt (الموجز §6)
      var t = $p('p-title');
      if (t && t.scrollWidth > t.clientWidth + 0.5) { t.style.fontSize = D.titleMinPt + 'pt'; warn.push('العنوان طويل، ونزل لـ 16pt.'); }
      fitText(d.querySelector('.p-plate-t'), 16, 9);
      previewBar({ title: 'قالب الستاند: ' + (brand.name || id) + (mono ? ' (نسخة الحفر)' : ''), mono: mono, warnings: warn });
    });
  });
})(window, document);
