# SOURCE: invoice-chase

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `small-business/skills/invoice-chase`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: accountant (المحاسب)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 538d4b6c0120f8279d1f8bafcd2be79f9836959c75ee52f3dff4a77e3a3c6b66 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/SKILL.md
- `_shared/artifact-style.md` — fd691d1e07b7e77a0fae64f4ff2c628bb9b2f2aae21029b15215e038e58ed0f5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/artifact-style.md
- `_shared/connector-neutrality.md` — 9d533c0e0f54a20e9b3b650d293dc66f6f51d10bdb523dd700bb61ae34a35cb2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/connector-neutrality.md
- `_shared/currency-and-locale.md` — 8b1fb6326c1de987b2f118a0e3e559083708775eb4c17dd2eacc8d726dbd5dc8 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/currency-and-locale.md
- `_shared/tenant-scope.md` — 3db7cf4a7e7eca6b6cd25a0d06d33876f5c91c679c1d98a6f131e02b3246b441 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/tenant-scope.md
- `_shared/untrusted-content.md` — d48587210f93e30127762f87f6a0c725ae2d6f0f196740595094451897e2fdb4 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/untrusted-content.md
- `_shared/voice-profile.md` — 7a6657a3389746c30c4fcc14ae0fa7298c0f49350fa382296fc6b885c35583d5 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/shared/voice-profile.md
- `reference/examples/firm-reminder.md` — 028ddbdbb2b3c73907b04761a4c00ca0e3fb00a0c0b48f994932f8c273400da2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/reference/examples/firm-reminder.md
- `reference/examples/gentle-reminder.md` — 41795df28acb8e5272cfe17438b1f62c8f5d738876322571bcb64fbbde85cfe2 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/reference/examples/gentle-reminder.md
- `reference/gotchas.md` — ec85aac5f34f0ac3688efe75e1c10e754314b8bf206f5748bf12d8f3b16ff53c — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/reference/gotchas.md
- `reference/tone-matching.md` — 8bae97b8aed0ec1813c1cd51f3b36cd8285ebf911643484aac0781fd3a23f566 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/reference/tone-matching.md
- `reference/v2_sources.md` — ea499f19abd14eb1b874440e0181e16af1e4042eb059ac487bc303a78c65f97d — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/small-business/skills/invoice-chase/reference/v2_sources.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمحاسب («مين ما دفع»): قائمة المتأخرين، وتصنيف كل عميل (ملتزم، يتأخر أحياناً، متأخر دائماً) ونبرة التذكير على حسبه، وتذكير واحد لكل عميل، واستبعاد اللي دفع خلال 14 يوم، ولا إرسال بدون موافقة. تشتغل بدون موصلات من ملف CSV.
- `_shared/`: نسخ من ملفات small-business المشتركة (المسار الأصلي `../../shared/`).
- ما نزل: `shared/connector-call-shapes.md` (تفاصيل موصلات Airwallex وGusto وQuickBooks وما تخصنا).
- القيود: الموصلات (PayPal وStripe وAirwallex وQuickBooks وغيرها) مو عندنا، فنستخدم مسار CSV. قوالب الإيميل إنجليزية، والرسائل عندنا بالعربي وعبر القناة المعتمدة. أي غرامة تأخير أو شرط دفع يرجع للعقد وللمستشار القانوني.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
