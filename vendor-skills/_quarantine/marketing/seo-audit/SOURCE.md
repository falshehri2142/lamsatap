# SOURCE: seo-audit

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `marketing/skills/seo-audit`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: marketing (مدير الإعلانات)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `CONNECTORS.md` — e85d04dde99b220ba438cf1345212e7414da536fb7d781d83a4ad57270586630 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/marketing/CONNECTORS.md
- `SKILL.md` — 25008ccdda6f4d9b7ba05f11120d0b9cc976c2d0b04f3d86605e63b1a54a8c40 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/marketing/skills/seo-audit/SKILL.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للتسويق: تدقيق SEO (كلمات مفتاحية، فحص الصفحة، فجوات المحتوى، فحص تقني، مقارنة منافسين) مع خطة «مكاسب سريعة» و«استثمار طويل».
- `CONNECTORS.md`: ملف الموصلات لـplugin marketing (المهارة تشير له بـ `../../CONNECTORS.md`)، ونُسخ هنا.
- تكرار: باحث ثاني نزّل نفس المهارة في `website-design/seo-audit` (نفس المستودع). المدير العام يختار مكان واحد أو يخليها للقسمين.
- القيود: الأمثلة إنجليزية. للسوق السعودي نحتاج كلمات مفتاحية عربية ولهجات البحث المحلية، وملف النشاط في خرائط قوقل أهم للمطاعم من المدونات. أرقام مثل طول العنوان 50 إلى 60 حرف معايير إنجليزية عامة.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
