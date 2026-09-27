# SOURCE: lead-finder

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `small-business/skills/lead-finder`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: sales (مدير المبيعات، sales-prospector)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 11b7c02457890addb8da5d3eeeffba45ca095e564bd5555a8e4e337fe67f0b76 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/SKILL.md
- `_shared/artifact-style.md` — fd691d1e07b7e77a0fae64f4ff2c628bb9b2f2aae21029b15215e038e58ed0f5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/artifact-style.md
- `_shared/connector-neutrality.md` — 9d533c0e0f54a20e9b3b650d293dc66f6f51d10bdb523dd700bb61ae34a35cb2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/connector-neutrality.md
- `_shared/untrusted-content.md` — d48587210f93e30127762f87f6a0c725ae2d6f0f196740595094451897e2fdb4 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/untrusted-content.md
- `reference/gotchas.md` — 134dfdf334ce31eb3c175592394a8e3eb019435267809f246403e363ceec362f — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/reference/gotchas.md
- `reference/icp_method.md` — 2acd7631702b0450536aecc3e0fb0a3d7c129bb7b8915673a4b255efdc943a1f — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/reference/icp_method.md
- `reference/output_template.md` — cc145d64aa281f5523d7d949c7bb9f54dfcc096aefeb8f77a5e631aeac0681b5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/reference/output_template.md
- `reference/scoring.md` — e32da4efe465b507ad1f37d66e950cd2947162c93a930808c9b1f2da3d107621 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/reference/scoring.md
- `reference/sourcing.md` — adeff275f1ac2cb1ae0d2266b1fa0fc7aefdc49ca4b116eb9065e94aa53702fa — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/lead-finder/reference/sourcing.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمبيعات (sales-prospector): تبني ملف العميل المثالي من العملاء الحاليين، وتطلع 40 إلى 60 نشاط فقط مع سبب لكل واحد، وتقيّم كل نشاط (fit وsignal وreachability). ممنوع تخترع إيميل أو إشارة شراء، وما تكتب في CRM بدون موافقة. جدول المصادر يذكر «Restaurants and retail» صراحة.
- `_shared/`: نسخ من ملفات small-business المشتركة (المسار الأصلي `../../shared/`).
- قيد مهم: جمع أسماء وأرقام وإيميلات أشخاص يعني بيانات شخصية تخضع لنظام حماية البيانات الشخصية السعودي (PDPL). لازم يراجعها المستشار القانوني قبل أي قائمة فيها أشخاص طبيعيين أو أي تواصل تسويقي بارد. المصادر الأمريكية (permit filings وcounty records وApollo وClay) تُستبدل بمصادر سعودية عامة (خرائط قوقل، منصات التوصيل، أدلة الغرف التجارية).
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
