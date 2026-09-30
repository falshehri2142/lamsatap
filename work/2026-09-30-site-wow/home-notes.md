# home-notes — web-builder (الرئيسية)، منفذ 8811، 2026-09-30

## وش تغير (website/index.html و assets/home.css فقط)
- العنوان والوصف والـ h1 والعنوان الفرعي من brief-copy. h1: 44 جوال / 57 عند 1024 / 80 عند 1440.
- البطل: منتقي «وش عندك؟» (`.h-pick`، روابط عادية لـ restaurants/#demo و hosts/#demo) بدل «شوف الحل المناسب»، ورابط «جرّب لمسة الحين» لـ `#tap-lab`.
- `.trust` (4 بنود معتمدة، أيقونات 1.5px، ونقطة تيل مع «نرد خلال ساعة») بدل `.h-benefits` و`.h-open-trust`.
- Tap Lab: العقد ملصوق حرفياً بين البطل و`#solutions`، مع ستاند SVG يدوي. ربط `assets/signature.css` و`assets/signature.js` (defer). في home.css بدائل بـ `:where()` (أولوية صفر) تخلي القسم مقروء لو signature.css ما وصل.
- h2 في الأقسام 30 جوال / 48 كمبيوتر. أرقام الخطوات 44 / 64 بوزن figure و tabular-nums. `scroll-margin-top` للأقسام. البطاقات raised ورفعة 2px.
- الختام: «أول لمسة علينا. أسبوعين ببلاش.» وسطر الرد خلال ساعة كما هو مع نقطة تيل.
- ما انحذف أي data-* (data-lift-stage، data-open*، data-door، data-how-*، data-wa، data-tg...).

## التحقق (shot.js في web-builder-home/)
- مقاسات 320/390/1024/1440: سكرول أفقي 0 في الكل. h1 44/44/57/80، h2 30/30/35/48، الأرقام 44/44/46/64.
- الكونسول: الأخطاء الوحيدة 404 لملفي signature.* لأنها ما انكتبت بعد (متوقع).
- لقطات: a-* (قبل)، c-*، d-* (بعد).

## مفتوح
- `node tools/build-dist.cjs` يفشل الحين لأن `assets/signature.css` ما هو موجود بعد. يُعاد بعد ما يكتبه صاحب المكوّن.
- الفراغ تقريباً 780px تحت البطل في اللقطة الكاملة جاي من تثبيت (pin) حركة الشعار في motion.js، مو من home.css. الطلب في requests-web-builder-home.md.
- ما فحصت تقليل الحركة ولا لوحة مفاتيح Tap Lab (تعتمد على signature.js).
