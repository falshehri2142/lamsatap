# SOURCE: business-pulse

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `small-business/skills/business-pulse`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: general-manager (المدير العام)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 289ac6813b4b11211411a6a323a2baf448c24c662c833db545402b79f2dd8a06 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/SKILL.md
- `_shared/artifact-style.md` — fd691d1e07b7e77a0fae64f4ff2c628bb9b2f2aae21029b15215e038e58ed0f5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/artifact-style.md
- `_shared/connector-neutrality.md` — 9d533c0e0f54a20e9b3b650d293dc66f6f51d10bdb523dd700bb61ae34a35cb2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/connector-neutrality.md
- `_shared/currency-and-locale.md` — 8b1fb6326c1de987b2f118a0e3e559083708775eb4c17dd2eacc8d726dbd5dc8 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/currency-and-locale.md
- `reference/data_sources.md` — 90e9c102f120223d8d867ee35b717cc7ef0fe68691ac74fc7d2d87606c55ee32 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/reference/data_sources.md
- `reference/gotchas.md` — 088e54642799cba3c8e1f1c52ac5e905de1b0ba898ab15ace079dfe81ea4fcb1 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/reference/gotchas.md
- `reference/output_template.md` — ecdcd5c21b643003933220323450542af6e1b5f3d284aef55b5bb55f939e055c — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/reference/output_template.md
- `reference/thresholds.md` — 274483c293345181833821bdb2b1f92e9a2bdb65a667df66ae01d4411ee2f5af — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/reference/thresholds.md
- `reference/v2_sources.md` — c7f0cd624bd380fa945edb591fd8a166d3d1c2b9e6ba100c7150e6c3af25ed2d — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/business-pulse/reference/v2_sources.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمدير العام: لقطة يومية أو أسبوعية في صفحة وحدة (النقد، المبيعات، العملاء المحتملين، الالتزامات، التنبيهات، وأهم شي اليوم) بألوان أخضر وأصفر وأحمر وعتبات قابلة للتعديل، ومسار بدون أي موصل (المالك يعطي 4 أرقام).
- `_shared/`: نسخ من ملفات small-business المشتركة (المسار الأصلي `../../shared/`).
- ما نزل: `shared/quickbooks-report-traps.md` و`shared/connector-call-shapes.md` (خاصة بموصلات مو عندنا).
- تحفظ لازم يتعدل قبل النقل: المهارة تقول «لا تستأذن قبل سحب البيانات» وتذكر قراءة البريد وSlack مباشرة. عندنا القراءة من أنظمة المالك تكون بإذنه وحسب الموصلات المسموحة، والنشر في أي قناة يحتاج موافقة (المهارة نفسها تشترط موافقة قبل النشر في Slack).
- القيود: أغلب الموصلات أمريكية (QuickBooks وHubSpot وGusto وRamp وغيرها). العتبات افتراضية وتحتاج ضبط.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
