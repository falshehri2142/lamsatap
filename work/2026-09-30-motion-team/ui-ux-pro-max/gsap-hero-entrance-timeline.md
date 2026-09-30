## UI Pro Max Search Results
**Domain:** gsap | **Query:** hero entrance timeline
**Source:** motion.csv | **Found:** 3 results

### Result 1
- **Category:** Stagger List
- **Intensity Tier:** Subtle
- **Trigger:** load or scroll
- **Duration:** 250-350ms
- **Easing:** power1.out
- **GSAP Snippet:** gsap.from('.list-item', { opacity: 0, y: 8, duration: 0.3, stagger: 0.03 });
- **Framework Notes:** Select items with a stable class/data-attribute (not array index) so re-renders in React don't break targeting; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Keep per-item stagger delay small (0.02-0.04s) for lists longer than 10 items
- **Don't:** Don't stagger by more than 0.1s per item on long lists; total reveal time becomes sluggish
- **Performance Notes:** For virtualized lists, only animate items currently mounted in the DOM

### Result 2
- **Category:** Page Transition
- **Intensity Tier:** Complex
- **Trigger:** route change
- **Duration:** 500-800ms
- **Easing:** expo.inOut
- **GSAP Snippet:** const state = Flip.getState('.hero-image'); navigate(); Flip.from(state, { duration: 0.6, ease: 'expo.inOut', absolute: true, zIndex: 100 });
- **Framework Notes:** Requires the GSAP Flip plugin; the 'from' and 'to' route must render the same element with a shared data-flip-id; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Verify the shared element exists in both DOM states before calling Flip.from to avoid a silent no-op
- **Don't:** Don't use shared-element transitions across more than one element pair per navigation; compounding Flips are hard to time correctly
- **Performance Notes:** Flip recalculates layout (FLIP technique) so test on low-end devices for jank

### Result 3
- **Category:** Parallax Scroll
- **Intensity Tier:** Standard
- **Trigger:** scroll (continuous)
- **Duration:** tied to scroll position
- **Easing:** linear (scrub)
- **GSAP Snippet:** gsap.utils.toArray('.parallax-layer').forEach((layer, i) => { gsap.to(layer, { yPercent: (i + 1) * -8, ease: 'none', scrollTrigger: { trigger: layer.parentElement, scrub: 0.5 } }); });
- **Framework Notes:** Layer count beyond 3-4 has diminishing visual return and multiplies scroll-listener cost; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Vary speed per layer (background slowest, foreground fastest) to sell the depth illusion
- **Don't:** Don't let parallax layers overflow their container; clip with overflow: hidden on the wrapper
- **Performance Notes:** Batch all layers under one ScrollTrigger container where possible instead of one per layer

