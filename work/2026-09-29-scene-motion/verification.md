# Motion verification — 2026-09-29

- Host hero: native square leaves the door-frame photo and docks in the header. The wordmark stays registered. Desktop 1575 × 884 and mobile 390 × 844 were checked at start, midpoint and end; desktop reverse also passed. Native and animated source boxes agree within 0.02px on mobile.
- Host short-height fallback at 1280 × 600: no flight overlay, native fallback opacity 1, flight image hidden.
- Restaurant story: full-color photo and native card share one camera. Progress advances across three steps. Checked at 1280 × 800 and 390 × 844, with natural scrolling on the stacked layout.
- Resizing from desktop to 1024 × 602 and then 390 × 796 removed pinning when the composition no longer fit. No horizontal overflow was observed.
- Demo: phone and stand enter without scanning or pulsing. On mobile, the visible phone enters while the offscreen stand stays queued; the stand enters when scrolled into view.
- No missing images or console warnings/errors observed.
- JavaScript syntax and whitespace checks pass. Static builders reproduce both pages unchanged.
- Production build emits assets but fails the configured 100KB raw / 50KB gzip page-size budget on the three marketing pages. See build-output.txt. No deployment was performed.
- Proof: restaurant-story-desktop.png and ../2026-09-29-host-symbol-lift/host-flight-desktop.png.
