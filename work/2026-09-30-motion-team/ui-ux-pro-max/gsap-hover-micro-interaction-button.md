## UI Pro Max Search Results
**Domain:** gsap | **Query:** hover micro interaction button
**Source:** motion.csv | **Found:** 3 results

### Result 1
- **Category:** Hover Micro-interaction
- **Intensity Tier:** Subtle
- **Trigger:** hover
- **Duration:** 150-200ms
- **Easing:** power1.out
- **GSAP Snippet:** gsap.to(el, { y: -1, opacity: 0.9, duration: 0.15, ease: 'power1.out' });
- **Framework Notes:** Bind on mouseenter/mouseleave; in React wrap in a ref + useEffect (or onMouseEnter/onMouseLeave props directly calling gsap.to); Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Keep displacement under 2px so it reads as feedback not motion
- **Don't:** Don't animate layout-affecting props (width/height/margin) on hover
- **Performance Notes:** Runs on transform/opacity only so it stays on the compositor thread

### Result 2
- **Category:** Hover Micro-interaction
- **Intensity Tier:** Standard
- **Trigger:** hover
- **Duration:** 200-300ms
- **Easing:** power2.out
- **GSAP Snippet:** gsap.to(el, { y: -4, scale: 1.02, boxShadow: '0 12px 24px rgba(0,0,0,0.12)', duration: 0.25, ease: 'power2.out' });
- **Framework Notes:** Use gsap.quickTo(el, 'y') for cards with many hover targets to avoid re-creating tweens every event; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Pair with a matching mouseleave tween that reverses the same properties
- **Don't:** Don't leave the hover state stuck if the pointer leaves fast; always attach the reverse tween
- **Performance Notes:** quickTo() avoids GC churn on lists with 20+ hoverable cards

### Result 3
- **Category:** Hover Micro-interaction
- **Intensity Tier:** Complex
- **Trigger:** hover + mousemove
- **Duration:** 300-500ms
- **Easing:** elastic.out(1,0.4)
- **GSAP Snippet:** const onPointerMove = (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.3); }; el.addEventListener('pointermove', onPointerMove); return () => el.removeEventListener('pointermove', onPointerMove);
- **Framework Notes:** Keep a stable named pointer handler so cleanup removes the same function; in React/Vue return the removeEventListener cleanup; use gsap.matchMedia('(prefers-reduced-motion: reduce)') and render x/y at the final neutral state
- **Do:** Clamp the pull strength (e.g. * 0.3) so the element never fully leaves its hit box
- **Don't:** Don't apply magnetic effect to more than 1-2 focal elements per screen; it becomes noisy
- **Performance Notes:** Use will-change: transform on the target element for smoother compositing

