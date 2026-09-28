// أدوات مشتركة لقوالب الطباعة (print/stand/ و print/host-stickers/). أداة داخلية، مو صفحة منشورة (GM-023 بند 3).
// كل المقاسات من print/dims.js بالمليمتر. بدون أي طلب خارجي، ويشتغل من file://.
// بهوية العميل: بدون شعار لمسة تاب ولا زعفرانها ولا أي لون من ألوانها (GM-023 و GM-025)، إلا سطر «بواسطة» الاختياري.
(function (w, d) {
  var BLACK = '#000000', WHITE = '#FFFFFF';   // الطباعة: النص والباركود أسود K100 على أبيض (الموجز §6 و §4.5)

  w.$p = function (id) { return d.getElementById(id); };
  w.escP = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function s(v) { return String(v == null ? '' : v).trim(); }

  // تنبيه يمنع الطباعة (باركود ناقص أو لغرض ثاني، نص برّا الأمان، تداخل...): يطلع في المعاينة بخط عريض، ومعه console.error،
  // وأداة التصدير (print/export.cjs) تعتبر console.error خطأ صفحة وما تصدّر شي. باقي التنبيهات للعلم بس (فحص ما قبل الطباعة، جولة 1 بند 39)
  var BLOCK = 'لازم يتصلح قبل الطباعة: ';
  w.blockMsg = function (msg) {
    try { console.error('print: ' + msg); } catch (e) { /* بدون console: التنبيه يكفي */ }
    return BLOCK + msg;
  };

  // ملف العميل: ?client=<اسم> ← clients/<اسم>.js (script عادي يشتغل من file://). الاسم حروف وأرقام وشرطة بس
  w.loadClient = function (fallback, cb) {
    var m = /[?&]client=([\w-]+)/.exec(location.search), id = m ? m[1] : fallback, el = d.createElement('script');
    el.src = 'clients/' + id + '.js';
    el.onload = function () { cb(id, true); };
    el.onerror = function () { cb(id, false); };
    d.body.appendChild(el);
  };

  // تباين WCAG مع الأبيض: علامة اللمس بلون المحل لو 3 أو أكثر، وإلا أسود (الموجز §6)
  function lum(h) {
    h = h.replace('#', '');
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  w.validColor = function (h) { return /^#[0-9A-Fa-f]{6}$/.test(s(h)); };
  w.dotColor = function (brand, mono) {
    var c = s((brand || {}).color);
    if (mono || !validColor(c)) return BLACK;
    return (1.05 / (lum(c) + 0.05)) >= 3 ? c : BLACK;
  };

  // علامة مكان اللمس (GM-027): نقطة مصمتة. المسار نفسه من website/assets/illustrations/touch-mark.svg (web-illustrator)،
  // inline عشان تاخذ لون المحل (currentColor). في الحفر أسود مثل touch-mark-engrave.svg
  w.touchMark = function (color, sizeMM, top, left) {
    return '<svg class="p-el p-mark" viewBox="0 0 14 14" width="' + sizeMM + 'mm" height="' + sizeMM + 'mm" style="top:' + top + ';left:' + left + ';color:' + color +
      '" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 7a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z"/></svg>';
  };

  // الشعار: ملف محلي بس (SVG أو PNG). بدونه: اسم المحل شعار كتابي بدون لوح (GM-027، والتقييم 1 بند 6)
  w.localLogo = function (p) {
    p = s(p);
    return /^(?![a-z][a-z0-9+.-]*:)(?!\/\/)[^\s"'<>]+\.(svg|png)$/i.test(p) ? p : '';
  };
  w.logoHtml = function (brand, mono) {
    var logo = localLogo((brand || {}).logo), name = s((brand || {}).name);
    if (logo) return '<img class="p-logo" src="' + escP(logo) + '" alt="' + escP(name) + '">';
    return name ? '<span class="p-name">' + escP(name) + '</span>' : '';
  };
  // ينتظر خط الهوية (Readex Pro، محلي) قبل أي قياس للنص
  w.afterFont = function (cb) {
    if (!d.fonts || !d.fonts.load) return cb();
    Promise.all([d.fonts.load('600 16px "Readex Pro"', 'قيّم'), d.fonts.load('500 16px "Readex Pro"', 'قرّب'), d.fonts.load('700 16px "Readex Pro"', 'Wi-Fi')])
      .then(function () { return d.fonts.ready; }).then(cb, cb);
  };
  // عرض النص نفسه (Range)، مو عرض الصندوق: يكشف الطول الزايد بدون ما نقص النص (القص كان ياكل نقاط الياء، التقييم 1 بند 5)
  function inkW(el) { var r = d.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; }
  w.overflowsP = function (el) { return !!el && inkW(el) > el.clientWidth + 0.5; };
  // سطر واحد: يصغر من fromPt لين minPt لين يدخل عرضه
  w.fitText = function (el, fromPt, minPt) {
    if (!el) return;
    for (var pt = fromPt; pt >= minPt; pt -= 0.5) {
      el.style.fontSize = pt + 'pt';
      if (!overflowsP(el)) return pt;
    }
    return minPt;
  };
  // اسم المحل بدون شعار: أكبر حجم من maxPt لين minPt يدخل في maxLines سطر وداخل صندوق الشعار.
  // يرجّع الحجم، أو 0 لو ما دخل حتى بأقل حجم (ويبقى على أقل حجم، والقالب ينبّه)
  w.fitName = function (el, maxPt, minPt, maxLines) {
    if (!el) return -1;
    var box = el.parentNode;
    for (var pt = maxPt; pt >= minPt; pt -= 0.5) {
      el.style.fontSize = pt + 'pt';
      var lh = parseFloat(getComputedStyle(el).lineHeight), h = el.offsetHeight;
      if (Math.round(h / lh) <= maxLines && h <= box.clientHeight + 0.5 && !overflowsP(el)) return pt;
    }
    el.style.fontSize = minPt + 'pt';
    return 0;
  };

  // الباركود من المكتبة المحلية (website/vendor/qrcode-generator.js)، تصحيح M، أسود على أبيض.
  // sizeMM = مقاس المربع بدون المسافة الهادئة، و quiet = عدد وحدات المسافة الهادئة من كل جهة
  w.qrSvg = function (url, sizeMM, quiet) {
    if (typeof qrcode !== 'function' || !s(url)) return null;
    var q = qrcode(0, 'M'); q.addData(s(url)); q.make();
    var n = q.getModuleCount(), cell = sizeMM / n, total = n + 2 * quiet, path = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
    return {
      html: '<svg class="p-qr-svg" viewBox="0 0 ' + total + ' ' + total + '" width="' + (total * cell).toFixed(2) + 'mm" height="' + (total * cell).toFixed(2) +
        'mm" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect width="' + total + '" height="' + total + '" fill="' + WHITE + '"/><path fill="' + BLACK + '" d="' + path + '"/></svg>',
      moduleMM: cell, quietMM: quiet * cell, totalMM: total * cell, modules: n
    };
  };

  // شريط المعاينة (على الشاشة بس، ما ينطبع): النسخة، وحدود الأمان، والتنبيهات (web-copy §3)
  // opts.nav (اختياري): روابط [{label, href, current}] مثل اختيار اللوحة. opts.bleed (اختياري): زر «ملف المطبعة» (نزف 3mm)،
  // ومعه زر علامات القص (opts.marks)
  w.previewBar = function (opts) {
    var bar = $p('p-bar');
    if (!bar) return;
    var toggle = function (k, on) { var u = new URL(location.href); if (on) u.searchParams.delete(k); else u.searchParams.set(k, '1'); return u.href; };
    bar.innerHTML =
      '<p class="p-bar-h">' + escP(opts.title) + '</p>' +
      (opts.nav && opts.nav.length ? '<nav class="p-bar-nav" aria-label="اللوحات">' + opts.nav.map(function (n) {
        return '<a href="' + escP(n.href) + '"' + (n.current ? ' aria-current="page"' : '') + '>' + escP(n.label) + '</a>';
      }).join('') + '</nav>' : '') +
      '<div class="p-bar-acts">' +
      '<button type="button" id="p-variant">' + (opts.mono ? 'اعرض الملوّن' : 'اعرض نسخة الحفر') + '</button>' +
      '<button type="button" id="p-safe" aria-pressed="false">أظهر حدود الأمان</button>' +
      (opts.bleed !== undefined ? '<a class="p-bar-btn" href="' + escP(toggle('bleed', opts.bleed)) + '">' + (opts.bleed ? 'اعرض المعاينة بدون نزف' : 'ملف المطبعة: نزف 3mm') + '</a>' : '') +
      (opts.bleed ? '<a class="p-bar-btn" href="' + escP(toggle('marks', opts.marks)) + '">' + (opts.marks ? 'شيل علامات القص' : 'أضف علامات القص') + '</a>' : '') +
      '<button type="button" id="p-print">اطبع</button></div>' +
      (opts.warnings.length ? '<ul class="p-warn" role="status">' + opts.warnings.map(function (x) {
        return '<li' + (String(x).indexOf(BLOCK) >= 0 ? ' class="is-block"' : '') + '>' + escP(x) + '</li>';
      }).join('') + '</ul>' : '');
    $p('p-safe').addEventListener('click', function () {
      var on = d.body.classList.toggle('show-safe');
      this.textContent = on ? 'أخفِ حدود الأمان' : 'أظهر حدود الأمان';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $p('p-print').addEventListener('click', function () { w.print(); });
    $p('p-variant').addEventListener('click', function () { location.href = toggle('mono', opts.mono); });
  };
  w.isMono = function () { return /[?&]mono=1/.test(location.search); };
  w.companyNameP = function () { return s((w.SITE || {}).companyName) || 'لمسة تاب'; };

  // =====================================================================================================
  // لغة اللوحات الموحدة (GM-050، 2026-09-28): لوحات الوحدة (print/host-signs/) ووجه ستاند المطاعم (print/stand/).
  // نموذج واحد على ورقة 100×150: هوية العميل ← عنوان كبير (عربي ثم سطر إنجليزي قصير) ← نقطة اللمس المصمتة على مركز
  // الشريحة (البطل، GM-027) ← «قرّب جوالك هنا» ← تحت: الباركود جهة النهاية (بديل ثاني) وجهة البداية بطاقة معلومات الفعل.
  // المقاسات من PRINT_DIMS.sign و stand و door و press. الألوان من brand/tokens.css الثابتة (حبر، رمادي، رملي) + لون المحل للنقطة بس.
  // =====================================================================================================
  w.qp = function (k) {
    var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };
  w.isBleed = function () { return w.qp('bleed') === '1'; };
  // مع &bleed=1 بس: &marks=1 يضيف علامات القص (الصفحة 116×166 بدل 106×156)، و &mirror=1 يعكس الرسمة (طباعة من خلف الأكريليك لو المطبعة طلبت ملف معكوس)
  w.isMarks = function () { return w.qp('marks') === '1'; };
  w.isMirror = function () { return w.qp('mirror') === '1'; };
  // &render=1: للتصدير (صور الموقع): خلفية شفافة، بدون شريط المعاينة، والورقة بالزاوية فوق
  w.isRender = function () { return w.qp('render') === '1'; };
  if (w.isRender()) d.documentElement.classList.add('is-render');
  var mmS = function (v) { return (+v).toFixed(2) + 'mm'; };
  var PX_MM = 25.4 / 96;

  // أيقونات خطية على شبكة 20، خط 1.75، أطراف وزوايا دائرية، currentColor (نفس قواعد مجموعة الموقع، الموجز §3.3).
  // check و location منقولة حرفياً من website/assets/illustrations/icons/ (رسم web-illustrator). clock و ac و rules مرسومة هنا.
  // المصدر لكل وحدة في print/CREDITS.md. ولا أيقونة فيها موجات أو أقواس حول نقطة (GM-027، قواعد مدير الإعلانات).
  var ICON = {
    check: '<path d="M4.2 10.4 8.2 14.3 15.8 6"/>',
    location: '<path d="M10 17.6S15.6 12.6 15.6 8.3A5.6 5.6 0 0 0 4.4 8.3C4.4 12.6 10 17.6 10 17.6z"/><circle cx="10" cy="8.3" r="2.1"/>',
    clock: '<circle cx="10" cy="10" r="7.2"/><path d="M10 6.3V10l2.6 1.8"/>',
    ac: '<rect x="2.6" y="3.8" width="14.8" height="7.6" rx="2.2"/><path d="M5.4 8.4h9.2M6.6 14.2v2.4M10 14.2v3.2M13.4 14.2v2.4"/>',
    rules: '<rect x="4.2" y="2.6" width="11.6" height="14.8" rx="2.2"/><path d="M7.4 6.8h5.2M7.4 10h5.2M7.4 13.2h3"/>'
  };
  w.iconSvg = function (name, sizeMM) {
    return '<svg class="s-ic" viewBox="0 0 20 20" width="' + sizeMM + 'mm" height="' + sizeMM + 'mm" fill="none" stroke="currentColor" stroke-width="1.75"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICON[name] || '') + '</svg>';
  };

  // صف في بطاقة المعلومات:
  //   {icon, ar, en, value}      صف فيه أيقونة وسطرين (ميزة أو محتوى)
  //   {label, labelEn, value, valueDir, valueEn}   خانة: التسمية ثم القيمة (الواي فاي، وقت الخروج). القيمة ltr إلا لو valueDir: 'rtl'
  //   {num, ar, en, strong}      رقم اتصال (الطوارئ): الاسم جهة البداية والرقم جهة النهاية
  //   {num, ar, en, inline}      نفسه، والاسمين في سطر واحد «المضيف · Host» (صف رقم المضيف، عشان البطاقة تساع 5 أرقام)
  //   {head, ar, en}             سطر عنوان للبطاقة بدون أيقونة (مثل «كلمة المرور جاهزة للنسخ»)
  //   {note}                     سطر صغير آخر البطاقة (بواسطة)
  // السطر الإنجليزي تحت العربي بمسافة sign.enGap في كل الأوضاع (نقاط الحروف العربية تنزل تحت حد السطر)
  function cardRow(r, S) {
    var en = function (t) { return t ? '<p class="s-en" dir="ltr" lang="en" style="font-size:' + S.rowEnPt + 'pt;margin-top:' + S.enGap + 'mm">' + escP(t) + '</p>' : ''; };
    var ar = function (t, extra) { return '<p class="s-ar" style="font-size:' + S.rowPt + 'pt">' + escP(t) + (extra || '') + '</p>'; };
    if (r.num) {
      var txt = r.inline ? ar(r.ar, r.en ? ' · <span class="s-ar-en" dir="ltr" lang="en" style="font-size:' + S.rowEnPt + 'pt">' + escP(r.en) + '</span>' : '') : ar(r.ar) + en(r.en);
      return '<div class="s-row s-row--num' + (r.strong ? ' is-strong' : '') + '"><div class="s-row-txt">' + txt + '</div>' +
        '<p class="s-num" dir="ltr" style="font-size:' + (r.strong ? S.sosPt : S.sosPt2) + 'pt">' + escP(r.num) + '</p></div>';
    }
    if (r.label) {
      // القيمة ltr (اسم الشبكة وكلمة المرور)، أو rtl مع ترجمتها (وقت الخروج: «12 الظهر · 12 PM»)
      var rtl = r.valueDir === 'rtl';
      return '<div class="s-row s-row--field"><p class="s-lab" style="font-size:' + S.rowEnPt + 'pt">' + escP(r.label) + (r.labelEn ? ' · <span class="s-lab-en" dir="ltr" lang="en">' + escP(r.labelEn) + '</span>' : '') + '</p>' +
        '<p class="s-val" dir="' + (rtl ? 'rtl' : 'ltr') + '" style="font-size:' + S.valuePt + 'pt">' + escP(r.value) +
        (r.valueEn ? ' · <span class="s-val-en" dir="ltr" lang="en">' + escP(r.valueEn) + '</span>' : '') + '</p></div>';
    }
    if (r.note) return '<p class="s-row s-row--note" style="font-size:' + S.byPt + 'pt">' + escP(r.note) + '</p>';
    if (r.head) return '<div class="s-row s-row--head">' + ar(r.ar) + en(r.en) + '</div>';
    return '<div class="s-row s-row--item">' + (r.icon ? w.iconSvg(r.icon, S.iconMM) : '') + '<div class="s-row-txt">' +
      ar(r.ar, r.value ? '<span class="s-ar-val">' + escP(r.value) + '</span>' : '') + en(r.en) + '</div></div>';
  }

  // علامات القص (اختيارية، &marks=1): 8 خطوط برّا النزف عند زوايا خط القص (press.markOffset و markLen).
  // خطوط SVG بوحدة المليمتر، فالسماكة press.markW تطلع بمقاسها في PDF (المستطيل CSS كان يطلع بكسل كامل 0.265mm)
  function cropMarks(W, H, slug, P) {
    var o = P.markOffset, L = P.markLen, x0 = slug, y0 = slug, x1 = slug + W, y1 = slug + H, pw = W + 2 * slug, ph = H + 2 * slug, dd = '';
    var n = function (v) { return +(+v).toFixed(3); };
    [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]].forEach(function (c) {
      dd += 'M' + n(c[2] < 0 ? c[0] - o - L : c[0] + o) + ' ' + n(c[1]) + 'h' + n(L) + 'M' + n(c[0]) + ' ' + n(c[3] < 0 ? c[1] - o - L : c[1] + o) + 'v' + n(L);
    });
    return '<svg class="s-marks" viewBox="0 0 ' + n(pw) + ' ' + n(ph) + '" width="' + mmS(pw) + '" height="' + mmS(ph) + '" aria-hidden="true" focusable="false">' +
      '<path d="' + dd + '" fill="none" stroke="#000000" stroke-width="' + P.markW + '"/></svg>';
  }
  // مقاس صفحة المطبعة: بدون علامات = القطعة + النزف (106×156)، ومع العلامات = + markOffset + markLen من كل جهة (116×166)
  function pressSlug(o, P) { return o.bleed ? (o.marks ? P.markOffset + P.markLen : P.bleed) : 0; }

  // ورقة وحدة بالمقاس الحقيقي. o = {sign, label, variant:'stand'|'door', brand, mono, bleed, marks, mirror, title, titleEn, url,
  //   card: [صفوف] أو null (بدونها: سطر الباركود جنبه بدل البطاقة), by: سطر «بواسطة» على الوجه (اللوحة اللي ما لها خلف)}
  w.signSheet = function (o) {
    var S = w.PRINT_DIMS.sign, D = w.PRINT_DIMS.stand, R = w.PRINT_DIMS.door, P = w.PRINT_DIMS.press;
    var door = o.variant === 'door', W = door ? R.plateW : D.sheetW, H = door ? R.plateH : D.sheetH, safe = D.safe, cx = W / 2;
    var b = o.bleed ? P.bleed : 0, slug = pressSlug(o, P), warn = [];
    // قاعدة حامل الستاند لو تغطي أسفل الورقة (غير مؤكد، المهندس §2): كل الجزء السفلي يطلع لفوق. اللوحة ما لها قاعدة
    var up = door ? 0 : (+D.baseCover || 0);
    // منطقة الشريحة: ملصق ø30 في الستاند (المهندس §2)، وملصق on-metal ‏45×45 خلف لوحة الأكريليك (المهندس §4، خيار ب)
    var chip = door ? { cy: R.tagY, top: R.tagY - R.tagH / 2, bottom: R.tagY + R.tagH / 2, w: R.tagW, h: R.tagH, round: false }
      : { cy: D.chipY, top: D.chipY - D.chipD / 2, bottom: D.chipY + D.chipD / 2, w: D.chipD, h: D.chipD, round: true };
    var qr = qrSvg(o.url, D.qrSize, D.qrQuiet);
    // بدون باركود ما ينطبع. سبب الرابط الناقص (أو اللي لغرض ثاني) ينبّه عليه القالب نفسه (signs.js و stand.js)، وهنا عطل المكتبة بس
    if (!qr) {
      if (s(o.url)) warn.push(blockMsg('تعذّر توليد الباركود. تأكد من الرابط في ملف العميل ووجود website/vendor/qrcode-generator.js.'));
      else blockMsg('ما فيه رابط للوجه «' + s(o.title) + '»، فما فيه باركود.');
    }
    var qrTop = D.qrTop - up, quietTop = qr ? qrTop - qr.quietMM : qrTop, qrX = S.qrX, qrBottom = qrTop + D.qrSize;
    if (qr && quietTop - chip.bottom < D.gapMin) warn.push(blockMsg('الفراغ بين الشريحة والباركود أقل من ' + D.gapMin + 'mm.'));
    if (qrBottom > H - D.bottom + 0.01) warn.push(blockMsg('الباركود نازل تحت الهامش السفلي ' + D.bottom + 'mm.'));
    var foot = S.footTop - up, cardL = qrX + D.qrSize + S.cardGap, cardW = W - safe - cardL;
    var color = dotColor(o.brand, o.mono), dot = S.dotD;
    var textW = Math.min(S.titleW, W - 2 * safe), textL = (W - textW) / 2;

    var g = '<span class="p-guide" style="top:' + mmS(safe) + ';right:' + mmS(safe) + ';bottom:' + mmS(safe) + ';left:' + mmS(safe) + '"></span>' +
      '<span class="p-guide' + (chip.round ? ' p-guide--chip' : '') + ' s-guide--chip" style="top:' + mmS(chip.top) + ';left:' + mmS(cx - chip.w / 2) + ';width:' + mmS(chip.w) + ';height:' + mmS(chip.h) + '"></span>' +
      (qr ? '<span class="p-guide" style="top:' + mmS(quietTop) + ';left:' + mmS(qrX - qr.quietMM) + ';width:' + mmS(qr.totalMM) + ';height:' + mmS(qr.totalMM) + '"></span>' : '') +
      (door && o.bleed ? '<span class="p-guide s-guide--cut" style="top:0;left:0;right:0;bottom:0;border-radius:' + mmS(R.radius) + '"></span>' : '');

    var head = '<div class="p-el s-head" style="top:' + mmS(S.titleTop) + ';left:' + mmS(textL) + ';width:' + mmS(textW) + '">' +
      '<p class="s-title" style="font-size:' + S.titlePt + 'pt">' + escP(o.title) + '</p>' +
      (o.titleEn ? '<p class="s-title-en" dir="ltr" lang="en" style="font-size:' + S.titleEnPt + 'pt;margin-top:' + S.titleEnGap + 'mm">' + escP(o.titleEn) + '</p>' : '') + '</div>';

    var touch = '<div class="p-el s-touch" style="top:' + mmS(S.touchTop) + ';left:' + mmS(textL) + ';width:' + mmS(textW) + '">' +
      '<p class="s-touch-ar" style="font-size:' + S.touchPt + 'pt">قرّب جوالك هنا</p>' +
      '<p class="s-touch-en" dir="ltr" lang="en" style="font-size:' + S.touchEnPt + 'pt;margin-top:' + S.touchEnGap + 'mm">Tap your phone here</p></div>';

    var rows = (o.card || []).slice();
    if (o.by) rows.push({ note: 'بواسطة ' + companyNameP() });
    // سطر «أو امسح الباركود» بس لو فيه باركود. بدونه: مربع منقط أحمر «الباركود ناقص» يبان حتى في الطباعة، والتصدير ممنوع (blockMsg)
    var foot2 = !qr
      ? '<div class="p-el s-qr-miss" style="top:' + mmS(qrTop) + ';left:' + mmS(qrX) + ';width:' + mmS(D.qrSize) + ';height:' + mmS(D.qrSize) + '"><span>الباركود ناقص</span></div>' : '';
    foot2 += rows.length
      // بطاقة المعلومات جهة البداية، وسطر الباركود فوقه جهة النهاية. البطاقة تبدأ بطول المنطقة كلها، و fitSign يقصّرها على محتواها
      ? (qr ? '<div class="p-el s-cap" style="top:' + mmS(foot) + ';left:' + mmS(qrX) + ';width:' + mmS(D.qrSize) + '">' +
        '<p class="s-cap-ar" style="font-size:' + S.capPt + 'pt">أو امسح الباركود</p><p class="s-cap-en" dir="ltr" lang="en" style="font-size:' + S.capPt + 'pt;margin-top:' + S.capEnGap + 'mm">or scan the code</p></div>' : '') +
        '<div class="p-el s-card" style="top:' + mmS(foot) + ';left:' + mmS(cardL) + ';width:' + mmS(cardW) + ';height:' + mmS(qrBottom - foot) + ';padding:' + mmS(S.cardPad) + ';border-radius:' + mmS(S.cardR) + '">' +
        rows.map(function (r) { return cardRow(r, S); }).join('') + '</div>'
      // بدون بطاقة: سطر الباركود جنبه، في نص ارتفاعه
      : (qr ? '<div class="p-el s-cap s-cap--side" style="top:' + mmS(qrTop) + ';left:' + mmS(cardL) + ';width:' + mmS(cardW) + ';height:' + mmS(D.qrSize) + '">' +
        '<p class="s-cap-ar">أو امسح الباركود</p><p class="s-cap-en" dir="ltr" lang="en" style="margin-top:' + S.capEnGap + 'mm">or scan the code</p></div>' : '');

    var inner = g +
      // هوية العميل: شعاره بألوانه، أو اسمه نص بالحبر (GM-023 و GM-027). ولا شعار لمسة تاب ولا زعفرانها (GM-025)
      // الشعار في صندوق ثابت idH. الاسم بدون شعار: الصندوق يطول لسطرين (التقييم 1 بند 6)، و fitSign يتأكد إنه يخلص قبل العنوان
      '<div class="p-el p-logo-box s-id" style="top:' + mmS(S.idTop) + ';left:' + mmS(cx - S.idW / 2) + ';width:' + mmS(S.idW) + ';' +
        (localLogo((o.brand || {}).logo) ? 'height:' : 'min-height:') + mmS(S.idH) + '">' + logoHtml(o.brand, o.mono) + '</div>' +
      head +
      // نقطة اللمس (GM-027): دائرة مصمتة بس، بدون موجات ولا حلقات حولها، ومركزها مركز الشريحة
      touchMark(color, dot, mmS(chip.cy - dot / 2), mmS(cx - dot / 2)) +
      touch +
      (qr ? '<div class="p-el s-qr" style="top:' + mmS(quietTop) + ';left:' + mmS(qrX - qr.quietMM) + '">' + qr.html + '</div>' : '') +
      foot2;

    var sheetW = W + 2 * slug, sheetH = H + 2 * slug, marks = !!(o.bleed && o.marks);
    var cls = 'p-sheet s-sheet' + (o.mono ? ' p-mono' : '') + (o.bleed ? ' is-bleed' : '') + (o.bleed && o.mirror ? ' is-mirror' : '') + (door ? ' is-door' : '');
    var html = '<section class="' + cls + '" data-sign="' + escP(o.sign) + '" aria-label="' + escP(o.label) + '" style="width:' + mmS(sheetW) + ';height:' + mmS(sheetH) +
      (door && !o.bleed ? ';border-radius:' + mmS(R.radius) : '') + '">' +
      // خط القص على بعد slug من حافة الصفحة، والنزف يبدأ قبله بـ b. بدون علامات: slug = b، فالنزف = الصفحة كلها
      '<div class="s-art" style="left:' + mmS(slug - b) + ';top:' + mmS(slug - b) + ';width:' + mmS(W + 2 * b) + ';height:' + mmS(H + 2 * b) + '">' +
      '<div class="s-trim" style="left:' + mmS(b) + ';top:' + mmS(b) + ';width:' + mmS(W) + ';height:' + mmS(H) + '">' + inner + '</div></div>' +
      (marks ? cropMarks(W, H, slug, P) : '') + '</section>';
    return { html: html, warn: warn, qr: qr, page: { w: sheetW, h: sheetH }, trim: { w: W, h: H }, chip: chip, dot: { d: dot, cx: cx, cy: chip.cy },
      zone: { foot: foot, qrTop: qrTop, qrBottom: qrBottom, qrSize: D.qrSize } };
  };

  // خلف ستاند الطاولة: «بواسطة {companyName}» بس لو poweredBy: true بموافقة العميل المكتوبة (GM-023). 9pt أقل حد (الموجز §11)
  w.signBack = function (o) {
    var S = w.PRINT_DIMS.sign, D = w.PRINT_DIMS.stand, P = w.PRINT_DIMS.press, W = D.sheetW, H = D.sheetH;
    var b = o.bleed ? P.bleed : 0, slug = pressSlug(o, P);
    return '<section class="p-sheet s-sheet s-back' + (o.mono ? ' p-mono' : '') + (o.bleed ? ' is-bleed' : '') + (o.bleed && o.mirror ? ' is-mirror' : '') + '" data-sign="' + escP(o.sign) + '-back" aria-label="' + escP(o.label) +
      '" style="width:' + mmS(W + 2 * slug) + ';height:' + mmS(H + 2 * slug) + '"><div class="s-art" style="left:' + mmS(slug - b) + ';top:' + mmS(slug - b) + ';width:' + mmS(W + 2 * b) + ';height:' + mmS(H + 2 * b) + '">' +
      '<div class="s-trim" style="left:' + mmS(b) + ';top:' + mmS(b) + ';width:' + mmS(W) + ';height:' + mmS(H) + '">' +
      '<p class="p-el p-line p-center s-by" style="bottom:' + mmS(D.safe) + ';font-size:' + S.byPt + 'pt">بواسطة ' + escP(companyNameP()) + '</p></div></div>' +
      (o.bleed && o.marks ? cropMarks(W, H, slug, P) : '') + '</section>';
  };

  // بعد نزول الخط: يضبط الأحجام بالقياس (بدون قص النص، التقييم 1 بند 5) ويرجّع التنبيهات وتقرير القياس.
  // التنبيه اللي معناه «القطعة غلط» يمنع التصدير (blockMsg)، واللي معناه «انتبه» للعلم بس
  w.fitSign = function (sheet, o) {
    var S = w.PRINT_DIMS.sign, D = w.PRINT_DIMS.stand, warn = [], rep = {};
    var mmOf = function (px) { return px * PX_MM; };
    var trim = sheet.querySelector('.s-trim'), tr = trim.getBoundingClientRect();
    var box = function (el) { var r = el.getBoundingClientRect(); return { top: mmOf(r.top - tr.top), bottom: mmOf(r.bottom - tr.top), left: mmOf(r.left - tr.left), right: mmOf(r.right - tr.left) }; };
    // العنوان: سطر واحد من titlePt لين titleMinPt
    var t = sheet.querySelector('.s-title');
    if (t) {
      var pt = fitText(t, S.titlePt, S.titleMinPt);
      if (overflowsP(t)) warn.push(blockMsg('العنوان «' + t.textContent + '» ما دخل سطر حتى بـ ' + S.titleMinPt + 'pt. اختصره.'));
      else if (pt < S.titlePt) warn.push('العنوان طويل، ونزل لـ ' + pt + 'pt.');
    }
    var en = sheet.querySelector('.s-title-en');
    if (en && fitText(en, S.titleEnPt, 9) && overflowsP(en)) warn.push(blockMsg('السطر الإنجليزي تحت العنوان طويل. اختصره.'));
    // الاسم بدون شعار: من nameMaxPt لين nameMinPt، سطرين بالكثير داخل صندوق الهوية (التقييم 1 بند 6)
    if (fitName(sheet.querySelector('.p-name'), S.nameMaxPt, S.nameMinPt, S.nameLines) === 0)
      warn.push(blockMsg('اسم العميل ما دخل في سطرين بحجم ' + S.nameMinPt + 'pt. اختصره في ملف العميل.'));
    // القيم (الواي فاي): سطر واحد من valuePt لين 9pt (أقل حد، الموجز §11). لو أطول حتى بـ 9pt: سطرين بـ 10pt (يتكسر عند أي حرف) مع تنبيه
    [].forEach.call(sheet.querySelectorAll('.s-val'), function (v) {
      fitText(v, parseFloat(v.style.fontSize) || S.valuePt, 9);
      if (overflowsP(v)) {
        v.classList.add('is-wrap'); v.style.fontSize = '10pt';
        warn.push('«' + v.textContent + '» طويل، وانطبع سطرين. تأكد إنه واضح، أو اختصره.');
      }
    });
    // صفوف الأرقام: التسمية والرقم في سطر، والرقم يصغر لين 9pt لين يدخلون مع بعض
    var inkOf = function (el) { var r = d.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    [].forEach.call(sheet.querySelectorAll('.s-row--num'), function (row) {
      var n = row.querySelector('.s-num'), t = row.querySelector('.s-row-txt'), gap = 2.2 / PX_MM, pt = parseFloat(n.style.fontSize);
      var labW = function () { return Math.max.apply(null, [].map.call(t.children, inkOf)); };
      while (inkOf(n) + gap + labW() > row.clientWidth + 0.5 && pt > 9) { pt -= 0.5; n.style.fontSize = pt + 'pt'; }
      if (inkOf(n) + gap + labW() > row.clientWidth + 0.5) warn.push(blockMsg('الرقم «' + n.textContent + '» وتسميته ما يدخلون سطر في البطاقة.'));
    });
    // البطاقة: طولها من محتواها (whitespace-balance، sign.cardSnap في dims.js)، وتحتها دايماً على خط تحت الباركود:
    //   محتوى بطول الباركود تقريباً ← البطاقة = مربع الباركود (110 لين 140). صف واحد ← بطول محتواه وفي نص ارتفاع الباركود.
    //   أطول من الباركود ← المنطقة كلها (من خط «أو امسح الباركود» لين 140). أطول من كذا: نضيّق المسافة بين الصفوف، ثم أكثر،
    //   ثم تطول لفوق لين 3mm تحت سطر اللمس، وبعدها تنبيه. مسافة السطر الإنجليزي (sign.enGap) ما تنقص في أي حالة
    var card = sheet.querySelector('.s-card'), cardMode = '';
    if (card) {
      var Z = o.zone || {};
      // المحتوى أطول (+) أو أقصر (−) من داخل البطاقة بالمليمتر (مقاسات كسرية، مو clientHeight المقرّب لبكسل)
      var need = function () {
        var cs = getComputedStyle(card), sum = 0;
        [].forEach.call(card.children, function (c) { sum += c.getBoundingClientRect().height; });
        return mmOf(sum - (card.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)));
      };
      var setBox = function (top, h) { card.style.top = mmS(top); card.style.height = mmS(h); };
      var h0 = parseFloat(card.style.height) + need();   // طول المحتوى مع حشوة البطاقة
      if (Z.qrSize && h0 <= Z.qrSize + 0.05) {
        if (Z.qrSize - h0 <= S.cardSnap) { setBox(Z.qrTop, Z.qrSize); cardMode = 'qr'; }
        else { var hh = Math.ceil((h0 + 0.05) * 10) / 10; setBox(Z.qrTop + (Z.qrSize - hh) / 2, hh); cardMode = 'hug'; }
      } else {
        cardMode = 'zone';
        if (need() > 0.1) { card.classList.add('is-tight'); cardMode = 'tight'; }
        if (need() > 0.1) { card.classList.add('is-tighter'); cardMode = 'tighter'; }
        var grow = function () {
          var over = need(); if (over <= 0.1) return;
          var tb = sheet.querySelector('.s-touch'), minTop = tb ? box(tb.lastElementChild).bottom + 3 : parseFloat(card.style.top);
          var top = parseFloat(card.style.top), h = parseFloat(card.style.height), up = Math.min(over + 0.2, top - minTop);
          if (up > 0) { card.style.top = mmS(top - up); card.style.height = mmS(h + up); cardMode += '+grow'; }
        };
        grow();
        // آخر حل (مثل الطوارئ مع رقم المضيف): صفوف متراصة بدون خطوط، والبطاقة تطول لفوق
        if (need() > 0.1) { card.classList.add('is-dense'); cardMode = 'dense'; grow(); }
        if (need() > 0.1) warn.push(blockMsg('بطاقة المعلومات ما تساع كل الصفوف. قلّلها في ملف العميل.'));
      }
    }
    // سطر الباركود يخلص فوق مسافته الهادئة (المهندس §1)
    var cap = sheet.querySelector('.s-cap:not(.s-cap--side)'), qsv = sheet.querySelector('.s-qr');
    if (cap && qsv && box(cap).bottom > box(qsv).top - 0.3) warn.push(blockMsg('سطر «أو امسح الباركود» داخل المسافة الهادئة للباركود.'));
    // الهوية تخلص قبل العنوان
    var idb = sheet.querySelector('.s-id .p-name');
    if (idb && box(idb).bottom > S.titleTop + 0.5) warn.push(blockMsg('اسم العميل نازل على العنوان. اختصره في ملف العميل.'));
    // الرأس لازم يخلص قبل منطقة الشريحة، وسطر اللمس بعدها (الموجز §6: منطقة الشريحة ما فيها غير علامة اللمس)
    var head = sheet.querySelector('.s-head'), ch = o.chip;
    if (head && ch && box(head.lastElementChild).bottom > ch.top + 0.01 && ch.round) warn.push(blockMsg('العنوان داخل منطقة الشريحة.'));
    // كل نص داخل هامش الأمان، وأقل حجم 9pt
    var safe = D.safe, W = parseFloat(trim.style.width), H = parseFloat(trim.style.height), minPt = 99, out = [];
    [].forEach.call(trim.querySelectorAll('p, .p-name'), function (el) {
      if (!el.textContent.trim()) return;
      var r = d.createRange(); r.selectNodeContents(el); var rr = r.getBoundingClientRect();
      var bx = { top: mmOf(rr.top - tr.top), bottom: mmOf(rr.bottom - tr.top), left: mmOf(rr.left - tr.left), right: mmOf(rr.right - tr.left) };
      if (bx.left < safe - 0.2 || bx.right > W - safe + 0.2 || bx.top < safe - 0.2 || bx.bottom > H - safe + 0.2) out.push(el.textContent.trim());
      var fs = parseFloat(getComputedStyle(el).fontSize) * 0.75; if (fs < minPt) minPt = fs;
    });
    if (out.length) warn.push(blockMsg('نص برّا هامش الأمان ' + safe + 'mm: ' + out.join('، ')));
    if (minPt < 9 - 0.01) warn.push(blockMsg('فيه نص أصغر من 9pt (' + minPt.toFixed(1) + 'pt).'));
    rep.minTextPt = Math.round(minPt * 10) / 10;
    rep.textOutsideSafe = out;
    var mark = sheet.querySelector('.p-mark');
    if (mark) { var mb = box(mark); rep.dotCenterMM = [+(((mb.left + mb.right) / 2)).toFixed(2), +(((mb.top + mb.bottom) / 2)).toFixed(2)]; rep.dotDiameterMM = +((mb.right - mb.left)).toFixed(2); }
    var q = sheet.querySelector('.p-qr-svg');
    if (q) { var qb = box(q); rep.qrBoxMM = [+qb.left.toFixed(2), +qb.top.toFixed(2), +qb.right.toFixed(2), +qb.bottom.toFixed(2)]; }
    if (card) { var cb = box(card); rep.cardMM = [+cb.left.toFixed(2), +cb.top.toFixed(2), +cb.right.toFixed(2), +cb.bottom.toFixed(2)]; rep.cardMode = cardMode; }
    return { warn: warn, report: rep };
  };

  // صفحة الطباعة: مقاس الورقة (ومع النزف وعلامات القص في ملف المطبعة)
  w.setPageSize = function (wMM, hMM) {
    var pg = d.getElementById('p-page') || d.head.appendChild(d.createElement('style'));
    pg.id = 'p-page';
    pg.textContent = '@page{size:' + wMM + 'mm ' + hMM + 'mm;margin:0}';
  };
  // جاهز للتصدير: القالب يحط html[data-ready="0"] أول ما يبدأ، و"1" هنا بعد الخط والقياس. أداة التصدير (print/export.cjs) تنتظره
  w.markReady = function (report) {
    w.PRINT_REPORT = report || null;
    d.documentElement.setAttribute('data-ready', '1');
  };
})(window, document);
