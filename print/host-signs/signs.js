// لوحات وحدة المضيف (GM-050 وإضافة صاحب المشروع «نماذج الطاولة»، 2026-09-28). نفس لغة ستاند المطاعم (signSheet في print.js).
// على الباب: لوحة تأكيد الخروج بس (أكريليك 100×150، وخلفه ملصق on-metal ‏45×45، المهندس خيار ب).
// على الطاولة داخل الوحدة: ثلاث ستاندات A6، كل واحد بفعل واحد وشريحة ورابط: الواي فاي، والطوارئ، ودليل الوحدة.
// النصوص كلها بمصدرها في work/2026-09-28-host-signs/print-designer.md (جدول النصوص). الباركود وهمي في الأمثلة، والحقيقي من /t/<code>/.
(function (w, d) {
  d.documentElement.setAttribute('data-ready', '0');   // التصدير ينتظر "1" (markReady آخر الملف)
  var mono = isMono(), bleed = isBleed(), marks = bleed && isMarks(), mirror = bleed && isMirror(), only = qp('sign');

  // اللوحات: data-sign ثابت لأداة التصدير (print/renders/)
  var SIGNS = {
    checkout: { data: 'checkout', variant: 'door', label: 'لوحة تأكيد الخروج', nav: 'تأكيد الخروج', title: 'تأكيد الخروج', titleEn: 'Check-out' },
    wifi: { data: 'wifi-stand', variant: 'stand', label: 'ستاند الواي فاي', nav: 'الواي فاي', title: 'الواي فاي', titleEn: 'Wi-Fi' },
    emergency: { data: 'emergency-stand', variant: 'stand', label: 'ستاند الطوارئ', nav: 'الطوارئ', title: 'الطوارئ', titleEn: 'Emergency' },
    guide: { data: 'guest-guide-stand', variant: 'stand', label: 'ستاند دليل الوحدة', nav: 'دليل الوحدة', title: 'دليل الوحدة', titleEn: 'Guest guide' }
  };
  var ORDER = ['checkout', 'wifi', 'emergency', 'guide'];

  // أرقام الطوارئ: الأسماء والأرقام من website/config.js (SITE.emergency، نفس صفحة الدليل)، ولا ينطبع رقم إلا لو هنا بمصدر رسمي.
  // فتحتها كلها 2026-09-28:
  //   المنصة الوطنية (هيئة الحكومة الرقمية) https://my.gov.sa/en/emergency-contact : 911 Unified Emergency Number، 997 Ambulance، 998 Civil Defense، 999 Police
  //   (النسخة العربية https://my.gov.sa/ar/content/93 ترجع 403 من جهازنا؛ أرشيفها 2025-04-02 فيه «رقم الطوارئ الموحد 911، الإسعاف 997، الدفاع المدني 998، الشرطة 999»)
  //   هيئة الهلال الأحمر https://www.srca.gov.sa/ : «الخدمة الإسعافية - 997، الدفاع المدني - 998، الدوريات الأمنية - 999»
  //   الدفاع المدني https://998.gov.sa/ : «911 أو 998»
  //   911 في منطقة مكة المكرمة (وجدة منها، https://makkah.gov.sa/jeddah): واس 2025-10-01 https://www.spa.gov.sa/N2412238 (مكة والمدينة والرياض والشرقية)
  //   وواس 2026-05-15 https://www.spa.gov.sa/N2586249 . وحدة برّا هالمناطق الأربع: unified911: false في ملفها.
  var OFFICIAL = { '911': 'Unified emergency', '997': 'Ambulance', '998': 'Civil Defense', '999': 'Police' };

  // محتوى دليل الوحدة (بطاقة ستاند الدليل، 3 بالكثير): web-copy §1.2 ميزة 2 و marketing/telegram-plan.md م4
  var GUIDE = {
    ac: { icon: 'ac', ar: 'التكييف', en: 'AC' },
    checkout: { icon: 'clock', ar: 'وقت الخروج', en: 'Check-out time' },
    rules: { icon: 'rules', ar: 'الشروط', en: 'House rules' },
    address: { icon: 'location', ar: 'العنوان', en: 'Address' }
  };

  var str = function (v) { return String(v == null ? '' : v).trim(); };
  var placeholder = function (v) { return /^\[.*\]$/.test(str(v)); };

  loadClient('example-flats', function (id, found) {
    var C = w.HOST_SIGNS || {}, brand = C.brand || {}, urls = C.urls || {}, warn = [], report = { client: id, signs: [] };
    var list = only ? (SIGNS[only] ? [only] : []) : ORDER;
    // التنبيه بـ blockMsg يمنع التصدير (print.js): القطعة غلط وما تنطبع. الباقي للعلم
    if (!found) warn.push(blockMsg('ما لقيت ملف الوحدة: print/host-signs/clients/' + id + '.js'));
    if (only && !SIGNS[only]) warn.push(blockMsg('اللوحة «' + only + '» مو معروفة. المتاح: checkout و wifi و emergency و guide.'));
    if (!localLogo(brand.logo)) warn.push('ما فيه شعار: اسم العقار بيطلع نص بالحبر (GM-027).');
    else if (mono && !/\.svg$/i.test(brand.logo)) warn.push('يحتاج شعار فكتور (SVG) للحفر.');
    if (!validColor(brand.color)) warn.push('ما فيه لون للعقار: نقطة اللمس بتطلع بالأسود.');
    else if (!mono && dotColor(brand, false) === '#000000') warn.push('لون العقار فاتح على الأبيض: نقطة اللمس بتطلع بالأسود.');
    if (!mono && !str(brand.print)) warn.push('لون الطباعة (CMYK أو Pantone) ناقص. اطلب بروفة قبل الطباعة.');

    // كل لوحة لها شريحتها ورابطها (المهندس: سجل URI واحد لكل شريحة). نفس الرابط مرتين = غلط
    var seen = {};
    ORDER.forEach(function (k) {
      var u = str(urls[k]);
      if (!u) return;
      if (seen[u]) warn.push(blockMsg('رابط ' + SIGNS[k].nav + ' نفس رابط ' + SIGNS[seen[u]].nav + '. كل لوحة لها شريحة ورابط خاص.'));
      seen[u] = k;
    });

    var rowsFor = function (k) {
      if (k === 'checkout') {
        var t = str(C.checkoutTime);
        var te = str(C.checkoutTimeEn);
        return [
          // يكمّل سطر اللمس: زر صفحة الخروج (web-copy §2.2) «تم الخروج». الصفحة عربي للحين، فالسطر الإنجليزي ينقل اسم الزر كما هو
          { head: true, ar: 'واضغط «تم الخروج»', en: 'then press «تم الخروج»' },
          // وقت الخروج من المضيف (التسمية من web-copy §2.2)، بنفس شكل خانات الواي فاي
          t ? { label: 'وقت الخروج', labelEn: 'Check-out', value: t, valueDir: 'rtl', valueEn: te } : null
        ].filter(Boolean);
      }
      if (k === 'wifi') {
        var wf = C.wifi || {}, ssid = str(wf.ssid), pw = str(wf.password);
        if (!ssid) warn.push(blockMsg('الواي فاي: اسم الشبكة ناقص في ملف الوحدة.'));
        if (placeholder(ssid) || placeholder(pw)) warn.push(blockMsg('الواي فاي: اسم الشبكة أو كلمة المرور لسه نص مؤقت بين قوسين.'));
        // الخط يفرقها: I بشرطتين فوق وتحت (شكل Readex Pro الأساسي، بدون ss03)، والصفر بنقطة ("zero")، print.css .s-val.
        // جربتها 2026-09-28 (فحص ما قبل الطباعة جولة 1 بند 30): ss03 كان يخلي I خط مستقيم مثل l، وانشال
        if (/[Il1O0]/.test(pw)) warn.push('كلمة المرور فيها حروف تتشابه (I و l و 1، O و 0). الخط يفرقها (I بشرطتين، والصفر بنقطة)، بس تأكد إنها واضحة بالعين.');
        // بدون كلمة مرور: نص صفحة الواي فاي نفسه (web-copy §2.3)
        if (!pw) return [{ head: true, ar: 'الشبكة مفتوحة، بدون كلمة مرور.', en: 'Open network, no password' }, { label: 'الشبكة', labelEn: 'Network', value: ssid }];
        return [
          { head: true, ar: 'كلمة المرور جاهزة للنسخ', en: 'Password ready to copy' },     // marketing/telegram-plan.md م3
          { label: 'الشبكة', labelEn: 'Network', value: ssid },                             // web-copy §2.3
          { label: 'كلمة المرور', labelEn: 'Password', value: pw }                          // web-copy §2.3
        ];
      }
      if (k === 'emergency') {
        var src = Array.isArray((w.SITE || {}).emergency) ? w.SITE.emergency : [], rows = [], use911 = C.unified911 !== false;
        src.forEach(function (e) {
          var n = str(e && e.number).replace(/\D/g, ''), ar = str(e && e.label);
          if (!n || !ar) return;
          if (!OFFICIAL[n]) { warn.push('رقم الطوارئ ' + n + ' ما له مصدر رسمي في signs.js: ما ينطبع.'); return; }
          if (n === '911' && !use911) return;
          rows.push({ num: n, ar: ar, en: OFFICIAL[n], strong: n === '911' });
        });
        if (!use911) warn.push('بدون 911: الوحدة برّا مناطق الرقم الموحد (unified911: false).');
        if (!rows.length) warn.push(blockMsg('ما فيه أرقام طوارئ: website/config.js (emergency) فاضي.'));
        var hp = str(C.hostPhone);
        if (hp) {
          if (!/^\+?[0-9 ]{8,16}$/.test(hp)) warn.push(blockMsg('رقم المضيف شكله غلط: أرقام بس، ومسافات لو تبي.'));
          // إضافة صاحب المشروع: اختياري ويكتبه المضيف بنفسه، وما ينحفظ في n8n (GM-017). وشرط GM-003 يقول أرقام المضيف ما تطلع للضيف
          warn.push('رقم المضيف بينطبع للضيف. GM-003 يمنع ظهوره، وإضافة صاحب المشروع تسمح به اختيارياً: بموافقة المضيف المكتوبة بس، وقرار المدير العام قبل أول طباعة.');
          // الاسمين في سطر واحد «المضيف · Host»: البطاقة تساع 5 أرقام بدون ما تنقص مسافة السطر الإنجليزي
          rows.push({ num: hp, ar: 'المضيف', en: 'Host', inline: true });
        }
        return rows;
      }
      if (k === 'guide') {
        var items = Array.isArray(C.guideItems) && C.guideItems.length ? C.guideItems : ['ac', 'checkout', 'rules'];
        if (items.length > 3) warn.push('دليل الوحدة: 3 بنود بالكثير على الستاند (GM-050). انعرض أول 3.');
        return items.slice(0, 3).map(function (x) { return GUIDE[x]; }).filter(Boolean);
      }
      return [];
    };

    var html = '', built = [];
    list.forEach(function (k) {
      var sg = SIGNS[k], url = str(urls[k]);
      if (!url) warn.push(blockMsg(sg.nav + ': الرابط ناقص في ملف الوحدة (urls.' + k + ').'));
      else if (!/^https:\/\//.test(url)) warn.push(blockMsg(sg.nav + ': الرابط لازم يبدأ بـ https://'));
      else if (/example\.com/.test(url)) warn.push(sg.nav + ': باركود تجريبي (example.com). الحقيقي نفس رابط الشريحة /t/<code>/ من systems/shortlinks.');
      var r = signSheet({
        sign: sg.data, label: sg.label, variant: sg.variant, brand: brand, mono: mono, bleed: bleed, marks: marks, mirror: mirror,
        title: sg.title, titleEn: sg.titleEn, url: url, card: rowsFor(k),
        by: sg.variant === 'door' && C.poweredBy === true   // اللوحة على الجدار ما لها خلف: السطر في البطاقة (GM-023)
      });
      r.warn.forEach(function (x) { warn.push(sg.nav + ': ' + x); });
      html += r.html;
      // ستاند الطاولة: «بواسطة» في الخلف بس لو poweredBy: true (GM-023)
      if (sg.variant === 'stand' && C.poweredBy === true) html += signBack({ sign: sg.data, label: 'خلف ' + sg.label, mono: mono, bleed: bleed, marks: marks, mirror: mirror });
      built.push({ k: k, r: r });
    });
    $p('p-sheets').innerHTML = html;
    if (built.length) setPageSize(built[0].r.page.w, built[0].r.page.h);

    afterFont(function () {
      built.forEach(function (b) {
        var el = d.querySelector('.p-sheet[data-sign="' + SIGNS[b.k].data + '"]');
        var f = fitSign(el, b.r);
        f.warn.forEach(function (x) { warn.push(SIGNS[b.k].nav + ': ' + x); });
        report.signs.push({ sign: SIGNS[b.k].data, variant: SIGNS[b.k].variant, url: str(urls[b.k]), pageMM: [b.r.page.w, b.r.page.h], trimMM: [b.r.trim.w, b.r.trim.h],
          chipCenterMM: [b.r.dot.cx, b.r.chip.cy], chipZoneMM: [b.r.chip.w, b.r.chip.h],
          qr: b.r.qr ? { modules: b.r.qr.modules, moduleMM: +b.r.qr.moduleMM.toFixed(3), quietMM: +b.r.qr.quietMM.toFixed(2), totalMM: +b.r.qr.totalMM.toFixed(2) } : null,
          fit: f.report });
      });
      var base = new URL(location.href);
      var nav = [{ k: '', label: 'الكل' }].concat(ORDER.map(function (k) { return { k: k, label: SIGNS[k].nav }; })).map(function (n) {
        var u = new URL(base.href); if (n.k) u.searchParams.set('sign', n.k); else u.searchParams.delete('sign');
        return { label: n.label, href: u.href, current: (only || '') === n.k };
      });
      previewBar({ title: 'لوحات الوحدة: ' + (brand.name || id) + (mono ? ' (نسخة الحفر)' : '') + (bleed ? ' (ملف المطبعة' + (marks ? ' بعلامات القص' : '') + (mirror ? '، معكوس' : '') + ')' : ''),
        mono: mono, bleed: bleed, marks: marks, nav: nav, warnings: warn });
      markReady(report);
    });
  });
})(window, document);
