# عدّاد اللمسات (تصميم، لم يُبنَ)

آخر تحديث: 2026-09-27 (sys-architect). القاعدة: نعد (الكود، اليوم، المصدر nfc/qr/غير معروف) فقط. لا IP، لا جهاز، لا كوكيز، لا موقع.

## المشكلة
على Cloudflare Pages قاعدة 302 في `_redirects` تُنفذ حتى لو فيه ملف HTML ([المصدر](https://developers.cloudflare.com/pages/configuration/redirects/)، مذكور في `systems/architecture.md`). يعني الزائر ما يحمّل صفحة HTML، فأي سكربت تحليلات في الصفحة ما يشتغل.

## الخيارات
| الخيار | الدقة | الخصوصية | التكلفة | يتطلب |
|---|---|---|---|---|
| 1. تحليلات Pages المدمجة (Web Analytics تنضاف كسكربت في الصفحات) | غالباً ما تعد لمسات `/t/` أبداً: 302 ما يحمّل صفحة فالسكربت ما يشتغل (استنتاج، غير مؤكد) | يشوفها المزود فقط، ما نخزن شي | مجاني مع الخطة (تفاصيل غير مؤكدة) | لا شي |
| 2. Cloudflare Web Analytics (سكربت JS) | ما يعد مع 302؛ يحتاج نشيل `/t/` من `_redirects` ونمر بصفحة HTML (تأخير بسيط). يعتمد على JS؛ مانعات الإعلانات تقلل العد (غير مؤكد) | «does not collect or use your visitors' personal data» ([المصدر](https://developers.cloudflare.com/web-analytics/about/)) | مجاني ([نفس المصدر](https://developers.cloudflare.com/web-analytics/about/)) | حساب Cloudflare + سكربت + تعديل build.js |
| 3. Pages Function على `/t/*` + قاعدة D1 | دقيق: كل طلب يوصل الخادم ينعد (حتى بدون JS) | احنا نختار وش نخزن: (code, day, src) فقط | مجاني ضمن: 100,000 طلب Function/Worker باليوم ([المصدر](https://developers.cloudflare.com/pages/functions/pricing/))، D1 100,000 صف مكتوب/يوم و5 GB ([المصدر](https://developers.cloudflare.com/d1/platform/pricing/)). الملفات الثابتة مجانية وبلا حد ([المصدر](https://developers.cloudflare.com/pages/functions/pricing/)) | كود Function + قاعدة D1 يربطها صاحب المشروع |
| 4. Worker + KV | دقيق | نفس 3 | KV مجاني 1,000 كتابة/يوم فقط ([المصدر](https://developers.cloudflare.com/workers/platform/pricing/)): ما يكفي، لكل لمسة كتابة | — |
| 5. سجل خادم | — | السجل فيه IP عادة | استضافة ثابتة ما تعطينا سجل خام (غير مؤكد لـ Pages) | خادم خاص: مرفوض الحين |

## التوصية: الخيار 3 (Pages Function + D1)
السبب: الوحيد الدقيق بدون IP، مجاني لحجمنا، وعلى نفس الاستضافة.

**كيف يشتغل:** «Redirects defined in the `_redirects` file are not applied to requests served by Pages Functions, even if the Function route matches the URL pattern» ([المصدر](https://developers.cloudflare.com/pages/configuration/redirects/)). يعني الـ Function على `/t/*` هي اللي تسوي التحويل 302 بنفسها (من خريطة JSON يولدها build.js)، وقواعد `/t/` في `_redirects` تصير بلا أثر لهالمسارات.

**تجاوز الحد اليومي:** نختار **Fail open** في إعدادات المشروع: «"Fail open" means that static assets will continue to be served, even if Pages Functions would ordinarily have run first» ([المصدر](https://developers.cloudflare.com/pages/functions/routing/)). وقتها تُخدم صفحات HTML الموجودة (meta refresh) فالشريحة ما توقف، بس اللمسات ما تنعد. الإعداد يسويه صاحب المشروع.
- العد داخل `waitUntil` وأي خطأ في D1 يتجاهل؛ التحويل ما يعتمد على العداد.
- البداية يوم الإطلاق بدون عداد، والخيار 3 بعد موافقة صاحب المشروع وفحص sys-tester على pages.dev.

**D1 والفهارس:** «Indexes will add an additional written row when writes include the indexed column» ([المصدر](https://developers.cloudflare.com/d1/platform/pricing/)). المفتاح الأساسي يكفي بدون فهارس زيادة، وكل لمسة = صف مكتوب واحد تقريباً (العدد الدقيق مع upsert غير مؤكد). 100,000 صف/يوم تكفي أكثر من 50,000 لمسة/يوم حتى لو صارت صفين.

**سؤال لـ loyer (قبل البناء):** عد لمسات شريحة على باب شقة (باقة المضيف) باليوم ممكن يكشف متى الشقة مشغولة. هل يُعتبر بيانات حساسة؟ اقتراح بديل: لهالنوع نعد بالشهر بس.

## التصميم المحلي
**الجدول (D1):**
```
taps(code TEXT, day TEXT /* YYYY-MM-DD بتوقيت الرياض */, src TEXT /* nfc|qr|other */, n INTEGER,
     PRIMARY KEY(code, day, src))
```
كل لمسة: `INSERT ... ON CONFLICT DO UPDATE SET n = n + 1`. ما في صف لكل زائر، فما في شي شخصي أصلاً. لا وقت دقيق (يوم فقط) عشان ما ينربط بشخص.

**تمييز المصدر:** الشريحة تتبرمج بـ `https://<domain>/t/<code>/?src=nfc` والباركود بـ `?src=qr`. أي قيمة ثانية = `other`، وبدون `src` = `other`. (تغيير الرابط المبرمج قرار مع قسم مهندس NFC؛ الشرائح المبرمجة سابقاً بدون `src` تنعد `other`.) تمرير `src` للوجهة مع 302 غير مؤكد (فحص في الـ runbook خطوة 11).

**التقرير الشهري لكل عميل** (سكربت محلي يقرأ تصدير D1 مع `links.json`):
```
عميل: demo-restaurant — شهر 2026-10
| الكود  | المكان   | NFC | QR | غير معروف | المجموع |
|--------|----------|-----|----|-----------|---------|
| demo01 | طاولة 4  | 120 | 45 | 3         | 168     |
| demo02 | الكاشير  | 80  | 60 | 0         | 140     |
المجموع: 308. الأرقام تقريبية: البوتات ومعاينات الروابط (واتساب مثلاً) ممكن تنعد.
```
(الأرقام أعلاه مثال للشكل فقط.)

**ما لم يُتأكد منه:** تفصيل التحليلات المدمجة لكل مسار، تمرير query مع 302، وهل Cloudflare يحفظ IP في سجلاته هو (عند loyer لسياسة الخصوصية).
