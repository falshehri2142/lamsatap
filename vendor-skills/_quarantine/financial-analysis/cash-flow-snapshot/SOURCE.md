# SOURCE: cash-flow-snapshot

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `small-business/skills/cash-flow-snapshot`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: financial-analysis (المحلل المالي)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 1e5584378c5817981899bfa81296d8a9c2a7e4381a2f1deed616194e51944fff — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/cash-flow-snapshot/SKILL.md
- `_shared/artifact-style.md` — fd691d1e07b7e77a0fae64f4ff2c628bb9b2f2aae21029b15215e038e58ed0f5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/artifact-style.md
- `_shared/connector-neutrality.md` — 9d533c0e0f54a20e9b3b650d293dc66f6f51d10bdb523dd700bb61ae34a35cb2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/connector-neutrality.md
- `_shared/currency-and-locale.md` — 8b1fb6326c1de987b2f118a0e3e559083708775eb4c17dd2eacc8d726dbd5dc8 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/currency-and-locale.md
- `reference/examples/worked-example.md` — 30afc3df4f2c3fb646fcd266879e8a8f1149c24dc4b784ce5b6de2dbf63c6a97 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/cash-flow-snapshot/reference/examples/worked-example.md
- `reference/gotchas.md` — 80ddfd841077d33853e4143287dee23b9a7c8d17c43d2d0286a91a5ba67199b4 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/cash-flow-snapshot/reference/gotchas.md
- `reference/v2_sources.md` — 4d9139527fa81123731334eff18f00670e4d7a820731242c8ed228ee60d1a72f — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/cash-flow-snapshot/reference/v2_sources.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمحلل المالي (fin-modeler وfin-risk): توقع نقدي لـ30 و60 و90 يوم مع نطاق ثقة محسوب من تأخر الدفع الفعلي. الرصيد الافتتاحي لازم يكون من مصدر (ممنوع نفترضه)، والتحذيرات تكون بالاسم والمبلغ. تشتغل من CSV.
- `_shared/`: نسخ من ملفات small-business المشتركة (المسار الأصلي `../../shared/`).
- ما نزل: `shared/quickbooks-report-traps.md` (خاص بـQuickBooks وهو مو عندنا). المهارة تعتمد على مهارة xlsx الموجودة أصلاً في الجهاز.
- القيود: الموصلات أمريكية أو عالمية (Ramp وGusto وShopify وغيرها)، والأمثلة بالدولار. ما تغطي الرواتب والتأمينات (GOSI) والضريبة والزكاة في السعودية، وهذي ترجع للمحاسب. تنبيه المهارة إنها «مو بديل عن استشارة محاسبية» يبقى.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
