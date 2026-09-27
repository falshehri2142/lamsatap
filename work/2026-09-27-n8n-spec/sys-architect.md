# sys-architect — مواصفة n8n (الجولة 3)

الناتج: `systems/N8N-SPEC.md` النسخة 2 (9 جداول، 6 workflows، مراحل البناء، التكاليف بمصادرها).

## مصادر رسمية
- أنواع الأعمدة Boolean/Date/Number/String: docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/tables.md
- عمليات الصفوف: .../datatable/rows.md
- حد 200 MiB + استيراد/تصدير CSV: docs.n8n.io/build/work-with-data/data-tables.md
- n8n Cloud Starter €20 بالشهر (دفع سنوي)، Pro €50: n8n.io/pricing (أرقام الدفع الشهري €24/€60 وحدود التجربة من مدقق الحقائق، تحتاج نظرة)
- إعدادات حفظ التنفيذ وRedact: صفحة configure workflow settings في docs.n8n.io (من مدقق الحقائق)
- واتساب: الدفع لكل رسالة قالب مسلّمة، utility داخل نافذة الخدمة مجانية: developers.facebook.com/docs/whatsapp/pricing

## تصحيحات الجولة 2 (بعد HOLD من المشكّك وملاحظات مدقق الحقائق)
- (أ): شلت Webhook واتساب الوارد كمدخل. مع API المدخل الوحيد زر الصفحة (ref + نوع الطلب + نص المشكلة). بدون API ما فيه workflow. لا static data ولا عداد؛ كل رسالة تمر بـ Send-and-Wait بالنص الجديد فقط. الإرسال للمضيف والعاملة (بموافقة موثقة). إعدادات حفظ التنفيذ موثقة. فحص headers الـ Webhook خطوة في البناء. سؤالين لـ loyer (منطقة الاتحاد الأوروبي، ووقت الضغط في إيميل الموافقة).
- (ب): Get للحالتين، مهلة 14 يوم (اقتراح) ثم expired، Form تجديد يحدث التواريخ ويصفّر الأعلام، و`reminder_*_sent` يقلبه صاحب المشروع بعد الإرسال الفعلي.
- (ج): انقسمت (ج1) إصدار فاتورة و(ج2) دفعة. الموافقة قبل أي Insert، ما فيه دفعة بدون فاتورة، و`paid` بس لما المجموع ≥ المبلغ. القيد سطرين من دليل الحسابات، مع فحص إن المدين = الدائن.
- عام: كل رسالة لعميل تمر بموافقة. Basic Auth على كل Form. المنطقة الزمنية Asia/Riyadh. Data Table Get قبل أي Code يحسب من الجدول. أحلت لـ `management/n8n-access.md`. التسويق مؤجل. خطوة إنشاء الجدول بأنواعه ثم استيراد CSV وفحص BOM. الأرقام اللي ما اعتمدها أحد معلّمة «اقتراح».

## تغييرات الأعمدة (للباني)
| الجدول | التغيير |
|---|---|
| `units` | + `ref` String (door فقط، 12 حرف أو أكثر عشوائي، فاضي في seed) |
| `unit_contacts` | **جدول جديد**: `code` String (مفتاح)، `client_id` String، `host_whatsapp` String، `worker_whatsapp` String، `worker_consent_date` Date، `worker_consent_ref` String، `status` String. seed فاضي |
| `subscriptions` | + `variant` String (`with_install`/`no_install` لـ review_sub)، + `period` String (`annual`/`monthly`)، `bundle` = `shop_bundle`/`review_sub`/`host_free_hw` فقط (شلت `review_sub_lite`)، + `renewal_price_sar` Number |
| `clients` | + `whatsapp` String |
| `ledger` | + `line_no` Number؛ المفتاح `entry_no + line_no`؛ `owner_approved` String yes/no |
| `payments` | `owner_confirmed` String yes/no |

## تصحيحات الجولة 3 (المشكّك: SHIP AFTER FIXES)
- N2: Redact انشال كحماية (Enterprise بس، وما يغيّر المحفوظ).
- N3: (أ) صار door-intake (يرد فوراً ويمرر code والنص وهل فيه عاملة) + sub-workflow door-approve فيه Send-and-Wait بمهلة 30 دقيقة (اقتراح).
- N4: أسعار واتساب. ما لقيت جملة «utility داخل النافذة مدفوعة من 2026-10-01» في الصفحة اللي انفتحت لي، فكتبتها «غير مؤكد» والتكلفة تفترض إنها مدفوعة. خفض أسعار السعودية بتاريخ 2025-10-01 (مقتبس). الريال: 2026-04-01 حسب updates-to-pricing، وفيه تعارض مع صفحة pricing.
- N5: رابط «أرسلت» يعبي الحقول من الرابط في production بس. في التجربة يُكتب subscription_id يدوياً، وهذا صار في معيار «جاهز».
- N6: `ref` يولّده `links-cli.js add --type door` (اقتراح يحتاج تعديل من الباني)، وseed ينقله، وإعادة الاستيراد Upsert على `code`.
- N9: رقم الفاتورة ينحسب بعد «موافق». دفعة النقد: `bank_ref = CASH-<invoice_no>-<n>`.
- N10: `renewal_confirmed_at` و`renewal_confirmed_ref`.
- N11: قاعدة client_id للعميل الجديد.
- أسئلة جديدة: هل Send-and-Wait يشتغل والـ workflow غير منشور؟ وهل مهلة 180 ثانية في التجربة تشمل وقت الانتظار؟

## أعمدة تغيّرت في الجولة 3
- `subscriptions`: + `renewal_confirmed_at` Date، + `renewal_confirmed_ref` String.
- `units.ref`: نفس العمود، والمصدر صار `links.json` (حقل `ref` يولّده links-cli.js لـ door).
- ما فيه تغيير أعمدة غيرها.

## غير مؤكد
حد الصفوف، headers الـ Webhook، منطقة استضافة الـ instance، سعر الدفع الشهري في n8n ومدة التجربة، توفر Send and Wait في Starter، وسعر رسالة واتساب للسعودية.
