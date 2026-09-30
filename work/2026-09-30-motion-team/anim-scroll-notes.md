# anim-scroll notes (2026-09-30)

## Tasks
1. Home: done. `data-reveal="stagger"` on `#contact .h-contact-layout` (head + actions). `.h-doors` is already animated by `doors()` (`[data-door]` rise + tint scan), so I added no second hook there, because a double opacity tween would conflict.
2. Restaurants: done.
   - `.r-cards` has `data-reveal="stagger"` (3 cards).
   - `#faq .s-faq` and `.r-ask` each have `data-reveal`.
   - `.r-close-cta` has `data-reveal`.
   - The plan card now uses `data-reveal="rise"`, so the price stays at opacity 1.
   - `#demo` media already uses `productReveals()`, now on tokens.
   - The pin count is still 1 at 1440 and 0 at 390.
3. Hosts: partial.
   - `.p-calc` has `data-reveal="rise"`. It moves on y only, so the price is at opacity 1 in every frame (minPrice = 1). The stepper worked after the reveal ran (3→4); a click during the 600ms reveal was not tested.
   - `.p-faq-list`, `.p-ask` and `.p-close-cta` each have `data-reveal`.
   - `.p-sign` has `data-sign-motion`.
   - The `svg-motion.js` tag was NOT added because the file does not exist yet, and the tag would 404. See `requests-anim-svg.md`.
4. Hero / PS=1.12: settled. It is inside `expand()`, which returns early for `[data-expand-inline]`. Both expand heroes (restaurants, hosts) are inline, so `PS` is dead code on every page and no background gets scaled. Even when it was active, it was a product-fit scale capped at min(1.12, fit) that went back to 1, not a background scale. I left it in place (dead). The symbol flight is unchanged. CLS was not measured.
5. Mobile first: done. The new reveals use `watch()` and run once. Fonts trigger `ST.refresh()` (already there), and ScrollTrigger refreshes on window load by default. After the resize run 1440→1200→390, 0 elements are left hidden.
6. Timing: done. `productReveals` changed from 28px/.975/.95s/power3.out to RISE/T.rise/OUT/stag(). The editorial media changed from power2.out/scrub .5 to 'none'/SCRUB. The story phone changed from power2.out to OUT. With that, run.cjs S6 shows PASS.

## motion.js changes
- `reveals()`: new `data-reveal="rise"` variant (y only, no opacity).
- `editorialStory` media tween: `ease: 'none'`, `scrub: SCRUB`.
- `productReveals()`: tokens as listed in task 6.
- `story()` phone: `ease: OUT`.
- `?v=motion-team-20260930-1` on motion.js in all 3 pages.

## Evidence (anim-scroll/)
- shots/: full pages, all modes, frames.json. In reduce mode: html `js`, 0 tweens, 0 pins. In normal mode: pins ≤ 1.
- sec-plan/, sec-faq/, sec-contact/: section frames at 0,20,40,60,80,100.
- check-scroll.cjs and check-scroll.out.json:
  - 0 console errors, 0 hidden elements at the end in every page, width and mode.
  - minPrice 1.
  - After the resize run, the hosts page scrollY moved 35px at 1200 (existing behaviour, not fixed).
- run.cjs S: PASS 10, FAIL 0, INFO 2.
- check.js: 262/262.
- build-dist passes, and dist/ was deleted.

## Fix round 1 (2026-09-30), port 8931
Scripts in anim-scroll/: perf.cjs, trace.cjs, nojs.cjs, mline.cjs, resize.cjs, motion-check.copy.cjs (a copy of the QA script so qa/ outputs stay untouched).
- mm.add: the hero (opening, expand, symbolFlight) stays in the same task. The other 7 sections each run in their own task through idle() (requestIdleCallback with a 200ms timeout, else setTimeout 16). gen cancels the remaining steps on revert. The last step runs ST.sort() + ST.refresh() once and restores keepY. The #hash fix waits for setupDone. motion.js evaluation in the load task dropped from 92ms to 36ms (hosts, x4).
- reveals() flush: 8 per frame (batch.splice), and the rest go to the next rAF.
- drop() and scanTl(): the scan line is removed on onComplete and onInterrupt (reveal, tintScan, and the hover line). tintWhenSeen: go runs once (done flag). The story line sl is in the DOM only while the story is pinned (slOn in onToggle). M10 mline = 0 on the 3 pages at 390 and 1440.
- Scroll path: the measurements were already in the value functions. The x1 scroll trace has no main task of 20ms or more (restaurants and hosts) and none of 40ms or more anywhere. The 51-72ms in M6 is the first Layout at load (buffered observer), not scrolling.
- Load at 390 / x4 is still 200-267ms. The page is 217-267ms even without GSAP (first Layout 88-139ms). Request sent to anim-micro.
- ?v= motion-team-20260930-1 on the files that were asked for, plus svg-motion.js on hosts. motion.js is -2 on the 3 pages.
- hosts resize from 1440 to 1200 (mid-page and mid-story): drift 0px. home: 10px (the anchor is a whole section).
- Copied QA: 51/58. M1-M3 PASS, CLS <= 0.0006, pins 0/1/1. Failures: M5 (load, above) and M11 focus (.s-door-link, and an INPUT at opacity 0 on hosts). M11 is not mine.

## Fix round 2 (2026-09-30), port 8931
1. M9 reading position: done.
   - motion.js, at the end before `d.fonts`: ScrollTrigger's own resize refresh is off (`ST.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' })`).
   - The anchor is `elementFromPoint` at the screen centre plus its top. It is read 150ms after scrolling stops and after each refresh that is not a resize, never inside the scroll callback.
   - On resize: debounce 200ms, then one `ST.refresh()`, then `scrollBy` back to the anchor if it moved more than 1px.
   - The pin is the same at 1440 and 1200 (desk() >= 1024), and the anchor absorbs any pin-spacing difference.
   - m9.cjs (same steps as the M9 in qa/motion-check.js): home 0px, restaurants 0px, hosts 0px. No horizontal scroll at 1200, 390 or 844x390, 0 hidden at 390, 0 errors. Two runs.
   - resize.cjs drift numbers are larger on home and hosts "half" because that script anchors to the whole `section` (closest), not to the element under the centre.
2. Scroll path / PERF-11 (signal):
   - Callbacks were checked: flightState, editorialStory onUpdate and story onUpdate have no layout reads (measurements are in the value functions). Below-fold setup already runs in idle() steps (round 1).
   - scrollperf.cjs, home 390: CPU x4 max 67-98ms in 11 of 12 runs (one outlier at 117-128). CPU x1: 0 long tasks in all runs. The long task is at scrollY 900, when Tap Lab enters the view. The profile shows `(program)` (render/paint), not motion.js JS. Not confirmed which asset causes it.
   - Size: hosts had grown to 343.9 KiB. expand() (`[data-expand]:not([data-expand-inline])`) matched no page, so it was removed as dead code. build-dist now reports hosts at 334.0 KiB / gzip 103.5 (was 342.9). dist/ deleted.
- ?v=motion-team-20260930-3 on motion.js in the 3 pages.
- run.cjs S: PASS 10, FAIL 0, INFO 2. frames (shots-r2): reduce shows html `js` with 0 tweens and 0 pins, normal pins at most 1.
- Copied QA 51/58, the same failures as round 1: M5 load (and a home scroll task of 80ms, which is > 50 at x4) and M11 (.s-door-link, hosts INPUT). Neither is mine.

## Fix round 4 (2026-09-30), port 8941
Scripts in anim-scroll/r4/: m9b.cjs (3 positions, both directions, normal/reduce), scrollperf.cjs (CPU x4, 390, longtask, 12 runs), qa-copy.cjs (current qa/motion-check.js).
1. M9 hosts, real cause: the anchor was read with getBoundingClientRect 150ms after the scroll stopped, while a reveal tween (y: 20 on an ancestor, `.p-calc` card) was still running. The saved offset included the transform (7px), so after the refresh the correction was short by that amount. The pin was not the cause (same result mid-story, and reduce = 0 only because reduce has no reveal transforms).
   - Fix (motion.js, the M9 block before `d.fonts`): `lay(e)` = layout offset from the offsetTop chain (ignores transforms). If an ancestor is position:fixed (pinned mid-story), it falls back to getBoundingClientRect. It is used for both saving and restoring.
   - Before (normal mode): hosts calc +7/+6, mid +7/+6, FAQ +12/+11 px (1440->1200 / 1200->1440). Reduce: 0.
   - After: hosts calc -1/0, mid -1/-1, FAQ 0/-1, story (y 2700, pinned) 0/0. Restaurants: 0 to ±1. Home: 0. QA M9 copy: jump 0 on all 3 pages.
2. M5 restaurants: scroll long tasks at CPU x4 and 390 were 0 in 12/12 runs before any M5 change, and 0 in the QA copy ([]). The 113ms from QA round 3 did not reproduce.
   - The triggers are already built after first paint, in idle() steps.
   - Reveals are already one batched path (IO -> one rAF flush, 8 per frame). No layout read in show: the IO entry rect is used.
   - will-change is only set while moving (fly, camera, words).
   - Not changed to ScrollTrigger.batch: it would add N triggers and more refresh work. That is a regression risk for a problem that is already at 0.
   - Load frames (restaurants 6 >33ms, max 250) are still the page's own first layout (round 1 finding) and not the scroll path.
3. Regression (qa-copy): M1/M2/M3/M7/M10/PROPS PASS 6/6. M8 40/40/48 ms. M9 PASS 3/3. Home scroll long task 78ms (same as round 3's 74, render/paint). M11 is not mine. Total 51/58, the same failures as before except M9 is now PASS.
- run.cjs S: PASS 10, FAIL 0, INFO 2. build-dist passes without budget changes, and dist/ was deleted. ?v=motion-team-20260930-4 on motion.js in the 3 pages.
