# أسعار الكوالين الكاملة في السعودية، وكم نربح في التركيب (2026-10-01)

كتبه: قائد قسم مهندس تقنية NFC. المدخلات: `locks/sweep/*.md` و`locks/prices.json` و`locks/landed_cost.out.txt` (fin-modeler)، وبحث جديد اليوم.

**تنبيه مهم: ولا سعر هنا مؤكد.**
- كل صفحات المتاجر محجوبة عن الوكلاء من بروكسي الشبكة، مثل amazon.sa وnoon وmicroless وalibaba وslockstore وtmw-smart وeuopen.ttlock.com.
- لذلك كل سعر مأخوذ من **مقتطف نتيجة البحث**، وكلها شوهدت يوم **2026-10-01**.
- الضريبة: إذا ما كُتب «شامل» فهي **غير مؤكدة**. شركتنا غير مسجلة في الضريبة، فأي ضريبة ندفعها تصير تكلفة علينا.
- الحساب نفس طريقة `landed_cost.py`:
  - **تكلفة التركيب** = القفل + البوابة + 89. والـ89 = لوحة NFC 19 + صندوق مفتاح 40 + مشوار 30.
  - **الربح** = 599 ناقص 2.5% رسوم دفع، ناقص تكلفة التركيب.
  - **أسوأ حالة:** السعر يطلع بدون ضريبة (نزيد 15%)، واللوحة 25، والمشوار 40، ورسوم الدفع 3%.
  - طابقت الطريقة على خيار O1 حق fin-modeler وطلع نفس الرقم: 224، وبأسوأ حالة 164.

## الخلاصة
1. **القفل المقترح: Razuvious R1** (يشتغل على تطبيق TTLock، ولسانه 4585 مقاس الأبواب السعودية) مع بوابة G2. العتاد كله 279 ريال، وتكلفة التركيب 368، و**الربح على 599 = 216 ريال** (وبأسوأ حالة 155).
2. **البديل: Makayuron M305TT** (نفس النظام ونفس المقاس) مع بوابة G2. **الربح 208**.
3. المتاجر السعودية المتخصصة اللي تعطي ضمان سنتين (TMW، bhome) **تخسر على 599**. ولو بنشتري منها ونبقى على ربح 200، لازم التجهيز يصير 860 إلى 995.
4. الجملة من علي بابا بـ10 أو 50 حبة **أغلى من التجزئة** لما يوصل، حتى قبل رسوم سابر والتخليص. وما لها ضمان محلي.
5. أول شراء (قرارك): قفلين بالتجزئة (R1 وM305TT) مع بوابة وحدة، حوالي **485 ريال**. نجربها قبل أي جملة.

---

## 1) جدول الأسعار الكاملة في السعودية

### 1-أ) لكل خيار: سعر القفل بالتجزئة، والبوابة، والجملة لما توصل
- **بالجملة واصل** = القفل + بوابة G2 لين توصل السعودية: الشحن الجوي + جمارك 5% + ضريبة استيراد 15%.
- هذا **بدون** رسوم سابر والتخليص والمستورد المسجل، لأن ما لقينا لها رقم.
- عمود البوابة يعني بوابة G2 بـ80.99 من amazon.sa، إلا إذا انكتب غيرها.

| # | القفل | القفل بالتجزئة (ريال) | الضريبة | البوابة | العتاد كامل بالتجزئة | بالجملة واصل 10 حبات | بالجملة واصل 50 حبة | الضمان | الباب |
|---|---|---|---|---|---|---|---|---|---|
| **P1** | **Razuvious R1** (TTLock بلوتوث، لسان 4585) | **198** [amazon.sa](https://www.amazon.sa/-/en/Razuvious-Fingerprint-Mortise-Keyless-Bluetooth-R1/dp/B09JMZZX4X). وشفناه بـ218.99 بنفس أمازون، وبـ305.81 في [microless](https://saudi.microless.com/product/razuvious-smart-lock-fingerprint-door-lock-with-4585-mortise-keyless-entry-bluetooth-lock-free-app-ic-card-anti-peep-code-work-with-alexa-tt-lock-app-control-for-home-office-apartment-r1/offers/)، وموجود في [noon](https://www.noon.com/saudi-en/razuvious-smart-lock-fingerprint-door-lock-with-4585-mortise-keyless-entry-bluetooth-lock-free-app-ic-card-anti-peep-code-work-with-alexa-tt-lock-app-control-for-home-office-apartment-r1/ZC3CF88A6C73402A80064Z/p/) بسعر ما ظهر | غير مؤكد | G2 بـ80.99 | **279** | 430 (W3) | 372 (W3) | سنة، مع إرجاع مجاني (من المقتطف) | خشب، لسان 4585 |
| **P2** | **Makayuron M305TT** (TTLock بلوتوث، لسان 4585) | **205.99** [amazon.sa](https://www.amazon.sa/-/en/Makayuron-Fingerprint-Bluetooth-Anti-Theft-included/dp/B0FFBCB389). وفيه قوائم بـ179.99 و177.75 | غير مؤكد | G2 بـ80.99 | **287** | 430 (W3) | 372 (W3) | سنة (من المقتطف) | خشب 4585. فيه نسخة لسماكة 35-65 مم، وللداخل بس |
| P3 | قفل TTLock ستانلس، لسان 4585 | 259.99 [amazon.sa](https://www.amazon.sa/-/en/Stainless-Digital-Fingerprint-Unlock-Mortise/dp/B0CRVGBXFS) | غير مؤكد | G2 بـ80.99 | 341 | 430 (W3) | 372 (W3) | غير مؤكد | خشب 4585 |
| - | Tichondrius TTLock بلوتوث | 168.88 [amazon.sa](https://www.amazon.sa/-/en/Tichondrius-Smart-Fingerprint-TTLock-Bluetooth/dp/B0H49HN9XJ) | غير مؤكد | G2 بـ80.99 | 250 | - | - | غير مؤكد | ما تأكدنا إنه 4585. قائمة جديدة، فما نعتمده |
| O1 | T306 (حسبة fin-modeler) | 189.99 | غير مؤكد | G2 بـ80.99 | 271 | - | - | غير مؤكد | **رابطه صفحة بحث مو صفحة منتج**. ما نقدر نطلبه بالضبط، فبدّلته بـP1 |
| P4 | لاتين، TTLock للأبواب الداخلية | 350 [latin-sa](https://latin-sa.com/products/%D9%82%D9%81%D9%84-%D8%B0%D9%83%D9%8A-%D8%A8%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-ttlock-%D9%84%D9%84%D8%A3%D8%A8%D9%88%D8%A7%D8%A8-%D8%A7%D9%84%D8%AF%D8%A7%D8%AE%D9%84%D9%8A%D8%A9-%D8%A8%D8%A7%D9%84%D8%A8%D8%B5%D9%85%D8%A9-%D9%88%D8%A7%D9%84%D8%B1%D9%82%D9%85-%D8%A7%D9%84%D8%B3%D8%B1%D9%8A-%D9%88%D8%B7%D8%B1%D9%82-%D8%A7%D8%AE%D8%B1%D9%89) | غير مؤكد | G2 بـ80.99، أو 129 من متجر سعودي | 431 | 430 (W3) | 372 (W3) | غير مؤكد (متجر سعودي) | خشب داخلي |
| P5 | Gulf Electro، TTLock لأبواب الخشب | 372.50 [gulfelectro](https://www.gulfelectro.com/ar/%D9%82%D9%81%D9%84-%D8%A8%D8%A7%D8%A8-%D8%B0%D9%83%D9%8A-%D8%A8%D8%A7%D9%84%D8%A8%D8%B5%D9%85%D8%A9-%D9%85%D8%AA%D9%88%D8%A7%D9%81%D9%82-%D9%85%D8%B9-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-TTLock-%D9%82%D9%81%D9%84-%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A-%D8%B1%D9%82%D9%85%D9%8A-%D8%A8%D9%84%D9%88%D8%AA%D9%88%D8%AB-%D9%84%D9%84%D8%A3%D8%A8%D9%88%D8%A7%D8%A8-%D8%A7%D9%84%D8%AE%D8%B4%D8%A8%D9%8A%D8%A9)، وحسب المقتطف **نافد** | غير مؤكد | G2 بـ80.99 | 453 | 430 (W3) | 372 (W3) | غير مؤكد | خشب، سماكة 35-65 مم |
| O3 | Locstar خمسة في واحد (TTLock/Tuya) | 410 [noon](https://www.noon.com/saudi-en/smart-door-lock-5-in-1-unlock-method-with-ttlock-tuya-app-fingerprint-password-card-interior-key-smart-door-handle-for-home-apartment/Z10602A3B83ADE793037BZ/p/) | غير مؤكد | G2 بـ80.99 | 491 | 430 (W3) | 372 (W3) | غير مؤكد | مقبض لباب شقة |
| O4 | Tatonka خارجي rim (TTLock) | 288.75 [noon](https://www.noon.com/saudi-en/waterproof-ttlock-bluetooth-app-smart-outdoor-lock-fingerprint-lock-outdoor-gate-digital-password-remote-app-home-electronic-rim-lock/Z50A8FDF1C7276EAA1612Z/p/) | غير مؤكد | G2 بـ80.99 | 370 | 774 (W2) | 654 (W2) | غير مؤكد | خارجي. توافقه مع باب شقة غير مؤكد |
| P6 | TMW Active خارجي، TTLock واي فاي | 549 [tmw-smart](https://tmw-smart.com/active/p956956701) | **شامل** (حسب المقتطف) | بدون بوابة لأن فيه واي فاي. فتحه بالـAPI بدون G2 **غير مؤكد** | 549 | 774 (W2) | 654 (W2) | **سنتين** (متجر سعودي) | حديد وخشب |
| P7 | CAVAN من bhome (TTLock) | 599، ويشمل التوصيل داخل جدة. [صفحة الأقفال](https://bhome-sa.com/categories/606600/smartlocks)، ورابط المنتج نفسه ما تحدد | غير مؤكد | يحتاج G2 (حسب المقتطف) | 680 | - | - | **سنتين** مع تبديل فوري (من المقتطف) | أغلب أبواب الخشب |
| P8 | Lettech نحيف لأبواب الألمنيوم (TTLock بلوتوث) | 639.99 [lettech](https://lettech.sa/ar/%D9%82%D9%81%D9%84-%D8%A8%D8%A7%D8%A8-%D8%B0%D9%83%D9%8A-%D9%86%D8%AD%D9%8A%D9%81/p1653980156) (قبل الخصم 804.99) | غير مؤكد | G2 بـ80.99 | 721 | 695 (W1) | 584 (W1) | **5 سنوات** (من المقتطف) | ألمنيوم وزجاج |
| O5 | Tuya واي فاي، ماركة مجهولة | 169.90 [amazon.sa بحث](https://www.amazon.sa/-/en/tuya-smart-lock/s?k=tuya+smart+lock) | غير مؤكد | بدون بوابة | 170 | - | - | غير مؤكد | **مستبعد**: نسخة Tuya Cloud المجانية ممنوعة للاستخدام التجاري (sweep/aqara-tuya.md) |
| O6 | Aqara U100 مع هب E1 | 918.71 [microless](https://saudi.microless.com/product/aqara-smart-lock-u100-kit-with-an-e1-hub-and-2-nfc-cards-fingerprint-door-lock-touchscreen-keyboard-ip65-compatible-with-apple-homekit-alexa-google-ifttt/) | غير مؤكد | داخل الباقة | 919 | - | - | غير مؤكد | غير مؤكد |
| O7 | Nuki Go | 506.99 [amazon.sa](https://www.amazon.sa/-/en/Nuki-Smart-Lock-PowerPack-International/dp/B08Y5X4R18)، وناقصه بريدج وكيبورد | غير مؤكد | بريدج، وسعره غير معروف | +507 | - | - | ما فيه وكيل رسمي (غير مؤكد) | اسطوانة أوروبية |
| O8 | Yale Assure SL Wi-Fi | 1,324.85 [amazon.sa](https://www.amazon.sa/-/en/Yale-Assure-Lock-Wi-Fi-Smart/dp/B07GQ2VLSD) | غير مؤكد | بدون بوابة | 1,325 | - | - | غير مؤكد | قفل أمريكي deadbolt |

**الجملة (علي بابا، FOB يعني بدون شحن ولا ضريبة، والدولار = 3.75 ريال):**

| الرمز | القطعة | السعر | الرابط | واصل 10 حبات (مع G2) | واصل 50 حبة (مع G2) |
|---|---|---|---|---|---|
| W3 (جديد) | مقبض TTLock بصمة لباب خشب | 39$ من 2 إلى 499 حبة | [alibaba](https://www.alibaba.com/product-detail/wifi-tuya-ttlock-smart-Fingerprint-Handle_1600511320736.html) | **430** | **372** |
| W1 | M8 ألمنيوم، واي فاي وبلوتوث | 78$ لـ100-499 حبة (ومقتطف ثاني: 80$ لـ2-99) | [alibaba](https://www.alibaba.com/product-detail/TTlock-Ekey-Smart-Locks-WiFi-Fingerprint_1600412771725.html) | 695 | 584 |
| W2 | F9S خارجي ألمنيوم | 92$ لـ100-499 حبة | [alibaba](https://www.alibaba.com/product-detail/Outdoor-Waterproof-Smart-lock-Manufacturer-TTlock_1600909993743.html) | 774 | 654 |
| - | بوابة G2 | 18$ لـ2-49، و17$ لـ50-499 | [alibaba](https://www.alibaba.com/product-detail/G2-Wifi-Gateway-Remote-Control-Bridge_1600128422668.html) | داخلة فوق | داخلة فوق |

كيف انحسبت أرقام الجملة:
- **W3:**
  - الوزن 3.8 كجم للقفل والبوابة، نفس افتراض fin-modeler.
  - الشحن الجوي 10$ للكيلو لما نطلب 10 حبات ([tonlexing](https://www.tonlexing.com/shipping-cost-from-china-to-saudi-arabia/))، و6.9$ للكيلو لما نطلب 50 ([bsifreight](https://www.bsifreight.com/knowledge/guides-resources/air-freight-rates-from-china-to-world)).
  - الجمارك 5% ([trade.gov](https://www.trade.gov/country-commercial-guides/saudi-arabia-import-tariffs)).
  - ضريبة الاستيراد 15%.
  - سعر 39$ يبدأ من حبتين، فما زدت عليه شي للكمية الصغيرة.
  - لو الوزن طلع 2.8 كجم، الواصل يصير 385 للـ10 حبات و341 للـ50، وبرضو أغلى من R1 مع البوابة (279).
- **W1 وW2:** من `landed_cost.out.txt` (fin-modeler). سعرهم للـ10 حبات محافظ، لأنهم زادوا سعر القفل 25%، والمقتطف الجديد يقول 80$ بس لـ2-99 حبة. وهذا ما يغيّر النتيجة: الاستيراد برضو أغلى من التجزئة.

### 1-ب) بوابة TTLock G2 في السعودية
| المتجر | السعر | الضريبة | الرابط |
|---|---|---|---|
| amazon.sa | **80.99** (قبل الخصم 89.99) | غير مؤكد | [B0CSX8MB2X](https://www.amazon.sa/dp/B0CSX8MB2X) |
| amazon.sa | 87.99، ونفس القائمة فيها 159.44 من بائع مستورد | غير مؤكد | [B0BNPK17J6](https://www.amazon.sa/dp/B0BNPK17J6) |
| slockstore (سعودي) | 129 | غير مؤكد | [slockstore](https://slockstore.com/ar/%D9%85%D9%88%D8%B2%D8%B9-%D9%88%D8%A7%D9%8A-%D9%81%D8%A7%D9%8A/p411682188) |
| قفل المستقبل (سعودي) | 140 (قبل الخصم 179) | غير مؤكد | [futurelock](https://futurelock.com.sa/NGazOm) |
| TMW (سعودي) | 149 (قبل الخصم 200) | غير مؤكد | [tmw-smart](https://tmw-smart.com/%D8%AC%D9%87%D8%A7%D8%B2-wifi-%D9%84%D8%B1%D8%A8%D8%B7-%D8%A7%D9%84%D8%A3%D9%82%D9%81%D8%A7%D9%84-%D8%A7%D9%84%D8%AA%D9%8A-%D8%AA%D8%B9%D9%85%D9%84-%D8%A8%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-ttlock/p463360542) |
| fruugo السعودية | 159 (قبل الخصم 199) | غير مؤكد | [fruugo](https://www.fruugosaudiarabia.com/g2-wifi-gateway-for-remote-smart-lock-control-ttlock-app-device-24g-smart-hub-fk/p-262099865-574647959) |
- البوابة تحتاج واي فاي 2.4GHz (مكتوب «2.4G» في عناوين المنتجات) وفيش كهرب قريب من الباب. أقصى مسافة بينها وبين القفل غير مؤكدة.

### 1-ج) مرجع سعر التركيب في السوق (للمقارنة بس، لأنك تركّب بنفسك)
| المورد | السعر | الرابط | ملاحظة |
|---|---|---|---|
| إلكترو سمارت | 150 | [electrosmart](https://electrosmart.sa/%D8%AE%D8%AF%D9%85%D8%A9-%D8%AA%D8%B1%D9%83%D9%8A%D8%A8-%D9%82%D9%81%D9%84-%D8%B0%D9%83%D9%8A/p1311713100) | الصفحة ما انفتحت (DNS) |
| المنزل الذكي | 175 | [almanzil](https://almanzil.sa/ar/KjDgADQ) | تشمل جدة |
| متجر ذكي | 200 | [mtjrthaki](https://mtjrthaki.com/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8-%D9%82%D9%81%D9%84-%D8%A8%D8%A7%D8%A8-%D8%B0%D9%83%D9%8A-%D8%AC%D8%AF%D8%A9-%D9%82%D9%81%D9%84-%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A/p590629839) | جدة، مع الحفر والبرمجة |
| S Plus | 229 | [splus](https://splus.sa/products/%D8%AE%D8%AF%D9%85%D8%A9-%D8%AA%D8%B1%D9%83%D9%8A%D8%A8-%D9%82%D9%81%D9%84-%D8%A8%D8%A7%D8%A8-%D8%B0%D9%83%D9%8A-%D9%88%D8%A7%D8%AD%D8%AF-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6-%D9%81%D9%82%D8%B7) | الرابط مكتوب فيه «الرياض فقط» |
- كلها من مقتطفات البحث وغير مؤكدة، والضريبة كمان غير مؤكدة.
- يعني لو العميل يشتري القفل والبوابة (279) ويجيب فني (150 إلى 229)، يدفع 429 إلى 508. وما عنده لوحة NFC ولا صندوق مفتاح ولا ربط بالحجوزات. باقتنا بـ599 فيها كل هذا.

---

## 2) كم نربح في التركيب الواحد على 599
- **الجملة:** نفس السعر 599، بس نحسب العتاد بسعره واصل بالجملة (بدون رسوم سابر والتخليص). لأقفال الخشب استخدمت W3، للخارجي W2، وللألمنيوم W1.
- **ربح 200:** سعر التجهيز اللي لازم ناخذه عشان يبقى لنا 200 ريال.

| الخيار | تكلفة التركيب (بالتجزئة) | **ربح 599 بالتجزئة** | ربح 599 بأسوأ حالة | ربح 599 بجملة 10 حبات | ربح 599 بجملة 50 حبة | التجهيز اللي يعطي ربح 200 |
|---|---|---|---|---|---|---|
| **P1 Razuvious R1 + G2** | 368 | **216** | 155 | 65 | 123 | 583 |
| **P2 Makayuron M305TT + G2** | 376 | **208** | 146 | 65 | 123 | 591 |
| P3 TTLock ستانلس 4585 + G2 | 430 | 154 | 84 | 65 | 123 | 646 |
| O1 T306 + G2 (fin-modeler، بدون رابط منتج) | 360 | 224 | 164 | - | - | 574 |
| P4 لاتين 350 + G2 من أمازون | 520 | 64 | -20 | 65 | 123 | 739 |
| P4 لاتين 350 + G2 من متجر سعودي بـ129 (O2) | 568 | 16 | -75 | - | - | 788 |
| P5 Gulf Electro 372.50 + G2 | 542 | 42 | -46 | 65 | 123 | 762 |
| O3 Locstar 410 + G2 | 580 | 4 | -89 | 65 | 123 | 800 |
| O4 Tatonka rim 288.75 + G2 | 459 | 125 | 51 | -279 | -159 | 676 |
| P6 TMW Active 549 (بدون بوابة) | 638 | -54 | -73 | -279 | -159 | 860 |
| P7 CAVAN 599 + G2 | 769 | -185 | -306 | - | - | 994 |
| P8 Lettech ألمنيوم 639.99 + G2 | 810 | -226 | -353 | -200 | -89 | 1,036 |
| O6 Aqara U100 + E1 | 1,008 | -424 | -580 | - | - | 1,239 |
| O7 Nuki Go (وناقصه قطع) | +596 | -12 أو أقل | -107 | - | - | +816 |
| O8 Yale Assure SL Wi-Fi | 1,414 | -830 | -1,048 | - | - | 1,655 |

- **الاشتراك الشهري** (من fin-modeler، قبل مصاريف n8n الثابتة): يبقى لنا 79.58 من كل 99، و128.33 من كل 149.
- **لو خرب القفل بعد الضمان:** في P1 القفل الجديد مع المشوار يكلف 228 ريال، وهذا تقريباً ربح تركيب كامل. **داخل الضمان** ندفع المشوار بس (30).

---

## 3) التوصية

### الأساسي: Razuvious R1 + بوابة TTLock G2
| الشرط | ليش يناسب | المصدر |
|---|---|---|
| فتح عن بعد بـAPI يناديه n8n | القفل على نظام TTLock. والـTTLock Cloud API فيه أمر فتح `v3/lock/unlock` يمر عن طريق البوابة G2. | [توثيق unlock](https://euopen.ttlock.com/doc/api/v3/lock/unlock) (الصفحة محجوبة، والمعلومة من `locks/report.md` ومقتطف البحث). حساب المطوّر تراجعه TTLock يدوياً، والرسوم **غير مؤكدة** ([ArdanShield](https://ardanshield.com/blogs/ttlock-smart-access/tttlock-open-platform-sdk-api-gateway-uk-2026)) |
| رمز PIN بوقت محدد يشتغل بدون نت | الـAPI يطلع رمز من نوع «Period» (رقم 3) يشتغل من وقت لوقت. والرمز ينحسب بخوارزمية، فالقفل ما يحتاج نت عشان يقبله. | [keyboardPwd/get](https://euopen.ttlock.com/doc/api/v3/keyboardPwd/get) (مقتطف)، [Beds24 Wiki](https://wiki.beds24.com/index.php/TTLock)، [دليل TTLock من VG-Lock](https://www.wano.pl/files/30120/TT-Lock---instrukcja-ENG.pdf). **يتجرب على العينة** |
| يركب على أبواب شقق جدة | لسانه 4585: المسافة من حافة الباب لنص المقبض 45 مم، وبين المقبض والسلندر 85 مم. والقوائم تسمي هذا المقاس «المقاس السعودي». | [smartlockmfg](https://smartlockmfg.com/4585-smart-lock-mortise/)، وعنوان [قائمة R1](https://www.amazon.sa/-/en/Razuvious-Fingerprint-Mortise-Keyless-Bluetooth-R1/dp/B09JMZZX4X). سماكة الباب اللي يركب عليها **غير مؤكدة** |
| متوفر في السعودية | معروض في amazon.sa وnoon وmicroless. | الروابط في جدول 1-أ |
| الضمان | سنة، مع إرجاع مجاني من أمازون (من المقتطف). | **غير مؤكد** لين تشوف الصفحة |
| الربح | **216** على 599، و**155** بأسوأ حالة. | جدول 2 |

**مخاطر R1:**
- ماركة صينية مو معروفة.
- مشتري واحد كتب إن اللسان وصله 175 مم بدل 240 مم ([مراجعة](https://techgadgetreviewhub.com/razuvious-smart-lock-review/)، من مقتطف البحث). لازم نقيس أول حبة.
- يشتغل بلوتوث بس، فالـG2 ضرورية. وتوافقه مع G2 **يتجرب**.

### البديل: Makayuron M305TT + بوابة G2
- نفس نظام TTLock ونفس اللسان 4585، فالـAPI ورمز PIN المؤقت بنفس الطريقة.
- بائع ثاني على amazon.sa بـ205.99، وضمانه سنة (من المقتطف). [الرابط](https://www.amazon.sa/-/en/Makayuron-Fingerprint-Bluetooth-Anti-Theft-included/dp/B0FFBCB389)، وفيه [مرجع سعر ثاني](https://www.kanbkam.com/sa/en/makayuron-smart-door-lock-with-4585-mortise-with-5in1-unlock-methods-ttlock-app-bluetooth-fingerprint-passcode-7cards-mechanical-key-secure-keyless-entry-for-home-officem305ttble-B0FFBCB389).
- فيه نسخة لأبواب سماكتها 35-65 مم (M305TTble2).
- **للداخل بس**: ما يركب على باب في الشمس أو المطر.
- الربح **208** على 599، و**146** بأسوأ حالة.
- نروح له لو R1 خلص من المخزون، أو ما نجح في التجربة.

### متى ما ينفعون الاثنين
- **أبواب الألمنيوم النحيفة:**
  - R1 وM305TT للأبواب الخشب.
  - باب الألمنيوم بإطار ضيق يحتاج قفل نحيف، مثل Lettech بـ639.99 وضمانه 5 سنوات. ومعه نخسر 226 على 599.
  - اقتراحي: نبدأ بأبواب الخشب بس، وباب الألمنيوم يتسعّر لحاله (حوالي 1,036 عشان يبقى ربح 200). القرار لك ومع المالي.
  - لوحة NFC على إطار ألمنيوم لازم تكون on-metal (سكيل القسم، [seritag](https://seritag.com/learn/using-nfc/on-metal-nfc-tags)). وهل الـ19 ريال تكفي لها؟ **غير مؤكد**.
- **لو تبغى ضمان سعودي سنتين** (TMW Active أو CAVAN): نخسر على 599، ولازم التجهيز يصير 860 إلى 995.
- **ما نعتمد** Aqara وNuki وYale (كلها تخسر على 599)، ولا Tuya الرخيص (رخصته ما تسمح بالاستخدام التجاري).

**اتفاقي مع fin-modeler:**
- **أتفق** إن 599 يمشي مع قفل TTLock من أمازون.
- **التعديل الوحيد:** قفل T306 حقهم ما له رابط منتج، فحطيت بداله R1، اللي له صفحة ويركب على أبواب 4585. الربح ينزل من 224 إلى 216، وهذا فرق بسيط.
- **وأتفق** إن المتاجر المتخصصة والاستيراد ما يمشون على 599.

---

## 4) وش اللي ما تأكد، وكيف تتأكد منه من جوالك
**تنبيه:** افتح الصفحات واقرأها بس. لا تشتري ولا تسجل في شي، لأننا في وضع التجهيز (GM-006).

| وش نتأكد منه | الرابط | وش تشوف في الصفحة |
|---|---|---|
| سعر R1 وضمانه | [amazon.sa R1](https://www.amazon.sa/-/en/Razuvious-Fingerprint-Mortise-Keyless-Bluetooth-R1/dp/B09JMZZX4X) | السعر اليوم. هل مكتوب «شامل ضريبة القيمة المضافة»؟ مين البائع؟ هل الشحن من أمازون؟ كم الضمان وكم أيام الإرجاع؟ وفي المواصفات: «4585» و«240mm» وسماكة الباب |
| سعر M305TT وضمانه | [amazon.sa M305TT](https://www.amazon.sa/-/en/Makayuron-Fingerprint-Bluetooth-Anti-Theft-included/dp/B0FFBCB389) | نفس الأشياء. وانتبه تختار النسخة اللي تناسب سماكة باب العميل |
| سعر البوابة | [amazon.sa G2](https://www.amazon.sa/dp/B0CSX8MB2X) | السعر 80.99؟ ومكتوب إنها G2 حقت تطبيق TTLock؟ |
| R1 في متاجر ثانية | [noon R1](https://www.noon.com/saudi-en/razuvious-smart-lock-fingerprint-door-lock-with-4585-mortise-keyless-entry-bluetooth-lock-free-app-ic-card-anti-peep-code-work-with-alexa-tt-lock-app-control-for-home-office-apartment-r1/ZC3CF88A6C73402A80064Z/p/)، [microless R1](https://saudi.microless.com/product/razuvious-smart-lock-fingerprint-door-lock-with-4585-mortise-keyless-entry-bluetooth-lock-free-app-ic-card-anti-peep-code-work-with-alexa-tt-lock-app-control-for-home-office-apartment-r1/offers/) | السعر، والتوفر، والضمان |
| فتح الباب عن بعد بالـAPI | [unlock](https://euopen.ttlock.com/doc/api/v3/lock/unlock) | هل مكتوب إنه يحتاج بوابة؟ وهل يشتغل مع أقفال الواي فاي بدون بوابة؟ |
| رمز PIN مؤقت بدون نت | [keyboardPwd/get](https://euopen.ttlock.com/doc/api/v3/keyboardPwd/get) | النوع 3 «Period»، وإن الرمز ينحسب بدون ما يتصل بالقفل |
| رسوم TTLock API | [euopen.ttlock.com](https://euopen.ttlock.com/) | صفحة الأسعار أو الشروط بس، **بدون تسجيل الحين** |
| الضمان عند المتاجر السعودية | [TMW Active](https://tmw-smart.com/active/p956956701)، [bhome](https://bhome-sa.com/categories/606600/smartlocks)، [Lettech ألمنيوم](https://lettech.sa/ar/%D9%82%D9%81%D9%84-%D8%A8%D8%A7%D8%A8-%D8%B0%D9%83%D9%8A-%D9%86%D8%AD%D9%8A%D9%81/p1653980156) | السعر، وهل شامل الضريبة، ومدة الضمان، وهل التركيب داخل |
| جمارك القفل (البند 8301.40) | [زاتكا: استعلام التعرفة](https://zatca.gov.sa/en/eServices/Pages/eServices-220.aspx) | النسبة: 5% أو 15%؟ (هذا قبل أي استيراد بس) |
| شروط سابر للأجهزة اللاسلكية | [UL](https://www.ul.com/insights/saudi-arabia-wireless-regulatory-updates) | هل نحتاج شهادة لو استوردنا بنفسنا؟ (قبل أي استيراد بس) |
| سعر الجملة | [W3 علي بابا](https://www.alibaba.com/product-detail/wifi-tuya-ttlock-smart-Fingerprint-Handle_1600511320736.html) | السعر للكمية، وهل مكتوب TTLock مو Tuya بس |

**وأشياء غير مؤكدة ما تنحل إلا بالتجربة:**
- يشتغل R1 مع G2؟
- كم يتحمل البطارية؟
- كم المسافة القصوى بين البوابة والقفل؟
- كم نسبة أبواب الألمنيوم في الشقق اللي نشتغل عليها؟
- كم صندوق المفتاح الحقيقي (حطيناه 40)، وكم المشوار؟

---

## 5) نصيحة أول شراء (القرار لك، وما اشترينا شي)
1. **ابدأ بالتجزئة وبكمية صغيرة.** قفل R1 وقفل M305TT وبوابة G2 وحدة: 198 + 205.99 + 80.99 = **حوالي 485 ريال**. وإذا تبغى أقل: R1 والبوابة بس، حوالي **279**.
2. **قبل الطلب** قس باب التجربة: سماكته، والمسافة من حافة الباب لنص المقبض (لازم 45 مم)، وطول اللسان القديم.
3. **أول ما توصل** (وقبل ما تخلص مدة الإرجاع حق أمازون):
   - قس اللسان: لازم 240 مم ومقاس 4585.
   - اربطه بتطبيق TTLock.
   - شبّك G2 على واي فاي 2.4GHz.
   - افتحه من التطبيق وأنت بعيد.
   - اطلع رمز Period لساعة وحدة، ثم افصل الراوتر وجرّب الرمز. لازم يفتح.
   - استنى لين تخلص الساعة. لازم الرمز يوقف.
   - جرّب المفتاح الميكانيكي، وشوف مستوى البطارية في التطبيق.
   - سجّل كل نتيجة.
4. **إذا نجح**، نشتري واحد لكل عميل بعد ما يدفع (قاعدة: ما نشتري قفل قبل الدفع). وخلّك قفل احتياط واحد.
5. **الجملة لا.** على الأقل لين:
   - تنجح 5 إلى 10 تركيبات.
   - يتأكد سعر سابر والتخليص.
   - نلقى سعر جملة واصل أقل من 279 للقفل مع البوابة.
   - وإلى ذاك الوقت، التجزئة أرخص وفيها ضمان وإرجاع.

---

## المصادر
- أسعار الكوالين والبوابات والتركيب والجملة: الروابط اللي داخل الجداول. شوهدت كلها 2026-10-01 من مقتطفات البحث، والصفحات نفسها محجوبة.
- مسح الوكلاء: `locks/sweep/ttlock.md`، `local-ksa.md`، `install.md`، `wholesale.md`، `aqara-tuya.md`، `yale-nuki.md`، `igloohome.md`، `fin-modeler.md`.
- حساب fin-modeler: `locks/landed_cost.py`، `locks/prices.json`، `locks/landed_cost.out.txt`.
- الجمارك: [trade.gov](https://www.trade.gov/country-commercial-guides/saudi-arabia-import-tariffs)، [EY](https://globaltaxnews.ey.com/news/2025-2468-saudi-arabia-amends-its-integrated-customs-tariff-schedule)، [Saudi Gazette](https://saudigazette.com.sa/article/651883/SAUDI-ARABIA/Duties-revised-on-certain-products-as-per-amended-GCC-Customs-Tariff-Schedule)، [زاتكا](https://zatca.gov.sa/en/eServices/Pages/eServices-220.aspx).
- سعر الدولار 3.75: [ساما](https://www.sama.gov.sa/en-US/MediaCenter/News/Pages/news-557.aspx) (من نتيجة البحث).
