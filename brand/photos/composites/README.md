# مشاهد الموقع بعد تركيب صور قسم الطباعة

طلب المدير العام بعد وصول صور الطباعة (main ‏af691d7): تنركّب صور قسم الطباعة على الكروت البيضاء في المشاهد المولّدة المعتمدة، بأداة `tools/place-artwork.py`.

## المصادر
- المشاهد: `brand/photos/generated/*-imagen-1-upscaled-1.webp` (kie.ai، ‏Imagen 4 Ultra ومكبّرة بـ Recraft Crisp Upscale، 2560×1440). التفاصيل في `website/assets/images/CREDITS.md`.
- التصاميم: `website/assets/print/*.png`، وهي نسخة الموقع من `print/renders/*.png` (قسم الطباعة) بباركود وهمي ما ينقرى، من `tools/web-print-art.py`. الأصل عندهم ما تغيّر.

## الملفات
| الملف | المشهد | اللي انركّب | مكانه |
|---|---|---|---|
| `restaurants-hero-stand.webp` | طاولة كافيه وستاند أكريليك | `restaurant-stand.png` | الكرت الأبيض داخل الستاند |
| `hosts-hero-checkout.webp` | باب شقة وبرواز على الجدار | `checkout-sign.png` | فتحة الكرتون الأبيض داخل البرواز |
| `hosts-table-stands.webp` | كونسول و3 ستاندات أكريليك | `guest-guide-stand.png` يسار، `emergency-stand.png` وسط، `wifi-stand.png` يمين | الكروت البيضاء الثلاثة |

الترتيب في الكونسول نفس أسماء الصفحة تحت المشهد (RTL: الواي فاي يمين، والطوارئ وسط، ودليل الوحدة يسار، `website/hosts/index.html` و `hosts.css`).

## الطريقة
- `--fit contain`: التصميم بنسبته 2:3 داخل الكرت بدون مط، والباقي أبيض (خلفية التصاميم كلها بيضاء، فما يبان فرق).
- `--blend multiply`: التصميم × الصورة. الأبيض يرجع الصورة نفسها بالضبط (الإضاءة والظل والانعكاس)، والحبر ياخذ ضو المكان.
- `--soften 0.6`: تنعيم خفيف عشان حدة التصميم تطابق حدة الصورة.
- الزوايا (فوق يسار، فوق يمين، تحت يمين، تحت يسار) انقاست من الصور نفسها: قناع الأبيض المحايد (L أكثر من 89 و chroma أقل من 4.5) وخطوط الحواف،
  وفتحة البرواز من خط الكرتون (bevel) وتدرّج الإضاءة. الفرق برّا الكروت ضجيج ضغط WebP بس (أعلى فرق 18 من 255 في أقل من 100 بكسل).

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
كل باركود داخل هالصور وهمي وما ينقرى (فحص `tools/check-qr.py` بـ OpenCV و jsQR، بمقاسات وقطع مكبّرة). لو تغيّرت صور الطباعة:
شغّل الأوامر من أولها، وافحص من جديد قبل أي commit.

## لا تحطها فوق المشهد مرة ثانية
التصاميم صارت داخل الصورة. لا تكتب أسماءها في `website/assets/mockups/print-art.js` ولا ترجع خانات `.lt-slot[data-print]` فوق هالمشاهد (تطلع مرتين).
