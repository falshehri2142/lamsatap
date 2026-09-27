// ملصقات عتاد المضيف (المهندس: engineering/stand-dimensions.md §4): ملصق on-metal 45×45 للشريحة، وجنبه ملصق باركود،
// والفراغ بين حافتيهم 10mm أو أكثر. المقاسات من print/dims.js (host). النصوص من web-copy.md §3 (عتاد المضيف):
// - ملصق الشريحة: النقطة وسطرها بس، مثل الستاند.
// - ملصق الباركود: اسم المضيف أو شعاره، والعنوان «الواي فاي ودليل الوحدة»، والباركود، و«امسح الباركود» (بدون «أو»، كل ملصق ينقرى لحاله).
// بهوية المضيف لو عنده، وإلا اسمه على لوح رملي (GM-027). ولا زعفران ولا ألوان لمسة تاب (GM-025).
(function (w, d) {
  var H = w.PRINT_DIMS.host, mono = isMono();
  var mm = function (v) { return (+v).toFixed(2) + 'mm'; };
  var sheetW = H.nfcW + H.gap + H.qrW, sheetH = Math.max(H.nfcH, H.qrH);
  var pg = d.createElement('style');
  pg.textContent = '@page{size:' + sheetW + 'mm ' + sheetH + 'mm;margin:0}';
  d.head.appendChild(pg);

  loadClient('example-flats', function (id, found) {
    var C = w.HOST_DATA || {}, brand = C.brand || {}, warn = [];
    if (!found) warn.push('ما لقيت ملف العميل: print/host-stickers/clients/' + id + '.js');
    if (!localLogo(brand.logo)) warn.push('ما فيه شعار: اسم المحل بيطلع نص.');
    else if (mono && !/\.svg$/i.test(brand.logo)) warn.push('يحتاج شعار فكتور (SVG) للحفر.');
    if (!validColor(brand.color)) warn.push('ما فيه لون للمحل: علامة اللمس بتطلع بالأسود.');
    if (!mono && !String(brand.print || '').trim()) warn.push('لون الطباعة (CMYK أو Pantone) ناقص. اطلب بروفة قبل الطباعة.');
    var qr = qrSvg(C.url, H.qrSize, H.qrQuiet);
    if (!qr) warn.push('تعذّر توليد الباركود. تأكد من الرابط في ملف العميل ووجود website/vendor/qrcode-generator.js.');
    var guide = function (w2, h2) { return '<span class="p-guide" style="top:' + mm(H.pad) + ';right:' + mm(H.pad) + ';bottom:' + mm(H.pad) + ';left:' + mm(H.pad) + '"></span>'; };
    var cls = 'p-sheet p-sticker' + (mono ? ' p-mono' : '');

    // ملصق الشريحة: النقطة في نص الملصق (مركزها مركز الشريحة)، وتحتها «قرّب جوالك هنا»
    var dotY = H.nfcH / 2 - 3;
    var nfc = '<section class="' + cls + '" aria-label="ملصق الشريحة" style="width:' + mm(H.nfcW) + ';height:' + mm(H.nfcH) + '">' + guide() +
      touchMark(dotColor(brand, mono), H.dotD, mm(dotY - H.dotD / 2), mm(H.nfcW / 2 - H.dotD / 2)) +
      '<p class="p-el p-line p-center" style="top:' + mm(dotY + H.dotD / 2 + 3) + ';font-size:' + H.touchPt + 'pt;font-weight:600">قرّب جوالك هنا</p></section>';

    // ملصق الباركود: الهوية فوق، ثم العنوان، ثم الباركود بمسافته الهادئة، ثم «امسح الباركود»
    var y = H.pad, logoH = H.logoH, titleTop = y + logoH + 2, qrTop = titleTop + 6;
    var qrs = '<section class="' + cls + '" aria-label="ملصق الباركود" style="width:' + mm(H.qrW) + ';height:' + mm(H.qrH) + '">' + guide() +
      '<div class="p-el p-logo-box" style="top:' + mm(y) + ';left:' + mm(H.pad) + ';width:' + mm(H.qrW - 2 * H.pad) + ';height:' + mm(logoH) + '">' + logoHtml(brand, mono) + '</div>' +
      '<p class="p-el p-title p-center" id="p-title" style="top:' + mm(titleTop) + ';margin:0 auto;width:' + mm(H.qrW - 2 * H.pad) + ';font-size:' + H.titlePt + 'pt">الواي فاي ودليل الوحدة</p>' +
      (qr ? '<div class="p-el" style="top:' + mm(qrTop) + ';left:' + mm(H.qrW / 2 - qr.totalMM / 2) + '">' + qr.html + '</div>' : '') +
      '<p class="p-el p-line p-center" style="bottom:' + mm(H.pad) + ';font-size:' + H.qrLinePt + 'pt;font-weight:500">امسح الباركود</p></section>';
    if (qr && qrTop + qr.totalMM > H.qrH - H.pad - 5) warn.push('الباركود ما يدخل في ملصقه بهالمقاس. كبّر qrH في print/dims.js.');

    // الملصقين جنب بعض، والفراغ بينهم نفس الفراغ المطلوب وقت التركيب (المهندس §4)
    $p('p-sheets').innerHTML = '<div class="p-pair" style="gap:' + mm(H.gap) + '">' + nfc + qrs + '</div>';
    afterFont(function () {
      fitText(d.querySelector('.p-plate-t'), 12, 7);
      // العنوان سطر واحد 9pt أو أكثر، وإلا سطرين «الواي فاي» ثم «ودليل الوحدة» (web-copy §3)
      var t = $p('p-title');
      if (t && fitText(t, H.titlePt, 9) === 9 && t.scrollWidth > t.clientWidth + 0.5) {
        t.style.whiteSpace = 'normal'; t.innerHTML = 'الواي فاي<br>ودليل الوحدة';
      }
      previewBar({ title: 'ملصقات المضيف: ' + (brand.name || id) + (mono ? ' (نسخة الحفر)' : ''), mono: mono, warnings: warn });
    });
  });
})(window, document);
