# SOURCE: pricing

- المستودع: https://github.com/coreyhaines31/marketingskills
- المسار: `skills/pricing`
- الـcommit المثبّت: `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` (تاريخ الـcommit 2026-09-04، تاريخ التنزيل 2026-09-27)
- الترخيص: MIT. تحققت من ملف LICENSE في جذر المستودع (Copyright (c) 2025 Corey Haines). المستودع شخصي لكنه مشهور جداً (حوالي 28 ألف نجمة حسب نتائج البحث، لم أتحقق من الرقم مباشرة) وترخيصه واضح.
- طريقة التنزيل: git clone جزئي (blobless + sparse-checkout لملفات .md فقط) إلى مجلد مؤقت، قراءة كل ملف كامل، ثم نسخ البايتات الأصلية من git (بدون تحويل نهايات الأسطر).
- القسم المقترح: financial-analysis (fin-pricing) مع sales
- الباحث: 3 من 3 (مهارات البزنس)

## الملفات (sha256)
- `SKILL.md` — 6cb88c2e944331c12f2fb83341ff16aba85a34629df11f4cffc7f611e4df6868 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/SKILL.md
- `references/pricing-models.md` — 2cdb900b74f56a796c0331725e73eff4ecd84f8021b42efbb0a5b4903d1d9b16 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/references/pricing-models.md
- `references/pricing-page-teardown.md` — 850b018a6b224bc9bd4149edb3f1cbae41991ba6ef1d9efb616dba9328790c4b — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/references/pricing-page-teardown.md
- `references/research-methods.md` — b6aab09860dbab2f11d69cc9c179cc7f6e1a100ede28e5c49b59070a2caaeb15 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/references/research-methods.md
- `references/tier-structure.md` — b59910d37cceb74484f28b065963daa60f5c4fb1ffc36a0584d0f3cad11f3e30 — https://raw.githubusercontent.com/coreyhaines31/marketingskills/5b2c0007766c6a1cf1d53fd8fc73e979e0821022/skills/pricing/references/tier-structure.md

## ملاحظات الفحص
- قُرئ كل ملف كامل قبل الحفظ. ما نزل إلا ملفات .md. لا سكربت ولا ملف تنفيذي ولا binary.
- فحص نصي (grep) عن: تجاوز التعليمات، مفاتيح/كلمات مرور/توكن، webhook، curl/wget، روابط خارجية، سكربتات .py/.js/.sh. ما فيه نص يطلب تجاوز قواعد أو إرسال بيانات لجهة خارجية أو طلب مفاتيح.
- لا أحرف مخفية (zero-width أو bidi) ولا تعليقات HTML (فحص perl). كل sha256 أعلاه مطابق لبايتات الـcommit المثبّت.
- الفايدة للمحلل المالي (fin-pricing) والمبيعات: باقات Good/Better/Best، ومقياس القيمة، والاشتراك الشهري والسنوي وخصم السنوي، وطريقتي Van Westendorp وMaxDiff لقياس الاستعداد للدفع، ومتى وكيف نرفع السعر، وتدقيق صفحة الأسعار.
- ما نزل: `evals/evals.json` (مو .md).
- قيد مهم: مكتوبة لبرمجيات SaaS وبالدولار. قاعدة $10/$100/$1,000، ونسب مثل «خصم سنوي 17 إلى 20%» و«اللي يطلب خصم يلغي بمعدل الضعف»، كلها بلا مصدر موثق، فتُعامل كفرضيات تنختبر مو حقائق. الأسعار عندنا بالريال، وتشمل الضريبة أو لا حسب حالة التسجيل في هيئة الزكاة والضريبة والجمارك، وأي سعر يعتمده المالك قبل النشر. تشير لمهارات مو موجودة (paywalls وoffers وschema وai-seo وcro وغيرها) ولملف `.agents/product-marketing.md`.
- الحالة: في الحجر. ممنوع نقلها إلى `.claude/skills/` إلا بعد مراجعة المدير العام.
