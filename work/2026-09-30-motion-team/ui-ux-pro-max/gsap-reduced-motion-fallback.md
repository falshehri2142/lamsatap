## UI Pro Max Search Results
**Domain:** gsap | **Query:** reduced motion fallback
**Source:** motion.csv | **Found:** 3 results

### Result 1
- **Category:** Loading / Skeleton
- **Intensity Tier:** Subtle
- **Trigger:** on mount / async wait
- **Duration:** 1200-1600ms loop
- **Easing:** sine.inOut
- **GSAP Snippet:** const tween = gsap.to('.skeleton', { backgroundPosition: '200% 0', duration: 1.4, ease: 'sine.inOut', repeat: -1 }); return () => tween.kill();
- **Framework Notes:** Kill the tween when content mounts or the component unmounts; pause it when its IntersectionObserver reports offscreen or document.visibilityState is hidden; when '(prefers-reduced-motion: reduce)' matches kill the tween and set the final static skeleton state
- **Do:** Use a CSS gradient background-position sweep rather than opacity pulsing; reads as 'loading' more clearly
- **Don't:** Don't run more than one shimmer loop per skeleton group; sync them under one timeline so the wave reads as a single unit
- **Performance Notes:** repeat: -1 tweens are cheap but must be explicitly killed on unmount or they leak in SPA route changes

### Result 2
- **Category:** Loading / Skeleton
- **Intensity Tier:** Standard
- **Trigger:** on mount / async wait
- **Duration:** 800-1200ms loop
- **Easing:** power1.inOut
- **GSAP Snippet:** const tl = gsap.timeline({ repeat: -1 }).to('.loader-dot', { y: -8, duration: 0.4, stagger: { each: 0.15, yoyo: true, repeat: 1 } }); const onVisibility = () => document.hidden ? tl.pause() : tl.resume(); document.addEventListener('visibilitychange', onVisibility); return () => { document.removeEventListener('visibilitychange', onVisibility); tl.kill(); };
- **Framework Notes:** In React use useGSAP scope for tween cleanup; add IntersectionObserver pause/resume when the loader is offscreen; when '(prefers-reduced-motion: reduce)' matches kill the loop and show the final static loading state
- **Do:** Cap total loop duration under ~1.5s so long waits don't feel like the UI froze on a single beat
- **Don't:** Don't use elaborate loaders for sub-300ms waits; they flash and feel worse than no indicator
- **Performance Notes:** Pause the timeline (tl.pause()) when the loading tab/view is not visible to save CPU on background tabs

### Result 3
- **Category:** Carousel / Auto-Rotation
- **Intensity Tier:** Standard
- **Trigger:** timer / focus / hover / visibility
- **Duration:** user-controlled or stopped
- **Easing:** none
- **GSAP Snippet:** const reduced = matchMedia('(prefers-reduced-motion: reduce)'); let timer; let onscreen = true; const stop = () => { clearInterval(timer); timer = undefined; }; const start = () => { stop(); if (!reduced.matches && !document.hidden && onscreen) timer = setInterval(nextSlide, 5000); }; const sync = () => reduced.matches ? (stop(), showSlide(activeIndex)) : start(); const observer = new IntersectionObserver(([entry]) => { onscreen = entry.isIntersecting; onscreen ? sync() : stop(); }); const onVisibility = () => document.hidden ? stop() : sync(); observer.observe(root); root.addEventListener('focusin', stop); root.addEventListener('pointerenter', stop); document.addEventListener('visibilitychange', onVisibility); reduced.addEventListener('change', sync); sync(); return () => { stop(); observer.disconnect(); root.removeEventListener('focusin', stop); root.removeEventListener('pointerenter', stop); document.removeEventListener('visibilitychange', onVisibility); reduced.removeEventListener('change', sync); };
- **Framework Notes:** Use one cancellable timer; pause on focus, hover, offscreen, or hidden visibility; remove every listener and clear the timer on unmount; reduced motion stops rotation and renders the active slide as the final state
- **Do:** Provide previous/next and play/pause controls; announce the current slide without moving focus
- **Don't:** Don't auto-advance without a visible stop control or continue while focus is inside
- **Performance Notes:** IntersectionObserver stops animation offscreen; visibilitychange stops hidden-tab work; cleanup disconnects the observer and clears the timer and listeners

