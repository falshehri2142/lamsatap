// يبني صفحات الفحص المصغّرة في pages/ (تقرا motion.js و motion.css و GSAP من website/ مباشرة، بدون نسخ)
'use strict';
const fs = require('fs'), path = require('path');
const W = '../../../../../website';
const head = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- نفس سكربت الرأس في website/index.html (js دايماً، و m و mh لما تقليل الحركة مطفي) -->
<script>(function(h,w){h.className+=' js';if(!w.matchMedia||!matchMedia('(prefers-reduced-motion: no-preference)').matches)return;h.className+=' m'+(matchMedia('(min-height: 640px)').matches?' mh':'');document.addEventListener('DOMContentLoaded',function(){if(!w.__ltMotion)h.classList.remove('m','mh')})})(document.documentElement,window)</script>
<link rel="stylesheet" href="${W}/assets/motion.css">
<script defer src="${W}/vendor/gsap/gsap.min.js"></script>
<script defer src="${W}/vendor/gsap/ScrollTrigger.min.js"></script>
<script defer src="${W}/assets/motion.js"></script>
<style>body{margin:0;font:16px sans-serif} .hdr{position:sticky;top:0;height:80px;background:#fff;z-index:30;border-bottom:1px solid #ddd} .ph{position:absolute;inset:0;width:100%;height:100%;display:block}</style>
</head>
`;
const svg = (w, h, fill) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E%3Crect width='${w}' height='${h}' fill='%23${fill}'/%3E%3C/svg%3E`;
const BW = svg(400, 300, '777'), COL = svg(400, 300, 'c80'), LOGO = svg(214, 40, '142');
const pages = {
  // R1: الطابور، هل كل مسح ينظف خطه وقصّه بعد ما يخلص (ومع التحويم على الباب)
  't-queue.html': `<body>
<header class="hdr"></header>
<div style="height:1200px">spacer</div>
<figure id="mA" data-scan="media" style="height:300px;background:#ccc;margin:0 0 700px">A</figure>
<figure id="mB" data-scan="media" style="height:300px;background:#bbb;margin:0 0 700px">B</figure>
<figure id="mC" data-scan="media" style="height:300px;background:#aaa;margin:0 0 700px">C</figure>
<div data-doors style="display:flex;gap:20px;margin-bottom:1600px">
<a id="d1" data-door href="#" style="position:relative;display:block;width:400px"><div data-scan="tint" style="position:relative;height:300px"><img class="ph" src="${BW}" alt=""><img class="ph" data-tint src="${COL}" alt=""></div><h3>Door 1</h3></a>
<a id="d2" data-door href="#" style="position:relative;display:block;width:400px"><div data-scan="tint" style="position:relative;height:300px"><img class="ph" src="${BW}" alt=""><img class="ph" data-tint src="${COL}" alt=""></div><h3>Door 2</h3></a>
</div>
</body></html>
`,
  // R7: وسيط في آخر الصفحة: أعلاه ما يوصل 65% من الشاشة حتى عند أقصى تمرير (600 من 900)
  't-bottom.html': `<body>
<header class="hdr"></header>
<div style="height:2200px">spacer</div>
<figure id="last" data-scan="media" style="height:200px;background:#ccc;margin:0">LAST MEDIA</figure>
<footer style="height:100px;background:#eee">footer</footer>
</body></html>
`,
  // R3 و R4 و R5: قصة مثبّتة: هدف الجوال بالنسب (يتغير مع العرض)، وكتلة التثبيت 800px، وطبقة لون في المشهد
  't-story.html': `<body>
<header class="hdr"></header>
<div style="height:1000px">spacer</div>
<section data-story style="background:#f4efe6">
<div data-story-pin style="display:flex;gap:4vw;height:800px;box-sizing:border-box;padding:20px">
<div data-story-run style="width:30vw"><ol><li data-step>one</li><li data-step>two</li><li data-step>three</li></ol></div>
<div data-story-scene style="position:relative;width:50vw;height:500px;background:#ddd">
<img class="ph" src="${BW}" alt=""><img class="ph" data-tint src="${COL}" alt="">
<div data-story-target style="position:absolute;left:70%;top:60%;width:40px;height:40px;background:red;z-index:2"></div>
<div data-story-phone style="position:absolute;left:10%;top:10%;width:120px;height:250px;background:#333;z-index:3"></div>
</div>
</div>
</section>
<div style="height:2500px">after</div>
</body></html>
`,
  // R6: البداية موجودة بس ناقصها data-open-sym (مثل تعديل ترميز بالغلط): هل يبقى شي مخفي بدون خطأ؟
  't-early.html': `<body>
<header class="hdr"><a data-open-logo href="#"><img id="hlogo" src="${LOGO}" width="214" height="40" alt="logo"></a></header>
<section data-open style="height:900px">
<figure data-open-art style="position:relative;height:600px;margin:0">
<div data-open-qr style="position:relative;color:#142"><svg id="qr" viewBox="-4 -4 45 45" width="360" height="360"><path fill="currentColor" d="M0 0h7v1h-7z"/></svg></div>
<span data-open-word><img id="word" src="${LOGO}" width="214" height="40" alt=""></span>
</figure>
</section>
<div style="height:1500px"></div>
</body></html>
`,
};
for (const [f, body] of Object.entries(pages)) fs.writeFileSync(path.join(__dirname, 'pages', f), head + body);
console.log('pages:', Object.keys(pages).join(', '));
