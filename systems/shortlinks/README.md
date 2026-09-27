# الروابط الثابتة `/t/<code>/`

- البناء: `node systems/shortlinks/build.js` (Node فقط، بدون مكتبات). يفشل عند أي خطأ في السجل.
- المخرجات: `systems/shortlinks/dist/`.
- النشر: ارفع محتوى `dist/` كما هو لجذر الاستضافة الثابتة (صاحب المشروع يسوي الحساب والرفع بنفسه).
- الإعداد `config.json`: `domain` (سطر واحد) و`forceBang` (افتراضي false).
  - `forceBang: true` يكتب `302!` في `_redirects` (force في Netlify). Cloudflare Pages يتبع التحويل دايم؛ غير مؤكد إن `!` ما يضره هناك، فخله false على Cloudflare.
- السجل `links.json`: code (a-z0-9، 3-16، مو محجوز مثل inactive/404/index)، place إلزامي، dest رابط https سليم، status active/cancelled.
- الإلغاء = `"status": "cancelled"`. لا تحذف كود أبداً: `published.txt` (متتبع في git) يتحدث بعد كل بناء ناجح، والبناء يفشل لو اختفى منه كود. انتبه: أي كود ينبني مرة يصير «منشور»؛ لو انبنى كود بالغلط وما انبرمج في شريحة، تشيله يدوياً من `published.txt` و`links.json` مع ذكر السبب في رسالة الـ commit.
- `out/links.txt` (خاص، خارج `dist/` ومستثنى في `.gitignore`، لا يُرفع أبداً): الشكل المعتمد للبرمجة `https://<domain>/t/<code>/` (بشرطة أخيرة).
- صفحات الكود تمرر `?src=` فقط للوجهة (مو كل الـ query). الوجهة ممنوع ترجع لـ `/t/` على نفس الدومين. `_redirects` حده 2000 سطر (سطرين لكل كود) والبناء يفشل فوقه.
- اختبار محلي: `cd systems/shortlinks/dist && python -m http.server 8000` ثم `http://localhost:8000/t/demo01/`.

## أداة الإدارة `links-cli.js`
تعدّل `links.json` (السجل الحقيقي) وتعيد البناء بـ `build.js` تلقائياً. لو فشل البناء ترجع `links.json` لحاله بالضبط (build.js ما يكتب `published.txt` ولا `dist/` إلا بعد النجاح).
- `node systems/shortlinks/links-cli.js list`
- `node systems/shortlinks/links-cli.js add <code> --client <c> --place "<مكان>" --dest https://...` (أو `--gen` بدل الكود: 8 حروف عشوائية من `crypto`، بدون 0/o/1/l)
- `node systems/shortlinks/links-cli.js set-dest <code> https://...` (الكود الملغى يحتاج `--reactivate` صريح)
- `node systems/shortlinks/links-cli.js cancel <code>`
- `--dir <مجلد>` أو `SHORTLINKS_DIR`: يشتغل على نسخة (فيها `links.json` و`build.js` و`config.json` و`published.txt`). للاختبار استخدم نسخة دايم، لأن أي بناء ناجح يضيف الكود لـ `published.txt`.
- الأداة ترفض: كود موجود (نشط أو ملغى، ما يُعاد استخدامه)، أمر ناقص. باقي الفحص (صيغة الكود، المحجوز، https، الرجوع لـ `/t/`) من build.js نفسه.
- ما فيه أمر حذف. مخرج 0 نجاح، 1 فشل البناء ورجوع، 2 خطأ في الأمر.
- حمايات إضافية في build.js: يرفض محارف التحكم (tab، سطر جديد) في `place` و`client`. فحص الرجوع لـ `/t/` يصير بعد فك الترميز والحروف الصغيرة (`/T/` و`%74` مرفوضين). لو `domain` فيه `DOMAIN` حرفياً يفشل البناء، ولو `example.com` أو فيه كلمة domain يطبع تحذير.
- رسالة الرجوع في الأداة: `links.json` رجع لحاله. أعد البناء قبل الرفع.
