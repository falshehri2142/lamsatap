# sys-tester: التحقق من مصادر gateways.md (2026-09-28، WebFetch)

| # | الادعاء | النتيجة | الاقتباس من المصدر |
|---|---|---|---|
| 1 | Tap: مدى 1% بحد 200 ر.س من 2023-09-01 | PASS | "1% with a cap of SAR 200" ... effective September 1st, 2023 (blog.tap.company/new-mada-fees-saudi) |
| 2 | Tap: مدى عبر Apple Pay بدون رسوم إضافية | PASS | نفس المدونة: الرسوم نفسها على Apple Pay بمدى، بدون رسوم إضافية |
| 3 | Tap: روابط دفع وفواتير | PASS جزئي | "send payment links" (صفحة SMB). الفواتير ما ظهرت نصاً |
| 4 | Tap: «recurring subscriptions» | FAIL | عبارة الاشتراكات المتكررة ما ظهرت في صفحة SMB. تتحول إلى «غير مؤكد» |
| 5 | Moyasar: التسوية مدى 24 ساعة–3 أيام، ائتمان 7–14 يوم | FAIL | المدد موجودة لكنها لـ**الاسترداد لبطاقة العميل** وليست تسوية للتاجر: Mada "24 hours to 3 business days", Credit "7 to 14 business days" |
| 6 | Moyasar: تقبل وثيقة العمل الحر + حساب بنكي سعودي | FAIL (UNCHECKED) | صفحة startups-and-freelancers ما فيها أي ذكر لوثيقة العمل الحر ولا للحساب البنكي |
| 7 | PayTabs Paymes: 49 ر.س/شهر، مدى 1%، ائتمان 2.25% + 1 ر.س، أسعار تجريبية | PASS | "SAR 49 / month", "Mada cards - 1%", "Credit Cards 2.25% + SAR1", "currently part of a testing phase" |

ملاحظة: WebFetch يلخص الصفحة بنموذج صغير، فممكن نص موجود ما ظهر (البند 4 و6). يُفضّل فتحها يدوياً قبل الاعتماد.
