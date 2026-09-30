# Local website QA — 2026-09-29

Scope: read-only inspection of the existing company pages, shared JavaScript and release builder. No secrets, external requests, publication or commercial actions. Website edits are owned by the parent and audience-page agent.

## Tooling

- Node and local Chrome/Edge are installed. No dependency installation is required.
- Existing visual/a11y runner: `C:/Users/TechTroniX/.claude/tools/ui-probe.cjs`.
- Example: `node C:/Users/TechTroniX/.claude/tools/ui-probe.cjs --serve website index.html --out work/2026-09-29-site-upgrade/qa-home --widths 1440,390 --tiles`.
- It supports `--dark` and `--reduced-motion`. Inspect viewport tiles for pinned sections; full-height screenshots change the viewport and therefore alter viewport-based animation geometry.
- New reusable interaction smoke helper: `node work/2026-09-29-site-upgrade/qa-interactions.cjs`. It uses a fresh headless Chromium profile, blocks HTTP(S) page requests, reads `website/` via `file:`, and writes screenshot/report artifacts to `qa-browser/`. It removes only its own checked temporary profile after the browser exits.
- Sandboxed Chrome launched but the first CDP request timed out. An approved run outside the sandbox completed successfully.

## Confirmed initial behavior

Chromium smoke tests covered the home, restaurants and hosts pages at 320, 390 and 1440 CSS pixels with reduced motion, plus all three pages with JavaScript disabled at 390 pixels.

- Zero JavaScript exceptions, failed asset loads, broken images, images without an `alt` attribute, duplicate IDs, or visually unnamed controls in this smoke sample.
- Exactly one h1 per company page.
- At 390/1440, no document horizontal overflow.
- Native no-JS content remains visible. Pricing switches are hidden and alternative prices remain available as static text.
- Restaurant keyboard `ArrowLeft` selects renewal, moves focus, and updates the price to 798.
- Hosts keyboard `ArrowLeft` selects annual billing, moves focus, and updates the two prices to 544.5 and 434.5, with the annual explanation.
- No external contact links are followed by the smoke test.

## Findings handed to implementation agents

1. **320px horizontal overflow:** all three existing pages expand to 331px. The shared mobile navigation uses unwrapped labels and a 16px gap at this width. Fix spacing/wrapping and retest against `documentElement.clientWidth`, not `innerWidth` (mobile `innerWidth` expands with overflow).
2. **Hosts dead anchor:** a hero link uses `#demo` without a matching target ID. The audience agent reported adding `id="demo"` to the demo section; awaiting final integrated rerun.
3. **Live reduced-motion change:** `initPriceSwitch()` caches the media-query result once. After changing preference to reduce, clicking a price option still adds inline 0.6-second transform transitions. Read the preference on each change, and clear prior inline transition/transform state in the reduced path. Initial reduced-motion loading already works.
4. **Release QR validation mismatch:** `tools/build-dist.cjs` requires every `data-qr-url` to equal `<domain>/demo/review/`; existing home/hosts QRs legitimately use `/demo/rental-guide/`. Validate the permitted actual demo destination instead of hard-coding the review route for all QRs.
5. **No-JS contact availability:** all configured contact links are injected by `app.js`, so JavaScript-disabled pages have no contact links. Static service descriptions and examples still work. A deliberately maintained fallback contact option would improve resilience, but must not invent a phone number or channel.

## Limits

This is a local Chromium functional smoke test, not a WCAG conformance claim. Real iOS/Safari, real NFC hardware and printed QR camera scanning remain unverified. Configured contact destinations, commercial terms, and publication were not exercised. Final design screenshots and integrated regression results should be added after the implementation agents finish.

## Final integrated verification

Command: `node work/2026-09-29-site-upgrade/qa-interactions.cjs --final`.

The final test used `http://127.0.0.1:8123/`, a fresh browser profile, disabled browser cache, and intercepted all page requests to allow only localhost/local resources. Previous screenshots remain in `qa-browser/`; final evidence is in `qa-browser-final/`.

- **24 page states completed:** three company pages at 320, 390, 768, 1024 and 1440 pixels with reduced motion, plus each page at 390 pixels with JavaScript disabled, ordinary motion, and GSAP scripts deliberately blocked.
- **Pass:** actual `documentElement.clientWidth` equals requested width; no document horizontal overflow in any state. The initial 320px defect is fixed.
- **Pass:** no broken local links, image failures, missing image alt attributes, duplicate IDs or visually unnamed controls in the responsive runs. The hosts `#demo` target is fixed.
- **Pass:** one h1 per page and no hidden main headings in all 24 states, including failed GSAP. The two intentionally blocked GSAP network requests in each failure scenario are expected test evidence, not application exceptions.
- **Pass:** pricing keyboard selection, focused option, complete accessible price text, and billing notes retain the approved amounts. Restaurant renewal is 798; host annual options are 544.5 and 434.5.
- **Reviewed visually:** all three heroes at 390 and 1440; audience `#experience` and `#plan` sections at 1440. Text/actions/photos render cleanly, hero contexts were removed, and the restaurant caption correctly reads `بشعار محلك`.
- **Pass after targeted repair:** the parent cleared previous sibling transition/transform state in the nonanimated pricing path. `node work/2026-09-29-site-upgrade/qa-interactions.cjs --prices-only` confirms both pages update correctly after the live reduced-motion change, with no inline transform transitions. All three price-unit elements report computed transition duration `0s`, transform `none`, and `0` running animations. Evidence: `qa-prices-final/report.json`. No full viewport rerun was needed for this isolated repair.
- The deliberate no-JS contact limitation remains: service information and alternative prices are visible, but no configured contact links are injected without JavaScript.

No website implementation files were edited by this QA agent.
