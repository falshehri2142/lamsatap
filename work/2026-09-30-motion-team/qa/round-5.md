# anim-perf-qa — round 5 (2026-09-30, port 8942)
Evidence: qa/check.r5.txt, qa/r5-run1..3.txt (motion-check.js x3, CHROME=chromium-1194), anim-perf-qa/r4/m9.cjs rerun.

| Check | Result |
|---|---|
| run.cjs S | PASS 10 / FAIL 0 / INFO 2 |
| GM-011 grep templates/demo | empty PASS |
| vendor/gsap | 3 files PASS |
| CDN in assets | none new (credits/licence/wa.me placeholders only) PASS |
| check.js (site-wow, incl. demo/templates) | 262/262 PASS |
| M1 / M2 / M3 / M7 / M10 | PASS 6/6 each x3 runs; CLS max 0.0006; 0 pageerror |
| M4 no JS | in check.js PASS |
| M5 CPU4x 390, median of 3 | FAIL (indicator). Scroll long tasks: home 96/53/52 -> median 53ms (>50); restaurants 0/0/0; hosts 0/0/0 PASS. Load maxF: home 100/233/283 -> 233; restaurants 167/283/233 -> 233; hosts 150/250/150 -> 150 (>33) |
| M6 layout/style (390 / 1440) | home 15/98, 3/57; restaurants 13/115, 13/103; hosts 16/153, 13/130 — INFO, flat vs round 4 |
| M8 INP 4x | PASS 48/32/40 ms |
| M9 resize 1440->1200->1440 | jump 0/0 all anchors, normal + reduce; no h-scroll PASS |
| M11 keyboard | home .s-door-link (ring on parent via :has) false positive; hosts radio name=bill opacity 0 by design — INFO as rounds 2-4 |
| build-dist | ready; index 295.8/95.1, restaurants 324.7/99.2, hosts 334.2/103.6 KiB (limit 350/110); demos <=61.1/20.6 (limit 100/50); dist/ deleted |

Remaining: website-design + anim-micro — home Tap Lab entry long task median 53ms (>50) under CPU4x. Load frames >33ms all pages = first paint, indicator only.
Not verified: real iPhone Safari / mid Android; which Tap Lab asset drives the paint cost.
