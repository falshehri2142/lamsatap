# motion-notes — web-motion (منفذ 8821)، 2026-09-30

## وش انعمل
- motion.js symbolFlight: شلت pin البطل في الكمبيوتر (`pin: false`, `scrub: true`) مثل الجوال. الحركة نفسها باقية، وانحل فراغ 600–780px تحت البطل في الصفحات الثلاث. طول الرئيسية 1440 صار 4277.
- `.trust` و`.trust__sub` و`.trust__dot` انتقلت لـ site.css (مكوّن واحد). قاعدة 4 أعمدة `.trust:not(.trust--plan)` بقيت في restaurants.css وhosts.css، ونسخة الرئيسية في home.css تغطي عليها.
- زر التليجرام: `data-tg-rank="secondary"` على كل `[data-tg="with-wa"]` في المطاعم والمضيفين، فيطلع بإطار ولا يكون زر أسود ثاني.
- Tap Lab مركّب في الرئيسية (signature.css/js defer). ما فيه تهيئة مزدوجة ولا تعارض مع hooks motion.js، ويوصل `data-state=open` في الحالتين العادية وتقليل الحركة.
- motion.css ما فيه `transition: all`.

## الفحص (check.js في motion/)
- الصفحات الثلاث + demo/{menu,review,wifi,rental-guide} على 320 و390 و1440، مع تقليل الحركة وبدونه: صفر أخطاء كونسول وصفر سكرول أفقي.
- `node tools/build-dist.cjs` يمر بدون ما نرفع الميزانيات (الرئيسية gzip 95.5 من 110، والمطاعم 100.5 من 110).

## الباقي
- ما راجعت `data-words` مع h2 المقاس 48. الـ builders شالوه من العنوانين اللي فيهم المشكلة.
- فراغ pin القصة `[data-story-pin]` على 1440 مقصود لأنه سرد مع التمرير، وخليته.
- ما فحصت الموقع بدون JS، ولا على 768/1024.
