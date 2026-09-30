# Tap Lab: عقد المكوّن النهائي (site-wow، 2026-09-30)

الملفات: `website/assets/signature.css` (4.7KB) و`website/assets/signature.js` (6.1KB، IIFE، بدون مكتبات وبدون أي طلب خارجي).
التركيب في الصفحة: `<link rel="stylesheet" href="/assets/signature.css">` و`<script src="/assets/signature.js" defer></script>`، والـ HTML حرفياً من brief-art §a.
الستاند: `[data-tl-stand]` يبقى فاضي في الصفحة، والسكربت يحقن فيه SVG (لوح حبر، وفوقه رمز الشعار بلون `--lt-surface`، ومساره منسوخ من brand/symbol-ink.svg). ما فيه N-Mark.

## الـ hooks
`data-tl` و`data-tl-picker` و`data-tl-opt`/`data-tl-src` و`data-tl-stage[data-state=idle|approach|tap|open]` و`data-tl-stand` و`data-tl-ripple` و`data-tl-phone` و`data-tl-frame` و`data-tl-poster` و`data-tl-caption` و`data-tl-open`.
حالات يحطها السكربت: `data-loaded` (الـ iframe تحمّل، والصورة المؤقتة تختفي خلال 240ms)، و`data-slow` (ما تحمّل خلال 1500ms، فتبقى الصورة المؤقتة ورابط «افتح التجربة كاملة» ظاهر دايماً).

## السلوك
- أول تشغيل مرة وحدة، لما 40% من المسرح يدخل الشاشة، والـ iframe ما يتحمل قبل هذا.
- approach 520ms بمنحنى spring، ثم tap: موجة تيل مرتين (640ms، وبينهم 120ms)، ثم open.
- إذا `window.gsap` موجود يستخدمه، وإلا WAAPI. الحركة transform وopacity فقط.
- لوحة المفاتيح: نمط ARIA tabs مع roving tabindex. في RTL السهم الأيسر ينقل للتالي، والأسهم فوق وتحت شغالة بعد، ومعها Home وEnd.
- تقليل الحركة: ما فيه انزلاق ولا موجة، بس تلاشي 120ms بين الصورة المؤقتة والـ iframe.
- بدون JS: تبقى الصورة المؤقتة ظاهرة، والـ iframe على about:blank، والرابط يفتح المنيو.
- إذا القسم مو موجود في الصفحة، السكربت يطلع بصمت.
- التخطيط: من 1024 وفوق أعمدة 5/7 والجوال 300×620. من 768 لين 1023 عمودين والجوال 260×540. تحت 768 الجوال 240×500. الأزرار شبكة 2×2 تحت 420px (مو 360، عشان «دليل الضيف» ما ينكسر على سطرين).
- عنوان h2 ياخذ `var(--h2)` من site.css، وإذا ما انعرّف يستخدم clamp احتياطي من 30 لين 48.

## الفحص (Playwright على منفذ 8814)
- مقاسات 320 و390 و1440: صفر أخطاء كونسول، وصفر سكرول أفقي.
- السهم الأيسر ينقل التحديد لتقييم قوقل، والـ iframe يتحمّل، و`data-state=open`.
- تقليل الحركة: الحالة تصير open مباشرة.
- اللقطات في `work/2026-09-30-site-wow/signature/`.
- صفحة الفحص `signature-test.html` روابطها تبدأ من جذر الموقع، فتنسخ مؤقتاً إلى `website/` عشان تنفتح.
