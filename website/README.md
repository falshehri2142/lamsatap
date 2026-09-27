# website/ (GM-006: تجهيز فقط، بدون نشر)

## المحتوى
- `index.html` الرئيسية (صفحة الشركة، تنفهرس في البحث).
- `config.js` الإعداد المشترك (المصدر الوحيد):
  - `domain`: الدومين (مؤقت `https://example.com`). منه يتولد رابط `canonical` و`og:url` في الرئيسية.
  - `companyName` و`companyNameEn`: اسم الشركة في كل الصفحات، وسكربت الشعار `brand/src/build_logo.py` يقرأه من هنا.
  - `whatsapp`: رقم الشركة (أرقام بصيغة دولية بدون +، وأي رمز ثاني ينشال تلقائياً). **فاضي الحين عمداً.**
  - `waText`: رسائلنا الجاهزة لرقم الشركة (نصوص web-ux ر2-2، ورسائل الدليل من `systems/architecture.md` §8). `{unitRef}` ينعوض بمرجع الوحدة، ولازم يبقى في رسائل الدليل (`checkout` و`maintenance` و`contact`).
  - `emergency`: أرقام الطوارئ الوطنية لدليل الوحدة، بمصادرها في تعليق الملف (web-ux ر4-2). 911 مؤكد في أربع مناطق بس (مكة المكرمة والمدينة والرياض والشرقية).
- `assets/app.js`: أدوات مشتركة (اسم الشركة، أزرار الواتساب، وضع العرض، النسخ، canonical). `assets/site.css`: الأساس المشترك.
- `assets/motion.css` (web-motion): الحركة الوحيدة في الموقع، رسمة البطل مرة وحدة. **ينربط في `index.html` بس.** ولا `data-motion` ولا ملف JS للحركة في أي صفحة.
- `templates/<القالب>/` (menu، links، wifi، rental-guide): قالب لعميل جديد. كل قالب:
  - `index.html` هيكل خفيف بس (`<main id="app">`).
  - `render.js` المنطق كله (يبني الصفحة من البيانات).
  - `style.css` تنسيق القالب.
  - `data.js` البيانات: placeholders للعميل الجديد، و`demo: false`.
- `demo/<القالب>/` (menu، links، wifi، rental-guide): نسخ العرض. نفس هيكل القالب، وتاخذ `render.js` و`style.css` من `templates/<القالب>/` (بدون تكرار منطق)، وبياناتها في `data.js` حقها (`demo: true`، محتوى مثال من web-ux ر4-1). روابط «شوف …» في الرئيسية تروح لها.
- `demo/review/`: عرض ستاند التقييم (صفحة ثابتة) + `qr-sheet.html` للطباعة (رابطه يتولد من `config.js`).
- `vendor/qrcode-generator.js`: نسخة محلية من `qrcode-generator@1.4.4` (MIT، Kazuhiko Arase، المصدر https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js).

لا خطوط خارجية ولا CDN ولا `fetch()`. كل الملفات تنقرأ بـ `<script src>`، فتشتغل من `file://`.

## الفتح محلياً
- دبل كلك على `website/index.html`، أو
- خادم محلي: `npx serve website` أو `python -m http.server -d website 8000` ثم `http://localhost:8000/`.
- زر «انسخ» يستخدم `navigator.clipboard` على https و localhost، ومن `file://` يرجع لطريقة `execCommand` القديمة.

## الواتساب لما الرقم فاضي (قرار GM-010 و web-ux ر4-4)
- كل أزرار واتساب الشركة **تختفي** (`hidden`) في كل الصفحات. ولا زر معطّل ولا باهت.
- في الرئيسية بس، مكان زر البطل، سطر نص: «رقم التواصل على الواتساب ينضاف قريباً.» وقسم «تبغى تبدأ؟» يختفي كامل.
- دليل وحدة عميل (`demo: false`): قسم «الخروج والصيانة» كله (مع التواصل) ما يطلع بدون رقم الشركة و`unitRef` صحيح.
- الرابط: `https://wa.me/<أرقام بس>?text=<الرسالة مرمّزة>`. شكله **غير مؤكد** من صفحة واتساب الرسمية، ولازم يتجرّب بآيفون وأندرويد قبل الإطلاق.

## وضع العرض ووضع العميل (`demo` في data.js)
- `demo: true` (نسخ `demo/`): شريط رفيع «عرض تجريبي» فوق فيه زر «أبغى مثله»، وسطر وزر كبير آخر الصفحة. الزرين لرقم الشركة وبس. أي زر ثاني يطلع برا الصفحة (واتساب الضيف، الاتصال، الخرائط، روابط المحل) يكتب سطر حالة بدل ما يفتح، وأرقام الطوارئ نص عادي مو روابط اتصال.
- `demo: false` (صفحة عميل): ولا زر بيع حقنا. واتساب المحل من `whatsapp` حقه في `data.js`، وسطر «بواسطة لمسة تاب» صغير آخر الصفحة.

## حقول data.js
| الحقل | القالب | المعنى |
|---|---|---|
| `demo` | الكل | `true` نسخة عرض، `false` صفحة عميل |
| `whatsapp` | menu، links، wifi | رقم واتساب **المحل** (أرقام بصيغة دولية بدون +). فاضي = ما يطلع زر |
| `waText` | menu، links، wifi | رسالة المحل الجاهزة. فاضي = «السلام عليكم، عندي استفسار» |
| `cal` | menu (لكل صنف) | السعرات، ويطلع «السعرات: {cal}». لازم لكل صنف (الهيئة العامة للغذاء والدواء) |
| `unitRef` | rental-guide | مرجع الوحدة: كود عشوائي 12 حرف أو أكثر، مو اسم الوحدة ولا عنوانها. أقل من 12 = قسم الخروج ما يطلع |
| `checkoutTime` | rental-guide | وقت الخروج كما يكتبه المضيف (مثل «12 الظهر») |
| `beforeLeaving` | rental-guide | خطوات قبل الخروج، 3 بالكثير. تطلع في تأكيد «تم الخروج» |
| `address` | rental-guide | اختياري: اسم العمارة والحي والمدينة. **بدون رقم الوحدة ولا الدور** |
| `mapUrl` | rental-guide | اختياري: رابط خرائط يبدأ بـ `https://`، ويفتح في تبويب جديد |

## صفحة عميل جديد
1. سو مجلد للعميل بنفس العمق (مثلاً `c/<code>/`، عمقه 2 مثل `demo/menu/`).
2. انسخ له `index.html` من `demo/<القالب>/` (يشير لـ `templates/<القالب>/render.js` و`style.css`، فالمنطق يبقى في مكان واحد).
3. انسخ `templates/<القالب>/data.js` وعبّه: `demo: false`، والاسم والأصناف والأسعار والسعرات، أو الروابط (لازم `https://`)، أو الشبكة وكلمة المرور، أو بيانات الوحدة.
4. لو اختلف عمق المجلد، صحّح مسارات `../../` في `index.html`.
5. باقة المضيف: لا رقم جوال للمضيف أو العاملة، ولا رابط حجز أو دفع، ولا رمز باب أو مكان مفتاح، ولا حقل لبيانات الضيف (GM-003). وما ينرفع دليل قبل ما تنكتب سياسة الخصوصية ويتغير رابطها `#privacy-policy` (`legal/register.md` بند 21 أ).
6. رابط التقييم في صفحة الروابط: بدون أي نص عن مقابل أو شرط (سياسة قوقل).

## البحث (SEO، مهارة القسم seo-audit)
- الرئيسية: تنفهرس (بدون `noindex`)، `lang="ar" dir="rtl"`، عنوان ووصف عربي، h1 وحدة، Open Graph، و`canonical` و`og:url` من `config.domain` (يولّدهم `app.js`).
- صفحات العرض والقوالب وورقة QR: `noindex`.
- يوم الإطلاق يحتاج: `og:image` برابط كامل بالدومين (وصورة مشاركة من web-brand)، و`robots.txt` و`sitemap.xml` بالدومين. ما انحطت الحين لأن الدومين مؤقت.

## يوم الإطلاق
1. غيّر `domain` في `config.js` (وفي `systems/shortlinks/config.json` بنفس القيمة).
2. عبّ `whatsapp` بعد ما يعتمده صاحب المشروع، وجرّب كل زر واتساب بآيفون وأندرويد (الرسالة العربية فيها «—» و«:» توصل صح).
3. استبدل `[السعر المعتمد]` بالأسعار المعتمدة في `services/` فقط.
4. سياسة الخصوصية تنكتب ويتغير رابط `#privacy-policy` قبل أول دليل وحدة لعميل.
5. أضف `og:image` و`robots.txt` و`sitemap.xml` (قسم البحث فوق).
6. صاحب المشروع يرفع المجلد على الاستضافة (المقترح Cloudflare Pages، `work/2026-09-27-short-links/result.md`).
7. اطبع `demo/review/qr-sheet.html` وامسحه بكاميرا جوال من الورقة المطبوعة قبل التوزيع.

## الهوية (لمسة تاب — LamsaTap، GM-008)
- المصدر الوحيد: `brand/` في جذر المشروع. أي تعديل يصير هناك أول، ثم يُنسخ نسخة مطابقة هنا (لأن `website/` ينرفع لحاله).
- النسخ هنا (كلها مطابقة للمصدر بايت ببايت):
  - `assets/brand/tokens.css` ← `brand/tokens.css`
  - `assets/brand/components.css` ← `brand/components.css` (زر الواتساب `.lt-wa` بلون الحبر GM-020، وسطر «بواسطة» `.lt-by`)
  - `assets/brand/lamsatap-horizontal.svg` و`-dark.svg` ← `brand/logo/` (رأس الرئيسية 174×48، وورقة QR)
  - `assets/brand/lamsatap-icon.svg` ← `brand/logo/lamsatap-icon.svg` (سطر «بواسطة» 16px)
  - `assets/brand/favicon.svg` ← نفس `brand/logo/lamsatap-icon.svg`
  - `assets/brand/apple-touch-icon.png` ← `brand/logo/png/lamsatap-icon-180.png`
  - `favicon.ico` (جذر `website/`) ← `brand/logo/favicon.ico`
  - `assets/brand/fonts/readex-pro-arabic-latin.woff` و`OFL.txt` ← `brand/fonts/`
- رسمة البطل `brand/illustrations/tap-hero.svg` محطوطة **inline** داخل `index.html` (ألوانها من `tokens.css`، و`motion.css` يحرك أجزاءها). لو تغيّرت: انسخ محتوى الملف مكانها كما هو، وخل الصنف `hero-art` والـ IDs.
- ترتيب الربط في كل صفحة: `tokens.css` ← `components.css` ← `site.css` (← `style.css` حق القالب). ألوان زر الواتساب ما تنكتب باليد في أي ملف ثاني.
- الخط: الرئيسية و`qr-sheet.html` بـ `--lt-font-brand`. صفحات الزبون (القوالب ونسخ العرض و`demo/review/index.html`) بـ `--lt-font-ui` بس، فملف الخط ما ينزل عندها (مفحوص: `document.fonts` = unloaded).
