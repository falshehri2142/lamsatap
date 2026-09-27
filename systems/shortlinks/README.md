# الروابط الثابتة `/t/<code>/`

- البناء: `node systems/shortlinks/build.js` (Node فقط، بدون مكتبات). يفشل عند أي خطأ في السجل.
- المخرجات: `systems/shortlinks/dist/`.
- النشر: ارفع محتوى `dist/` كما هو لجذر الاستضافة الثابتة (صاحب المشروع يسوي الحساب والرفع بنفسه).
- الإعداد `config.json`: `domain` (سطر واحد) و`forceBang` (افتراضي false).
  - `forceBang: true` يكتب `302!` في `_redirects` (force في Netlify). Cloudflare Pages يتبع التحويل دايم؛ غير مؤكد إن `!` ما يضره هناك، فخله false على Cloudflare.
- السجل `links.json`: code (a-z0-9، 3-16، مو محجوز مثل inactive/404/index)، place إلزامي، dest رابط https سليم، status active/cancelled.
- الإلغاء = `"status": "cancelled"`. لا تحذف كود أبداً: `published.txt` (متتبع في git) يتحدث بعد كل بناء ناجح، والبناء يفشل لو اختفى منه كود. انتبه: أي كود ينبني مرة يصير «منشور»؛ لو انبنى كود بالغلط وما انبرمج في شريحة، تشيله يدوياً من `published.txt` و`links.json` مع ذكر السبب في رسالة الـ commit.
- `dist/links.txt`: الشكل المعتمد للبرمجة `https://<domain>/t/<code>/` (بشرطة أخيرة).
- صفحات الكود تمرر `?src=` فقط للوجهة (مو كل الـ query). الوجهة ممنوع ترجع لـ `/t/` على نفس الدومين. `_redirects` حده 2000 سطر (سطرين لكل كود) والبناء يفشل فوقه.
- اختبار محلي: `cd systems/shortlinks/dist && python -m http.server 8000` ثم `http://localhost:8000/t/demo01/`.
