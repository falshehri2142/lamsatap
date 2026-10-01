# copy-en — النصوص الإنجليزية لموقع الشركة (GM-070، web-copy، 2026-10-01)

**الحالة:** مسودة لـ web-builder. ما لمسنا أي صفحة عربية. آخر رسالة من صاحب المشروع في هذا التشغيل كانت «الا العربي»، ومعناها مو واضح: ممكن «لا تلمسون العربي»، وممكن «العربي بس». فقبل ما ينقل web-builder العربي إلى `/ar/` ويحط الإنجليزي في الجذر، لازم المدير العام **يأكد مع صاحب المشروع**. هذا الملف ما يغيّر شي في الموقع.

**المصادر:** الصفحات العربية الحالية (`website/index.html` و`restaurants/` و`hosts/` و`404.html`)، و`config.js`، و`assets/signature.js` و`hosts-smart.js` و`app.js` و`svg-motion.js`. الأرقام من `services/pricing.md`، والتجربة من GM-027، والرد من GM-046، والإقامة الذكية من `services/smart-stay.md`. **ما فيه ولا وعد أو رقم غير موجود في الصفحات العربية.**

---

## 0) قواعد ثابتة لـ web-builder

**الصوت:** مستوى أمريكي فاخر. جمل قصيرة وواثقة، بدون علامات تعجب ولا كلام تسويقي فاضي. القارئ صاحب كافيه في جدة أو مضيف شقق، والمشاهد سعودية. **النص مو ترجمة حرفية**، فالمعنى والوعد نفسهم بالضبط.

**المصطلحات (قرار واحد لكل كلمة، وتنكتب كذا في كل مكان):**
| العربي | English |
|---|---|
| لمسة تاب | LamsaTap |
| لمسة / يقرّب جواله | tap / tap their phone |
| شريحة NFC | NFC tag (أو tag بعد أول ذكر). ما نكتب chip |
| باركود QR | QR code |
| ستاند | stand |
| ستاند تقييم قوقل | Google review stand. نص عادي بدون شعار قوقل ولا ألوانه |
| زبونك / ضيفك | your guests. نستخدمها للمطاعم والمضيفين، على عادة الضيافة الأمريكية |
| محل (مطعم أو كافيه) | venue |
| حزمة المحل الكامل | Full Venue Package |
| باقة المضيف | Host Plan |
| دليل الضيف / دليل الوحدة | guest guide |
| الإقامة الذكية / دخول ذكي | Smart Stay / Smart Entry |
| نظافة بعد الخروج | Post-checkout cleaning |
| تسجيل الخروج / وقت الخروج | check-out / check-out time. نفس كلمات ستاندات الطباعة (`print/host-signs/signs.js`) |
| بلاغ صيانة | maintenance request |
| العاملة | housekeeper |
| مختبر اللمسة | Tap Lab |
| واي فاي | Wi-Fi (بشرطة عادية) |

**الأرقام والعملة:**
- داخل الجمل تنكتب العملة قبل الرقم: `SAR 798`.
- في عرض السعر الكبير الرقم كبير وبعده الوحدة صغيرة: `1,211` + `SAR / year`، عشان ما يتغير ترتيب العناصر (`s-price-fig` ثم `s-price-unit`).
- الكسور بخانتين: `49.50` و`39.50` و`544.50` و`434.50`. نفس القيمة المعتمدة، والكتابة كذا هي المعتادة بالإنجليزي. الرقم الصحيح يبقى بدون كسور: `1,089`.
- الوقت: `9 AM–11 PM`. المدى بشَرطة قصيرة (–): `1–4`.

**الطباعة:** الفاصلة العليا والأقواس المعقوفة (’ “ ”) في كل نص ظاهر وفي الميتا. علامة ' العادية في رسائل الواتساب بس.

**المجسمات اللي تمثّل شي يشوفه الضيف تبقى عربي، وأي كلام مننا لصاحب المحل يصير إنجليزي.** صفحات الزبون عربية (GM-070)، فلو ترجمنا المجسم بنوعد بشي ما عندنا. يبقى بالعربي:
- شاشة المنيو في `.r-demo-phone`، وشاشة الدليل في `.p-demo-phone`.
- ستاند «قيّمنا في قوقل» في `.lt-stand`.
- ورقة الإطار `.p-sign-paper`: «تأكيد الخروج» و«المس هنا»، و`DONE = 'تم الخروج'` في `svg-motion.js`.
- الإطار اللي يحاوط هذي المجسمات ياخذ `lang="ar"` و`aria-hidden="true"`، ويصير له وصف إنجليزي (المكتوب تحت). ترى `.p-demo-phone` حالياً **مو** `aria-hidden`.

**الواتساب (ماركته):** ما نستخدم WhatsApp كفعل («WhatsApp us» ممنوعة). نكتب «Message us on WhatsApp».

**تبديل اللغة (GM-070):**
- في الصفحات الإنجليزية: رابط نصه `العربية` مع `lang="ar"` و`hreflang="ar"`.
- في الصفحات العربية: رابط نصه `English` مع `lang="en"` و`hreflang="en"`.
- هذا هو التعديل الوحيد في الصفحات العربية.

**الميتا:**
- `og:site_name` = `LamsaTap`، و`og:locale` = `en_US`، و`og:locale:alternate` = `ar_SA`.
- في الصفحات الإنجليزية `[data-company]` = `LamsaTap`، و`[data-company-alt]` = `LamsaTap`. يعني `fillCompany` تاخذ `companyNameEn` لما تكون الصفحة `lang="en"`.

---

## 1) الرئيسية `website/index.html` (← تصير إنجليزي، `lang="en" dir="ltr"`)

### الرأس والميتا
| العربي | English |
|---|---|
| (title) لمسة تاب — منيو وتقييم قوقل ودليل ضيف بلمسة جوال، في جدة | LamsaTap — NFC Menus, Google Reviews & Guest Guides in Jeddah |
| (description) المنيو وتقييم قوقل والواي فاي ودليل الشقة، تنفتح بلمسة جوال أو مسح باركود، بدون تطبيق. بشعارك، ونركّبها في جدة. تجربة أسبوعين ببلاش. | Menus, Google reviews, Wi-Fi, and apartment guides that open with a tap or a QR scan. No app. Your branding, installed in Jeddah. Free two-week trial. |
| (og:title) لمسة تاب — قرّب جوالك، تنفتح الصفحة | LamsaTap — Tap your phone. The page opens. |
| (og:description) ضيفك يقرّب جواله من شريحة NFC أو يمسح باركود QR، وينفتح له المنيو أو دليل الوحدة. العتاد والتركيب علينا طول الاشتراك. | Guests tap an NFC tag or scan a QR code, and your menu or unit guide opens. Hardware and installation are included for as long as you subscribe. |
| (og:site_name) لمسة تاب | LamsaTap |
| انتقل للمحتوى | Skip to content |
| (alt الشعار) لمسة تاب — LamsaTap | LamsaTap |
| (aria-label للنافيقيشن ×2) أقسام الموقع | Site sections |
| للمطاعم والكافيهات | Restaurants & cafés |
| للمضيفين | Hosts |
| كيف نشتغل | How it works |
| (زر الرأس) اكتشف الحلول | See the solutions |
| (جديد) زر تبديل اللغة | العربية |

### البطل
| العربي | English |
|---|---|
| (H1) لمسة وحدة.<br>وكل شي ينفتح. | One tap.<br>Everything opens. |
| ضيفك يقرّب جواله، ويفتح المنيو أو التقييم أو الواي فاي أو دليل الشقة. بدون تطبيق. | Guests tap their phone and open your menu, review page, Wi-Fi, or apartment guide. No app. |
| (aria-label) وش عندك؟ | What do you run? |
| عندي مطعم أو كافيه / جرّب المنيو | I run a restaurant or café / Try the menu |
| عندي شقق أو استراحات / جرّب دليل الضيف | I rent out apartments or chalets / Try the guest guide |
| جرّب لمسة الحين | Try a tap now |
| (alt) جوال يفتح لمسة تاب بجانب فنجان قهوة على طاولة كافيه | A phone opening a LamsaTap page beside a cup of coffee on a café table |
| لمسة صغيرة.<br>**وضيفك ما يسألك.** | One small tap.<br>**Nothing left to ask.** |
| (aria-label) افتح دليل الضيف التجريبي | Open the sample guest guide |
| (aria-label الباركود) باركود فيه رمز لمسة تاب، يفتح الدليل التجريبي | QR code with the LamsaTap mark. Opens the sample guest guide. |
| امسح وجرّب دليل الضيف | Scan to try the guest guide |

### شريط الضمانات (نفس النص في الصفحات الثلاث، 4 بنود)
| العربي | English |
|---|---|
| (aria-label) ضماناتنا | Our commitments |
| جرّبها أسبوعين مجاناً | Free for two weeks |
| بدون دفع مقدم | Nothing to pay upfront |
| العتاد والتركيب علينا طول الاشتراك | Hardware and installation included for as long as you subscribe |
| نركّب في جدة | Installed by us in Jeddah |
| نرد خلال ساعة، 9 الصبح لين 11 الليل، كل يوم | We reply within an hour, 9 AM–11 PM, every day |

### مختبر اللمسة (Tap Lab) — HTML و`assets/signature.js` ‏`TEXT`
| العربي | English |
|---|---|
| جرّبها الحين | Try it now |
| اختر وش يشوف زبونك، وقرّب الجوال. | Pick what your guests see. Then tap. |
| (aria-label) اختر التجربة | Choose a demo |
| المنيو | Menu |
| تقييم قوقل | Google review |
| الواي فاي | Wi-Fi |
| دليل الضيف | Guest guide |
| (iframe title) معاينة التجربة | Demo preview |
| (menu) زبونك يقرّب جواله من الستاند، وتنفتح المنيو فوراً. بدون تطبيق. | Your guest taps the stand and the menu opens instantly. No app. |
| (review) لمسة وحدة، وتنفتح صفحة تقييمك في قوقل مباشرة. | One tap opens your Google review page directly. |
| (wifi) أندرويد يتصل باللمسة، والآيفون يفتح صفحة فيها كلمة المرور. | Android connects on tap. iPhone opens a page with the password. |
| (guide) ضيفك يلقى الواي فاي ووقت الخروج وبلاغ الصيانة، بدون ما يتصل عليك. | Your guest finds the Wi-Fi, check-out time, and maintenance requests without calling you. |
| افتح التجربة كاملة | Open the full demo |

### الأبواب `#solutions`
| العربي | English |
|---|---|
| نفس اللمسة.<br>على مقاس نشاطك. | Same tap.<br>Made for your business. |
| من طاولة الكافيه إلى باب الشقة.<br>اختر نشاطك وشوف كيف نخدم ضيوفك. | From the café table to the apartment door.<br>Pick your business and see how we serve your guests. |
| (alt) ستاند على طاولة كافيه بجانب فنجان قهوة | A stand on a café table beside a cup of coffee |
| عندي مطعم أو كافيه | Restaurants & cafés |
| منيو، وتقييم قوقل، وواي فاي، وروابط حساباتك. | Menu, Google reviews, Wi-Fi, and all your links. |
| (aria-label) خدمات المطاعم | Restaurant services |
| منيو إلكتروني / تقييم قوقل / واي فاي | Digital menu / Google reviews / Wi-Fi |
| شوف حزمة المحل | See the Full Venue Package |
| (alt) لوحة بجانب باب شقة ضيافة | A sign beside the door of a guest apartment |
| عندي شقق أو إيجار قصير | Apartments & short stays |
| دليل لكل وحدة: الواي فاي، ووقت الخروج، وبلاغ الصيانة. | A guide for every unit: Wi-Fi, check-out time, and maintenance requests. |
| (aria-label) خدمات المضيفين | Host services |
| دليل الضيف / تسجيل الخروج / بلاغ صيانة | Guest guide / Check-out / Maintenance requests |
| شوف باقة المضيف | See the Host Plan |

### كيف نشتغل `#how`
| العربي | English |
|---|---|
| من رسالة واتساب،<br>لأول لمسة. | From one WhatsApp message<br>to the first tap. |
| أنت تعرف ضيوفك.<br>وإحنا نجهّز لهم التجربة. | You know your guests.<br>We set up the experience. |
| ابدأ على واتساب | Start on WhatsApp |
| (alt) الستاند المخصص على طاولة الكافيه | A custom-branded stand on a café table |
| 01 نتفاهم على <span data-channel-name>واتساب</span> | 01 We talk on <span data-channel-name>WhatsApp</span> |
| ترسل لنا نوع محلك أو عدد وحداتك، ونقترح لك الباقة. | Tell us what kind of venue you run, or how many units you have, and we’ll recommend a plan. |
| 02 نجهّز كل شي بهويتك | 02 We build it in your brand |
| الصفحة والعتاد بشعارك وألوانك، والشريحة والباركود على نفس الرابط. | Your page and hardware carry your logo and colors. The NFC tag and QR code open the same link. |
| 03 نركّب عندك | 03 We install it on-site |
| نركّب حالياً في جدة، ونجرّب كل شريحة قبل التسليم. | We currently install in Jeddah, and we test every tag before handover. |

`data-channel-name` في `app.js`: «واتساب» ← `WhatsApp`، و«تليجرام» ← `Telegram`.

### التواصل `#contact`
| العربي | English |
|---|---|
| نركّب حالياً في جدة | Now installing in Jeddah |
| أول لمسة علينا.<br>أسبوعين ببلاش. | The first tap is on us.<br>Two weeks, free. |
| يرد عليك واحد منا خلال ساعة، من 9 الصبح لين 11 الليل، كل يوم. | Someone on our team replies within an hour, 9 AM–11 PM, every day. |
| كلّمنا على واتساب | Message us on WhatsApp |
| رقم التواصل على واتساب ينضاف قريباً. | Our WhatsApp number is coming soon. |
| أو كلّمنا على تليجرام | Or message us on Telegram |
| بالضغط تنفتح محادثة مع بوت لمسة تاب، ويوصلنا معرّفك في تليجرام لهذا الطلب بس، وما نشاركه مع أحد. سياسة الخصوصية | Tapping opens a chat with the LamsaTap bot. We receive your Telegram ID for this request only, and we don’t share it with anyone. Privacy policy |

إشعار التليجرام نص قانوني (register بند 34)، فترجمته حرفية في المعنى. وهو نفسه في كل مكان يطلع فيه.

### التذييل (الرئيسية)
| العربي | English |
|---|---|
| (alt) لمسة تاب — LamsaTap | LamsaTap |
| لمسة NFC أو مسح QR. بدون تطبيق. | Tap with NFC or scan a QR code. No app. |
| (aria-label) روابط أسفل الصفحة | Footer |
| للمطاعم والكافيهات / للمضيفين / كيف نشتغل | Restaurants & cafés / Hosts / How it works |
| سياسة الخصوصية / الشروط والأحكام | Privacy policy / Terms & conditions |
| واتساب / قناتنا على تليجرام | WhatsApp / Our Telegram channel |
| للأعلى | Back to top |
| © 2026 لمسة تاب | © 2026 LamsaTap |
| الصور توضيحية | Images are for illustration only. |
| (`app.js`) السجل التجاري: | CR No. |

---

## 2) المطاعم `website/restaurants/index.html`

### الرأس والميتا
| العربي | English |
|---|---|
| (title + og:title) لمسة تاب للمطاعم والكافيهات — منيو وتقييم قوقل وواي فاي | LamsaTap for Restaurants & Cafés — Menu, Reviews & Wi-Fi |
| (description + og:description) حزمة المحل الكامل للمطاعم والكافيهات: ستاند تقييم قوقل، ومنيو، وواي فاي، وروابط حساباتك، بشعار محلك. تجربة أسبوعين ببلاش. | The Full Venue Package for restaurants and cafés: a Google review stand, digital menu, Wi-Fi page, and your links, all with your logo. Free two-week trial. |
| انتقل للمحتوى / أقسام الموقع / للمطاعم والكافيهات / للمضيفين / كيف نشتغل | نفس الرئيسية |
| (زر الرأس الصغير) كلّمنا على واتساب | Chat on WhatsApp |

### البطل
| العربي | English |
|---|---|
| (H1) خلّ جوال زبونك<br>يرد عنك. | Let your guests’ phones<br>answer for you. |
| (`r-hero-title` المكرر، aria-hidden) خلّ جوال زبونك / يرد عنك | Let your guests’ phones / answer for you |
| زبونك يقرّب جواله: المنيو، والواي فاي، وصفحة تقييمك في قوقل. | One tap brings up your menu, your Wi-Fi, and your Google review page. |
| افتح منيو تجريبي | Open a sample menu |
| شوف السعر | See pricing |
| (aria-label) الخدمات المشمولة | What’s included |
| منيو إلكتروني / تقييم قوقل / واي فاي / روابط محلك | Digital menu / Google reviews / Wi-Fi / Your links |
| مرّر… وتابع اللمسة. | Scroll, and follow the tap. |
| (alt) ستاند تقييم على طاولة كافيه | A review stand on a café table |
| (aria-label الباركود ×2) باركود المنيو التجريبي من لمسة تاب، امسحه بجوالك | LamsaTap sample-menu QR code. Scan it with your phone. |
| (SVG `<text>` ×2) امسحه بجوالك | Scan with your phone (غيّر `direction="rtl"` إلى `ltr`) |
| بشعار محلك.<br>**تجربة تليق بمحلك.** | Your logo on it.<br>**An experience that fits your venue.** |
| NFC + QR | NFC + QR |

### نافيقيشن الصفحة
| العربي | English |
|---|---|
| (aria-label) أقسام صفحة المطاعم | Restaurant page sections |
| لمسة تاب لمحلك | LamsaTap for your venue |
| العرض الحي / التجربة / الباقة / الأسئلة | Live demo / Experience / Pricing / FAQ |

### العرض الحي `#demo`
| العربي | English |
|---|---|
| جرّبها كأنك زبون. | Try it like a guest. |
| أمثلة وهمية لكافيه، تنفتح زي ما تنفتح عند زبونك. | Sample pages for a made-up café. They open exactly as they will for your guests, in Arabic. |
| جرّب مختبر اللمسة: قرّب الجوال وشوف | Try the Tap Lab: tap the phone and watch |
| (`.r-demo-phone`، مجسم شاشة المنيو) | يبقى عربي. الإطار ياخذ `lang="ar"`، و`aria-hidden` موجود أصلاً |
| (`.lt-stand`: قيّمنا في قوقل / قرّب جوالك هنا / أو امسح الباركود) | يبقى عربي (ستاند العميل) |
| المنيو / الأصناف بأسعارها وسعراتها. | Menu / Every item with its price and calories. |
| افتح المثال<span class="s-sr">: المنيو</span> | Open the sample<span class="s-sr">: menu</span> |
| الواي فاي / كلمة المرور قدامه، بزر نسخ. | Wi-Fi / The password, right in front of them, with a copy button. |
| افتح المثال: الواي فاي | Open the sample: Wi-Fi |
| روابط المحل / واتساب المحل وحساباته وموقعه. | Venue links / Your WhatsApp, social accounts, and location. |
| افتح المثال: روابط المحل | Open the sample: venue links |
| وستاند تقييم قوقل يفتح صفحة تقييم محلك في قوقل مباشرة. اعرف كيف يشتغل ستاند التقييم | And the Google review stand opens your review page on Google directly. See how the review stand works |
| ستاند تقييم قوقل ينفع لأي نشاط. كلّمنا عنه على واتساب | The Google review stand works for any business. Ask us about it on WhatsApp |
| كلّمنا على تليجرام | Message us on Telegram |

### المشاكل والقصة `#experience`
| العربي | English |
|---|---|
| كل يوم نفس الأسئلة؟ | Same questions, every day? |
| كل شوي أحد يسأل عن كلمة الواي فاي؟ | Someone asking for the Wi-Fi password, again? |
| غيّرت أسعارك، والمنيو المطبوع صار قديم؟ | Changed your prices, and now the printed menu is out of date? |
| زبونك يبغى يقيّمك، بس ما يلقى صفحتك بسرعة؟ | Guests want to leave a review but can’t find your page fast? |
| ثلاث أسئلة، ولا وحدة توصلك. | Three questions. None of them reach you. |
| على الطاولة / المنيو بأسعاره وسعراته، مرتب بأقسام. | At the table / The menu with prices and calories, organized by section. |
| عند الكاشير / ستاند التقييم يفتح صفحة تقييم محلك في قوقل مباشرة، ويطلبه من الكل بدون مقابل. | At the counter / The review stand opens your Google review page directly. It invites every guest, with nothing offered in return. |
| طول الجلسة / كلمة مرور الواي فاي بزر نسخ، وروابط حساباتك وموقعك. | Throughout the visit / The Wi-Fi password with a copy button, plus your social links and location. |

### الباقة `#plan`
| العربي | English |
|---|---|
| كل هذا باشتراك واحد | All of it. One subscription. |
| ونجهّزها بهويتك ونركّبها عندك. | Built in your branding and installed at your venue. |
| حزمة المحل الكامل | Full Venue Package |
| ستاند تقييم قوقل | Google review stand |
| المنيو بالأسعار والسعرات | Menu with prices and calories |
| تحديث المنيو مرتين بالشهر | Menu updates twice a month |
| صفحة الواي فاي | Wi-Fi page |
| صفحة روابط حساباتك | Links page for your accounts |
| ستاند بشعار محلك | Stand with your logo |
| (aria-label) السعر للسنة الأولى أو للتجديد | Price for the first year or renewal |
| السنة الأولى / التجديد | First year / Renewal |
| (s-sr، data-first) 1,211 ريال بالسنة | SAR 1,211 per year |
| (s-sr، data-renew) 798 ريال بالسنة للتجديد | SAR 798 per year on renewal |
| (s-price-fig) 1,211 / 798 · (s-price-unit) ريال بالسنة | 1,211 / 798 · SAR / year |
| (بدون JS) والتجديد 798 ريال بالسنة. | Renews at SAR 798 per year. |
| ما يتجدد إلا بتأكيد صريح منك. | It renews only with your explicit confirmation. |
| اطلب تجربة أسبوعين على واتساب | Book a free trial on WhatsApp |
| أسبوعين ببلاش · ما عجبك؟ نشيل العتاد، بدون دفع مقدم ولا التزام في التجربة | Two weeks free · Not for you? We pick up the hardware. No upfront payment, no commitment during the trial. |
| أو كلّمنا على تليجرام + الإشعار | نفس الرئيسية |
| (aria-label) ضماناتنا + البنود الأربعة | نفس شريط الضمانات |
| اللي ما نسويه | What we don’t do |
| ما نطلب تقييم بمقابل، ولا من الراضين بس. | We never offer anything for a review, and we don’t ask only happy guests. |
| ما نكتب تقييمات لمحلك، ولا نبيع «زيادة تقييمات». | We don’t write reviews for your venue, and we don’t sell “review boosts.” |
| ما نحط شعارنا على عتادك، إلا سطر صغير لو وافقت. | Our logo stays off your hardware, except for one small credit line, and only if you agree. |

زر التجربة ما يذكر «two weeks» عشان ما ينكسر على 390px، والمدة مكتوبة في السطر اللي تحته وفي العنوان.

### الأسئلة `#faq`
| العربي | English |
|---|---|
| الأسئلة | Common questions |
| هل زبوني يحتاج تطبيق؟ | Do my guests need an app? |
| لا، الصفحة تنفتح في متصفح جواله. آيفون XS وأحدث يقرأ الشريحة بدون تطبيق. وأندرويد يقرأها لما يكون NFC شغال والشاشة مفتوحة. وفي أندرويد 17 وأحدث، يطلع له تنبيه يضغط عليه عشان ينفتح الرابط. | No. The page opens in their phone’s browser. iPhone XS and newer read the tag without an app. Android reads it when NFC is on and the screen is unlocked. On Android 17 and newer, a notification appears, and they tap it to open the link. |
| وش لو جواله ما قرأ الشريحة؟ | What if their phone doesn’t read the tag? |
| يمسح الباركود اللي جنبها، ويفتح نفس الصفحة. والآيفون ما يقرأ الشريحة والكاميرا أو المحفظة مفتوحة، أو وهو على وضع الطيران. | They scan the QR code next to it and get the same page. iPhone won’t read the tag while the Camera or Wallet app is open, or in Airplane Mode. |
| أقدر أغيّر المنيو أو الأسعار بعدين؟ | Can I change the menu or prices later? |
| إيه. ترسل لنا التعديل على واتساب، ونحدّث المنيو مرتين بالشهر داخل الحزمة. والتحديث الزيادة بـ 25 ريال لين 10 أصناف، والأكبر أو المنيو الجديد بعرض سعر. والشريحة نفسها ما تتغير. | Yes. Send us your changes on WhatsApp, and we update your menu twice a month as part of the package. Extra updates are SAR 25 each, up to 10 items. Bigger changes or a new menu get a quote. The tag itself never changes. |
| مين يركّب، ووين؟ | Who installs it, and where? |
| إحنا نركّب بنفسنا، وحالياً في جدة بس. والتركيب علينا، ونجرّب كل شريحة قبل التسليم. | We install it ourselves, currently in Jeddah only. Installation is included, and we test every tag before handover. |
| هل ستاند التقييم يجيب لي تقييمات أكثر؟ | Will the review stand get me more reviews? |
| ما نوعد بعدد. الستاند يسهّل على زبائنك يوصلون لصفحة تقييمك. ويطلب التقييم من الكل بدون أي مقابل، حسب سياسة قوقل. | We don’t promise a number. The stand makes it easier for your guests to reach your review page. It invites everyone, with nothing offered in return, in line with Google’s policy. |
| كيف يصير التجديد؟ | How does renewal work? |
| ما يتجدد إلا بتأكيد صريح منك. ونذكّرك قبل التجديد بـ 30 يوم، والتجديد 798 ريال بالسنة. | It renews only with your explicit confirmation. We remind you 30 days before, and renewal is SAR 798 per year. |
| وش تشمل التجربة، وهل أدفع شي مقدم؟ | What’s in the trial, and do I pay anything upfront? |
| نجهّز صفحتك ونركّب العتاد عندك، وتجرّبها أسبوعين ببلاش. بدون دفع مقدم ولا التزام فيها، ولو ما كمّلت نشيل العتاد. | We set up your page and install the hardware, and you try it free for two weeks. No upfront payment and no commitment during the trial. If you don’t continue, we pick up the hardware. |
| وش لو تعطلت الشريحة؟ | What if a tag stops working? |
| نرد على بلاغك خلال ساعة، من 9 الصبح لين 11 الليل، كل يوم. ونبدلها مجاناً خلال 5 أيام عمل، إذا ما كان العطل من سوء استخدام. | We respond to your report within an hour, 9 AM–11 PM, every day, and replace the tag free within 5 business days, as long as the fault isn’t from misuse. |
| تبغى تكلّم أحد منا؟ | Want to talk to a person? |
| يرد عليك واحد منا خلال ساعة، من 9 الصبح لين 11 الليل، كل يوم. | Someone on our team replies within an hour, 9 AM–11 PM, every day. |
| كلّمنا على واتساب / رقم التواصل… / أو كلّمنا على تليجرام + الإشعار | نفس الرئيسية |

### الخاتمة والتذييل
| العربي | English |
|---|---|
| جرّبها أسبوعين في محلك. علينا. | Two weeks in your venue. On us. |
| خبّرنا عن محلك والحي، ونرتب معك التجربة. | Tell us about your venue and neighborhood, and we’ll set up your trial. |
| اطلب تجربة أسبوعين على واتساب + سطر المخاطرة + التليجرام | نفس `#plan` |
| (alt) لمسة تاب — LamsaTap | LamsaTap |
| نركّب حالياً في جدة | Now installing in Jeddah |
| الصور توضيحية | Images are for illustration only. |
| روابط التذييل و© | نفس الرئيسية |

---

## 3) المضيفين `website/hosts/index.html`

### الرأس والميتا
| العربي | English |
|---|---|
| (title + og:title) دليل ضيف ذكي لشقتك المفروشة بلمسة جوال، في جدة — لمسة تاب | Smart Guest Guide for Furnished Apartments in Jeddah — LamsaTap |
| (description + og:description) الواي فاي ووقت الخروج وبلاغ الصيانة في دليل يفتحه ضيفك بلمسة جوال أو مسح باركود. من 39.5 ريال للوحدة بالشهر، والعتاد والتركيب علينا. تجربة أسبوعين ببلاش. | Wi-Fi, check-out time, and maintenance requests in a guide guests open with a tap or a QR scan. From SAR 39.50 per unit a month, hardware and installation included. Free two-week trial. |
| (زر الرأس الصغير) كلّمنا على واتساب | Chat on WhatsApp |

### البطل
| العربي | English |
|---|---|
| (alt) لوحة بشعار لمسة تاب على جدار جنب باب شقة | A LamsaTap plate on the wall beside an apartment door |
| من الوصول إلى الخروج.<br>**التفاصيل عند ضيفك.** | From arrival to check-out.<br>**Every detail in your guest’s hand.** |
| (H1) ضيفك ما يحتاج<br>رقمك. | Your guests don’t need<br>your number. |
| (`p-hero-title` المكرر) ضيفك ما يحتاج / رقمك | Your guests don’t need / your number |
| الواي فاي ووقت الخروج وبلاغ الصيانة، في دليل يفتحه بلمسة جوال داخل الوحدة. | Wi-Fi, check-out time, and maintenance requests, in a guide they open with one tap inside the unit. |
| افتح دليل تجريبي | Open a sample guide |
| احسب سعر وحداتك | Price your units |
| (aria-label) محتويات دليل الضيف | What’s in the guest guide |
| دليل الضيف / واي فاي / تسجيل الخروج / بلاغ صيانة | Guest guide / Wi-Fi / Check-out / Maintenance requests |

### نافيقيشن الصفحة
| العربي | English |
|---|---|
| (aria-label) أقسام صفحة المضيفين | Host page sections |
| لمسة تاب لوحداتك | LamsaTap for your units |
| الدليل الحي / التجربة / الحاسبة / الأسئلة | Live guide / Experience / Calculator / FAQ |

### الدليل الحي `#demo`
| العربي | English |
|---|---|
| جرّبه كأنك ضيف. | Try it like a guest. |
| مثال وهمي لشقة، ينفتح زي ما ينفتح عند ضيفك. | A sample guide for a made-up apartment. It opens exactly as it will for your guests, in Arabic. |
| افتح دليل تجريبي | Open a sample guide |
| جرّب مختبر اللمسة: قرّب الجوال وشوف | Try the Tap Lab: tap the phone and watch |
| (figcaption) امسحه بجوالك | Scan with your phone |
| (`.p-demo-phone`، مجسم الدليل: أهلاً في شقة المثال، الشبكة، تم الخروج، بلاغ صيانة…) | يبقى عربي. يصير `aria-hidden="true"` و`lang="ar"`، وجنبه نص للقارئ الصوتي (`s-sr`): **Preview of a sample guest guide in Arabic: Wi-Fi details, check-out time, a check-out button, and a maintenance request button.** |
| ستاند الواي فاي / ستاند الطوارئ / ستاند دليل الضيف | Wi-Fi stand / Emergency stand / Guest guide stand |

### المشاكل والقصة `#experience`
| العربي | English |
|---|---|
| كل ضيف، نفس الأسئلة؟ | Every guest, the same questions? |
| ضيفك يسألك عن كلمة الواي فاي الساعة 2 الفجر؟ | A guest asking for the Wi-Fi password at 2 AM? |
| ضيفك يطلع، وما يقول لأحد؟ | Guests leaving without telling anyone? |
| ما تبغى رقمك عند كل ضيف؟ | Rather not give your number to every guest? |
| الدليل يرد عنك. حتى الساعة 2 الفجر. | The guide answers for you. Even at 2 AM. |
| قبل ما يوصل ضيفك / نكتب الدليل من معلوماتك، ونركّب الشريحة والباركود داخل الوحدة. | Before your guest arrives / We write the guide from your details and install the NFC tag and QR code inside the unit. |
| أثناء الإقامة / يلقى الواي فاي بزر نسخ، والتكييف والشروط وأرقام الطوارئ. ولو صار عطل، يرسل لنا بلاغ صيانة على واتساب. | During the stay / They find the Wi-Fi with a copy button, the AC, house rules, and emergency numbers. If something breaks, they send us a maintenance request on WhatsApp. |
| عند الخروج / يشوف وقت الخروج وخطواته، وزر «تم الخروج» يفتح له رسالة واتساب جاهزة لنا. | At check-out / They see the check-out time and steps, and the check-out button opens a ready-to-send WhatsApp message to us. |

«الساعة 2 الفجر» مشهد مو وعد خدمة (brief-copy site-wow)، وتبقى كذا بالإنجليزي.

### الحاسبة `#plan` — HTML و`assets/hosts-smart.js`
| العربي | English |
|---|---|
| كم تدفع عن وحداتك؟ | What will your units cost? |
| باقة المضيف بسعر للوحدة. نجهّز الدليل بهويتك ونركّبه داخل كل وحدة. | The Host Plan is priced per unit. We build the guide in your branding and install it in every unit. |
| كم وحدة عندك؟ | How many units do you have? |
| (aria-label) وحدة زيادة / وحدة أقل | Add a unit / Remove a unit |
| (JS `word`) وحدة / وحدتين / وحدات | unit (1) / units (2+) |
| (legend) طريقة الدفع | Billing |
| شهري / بالتزام 6 أشهر | Monthly / 6-month minimum |
| سنوي / بسعر 11 شهر | Yearly / 12 months for the price of 11 |
| (المجموع) `148.5` + ريال `بالشهر`/`بالسنة` | `148.50` + `SAR` `/ month` / `/ year` |
| (السطر) `49.5` ريال للوحدة `بالشهر`. | SAR `49.50` per unit, `per month` / `per year`. |
| (tier-note) من 5 وحدات يصير سعر الوحدة 39.5 على كل وحداتك. | At 5 units or more, every unit drops to SAR 39.50. (السنوي: SAR 434.50) |
| (tier-note bulk) سعر 5 وحدات أو أكثر، على كل وحداتك. | The 5+ unit rate, applied to all your units. |
| (caption) سعر الوحدة حسب عدد الوحدات | Price per unit by number of units |
| الوحدات / شهري للوحدة / سنوي للوحدة | Units / Monthly, per unit / Yearly, per unit |
| 1 إلى 4 · 49.5 ريال · 544.5 ريال | 1–4 · SAR 49.50 · SAR 544.50 |
| 5 أو أكثر · 39.5 ريال · 434.5 ريال | 5 or more · SAR 39.50 · SAR 434.50 |
| الشهري بالتزام 6 أشهر، والسنوي بسعر 11 شهر. سعر 5 وحدات أو أكثر على كل وحداتك. للمضيف المرخّص من وزارة السياحة. | Monthly billing has a 6-month minimum. Yearly is 12 months for the price of 11. The 5+ rate applies to all your units. For hosts licensed by the Ministry of Tourism. |
| اطلب تجربة أسبوعين على واتساب + سطر المخاطرة + التليجرام | نفس المطاعم |
| (JS، ذيل رسالة الحاسبة) ` عندي 3 وحدات، والدفع شهري.` / `، والدفع سنوي.` | ` I have 3 units, billed monthly.` / ` billed yearly.`. الرقم دايماً مكتوب، حتى مع 2 (`I have 2 units`)، و1 تصير `I have 1 unit`. |
| كل وحدة فيها | Every unit includes |
| دليل الضيف: الواي فاي، والتكييف، والشروط، والعنوان | Guest guide: Wi-Fi, AC, house rules, and address |
| «تم الخروج» و«بلاغ صيانة» برسالة واتساب لنا | Check-out and maintenance buttons that message us on WhatsApp |
| رابط تقييم في الدليل | A review link in the guide |
| رقمك ما يظهر للضيف | Your number stays hidden from guests |
| شريحة الوحدة وملصق الباركود، باسمك أو شعارك | The unit’s NFC tag and QR sticker, with your name or logo |
| ضماناتنا + البنود | نفس شريط الضمانات |

`fmt()` بالإنجليزي: الرقم اللي فيه كسر ينكتب بخانتين (`148.50`، `1,633.50`)، والصحيح يبقى بدون كسور (`1,089`).

### نظافة بعد الخروج (GM-067)
| العربي | English |
|---|---|
| نظافة بعد الخروج | Post-checkout cleaning |
| إضافة اختيارية | Optional add-on |
| ضيفك طلع؟ لا تشيل هم التنظيف. | Guest checked out? Leave the cleaning to us. |
| حالياً في جدة، لمشتركي باقة المضيف. | Currently in Jeddah, for Host Plan subscribers. |
| (aria-label) إطار «تأكيد الخروج» على باب الوحدة | A “Confirm check-out” frame on the unit door |
| (`.p-sign-paper`: تأكيد الخروج / طالع؟ قرّب جوالك هنا، أو امسح الباركود / المس هنا) و`DONE` | يبقى عربي (الإطار المطبوع عند الضيف) |
| على باب الوحدة من الداخل، بشعارك. | Inside the unit door, with your logo. |
| 01 الضيف وهو طالع يلمس الإطار أو يمسح الباركود | 01 On the way out, the guest taps the frame or scans the code |
| 02 توصلنا رسالة إن الوحدة فضت | 02 We get a message that the unit is empty |
| 03 نباشر النظافة | 03 We start the cleaning |
| 04 توصلك صور الوحدة جاهزة | 04 You get photos of the unit, ready for the next guest |
| استوديو، أو غرفة وصالة / للوحدات الصغيرة. | Studio or one-bedroom / For smaller units. |
| غرفتين أو ثلاث غرف / للشقق العائلية. | Two or three bedrooms / For family apartments. |
| السعر قريباً | Price coming soon |
| اسأل عن النظافة على واتساب | Ask about cleaning on WhatsApp |

ممنوع في البطاقة لين ينعتمد: سعر، أو وقت، أو «our team» (نفس قيد العربي).
لو تعبّى `cleaningPrices` يوماً، يحتاج نسخة إنجليزية بصيغة `SAR {price} per visit`. اقتراحي يصير مفتاح `cleaningPricesEn`، والفاضي يطلّع «Price coming soon».

### الإقامة الذكية `#stay` (GM-068 مقترح)
| العربي | English |
|---|---|
| الإقامة الذكية | Smart Stay |
| جديد | New |
| ضيفك يدخل بلمسة، وأنت تدري. | Guests let themselves in with a tap. And you know when they do. |
| قفل ذكي نركّبه بعد ما نشوف بابك. حالياً في جدة. شوف مثال «افتح الباب» | A smart lock we install after we check your door. Currently in Jeddah. See the door-unlock sample |
| جرّبها أسبوعين ببلاش: الدليل واللوحة وتنبيه الخروج. والقفل نركّبه بعد ما تشترك. | Try it free for two weeks: the guide, the NFC door plate, and the check-out alert. The lock is installed once you subscribe. |
| دخول ذكي / الباب يفتح من جوال الضيف. | Smart Entry / The door opens from your guest’s phone. |
| ضيفك يفتح الباب من جواله: يلمس الشريحة أو يمسح الباركود | Guests open the door from their phone: tap the tag or scan the code |
| الباب يفتح بس وقت حجزه | The door opens only during their booking |
| يوصلك تنبيه لما ضيفك يفتح من جواله | You get an alert when your guest opens it from their phone |
| رمز احتياطي للباب، ومفتاح احتياطي يبقى عندك | A backup door code, plus a spare key that stays with you |
| اسأل على واتساب | Ask on WhatsApp |
| دخول ذكي + نظافة / الدخول الذكي، ومعه نظافة بعد الخروج. | Smart Entry + Cleaning / Smart Entry, with cleaning after check-out. |
| كل اللي في «دخول ذكي» | Everything in Smart Entry |
| نظافة بعد كل خروج، بسعر الزيارة | Cleaning after every check-out, priced per visit |
| توصلك صور الوحدة جاهزة | Photos of the unit once it’s ready |
| دخول + تقويم الحجوزات / الدخول الذكي، وتقويم حجوزاتك في مكان واحد. | Smart Entry + Calendar / Smart Entry and your booking calendar, in one place. |
| تقويم حجوزات تديره بنفسك | A booking calendar you manage yourself |
| الباب يفتح حسب الحجز اللي تدخله | The door opens based on the bookings you enter |
| النظافة تنضاف بطلبك | Cleaning added on request |
| السعر قريباً | Price coming soon |
| الدفع والتواصل مع ضيفك يبقون عندك. الأسعار تطلع هنا بعد اعتمادها. | Payments and guest communication stay with you. Prices will appear here once they’re finalized. |

`smartStayPrices` نفس قاعدة النظافة: مفتاح `smartStayPricesEn`، وصيغة السعر مثل `SAR {price} per unit / month` (الأسعار غير معتمدة).

### اللي ما نسويه
| العربي | English |
|---|---|
| اللي ما نسويه | What we don’t do |
| ما نطلّع رقمك ولا رقم العاملة للضيف. | We never show your number, or your housekeeper’s, to guests. |
| ما نشارك رقم ضيفك مع أحد. | We don’t share your guest’s number with anyone. |
| ما نسحب ضيفك للحجز أو الدفع برا المنصة. | We never pull your guests into booking or paying off-platform. |

### الأسئلة `#faq`
| العربي | English |
|---|---|
| الأسئلة | Common questions |
| هل ضيفي يحتاج تطبيق؟ + الجواب | Do my guests need an app? + نفس جواب المطاعم |
| وش لو جواله ما قرأ الشريحة؟ + الجواب | نفس المطاعم |
| أقدر أغيّر كلمة الواي فاي أو الشروط بعدين؟ | Can I change the Wi-Fi password or house rules later? |
| إيه. ترسل لنا التعديل على واتساب، ونغيّره من عندنا بدون ما نرجع للوحدة. والشريحة نفسها ما تتغير. | Yes. Send us the change on WhatsApp, and we update it remotely, with no visit to the unit. The tag itself never changes. |
| مين يركّب، ووين؟ + الجواب | نفس المطاعم |
| هل رقمي أو رقم العاملة يطلع للضيف؟ | Will guests see my number, or my housekeeper’s? |
| لا، أبداً. رسايل «تم الخروج» و«بلاغ صيانة» توصلنا إحنا من جوال الضيف. ورقمك ما يطلع في الصفحة ولا في الرسالة. | Never. Check-out and maintenance messages come to us, from the guest’s phone. Your number isn’t on the page or in the message. |
| كيف يصير التجديد؟ | How does renewal work? |
| ما يتجدد إلا بتأكيد صريح منك. ونذكّرك قبل التجديد بـ 7 أيام للشهري، و30 يوم للسنوي. | It renews only with your explicit confirmation. We remind you 7 days before renewal on monthly billing, and 30 days before on yearly. |
| وش تشمل التجربة، وهل أدفع شي مقدم؟ | What’s in the trial, and do I pay anything upfront? |
| نجهّز الدليل ونركّب العتاد في وحدة وحدة، وتجرّبها أسبوعين ببلاش. بدون دفع مقدم ولا التزام فيها، ولو ما كمّلت نشيل العتاد. | We set up the guide and install the hardware in one unit, and you try it free for two weeks. No upfront payment and no commitment during the trial. If you don’t continue, we pick up the hardware. |
| وش لو تعطلت الشريحة؟ + الجواب | نفس المطاعم |
| تبغى تكلّم أحد منا؟ + السطر + الأزرار | نفس المطاعم |

### الخاتمة والتذييل
| العربي | English |
|---|---|
| وحدة وحدة، أسبوعين ببلاش. | One unit. Two weeks. On us. |
| خبّرنا كم وحدة عندك والحي، ونرتب معك التجربة. | Tell us how many units you have and where, and we’ll set up your trial. |
| الأزرار والتذييل | نفس المطاعم |

---

## 4) صفحة 404 `website/404.html`
| العربي | English |
|---|---|
| (title) الصفحة مو موجودة — لمسة تاب | Page not found — LamsaTap |
| (description) الصفحة اللي تدورها مو موجودة. ارجع لرئيسية لمسة تاب واختر الخدمة. | The page you’re looking for doesn’t exist. Head back to LamsaTap and pick a service. |
| (aria-label) لمسة تاب — الرئيسية | LamsaTap — Home |
| (alt) لمسة تاب — LamsaTap | LamsaTap |
| 404 | 404 |
| هالصفحة مو موجودة. | We can’t find that page. |
| يمكن تغيّر الرابط. تقدر ترجع للرئيسية وتختار الخدمة اللي تحتاجها. | The link may have changed. Head back home and pick what you need. |
| ارجع للرئيسية | Back to home |
| (جديد، رابط ثانوي `href="/ar/"` مع `lang="ar"`) | الرئيسية بالعربي |

الـ404 وحدة للموقع كله، وفيه ناس بيوصلونها من روابط `/ar/` الخربانة، فرابط العربي تحت الزر ضروري.

---

## 5) نصوص JS المشتركة (`assets/app.js`)
| العربي | English |
|---|---|
| `NAME` لمسة تاب | LamsaTap (من `companyNameEn`) |
| السجل التجاري: | CR No. |
| تليجرام (`data-channel-name`) | Telegram |
| واتساب (`data-channel-name` الافتراضي) | WhatsApp |
| تم النسخ | Copied |

---

## 6) رسائل الواتساب الإنجليزية (مفاتيح جديدة في `config.js` ‏`waText`)

القاعدة:
- الصفحة الإنجليزية تاخذ `<key>En`، وإذا فاضي ترجع للمفتاح العربي.
- سطر واحد لكل رسالة، ونفس ترتيب العربي: التحية، ثم الطلب، ثم الخانة اللي يعبيها العميل.
- علامة ' العادية.
- المحادثة نفسها تكمل بالعربي أو الإنجليزي حسب لغة العميل (من نص مهمة GM-070). ما كتبناه وعد ظاهر في الصفحات، لأنه وعد خدمة جديد ما هو موجود في العربي، ويحتاج تأكيد صاحب المشروع قبل ما ينكتب.
- مفاتيح نسخ العرض (`demo*`) والدليل (`checkout` و`maintenance` و`contact`) تبقى عربي، لأن صفحات الزبون عربية.

```js
homeEn: "Hi, I saw your website and have a question.",
shopEn: "Hi, I'm interested in the Full Venue Package for my restaurant or café. Venue name and neighborhood:",
shopTrialEn: "Hi, I'd like to try the Full Venue Package at my restaurant or café for two weeks. Venue name and neighborhood:",
reviewAnyEn: "Hi, I'd like a Google review stand for my business. Type of business and neighborhood:",
hostEn: "Hi, I'm interested in the Host Plan for my apartments. Number of units and neighborhood:",
hostTrialEn: "Hi, I'd like to try the Host Plan for two weeks. Number of units and neighborhood:",
hostCleaningEn: "Hi, I'd like post-checkout cleaning for my units. Number of units and neighborhood:",
stayEntryEn: "Hi, I'm interested in Smart Entry for my units. Number of units and neighborhood:",
stayEntryCleanEn: "Hi, I'm interested in Smart Entry with post-checkout cleaning. Number of units and neighborhood:",
stayFullEn: "Hi, I'm interested in Smart Entry with the booking calendar for my units. Number of units and neighborhood:",
portfolioEn: "Hi, I have 5 or more units and I'm interested in the Host Plan for them. Number of units and neighborhood:",
```

- `hostTrialEn` بعدها ذيل الحاسبة: ` I have 3 units, billed monthly.` (القسم 3).
- `portfolioEn` مثل العربي: موجود في config بس ما فيه صفحة تستخدمه حالياً.

---

## 7) أشياء على غيري
- **legal-advisor:** هل لازم يكون موقع البيع بالعربي أولاً (نظام التجارة الإلكترونية ولائحته)؟ **غير مؤكد**. العربي باقي كامل في `/ar/`، بس الحكم للمحامي قبل الإطلاق. ونفس الشي ترجمة إشعار التليجرام وسطر «ما يتجدد إلا بتأكيد صريح» (register بند 34، وterms).
- **صاحب المشروع (عن طريق المدير العام):** وش يقصد بـ«الا العربي»؟ وهل نكتب «We reply in English or Arabic» في الصفحات؟
- **web-builder:** القواعد اللي في القسم 0، و`fmt` والكلمات في `hosts-smart.js`، والمفاتيح `*En` في `config.js`، و`aria-hidden` و`lang="ar"` على `.p-demo-phone`.
