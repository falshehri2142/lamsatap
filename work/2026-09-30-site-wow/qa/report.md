# QA gate — site-wow (web-qa, 2026-09-30)
Script: `NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-09-30-site-wow/qa/check.js 8831` (server: `python3 -m http.server 8831 --directory website`). Raw results: `results.json`, shots: `shots/` (60 PNG).

Final run output: `262/262 pass`

| Check | Scope | Result |
|---|---|---|
| Console/page errors, 4xx/5xx | 9 pages x 6 widths | PASS |
| No horizontal scroll | 9 x 320/375/390/768/1024/1440 | PASS |
| Tap targets >= 44px | 9 x 6 | PASS (after fixes 1-2) |
| Arabic letter-spacing 0 (computed) | 9 x 6 | PASS |
| dir=rtl, lang=ar, one h1, title, meta description (noindex demos exempt from description) | 9 pages | PASS (after fix 3) |
| img alt / local links resolve | 9 pages | PASS |
| reduced motion: h1/h2 + CTA visible | 3 company pages x 390/1440 | PASS |
| JS disabled: h1/h2 + CTA visible | 3 company pages x 390/1440 | PASS (WhatsApp button stays `hidden` without JS by design; hero links visible) |
| Tap Lab: click 4 scenarios -> data-state=open, frame src, aria-selected, open link href | normal + reduced | PASS |
| Tap Lab keyboard: ArrowLeft->review, End->guide, Home->menu, 1 tabbable tab | normal + reduced | PASS |
| No `transition: all` in assets/*.css | static | PASS |
| Prices vs services/pricing.md (1,211 / 798 / 49.5 / 544.5 / 39.5 / 434.5) | 3 pages | PASS (menu mockup sample prices "مثال للعرض" and calculator default 148.5 = 3x49.5 excluded) |
| `node tools/build-dist.cjs` (budgets untouched) | repo | PASS — "جاهز للرفع: dist/" |

## Fixes
1. `website/assets/home.css`: footer links `min-width:44px` (footer «واتساب» was 43x44).
2. `website/404.html`: logo link `.logo` inline-flex min-height 44px + focus-visible ring (was 34px tall).
3. `website/404.html`: added meta description.

## Not verified
- Real devices / iOS Safari (Chromium only). Dark mode not tested: company pages are always light (GM-038).
- `dist/` produced by the build must not be committed.
