# GSAP في حركة لمسة تاب: الخلاصة والقواعد وقائمة الفحص

2026-09-28. خلاصة سكيلات GSAP الست لقسم مصمم الموقع. web-motion يشتغل عليها، ووكلاء الفحص يفحصون فيها `motion.js`.
صاحب المشروع قال ثلاث مرات «high quality animation»، فهالملف يحوّل كلامه لقواعد تنقاس.

**النسخة اللي انفحصت:**
- `website/assets/motion.js`: sha256 يبدأ بـ `10c87216` (452 سطر، 2026-09-28 00:39).
  - قبلها انفحصت ثلاث نسخ في نفس الجولة (`4977187f` و`b681c8a1` و`1064ecf2`)، لأن web-motion يعدّل فيه الحين.
- `website/assets/motion.css`: sha256 يبدأ بـ `b4d99ef4` (106 سطر).
- **أرقام الأسطر في القسم 7 لنسخة `10c87216`.** مع كل بند اسم الدالة ونص تدوّر عليه، عشان يتلقى لو تحرك السطر. والأداة في §6 تطلع الأرقام الحالية.

**وش قريت:**
- **السكيلز:** `~/.claude/skills/` ← `gsap-core` و`gsap-scrolltrigger` و`gsap-timeline` و`gsap-plugins` و`gsap-performance` و`gsap-utils`. كل وحدة فيها `SKILL.md` بس، بدون مجلد references.
- **GSAP نفسه:** `website/vendor/gsap/LICENSE.md`، والكود `gsap.min.js` و`ScrollTrigger.min.js` (3.15.0). أي سلوك مكتوب عنه «من الكود» قريته من هالملفين.
- **قرارات الشركة:**
  - `brief-gm040.md` ومعه تحديثات GM-042 إلى GM-049.
  - `web-art-director.md` «الاتجاه 3»: §3 و§4 و§6 و§7.1 و§10 و§11 (لغة الشعار). ومعها «الاتجاه 2: فاتح» §7، وفيه جدول التوقيت والممنوعات.
  - `web-copy.md` «الاتجاه 3»، و`builder-phase-b.md`، و`services/pricing.md` (ما فيه أسعار في هالملف).
- **للسياق بس، وما عدّلتها:** `motion.js` و`motion.css` و`web-motion.md`.
- **ui-ux-pro-max:** `references/quick-reference.md` §7، و`data/motion.csv`.

**وش شغّلت (كله محلي: بدون تنزيل، ولا شبكة، ولا تعديل على ملفات غيري):**
- Node على `gsap.min.js` و`ScrollTrigger.min.js` المحليين: قائمة الدوال الموجودة، وسلوك `stagger` و`eventCallback` والأهداف الفاضية.
- Edge بدون واجهة (CDP)، على صفحات فحص مصغّرة وعلى `website/index.html`.
  - الأداة محفوظة في `skills/gsap-checks/` (§6.1)، وتنعاد بأمر واحد.
- أي إصلاح مكتوب عنه «مجرّب» انجرب على نسخة في مجلد مؤقت برّا المشروع، مو على `motion.js` نفسه.

**القاعدة:** قرارات الشركة تغلب نصائح السكيل العامة:
- الموجز (GM-039 إلى GM-049).
- المدير الفني: التوقيت، والممنوعات، ولغة الشعار §11.
- GM-011: صفحات الزبون بدون GSAP.

**⚠ GM-049 (وصل وأنا أكتب، `d02fc37` 00:55):** أبطال الصفحات صارت mockups للمنتج الحقيقي:
- المضيفين: اللوحة جنب باب الشقة. والمطاعم: الستاند والمنيو على طاولة. والجوال يلمسها. والبابين مقاطع منها.
- صور الضيافة صارت خلفية خفيفة، أو تنشال.
- **وش يتغير هنا:**
  - قواعد الحركة نفسها (§2 إلى §6) ما تتغير.
  - **M4 (هدف جوال القصة) صار أهم،** لأن القصة كلها صارت «الجوال يلمس المنتج».
  - M7 وM11 (طبقة اللون والبارالاكس) ينطبقون بس على الصور اللي تبقى بطبقتين.
  - الباركود داخل أي mockup **وهمي ما يُقرأ** (GM-049). فلا حركة تكوّن منه باركود حقيقي. باركود البداية بس حقيقي.

---

## 0) الخلاصة
1. **عندنا GSAP 3.15.0 و ScrollTrigger بس.**
   - أي plugin ثاني يحتاج موافقة صاحب المشروع على التنزيل.
   - وأغلبها ممنوع عندنا أصلاً (§1.3).
2. **أهم شي في القصص المثبّتة: ترتيب refresh في ScrollTrigger** (قريته من الكود وجربته):
   - `onRefreshInit` يشتغل والتثبيت لسا مركّب.
   - القيم اللي هي دوال تنحسب بعد ما التثبيت ينفك.
   - `onRefresh` يجي آخر شي.
   - يعني: **القياس داخل الدوال، مو في `onRefresh`** (§2.1).
3. **`refreshPriority`: الأكبر يتحدث أول.** سكيل ScrollTrigger مكتوب فيه العكس، وهو غلط على كود 3.15 (§1.4).
4. **matchMedia:** لما ولا شرط ينطبق (مثل تشغيل «تقليل الحركة» والصفحة مفتوحة)، GSAP يرجّع كل شي وما يستدعي الدالة.
   - فشيل الكلاسات، ورجّع الحالة النهائية، **في دالة التنظيف**.
   - هي تشتغل آخر شي بعد الإرجاع (§2.3).
5. **أي tween أو ScrollTrigger ينبني بعدين** (من IntersectionObserver أو حدث) لازم يمر بـ `contextSafe`، وإلا ما يرجع مع matchMedia (§2.4).
6. **سلّم واحد للمدد والمنحنيات** (§3.1)، وكل `ease` لازم منه.
7. **الأداء** (§4):
   - transform و opacity و clip-path بس.
   - canvas وحدة للحقل.
   - ولا قراءة layout داخل الرسم.
   - و`lagSmoothing` بحذر.
8. **fail-open بتسع طبقات** (§5).
9. **الحالة الحين** (نسخة `10c87216`، الأداة 00:46): PASS 11 و FAIL 7 و INFO 5. الفاشلة (§7):
   - تشغيل «تقليل الحركة» والصفحة مفتوحة يخفي الباركود والرمز والكلمة وشعار الرأس، على 390 و1440.
   - نقص hook في ترميز البداية يخفيها بدون ولا خطأ.
   - جوال القصة يغلط هدفه بعد تغيير العرض (72px).
   - القصة المثبّتة تنحشر تحت الرأس الثابت.
   - الوسائط في آخر الصفحة تبقى مقصوصة للأبد.
   - الشاشات القصيرة (أقل من 640) ما تلوّن صور البطل والقصة.
   - دالة التنظيف ما تشيل `m` و`mh`.

---

## 1) وش عندنا من GSAP بالضبط

### 1.1 الملفات والرخصة
- **الملفات:** `website/vendor/gsap/gsap.min.js` و`ScrollTrigger.min.js`، نسخة 3.15.0 (تأكدت: `gsap.version` يطلع `3.15.0`).
- **الرخصة:** GSAP Standard "No Charge" License (`LICENSE.md`)، ومسموح نستخدمها في موقع تجاري.
- **التنزيل:** نزلت بموافقة صاحب المشروع يوم 2026-09-27. **أي ملف GSAP ثاني = تنزيل جديد يحتاج موافقته.**
- **GM-011:** صفحات الشركة بس تحمّلها.
  - فحصت: `templates/` و`demo/` ما فيها ولا ذكر لـ gsap (§6، S8).
  - الوحيدة اللي تحمّلها الحين `website/index.html`.
- `ScrollTrigger.min.js` يسجّل نفسه لو `window.gsap` موجود، و`gsap.registerPlugin(ScrollTrigger)` مرة ثانية ما يضر.

### 1.2 الدوال الموجودة في 3.15 (من الملفات نفسها بـ Node)
| | الموجود، وأي شي غيره = خطأ وقت التشغيل |
|---|---|
| `gsap.*` | addEventListener, config, context, core, defaults, delayedCall, effects, exportRoot, from, fromTo, getById, getProperty, getTweensOf, globalTimeline, install, isTweening, killTweensOf, matchMedia, matchMediaRefresh, parseEase, plugins, quickSetter, quickTo, registerEase, registerEffect, registerPlugin, removeEventListener, set, ticker, timeline, to, updateRoot, utils, version |
| `gsap.utils.*` | checkPrefix, clamp, distribute, getUnit, interpolate, mapRange, normalize, pipe, random, selector, shuffle, snap, splitColor, toArray, unitize, wrap, wrapYoyo |
| `gsap.ticker.*` | add, remove, lagSmoothing, fps, deltaRatio, frame, time, sleep, wake, tick |
| `ScrollTrigger.*` | addEventListener, batch, clearMatchMedia, clearScrollMemory, config, create, defaults, disable, enable, getAll, getById, getScrollFunc, isInViewport, isScrolling, killAll, maxScroll, normalizeScroll, observe, positionInViewport, refresh, register, removeEventListener, revert, saveStyles, scrollerProxy, snapDirectional, sort, update |

- **`gsap.utils.extend` مو موجود** (`typeof` يطلع `undefined`).
  - هذا اللي طيّح `motion.js` قبل، والإصلاح `ac2eff6` بدّله بـ `Object.assign`.
  - الأداة تفحص أي دالة برّا الجدول (S1 و S2).
- **القيم الافتراضية** (من الكود):
  - `gsap.defaults`: `{ duration: .5, overwrite: false }`.
  - `gsap.config`: `{ autoSleep: 120, force3D: "auto", nullTargetWarn: 1 }`.
  - `gsap.ticker.lagSmoothing(500, 33)`.
- **إعدادات ScrollTrigger اللي تأكدت إنها في الكود:**
  - `pin` و`pinSpacing` و`pinType` و`pinReparent` و`pinnedContainer` و`anticipatePin`.
  - `invalidateOnRefresh` و`refreshPriority` و`onRefreshInit` و`onRefresh`.
  - `fastScrollEnd` و`preventOverlaps` و`containerAnimation`.
  - `clamp()` داخل `start` و`end`.
  - `ScrollTrigger.config({ ignoreMobileResize, autoRefreshEvents, limitCallbacks, syncInterval })`.
- **`ignoreMobileResize`** شغّال افتراضياً على الأجهزة اللمسية بس (في الكود: `b = 1 === isTouch`).
- **هدف فاضي** (`null`)، لحاله أو داخل مصفوفة: ما يطيّح شي (جربته بـ Node). و`null` لحاله يطلع تحذير في الكونسول بس.
- **ScrollTrigger ما فيه `ResizeObserver`** (بحثت في الملف): ما يدري لو عنصر تغيّر مقاسه، إلا مع أحداث الـ refresh (§2.1).

### 1.3 الإضافات (plugins)
كل الإضافات صارت مجانية بعد Webflow (سكيل gsap-plugins). بس **ولا وحدة منها عندنا**:
- **أي وحدة = «يحتاج موافقة صاحب المشروع على التنزيل».**
- ولو تلمس ممنوعات المدير الفني، تحتاج موافقته قبلها.

| الإضافة | وش تسوي | الحكم عندنا |
|---|---|---|
| SplitText | تقسّم النص لحروف وكلمات | **ممنوعة:** تقسيم الكلمة العربية لحروف خط أحمر، وتحريك النص كلمة كلمة ممنوع (المدير الفني §7) |
| ScrollSmoother، و`ScrollTrigger.normalizeScroll` | تمرير ناعم | **ممنوعة:** «تمرير ناعم بمكتبة» و«سرقة التمرير» (§7). و`normalizeScroll` موجود في ملفنا، بس ما ينستخدم |
| Observer | سحب وتمرير مخصص | ما نحتاجها |
| CustomEase | منحنى CSS بالضبط | ما نحتاجها: الجاهزة تطابق منحنيات المدير الفني (§3.1). ولو احتجناها: **يحتاج موافقة صاحب المشروع على التنزيل** |
| DrawSVG | ترسم علامات الصح بالخط بدل القص | اختيارية. **يحتاج موافقة صاحب المشروع على التنزيل** |
| Flip | انتقال بين مكانين (مثل الطيران للرأس) | ما نحتاجها: الطيران الحالي transform بحسبة، ويشتغل |
| MotionPath | حركة على منحنى | ما نحتاجها |
| GSDevTools | ضبط الـ timeline وقت الشغل | للتطوير بس، وما تنشحن أبداً. **يحتاج موافقة صاحب المشروع على التنزيل** حتى للتطوير |

### 1.4 أغلاط في نصوص السكيلز (لا تنسخها)
1. **`refreshPriority`:** سكيل gsap-scrolltrigger يقول «Lower = refreshed first»، و**كود 3.15 عكسه**:
   - الترتيب بـ `_sortY − 1e6 × refreshPriority`، يعني **الأكبر يتحدث أول**.
   - و`_sortY` مكان الـ trigger في الصفحة. فلو أي trigger فيه `refreshPriority`، الكل ينرتب حسب مكانه في الصفحة.
   - `motion.js` يعطي البداية 3 والبطل 2 والقصة 1، وهذا صح.
2. **مثال التمرير الأفقي في السكيل** فيه `Max.max` (غلط، الصح `Math.max`)، ويخلط `xPercent` مع قيم بالبكسل. ما عندنا تمرير أفقي، بس لا أحد ينسخه.
3. **SplitText:** gsap-plugins يقول مجانية، و`ui-ux-pro-max/data/motion.csv` (#9) يقول مدفوعة. ما يفرق معنا، لأنها ممنوعة عندنا.
4. **gsap-core يقول إن `gsap.matchMedia` يرجّع كل شي تلقائياً:**
   - صحيح للي ينبني **وقت** تشغيل الدالة.
   - مو للي ينبني بعدين (§2.4).

### 1.5 خريطة السكيلز الست: وش ناخذ من كل وحدة
| السكيل | اللي يهمنا منه | وينه هنا |
|---|---|---|
| gsap-core | `to` و`fromTo` و`set`، و`autoAlpha`، و`immediateRender`، و`overwrite`، و`matchMedia` بالشروط، و`defaults` | §2.3، §3 |
| gsap-scrolltrigger | `pin` و`scrub` و`start/end` و`refresh` و`batch` و`clamp()`، وممنوعاته (ScrollTrigger داخل tween في timeline، و`scrub` مع `toggleActions`، و`markers`) | §2 |
| gsap-timeline | الـ position parameter، والـ labels، و`defaults`، وبدل `delay` المتسلسل | §3.2 |
| gsap-plugins | التسجيل، وإن كل plugin مجاني، والقائمة | §1.3 |
| gsap-performance | transform و opacity، و`will-change` بحساب، و`quickTo`، والتنظيف، وإيقاف اللي برّا الشاشة | §4 |
| gsap-utils | `clamp` و`mapRange` و`toArray` و`selector`، والصيغة اللي ترجع دالة (بدون القيمة) لما تتكرر الحسبة | §3.2 (TL-13) |

---

## 2) القصص المثبّتة: pin و scrub

### 2.1 ترتيب refresh في ScrollTrigger 3.15 (قريته من الكود وجربته)
`ScrollTrigger.refresh()` ينادى بنفسه مع: تحميل الصفحة، و`resize` (بعد 200ms)، و`visibilitychange`، و`DOMContentLoaded`. ويمشي كذا:
1. **`refreshInit`:** كل دوال `onRefreshInit` تشتغل هنا.
   - **التثبيت لسا مركّب**، والحركات على تقدّمها الحالي.
2. **الترتيب:** لو فيه `refreshPriority` (§1.4).
3. **إرجاع الكل:** التثبيت ينفك (العنصر يرجع لمكانه)، والحركات ترجع لبدايتها.
4. **كل trigger لحاله، بالترتيب:**
   - مع `invalidateOnRefresh`: الحركة تنمسح قيمها.
   - `fromTo` و`from` (اللي `immediateRender` فيها true) ترتسم عند 0 على طول. يعني **دوال قيمها تنحسب هنا، والتخطيط طبيعي بدون تثبيت.**
   - بعدها `start` و`end` (ودوالها تنحسب هنا)، ومسافة التثبيت.
5. **تعديل مسافات التثبيت و`clamp()`:** البداية اللي بعد آخر الصفحة تصير `maxScroll − 1`.
6. **تحديث الكل:** الحركات ترجع لتقدمها.
7. **`onRefresh` لكل trigger** (آخر شي)، وبعدها حدث `"refresh"` العام.
- **refresh لـ trigger واحد** (مثل لما ينبني trigger جديد): نفس الترتيب لحاله، و`onRefreshInit` و`onRefresh` داخله.

**وش يعني هذا في الشغل:**
- **قِس داخل الدوال** (`x: () => …` و`start: () => …`) مع `invalidateOnRefresh: true`.
  - هذا الوقت الوحيد اللي التخطيط فيه طبيعي ومحدّث.
- **`onRefreshInit` للتصفير بس، مو للقياس:** وقته التثبيت لسا مركّب، وعرض العنصر المثبّت بالبكسل القديم.
- **لا تحسب في `onRefresh` قيمة تقراها دالة `fromTo`:** الدالة انحسبت قبله، فتاخذ قيمة الـ refresh اللي قبل.
  - جربتها: جوال القصة غلط هدفه بـ 72px بعد تغيير العرض من 1440 لـ 1200.
  - و`ScrollTrigger.refresh()` ثاني صلّحه (R3).

### 2.2 قواعد التثبيت (PIN)
| # | القاعدة |
|---|---|
| PIN-1 | **قسم أو قسمين مثبتين بالكثير في الصفحة** (`ui-ux-pro-max/data/motion.csv` #6). البوابة: البداية بس. صفحتي الجمهور: البطل المتوسع والقصة |
| PIN-2 | ثبّت الغلاف، وحرّك اللي داخله. لا تحرّك transform العنصر المثبّت نفسه |
| PIN-3 | **ولا أب للعنصر المثبّت عليه** `transform` أو `filter` أو `perspective` أو `will-change: transform` أو `contain: paint` أو `content-visibility: auto`، لأنها كلها تخرب `position: fixed`. ولو ما منه بد: `pinReparent: true` (أثقل) |
| PIN-4 | `pinSpacing` يبقى على الافتراضي (true). و`false` بس لو القسم اللي بعده مقصود يطلع فوقه، وهذا ما عندنا |
| PIN-5 | **البداية تحسب الرأس الثابت:** `start: () => 'top top+=' + headerH()`. و`headerH()` دالة وحدة مشتركة، تقيس **الجزء الثابت بس** (64 / 80)، مو صف روابط الجوال (48، يمشي مع الصفحة، المدير الفني «الاتجاه 3» §1). وللكتلة الأقصر من الشاشة: `'center center+=' + headerH() / 2` |
| PIN-6 | النهاية نسبية ودالة: `end: () => '+=' + Math.round(innerHeight * k)`. وk من التوكنز (§3.1): البداية 0.6 / 0.4، والبطل 1.3 / 1، والقصة 1.5 / 1.1 |
| PIN-7 | `anticipatePin: 1` لكل تثبيت يبدأ عند حافة الشاشة |
| PIN-8 | `invalidateOnRefresh: true` لو أي قيمة دالة أو مقاسة |
| PIN-9 | الإنشاء من فوق لتحت. ولو ما تقدر: `refreshPriority`، والأكبر أول: البداية 3، والبطل 2، والقصة 1 |
| PIN-10 | عنصر يبدأ حركته وهو داخل قسم مثبّت: `pinnedContainer: pinEl` لو بـ ScrollTrigger. أما IntersectionObserver فيشوف المكان الحقيقي، وما يحتاجها |
| PIN-11 | `scrub` بالتوكن `SCRUB` بس. وولا `scrub` مع `toggleActions` في نفس الإعداد (`scrub` يغلب) |
| PIN-12 | ScrollTrigger على الـ timeline الأعلى بس، مو على tween داخل timeline |
| PIN-13 | **`content-visibility: auto` و ScrollTrigger ما يتفقون:** القسم اللي ما انرسم مقاسه مؤقت (800px). ولما ينرسم، كل اللي تحته يتحرك، وScrollTrigger ما يدري (ما يسمع لتغيّر مقاس العناصر). يعني: **ولا pin ولا scrub داخل قسم عليه `content-visibility: auto` أو تحته**، إلا لو انضاف `ScrollTrigger.refresh()` بعد ما ينرسم. أما الظهور والمسح بـ IntersectionObserver فما يتأثرون |
| PIN-14 | **البدايات قرب آخر الصفحة:** عنصر ما يوصل خط البداية حتى عند أقصى تمرير، ما يشتغل أبداً. بـ ScrollTrigger: `start: 'clamp(top 65%)'`. جربتها: تصير `maxScroll − 1` في الـ refresh العام، فالعنصر اللي ينبني بعد التحميل يحتاج `ScrollTrigger.refresh()`. وبـ IntersectionObserver: عنصر حارس بآخر الصفحة (M6) |
| PIN-15 | افحص على 1440×900 و1280×720 و390×844: أعلى الكتلة المثبتة تحت الرأس الثابت (R4) |

### 2.3 matchMedia: تقليل الحركة والمقاسات (MM)
هذا من كود `gsap.min.js` نفسه (دالة `add`، ودالة تغيّر الشروط):
- **متى تشتغل الدالة:** `mm.add({ a: '(q1)', b: '(q2)' }, fn)` تشغّل `fn` لو **أي** شرط منطبق.
- **لما شرط يتبدل:** كل اللي انبنى يرجع، و**`fn` تنعاد بس لو فيه شرط منطبق**. ولو ولا شرط منطبق: يرجع وبس، و`fn` ما تنادى.
- **المفتاح الخاص `all`:** منطبق دايماً.
- **وش تستلم الدالة:** `fn(context, contextSafe)`. الثاني يلف أي دالة تبني حركات بعدين، عشان تنحسب على نفس الـ context (§2.4).
- **ترتيب الإرجاع** (`Context.kill` في `gsap.min.js`):
  1. الـ tweens ترجع.
  2. بعدها الـ timelines، وتنفك الـ ScrollTriggers.
  3. **آخر شي:** الدالة اللي ترجعها `fn` (التنظيف).
  - فالتنظيف هو المكان الصح عشان تجبر الحالة النهائية.

| # | القاعدة |
|---|---|
| MM-1 | **تقليل الحركة = ولا حركة، والحالة النهائية على طول.** الإخفاء المبدئي بالـ CSS يكون تحت كلاس يتحكم فيه JS بس (`m` و`mh`)، وسكربت الرأس يضيفه بس مع `prefers-reduced-motion: no-preference` |
| MM-2 | **التنظيف يشيل `m` و`mh`، ويمسح الـ inline على عناصر الحركة، بدون `setTimeout`.** والدالة ترجع تضيفهم لو انعادت. جربته: بدونه، تشغيل «تقليل الحركة» والصفحة مفتوحة يخفي الباركود والرمز والكلمة وشعار الرأس (R2). ومعه، كلها تبان |
| MM-3 | كل `addEventListener` داخل `fn` له `removeEventListener` في التنظيف |
| MM-4 | **الإعادة ما تعيد اللي خلص:** البداية مرة وحدة لكل تحميل (`introPlayed` في النسخة الحالية صح، R8)، واللي ظهر ما يرجع ينخفي. خلّ علامات «خلص» (Set أو WeakSet) برّا `fn` |
| MM-5 | **قلّل الشروط اللي تتبدل وقت التصفح.** شرط الطول (`min-height: 640px`) يتبدل مع تدوير الجوال وتصغير النافذة، وكل تبديل = إرجاع وبناء من جديد. والعرض صار دالة (`desk()`) داخل `end` بدل شرط، وهذا أحسن |
| MM-6 | لا تحط `gsap.context()` داخل `mm.add`، لأن matchMedia نفسها context. وبرّا matchMedia: `gsap.context(fn, scope)` و`ctx.revert()` |
| MM-7 | بعد أي إرجاع وبناء: `ScrollTrigger.refresh()`، ورجّع مكان التمرير لو تغيّر. النسخة الحالية تسويها بـ `keepY` |

### 2.4 التنظيف: context و revert و contextSafe (CL)
| # | القاعدة |
|---|---|
| CL-1 | **الـ context يسجّل بس اللي ينبني وقت تشغيل الدالة.** اللي ينبني بعدين يطلع برّاه وما يرجع: من IntersectionObserver، أو `requestAnimationFrame`، أو `setTimeout`، أو حدث، أو `onComplete`. جربتها على البارالاكس اللي ينبني من `watch()`: بعد تشغيل «تقليل الحركة» بقى ScrollTrigger اثنين، والصورة تتحرك مع التمرير. ومع `contextSafe`: صفر ScrollTrigger وصفر حركة |
| CL-2 | **الحل:** `mm.add(conds, function (ctx, contextSafe) { … var make = contextSafe(function () { gsap.fromTo(…) }); … })`. ولفّ كل اللي ينبني بعدين: الظهور، والطابور، والأبواب، والنبض، والبارالاكس، والطيران |
| CL-3 | عناصر DOM المضافة (خطوط المسح، والطبقات، والحقل) في قائمة وحدة (`junk`)، وتنشال في التنظيف وفي fail-open |
| CL-4 | كل `IntersectionObserver` في قائمة (`ios`)، وينفصل في التنظيف (النسخة الحالية صح) |
| CL-5 | `revert()` يرجّع الـ inline لقيمته قبل الحركة. **بس** لو CSS كان مخفي العنصر وقت أول رسم، ممكن يكتب القيمة المخفية inline (شفت `opacity: 0` على الباركود بعد الإرجاع). فالتنظيف يمسحها بنفسه (MM-2) |

---

## 3) تركيب الـ timeline والتوكنز

### 3.1 السلّم الواحد (`motion-consistency`)
**المنحنيات:**
| التوكن | GSAP | CSS | وين | المصدر |
|---|---|---|---|---|
| `OUT` (البوابة والمطاعم) | `expo.out` | `cubic-bezier(.16,1,.3,1)` | الدخول والظهور | المدير الفني «الاتجاه 2» §7 و«الاتجاه 3» §6 |
| `OUT` (المضيفين) | `quint.out` (= `power4.out`) | `cubic-bezier(.22,1,.36,1)` | الدخول، أهدى | «الاتجاه 3» §6 |
| `IN` | `expo.in` | `cubic-bezier(.7,0,.84,0)` | الخروج (65% من مدة الدخول) | §7 |
| `SCAN` | `quad.inOut` (= `power1.inOut`) | `cubic-bezier(.45,0,.55,1)` | خط المسح والكشف | §7 |
| `MOVE` | `power2.inOut` | تقريباً `cubic-bezier(.65,0,.35,1)` | الطيران للرأس، وتجمّع الرمز، وتقريب الجوال | اختيار web-motion (مو في جدول المدير الفني) |
| `ACC` | (CSS بس) | `cubic-bezier(.2,0,0,1)` | الأكورديون | §7 |
| `'none'` | `none` | `linear` | الـ timeline المربوط بالتمرير | GSAP (scrub) |

- منحنيات CSS هي أرقام المدير الفني. واللي يقابلها في GSAP هو التقريب المعروف لنفس المعادلة (expo وquint وquad).
- **ملاحظة:** المدير الفني كتب لخط المسح «سرعته ثابتة كأنه جهاز»، ومعه منحنى in-out. هالشيئين يتعارضون شوي. الكود ماشي على المنحنى، والقرار عنده.

**المدد:**
| التوكن | القيمة | المضيفين (كل مدة ×1.25) | المصدر |
|---|---|---|---|
| `press` | 150ms (CSS) | نفسه | §7 |
| `acc` | 240ms، والقفل 65% منه (156ms) | نفسه | §7 |
| `rise` | 600ms، والمسافة 20px (من 16 لـ 24) | 750ms | §7 و§6 |
| `scan` | من 700 لـ 900ms حسب الطول | من 900 لـ 1100 (الكود يطلع 875 لـ 1125) | §7 و§6 |
| `draw` | 240ms (علامات الصح) | 300 | web-motion |
| `fade` | 200ms (ذيل الخط) | 250 | web-motion |
| `pulse` | 400ms: من 1 لـ 1.08 ويرجع، مرة وحدة، المطاعم بس | — | §6 و§10 |
| `exit` | 0.65 × مدة الدخول | نفسه | §7 (`exit-faster-than-enter`) |
| `STAG` | 60ms بين العناصر، و4 بالكثير | 3 بالكثير | §7 و§6 |
| `SCRUB` | **0.3 ثانية** (المدير الفني). الكود 0.5 (M13) | نفسه | «الاتجاه 2» §7 و«الاتجاه 3» §6 |
| البداية | 1.7 ثانية بالكثير: من 0 لـ 0.7 المسح، ومن 0.7 لـ 1.3 التجمّع، ومن 1.3 لـ 1.7 الكلمة | — | «الاتجاه 3» §3 و§6 |
| البابين | 2.5 ثانية بالكثير: الأول يرتفع 24px في 600ms، والثاني بعده بـ 120ms، وبعدها مسح 900ms لكل باب بالدور | — | §6 |

- `ui-ux-pro-max` يقول 30 لـ 50ms للتتابع (`stagger-sequence`)، وأقل من 500ms (`duration-timing`).
- قرار المدير الفني يغلب: 60ms، والمسح من 700 لـ 900ms لأنه سرد مقصود.

### 3.2 قواعد التركيب (TL)
| # | القاعدة |
|---|---|
| TL-1 | timeline لكل تسلسل، مو `delay` ورا `delay` |
| TL-2 | **كل مرحلة لها label.** البداية مثلاً: `tl.addLabel('scan', 0).addLabel('assemble', .7).addLabel('swap', 1.1).addLabel('word', 1.3)`، وبعدها `tl.to(st, { q: 1 }, 'assemble')`. والنسبي: `'<'` و`'>'` و`'+=.1'` و`'assemble+=.2'` |
| TL-3 | `defaults` لكل timeline: `gsap.timeline({ defaults: { ease: OUT, duration: T.rise } })` |
| TL-4 | **كل `ease` من التوكنز.** والشاذ خطأ: الحين `'power2.in'` و`'sine.out'` و`'sine.in'` (M13). يا توكن جديد (مثل `PULSE`)، يا `OUT` و`IN` |
| TL-5 | **الـ timeline المربوط بالتمرير:** مدته الكلية 1 (يعني أجزاء من مسافة التثبيت)، و`defaults: { ease: 'none' }`، والمراحل labels بأجزاء: `'step1'` 0، و`'step2'` 0.36، و`'step3'` 0.7 |
| TL-6 | **حدث مرة وحدة داخل timeline مربوط بالتمرير** (مثل النبض): مو tween مربوط بالتمرير (مدة 0.03 تتغير مع سرعة التمرير). استخدم `tl.call(fn, null, .64)`، وافحص الاتجاه لأن النداء يشتغل في الاتجاهين. أو عتبة داخل `onUpdate` مثل البطل المتوسع (0.66 للفتح و0.5 للقفل)، وبعدها tween بالوقت وبالتوكنز |
| TL-7 | **`immediateRender`:** في `from` و`fromTo` افتراضياً true، يعني البداية تنرسم وقت الإنشاء. لو فيه أكثر من `from` أو `fromTo` على نفس الخاصية: `immediateRender: false` على اللي بعد الأول. و`tl.set()` افتراضياً false |
| TL-8 | **`eventCallback('onComplete', fn)` يبدّل القديم، ما يضيف عليه** (جربته بـ Node: بس الجديد اشتغل). عشان تضيف: اقرأ القديم وكمّله. النسخة الحالية تسويها (السطر 85) |
| TL-9 | **`stagger`:** يا `each` يا `amount`، مو الاثنين. `amount` يغلب (جربته: 10 عناصر = 20ms بينها، مو 60). ولـ «60ms و4 بالكثير»: `stagger: (i) => Math.min(i, MAXG - 1) * STAG` (جربته: 0، 60، 120، 180، 180…) |
| TL-10 | كل نداء (`onUpdate` و`onComplete` و`onEnter`…) ملفوف بـ `safe()`. والدوال اللي ترجع قيم ما ترمي خطأ أبداً: ترجع رقم دايماً |
| TL-11 | حالة تتحدث كل إطار داخل `onUpdate` (مثل `flightState`): `gsap.quickSetter` بدل `gsap.set` كل إطار، عشان ما ينبني tween جديد كل مرة |
| TL-12 | القطع: `tl.progress(1)` مع أي لمس أو زر أو عجلة أو تمرير (`interruptible`، النسخة الحالية صح). والتمرير ما ينقفل أبداً (`no-blocking-animation`) |
| TL-13 | الحسبة اللي تتكرر: صيغة `gsap.utils` اللي ترجع دالة، مثل `var toY = gsap.utils.mapRange(0, 1, 0, h)` وبعدها `toY(p)`. و`gsap.utils.toArray(sel, scope)` بدل `[].slice.call(querySelectorAll)` |

---

## 4) الأداء (PERF)
| # | القاعدة | الحين |
|---|---|---|
| PERF-1 | **transform و opacity و clip-path بس** (`transform-performance`، المدير الفني §7). ولا `filter` ولا `box-shadow` ولا width و height و top و left. و`clip-path` يترسم كل إطار (مو على الـ compositor)، فخلّ المساحة المقصوصة معقولة، وافحص البطل المتوسع (قصّه بعرض الشاشة كل إطار) على معالج مبطّأ | ✓ |
| PERF-2 | **`will-change: transform` بس على اللي يتحرك transform فعلاً ولمدة طويلة:** صورة البارالاكس، ونسخ الطيران وقت الطيران. **مو** على اللي يتحرك `clip-path` بس (`.m-kit-cover`، CSS السطر 30)، **ولا** دايم على `[data-open-sym], [data-open-word]` (CSS السطر 53)، لأنهم يتحركون بالشفافية والقص، والطيران لنسخ ثانية. وعدّ الطبقات في DevTools Layers | ✗ بندين (M14) |
| PERF-3 | أي عنصر ينضاف للـ DOM ينشال لما يخلص: خطوط المسح، والغطا، والحقل | ✓ (R1) |
| PERF-4 | **القيم اللي تتحدث كل إطار أو مع كل حدث:** `gsap.quickTo` (بحركة) أو `gsap.quickSetter` (بدون). مو tween جديد كل مرة. ما عندنا مؤشر يلحق الماوس (ممنوع)، بس `flightState` يسوي `gsap.set` أربع مرات كل إطار وقت التثبيت (السطور 151 لـ 157) | تحسين |
| PERF-5 | **الحقل canvas وحدة، مو آلاف عناصر** ✓. والقواعد: DPR بحد 1.5 ✓. وما يرسم لو ما تغيّر شي ✓. وكل الوحدات المدورة في مسار واحد وتعبئة وحدة ✓ (السطور 219 و230). والتدوير بس لو 1 بكسل جهاز أو أكثر ✓ (السطر 210). **الخطوة الجاية، وما انقاست:** الصفوف اللي خلصت ترتسم مرة وحدة في canvas مخفي، وكل إطار يرسم شريط المسح بس (10% من الصفوف) | ✓، وخطوة ما انقاست |
| PERF-6 | **ساعة وحدة:** أي شغل كل إطار يمشي على ساعة GSAP (`onUpdate` أو `gsap.ticker.add`)، مو حلقة `requestAnimationFrame` ثانية. و`ticker.remove` لما يخلص. وGSAP ينام لحاله لما ما فيه حركة (`autoSleep: 120`) | ✓ (rAF مرة وحدة بس) |
| PERF-7 | **`lagSmoothing`:** الافتراضي (500, 33). والنسخة الحالية (120, 16) لكل الصفحة (السطر 34): أي إطار فوق 120ms ينحسب 16ms، لكل الحركات. زين للبداية وقت التحميل. بس على جوال ضعيف إطاراته كلها طويلة، الحركات كلها تبطى لين 7.5 مرات بدل ما تقفز. ما تنعتمد إلا بعد قياس على جوال ضعيف. **ولا `lagSmoothing(0)` أبداً**: هذي لربط مكتبة تمرير ناعم، وهي ممنوعة | خطر (M8) |
| PERF-8 | **ولا قراءة layout داخل `draw` أو `onUpdate` أو الـ ticker:** `getBoundingClientRect` و`offset*` و`client*` و`getComputedStyle`. القياس مرة عند التهيئة، وعند refresh داخل الدوال (§2.1). وعند التهيئة: القراءات كلها أول، وبعدها الكتابات. `watch()` في النسخة الحالية يقرر من أول نداء IntersectionObserver، بدون قراءة layout وقت التهيئة ✓ | ✓ |
| PERF-9 | **الشغل برّا الشاشة:** ولا حركة تتكرر (ممنوع أصلاً). واللي ينتظر في الطابور وعنصره طلع من الشاشة: كمّله على طول بدون خط (M20). ولو صار عندنا حركة مستمرة يوم: `ScrollTrigger.create({ trigger, onToggle: s => s.isActive ? tl.play() : tl.pause() })` | تحسين |
| PERF-10 | **الظهور الكثير:** IntersectionObserver لكل عنصر أو `ScrollTrigger.batch`، مو ScrollTrigger بحسابات لكل عنصر. و`pin` يرقّي العنصر لطبقة، فخلّ التثبيت أقل شي | ✓ |
| PERF-11 | **القياس:** DevTools Performance مع إبطاء المعالج 4 مرات. ولا مهمة أطول من 50ms وقت التمرير (المدير الفني §7)، وإطارات البداية (1.7 ثانية) بدون إطار فوق 33ms. وعلى أجهزة حقيقية: لابتوب شاشته 2×، وأندرويد متوسط، وآيفون | لازم |

**القياس اللي سويته** (R9، مؤشر بس: Edge بدون واجهة وبدون GPU، والمعالج أبطأ 4 مرات):
- **النسخة الأولى** (`4977187f`، على 1440 بشاشة 2×):
  - لين 4,452 `roundRect` مع `fill` في الإطار الواحد (وفي تشغيل ثاني 5,315).
  - 44 إطار بس وقت البداية (يعني تقريباً 30fps)، و11 منها فوق 33ms.
- **النسخة الحالية** (`10c87216`):
  - 1440 بشاشة 2×: 0 `roundRect` (صارت `fillRect`، لين 3,783 بالإطار). 76 إطار، و2 منها فوق 33ms.
  - 390 بشاشة 2×: 80 إطار، و1 فوق 33ms.
- الأرقام نفسها ما تنقاس عليها أجهزة حقيقية، بس الفرق بين النسختين واضح.

---

## 5) fail-open: المحتوى يبان مهما صار (FO)
| # | الطبقة | الحين |
|---|---|---|
| FO-1 | **سكربت الرأس** (سطر واحد قبل CSS): `js` دايماً. و`m` (ومعه `mh` لو الشاشة 640 أو أطول) بس مع `no-preference`. وعند `DOMContentLoaded`: لو `window.__ltMotion` مو موجود (`motion.js` ما اشتغل أو ما كمّل)، تنشال `m` و`mh` | ✓ (`index.html` السطر 10) |
| FO-2 | `motion.js`: لو `gsap` أو `ScrollTrigger` ناقص، تنشال الكلاسات ويطلع | ✓ (السطر 29) |
| FO-3 | كل التهيئة داخل `try/catch` ← `fail()`. وكل نداء (IntersectionObserver، ونداءات ScrollTrigger، و`onUpdate`، و`onComplete`، و`requestAnimationFrame`، و`setTimeout`، والأحداث) ملفوف بـ `safe()` | ✓ تقريباً |
| FO-4 | **ترتيب `fail()`:** (1) `dead = true`. (2) **تنشال `m` و`mh` ويرجع الـ inline أول شي وبدون تأخير**، يعني المحتوى يبان الحين. (3) `mm.revert()` بعد `setTimeout(0)` لو انادى من داخل GSAP أو ScrollTrigger، عشان ما يصير إرجاع وسط حلقة refresh. (4) تنشال عناصر `junk` وتنفصل الـ observers. (5) تحذير واحد في الكونسول | جزئي (M15) |
| FO-5 | **تنظيف matchMedia = نفس الحالة النهائية** (MM-2) | ✗ (M1) |
| FO-6 | **كل قسم:** الـ CSS يخفي مبدئياً بس اللي JS أكيد بيظهره. ولو القسم طلع بدري (hook ناقص)، يظهّر اللي انخفى له على طول. أو يكون الإخفاء تحت كلاس خاص بالقسم، أو `:has()` يتأكد إن الترميز كامل (لو المتصفح ما يدعم `:has()`، القاعدة تنتجاهل والمحتوى يبان) | ✗ (M3) |
| FO-7 | **ولا شي ينتظر مخفي للأبد:** حارس آخر الصفحة أو `clamp()` (PIN-14)، وحد لـ `img.decode()` (1.5 ثانية ✓، السطور 287 لـ 292)، والطابور يكمّل اللي طلع من الشاشة | جزئي (M6) |
| FO-8 | **شبكة أخيرة:** `window.addEventListener('error', e => /motion\.js\|vendor\/gsap/.test(e.filename \|\| '') && fail(e.error))`. تمسك الخطأ اللي يطلع داخل رسم GSAP (من الدوال اللي ترجع قيم)، واللي `safe()` ما توصله | ✗ (M16) |
| FO-9 | **الطباعة:** CSS يجبر الحالة النهائية | ✓ (`@media print` في motion.css) |

**الهيكل المقترح** (مختصر، مو نسخ ولصق):
```js
var HOOKS = '[data-open-qr] svg, [data-open-sym], [data-open-word], [data-open-cap] > *, [data-open-logo] img, …';
function finalState() {
  H.classList.remove('m', 'mh');
  gsap.set(gsap.utils.toArray(HOOKS), { clearProps: 'opacity,visibility,transform,clipPath' });
}
function fail(e) {
  if (dead) return; dead = true;
  try { finalState(); } catch (x) {}                        // المحتوى يبان الحين
  setTimeout(function () {                                  // برّا مكدس GSAP و ScrollTrigger
    try { mm && mm.revert(); } catch (x) {}
    removeJunk(); disconnectObservers(); try { finalState(); } catch (x) {}
  }, 0);
  console.warn('[motion] fail-open:', e);
}
window.addEventListener('error', function (ev) {
  if (/motion\.js|vendor\/gsap/.test(ev.filename || '')) fail(ev.error || ev.message);
});
mm.add({ motion: '(prefers-reduced-motion: no-preference)', tall: '(prefers-reduced-motion: no-preference) and (min-height: 640px)' },
  function (ctx, contextSafe) {
    if (!ctx.conditions.motion) { finalState(); return; }
    H.classList.add('m'); H.classList.toggle('mh', !!ctx.conditions.tall);
    var later = contextSafe(function (el) { /* أي tween أو ScrollTrigger ينبني بعدين */ });
    // … watch(el, hide, later) …
    return function () { finalState(); /* removeEventListener، و disconnect، و removeJunk */ };   // بدون setTimeout
  });
```

---

## 6) قائمة الفحص للـ QA

### 6.1 الأداة: `skills/gsap-checks/`
- **الملفات:**
  - `run.cjs`: الفحوص.
  - `cdp.cjs`: يشغّل Edge بدون واجهة، بنفس طريقة `ui-probe`.
  - `pages/`: أربع صفحات مصغّرة، تقرا `motion.js` و`motion.css` وGSAP من `website/` مباشرة، بدون نسخ.
  - `make-pages.cjs`: يعيد بناء الصفحات لو تغيّرت الـ hooks.
- **ما تعدّل أي ملف.** بس لو انضاف `--json`، تكتب `last-run.json` جنبها.
- **التشغيل من جذر المشروع:**
```
node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs                 # الكل (كم دقيقة)
node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs S                # الثابتة بس (ثواني)
node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs R2 R3            # فحوص معيّنة
node work/2026-09-27-brand-identity/skills/gsap-checks/run.cjs R --page website/restaurants/index.html
```

| # | وش يفحص | ينجح لو | الحين (`10c87216`، 00:46) |
|---|---|---|---|
| S1 | `gsap.utils.*` كلها موجودة في 3.15 (ولا `extend`) | صفر مخالفات | PASS |
| S2 | كل `gsap.*` و`ticker.*` و`ScrollTrigger.*` موجودة في 3.15 | صفر | PASS |
| S3 | ولا plugin غير ScrollTrigger | صفر | PASS |
| S4 | `markers: true` | صفر | PASS |
| S5 | `lagSmoothing(0)` ممنوع، وأي قيمة غير الافتراضي تطلع للمراجعة | صفر `0` | INFO: `(120, 16)` |
| S6 | كل `ease:` من التوكنز | (للمراجعة) | INFO: 5 شاذة |
| S7 | `scrub` مع `toggleActions` في نفس الإعداد | صفر | PASS |
| S8 | GM-011: gsap في `templates/` و`demo/` | صفر | PASS |
| S9 | `eventCallback('onComplete', …)` يكمّل القديم | فيه قراءة للقديم | PASS |
| S10 | `stagger` فيه `each` و`amount` مع بعض | (للمراجعة) | INFO: السطران 259 و311 |
| S11 | قائمة `will-change` في motion.css | (للمراجعة) | INFO |
| S12 | التنظيف يشيل `m` و`mh` | نعم | **FAIL** |
| R1 | الطابور: بعد كل مسح (ومع 5 تحويمات على الباب) صفر `.m-line` وصفر `clip-path` inline | صفر | PASS |
| R2 | تشغيل «تقليل الحركة» والصفحة مفتوحة (390 و1440): بدون `m` و`mh`، وكل عناصر الحركة ظاهرة | صفر مخفي | **FAIL:** الباركود والرمز والكلمة وشعار الرأس ونص السطر `opacity 0` |
| R3 | جوال القصة يوصل الهدف (±2px) على 1440، وبعد 1200 | نعم | **FAIL:** 72px بعد 1200 |
| R4 | أعلى كتلة القصة المثبتة تحت الرأس الثابت (1440×900، كتلة 800) | نعم | **FAIL:** 50 مقابل 81 |
| R5 | شاشة 1280×600 والحركة شغالة: لون القصة يطلع | نعم | **FAIL:** `inset(0 0 100%)` |
| R6 | البداية ناقصها `data-open-sym`: ولا شي يبقى مخفي | نعم | **FAIL:** شعار الرأس والباركود والكلمة 0 |
| R7 | وسيط في آخر الصفحة (أعلاه 600 من 900 عند أقصى تمرير) ما يبقى مقصوص | نعم | **FAIL** |
| R8 | البداية ما تنعاد لما الشاشة تعبر 1024 بعد ما خلصت | نعم | PASS |
| R9 | كلفة حقل البداية (مؤشر) | ولا إطار فوق 33ms (هدف) | INFO: 2 و1 |
| R10 | تقليل الحركة من التحميل: الشكل النهائي وولا عنصر حركة | نعم | PASS |
| R11 | ولا خطأ ولا fail-open في الكونسول (تحميل وتمرير، 1440 و390) | صفر | PASS |

- R3 وR4 وR5 وR7 على صفحات مصغّرة. صفحتي الجمهور ما انبنت للحين، فهالأربع تثبت السلوك، مو شكل الصفحة.
- لما تنبني صفحتي الجمهور، شغّل `R --page website/restaurants/index.html` و`--page website/hosts/index.html`.

### 6.2 فحوص ثابتة بـ grep (Git Bash، من جذر المشروع)
| # | الأمر | المطلوب |
|---|---|---|
| G1 | `grep -nE "utils\.[a-zA-Z]+" website/assets/motion.js` | كل اللي يطلع من جدول §1.2 (ولا `extend`) |
| G2 | `grep -nE "SplitText\|Flip\|Observer\|ScrollToPlugin\|ScrollSmoother\|CustomEase\|DrawSVG\|MorphSVG\|MotionPath\|Inertia\|Draggable\|GSDevTools" website/assets/motion.js` | فاضي |
| G3 | `grep -rlE "gsap\|ScrollTrigger\|motion\.js" website/templates website/demo` | فاضي (GM-011) |
| G4 | `grep -nE "pin: *true" website/assets/motion.js` | 1 أو 2 لكل صفحة. وكل واحد معه `anticipatePin` و`invalidateOnRefresh: true`، وبداية تحسب الرأس (PIN-5) |
| G5 | `grep -nE "onRefreshInit\|onRefresh:" website/assets/motion.js` | ولا قياس للتخطيط الطبيعي فيها، ولا قيمة تقراها دالة `fromTo` (§2.1) |
| G6 | `grep -n "return function ()" website/assets/motion.js` | التنظيف فيه `classList.remove('m', 'mh')`، ومسح inline بدون `setTimeout` (MM-2) |
| G7 | `grep -nE "addEventListener\(" website/assets/motion.js` | كل واحد داخل `mm.add` له remove في التنظيف، أو ملفوف بـ `contextSafe` (MM-3) |
| G8 | `grep -nE "IntersectionObserver\|watch\(\|onView\(\|requestAnimationFrame\|setTimeout" website/assets/motion.js` | كل tween أو ScrollTrigger داخلها ملفوف بـ `contextSafe` (CL-2) |
| G9 | `grep -nE "ease: *'[^']+'" website/assets/motion.js` | كلها توكنز أو `'none'` (TL-4) |
| G10 | `grep -nE "stagger: *\{[^}]*each[^}]*amount" website/assets/motion.js` | فاضي (TL-9) |
| G11 | `grep -n "lagSmoothing" website/assets/motion.js` | فاضي، أو قيمة مقاسة على جوال ضعيف ومكتوبة في `web-motion.md` (PERF-7) |
| G12 | `grep -nE "will-change" website/assets/motion.css` | بس على اللي يتحرك transform فعلاً (PERF-2) |
| G13 | `grep -nE "getBoundingClientRect\|offset(Top\|Left\|Width\|Height)\|client(Width\|Height)\|getComputedStyle" website/assets/motion.js` | ولا واحد داخل `draw` أو `onUpdate` أو ticker (PERF-8) |
| G14 | `grep -n "content-visibility" website/assets/*.css` | ولا قسم فيه `auto` فوق أي pin أو scrub، أو داخله (PIN-13) |
| G15 | `grep -nE "markers\|normalizeScroll\|preventDefault" website/assets/motion.js` | ولا `markers`، ولا `normalizeScroll`. و`preventDefault` بس على ضغطة `summary` في الأكورديون |

### 6.3 فحوص يدوية في DevTools (البوابة، وبعدها صفحتي الجمهور)
1. **الـ triggers:** في الكونسول، اكتب:
   `ScrollTrigger.getAll().map(s => ({ pin: !!s.pin, start: s.start | 0, end: s.end | 0, prio: s.vars.refreshPriority || 0 }))`
   - التثبيت 1 في البوابة و2 في صفحة الجمهور بالكثير.
   - والبدايات مرتبة من فوق لتحت.
2. **ولا شي يتكرر:** بعد 5 ثواني بدون تمرير، اكتب:
   `gsap.globalTimeline.getChildren(true, true, false).filter(t => t.isActive()).length`
   - لازم يطلع `0`.
3. **ولا بقايا:** بعد ما كل المسح يخلص، اكتب:
   `document.querySelectorAll('.m-line, .m-field').length`
   - لازم يطلع `0`.
   - و`.m-kit` يبقى بس داخل القصة (غطا الشاشة جزء من الـ timeline المربوط بالتمرير)، و`.m-fly` يبقى لأنه طبقة الطيران.
4. **تقليل الحركة وقت التصفح:** Rendering ← Emulate CSS `prefers-reduced-motion: reduce`، والصفحة مفتوحة وفي نصها.
   - كل شي يبان بشكله النهائي.
   - و`document.documentElement.className` ما فيه `m` ولا `mh`.
   - والبارالاكس ما يتحرك مع التمرير.
5. **تغيير المقاس:** تغيير العرض 1440 ← 1200 ← 390، وتدوير الجوال:
   - البداية ما تنعاد.
   - مكان التمرير ما يقفز.
   - والجوال في القصة يوصل هدفه.
6. **رابط داخلي:** افتح `index.html#how`. الصفحة توقف عند القسم (تحت الرأس)، مو فوقه ولا تحته.
7. **الأداء:** Performance مع CPU 4× slowdown:
   - سجّل التحميل وثانيتين: إطارات البداية بدون إطار فوق 33ms.
   - وسجّل تمرير على التثبيت: ولا مهمة فوق 50ms.
8. **بدون JS:** كل النص ظاهر، والباركود النهائي، والصور أبيض وأسود.
9. **الطباعة:** معاينة الطباعة: ولا خط مسح ولا حقل، وكل شي ظاهر.

---

## 7) الأخطاء والمخاطر في `motion.js` الحالي
الأسطر لنسخة `10c87216` (452 سطر). «CSS» يعني `motion.css` نسخة `b4d99ef4`.
- **مؤكد بالتشغيل:** شفته صار فعلاً في المتصفح أو Node.
- **مؤكد من الكود:** السلوك محدد من الكود، بس ما سويت له فحص تشغيل.
- **خطر:** ممكن يصير، وما قدرت أطلّعه.

### 7.1 الباقي (مرتب بالخطورة)
| # | الخطورة | وين (الدالة / السطر / نص تدوّر عليه) | المشكلة | الدليل | الإصلاح |
|---|---|---|---|---|---|
| M1 | **عالية** | `mm.add` (420)، و`if (!c.motion)` (423)، والتنظيف `return function () { keepY` (439). وCSS 37 و47 و68 | **تشغيل «تقليل الحركة» والصفحة مفتوحة يخفي البراند.** الحين على كل المقاسات، لأن شرط العرض انشال من matchMedia. ولا شرط ينطبق، فـ GSAP يرجّع وما يستدعي الدالة، والسطر 423 ما يشتغل. والتنظيف ما يشيل `m` و`mh`، و`restore()` فيه متأخر بـ `setTimeout` | مؤكد بالتشغيل (R2): `html` يبقى `js m mh`، والباركود والرمز والكلمة وشعار الرأس ونص السطر `opacity 0`، على 390 و1440. وترتيب الإرجاع من `gsap.min.js` | أول سطر في التنظيف: `H.classList.remove('m', 'mh'); restore();` بدون تأخير، والدالة ترجع تضيفهم لو انعادت. **مجرّب على نسخة من `b681c8a1` بنفس الفكرة** (شيل الكلاسات ومسح الـ inline في التنظيف): كله يبان على 390 و1440، ويرجع يشتغل لما «تقليل الحركة» ينطفي |
| M2 | **عالية** | `depth()`: `var make = function` (402)، داخل `watch()`. ونفس النوع: الظهور `g.to` (259)، ومهام الطابور (81 لـ 86)، والأبواب `g.to` (323)، و`pulses()` (396)، و`flightState` بـ `g.set` (151 لـ 157) | **اللي ينبني بعدين يطلع برّا matchMedia.** البارالاكس ينبني من IntersectionObserver، فما يرجع: يكمّل يتحرك مع «تقليل الحركة»، ويتكرر لو انعادت الدالة (تبدّل شرط الطول) | مؤكد بالتشغيل (على `1064ecf2`، وجزء البارالاكس نفسه في `10c87216`): بعد تشغيل «تقليل الحركة» بقى ScrollTrigger اثنين، والصورة `translate(0%, 3.55%) scale(1.1)` بعد التمرير | `mm.add(…, function (ctx, contextSafe) {…})`، ولفّ `make` وكل منشئ متأخر بـ `contextSafe`. **مجرّب على نسخة من `1064ecf2`:** صفر ScrollTrigger، وصفر tween، وولا حركة |
| M3 | **عالية** | `opening()`: `if (!svg \|\| !sym \|\| !word) return;` (114)، و`if (!sec \|\| !c.tall) return;` (111). و`expand()`: `if (!media \|\| !card) return;` (340). وCSS 47 و56 لـ 61 و68 | **نقص hook يخفي المحتوى بدون خطأ،** فـ fail-open ما يشتغل. لو ترميز البداية ناقصه الرمز أو الكلمة، شعار الرأس والباركود والكلمة يبقون 0 للأبد. ولو صفحة جمهور رأسها فيه `data-open-logo` وما فيها `[data-open]`، شعار الرأس يختفي على الشاشات الطويلة. ولو البطل ناقصه البطاقة، اللوح والجوال يختفون والصورة مقصوصة | مؤكد بالتشغيل (R6): شعار الرأس 0، والباركود 0، والكلمة 0، و`html` فيه `mh`، وولا خطأ | كل خروج بدري يظهّر اللي انخفى لقسمه (`restore` للقسم، و`opacity: 1` لشعار الرأس). أو الإخفاء بـ CSS بشرط الترميز الكامل: `.mh:has([data-open-sym]):has([data-open-word]) [data-open-logo] img { opacity: 0 }` |
| M4 | متوسطة | `story()`: `var M = { x: 0, y: 0 };` (375)، و`onRefresh: safe(function () { M = move(); })` (379)، و`x: function () { return M.x; }` (384) | **جوال القصة يغلط هدفه بعد أي تغيير مقاس.** دالة `fromTo` تنحسب قبل `onRefresh` (§2.1)، فتاخذ مكان الهدف من التخطيط القديم | مؤكد بالتشغيل (R3): على 1440 dx=0، وبعد 1200 dx=−72، و`ScrollTrigger.refresh()` ثاني صلّحه | `x: function () { M = move(); return M.x; }, y: function () { return M.y; }`، و`onRefresh` ما عاد يلزم. **مجرّب على نسخة من `b681c8a1`:** dx=0 وdy=0 بعد 1200 |
| M5 | متوسطة | `story()`: `start: function () { return pinEl.offsetHeight` (377). و`expand()`: `start: 'top top', end` (351) | **القصة المثبتة تنحشر تحت الرأس الثابت.** `'center center'` و`'top top+=24'` ما يحسبون الرأس (64 / 80). والبطل المتوسع يبدأ `'top top'`، يعني أول 64 / 80px منه تحت الرأس. هذا يمكن مقصود مع صورة بعرض الشاشة، **ويحتاج تأكيد من المدير الفني** | مؤكد بالتشغيل (R4، صفحة مصغّرة): أعلى الكتلة 50px، والرأس يخلص عند 81px | `headerH()` مشتركة (PIN-5): `pinEl.offsetHeight < vh() - headerH() - 48 ? 'center center+=' + headerH() / 2 : 'top top+=' + (headerH() + 24)` |
| M6 | متوسطة | `watch()` (59 لـ 69) بمسافة من تحت: 35 (`scanMedia` 268، `scanTint` 297، `scanPhone` 305)، و12 (الظهور 258)، و15 (`scanCheck` 312)، و`.35` للأبواب (324) | **آخر الصفحة ما ينكشف أبداً.** العنصر اللي أعلاه ما يطلع فوق 65% من الشاشة حتى عند أقصى تمرير، يبقى مقصوص (`inset(0 0 100% 0)`)، أو شاشة الجوال مغطاة، أو النص على `opacity 0` | مؤكد بالتشغيل (R7): أعلاه 600 من 900، و`clip-path` يبقى `inset(0% 0% 100%)`. و`clamp(top 65%)` بـ ScrollTrigger اشتغل في نفس الصفحة | عنصر حارس 1px بآخر `body` عليه IntersectionObserver بدون مسافة. لما يبان، كل عنصر ينتظر وهو داخل الشاشة يشتغل. أو ScrollTrigger بـ `start: 'clamp(top 65%)'`، بس هذا يرجّع مشكلة content-visibility (PIN-13) |
| M7 | متوسطة | `expand()` `!c.tall` (337)، و`story()` `if (!c.tall) return;` (364)، و`scanTint`: `if (el.closest('[data-door]…` (295). وCSS 37 | **الشاشات القصيرة ما تلوّن صور البطل والقصة.** تحت 640 (نافذة لابتوب 1280×720، أو جوال بالعرض)، والحركة شغالة: CSS يقص اللون، والبطل والقصة يطلعون بدري، والمسح العادي يتجاهلهم. فالصورة أبيض وأسود للأبد، واللي شغّل «تقليل الحركة» يشوفها ملونة | مؤكد بالتشغيل (R5): 1280×600، و`clip-path: inset(0px 0px 100%)` بعد التمرير للآخر | لما الشاشة قصيرة: مسح عادي (`tintScan`) لصور البطل والقصة، أو `clip-path` النهائي على طول |
| M8 | متوسطة | `g.ticker.lagSmoothing(120, 16)` (34) | **الإعداد لكل الصفحة.** على جوال ضعيف إطاراته فوق 120ms، كل الحركات والـ scrub تبطى بدل ما تقفز | خطر، ما انقاس على جوال ضعيف | يا الافتراضي (500, 33)، يا القيمة الحالية بعد قياس ومكتوبة في `web-motion.md` |
| M9 | متوسطة | التنظيف: `setTimeout(restore, 0)` (439) | **`restore()` المتأخر يمسح شغل الدالة الجديدة.** لو الدالة انعادت (تبدّل شرط الطول)، يمسح اللي رسمته على طول: حالة الطيران، وحركات البطل والقصة. فيصير قفزة لين أول تمرير | مؤكد من الكود (ترتيب `setTimeout` بعد إعادة الدالة المتزامنة). ما صورته | `restore()` بدون تأخير في التنظيف (نفس إصلاح M1) |
| M10 | منخفضة-متوسطة | `opening()`: `onRefreshInit: safe(function () { measure(); place(); })` (160) | **قياس الطيران وقت التثبيت مركّب.** `onRefreshInit` يشتغل قبل ما التثبيت ينفك (§2.1)، فلو صار refresh وقت التثبيت (تغيير مقاس، أو تدوير)، `offsetWidth` ينقرى من التثبيت (عرض ثابت بالبكسل)، ونسخ الطيران تاخذ مقاس قديم | مؤكد من الكود (`_refreshAll` في ScrollTrigger.min.js). ما طلّعته | القياس داخل الدوال (`x`، `y`، `scale`) مع `invalidateOnRefresh` |
| M11 | منخفضة | `depth()`: `var img = $('img', el)` (401) | **البارالاكس يحرك أول صورة بس.** مع الصور بطبقتين (أبيض وأسود، وفوقها `[data-tint]`)، الطبقة الثانية ما تتحرك، فيصير فرق لين 5% وحواف مكررة وقت المسح وبعده | مؤكد من الكود | حرّك غلاف فيه الطبقتين، أو `$$('img', el)` |
| M12 | منخفضة | `stagger: { each: STAG, amount` (259 و311) | **`amount` يغلب `each`:** 10 عناصر تطلع 20ms بينها، مو 60. ما يبان إلا لو المجموعة أكثر من 4 (3 للمضيفين) | مؤكد بـ Node | `stagger: (i) => Math.min(i, MAXG - 1) * STAG` |
| M13 | منخفضة | `var STAG =` (42) فيها `SCRUB = .5`. و`ease: 'power2.in'` (355)، و`'sine.out'` و`'sine.in'` (385 و396). و`IN` معرّف بس ما ينستخدم. ونبض القصة (385) | **التوكنز:** `SCRUB` 0.5، والمدير الفني 0.3. وفيه منحنيات شاذة. ونبض القصة مربوط بالتمرير (مدته تتغير مع السرعة)، والمطلوب 400ms مرة وحدة. `pulses()` (393) يسويها صح للنقاط برّا القصة | مؤكد من الكود (S6) | `SCRUB = .3`، أو قرار مكتوب من المدير الفني. توكن للنبض. ونبض القصة بـ `tl.call` مع فحص الاتجاه (TL-6) |
| M14 | منخفضة | CSS 30 (`.m-kit-cover`)، وCSS 53 (`[data-open-sym], [data-open-word]`) | **`will-change: transform` في غير مكانه:** الغطا يتحرك `clip-path` بس، والرمز والكلمة مرقّين طول الزيارة وهم ما يتحركون بـ transform | مؤكد من الكود (S11) | شيلها، أو خلها وقت الحركة بس |
| M15 | منخفضة | `fail(e)` (20)، و`safe(fn)` (28) | **`fail()` يسوي `mm.revert()` بدون تأخير**، حتى لو انادى من داخل نداءات ScrollTrigger (`onRefreshInit` و`onRefresh` و`onUpdate` و`onToggle`). يعني إرجاع وسط حلقة refresh | خطر، ما طلّعته | FO-4: الكلاسات والـ inline أول شي، و`mm.revert()` بعد `setTimeout(0)` |
| M16 | منخفضة | الدوال اللي ترجع قيم: `x: function () { return R.d` (165)، و`halves` (355)، و`M.x` (384) | **خطأ داخل هالدوال يطلع برّا `safe()`:** GSAP يناديها وقت الرسم، فالخطأ يروح للـ ticker بدون fail-open | خطر | FO-8: `window.addEventListener('error', …)` |
| M17 | منخفضة | التنظيف (439): `$$('.is-live, .is-pinned, .is-on')` | **يشيل الكلاسات من أي عنصر في الصفحة،** و`.is-on` اسم عام. الحين ما ينستخدم برّا الحركة، بس ممكن يجي | مؤكد من الكود | حصره في `[data-story]`، أو سمّه `m-on` |
| M18 | منخفضة | `doors()`: `dr.addEventListener('mouseenter'` (329) | **المستمعين يتكررون مع كل إعادة للدالة وما ينشالون.** شرط `running` يخفي الأثر، بس يبقى تسريب | مؤكد من الكود | `contextSafe`، و`removeEventListener` في التنظيف |
| M19 | منخفضة | `measure` (136 لـ 141): الأرقام 1068.75 و200 و260 و808.75 و47.4. و`hh()` (134) | **ترابط:** نفس أرقام الشعار مكررة في `home.css` (`.h-open-word img`: −32.148% و−45.143% و190.476%). ولو ملف الشعار تغيّر (مجمّد v1.0.0)، الطيران يوصل غلط. و`hh()` يقيس كل `<header>`: لو صف روابط الجوال (48، ما يثبت) صار داخله، التثبيت يبدأ 112px والثابت 64 بس | مؤكد من الكود | ثابت واحد مشترك مع تعليق، وفحص في §11.6 عند المدير الفني. و`headerH()` للجزء الثابت بس (PIN-5) |
| M20 | منخفضة | الطابور: `var next = safe` (81 لـ 87) | **الانتظار في الطابور يخلي الوسائط مقصوصة.** التمرير السريع على كذا وسيط: الأخير يستنى تقريباً 0.9 ثانية لكل واحد قبله، وهو مقصوص. اللمس والزر يكمّلون الحالي، بس التمرير لا | مؤكد من الكود، ما قسته | لما يجي دور عنصر وهو برّا الشاشة: `progress(1)` بدون خط |
| M21 | منخفضة | `var intro = g.timeline` (117 لـ 131) | **مسح البداية برّا الطابور.** لو مسح ثاني بدأ خلال أول 1.7 ثانية، يصير خطين في الشاشة (قاعدة §7 «خط واحد»). بعيد، لأن الفن بارتفاع الشاشة | مؤكد من الكود | البداية أول مهمة في الطابور |
| M22 | منخفضة | `depth()` مع `home.css` السطر 5 (`content-visibility: auto` على `#host، #shop، #how، #pricing، #faq، .h-close، .h-foot-wrap`) | **scrub داخل أقسام عليها `content-visibility`:** `[data-parallax]` داخل `#shop` و`.h-close` (`index.html` 00:18)، وهذا ضد PIN-13 وضد تعليق CSS 82 و83. البناء الكسول يقلل الخطر، بس المكان ممكن يتحرك لما ينرسم قسم فوقه | خطر (الترميز الحالي انتقالي) | لا `content-visibility` على قسم فوق أي pin أو scrub، أو refresh بعد ما ينرسم (دعم `contentvisibilityautostatechange` في المتصفحات غير مؤكد) |
| M23 | معلومة | `field()` (172 لـ 247) | **كلفة الحقل** نزلت كثير (PERF-5)، والباقي قياس على أجهزة حقيقية | R9 | القياس (PERF-11) |

### 7.2 اللي انحل خلال الجولة (للتوثيق)
| # | كان | صار | الدليل |
|---|---|---|---|
| F1 | الطابور كان يبدّل `onComplete` حق كل مسح بـ `tl.eventCallback('onComplete', next)` (السطر 55 في `4977187f`). فخطوط المسح ما تنشال (5 بعد التمرير، و+1 مع كل تحويم على باب، وكل واحد عليه `will-change: transform`)، و`clip-path` يبقى inline | يكمّل القديم (السطر 85) | R1: صفر خطوط، وصفر `clip-path` |
| F2 | `MAXG` 4 للكل | 3 للمضيفين (السطر 42) | المدير الفني §6 |
| F3 | خط المسح الفاتح فيه لمعة (`box-shadow`) | انشالت | §11.4 «رأس خط المسح خط بس، بدون لمعة» |
| F4 | البداية تنعاد لما الشاشة تعبر 1024 | ما تنعاد (`introPlayed`، والعرض انشال من الشروط) | R8 |
| F5 | زر «افتح المثال» مخفي مع السطر | ظاهر من البداية | CSS 47 |
| F6 | `gsap.utils.extend` (انحل في `ac2eff6`) | ما عاد ينستخدم، وهو مو موجود في 3.15 | S1، و`typeof` = undefined |
| F7 | الحقل يرسم كل وحدة مدورة بمسار وتعبئة (لين 4,452 بالإطار على 2×، و5,315 في تشغيل ثاني) | مسار واحد، وتدوير بس من بكسل جهاز | R9 |

---

## 8) غير مؤكد
- **أجهزة حقيقية:** ما انفحص شي على آيفون Safari ولا أندرويد Chrome ولا لابتوب 2× بـ GPU. كل القياس Edge بدون واجهة وبدون GPU، فأرقام الإطارات مؤشر بس.
- **Safari:** ترتيب الأحداث والإرجاع قريته من كود GSAP، وما جربته على Safari.
- **ما طلّعتها بالتشغيل:** M10 (القياس وقت التثبيت)، وM15 وM16 (fail-open داخل GSAP)، وM8 (lagSmoothing على جوال ضعيف)، وM20 (الطابور).
- **صفحتي الجمهور ما انبنت للحين:** البطل المتوسع والقصة انفحصوا على صفحات مصغّرة بنفس الـ hooks، والصفحة الحقيقية تبي نفس الفحص (`--page`).
- **دعم `:has()` و`contentvisibilityautostatechange`:** من معرفتي العامة، ما فحصته في هالجولة.
- **ملاحظة للمدير الفني، مو من GSAP:** §11.2 يطلب وحدة الباركود بزاوية 6%، والباركود النهائي في `index.html` مربعات حادة (`shape-rendering="crispEdges"`). والحقل في الحركة صار حاد عشان يطابقه (تعليق السطر 209). القرار عنده.
- **الملف يتعدل الحين:** غطيت أربع نسخ في ساعة. أي نسخة جاية تنفحص بالأداة، والأرقام في §6.1 تتحدث منها.

## 9) المصادر
- **السكيلز:** `~/.claude/skills/gsap-core/SKILL.md`، و`gsap-scrolltrigger/SKILL.md`، و`gsap-timeline/SKILL.md`، و`gsap-plugins/SKILL.md`، و`gsap-performance/SKILL.md`، و`gsap-utils/SKILL.md`.
- **الكود:**
  - `website/vendor/gsap/gsap.min.js` (3.15.0): `matchMedia.add`، وتغيّر الشروط، و`Context.kill`، و`distribute` (stagger)، و`ticker.lagSmoothing`، والقيم الافتراضية.
  - `ScrollTrigger.min.js` (3.15.0): `_refreshAll`، و`refresh` لكل trigger، و`sort`، و`clamp()`، و`ignoreMobileResize`.
- **الرخصة:** `website/vendor/gsap/LICENSE.md`.
- **قرارات الشركة:**
  - `brief-gm040.md` (GM-039 إلى GM-049).
  - `web-art-director.md`: «الاتجاه 2: فاتح» §7، و«الاتجاه 3» §1 و§3 و§4 و§6 و§10 و§11.
  - `web-copy.md` «الاتجاه 3»، و`builder-phase-b.md`.
- **ui-ux-pro-max:** `references/quick-reference.md` §7، و`data/motion.csv` (#6 و#9).
- **الفحص:** `skills/gsap-checks/` (هالجولة)، والنتيجة 2026-09-28 00:46 على `motion.js` `10c87216` و`motion.css` `b4d99ef4`.
