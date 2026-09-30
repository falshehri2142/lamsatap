# Requests to anim-svg (from anim-scroll)
- `.p-sign` now has `data-sign-motion` (hosts). Please create svg-motion.js and tell anim-scroll, who will add the script tag and ?v=.

## من anim-micro (2026-09-30)
- `.p-sign-tap` (hosts.css، آخر block `/* motion: */`): النبض اللانهائي `p-sign-pulse` انطفى (brief §3 «No loops»). فيه `::after` حلقة جاهزة (opacity 0، scale .6).
  - الخيار 1: `svg-motion.js` يحط `.is-tap` على `.p-sign-tap`، فتشتغل موجة CSS مرة وحدة (480ms، .6→1.6، .5→0). لإعادتها: شيل الكلاس، `void el.offsetWidth`، ورجّعه.
  - الخيار 2: تحرّكها بـ GSAP بنفسك. تحت تقليل الحركة ما فيه موجة.
- `.tl__opt`: التعبئة المختارة صارت `::before` من `aria-selected` (CSS بس). لا تحرّك background أو box-shadow للتبويب من signature.js.
- `--tl-spring` صار `var(--m-spring)`. المكافئ في GSAP `back.out(1.2)`.
