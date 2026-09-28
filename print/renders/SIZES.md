# print/renders/SIZES.md: مقاسات صور الموقع

صور PNG شفافة 2x للقطع النهائية (GM-050). طلعتها أداة التصدير `print/export.cjs` في خطوة «signs re-export» (2026-09-28، بعد مراجعة impeccable)، ومصمم الموقع ينسخها لـ `website/` بنفسه. ما أحد يكتب داخل `website/` من هنا.

**كل رقم تحت مقاس من الملف نفسه**، مو منقول من التصميم: المقاس من قطعة IHDR، والدقة من قطعة pHYs، والشفافية من قناة alpha، والباركود مقروء من الصورة.
القياس بكود مستقل عن أداة التصدير (Python: Pillow و OpenCV وقراءة قطع PNG بنفسه)، 2026-09-28، بعد إعادة التصدير.
إعادة التصدير طلّعت نفس الصور بالبايت (نفس SHA-256 اللي قبلها): رسم القوالب ما تغيّر بعد جولة الإصلاح. مراجعة impeccable ما طلبت تعديل، والتعديل الوحيد بعدها ملاحظة المعاينة في `index.html`، وهي ما تنطبع.

## الجدول

| الملف | القطعة | بالبكسل (عرض × ارتفاع) | الدقة داخل الملف | المقاس من الملف (mm) | النسبة w:h | w ÷ h | h ÷ w |
|---|---|---|---|---|---|---|---|
| `checkout-sign.png` | لوحة تأكيد الخروج (الباب، أكريليك) (`checkout`) | 756 × 1134 | 7559 px/m = 191.999 dpi | 100.01 × 150.02 | 2:3 | 0.6667 | 1.5000 |
| `wifi-stand.png` | ستاند الواي فاي (طاولة الوحدة) (`wifi-stand`) | 756 × 1134 | 7559 px/m = 191.999 dpi | 100.01 × 150.02 | 2:3 | 0.6667 | 1.5000 |
| `emergency-stand.png` | ستاند الطوارئ (طاولة الوحدة) (`emergency-stand`) | 756 × 1134 | 7559 px/m = 191.999 dpi | 100.01 × 150.02 | 2:3 | 0.6667 | 1.5000 |
| `guest-guide-stand.png` | ستاند دليل الوحدة (طاولة الوحدة) (`guest-guide-stand`) | 756 × 1134 | 7559 px/m = 191.999 dpi | 100.01 × 150.02 | 2:3 | 0.6667 | 1.5000 |
| `restaurant-stand.png` | ستاند المطاعم، وجه التقييم (`stand-review`) | 756 × 1134 | 7559 px/m = 191.999 dpi | 100.01 × 150.02 | 2:3 | 0.6667 | 1.5000 |

| الملف | الشفافية | الباركود يفتح (وهمي) | SHA-256 (أول 16) |
|---|---|---|---|
| `checkout-sign.png` | RGBA. الزوايا الأربع شفافة (alpha 0,0,0,0)، مدوّرة بنصف قطر 3.95 إلى 3.96mm (محسوب من مساحة الشفاف في كل زاوية). الشفاف 0.08% من الصورة، والباقي اللوح كامل | `https://example.com/t/EXAMPLEOUT01/` | `c2c2cf7c4f548e31` |
| `wifi-stand.png` | RGBA. مستطيل كامل: الزوايا alpha 255,255,255,255، والشفاف 0% | `https://example.com/t/EXAMPLEWIFI1/` | `3d5bc2951b6e9b8e` |
| `emergency-stand.png` | RGBA. مستطيل كامل: الزوايا alpha 255,255,255,255، والشفاف 0% | `https://example.com/t/EXAMPLESOS01/` | `b47d80046467653b` |
| `guest-guide-stand.png` | RGBA. مستطيل كامل: الزوايا alpha 255,255,255,255، والشفاف 0% | `https://example.com/t/EXAMPLEGUID1/` | `00725b50bf88af4e` |
| `restaurant-stand.png` | RGBA. مستطيل كامل: الزوايا alpha 255,255,255,255، والشفاف 0% | `https://example.com/t/EXAMPLE123/` | `699d232da2085e10` |

## وش تعني الأرقام
- **كل الخمس بنفس المقاس ونفس النسبة**: 756 × 1134 بكسل، يعني 2:3 بالضبط (0.6667). الأربع ستاندات ورقة 100 × 150، ولوحة الباب لوح 100 × 150.
- **المقاس الحقيقي**: الملف يقول 100.01 × 150.02mm (البكسل ÷ الدقة × 25.4). القطعة نفسها 100 × 150mm، والفرق 0.01 و0.02mm من تقريب البكسل (100mm في 2x = 755.9 بكسل، انقرب لـ 756).
- **المليمتر بالبكسل**: 7.56 بكسل لكل مليمتر في هالصور (756 ÷ 100). على الشاشة بالمقاس الحقيقي (96 CSS px لكل إنش): 378 × 567 CSS px تقريباً.
- **الدقة**: 2x = 192 dpi. داخل الملف 7559 بكسل لكل متر (القطعة تخزن رقم صحيح)، فتنقرا 191.999.
- **الشفافية**: لوحة الباب زواياها شفافة ومدوّرة (شكل الأكريليك). الستاندات ورقة مستطيلة كاملة بدون شفاف داخلها، والحامل يرسمه المشهد.
- **الباركود وهمي**: كل باركود يفتح `example.com` (نطاق محجوز للأمثلة). الحقيقي من نظام الروابط `/t/<code>/` لكل عميل.
- **الهوية**: «شقق المثال» و«مقهى المثال» شعارات وهمية (نفس هوية عرض الموقع `website/demo/_brands/`). بدون شعار لمسة تاب وبدون زعفران ولا تيل (GM-023 و GM-025): صفر بكسل من ألوان `brand/tokens.css` حقتنا في الخمس صور.

## للموقع (قواعد ui-ux-pro-max)
- `image-dimension`: حط `width="756" height="1134"` أو `aspect-ratio: 2 / 3` عشان ما تتحرك الصفحة وقت التحميل.
- `image-optimization`: الأداة تطلّع PNG بس. التحويل لـ WebP أو AVIF عند الموقع لو يبيه (غير مؤكد إذا يلزم). انتبه تبقى الشفافية في لوحة الباب.

## نفس الصورة في ملفات الطباعة
كل صورة هنا نفس ملف الطباعة 2x بالبايت (نفس SHA-256)، لأن `&render=1` ما يغيّر الرسم:
- `checkout-sign.png` = `print/host-signs/png/checkout@2x.png` (نفس البايت)
- `wifi-stand.png` = `print/host-signs/png/wifi-stand@2x.png` (نفس البايت)
- `emergency-stand.png` = `print/host-signs/png/emergency-stand@2x.png` (نفس البايت)
- `guest-guide-stand.png` = `print/host-signs/png/guest-guide-stand@2x.png` (نفس البايت)
- `restaurant-stand.png` = `print/stand/png/stand-review@2x.png` (نفس البايت)

## إعادة التصدير (من جذر المشروع)
```
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=checkout&render=1" --out print/renders --png 2x --transparent --file checkout-sign.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=wifi&render=1" --out print/renders --png 2x --transparent --file wifi-stand.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=emergency&render=1" --out print/renders --png 2x --transparent --file emergency-stand.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=guide&render=1" --out print/renders --png 2x --transparent --file guest-guide-stand.png --no-manifest
node print/export.cjs --url "print/stand/index.html?client=example-cafe&purpose=review&render=1" --out print/renders --png 2x --transparent --file restaurant-stand.png --no-manifest
```
بعدها أعد القياس (مو تنسخ الأرقام)، لأن أي تعديل في القالب ممكن يغيّر الصورة.
