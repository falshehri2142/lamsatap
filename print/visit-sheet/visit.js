// ورقة الزيارة A5 (GM-051): ورقة تنترك عند صاحب المحل أو المضيف بعد الزيارة. موادنا B2B بهويتنا: شعارنا الأسود للوثائق (GM-042).
// نفس لغة لوحات GM-050: عنوان كبير، والمنتج نفسه والنقطة المصمتة هي البطل، والباركود جهة النهاية وفوقه سطره.
// ورقتين، قرار واحد لكل وحدة: ?sheet=restaurant (المطاعم والكافيهات) أو ?sheet=host (المضيفين). بدونها: الثنتين.
// المقاسات من visit-dims.js، والنصوص ومصادرها من content.js، والمشترك من print/print.js و print/dims.js (ما نعدّلهم).
// &bleed=1 ملف المطبعة (154×216: نزف 3mm)، و&bleed=1&marks=1 مع علامات القص (164×226)، و&render=1 خلفية شفافة. نفس اتفاق print/README.md.
(function (w, d) {
  d.documentElement.setAttribute('data-ready', '0');   // أداة التصدير تنتظر "1" (markReady آخر الملف)
  var V = w.VISIT_DIMS, C = w.VISIT_CONTENT, PD = w.PRINT_DIMS || {}, SITE = w.SITE || {};
  var bleed = isBleed(), marks = bleed && isMarks();
  var only = qp('sheet'), ORDER = ['restaurant', 'host'];
  var list = only ? (C.sheets[only] ? [only] : []) : ORDER;
  var warn = [], PX_MM = 25.4 / 96;
  // النزف وعلامات القص من print/dims.js (press) بس، بدون نسخة هنا. لو ناقص: منع، والقيم صفر عشان الصفحة ترسم وتبيّن التنبيه
  var P = PD.press;
  if (!P) { warn.push(blockMsg('ما لقيت النزف وعلامات القص: print/dims.js ناقص (press).')); P = { bleed: 0, markOffset: 0, markLen: 0, markW: 0 }; }
  var mm = function (v) { return (+v).toFixed(3) + 'mm'; };
  var str = function (v) { return String(v == null ? '' : v).trim(); };
  var esc = w.escP;
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  if (only && !C.sheets[only]) warn.push(blockMsg('الورقة «' + only + '» مو معروفة. المتاح: restaurant و host.'));

  // ===== التواصل: من website/config.js لو موجود، وإلا placeholder وهمي واضح (GM-006) =====
  var fmtPhone = function (dg) { return /^9665\d{8}$/.test(dg) ? '+966 ' + dg.slice(3, 5) + ' ' + dg.slice(5, 8) + ' ' + dg.slice(8) : '+' + dg; };
  var waDigits = str(SITE.whatsapp).replace(/\D/g, '');
  var waShow = waDigits ? fmtPhone(waDigits) : C.contact.waPlaceholder;
  if (!waDigits) warn.push('رقم الواتساب وهمي (' + C.contact.waPlaceholder + '): الحقيقي ينحط في website/config.js (whatsapp) يوم الإطلاق، والورقة تاخذه لحالها.');
  var tgHandle = str(SITE.telegram).replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').replace(/\/+$/, '');
  var tgShow = tgHandle ? '@' + tgHandle : C.contact.tgPlaceholder;
  if (!tgHandle) warn.push('معرّف التليجرام وهمي (' + C.contact.tgPlaceholder + '): ينضاف في website/config.js (telegram) بعد ما يسجله صاحب المشروع (marketing/telegram-plan.md §4).');
  var domain = (str(SITE.domain) || 'https://example.com').replace(/\/+$/, '');
  var domShow = domain.replace(/^https?:\/\//i, '');
  if (/(^|\.)example\.com$/i.test(domShow)) warn.push('الموقع example.com وهمي: الدومين الحقيقي من website/config.js (domain) يوم الإطلاق (GM-008).');
  var brandName = str(SITE.companyName) || 'لمسة تاب', brandEn = str(SITE.companyNameEn) || 'LamsaTap';

  // علامات القص (&marks=1): نفس رسم cropMarks في print/print.js وقيمه من print/dims.js (press): خطوط SVG بمقاسها
  function cropMarks(W, H, slug) {
    var o = P.markOffset, L = P.markLen, x0 = slug, y0 = slug, x1 = slug + W, y1 = slug + H, pw = W + 2 * slug, ph = H + 2 * slug, dd = '';
    var n = function (v) { return +(+v).toFixed(3); };
    [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]].forEach(function (c) {
      dd += 'M' + n(c[2] < 0 ? c[0] - o - L : c[0] + o) + ' ' + n(c[1]) + 'h' + n(L) + 'M' + n(c[0]) + ' ' + n(c[3] < 0 ? c[1] - o - L : c[1] + o) + 'v' + n(L);
    });
    return '<svg class="s-marks" viewBox="0 0 ' + n(pw) + ' ' + n(ph) + '" width="' + mm(pw) + '" height="' + mm(ph) + '" aria-hidden="true" focusable="false">' +
      '<path d="' + dd + '" fill="none" stroke="#000000" stroke-width="' + P.markW + '"/></svg>';
  }

  // ===== المنتج على المسرح =====
  // المطاعم: وجه ستاند التقييم الحقيقي من signSheet (print/print.js) بهوية «مقهى المثال» حق print/stand/clients/example-cafe.js.
  // الرابط وهمي (نفس مثال example-cafe) بس عشان signSheet يرسم الوجه كامل. بعد الرسم، كل شي تحت خط القص (سطر الباركود والباركود
  // والبطاقة) ينشال من الصفحة نفسها قبل الطباعة، فما يطلع في الورقة ولا في PDF إلا باركودنا.
  var STAND_DEMO_URL = 'https://example.com/t/EXAMPLE123/';
  // عرض ورقة الستاند الحقيقية (100mm) من print/dims.js (stand.sheetW)، مو رقم هنا
  var standW = function () { return PD.stand ? PD.stand.sheetW : 0; };
  function standProduct(S, demo) {
    if (typeof w.signSheet !== 'function' || !PD.sign || !PD.stand) { warn.push(blockMsg('ما قدرت أرسم الستاند: print/print.js أو print/dims.js ناقص.')); return { html: '', r: null }; }
    var r = w.signSheet({ sign: 'vs-stand', label: 'ستاند التقييم', variant: 'stand', brand: demo, mono: false, bleed: false,
      title: S.standTitle, titleEn: S.standTitleEn, url: STAND_DEMO_URL, card: [] });
    // مو ورقة: بدون p-sheet ولا data-sign، عشان أداة التصدير ما تحسبه ورقة ثانية. وصناديقه (s-art و s-trim) بعد صناديق الورقة في ترتيب الصفحة
    var html = r.html.replace('class="p-sheet s-sheet', 'class="vs-stand s-sheet').replace(/ data-sign="[^"]*"/, '').replace(/ aria-label="[^"]*"/, ' aria-hidden="true"');
    return { html: html, r: r };
  }
  // المضيف: ملصق الشريحة on-metal 45×45 بمقاسه الحقيقي، بنفس رسم print/host-stickers/stickers.js (النقطة على nfcH/2 − chipDotUp، والسطر تحتها بـ chipLineGap)
  function chipProduct(demo) {
    var H = PD.host;
    if (!H) { warn.push(blockMsg('ما قدرت أرسم ملصق الشريحة: print/dims.js ناقص.')); return ''; }
    var s = V.chipScale, dotY = H.nfcH / 2 - V.chipDotUp;
    return '<div class="vs-chip" style="width:' + mm(H.nfcW * s) + ';height:' + mm(H.nfcH * s) + '">' +
      touchMark(dotColor(demo, false), H.dotD * s, mm((dotY - H.dotD / 2) * s), mm((H.nfcW / 2 - H.dotD / 2) * s)) +
      '<p class="p-el p-line p-center vs-chip-line" style="top:' + mm((dotY + H.dotD / 2 + V.chipLineGap) * s) + ';font-size:' + (H.touchPt * s) + 'pt">قرّب جوالك هنا</p></div>';
  }

  // ===== أدوات النص =====
  var icon = function (n) { return iconSvg(n, V.iconMM); };
  // مدى أرقام مثل «1–4» ينعرض من اليسار لليمين مثل ما ينكتب (بدون ما يقلبه اتجاه السطر العربي)
  var num = function (s) { return esc(s).replace(/(\d+\s*[–-]\s*\d+)/g, '<bdi dir="ltr">$1</bdi>'); };
  // اللي بين «» أو () ما ينكسر من نصه، ومعه «أو» اللي قبله: السطر ينكسر قبله أو بعده بس
  var keep = function (t) { return esc(t).replace(/((?:أو )?«[^»]*»|\([^)]*\))/g, '<span class="vs-keep">$1</span>'); };
  var pt = function (v) { return 'font-size:' + v + 'pt'; };

  // ===== الورقة =====
  var built = [];
  function sheetHtml(k) {
    var S = C.sheets[k], O = S.offer, demo = C.demo[k], W = V.page.w, H = V.page.h;
    var b = bleed ? P.bleed : 0, slug = bleed ? (marks ? P.markOffset + P.markLen : P.bleed) : 0;
    var qrUrl = domain + '/t/' + C.contact.qrCode[k] + '/';
    var qr = qrSvg(qrUrl, V.qrSize, V.qrQuiet);
    if (!qr) warn.push(blockMsg(S.nav + ': تعذّر توليد الباركود. تأكد من website/vendor/qrcode-generator.js.'));
    if (/EXAMPLE/.test(C.contact.qrCode[k]) || /example\.com/i.test(qrUrl)) warn.push(S.nav + ': الباركود وهمي (' + qrUrl + '). الحقيقي رابط قصير /t/<code>/ يحوّل لواتساب الشركة برسالة الباقة (مشرف الشبكة، systems/shortlinks).');

    // الشبكة: المنتج جهة النهاية (يسار، نفس عمود السعر والباركود تحت)، والتعليقات جهة البداية (يمين، نفس عمود الكلام)، وخط كل تعليق يمشي مع القراءة لين المنتج.
    // المسرح (قاعدة واحدة للمنتجين): المنتج مقفول، وحوله رملي stagePad فوق وتحت، فارتفاع المسرح = المنتج الظاهر + stagePad × 2
    var prod = '', stand = null, prodH;
    if (S.product === 'stand') {
      stand = standProduct(S, demo);
      // صندوق القص: الستاند كامل (100×150) داخل صندوق بطول خط القص يقص الباقي، وبعدين يتصغّر كله (visit.js تحت، بعد نزول الخط)
      var crop = PD.sign ? PD.sign.footTop - V.standCropGap : 0;
      prodH = crop * V.standScale;
      prod = '<div class="vs-prod vs-prod--stand" role="img" aria-label="وجه ستاند تقييم بشعار «' + esc(demo.name) + '»، والنقطة مكان اللمس" style="width:' + mm(standW()) + ';height:' + mm(crop) + '">' + stand.html + '</div>';
    } else {
      prodH = (PD.host ? PD.host.nfcH : 0) * V.chipScale;   // بدون print/dims.js: chipProduct يمنع التصدير
      prod = '<div class="vs-prod vs-prod--chip" role="img" aria-label="ملصق الشريحة 45×45 بمقاسه الحقيقي، والنقطة مكان اللمس" style="left:' + mm(V.safe + b) +
        ';top:' + mm(V.stagePad) + '">' + chipProduct(demo) + '</div>';
    }
    var stageW = W + 2 * b, stageH = prodH + 2 * V.stagePad;   // المسرح من نزف لنزف: إحداثياته = إحداثيات القص + b
    var notes = S.notes.map(function (n, i) {
      return '<div class="vs-note" data-at="' + n.at + '" data-i="' + i + '" style="left:' + mm(W - V.safe - V.noteW + b) + ';width:' + mm(V.noteW) + ';top:0">' +
        '<p class="vs-note-t" style="' + pt(V.noteTitlePt) + '">' + esc(n.t) + '</p>' +
        '<p class="vs-note-b" style="' + pt(V.noteBodyPt) + ';margin-top:' + mm(V.noteBodyGap) + '">' + esc(n.b) + '</p></div>';
    }).join('');
    var stage = '<div class="vs-stage" style="height:' + mm(stageH) + ';margin:0 ' + mm(-(V.safe + b)) + '">' + prod + notes +
      '<svg class="vs-leaders" viewBox="0 0 ' + stageW + ' ' + stageH + '" width="' + mm(stageW) + '" height="' + mm(stageH) + '" aria-hidden="true" focusable="false"></svg>' +
      '<span class="p-guide vs-guide-stage" style="left:' + mm(V.safe + b) + ';width:' + mm(W - 2 * V.safe) + ';top:0;bottom:0"></span></div>';

    // رأس العرض: اسم الباقة جهة البداية، والسعر (المحل) أو جدول الوحدات (المضيف) جهة النهاية
    var priceSide;
    if (O.price) {
      priceSide = '<div class="vs-price"><p class="vs-price-main" style="gap:' + mm(V.priceUnitGap) + '"><span class="vs-price-n" style="' + pt(V.pricePt) + '">' + esc(O.price.n) + '</span>' +
        '<span class="vs-price-u" style="' + pt(V.priceUnitPt) + '">' + esc(O.price.u) + '</span></p>' +
        '<p class="vs-price-renew" style="' + pt(V.renewPt) + ';margin-top:' + mm(V.renewGap) + '">' + esc(O.renew) + '</p></div>';
    } else {
      var T = O.tiers, gapR = 'padding-right:' + mm(V.tierColGap), headPad = 'padding-bottom:' + mm(V.tierHeadPad);
      priceSide = '<div class="vs-tiers-box"><table class="vs-tiers"><thead><tr><th style="' + headPad + '"></th>' +
        T.head.map(function (h) { return '<th style="' + pt(V.tierHeadPt) + ';' + gapR + ';' + headPad + '">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        T.rows.map(function (r) {
          return '<tr><th scope="row" style="' + pt(V.tierUnitsPt) + '">' + num(r.units) + '</th>' +
            '<td style="' + gapR + '"><span class="n" style="' + pt(V.tierPt) + '">' + esc(r.month) + '</span> <span class="u" style="' + pt(V.condPt) + '">' + esc(T.cur) + '</span></td>' +
            '<td style="' + gapR + '"><span class="y" style="' + pt(V.tierYearPt) + '">' + esc(r.year) + '</span> <span class="u" style="' + pt(V.condPt) + '">' + esc(T.cur) + '</span></td></tr>';
        }).join('') + '</tbody></table>' +
        (T.note ? '<p class="vs-tiers-note" style="' + pt(V.condPt) + ';margin-top:' + mm(V.tierNoteGap) + '">' + [].concat(T.note).map(esc).join('<br>') + '</p>' : '') + '</div>';
    }
    var cols = O.items.map(function (c) {
      return '<ul class="vs-col">' + c.map(function (t) {
        return '<li class="vs-item" style="' + pt(V.itemPt) + ';line-height:' + V.itemLh + ';gap:' + mm(V.itemIconGap) + '">' + icon('check') + '<span class="vs-item-t">' + keep(t) + '</span></li>';
      }).join('') + '</ul>';
    }).join('<span class="vs-colgap" style="width:' + mm(V.colGap) + '"></span>');
    // كل جملة شرط ما تنكسر من نصها (nowrap)، والسطر ينكسر بين الجمل بس
    var conds = O.conds.map(function (c) { return '<span class="vs-keep">' + esc(c === 'tax' ? C.contact.tax : c) + '</span>'; }).join(' ');
    var offer = '<div class="vs-offer" style="--vs-ig:' + mm(V.itemGap) + ';--vs-ilh:' + V.itemLh + '">' +
      '<div class="vs-offer-head" style="column-gap:' + mm(V.colGap) + '"><div class="vs-pkg"><p class="vs-pkg-name" style="' + pt(V.pkgPt) + '">' + esc(O.name) + '</p>' +
      '<p class="vs-pkg-sub" style="' + pt(V.pkgSubPt) + '">' + esc(O.sub) + '</p>' +
      (O.eligibility ? '<p class="vs-pkg-elig" style="' + pt(V.eligPt) + ';margin-top:' + mm(V.eligGap) + '">' + esc(O.eligibility) + '</p>' : '') + '</div>' + priceSide + '</div>' +
      '<div class="vs-items" style="margin-top:' + mm(V.headGap) + '">' + cols + '</div>' +
      '<p class="vs-conds" style="' + pt(V.condPt) + ';margin-top:' + mm(V.condGap) + '">' + conds + '</p></div>';

    // التواصل (نفس أسفل لوحات GM-050): جهة النهاية الباركود وفوقه سطره، ومربع وحداته على هامش الأمان ومسافته الهادئة البيضاء تدخل الهامش.
    // وجهة البداية بطاقة رملية: التجربة (فوق) ثم القنوات ووعد الرد (تحت). البطاقة تبدأ مع سطر الباركود وتخلص مع أسفله، وتطول لفوق لو محتواها أطول
    var capLh = V.qrCapPt * V.qrCapLh * 25.4 / 72, quiet = qr ? qr.quietMM : 0;
    var boxH = capLh + V.qrCapKeep + quiet + V.qrSize;
    // القنوات سطرين ثابتين (التسمية ثم القيمة)، عشان الشكل ما يتغير يوم الإطلاق لما تطول القيم الحقيقية
    var handle = function (l, v) { return '<p class="vs-handle"><span class="vs-handle-l" style="' + pt(V.handleLabPt) + '">' + esc(l) + '</span><span class="vs-handle-v" dir="ltr" style="' + pt(V.handlePt) + '">' + esc(v) + '</span></p>'; };
    var cardW = W - 2 * V.safe - V.qrSize - V.ctaColGap;
    var contact = '<div class="vs-contact" style="min-height:' + mm(boxH) + '">' +
      '<div class="vs-card" style="width:' + mm(cardW) + ';padding:' + mm(V.cardPadV) + ' ' + mm(V.cardPadH) + ';border-radius:' + mm(V.cardR) + '">' +
      // التجربة: مصفوفة = أسطر مقسومة من المصدر (content.js)، ونص واحد = سطر يصغر لين يدخل
      '<div class="vs-card-top"><p class="vs-trial' + (Array.isArray(S.trial) ? ' is-lines' : '') + '" style="' + pt(V.trialPt) + ';line-height:' + V.trialLh + '">' + [].concat(S.trial).map(keep).join('<br>') + '</p>' +
      '<p class="vs-trial-note" style="' + pt(V.condPt) + ';margin-top:' + mm(V.trialNoteGap) + '">' + esc(C.contact.trialNote) + '</p></div>' +
      '<div class="vs-card-bottom" style="margin-top:' + mm(V.ctaGroupGap) + '"><div class="vs-handles" style="column-gap:' + mm(V.handleColGap) + ';row-gap:' + mm(V.handleRowGap) + '">' + handle(C.contact.waLabel, waShow) + handle(C.contact.tgLabel, tgShow) + '</div>' +
      '<p class="vs-promise" style="' + pt(V.promisePt) + ';margin-top:' + mm(V.promiseGap) + '">' + esc(C.contact.promise[0]) + '<br>' + esc(C.contact.promise[1]) + '</p></div></div>' +
      '<div class="vs-qrbox" style="width:' + mm(V.qrSize) + ';height:' + mm(boxH) + '">' +
      '<p class="vs-qrcap p-el" style="' + pt(V.qrCapPt) + ';line-height:' + V.qrCapLh + ';top:0;left:' + mm(-V.qrCapOut) + ';right:' + mm(-V.qrCapOut) + '">' + esc(C.contact.qrCap) + '</p>' +
      (qr ? '<div class="vs-qr" style="left:' + mm(-quiet) + ';bottom:' + mm(-quiet) + '">' + qr.html + '</div>' : '') +
      (qr ? '<span class="p-guide" style="left:' + mm(-quiet) + ';bottom:' + mm(-quiet) + ';width:' + mm(qr.totalMM) + ';height:' + mm(qr.totalMM) + '"></span>' : '') + '</div></div>';

    // الفراغات بين الأقسام: أقل شي من visit-dims.js، والباقي من الورقة يتوزع عليهم بنسب grow.
    // flex-basis = أقل فراغ، عشان الزيادة بس هي اللي تتوزع بنسبة flex-grow
    var gap = function (name) { var g = V.gaps[name]; return '<div class="vs-gap" data-gap="' + name + '" style="min-height:' + mm(g.min) + ';flex-basis:' + mm(g.min) + ';flex-grow:' + g.grow + '"></div>'; };
    var inner = '<div class="vs-flow" style="padding:' + mm(V.safe) + '">' +
      '<div class="vs-head" style="height:' + mm(V.logo.h) + '"><img class="vs-logo" src="' + esc(V.logo.file) + '" alt="' + esc(brandName + ' — ' + brandEn) + '" style="height:' + mm(V.logo.h) + ';width:' + mm(V.logo.h * V.logo.ratio) + '">' +
      // جهة النهاية: اسمنا بالعربي (الشعار لاتيني بس، GM-033) والموقع، سطر واحد مثل ترويسة الخطاب
      '<p class="vs-site" style="' + pt(V.headPt) + ';gap:' + mm(V.siteGap) + '"><span class="vs-coname">' + esc(brandName) + '</span><span class="vs-url" dir="ltr" lang="en">' + esc(domShow) + '</span></p></div>' +
      gap('h1') +
      '<h1 class="vs-h1" style="' + pt(V.h1Pt) + ';line-height:' + V.h1Lh + '">' + esc(S.h1) + '</h1>' +
      gap('stage') + stage + gap('offer') + offer + gap('contact') + contact + '</div>' +
      '<span class="p-guide" style="top:' + mm(V.safe) + ';right:' + mm(V.safe) + ';bottom:' + mm(V.safe) + ';left:' + mm(V.safe) + '"></span>';

    var pw = W + 2 * slug, ph = H + 2 * slug;
    var html = '<section class="p-sheet vs-sheet' + (bleed ? ' is-bleed' : '') + '" data-sign="' + S.sign + '" aria-label="' + esc(S.label) + '" style="width:' + mm(pw) + ';height:' + mm(ph) + ';--vs-ic:' + mm(V.iconMM) + '">' +
      // صندوق النزف ثم صندوق القص: أول صندوقين في الورقة (أداة التصدير تاخذ أول .s-art و .s-trim)، قبل صناديق الستاند المصغّر
      '<div class="s-art" data-bleed-box style="left:' + mm(slug - b) + ';top:' + mm(slug - b) + ';width:' + mm(W + 2 * b) + ';height:' + mm(H + 2 * b) + '">' +
      '<div class="s-trim" data-trim style="left:' + mm(b) + ';top:' + mm(b) + ';width:' + mm(W) + ';height:' + mm(H) + '">' + inner + '</div></div>' +
      (marks ? cropMarks(W, H, slug) : '') + '</section>';
    built.push({ k: k, S: S, qr: qr, qrUrl: qrUrl, stand: stand, page: { w: pw, h: ph }, b: b, slug: slug, stageH: stageH });
    return html;
  }

  $p('p-sheets').innerHTML = list.map(sheetHtml).join('');
  if (built.length) setPageSize(built[0].page.w, built[0].page.h);

  // ===== بعد نزول الخط: القياس والضبط والفحص =====
  afterFont(function () {
    var report = { sheets: [] };
    built.forEach(function (B) {
      var el = d.querySelector('.p-sheet[data-sign="' + B.S.sign + '"]'), W = V.page.w, H = V.page.h;
      var trim = el.querySelector('.s-trim'), tr = trim.getBoundingClientRect();
      var rel = function (r) { return { l: (r.left - tr.left) * PX_MM, t: (r.top - tr.top) * PX_MM, r: (r.right - tr.left) * PX_MM, b: (r.bottom - tr.top) * PX_MM, w: r.width * PX_MM, h: r.height * PX_MM }; };
      var rep = { sign: B.S.sign, pageMM: [B.page.w, B.page.h], trimMM: [W, H], bleedMM: B.b, marks: marks, qrUrl: B.qrUrl };

      // 1) العنوان والتجربة: سطر واحد من حجمهم لين أقل حد، وإلا سطرين متوازنين مع تنبيه
      var fitLine = function (sel, from, min, name) {
        var e = el.querySelector(sel), p = fitText(e, from, min);
        if (overflowsP(e)) { e.classList.add('is-wrap'); e.style.fontSize = min + 'pt'; warn.push(B.S.nav + ': ' + name + ' ما دخل سطر حتى بـ ' + min + 'pt، وانكسر سطرين.'); }
        else if (p < from) warn.push(B.S.nav + ': ' + name + ' طويل، ونزل لـ ' + p + 'pt.');
        return parseFloat(e.style.fontSize);
      };
      rep.h1Pt = fitLine('.vs-h1', V.h1Pt, V.h1MinPt, 'العنوان');
      rep.trialPt = Array.isArray(B.S.trial) ? V.trialPt : fitLine('.vs-trial', V.trialPt, V.trialMinPt, 'سطر التجربة');
      if (Array.isArray(B.S.trial) && overflowsP(el.querySelector('.vs-trial'))) warn.push(blockMsg(B.S.nav + ': سطر من التجربة أعرض من عمودها.'));

      // 2) المنتج: الستاند يضبط خطه بقياسه الحقيقي (fitSign) قبل التصغير، وبعدين يتصغّر، وصندوقه يقصه عند خط القص (حد سفلي مقفول، والرملي تحته).
      //    اللي تحت خط القص (سطر الباركود والباركود والبطاقة) ينشال من الصفحة قبل القياس، فما يطلع في PDF
      var stageEl = el.querySelector('.vs-stage'), prodEl = el.querySelector('.vs-prod'), boxEl = prodEl;
      if (B.stand && B.stand.r) {
        var sEl = prodEl.querySelector('.vs-stand');
        [].forEach.call(sEl.querySelectorAll('.p-guide, .s-cap, .s-card, .s-qr, .s-qr-miss'), function (x) { x.parentNode.removeChild(x); });
        var fs = fitSign(sEl, B.stand.r);
        fs.warn.forEach(function (x) { warn.push(B.S.nav + ' (الستاند المصغّر): ' + x); });
        var crop = PD.sign.footTop - V.standCropGap, sc = V.standScale;
        prodEl.style.left = mm(V.safe + B.b);
        prodEl.style.top = mm(V.stagePad);
        prodEl.style.transform = 'scale(' + sc.toFixed(5) + ')';
        var small = 99, lowest = 0;
        [].forEach.call(sEl.querySelectorAll('p'), function (p) {
          if (!p.textContent.trim()) return;
          small = Math.min(small, parseFloat(getComputedStyle(p).fontSize) * 0.75 * sc);
          lowest = Math.max(lowest, (p.getBoundingClientRect().bottom - sEl.getBoundingClientRect().top) * PX_MM / sc);
        });
        if (lowest > crop + 0.01) warn.push(blockMsg(B.S.nav + ': نص من الستاند نازل تحت خط القص (' + r2(lowest) + 'mm من أعلاه، والقص ' + crop + 'mm).'));
        if (sEl.querySelector('.p-qr-svg')) warn.push(blockMsg(B.S.nav + ': باركود الستاند المصغّر لسا في الصفحة.'));
        rep.product = { kind: 'stand-review', scale: +sc.toFixed(4), widthMM: r2(standW() * sc), cropAtStandMM: crop, visibleMM: r2(crop * sc), lowestTextInStandMM: r2(lowest),
          innerBottomMM: r2((crop - lowest) * sc), smallestTextPt: r2(small) };
      } else {
        boxEl = prodEl.querySelector('.vs-chip') || prodEl;
        rep.product = { kind: 'chip-45', scale: V.chipScale };
      }

      // 3) التعليقات: سطر عنوان كل تعليق على نفس ارتفاع مكانه في المنتج، وخط رفيع من آخر سطر العنوان (يساره) لين المكان
      var sr = stageEl.getBoundingClientRect(), sl = function (r) { return { l: (r.left - sr.left) * PX_MM, t: (r.top - sr.top) * PX_MM, r: (r.right - sr.left) * PX_MM, b: (r.bottom - sr.top) * PX_MM }; };
      var svg = stageEl.querySelector('.vs-leaders'), paths = '', leaders = [], prevBottom = -1;

      // 3أ) حد المنتج: خط SVG بسماكة prodLine داخل حافته (مقاسه الخارجي = مقاس المنتج)، قبل خطوط التعليق فيطلعون فوقه.
      //     والفحص: المنتج مقفول وحوله رملي stagePad فوق وتحت بالضبط، وحافته على هامش الأمان (قاعدة المسرح الواحدة)
      var pb = sl(boxEl.getBoundingClientRect()), lw = V.prodLine, n3 = function (v) { return (+v).toFixed(3); };
      paths += '<rect class="vs-edge" x="' + n3(pb.l + lw / 2) + '" y="' + n3(pb.t + lw / 2) + '" width="' + n3(pb.r - pb.l - lw) + '" height="' + n3(pb.b - pb.t - lw) +
        '" fill="none" stroke-width="' + lw + '"/>';
      var inset = { top: pb.t, bottom: B.stageH - pb.b };
      if (Math.abs(inset.top - V.stagePad) > 0.05 || Math.abs(inset.bottom - V.stagePad) > 0.05) warn.push(blockMsg(B.S.nav + ': المنتج مو في نص المسرح (الرملي فوقه ' + r2(inset.top) + 'mm وتحته ' + r2(inset.bottom) + 'mm، والمطلوب ' + r2(V.stagePad) + 'mm).'));
      if (Math.abs(pb.l - (V.safe + B.b)) > 0.05) warn.push(blockMsg(B.S.nav + ': حافة المنتج مو على هامش الأمان (' + r2(pb.l - B.b) + 'mm).'));
      rep.product.boxMM = { left: r2(pb.l - B.b), top: r2(pb.t), width: r2(pb.r - pb.l), height: r2(pb.b - pb.t) };
      rep.product.insetMM = { top: r2(inset.top), bottom: r2(inset.bottom) };
      rep.product.edge = { widthMM: lw, color: getComputedStyle(svg).getPropertyValue('--lt-slate').trim() || V.color.edge };
      [].forEach.call(stageEl.querySelectorAll('.vs-note'), function (note) {
        var at = note.getAttribute('data-at'), tgt = null, x2, y;
        // x2 = حافة المكان جهة التعليق (يمين المنتج)، و y = نص ارتفاعه
        if (at === 'logo') { tgt = prodEl.querySelector('.p-logo, .p-name'); if (tgt) { var lr = sl(tgt.getBoundingClientRect()); x2 = lr.r + V.logoKeep; y = (lr.t + lr.b) / 2; } }
        else if (at === 'dot') { tgt = prodEl.querySelector('.p-mark'); if (tgt) { var dr = sl(tgt.getBoundingClientRect()); x2 = dr.r; y = (dr.t + dr.b) / 2; } }
        else if (at === 'edge') { tgt = prodEl.querySelector('.vs-chip'); if (tgt) { var cr = sl(tgt.getBoundingClientRect()); x2 = cr.r; y = cr.b - V.edgeY; } }
        if (!tgt) { warn.push(blockMsg(B.S.nav + ': ما لقيت مكان التعليق «' + at + '» في المنتج.')); return; }
        var t = note.querySelector('.vs-note-t'), lh = parseFloat(getComputedStyle(t).lineHeight) * PX_MM;
        note.style.top = mm(y - lh / 2);
        // الخط يبدأ بعد آخر حرف في سطر العنوان (يسار الحبر، مو الصندوق) ويمشي لين المكان
        var nr = sl(note.getBoundingClientRect()), rg = d.createRange(); rg.selectNodeContents(t);
        var ink = sl(rg.getBoundingClientRect()), x1 = ink.l - V.leaderGap;
        if (x1 - x2 < V.leaderMin) warn.push(blockMsg(B.S.nav + ': خط التعليق «' + t.textContent + '» قصير جداً (' + r2(x1 - x2) + 'mm، وأقله ' + V.leaderMin + 'mm).'));
        paths += '<line x1="' + x2.toFixed(3) + '" y1="' + y.toFixed(3) + '" x2="' + x1.toFixed(3) + '" y2="' + y.toFixed(3) + '" stroke="' + V.color.ink + '" stroke-width="' + V.leaderW + '" stroke-linecap="butt"/>';
        leaders.push({ at: at, fromMM: r2(x2 - B.b), toMM: r2(x1 - B.b), lengthMM: r2(x1 - x2), yInStageMM: r2(y), noteTopMM: r2(nr.t), noteBottomMM: r2(nr.b) });
        if (nr.t < prevBottom + V.noteMinGap) warn.push(blockMsg(B.S.nav + ': تعليقين قريبين من بعض (أقل من ' + V.noteMinGap + 'mm).'));
        if (nr.t < V.noteKeep || nr.b > B.stageH - V.noteKeep) warn.push(blockMsg(B.S.nav + ': التعليق «' + t.textContent + '» طالع برّا المسرح (أو أقرب من ' + V.noteKeep + 'mm لحافته).'));
        prevBottom = nr.b;
      });
      svg.innerHTML = paths;
      rep.leaders = leaders;
      var stR = rel(sr);
      rep.stage = { topMM: r2(stR.t), heightMM: r2(stR.h), leftMM: r2(stR.l), rightMM: r2(stR.r) };

      // 3ب) سطر الباركود وأعلى البطاقة على خط واحد لو الفرق صغير (capSnap، مثل sign.cardSnap في لوحات GM-050): «تقريباً على خط» يبان غلط.
      //     لو البطاقة أطول بكثير (سطرين تجربة)، السطر يبقى فوق الباركود مباشرة
      var qbox = el.querySelector('.vs-qrbox'), cardEl = el.querySelector('.vs-card');
      var over = (cardEl.getBoundingClientRect().height - qbox.getBoundingClientRect().height) * PX_MM;
      if (over > 0.05 && over <= V.capSnap) qbox.style.height = mm(parseFloat(qbox.style.height) + over);
      rep.capSnapMM = over > 0.05 && over <= V.capSnap ? r2(over) : 0;

      // 4) الباركود: مربعه 30mm جهة النهاية على هامش الأمان تحت، ومسافته الهادئة بيضاء، وسطره يخلص فوقها
      if (B.qr) {
        var qs = rel(el.querySelector('.vs-qr .p-qr-svg').getBoundingClientRect()), q = B.qr;
        var capRg = d.createRange(); capRg.selectNodeContents(el.querySelector('.vs-qrcap'));
        var cap = rel(capRg.getBoundingClientRect());
        rep.qr = { modules: q.modules, moduleMM: +q.moduleMM.toFixed(3), quietMM: +q.quietMM.toFixed(2), sizeMM: V.qrSize,
          squareMM: [r2(qs.l + q.quietMM), r2(qs.t + q.quietMM), r2(qs.r - q.quietMM), r2(qs.b - q.quietMM)], tileMM: [r2(qs.l), r2(qs.t), r2(qs.r), r2(qs.b)] };
        if (cap.b > qs.t - V.qrCapKeep + 0.01) warn.push(blockMsg(B.S.nav + ': سطر الباركود داخل مسافته الهادئة.'));
        if (q.moduleMM < 0.5) warn.push(blockMsg(B.S.nav + ': وحدة الباركود أصغر من 0.5mm (' + q.moduleMM.toFixed(2) + '). الرابط طويل.'));
        // مربع الوحدات على شبكة الورقة: حافته اليسار وأسفله على هامش الأمان (نفس حافة المنتج فوق وآخر البطاقة)
        if (Math.abs(qs.l + q.quietMM - V.safe) > 0.1 || Math.abs(qs.b - q.quietMM - (H - V.safe)) > 0.1) warn.push(blockMsg(B.S.nav + ': الباركود مو على شبكة الورقة (حافة مربعه ' + r2(qs.l + q.quietMM) + 'mm، وأسفله ' + r2(qs.b - q.quietMM) + 'mm).'));
        // البطاقة الرملية برّا المسافة الهادئة (مثل sign.cardGap في لوحات GM-050)
        var cardL = rel(el.querySelector('.vs-card').getBoundingClientRect()).l;
        if (cardL < qs.r - 0.01) warn.push(blockMsg(B.S.nav + ': البطاقة داخل المسافة الهادئة للباركود.'));
      }

      // 5) التعبئة: التواصل يخلص على هامش الأمان تحت، والفراغات بين الأقسام ما تنقص عن أقلها
      var ct = rel(el.querySelector('.vs-contact').getBoundingClientRect()), spare = 0, gaps = {};
      [].forEach.call(el.querySelectorAll('.vs-gap'), function (g) {
        var gh = rel(g.getBoundingClientRect()).h; gaps[g.getAttribute('data-gap')] = r2(gh); spare += gh - parseFloat(g.style.minHeight);
      });
      rep.gapsMM = gaps; rep.spareMM = r2(spare);
      rep.contactMM = { top: r2(ct.t), bottom: r2(ct.b), height: r2(ct.h) };
      if (ct.b > H - V.safe + 0.05) warn.push(blockMsg(B.S.nav + ': المحتوى أطول من الورقة: التواصل نازل ' + r2(ct.b - (H - V.safe)) + 'mm تحت هامش الأمان. اختصر.'));
      // البطاقة: طولها ومحتواها (لو المحتوى أطول من الباركود، البطاقة تطول لفوق، والأسفل يبقى على هامش الأمان)
      var card = el.querySelector('.vs-card'), cardR = rel(card.getBoundingClientRect()), cardIn = 0;
      [].forEach.call(card.children, function (c) { cardIn += rel(c.getBoundingClientRect()).h; });
      rep.cardMM = { top: r2(cardR.t), bottom: r2(cardR.b), height: r2(cardR.h), content: r2(cardIn), left: r2(cardR.l), right: r2(cardR.r) };

      // 6) الشعار: عرضه 21mm أو أكثر (GM-033)
      var lg = rel(el.querySelector('.vs-logo').getBoundingClientRect());
      rep.logoMM = [r2(lg.w), r2(lg.h)];
      if (lg.w < V.logo.minW - 0.05) warn.push(blockMsg(B.S.nav + ': الشعار أصغر من ' + V.logo.minW + 'mm.'));

      // 7) كل نص الورقة داخل هامش الأمان، وأقل حجم 9pt (نص المنتج المصغّر صورة للمنتج، ينحسب لحاله فوق)
      var minPt = 99, out = [];
      [].forEach.call(trim.querySelectorAll('p, h1, th, td, li'), function (x) {
        if (x.closest('.vs-prod') || !x.textContent.trim()) return;
        var rg = d.createRange(); rg.selectNodeContents(x); var bx = rel(rg.getBoundingClientRect());
        if (bx.l < V.safe - 0.2 || bx.r > W - V.safe + 0.2 || bx.t < V.safe - 0.2 || bx.b > H - V.safe + 0.2) out.push(x.textContent.trim().slice(0, 40));
        [x].concat([].slice.call(x.querySelectorAll('span'))).forEach(function (e) { if (e.textContent.trim()) minPt = Math.min(minPt, parseFloat(getComputedStyle(e).fontSize) * 0.75); });
      });
      if (out.length) warn.push(blockMsg(B.S.nav + ': نص برّا هامش الأمان ' + r2(V.safe) + 'mm: ' + out.join('، ')));
      if (minPt < V.minPt - 0.01) warn.push(blockMsg(B.S.nav + ': فيه نص أصغر من ' + V.minPt + 'pt (' + r2(minPt) + 'pt).'));
      rep.minTextPt = r2(minPt);
      rep.textOutsideSafe = out;
      report.sheets.push(rep);
    });

    var base = new URL(location.href);
    var nav = [{ k: '', label: 'الثنتين' }].concat(ORDER.map(function (k) { return { k: k, label: C.sheets[k].nav }; })).map(function (n) {
      var u = new URL(base.href); if (n.k) u.searchParams.set('sheet', n.k); else u.searchParams.delete('sheet');
      return { label: n.label, href: u.href, current: (only || '') === n.k };
    });
    previewBar({ title: 'ورقة الزيارة A5' + (bleed ? ' (ملف المطبعة' + (marks ? ' بعلامات القص' : '') + ')' : ''), mono: false, bleed: bleed, marks: marks, nav: nav, warnings: warn });
    markReady(report);

    // المعاينة في شاشة أضيق من الورقة (جوال): تتصغّر لين تساع بدون تمرير أفقي. بعد القياس، وعلى الشاشة بس (visit.css: @media screen)،
    // فما تأثر على الطباعة ولا على أداة التصدير (نافذتها أعرض من الورقة)
    var fitScreen = function () {
      var sh = d.querySelector('.p-sheet'), box = $p('p-sheets');
      if (!sh || !box) return;
      d.documentElement.classList.remove('vs-fit');
      // الحشوة من print.css نفسه (10mm، وفي الجوال 6px)، مو رقم هنا
      var cs = getComputedStyle(box), need = sh.offsetWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), have = d.documentElement.clientWidth;
      if (have < need) { d.documentElement.style.setProperty('--vs-zoom', (have / need).toFixed(3)); d.documentElement.classList.add('vs-fit'); }
    };
    if (!isRender()) { fitScreen(); w.addEventListener('resize', fitScreen); }
  });
})(window, document);
