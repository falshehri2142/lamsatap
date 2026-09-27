# SOURCE: copywriting

- المستودع: https://github.com/coreyhaines31/marketingskills
- المسار: `skills/copywriting`
- الـcommit المثبّت: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (تاريخ الـcommit 2026-09-04، تاريخ التنزيل 2026-09-27)
- الترخيص: MIT. تحققت من ملف LICENSE في جذر المستودع (Copyright (c) 2025 Corey Haines). المستودع شخصي لكنه مشهور جداً (حوالي 28 ألف نجمة حسب نتائج البحث، لم أتحقق من الرقم مباشرة) وترخيصه واضح.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: marketing (مدير الإعلانات، mkt-creator)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — ce18137ae31ab37f261078501431649865ab6b403054d97490754e82acb002d8 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/copywriting/SKILL.md
- `references/copy-frameworks.md` — d98818886525908bf17dd6412d0b72731b313d6eef3e1ab6b365828a3a342779 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/copywriting/references/copy-frameworks.md
- `references/natural-transitions.md` — 4ff23f8943af2f65b072f26f1c53ce55f19cc26d7be211c11cae8e34b43e859f — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/copywriting/references/natural-transitions.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للتسويق (mkt-creator) ولنصوص الموقع: الوضوح قبل الذكاء، الفوائد قبل الميزات، صيغ عناوين، هيكل صفحة الهبوط، أزرار CTA، واختبار «Now you can».
- قيد مهم: فيها أرقام بلا مصدر (مثل +81% تحويل، و−28% تكلفة استحواذ، ومضاعفة 3× لـSavvyCal). ممنوع ننقلها للعميل أو نستخدمها كحقائق. تذكر ملف `.agents/product-marketing.md` وهو مو موجود عندنا، ومهارات مرتبطة مو موجودة (copy-editing وcro وemails وpopups وab-testing). ملف `natural-transitions.md` عبارات انتقال إنجليزية وفايدته قليلة للنص العربي. أي نص يطلع منها لازم يمر على أنظمة الإعلان السعودية ومراجع الإعلانات والوعود المعتمدة.
- ما نزل: `evals/evals.json` (مو .md).
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
