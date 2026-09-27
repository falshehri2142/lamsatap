# n8n workflows لمسة تاب (نسخ المصدر)

كل ملف `.js` هنا هو كود Workflow SDK اللي انبنى فيه الـ workflow في n8n (مشروع `ozjVZ1kj1pRXQydY`، مجلد «LamsaTap workflows (unpublished)» = `qnVr7m13MSO5AzVk`). **كلها غير منشورة** (GM-006)؛ النشر قرار صاحب المشروع. حفظ بيانات التنفيذ مطفّى في كلها، والمنطقة الزمنية Asia/Riyadh.

| الملف | الاسم في n8n | المعرّف | الحالة |
|---|---|---|---|
| get-channel (داخل README، 3 عقد) | LT get-channel | `G36lB9xwPJEK1s7R` | مبني، `channel = email`؛ صاحب المشروع يعبّي owner_email/owner_whatsapp/wa_phone_number_id |
| `owner-notify.js` | LT owner-notify | `tyTmFhxRAh99uQIO` | مبني؛ يحتاج credential «Gmail LamsaTap» (والواتساب بعد التفعيل) |
| `daily-report.js` | LT (د) daily report | `ujpzEBdZlnoQYyVw` | مبني؛ 20:00 يومياً |
| `client-send.js` | LT client-send | `wrxHqyElTEwoCPOX` | مبني؛ ما يُنادى إلا بعد موافقة؛ ما يرسل إيميل لعميل |
| `renewal-reminder.js` | LT (ب) renewal reminder | `LHo4RXdblHtz4oe8` | مبني؛ 09:00 + نموذجين («أرسلت»، «سجّل تجديد») |
| `sales-followup.js` | LT (هـ) sales follow-up | `q6pJoS9H7pmdLrds` | مبني؛ 09:00 + نموذج (credential «LamsaTap forms» Basic Auth) |

الـ credentials ينشئها صاحب المشروع بنفسه في n8n: «Gmail LamsaTap» (احتياط)، «WhatsApp LamsaTap» (بعد تفعيل Cloud API، §4.1 في المواصفة).
