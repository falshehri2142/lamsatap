# web-qa — فحص صفحة عرض ستاند التقييم

الأداة: `node ~/.claude/tools/ui-probe.cjs --serve website/demo/review <page> --widths 1440,390 [--dark]` (متصفح بدون واجهة).
الصور: `C:\Users\TECHTR~1\AppData\Local\Temp\claude\qa-review-demo\` (index-light, index-dark, sheet-light, sheet-dark؛ كل مجلد فيه probe-1440/probe-390 و probe.json).

## النتيجة العامة: PASS مع خلل واحد لازم يُصلح (خط الزر)

| الفحص | index.html | qr-sheet.html |
|---|---|---|
| 390 / 1440 فاتح وداكن | PASS | PASS |
| أخطاء كونسول | PASS: الخطأ الوحيد 404 لـ `/favicon.ico` من سيرفر الفحص (مو من الصفحة) | نفسه |
| تمرير أفقي | PASS: horizontalScroll=false، overflowX=0 في الأربع حالات | نفسه |
| التباين | PASS: lowContrast=0 | PASS |
| نص صغير / أهداف لمس صغيرة | PASS: tinyText=0، smallTargets=0 | PASS |
| الحجم | PASS: index 2,897 + config 307 بايت (أقل بكثير من 100KB) | 2,113 بايت + مكتبة jsdelivr |
| الباركود ينقرأ | — | PASS: jsQR فك الصورة في الحالات الأربع ورجع `https://example.com/demo/review/` = نفس `window.DEMO_URL` في config.js |
| نصوص ممنوعة (أسعار/أرقام/خصم/هدية/«راضي؟») | PASS: grep ما لقى شي | PASS |

## الخلل: FAIL بسيط — نص الزر صغير وعادي
`index.html` سطر 19: `font:700 20px/1 inherit;` قيمة غير صالحة (`inherit` ما يصلح داخل الاختصار `font`)، فالمتصفح يتجاهل السطر كله ويطلع نص «قيّمنا على قوقل» بحجم الزر الافتراضي (~13px) وبدون عريض.
الدليل: `index-light\probe-1440.png` و `index-dark\probe-390-dark.png`؛ النص واضح أصغر من العنوان الفرعي.
الحل المقترح لـ web-builder: `font-weight:700;font-size:20px;line-height:1.2;` بدل السطر.

## ملاحظات
- الورقة تحتاج إنترنت لمكتبة qrcode-generator (مذكور في web-builder.md) — مقبول للطباعة.
- في 390 داكن للورقة: الورقة بيضاء (مقصود للطباعة) والباركود ينقرأ.

## غير مؤكد
- ما ضغطت الزر آلياً للتأكد إن ملاحظة «في النسخة الحقيقية...» تظهر.
- القراءة بكاميرا جوال حقيقية من ورقة مطبوعة: ما جربتها (الفك كان من لقطة الشاشة).
- web-ux.md ما قرأته/قارنته بالنصوص.

---
# الجولة الثانية (بعد تعديل الخط ونصوص web-ux) — PASS

الصور: `C:\Users\TECHTR~1\AppData\Local\Temp\claude\qa-review-demo\r2\` (index، index-dark، qr-sheet، qr-sheet-dark، click-390/1440 فاتح وداكن).

| الفحص | النتيجة |
|---|---|
| خط الزر (سطر 19) | PASS: المحسوب فعلاً `font-size:20px`، `font-weight:700` في الحالات الأربع |
| ضغط الزر | PASS (puppeteer-core + Edge): `#note` مخفي قبل الضغط، وبعده ظاهر (ارتفاعه > 0) وعليه التركيز، وبدون أخطاء JS. الصورة `r2\click-390-dark.png` تبين الملاحظة «هذا عرض تجريبي. في النسخة الحقيقية يفتح هذا الزر صفحة تقييم محلك في قوقل مباشرة.» |
| 390/1440 فاتح وداكن للصفحتين | PASS: horizontalScroll=false، overflowX=0، lowContrast=0، tinyText=0؛ والخطأ الوحيد 404 favicon من سيرفر الفحص |
| تمرير أفقي بعد ظهور الملاحظة | PASS: scrollWidth = عرض الشاشة (390/1440) وما فيه عنصر طالع برا الشاشة. أول لقطة fullPage طلعت مزاحة وهذا خلل في طريقة التصوير؛ لقطة الشاشة العادية سليمة |
| الباركود | PASS: jsQR فك الصور الأربع ورجع `https://example.com/demo/review/` = config.js |
| نصوص ممنوعة | PASS: ما فيه أسعار/خصم/هدية/«راضي؟» (grep) |

## غير مؤكد
- ما جربت القراءة بكاميرا جوال من ورقة مطبوعة.
