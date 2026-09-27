# الباحث 3 من 3: مهارات البزنس

التاريخ: 2026-09-27. الأقسام: sales، marketing، accountant، financial-analysis، legal-advisor، general-manager.
كل اللي نزل موجود في `vendor-skills/_quarantine/<القسم>/<المهارة>/` ومعه `SOURCE.md`، وفيه الرابط والـcommit والترخيص وsha256 لكل ملف وملاحظات الفحص.
ما كتبت شي في `.claude/skills/`.

## المصادر
| المستودع | من هو | الترخيص (من ملف LICENSE) | الـcommit |
|---|---|---|---|
| github.com/anthropics/knowledge-work-plugins | Anthropic (رسمي) | Apache-2.0. ملف الجذر فيه سطور زائدة بعد نهاية نص الترخيص. ملفات sales وmarketing وfinance وlegal نظيفة. small-business وoperations يسري عليها ملف الجذر | `da38ec1ee89d41e5380e652a97382695003396e7` |
| github.com/coreyhaines31/marketingskills | شخصي ومشهور (حوالي 28 ألف نجمة حسب نتائج البحث) | MIT (Copyright 2025 Corey Haines) | `5b2c0007766c6a1cf1d53fd8fc73e979e0821022` |

طريقة التنزيل: `git clone` جزئي (blobless + sparse-checkout لملفات `.md` فقط). ما نزل أي سكربت. قريت كل ملف كامل، ونسخت البايتات الأصلية. تأكدت إن sha256 لكل ملف (64 ملف) يطابق الـcommit، وما لقيت أحرف مخفية ولا تعليقات HTML.
عمليات الشبكة: حوالي 12 من 25 (بحثين، استنساخين، وجلب الملفات).

## الجدول
| المهارة | القسم | المصدر | الترخيص | نزلت؟ | سبب القبول أو الرفض |
|---|---|---|---|---|---|
| proposal-builder | sales | anthropics/knowledge-work-plugins `small-business/skills/proposal-builder` | Apache-2.0 | نعم (+ `_shared/` خمسة ملفات) | تحوّل ملاحظات الزيارة إلى عرض سعر مسعّر من صفقات سابقة، وفيها قسم «غير مشمول»، ولا ترسل بدون موافقة. القيد: موصلاتها وأمثلتها أمريكية، والشروط والفوترة ترجع للمحاسب والمستشار |
| lead-finder | sales | نفس المستودع `small-business/skills/lead-finder` | Apache-2.0 | نعم (+ `_shared/` ثلاثة ملفات) | تطلع قائمة من 40 إلى 60 عميل محتمل مع سبب لكل واحد، وجدول المصادر يذكر المطاعم، وتمنع اختراع الإيميلات. القيد: بيانات الأشخاص تخضع لنظام حماية البيانات الشخصية (PDPL) ولازم يراجعها المستشار القانوني |
| handle-objection | sales | نفس المستودع `sales/skills/handle-objection` | Apache-2.0 | نعم | تصنّف الاعتراض وتكتب رد مختصر مع دليل. القيد: مبنية لفرق عندها CRM |
| seo-audit | marketing | نفس المستودع `marketing/skills/seo-audit` | Apache-2.0 | نعم (+ `CONNECTORS.md`) | تدقيق SEO مع خطة «مكاسب سريعة». تكرار: باحث ثاني حطها في `website-design/seo-audit`. القيد: نحتاج كلمات بحث عربية وملف خرائط قوقل |
| copywriting | marketing | coreyhaines31/marketingskills `skills/copywriting` | MIT | نعم | قواعد كتابة النصوص الإعلانية وهيكل صفحة الهبوط. القيد: فيها أرقام بلا مصدر (+81% وغيرها) وممنوع نستخدمها كحقائق، وأي نص يمر على مراجع الإعلانات |
| referrals | marketing (مع sales) | coreyhaines31/marketingskills `skills/referrals` | MIT | نعم | برنامج إحالة (مطعم يجيب مطعم) وحساب المكافأة. أدلة الأدوات الخارجية ما نزلت. القيد: بصمة الجهاز تمس PDPL، والمبالغ بالدولار |
| invoice-chase | accountant | anthropics `small-business/skills/invoice-chase` | Apache-2.0 | نعم (+ `_shared/` ستة ملفات) | تجاوب على «مين ما دفع»: تذكير بنبرة تناسب العميل، ولا إرسال بدون موافقة، وتشتغل من CSV. القيد: الموصلات مو عندنا والقوالب إنجليزية |
| cash-flow-snapshot | financial-analysis | anthropics `small-business/skills/cash-flow-snapshot` | Apache-2.0 | نعم (+ `_shared/` ثلاثة ملفات) | توقع نقدي لـ30 و60 و90 يوم مع نطاق ثقة، والرصيد الافتتاحي لازم يكون من مصدر. القيد: ما تغطي GOSI والزكاة والضريبة |
| pricing | financial-analysis (fin-pricing) مع sales | coreyhaines31/marketingskills `skills/pricing` | MIT | نعم | باقات واشتراكات شهرية وسنوية، وبحث الاستعداد للدفع، ورفع الأسعار. القيد: مكتوبة لـSaaS بالدولار، والنسب فرضيات بلا مصدر |
| business-pulse | general-manager | anthropics `small-business/skills/business-pulse` | Apache-2.0 | نعم (+ `_shared/` ثلاثة ملفات) | لقطة للشركة في صفحة وحدة مع أهم شي اليوم، وتشتغل بأربعة أرقام من المالك. تحفظ: تقول «لا تستأذن قبل قراءة البريد»، ولازم يتعدل قبل النقل |
| risk-assessment | general-manager | anthropics `operations/skills/risk-assessment` | Apache-2.0 (ملف الجذر) | نعم | سجل مخاطر ومصفوفة احتمال × أثر، قصيرة وعامة |
| campaign-plan | marketing | anthropics `marketing/skills/campaign-plan` | Apache-2.0 | موجودة (نزّلها باحث ثاني) | قريتها كاملة ومقبولة. الباحث الثاني حطها قبلي بنفس البايتات، فما كررتها |
| journal-entry-prep | accountant | anthropics `finance/skills/journal-entry-prep` | Apache-2.0 | موجودة (باحث ثاني) | مقبولة. القيد: US GAAP (ASC 606) ومصطلحات رواتب أمريكية (FICA و401k)، ونطبق المعايير المعتمدة في السعودية |
| reconciliation | accountant | anthropics `finance/skills/reconciliation` | Apache-2.0 | موجودة (باحث ثاني) | مقبولة، ومنهج المطابقة البنكية عام. العتبات بالدولار أمثلة فقط |
| variance-analysis | financial-analysis | anthropics `finance/skills/variance-analysis` | Apache-2.0 | موجودة (باحث ثاني) | مقبولة، ومنهج تحليل الفروقات والشلال عام |
| review-contract | legal-advisor | anthropics `legal/skills/review-contract` | Apache-2.0 | موجودة (باحث ثاني) | مقبولة كمنهج مراجعة عقد فقط (بند بند وأخضر/أصفر/أحمر مع صياغة بديلة). **قيد: أمثلتها GDPR وأمريكية (jury waiver وclass action) وما تنطبق على السعودية**، والمرجع نظام المعاملات المدنية وPDPL وسكيل legal-advisor |
| legal-risk-assessment | legal-advisor | anthropics `legal/skills/legal-risk-assessment` | Apache-2.0 | موجودة (باحث ثاني) | مقبولة، وإطار الشدة × الاحتمال عام. **قيد: قائمة «متى تستعين بمحامٍ خارجي» فيها أمور أمريكية (securities وFCPA)** |
| content-strategy | marketing | anthropics `small-business/skills/content-strategy` | Apache-2.0 | لا | قريتها كاملة. تعتمد على بيانات مبيعات من QuickBooks وPayPal، وفيها خطوة تكتب في ملف QuickBooks، وموجهة للتجزئة. فايدتها قليلة لنا الحين |
| shared/quickbooks-report-traps و shared/connector-call-shapes | (مشتركة) | anthropics `small-business/shared/` | Apache-2.0 | لا | قريتها كاملة. خاصة بموصلات (QuickBooks وGusto وAirwallex) مو عندنا. بعض المهارات تشير لها، وهذا مكتوب في SOURCE.md حقها |
| tax-prep و tax-season-organizer | accountant | anthropics small-business | Apache-2.0 | لا | ما فتحتها. مرفوضة من وصف الـplugin نفسه (`currency-and-locale.md`): مبنية للضريبة الفيدرالية الأمريكية (1099 والتقديرات الربعية)، وما تنطبق على الزكاة والضريبة السعودية |
| payroll-prep و plan-payroll | accountant | anthropics small-business | Apache-2.0 | لا | ما فتحتها. رواتب أمريكية عن طريق Gusto |
| month-end-prep و close-month | accountant | anthropics small-business | Apache-2.0 | لا | ما فتحتها. مربوطة بتسوية QuickBooks وXero وZoho، وتتداخل مع reconciliation وjournal-entry-prep |
| triage-nda و compliance-check و vendor-check و signature-request | legal-advisor | anthropics legal | Apache-2.0 | لا | ما فتحتها ولا نزلت. الأولوية كانت لمنهج مراجعة العقد وتقييم المخاطر. ملف CONNECTORS.md للـplugin يذكر أدوات أجنبية (DocuSign وCLM)، لكن محتوى هذي المهارات نفسها ما فحصته. ممكن تنفحص لاحقاً |
| مهارات sales الباقية (draft-outreach و call-prep و pipeline-review وغيرها، 35 مهارة) | sales | anthropics sales | Apache-2.0 | لا | ما فتحتها. حسب الأسماء والأدوات المذكورة في handle-objection، مصممة لفرق مبيعات مؤسسية عندها CRM. handle-objection كفاية كبداية |
| tools/clis/*.js في marketingskills | — | coreyhaines31/marketingskills | MIT | لا (تحتاج مراجعة) | سكربتات JavaScript لأدوات خارجية. ممنوع تنزيلها، والمهارات اللي نزلت ما تحتاجها |
| borghei/Claude-Skills | — | github.com/borghei/Claude-Skills | ما تحققت | لا | مستودع شخصي فيه مئات سكربتات Python، وما تحققت من الترخيص ولا النجوم |
| alirezarezvani/claude-skills | — | github.com/alirezarezvani/claude-skills | ما تحققت | لا | شخصي، حوالي 107 نجمة حسب البحث، وفيه سكربتات |
| syntax-syndicate/marketing-skills | — | github.com/syntax-syndicate/marketing-skills | ما تحققت | لا | يبدو نسخة من coreyhaines31/marketingskills، والأصل أولى |
| BrianRWagner/ai-marketing-claude-code-skills | — | github.com | ما تحققت | لا | شخصي وعدد نجومه غير معروف. ما فحصته |

## ملاحظات للمدير العام
- مهارات small-business تشير لملفات مشتركة بالمسار `../../shared/`، وأنا نسختها داخل كل مهارة في `_shared/`. عند النقل عدّل المسار أو حط مجلد `shared` مشترك.
- كل المهارات القانونية والضريبية في المصدرين أمريكية أو أوروبية. قبلت بس المنهج العام (مراجعة عقد، تقييم مخاطر)، والمرجع يبقى الأنظمة السعودية وسكيل legal-advisor.
- أي رقم أو نسبة «معيارية» في copywriting وpricing وreferrals وcampaign-plan بلا مصدر، ولا يطلع للعميل.
- lead-finder وreferrals تمس بيانات شخصية، فتمر على المستشار القانوني (PDPL) قبل الاستخدام.
- business-pulse تحتاج تعديل جملة «لا تستأذن» قبل النقل.
