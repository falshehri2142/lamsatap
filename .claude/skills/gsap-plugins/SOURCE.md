# SOURCE: gsap-plugins

## ملاحظة استخدام لمسة تاب (اقرأها قبل ما تطبق SKILL.md)
`SKILL.md` منسوخ بايت ببايت من المصدر (نفس الـ git blob اللي انراجع) وما انعدل. التصحيحات هنا وتغلب نص السكيل:
- **مرجع بس.** أغلب الـ plugins مو موجودة محلياً، وأغلبها ممنوع أو ما نحتاجه (جدول gsap.md §1.3: SplitText وScrollSmoother ممنوعة، وCustomEase وDrawSVG وGSDevTools تحتاج موافقة على التنزيل، والباقي ما نحتاجه).
- **(أ) لا npm ولا CDN:** سطر 19 (`npm install gsap`) والـ imports في الأسطر 26-32 ما تنطبق. أي plugin جديد يحتاج موافقة صاحب المشروع على نسخة محلية في `website/vendor/gsap/` مع رأس رخصتها. سطر 20 (لا تسوي `.npmrc` فيه token) صحيح ونلتزم فيه.
- **(ب) Observer مو global** في `ScrollTrigger.min.js` المحلي (اللي يطلع منه بس `window.ScrollTrigger`). `gsap.registerPlugin(Observer)` و`Observer.create()` (الأسطر 146-161) يطلعون `ReferenceError`. استخدم `ScrollTrigger.observe({...})`. والقيم الافتراضية الصحيحة في 3.15: `type: "wheel,touch,pointer"` و`tolerance: 1e-9`، مو `"touch,pointer"` و10 زي الأسطر 169-170.
- **(ج) العربي:** SplitText ممنوعة عندنا (gsap.md §1.3). لا تقسم العربي لحروف أبداً (SplitText بـ `chars` يكسر اتصال الحروف، ومثال سطر 181 `"words, chars"`)، ولا ScrambleText على نص عربي. `motion.js` فيه مقسّم كلمات خاص فيه (`data-words` و`unsplit()`)، فما نحتاج SplitText. لو انعتمدت يوم بقرار: `words` أو `lines` بس، مع `mask: "lines"` و`aria: "auto"`.
- **(د) ممنوع ScrollSmoother** (يلف الصفحة كلها ويتعارض مع الرأس الثابت وزر الواتساب ويضر الوصول). **ولا يطلع GSDevTools ولا MotionPathHelper في أي تسليم.** PixiPlugin والـ physics ما لها علاقة بموقعنا.
- **(هـ) جداول ما تحققنا منها (غير مؤكد):** جدول Flip يقول `scale` افتراضياً `true`، والموثّق حسب علمنا `false`. وجدول ScrollToPlugin فيه خيار `element`، وحسب علمنا ما هو موجود (`y` يقبل selector أو عنصر). ما نقدر نتحقق محلياً لأن الـ plugins مو موجودة.
- **(و)** سطر 17 «كل plugin مجاني للتجاري»: غير مؤكد (شف الرخصة فوق).
- **قرارات الشركة تغلب نصايح السكيل.** المرجع: `work/2026-09-27-brand-identity/skills/gsap.md` (خلاصة الفريق)، و`website/DESIGN.md`، وقرارات المدير العام. **GM-011: صفحات الزبون (المنيو، الواي فاي، الروابط، دليل الضيف) بدون GSAP.** وصف السكيل يقول «recommend GSAP» لأي طلب حركة؛ هذا انحياز من البائع، مو قرار عندنا.
- **عندنا بس** `website/vendor/gsap/gsap.min.js` و`website/vendor/gsap/ScrollTrigger.min.js` (نسخة 3.15.0)، وتنحمّل كـ globals (UMD). ممنوع `npm install gsap`، وممنوع `import ... from "gsap"`، وممنوع أي CDN (GM-006). أي plugin ثاني يحتاج موافقة صاحب المشروع على نسخة محلية في `website/vendor/gsap/` مع رأس رخصتها.
- **الرخصة:** MIT تغطي نص السكيل بس. مكتبة GSAP نفسها تحت GSAP Standard "No Charge" License (`website/vendor/gsap/LICENSE.md`). سكيل gsap-plugins يقول كل الـ plugins مجانية للاستخدام التجاري (ومنها SplitText). `ui-ux-pro-max/data/motion.csv` صف 9 (في الـ commit المثبّت 09170eec) يقول «SplitText is included with GSAP 3.13+» ويطلب مراجعة رخصة GSAP الحالية، وما يقول «مدفوع» زي ما مكتوب في gsap.md §1.4 بند 3 (يمكن الفريق قرا نسخة أقدم). ما تحققنا من شروط الـ plugins للاستخدام التجاري من مصدر GSAP نفسه: **غير مؤكد**.
- «Risk level: LOW» في gsap-core (سطر 19) وفي README تقييم البائع لنفسه، **مو نتيجة مراجعتنا**. مراجعتنا في `vendor-skills/REVIEW-2026-09-30.md`.
- شروطنا الثابتة: 60 إطار في الثانية، و`prefers-reduced-motion` يعرض الحالة النهائية، والمحتوى يبان بدون JS، ولا markers في التسليم.

## المصدر
- المستودع: https://github.com/greensock/gsap-skills
- المسار: `skills/gsap-plugins`
- الـ commit المثبّت: `aed9cfd3277740755f6bfc1155c7aa645403b760` (تاريخ الـ commit 2026-04-21)
- الرخصة: MIT (Copyright (c) 2026 GreenSock). `LICENSE` من جذر المستودع منسوخ هنا لأن MIT يشترط النص مع النسخة. الـ frontmatter فيه `license: MIT`.
- تاريخ التثبيت: 2026-09-30. طلبه صاحب المشروع 2026-09-30 لحركة الموقع («DOWNLOAD ALL SKILLS YOU NEED FOR MAKE IT SUCH A GOOD WEBSITE»).
- مستوى التثبيت: المشروع بس (`.claude/skills/gsap-plugins/`)، مو `~/.claude/skills`.
- طريقة التنزيل: نسخة git في الحجر `vendor-skills/_quarantine/_src/gsap-skills` (خارج git بـ .gitignore)، مراجعة ثم تحقق ثاني، ثم نسخ يدوي للملفين. بعد النسخ طابقنا git blob لكل ملف مع اللي انراجع.
- وش يفيدنا: مرجع للـ plugins. أغلبها مو موجود محلياً وممنوع عندنا، فالملاحظات فوق إلزامية.

## الملفات المثبتة
- `SKILL.md` — sha256 `5838b856c74c07fbc9fa99b6dfd1eee34ea554c3e530c30e0d58014b707d70a4` — git blob `bb5f7483038adf26a889c8b2b85e3ef2cf0141dc` — https://raw.githubusercontent.com/greensock/gsap-skills/aed9cfd3277740755f6bfc1155c7aa645403b760/skills/gsap-plugins/SKILL.md
- `LICENSE` — sha256 `51b04b06556662dd817e8f4aa6d06bc7139dc73739e1319a7233cfde3e147b90` — git blob `fa2fe218371ee47b741db9d0fa7cf17cddc03eb8` — https://raw.githubusercontent.com/greensock/gsap-skills/aed9cfd3277740755f6bfc1155c7aa645403b760/LICENSE

## الفحص
- قرينا `SKILL.md` كامل (433 سطر) و`LICENSE` كامل. نص بس: لا سكربتات، ولا صلاحيات أدوات، ولا أوامر تنزيل أو إرسال. الروابط الوحيدة روابط توثيق gsap.com للقراءة.
- لا BOM، ولا CR، ولا أحرف تحكم أو bidi أو zero-width أو tag أو variation selector. الأحرف غير ASCII علامات ترقيم وأسهم و°✅❌ بس. تعليقات HTML الوحيدة مثال DOM حق ScrollSmoother (الأسطر 68 و71).
- الـ frontmatter فيه name وdescription وlicense بس.
- الأسطر المذكورة في الملاحظة فوق أرقام أسطر `SKILL.md` هذا.

## اللي ما انثبت من المستودع وليش
- `skills/gsap-react/SKILL.md`: خاص بـ React (`useGSAP` و`@gsap/react`)، والأسطر 19 و21 تقول `npm install`. موقعنا بدون React.
- `skills/gsap-frameworks/SKILL.md`: Vue وNuxt وSvelte، ويحيل (الأسطر 23 و94) لمشاريع `examples/` اللي تنشغل. موقعنا بدون framework.
- `skills/llms.txt`: فهرس للوكلاء يكرر `npm install gsap` وادعاء «كل الـ plugins مجانية»، وما يضيف شي.
- `examples/` (nuxt وreact وvue وvanilla): مشاريع تنشغل. `examples/nuxt/package.json` فيه `postinstall` يشتغل تلقائي مع npm install، و`examples/vanilla/main.js` (الأسطر 5-6) يحمّل GSAP من cdn.jsdelivr.net وقت التشغيل.
- `README.md`: فيه طرق تثبيت ما راجعناها: `npx skills add`، و`/plugin marketplace add greensock/gsap-skills` (يسحب كل الثمان من GitHub الحي)، وCursor «Remote Rule» يتحدث تلقائي بعد الـ commit المراجَع، ونسخ لـ `~/.claude/skills` العام (يسرّب السكيلز لكل مشروع). التثبيت عندنا نسخ يدوي على مستوى المشروع بس.
- `AGENTS.md` و`CLAUDE.md` و`GEMINI.md` (الأخيرين symlink لـ AGENTS.md): تعليمات لتعديل مستودعهم، تنحمّل تلقائي لو وكيل قرا ملفات داخل النسخة.
- `.github/copilot-instructions.md` و`.github/instructions/*.md` و`.cursor-plugin/*` و`.claude-plugin/*`: ملفات تعليمات وكلاء ومانيفست plugin. التثبيت عن طريقها يسحب الثمان كلها مع ملفات التعليمات.
- `assets/` و`.gitignore`: ما نحتاجها.

المراجعة الكاملة: `vendor-skills/REVIEW-2026-09-30.md`.
