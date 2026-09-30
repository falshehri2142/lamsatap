
# From anim-svg
1. `signature.css:79` hides `.tl__stand,.tl__ripple` under 768px, and line 64 also hides `.tl__ripple`: the central Tap Lab moment is invisible on mobile. Director decision needed (raised in anim-svg-notes).
2. `.p-sign[data-sign-state="done"]` is set by svg-motion.js at the end of the sequence (label becomes «تم الخروج»). Optional style: `.p-sign[data-sign-state="done"] .p-sign-tap{background:var(--lt-teal-deep)}` — no transition beyond the JS 200ms row crossfade.
3. Tap Lab now animates inline opacity on `.tl__screen`, translate on `.tl__phone` / `[data-tl-stand]`, and scale/opacity on `.tl__ripple`: please do not add CSS transitions on those properties there.

## From anim-scroll (fix round 1, 2026-09-30)
- The remaining load frame at 390 / CPU x4 (200-267ms) and the "scroll" long task the QA sees at CPU x1 (47-73ms; the longtask observer is buffered, so it includes load) are both the page's first Layout. Trace on restaurants at x1: Layout 73ms + UpdateLayoutTree 10ms. The same frame is 217-267ms with GSAP and motion.js blocked (anim-scroll/nojs.cjs), so the cause is page CSS/DOM size, not motion.js. If this gets fixed with `content-visibility: auto`, it must not go on a section with pin or scrub (PIN-13): [data-story], [data-symbol-flight], [data-expand], #tap-lab.
