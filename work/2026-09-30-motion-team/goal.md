# goal: motion-team 2026-09-30
**Owner request (2026-09-30):** make the whole site's animation excellent: premium, smart, trustworthy (GM-021).
**Scope:** website/index.html (incl. #tap-lab), website/restaurants/index.html, website/hosts/index.html (incl. .p-calc and .p-sign). NOT templates/ or demo/ (GM-011: no GSAP).
**Team:** anim-director (brief + score), anim-scroll, anim-micro, anim-svg, anim-perf-qa. Brief: brief.md (binding).
**Done when:**
1. Every page scores >= 9/10 from anim-director on all five items (meaning, rhythm, craft, respect, identity; page score = lowest item).
2. anim-perf-qa report (anim-perf-qa.md here) has zero FAIL: work/2026-09-30-site-wow/qa/check.js clean on all three pages; reduced motion = final state; no-JS and no-GSAP = full content; transform/opacity only; no CLS from motion; no horizontal scroll at 390; tap targets >= 44px.
3. `node tools/build-dist.cjs` passes without raising budgets; dist/ deleted after.
4. Specialists do not publish/push/commit; config.js values and prices untouched; department updates website-design SKILL.md.
