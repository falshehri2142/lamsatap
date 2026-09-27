# sys-builder: أداة links-cli.js

## اللي انبنى
- `systems/shortlinks/links-cli.js`: `list`، `add <code>|--gen --client --place --dest`، `set-dest <code> <url> [--reactivate]`، `cancel <code>`، و`--dir`/`SHORTLINKS_DIR`.
- README محدث بقسم «أداة الإدارة».

## قرارات التصميم
- الفحص الأساسي يبقى في build.js (ما كررته): الأداة تكتب links.json، تشغل `build.js` من نفس المجلد، ولو خرج بغير 0 ترجع النص الأصلي بايت ببايت. build.js يكتب published.txt وdist بعد النجاح فقط (مقروء من الكود: الخروج `process.exit(1)` قبل `fs.rmSync(out)`).
- الأداة تمنع إضافة كود موجود حتى لو ملغى (build.js يرفض المكرر أصلاً، والأداة ترفضه قبل الكتابة برسالة أوضح) — الإلغاء ما يعاد استخدامه.
- `set-dest` على كود ملغى يرفض إلا مع `--reactivate` (يمنع تعديل ملغى بالغلط).
- ما فيه أمر حذف أبداً.
- `--gen`: 8 حروف من 32 رمز عبر `crypto.randomBytes` (32 يقسم 256 فما فيه انحياز)، ويتجنب التكرار.
- الأكواد ما تتحول لحروف صغيرة تلقائياً: build.js يرفض الكبيرة فيبان الغلط.
- ملاحظة: الأداة تعيد كتابة links.json بسطر لكل كود (نفس الشكل الحالي).

## تجربة (على نسخة في scratch، السجل الحقيقي ما انلمس؛ `git status` يبين links-cli.js فقط جديد)
| الحالة | النتيجة | exit |
|---|---|---|
| list | 3 أكواد | 0 |
| add abc123 | OK + بناء | 0 |
| add --gen | كود 94htswef | 0 |
| add abc123 مكرر / demo03 ملغى | رفض | 2 |
| add ABC999 / http / admin / وجهة ترجع لـ /t/ | BUILD FAILED + ROLLED BACK | 1 |
| set-dest demo01 | OK | 0 |
| set-dest demo03 (ملغى) بدون/مع --reactivate | رفض / OK | 2 / 0 |
| cancel abc123 ثم مرة ثانية / nope | OK / رفض / رفض | 0/2/2 |
| add بدون --dest | رفض | 2 |
بعد الفشل، `list` بين أن السجل ما تغير.

## غير مؤكد
- ما فيه قفل ملفات لو شغلين الأداة بنفس الوقت (مستخدم واحد، مقبول).
- المختبِر لازم يأكد الرجوع مستقل، والمشكّك يراجع (حسب دروس السكيل).

## جولة 2: إخراج links.txt من dist (اعتراض المعماري، متفق معه)
- `build.js` صار يكتب `systems/shortlinks/out/links.txt` بدل `dist/links.txt`. أضفت `out/` في `systems/shortlinks/.gitignore` جنب `dist/`. وعدلت README.
- `links-cli.js` ما يشير لـ links.txt، فما احتاج تعديل.
- أعدت البناء على المشروع: `dist/` = `404.html` و`_redirects` و`t/` فقط، و`out/links.txt` موجود. `published.txt` مطابق لنسخته قبل البناء (`cmp` = SAME)، و`git status --ignored` يبين `dist/` و`out/` مستثنين.
- باقي يحتاج تحديث من أصحابها (ما عدلتها لأنها مو ملفاتي): `systems/LAUNCH-RUNBOOK.md` (الأسطر 48 و63 و87: `dist/links.txt` و`rm publish/links.txt`)، و`systems/architecture.md` السطر 18، و`SKILL.md` الأسطر 34 و38. فحص `curl $BASE/links.txt` = 404 يبقى مفيد.

## جولة 3: ملاحظات المشكّك (متفق معها كلها، ونفذتها)
1. build.js يرفض `\p{Cc}` في place وclient. سطر جديد في `--place` صار `control character in place` ويرجع السجل.
2. فحص الوجهة الدائرية صار على `decodeURIComponent(pathname).toLowerCase()`، ويشمل `/t` بدون شرطة. الترميز المكسور يطلع `bad %-encoding`. `/T/demo01/` و`/%74/demo01/` و`/t` كلها مرفوضة، و`/menu` مقبول.
3. رسالة الرجوع صارت: «links.json restored. Run build.js again before uploading (dist/ or out/ may be from a partial build)». اخترت تعديل الرسالة بدل الكتابة في مجلد مؤقت، لأن build.js أصلاً يخرج قبل ما يلمس dist إذا فيه أخطاء تحقق، والخطر بس لو صار crash وسط الكتابة.
4. domain فيه `DOMAIN` حرفياً يفشل البناء (exit 1). `example.com` أو كلمة domain (مثل mydomain.sa) تطبع WARNING بس. الدومين الحقيقي (جربت nfc-real.sa) بدون تحذير.
5. أنشأت `.gitignore` بجذر المشروع وفيه `publish/`.
- كل التجارب على نسخة `scratchpad/sl3`. قارنت `links.json` و`published.txt` الحقيقيين بنسخ محفوظة (`cmp`) وطلعوا REAL-UNCHANGED.
- ملاحظة: الـ WARNING يطلع الحين مع كل بناء، لأن config الحقيقي example.com. هذا مقصود لين الإطلاق.
