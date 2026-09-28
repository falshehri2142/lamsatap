// قالب ستاند العميل (الموجز الفني §6، GM-023 و GM-025 و GM-027)، بلغة اللوحات الموحدة (GM-050، 2026-09-28): نفس نموذج لوحات الوحدة
// (signSheet في print/print.js). الشبكة الهندسية كما هي من print/dims.js (stand): مركز الشريحة 62mm، والباركود 30mm من 110 إلى 140،
// والفراغ 10mm أو أكثر بينه وبين ملصق الشريحة. قيم التصميم من dims.js (sign).
// الوجه: شعار المحل (أو اسمه نص بالحبر)، والعنوان حسب الغرض بالعربي ثم الإنجليزي، ونقطة اللمس على مركز الشريحة، وسطر اللمس، والباركود بديل ثاني.
// الخلف: «بواسطة {companyName}» بس لو poweredBy: true بموافقة العميل. ولا زعفران ولا ألوان لمسة تاب، ولا شعار قوقل ولا حرف G ولا نجوم.
// كل وجه له شريحته ورابطه (المهندس: سجل URI واحد لكل شريحة): url للغرض purpose، و urls.<الغرض> لوجه ثاني لنفس المحل (اختياري).
(function (w, d) {
  d.documentElement.setAttribute('data-ready', '0');   // التصدير ينتظر "1" (markReady آخر الملف)
  var mono = isMono(), bleed = isBleed(), marks = bleed && isMarks(), mirror = bleed && isMirror();
  var PURPOSES = ['review', 'menu', 'wifi', 'links'];
  // العناوين من web-copy.md §3، والإنجليزي سطر قصير ثاني لنفس المعنى (GM-050: «عربي أول، وإنجليزي ثاني قصير»)
  var TITLES = { review: 'قيّمنا في قوقل', menu: 'المنيو', wifi: 'الواي فاي', links: 'تابعنا' };
  var TITLES_EN = { review: 'Review us on Google', menu: 'Menu', wifi: 'Wi-Fi', links: 'Follow us' };
  // بطاقة المزايا جنب الباركود (بطاقة لوحات الوحدة نفسها)، ميزة أو ثنتين من الوعود المعتمدة بس (GM-050: 3 بالكثير، و«كلام أقل»):
  //   «بدون تطبيق»: sales/host-track.md:42 و web-copy §1.6 («ما يحتاج تطبيق»)، ومسموحة في موجز GM-050
  //   «بالأسعار والسعرات»: web-copy §1.3 صف 2 («المنيو، بالأسعار والسعرات»، إلزام الغذاء والدواء)
  //   «كلمة المرور جاهزة للنسخ»: marketing/telegram-plan.md م3
  // «بلمسة أو بالباركود» انشالت (2026-09-28، مراجعة التصدير): تعيد نفس معنى «قرّب جوالك هنا» و«أو امسح الباركود» اللي فوقها
  var NO_APP = { icon: 'check', ar: 'بدون تطبيق', en: 'No app needed' };
  var CARD = {
    review: [NO_APP],
    menu: [{ icon: 'check', ar: 'بالأسعار والسعرات', en: 'Prices and calories' }, NO_APP],
    wifi: [{ icon: 'check', ar: 'كلمة المرور جاهزة للنسخ', en: 'Password ready to copy' }, NO_APP],
    links: [NO_APP]
  };
  var str = function (v) { return String(v == null ? '' : v).trim(); };

  loadClient('example-cafe', function (id, found) {
    var C = w.STAND_DATA || {}, brand = C.brand || {}, warn = [];
    var urls = C.urls && typeof C.urls === 'object' ? C.urls : {};
    var own = str(C.purpose);
    // &purpose=menu يفتح وجه ثاني لنفس المحل، وإلا الغرض من ملف العميل
    var purpose = qp('purpose') || own;
    // رابط الوجه: urls.<الغرض>، وإلا url لو هذا غرض الملف (أو الملف ما حدد غرض).
    // وجه غير غرض الملف بدون رابطه = بدون باركود وتنبيه: الرابط الغلط (باركود المنيو يفتح التقييم) أخطر من الناقص
    var linkOf = function (p) { return str(urls[p]) || (!own || p === own ? str(C.url) : ''); };
    var url = linkOf(purpose);
    var custom = str(C.title);
    var title = custom || TITLES[purpose] || '';
    var titleEn = custom ? str(C.titleEn) : (TITLES_EN[purpose] || '');
    // التنبيه بـ blockMsg يمنع التصدير (print.js): القطعة غلط وما تنطبع. الباقي للعلم
    if (!found) warn.push(blockMsg('ما لقيت ملف العميل: print/stand/clients/' + id + '.js'));
    if (!title) warn.push(blockMsg('ما فيه عنوان: purpose لازم review أو menu أو wifi أو links، أو title في ملف العميل.'));
    if (custom && !titleEn) warn.push('عنوان خاص بدون سطر إنجليزي (titleEn). يطلع العربي بس.');
    // &purpose= لغرض غير غرض الملف: الرابط url حق وجه ثاني (فحص ما قبل الطباعة، جولة 1 بند 33)، فالباركود ما ينطبع لين ينحط urls.<الغرض>
    if (!url && own && purpose !== own) warn.push(blockMsg('وجه «' + (TITLES[purpose] || purpose) + '» ما له رابط في ملف العميل (urls.' + purpose + '). الرابط url لوجه «' + (TITLES[own] || own) + '»، وكل وجه له شريحة ورابط خاص. الباركود ما انطبع.'));
    else if (!url) warn.push(blockMsg('الرابط ناقص في ملف العميل (url).'));
    else if (!/^https:\/\//.test(url)) warn.push(blockMsg('الرابط لازم يبدأ بـ https://'));
    // نفس الرابط لوجهين = غلط (كل وجه له شريحة)
    var seen = {};
    PURPOSES.forEach(function (p) {
      var u = str(urls[p]) || (p === own ? str(C.url) : '');
      if (!u) return;
      if (seen[u]) warn.push(blockMsg('رابط «' + TITLES[p] + '» نفس رابط «' + TITLES[seen[u]] + '». كل وجه له شريحة ورابط خاص.'));
      else seen[u] = p;
    });
    if (!localLogo(brand.logo)) warn.push('ما فيه شعار: اسم المحل بيطلع نص.');
    else if (mono && !/\.svg$/i.test(brand.logo)) warn.push('يحتاج شعار فكتور (SVG) للحفر.');
    if (!validColor(brand.color)) warn.push('ما فيه لون للمحل: علامة اللمس بتطلع بالأسود.');
    else if (!mono && dotColor(brand, false) === '#000000') warn.push('لون المحل فاتح على الأبيض: علامة اللمس بتطلع بالأسود.');
    if (!mono && !str(brand.print)) warn.push('لون الطباعة (CMYK أو Pantone) ناقص. اطلب بروفة قبل الطباعة.');
    if (/example\.com/.test(url)) warn.push('باركود تجريبي (example.com). الحقيقي نفس رابط الشريحة /t/<code>/ من systems/shortlinks.');

    var sign = 'stand-' + (TITLES[purpose] ? purpose : 'custom');
    var card = qp('card') === '0' ? null : (CARD[purpose] || [NO_APP]);
    var r = signSheet({ sign: sign, label: 'وجه الستاند', variant: 'stand', brand: brand, mono: mono, bleed: bleed, marks: marks, mirror: mirror,
      title: title, titleEn: titleEn, url: url, card: card });
    r.warn.forEach(function (x) { warn.push(x); });
    var back = C.poweredBy === true ? signBack({ sign: sign, label: 'خلف الستاند', mono: mono, bleed: bleed, marks: marks, mirror: mirror }) : '';
    $p('p-sheets').innerHTML = r.html + back;
    setPageSize(r.page.w, r.page.h);

    // القياس بعد ما ينزل خط Readex Pro (قبله يقيس بخط احتياطي أضيق، فيطلع النص أعرض بعد التحميل)
    afterFont(function () {
      var f = fitSign(d.querySelector('.p-sheet[data-sign="' + sign + '"]'), r);
      f.warn.forEach(function (x) { warn.push(x); });
      // أزرار الأوجه: بس الأغراض اللي لها رابط في ملف العميل
      var base = new URL(location.href), avail = PURPOSES.filter(function (p) { return !!linkOf(p) && (p === own || str(urls[p])); });
      var nav = avail.length > 1 ? avail.map(function (p) {
        var u = new URL(base.href); u.searchParams.set('purpose', p);
        return { label: TITLES[p], href: u.href, current: purpose === p };
      }) : [];
      previewBar({ title: 'قالب الستاند: ' + (brand.name || id) + (mono ? ' (نسخة الحفر)' : '') + (bleed ? ' (ملف المطبعة' + (marks ? ' بعلامات القص' : '') + (mirror ? '، معكوس' : '') + ')' : ''),
        mono: mono, bleed: bleed, marks: marks, nav: nav, warnings: warn });
      markReady({ client: id, signs: [{ sign: sign, variant: 'stand', url: url, pageMM: [r.page.w, r.page.h], trimMM: [r.trim.w, r.trim.h], chipCenterMM: [r.dot.cx, r.chip.cy], chipZoneMM: [r.chip.w, r.chip.h],
        qr: r.qr ? { modules: r.qr.modules, moduleMM: +r.qr.moduleMM.toFixed(3), quietMM: +r.qr.quietMM.toFixed(2), totalMM: +r.qr.totalMM.toFixed(2) } : null, fit: f.report }] });
    });
  });
})(window, document);
