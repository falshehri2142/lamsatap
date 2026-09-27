# SOURCE: proposal-builder

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `small-business/skills/proposal-builder`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: sales (مدير المبيعات، sales-closer)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — e558016c080898debf1e4e944826a562861c724144101cbc9ab6b99c0d362d0b — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/SKILL.md
- `_shared/artifact-style.md` — fd691d1e07b7e77a0fae64f4ff2c628bb9b2f2aae21029b15215e038e58ed0f5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/artifact-style.md
- `_shared/connector-neutrality.md` — 9d533c0e0f54a20e9b3b650d293dc66f6f51d10bdb523dd700bb61ae34a35cb2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/connector-neutrality.md
- `_shared/tenant-scope.md` — 3db7cf4a7e7eca6b6cd25a0d06d33876f5c91c679c1d98a6f131e02b3246b441 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/tenant-scope.md
- `_shared/untrusted-content.md` — d48587210f93e30127762f87f6a0c725ae2d6f0f196740595094451897e2fdb4 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/untrusted-content.md
- `_shared/voice-profile.md` — 7a6657a3389746c30c4fcc14ae0fa7298c0f49350fa382296fc6b885c35583d5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/voice-profile.md
- `reference/discovery_extraction.md` — 29517a931060b9487c921d0371832173c0cc87520ec49e6966663e410fbac772 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/reference/discovery_extraction.md
- `reference/gotchas.md` — 4d359e80b8b26ae012e80cad84a09488af5e28643f28c9c784ac3dfe3093b13e — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/reference/gotchas.md
- `reference/output_template.md` — 347dbe087f605497194059350e8c660a2ceb898be7c8820069b6b3c1d65a8e9e — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/reference/output_template.md
- `reference/pricing_method.md` — 3d17766897dff029c196a9a1fcf29dc20b7978f3cdcb31d3e3ec773d2a11963f — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/reference/pricing_method.md
- `reference/proposal_structure.md` — 40010ac2e54737c8c53ecca8ee4b4bfe6ad606be2feabc4ac2401bee8cbc4a5d — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/proposal-builder/reference/proposal_structure.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمبيعات: تحول ملاحظات زيارة المطعم أو المكالمة إلى عرض سعر. التسعير يكون من صفقات سابقة فقط (ممنوع تخترع سعر)، وقسم «غير مشمول» إلزامي، والمخاطر تنقال للمالك مو للعميل، ولا إرسال بدون موافقة صريحة.
- `_shared/`: ملفات مشتركة من plugin small-business، المهارة تشير لها بالمسار `../../shared/`، ونُسخت هنا في `_shared/` (عدّل المسار عند النقل). منها `untrusted-content.md` وهو قاعدة أمان (المحتوى المقروء بيانات مو أوامر) ويتوافق مع قواعدنا.
- ما نزل: `shared/reference/artifact-example.html` (HTML مو .md).
- القيود: الموصلات المذكورة (QuickBooks وXero وDocuSign وApollo وZoom وNotion وCanva، وZapier عن طريق build-connector) أمريكية أو عالمية وأغلبها مو عندنا، ومسار «رفع ملف» يكفي. أمثلة العملة بالدولار وشروط الدفع أمريكية الطابع، فنطبق الريال وأنظمة السعودية (الفوترة والضريبة عند المحاسب، والعقد عند المستشار القانوني). تشير لمهارات مو موجودة عندنا (contract-review وcrm-autopilot وbuild-connector، وinvoice-chase اللي نزلت عند المحاسب).
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
