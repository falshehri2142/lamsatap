# صور الموقع: السجل

كل صورة في هذا المجلد تنسجل هنا: الملف، والمصدر، ورابط الصفحة، والمصوّر، والرخصة مع رابطها، والحجم (توجيه صاحب المشروع في `work/2026-09-27-brand-identity/goal.md`).
- **الاختيار والرخص:** `work/2026-09-27-brand-identity/photos.md` (المدير الفني)، والرخصة متأكد منها من صفحة كل صورة يوم 2026-09-27.
- **التنزيل:** بإذن صاحب المشروع (رئيس القسم طلبه مرة وحدة لكل الصور). الأصول بعرض 2400 في `brand/photos/originals/`، برّا `website/`.
- **الشروط:** «الاتجاه 2» §5 في `work/2026-09-27-brand-identity/web-art-director.md`: بدون وجوه ولا نص مقروء ولا شعارات، وبدون فلتر ولا قلب ولا نص فوق الصورة، و`alt=""` لأنها زخرفية.
- **النسبة للمصوّر:** مو شرط في الرخصتين. قرار منا نكتبها هنا.

| الخانة | الملف | المصدر | صفحة الصورة | المصوّر | الرخصة | الحجم (800 / 1600) |
|---|---|---|---|---|---|---|
| ص1 ضيافة (البطل) | `hero-hospitality-800.webp` و`hero-hospitality-1600.webp` | Pexels 17874845 | https://www.pexels.com/photo/close-up-of-traditional-handcraft-17874845/ | Junaid A Yaraa، https://www.pexels.com/@junaid-a-yaraa-3778117/ | Pexels License، https://www.pexels.com/license/ | 800×533، 27,990 بايت / 1600×1067، 75,962 بايت (الحد 70KB / 180KB) |
| ص2 كاونتر (المحلات) | `shop-counter-800.webp` و`shop-counter-1600.webp` | Unsplash YeDV8VleuOs | https://unsplash.com/photos/a-close-up-of-a-wooden-table-in-a-restaurant-YeDV8VleuOs | Jonathon Nielsen، https://unsplash.com/@jonathon_nielsen_ | Unsplash License، https://unsplash.com/license | 800×533، 29,568 بايت / 1600×1067، 100,332 بايت (الحد 60KB / 140KB) |
| ص3 مدخل شقة (المضيفين) | `host-entry-800.webp` و`host-entry-1600.webp` | Pexels 7167082 | https://www.pexels.com/photo/interior-of-spacious-corridor-in-flat-7167082/ | Max Vakhtbovych، https://www.pexels.com/@artbovich/ | Pexels License، https://www.pexels.com/license/ | 800×534، 31,714 بايت / 1600×1068، 90,776 بايت (الحد 60KB / 140KB) |
| ص4 لحظة اللمس (الخاتمة) | `touch-moment-800.webp` و`touch-moment-1600.webp` | Pexels 1458283 | https://www.pexels.com/photo/person-using-smartphone-1458283/ | Adrienn، https://www.pexels.com/@adrienn-638530/ | Pexels License، https://www.pexels.com/license/ | 800×533، 14,240 بايت / 1600×1067، 37,646 بايت (الحد 60KB / 140KB) |

**أصول جديدة (الاتجاه 3، بعد GM-043):**
- انزلت بإذن صاحب المشروع يوم 2026-09-27، والاختيار من المدير الفني (`web-art-director.md` §7.1).
- الملفات في `brand/photos/originals/`، وما انحولت للحين.
- المطوّر يكمّل عمود الحجم (WebP) بعد التحويل.

| الخانة | الأصل | المصدر | صفحة الصورة | المصوّر | الرخصة | الأصل (بكسل، بايت) |
|---|---|---|---|---|---|---|
| R1 بطل المطاعم وباب المطاعم | `restaurant-dallah.jpg` | Pexels 14941019 | https://www.pexels.com/photo/a-silver-tea-pot-sits-on-a-tray-with-a-plate-of-food-14941019/ | Shameel mukkath | Pexels License، https://www.pexels.com/license/ | 2400×1600، 356,511 |
| R2 قصة المطاعم (طاولة ← جوال ← منيو) | `restaurant-phone-stand.jpg` | Pexels 6373125 | https://www.pexels.com/photo/a-smartphone-with-blank-screen-on-a-bamboo-cellphone-stand-6373125/ | KATRIN BOLOVTSOVA | Pexels License، https://www.pexels.com/license/ | 2400×1600، 144,031 |
| H1 و H2 بطل المضيفين وبابهم وقصتهم | `host-hallway-door.jpg` | Pexels 30445143 | https://www.pexels.com/photo/modern-minimalist-hallway-with-wooden-door-30445143/ | aksinfo7 universe | Pexels License، https://www.pexels.com/license/ | 3024×4032، 1,422,620 |

**التحويل (web-builder، 2026-09-27):**
- `python tools/convert-images.py brand/photos/originals/<الاسم>.jpg <الاسم>`: Pillow 12.3.0، WebP جودة 84، بدون تكبير، وبدون EXIF ولا ملف ألوان (الأصل الوحيد اللي فيه ملف ألوان sRGB، فما يتغير اللون).
- `node tools/build-home-minis.cjs`: يركّب `<img>` في خانتها بـ `srcset` و`sizes` و`width` و`height`. ص1 `fetchpriority="high"`، والباقي `loading="lazy" decoding="async"`.
- القص بـ `object-fit: cover`، و`object-position` من `photos.md` في `assets/home.css`.

**صورة جديدة:** نفس الخطوات، وصف جديد هنا قبل ما تنرفع.
