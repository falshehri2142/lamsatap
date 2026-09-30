## UI Pro Max Search Results
**Domain:** gsap | **Query:** pin scroll storytelling
**Source:** motion.csv | **Found:** 3 results

### Result 1
- **Category:** Scroll Reveal
- **Intensity Tier:** Complex
- **Trigger:** scroll (continuous scrub)
- **Duration:** tied to scroll position
- **Easing:** none (scrub-driven)
- **GSAP Snippet:** gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: '+=150%', scrub: 1, pin: true } }).from('.headline', { opacity: 0, y: 40 }).to('.bg-layer', { yPercent: -20 }, '<');
- **Framework Notes:** Pinning needs the section to have deterministic height; recalc ScrollTrigger.refresh() after images/fonts load; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Use scrub: true or a small number (0.5-1.5) instead of instant jumps so it feels tied to the scrollbar
- **Don't:** Don't pin more than 1-2 sections per page; excessive pinning fights native scroll feel and hurts mobile UX
- **Performance Notes:** Pinning forces layout reflow; test on mid-tier mobile devices, not just desktop

### Result 2
- **Category:** Scroll Reveal
- **Intensity Tier:** Subtle
- **Trigger:** scroll (viewport enter)
- **Duration:** 300-400ms
- **Easing:** power1.out
- **GSAP Snippet:** gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
- **Framework Notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger); Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Keep the y offset small (8-16px) so it reads as a fade, not a slide
- **Don't:** Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- **Performance Notes:** toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

### Result 3
- **Category:** Parallax Scroll
- **Intensity Tier:** Subtle
- **Trigger:** scroll (continuous)
- **Duration:** tied to scroll position
- **Easing:** linear (scrub)
- **GSAP Snippet:** gsap.to('.bg-layer', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: section, scrub: true } });
- **Framework Notes:** Apply parallax to background/decorative layers only, never to text or interactive controls; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately
- **Do:** Keep the yPercent delta small (5-15) so foreground and background never desync distractingly
- **Don't:** Don't parallax body copy; it hurts reading comfort and can trigger motion sickness
- **Performance Notes:** will-change: transform on the parallax layer only; remove it after scroll settles to free GPU memory

