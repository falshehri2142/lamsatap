# ui-ux-pro-max: الخلاصة للصفحات الثلاث (البوابة، والمطاعم والكافيهات، والمضيفين)

2026-09-28. شغّلت أداة السكيل (`scripts/search.py`) فعلياً على قاعدة بياناتها المحلية (ملفات `data/*.csv` بتاريخ 2026-07-19)، بدون أي طلب شبكة ولا تنزيل.

**الصفحات:** البوابة `website/index.html`، والمطاعم والكافيهات `website/restaurants/index.html`، والمضيفين `website/hosts/index.html`.

**المراجع:**
- `work/2026-09-27-brand-identity/brief-gm040.md`، وتحديثاته اللي فوق (GM-042 إلى GM-047).
- `web-art-director.md` «الاتجاه 3» (من السطر 2180): §4 الصور بطبقتين، و§6 الحركة، و§10 تحديث GM-043 وGM-044، و§7.1 اختيار الصور، و§11 «لغة الشعار في الموقع» (السطر 2568).
- `web-copy.md` «الاتجاه 3» (من السطر 44).
- `builder-phase-b.md`.
- `services/pricing.md`: الحين **GM-045**، يحل محل GM-044.
- `design-system/lamsatap/MASTER.md` وصفحاته في `design-system/lamsatap/pages/`.

**القاعدة:** قرارات الشركة المعتمدة تغلب اقتراحات الأداة العامة: الألوان، والخطوط، والفاتح دايماً، وGM-011، وGM-021.

**علاقته بـ MASTER.md:**
- MASTER هو نظام التصميم المعتمد: انولّد من الأداة، وبعدها انكتب على قراراتنا.
- هالملف يكمّله بأربع أشياء: أهم القواعد، وقائمة فحص تنقاس، والتعارضات، والأوامر.
- ما شغّلت `--persist`، عشان ما ألمس MASTER.

---

## 0) وش طلع من الأداة
| البند | مخرج `--design-system` (motion 9، density 3) |
|---|---|
| نوع المنتج اللي طابقه | Luxury/Premium Brand، بسبب كلمة «premium» في الوصف (أمر 2) |
| النمط | Minimal Single Column: زر واحد كبير، وخط كبير، وفراغ، وبدون زحمة قائمة |
| الستايل | Liquid Glass: زجاج، وblur متحرك، وmorphing. الأداء «Moderate-Poor»، والوصول عليه تحذير في تباين النص |
| الألوان | #18181B و#3F3F46، وزر أزرق #2563EB، والخلفية #FAFAFA، والحد #E4E4E7 («Monochrome + blue accent») |
| الخط | Playfair Display SC + Karla من Google Fonts |
| الحركة (Complex) | Page Transition بـ GSAP Flip، منحنى `expo.inOut`، من 500 لين 800ms |
| المسافات (density 3) | «Spacious»: 4 و8 و24 و32 و48 و64 و96. قريتها من `design_system.py`، لأنها ما تطلع في مخرج markdown |
| تجنّب | Cheap visuals، وFast animations |
| قائمة الفحص حقها | 7 بنود، ودمجتها في القسم 2 |

- **MASTER.md انولّد قبل بـ variance 6.** تشغيلي هذا بدون variance زي ما انطلب، والنتيجة نفس الاتجاه. وحسب جدول «What the tool suggested» في MASTER، الفرق الوحيد اسم الستايل: Liquid Glass بدل Glassmorphism.
- **لما سألت الأداة عن جمهورنا بالاسم:**
  - «restaurant cafe» طلع Bakery/Cafe، ولونه «Warm Brown + Cream». هذا يوافق دفا المطاعم (أمر 31).
  - «short-term rental hospitality» طلع Hotel/Hospitality: ستايل Liquid Glass + Minimalism، ولون «Warm neutrals + Gold». نختلف في اللون، لأن المضيفين تيل بارد (أمر 32).
- **أقرب ستايلين لاتجاهنا في القاعدة (أمر 30):**
  - Swiss Modernism 2.0: 12 عمود، ولمسة وحدة، وبدون زخرفة، وAAA.
  - E-Ink / Paper: ورق وحبر وحبيبات. بس هذا الستايل «بدون حركة»، وهالجزء ما ناخذه.

---

## 1) أهم 20 قاعدة لهالصفحات
الأسماء من `references/quick-reference.md` بالحرف، ومرتبة حسب أولوية السكيل.

| # | القاعدة | الفئة | كيف تنطبق عندنا |
|---|---|---|---|
| 1 | `color-contrast` | 1 الوصول (CRITICAL) | النص حبر #14201F أو رمادي #56625F بس (أقل تباين 5.50 على الرملي الثاني). اللمسة القوية #9A5B00 و#0B7A75 للأيقونات والخطوط بس (4.48 أو أكثر)، والخفيفة #F2A93B و#3FC1B6 ما ينكتب فيها نص أبداً (من 1.73 لين 2.21) |
| 2 | `focus-states` | 1 الوصول | حلقة حبر 3px بمسافة 3px في الصفحات الثلاث (`--lt-focus` تحت `data-lt-scheme="light"`). وفي الباب تنرسم على البطاقة كلها (`:focus-within`)، عشان ما يقصها `overflow: hidden` حق الصورة |
| 3 | `reduced-motion` | 1 الوصول | مع `prefers-reduced-motion: reduce` تطلع الحالة النهائية على طول: الباركود برمزه وLAMSATAP، وشعار الرأس ظاهر، والصور ملونة، وبدون تثبيت ولا scrub ولا مسح |
| 4 | `keyboard-nav` | 1 الوصول | ترتيب Tab مثل القراءة العربية: التخطي، ثم الرأس، ثم البداية، ثم باب المطاعم (يمين) قبل المضيفين. وفي الباقة: وش فيها، ثم السعر، ثم الزر، ثم رابط التليجرام. بدون `tabindex` موجب، وبدون `order` يعكس الشكل عن الكود |
| 5 | `touch-target-size` | 2 اللمس (CRITICAL) | كل رابط وزر 44×44 أو أكثر (صف روابط الجوال 48). حتى الروابط النصية «أو كلمنا على تليجرام» و«كلّمنا عنه على واتساب» تاخذ حشو فوق وتحت. وبين الأهداف 8px أو أكثر (`touch-spacing`) |
| 6 | `progressive-loading` | 3 الأداء | ما فيه شاشة تحميل ولا spinner. h1 الوعد والنصوص من HTML من أول رسم، والفن يتحرك جنبها. وطبقة الأبيض والأسود هي «الهيكل» لين تجهز طبقة اللون (`img.decode()`) |
| 7 | `image-dimension` | 3 الأداء | الطبقتين بنفس القص والأبعاد، والحاوية لها `aspect-ratio` حسب قص §7.1، و`width` و`height` على الصور، فما فيه قفزة (CLS تحت 0.1). وطبقة اللون كسولة، وWebP بمقاسي 800 و1600 تحت حدودها (`lazy-load-below-fold` و`image-optimization`) |
| 8 | `primary-action` | 4 الستايل | زر معبّى واحد بكل شاشة (حبر، زاوية 14). زر الرأس محدد مو معبّى، والتليجرام رابط نصي دايماً (GM-047). وبداية البوابة على الكمبيوتر بدون زر معبّى، لأن الباركود هو الفعل. وعلى الجوال «افتح المثال» هو الأساسي |
| 9 | `consistency` | 4 الستايل | الصفحات الثلاث نفس النظام: الرأس 64 / 80، والقائمة، والتذييل، والتركيز، والزوايا 8 و14 (ولا 999)، والأيقونات بخط 1.75. اللي يتغير بس `data-audience`: لون اللمسة ومزاج الحركة |
| 10 | `horizontal-scroll` | 5 التخطيط | صفر تمرير أفقي على 390 و375 و320. روابط الجوال الثلاث تدخل في 350 (277px على 15px، قياس web-copy)، والفن اللي ينزف للحافة ما يطلع برا الصفحة |
| 11 | `fixed-element-offset` | 5 التخطيط | الرأس ثابت (sticky) بارتفاع 64 / 80، فـ `scroll-padding-top` بارتفاعه مع هامش، عشان `#how` و`../index.html#how` ما يختفون تحته. وصف الجوال الثاني (48) يمشي مع الصفحة |
| 12 | `number-tabular` | 6 الخط واللون | أرقام الأسعار Figtree بـ `tabular-nums`: الرقم وزن 700 والوحدة 400 (§11.3). القيم من `services/pricing.md` بس (GM-045)، وبدون «شامل الضريبة» |
| 13 | `transform-performance` | 7 الحركة | الحركة كلها transform وopacity وclip-path، والحقل على canvas. بدون width ولا height ولا top ولا left ولا `filter: blur`. ومكان خانة الشعار ينقاس مرة وحدة، ومع resize بس |
| 14 | `motion-meaning` | 7 الحركة | كل حركة تقول شي: المسح «الجهاز يقرأ»، والحقل يصير باركود فيه رمزنا «شعارنا هو الباركود»، والطيران للرأس «هذي نحن»، والمسح يلوّن الصورة: دفا المطاعم وضوء المضيفين. ولا حركة زينة تتكرر |
| 15 | `no-blocking-animation` | 7 الحركة | البداية (1.7 ثانية بالكثير) ومسح البابين (2.5 ثانية بالكثير) ما يقفلون التمرير ولا الضغط. بدون `preventDefault` على wheel أو touch، والروابط شغالة وقت الحركة |
| 16 | `interruptible` | 7 الحركة | أي ضغط أو تمرير أو زر كيبورد وقت التسلسل يوديه للحالة النهائية على طول. والمسح ما يعيد نفسه لما يرجع الزائر للقسم، إلا الحركة المربوطة بالتمرير |
| 17 | `excessive-motion` | 7 الحركة | حركة سرد وحدة بكل شاشة، وخط مسح واحد بأي لحظة. المسح يمر على الوسائط بس (صور وباركود وستاند وشاشات)، وما يمر على النص. والتتابع 4 عناصر بالكثير (المضيفين 3) |
| 18 | `shared-element-transition` | 7 الحركة | الرمز وLAMSATAP يطيرون من البداية لخانة الشعار في الرأس بـ transform بس، ويختفون بنفس لحظة ظهور الشعار الحقيقي بدون قفزة (`layout-shift-avoid`). وصورة الباب هي صورة بطل صفحة الجمهور (`continuity`) |
| 19 | `persistent-nav` | 9 التنقل (HIGH) | بدون قائمة مخفية: الروابط الثلاث ظاهرة دايماً (صف ثاني 48 على الجوال). ورابط الصفحة الحالية عليه `aria-current="page"` وخط 2px بلون اللمسة (`nav-state-active`) |
| 20 | `deep-linking` | 9 التنقل | كل صفحة لها رابط مباشر بروابط `index.html` صريحة، تشتغل من file:// ومن `http://localhost:8123`. والإعلان أو رسالة الواتساب يوصلون للصفحة الصح |

**قواعد قريبة ما أخذت رقم، وموجودة في قائمة الفحص تحت:** `heading-hierarchy`، و`skip-links`، و`alt-text`، و`hover-vs-tap`، و`stagger-sequence`، و`duration-timing`، و`viewport-units`، و`color-semantic`، و`icon-style-consistent`، و`z-index-management`.

---

## 2) قائمة الفحص قبل التسليم (كل بند ينقاس)
**دمجت قائمتين:**
- **DS1 إلى DS7:** قائمة مخرج `--design-system`، بالترتيب: emoji، وcursor-pointer، وhover من 150 لين 300ms، وتباين 4.5، والتركيز، وreduced-motion، والمقاسات 375 و768 و1024 و1440.
- **PR:** القائمة «canonical» في `references/pro-rules.md`، بنفس ترتيبها: P للـ Process، وV للـ Visual Quality، وI للـ Interaction، وL للـ Light/Dark، وY للـ Layout، وA للـ Accessibility.
- pro-rules مكتوبة للتطبيقات (native). كيّفتها لصفحة ويب ثابتة، عربية، وفاتحة دايماً. وجدول «مين غطّى وش» في آخر القسم.

**أوامر ui-probe (مرة لكل صفحة):** `<page>` هي `index.html`، ثم `restaurants/index.html`، ثم `hosts/index.html`.
```bash
node "$HOME/.claude/tools/ui-probe.cjs" --serve website <page> --out <scratch>/all   --widths 1440,1024,768,390,375,320
node "$HOME/.claude/tools/ui-probe.cjs" --serve website <page> --out <scratch>/rm    --widths 1440,390 --reduced-motion
node "$HOME/.claude/tools/ui-probe.cjs" --serve website <page> --out <scratch>/dark  --widths 1440,390 --dark
node "$HOME/.claude/tools/ui-probe.cjs" --serve website <page> --out <scratch>/t0    --widths 1440,390 --wait 0
node "$HOME/.claude/tools/ui-probe.cjs" --serve website <page> --out <scratch>/tiles --widths 1440,390 --tiles
```

### 2.1 التجهيز
- [x] **C01 فحص ux قبل البناء:** انعمل في هالجولة (أمر 19). طلع ثلاث نتائج، وكلها داخلة تحت: Loading States في C27، وContinuous Animation في C30، وStacking Context في C10. *(PR-P1)*
- [ ] **C02 مرور أخير:** على §1 لين §3 في `quick-reference.md`، وعلى القواعد العشرين فوق. كل قاعدة تنكتب «تمام» أو «مخالفة وسببها» في رد المطوّر. *(PR-P2)*
- [ ] **C03 أوامر ui-probe الخمس** على الصفحات الثلاث، والمخرجات في مجلد scratch، وملخصها في الرد. *(PR-P3، وPR-P4، وPR-P5، وDS7)*

### 2.2 التخطيط
- [ ] **C04 صفر تمرير أفقي:** ui-probe يطلع `overflowX=0` و`clipped=0` على 1440 و1024 و768 و390 و375 و320. مقاس 320 يعادل تكبير 400% على شاشة 1280 (WCAG 1.4.10). *(`horizontal-scroll`، وDS7، وPR-P3، وPR-Y3)*
- [ ] **C05 الجوال بالعرض 844×390** (من DevTools): الثابت هو الرأس 64 بس، وصف الروابط يمشي مع الصفحة، وكل قسم مثبت يكمل بعده التمرير عادي. *(`orientation-support`، وPR-P3، وPR-Y3)*
- [ ] **C06 الروابط الداخلية تطلع تحت الرأس:** افتح `index.html#how`، ومن صفحة جمهور اضغط «كيف نشتغل». عنوان القسم لازم يطلع كامل تحت الرأس، و`scroll-padding-top` يساوي 64 / 80 أو أكثر. *(`fixed-element-offset`، وPR-Y2)*
- [ ] **C07 الحاوية والحواف والمسافات:**
  - الحاوية 1200، والحواف 20 / 32 / 48، ومسافة الأقسام 72 / 96 / 128 (MASTER).
  - كل مسافة من `--lt-space-*`.
  - القياس: getComputedStyle على 3 أقسام بكل صفحة. *(`spacing-scale`، و`container-width`، وPR-Y4، وPR-Y5)*
- [ ] **C08 طول السطر:** أطول سطر في فقرة 75 حرف بالكثير على 1440، و60 على 390. تعدّه من اللقطة. *(`line-length-control`، وPR-Y6)*
- [ ] **C09 viewport:** القيمة `width=device-width,initial-scale=1`، بدون `maximum-scale` ولا `user-scalable=no`، وبدون `viewport-fit=cover`. *(`viewport-meta`)*
- [ ] **C10 طبقات z-index:** سلّم واضح، والشعار الطاير في طبقة برا القسم المثبت. السبب: `transform` على القسم يسوي stacking context جديد ويحبس الشعار تحت الرأس (نتيجة «Stacking Context» في C01). القياس: 5 لقطات للطيران (0 و25 و50 و75 و100%)، والشعار فوق الرأس فيها كلها. *(`z-index-management`)*
- [ ] **C11 ارتفاع البطل:** بـ `svh` أو `dvh`، و`grep -n "100vh"` على CSS الجديد يطلع صفر. *(`viewport-units`)*

### 2.3 فاتح دايماً والتباين (بدل «Light/Dark Mode» في pro-rules)
- [ ] **C12 المفتاح في صفحات الشركة الخمس:**
  - الصفحات: `index.html` و`restaurants/index.html` و`hosts/index.html` و`demo/review/index.html` و`demo/review/qr-sheet.html`.
  - فيها `<html lang="ar" dir="rtl" data-lt-scheme="light">` و`<meta name="color-scheme" content="only light">`.
  - القياس: `grep -L 'data-lt-scheme="light"'` على الخمس ما يطلع ولا ملف. *(GM-038، وbuilder-phase-b، وPR-L5)*
- [ ] **C13 مناعة الداكن:** لقطات `--dark` نفس لقطات الفاتح: الخلفية #FAF7F2 أو #FFFFFF، والنص #14201F، و`lowContrast=0`. *(بدل PR-P5 وPR-L5)*
- [ ] **C14 تباين النص:** ui-probe يطلع `lowContrast=0` بكل المقاسات. أقل قيمة عندنا 5.50 (الرمادي على الرملي الثاني)، يعني حتى النص الثانوي فوق 4.5، مو 3 بس. *(`color-contrast`، وDS4، وPR-L1، وPR-L2)*
- [ ] **C15 غير النص 3:1 أو أكثر:**
  - اللمسة من 4.48 لين 5.43، وحلقة التركيز 14.48 أو أكثر.
  - حد البطاقات #E4DCD0 (من 1.18 لين 1.36) زينة بس، وما يكون هو اللي يعرّف إن الشي ينضغط. *(`color-accessible-pairs`، وPR-L3، و«Icon Contrast» في pro-rules)*
- [ ] **C16 اللمسة ما تنكتب فيها نصوص:**
  - كل `var(--lt-accent)` على أيقونة أو خط أو مؤشر، مو نص.
  - و`--lt-accent-glow` لذيل المسح بس.
  - القياس: `grep -n "var(--lt-accent" <css الجديد>` ومراجعة كل نتيجة. *(`color-not-only`، وbrief §2)*
- [ ] **C17 ولا لون خام:** `grep -nE "#[0-9A-Fa-f]{3,8}\b" <css الصفحات>`، وكل نتيجة لازم تكون توكن، أو استثناء مكتوب سببه. *(`color-semantic`، وPR-V5)*

### 2.4 التفاعل
- [ ] **C18 أهداف اللمس:** ui-probe يطلع `smallTargets=0` على 390، وأي استثناء ينكتب باسمه وسببه. وبين الأهداف المتجاورة 8px أو أكثر، في صف الجوال والتذييل. *(`touch-target-size`، و`touch-spacing`، وPR-P6، وPR-I2)*
- [ ] **C19 ردة فعل الضغط خلال 150ms** (`--m-press`): الزر `scale(.97)`، وحد الباب يصير حبر، وما يتحرك شي حولهم. القياس: Performance panel، أو تسجيل إطارات. *(`press-feedback`، و`tap-feedback-speed`، وPR-I1، وPR-V4)*
- [ ] **C20 `cursor: pointer`** على كل شي ينضغط، ومنه غطاء الباب (`::after`). *(`cursor-pointer`، وDS2)*
- [ ] **C21 الhover زيادة بس:**
  - كل قواعد hover تحت `@media (hover: hover) and (pointer: fine)`، ومدتها 150ms.
  - الباب ينفتح بضغطة وحدة في محاكاة الجوال.
  - تكبير صورة الباب 600ms استثناء معتمد (القسم 3). *(`hover-vs-tap`، وDS3)*
- [ ] **C22 الواتساب فاضي:**
  - في نسخة تجربة برا المشروع، فضّ رقم الواتساب في `config.js`.
  - الزر وسطر المخاطرة ورابط التليجرام يختفون مع بعض، وصف «في الباقة» يبقى، وما يبقى زر ميت. *(بدل PR-I4 «Disabled states»، وMASTER)*
- [ ] **C23 ولا إيماءات متعارضة:** ولا سحب أفقي. و`grep -n "preventDefault" website/assets/*.js`: ولا نتيجة على wheel أو touchmove. *(`gesture-conflicts`، وPR-I6)*

### 2.5 الحركة
- [ ] **C24 تقليل الحركة:**
  - لقطات `--reduced-motion` فيها الحالة النهائية: الباركود برمزه، وشعار الرأس، والصور ملونة.
  - وفي Console مع محاكاة reduce، الاثنين يطلعون 0: `document.querySelectorAll('.pin-spacer').length` و`(window.ScrollTrigger ? ScrollTrigger.getAll().length : 0)`. *(`reduced-motion`، وDS6، وPR-P4، وPR-A4)*
- [ ] **C25 بدون JS:**
  - من DevTools: Ctrl+Shift+P، ثم «Disable JavaScript»، ثم إعادة تحميل.
  - كل العناوين والنصوص والأزرار ظاهرة، والصور أبيض وأسود، والباركود النهائي، وشعار الرأس.
  - وفي CSS: أي إخفاء (`opacity: 0` أو `clip-path` أو `visibility`) يكون تحت كلاس يحطه JS بس (`.js` أو `.m`). *(brief §4)*
- [ ] **C26 Fail-open:** من DevTools، Network، ثم «Block request URL» على `gsap.min.js`، ثم إعادة تحميل. كل المحتوى لازم يبان خلال ثانية. *(MASTER)*
- [ ] **C27 أول إطار:** لقطة `--wait 0` فيها h1 كامل مقروء. وعنصر LCP هو h1 أو صورة البطل، ومو مخفي بـ `opacity: 0`. *(`progressive-loading`، وbrief §4)*
- [ ] **C28 سلاسة 60fps:**
  - Performance panel بـ CPU 4× slowdown، ومرّر الصفحة كلها. ولا مهمة أطول من 50ms وقت التمرير (الاتجاه 2 «فاتح» §7).
  - أو في Console قبل التمرير:
    `new PerformanceObserver(l=>l.getEntries().forEach(e=>console.log('long task',Math.round(e.duration)))).observe({type:'longtask',buffered:true})`
  - *(`main-thread-budget`)*
- [ ] **C29 CLS تحت 0.1، والطيران للرأس صفر:**
  - في Console قبل التمرير:
    `let cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)cls+=e.value}).observe({type:'layout-shift',buffered:true})`
  - وبعد ما تمرر الصفحة كلها، اكتب `cls`.
  - *(`layout-shift-avoid`، و`content-jumping`، و«CLS < 0.1» في SKILL.md)*
- [ ] **C30 الممنوع في الكود يطلع صفر** (والنتيجة اللي في تعليق مو كود تنكتب وتنعدّى):
  `grep -nE "filter: *blur|backdrop-filter|transition: *(all|width|height|top|left)|infinite|repeat: *-1|SplitText" website/assets/motion.js website/assets/motion.css website/assets/site.css website/assets/home.css <css الجديد>`
  *(`transform-performance`، و«Continuous Animation» في C01)*
- [ ] **C31 التثبيت:** `document.querySelectorAll('.pin-spacer').length` يطلع 1 أو أقل في البوابة، و2 أو أقل في صفحة الجمهور. *(قالب GSAP: «Don't pin more than 1-2 sections»)*
- [ ] **C32 المدد من التوكنز:**
  - الضغط 150 (`--m-press`)، والأكورديون 240 (`--m-acc`)، والظهور 600 (`--m-rise`، والمضيفين 750).
  - الخروج من 60 لين 70% من الدخول.
  - المسح من 700 لين 900ms، والمضيفين من 900 لين 1100.
  - البداية 1.7 ثانية بالكثير، والبابين 2.5 بالكثير.
  - القياس: إطارات بوقت. *(`duration-timing` بقيمنا، و`motion-consistency`، و`exit-faster-than-enter`، وPR-I3)*
- [ ] **C33 خط مسح واحد، وما يمر على النص:** إطارات كل 100ms على البابين والقصة. بكل إطار خط واحد بس، وولا مرة فوق نص. والتتابع 60ms و4 عناصر بالكثير (المضيفين 3). *(`excessive-motion`، و`stagger-sequence` بقيمنا)*
- [ ] **C34 المقاطعة:** وقت البداية أو مسح البابين، مرّر أو اضغط أو Tab. الحركة تروح للحالة النهائية على طول، والتمرير ما يوقف أبداً. *(`interruptible`، و`no-blocking-animation`)*
- [ ] **C35 النبض مرة وحدة:** نقطة الستاند في المطاعم من 1 لـ 1.08 وترجع، في 400ms، مرة لكل حدث. وما فيه نبض في المضيفين. *(الاتجاه 3 §6)*
- [ ] **C36 صفحات الزبون بدون GSAP:** `grep -rl "gsap" website/templates website/demo --include=*.html | grep -v "demo/review"` ما يطلع ولا ملف. *(GM-011)*

### 2.6 الوصول
- [ ] **C37 العناوين:** h1 وحدة بكل صفحة (`document.querySelectorAll('h1').length` يطلع 1)، وبدون قفز مستويات في قائمة العناوين من ui-probe. *(`heading-hierarchy`)*
- [ ] **C38 رابط التخطي:** `.s-skip` «انتقل للمحتوى» أول شي يوصله Tab، و`#main` موجود بالصفحات الثلاث. *(`skip-links`)*
- [ ] **C39 ترتيب Tab يطابق الشكل من اليمين:** Tab على الصفحة كلها، وولا `tabindex` موجب، وكل `order` أو `row-reverse` في CSS له سبب. *(`keyboard-nav`، وPR-I5)*
- [ ] **C40 التركيز ظاهر، وما يختفي تحت الرأس:** الحلقة ظاهرة على كل عنصر، وولا عنصر عليه التركيز يختفي كامل تحت الرأس الثابت (WCAG 2.2، البند 2.4.11). *(`focus-states`، وDS5، وPR-Y2)*
- [ ] **C41 الأسماء:**
  - ui-probe يطلع `unnamedControls=0`.
  - الصور الزخرفية `alt=""`، والأيقونات اللي جنب نص `aria-hidden="true"`، وتعليقات الحركة «امسح» و«أو قرّب» `aria-hidden`.
  - الباركود: له اسم، أو مخفي ومعه بديل نصي. هذا قرار مفتوح (آخر الملف). *(`alt-text`، و`aria-labels`، وPR-A1، وPR-I5)*
- [ ] **C42 الأسئلة:** `<details>` و`<summary>`، و8 بالكثير. تنفتح بـ Enter وSpace، وحركتها 240ms تنشال مع تقليل الحركة. *(`progressive-disclosure`، و`state-transition`)*
- [ ] **C43 اللون مو الدليل الوحيد:** رابط الصفحة الحالية فيه `aria-current="page"` وخط 2px، وعلامات الصح أيقونة ومعها نص. *(`color-not-only`، و`nav-state-active`، وPR-A3)*
- [ ] **C44 التكبير:** تكبير المتصفح 200% على شاشة 1280، وولا نص مقصوص ولا متداخل (WCAG 1.4.4). *(بدل «Dynamic Type» في PR-P4 وPR-A4)*

### 2.7 الشكل والهوية
- [ ] **C45 ولا emoji ولا رموز كأيقونات** (ولا ✓ ولا ✦ ولا ✨). علامات الصح SVG. الأمر لازم يطلع صفر:
  `LC_ALL=C.UTF-8 grep -nP "[\x{2600}-\x{27BF}\x{2B50}\x{1F300}-\x{1FAFF}]" website/index.html website/restaurants/index.html website/hosts/index.html`
  *(`no-emoji-icons`، وDS1، وPR-V1، و§11.4)*
- [ ] **C46 الأيقونات عائلة وحدة:** `grep -ho 'stroke-width="[^"]*"' <الصفحات الثلاث> | sort | uniq -c` يطلع 1.75 بس. والأطراف مدورة، وبدون تعبئة إلا الشعار. *(`icon-style-consistent`، وPR-V2)*
- [ ] **C47 ملفات الشعار ما تغيرت** (من مجلد `website/`، وكل سطر لازم يطلع OK):
  ```bash
  cd assets/brand && for f in logo-horizontal.svg logo-stack.svg logo-stack-since.svg favicon.svg apple-touch-icon.png; do grep -q "$(sha256sum "$f" | cut -d' ' -f1)  web/$f" ../../../brand/logo/v1.0.0/MANIFEST.txt && echo "OK $f" || echo "CHANGED $f"; done
  ```
  - **قارن بـ `MANIFEST.txt`، مو بملفات `brand/logo/v1.0.0/web/`.** Git على ويندوز حوّل `favicon.svg` هناك لـ CRLF، فيختلف بايت واحد وهو سليم.
  - جربت الأمر اليوم: الخمسة OK، و`website/favicon.ico` بعد OK. *(PR-V3، وGM-042)*
- [ ] **C48 مقاس الشعار وفراغه (§11.5):** الرأس 32 / 40 وفراغ 16 / 20، والتذييل 120 / 160 وفراغ 40 / 48. وقائمة §11.6 العشر كلها تمام. *(PR-V3، وGM-036)*
- [ ] **C49 الزوايا (§11.1):**
  - الأزرار 14، والبطاقات والصور داخل التخطيط 8، والصور على الحافة 0، والبابين زاويتهم الكبيرة بمكانها.
  - `grep -nE "border-radius: *(999|9999)" <css الصفحات>` يطلع صفر. *(`consistency`، و`effects-match-style`)*
- [ ] **C50 ولا ظل ولا تدرج زينة:** `grep -nE "box-shadow|linear-gradient|radial-gradient" <css الصفحات>`، وكل نتيجة لذيل المسح أو لها سبب مكتوب. *(`elevation-consistent`، وGM-038)*
- [ ] **C51 الأوزان (§11.3):** العناوين 500، وأرقام الأسعار 700، ووحداتها 400. تنقاس بـ getComputedStyle. *(`weight-hierarchy`)*

### 2.8 RTL: الأداة ما تغطيه
**الدليل:**
- كلمة RTL طلعت صفر في `ux` و`web` و`--stack html-tailwind` (أوامر 12 و13 و14).
- إعادة البحث بكلمات أوسع جابت نتائج ما لها علاقة (أمر 15).
- RTL في القاعدة كلها موجود بس في صفوف الخطوط: Arabic Elegant وHebrew Modern في typography، وكلمة بحث (عمود Keywords) للخطوط العربية والعبرية في google-fonts.
- يعني الأداة تعرف خطوط RTL، وما تعرف تخطيطه.

**فالبنود تحت من عندنا، مو من الأداة.** مصدرها قرارات المشروع (مكتوبة جنب كل بند)، أو ممارسة CSS المعروفة (W3C Internationalization وMDN). وما فتحت هالمراجع اليوم، لأن ممنوع أي طلب شبكة.

- [ ] **C52 الاتجاه:** `<html lang="ar" dir="rtl">` بالصفحات الثلاث. واللاتيني داخل النص (LAMSATAP وروابط t.me) يكون بـ `dir="ltr"` أو `<bdi>`.
- [ ] **C53 خصائص منطقية في CSS الجديد:** `margin-inline-*` و`padding-inline-*` و`inset-inline-*` و`text-align: start`. القياس: `grep -nE "(margin|padding)-(left|right)|[^-](left|right):|text-align: *(left|right)" <css الجديد>`، وكل نتيجة لها سبب (مثل الفن اللي ينزف لليسار).
- [ ] **C54 الأرقام مع الكلام بترتيبها الصح على 390:** «1,211 ريال»، و«49.5 ريال»، و«من 9 الصبح لين 11 الليل»، ورقم الجوال. تشوفها في اللقطة. والأرقام لاتينية زي web-copy.
- [ ] **C55 الأيقونات اللي لها اتجاه تنعكس:** الأسهم والـ chevrons بـ `scaleX(-1)` تحت `[dir="rtl"]`. واللي ما لها اتجاه ما تنعكس: الكوب، والمفتاح، والواي فاي، والصح.
- [ ] **C56 العربي ما ينقسم ولا يتباعد:** ولا `letter-spacing` على نص عربي، ولا تقسيم لحروف أو كلمات في الحركة (خط أحمر في الاتجاه 2 «فاتح» §7).
- [ ] **C57 اتجاه الحركة:** المسح من فوق لتحت، وهذا ما يتأثر بالاتجاه. وأي حركة أفقية تبدأ من اليمين، إلا كشف LAMSATAP من اليسار لأنها لاتيني (الاتجاه 3 §6).
- [ ] **C58 طيران الشعار:** الهدف خانة الشعار الحقيقية في الرأس، وهي يمين في RTL. تنقاس بـ `getBoundingClientRect`، وما تنكتب رقم ثابت.
- [ ] **C59 زوايا البابين (§11.1):**
  - الكمبيوتر: باب المطاعم (يمين) زاويته الكبيرة فوق يمين، والمضيفين (يسار) فوق يسار.
  - الجوال: المطاعم فوق يمين، والمضيفين تحت يسار.
  - القياس: `getComputedStyle(door).borderRadius`.
- [ ] **C60 ترتيب الشبكة:** في RTL أول عمود يمين. فـ «النص يمين 5 أعمدة، والفن يسار 7» يطلع من ترتيب الكود نفسه، بدون `order`.
- [ ] **C61 التمرير الأفقي في RTL يطلع يسار:** ui-probe يقيس على صندوق الصفحة، ومكتوب فيه إنه يحسب حساب RTL. فـ `overflowX=0` يكفي.

### 2.9 المحتوى والأسعار
- [ ] **C62 الأسعار من `services/pricing.md` بس:**
  - الحين GM-045: المطاعم 1,211 والتجديد 798. المضيفين 49.5 و544.5، ومن 5 وحدات 39.5 و434.5.
  - وأسعار GM-044 تطلع صفر في الموقع، وهذا شرط المدير العام في `goal.md`:
  `grep -rnoE --include=*.html --include=*.js --exclude-dir=vendor "1,199|(^|[^0-9.,])(790|539|429)([^0-9.]|$)|(^|[^0-9.])(49|39)(\s|&nbsp;)?(ريال|<)" website/`
- [ ] **C63 كل صفحة أسعارها بس:** البوابة ما فيها «ريال» أبداً. المطاعم بدون 49.5 و39.5 و544.5 و434.5، والمضيفين بدون 1,211 و798.
- [ ] **C64 «شامل الضريبة» يطلع صفر:** `grep -rn "شامل الضريبة" website/`.
- [ ] **C65 النطاق (GM-043):** الأمرين يطلعون صفر:
  - `grep -nE "عياد|حلاق|صالون|ورشة" website/index.html website/restaurants/index.html website/hosts/index.html`
  - `grep -rn "shops" website/ tools/` (من builder-phase-b).
- [ ] **C66 زر معبّى واحد بكل شاشة:** لقطات `--tiles` على 390 و1440، وعدد الأزرار المعبّاة بكل لقطة 1 أو أقل. *(`primary-action`)*
- [ ] **C67 النصوص من web-copy «الاتجاه 3» بالحرف.** ورابط التليجرام ووعد الرد من GM-046 وGM-047.

### ما ينطبق علينا، وليش
- **N/A1، الـ scrim من 40 لين 60%** (PR-L4): ما فيه نافذة منبثقة ولا قائمة مخفية.
- **N/A2، الحواف الآمنة والنوتش** (PR-P6 وPR-Y1): ما نستخدم `viewport-fit=cover`، فالمتصفح يحفظ الحواف لحاله. ولو انضاف يوم، لازم `env(safe-area-inset-*)`.
- **N/A3، النماذج** (PR-A2، والفئة 8 كلها): ما عندنا نماذج، والتواصل واتساب وتليجرام.
- **N/A4، Dynamic Type واللمس الاهتزازي:** هذي للتطبيقات، وبديلها C44.

### مين غطّى وش
| بند المصدر | وين في قائمتنا |
|---|---|
| DS1 (emoji) | C45 |
| DS2 (cursor-pointer) | C20 |
| DS3 (hover من 150 لين 300ms) | C21، والاستثناء في القسم 3 |
| DS4 (تباين 4.5) | C14 |
| DS5 (التركيز) | C40 |
| DS6 (reduced-motion) | C24 |
| DS7 (375 و768 و1024 و1440) | C04 |
| PR-P1 (فحص ux) | C01، انعمل |
| PR-P2 (§1 لين §3) | C02 |
| PR-P3 (375 والعرض) | C04 وC05 |
| PR-P4 (تقليل الحركة وDynamic Type) | C24 وC44 |
| PR-P5 (تباين الداكن) | C13، صار فحص مناعة |
| PR-P6 (44 والحواف الآمنة) | C18 وN/A2 |
| PR-V1 (emoji) | C45 |
| PR-V2 (عائلة الأيقونات) | C46 |
| PR-V3 (الشعار الرسمي وفراغه) | C47 وC48 |
| PR-V4 (الضغط ما يحرك التخطيط) | C19 |
| PR-V5 (التوكنز) | C17 |
| PR-I1 (ردة فعل الضغط) | C19 |
| PR-I2 (44 و48) | C18 |
| PR-I3 (من 150 لين 300ms) | C32 |
| PR-I4 (المعطّل) | C22 |
| PR-I5 (ترتيب القارئ والأسماء) | C39 وC41 |
| PR-I6 (تعارض الإيماءات) | C23 |
| PR-L1 وPR-L2 (النص الأساسي والثانوي) | C14 |
| PR-L3 (الحدود والحالات) | C15 |
| PR-L4 (scrim) | N/A1 |
| PR-L5 (الوضعين) | C12 وC13 |
| PR-Y1 (الحواف الآمنة) | N/A2 |
| PR-Y2 (المحتوى تحت الرأس) | C06 وC40 |
| PR-Y3 (المقاسات والعرض) | C04 وC05 |
| PR-Y4 وPR-Y5 (الحواف ونظام 4/8) | C07 |
| PR-Y6 (طول السطر) | C08 |
| PR-A1 (أسماء الصور والأيقونات) | C41 |
| PR-A2 (النماذج) | N/A3 |
| PR-A3 (اللون مو الدليل الوحيد) | C43 |
| PR-A4 (تقليل الحركة والتكبير بدون كسر) | C24 وC44 |

---

## 3) التعارض بين الأداة والمعتمد

### 3.1 تعارض، والمعتمد يغلب في كل الصفوف
| # | الأداة قالت | المعتمد عندنا | المصدر |
|---|---|---|---|
| 1 | ستايل Liquid Glass: زجاج وblur وmorphing وألوان قزحية. أداؤه «Moderate-Poor»، ووصوله عليه تحذير | ورق وحبر، فاتح ومسطح. العمق من حدود 1px ومن الصور، بدون ظل ولا تدرج ولا blur | GM-038، والاتجاه 2 «فاتح» §1 و§7، وMASTER |
| 2 | نمط Minimal Single Column: زر واحد وبدون قائمة | بوابة ببابين وصفحتين، ورأس ثابت فيه 3 روابط. ناخذ من النمط: الخط الكبير، والفراغ، والزر الأساسي الواحد | GM-040، وGM-043، وbrief §1 |
| 3 | الألوان #18181B وزر أزرق #2563EB على #FAFAFA | حبر #14201F، ورملي #FAF7F2 و#F3EEE6، وأبيض، ولمسة لكل جمهور بدون نص (#9A5B00 و#0B7A75) | GM-020، وGM-039، وGM-040، و`tokens.css` |
| 4 | الخط Playfair Display SC + Karla من Google Fonts بـ `@import` | Readex Pro + Figtree («LT Latin») بملفات WOFF محلية. Playfair وKarla ما فيهم عربي أصلاً (أمر 33 و35)، وزوج الأداة العربي الوحيد (Noto Naskh + Noto Sans Arabic) ما نستخدمه | الاتجاه 2 §6 (قرار Figtree)، وbuilder-phase-b («بدون طلبات خارجية»)، وGM-006 (كل شي يشتغل محلياً) |
| 5 | حركة Page Transition بـ GSAP Flip عند تغيير route | صفحات ثابتة بدون route. عندنا GSAP 3.15 core وScrollTrigger بس، وFlip مو موجود وتنزيله يبي موافقة. الطيران للرأس transform مربوط بالتمرير | `website/vendor/gsap/LICENSE.md`، وMASTER |
| 6 | مؤثرات morphing و`backdrop-filter`، وانتقالات من 400 لين 600ms | transform وopacity وclip-path بس، والـ blur ممنوع | الاتجاه 2 «فاتح» §7 |
| 7 | التتابع من 30 لين 50ms (`stagger-sequence`)، وقوالب GSAP لين 8 عناصر | 60ms و4 عناصر بالكثير (المضيفين 3) | الاتجاه 2 «فاتح» §7، والاتجاه 3 §6 |
| 8 | تتابع «Complex» بـ SplitText حرف حرف مع rotateX | ممنوع تقسيم العربي لحروف أو كلمات. وSplitText مو عندنا، وكلام الأداة إنه «مدفوع» غير مؤكد وما يهمنا | الاتجاه 2 «فاتح» §7 |
| 9 | `duration-timing`: لا تزيد عن 500ms، والـ hover من 150 لين 300ms | المسح من 700 لين 900ms (المضيفين لين 1100)، والبداية 1.7 ثانية، والبابين 2.5، وتكبير صورة الباب 600ms. يغلب المعتمد لأنها سرد مو ردة فعل، بشرط `no-blocking-animation` و`interruptible`. وردة الفعل نفسها 150ms | الاتجاه 2 «فاتح» §7، والاتجاه 3 §3 و§6 |
| 10 | قالب GSAP: scrub من 0.5 لين 1.5 | تنعيم 0.3 ثانية | الاتجاه 2 «فاتح» §7، والاتجاه 3 §6 |
| 11 | الباقات: 3 مستويات، وشارة «الأكثر طلباً»، وخصم سنوي من 20 لين 30%، وجدول مقارنة، وزر ثابت في القائمة | باقة وحدة بكل صفحة (ومعها شريط المحافظ للمضيفين). بدون شارة لأن ما عندنا بيانات. والسنوي بسعر 11 شهر، يعني أقل بـ 8.3%. وزر الرأس محدد | GM-040، وGM-045، والاتجاه 2 «فاتح» §4 |
| 12 | الثقة: آراء عملاء وشعاراتهم ودراسات حالة | ما عندنا عملاء للحين، فلا آراء ولا شعارات مخترعة. الثقة من وعود حقيقية: التجربة أسبوعين، والعتاد والتركيب علينا، وبدون دفع مقدم، والتجديد بتأكيد صريح، والرد خلال ساعة | `services/pricing.md`، وGM-046 |
| 13 | عرض المنتج بفيديو يشتغل لحاله | بدون فيديو، بصورنا المرخصة | GM-037 |
| 14 | القصة: كل فصل بلون، ومعها مؤشر تقدّم | لمسة وحدة بكل صفحة، وبدون مؤشر تقدّم لأنه مو في التصميم المعتمد | الاتجاه 3 §2 و§5 |
| 15 | الستايل يدعم الداكن، و`dark-mode-pairing`، وpro-rules تقول افحص الوضعين | صفحات الشركة فاتحة دايماً، وفحص الداكن صار فحص مناعة (C13). وصفحات الزبون لها داكنها، وهي برا هالصفحات | GM-038، وGM-011، وGM-023 |
| 16 | الأيقونات من Heroicons أو Lucide | SVG داخل الصفحة من عائلتنا: خط 1.75، وأطراف مدورة، وبدون تعبئة، وبدون مكتبة | §11.3 |
| 17 | الضيافة: Liquid Glass، ولون «Warm neutrals + Gold» | المضيفين تيل بارد #0B7A75، وضوء نظيف | brief §2، والاتجاه 3 §2 |

### 3.2 الأداة توافقنا، وهذا يثبت القرار
- **ألوان «Luxury/Premium Brand»** (#1C1917 وذهبي #A16207 على #FAFAF9) نفس فكرة لوحتنا: حبر، وزعفران محروق، ورملي (أمر 25).
- **«Bakery/Cafe: Warm Brown + Cream»** نفس دفا المطاعم (أمر 31).
- **«Enterprise Gateway: Path selection (I am a…)»** هي فكرة البابين «عندي مطعم أو كافيه» و«عندي شقق أو إيجار قصير» (أمر 5).
- **«Cheap visuals» و«Fast animations» ممنوعة:** نفس طلب صاحب المشروع «high quality animation».
- **قالب GSAP «ثبّت قسم أو قسمين بالكثير»:** عندنا البوابة 1، وصفحة الجمهور 2 (C31).
- **«Continuous Animation: للتحميل بس»:** نفس منعنا للحركة اللي تتكرر للأبد.
- **«Buttons 7:1+»:** زرنا الحبر والكتابة البيضاء بتباين 16.72.
- **Density 3 «Spacious»:** نفس فراغنا الواسع (72 / 96 / 128).
- **الخطوط:** Readex Pro فيه `arabic`، وFigtree فيه `latin` و`latin-ext` بس (أمر 28 و29). وهذا سبب `unicode-range` في `tokens.css`: Figtree ما يرسم عربي أبداً.

### 3.3 تكييف لموقع ثابت عربي (مو تعارض)
- **«Sticky Navigation: حط `padding-top` للـ body»:** هذا للرأس `fixed`. رأسنا `sticky` وياخذ مكانه، فنحتاج `scroll-padding-top` بس (C06).
- **«Smooth Scroll»:** بـ CSS بس، ويرجع `auto` مع تقليل الحركة (موجود في `site.css`)، وبدون مكتبة تمرير.
- **«Loading States: skeleton أو spinner»:** ما عندنا تحميل غير الصور، والأبيض والأسود هو الهيكل.
- **«Number Formatting: 1,234»:** فاصل الآلاف في 1,211، وبدون اختصار زي 1.2K للفلوس.
- **«Motion Sensitivity» (مثاله السيئ `ScrollTrigger.create()` بدون فحص):** كل ScrollTrigger داخل `gsap.matchMedia()` بشرط `no-preference`.
- **pro-rules مكتوبة للتطبيقات:** كيّفتها في القسم 2 (الحواف الآمنة، والـ scrim، وDynamic Type).

---

## 4) الأوامر اللي شغلتها بالضبط
**أداة السكيل:**
- كلها بـ Python 3.12.10.
- مخرجاتها انحفظت مؤقتاً في scratchpad الجلسة (`uupm/01` لين `uupm/35`).
- الأداة بحث BM25 بدون عشوائية، فنفس الأمر يرجع نفس النتيجة ما دامت ملفات `data/` نفسها.

```bash
# 1) نظام التصميم (مرة وحدة)
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "NFC QR tap service for restaurants cafes and short-term rental hosts, Saudi, premium light monochrome, scan motion" --design-system --motion 9 --density 3 -p "LamsaTap" -f markdown
# 2) وش نوع المنتج اللي طابقه نفس الوصف
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "NFC QR tap service for restaurants cafes and short-term rental hosts, Saudi, premium light monochrome, scan motion" --domain product -n 1
# 3 إلى 6) landing: البطل، والأسعار، والبوابة لجمهورين، والقصة
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "hero product demo storytelling" --domain landing -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "pricing plans tiers subscription trial" --domain landing -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "two audience segment gateway choose path split" --domain landing -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "storytelling-driven scroll narrative sections" --domain landing -n 2 --full
# 7 إلى 11) ux: التنقل والرأس الثابت، وبطاقات الأسعار، والأسئلة (صفر، ثم إعادة بكلمات ثانية)
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "navigation sticky header anchor scroll offset" --domain ux -n 5 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "pricing cards price numbers" --domain ux -n 4 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "FAQ accordion expand collapse" --domain ux -n 4 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "progressive disclosure content toggle" --domain ux -n 4 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "card hover state cursor button" --domain ux -n 5 --full
# 12 إلى 15) RTL (صفر في الثلاث، والإعادة ما لها علاقة)
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "RTL right-to-left Arabic bidi mirroring" --domain ux -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "rtl arabic direction" --domain web -n 3
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "rtl arabic direction logical properties" --stack html-tailwind -n 3
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "language localization internationalization i18n text direction" --domain ux -n 3 --full
# 16 إلى 21) ux: الحركة، وتقليل الحركة، واللمس، وفحص pro-rules، والوصول، والصور والخطوط
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "animation duration easing transform performance" --domain ux -n 6 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "reduced motion prefers-reduced-motion vestibular" --domain ux -n 4 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "touch target size tap spacing mobile" --domain ux -n 5 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "animation accessibility z-index loading" --domain ux
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "focus keyboard skip link heading hierarchy" --domain ux -n 5
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "image optimization webp lazy layout shift font loading" --domain ux -n 5
# 22 إلى 24) gsap: التثبيت وscrub، والتتابع، والكشف
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "pin scrub scroll pinned section" --domain gsap -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "stagger list entrance sequence" --domain gsap -n 3 --full
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "reveal mask clip viewport enter" --domain gsap -n 3 --full
# 25) color
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "light premium black monochrome" --domain color -n 3 --full
# 26 إلى 29) الخط: قواعد الزوج بس، لأن الخط ثابت
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Readex Pro Figtree" --domain typography -n 3
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "arabic RTL bilingual modern" --domain typography -n 2
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Readex Pro" --domain google-fonts -n 1
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Figtree" --domain google-fonts -n 1
# 30 إلى 32) أقرب ستايل لاتجاهنا، والجمهورين بالاسم
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "minimal monochrome editorial swiss typography whitespace" --domain style -n 3
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "restaurant cafe menu QR ordering" --domain product -n 1
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "short-term rental host guest guidebook hospitality" --domain product -n 1
# 33 إلى 35) خطوط الأداة فيها عربي؟ (34 طلع Karla Tamil بالغلط، و35 جاب Karla نفسه)
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Playfair Display SC" --domain google-fonts -n 1
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Karla" --domain google-fonts -n 1
python "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts/search.py" "Karla" --domain google-fonts -n 5
```

**أوامر مساعدة (مو من الأداة):**
```bash
# تغطية القاعدة: الأكورديون وRTL والعربي و i18n
cd "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/data"
grep -il "accordion" *.csv stacks/*.csv                 # icons و landing و shadcn بس، ولا قاعدة ux
grep -il "<details\|details>" *.csv stacks/*.csv        # صفر
grep -ilw "rtl" *.csv stacks/*.csv                      # google-fonts و typography بس
grep -il "right-to-left" *.csv stacks/*.csv             # صفر
grep -il "arabic" *.csv stacks/*.csv | grep -v google-fonts   # typography بس
grep -il 'dir=' *.csv stacks/*.csv                      # صفر
grep -il "margin-inline\|padding-inline\|inset-inline\|logical propert" *.csv stacks/*.csv   # صفر
grep -il "i18n\|locali[sz]" *.csv stacks/*.csv          # nuxt-ui و nuxtjs و uno بس
grep -inw "rtl" typography.csv | cut -c1-400; grep -in "arabic" typography.csv | cut -c1-600; grep -icw "rtl" google-fonts.csv; grep -in "accordion" landing.csv | cut -c1-300

# قائمة قوالب GSAP الـ 16
python -c "
import csv
rows=list(csv.DictReader(open('motion.csv',encoding='utf-8')))
print(len(rows), list(rows[0].keys()))
for r in rows: print('-', r.get('No') or '', '|', r['Category'], '|', r['Intensity Tier'], '|', r['Trigger'], '|', r['Duration'], '|', r['Easing'])
"

# سلّم مسافات density 3 (ما يطلع في مخرج markdown)
cd "C:/Users/TechTroniX/.claude/skills/ui-ux-pro-max/scripts"
grep -n "density\|spacing\|space-" design_system.py | head -60
sed -n 30,75p design_system.py; sed -n 200,330p design_system.py

# التباين بمعادلة WCAG
python - <<'EOF'
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
bgs={'white #FFFFFF':'#FFFFFF','sand #FAF7F2':'#FAF7F2','sand2 #F3EEE6':'#F3EEE6'}
fgs={'ink #14201F':'#14201F','gray #56625F':'#56625F','burnt-saffron #9A5B00':'#9A5B00','teal #0B7A75':'#0B7A75','saffron-light #F2A93B':'#F2A93B','sea-light #3FC1B6':'#3FC1B6','border #E4DCD0':'#E4DCD0','tool-accent-gold #A16207':'#A16207','tool-blue #2563EB':'#2563EB'}
for fn,f in fgs.items():
    print(fn.ljust(26), '  '.join(f"{bn.split()[0]}={cr(f,b):.2f}" for bn,b in bgs.items()))
print('white on ink (button text):', round(cr('#FFFFFF','#14201F'),2))
print('ink on selection #E4DCD0:', round(cr('#14201F','#E4DCD0'),2))
EOF
# طلع نفس أرقام المدير الفني: الحبر 16.72 و15.64 و14.48، والرمادي 6.35 و5.94 و5.50،
# والزعفران المحروق 5.43 و5.08 و4.70، والتيل 5.18 و4.85 و4.48، والزعفران الخفيف 2.00 و1.87 و1.73،
# والبحر 2.21 و2.07 و1.91، والحد 1.36 و1.27 و1.18، والأبيض على الحبر 16.72

# وجربت ثلاث أوامر من قائمة الفحص:
# C47 (ملفات الشعار): الخمسة OK، و website/favicon.ico بعد OK
# C62 (أسعار GM-044): صفر الحين، لأن الصفحتين ما انبنوا للحين
# C45 (emoji): على ملف تجربة فيه ✓ و✦ و🚀، والتقطهم الثلاثة
```

**محاولة فحص «بدون JS» بمتصفح headless (ما نجحت):**
- جربت `msedge --headless=new --blink-settings=scriptEnabled=false --dump-dom <file:///…/website/index.html>`: رجع فاضي، لأن `--dump-dom` نفسه يحتاج JS.
- و`--dump-dom` بدون تعطيل JS رجع `<html … class="js m">`. يعني الطريقة نفسها شغالة، والمشكلة في تعطيل JS بس.
- وجربت `--screenshot` بثلاث صيغ للمسار، وما طلع ملف على هالجهاز. وفي وحدة منها طلع خطأ إن مسار بروفايل Edge داخل scratchpad طويل.
- **فالفحص الحين يدوي من DevTools (C25).**

---

## غير مؤكد، والباقي
- **RTL:** قائمة C52 لين C61 من عندنا، مو من الأداة. الأداة ما فيها ولا قاعدة تخطيط RTL.
- **الأسئلة والباقات:** ما فيه قاعدة أكورديون في الأداة (صفر، حتى بعد إعادة البحث). ولبطاقات الأسعار فيه قاعدة وحدة بس (Number Formatting). فمشيت على قواعد عامة: `progressive-disclosure` و`state-transition` و`keyboard-nav`، ومعها الاتجاه 2 «فاتح» §4.
- **أرقام الأداة اللي بدون مصدر ما استخدمتها كحقائق:** مثل «Narrative increases time-on-page 3x»، و«Annual discount 20-30%»، و«SplitText مدفوع».
- **على جهاز حقيقي ما انجرب للحين:** سلاسة القصص المثبتة على جوال متوسط، ومسح الباركود بكاميرا جوال. jsQR فحص برمجي بس.
- **ملاحظات على ملفات غيري (ما عدلت فيها شي):**
  - `brief-gm040.md` فوق، في قسم GM-044، للحين فيه 1,199 و790 و49 و39 و539 و429. و`services/pricing.md` صار GM-045. المدير العام يحدّث الموجز.
  - `web-copy.md` يقول ما فيه «امسحه» تحت باركود البوابة، لأن الدومين مؤقت. بس الموجز §4، والاتجاه 3 §3، و`design-system/lamsatap/pages/gateway.md` فيهم «امسحه بجوالك». هذا يحتاج قرار.
  - باركود البوابة على الكمبيوتر ما له بديل ينضغط، ولا يوصله الكيبورد. اقتراح حسب `gesture-alternative` و`keyboard-nav`: رابط نصي ثانوي مثل «أو افتحه هنا» (كان في الاتجاه 2 «فاتح» §5)، أو الباركود نفسه يصير رابط. والاسم المقروء للباركود يحتاج نص من web-copy.
  - `website/assets/motion.js` وقت القراءة فيه `SCRUB = .5`، والمعتمد 0.3. الموضوع بين web-motion والمدير الفني.
  - `website/index.html` وقت القراءة فيه `<meta name="color-scheme" content="light dark">`، وما فيه `data-lt-scheme` على `<html>`. هذا من بنود web-brand للمطوّر في المرحلة ب.
  - نص رابط التليجرام ومكان وعد الرد ما دخلوا `web-copy.md` «الاتجاه 3» للحين. الموجز يعطي «أو كلمنا على تليجرام».
- **فحص «بدون JS»:** ui-probe ما فيه خيار له، ومحاولة Edge ما نجحت (القسم 4). فالفحص يدوي للحين.
- **الفحص الثلاثي على هالملف ما انعمل مني:** هالمحادثة الفرعية ما فيها أداة تشغيل وكلاء. فحصت بنفسي الأرقام والأسماء: كل أسماء القواعد موجودة في `quick-reference.md` مرة وحدة بالضبط، والتباين انحسب بمعادلة WCAG، وثلاث أوامر من القائمة جربتها. والباقي على رئيس القسم قبل التسليم لصاحب المشروع.
- **سكيل `website-design` ما حدثته:** فيه وكلاء ثانيين يعدلونه الحين. رئيس القسم يضيف له سطر يودّي لهالملف.
