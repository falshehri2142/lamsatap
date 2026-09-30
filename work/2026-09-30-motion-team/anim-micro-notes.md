# anim-micro: ملاحظات 2026-09-30

| # | المهمة | الحالة | الدليل |
|---|---|---|---|
| 1 | `--m-spring` في `motion.css :root`، و`--tl-spring: var(--m-spring)` | تم | motion.css:16، signature.css:2 |
| 2 | الأزرار (`.lt-btn` و`.h-nav-action` و`.s-head-wa` و`.tl__open` و`.a-text-link` و`.r/.p-lab-link`): المرور −1px في 150ms، الضغط .98، الرجوع 240ms على `--m-spring`، والحلقة teal-deep 2px/3px. اللون صار فوري (يغلب انتقال اللون في site.css) | تم | anim-micro/states.json |
| 3 | الكروت (`.s-door` و`.h-pick a`): −2px تحت (hover:hover). الظل ثابت، ولا فيه box-shadow يتحرك. الظل على `::after` بالشفافية للحاسبة و`.tl__opt` بس، لأن `.s-door` فيه overflow:hidden | تم، مع اختلاف بسيط | states/indexhtml_-h-doors* |
| 4 | مؤشر تبويب المختبر: `::before` من `aria-selected`، يدخل بـ scale .94→1 في 240ms على spring، ويطلع في 100ms. الضغط السريع 10 مرات: تبويب واحد بس مختار | تم | states.json، `rapid: taplab` |
| 5 | مفتاح الأسعار: المؤشر يتحرك translateX في 240ms على `--m-acc-ease`، معكوس للـ RTL من site.css. الرقم يتبدل فوري مع ظهور بالشفافية .4→1 في 150ms، بدون تدحرج ولا FLIP. الحاسبة نفس الشي على `[data-total]` بس، والضغط السريع يلغي الظهور اللي قبله | تم | `rapid: price` و`rapid: calc`: الشفافية 1 والقيمة موجودة |
| 6 | الأكورديون: 240ms، بدون height tween، وينطفي مع تقليل الحركة. الأيقونة +→− بـ scaleY، مو سهم يدور 180° (التصميم الحالي علامة زائد) | جزئي | motion.css |
| 7 | الرأس: ما يختفي ولا ينضغط، فيه ظل بالشفافية بس. ما فيه شي ينحل هنا | ما يحتاج | – |
| 8 | تقليل الحركة: كل transition/transform على العناصر اللي تنضغط ينطفي، والحالة تبقى | تم | states.json (reduce) |
| + | `.p-sign-tap`: انشال النبض اللانهائي، وانضافت موجة مرة وحدة بـ `.is-tap` | تم | requests-anim-svg.md |

## الفحوص
- `states.js`: 80 صف، و0 أخطاء في الكونسول.
- motion-frames: `anim-micro/shots` و`shots2`، بكل الأوضاع.
- `check.js`: 262/262.
- `build-dist`: نجح، وانحذف dist.
- grep على `transition: all`: فاضي.
- grep على box-shadow/color في ملفاتي: فاضي.

## جولة الإصلاح 1: hosts (المنفذ 8932)
شغّلت نسخة من `qa/motion-check.js` على `/hosts/` بس، وضفت لها فحص BILL.
- **M10**: فشل. `.m-line` = 1 عند 390 و1440، بعد التمرير و5 ثواني انتظار. `run` = 0، و`hidden` = 0. الإصلاح عند anim-scroll في `motion.js` (score-round-1 البند 1)، وملفي ما يقدر يصلحه.
- **M5** (390، CPU×4): فشل. عند التحميل maxF 467ms، وفيه 3 إطارات فوق 33ms. وقت التمرير ولا long task. هذا مؤشر بس، لأن Chromium شغال بدون GPU.
- **M6** (معلومة): 390: layout 15 وstyle 154، وlong tasks 64 و55ms. 1440: layout 13 وstyle 130، وlong tasks 74 و61ms. ولا خطأ في الكونسول.
- **M11**: يطلع FAIL على `INPUT` (op 0). السبب إن الفحص يقرأ الـ radio المخفي، وهو مخفي عمداً. الحلقة نفسها ظاهرة على الـ span الأخ `.p-calc-bill input:focus-visible + span`، وقيمتها solid 2px rgb(7,94,90) مع offset 3px. تأكدت منها في 390 و1440، بالحركة العادية وتقليل الحركة، بعد ArrowLeft. واللقطات في `anim-micro/states/bill-focus-*.png`. الإطار على الـ label نفسه = none، وهذا متوقع. **طلب لـ anim-perf-qa**: M11 يقرأ `input + span` لما يكون الـ input شفاف.
- **motion-frames**: شغّلته بالأوضاع الثلاثة، والنتيجة في `anim-micro/shots3` (91 ملف)، وكل الصفحات ok.

## الجولة 2، إعادة القياس (anim-micro، منفذ 8932)
- motion-check.js (نسخة مؤقتة فيها executablePath=/opt/pw-browsers/chromium، لأن الأصل يطلب headless_shell-1243 وهو مو موجود): 51 PASS.
- **M9** (1440→1200): PASS في الصفحات الثلاث، القفزة 0px (الرئيسية top 135، ما فيه تمرير أفقي).
- **M5** (390، CPU×4): لسا FAIL كمؤشر. التحميل maxF: الرئيسية 300ms (إطار واحد فوق 33ms، ومهمة 73ms وقت التمرير، كانت 104)، المطاعم 250ms (5)، المضيفين 283ms (5). Chromium بدون GPU، فالنتيجة غير مؤكدة على أجهزة حقيقية.
- **M11**: `A.s-door-link` بدون حلقة تركيز في الرئيسية (390 و1440)، و`INPUT` بشفافية 0 في المضيفين. لسا مفتوحة.
- site-wow check.js: 262/262. build-dist نجح بدون رفع الحدود، وانحذف dist/.
