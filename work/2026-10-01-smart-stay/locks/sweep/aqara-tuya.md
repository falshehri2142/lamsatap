# مسح الأسعار: Aqara وXiaomi وTuya (تاريخ الاطلاع 2026-10-01)

تنبيه: amazon.sa وmicroless وdeveloper.tuya كلها محجوبة من بروكسي البيئة، فالأسعار جاية من مقتطفات نتائج البحث فقط، يعني **غير مؤكدة** (ما فتحنا الصفحة). الضريبة كمان غير مؤكدة (أمازون السعودية تعرض عادة السعر شامل الضريبة).

| الموديل | الجزء | المتجر | السعر | المصدر | ملاحظة |
|---|---|---|---|---|---|
| Aqara U100 | قفل | amazon.sa | 787.71 ر.س | https://www.amazon.sa/-/en/Aqara-Bluetooth-Electronic-Weatherproof-Compatible/dp/B0BZSD2L1W | غير مؤكد (مقتطف بحث). يحتاج هب للتحكم عن بعد |
| Aqara U100 + هب E1 | باقة | microless السعودية | 918.71 ر.س | https://saudi.microless.com/product/aqara-smart-lock-u100-kit-with-an-e1-hub-and-2-nfc-cards-fingerprint-door-lock-touchscreen-keyboard-ip65-compatible-with-apple-homekit-alexa-google-ifttt/ | غير مؤكد (الصفحة محجوبة) |
| Aqara A100 Zigbee | قفل | microless السعودية | غير معروف | https://saudi.microless.com/product/aqara-a100-zigbee-smart-lock-biometric-fingerprint-9-unlock-methods-remotely-configurable-passwords-and-settings-black-znms02es/ | موجود بالمتجر، السعر ما ظهر |
| Aqara U200 Kit | باقة | modo الإمارات | 1,290 درهم (~1,317 ر.س) | https://uae.modo.store/products/aqara-smart-lock-u200 | مو سعودي، غير مؤكد |
| Tuya واي فاي بصمة (غير معروف الماركة) | قفل | amazon.sa | 169.90 – 188.99 ر.س | https://www.amazon.sa/-/en/tuya-smart-lock/s?k=tuya+smart+lock | غير مؤكد، نوعية مجهولة، الضمان غير واضح |
| Tuya سلندر بصمة | قفل | amazon.sa | 342 ر.س | نفس رابط البحث | غير مؤكد |
| Tuya/TTLock خارجي rim | قفل | amazon.sa | 595.22 ر.س | https://www.amazon.sa/-/en/Waterproof-Outdoor-Fingerprint-Electric-Electronic/dp/B0CD1VDTYV | غير مؤكد |

## الكلاود API
- **Tuya**: نسخة التجربة مجانية (26 ألف طلب API بالشهر)، بس **ممنوع الاستخدام التجاري** فيها، ومدتها 6 شهور قابلة للتمديد. النسخ المدفوعة أسعارها غير مؤكدة (الصفحة محجوبة). فيه API للأقفال يسوي رمز مؤقت. المصدر: https://developer.tuya.com/en/docs/iot/membership-service?id=K9m8k45jwvg9j و https://developer.tuya.com/en/docs/cloud/smart-door-lock?id=K9jgsgd4cgysr
- **Aqara**: منصة المطورين فيها HTTP API للتحكم عن بعد وإنشاء رموز مؤقتة. الرسوم **غير مؤكدة**. المصدر: https://opendoc.aqara.cn/en/ و https://developer.aqara.com/
- Xiaomi: ما لقينا سعر سعودي، غير مؤكد.

## الخلاصة
Aqara U100 بهب = ~919 ر.س، يعني أعلى من باقة 599 كاملة. Tuya الرخيص (170–190) يدخل بالباقة بس جودته وضمانه ورخصة الكلاود التجارية مو واضحة. لازم صاحب المشروع يتأكد من الأسعار بنفسه.
