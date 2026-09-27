# web-builder: موقع الشركة + القوالب (GM-006)

النصوص حرفياً من `web-ux.md`. سطر الجوالات في الرئيسية أخذت الصياغة الأأمن: «وإذا جوالك ما يقرأ الشريحة، امسح الباركود.» (توافق آيفون غير مؤكد).

## الملفات (بايت)
| الملف | الحجم |
|---|---|
| website/index.html | 3668 |
| website/config.js | 494 |
| website/assets/site.css | 2333 |
| website/assets/app.js | 1759 |
| website/templates/menu/index.html + data.js | 2904 + 1016 |
| website/templates/links/index.html + data.js | 1638 + 668 |
| website/templates/wifi/index.html + data.js | 2053 + 210 |
| website/templates/rental-guide/index.html + data.js | 4225 + 590 |
| website/demo/review/index.html (معدّل) | 3015 |
| website/demo/review/qr-sheet.html (معدّل) | 2145 |
| website/demo/review/config.js (معدّل) | 253 |
| website/vendor/qrcode-generator.js | 56856 |
| website/README.md | — |

أثقل صفحة: qr-sheet مع المكتبة ≈ 62KB (< 100KB).

## القرارات
- `config.js` مشترك: `window.SITE = {domain, companyName, whatsapp}`. الدومين `https://example.com` متوافق مع `systems/shortlinks/config.json`.
- `demo/review/config.js` صار يولّد `DEMO_URL` من `SITE.domain` + `/demo/review/`. الورقة تستخدم `vendor/` المحلية بدل jsdelivr.
- المكتبة نزلت من `https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js`، ترويسة الرخصة MIT باقية، وأضفت سطر مصدر فوقها.
- واتساب فاضي: الزر يصير معطّل بنص «واتساب: الرقم قريباً».
- كل البيانات بـ `<script src="data.js">`، بدون `fetch()`. النص يدخل بـ `textContent` أو `esc()` (بدون حقن). روابط صفحة الروابط لازم `https://`.
- التشيك أوت: زر ثم تأكيد «متأكد إنك طلعت؟ نبلغ المضيف بخروجك.»، والبلاغ والتشيك أوت placeholder فقط.
- ما فيه رقم مضيف، ولا حجز أو دفع، ولا حقول بيانات للضيف، ولا زر طلب في المنيو.

## كيف تعبّي قالب
تعدّل `data.js` داخل القالب فقط، وتخلي `demo:false`. التفاصيل في `website/README.md`.

## فحص سريع (ui-probe، file://، 1440 و390)
الصفحات السبع كلها: errors=0، overflowX=0، lowContrast=0، tinyText=0. الفحص الكامل (الوضع الداكن، الخادم المحلي، والطلبات الخارجية) على web-qa.

## غير مؤكد
- ما انقرأ الباركود بكاميرا جوال من ورقة مطبوعة.
- زر النسخ من `file://` يعتمد على `execCommand` (قديمة)، وما انجرّب على جوال حقيقي.
