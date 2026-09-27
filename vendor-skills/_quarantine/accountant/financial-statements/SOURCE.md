# SOURCE: financial-statements

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `finance/skills/financial-statements`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0 (ملف LICENSE داخل الـplugin، مطابق حرفياً لنص Apache 2.0)
- طريقة التنزيل: curl من raw.githubusercontent.com على الـcommit المثبّت، إلى مجلد مؤقت، ثم نسخ بعد قراءة كل ملف كامل.
- القسم المقترح: accountant

## الملفات (sha256)
- `SKILL.md` — 1a9ba1cc85495eef32fa250b8a4c05e4854430af574a290b855f919dbb557dfc — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/finance/skills/financial-statements/SKILL.md

## ملاحظات الفحص
- قُرئ كل ملف كامل. لا يوجد سكربت ولا ملف تنفيذي ولا binary في ما نزل (ملفات .md فقط).
- لا يوجد نص يطلب تجاوز القواعد، ولا إرسال بيانات لجهة خارجية، ولا طلب مفاتيح أو كلمات مرور. لا أحرف مخفية (zero-width/bidi) ولا تعليقات HTML.
- ملاحظة: يشير إلى `CONNECTORS.md` وعناصر `~~` (موصلات مثل CRM/ERP) غير موجودة عندنا ولم تُنزّل؛ المهارة تشتغل بدونها على بيانات يلصقها المستخدم.
- تعتمد US GAAP (ASC 220/210/230) وتذكر أمر `/flux` غير موجود عندنا. القوالب (قائمة دخل/ميزانية/تدفق نقدي) مفيدة.
- الحالة: في الحجر. لم تُنقل إلى `.claude/skills/`؛ المدير العام يراجع وينقل.
