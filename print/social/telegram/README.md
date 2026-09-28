# print/social/telegram: صور قناة وحساب التليجرام

صور التليجرام حسب `marketing/telegram-plan.md` §5 و§6 (GM-047 وGM-051). مصمم الإعلانات، 2026-09-28.
بهويتنا التسويقية: الشعار أبيض على تيل #0B7A75 (GM-042، `brand/logo/v1.0.0/USAGE.md`). ما فيه نشر (GM-006).
الملاحظات والمصادر كاملة في `work/2026-09-28-host-signs/ad-creative-telegram.md`.

## الصور (`png/`)
| الملف | وين تنستخدم | المقاس |
|---|---|---|
| `telegram-avatar.png` | صورة القناة وصورة حساب التواصل | 1024×1024 |
| `telegram-pinned.png` | صورة رسالة التثبيت | 1280×720 |
| `telegram-square.png` | نسخة مربعة من صورة التثبيت | 1080×1080 |
| `telegram-m1-menu.png` | منشور م1، المنيو (#مطاعم) | 1080×1080 |
| `telegram-m2-review.png` | منشور م2، تقييم قوقل (#مطاعم) | 1080×1080 |
| `telegram-m3-wifi.png` | منشور م3، الواي فاي (#مطاعم) | 1080×1080 |
| `telegram-m4-guide.png` | منشور م4، دليل الشقة (#مضيفين) | 1080×1080 |
| `telegram-m5-checkout.png` | منشور م5، التشيك أوت (#مضيفين) | 1080×1080 |
| `telegram-m6-maintenance.png` | منشور م6، بلاغ الصيانة (#مضيفين) | 1080×1080 |

- كلها PNG بدون شفافية (RGB)، والمقاس بالبكسل بالضبط. القياسات والفحص في `png/telegram.export.json`.
- صورة القناة هي الملف الرسمي `brand/logo/v1.0.0/social/avatar-white-on-teal-1024.png` نفسه، بكسل ببكسل.
- النص في الصور بدون أسعار (§6)، وكل سطر مقطع حرفي من النص المعتمد. نقطة البيع كاملة في صورة التثبيت والمربعة.

## الملفات
- `index.html`: الصور كلها، و`?img=<الاسم>` يعرض وحدة (avatar، pinned، square، m1-menu، m2-review، m3-wifi، m4-guide، m5-checkout، m6-maintenance). كل صورة `.p-sheet` باسم `data-sign="telegram-<الاسم>"`. فيها فحص يطلّع تنبيه لو نص طلع برّا الهامش، أو قرب من القطعة، أو نقطة البيع مو حرفية.
- `src/`: القطع اللي داخل المنشورات، مصدّرة من قوالب Task A نفسها بدون تعديل (2x، 756×1134، شفافة):
  - `stand-menu.png` و`stand-wifi.png`: وجه المنيو والواي فاي لـ «مقهى المثال»، من `src/stand.html` (يشغّل `print/stand/stand.js` بملف عميل وهمي من `src/clients/`، لأن `print/stand/clients/` ملك مصمم الطباعة).
  - `stand-review.png`: ستاند التقييم من `print/stand` (example-cafe).
  - `sign-guide.png` و`sign-checkout.png`: ستاند دليل الوحدة ولوحة الباب من `print/host-signs` (example-flats).
- منشور م6 ما له لوحة في Task A (البلاغ زر داخل دليل الوحدة): فيه صفحة `website/demo/rental-guide/` الحقيقية داخل جوال مرسوم CSS، مفتوحة على «الخروج والصيانة».

## الأوامر (من جذر المشروع)
لو تغيّر قالب Task A، صدّر القطع من جديد أول، وبعدها الصور:
```
node print/export.cjs --url "print/social/telegram/src/stand.html?client=cafe-menu&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-menu.png --no-manifest
node print/export.cjs --url "print/social/telegram/src/stand.html?client=cafe-wifi&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-wifi.png --no-manifest
node print/export.cjs --url "print/stand/index.html?client=example-cafe&purpose=review&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-review.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=guide&render=1" --out print/social/telegram/src --png 2x --transparent --file sign-guide.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=checkout&render=1" --out print/social/telegram/src --png 2x --transparent --file sign-checkout.png --no-manifest

node print/export.cjs --url "print/social/telegram/index.html" --out print/social/telegram/png --social --sign-names
```
الأمر الأخير يطلع الصور التسع مع بعض (ثواني). ولو تبي صورة وحدة: `--url "print/social/telegram/index.html?img=m3-wifi" --out print/social/telegram/png --social --sign-names --name telegram-m3-wifi` (بـ `--name` عشان ملف القياس حقها ما يمسح `telegram.export.json` حق الكل).
بعد أي تصدير: شوف الصور بعينك، وتأكد إن ما فيه باركود مقروء فيها (الباركود الوهمي في القطع لازم يبقى تحت حافة الصورة، GM-049).

## المقاسات ومصدرها
- **صورة القناة 1024×1024:** من الخطة §6 (الحد الرسمي غير مؤكد). التليجرام يحفظ نسختين 640×640 و160×160 (TDLib `chatPhotoInfo`: https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1chat_photo_info.html )، فـ 1024 أكبر من الكبيرة. العرض الدائري: **غير مؤكد** من مصدر رسمي (مشاهدة بس)، والرمز داخل الدائرة بهامش 18% من نصف القطر (قسته).
- **رسالة التثبيت 1280×720:** من الخطة §6 (غير مؤكد كمقاس رسمي). التليجرام يصغّر الصور لمربع 1280×1280 بالكثير (نوع `y`) أو 2560 (نوع `w`) حسب https://core.telegram.org/api/files ، فـ 1280 ما يتصغّر.
- **المربعة والمنشورات 1080×1080:** المربعة من الخطة §6. المنشورات اخترتها 1080×1080 لأن الخطة §2 تبي «نفس الصورة في السوشال»، و1080 أصغر من حد 1280 فما تتصغّر، وحدود الصورة المرسلة (10MB، والعرض + الارتفاع ≤ 10000، والنسبة ≤ 20) من https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1input_message_photo.html . طريقة عرض المنشور داخل القناة (القص والنسبة): **غير مؤكد**.
