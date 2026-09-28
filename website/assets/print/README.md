# صور قسم الطباعة (نسخة الموقع)

الأصل: `print/renders/*.png` من قسم الطباعة (main ‏af691d7، المقاسات في `print/renders/SIZES.md`: 756×1134، 2:3، 192dpi).

الفرق الوحيد عن الأصل: **الباركود وهمي وما ينقرى**. الأصل فيه باركود حقيقي يودّي لـ `https://example.com/t/...`، وقاعدة الموقع
(GM-049 و GM-061، ورسالة المدير العام بعد af691d7): أي باركود داخل صورة يا وهمي ما ينقرى، يا يودّي لـ `/demo/` بس.
`tools/web-print-art.py` يخربط وحدات البيانات والصيغة، ويخلي أنماط التحديد والتوقيت والمحاذاة، فالشكل والكثافة نفسها. باقي التصميم بكسل ببكسل نفس الأصل.

الاستخدام: مركّبة داخل صور المشاهد (`brand/photos/composites/README.md`). ما تنعرض في الصفحات لحالها، ولا تنكتب في `assets/mockups/print-art.js`.

الفحص: `python tools/check-qr.py website/assets/print/*.png --jsqr <مجلد jsqr>` (OpenCV و jsQR، بمقاسات وقطع مكبّرة): ولا واحد ينقرى.
لو قسم الطباعة غيّر صورة: `python tools/web-print-art.py` ثم أوامر `brand/photos/composites/README.md` كلها، وافحص من جديد.
