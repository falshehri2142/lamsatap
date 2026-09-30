# تركيب صور قسم الطباعة داخل مشاهد الموقع

## الحالة الحالية: الشعار على اللوحات (طلب صاحب المشروع 2026-09-29)
- طُلب وضع شعار لمسة تاب في المساحات البيضاء داخل صور الموقع.
- المصادر الحالية: `restaurant-cafe-stand-logo-v1.png` و`host-door-frame-logo-v1.png` و`scene-hosts-table-logo-v1.png`.
- التعديل بأداة imagegen المدمجة، مع مرجع مباشر من الشعار المعتمد `website/assets/brand/logo-stack.svg`، دون إضافة باركود أو محتوى طباعة جديد.
- الصور ملوّنة مسبقاً؛ `baked` في `tools/convert-images.py` يمنع تكرار معالجة اللون. مصادر المشاهد الأصلية محفوظة كما هي.
- نسخ الموقع الاثنتا عشرة صدّرت بـ Sharp: قياسا 800 و1600، لون وطبقة حبر/ورق، دون تغيير القص. تفاصيل التصدير في `work/2026-09-29-logo-scenes/exports.json`.

## الحالة السابقة: إيقاف تصاميم الطباعة (2026-09-28)
- اللوحات الخمس الأولى (main ‏af691d7) انركّبت في commit ‏482a723.
- بعدها صاحب المشروع رفضها، وبتنعاد بأسلوب جديد.
- التركيبات ونسخ الموقع انشالت، والطبقات رجعت بالكروت البيضاء (نفس الملفات بالبايت).
- كان التركيب موقوفاً لحين وصول اللوحات الجديدة؛ الطلب الحالي يجيز الشعار فقط.
- الوصفة تحت جاهزة لها: أماكن الكروت ثابتة في المشاهد، فالزوايا نفسها تنفع.

## المصادر
- المشاهد: `brand/photos/generated/*-imagen-1-upscaled-1.webp` (kie.ai، ‏Imagen 4 Ultra، مكبّرة بـ Recraft Crisp Upscale، 2560×1440). التفاصيل في `website/assets/images/CREDITS.md`.
- التصاميم: صور قسم الطباعة من `print/renders/*.png`، بنسخة الموقع `website/assets/print/*.png` (باركود وهمي ما ينقرى) من `tools/web-print-art.py`. الأصل عندهم ما يتغيّر.

## الأماكن
| المخرج | المشهد | التصميم | الزوايا (فوق يسار، فوق يمين، تحت يمين، تحت يسار) |
|---|---|---|---|
| `restaurants-hero-stand.webp` | طاولة كافيه وستاند أكريليك | ستاند المطاعم | `1001.6,431 1427.5,431 1427.5,1103.9 1011.3,1130.9` (الكرت الأبيض) |
| `hosts-hero-checkout.webp` | باب شقة وبرواز | لوحة الخروج | `1459,372 1722,372 1722,731 1459,731` (فتحة الكرتون داخل البرواز) |
| `hosts-table-stands.webp` | كونسول و3 ستاندات | دليل الوحدة يسار | `668,614 903,614 896,974 660,973` |
| | | الطوارئ وسط | `1151,614 1386,614 1390,972 1151,972` |
| | | الواي فاي يمين | `1628,614 1860,615 1871,970 1637,972` |

- ترتيب الكونسول نفس أسماء الصفحة تحت المشهد (RTL: الواي فاي يمين، والطوارئ وسط، ودليل الوحدة يسار، `website/hosts/index.html`).
- الزوايا انقاست من الصور نفسها، بقناع الأبيض المحايد (L أكثر من 89 و chroma أقل من 4.5) وخطوط الحواف. وفتحة البرواز من خط الكرتون (bevel) وتدرّج الإضاءة.

## الطريقة
- `--fit contain`: التصميم بنسبته داخل الكرت بدون مط، والباقي أبيض. نسبة كرت الكافيه 0.61، وفتحة البرواز 0.73، وكروت الكونسول 0.65 تقريباً.
- `--blend multiply`: التصميم × الصورة. الأبيض يرجع الصورة نفسها بالضبط، والحبر ياخذ ضو المكان، فما يبان إنه مركّب.
- `--soften 0.6`: عشان حدة التصميم تطابق حدة الصورة.
- **بعد التركيب:**
  - الطبقات من التركيب: غيّر مصادر `restaurant-cafe-stand` و`host-door-frame` و`scene-hosts-table` في LAYERS بـ `tools/convert-images.py`.
  - حلقة اللمس في قصة المضيفين (`.p-story-touch` في `hosts.css`): حطها على نقطة اللمس في اللوحة الجديدة.
  - حلقة اللمس في قصة المطاعم (`.r-story-touch` في `restaurants.css`): شيّك مكانها.

## الأوامر
```bash
M="--fit contain --blend multiply --soften 0.6"; G=brand/photos/generated; P=website/assets/print; C=brand/photos/composites; T=<مجلد مؤقت>
python tools/web-print-art.py
python tools/place-artwork.py --photo $G/restaurants-hero-imagen-1-upscaled-1.webp --art $P/restaurant-stand.png --quad "1001.6,431 1427.5,431 1427.5,1103.9 1011.3,1130.9" $M --out $C/restaurants-hero-stand.webp
python tools/place-artwork.py --photo $G/hosts-hero-imagen-1-upscaled-1.webp --art $P/checkout-sign.png --quad "1459,372 1722,372 1722,731 1459,731" $M --out $C/hosts-hero-checkout.webp
python tools/place-artwork.py --photo $G/hosts-table-imagen-1-upscaled-1.webp --art $P/guest-guide-stand.png --quad "668,614 903,614 896,974 660,973" $M --out $T/t1.png
python tools/place-artwork.py --photo $T/t1.png --art $P/emergency-stand.png --quad "1151,614 1386,614 1390,972 1151,972" $M --out $T/t2.png
python tools/place-artwork.py --photo $T/t2.png --art $P/wifi-stand.png --quad "1628,614 1860,615 1871,970 1637,972" $M --out $C/hosts-table-stands.webp
python tools/convert-images.py $C/restaurants-hero-stand.webp restaurant-cafe-stand
python tools/convert-images.py $C/hosts-hero-checkout.webp host-door-frame
python tools/convert-images.py $C/hosts-table-stands.webp scene-hosts-table
python tools/check-qr.py $P/*.png $C/*.webp website/assets/images/{restaurant-cafe-stand,host-door-frame,scene-hosts-table}-*.webp --jsqr <مجلد jsqr>
```

## الباركود
صور الطباعة فيها باركود حقيقي ينقرى. في الجولة الأولى، التجربة المعاكسة أثبتت إنه ينقرى داخل المشهد، حتى في طبقة 800 للمطاعم.
عشان كذا `web-print-art.py` يخربطه قبل التركيب، و`check-qr.py` لازم يطلع PASS لكل الصور قبل أي commit.
القاعدة: أي باركود داخل صورة يا وهمي ما ينقرى، يا يودّي لـ `/demo/` بس (GM-049 و GM-061).

## لا تحطها فوق المشهد مرة ثانية
استثناء مقصود بطلب صاحب المشروع (2026-09-29): خلفية `restaurant-symbol-plate-v1.png` مشتقة من مشهد الكافيه بتعديل imagegen يزيل الرمز المربع فقط ويبقي الستاند وكتابة LAMSATAP. تستخدم في بطل المطاعم أثناء حركة الرمز إلى الهيدر. الرمز المتحرك SVG أصلي منفصل، والتصدير بواسطة `work/2026-09-29-symbol-lift/export-assets.cjs`. الصورة الكاملة السابقة باقية كبديل عند تعطيل الحركة أو فشل الأصل.

التصاميم تنركّب داخل الصورة. لا تكتب أسماءها في `website/assets/mockups/print-art.js`، ولا ترجع خانات `.lt-slot[data-print]` فوق هالمشاهد، لأنها تطلع مرتين.
