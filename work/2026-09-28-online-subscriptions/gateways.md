# مقارنة بوابات الدفع السعودية (بحث 2026-09-28، sys-builder، جهد منخفض)

المصادر رسمية فقط. صفحات الأسعار العامة لـ Moyasar وHyperPay وGeidea أعطت 404 أو ما تنشر أرقام (الأسعار عبر المبيعات). أي خانة بدون رابط = «غير مؤكد».

| البند | Moyasar | Tap Payments | HyperPay | PayTabs | Geidea |
|---|---|---|---|---|---|
| رسوم مدى | غير مؤكد (الأسعار عبر المبيعات) [FAQ](https://moyasar.com/en/resources/faqs/) | 1% بحد أقصى 200 ر.س (من 2023-09-01) [مدونة Tap](https://blog.tap.company/new-mada-fees-saudi/) | غير مؤكد (عبر مدير الحساب) [FAQ](https://www.hyperpay.com/faq/) | 1% (باقة Paymes، تجريبية) [pricing](https://www.paytabs.com/en/pricing/) | غير مؤكد |
| فيزا/ماستر | غير مؤكد | غير مؤكد | غير مؤكد | 2.25% + 1 ر.س (Paymes) [pricing](https://www.paytabs.com/en/pricing/) | غير مؤكد |
| Apple Pay | مدعوم (غير مؤكد الرسوم) | مدعوم؛ مدى عبر Apple Pay بدون رسوم إضافية [مدونة Tap](https://blog.tap.company/new-mada-fees-saudi/) | مدعوم [FAQ](https://www.hyperpay.com/faq/what-payment-options-does-hyperpay-provide/) | غير مؤكد | محافظ رقمية مدعومة [links](https://www.geidea.net/ksa/en/solutions/payments/payment-links) |
| تأسيس/شهري | غير مؤكد | غير مؤكد | غير مؤكد | 49 ر.س/شهر (Paymes) [pricing](https://www.paytabs.com/en/pricing/) | غير مؤكد |
| التسوية | غير مؤكد (المدد في FAQ هي مدد **استرداد** لبطاقة العميل، مو تسوية للتاجر — sys-tester) | فيه صفحة دعم للتحويلات، المدة غير مؤكدة [support](https://support.tap.company/en/support/solutions/articles/153000140301-when-are-payouts-made-to-bank-accounts-in-saudi-arabia-) | غير مؤكد | غير مؤكد | غير مؤكد |
| روابط دفع/فواتير | غير مؤكد (لم أفتح صفحتها) | نعم: روابط دفع وفواتير [SMB](https://www.tap.company/en-sa/products/small-businesses) | فواتير HyperBill (رابط فاتورة ظاهر في البحث، غير مؤكد التفاصيل) | Paymes (غير مؤكد التفاصيل) | نعم: روابط، QR، فواتير، API [links](https://www.geidea.net/ksa/en/solutions/payments/payment-links) |
| Webhooks | غير مؤكد (توثيق [docs](https://docs.moyasar.com/)) | غير مؤكد | غير مؤكد | غير مؤكد | غير مؤكد |
| اشتراكات/تجديد | غير مؤكد | غير مؤكد (العبارة ما انلقت في الصفحة — sys-tester) | غير مؤكد | غير مؤكد | غير مؤكد |
| التسجيل | صفحة للفريلانسر موجودة [freelancers](https://moyasar.com/en/solutions/startups-and-freelancers/)؛ قبول وثيقة العمل الحر والحساب البنكي **غير مؤكد** (ما انذكر — sys-tester) | يستهدف فريلانسر ومنشآت صغيرة [SMB](https://www.tap.company/en-sa/products/small-businesses) (الوثائق غير مؤكدة) | غير مؤكد | غير مؤكد | «معلومات أساسية عن النشاط» [links](https://www.geidea.net/ksa/en/solutions/payments/payment-links) (الوثائق غير مؤكدة) |
| n8n | ما فيه عقدة جاهزة معروفة، HTTP Request (غير مؤكد) | نفسه | نفسه | نفسه | نفسه |

## الخلاصة
1. لمحل صغير بدون تطوير كثير: Tap أوضح خيار منشور (مدى 1% بسقف 200، روابط دفع، يستهدف الفريلانسر؛ الفواتير والاشتراكات المتكررة غير مؤكدة).
2. Moyasar بديل للعمل الحر (قبول الوثيقة غير مؤكد) وأسعاره غير منشورة؛ Geidea قوية في روابط الدفع بدون كود.
3. HyperPay وPayTabs Gateway أسعارهم بعرض مخصص؛ كل الرسوم غير المؤكدة يطلبها صاحب المشروع من المبيعات، والربط مع n8n بـ HTTP وWebhook.


> تصحيحات بعد تحقق sys-tester (work/2026-09-28-online-subscriptions/sys-tester.md): 3 ادعاءات صارت «غير مؤكد».
