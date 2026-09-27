# n8n workflows لمسة تاب (نسخ المصدر)

كل ملف `.js` هنا هو كود Workflow SDK اللي انبنى فيه الـ workflow في n8n (مشروع `ozjVZ1kj1pRXQydY`، مجلد «LamsaTap workflows (unpublished)» = `qnVr7m13MSO5AzVk`). **كلها غير منشورة** (GM-006)؛ النشر قرار صاحب المشروع. حفظ بيانات التنفيذ مطفّى في كلها، والمنطقة الزمنية Asia/Riyadh.

| الملف | الاسم في n8n | المعرّف | الحالة |
|---|---|---|---|
| `get-channel.js` | LT get-channel | `G36lB9xwPJEK1s7R` | مبني، `channel = email`؛ صاحب المشروع يعبّي owner_email/owner_whatsapp/wa_phone_number_id |
| `owner-notify.js` | LT owner-notify | `tyTmFhxRAh99uQIO` | مبني؛ يحتاج credential «Gmail LamsaTap» (والواتساب بعد التفعيل) |
| `daily-report.js` | LT (د) daily report | `ujpzEBdZlnoQYyVw` | مبني؛ 20:00 يومياً |
| `client-send.js` | LT client-send | `wrxHqyElTEwoCPOX` | مبني؛ ما يُنادى إلا بعد موافقة؛ ما يرسل إيميل لعميل |
| `renewal-reminder.js` | LT (ب) renewal reminder | `LHo4RXdblHtz4oe8` | مبني؛ 09:00 + نموذجين («أرسلت»، «سجّل تجديد») |
| `tap-import.js` | LT (و) tap totals import | `2gTrHuXErO13A5FJ` | مبني؛ Webhook بـ header auth (credential «LamsaTap tap import»)؛ مصدر العد (Function + D1) ما انبنى |
| `door-report.js` | LT (أ) door report | `vFwm5pET4Ft199rk` | مبني؛ لصاحب المشروع بس (code + place)، التحويل يدوي (GM-017)؛ النشر بعد بند 23 |
| `invoice-payment.js` | LT (ج) invoice and payment | `hQOihebIag7aRUmK` | مبني؛ نموذجين («أصدر فاتورة»، «سجّل دفعة»)؛ ولا كتابة قبل الموافقة |
| `telegram-inbound.js` | LT telegram inbound | `mocsmio6hCqQAMvk` | مبني (GM-047)؛ credential «Telegram LamsaTap bot»؛ رسائل العملاء ⇄ صاحب المشروع بدون حفظ، وروابط الوحدة code+place بس |
| `sales-followup.js` | LT (هـ) sales follow-up | `q6pJoS9H7pmdLrds` | مبني؛ 09:00 + نموذج (credential «LamsaTap forms» Basic Auth) |

الـ credentials ينشئها صاحب المشروع بنفسه في n8n: «Gmail LamsaTap» (احتياط)، «WhatsApp LamsaTap» (بعد تفعيل Cloud API، §4.1 في المواصفة).

## اختبار
- `node systems/n8n/workflows/test-telegram.js`: تصنيف رسائل البوت (9 PASS).
- (تليجرام) انجرب بـ test_workflow برسالة عميل مع تثبيت عقد التليجرام: نجح.
- `node systems/n8n/workflows/test-invoice-payment.js`: رقم الفاتورة، القيد المتوازن، الدفعة الجزئية/الكاملة، النقد، والرفض (11 PASS).
- (ج2) انجرب في n8n بفاتورة غير موجودة: نجح وراح لمسار «ما انسجلت» بدون كتابة.
- `node systems/n8n/workflows/test-door-report.js`: حذف أرقام الجوال من نص البلاغ (7 حالات PASS).
- (أ) انجرب بـ test_workflow بـ ref غير موجود: نجح ووقف بدون إرسال.
- `node systems/n8n/workflows/test-code-nodes.js systems/n8n/workflows`: يشغّل منطق عقد Code (التصنيف، التقرير، فلترة اللمسات) على بيانات وهمية.
- (و) انجرب في n8n بـ test_workflow مع تثبيت الـ Webhook والكتابة: نجح. سجل التنفيذ ما انحفظ (حفظ التنفيذ مطفّى = صح).

## قبل أي تشغيل حقيقي (صاحب المشروع)
1. يعبّي عقدة `CHANNEL` في «LT get-channel»: owner_email (والواتساب بعد التفعيل).
2. ينشئ credentials: «Gmail LamsaTap»، «LamsaTap forms» (Basic Auth)، «LamsaTap tap import» (Header Auth)، و«WhatsApp LamsaTap» بعد التفعيل.
3. يعتمد قوالب واتساب (§4.1): owner_alert، owner_approval، renewal_reminder، invoice_issued.
4. النشر لكل workflow قراره (GM-006). (أ) بعد بند 23.

## إعدادات انضبطت بعد الإنشاء (ما تنحفظ في `*.js`)
كل الـ workflows: Save failed/successful production executions = none، Save manual executions = false، Timezone = Asia/Riyadh.
الـ sub-workflows (get-channel، owner-notify، client-send): callerPolicy = workflowsFromSameOwner.
(أ) door report: `onlyRunIf` على الـ Webhook (ref من 12-32 حرف/رقم وطلب checkout/maintenance) — موجود في الكود كمان.
