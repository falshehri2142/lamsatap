# anim-perf-qa — round 4 (2026-09-30, port 8942)
Evidence: qa/check.r4.txt, qa/r4b-run1..3.txt (motion-check.js x3), anim-perf-qa/r4/m9.cjs (offsetTop anchor resize test, normal+reduce).

| Check | Result |
|---|---|
| run.cjs S | PASS 10 / FAIL 0 / INFO 2 |
| GM-011 grep templates/demo | empty PASS |
| vendor/gsap | 3 files PASS |
| CDN in assets | none (only xmlns, font OFL/credits, t.me placeholders) PASS |
| check.js (site-wow, incl. demo/templates) | 262/262 PASS |
| M1 / M2 / M3 / M7 / M10 | PASS 6/6 each (x3 runs), CLS max 0.0006, 0 pageerror |
| M4 no JS | in check.js PASS |
| M5 CPU4x 390, median of 3 | FAIL (indicator): load maxF home 250 / restaurants 150 / hosts 217 ms (>33ms frames 1/2/3); scroll long tasks home 53/64/61 -> median 61ms; restaurants 0 ; hosts 0 |
| M6 layout/style 390, 1440 | home 15/99, 3/54; restaurants 13/115, 13/103; hosts 17/155, 13/133 — INFO, flat vs round 3 |
| M8 INP 4x | PASS 40/32/56 ms |
| M9 resize 1440->1200->1440 | no h-scroll PASS; jump 0/0 all anchors (home, restaurants, hosts calc/story/FAQ), normal and reduce -> PASS (fixed; home -30 also gone). motion-check.js r1.jump on hosts (2207) = getBoundingClientRect inside pin, not a gate |
| M11 keyboard | home .s-door-link ring on parent (:has) false positive; hosts radio name=bill opacity 0 by design — INFO as rounds 2-3 |
| build-dist | ready; index 295.8/95.1, restaurants 324.7/99.2, hosts 334.2/103.6 KiB (limit 350/110); demos <=61.1/20.6 (limit 100/50); dist/ deleted |

Remaining: anim-scroll (+ website-design for asset) — M5 home scroll long task median 61ms >50 when Tap Lab enters (render/paint). Fix: lighten Tap Lab paint on entry (defer heavy image/filter/shadow decode, content-visibility or smaller raster). Load frames >33ms on all pages = first-paint render cost, indicator only.
Not verified: real iPhone Safari / mid Android.
