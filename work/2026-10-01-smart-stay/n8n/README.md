# مسودات n8n — الإقامة الذكية (مقترح GM-068)

**حالة:** ملفات JSON بس. ما انرفعت على n8n، وما فيها أي credentials ولا أسرار (GM-006). كل الأسعار والمواصفات في `../study.md`، والمواصفة الأصلية في `../system/report.md`.
كل workflow فيه `active:false`. القيم اللي شكلها `__X__` تنعبى يوم الإطلاق.

ترتيب صاحب المشروع: الموقع أول (`website/demo/door/` موجود كعرض محلي)، بعدها الشبكة. هذي الملفات تطابق تدفق صفحة الباب: تأكيد الحجز ← ضغط مطوّل ← انفتح (`d-done`) أو القفل ما رد (`d-pin`).

## الجداول (n8n Data Tables)
| الجدول | الأعمدة |
|---|---|
| `units` | unit, host_chat, lock_id, ical_urls, address, active |
| `bookings` | uid, unit, ref, from, to, token_hash, status (pending_token/active/cancelled/checked_out), lock_id, host_chat, pin_hint, pin_set |
| `audit_log` | ts, unit, ref, action, result |
| `rate_limit` | key (ip:...), ts, result (fail/early/open) |

## 1) `booking-sync.json` — مزامنة iCal
Schedule كل 30 دقيقة ← Get units ← Split iCal URLs (https بس) ← Fetch iCal (timeout 15s) ← Parse VEVENT (UID/DTSTART/DTEND/STATUS) ← Upsert bookings بمفتاح uid ← IF جديد أو ملغي ← Telegram للمضيف.
- **ملاحظة:** الدراسة توصي تأجيله للنسخة الثانية لأنه يصرف تنفيذات (حوالي 4,300 بالشهر حسب `../study.md`، غير مؤكد لأن حد خطة n8n غير مؤكد). في النسخة الأولى الحجز يندخل يدوي.
- iCal يعطي تواريخ بس (المصدر في `../system/report.md`: https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/syncing-your-calendars).
- شرط «جديد» (createdAt == updatedAt) يعتمد على رد Data Table — غير مؤكد، يتجرب محلياً.

## 2) `unlock-request.json` — افتح الباب
Webhook POST `/door-open` جسمه `{unit, token}` (الصفحة تاخذهم من `/door/?u=<unit>#k=<token>`)
← Validate shape (`unit` `^[a-z0-9]{3,16}$`، token 22 حرف) ← Rate limit lookup على **الـIP** (مو على الوحدة، عشان ما يقدر أحد يقفل باب ضيف بمحاولات غلط) ← Check limits (5 غلط/15 دقيقة، 3 فتحات/دقيقة) ← Hash token SHA-256 ← Find booking ← Check window (من وقت الدخول لين الخروج + 30 دقيقة، توقيت +03:00) ← Lock unlock (HTTP، timeout 10s، محاولتين، لو فشل يكمل) ← Lock result ← Audit log ← Telegram لنا (GM-048) ← Respond.
- الردود اللي الصفحة لازم تتعامل معها: `opened` ← شاشة `d-done`. `offline` ← شاشة `d-pin` (الضيف يستخدم الـPIN اللي عنده من المضيف؛ ما نرجّع الـPIN في الرد). `too_early` + `opens_at`. `expired`. `bad_link` (404). `too_many` (429).
- الرفض ينسجل في `rate_limit` (فرع واحد لكل الرفض).
- رد TTLock (`errcode=0`) غير مؤكد، المصدر https://open.ttlock.com/doc (انحجب اليوم). عقدة Lock result تتعدل حسب الرد الفعلي.

## 3) `pin-dispatch.json` — رمز PIN بفترة
كل يوم 10:00 ← حجوزات تدخل بكرة وحالتها active ← Make PIN (6 أرقام) + الفترة ← Lock add PIN (HTTP) ← Update bookings (يحفظ آخر رقمين بس `pin_hint`) ← Telegram **للمضيف** ينسخه لضيفه. نحن ما نرسل للضيف (ما عندنا رقمه، GM-067).
- الرمز يمر في رسالة التليجرام للمضيف، وما ينحفظ كامل في أي جدول.
- `require('crypto')` في Code node ممكن يكون ممنوع في n8n cloud — غير مؤكد. البديل: Crypto node (generate).
- حذف الـPIN بعد الخروج: القفل يحذفه بنفسه لما تنتهي الفترة (غير مؤكد، حسب TTLock).

## 4) `checkout-cleaning.json` — الخروج والنظافة (GM-067، `services/cleaning.md`)
فرع أ: Webhook POST `/checkout` `{unit, token}` ← تحقق ← booking active؟ ← status=checked_out ← Telegram لصاحب المشروع فيه زر «أرسل للنظافة» ← Respond.
فرع ب: Telegram Trigger (callback_query) ← لازم الضاغط هو صاحب المشروع والبيانات تبدأ بـ`clean:` ← Get unit ← رسالة لشركة النظافة: العنوان + وقت الخروج بس، بدون اسم ضيف ولا رقم مضيف ← تأكيد لصاحب المشروع.
- رمز دخول النظافة ما ينكتب هنا؛ صاحب المشروع يحطه بنفسه في n8n.
- ملاحظة: Telegram Trigger وحد في البوت؛ لو فيه workflow ثاني يستقبل نفس البوت لازم يندمجون (غير مؤكد).

## يوم الإطلاق — صاحب المشروع يعبي
1. استيراد الملفات الأربعة يدوي في https://lamsatap.app.n8n.cloud (الكونيكتور المسموح بس).
2. إنشاء Data Tables الأربعة، واستبدال `__DT_UNITS__`, `__DT_BOOKINGS__`, `__DT_AUDIT_LOG__`, `__DT_RATE_LIMIT__` بالـIDs.
3. `__SITE_ORIGIN__` = `https://lamsatap.sa` (أو الدومين النهائي).
4. `__LOCK_API_BASE__` + credential القفل (OAuth/client id) في لوحة n8n، وتعديل مسارات `/unlock` و`/keyboardPwd/add` حسب توثيق المزود.
5. Telegram credential للبوت، و`__OWNER_CHAT_ID__` و`__CLEANING_CHAT_ID__`.
6. `__CHECKIN_TIME__` و`__CHECKOUT_TIME__` (مثل 15:00 و12:00).
7. `__ERROR_WORKFLOW_ID__` = workflow تنبيه أخطاء على تليجرام.
8. تحقق بخطوتين على حساب القفل وحساب n8n.
9. ربط صفحة `door` بـ fetch للـWebhook (الحين العرض بدون fetch).
10. تجربة على قفل واحد: نجاح، قبل الوقت، بعد الخروج، رابط غلط، 6 محاولات غلط، القفل فاصل ← PIN.
11. لكل وحدة: PIN يشتغل بدون نت + مفتاح احتياطي في صندوق برمز.
12. بعد التجربة بس: `active:true`.
