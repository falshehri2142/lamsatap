# Motion brief: motion-team 2026-09-30 (anim-director, binding)

## 0. Audit (real scroll, motion-frames.cjs, port 8901, shots in anim-director/shots/)
| Page | ScrollTriggers | Pins | Finding |
|---|---|---|---|
| home | 5 | 0 | Hero symbol flight + #how are wired. #solutions (.h-doors) and #contact (.h-ask) have NO reveal hooks, so the page goes flat after Tap Lab. Tap Lab tabs work (signature.js), and the ripple/stand have no choreography tied to the tab change. |
| restaurants | 3 | 1 (desktop only) | Editorial story pin is OK. #demo, #plan, #faq and .r-close are mostly static. There are only 3 data-reveal hooks. |
| hosts | 2 | 1 | Only the story is wired. The calculator (.p-calc), plan, FAQ, close and the «نظافة بعد الخروج» flow (.p-sign) have no motion. The price at 50% scroll is static, which is correct. |
| all, reduce | 0 | 0 | Final state is shown, which is correct. |
| all, nogsap | - | - | Content is fully visible, which is correct. |
Verdict now: home 7, restaurants 7, hosts 6. The weakest item on every page is "craft": dead zones in mid and late scroll.
Open check: motion.js:483 `PS = 1.12` (expand hero). anim-scroll must prove it is not a background scale(1.12) (lesson 2026-09-29). If it is, remove it.

## 1. Thesis (one central moment per page)
Story: phone comes close → tap → the page opens.
- **home:** Tap Lab (#tap-lab). Choosing a tab makes the phone meet the stand, a ripple fires, and the screen opens. This explains "one tap = your page".
- **restaurants:** the editorial story (#experience). The camera moves calmly and each step lights its progress tick. This explains "the customer sees the menu without waiting".
- **hosts:** the checkout sign (.p-sign). The tap zone answers a tap once and the row turns to "done". This explains "the guest confirms checkout, and cleaning is booked".
Everything else is quiet support: reveals only.

## 2. Tokens (source: motion.js `var T`, motion.css :root, signature.css .tl, gsap.md §3.1)
| Token | Value | GSAP | CSS | Use |
|---|---|---|---|---|
| press | 150ms | - | --m-press, ease-out | hover/active/focus |
| acc | 240ms | - | --m-acc, --m-acc-ease cubic-bezier(.2,0,0,1) | accordion, price switch |
| fade | 200ms×K | power1.out | - | small fades |
| draw | 240ms×K | power2.out | - | stroke draw per path |
| rise | 600ms×K, 20px (RISE) | expo.out (quint.out in CALM) | --m-rise, --m-out cubic-bezier(.16,1,.3,1) | section reveal |
| scan | 800ms×K (700–900 by height) | quad.inOut | - | media clip reveal (existing only) |
| exit | 65% of enter (expo.in) | expo.in / power2.in | --m-in cubic-bezier(.7,0,.84,0) | leaving, tab swap out |
| **spring (NEW name, existing value)** | cubic-bezier(.2,.9,.25,1.15) | `CustomEase` is forbidden, so GSAP uses `back.out(1.2)`; the CSS value is kept | **--m-spring** in motion.css :root (alias of --tl-spring, signature.css). Source: signature.css:2 | press release, tab pill, phone-meets-stand settle. Max overshoot is about 3%. Never on text or prices. |
| ripple | 480ms, scale .6→1.6, opacity .5→0 | power2.out | - | one ripple per tap event |
| stagger | 60ms, max 4 items (3 on hosts) | stag() | --i × 60ms | lists/cards |
| scrub | 0.3 | SCRUB | - | pinned story |
K = 1 (1.25 on hosts, existing). Enter uses out-curves. Exit is 65% of enter and uses in-curves. A tab swap is exit (150ms) followed by enter (240ms). No motion longer than 900ms except scrubbed ones.

## 3. Never moves (reject on sight)
- Paragraphs, prices, .trust lines, forms, and every heading. Headings are visible from the first frame. A reveal may move the section's card or media, never the text block.
- Hero: stand, LAMSATAP wordmark and QR stay put. Only the symbol flies to the header.
- No data-story-ring/data-story-card. No scan/pulse on the phone or stand inside the editorial story. No scale(1.12) on backgrounds.
- No loops of any kind (this includes the .p-sign "demo loop": it plays once on view, then only replays on tap/hover). No cursor-follow, magnetic, tilt, confetti, marquee, typewriter, scramble, blur-in, ScrollSmoother, normalizeScroll, or scroll-jacking.
- Counters show approved numbers only (config.js/pricing, calculator math). No count-up on prices. The calculator total changes instantly (a crossfade ≤150ms is allowed).
- The logo geometry is frozen. Transform may only translate or scale it uniformly. No skew, no new color.
- Arabic is never split into letters or words. letter-spacing stays 0. Horizontal motion is mirrored in RTL (enter from inline-end, i.e. use x:+ for "from right").
- Pins: at most 1 per page. Hosts and restaurants keep their story pin. Home has none, and no new pins anywhere.

## 4. Sequencing
- **Hero (all 3):** the page shows at first paint. The symbol flight is unchanged (label `lift` at 0.35s, rise 600ms expo.out). The header CTA gets a fade of 200ms after the flight, and only its opacity changes.
- **Section reveal (default):** trigger `top 85%`, once. Media or card: y 20→0, opacity 0→1, 600ms expo.out. Children stagger 60ms, max 4. Text inside is not animated.
- **Tap Lab:** label `out` (current screen opacity →0, 150ms expo.in), `meet` (phone x toward the stand 12px, 240ms power2.inOut), `tap` (ripple 480ms plus a stand micro-lift of 2px y), `open` (new screen fade in 240ms expo.out plus phone settle with back.out(1.2)). Total ≤ 650ms. Tabs stay clickable throughout, and a new click kills the timeline (interruptible, `overwrite:'auto'`).
- **Restaurants story:** unchanged structure, scrub .3. The ticks fill with scaleX (transform-origin right in RTL).
- **Hosts cleaning flow (.p-sign):** on view (top 75%, once): the frame rises (600ms), then at +300ms the tap zone `.p-sign-tap` does one ripple (480ms), then the `.p-sign-row` "done" state switches at +780ms (opacity crossfade 200ms). On tap or hover it replays the same timeline. It never auto-repeats.
- **Calculator:** the card reveals like the default. The unit stepper and switch use the micro tokens. The total value has no motion beyond an optional 150ms opacity crossfade.

## 5. File ownership (disjoint)
| Owner | Files |
|---|---|
| anim-scroll | website/assets/motion.js; data-* motion hooks and `?v=` query strings in the 3 pages (the only agent editing the 3 HTML files) |
| anim-micro | website/assets/motion.css, website/assets/signature.css, app.js (price toggle only), hosts-smart.js (animation only), and a final `/* motion: */` block at the END of home.css, restaurants.css and hosts.css |
| anim-svg | website/assets/signature.js; the new website/assets/svg-motion.js; motion attributes inside assets/illustrations/*.svg |
| anim-perf-qa | work/2026-09-30-motion-team/qa/ only |
Shared-edit requests go to work/2026-09-30-motion-team/requests-<owner>.md:
- The svg-motion.js `<script>` tag (hosts only, and home if needed) is added by **anim-scroll** at the request of anim-svg.
- CSS for the SVG states (.p-sign-tap ripple, .tl__ripple) is written by **anim-micro** at the request of anim-svg.
- The `--m-spring` token is created by **anim-micro**.

## 6. Tasks

### anim-scroll
1. **Home reveals:** add `data-reveal="stagger"` to the .h-doors card list (#solutions) and to the #contact card/actions. The headings and paragraphs are excluded. Accept: at 390 and 1440, 25/50/75/100% frames show no blank area, and reduced/nogsap frames are identical to the final state.
2. **Restaurants:** add reveals to #demo media, #plan cards (stagger ≤4), #faq list (single rise) and .r-close card. Accept: same as 1, and the pin count stays at 1.
3. **Hosts:** add reveals to the #plan .p-calc card (hook `data-reveal`, single) and to #faq and .p-close. Provide the `data-sign-motion` hook on .p-sign for anim-svg, and load svg-motion.js on hosts only (and home if anim-svg asks). Accept: the calc total and price text are never hidden (opacity 1 at every frame), and interacting with the stepper during the reveal works.
4. **Hero entrance:** keep the symbol flight. Verify `PS = 1.12` (motion.js:483) is not a background scale, and remove it if it is. Accept: the frame at 0% equals the final layout except for the symbol, and CLS is 0.
5. **Mobile first:** all triggers use `once:true` except the story. `ScrollTrigger.refresh()` runs after fonts/images decode, and a resize from 390 to 1440 leaves no stuck opacity:0. Accept: motion-frames.cjs on all modes shows 0 hidden elements at 100%.
6. **Durations** come from `T` only. No new literals.

### anim-micro
1. Add `--m-spring: cubic-bezier(.2,.9,.25,1.15)` to motion.css :root, and point signature.css `--tl-spring` at it.
2. **Buttons (.s-btn, header CTA):** hover y -1px 150ms ease-out, active scale .98 150ms, release uses --m-spring, and focus-visible gets a 2px ink ring with no motion. Accept: ≥44px, no layout shift, and `transition` lists explicit properties only.
3. **Cards (.s-card, .h-doors cards, plan cards):** on hover (only under `(hover:hover)`) y -2px plus a shadow token swap. The shadow swap is instant or an opacity change on a pseudo-element, never an animated box-shadow. Accept: transform/opacity only.
4. **Tap Lab tabs:** the selected pill moves via a transform on a pseudo indicator (240ms --m-spring). Accept: switching at 150ms clicks never desyncs.
5. **Price switch (app.js monthly/yearly and hosts-smart.js):** the thumb uses translateX (RTL mirrored) at 240ms --m-acc-ease, and the numbers swap instantly (optional 150ms opacity). Accept: the value is never blank and there is no count-up.
6. **Accordion (#faq):** 240ms using the grid-rows or transform method already used in the page. The chevron rotates 180° at 240ms. Accept: no `height` tween in JS and no CLS outside the item.
7. **Header:** a hide/condensed state (if present) uses translateY only at 240ms. Accept: never hides while focus is inside.
8. **Reduced motion:** every rule is off under `prefers-reduced-motion: reduce` (state changes stay, motion goes).

### anim-svg
1. **Tap Lab choreography** (signature.js): implement §4 Tap Lab labels with a gsap.timeline, killed on a new click. The ripple element [data-tl-ripple] scales .6→1.6 and fades .5→0 over 480ms, once per tab change, and the stand does a 2px lift. Accept: total ≤650ms, a click during the timeline goes straight to the new tab, and reduced motion swaps the screen instantly.
2. **.p-sign** (svg-motion.js, hosts): the once-on-view sequence from §4, plus replay on tap/hover. The tap zone gets one ripple. There is no infinite loop and no `repeat:-1`. Accept: frames at 50/75% show the final "done" state, and reduced/nogsap show the final state.
3. **NFC waves** (stand/sign icons): draw via stroke-dasharray/dashoffset with CSS or GSAP, 240ms per arc, stagger 60ms, 3 arcs, once. No DrawSVG. Accept: the path is visible when JS is off.
4. **Logo symbol:** only uniform scale or translate, and only in the existing flight. No new logo motion.
5. Load svg-motion.js only where it is used, and keep it under 3KB. Accept: build-dist passes without budget changes.

### anim-perf-qa (for reference)
Run check.js and motion-frames (all modes) after each specialist. Also check at 4× CPU throttle, confirm that during reveals INP stays under 200ms, and run build-dist. Report PASS/FAIL per page in anim-perf-qa.md.
