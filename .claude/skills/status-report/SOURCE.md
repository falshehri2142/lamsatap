# SOURCE: status-report

- المستودع: https://github.com/anthropics/knowledge-work-plugins
- المسار: `operations/skills/status-report`
- الـcommit المثبّت: `da38ec1ee89d41e5380e652a97382695003396e7` (تاريخ التنزيل 2026-09-27)
- الترخيص: Apache-2.0 عبر LICENSE الجذري للمستودع فقط (هذا الـplugin ما فيه LICENSE خاص). تنبيه: LICENSE الجذري فيه بعد نص Apache سطور غريبة غير مفهومة (Syntax-file, code vault...) — ليست تعليمات لـClaude لكنها تستحق انتباه المراجع.
- طريقة التنزيل: curl من raw.githubusercontent.com على الـcommit المثبّت، إلى مجلد مؤقت، ثم نسخ بعد قراءة كل ملف كامل.
- القسم المقترح: general-manager

## الملفات (sha256)
- `SKILL.md` — 8c3a21075294a5c5b7a1a7930613e53f0afbdbc12cf9e05d4bd08e6950c0a0d9 — https://raw.githubusercontent.com/anthropics/knowledge-work-plugins/da38ec1ee89d41e5380e652a97382695003396e7/operations/skills/status-report/SKILL.md

## ملاحظات الفحص
- قُرئ كل ملف كامل. لا يوجد سكربت ولا ملف تنفيذي ولا binary في ما نزل (ملفات .md فقط).
- لا يوجد نص يطلب تجاوز القواعد، ولا إرسال بيانات لجهة خارجية، ولا طلب مفاتيح أو كلمات مرور. لا أحرف مخفية (zero-width/bidi) ولا تعليقات HTML.
- ملاحظة: يشير إلى `CONNECTORS.md` وعناصر `~~` (موصلات مثل CRM/ERP) غير موجودة عندنا ولم تُنزّل؛ المهارة تشتغل بدونها على بيانات يلصقها المستخدم.
- الحالة: في الحجر. لم تُنقل إلى `.claude/skills/`؛ المدير العام يراجع وينقل.
