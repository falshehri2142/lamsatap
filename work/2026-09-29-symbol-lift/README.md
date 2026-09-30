# Restaurant symbol flight — 2026-09-29

Requested behavior: only the square mark flies out of the cafe photograph and into the header. The stand and LAMSATAP lettering remain stationary. Reference was the old Claude implementation at HEAD, not another live branch.

Reused the cubic path, early shrinking, fixed flight layer and reversible handoff from `opening()`; removed the superseded whole-stand animation. Header lettering remains visible while only its symbol slot is clipped. The flight owns one decoded SVG, with exact geometry from the approved horizontal logo. The background edit retains the acrylic stand and lettering.

Implementation: `website/assets/motion.js` (`symbolFlight`), `website/assets/restaurants.css`, `website/restaurants/index.html`. Asset export script and report live beside this note. `integrate.cjs` records the one-time migration of the discarded draft, not a rebuild command.

Validation:
- JavaScript syntax passed `node --check`.
- Browser at 1280×720: start, mid-flight, docked, reverse to zero; header/source handoff correct; photo transform stays `none` throughout.
- Browser at 390×844: source registration, mobile flight, docking, no horizontal overflow; resizing leaves exactly one flight layer.
- Direct `#plan` reload: target top71.7px with configured scroll padding72px.
- Resizing to320×600 removes the flight layer and header mask; the complete original photograph is visible. Temporary viewport overrides were reset.
- Browser console: no warnings/errors during these checks.
- Screenshots: `desktop-start.png`, `desktop-mid.png`, `desktop-end.png`, `mobile-mid.png`.

Motion is skipped for reduced motion and short viewports, retaining the original complete photograph. Asset failure removes enhancement and preserves the visible content anchor. No network dependencies or new libraries added.
