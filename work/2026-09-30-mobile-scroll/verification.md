# Mobile hero scroll repair — 2026-09-30

The reported screenshot matches the home hero (`.h-product`). The shared symbol-flight animation pinned the entire mobile photo/card for another half viewport and created 422px of extra pin spacing at a 390×844 browser viewport. This caused the stationary scene and empty area shown by the owner.

Changed `symbolFlight` to `pin: desktop`. On smaller viewports the detached symbol still flies into the header, while the photograph and QR card scroll in normal document flow. Desktop pinning is retained. Updated motion.js cache keys on all three marketing pages to `mobile-scroll-20260930-5`.

Verification:
- Build passed all JavaScript syntax, QR destination, and per-route asset budget checks.
- Home at 390×844: mobile hero pin spacing removed (422px → 0); next section becomes reachable with normal scrolling; source mark restored on reverse to the top; flight visible during intermediate scroll and header mark docked afterward; no horizontal overflow.
- Hosts and restaurants at 430×932: no hero pin wrapper, no horizontal overflow; restaurants console contained no warnings/errors.
- Home at 1440×900: desktop hero retains its pin wrapper and approved layout.
- Read-only review confirmed mobile source geometry still matches the trigger start and existing breakpoint cleanup remains valid.
- Cloudflare accepted all 150 files in `lamsatap-mobile-scroll.zip` and displayed deployment Success.
- Live https://lamsatap.com/ served the new cache key and no mobile hero pin wrapper; live console contained no warnings/errors.

Tests use desktop browser viewport simulation, not a physical iPhone or Android device. Existing unrelated local modifications were preserved. No commits or pushes were made.
