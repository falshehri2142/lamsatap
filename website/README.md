# website/ (GM-006: تجهيز فقط، بدون نشر)

## المحتوى
- `index.html` الرئيسية.
- `config.js` الإعداد المشترك: `domain`، `companyName`، `whatsapp` (فاضي = زر واتساب معطّل بنص «الرقم قريباً").
- `assets/site.css` + `assets/app.js` مشتركة (اسم الشركة، واتساب، النسخ).
- `templates/menu|links|wifi|rental-guide/`: كل قالب = `index.html` + `data.js`.
- `demo/review/`: عرض ستاند التقييم + `qr-sheet.html` (رابطه يتولد من `config.js` المشترك).
- `vendor/qrcode-generator.js`: نسخة محلية من `qrcode-generator@1.4.4` (MIT، Kazuhiko Arase، المصدر https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js).

لا خطوط خارجية ولا CDN ولا `fetch()`. كل الملفات تنقرأ بـ `<script src>`، فتشتغل من `file://`.

## الفتح محلياً
- دبل كلك على `website/index.html`، أو
- خادم محلي: `npx serve website` أو `python -m http.server -d website 8000` ثم `http://localhost:8000/`.
- ملاحظة: زر «نسخ» يستخدم `navigator.clipboard` على https/localhost، ومن `file://` يرجع لطريقة `execCommand` القديمة.

## تعبئة قالب لعميل
1. انسخ مجلد القالب (مثلاً `templates/menu/`) لمسار العميل.
2. عدّل `data.js` فقط: الاسم، الأقسام والأصناف والأسعار، أو الروابط (لازم `https://`)، أو الشبكة وكلمة المرور.
3. خل `demo: false` عشان تختفي شارة «عرض تجريبي».
4. إذا تغيّر عمق المجلد، صحّح مسارات `../../config.js` و`../../assets/`.
5. باقة المضيف: لا رقم جوال للمضيف أو العاملة، ولا رابط حجز أو دفع، ولا حقول بيانات للضيف (شروط GM-003).
6. رابط التقييم في صفحة الروابط: بدون أي نص مقابل أو شرط (سياسة قوقل).

## يوم الإطلاق
1. غيّر `domain` في `config.js` (وفي `systems/shortlinks/config.json` بنفس القيمة).
2. عبّ `companyName` و`whatsapp` بعد ما يعتمدها صاحب المشروع.
3. استبدل `[السعر المعتمد]` بالأسعار المعتمدة في `services/` فقط.
4. صاحب المشروع يرفع المجلد على الاستضافة (المقترح Cloudflare Pages، `work/2026-09-27-short-links/result.md`).
5. اطبع `demo/review/qr-sheet.html` وامسحه بكاميرا جوال من الورقة المطبوعة قبل التوزيع.

## الهوية (لمسة تاب — LamsaTap، GM-008)
- المصدر الوحيد: `brand/` في جذر المشروع (`tokens.css`، `fonts/`، `logo/`). أي تعديل يصير هناك أول، ثم يُنسخ نسخة مطابقة هنا (لأن `website/` ينرفع لحاله).
- النسخ هنا: `assets/brand/tokens.css`، `assets/brand/fonts/readex-pro-arabic-latin.woff` + `OFL.txt`، `assets/brand/lamsatap-horizontal.svg` و`-dark.svg`، `lamsatap-icon.svg`، `favicon.svg` (= `lamsatap-icon-small.svg`)، `apple-touch-icon.png` (= `png/lamsatap-icon-180.png`)، و`favicon.ico` في جذر `website/`.
- كل صفحة تربط `tokens.css` قبل `site.css`. متغيرات `site.css` (`--bg --text --btn`...) تاخذ قيمها من `--lt-*`، والداكن من `tokens.css`.
- الخط: الرئيسية و`qr-sheet.html` بـ `--lt-font-brand`. صفحات الزبون (القوالب و`demo/review/index.html`) بـ `--lt-font-ui` فقط، فما ينزل ملف الخط عندها.
- صفحات الزبون فيها سطر «بواسطة لمسة تاب» (الاسم من `companyName` في `config.js`).
