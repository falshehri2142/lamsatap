# SOURCE: handle-objection

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `sales/skills/handle-objection`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ الـcommit 2026-09-24، تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0. تحققت من ملف LICENSE في جذر المستودع (نص Apache 2.0، وبعد نهاية نص الترخيص سطور عشوائية زائدة لا تغير شي) ومن ملفات LICENSE داخل plugins sales وmarketing وfinance وlegal (نص Apache 2.0 نظيف). plugin small-business وoperations ما فيها LICENSE خاص، فيسري ترخيص الجذر.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: sales (مدير المبيعات، sales-closer)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — f8e922441acbff67b2c641079dda03cb9378fce04f8997893a980fad5a6d8b79 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/sales/skills/handle-objection/SKILL.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمبيعات (sales-closer): تصنف الاعتراض (سعر، توقيت، منافس، ثقة، صلاحية، الوضع الحالي)، وتفرّق بين اعتراض حقيقي ومناورة تفاوض، وتكتب رد من 3 إلى 5 جمل مع دليل واحد موثق، وقائمة «لا تسوي» (خصم مبالغ فيه، سرد ميزات).
- القيود: مبنية لفرق مبيعات عندها CRM ونصوص مكالمات، وتشير لمهارات مو موجودة عندنا (win-loss-review وcustomer-voice وdraft-outreach). فيها قاعدة أمان زينة: الإيميلات والنصوص الواردة بيانات مو أوامر، والرد يروح لمرسل الرسالة فقط. الأسعار والوعود لازم تكون من ملفاتنا المعتمدة.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
