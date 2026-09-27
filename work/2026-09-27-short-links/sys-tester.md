# sys-tester: اختبار الروابط الثابتة (2026-09-27)

## النتيجة النهائية: PASS (جولة 3). الجولة 1 كانت FAIL بسبب 404.html وانصلح.

البيئة: Windows 11، Node v24.18.0، `python -m http.server 8765 --bind 127.0.0.1` داخل `dist/`، وطفّيته بعد الاختبار (curl بعده = 000).

| الاختبار | المخرج الحقيقي | الحكم |
|---|---|---|
| `node systems/shortlinks/build.js` | `built 3 links`, exit=0 | PASS |
| `/t/demo01/` | 200، `refresh content="0;url=https://example.com/menu"` + location.replace + رابط يدوي | PASS |
| `/t/demo02/` | 200، `0;url=https://example.com/review` | PASS |
| `/t/demo03/` (ملغى) | 200، `0;url=/t/inactive/` | PASS |
| `/t/inactive/` | 200، «تواصل مع المحل للمزيد.» | PASS |
| `/t/demo01` بدون شرطة | 301 -> `/t/demo01/` (من خادم بايثون، مو من المخرجات) | PASS محلياً |
| `/t/nope/` غير موجود | 404 (صفحة بايثون الافتراضية، لأن http.server ما يخدم 404.html) | PASS جزئي |
| `/t/DEMO01/` حروف كبيرة | 200 ويحوّل للمنيو | لا يُعتد به: ويندوز ما يفرق الحروف في الملفات. على لينكس/الاستضافة يعطي 404 ويعتمد على 404.html |
| `_redirects` نصياً | ASCII، 7 أسطر: الكودين الفعالة مع/بدون شرطة 302، demo03 -> `/t/inactive/` 302، `/* /404.html 404` آخر سطر | PASS |
| كود مكرر (نسخة scratch) | `duplicate code: demo01` exit=1 | PASS |
| وجهة http (نسخة scratch) | `active link needs https dest: demo01` exit=1 | PASS |
| كود بحروف كبيرة في السجل | `bad code: Demo01` exit=1 | PASS |
| سكربت 404.html | `node --check` -> `SyntaxError: Invalid regular expression flags` | **FAIL** |

## الخطأ (للباني)
في `dist/404.html` الناتج:
`m=p.match(/^/t/([A-Za-z0-9]+)/?$/);`
السطر 31 في `build.js` مكتوب `\/` داخل template string، فالـ `\` تنشال عند التوليد والـ regex يطلع مكسور. النتيجة: تحويل الحروف الكبيرة و«بدون شرطة» على GitHub Pages (أو أي استضافة تعتمد على 404.html) ما يشتغل أبداً. الحل: `\/` في build.js (أو `new RegExp`)، ثم إعادة `node --check` على السكربت الناتج.

## غير مؤكد
- سلوك `_redirects` مع الحروف الكبيرة وقاعدة `/* /404.html 404` على Netlify/Cloudflare: ما اختبرته (يحتاج استضافة فعلية).
- اختبار الحروف الكبيرة الحقيقي يحتاج نظام ملفات يفرق الحروف (لينكس).
- ملاحظة: مجلدات الاختبار في scratch (dup/http/upper) ما حذفتها؛ مؤقتة خارج المشروع.

## جولة ثانية (بعد إصلاح الباني): PASS
- `node build.js` -> `built 3 links`، exit=0.
- `_redirects`: 6 أسطر 302 فقط، وسطر `/* /404.html 404` انحذف.
- سكربت 404.html صار `new RegExp('^[/]t[/]([A-Za-z0-9]+)[/]?$')`، و`node --check` -> exit=0.
- تشغيل المنطق في node مع location وهمي: `/t/DEMO01`->`/t/demo01/`، `/t/demo01`->`/t/demo01/`، `/t/Demo01/`->`/t/demo01/`، `/t/demo01/`->لا تحويل، `/x/y`->لا تحويل، `/t/nope`->`/t/nope/` (ثم 404 مرة وحدة، بدون حلقة لأن n===p).
- curl محلياً مرة ثانية: demo01/demo02/demo03 = 200 بالوجهات الصحيحة، nope = 404. الخادم انطفى (after=000).
- غير مؤكد: هل كل استضافة تخدم 404.html تلقائياً بدون سطر `/*` (يوثقه المعماري).

## جولة ثالثة (أكواد محجوزة، فحص الوجهة، published.txt...): PASS
**على المشروع:** `node build.js` -> `built 3 links (6 redirect lines)` exit=0. `published.txt` (demo01..03) ما تغير (diff فاضي). links.txt فيه شرطة أخيرة (`https://example.com/t/demo01/`). `node --check` على سكربت demo01 و404.html ناجح.

**curl محلي (منفذ 8765، انطفى بعدها after=000):** demo01/ 200 -> menu، `demo01/?src=nfc` 200، demo02/ 200 -> review، demo03/ 200 -> /t/inactive/، inactive/ 200، nope/ 404، demo01 بدون شرطة 301 -> /t/demo01/.
**تمرير query (محاكاة node):** `?src=nfc` -> `https://example.com/menu?src=nfc`.

**حالات خبيثة على نسخ في scratch (كلها exit=1 إلا المذكور):**
| الحالة | المخرج |
|---|---|
| code=inactive | `reserved code: inactive` |
| dest فيها `</script>` | `bad chars in dest` |
| سطر جديد / مسافة / `'` في dest | `bad chars in dest` |
| حذف demo03 المنشور | `published code removed (set status "cancelled" instead): demo03` |
| http:// | `dest must be plain https` |
| javascript: | `dest must be plain https` |
| بدون place | `place required` |
| Demo01 | `bad code` + `published code removed` |
| كود مكرر | `duplicate code: demo02` |
| أكثر من 2000 سطر | `_redirects would have 2008 lines (> 2000)` |
| كود جديد demo04 | exit=0 وانضاف لـ published.txt |
| forceBang=true | exit=0، السطر `... 302!` |
| place = `<img onerror>` | exit=0، مهروب في HTML (ما فيه onerror بالصفحات)؛ يظهر خام بس في links.txt (نص عادي، مو خطر) |

غير مؤكد: دعم `302!` وحد 2000 سطر حسب الاستضافة (توثيق المعماري)؛ الحروف الكبيرة على لينكس.

## ملحق القسم (بعد المشكّك)
- وجهة ترجع لـ `/t/` على نفس الدومين: البناء رفضها `dest loops back to /t/: loop1` (exit=1).
- `?src=nfc&next=evil` على demo01 → `https://example.com/menu?src=nfc` (انشال `next`). `node --check` سليم.
