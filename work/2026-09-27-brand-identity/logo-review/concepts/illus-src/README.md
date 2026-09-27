# illus-src: مولّد مفاهيم web-illustrator للشعار (داخلي)

يولّد ملفات المفاهيم الأربعة (illus-1 إلى illus-4) من أرقام هندستها، ويشغّل brand/src/check_logo.py و mark_test.py، ويرسم الأوراق واللوحتين.
ما يعدّل brand/ ولا website/. الملفات المؤقتة تنحفظ برّا المشروع (مجلد النظام المؤقت، lamsatap-illus).

    python work/2026-09-27-brand-identity/logo-review/concepts/illus-src/run.py

- concepts.py: الهندسة (السطح المايل mail() والمثلث tri())، وكل الأرقام في CONCEPTS.
- files.py: ملفات SVG لكل مفهوم (الرمز بألوانه، ولون واحد، وصورة الحساب، والقفل الأفقي والعمودي).
- lockup.py: الاسم مسارات من خط Readex Pro (تشكيل العربي بـ HarfBuzz)، والتركيب حسب القسم 16.5 عند المدير الفني.
- sheet.py و boards.py: الأوراق ولوحتي الحرف والمقارنة. item8.py: البند 8 للقفل الأفقي بكود check_logo.py نفسه.
- search_space.py: البحث اللي بيّن إن مساحة «الميلان» تضيق مع قواعد السكربت (الأرقام في ../web-illustrator.md).

يحتاج: Edge، و numpy و opencv-python و Pillow و fonttools و uharfbuzz (نفس متطلبات brand/src).
