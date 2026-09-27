# SOURCE: review-contract

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `legal/skills/review-contract`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0 (ملف LICENSE داخل الـplugin، مطابق حرفياً لنص Apache 2.0)
- طريقة التنزيل: curl من raw.githubusercontent.com على الـcommit المثبّت، إلى مجلد مؤقت، ثم نسخ بعد قراءة كل ملف كامل.
- القسم المقترح: legal-advisor

## الملفات (sha256)
- `SKILL.md` — 3a6413475f51adedbff130f4d5aabbeeacfb2abd323e0338bc91c21937fbfb76 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/legal/skills/review-contract/SKILL.md

## ملاحظات الفحص
- قُرئ كل ملف كامل. لا يوجد سكربت ولا ملف تنفيذي ولا binary في ما نزل (ملفات .md فقط).
- لا يوجد نص يطلب تجاوز القواعد، ولا إرسال بيانات لجهة خارجية، ولا طلب مفاتيح أو كلمات مرور. لا أحرف مخفية (zero-width/bidi) ولا تعليقات HTML.
- ملاحظة: يشير إلى `CONNECTORS.md` وعناصر `~~` (موصلات مثل CRM/ERP) غير موجودة عندنا ولم تُنزّل؛ المهارة تشتغل بدونها على بيانات يلصقها المستخدم.
- تطلب playbook محلي (`legal.local.md`) غير موجود عندنا؛ أمثلتها GDPR/أمريكية. المرجع القانوني لنا يبقى سكيل legal-advisor والأنظمة السعودية.
- الحالة: في الحجر. لم تُنقل إلى `.claude/skills/`؛ المدير العام يراجع وينقل.
