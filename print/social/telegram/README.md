# print/social/telegram: صور قناة وحساب التليجرام

صور التليجرام حسب `marketing/telegram-plan.md` §5 و§6 (GM-047 وGM-051). مصمم الإعلانات، 2026-09-28، وبعدها مراجعة impeccable وجولة إصلاح فحص ما قبل الطباعة (نفس اليوم).
بهويتنا التسويقية: الشعار أبيض على تيل #0B7A75 (GM-042، `brand/logo/v1.0.0/USAGE.md`). ما فيه نشر (GM-006).
الملاحظات والمصادر كاملة في `work/2026-09-28-host-signs/ad-creative-telegram.md`.

## الصور (`png/`)
| الملف | وين تنستخدم | المقاس | القطعة |
|---|---|---|---|
| `telegram-avatar.png` | صورة القناة وصورة حساب التواصل | 1024×1024 | الملف الرسمي نفسه |
| `telegram-pinned.png` | صورة رسالة التثبيت | 1280×720 | بدون قطعة |
| `telegram-square.png` | نسخة مربعة من صورة التثبيت | 1080×1080 | بدون قطعة |
| `telegram-m1-menu.png` | منشور م1، المنيو (#مطاعم) | 1080×1080 | وجه المنيو في ستاند «مقهى المثال» |
| `telegram-m2-review.png` | منشور م2، تقييم قوقل (#مطاعم) | 1080×1080 | ستاند التقييم «مقهى المثال» |
| `telegram-m3-wifi.png` | منشور م3، الواي فاي (#مطاعم) | 1080×1080 | وجه الواي فاي في ستاند «مقهى المثال» |
| `telegram-m4-guide.png` | منشور م4، دليل الشقة (#مضيفين) | 1080×1080 | جوال الضيف على أول الدليل (الهوية والترحيب والواي فاي) |
| `telegram-m5-checkout.png` | منشور م5، التشيك أوت (#مضيفين) | 1080×1080 | ملصق الشريحة 45×45 «شقق المثال» |
| `telegram-m6-maintenance.png` | منشور م6، بلاغ الصيانة (#مضيفين) | 1080×1080 | جوال الضيف على زر «بلاغ صيانة»، وتحته التواصل وقسم التكييف |

- كلها PNG بدون شفافية (RGB)، والمقاس بالبكسل بالضبط. القياسات والفحص في `png/telegram.export.json`.
- صورة القناة هي الملف الرسمي `brand/logo/v1.0.0/social/avatar-white-on-teal-1024.png` نفسه، بكسل ببكسل.
- النص في الصور بدون أسعار (§6)، وكل سطر مقطع حرفي متصل من النص المعتمد. نقطة البيع كاملة في صورة التثبيت والمربعة.
- **العتاد في الصور هو العتاد المعتمد بس:** المطاعم ستاند بشعار المحل (`services/pricing.md` السطر 11)، والمضيفين ملصق الشريحة وشاشة الضيف (السطر 19: «شريحة الوحدة + ملصق الباركود»). لوحات GM-050 (ستاند دليل الوحدة ولوحة الباب) ما تطلع في الصور لين تدخل الباقة، لأن وعود منشورات المضيفين من خانة «تشمل» بس (الخطة سطر 77).

## قواعد المنشورات الست
- العنوان أول دايماً، وولا سطر صغير فوقه (kicker ممنوع). العنوان 70px وزن 600 بسطر 1.4، وتحته سطر الجواب 40px وزن 400 بسطر 1.55. Readex Pro بس، وتباعد الحروف 0.
- كسر الأسطر مكتوب في الصفحة (`<br>`) عند حد العبارة، مثل «ضيفك وصل الساعة 1 الليل / وما يدري وين المكيف / ولا كلمة الواي فاي؟». و`data-lines` عدد الأسطر المتوقع: لو سطر انكسر زيادة، الصفحة تطلع تنبيه.
- القطعة على محور اليمين، وتبدأ من 490. وفي م4 تنزل لـ 580، عشان النص أطول وسطر الجواب يبقى أقرب لعنوانه من الجوال.
- الشعار الصغير (ارتفاع 44) تحت يسار، والهامش 80 من كل حافة.

## الملفات
- `index.html`: الصور كلها، و`?img=<الاسم>` يعرض وحدة (avatar، pinned، square، m1-menu، m2-review، m3-wifi، m4-guide، m5-checkout، m6-maintenance). كل صورة `.p-sheet` باسم `data-sign="telegram-<الاسم>"`.
  - فيها فحص يطلّع تنبيه في هالحالات: نص برّا الهامش، أو قريب من القطعة (أقل من 48px)، أو نقطة البيع مو حرفية، أو سطر فوق العنوان، أو سطر انكسر زيادة، أو شاشة جوال بخط غير Readex Pro.
  - وفي الجوال: لو المقصود (`data-at`) مو كامل في الجزء الظاهر من الشاشة، أو شي مقصوص عند حافتها فوق (طرفه بس يبان)، أو فيه زر معبّى ثاني ينافسه (`data-none`).
- `src/`: القطع اللي داخل المنشورات، مصدّرة من القوالب نفسها بدون تعديل (شفافة):
  - `stand-menu.png` و`stand-wifi.png` (2x، 756×1134): وجه المنيو والواي فاي لـ «مقهى المثال»، من `src/stand.html`. هذا يشغّل `print/stand/stand.js` بملف عميل وهمي من `src/clients/`، لأن `print/stand/clients/` ملك مصمم الطباعة.
  - `stand-review.png` (2x، 756×1134): ستاند التقييم من `print/stand` (example-cafe).
  - `sticker-chip.png` (600dpi، 1063×1063): ملصق الشريحة on-metal 45×45 من `print/host-stickers` (example-flats)، بعرض 510 في م5. الدقة 600dpi عشان الصورة تتصغّر وما تتكبّر (1063 إلى 510).
  - `sign-guide.png` و`sign-checkout.png`: **مو مستخدمة الحين.** هذي قطع م4 وم5 القديمة (ستاند دليل الوحدة ولوحة الباب، عتاد GM-050). تنحذف بعد ما تعدّي الصور الجديدة فحص ما قبل الطباعة، أو ترجع لو دخل العتاد الباقة (أوامرها تحت).
- **شاشة الجوال (م4 وم6):** صفحة `website/demo/rental-guide/` الحقيقية داخل جوال مرسوم CSS.
  - م4 على هوية المضيف والترحيب والواي فاي (`data-at=".c-id"`).
  - م6 على زر «بلاغ صيانة» (`data-at="#fix"`، 28px من فوق الشاشة)، لأنه موضوع المنشور. زر «تم الخروج» المعبّى وفقرة الخصوصية فوقه برّا الشاشة، عشان ما ينافسونه (فحص ما قبل الطباعة، ui-ux-pro-max `primary-action`).
    - الفراغ بين الزرين 12px بس، فأعلى الشاشة (`.screen-top`، مكان شريط حالة الجوال) بلون خلفية الصفحة نفسها #FAF7F2، وينزل لين نص الفراغ (22px). كذا ما يبان طرف «تم الخروج» مقصوص فوق (`data-hide="#out"`).
    - الغطا برّا الـ iframe، والصفحة نفسها ما تتغير.
  - **خط الشاشة مثبت على Readex Pro وقت فتح الصفحة.** صفحة الزبون بخط الجهاز (`--lt-font-ui` في `brand/tokens.css`، وكلمة المرور `ui-monospace` في `website/assets/client.css`)، فكانت الصورة تطلع بخط جهاز التصدير: Segoe UI وConsolas على ويندوز.
  - Readex Pro هو الخط الوحيد المحفوظ في المشروع (`brand/fonts/`)، وخطوط الهوية بس (قاعدة الواجهات بند 8). الصفحة نفسها ما تغيّرت: التثبيت ستايل ينحط داخل الـ iframe وقت التصوير بس.
  - يعني الجوال في الصورة بخط الهوية، والضيف الحقيقي يشوف خط جواله. لو حسم مصمم الموقع خط ثابت لصفحات الزبون، تنعاد الصورتين بأمر وحد.

## الأوامر (من جذر المشروع)
لو تغيّر قالب، صدّر القطعة من جديد أول، وبعدها الصور:
```
node print/export.cjs --url "print/social/telegram/src/stand.html?client=cafe-menu&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-menu.png --no-manifest
node print/export.cjs --url "print/social/telegram/src/stand.html?client=cafe-wifi&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-wifi.png --no-manifest
node print/export.cjs --url "print/stand/index.html?client=example-cafe&purpose=review&render=1" --out print/social/telegram/src --png 2x --transparent --file stand-review.png --no-manifest
node print/export.cjs --url "print/host-stickers/index.html?client=example-flats&render=1" --out print/social/telegram/src --png 600dpi --media screen --transparent --only sheet-1 --file sticker-chip.png --no-manifest

node print/export.cjs --url "print/social/telegram/index.html" --out print/social/telegram/png --social --sign-names
```
- الأمر الأخير يطلع الصور التسع مع بعض (ثواني).
- ولو تبي صورة وحدة: `--url "print/social/telegram/index.html?img=m3-wifi" --out print/social/telegram/png --social --sign-names --name telegram-m3-wifi`. بـ `--name`، عشان ملف القياس حقها ما يمسح `telegram.export.json` حق الكل.
- بعد أي تصدير: شوف الصور بعينك، وتأكد إن ما فيه باركود مقروء فيها. الباركود الوهمي في الستاندات لازم يبقى تحت حافة الصورة (GM-049)، وملصق الشريحة ما فيه باركود أصلاً.
- أداة التصدير تفحص خط الصفحة الرئيسية بس، مو خط الـ iframe. خط شاشة الجوال يفحصه `index.html` نفسه (الخط المحسوب لكل عنصر فيه نص)، وفحصناه كمان على مستوى الحرف (تحت في الملاحظات).

القطع المحجوزة (عتاد GM-050، لو دخل الباقة):
```
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=guide&render=1" --out print/social/telegram/src --png 2x --transparent --file sign-guide.png --no-manifest
node print/export.cjs --url "print/host-signs/index.html?client=example-flats&sign=checkout&render=1" --out print/social/telegram/src --png 2x --transparent --file sign-checkout.png --no-manifest
```

## المقاسات ومصدرها
- **صورة القناة 1024×1024:** من الخطة §6 (الحد الرسمي غير مؤكد). التليجرام يحفظ نسختين 640×640 و160×160 (TDLib `chatPhotoInfo`: https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1chat_photo_info.html )، فـ 1024 أكبر من الكبيرة. العرض الدائري: **غير مؤكد** من مصدر رسمي (مشاهدة بس)، والرمز داخل الدائرة بهامش 18% من نصف القطر (قسته).
- **رسالة التثبيت 1280×720:** من الخطة §6 (غير مؤكد كمقاس رسمي). التليجرام يصغّر الصور لمربع 1280×1280 بالكثير (نوع `y`) أو 2560 (نوع `w`) حسب https://core.telegram.org/api/files ، فـ 1280 ما يتصغّر.
- **المربعة والمنشورات 1080×1080:** المربعة من الخطة §6. المنشورات اخترتها 1080×1080 لأن الخطة §2 تبي «نفس الصورة في السوشال»، و1080 أصغر من حد 1280 فما تتصغّر، وحدود الصورة المرسلة (10MB، والعرض + الارتفاع ≤ 10000، والنسبة ≤ 20) من https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1input_message_photo.html . طريقة عرض المنشور داخل القناة (القص والنسبة): **غير مؤكد**.
