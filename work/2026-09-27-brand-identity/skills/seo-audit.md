# seo-audit: قائمة فحص SEO قبل الإطلاق (لمسة تاب)

2026-09-28. خلاصة مهارة `seo-audit`، مطبّقة على موقعنا: ثابت، عربي RTL، ثلاث صفحات (`/` و`/restaurants/` و`/hosts/`) وصفحات العرض.

**المصادر:**
- المهارة: `.claude/skills/seo-audit/SKILL.md`. مصدرها وترخيصها في `SOURCE.md` (Apache-2.0).
  - ما في مجلدها غير هالملفين. و`CONNECTORS.md` اللي تذكره مو موجود عندنا.
- موجز الجولة: `work/2026-09-27-brand-identity/brief-gm040.md`. قسم «تحديث GM-042 و GM-043 و GM-044» أوله يغلب أي شي تحته.
- `web-art-director.md` «الاتجاه 3»: §1 و§3 و§4 و§5 و§6 و§10 و§7.1.
- `web-copy.md` «الاتجاه 3» (من السطر 44)، و`builder-phase-b.md`، و`services/pricing.md`.
- `website/config.js`، و`website/assets/app.js`، و`website/README.md` (قسم «البحث» و«يوم الإطلاق»).
- ui-ux-pro-max: `references/quick-reference.md` (أرقام القواعد تحت)، و`data/motion.csv` و`data/styles.csv`.

**أرقام السطور:** أي رقم سطر في `website/` أو `tools/` لقطة وقت الكتابة (2026-09-28 تقريباً 00:10). هالملفات تحت التعديل عند وكلاء ثانيين، فممكن تتحرك.

**وش ما سويته:**
- ولا تعديل في `website/` ولا `brand/` ولا `tools/`.
- ولا طلب شبكة، ولا تنزيل، ولا تثبيت.
- كل فحص هنا قراءة بس. والملفات التجريبية (نسخة وهمية من الموقع، ولقطات Chrome) انكتبت في مجلد مؤقت برّا المشروع.

---

## 0) كيف تستخدم هالملف
1. **قبل ما المطوّر يقول «تم» في بناء الصفحات:**
   - شغّل السكربت في §15، و ui-probe.
   - المطلوب: صفر FAIL. والـ WARN يبقى بس في البنود المكتوبة «يوم الإطلاق».
2. **يوم الإطلاق:** §12 بالترتيب.
3. **بعد الإطلاق:** §14 و§16.

**حدود المهارة عندنا:**
- المهارة مكتوبة لموقع منشور، ومعه أدوات بحث مثل Ahrefs وSemrush، أو بحث ويب.
- عندنا GM-006: ولا نشر ولا حسابات. وهالجولة ممنوع فيها أي طلب شبكة.
- فـ **بحث الكلمات بأحجامها، ومقارنة المنافسين، وفجوات المحتوى: مؤجلة** (§14).
- أي سلوك لقوقل أو واتساب أو Cloudflare مكتوب هنا من معرفتي، وما فتحت مصدره اليوم. فهو **«غير مؤكد»** لين يتأكد يوم الإطلاق.
- اللي قسته أو جربته بنفسي اليوم مكتوب **«جربته»** أو **«قسته»**.

---

## 1) الخلاصة
**الحكم: أساس قوي، وناقصه تجهيز الإطلاق.**

**نقاط القوة:**
- HTML ثابت، وكل النص في الـ HTML نفسه، مو يتولد بـ JS.
- `lang="ar" dir="rtl"` موجود.
- صفحات العرض والقوالب كلها `noindex` (10 صفحات).
- الأيقونات مركّبة، وh1 واحد في البوابة.
- ولا طلب خارجي ولا سكربت طرف ثالث.

**أهم ثلاث أولويات:**
1. **صفحتي `restaurants/` و`hosts/` تنبني برأس كامل من أول مرة (§13):**
   - title ووصف.
   - Open Graph.
   - canonical.
   - JSON-LD بالأسعار المعتمدة بس.
2. **يوم الإطلاق:**
   - canonical وog:url وog:image تنكتب **ثابتة** في HTML بالدومين الحقيقي، لأن واتساب ما يشغّل JS (غير مؤكد).
   - ومعها robots.txt وsitemap.xml، ودومين أساسي واحد.
3. **بوابة `tools/build-dist.cjs` فيها شيئين بيوقفون الإطلاق:**
   - فحص السكربتات يرفض كتلة JSON-LD. جربته.
   - حد الحجم 100KB ما يوسع GSAP. قسته: GSAP لحاله 114.7KB.

---

## 2) خريطة الصفحات
| الصفحة | الملف | الرابط الأساسي (canonical) | تنفهرس؟ | في sitemap؟ |
|---|---|---|---|---|
| البوابة | `website/index.html` | `https://example.com/` | إيه | إيه |
| للمطاعم والكافيهات | `website/restaurants/index.html` | `https://example.com/restaurants/` | إيه | إيه |
| للمضيفين | `website/hosts/index.html` | `https://example.com/hosts/` | إيه | إيه |
| شرح ستاند التقييم | `website/demo/review/index.html` | — | لا (`noindex`) | لا |
| ورقة QR | `website/demo/review/qr-sheet.html` | — | لا | لا |
| الأمثلة: منيو، واي فاي، روابط، دليل الوحدة | `website/demo/<x>/index.html` | — | لا | لا |
| القوالب | `website/templates/<x>/index.html` | — | لا | لا |
| الروابط الثابتة | `/t/<code>/` (`systems/shortlinks/`) | — | لا (`noindex` وتحويل) | لا |

- **الدومين:** `https://example.com` هو `SITE.domain` في `website/config.js` (السطر 9)، مؤقت لين الإطلاق. يوم الإطلاق يصير الدومين اللي يختاره صاحب المشروع، وكل رابط هنا يتبدل معه.
- **GM-043:** ولا رابط، ولا canonical، ولا sitemap، ولا JSON-LD، ولا تحويل، يذكر `shops/`.
  - **وما نسوي تحويل من `shops/`:** ما انتشر لها رابط (GM-006).
  - وأي سطر تحويل بيطلع في فحص `grep -rn "shops" website/ tools/` (`builder-phase-b.md` السطر 78).
  - فحصت اليوم: صفر في `website/` و`tools/`.

---

## 3) العنوان والوصف لكل صفحة
**القواعد:**
- كل صفحة لها title ووصف **خاص فيها**، ونصهم من web-copy بس. المطوّر ما يكتب نص من عنده.
- **الطول بالعربي:**
  - المهارة تقول 50 إلى 60 حرف للعنوان، و150 إلى 160 للوصف (`SKILL.md` السطر 66-67). هذي أرقام الإنجليزي.
  - قوقل يقص بعرض البكسل، مو بعدد الحروف. المتداول تقريباً: 600px للعنوان، و920px للوصف على الكمبيوتر، و680px للوصف على الجوال (غير مؤكد).
  - **قسته:** بخط Arial في Chrome، وهو خط النتائج على الكمبيوتر (غير مؤكد). الحرف العربي أضيق من الإنجليزي: 55 حرف طلعت بين 388 و434px.
- **قاعدتنا:**
  - **العنوان:** من 30 إلى 60 حرف، والكلمة المهمة في أول 45 حرف.
  - **الوصف:** من 70 إلى 160 حرف، والمعلومة المهمة في أول 110 حرف، عشان الجوال.
- **الاسم:** «لمسة تاب» في كل عنوان، وهذا اختيار web-copy.

**النصوص المعتمدة، ومقاساتها:**
| الصفحة | الحقل | النص من | الحروف | العرض (قسته) | الحكم |
|---|---|---|---|---|---|
| البوابة | `<title>` | `web-copy.md:121` «لمسة تاب — شرائح NFC وباركود QR للمطاعم والإيجار القصير» | 55 | 434px | مناسب |
| البوابة | `description` | ج11، `web-copy.md:767` | 146 | 724px | مناسب. على الجوال ممكن ينقص آخره «طول الاشتراك.» |
| البوابة | `og:title` | `web-copy.md:123` «لمسة تاب — قرّب جوالك، تنفتح الصفحة» | 35 | 262px | مناسب |
| البوابة | `og:description` | ج11، `web-copy.md:769` | 117 | 581px | مناسب |
| المطاعم | `<title>` و`og:title` | `web-copy.md:246` و`:248` | 55 | 388px | مناسب |
| المطاعم | `description` و`og:description` | `web-copy.md:247` | 121 | 592px | مناسب |
| المضيفين | `<title>` و`og:title` | `web-copy.md:364` و`:366` | 42 | 327px | مناسب |
| المضيفين | `description` و`og:description` | `web-copy.md:365` | 110 | 569px | مناسب |

- **`og:description` لصفحتي الجمهور:** web-copy ما حدده. المقترح نفس `description` حرف بحرف، بدون نص جديد.
- **البوابة الحالية** (لقطة اليوم، والملف تحت التعديل):
  - `<title>` في السطر 11 لسا النسخة القديمة «…للإيجار القصير والمحلات».
  - و`og:title` في السطر 18 قديم.
  - البناء الجديد يركّب نسخة «الاتجاه 3» فوق.

**اقتراحات اختيارية لـ web-copy (مو معتمدة، وما تتركّب إلا بقراره):**
| وين | الاقتراح | ليش | المقاس |
|---|---|---|---|
| وصف البوابة | ستاند وشريحة NFC وباركود QR للمطاعم والكافيهات والشقق في جدة: ضيفك يقرّب جواله، ويفتح المنيو أو دليل الوحدة. العتاد والتركيب علينا طول الاشتراك. | الوصف الحالي ما فيه «مطاعم» ولا «كافيهات» ولا «شقق»، مع إنها في العنوان | 144 حرف، 710px |
| عنوان المضيفين | لمسة تاب للمضيفين — دليل الوحدة بشريحة NFC للإيجار القصير | «الإيجار القصير» ينبحث عنها، والعنوان فيه مكان | 57 حرف، 429px |
| وصف المطاعم ووصف المضيفين | «في جدة» بعد اسم الباقة | نية محلية، والتركيب حالياً في جدة (GM-004) | 128 و117 حرف |

---

## 4) h1 والعناوين
**h1 واحد لكل صفحة** (`SKILL.md` السطر 68، و`heading-hierarchy`):
| الصفحة | h1 | المصدر |
|---|---|---|
| البوابة | قرّب جوالك، تنفتح الصفحة | `web-copy.md:94`. **موجود الحين مرة وحدة** (`index.html:60`) |
| المطاعم | خلّ جوال زبونك يرد عنك | `web-copy.md:136` |
| المضيفين | دليل كل وحدة، عند بابها | `web-copy.md:258` |

- **h1 البوابة نص ثابت، ويبان من أول رسم** (الموجز §4، و`no-blocking-animation`). بدون opacity:0، وبدون ما ينتظر JS.
- **الكلمة المفتاحية:**
  - المهارة تبيها في h1. وعناويننا وعد، وهذا قرار (GM-040).
  - نعوّضها بالكلمات في title والوصف، وفي أول سطر تحت h1. مثلاً «المنيو وتقييم قوقل والواي فاي» في المطاعم.
  - **اقتراح اختياري** للمدير الفني وweb-copy: سطر صغير فوق h1، «للمطاعم والكافيهات» أو «للمضيفين». يكون نص عادي `<p>`، مو عنوان.
- **الترتيب:** h1، بعده h2 لكل قسم، وبعده h3 داخل القسم، بدون قفز.
  - **البوابة:**
    - h2 «وش عندك؟»، وعنواني البابين h3.
    - h2 «كيف نشتغل».
    - «اسأل إنسان» h2، لأنه صار قسم لحاله (`web-art-director.md` §3، الصف 6).
  - **صفحتي الجمهور:**
    - h2 لكل قسم: المشاكل، والحل، والعرض الحي، والباقة، والأسئلة، والخاتمة.
    - h3 للمشاكل الثلاث، و«اللي ما نسويه»، و«خصم المحافظ».
- **ولا عنوان داخل صورة أو SVG بس:**
  - LAMSATAP في البداية ملف شعار.
  - واسم الشركة موجود نص في الذيل، وفي النص البديل للشعار.
- **القصص المثبتة والأسئلة:**
  - نص الخطوات الثلاث في كل قصة موجود في HTML من البداية.
  - وأجوبة الأسئلة الثمانية كذلك، مو تنحمّل بالضغط ولا تنبدل بـ JS.

---

## 5) canonical و lang و dir
- `<html lang="ar" dir="rtl">` في كل صفحة. موجود الحين في البوابة وكل صفحات `demo/` و`templates/`.
- **شكل canonical:**
  - رابط كامل بـ https، وبشرطة في آخره، وبدون `index.html`.
  - يعني: `https://example.com/`، و`https://example.com/restaurants/`، و`https://example.com/hosts/`.
  - كل صفحة من الثلاث canonical حقها يشير لنفسها.
- **الحين:** `app.js` (السطر 93-104) يولّد canonical وog:url من `SITE.domain`، للصفحة اللي عليها `data-canonical`.
  - **جربته:** شغلت البوابة في Chrome بدون واجهة. بعد JS طلع `<link rel="canonical" href="https://example.com/">` ومعه og:url. وفي HTML الخام ما فيه شي.
  - **الصفحتين الجديدتين:**
    - `data-canonical="/restaurants/"` و`data-canonical="/hosts/"`.
    - وتحمّلان `../config.js` و`../assets/app.js`.
- **يوم الإطلاق:** ينكتب ثابت في HTML (نسخة `dist/`) بالدومين الحقيقي.
  - **ليش:**
    - واتساب وتويتر وفيسبوك ما يشغلون JS لما يقرون الرابط (غير مؤكد لكل منصة).
    - وقوقل يفضّل canonical في HTML نفسه (غير مؤكد).
  - **الطريقة المقترحة:** نفس طريقة باركود الستاند.
    - `tools/build-home-minis.cjs` يكتب الرابط من `config.domain`.
    - و`tools/build-dist.cjs` يتأكد إنه يطابق.
    - والـ JS يبقى احتياط، لأنه يعدّل نفس الوسم لو كان موجود، وما يضيف ثاني.
- **كلهم نفس الرابط، حرف بحرف:** canonical، وog:url، ورابط sitemap، و`url` في JSON-LD.
- **صفحات noindex بدون canonical.**
- **الروابط الداخلية:**
  - تبقى بـ `index.html` صريحة عشان file:// (الموجز).
  - على الخادم، canonical يحل التكرار بين `/restaurants/` و`/restaurants/index.html`.
  - Cloudflare Pages يحوّل `…/index.html` لـ `…/` (غير مؤكد).
  - **اختياري يوم الإطلاق:** `build-dist` يبدّل روابط `index.html` الداخلية في `dist/` بمسار المجلد.
- **اللغة:** وحدة، فما نحتاج `hreflang`. لو انضافت نسخة إنجليزي بعدين: `hreflang` لـ `ar` و`en` و`x-default`.

---

## 6) Open Graph وصورة المشاركة
**الوسوم في كل صفحة من الثلاث** (مثال المطاعم):
```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="لمسة تاب">
<meta property="og:locale" content="ar_SA">
<meta property="og:title" content="لمسة تاب للمطاعم والكافيهات — منيو وتقييم قوقل وواي فاي">
<meta property="og:description" content="(نفس description)">
<meta property="og:url" content="https://example.com/restaurants/">
<meta property="og:image" content="https://example.com/assets/share/og-restaurants.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="(نص قصير من web-copy)">
<meta name="twitter:card" content="summary_large_image">
```
- **البوابة الحالية** فيها: og:type، وog:site_name، وog:locale، وog:title، وog:description. و`twitter:card` قيمته `summary`.
- og:image مؤجل عمداً لين الإطلاق (`website/README.md`، قسم «البحث»).

**صورة المشاركة** (يوم الإطلاق، print-studio مع web-brand):
- **العدد:** ثلاث صور، وحدة لكل صفحة.
- **المقاس:** 1200×630، PNG أو JPG. هذا المتداول، وغير مؤكد لكل منصة.
- **الحجم:** صغير. المتداول لواتساب أقل من 300KB (غير مؤكد).
- **الشكل:**
  - فاتحة دايماً.
  - الشعار الحبر الرسمي بدون تعديل (GM-042 وGM-036).
  - وجملة قصيرة: og:title أو الوعد.
- **لمسة الجمهور صغيرة:**
  - زعفران محروق #9A5B00 للمطاعم، وتيل #0B7A75 للمضيفين.
  - ولا نص ملوّن (`web-art-director.md` §2).
- **بدون أسعار:**
  - واتساب يحفظ المعاينة. لو تغيّر السعر، تبقى الصورة القديمة عند الناس.
  - ولا «شامل الضريبة» طبعاً (GM-044).
- **المهم في النص:** مساحة 630×630 تقريباً، لأن بعض التطبيقات تقص الصورة مربع (غير مؤكد).
- **الرابط:** كامل بالدومين، و`og:image:alt` عربي قصير.
- **أسماء مقترحة:** `website/assets/share/og-home.png` و`og-restaurants.png` و`og-hosts.png`. القرار للمطوّر.
- **صفحات العرض:**
  - المبيعات بترسل روابطها في واتساب.
  - **اختياري:** og:title وog:description لكل مثال، مثل «مثال منيو — لمسة تاب».
  - وتبقى `noindex`.

---

## 7) الأيقونات (favicon): مركّبة
**الملفات** (ملفات هوية، ما تنلمس):
| الملف | وش فيه (فحصته اليوم) |
|---|---|
| `website/favicon.ico` | ثلاث مقاسات: 16 و32 و48 |
| `website/assets/brand/favicon.svg` | الرمز أبيض على دائرة #14201F |
| `website/assets/brand/apple-touch-icon.png` | 180×180: الرمز أبيض على مربع حبر |

**الوسوم:**
- في البوابة: موجودة (`index.html:21-23`).
- في صفحتي الجمهور: نفسها، بـ `../`:
```html
<link rel="icon" href="../favicon.ico" sizes="32x32">
<link rel="icon" href="../assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../assets/brand/apple-touch-icon.png">
```
- قوقل يعرض أيقونة الصفحة الرئيسية في النتائج. يبيها مضاعفات 48px، ومسموح يزحف لها (غير مؤكد). عندنا 48×48 في ico، ومعها SVG.
- صفحات الأمثلة والقوالب: `data:,` (GM-025). وصفحة الشرح وورقة QR بأيقونتنا. ما يتغير شي.
- ما نحتاج web manifest للبحث.

---

## 8) البيانات المنظمة (JSON-LD)
**وش ما نحط:**
- **`LocalBusiness` لا، الحين:**
  - قوقل يطلب له `address` (غير مؤكد).
  - وما عندنا عنوان للعامة ولا سجل تجاري.
  - نرجع له لو صار عندنا عنوان، وقرر صاحب المشروع ملف Google Business Profile. هذا بعد السجل، ومع المستشار القانوني.
- **`FAQPage`:**
  - قوقل قصر نتايجها على المواقع الحكومية والصحية من 2023 (غير مؤكد).
  - ما تضر، بس ما تفيد، ولازم تطابق النص حرف بحرف. نتركها.
- **`Product`:** الباقات خدمة اشتراك، مو منتج يُشحن. ما نحطها `Product` عشان نجيب نجوم أو سعر في النتائج.
- **الضريبة:** ولا `valueAddedTaxIncluded`، ولا `vatID`، ولا `taxID` (GM-044). وأي سطر عن الضريبة يقرره المستشار القانوني.
- **التقييمات:** ولا `aggregateRating` ولا `review`. ما عندنا تقييمات، وممنوع أي رقم عملاء أو تقييمات (web-copy).
- **ولا `sameAs`** لين تنفتح حسابات (GM-006).
- **ولا `telephone`** لين يعتمد رقم الواتساب.

**القواعد:**
- كل رقم في JSON-LD هو نفس الرقم الظاهر في الصفحة، ونفس `services/pricing.md`.
- تغيّر سعر؟ تغيّره في المكانين بنفس الـ commit.
- الروابط كلها بالدومين من `config.js`، وتنختم يوم الإطلاق مع canonical.
- **الشعار:** `apple-touch-icon.png` ينفع الحين (180×180، مربع). قوقل يطلب 112×112 أو أكبر (غير مؤكد).
- **مهم، يوقف الإطلاق:**
  - `tools/build-dist.cjs` (السطر 63-68) يفحص كل `<script>` داخل الصفحة كأنه JS.
  - **جربته:** كتلة JSON-LD تبدأ بـ `{` تطيح الفحص (`Unexpected token ':'`).
  - **الحل (للمطوّر، قبل الإطلاق):** `build-dist` يتخطى `type="application/ld+json"`، ويفحصها بـ `JSON.parse`.
  - حل مؤقت أضعف: نلف الكتلة بـ `[ ]`، فتنقرى JS.

**البوابة: Organization و WebSite**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#org",
      "name": "لمسة تاب",
      "alternateName": "LamsaTap",
      "url": "https://example.com/",
      "logo": "https://example.com/assets/brand/apple-touch-icon.png",
      "areaServed": { "@type": "City", "name": "جدة" }
    },
    {
      "@type": "WebSite",
      "@id": "https://example.com/#website",
      "name": "لمسة تاب",
      "alternateName": "LamsaTap",
      "url": "https://example.com/",
      "inLanguage": "ar",
      "publisher": { "@id": "https://example.com/#org" }
    }
  ]
}
```

**المطاعم: Service بعرضين، و BreadcrumbList**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://example.com/restaurants/#service",
      "name": "حزمة المحل الكامل",
      "description": "حزمة المحل الكامل للمطاعم والكافيهات: ستاند تقييم قوقل، ومنيو، وواي فاي، وروابط حساباتك، بشعار محلك. تجربة أسبوعين ببلاش.",
      "url": "https://example.com/restaurants/",
      "areaServed": { "@type": "City", "name": "جدة" },
      "audience": { "@type": "Audience", "audienceType": "المطاعم والكافيهات" },
      "provider": { "@type": "Organization", "@id": "https://example.com/#org", "name": "لمسة تاب", "url": "https://example.com/" },
      "offers": [
        {
          "@type": "Offer",
          "name": "الاشتراك السنوي",
          "price": "1199",
          "priceCurrency": "SAR",
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "1199", "priceCurrency": "SAR", "unitCode": "ANN", "unitText": "بالسنة" },
          "url": "https://example.com/restaurants/"
        },
        {
          "@type": "Offer",
          "name": "التجديد السنوي",
          "price": "790",
          "priceCurrency": "SAR",
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "790", "priceCurrency": "SAR", "unitCode": "ANN", "unitText": "بالسنة" },
          "url": "https://example.com/restaurants/"
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "لمسة تاب", "item": "https://example.com/" },
        { "@type": "ListItem", "position": 2, "name": "للمطاعم والكافيهات", "item": "https://example.com/restaurants/" }
      ]
    }
  ]
}
```

**المضيفين: Service بأربع عروض، و BreadcrumbList**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://example.com/hosts/#service",
      "name": "باقة المضيف",
      "description": "باقة المضيف: دليل لكل وحدة بالواي فاي ووقت الخروج، وزر «تم الخروج» و«بلاغ صيانة». تجربة أسبوعين ببلاش في وحدة.",
      "url": "https://example.com/hosts/",
      "areaServed": { "@type": "City", "name": "جدة" },
      "audience": { "@type": "Audience", "audienceType": "مضيفي الإيجار القصير" },
      "provider": { "@type": "Organization", "@id": "https://example.com/#org", "name": "لمسة تاب", "url": "https://example.com/" },
      "offers": [
        {
          "@type": "Offer",
          "name": "الشهري للوحدة، من 1 إلى 4 وحدات، بالتزام 6 أشهر",
          "price": "49",
          "priceCurrency": "SAR",
          "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 4, "unitText": "وحدة" },
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "49", "priceCurrency": "SAR", "unitCode": "MON", "unitText": "للوحدة بالشهر" },
          "url": "https://example.com/hosts/"
        },
        {
          "@type": "Offer",
          "name": "السنوي للوحدة (سعر 11 شهر)، من 1 إلى 4 وحدات",
          "price": "539",
          "priceCurrency": "SAR",
          "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 4, "unitText": "وحدة" },
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "539", "priceCurrency": "SAR", "unitCode": "ANN", "unitText": "للوحدة بالسنة" },
          "url": "https://example.com/hosts/"
        },
        {
          "@type": "Offer",
          "name": "الشهري للوحدة، 5 وحدات فأكثر، بالتزام 6 أشهر",
          "price": "39",
          "priceCurrency": "SAR",
          "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 5, "unitText": "وحدة" },
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "39", "priceCurrency": "SAR", "unitCode": "MON", "unitText": "للوحدة بالشهر" },
          "url": "https://example.com/hosts/"
        },
        {
          "@type": "Offer",
          "name": "السنوي للوحدة (سعر 11 شهر)، 5 وحدات فأكثر",
          "price": "429",
          "priceCurrency": "SAR",
          "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 5, "unitText": "وحدة" },
          "priceSpecification": { "@type": "UnitPriceSpecification", "price": "429", "priceCurrency": "SAR", "unitCode": "ANN", "unitText": "للوحدة بالسنة" },
          "url": "https://example.com/hosts/"
        }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "لمسة تاب", "item": "https://example.com/" },
        { "@type": "ListItem", "position": 2, "name": "للمضيفين", "item": "https://example.com/hosts/" }
      ]
    }
  ]
}
```
- **فحصتها** (JSON.parse والسكربت في §15، على نسخة وهمية):
  - الثلاث تنقرى JSON.
  - أسعار المطاعم 1199 و790 بس. وأسعار المضيفين 49 و539 و39 و429 بس (`services/pricing.md` السطر 9-10 و16-17).
  - ولا حقل ضريبة، وكل الروابط على `https://example.com`.
- **الأسماء والوصف:**
  - أسماء العروض من جدول `services/pricing.md`.
  - و`description` هو نفس الوصف المعتمد في web-copy. ما فيه نص جديد يظهر للزائر.
- **`unitCode`:** `ANN` سنة، و`MON` شهر (UN/CEFACT Rec 20).
- **الفايدة:**
  - `Service` ما يطلّع لنا نتائج مميزة (غير مؤكد). فايدته إن قوقل يفهم مين إحنا، ووش نبيع، وبكم.
  - `WebSite` يساعد إن اسم الموقع يطلع «لمسة تاب» في النتائج (غير مؤكد).
- **بعد الإطلاق:** Rich Results Test وSchema Markup Validator، لأنها أدوات أونلاين.

---

## 9) الروابط الداخلية
| من | إلى | نص الرابط (web-copy) |
|---|---|---|
| الرأس، في الثلاث | البوابة | الشعار، وalt حقه «لمسة تاب — LamsaTap» |
| القائمة، في الثلاث | `restaurants/index.html` (ومن صفحة جمهور `../restaurants/index.html`) | للمطاعم والكافيهات (`web-copy.md:68`) |
| القائمة | `hosts/index.html` | للمضيفين |
| القائمة | `#how` (ومن صفحة جمهور `../index.html#how`) | كيف نشتغل |
| البوابة، الباب 1 | `restaurants/index.html` | عندي مطعم أو كافيه (`web-copy.md:104`) |
| البوابة، الباب 2 | `hosts/index.html` | عندي شقق أو إيجار قصير (`web-copy.md:106`) |
| المطاعم | `../demo/menu/` و`../demo/wifi/` و`../demo/links/` | «افتح المثال»، وبعده نص مخفي باسم المثال (ج3) |
| المطاعم | `../demo/review/index.html` | اعرف كيف يشتغل ستاند التقييم |
| المضيفين | `../demo/rental-guide/index.html` | افتح دليل تجريبي |
| التذييل، في الثلاث | نفس روابط القائمة، وسياسة الخصوصية والشروط لما تنكتب (`data-link`) | — |

**القواعد:**
- **كل صفحة من الثلاث تربط للثنتين الباقية.** السكربت في §15 يفحصها.
- **البابين:**
  - رابط `<a href>` حقيقي، مو نقرة JS.
  - العنوان هو الرابط، وغطاؤه يغطي البطاقة كلها (`web-art-director.md` §3).
- **رابط الصفحة الحالية** في القائمة عليه `aria-current="page"`.
- **ولا `href="#"`:**
  - الحين في ذيل البوابة رابطين كذا (`index.html:261`).
  - روابط السياسات تطلع بـ `data-link` من `config.js` (`app.js:82-91`)، بس لما تنكتب.
- **`#how`** لازم يكون `id="how"` في البوابة.
- الروابط لصفحات noindex عادية، وما تحتاج `nofollow`.

**يتصلح مع البناء الجديد:**
- **ذيل `demo/review/index.html`** (السطر 66):
  - الحين يودّي لـ `../../index.html#host` و`#shop` و`#pricing` و`#faq`.
  - هالأقسام بتختفي من البوابة، فتصير الروابط `../../restaurants/index.html` و`../../hosts/index.html` و`../../index.html#how`.
  - الملف عند وكيل ثاني الحين.
- **رابط «رجوع لموقع لمسة تاب»** في صفحات العرض (`assets/client.js` السطر 113-119):
  - الحين يودّي للبوابة.
  - **اقتراح للمطوّر:** المنيو والواي فاي والروابط ترجع لـ `restaurants/`، ودليل الوحدة يرجع لـ `hosts/`.

---

## 10) الصور والنص البديل
- **الصور الفوتوغرافية زخرفية:**
  - `alt=""` على الطبقتين، الأبيض والأسود واللون.
  - في البطل، والقصة، والبابين، والعرض الحي (`web-copy.md:131` و`:253`).
  - المعلومة موجودة نص جنبها.
- **الشعار:**
  - `alt="لمسة تاب — LamsaTap"` عن طريق `data-company-alt`.
  - لو فيه نسختين (الطايرة ونسخة الرأس)، وحدة بس تنقرى، والثانية `alt=""`. مثل `index.html:64-65` الحين.
- **شعارات محلات المثال:** alt باسم المحل، مثل «مقهى المثال».
- **الأيقونات جنب نص:** `aria-hidden="true"`.
- **رسمة SVG تشرح شي:** `role="img"` و`<title>` من web-copy §5.
- **الباركود:**
  - ما نكتب الرابط المؤقت `example.com` كنص بديل.
  - البديل هو الفعل اللي جنبه، «افتح المثال».
- **ولا حشو كلمات في alt** (`alt-text`).
- **كل `<img>` عليها `width` و`height`** (`image-dimension`).
  - الحين خمس شعارات لمحلات المثال داخل الجوالات المصغرة بدونها.
  - تمشي لو حاويتها ثابتة المقاس.
- **أسماء ملفات الصور:** بالإنجليزي وواضحة، مثل `restaurant-dallah`. تكفي.

---

## 11) الأداء اللي يأثر على البحث
**الأهداف:** LCP ≤ 2.5 ثانية، وINP ≤ 200ms، وCLS ≤ 0.1. هذي حدود Core Web Vitals «جيد» من web.dev (غير مؤكد).

**LCP (أكبر عنصر يترسم):**
- **صفحتي الجمهور:** المرشحة طبقة الأبيض والأسود في صورة البطل: R1 للمطاعم، وH1 للمضيفين (`web-art-director.md` §7.1).
  - بدون `loading="lazy"`، وعليها `fetchpriority="high"`.
  - عليها `width` و`height`، و`srcset` بـ 800 و1600، و`sizes` يطابق عرضها الفعلي (`image-optimization`).
  - **طبقة اللون ما تنافسها:** تنزل بعدها، كسولة، والمسح بعد `img.decode()` (`web-art-director.md` §4).
- **البوابة:** المرشح غالباً h1، وهو نص.
  - h1 ظاهر من أول رسم، حتى مع كلاس الحركة `m`.
  - حقل الوحدات والباركود ما يأخرون الرسم (`no-blocking-animation`).
  - **اقتراح `font-preload`** لخط Readex Pro:
    ```html
    <link rel="preload" href="assets/brand/fonts/readex-pro-arabic-latin.woff" as="font" type="font/woff" crossorigin>
    ```
  - جرّبه من file:// ومن الخادم. لو طلع خطأ في الكونسول على file://، خلّه في نسخة `dist/` بس.
- **صور البابين** تحت الطية: `loading="lazy"` (`lazy-load-below-fold`).

**CLS (قفز المحتوى):**
- `width` و`height`، أو `aspect-ratio`، لكل صورة ولكل حاوية فن (`image-dimension` و`content-jumping`).
- **الحركة** transform وopacity وclip-path بس (الموجز §4). الـ transform ما يحرك التخطيط (`layout-shift-avoid`).
- **خانة الشعار في الرأس** محجوزة من البداية، والشعار يطير لها بدون قفزة.
- **أزرار الواتساب:**
  - تبدأ `hidden` في HTML (`index.html:48` وغيره)، و`app.js` يطلّعها بعد تحميل الصفحة (السطر 52-63).
  - الحين الرقم فاضي، فما تطلع.
  - **يوم يتعبّى الرقم:** ممكن تطلع بعد أول رسم وتدف اللي تحتها. أخطرها زر التجربة في بطل صفحتي الجمهور.
  - **الحل (للمطوّر):** تنكتب ثابتة في `dist/`، بـ href جاهز وبدون `hidden`. أو مكانها يكون محجوز. وبعدها قِس CLS.
- **الخطوط:** عليها `font-display: swap` (`tokens.css`). تبديل الخط ممكن يحرك النص شوي، فقِسه.
- **التثبيت (pin) في ScrollTrigger** يضيف مسافة. قِس CLS بعد التحميل على 390 وعلى 1440.

**INP (سرعة الرد على اللمس):**
- سكربتات GSAP عليها `defer`.
- شغل كل إطار أقل من 16ms (`main-thread-budget`).
- الأكورديون يرد على طول.

**الحجم:**
- `build-dist.cjs` (السطر 17 و80-98) يوقف الرفع لو صفحة فوق 100KB خام أو 50KB gzip. الحساب HTML وCSS وJS، بدون الخطوط والصور.
- **قسته اليوم** بمحاكاة نفس الحساب (قراءة بس):
  - البوابة الحالية: 241.1KB خام، و79.4KB gzip.
  - منها GSAP وScrollTrigger: 114.7KB خام، و45.3KB gzip.
  - يعني **أي صفحة فيها GSAP تطيح الحد الخام لحالها**.
  - صفحات العرض كلها تحت الحد: من 35.2 إلى 79.4KB خام.
- **يحتاج قرار (المطوّر والمدير العام):**
  - حد منفصل لصفحات الشركة اللي فيها GSAP، أو ينقاس `vendor/` لحاله.
  - صفحات الزبون تبقى على الحد الحالي (GM-011).

**الخطوط:**
- الخطوط woff، مو woff2: Readex Pro 50KB، وFigtree 20KB.
- woff2 أصغر، بس التحويل يحتاج أداة، يعني تنزيل بموافقة.
- عند web-brand، وأولويته منخفضة.

**تقريب لطريقة قوقل في الرسم:**
- لقطة بشاشة طويلة بدون تمرير، ولازم كل النص يبان.
- **جربتها** على البوابة الحالية، 1440×9000:
  - النص ظاهر.
  - وتحت البطل مسافة فاضية كبيرة من التثبيت. هذا طبيعي مع شاشة طويلة، وما يضر.
- **القاعدة من ui-ux-pro-max:**
  - `data/motion.csv` صف 4: لا تخفي محتوى تحت الطية يحتاجه البحث، إلا ومعه بديل بدون JS.
  - `data/styles.csv` صف 49: نمط القصص بالتمرير مو مناسب للصفحات اللي البحث مهم لها.
  - **حلّنا:** النص كله في HTML، وبدون JS يبان كامل، وتقليل الحركة يعرض الشكل النهائي.

**قياس محلي بدون إنترنت:** افتح `http://localhost:8123/restaurants/` في Chrome، وافتح الكونسول والصق:
```js
new PerformanceObserver(l => l.getEntries().forEach(e => console.log('LCP', Math.round(e.startTime), e.element))).observe({ type: 'largest-contentful-paint', buffered: true });
let cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) { cls += e.value; console.log('CLS', cls.toFixed(3), e.sources); } })).observe({ type: 'layout-shift', buffered: true });
```
- وبعدها Lighthouse من DevTools على وضع الجوال. يشتغل على localhost بدون إنترنت.

---

## 12) يوم الإطلاق، بالترتيب
1. **الدومين الأساسي** (صاحب المشروع ومشرف الشبكة):
   - `.sa` ولا `.com`؟ ومع `www` ولا بدون؟
   - الباقي يتحول له بـ 301، وhttp يتحول لـ https.
   - يتغير في `website/config.js` و`systems/shortlinks/config.json` بنفس القيمة (`website/README.md`، «يوم الإطلاق» بند 1).
   - **يتقرر قبل برمجة أي شريحة**، لأن الشريحة تحمل الدومين للأبد (سكيل website-design السطر 38).
2. `node tools/build-home-minis.cjs`، بعد ما يخلّص الوكيل اللي شغال عليه الحين.
3. **الختم الثابت** في الصفحات الثلاث بالدومين: canonical، وog:url، وog:image، وروابط JSON-LD.
4. **صور المشاركة الثلاث**، و`twitter:card` قيمته `summary_large_image`.
5. **`robots.txt` و`sitemap.xml`** في جذر `website/`، والقوالب تحت. الأفضل تتولد من `config.domain` مثل باقي الختم.
6. **إصلاح `build-dist.cjs`:** فحص JSON-LD، وقرار حد الحجم. بعدها `node tools/build-dist.cjs` لازم يقول «جاهز للرفع».
7. **صفحة 404:**
   - `systems/shortlinks/build.js` (السطر 61) يكتب `404.html` في الجذر: `noindex`، وفيها «الرابط غير موجود».
   - الموقع والروابط الثابتة بيترفعون لنفس الجذر، فنتفق على ملف 404 واحد (مشرف الشبكة والمطوّر).
   - **ليش مهم:** بدون `404.html` في الجذر، Cloudflare Pages يعامل الموقع كتطبيق صفحة وحدة، ويرجّع الرئيسية لأي رابط غلط بحالة 200 (غير مؤكد، يتأكد من توثيقهم).
8. **placeholders:**
   - `[رقم السجل التجاري]` يتعبّى.
   - و`[السعر المعتمد]` ما يبقى في أي مكان.
9. **الواتساب:** الرقم في `config.js`، والأزرار بدون قفزة (§11).
10. **بعد الرفع** (صاحب المشروع يسوي الحسابات):
    - Google Search Console:
      - خاصية دومين بتحقق DNS.
      - يرسل `sitemap.xml`، ويفحص الروابط الثلاثة بـ URL Inspection.
      - في «Page indexing»، صفحات demo تطلع «Excluded by noindex». وهذا المطلوب.
    - Rich Results Test على الثلاث.
    - PageSpeed Insights على الثلاث، بوضع الجوال.
    - **معاينة واتساب:** يرسل الروابط الثلاثة لنفسه من آيفون ومن أندرويد، ويتأكد من الصورة والعنوان.
11. **`seo-check`** (§15) على `website/` بعد الختم: المطلوب صفر FAIL وصفر WARN.

**`robots.txt`** (قالب، والدومين من `config.js`):
```text
User-agent: *
Disallow:

Sitemap: https://example.com/sitemap.xml
```
- **ولا `Disallow` لـ `/demo/` ولا `/templates/`:** لو الزحف ممنوع، قوقل ما يشوف `noindex` (غير مؤكد).
- **ولا `Disallow` لـ `/assets/` ولا `/vendor/`:** قوقل يحتاجها عشان يرسم الصفحة.
- **`/t/` يبقى مفتوح:** صفحاته `noindex` وتحوّل.

**`sitemap.xml`** (قالب):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/restaurants/</loc></url>
  <url><loc>https://example.com/hosts/</loc></url>
</urlset>
```
- الثلاث بس، وبنفس canonical حرف بحرف.
- `<lastmod>` بس لو التاريخ صحيح، يعني تاريخ آخر تعديل فعلي للمحتوى.
- قوقل يتجاهل `priority` و`changefreq` (غير مؤكد).
- **ما ننشئ الملفين الحين.** الدومين مؤقت (`website/README.md`، قسم «البحث»).

---

## 13) وش لازم يكون في كل صفحة (قائمة التشغيل)
| البند | البوابة `index.html` | المطاعم `restaurants/index.html` | المضيفين `hosts/index.html` |
|---|---|---|---|
| `<html>` | `lang="ar" dir="rtl" data-canonical="/"` | `lang="ar" dir="rtl" data-canonical="/restaurants/"`، و`data-audience="restaurants"` (مكانه عند المطوّر) | `lang="ar" dir="rtl" data-canonical="/hosts/"`، و`data-audience="hosts"` |
| charset وviewport | لازم | لازم | لازم |
| `<title>` | `web-copy.md:121` | `web-copy.md:246` | `web-copy.md:364` |
| `description` | ج11 (`web-copy.md:767`) | `web-copy.md:247` | `web-copy.md:365` |
| `og:title` | `web-copy.md:123` | نفس title | نفس title |
| `og:description` | `web-copy.md:769` | نفس description | نفس description |
| og:type وsite_name وlocale | `website` و«لمسة تاب» و`ar_SA` | نفسها | نفسها |
| canonical وog:url | `https://example.com/` | `https://example.com/restaurants/` | `https://example.com/hosts/` |
| og:image (يوم الإطلاق) | `og-home` | `og-restaurants` | `og-hosts` |
| الأيقونات | بدون `../` | بـ `../` | بـ `../` |
| robots | بدون noindex | بدون noindex | بدون noindex |
| h1 (واحد) | قرّب جوالك، تنفتح الصفحة | خلّ جوال زبونك يرد عنك | دليل كل وحدة، عند بابها |
| الأسعار الظاهرة | ولا سعر | 1,199 و790 بس | 49 و539 و39 و429 بس |
| الضريبة | ولا كلمة | ولا كلمة | ولا كلمة |
| JSON-LD (§8) | Organization وWebSite | Service بعرضين، وBreadcrumbList | Service بأربع عروض، وBreadcrumbList |
| LCP | h1 نص، وولا صورة عليها `fetchpriority` | طبقة الأبيض والأسود لـ R1: `fetchpriority="high"` وبدون lazy | نفسه لـ H1 |
| باقي الصور | البابين: lazy و`alt=""` | `alt=""`، وlazy تحت الطية | `alt=""`، وlazy تحت الطية |
| روابط لازمة | `restaurants/index.html` و`hosts/index.html` و`#how` | `../index.html` و`../hosts/index.html` و`../index.html#how` والأمثلة الأربعة | `../index.html` و`../restaurants/index.html` و`../index.html#how` والدليل التجريبي |
| رسائل الواتساب (`waText`) | `home` | `shop` و`shopTrial` و`reviewAny` | `host` و`hostTrial` و`portfolio` |
| السكربتات | `config.js` و`assets/app.js`، وGSAP بـ `defer` | نفسها بـ `../` | نفسها بـ `../` |
| ولا شي من | `shops/`، و«شامل الضريبة» | `shops/`، وأسعار المضيفين، والحلاق والصالون والورشة والعيادات (GM-043) | `shops/`، وأسعار المطاعم |

**صفحات العرض والقوالب:**
| البند | المطلوب |
|---|---|
| robots | `<meta name="robots" content="noindex">`. موجود في العشر |
| canonical | لا |
| sitemap | لا |
| robots.txt | ما تنمنع (§12) |
| الأيقونة | `data:,` للأمثلة والقوالب، وأيقونتنا لصفحة الشرح وورقة QR |
| رابط الرجوع | لصفحة جمهوره (اقتراح، §9) |
| Open Graph | اختياري، عشان المشاركة في واتساب (§6) |

---

## 14) الكلمات والمنافسين وفجوات المحتوى (مؤجل)
**بذور كلمات، غير مقاسة.** ما عندنا بيانات بحث ولا أداة. هذي فرضيات تنفحص بعد الإطلاق:
| الكلمة | الصفحة | النية | وين موجودة في نصوصنا |
|---|---|---|---|
| لمسة تاب / LamsaTap | البوابة | الوصول لنا | title، وalt الشعار، و`alternateName` |
| منيو إلكتروني | المطاعم | شراء | «منيو» في title |
| منيو باركود / منيو QR | المطاعم | شراء | «باركود QR» في title البوابة، و«الباركود» في سؤال 2 |
| ستاند تقييم قوقل | المطاعم | شراء | الباقة، وسطر «ينفع لأي نشاط» |
| تقييم قوقل / تقييم جوجل | المطاعم | شراء | «قوقل» بس في نصوصنا |
| باركود واي فاي | المطاعم | شراء | «كلمة مرور الواي فاي بزر نسخ» |
| شريحة NFC للمطاعم | المطاعم | شراء | «NFC» في title البوابة، وسؤال 1 |
| منيو إلكتروني جدة | المطاعم | شراء محلي | «نركّب حالياً في جدة» |
| دليل الضيف | المضيفين | شراء | «دليل الضيف» في الباقة |
| دليل الشقة المفروشة | المضيفين | شراء | «دليل الوحدة» في title |
| إيجار قصير / شقق مفروشة | المضيفين | بحث وشراء | الباب في البوابة. وtitle المضيفين ما فيه (اقتراح §3) |
| تشيك أوت الشقة / تسجيل خروج الضيف | المضيفين | بحث | «تم الخروج» |

**ملاحظات:**
- **طريقة الكتابة:**
  - نصوصنا تكتب «قوقل» بس. وناس كثير تكتب «جوجل».
  - و«إلكتروني» بهمزة، وناس تكتبها «الكتروني».
  - قوقل غالباً يعرف إنها نفس الكلمة (غير مؤكد).
  - **القرار عند web-copy والتسويق:** نذكر «جوجل» مرة بشكل طبيعي، ولا نخليها؟ أولوية منخفضة.
- **البحث الحقيقي بعد الإطلاق:**
  - كلمات Search Console بعد 4 إلى 8 أسابيع.
  - Keyword Planner يحتاج حساب إعلانات، يفتحه صاحب المشروع.
  - أو بحث ويب بموافقة.
- **المنافسين:**
  - بعد موافقة على بحث ويب: 2 إلى 3 مزودين محليين لمنيو QR أو NFC، ومزود دليل ضيف.
  - نقارن بجدول المهارة: الكلمات، وعمق المحتوى، والتقنية، ومين ياخذ خانات النتائج المميزة.
- **أفكار محتوى:** بقرار المدير العام، وفي نطاق GM-043، وبمراجعة المستشار القانوني:
  - كيف تطلب تقييم قوقل بدون ما تخالف سياستهم (`legal/register.md` بند 4 و5).
  - السعرات في المنيو: وش المطلوب (web-ux ر3-4).
  - وش تكتب في دليل الضيف.

---

## 15) التشغيل
**من جذر المشروع، كلها قراءة بس:**
1. **السكربت تحت:**
   - انسخه لملف في مجلد مؤقت، مو داخل `website/`.
   - شغّله: `node <المسار>/seo-check.cjs`.
   - المطلوب قبل الإطلاق: صفر FAIL. وWARN مقبول بس في: الدومين المؤقت، وog:image، وcanonical بالـ JS، وrobots/sitemap، و`[رقم السجل التجاري]`.
2. **GM-043:** `grep -rn "shops" website/ tools/`. المطلوب صفر.
3. **الضريبة:** `grep -n "ضريب" website/index.html website/restaurants/index.html website/hosts/index.html`. المطلوب صفر.
4. **ui-probe**، مثل ما في `builder-phase-b.md` السطر 80:
   - `node "$HOME/.claude/tools/ui-probe.cjs" --serve website <path> --out <scratch> --widths 1440,390`.
   - مرة عادية، ومرة مع `--reduced-motion`، على الصفحات الثلاث وصفحات العرض.
   - يطلّع أخطاء الكونسول، والصور المكسورة، والروابط.
5. **الرأس بعد JS:**
   ```sh
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom "http://localhost:8123/restaurants/" | grep -o -E '<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>'
   ```
6. **لقطة الشاشة الطويلة** (§11):
   ```sh
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,9000 --virtual-time-budget=5000 --screenshot=<scratch>/tall.png "http://localhost:8123/restaurants/"
   ```
7. **LCP وCLS:** المقتطف في §11، وLighthouse.

**`seo-check.cjs`:**
- جربته اليوم على ثلاث حالات:
  - المشروع نفسه.
  - نسخة وهمية سليمة: طلعت صفر FAIL، وWARN واحد (الدومين المؤقت).
  - نسخة وهمية فيها أغلاط مزروعة: صادها كلها. h1 مكرر، و`shops`، وسعر في غير صفحته، وصورة LCP كسولة، ورابط مكسور، وحقل ضريبة، وسعر غير معتمد، و`Disallow` غلط.
```js
// seo-check: فحص SEO قبل الإطلاق لصفحات الشركة الثلاث (قراءة بس، ما يكتب ولا يطلب شي من برّا).
// التشغيل من جذر المشروع: node <مسار هذا الملف>        أو: node <مسار هذا الملف> <جذر المشروع>
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(process.argv[2] || process.cwd()), W = path.join(ROOT, 'website');
let fail = 0, warn = 0;
const out = (tag, page, msg) => { if (tag === 'FAIL') fail++; if (tag === 'WARN') warn++; console.log(tag.padEnd(4) + ' ' + page + ': ' + msg); };
const read = (f) => fs.readFileSync(f, 'utf8');
const attr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*"([^"]*)"', 'i')); return m ? m[1] : null; };
const textOf = (h) => h.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const len = (s) => Array.from(s.trim()).length;

// الدومين من config.js (المصدر الوحيد)
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(read(path.join(W, 'config.js')), ctx);
const DOMAIN = String((ctx.SITE || {}).domain || '').replace(/\/+$/, '');
out(/example\.com/.test(DOMAIN) ? 'WARN' : 'PASS', 'config.js', 'domain = ' + DOMAIN + (/example\.com/.test(DOMAIN) ? ' (مؤقت، طبيعي قبل الإطلاق)' : ''));

// أسعار كل صفحة (services/pricing.md، GM-044). البوابة بدون أسعار
const REST = [/1,199/, /\b790\b/], HOST = [/\b49\s*ريال/, /\b39\s*ريال/, /\b539\b/, /\b429\b/];
const PAGES = [
  { f: 'index.html', canon: '/', must: [], mustNot: REST.concat(HOST), ld: [] },
  { f: 'restaurants/index.html', canon: '/restaurants/', must: REST, mustNot: HOST, ld: [1199, 790], lcp: true },
  { f: 'hosts/index.html', canon: '/hosts/', must: HOST, mustNot: REST, ld: [49, 39, 539, 429], lcp: true },
];

for (const P of PAGES) {
  const file = path.join(W, P.f), dir = path.dirname(file);
  if (!fs.existsSync(file)) { out('FAIL', P.f, 'الصفحة مو موجودة'); continue; }
  const h = read(file), head = (h.match(/<head[\s\S]*?<\/head>/i) || [''])[0], txt = textOf(h);
  const html = (h.match(/<html\b[^>]*>/i) || [''])[0];
  out(attr(html, 'lang') === 'ar' && attr(html, 'dir') === 'rtl' ? 'PASS' : 'FAIL', P.f, 'lang="ar" dir="rtl"');
  out(/<meta\b[^>]*name="viewport"[^>]*width=device-width/i.test(head) && /<meta\b[^>]*charset="utf-8"/i.test(head) ? 'PASS' : 'FAIL', P.f, 'charset و viewport');
  const h1 = (h.match(/<h1\b/gi) || []).length;
  out(h1 === 1 ? 'PASS' : 'FAIL', P.f, 'عدد h1 = ' + h1);
  const title = ((head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  out(!title ? 'FAIL' : len(title) >= 30 && len(title) <= 60 ? 'PASS' : 'WARN', P.f, 'title ' + len(title) + ' حرف (30 إلى 60)');
  const meta = (name, key) => { const t = head.match(new RegExp('<meta\\b[^>]*' + key + '="' + name + '"[^>]*>', 'i')); return t ? attr(t[0], 'content') : null; };
  const desc = meta('description', 'name') || '';
  out(!desc ? 'FAIL' : len(desc) >= 70 && len(desc) <= 160 ? 'PASS' : 'WARN', P.f, 'description ' + len(desc) + ' حرف (70 إلى 160)');
  for (const p of ['og:title', 'og:description', 'og:type', 'og:site_name', 'og:locale']) if (!meta(p, 'property')) out('FAIL', P.f, p + ' ناقص');
  const ogi = meta('og:image', 'property');
  out(!ogi ? 'WARN' : ogi.indexOf(DOMAIN + '/') === 0 ? 'PASS' : 'FAIL', P.f, 'og:image ' + (ogi || 'ناقص (يوم الإطلاق)'));
  if (/<meta\b[^>]*name="robots"[^>]*noindex/i.test(head)) out('FAIL', P.f, 'فيها noindex وهي صفحة تنفهرس');
  const can = (head.match(/<link\b[^>]*rel="canonical"[^>]*>/i) || [])[0], ogu = meta('og:url', 'property');
  if (can) {
    out(attr(can, 'href') === DOMAIN + P.canon ? 'PASS' : 'FAIL', P.f, 'canonical ثابت = ' + attr(can, 'href') + ' (المطلوب ' + DOMAIN + P.canon + ')');
    out(ogu === attr(can, 'href') ? 'PASS' : 'FAIL', P.f, 'og:url = ' + (ogu || 'ناقص') + ' (لازم = canonical)');
  } else out(attr(html, 'data-canonical') === P.canon ? 'WARN' : 'FAIL', P.f, 'canonical بالـ JS بس (data-canonical="' + attr(html, 'data-canonical') + '"، المطلوب "' + P.canon + '"). يوم الإطلاق ينكتب ثابت');
  if (ogi && meta('twitter:card', 'name') !== 'summary_large_image') out('WARN', P.f, 'twitter:card مو summary_large_image مع وجود og:image');
  for (const [rel, re] of [['favicon.ico', /rel="icon"[^>]*favicon\.ico|favicon\.ico[^>]*rel="icon"/i], ['favicon.svg', /favicon\.svg/i], ['apple-touch-icon', /rel="apple-touch-icon"/i]]) {
    const t = (head.match(new RegExp('<link\\b[^>]*' + (rel === 'apple-touch-icon' ? 'rel="apple-touch-icon"' : rel.replace('.', '\\.')) + '[^>]*>', 'i')) || [])[0];
    out(t && re.test(t) && fs.existsSync(path.join(dir, attr(t, 'href') || '')) ? 'PASS' : 'FAIL', P.f, 'أيقونة ' + rel);
  }
  if (/shops/i.test(h)) out('FAIL', P.f, 'فيها "shops" (GM-043)');
  if (/ضريب/.test(h)) out('FAIL', P.f, 'فيها ذكر للضريبة (GM-044)');
  if (/\[السعر المعتمد\]/.test(h)) out('FAIL', P.f, 'placeholder «[السعر المعتمد]» باقي');
  if (/\[رقم السجل التجاري\]/.test(h)) out('WARN', P.f, 'placeholder «[رقم السجل التجاري]» (يتعبّى يوم الإطلاق)');
  for (const re of P.must) if (!re.test(txt)) out('FAIL', P.f, 'سعر ناقص: ' + re);
  for (const re of P.mustNot) if (re.test(txt)) out('FAIL', P.f, 'سعر مو لهالصفحة: ' + re);
  // الصور
  const imgs = h.match(/<img\b[^>]*>/gi) || [];
  let noAlt = 0, noSize = 0, hi = 0;
  for (const t of imgs) {
    if (attr(t, 'alt') === null) noAlt++;
    if (attr(t, 'width') === null || attr(t, 'height') === null) noSize++;
    if (attr(t, 'fetchpriority') === 'high') { hi++; if (attr(t, 'loading') === 'lazy') out('FAIL', P.f, 'صورة LCP عليها loading="lazy"'); }
  }
  out(noAlt ? 'FAIL' : 'PASS', P.f, imgs.length + ' صورة، بدون alt: ' + noAlt);
  if (noSize) out('WARN', P.f, noSize + ' صورة بدون width/height (تأكد إن حاويتها لها aspect-ratio)');
  if (P.lcp && hi !== 1) out('WARN', P.f, 'fetchpriority="high" على ' + hi + ' صورة (المطلوب صورة البطل بس)');
  if (!P.lcp && hi > 1) out('WARN', P.f, 'fetchpriority="high" على أكثر من صورة');
  // الروابط الداخلية
  let broken = 0; const targets = new Set();
  for (const m of h.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], 'href');
    if (href === null || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    if (href === '#' || href === '') { broken++; out('FAIL', P.f, 'رابط ميت href="' + href + '"'); continue; }
    const hash = href.split('#')[1], p = href.split('#')[0].split('?')[0];
    let target = p ? path.join(dir, p) : file;
    if (p && (p.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory()))) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { broken++; out('FAIL', P.f, 'رابط لملف مو موجود: ' + href); continue; }
    targets.add(path.normalize(target));
    if (hash && read(target).indexOf('id="' + hash + '"') < 0) { broken++; out('FAIL', P.f, 'رابط لقسم مو موجود: ' + href); }
  }
  if (!broken) out('PASS', P.f, 'الروابط الداخلية سليمة');
  for (const Q of PAGES) if (Q !== P && !targets.has(path.normalize(path.join(W, Q.f)))) out('FAIL', P.f, 'ما فيها رابط لـ ' + Q.f);
  // البيانات المنظمة
  const lds = [...h.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (!lds.length) out('WARN', P.f, 'ما فيها JSON-LD');
  for (const s of lds) {
    let j; try { j = JSON.parse(s); } catch (e) { out('FAIL', P.f, 'JSON-LD ما ينقرى: ' + e.message); continue; }
    const str = JSON.stringify(j);
    if (/valueAddedTaxIncluded|vatID|taxID/.test(str)) out('FAIL', P.f, 'JSON-LD فيه حقل ضريبة (GM-044)');
    if (/shops/i.test(str)) out('FAIL', P.f, 'JSON-LD فيه shops');
    const prices = [...str.matchAll(/"price":"?([0-9.]+)"?/g)].map((m) => Number(m[1]));
    const bad = prices.filter((x) => P.ld.indexOf(x) < 0);
    out(bad.length ? 'FAIL' : 'PASS', P.f, 'أسعار JSON-LD: [' + prices.join(', ') + ']' + (bad.length ? ' فيها غير المعتمد: ' + bad.join(', ') : ''));
    for (const u of str.match(/https?:\/\/[^"]+/g) || []) if (!/schema\.org/.test(u) && u.indexOf(DOMAIN) !== 0) out('FAIL', P.f, 'رابط في JSON-LD بدومين غير config: ' + u);
  }
}

// صفحات العرض والقوالب: noindex، وبدون canonical
let ni = 0;
for (const base of ['demo', 'templates']) (function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (!/\.html$/.test(e.name)) continue;
    const rel = path.relative(W, f).split(path.sep).join('/'), h = read(f);
    if (!/<meta\b[^>]*name="robots"[^>]*noindex/i.test(h)) out('FAIL', rel, 'بدون noindex'); else ni++;
    if (/rel="canonical"/i.test(h)) out('WARN', rel, 'فيها canonical مع noindex');
  }
})(path.join(W, base));
out('PASS', 'demo/ و templates/', ni + ' صفحة عليها noindex');

// robots.txt و sitemap.xml (يوم الإطلاق)
const rob = path.join(W, 'robots.txt'), sm = path.join(W, 'sitemap.xml');
if (!fs.existsSync(rob)) out('WARN', 'robots.txt', 'مو موجود (يوم الإطلاق)');
else {
  const r = read(rob);
  out(r.indexOf('Sitemap: ' + DOMAIN + '/sitemap.xml') >= 0 ? 'PASS' : 'FAIL', 'robots.txt', 'سطر Sitemap بالدومين');
  if (/^\s*Disallow:\s*\/\s*$/m.test(r) || /Disallow:\s*\/(demo|templates|assets|vendor)/i.test(r)) out('FAIL', 'robots.txt', 'فيه Disallow يمنع الزحف (noindex ما ينشاف، والتنسيق ما ينقرى)');
}
if (!fs.existsSync(sm)) out('WARN', 'sitemap.xml', 'مو موجود (يوم الإطلاق)');
else {
  const locs = [...read(sm).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).sort();
  const want = PAGES.map((p) => DOMAIN + p.canon).sort();
  out(JSON.stringify(locs) === JSON.stringify(want) ? 'PASS' : 'FAIL', 'sitemap.xml', 'الروابط: ' + locs.join(' ، ') + ' (المطلوب ' + want.join(' ، ') + ')');
}

// GM-043: ولا "shops" في website/ و tools/
let shops = [];
for (const base of ['website', 'tools']) (function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'vendor') walk(f); continue; }
    if (/\.(html|js|cjs|css|json|xml|txt)$/.test(e.name) && /shops/i.test(read(f))) shops.push(path.relative(ROOT, f));
  }
})(path.join(ROOT, base));
out(shops.length ? 'FAIL' : 'PASS', 'GM-043', 'ملفات فيها "shops": ' + (shops.join('، ') || 'صفر'));

console.log('\nFAIL ' + fail + ' · WARN ' + warn);
process.exitCode = fail ? 1 : 0;
```

**وش طلع على المشروع اليوم**، 2026-09-28 تقريباً 00:10، والبوابة تحت إعادة البناء عند وكيل ثاني:
- **7 FAIL:**
  - `[السعر المعتمد]` باقي في قسم العروض القديم.
  - رابطين `href="#"`.
  - البوابة ما تربط لـ `restaurants/` ولا `hosts/`.
  - والصفحتين مو موجودة للحين.
- **8 WARN:**
  - الدومين المؤقت، وog:image، وcanonical بالـ JS.
  - `[رقم السجل التجاري]`، و5 صور بدون مقاس، وما فيه JSON-LD.
  - robots، وsitemap.
- **كلها متوقعة قبل البناء الجديد والإطلاق.**

---

## 16) خطة العمل بالأولوية
**الأثر:** عالي، أو وسط، أو قليل. **الجهد:** سريع (أقل من ساعتين)، أو نص يوم، أو أيام.

**أ) في جولة البناء الحالية** (قبل «تم»):
| # | وش | مين | الأثر | الجهد | يعتمد على |
|---|---|---|---|---|---|
| 1 | رأس كامل لصفحتي الجمهور حسب §13 | المطوّر | عالي | سريع | نصوص web-copy (جاهزة) |
| 2 | رأس البوابة على «الاتجاه 3»: title وog:title | المطوّر | عالي | سريع | — |
| 3 | h1 واحد، وh2 لكل قسم (§4) | المطوّر | وسط | سريع | — |
| 4 | صورة البطل: `fetchpriority` وبدون lazy، وطبقة اللون بعدها (§11) | المطوّر، مع web-motion | عالي | سريع | الصور بعد التحويل |
| 5 | الروابط حسب §9: صفر `href="#"`، وذيل `demo/review`، ورجوع الأمثلة | المطوّر | وسط | سريع | يفضى ملف `demo/review` |
| 6 | كتل JSON-LD (§8) | المطوّر | وسط | سريع | إصلاح build-dist، بند 9 |
| 7 | تشغيل §15 وui-probe: صفر FAIL | المطوّر وweb-qa | عالي | سريع | 1 إلى 6 |

**ب) يوم الإطلاق** (§12):
| # | وش | مين | الأثر | الجهد | يعتمد على |
|---|---|---|---|---|---|
| 8 | الدومين الأساسي، و301، وhttps | صاحب المشروع ومشرف الشبكة | عالي | سريع | حجز الدومين |
| 9 | `build-dist`: فحص JSON-LD، وقرار حد الحجم مع GSAP | المطوّر والمدير العام | عالي، يوقف الرفع | سريع | — |
| 10 | ختم canonical وog:url وog:image وJSON-LD بالدومين | المطوّر | عالي | نص يوم | 8 |
| 11 | صور المشاركة الثلاث | print-studio وweb-brand | وسط | نص يوم | الشعار الرسمي |
| 12 | robots.txt وsitemap.xml | المطوّر | وسط | سريع | 8 |
| 13 | 404 موحّد للموقع والروابط الثابتة | مشرف الشبكة والمطوّر | وسط | سريع | — |
| 14 | أزرار الواتساب بدون قفزة | المطوّر | وسط | سريع | اعتماد الرقم |
| 15 | Search Console، وsitemap، وURL Inspection، وRich Results، وPageSpeed، ومعاينة واتساب | صاحب المشروع يفتح الحساب، والفريق يفحص | عالي | نص يوم | 8 إلى 14 |

**ج) بعد الإطلاق:**
| # | وش | مين | الأثر | الجهد | يعتمد على |
|---|---|---|---|---|---|
| 16 | بحث كلمات ببيانات حقيقية، وتعديل العناوين والوصف | التسويق وweb-copy | وسط | نص يوم | 4 إلى 8 أسابيع من Search Console |
| 17 | Google Business Profile، وبعدها `LocalBusiness` | صاحب المشروع والمستشار القانوني | عالي محلياً | أيام | السجل التجاري، وعنوان |
| 18 | مقارنة المنافسين وفجوات المحتوى | التسويق ومصمم الموقع | وسط | أيام | موافقة على بحث ويب |
| 19 | محتوى جديد (§14) | web-copy | وسط | أيام | قرار المدير العام |
| 20 | الخطوط woff2 | web-brand | قليل | سريع | موافقة على أداة |

**بعد الإطلاق نقدر نسوي** (من «Follow-Up» في المهارة):
- موجز محتوى لأعلى الكلمات.
- عناوين ووصف جديدة لو تغيّرت الصفحات.
- تقويم محتوى من فجوات المحتوى.

---

## 17) غير مؤكد، واللي تحققت منه
**غير مؤكد** (من معرفتي، وما فتحت مصدره اليوم لأن الشبكة ممنوعة):
- **حدود القص:** 600px للعنوان، و920 و680px للوصف. وإن Arial هو خط النتائج.
- **حدود Core Web Vitals:** 2.5 ثانية، و200ms، و0.1.
- **قوقل:**
  - يفضّل canonical في HTML.
  - noindex ما ينشاف لو الزحف ممنوع.
  - يتجاهل `priority` و`changefreq`.
  - الأيقونة مضاعفات 48px.
  - شعار Organization من 112px.
  - `LocalBusiness` يبي `address`.
  - FAQ مقصورة من 2023.
  - `WebSite` يطلّع اسم الموقع.
- **واتساب:**
  - ما يشغّل JS.
  - صورة المعاينة أقل من 300KB.
  - وقص الصور مربع في بعض التطبيقات.
- **Cloudflare Pages:**
  - بدون `404.html` في الجذر يرجّع الرئيسية بـ 200.
  - ويحوّل `index.html` لمسار المجلد.

**تحققت منه اليوم** (قراءة بس، وفحوص محلية):
- **المهارة:** نص `SKILL.md` و`SOURCE.md`.
- **الدومين:** `config.js:9` قيمته `https://example.com`.
- **canonical:** `app.js:93-104` يولّده من الدومين. شغلت البوابة في Chrome بدون واجهة، وطلع `https://example.com/`. وفي HTML الخام ما فيه.
- **رأس البوابة الحالي:** السطور 2 و11 و18 و20 و21-23. وh1 واحد في السطر 60.
- **الصفحتين:** `restaurants/` و`hosts/` مو موجودة للحين.
- **صفحات العرض:** العشر عليها `noindex`.
- **GM-043:** `shops` صفر في `website/` و`tools/`.
- **الأيقونات:**
  - ico فيه 16 و32 و48.
  - svg فيه الرمز أبيض على دائرة #14201F.
  - apple-touch 180×180، شفتها.
- **الخطوط:** woff، و`font-display: swap`، وما فيه preload.
- **العناوين والأوصاف:** عدد الحروف والعرض، قستها في Chrome بخط Arial 20 و14.
- **حد الحجم:** محاكاة `build-dist`. البوابة 241.1KB و79.4KB، وGSAP 114.7KB و45.3KB.
- **JSON-LD:** فحص `build-dist` يرفضه (`Unexpected token ':'`). والكتل الثلاث في §8 تنقرى، وأسعارها معتمدة.
- **روابط قديمة:** ذيل `demo/review/index.html:66` فيه روابط بتنكسر. و`client.js:113-119` يرجع للبوابة.
- **404:** `systems/shortlinks/build.js:61` يكتب `404.html` في الجذر.
- **أزرار الواتساب:** تبدأ `hidden`، و`app.js:52-63` يطلّعها.
- **السكربت في §15:** جربته على المشروع، وعلى نسخة وهمية سليمة، وعلى نسخة فيها أغلاط مزروعة.
