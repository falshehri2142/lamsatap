# sys-builder: نظام الروابط الثابتة

## اللي انبنى (systems/shortlinks/)
- `config.json`: الدومين في سطر واحد (حالياً `https://example.com`).
- `links.json`: السجل (code, client, place, dest, status, programmed). 3 روابط تجريبية على example.com: demo01/demo02 فعالة، demo03 ملغى.
- `build.js`: Node بدون مكتبات. يتحقق (كود `^[a-z0-9]{3,16}$`، لا تكرار، الفعال لازم https) ويولد `dist/`.
- `README.md`: أمر البناء والاختبار. `.gitignore` يستثني `dist/`.

## المخرجات (dist/)
- `t/<code>/index.html`: meta refresh 0 + `location.replace` + رابط يدوي، noindex.
- `_redirects`: 302 لكل كود بدون/مع شرطة مائلة، والملغى يروح `/t/inactive/`.
  (الجولة 2: حذفت قاعدة `/* /404.html 404` بطلب المعماري؛ Cloudflare Pages ما يقبلها و404.html ينعرض تلقائياً.)
- `t/inactive/index.html`: الصفحة البديلة (الرابط المنشور ما ينحذف، يتحول لها).
- `404.html`: رسالة + JS يحوّل `/t/ABC` أو `/t/abc` (بدون شرطة) إلى `/t/abc/`.
- `links.txt`: الروابط الكاملة بالدومين للبرمجة في الشرائح.

## التشغيل
`node systems/shortlinks/build.js` نجح فعلياً: "built 3 links".

## غير مؤكد
- هل قواعد `_redirects` حساسة للحروف الكبيرة، وهل القاعدة `/* /404.html 404` مدعومة بنفس الشكل في كل استضافة (Netlify / Cloudflare Pages). المعماري يوثقها بالمصدر.
- GitHub Pages ما يقرأ `_redirects`؛ يعتمد على صفحات HTML و`404.html` (غير مؤكد إنه يخدم 404.html للمسارات تحت /t/ بدون إعداد).
- مع خادم محلي على ويندوز، الحروف الكبيرة قد تنجح لأن نظام الملفات ما يفرق بين الحروف، فالاختبار الحقيقي للحروف على لينكس/الاستضافة.
- لم أقرأ architecture.md بعد (يُكتب بالتوازي)؛ أي اختلاف يُحسم في الجولة الثانية.

## الجولة الثانية
- أصلحت regex في 404.html (كانت الشرطات تنتج `/^/t/.../` وSyntaxError): صارت `new RegExp('^[/]t[/]([A-Za-z0-9]+)[/]?$')`. فصلت السكربت من dist/404.html و`node --check` نجح.
- حذفت قاعدة `/* /404.html 404` من `_redirects`. أعدت البناء ونجح.

## الجولة الثالثة (اعتراضات المشكّك)
عدلت `build.js`:
1. أكواد محجوزة مرفوضة: inactive, 404, index, admin, api, assets, static, www, robots, favicon, sitemap, redirects, links, published, null, undefined.
2. الوجهة: تُرفض أي مسافة أو سطر جديد أو `< > " ' \` ولا backtick، ثم `new URL()` ولازم تكون https بدون user/pass، ويُستخدم `.href`. داخل `<script>` أهرّب `< > & U+2028 U+2029` إلى `\uXXXX`.
3. `published.txt` (يُتتبع في git) يتحدث بعد كل بناء، والبناء يفشل لو اختفى منه كود.
4. `links.txt` يكتب `https://<domain>/t/<code>/`.
5. place إلزامي.
6. صفحات الكود (JS) و404 تمرر `location.search`. (meta refresh ما يمررها، وهو احتياط لو JS مقفل.)
7. البناء يفشل لو `_redirects` يتجاوز 2000 سطر.
8. `forceBang` في config (افتراضي false) يكتب `302!`.
README: أضفت سطر النشر وشرح forceBang.

### اختبارات خبيثة شغلتها فعلاً (نسخة في scratchpad)
reserved/http/javascript:/اقتباس و<script>/سطر جديد ومسافة/حذف كود منشور/بدون place/كود بحروف كبيرة/1002 كود (2004 سطر): كلها فشلت بالرسالة الصحيحة. الحالة السليمة بنت، وforceBang=true طلع `302!`. `js('</script>')` يطلع `\u003c/script\u003e`. `node --check` على سكربتات 404 وصفحة demo01 وdemo03 نجح.

### غير مؤكد
- حد 2000 سطر مأخوذ من طلب المشكّك/المعماري، ما تحققت منه بنفسي من مصدر رسمي.
- هل Netlify يمرر query string تلقائياً في تحويلات `_redirects` (غير مؤكد).
