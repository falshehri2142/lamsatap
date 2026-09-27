# sys-builder — مخططات Data Tables وسكربت seed (GM-013)

## الملفات
- `systems/n8n/tables/*.json` (9 جداول): الاسم، المفتاح، المصدر، مين يكتب، الأعمدة وأنواعها.
- `systems/n8n/seed/seed.js`: node بدون مكتبات. التشغيل: `node systems/n8n/seed/seed.js` → `systems/n8n/seed/out/*.csv` (UTF-8 بدون BOM حسب المواصفة، والمجلد في `.gitignore`).
- `systems/n8n/seed/compare-spec.js`: يقارن المخططات بجداول §1 في `systems/N8N-SPEC.md` (الاسم والنوع والترتيب) ويطبع أي فرق. يرفض أي نوع غير Boolean/Date/Number/String.

## الجداول والأعمدة (المرجع: N8N-SPEC.md، الجولة 3)
| الجدول | المفتاح | الأعمدة |
|---|---|---|
| clients | client_id | client_id, name, kind, district, whatsapp, status, created, notes |
| subscriptions | subscription_id | subscription_id, client_id, bundle (shop_bundle/review_sub/host_free_hw), variant, period, units, start_date, end_date, price_sar, renewal_price_sar, status, renewal_confirmed, renewal_confirmed_at (Date), renewal_confirmed_ref, reminder_30_sent, reminder_7_sent |
| units | code | code, ref, client_id, place, dest, type (door/public), status, programmed |
| unit_contacts | code | code, client_id, host_whatsapp, worker_whatsapp, worker_consent_date (Date), worker_consent_ref, status |
| invoices | invoice_no | نفس `accounting/invoices.csv` بالضبط |
| payments | invoice_no+date+bank_ref | نفس `accounting/payments.csv` بالضبط |
| ledger | entry_no+line_no | entry_no, line_no (Number)، وبعدها أعمدة `ledger.csv` |
| prospects | prospect_no | prospect_no, name, activity, district, reviews_at_visit, owner_rep, stage, last_followup, notes |
| daily_taps | code+day+src | code, day, src, count (public فقط) |

الأنواع Boolean/Date/Number/String بس. owner_confirmed وowner_approved نص بقيم yes/no.

## حمايات seed.js
- **أعمدة ممنوعة:** phone, mobile, msisdn, jawal, guest*, ip, user_agent, wa_id, sender, last_tap, tap_time, touched_at. يوقف لو لقى وحدة منها في أي مخطط.
- **فحص الجوال:** قبل الفحص يحوّل الأرقام الهندية والفارسية لأرقام إنجليزية، ويشيل المسافات والشرطات والنقاط والأقواس. الصيغ اللي فيها بادئة (05، +966، 00966، 966) تنفحص في كل الأعمدة. الـ 9 أرقام اللي تبدأ بـ 5 بدون بادئة ما تنفحص في أعمدة المراجع والأرقام (bank_ref, invoice_no, entry_no, payment_ref, reference, code, ref, account_code)، عشان 512345678 رقم عملية مقبول. فيه فحص ذاتي يتأكد من هالقاعدة.
- **أعمدة لازم تبقى فاضية:** clients.whatsapp وunit_contacts.host_whatsapp وworker_whatsapp. seed يوقف لو فيها أي قيمة، وunit_contacts قالب فاضي قبل الإطلاق.
- **line_no:** يُعطى بالترتيب داخل كل entry_no. رأس `ledger.csv` لازم يطابق المخطط بدون line_no.
- **units.ref:** `links-cli.js add ... --type door` يولّد ref من 16 حرف عشوائي (`crypto.randomBytes`) ويكتبه في `links.json`. seed ينقله للجدول لوحدات door بس، ووحدات public تبقى فاضية.

## التشغيل الفعلي (2026-09-27، الجولة 3)
- `seed.js`: units 3 صفوف و8 أعمدة، clients صفّين، ledger 10 أعمدة، subscriptions 14، unit_contacts 7، والفحص الذاتي «ok».
- `compare-spec.js`: الجداول التسعة كلها OK، والنتيجة «no differences».
- **تجربة على نسخة في مجلد مؤقت:** أضفت أسطر دفتر وهمية، فطلع line_no صح: JE-0001 أخذ 1 و2، وJE-0002 أخذ 1. وأضفت دفعة فيها `٠٥٥ ١٢٣ ٤٥٦٧`، فوقف السكربت برسالة «phone-like value in payments.bank_ref». ملفات المشروع ما تغيرت.

## الجولة 4 (2026-09-27)
- شلت BOM، وتأكدت إن أول 3 بايتات في units.csv هي `cod`.
- صلّحت فحص الجوال (N8): 512345678 في bank_ref صار ينقبل، ونفس الرقم في notes يوقف السكربت.
- أضفت renewal_confirmed_at وrenewal_confirmed_ref بعد ما المعماري حدّث المواصفة، وsubscriptions صار 16 عموداً.
- تجربة على نسخة في مجلد مؤقت (`--dir`): `add door01 --type door` كتب ref=`94mfvvdrjfvex6kp` في links.json، وseed نقله لـ units.csv، ودفعة فيها bank_ref=512345678 مرّت. `links.json` الأصلي ما تغيّر.
- seed اشتغل ونجح والفحص الذاتي ok. compare-spec طلع الجداول التسعة OK والنتيجة «no differences».

## الموقف
أتفق مع المواصفة وما عندي اعتراض.

## غير مؤكد
- ما أعرف إذا Data Tables تدعم مفتاحاً من أكثر من عمود، فالمفتاح يُطبَّق في الـ workflow.
- clients بلا مصدر منظم، فالسكربت يعبّي client_id والحالة بس.
- demo03 مكانها «الباب» لكن `links.json` ما فيه `type`، فطلعت public.
- فحص الجوال خاص بالجوال السعودي بس. الأرقام الأجنبية والأرضية ما ينمسك منها شي.
