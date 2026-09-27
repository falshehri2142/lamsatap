# سجل نقل لمسة تاب إلى n8n (GM-013/GM-014)

قائد النقل: مهندس تقنية NFC. المرجع: `management/n8n-access.md`.

## الخطوة 1: التحقق من الوصول (2026-09-27)
- الكونيكتور `mcp__42a68644-...` ظاهر في المحادثة. كونيكتور `33fea606` ما انلمس.
- `search_projects`: مشروع واحد `ozjVZ1kj1pRXQydY` (personal، حساب lamsatap). مطابق.
- `search_data_tables` على المشروع: 0 جداول.
- **ما انكتب شي.** بانتظار `systems/N8N-SPEC.md` من مشرف الشبكة.

## الخطوة 2: إنشاء الجداول ورفع البيانات التجريبية (2026-09-27)
- المرجع: `systems/N8N-SPEC.md` (40b25fb) و `systems/n8n/tables/*.json`. قبل أول كتابة تأكدت بـ `search_projects` إن المشروع `ozjVZ1kj1pRXQydY`.
- `node systems/n8n/seed/seed.js`: 9 ملفات CSV بدون BOM، و phone detector self-test: ok.
- الأعمدة والأنواع أُنشئت من ملفات JSON بالضبط، وتأكدت منها بعد الإنشاء بـ `search_data_tables` (كلها مطابقة).
- الرفع صار بـ `add_data_table_rows` (صفوف JSON)، مو استيراد CSV، فما فيه تخمين أنواع. القيم الفاضية = null.

## الجداول
| الجدول | المعرّف | مصدر البيانات | عدد الصفوف |
|---|---|---|---|
| clients | `L2vQJFbR5OpAuRwk` | seed/out/clients.csv (عملاء تجريبيين demo) | 2 |
| units | `HuJnYZFYt3Jukd0A` | seed/out/units.csv (demo01-03 من links.json) | 3 (انقرأت بعد الرفع) |
| subscriptions | `tZCBojaddmxSgJ7a` | seed/out/subscriptions.csv | 0 |
| invoices | `ZywD2nHdG3S26I7a` | seed/out/invoices.csv | 0 |
| ledger | `QwY5Z5g2kDHTamuP` | seed/out/ledger.csv | 0 |
| prospects | `nKMAgkZAHTfHUHQv` | seed/out/prospects.csv | 0 |
| daily_taps | `RUmelZoGTabI3qqQ` | seed/out/daily_taps.csv | 0 |
| payments | **ما انشأ** | seed/out/payments.csv (0 صفوف) | - |
| unit_contacts | **ما انشأ** | seed/out/unit_contacts.csv (0 صفوف) | - |

## ما انعمل
- `payments` و `unit_contacts`: نظام صلاحيات Claude Code منع إنشاءها. **ينشئها صاحب المشروع بنفسه** من واجهة n8n بالأعمدة اللي في `systems/n8n/tables/payments.json` و `unit_contacts.json`، أو يسمح بالإجراء ونعيد.
- ولا workflow، ولا نشر، ولا رسالة. ولا بيانات عملاء حقيقية ولا أرقام جوال.
- ملاحظة لمشرف الشبكة: أعمدة Date ترجع بصيغة `2026-09-27T00:00:00.000Z`، والجداول فيها أعمدة نظام `id`، `createdAt`، `updatedAt` (كانت «غير مؤكد» في المواصفة §0).

## تحديث المدير العام (2026-09-27)
بموافقة صاحب المشروع الصريحة في المحادثة، أنشأ المدير العام الجدولين الناقصين بكونيكتور 42a68644 في المشروع ozjVZ1kj1pRXQydY:
| الجدول | المعرّف | الصفوف |
|---|---|---|
| payments | N7FV7J9liK4m2m8k | 0 |
| unit_contacts | tWEAX3PjGw6HelUb | 0 — تبقى فاضية لين تكتمل شروط loyer (بنود 13 و25 و26) |
الجداول التسعة كلها موجودة الآن.
