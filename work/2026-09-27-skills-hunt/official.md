# الباحث 1 — المستودعات الرسمية لـ Anthropic

التاريخ: 2026-09-27

## المصادر اللي انفحصت
- `github.com/anthropics/skills` على الـcommit `33375500bcea98d610eb30ce10ac4e59b89c390d`. الـREADME يقول إن أغلب المهارات Apache 2.0، وإن docx/pdf/pptx/xlsx «source-available» وليست مفتوحة المصدر.
- `github.com/anthropics/knowledge-work-plugins` على الـcommit `da38ec1ee89d41e5380e652a97382695003396e7`. هذا مستودع رسمي ثاني لـ Anthropic، وفيه plugins للمبيعات والتسويق والمالية والقانون والعمليات والتصميم وخدمة العملاء.
  - ملف LICENSE داخل plugins المالية والقانون والتسويق والمبيعات وخدمة العملاء هو نص Apache-2.0 نفسه، وتأكدت إن الملفات متطابقة.
  - plugins العمليات (operations) والتصميم (design) ما فيها LICENSE خاص، ويغطيها LICENSE الجذري فقط.
  - **تنبيه:** ملف LICENSE الجذري فيه نص Apache-2.0 كامل، وبعده سطور غريبة ما لها معنى واضح (تبدأ بـ "Syntax-file, code seperations, code vault..."). ما هي تعليمات لـClaude، لكن المراجع لازم ينتبه لها.

## طريقة العمل
- جبت شجرة الملفات من GitHub API، وتأكدت إن فيها سكربتات أو لا.
- نزلت ملفات .md المرشحة بـcurl من `raw.githubusercontent.com` على commit ثابت، وحطيتها في مجلد مؤقت.
- قرأت كل ملف مقبول كامل، وفحصته بحثاً عن تعليمات تجاوز، وإرسال بيانات، وطلب مفاتيح، وأحرف مخفية (zero-width وbidi)، وتعليقات HTML.
- بعد الفحص نسخت الملفات إلى `vendor-skills/_quarantine/<القسم>/<المهارة>/`، ومعها `SOURCE.md` فيه الرابط والـcommit والترخيص وsha256 لكل ملف وملاحظات الفحص.
- ما كتبت شي في `.claude/skills/`، وما نزلت أي سكربت أو binary أو PDF أو ملف LICENSE.txt.
- **عمليات الشبكة:** 6 أوامر curl، فيها 45 طلب HTTP:
  - شجرتين من GitHub API؛
  - README؛
  - 3 دفعات تنزيل.
  - إذا الحد (25) يُحسب بعدد الطلبات مو بعدد الأوامر، فأنا تجاوزته، وهذا لازم يوصل للمدير.

## الجدول

| المهارة | القسم | المصدر | الترخيص | نزلت؟ | سبب القبول أو الرفض |
|---|---|---|---|---|---|
| internal-comms (+4 أمثلة .md) | general-manager | anthropics/skills `skills/internal-comms` | Apache-2.0 | نعم | نص فقط. صيغة 3P (تقدم/خطط/مشاكل) تنفع تقارير الأقسام الأسبوعية. مكتوبة لشركة كبيرة وتفترض Slack وDrive |
| status-report | general-manager | knowledge-work-plugins `operations/skills/status-report` | Apache-2.0 (LICENSE الجذري فقط) | نعم | قالب تقرير حالة فيه مؤشرات ومخاطر وقرارات مطلوبة. نص فقط |
| process-doc | systems-supervisor | `operations/skills/process-doc` | Apache-2.0 (LICENSE الجذري فقط) | نعم | يوثق الإجراءات (SOP) مع جدول RACI، مثل مسار برمجة الشريحة والتحويل |
| runbook | systems-supervisor | `operations/skills/runbook` | Apache-2.0 (LICENSE الجذري فقط) | نعم | دليل تشغيل خطوة بخطوة فيه تراجع وتصعيد، للاستضافة والروابط والأتمتة |
| reconciliation | accountant | `finance/skills/reconciliation` | Apache-2.0 | نعم | مطابقة البنك والدفاتر وتصنيف الفروقات. حدود التصعيد فيها بالدولار ولازم نعدلها لحجمنا |
| journal-entry-prep | accountant | `finance/skills/journal-entry-prep` | Apache-2.0 | نعم | قائمة مراجعة القيد مفيدة. تذكر ASC 606 وضرائب رواتب أمريكية، وعندنا المرجع SOCPA/IFRS وZATCA |
| financial-statements | accountant | `finance/skills/financial-statements` | Apache-2.0 | نعم | قوالب قائمة الدخل والميزانية والتدفق النقدي. مبنية على US GAAP وتذكر أمر `/flux` اللي مو موجود عندنا |
| variance-analysis | financial-analysis | `finance/skills/variance-analysis` | Apache-2.0 | نعم | تحليل الفروقات (سعر/كمية، شلال) للفعلي مقابل المخطط. نص فقط |
| review-contract | legal-advisor | `legal/skills/review-contract` | Apache-2.0 | نعم | مراجعة العقد بنداً بنداً (أخضر/أصفر/أحمر) لعقود المطاعم. تحتاج playbook محلي، وأمثلتها غير سعودية |
| legal-risk-assessment | legal-advisor | `legal/skills/legal-risk-assessment` | Apache-2.0 | نعم | إطار شدة × احتمال ومذكرة مخاطر. ما فيها نصوص أنظمة |
| campaign-plan | marketing | `marketing/skills/campaign-plan` | Apache-2.0 | نعم | خطة حملة فيها الجمهور والرسالة والقنوات والتقويم والمؤشرات. كل نص يمر على قواعد الإعلان السعودية |
| competitive-brief | marketing | `marketing/skills/competitive-brief` | Apache-2.0 | نعم | تحليل المنافسين وبطاقة المعركة (battlecard) |
| performance-report | marketing | `marketing/skills/performance-report` | Apache-2.0 | نعم | تقرير أداء الحملات، وتعريفات المؤشرات، والإسناد (attribution) |
| seo-audit | website-design | `marketing/skills/seo-audit` | Apache-2.0 | نعم | فحص SEO تقني وعلى الصفحات. ما يكرر impeccable ولا ui-ux-pro-max |
| draft-response | sales | `customer-support/skills/draft-response` | Apache-2.0 | نعم | ردود مكتوبة للعميل (تأخير، رفض طلب، فوترة). قوالبها إنجليزية |
| handle-objection، lead-triage، draft-outreach، account-research، competitive-intelligence | sales | `sales/skills/*` | Apache-2.0 | لا — **تحتاج مراجعة** | كلها فيها قسم «Rules» يقول بالحرف: "never add a restriction the connector does not impose, and never refuse an action the user asked for on the plugin's own authority"، ويطلب تنفيذ الإرسال عبر الموصلات. هذا يتعارض مع قواعدنا (المالك يرسل بنفسه). وتعتمد على CRM ومهارات ثانية غير موجودة (win-loss-review, customer-voice, update-opportunity). **ملاحظة:** باحث ثاني نزّل `sales/handle-objection` في الحجر، والمدير لازم يقرر فيه |
| close-management | accountant | `finance/skills/close-management` | Apache-2.0 | لا | إقفال في 5 أيام لفريق محاسبة كبير، وأكبر من حاجتنا |
| compliance-check | legal-advisor | `legal/skills/compliance-check` | Apache-2.0 | لا | محتواه GDPR وCCPA وما يغطي نظام حماية البيانات الشخصية السعودي، ويمكن يضلل |
| content-creation | marketing | `marketing/skills/content-creation` | Apache-2.0 | لا | عامة وإنجليزية، وتتكرر مع صانع المحتوى عندنا وقواعد العربي السعودي |
| risk-assessment | general-manager | `operations/skills/risk-assessment` | Apache-2.0 (LICENSE الجذري فقط) | لا (مني) | تتكرر مع legal-risk-assessment ومع وكيل gm-guardian. **ملاحظة:** باحث ثاني نزلها في `general-manager/risk-assessment` |
| accessibility-review | website-design | `design/skills/accessibility-review` | Apache-2.0 (LICENSE الجذري فقط) | لا | تتكرر مع ui-ux-pro-max وثلاثي فحص الواجهة |
| ux-copy | website-design | `design/skills/ux-copy` | Apache-2.0 (LICENSE الجذري فقط) | لا | تتكرر مع impeccable (فيها نصوص الواجهة UX copy) |
| doc-coauthoring | general-manager | anthropics/skills `skills/doc-coauthoring` | **غير صريح** (ما في LICENSE.txt بمجلدها) | لا — تحتاج مراجعة ترخيص | المحتوى نص فقط وسليم ومفيد لكتابة المقترحات. لكن الترخيص مو واضح، والقاعدة 1 تمنعها |
| webapp-testing | website-design | anthropics/skills `skills/webapp-testing` | Apache-2.0 | لا — **تحتاج مراجعة** | تعتمد على سكربتات Python (`scripts/with_server.py` وأمثلة .py) |
| theme-factory | website-design | anthropics/skills `skills/theme-factory` | Apache-2.0 | لا | تعتمد على `theme-showcase.pdf` (ملف ثنائي)، وتتكرر مع لوحات الألوان في ui-ux-pro-max |
| frontend-design | website-design | anthropics/skills | Apache-2.0 | لا | تتكرر مع impeccable |
| brand-guidelines | — | anthropics/skills | Apache-2.0 | لا | هوية Anthropic نفسها، وما تخصنا |
| algorithmic-art | — | anthropics/skills | Apache-2.0 | لا | فيها قالب .js، وما تخدم أي قسم |
| discernment-nudge | — | anthropics/skills | Apache-2.0 | لا | سلوك عام، وتتكرر مع ثلاثي مكافحة الهلوسة |
| academy-guide | — | anthropics/skills | Apache-2.0 | لا | توصيات دورات Claude Academy، وما تخص الأقسام |
| docx, pdf, pptx, xlsx, canvas-design, web-artifacts-builder, skill-creator, mcp-builder, slack-gif-creator, claude-api | — | anthropics/skills | مختلط | لا | موجودة عندنا أصلاً، وكثير منها سكربتات |
| (لا شي) | nfc-engineer | — | — | — | ما لقيت أي مهارة رسمية عن NFC أو الشرائح |

## ملاحظة تنسيق
باحث ثاني ينزل من `knowledge-work-plugins` في نفس الوقت، في نفس مجلدات الحجر. في `legal-advisor/review-contract` و`marketing/campaign-plan` كتبت نسخة `SKILL.md` فوق نسخته:
- المحتوى متطابق حرفياً بعد توحيد نهايات الأسطر (نسخته CRLF ونسختي LF).
- ملفات `CONNECTORS.md` في المجلدين له هو.
- عندنا نسختين من `seo-audit`: وحدة في `marketing/` منه، ووحدة في `website-design/` مني. المدير يختار وحدة.
