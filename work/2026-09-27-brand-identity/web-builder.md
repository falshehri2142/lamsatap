# web-builder — تطبيق هوية لمسة تاب على website/ (GM-008)

## النسخ (مطابقة من brand/)
- website/assets/brand/: tokens.css (3898B)، fonts/readex-pro-arabic-latin.woff (50296B) + OFL.txt، lamsatap-horizontal.svg و-dark.svg (9358B لكل واحد)، lamsatap-icon.svg، favicon.svg (= lamsatap-icon-small.svg، 792B)، apple-touch-icon.png (= png/lamsatap-icon-180.png، 4516B).
- website/favicon.ico (= brand/logo/favicon.ico، 2510B).

## التعديلات
- كل الصفحات السبع: ico (32x32) + favicon.svg + apple-touch-icon بمسارات نسبية، و tokens.css قبل site.css.
- assets/site.css: المتغيرات القديمة = var(--lt-*)، حذف ألوان الداكن المكررة، الخط --lt-font-ui، التركيز --lt-focus، footer.by.
- index.html: الشعار الأفقي في <picture> (فاتح/داكن)، alt «لمسة تاب — LamsaTap»، body بـ --lt-font-brand. المحتوى والترتيب والأسعار ما تغيرت.
- القوالب الأربعة + demo/review/index.html: --lt-font-ui فقط، وسطر «بواسطة لمسة تاب» مع favicon.svg 18px (الاسم من SITE.companyName، ونص احتياطي ثابت). demo/review/index.html صار ياخذ ألوانه من --lt-* (ما يربط site.css).
- qr-sheet.html: الشعار الأفقي فوق، خط الهوية، الباركود أسود على أبيض بدون تغيير.
- config.js: companyNameEn: "LamsaTap". app.js: الاحتياطي «لمسة تاب». ما بقى «[اسم الشركة]» في الصفحات.
- README.md: قسم «الهوية».

## الأحجام (بدون الخط)
index 4.2KB، القوالب 2–4.6KB، demo 3.4KB، qr-sheet 2.6KB + site.css 2.5KB + tokens 3.9KB + الشعار 9.4KB. كلها أقل بكثير من 100KB.

## الفحص (ui-probe من file://، 390 و1440، فاتح وداكن)
7 صفحات × 4: errors=0، overflowX=0، lowContrast=0، tinyText=0.

## غير مؤكد
- إن ملف الخط ما ينزل فعلاً في صفحات الزبون: مبني على سلوك المتصفحات (@font-face ينزل عند الاستخدام فقط)، ما قست طلبات الشبكة.
- عرض favicon.ico/apple-touch-icon على أجهزة حقيقية ما جربته.
- لون نص «واتساب: الرقم قريباً» المعطّل (opacity .6) ما قسته يدوياً؛ الأداة ما أبلغت عن تباين منخفض.
