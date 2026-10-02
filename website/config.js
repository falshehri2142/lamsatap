// الإعداد المشترك لكل صفحات website/ (GM-006). غيّر القيم هنا فقط.
// domain: دومين الإطلاق المعتمد من صاحب المشروع (2026-09-30).
// اسم الشركة بالعربي والإنجليزي: يطلع في كل الصفحات، وسكربت الشعار brand/src/build_logo.py يقرأه من هنا.
// whatsapp: رقم التواصل المعتمد من صاحب المشروع. أرقام فقط بصيغة دولية بدون +.
//   إذا فاضي: كل أزرار واتساب الشركة تختفي في كل الصفحات، وأقسام الواتساب والاتصال ما تطلع في دليل وحدة عميل.
// waText: رسائلنا الجاهزة لرقم الشركة. صفحات الشركة من web-copy «الاتجاه 3» (جدول «رسائل الواتساب لكل صفحة»)،
//   ونسخ العرض من web-copy §2.6، ورسائل الدليل الثلاث من systems/architecture.md §8.
//   سطر واحد لكل رسالة. {unitRef} ينعوض بمرجع الوحدة، ولازم يبقى في رسائل الدليل الثلاث وإلا ما تطلع أزرارها.
//   المفتاح shop اسم داخلي بس، وصفحته restaurants/ (web-copy «الاتجاه 3»).
window.SITE = {
  domain: "https://lamsatap.com",
  companyName: "لمسة تاب",
  companyNameEn: "LamsaTap",
  // السجل التجاري: فاضي إلى أن يضاف الرقم الرسمي؛ سطره في التذييل يبقى مخفياً.
  commercialRegistration: "",
  whatsapp: "966507250396",
  // telegram: يوزر بوت الشركة في تليجرام بدون @ (GM-047). فتحه صاحب المشروع 2026-09-28 (رسالة المدير العام)، وصفحته العامة t.me/lamsatap_bot موجودة.
  //   إذا فاضي: رابط «أو كلمنا على تليجرام» يختفي. الرابط ينبني https://t.me/<telegram>. روابط دليل الوحدة (?start=...) ما تنضاف لين يرد المحامي.
  telegram: "lamsatap_bot",
  // telegramChannel: يوزر قناة البث (للتذييل) بدون @. فاضي = الرابط يختفي. الرابط ينبني https://t.me/<telegramChannel>.
  telegramChannel: "",
  // links: روابط سياسة الخصوصية والشروط في ذيل صفحات الشركة (التقييم 2 بند 7). رابط كامل https://… بعد ما تنكتب السياسات.
  //   فاضي = الرابط ما يطلع (مثل الواتساب)، عشان ما يطلع رابط ما يودّي مكان.
  links: { privacy: "", terms: "" },
  // cleaningPrices (GM-067): سعر زيارة «نظافة بعد الخروج» لكل حجم وحدة، نص جاهز مثل "179 ريال للزيارة".
  //   فاضي = يطلع «السعر قريباً». ما ينعبى إلا بعد اعتماده في services/pricing.md.
  cleaningPrices: { studio: "", twoThree: "" },
  // smartStayPrices (مقترح GM-068، work/2026-10-01-smart-stay/study.md): سعر باقات «الإقامة الذكية» للوحدة، نص جاهز مثل "99 ريال للوحدة بالشهر".
  //   entry = دخول ذكي، entryClean = دخول + نظافة، full = إدارة كاملة. فاضي = «السعر قريباً». ما ينعبى إلا بعد اعتماده في services/pricing.md.
  smartStayPrices: { entry: "", entryClean: "", full: "" },
  // restaurantOpsPrices (مقترح GM-072، services/restaurant-ops.md): أرقام كنص بدون «ريال». order/pro بالشهر لكل فرع، s لين 15 طاولة، m ‏16–30، l ‏31–60.
  //   setup التأسيس (يشمل 15 طاولة)، perTable لكل طاولة زيادة. فاضي = «السعر قريباً». ما ينعبى إلا بعد الاعتماد في services/pricing.md.
  restaurantOpsPrices: { order: { s: "", m: "", l: "" }, pro: { s: "", m: "", l: "" }, setup: "", perTable: "" },
  waText: {
    // البوابة: الكبسولة و«اسأل إنسان»
    home: "السلام عليكم، شفت موقعكم وعندي استفسار.",
    // المطاعم والكافيهات (restaurants/): الكبسولة و«اسأل إنسان»، ثم أزرار التجربة، ثم سطر ستاند التقييم لأي نشاط
    shop: "السلام عليكم، أبغى حزمة المحل الكامل لمطعمي أو كافيهي. اسم المحل والحي:",
    shopTrial: "السلام عليكم، أبغى أجرّب حزمة المحل الكامل لمطعمي أو كافيهي أسبوعين. اسم المحل والحي:",
    shopOrder: "السلام عليكم، أبغى إدارة المطعم (الطلب من الطاولة ونداء النادل) لمحلي. اسم المحل والحي وعدد الطاولات:",
    reviewAny: "السلام عليكم، أبغى ستاند تقييم قوقل لنشاطي. نوع النشاط والحي:",
    // المضيفين (hosts/): الكبسولة و«اسأل إنسان»، ثم أزرار التجربة، ثم شريط خصم المحافظ
    host: "السلام عليكم، أبغى باقة المضيف لشققي. عدد الوحدات والحي:",
    hostTrial: "السلام عليكم، أبغى أجرّب باقة المضيف أسبوعين. عدد الوحدات والحي:",
    hostCleaning: "السلام عليكم، أبغى نظافة بعد الخروج لوحداتي. عدد الوحدات والحي:",
    // باقات الإقامة الذكية (hosts/#stay، مقترح GM-068)
    stayEntry: "السلام عليكم، أبغى باقة الدخول الذكي لوحداتي. عدد الوحدات والحي:",
    stayEntryClean: "السلام عليكم، أبغى باقة الدخول الذكي مع نظافة بعد الخروج. عدد الوحدات والحي:",
    stayFull: "السلام عليكم، أبغى باقة الدخول الذكي مع تقويم الحجوزات لوحداتي. عدد الوحدات والحي:",
    portfolio: "السلام عليكم، عندي 5 وحدات أو أكثر، وأبغى باقة المضيف لها. عدد الوحدات والحي:",
    // GM-070: نفس الرسائل للصفحات الإنجليزية (web-copy، work/2026-10-01-english-site/copy-en.md §6). الصفحة اللي <html lang="en">
    //   تاخذ <المفتاح>En، ولو فاضي ترجع للعربي (assets/app.js waText). نسخ العرض ودليل الوحدة تبقى عربي (صفحات الزبون عربية)
    homeEn: "Hi, I saw your website and have a question.",
    shopEn: "Hi, I'm interested in the Full Venue Package for my restaurant or café. Venue name and neighborhood:",
    shopTrialEn: "Hi, I'd like to try the Full Venue Package at my restaurant or café for two weeks. Venue name and neighborhood:",
    shopOrderEn: "Hi, I'd like Restaurant Ops (table ordering and waiter calls) for my venue. Venue name, neighborhood and number of tables:",
    reviewAnyEn: "Hi, I'd like a Google review stand for my business. Type of business and neighborhood:",
    hostEn: "Hi, I'm interested in the Host Plan for my apartments. Number of units and neighborhood:",
    hostTrialEn: "Hi, I'd like to try the Host Plan for two weeks. Number of units and neighborhood:",
    hostCleaningEn: "Hi, I'd like post-checkout cleaning for my units. Number of units and neighborhood:",
    stayEntryEn: "Hi, I'm interested in Smart Entry for my units. Number of units and neighborhood:",
    stayEntryCleanEn: "Hi, I'm interested in Smart Entry with post-checkout cleaning. Number of units and neighborhood:",
    stayFullEn: "Hi, I'm interested in Smart Entry with the booking calendar for my units. Number of units and neighborhood:",
    portfolioEn: "Hi, I have 5 or more units and I'm interested in the Host Plan for them. Number of units and neighborhood:",
    // نسخ العرض (زر «أبغى مثله» وقسم «لصاحب المحل» أو «للمضيف»)
    demoMenu: "السلام عليكم، شفت مثال المنيو عندكم وأبغى منيو مثله لمحلي. اسم المحل والحي:",
    demoLinks: "السلام عليكم، شفت مثال صفحة الروابط عندكم وأبغى صفحة مثلها لمحلي. اسم المحل والحي:",
    demoWifi: "السلام عليكم، شفت مثال صفحة الواي فاي عندكم وأبغى صفحة مثلها لمحلي. اسم المحل والحي:",
    demoReview: "السلام عليكم، شفت ستاند التقييم عندكم وأبغاه لمحلي. اسم المحل والحي:",
    demoDoor: "السلام عليكم، شفت مثال «افتح الباب» عندكم وأبغى الدخول الذكي لوحداتي. عدد الوحدات والحي:",
    demoGuide: "السلام عليكم، شفت مثال دليل الوحدة عندكم وأبغى مثله لوحداتي في الإيجار القصير. عدد الوحدات:",
    // دليل الوحدة (زر «تم الخروج» و«بلاغ صيانة» و«استفسار على واتساب»)
    checkout: "تشيك أوت — الوحدة {unitRef}. (رسالة آلية من شريحة الوحدة)",
    maintenance: "بلاغ صيانة — الوحدة {unitRef}: ",
    contact: "استفسار — الوحدة {unitRef}: "
  },
  // emergency: أرقام الطوارئ الوطنية لقسم «الطوارئ» في دليل الوحدة (#emergency، web-ux ر4-2). فاضي = القسم ما يطلع.
  //   نفس القائمة تنطبع على ستاند الطوارئ (print/host-signs/signs.js يقرأها من هنا)، فتعديلها يغيّر الاثنين. بدون رقم المضيف أبداً (GM-062).
  //   ما ينكتب رقم إلا بمصدر رسمي. كل رقم صف فيه اسمه، وأول صف (الموحد) بخط أثقل، وفي دليل العميل كل صف رابط tel:.
  //   المصادر (نفس مصادر قسم الطباعة في print/host-signs/signs.js، فتحوها 2026-09-28):
  //   المنصة الوطنية https://my.gov.sa/en/emergency-contact : 911 و 997 و 998 و 999 (العربية https://my.gov.sa/ar/content/93، أرشيف 2025-04-02)
  //   هيئة الهلال الأحمر https://www.srca.gov.sa/ : 997 و 998 و 999. الدفاع المدني https://998.gov.sa/ : «911 أو 998»
  //   911: واس 2025-10-01 https://www.spa.gov.sa/N2412238 (مكة المكرمة والمدينة والرياض والشرقية) و واس 2026-05-15 https://www.spa.gov.sa/N2586249
  //   تنبيه: 911 مؤكد في أربع مناطق بس. وحدة برا هالمناطق تحتاج قائمة بدون 911 قبل ما يشتغل دليلها (الستاند: unified911: false).
  emergency: [
    { label: "الطوارئ الموحد", number: "911" },
    { label: "الإسعاف", number: "997" },
    { label: "الدفاع المدني", number: "998" },
    { label: "الشرطة", number: "999" }
  ]
};
