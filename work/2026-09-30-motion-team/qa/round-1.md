# anim-perf-qa — جولة 1 (2026-09-30، port 8921)
الأدلة: motion-check.js / motion-check.out.json / motion-check.out.txt / check.out.txt

| الفحص | النتيجة |
|---|---|
| run.cjs S | PASS 10 FAIL 0 INFO 2 |
| GM-011 grep templates/demo | فاضي PASS؛ demo 6 صفحات: 0 أخطاء، 0 طلب gsap |
| vendor/gsap | 3 ملفات PASS |
| CDN جديد في assets | لا (CREDITS.md بس) PASS |
| check.js | 262/262 PASS |
| M1 reduce من التحميل (3 صفحات × 390/1440) | 6/6 PASS |
| M2 reduce بالنص | 6/6 PASS |
| M3 بدون GSAP | 6/6 PASS، 0 pageerror |
| PROPS transitions المحسوبة | 6/6 PASS (بس transform/opacity/clip-path) |
| M7 CLS | 6/6 PASS (أعلى 0.0006) |
| M9 1440→1200→390→844x390 | 3/3 PASS بدون تمرير أفقي (قفزة التمرير ما انقاست بدقة) |
| M10 تنظيف | FAIL hosts 390+1440: `.m-line` باقي 1 داخل `.p-story-stage` بعد التمرير و5 ث |
| M11 كيبورد | home `.s-door-link` = إيجابي كاذب (الحلقة على `.s-door:has()`); hosts radio `name=bill` opacity 0 = input مخفي مقصود، INFO |
| M5 CPU 4x على 390 | FAIL مؤشر: إطارات >33ms بالتحميل (home 5/183ms، rest 4/233ms، hosts 3/300ms)؛ long task 75ms بالتمرير home |
| M6 (بدون إبطاء) | long tasks بالتمرير 54–70ms في كل الصفحات (PERF-11 >50) |
| M8 INP 4x | PASS (56/64/56ms) |
| build-dist | جاهز للرفع: index 303.6/97.2، restaurants 332.6/101.4، hosts 339.1/104.4 KiB؛ dist/ انحذف |
| svg-motion.js | غير محمّل في hosts |
