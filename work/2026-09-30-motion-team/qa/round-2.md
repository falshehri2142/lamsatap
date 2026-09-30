# anim-perf-qa — جولة 2 (2026-09-30، port 8921)
الأدلة: motion-check.js (أُضيف قياس قفزة التمرير في M9) / motion-check.out.{txt,json} / check.out.txt / frames/

| الفحص | النتيجة |
|---|---|
| run.cjs S | PASS 10 FAIL 0 INFO 2 |
| GM-011 templates/demo | فاضي PASS؛ demo 6 صفحات: 0 أخطاء، 0 طلب gsap |
| vendor/gsap | 3 ملفات PASS |
| CDN جديد في assets | لا (CREDITS.md بس) PASS |
| الخواص (transitions المحسوبة + tweens) | PASS 6/6؛ stroke-dashoffset في svg-motion.js مسموح بالموجز §3 |
| check.js | 262/262 PASS |
| M1 reduce من التحميل | 6/6 PASS |
| M2 reduce بالنص | 6/6 PASS |
| M3 بدون GSAP | 6/6 PASS، 0 pageerror |
| M7 CLS | 6/6 PASS (أعلى 0.0006) |
| M10 تنظيف | 6/6 PASS (مشكلة `.m-line` في hosts من جولة 1 انحلت) |
| M9 تغيير المقاس | بدون تمرير أفقي 3/3؛ قفزة 1440→1200: home -9px FAIL (>2px)، restaurants 0، hosts 0 |
| M11 كيبورد | home `.s-door-link` إيجابي كاذب (الحلقة على `.s-door:has()`); hosts radio `name=bill` مخفي مقصود — INFO |
| M5 CPU 4x 390 (مؤشر) | FAIL مؤشر: إطارات >33ms بالتحميل home 1 (300ms)، rest 6 (383ms)، hosts 5 (200ms)؛ long task بالتمرير home 104ms |
| M6 | layout 3–15، style 55–153 لكل تمرير؛ long tasks بدون إبطاء 58–72ms |
| M8 INP 4x | PASS 72/72/80ms (هدف 100) |
| build-dist | جاهز للرفع: index 304.5/97.5، restaurants 333.4/101.6، hosts 342.9/106.0 KiB (كانت 303.6/332.6/339.1)؛ dist/ انحذف |
| svg-motion.js | محمّل في hosts الحين |
| أجهزة حقيقية (iPhone Safari، أندرويد) | ما انفحص |
