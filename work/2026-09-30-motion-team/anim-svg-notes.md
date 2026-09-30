# anim-svg notes, motion-team 2026-09-30

## What changed
- `website/assets/signature.js` (Tap Lab): rewrote `play()` as the brief §4 timeline.
- `website/assets/svg-motion.js` (new, 3026 B raw / about 1.5 KB gzip): the `.p-sign` sequence and the NFC arc draw.
- Requests: `requests-anim-scroll.md` (script tag and `?v=`) and `requests-anim-micro.md` (bottom section "From anim-svg").

## Tasks
1. **Tap Lab choreography: done.**
   - Steps: out (0–150ms, `expo.in`), meet (0–240ms, `power2.inOut`, x −12px toward the stand), tap (at 170ms: ripple 480ms `power2.out` scale .6→1.6 and opacity .5→0; stand lifts 2px and settles), open (400–640ms: page layer fades in `expo.out`; phone returns on `back.out(1.2)`).
   - Total is 650ms. `data-state` goes approach → tap → open.
   - A new click calls `stop()`, which kills the timeline, `killTweensOf`, cancels the WAAPI animations and clears pending timeouts. Four clicks 100ms apart give exactly 1 ripple, and the final state is the last tab, open.
   - Reduced motion is read on every play. It gives the instant final state with no ripple.
   - Evidence: `anim-svg/seq.cjs`, `anim-svg/seq.out.json`, `anim-svg/shots/tl-*`, `anim-svg/nogsap.cjs` (WAAPI path) and `anim-svg/frames/home/`.
   - Deviations from the rules:
     - Tweens inside the timeline use `overwrite:false` plus `immediateRender:false`. With `overwrite:true`, later steps on the same target killed the earlier ones (measured). `stop()` gives the same guarantee.
     - The fade targets the iframe/poster, not `.tl__screen`. Fading `.tl__screen` showed the ink phone body (a black screen).
2. **`.p-sign`: done in code, not yet live** because the script tag is still pending with anim-scroll.
   - Trigger: `IntersectionObserver` at the equivalent of `top 75%`, once.
   - Sequence: the frame rises (y 20→0, 750ms `expo.out`, no opacity hide so there is no flash, and the CSS rotate(-1.5deg) is kept). At +300ms, one ripple (the `.is-tap` class that anim-micro's CSS already defines) and the arc draw. At +780ms, `.p-sign-row` crossfades (100+100ms), the label becomes «تم الخروج», and `data-sign-state="done"` is set.
   - Replays on click, and on mouse `pointerenter`. It is ignored while running. No repeat.
   - Reduced motion and no IntersectionObserver show "done" directly.
   - Evidence: `anim-svg/shots/sign-*` (from 600ms at 1440 and 900ms at 390 the state is done), `sign-nogsap-390.png`, `sign-nojs-390.png`, `anim-svg/frames/hosts/`. The script was injected for these tests.
3. **NFC waves: partial.**
   - Stroke-dash draw on the arcs of `.p-sign-tap` with `pathLength=1`, 300ms each (240×K), 60ms stagger, once per play. The dash is set by JS only, so the arcs are visible with JS off.
   - Two gaps:
     - The markup has 2 arcs in ONE `<path>` (plus the phone rect), not 3 separate arcs, so they draw as one path. Changing the markup is anim-scroll's (HTML).
     - `stroke-dashoffset` is not a transform. The brief allowed it for this small SVG, but it has not been measured.
4. **Logo: done.** No new logo motion was added.
5. **svg-motion.js <3KB: done** (3026 B). `node tools/build-dist.cjs` passes with no budget change, and `dist/` was deleted afterwards. The file loads on hosts only once anim-scroll adds the tag.

## Checks
- `ls website/vendor/gsap/` shows 3 files.
- The plugin grep (DrawSVG/MorphSVG/MotionPath/CustomEase/SplitText/repeat) is empty.
- Console errors: 0 in all runs.

## Open issues
- The Tap Lab stand and ripple are hidden below 768px (`signature.css:79`, and `:64` for the ripple), so the central moment is phone-only on mobile. The director needs to decide. This is raised with anim-micro.
- `back.out(1.2)` versus the CSS spring match is not confirmed.
- The WAAPI path leaves `fill:forwards` animations on the phone, stand and ripple (all at their rest values). This is harmless, but not cleaned up.
