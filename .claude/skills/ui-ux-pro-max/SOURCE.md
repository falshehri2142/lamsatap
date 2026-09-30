# SOURCE: ui-ux-pro-max

## ملاحظة استخدام لمسة تاب (مهمة)
- **`SKILL.md` معدّل** (الرخصة MIT تسمح). التعديل مكتوب في رأس الملف نفسه تحت «LamsaTap local patch»، والتفاصيل تحت في «التعديلات على SKILL.md». باقي الملفات منسوخة بايت ببايت.
- **الخطوات اللي ما تشتغل عندنا:** `--stack` (ملفات `data/stacks/` ما انثبتت)، ودومين `google-fonts` ودومين `react` (ملفاتها ما انثبتت، وتطلع «File not found»). مرر `--domain` صريح دايماً.
- **البديل المحلي:** نظامنا HTML/CSS/JS ثابت، والخطوط Readex Pro وFigtree محلية (`website/assets/brand/tokens.css`)، والحركة GSAP 3.15 وScrollTrigger من `website/vendor/gsap/`. نظام التصميم المعتمد `design-system/lamsatap/MASTER.md`.
- **الأمر:** من جذر المستودع أو الـ worktree: `python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>`. مكتبة بايثون القياسية بس، بلا تثبيت.
- **ممنوع `--force` أبداً** (في `scripts/design_system.py` سطر 1060 يكتب فوق `MASTER.md` حتى مع `--page`). ولا `--persist` بـ `-p LamsaTap`. التجارب في `--output-dir work/<task>/` باسم مشروع ثاني.
- **المخرجات مدخل بس:** كل صفوف `typography.csv` (74) فيها `@import` من fonts.googleapis.com، وكل صفوف `icons.csv` (105) فيها imports من npm لـ React، وقائمة الفحص المولّدة تقترح Heroicons/Lucide. لا شي منها يدخل `website/` (GM-006). الفايدة من icons.csv عمود «Usage» (إرشادات الوصول).
- **الحركة:** `data/motion.csv` فيه 17 وصفة GSAP كلها معها reduced-motion. صف 9 (SplitText) وصف 12 (Flip) يحتاجون plugins مو موجودة عندنا (وSplitText ممنوعة، gsap.md §1.3). صف 5 يذكر `@gsap/react` (ما ينطبق)، وصف 10 يفترض SPA router. الباقي يشتغل بـ gsap وScrollTrigger بس.
- **قبل التسليم (الموقع):** `references/quick-reference.md` §1 إلى §3 و§7، وبنود `pro-rules.md` اللي تنطبق على الويب بس (focus، التباين، reduced motion، أزرار إيقاف الحركة التلقائية). `pro-rules.md` نفسه يقول إنه للتطبيقات والجوال.
- **أرقام صحيحة:** `quick-reference.md` فيه 221 قاعدة في 10 أقسام (مو 119؛ 119 عدد صفوف `ux-guidelines.csv`)، و§7 فيه 25 قاعدة.
- الأداة تكتب `scripts/__pycache__/` لو شغلتها بدون `-B` (مستثنى في `.gitignore`). لا تنسخ `__pycache__` من مكان لمكان.

## المصدر
- المستودع: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- المسار: `.claude/skills/ui-ux-pro-max` (وملف `LICENSE` من الجذر)
- الـ commit المثبّت: `09170eec67eefd46a7ae85de61b40c194020f997`
- الرخصة: MIT (Copyright (c) 2024 Next Level Builder). قرينا `LICENSE` كامل: نص MIT القياسي. ما فيه ملف في التثبيت له رخصة ثانية (كتالوج Google Fonts بـ OFL/Apache وPhosphor مستثنيين).
- تاريخ المراجعة والتثبيت: 2026-09-30. طلبه صاحب المشروع 2026-09-30 لحركة الموقع («DOWNLOAD ALL SKILLS YOU NEED FOR MAKE IT SUCH A GOOD WEBSITE»)، وسكيل website-design يطلبه أصلاً (أمر صاحب المشروع 2026-09-27).
- مستوى التثبيت: المشروع بس (`.claude/skills/ui-ux-pro-max/`).
- طريقة التنزيل: نسخة git في الحجر `vendor-skills/_quarantine/_src/ui-ux-pro-max-skill` (مستثناة بـ .gitignore)، مراجعة ثم تحقق ثاني، ثم نسخ يدوي للملفات المسموحة بس. طابقنا git blob كل ملف مع الـ commit قبل النسخ.

## الملفات المثبتة (20)
- `SKILL.md` — **معدّل محلياً** — sha256 المحلي `b0a28d01cbd570b965e735076441009a74e31138a1369ca6430a78bb17a9b020` — sha256 الأصل `ea087c341bfb5b23195c7302027268ede86da802554c18a5c4896a6017b439f9` (git blob الأصل `41f8e2fd7f8c568228d0b55186ebe3f7b4007377`) — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/SKILL.md
- `references/quick-reference.md` — sha256 `0609bc7c89dacb40472465d8fc14257b56b2c43439660fc8d6fa3b8c022e1876` — git blob `7acc7e7540ca6981d878a90aae4455c1638e2385` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/references/quick-reference.md
- `references/pro-rules.md` — sha256 `d28442d61c310b49c054a4ea736f89fb3008beebdbbc38c4b3a540b8f7fadf23` — git blob `b2ce233287e37ec9ca13476c4014b922e9d5a0e9` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/references/pro-rules.md
- `scripts/search.py` — sha256 `d54e648fe0ec2932cac66684220cc17be4bd4b4eba1d23d3195d509d398db374` — git blob `5038aa875a0d39f24dea803a4c73b38f8f56915f` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/scripts/search.py
- `scripts/core.py` — sha256 `c3be4b23e7150e6b45095213158cfa3c8ad96502f01dde3f6ffff9de64a4f481` — git blob `670fe33070cfe706401da4ff276831257dbf1e25` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/scripts/core.py
- `scripts/design_system.py` — sha256 `e7d1c94c4b2eada17c5551157668362659ccf9626d34dbd58e68142410f90103` — git blob `d5fe1575f00d839f919603bd09b44fe7e9def4fb` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/scripts/design_system.py
- `scripts/reasoning_contract.py` — sha256 `b8bac1af82aa280d3e06f00aabaeac4337e632996b07fed874e2b6ee6e9c5913` — git blob `63652a666b130c249ea1e2954316f1ac8a5a73d5` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/scripts/reasoning_contract.py
- `data/motion.csv` — sha256 `381affe8df8ea1f66fbbda2598827f9f54299107bbe6a1b4e9b68f6b62091ceb` — git blob `8e0ca9ceb0e4cd4832aee60ac74713e1e1830de8` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/motion.csv
- `data/ux-guidelines.csv` — sha256 `ff81ec613f70ba9fc3fcce52dbe4ae35d44b2079dbe6dc066d2d6e38c28facd5` — git blob `4e7d52b296537a03513b18b2c3f2b946cc802051` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv
- `data/styles.csv` — sha256 `a93a4d9d7025856575d7b7583bda020be9043013432c5af7c58af9dbdfb206b7` — git blob `d1eb2c216e453005ffa8232ffb94491c183afe3c` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/styles.csv
- `data/products.csv` — sha256 `42473f75e8dde5987bdf89ce55d8c168091b80a356cae691dd60247d80720b70` — git blob `9f40f1d1f9743c4a81603076dfbfd115bbb55246` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/products.csv
- `data/colors.csv` — sha256 `8162429222bce22df62b564085946a30d07cc9722c58d0a3a494bd0d1d00841c` — git blob `5d2bf7389105f8a824b504b57cc93c00dc1d7e0a` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/colors.csv
- `data/typography.csv` — sha256 `321fc446e89024488ebae96dda93efc4d2307bd8bddb240857ad51364f6782c8` — git blob `70d107d107de30150863c965767320ec33ef29ad` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/typography.csv
- `data/landing.csv` — sha256 `9a2edd3bb676c2a58f00ade7a062e285222d4297bfd847c8d5b056f0dbbf52d0` — git blob `34858160aa2789c49dca274d48bb116d51dd3f0a` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/landing.csv
- `data/ui-reasoning.csv` — sha256 `f0774dd741cecdad5eec842034bd6d5e9ea50e9f220a1910069748daa0bb8e9a` — git blob `8931d4c809f8e22ddac00ce612ce0c35f34a59b6` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/ui-reasoning.csv
- `data/icons.csv` — sha256 `50816c6012030178195a16ee481ebf58b47bd985d70e8ec58886cc83f6eddafc` — git blob `cfc3f1eccd7e5aee15d8d70f86d8fa17ba737958` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/icons.csv
- `data/charts.csv` — sha256 `4115cf1120680f2cedef0676cb648f30c7ef4699e2a947535d4113e71ed3b12a` — git blob `c6f4f875fd5b34379f24dbb541539492366a1058` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/charts.csv
- `data/app-interface.csv` — sha256 `331e7cf2c0b222d80c566c5f255c63cb339f65bfd02e471a720f28e4864a9f08` — git blob `95e328c807a23be02c9c32c736d0fa19109c6076` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/app-interface.csv
- `data/data-provenance.json` — sha256 `e82fb33ed49375a300e93d9c11ccd1c1493c999e84ee7ee295e527634786e2e0` — git blob `e41d2e553bdc7e5a8e6d16f5daab565faf372188` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/.claude/skills/ui-ux-pro-max/data/data-provenance.json
- `LICENSE` — من جذر المستودع — sha256 `738f69dfa83db5c347c678fb9d90e560877059f0de93a327c39001bff92dc014` — git blob `1e71cbf26660f31903807d099fe902c098fc7e4c` — https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/09170eec67eefd46a7ae85de61b40c194020f997/LICENSE

## التعديلات على SKILL.md (MIT)
1. رأس «LamsaTap local patch» فيه قواعد الشركة (بالعربي) تحت العنوان.
2. كل أوامر `${CLAUDE_PLUGIN_ROOT}/.claude/skills/...` (11 مرة) صارت `python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py`، لأن المتغير يصير فاضي برا تثبيت plugin فيصير المسار `/.claude/skills/...`.
3. انشالت إحالة README (ما انثبت، ويحيل لـ `npx ui-ux-pro-max-cli`).
4. انشال صفّا `google-fonts` و`react` من جدول Step 3، وانشال Step 4 (`--stack`) وخطوة الـ stack في المثال، وصار سطر الـ stack يوصف موقعنا.
5. قاعدة «لا `--force` أبداً» ولا `--persist` بـ `-p LamsaTap`، والتجارب في `work/<task>/`.
6. قسم «Before Delivering» صار يذكر فحص الموقع (quick-reference §1 إلى §3 و§7) ويصحح رقم القواعد.
- الـ frontmatter (name وdescription) ما تغير.

## الفحص
- قرينا كامل: `SKILL.md`، و`references/quick-reference.md`، و`references/pro-rules.md`، والسكربتات الأربعة (`search.py` و`core.py` و`design_system.py` و`reasoning_contract.py`)، و`data/motion.csv` صف صف، و`LICENSE`. المراجع الأول والمتحقق الثاني قروا كل صفوف الـ CSV الإحدى عشر كاملة.
- السكربتات: مكتبة بايثون القياسية بس (csv وjson وre وpathlib وtempfile...). لا شبكة، ولا subprocess، ولا eval/exec. المتغير الوحيد من البيئة `COLORTERM`. الكتابة الوحيدة `--persist` (ملفات ذرية، و`safe_slug` يمنع الخروج من المجلد). قواعد `ui-reasoning.csv` تمر على قواعد مغلقة ما تنفّذ شي (`reasoning_contract.py`).
- فحص آلي على كل الملفات: لا BOM، ولا CR، ولا أحرف تحكم أو bidi أو zero-width. الـ U+FE0F الوحيد ملاصق لإيموجي (⚙️ و⚠️). كل صف CSV بعدد أعمدة الرأس، و`data-provenance.json` بدون مفاتيح مكررة وروابطه توثيق بس. الروابط الوحيدة في الـ CSV لـ fonts.googleapis.com (typography). كلمة `<script` الوحيدة مثال «سيء» في ux-guidelines.
- عمود «AI Prompt Keywords» في styles.csv فيه جمل أمر تصميم («Design a ...»): بيانات، مو تعليمات.

## اللي ما انثبت وليش
- `scripts/tests/**`: اختبارات للمطورين تستخدم subprocess وimportlib وتحمّل سكربتات مو مثبتة (منها `refresh-google-fonts.py` اللي عنده وضع `--live` على الشبكة بمفتاح API).
- `scripts/__pycache__/**` و`**/*.pyc`: ملفات مبنية (طابقت الكود، بس ما ننقلها).
- `scripts/validate_data.py`: أداة فحص للمطور تحتاج ملفات الكتالوج المستثناة.
- `data/stacks/**` (22 ملف): أدلة frameworks فيها نصايح npx وpnpm وCDN، وموقعنا بدون framework.
- `data/google-fonts.csv` و`data/google-font-licenses.json` و`data/phosphor-icons-upstream.json` و`data/catalog-summary.json` و`data/react-performance.csv`: حوالي 2MB كتالوجات وبيانات React وروابط خطوط خارجية.
- باقي المستودع: `stack/` (بيئة Claude Code كاملة: `.mcp.json` يشغّل 3 سيرفرات `npx -y ...@latest` بدون سؤال مع `enableAllProjectMcpServers: true`، و`settings.json` يسمح `Read(//home/**)`، و`CLAUDE.md` يطلب تشغيل `setup.sh` اللي يسوي npm install وnpx)، و`CLAUDE.md` الجذر (يقول git push وgh pr create)، و`cli/` و`skill.json` (تثبيت بـ `npx ui-ux-pro-max-cli init`)، و`.claude-plugin/` (يثبت السبع كلها)، والسكيلز الست الثانية في `.claude/skills/` (design وdesign-system وbanner-design وbrand وslides وui-styling)، و`src/` و`scripts/` الجذر وREADME.

المراجعة الكاملة: `vendor-skills/REVIEW-2026-09-30.md`.
