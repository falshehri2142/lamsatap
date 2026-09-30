# Logos on the five blank signs — 2026-09-29

User request: «حطلي الوقو في الاماكن هاذي», with a screenshot of the blank cafe acrylic stand.

Edited all three reused scene families: the cafe stand, the wall frame, and the three console-table stands. Built-in imagegen used the current 1600px color scene plus the exact approved stacked SVG rendered unchanged to `approved-logo.png` as references. The request was to center the complete dark ink logo on each paper insert, retain physical perspective and lighting, preserve the surroundings, and add no QR codes or extra text.

Generated master images are preserved under `brand/photos/composites/*-logo-v1.png`. Original unbranded photos remain in `brand/photos/generated/`. Imagegen output copies remain in the app's generated-images folder.

`export-scenes.cjs` produces the 12 responsive WebP assets and `exports.json` records dimensions, size and quality. Both sizes use the same geometry; monochrome derivatives use the ink/sand palette. All assets are under their existing size limits. The three `LAYERS` entries use the new masters, with `baked` color handling to avoid applying the original color treatment twice. No DOM logo overlay was added.

The existing home, restaurant and host pages retain their asset names and automatically consume the updated files.

Validation: all 39 scene image references resolve; query version `logo-v1` refreshes previously cached blank scenes. Desktop host and cafe scenes and the 390px cafe scene were inspected in the local browser. The mobile page has no horizontal overflow. Saved evidence: `site-proof.png` and `mobile-proof.png`. All 12 exports are 800×450 or 1600×900 and between 8.1 and 47.9 KiB. `git diff --check` and the export script's syntax check passed.

## Follow-up: remove the old scroll overlays

The user reported a circle appearing over the logo while scrolling. It was the legacy `[data-story-ring]` element, accompanied by an animated `[data-story-card]` preview designed for the formerly blank scenes. Removed both decorative nodes from the restaurant and host story sections and their unused page-specific positioning CSS. The independent live demos, all three copy steps, photo tint reveal and story progress/pinning remain. Removing the markup also handles reduced-motion, short-screen and no-JavaScript states; opacity-only hiding would have been overridden by the animation fallbacks.

Verified in the local restaurant page at the former problem position and while scrolling backward through the pinned story: zero ring/card elements, both photo layers loaded, third-step highlight and pinning active. `scroll-fixed.png` shows the clean logo during the pinned sequence. JavaScript syntax and whitespace checks pass.
