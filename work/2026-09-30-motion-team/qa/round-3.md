# anim-perf-qa — round 3 (2026-09-30, port 8921)
Evidence: check.out.txt, motion-check.out.txt (CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome), frames/ (motion-frames --mode all), resize-jump test (normal vs reduce).

| Check | Result |
|---|---|
| run.cjs S | PASS 10 / FAIL 0 / INFO 2 |
| GM-011 grep templates/demo | empty PASS |
| vendor/gsap | LICENSE.md, gsap.min.js, ScrollTrigger.min.js PASS |
| New CDN in assets | none (only CREDITS.md) PASS |
| Props (computed transitions, 3 pages x 390/1440) | PASS 6/6; GSAP strokeDashoffset in svg-motion.js covered by brief (NFC waves) |
| check.js | 262/262 PASS |
| M1 reduce from load | PASS 6/6 |
| M2 reduce toggled mid-page | PASS 6/6 |
| M3 GSAP blocked | PASS 6/6, 0 pageerror |
| M4 no JS | in check.js PASS |
| M5 CPU4x 390 (indicator) | FAIL: load frames >33ms home 2 (max 333), restaurants 6 (233), hosts 5 (183); scroll long tasks home 74ms, restaurants 113ms (new vs round 2), hosts none |
| M6 Layout/Style (scroll, 390 / 1440) | home 16/99, 3/56; restaurants 13/116, 12/100; hosts 17/155, 13/130 — INFO |
| M7 CLS | PASS 6/6 (<0.1) |
| M8 INP 4x | PASS 64/56/56 ms |
| M9 resize | no h-scroll PASS; jump 1440->1200: home -30px in both normal and reduce (reflow, not motion); restaurants 0; hosts +4px normal vs 0 reduce -> FAIL (>2px) |
| M10 cleanup | PASS 6/6 |
| M11 keyboard | home .s-door-link false positive (ring on .s-door:has()); hosts radio name=bill hidden by design — INFO, same as round 2 |
| build-dist | ready; index 295.6/95.0, restaurants 324.5/99.1, hosts 334.0/103.5 KiB (limit 350/110); dist/ deleted |
| svg-motion.js tag on hosts | present (line 38) |

Not verified: real iPhone Safari / mid Android (Chromium without GPU = indicator only).
