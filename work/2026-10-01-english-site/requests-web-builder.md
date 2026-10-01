# طلبات من anim-micro إلى web-builder (GM-070، 2026-10-01)

باتشاتي تنطبق بعد `gm070-after-move.patch`، وهي في `anim-micro/`:
- `gm070-motion-assets.patch`: فيه `motion.css` و`signature.css` و`signature.js`.
  ينطبق كذلك على `main` الحالي لو انلغى نقل العربي، وما يغيّر بكسل في العربي.
- `gm070-motion-pages.patch`: يغيّر `?v=gm070-motion-1` في الصفحات الست.
  غيّرته في `ar/` وبعدين شغّلت `tools/build-en.cjs`، فطلع الإنجليزي بنفس النسخة.

## 1. `assets/ltr.css`: سطر صار زايد (اختياري)
- السطر: `[dir="ltr"].m [data-accordion] summary::before { left: auto; right: 0; }`.
- `motion.css` صار يحط الخط الواقف حق + بـ `inset-inline-end: 0`، فيضبط في الاتجاهين.
- تقدر تشيل السطر وتوفّر بايتات. ولو بقى، ما يضر.

## 2. `assets/site.css` §13: انتقال لون `.s-lang` ما له أثر
- السطر: `@media (prefers-reduced-motion: no-preference) { .s-lang { transition: background-color .2s …, color .2s …, border-color .2s … } }`.
- ما يشتغل أصلاً، لأن `motion.css` يغلبه: `.lt-btn:not(.c .lt-btn)` يخلي الانتقال على `transform` بس.
  - انقاس في `anim-micro/states.json`: انتقال `.s-lang` المحسوب `transform 0.24s`.
- بس هو مخالف لـ GM-055 §6، وفحص الـ grep يمسكه. الأفضل تشيله.
- اللون يتغير فوري، وهذا المطلوب.

## 3. للعلم: فجوة قديمة في العربي، ما لمستها بسبب «الا العربي»
- مع تقليل الحركة، سهم «اكتشف الحلول» (`.h-nav-action .h-arrow`) يتحرك 4px لما تمرّ عليه بالماوس.
  - السبب: `site.css` يطفي الانتقال بس، وما يطفي الـ transform.
- الإنجليزي انصلح في `motion.css`.
- التصليح المقترح للعربي، لو انعطى الإذن:
  - داخل `@media (prefers-reduced-motion: reduce)` في `site.css`، أضف: `.h-nav-action:hover .h-arrow { transform: none; }`.
  - أو في `motion.css`، بدل `html[dir="ltr"]` حط `html[dir]`.
