# Fast mobile scroll reversal — 2026-09-30

The mobile hero no longer pins, but the symbol still had a 0.3-second scrub tween. Its source follows document scroll while the fixed flying clone used delayed progress and cached departure coordinates. A fast reversal could therefore hand back to a source already elsewhere on screen.

Scoped fix: `symbolFlight` now uses `scrub: desktop ? .3 : true`. Mobile position, scale, source opacity and header docking use the same current progress. Desktop pinning, flight path and smoothing remain unchanged. All three marketing pages use cache version `mobile-sync-20260930-6`.

Checks:
- Release build passes syntax, QR destinations and all existing per-page size budgets.
- Independent read-only code review passes.
- Home at 390×844, mid-flight (scroll675): source hidden, flying clone visible, header mark hidden.
- Immediate jump to bottom (scroll3316): flying clone hidden, header mark visible.
- Immediate reverse to top (scroll0): source visible, flying clone hidden, no pin spacer.
- Direct `#solutions` navigation: section top72.375px, header mark docked and clone hidden.
- Hosts full-page jump and reverse: scroll0, source visible, clone hidden, no mobile hero pin.
- No warnings/errors in the checked local browser session.

Published: Cloudflare accepted all 150 files and confirmed Success. Live https://lamsatap.com/ serves `mobile-sync-20260930-6`. On the published site a jump to the bottom hides the flying copy and shows the header mark; immediate return to scroll0 restores the source and hides the flying copy. No horizontal overflow. Evidence: `live-fast-scroll-fixed.png`.

This is browser viewport simulation, not a physical phone stress test. No unrelated layout or motion changes; no commits or pushes.
