# SOURCE: referrals

- المستودع: https://github.com/coreyhaines31/marketingskills
- المسار: `skills/referrals`
- الـcommit المثبّت: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (تاريخ الـcommit 2026-09-04، تاريخ التنزيل 2026-09-27)
- الترخيص: MIT. تحققت من ملف LICENSE في جذر المستودع (Copyright (c) 2025 Corey Haines). المستودع شخصي لكنه مشهور جداً (حوالي 28 ألف نجمة حسب نتائج البحث، لم أتحقق من الرقم مباشرة) وترخيصه واضح.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: marketing (مع sales)
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 103bd339d6d7796fae1128487c1560f38feecd94898d0d7c44ca0383f4c809d9 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/referrals/SKILL.md
- `references/affiliate-programs.md` — 3479ba24987c24654191f02bbf57fa5ff89eecde8e93cf22c65538bed2c356b4 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/referrals/references/affiliate-programs.md
- `references/program-examples.md` — 2baad60cdb251414ea559bd4dcf23d6c394ff66e593ae9392453f2e24f585c8a — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/referrals/references/program-examples.md
- `references/viral-mechanisms.md` — 04224240fae94bcf9bc64c7d8cac507bdd570049144e4df33946ac4ae8a483e4 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/referrals/references/viral-mechanisms.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للتسويق والمبيعات: تصميم برنامج إحالة (مطعم يجيب مطعم): مكافأة للطرفين، حساب أقصى مكافأة من قيمة العميل (LTV) والهامش، مؤشرات مثل K-factor ومعدل الإحالة، ومنع الاحتيال.
- ما نزل: روابط `../../tools/REGISTRY.md` و`tools/integrations/*.md` (أدلة أدوات خارجية مثل Rewardful وPartnerStack). ومجلد `tools/clis/*.js` في المستودع سكربتات ما نزلت، والمهارة ما تحتاجها. و`evals/evals.json` (مو .md).
- القيود: الأمثلة والمبالغ بالدولار ومن شركات أمريكية، ونسب «Typical findings» بلا مصدر. بصمة الجهاز (device fingerprinting) كوسيلة لمنع الاحتيال تمس بيانات شخصية، فتمر على المستشار القانوني (PDPL). أي عمولة أو مكافأة نقدية تتنسق مع المحاسب.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
