# restaurants-notes — web-builder (المطاعم، منفذ 8812)، 2026-09-30

## وش تغيّر (website/restaurants/index.html + assets/restaurants.css فقط)
- البطل: الوصف من brief-copy، ورابط «شوف السعر». سطر a-trial انشال لأن الضمانات صارت مكوّن.
- `.trust` (4 بنود معتمدة، أيقونات 1.5px حبر، نقطة تيل عند «نرد خلال ساعة» GM-046) تحت البطل، ونسخة `trust--plan` جنب بطاقة السعر في #plan.
- الترتيب صار 6 أقسام: البطل ← الديمو ← (المشاكل + القصة في #experience) ← الباقة ← الأسئلة ← الختام. الأقسام تتبادل: أبيض/رملي/أبيض/رملي/أبيض.
- #demo: عنوان «جرّبها كأنك زبون.» ورابط `../index.html#tap-lab` بدون تكرار المكوّن.
- #plan: السعر 1,211 و798 بدون تغيير (services/pricing.md)، رقم 64/44 بوزن figure وtabular-nums، البطاقة elev-float. انحذف صف r-incl المكرر.
- المقاسات المقاسة: h1 64/44 (40 على 320 عشان ما يطلع برا)، h2 48/30، سعر 64/44.
- انشال `data-words` من عنوان المشاكل والختام: مع المقاس الجديد الكلمات كانت تطلع برا الشاشة في لقطة 1440.
- الـ hooks ما انمست: data-price-switch/scope/roll/swap، data-story*، data-product-*، data-expand*، data-accordion، data-wa*، data-tg*.

## الفحص
- 320/390/1024/1440: صفر سكرول أفقي، وصفر أخطاء كونسول. ولقطات 390 و1440 في web-builder-restaurants/.
- جربت تقليل الحركة: العناوين والضمانات داخل الشاشة.

## مفتوح
- build-dist.cjs يطيح لأن assets/signature.css (ملف builder الرئيسية) ما هو موجود، وهذا مو من ملفاتي.
- فيه فراغ كبير تحت البطل على 1440 (قريب 600px) من data-lift-stage، وحلّه في motion.js/css (طلب في requests-web-builder-restaurants.md).
- `.trust` معرّف في restaurants.css. لازم ينقل لـ site.css عشان يصير مكوّن واحد.
- UX طلب زر أسود واحد لكل شاشة، وما طبقته: بطاقة الباقة فيها زر واتساب وزر تليجرام بديل، ويتحكم فيهم app.js.
