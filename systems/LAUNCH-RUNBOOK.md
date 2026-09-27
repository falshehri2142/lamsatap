# دليل الإطلاق (Runbook)

آخر تحديث: 2026-09-27 (sys-architect، جولة 3). وضع التجهيز فقط (GM-006): لا شي من هذا يُنفذ قبل قرار الإطلاق.
المنفّذ: **صاحب المشروع** = تسجيل، دفع، دخول، أي مفتاح. **احنا** = تعديل ملفات، بناء، فحص.
الأوقات كلها «تقدير».

## قبل البدء
- Node وgit وcurl. **كل الأوامر في Git Bash** (مو PowerShell) من جذر المشروع.
- `DOMAIN` في هالملف نص تستبدله يدوياً بالدومين الفعلي (مثل `example.sa`) قبل ما تنسخ الأمر.
- `BASE` = الرابط الفعلي اللي يعطيك إياه صاحب المشروع (رابط `*.pages.dev` أول، بعدين `https://DOMAIN`).
- **تنبيه «جلسة وحدة»:** تفعيل الدومين وDNS والشهادة مدتها غير مؤكدة وممكن تطول. الأفضل الخطوات 1-3 (والخطوة 10 إن أمكن) قبل يوم الإطلاق.

## الخطوات

### 1. قرار الإطلاق — صاحب المشروع (15 د)
- **شرط:** لا روابط عملاء حقيقيين ولا بيع قبل السجل التجاري (GM-002 في `management/decision-register.md`).
- يسجل القرار عند المدير العام.

### 2. شراء الدومين — صاحب المشروع (20 د + تفعيل غير مؤكد)
- من مسجّل يختاره. السعر وقواعد `.sa`: غير مؤكد.

### 3. حساب Cloudflare ومشروع Pages — صاحب المشروع (20 د)
- الأساسي Cloudflare Pages حسب `systems/architecture.md` (الاحتياط Netlify).
- مشروع Pages بطريقة Direct Upload باسم مثل `nfc-site`. تنبيه رسمي: «If you choose Direct Upload, you cannot switch to Git integration later» ([المصدر](https://developers.cloudflare.com/pages/get-started/direct-upload/)).

### 4. تغيير الدومين في الإعدادات — احنا (5 د)
```
node -e "const f='systems/shortlinks/config.json';const c=require('./'+f);c.domain='https://DOMAIN';c.forceBang=false;require('fs').writeFileSync(f,JSON.stringify(c)+'\n')"
```
`forceBang` يبقى false على Cloudflare (`systems/shortlinks/README.md`). وعدّل `window.DEMO_URL` في `website/demo/review/config.js` إلى `https://DOMAIN/demo/review/`.

### 5. الروابط الحقيقية — احنا (5 د لكل رابط)
بأداة sys-builder `systems/shortlinks/links-cli.js` (لا تعدل `links.json` يدوياً). المرجع: `systems/shortlinks/README.md`.
```
node systems/shortlinks/links-cli.js list
node systems/shortlinks/links-cli.js add <code> --client <client> --place "طاولة 1" --dest https://<وجهة-العميل>
node systems/shortlinks/links-cli.js add --gen --client <client> --place "طاولة 1" --dest https://<وجهة-العميل>   # كود عشوائي 8 حروف
node systems/shortlinks/links-cli.js set-dest <code> https://<وجهة-جديدة>   # كود ملغى يحتاج --reactivate صريح
node systems/shortlinks/links-cli.js cancel <code>
```
- الأداة تبني بنفسها وترجع `links.json` لحاله لو فشل البناء. للتجربة استخدم نسخة بـ `--dir <مجلد>` لأن أي بناء ناجح يضيف الكود لـ `published.txt`.
- الأكواد التجريبية: `demo01` و`demo02` نشطة، `demo03` ملغى أصلاً. ما تنحذف (منشورة). `demo01`/`demo02` تُلغى بـ `cancel` أو تبقى، قرار صاحب المشروع. لا تستخدمها لعميل حقيقي.
- بعد ما تخلص الروابط سوّ commit فوراً (عشان `links.json` و`published.txt` يمشون مع بعض):
```
git add systems/shortlinks/links.json systems/shortlinks/published.txt systems/shortlinks/config.json website/demo/review/config.js
git -c user.name=... -c user.email=... commit -m "Launch: domain + links"
```

### 6. البناء — احنا (1 د)
```
node systems/shortlinks/build.js
cat systems/shortlinks/out/links.txt
```
لازم ينجح، وكل سطر يبدأ بـ `https://DOMAIN/t/`. `out/links.txt` خاص (خارج `dist/` ومستثنى في git) ولا يُرفع.

### 7. تجميع الموقع — احنا، Git Bash (2 د)
الموقع = `systems/shortlinks/dist/` + `website/`. فحصتها (2026-09-27): ما في تعارض مسارات (`website/` فيه `demo/review/` بس).
```
rm -rf publish && mkdir publish
cp -r systems/shortlinks/dist/. publish/
cp -rn website/. publish/
find publish -type f | wc -l
find publish -type f
```
- `cp -n` ما يكتب فوق ملف موجود؛ لو صار في `website/` يوماً `404.html` أو `_redirects` أو `t/`، ملف shortlinks يغلب. راجع القائمة قبل كل رفع.
- `publish/` في `.gitignore` الجذر.
- ما في صفحة `/` رئيسية حالياً (404).

### 8. الرفع — صاحب المشروع (10 د)
- من اللوحة: مشروع Pages ← «Create a new deployment» ← مجلد `publish/`. حد السحب والإفلات 1,000 ملف ([المصدر](https://developers.cloudflare.com/pages/get-started/direct-upload/)). كل كود ملف واحد، فلو العدد في الخطوة 7 قرب الألف (نحو 950 كود) استخدم wrangler.
- أو بالطرفية (يسجل دخوله بنفسه، وتنزيل wrangler يحتاج موافقته):
  `npx wrangler pages deploy publish --project-name nfc-site --branch <production-branch>`
  `<production-branch>` هو فرع الإنتاج المكتوب في إعدادات المشروع؛ النشر لفرع غير فرع الإنتاج ينزل كمعاينة. هل wrangler يستنتج الفرع من git لو ما انكتب `--branch`: غير مؤكد، فاكتبه دايم وتأكد من الرابط المطبوع بعد الرفع.
- يعطينا رابط `*.pages.dev` الفعلي.

### 9. فحص على pages.dev — احنا (10 د)
أوامر الخطوة 11 مع `BASE=<رابط pages.dev اللي أعطانا إياه صاحب المشروع>`.

### 10. ربط الدومين — صاحب المشروع (15 د + انتشار DNS غير مؤكد)
- **الدومين الأساسي (apex مثل `DOMAIN`):** يضيف الدومين كـ zone في Cloudflare، ويغير الـ nameservers عند المسجّل للي يعطيه Cloudflare، ثم Pages ← Custom domains ← `DOMAIN`.
- **دومين فرعي (مثل `t.DOMAIN`):** يكفي CNAME عند مزود DNS يشير لـ `nfc-site.pages.dev`، ثم يضيفه في Custom domains.
- التوثيق: https://developers.cloudflare.com/pages/configuration/custom-domains/
- **CAA:** لو فيه سجلات CAA للدومين لازم تسمح للجهة اللي يصدر منها Cloudflare الشهادة، وإلا ما تطلع. الشهادة يصدرها Cloudflare تلقائياً؛ المدة غير مؤكدة.

### 11. فحص كل رابط — احنا، Git Bash (10 د)
```
BASE=https://DOMAIN     # أو رابط pages.dev الفعلي
cut -f1 systems/shortlinks/out/links.txt | sed "s#^https://[^/]*#$BASE#" | while read u; do
  printf '%s -> ' "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$u"
done
curl -sI "$BASE/t/<code>" | head -5              # بدون شرطة أخيرة
curl -sI "$BASE/t/<code>/?src=nfc" | head -5     # هل Location فيه src؟ (غير مؤكد في التوثيق)
curl -sI "$BASE/t/demo03/" | head -5             # ملغى -> /t/inactive/
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/t/nosuchcode/"   # 404
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/links.txt"        # لازم 404
curl -s "$BASE/_redirects" | head -3              # لازم ما يطلع محتوى الملف (سطور /t/...)
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/demo/review/"     # 200
curl -sI "http://DOMAIN/t/<code>/" | head -3     # لازم يحول لـ https
```
- `curl -sI` يوريك الحالة و`Location` ورؤوس الكاش؛ 302 ما يفترض ينحفظ، تأكد إن ما فيه `Cache-Control` طويل.
- معيار النجاح: النشط لوجهته، الملغى لـ `/t/inactive/`، غير الموجود 404، `links.txt` 404، `_redirects` ما ينقرأ.

### 12. شرط قبل برمجة أي شريحة — احنا + مهندس NFC
- **حسم `?src=nfc` / `?src=qr` مع قسم مهندس NFC قبل البرمجة**: القفل نهائي، والرابط اللي ينبرمج ما يتغير بعدها.
- لا برمجة قبل ما تنجح الخطوة 11 على الدومين الفعلي.

### 13. فحص بالجوال — احنا + صاحب المشروع (10 د)
آيفون وأندرويد: لمس شريحة + مسح باركود لنفس الرابط.

### 14. التسجيل — احنا (10 د)
- `clients/<client>/tags.md` لكل رابط، ثم commit.
- تحديث «النظام الحالي» في `.claude/skills/systems-supervisor/SKILL.md` بالدومين والاستضافة.

المجموع التقديري: 2.5 إلى 3 ساعات بدون انتظار DNS والشهادة.

## خطة الرجوع
| المشكلة | الرجوع | مين |
|---|---|---|
| البناء فشل في الأداة | الأداة ترجع `links.json` لحاله تلقائياً. صحح الأمر وأعده. **لا تسوي `git checkout` لـ `links.json`**: `published.txt` صار فيه الأكواد الجديدة والبناء بيفشل. | احنا |
| وجهة غلط لرابط | `links-cli.js set-dest` ثم 6-8. | احنا ثم صاحب المشروع |
| رابط ما لازم يشتغل | `links-cli.js cancel` ثم 6-8. | احنا ثم صاحب المشروع |
| رفع خربان | Pages ← Deployments ← نشر سابق ← Rollback (https://developers.cloudflare.com/pages/configuration/rollbacks/) | صاحب المشروع |
| الدومين ما اشتغل | الفحص يكمل على pages.dev، ولا برمجة شرائح لين يشتغل. | صاحب المشروع |
| مشكلة بحساب Cloudflare | نفس `publish/` على Netlify (الاحتياط) وتوجيه DNS له. انتبه لـ `forceBang` في README. | صاحب المشروع |
| كود انبنى بالغلط وما انبرمج | يُشال يدوياً من `published.txt` و`links.json` مع السبب في الـ commit (السكيل). | احنا |


## بعد الإطلاق: الحذف الأسبوعي 7/30 — صاحب المشروع (كل أحد، 10 د)
المرجع: `legal/register.md` بند 21 و26 و31 (Gmail) و33 و34 (تليجرام). القاعدة: أي محادثة أو رسالة فيها طلب ضيف أو عميل تنحذف **خلال 7 أيام من إغلاق الطلب، وبحد أقصى 30 يوم** من أول رسالة، حتى لو ما انقفل.

**أ) Gmail (بلاغات الاحتياط، بند 31):**
1. ابحث في Gmail (الوارد + المرسل + كل البريد) عن رسائل «بلاغ وحدة» و«موافقة» المغلقة من أكثر من 7 أيام، واحذفها.
2. أي رسالة عمرها 30 يوم تنحذف حتى لو الطلب ما انقفل.
3. فرّغ المهملات يدوي (حذف المهملات التلقائي بعد 30 يوم **غير مؤكد**، ما نعتمد عليه).
4. لا تعيد توجيه أي بلاغ.

**ب) تليجرام (بند 33 و34):**
1. **محادثتك مع البوت** (تنبيهات، موافقات، رسائل العملاء الموسومة `#c`): احذف الرسائل المغلقة من أكثر من 7 أيام، وأي رسالة عمرها 30 يوم.
2. **حساب تليجرام حق الشركة** (لو فيه محادثات مباشرة مع عملاء): نفس القاعدة لكل محادثة.
3. **قناة البث**: ما فيها بيانات عملاء (بث بس)، ما تحتاج حذف.
4. **جهة الضيف/العميل في محادثة البوت:** البوت يقدر يحذف من الطرفين **خلال 48 ساعة بس**. من صفحة Bot API الرسمية (https://core.telegram.org/bots/api#deletemessage، Bot API 10.3، فُتحت 2026-09-28): «A message can only be deleted if it was sent less than 48 hours ago»، و«Bots can delete outgoing messages in private chats…»، و«Bots can delete incoming messages in private chats». وفيه `deleteMessages` لحد 100 رسالة بنفس القيود. **بعد 48 ساعة ما يقدر البوت يحذفها.** الحذف الآلي خلال 48 ساعة يحتاج حفظ `chat_id` و`message_id`، وهذا يخالف «ولا جدول يحفظ المعرّف» (بند 34)، فما نسويه. نسخة الضيف على جهازه تبقى عنده؛ التزامنا يخص نسخنا (محادثة صاحب المشروع + حساب الشركة + n8n).
5. **n8n:** حفظ بيانات التنفيذ مطفّى في «LT telegram inbound» و«LT owner-notify» و«LT get-channel» (الناجح والفاشل واليدوي)، وولا جدول يحفظ معرّف تليجرام. تأكد مرة في الشهر: Workflow ← ⋯ ← Settings.
