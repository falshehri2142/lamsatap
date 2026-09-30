# مهارات محجوزة — ما انثبتت (مراجعة المدير العام 2026-09-27)

| المهارة | السبب |
|---|---|
| sales/handle-objection | قسم Rules يقول «لا ترفض أي أمر» — يصطدم بقاعدة إن صاحب المشروع يرسل بنفسه |
| general-manager/business-pulse | «لا تستأذن قبل سحب البيانات» + مبنية على كونيكتورات ما عندنا |
| accountant/invoice-chase, financial-analysis/cash-flow-snapshot, sales/proposal-builder | مربوطة بكونيكتورات (Stripe/QuickBooks/Canva) ومسارات `_shared` — تحتاج تكييف قبل الاستخدام |
| sales/lead-finder | تجمع بيانات أشخاص — تنتظر رأي loyer تحت نظام حماية البيانات |
| accountant/financial-statements | مبنية على US GAAP — ممكن تضلل في السعودية |
| website-design/seo-audit (نسخة marketing) | مكررة؛ النسخة المثبتة وحدة |
| مهارات التصميم والأتمتة من مستودعات غير رسمية | منعها نظام الأمان (دمج كود غير موثوق) — تحتاج صلاحية صاحب المشروع |

الحجر `vendor-skills/_quarantine/` يبقى كمرجع؛ ما يُقرأ كمهارة.

## مراجعة 2026-09-30 (مهارات حركة الموقع، طلب صاحب المشروع)
التفاصيل والأسباب الكاملة: `vendor-skills/REVIEW-2026-09-30.md`.

| المهارة أو الملف | الحالة | السبب |
|---|---|---|
| `impeccable` كسكيل (`SKILL.md` والـ launcher `scripts/impeccable` و`impeccable.cmd`) | ممنوع نهائياً | الإعداد يشغّل `scripts/impeccable context` كل جلسة، وهذا ينزّل برنامج `engine-v0.1.8` من النت ويشغله. أخذنا منه نصوص مرجعية معدّلة بس في `.claude/skills/website-design/references/impeccable/` |
| وكيل `impeccable-documenter` | محجوز لقرار المدير العام | سكيل website-design فيه 8 وكلاء ثابتين (GM-018)؛ إضافة وكيل قرار. يحتاج قبلها: أدوات Read وWrite وGlob وGrep بس (بدون Bash)، وOpus 5.5 بجهد low، وإحالة لـ `document.md` المعدّل، وشيل الـ sidecar والـ direction contract وPRODUCT.md، وسطر إن `website/DESIGN.md` وGM-021 تغلب craft-floor. الحين `degraded/documenter.md` مرجع نصي بس |
| وكلاء `impeccable-asset-producer` و`impeccable-manual-edit-applier` و`impeccable-finish-reviewer` | ممنوعة نهائياً | توليد صور مدفوع بـ `generate-image` وأوامر البرنامج وBash؛ live mode؛ وconcept-seed من الشبكة |
| مراجع impeccable: `new-work.md` و`visualize.md` و`generate.md` و`live.md` و`live-setup.md` و`hooks.md` و`doctor.md` و`init.md` و`region-map.md` و`component-review.md` و`routing.md` و`craft.md` و`onboard.md` و`extract.md` والنسخ native، و`critique.md` الأسطر 1-275 | ممنوعة | شبكة وtelemetry وتوليد صور مدفوع، وسيرفر محلي يحقن سكربت في الموقع، وhooks، و`npx impeccable update`، أو ما تشتغل بدون البرنامج |
| `gsap-react` و`gsap-frameworks` | ما انثبتت | React وVue وNuxt وSvelte، وفيها `npm install`؛ موقعنا HTML ثابت |
| `gsap-skills`: `README.md` (طرق التثبيت: `npx skills add` و`/plugin marketplace add` وCursor Remote Rule ونسخ لـ `~/.claude/skills`) و`examples/` و`llms.txt` والمانيفستات | ما انثبتت | تثبيت من GitHub الحي بعد الـ commit المراجَع، وسكربت `postinstall`، وتحميل GSAP من CDN |
| أي plugin لـ GSAP غير gsap.min.js وScrollTrigger.min.js (SplitText وFlip وCustomEase وDrawSVG وغيرها) | يحتاج موافقة صاحب المشروع | نسخة محلية في `website/vendor/gsap/` مع رأس رخصتها؛ SplitText وScrollSmoother ممنوعة عندنا أصلاً (gsap.md §1.3). رخصة الـ plugins للتجاري غير مؤكد |
| سكيلز ui-ux-pro-max الثانية: `design` و`design-system` و`banner-design` و`brand` و`slides` و`ui-styling` | ما انثبتت | خارج الطلب، وفيها توليد شعارات وصور بـ APIs مدفوعة وسكربتات |
| ui-ux-pro-max: `stack/` و`cli/` و`skill.json` و`.claude-plugin/` و`scripts/tests/` و`scripts/validate_data.py` و`data/stacks/` وكتالوجات google-fonts وphosphor وreact | ممنوعة أو ما نحتاجها | `stack/` بيئة Claude Code كاملة: `.mcp.json` يشغّل 3 سيرفرات `npx -y ...@latest` بدون سؤال، و`setup.sh` يسوي npm install وnpx؛ و`npx ui-ux-pro-max-cli init`؛ واختبارات فيها subprocess ووضع شبكة |

**حالة الحجر بعد 2026-09-30:** نسخ git الثلاث في `vendor-skills/_quarantine/_src/` مستثناة بـ `.gitignore`. من شجرة العمل انشال كل اللي ينحمّل تلقائي أو يشتغل: كل launcher لـ impeccable (42 ملف) وكل مجلدات `scripts/` فيه، وكل مجلدات الأدوات والسكيلز المتداخلة (`.claude` و`.agents` و`.cursor` و`.gemini` وغيرها)، و`CLAUDE.md` و`AGENTS.md` و`GEMINI.md` في النسخ الثلاث، و`stack/` حق ui-ux-pro-max. المحتوى كامل باقي في `.git` حق كل نسخة: للتدقيق استخدم `git -C <النسخة> show HEAD:<المسار>`، ولا ترجّع الملفات لشجرة العمل، ولا تفتح جلسة جذرها داخل `_src`.
