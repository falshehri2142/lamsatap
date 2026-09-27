# sys-tester: فحص الأداة والـ runbook (2026-09-27)

البيئة: Windows 11، Git Bash، node. النسخة: `scratchpad/gm006` (نسخة من `systems/` و`website/`)، الأداة شُغّلت بـ `--dir <scratch>/systems/shortlinks`.
الملفات الحقيقية ما تغيرت (sha256 قبل وبعد متطابق):
- `links.json` bb67eeff…79ca3 OK
- `published.txt` 3aee73be…9602 OK

## 1. links-cli.js — النتيجة: PASS

| الحالة | المخرج الفعلي | exit | الحكم |
|---|---|---|---|
| `list` | 3 أسطر demo01..03 | 0 | PASS |
| `add aa11bb22 --client testc --place "طاولة 1" --dest https://example.com/menu` | `built 4 links … OK: added aa11bb22` | 0 | PASS |
| `add --gen …` | `OK: added y3fr9m5t` (8 حروف من الأبجدية الآمنة) | 0 | PASS |
| `set-dest aa11bb22 https://example.com/new` | `OK: aa11bb22 -> …/new` | 0 | PASS |
| `cancel aa11bb22` | `OK: cancelled aa11bb22 (now -> /t/inactive/)` | 0 | PASS |
| `set-dest` على ملغى بدون `--reactivate` | `ERROR: aa11bb22 is cancelled; add --reactivate…` | 2 | PASS |
| `set-dest … --reactivate` | `OK: … (reactivated)` | 0 | PASS |
| `cancel` مرتين | `ERROR: aa11bb22 already cancelled` | 2 | PASS |
| `add` كود موجود ملغى / demo01 | `ERROR: code exists: … Codes are never reused.` | 2 | PASS |
| `add` بدون `--dest` | `ERROR: --dest is required` | 2 | PASS |
| `add x1 --gen` | `ERROR: use either <code> or --gen, not both` | 2 | PASS |
| `set-dest nope` / `cancel nope` | `ERROR: no such code: nope` | 2 | PASS |
| أمر غير معروف `foo` | قائمة الأوامر | 2 | PASS |
| `--bogus` / `--client` بدون قيمة | `unknown option` / `needs a value` | 2 | PASS |

### الرجوع عند فشل البناء (مقارنة sha256 بالبايت قبل وبعد)
| الحالة | مخرج build.js | links.json | published.txt + dist/_redirects |
|---|---|---|---|
| `add BADCODE1` (حروف كبيرة) | `bad code: BADCODE1` + `ROLLED BACK` exit 1 | OK | — |
| `add … --dest http://insecure.com` | `dest must be plain https` exit 1 | OK | — |
| `add … --dest javascript:alert(1)` | `dest must be plain https` exit 1 | OK | — |
| `set-dest y3fr9m5t http://bad.com` | `dest must be plain https` exit 1 | OK | OK |
| حذف كود منشور يدوياً (demo03) ثم build.js | `published code removed (set status "cancelled" instead)` exit 1 | — | — |

اتفاق مع sys-builder: الأداة ما تكرر فحوص build.js وتعتمد عليها، والرجوع يشتغل فعلاً.

## 2. الـ runbook خطوة خطوة

| # | الخطوة | الحكم | الدليل |
|---|---|---|---|
| 1-3 | الدومين، الشراء، Cloudflare | ما تنفحص محلياً | تحتاج حساب صاحب المشروع |
| 4 | أمر node لتغيير config.json | PASS | الناتج `{"domain":"https://DOMAIN","forceBang":false}`؛ سطر `window.DEMO_URL` موجود في `website/demo/review/config.js:3` |
| 5 | أوامر links-cli | PASS | القسم 1 |
| 6 | `node build.js` + `links.txt` | PASS مع ملاحظة | البناء نجح. لكن build.js يحوّل الدومين لحروف صغيرة: `https://domain/t/demo01/`. مع الدومين الحقيقي (حروف صغيرة) ما في مشكلة، لكن مع المثال `DOMAIN` الفحص الحرفي «يبدأ بـ `https://DOMAIN/t/`» يفشل (5 من 5 أسطر) |
| 7 | rm/mkdir/cp -r/cp -rn/find | PASS | 11 ملف، بدون تعارض: `404.html`، `_redirects`، `t/<code>/index.html`×5 + `t/inactive/`، `demo/review/{index.html,config.js,qr-sheet.html}`. `links.txt` مو في publish |
| 8 | الرفع | ما تنفحص محلياً | حساب Cloudflare |
| 9 | فحص pages.dev | ما تنفحص محلياً | |
| 10 | ربط الدومين | ما تنفحص محلياً | |
| 11 | curl | PASS على خادم محلي، مع ملاحظة | انظر تحت |
| 12 | الجوال | ما تنفحص محلياً | يحتاج شريحة وجوال |
| 13 | التسجيل/commit | ما نُفّذ | ممنوع commit في الفحص؛ الأمر نفسه صيغة git عادية |

### الخطوة 11 على localhost
خادم node مؤقت (`scratchpad/srv.js`، منفذ 8787) يقرأ `_redirects` بمطابقة حرفية ويمرر الـ query، وإلا ملف ثابت، وإلا `404.html`. **هذا محاكاة وليس سلوك Cloudflare**؛ تمرير `?src=` في Cloudflare الفعلي يبقى غير مؤكد.
```
/t/demo01/  -> 302 https://example.com/menu
/t/demo02/  -> 302 https://example.com/review
/t/demo03/  -> 302 /t/inactive/          (ملغى)
/t/aa11bb22/ -> 302 /t/inactive/         (ملغى)
/t/y3fr9m5t/ -> 302 https://example.com/x
/t/demo01   -> 302 https://example.com/menu (بدون شرطة)
/t/demo01/?src=nfc -> 302 https://example.com/menu?src=nfc (في المحاكاة فقط)
/t/nosuchcode/ -> 404
/links.txt  -> 404
/demo/review/ -> 200
/t/inactive/ -> 200
/           -> 404 (متوقع حسب الـ runbook)
```
الخادم انطفى بعدها (curl بعد الإيقاف = 000).

## اعتراضات على الـ runbook (لـ sys-architect)
1. **الخطوة 11، الحلقة:** `u2="${u/https:\/\/DOMAIN/$BASE}"` تعتمد على كتابة الدومين حرفياً مثل ما هو في links.txt. build.js يطلعه بحروف صغيرة؛ مع placeholder `DOMAIN` الاستبدال ما يصير (جربته: الناتج بقي `https://domain/t/demo01/`). يمشي فقط إذا استبدل المنفذ `DOMAIN` بالدومين الفعلي بحروف صغيرة. الأوضح: `u2="$BASE${u#https://*/}"` أو `sed "s#^https://[^/]*#$BASE#"`.
2. **الخطوة 6:** نفس الملاحظة: اكتب «يبدأ بـ `https://<الدومين بحروف صغيرة>/t/`».
3. **الخطوة 11، آخر سطر:** `curl -sI http://DOMAIN/...` ما ينفحص محلياً (HTTPS/تحويل http من Cloudflare).

## الحكم
- الأداة: **PASS**.
- الـ runbook: الأوامر المحلية (4، 5، 6، 7، 11) **PASS**، مع ملاحظتين بسيطتين عن حالة الحروف في الدومين (1 و2 فوق). الخطوات 1-3 و8-10 و12 ما تنفحص محلياً.

## غير مؤكد
- تمرير `?src=` مع 302 في Cloudflare Pages، وتطابق الشرطة الأخيرة هناك: المحاكاة المحلية ما تثبتها.
- تحويل http إلى https على الدومين.

---
## جولة أخيرة (بعد تعديلات sys-builder والـ runbook الجديد، 14 خطوة)
نسخة scratch جديدة `scratchpad/gm006b`. بعد كل أمر فاشل قارنت sha256 لـ `links.json` و`published.txt`، وما تغير شي في أي حالة فشل.

### الأداة: PASS
| الحالة | المخرج | exit | الحكم |
|---|---|---|---|
| list، add، add --gen، set-dest، cancel، reactivate | `OK: …` | 0 | PASS |
| set-dest على ملغى بدون --reactivate، cancel مرتين، كود مكرر، كود غير موجود، أمر/خيار غلط | `ERROR: …` | 2 | PASS |
| `--place` فيه سطر جديد | `control character in place` + ROLLED BACK | 1 | PASS |
| `--client` فيه Tab | `control character in client` + ROLLED BACK | 1 | PASS |
| `--dest https://example.com/T/demo01/` | `dest loops back to /t/` | 1 | PASS |
| `--dest https://example.com/%74/demo01/` | `dest loops back to /t/` | 1 | PASS |
| `--dest https://EXAMPLE.com/t/demo02` | `dest loops back to /t/` | 1 | PASS |
| BADCODE1، http:// | `bad code` / `dest must be plain https` | 1 | PASS |
| رسالة الرجوع | `ROLLED BACK: links.json restored. Run build.js again before uploading…` | | PASS |
| تحذير example.com | `WARNING: config.json domain is a placeholder (https://example.com)…` | | PASS |

### الـ runbook الجديد (Git Bash)
| # | الحكم | الدليل |
|---|---|---|
| 1-3، 8-10، 13 | ما تنفحص محلياً | حساب أو جوال |
| 4 | PASS | الأمر يشتغل. ولو تُرك `DOMAIN` حرفياً يفشل البناء: `config.json domain is still the placeholder "DOMAIN"` (مقصود). جربت دومين تجريبي `https://nfc-test.sa` |
| 5 | PASS | جدول الأداة فوق. أمر الـ commit ما نفذته (ممنوع في الفحص) |
| 6 | PASS | exit 0، وما في ولا سطر من `links.txt` ما يبدأ بـ `https://nfc-test.sa/t/` |
| 7 | PASS | 11 ملف |
| 11 | PASS على المحاكي المحلي | حلقة `sed "s#^https://[^/]*#$BASE#"` صارت تشتغل (اعتراضي الأول انحل): النشط 302 لوجهته، الملغى لـ /t/inactive/. بدون شرطة 302، `?src=nfc` مرّ (في المحاكاة فقط)، nosuchcode 404، links.txt 404، demo/review 200 |
| 11 (`_redirects`) | ما تنفحص محلياً | المحاكي يعرض الملف لأنه خادم ملفات عادي، فالنتيجة ما تعني شي. هل Cloudflare يخفيه أو لا: غير مؤكد لين الفحص على pages.dev |
| 11 (http إلى https) | ما تنفحص محلياً | |
| 12، 14 | قواعد وتسجيل، ما فيها أوامر تنفحص | |

الخادم انطفى (curl بعدها 000).

### البناء على المشروع الحقيقي
`node systems/shortlinks/build.js`: exit 0، والناتج `built 3 links` مع تحذير example.com. البصمة (sha256) قبل وبعد:
- `published.txt` 3aee73be…9602 OK (ما تغير)
- `links.json` bb67eeff…79ca3 OK (ما تغير)

### الحكم النهائي: الأداة PASS، والأوامر المحلية في الـ runbook PASS. اعتراضاتي السابقة (حالة الحروف والاستبدال) انحلت.

## ملحق القسم (بعد المشكّك، جولة أخيرة)
- ملاحظة: ترقيم الخطوات فوق على الدليل القديم (13)؛ الدليل الحالي 14 خطوة والتسجيل صار الخطوة 14.
- `//t/demo01/` كوجهة: انرفضت `dest loops back to /t/: lp1`.
- وجهة خارجية فيها `%` (`https://other.org/sale-50%`): انقبلت (الفك صار على دوميننا بس).
- `place` فيه U+202E: انرفض `control character in place: bd2` (exit 1).
- الأداة الحين تطبع تحذير الدومين المثال حتى لو نجح البناء.
- البناء على المشروع نجح، و`links.json`/`published.txt` ما تغيروا.
