# الباحث 3: استخدامات وتقنيات NFC اللي ممكن نضيفها

التاريخ: 2026-09-27. القواعد من `goal.md`: كل معلومة برابط، واللي بلا مصدر مكتوب «غير مؤكد».
سياق: خدماتنا المعتمدة (ستاند تقييم قوقل، منيو إلكتروني، باقة المضيف) في `work/2026-09-27-service-ideas/decision.md` — كل اللي تحت **إضافات** خارج هذي القائمة.

---

## 1) جدول الاستخدامات الجديدة

الإيراد المحتمل: كل الأرقام بالريال **تقديرات غير مؤكدة** (ما لقيت أسعار سعودية منشورة لهذي الخدمات)، إلا اللي معه رابط.

| # | الاستخدام | مين العميل في السعودية | إيراد محتمل | الصعوبة | المصدر |
|---|---|---|---|---|---|
| 1 | **صالات الرياضة**: بطاقة/سوار عضوية يلمسه العضو عند الدخول أو تسجيل الحصة، بدون تطبيق. Anytime Fitness عالمياً تدخل أعضاءها بلمسة NFC على كل باب | نوادي الحي الصغيرة واستوديوهات اليوقا/البايلتس شمال جدة (الكبار عندهم أنظمة جاهزة) | اشتراك شهري لكل نادي + بطاقات للأعضاء (غير مؤكد: 150–300 ريال/شهر) | متوسطة: يبينا لوحة تسجيل حضور بسيطة (نفس بنية لوحة العميل الحالية) | [VTAP/Anytime Fitness](https://www.vtapnfc.com/vtap-nfc-readers-provide-world-wide-gym-access-control-anytime-fitness/) · [Taply](https://play.google.com/store/apps/details?id=com.taply.app&hl=en_US) |
| 2 | **معارض السيارات — بطاقة على الزجاج**: تاق على كل سيارة يفتح المواصفات والسعر وحجز تجربة قيادة وواتساب البائع. موجود عندنا كفكرة (رقم 4 في decision.md) — الجديد: السوق العالمي يسعّرها اشتراك سنوي لكل سيارة (~$10/سيارة/سنة عند TAPY CAR) | معارض السيارات المستعملة في جدة (شارع صاري/المعارض) | اشتراك سنوي لكل تاق؛ TAPY CAR تاخذ $10/سيارة/سنة | سهلة: نفس بنية «رابط ثابت → صفحة» الموجودة | [TAPY CAR](https://tapycar.com/) · [إعلانهم](https://www.newsfilecorp.com/release/222738/TAPY-CAR-is-Revolutionizing-Car-Sales-with-Innovative-NFCEmbedded-Smart-Car-Sale-Tags) · [RFIDCard](https://www.rfidcard.com/nfc-car-tags-seamless-car-buying-experience/) |
| 3 | **العيادات والصالونات**: ستاند عند الاستقبال أو على واجهة المحل يفتح حجز موعد (حتى بعد الدوام)، ونفس البطاقة بعد الزيارة تفتح تقييم قوقل أو حجز الموعد الجاي | عيادات أسنان وتجميل وصالونات شمال جدة — نفس عملاء ستاند التقييم بالضبط | ترقية لعملاء ستاند التقييم: ستاند حجز + تقييم (غير مؤكد: 50–100 ريال/شهر فوق الستاند) | سهلة: رابط لصفحة حجزهم الحالية (فريشا/ويب) أو نموذج واتساب | [NFC Tagify](https://nfctagify.com/blogs/news/nfc-for-clinics-salons-museums) · [TAPro 100 استخدام](https://taprocard.com/blogs/article/100-business-nfc-uses) |
| 4 | **الفنادق والنزل**: كرت/كوستر في الغرفة يفتح خدمات الفندق (روم سيرفس، سبا، مطعم، واي فاي) بدون تطبيق — نفس فكرة باقة المضيف لكن لفندق صغير | الفنادق الصغيرة والأجنحة الفندقية (البوتيك) في جدة | تسعير مثل باقة المضيف لكل غرفة (غير مؤكد) | سهلة–متوسطة: نفس صفحات باقة المضيف تقريباً | [NFC Tagify فنادق](https://nfctagify.com/blogs/news/nfc-for-smart-hotels) · [Mews digital key](https://www.mews.com/en/products/digital-key) (المفاتيح الرقمية نفسها نتركها — تحتاج تكامل أقفال) |
| 5 | **الولاء والكوبونات**: بطاقة/ستاند «المس واجمع نقاط» عند الكاشير. سوق NFC on-pack coupons: $1.2 مليار (2024) → $6.5 مليار (2033)، نمو 20.8% | المطاعم والكافيهات اللي عندنا أصلاً (بيع مكمّل — وdecision.md حاطها «تنباع مع غيرها») | إضافة على اشتراك المنيو (غير مؤكد) | متوسطة: يبيلها نظام نقاط بسيط في لوحة التحكم. **تنبيه**: ما نربط الولاء بالتقييم أبداً (قاعدة قوقل في decision.md) | [ResearchIntelo](https://researchintelo.com/report/nfc-on-pack-coupon-market/amp) · [Meed loyalty](https://www.meedloyalty.com/post/how-nfc-tap-in-loyalty-works-when-your-customer-has-never-heard-the-term-nfc) |
| 6 | **مصادقة المنتجات الأصلية** (NTAG424 DNA + SUN): تاق على المنتج، كل لمسة تطلع كود مشفّر متغير يثبت أنه أصلي ومنع نسخ | محلات العود والعطور، العسل، الشماغات الفاخرة، متاجر إعادة بيع الساعات/الشنط | سعر أعلى بكثير لكل تاق (الشريحة نفسها €0.92–1.59) + اشتراك تحقق (غير مؤكد) | عالية: يبينا سيرفر تحقق يفك تشفير SUN ويتحقق من CMAC — أكبر قفزة تقنية في القائمة | [NXP](https://www.nxp.com/products/rfid-nfc/nfc-hf/ntag-for-tags-and-labels/ntag-424-dna-424-dna-tagtamper-advanced-security-and-privacy-for-trusted-iot-applications:NTAG424DNA) · [nfc.cool](https://nfc.cool/blog/ntag-424-dna-counterfeit-proof-nfc-tags/) · [أسعار Shop NFC](https://shopnfc.com/en/70-ntag-dna) |
| 7 | **الفعاليات والأساور**: أساور سيليكون NTAG213 للدخول/الكاشلس في المهرجانات والفعاليات؛ عالمياً صارت الافتراضي (كوتشيلا، تومورولاند) والدفع الكاشلس يرفع إيراد المنظم | منظمو فعاليات موسم جدة والأعراس الكبيرة (نكمل بها «دعوات الزواج» رقم 5 عندنا) | بيع أساور بالجملة + برمجة (غير مؤكد). الدفع الكاشلس نفسه **ما ندخله** — يحتاج مزود دفع مرخص | متوسطة للدخول/الدعوات، عالية جداً للدفع | [Wristband.com](https://www.wristband.com/blogs/news/how-cashless-payment-wristbands-work) · [Dreamcast 2026](https://dreamcast.co/blog/cashless/how-nfc-wristband-drive-cashless-festivals-payments/) · [Oveit](https://oveit.com/markets/festivals/) |
| 8 | **الحدائق والمتاحف**: تاقات عند المعروضات تفتح شرح صوتي/فيديو بعدة لغات بدون تطبيق، ومحتوى لذوي الإعاقة | المتاحف الخاصة والجاليريهات ووجهات جدة التاريخية (غالباً جهات حكومية/كبيرة = دورة بيع طويلة) | مشروع لمرة وحدة + صيانة (غير مؤكد) | سهلة تقنياً، صعبة بيعياً (B2G) | [MuseumNext](https://www.museumnext.com/article/what-can-near-field-communications-do-for-museums/) · [MySmartJourney](https://mysmartjourney.com/en-ca/post/how-museums-benefit-from-qr-and-nfc-technologies) |
| 9 | **بطاقات الأعمال الرقمية** (موجودة عندنا رقم 6 — الجديد أرقام السوق): السوق العالمي ~$215–373 مليون في 2025 ونمو 10–16.5% سنوياً حسب التقرير؛ وفي السعودية تنباع 27–72 ريال للبطاقة على أمازون | موظفو المبيعات والعقارات | بيع البطاقة + اشتراك تعديل الصفحة | سهلة (قائمة أصلاً) | [Market.us](https://market.us/report/digital-business-card-market/) · [MarketResearchFuture](https://www.marketresearchfuture.com/reports/digital-business-card-market-10696) · [أمازون السعودية](https://www.amazon.sa/digital-business-card-nfc/s?k=digital+business+card+nfc) |

### مرفوض: التبرع بالمساجد
NFC للتبرع فكرة منتشرة عالمياً، لكن في السعودية **جمع التبرعات بدون ترخيص من المركز الوطني لتنمية القطاع غير الربحي عقوبته غرامة إلى 500 ألف ريال أو السجن سنتين**، وحتى «الوسيلة» اللي تسهّل الجمع لجهة غير مرخصة تُغرّم؛ والجمع الإلكتروني محصور في قنوات الجهة المرخصة والمنصات الوطنية. **نسجلها مرفوضة** (يتوافق مع decision.md: «أي شي تبرعات ما ندخله بدون ترخيص»).
المصادر: [نظام جمع التبرعات — الرياض](https://alriyadh.com/2091263) · [خدمة الترخيص — ncnp.gov.sa](https://ncnp.gov.sa/ar/services/%D8%A5%D8%B5%D8%AF%D8%A7%D8%B1-%D8%AA%D8%B1%D8%AE%D9%8A%D8%B5-%D8%AC%D9%85%D8%B9-%D8%A7%D9%84%D8%AA%D8%A8%D8%B1%D8%B9%D8%A7%D8%AA) · [أرقام: تفاصيل النظام](https://www.argaam.com/ar/article/articledetail/id/1750305)

---

## 2) التقنية: NTAG213 مقابل NTAG424 DNA

| | NTAG213 | NTAG424 DNA |
|---|---|---|
| وش يسوي | يخزن رابط ثابت، نفس القراءة كل مرة | يولّد مع كل لمسة كود مشفّر متغير (SUN) بتشفير AES-128 |
| النسخ | **ينتسخ**: أي أحد يقرأ الرابط ويكتبه في شريحة ثانية | الرابط المنسوخ يصير قديم فوراً لأن الكود يتغير كل قراءة — مقاوم للنسخ وإعادة الإرسال |
| السعر | رخيص (ملصقات بالجملة سنتات؛ في السعودية بطاقات فاضية ~38 ريال للـ50 على أمازون كمرجع تجزئة) | €0.92–1.59 للتاق عند Shop NFC؛ وبالجملة 5 آلاف+ حوالي $0.30–1.20 |
| متى يستاهل الغالي | كل شغلنا الحالي (تقييم، منيو، بطاقات، ستاندات): الرابط عام أصلاً والنسخ ما يضر | مصادقة منتج أصلي، تذكرة/سوار يمنع تزويره، أي شي «اللمسة نفسها إثبات». يحتاج **سيرفر تحقق** عندنا يفحص الكود — مو مجرد رابط |

المصادر: [Seritag: NTAG213 v NTAG424](https://seritag.com/learn/tech/chips/ntag213-v-ntag424) · [Seritag Q&A](https://seritag.com/qa/whats-the-difference-between-the-ntag424-and-the-ntag213) · [RFIDCard مقارنة الأنواع](https://www.rfidcard.com/nfc-card-types-explained-how-to-choose-between-ntag213-ntag215-ntag216-and-ntag424-dna/) · [أسعار Shop NFC](https://shopnfc.com/en/70-ntag-dna) · [أمازون السعودية NTAG215](https://www.amazon.sa/%D8%AF%D8%A7%D8%A6%D8%B1%D9%8A%D8%A9%D8%8C-NTAG215-%D9%84%D9%84%D8%A8%D8%B1%D9%85%D8%AC%D8%A9-%D9%85%D8%AA%D9%88%D8%A7%D9%81%D9%82%D8%A9-%D9%88%D8%A7%D9%84%D8%A7%D8%AC%D9%87%D8%B2%D8%A9/dp/B09PZNL89K)

**شرائح الأساور والإكسسوارات**: أساور سيليكون NTAG213 متوفرة بالجملة، IP68 ضد الماء وتتحمل الحرارة (مهم لجو جدة)، وفيه مصانع تعطي عينات مجانية قبل الطلبة ([RFIDSilicone](https://www.rfidsilicone.com/product/nfc-tags/nfc-bracelet/adjustable-nfc-rubber-wristbands-ntag213-hf-bracelets.html) · [RFIDup](https://www.rfidup.com/waterproof-rfid-silicone-wristband-ntag213-nfc-adjustable-bracelet-for-door-entry-access-control/)). للمعادن (سيارات المعارض على الزجاج ما تحتاج، لكن الأبواب والمعدات تحتاج) فيه تاقات on-metal NTAG424 بـ€1.35 ([Shop NFC](https://shopnfc.com/en/70-ntag-dna)). ملاحظة: قراءة NFC الفعلية سنتيمترات — أرقام «5 أمتار» في صفحات الموردين تخص RFID مو NFC للجوال (غير مؤكد لصيغتهم، والمعروف تقنياً أن NFC قريب المدى).

---

## 3) اتجاهات 2025–2026

- **بطاقات الأعمال الرقمية**: سوق ينمو 10–16.5% سنوياً حسب التقرير، وتقديرات 2025 تتراوح $215 مليون–$373 مليون (التقارير تختلف كثير — ناخذها كمؤشر اتجاه مو رقم) ([Market.us](https://market.us/report/digital-business-card-market/) · [MaximizeMarketResearch](https://www.maximizemarketresearch.com/market-report/digital-business-card-market/227957/) · [ResearchNester](https://www.researchnester.com/reports/digital-business-card-market/6782)).
- **ستاندات تقييم قوقل**: ما لقيت تقرير سوق مستقل لهذا المنتج بالذات (غير مؤكد حجمه)، لكن المؤشر أن مزود واحد (TapFive) يقول 75,000+ نشاط و7 ملايين+ تقييم عبر منتجاته، والمنتجات تنباع بكثرة على أمازون بدون اشتراك ([TapFive على أمازون](https://www.amazon.com/Google-Review-Stands-3-Pack-TapFive/dp/B0CY9WMQ7K) · [Tapt](https://tapt.io/en-us/products/google-review-stand)). معناه: المنتج نفسه صار سلعة — **قيمتنا في التركيب والصفحة واللوحة والخدمة المحلية، مو في القطعة**.
- **التغليف الذكي (Connected Packaging)**: العلامات تحط NFC على المنتج نفسه للتحقق من الأصالة والتفاعل بعد الشراء؛ سوق NFC on-pack coupons متوقع ينمو 20.8% سنوياً حتى 2033 ([RFIDHY](https://www.rfidhy.com/nfc-tags-for-smart-packaging-a-complete-guide-for-consumer-brands/) · [ResearchIntelo](https://researchintelo.com/report/nfc-on-pack-coupon-market/amp)).
- **منتجات NFC «وظيفية» بهامش عالي**: السوق منقسم بين ملصقات رخيصة بالجملة ومنتجات مميزة (بطاقات معدن، تاقات حيوانات أليفة ضد الماء) — الهامش في الثانية ([RFIDTag guide 2026](https://rfidtag.com/how-to-use-nfc-tags-a-business-owners-guide-with-10-use-cases/) · [TAPiTAG pet tags](https://tapitag.co/blogs/tapitag-blogs/smart-pet-tags-complete-guide-for-2026)).
- **الأساور في الفعاليات**: متوقع تكون الكاشلس هي الافتراضي عالمياً بحلول 2026 ([Dreamcast](https://dreamcast.co/blog/cashless/how-nfc-wristband-drive-cashless-festivals-payments/) · [Event-Technology Portal](https://eventtechnology.org/2025/01/16/the-future-of-festivals-how-nfc-wristband-payments-will-revolutionize-cashless-events-in-2025/)).
- **NFC Wallet passes**: بدل البطاقة البلاستيك، بطاقة عضوية داخل Apple/Google Wallet تنلمس على قارئ — هذا اللي سوته Anytime Fitness ([VTAP](https://www.vtapnfc.com/markets/nfc-wallet-for-gyms/)). يحتاج قارئ عند العميل (عكس نموذجنا الحالي «جوال الزبون هو القارئ»)، فهو خطوة متقدمة مو بداية.

---

## 4) ترشيحي: أفضل 3 إضافات

1. **ستاند حجز المواعيد للعيادات والصالونات (رقم 3)** — نفس عملاء ستاند التقييم، نفس التقنية، نفس مندوب المبيعات؛ يرفع قيمة الاشتراك بدون أي بناء جديد تقريباً، ويجاوب على «وش بعد التقييم؟». أسهل توسعة عندنا إطلاقاً. ([NFC Tagify](https://nfctagify.com/blogs/news/nfc-for-clinics-salons-museums))
2. **تاق معارض السيارات باشتراك سنوي لكل سيارة (رقم 2)** — الفكرة أصلاً معتمدة عندنا (رقم 4)، والجديد المثبت عالمياً أن نموذجها **اشتراك متكرر لكل تاق** (~$10/سيارة/سنة عند TAPY CAR) مو بيع لمرة؛ معارض المستعمل في جدة كثيرة والسيارات تتبدل باستمرار = تجديد دائم. ([TAPY CAR](https://tapycar.com/))
3. **بطاقة عضوية النوادي الصغيرة (رقم 1)** — دخل شهري متكرر من قطاع نشط في السعودية، والتقنية (لمسة → تسجيل حضور في لوحة) امتداد مباشر للوحة الإحصائيات اللي عندنا؛ مثبتة عالمياً من Anytime Fitness وTaply. **تنبيه قانوني**: تسجيل حضور الأعضاء بيانات شخصية — يمر على loyer قبل البيع (decision.md أجّل حضور «الموظفين» لنفس السبب). ([VTAP](https://www.vtapnfc.com/vtap-nfc-readers-provide-world-wide-gym-access-control-anytime-fitness/))

**ترشيح مؤجل مو مرفوض**: مصادقة المنتجات (NTAG424 DNA) أعلى هامش وأقوى خندق تقني (ما ينسخها منافس يبيع ستاندات)، لكنها تحتاج سيرفر تحقق SUN — تنبنى بعد ما تستقر بنية لوحة التحكم، وتفتح سوق العود والعطور والساعات.

---
الباحث 3 من 3 · بحثت 15 WebSearch + WebFetch · كل الأسعار بالريال في الجدول تقديرات غير مؤكدة إلا المرتبط بمصدر.
