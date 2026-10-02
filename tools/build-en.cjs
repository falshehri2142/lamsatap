// GM-070: builds the English company pages (root) from the Arabic ones in ar/.
// Usage (from the project root): node tools/build-en.cjs website
// Order after any Arabic edit:  node tools/build-home-minis.cjs  →  node tools/build-en.cjs website
// The copy is the deck in work/2026-10-01-english-site/copy-en.md (web-copy). Rules this script enforces:
//   - Every pair must match at least once (exact Arabic string), longest first, so a short term never cuts a sentence.
//   - Guest-facing mockups stay Arabic (customer pages are Arabic): the mini phones (foreignObject), the review stand,
//     and the «تأكيد الخروج» frame. They get lang="ar" and are never translated.
//   - After the pass, any Arabic left outside those mockups (and the «عربي» switch) is an error.
//   - HTML comments are dropped, so tools/build-home-minis.cjs can never overwrite English with Arabic.
'use strict';
const fs = require('fs'), path = require('path');
const W = path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(W, 'ar', 'index.html'))) throw new Error('No Arabic pages in ' + W + '/ar/ (GM-070 move: work/2026-10-01-english-site/move-ar.cjs)');
const DOMAIN = 'https://lamsatap.com';
const AR = /[؀-ۿ]/;
const GLOBE_RE = /<a class="lt-btn lt-btn--secondary lt-btn--compact s-lang" href="[^"]*" hreflang="en" lang="en">(<svg class="s-lang-i"[\s\S]*?<\/svg>)<span>English<\/span><\/a>/;

// ---------- copy shared by the three pages ----------
const TG_NOTE_AR = 'بالضغط تنفتح محادثة مع بوت <span data-company>لمسة تاب</span>، ويوصلنا معرّفك في تليجرام لهذا الطلب بس، وما نشاركه مع أحد. <a data-link="privacy" hidden>سياسة الخصوصية</a>';
const TG_NOTE_EN = 'Tapping opens a chat with the <span data-company>LamsaTap</span> bot. We receive your Telegram ID for this request only, and we don’t share it with anyone. <a data-link="privacy" hidden>Privacy policy</a>';
const SHARED = [
  ['انتقل للمحتوى', 'Skip to content'],
  ['aria-label="أقسام الموقع"', 'aria-label="Site sections"'],
  ['>للمطاعم والكافيهات</a>', '>Restaurants &amp; cafés</a>'],
  ['>للمضيفين</a>', '>Hosts</a>'],
  ['>كيف نشتغل</a>', '>How it works</a>'],
  ['alt="لمسة تاب — LamsaTap"', 'alt="LamsaTap"'],
  ['<meta property="og:site_name" content="لمسة تاب">', '<meta property="og:site_name" content="LamsaTap">'],
  // trust strip (4 items)
  ['aria-label="ضماناتنا"', 'aria-label="Our commitments"'],
  ['<span>جرّبها أسبوعين مجاناً</span>', '<span>Free for two weeks</span>'],
  ['<span>بدون دفع مقدم</span>', '<span>Nothing to pay upfront</span>'],
  ['<span>العتاد والتركيب علينا طول الاشتراك</span>', '<span>Hardware and installation included for as long as you subscribe</span>'],
  ['نركّب في جدة<small', 'Installed by us in Jeddah<small'],
  ['نرد خلال ساعة، 9 الصبح لين 11 الليل، كل يوم</small>', 'We reply within an hour, 9 AM–11 PM, every day</small>'],
  // contact group
  [TG_NOTE_AR, TG_NOTE_EN],
  ['<p class="s-tg-line">أو <a class="s-tg-link" data-tg-link>كلّمنا على تليجرام</a></p>', '<p class="s-tg-line">Or <a class="s-tg-link" data-tg-link>Chat on Telegram</a></p>'],
  ['<p class="s-tg-line"><a class="s-tg-link" data-tg-link>كلّمنا على تليجرام</a></p>', '<p class="s-tg-line"><a class="s-tg-link" data-tg-link>Chat on Telegram</a></p>'],
  // web-qa 2026-10-01: «Chat on …» (the header's approved short label) so the buttons stay on one line at 320–1024
  ['<span>كلّمنا على واتساب</span>', '<span>Chat on WhatsApp</span>'],
  ['رقم التواصل على واتساب ينضاف قريباً.', 'Our WhatsApp number is coming soon.'],
  ['يرد عليك واحد منا خلال ساعة، من 9 الصبح لين 11 الليل، كل يوم.', 'Someone on our team replies within an hour, 9 AM–11 PM, every day.'],
  ['تبغى تكلّم أحد منا؟', 'Want to talk to a person?'],
  ['<span>اطلب تجربة أسبوعين على واتساب</span>', '<span>Book a free trial on WhatsApp</span>'],
  ['أسبوعين ببلاش · ما عجبك؟ نشيل العتاد، بدون دفع مقدم ولا التزام في التجربة', 'Two weeks free · Not for you? We pick up the hardware. No upfront payment, no commitment during the trial.'],
  // footer
  ['>سياسة الخصوصية</a>', '>Privacy policy</a>'],
  ['>الشروط والأحكام</a>', '>Terms &amp; conditions</a>'],
  ['hidden>واتساب</a>', 'hidden>WhatsApp</a>'],
  ['>قناتنا على تليجرام</a>', '>Our Telegram channel</a>'],
  ['© 2026 <span data-company>لمسة تاب</span>', '© 2026 <span data-company>LamsaTap</span>'],
  ['الصور توضيحية</p>', 'Images are for illustration only.</p>'],
  // FAQ answers shared by restaurants and hosts
  ['<summary>وش لو جواله ما قرأ الشريحة؟</summary>', '<summary>What if their phone doesn’t read the tag?</summary>'],
  ['لا، الصفحة تنفتح في متصفح جواله. آيفون XS وأحدث يقرأ الشريحة بدون تطبيق. وأندرويد يقرأها لما يكون NFC شغال والشاشة مفتوحة. وفي أندرويد 17 وأحدث، يطلع له تنبيه يضغط عليه عشان ينفتح الرابط.',
    'No. The page opens in their phone’s browser. iPhone XS and newer read the tag without an app. Android reads it when NFC is on and the screen is unlocked. On Android 17 and newer, a notification appears, and they tap it to open the link.'],
  ['يمسح الباركود اللي جنبها، ويفتح نفس الصفحة. والآيفون ما يقرأ الشريحة والكاميرا أو المحفظة مفتوحة، أو وهو على وضع الطيران.',
    'They scan the QR code next to it and get the same page. iPhone won’t read the tag while the Camera or Wallet app is open, or in Airplane Mode.'],
  ['<summary>مين يركّب، ووين؟</summary>', '<summary>Who installs it, and where?</summary>'],
  ['إحنا نركّب بنفسنا، وحالياً في جدة بس. والتركيب علينا، ونجرّب كل شريحة قبل التسليم.', 'We install it ourselves, currently in Jeddah only. Installation is included, and we test every tag before handover.'],
  ['<summary>كيف يصير التجديد؟</summary>', '<summary>How does renewal work?</summary>'],
  ['<summary>وش تشمل التجربة، وهل أدفع شي مقدم؟</summary>', '<summary>What’s in the trial, and do I pay anything upfront?</summary>'],
  ['<summary>وش لو تعطلت الشريحة؟</summary>', '<summary>What if a tag stops working?</summary>'],
  ['نرد على بلاغك خلال ساعة، من 9 الصبح لين 11 الليل، كل يوم. ونبدلها مجاناً خلال 5 أيام عمل، إذا ما كان العطل من سوء استخدام.',
    'We respond to your report within an hour, 9 AM–11 PM, every day, and replace the tag free within 5 business days, as long as the fault isn’t from misuse.'],
  ['>الأسئلة</h2>', '>Common questions</h2>'],
  ['>الأسئلة</a>', '>FAQ</a>'],
  ['>التجربة</a>', '>Experience</a>'],
  ['>اللي ما نسويه</h3>', '>What we don’t do</h3>'],
  ['جرّب مختبر اللمسة: قرّب الجوال وشوف', 'Try the Tap Lab: tap the phone and watch'],
  ['<p>نركّب حالياً في جدة</p>', '<p>Now installing in Jeddah</p>']
];

// ---------- home ----------
const HOME = [
  ['<title>لمسة تاب — منيو وتقييم قوقل ودليل ضيف بلمسة جوال، في جدة</title>', '<title>LamsaTap — NFC Menus, Google Reviews &amp; Guest Guides in Jeddah</title>'],
  ['content="المنيو وتقييم قوقل والواي فاي ودليل الشقة، تنفتح بلمسة جوال أو مسح باركود، بدون تطبيق. بشعارك، ونركّبها في جدة. تجربة أسبوعين ببلاش."',
    'content="Menus, Google reviews, Wi-Fi, and apartment guides that open with a tap or a QR scan. No app. Your branding, installed in Jeddah. Free two-week trial."'],
  ['content="لمسة تاب — قرّب جوالك، تنفتح الصفحة"', 'content="LamsaTap — Tap your phone. The page opens."'],
  ['content="ضيفك يقرّب جواله من شريحة NFC أو يمسح باركود QR، وينفتح له المنيو أو دليل الوحدة. العتاد والتركيب علينا طول الاشتراك."',
    'content="Guests tap an NFC tag or scan a QR code, and your menu or unit guide opens. Hardware and installation are included for as long as you subscribe."'],
  ['href="#solutions">اكتشف الحلول <svg', 'href="#solutions">See the solutions <svg'],
  ['لمسة وحدة.<br>وكل شي ينفتح.', 'One tap.<br>Everything opens.'],
  ['ضيفك يقرّب جواله، ويفتح المنيو أو التقييم أو الواي فاي أو دليل الشقة. بدون تطبيق.', 'Guests tap their phone and open your menu, review page, Wi-Fi, or apartment guide. No app.'],
  ['aria-label="وش عندك؟"', 'aria-label="What do you run?"'],
  ['<b>عندي مطعم أو كافيه</b><span>جرّب المنيو</span>', '<b>I run a restaurant or café</b><span>Try the menu</span>'],
  ['<b>عندي شقق أو استراحات</b><span>جرّب دليل الضيف</span>', '<b>I rent out apartments or chalets</b><span>Try the guest guide</span>'],
  ['جرّب لمسة الحين <svg', 'Try a tap now <svg'],
  ['alt="جوال يفتح لمسة تاب بجانب فنجان قهوة على طاولة كافيه"', 'alt="A phone opening a LamsaTap page beside a cup of coffee on a café table"'],
  ['<p>لمسة صغيرة.<br><strong>وضيفك ما يسألك.</strong></p>', '<p>One small tap.<br><strong>Nothing left to ask.</strong></p>'],
  ['aria-label="افتح دليل الضيف التجريبي"', 'aria-label="Open the sample guest guide"'],
  ['aria-label="باركود فيه رمز لمسة تاب، يفتح الدليل التجريبي"', 'aria-label="QR code with the LamsaTap mark. Opens the sample guest guide."'],
  ['امسح وجرّب دليل الضيف <svg', 'Scan to try the guest guide <svg'],
  // Tap Lab (captions also on each tab, read by signature.js)
  ['<p class="tl__eyebrow">جرّبها الحين</p>', '<p class="tl__eyebrow">Try it now</p>'],
  ['اختر وش يشوف زبونك، وقرّب الجوال.', 'Pick what your guests see. Then tap.'],
  ['aria-label="اختر التجربة"', 'aria-label="Choose a demo"'],
  ['data-tl-src="demo/menu/index.html">المنيو</button>', 'data-tl-src="demo/menu/index.html" data-tl-cap="Your guest taps the stand and the menu opens instantly. No app.">Menu</button>'],
  ['data-tl-src="demo/review/index.html" tabindex="-1">تقييم قوقل</button>', 'data-tl-src="demo/review/index.html" data-tl-cap="One tap opens your Google review page directly." tabindex="-1">Google review</button>'],
  ['data-tl-src="demo/wifi/index.html" tabindex="-1">الواي فاي</button>', 'data-tl-src="demo/wifi/index.html" data-tl-cap="Android connects on tap. iPhone opens a page with the password." tabindex="-1">Wi-Fi</button>'],
  ['data-tl-src="demo/rental-guide/index.html" tabindex="-1">دليل الضيف</button>', 'data-tl-src="demo/rental-guide/index.html" data-tl-cap="Your guest finds the Wi-Fi, check-out time, and maintenance requests without calling you." tabindex="-1">Guest guide</button>'],
  ['title="معاينة التجربة"', 'title="Demo preview"'],
  ['زبونك يقرّب جواله من الستاند، وتنفتح المنيو فوراً. بدون تطبيق.', 'Your guest taps the stand and the menu opens instantly. No app.'],
  ['>افتح التجربة كاملة</a>', '>Open the full demo</a>'],
  // doors
  ['نفس اللمسة.<br>على مقاس نشاطك.', 'Same tap.<br>Made for your business.'],
  ['من طاولة الكافيه إلى باب الشقة.<br>اختر نشاطك وشوف كيف نخدم ضيوفك.', 'From the café table to the apartment door.<br>Pick your business and see how we serve your guests.'],
  ['alt="ستاند على طاولة كافيه بجانب فنجان قهوة"', 'alt="A stand on a café table beside a cup of coffee"'],
  ['aria-describedby="door-r-t">عندي مطعم أو كافيه</a>', 'aria-describedby="door-r-t">Restaurants &amp; cafés</a>'],
  ['منيو، وتقييم قوقل، وطلب من الطاولة، ونداء النادل.', 'Menu, Google reviews, table ordering, and waiter calls.'],
  ['aria-label="خدمات المطاعم"><li>منيو إلكتروني</li><li>تقييم قوقل</li><li>الطلب من الطاولة</li><li>نداء النادل</li>', 'aria-label="Restaurant services"><li>Digital menu</li><li>Google reviews</li><li>Table ordering</li><li>Waiter calls</li>'],
  ['شوف حزمة المحل <svg', 'See the Full Venue Package <svg'],
  ['alt="لوحة بجانب باب شقة ضيافة"', 'alt="A sign beside the door of a guest apartment"'],
  ['aria-describedby="door-h-t">عندي شقق أو إيجار قصير</a>', 'aria-describedby="door-h-t">Apartments &amp; short stays</a>'],
  ['دليل لكل وحدة، وقفل يفتح من جوال الضيف، ونجهز شقتك الجديدة من الصفر.', 'A guide for every unit, a lock that opens from the guest’s phone, and full setup for new apartments.'],
  ['aria-label="خدمات المضيفين"><li>دليل الضيف</li><li>دخول ذكي</li><li>نظافة</li><li>ابدأ من الصفر</li>', 'aria-label="Host services"><li>Guest guide</li><li>Smart entry</li><li>Cleaning</li><li>Start from scratch</li>'],
  ['شوف باقة المضيف <svg', 'See the Host Plan <svg'],
  // how
  ['من رسالة واتساب،<br>لأول لمسة.', 'From one WhatsApp message<br>to the first tap.'],
  ['أنت تعرف ضيوفك.<br>وإحنا نجهّز لهم التجربة.', 'You know your guests.<br>We set up the experience.'],
  ['ابدأ على واتساب <svg', 'Start on WhatsApp <svg'],
  ['alt="الستاند المخصص على طاولة الكافيه"', 'alt="A custom-branded stand on a café table"'],
  ['نتفاهم على <span data-channel-name>واتساب</span>', 'We talk on <span data-channel-name>WhatsApp</span>'],
  ['ترسل لنا نوع محلك أو عدد وحداتك، ونقترح لك الباقة.', 'Tell us what kind of venue you run, or how many units you have, and we’ll recommend a plan.'],
  ['نجهّز كل شي بهويتك', 'We build it in your brand'],
  ['الصفحة والعتاد بشعارك وألوانك، والشريحة والباركود على نفس الرابط.', 'Your page and hardware carry your logo and colors. The NFC tag and QR code open the same link.'],
  ['<h3 class="s-h3">نركّب عندك</h3>', '<h3 class="s-h3">We install it on-site</h3>'],
  ['نركّب حالياً في جدة، ونجرّب كل شريحة قبل التسليم.', 'We currently install in Jeddah, and we test every tag before handover.'],
  // contact
  ['</svg>نركّب حالياً في جدة</p>', '</svg>Now installing in Jeddah</p>'],
  ['أول لمسة علينا.<br>أسبوعين ببلاش.', 'The first tap is on us.<br>Two weeks, free.'],
  // footer
  ['<p>لمسة NFC أو مسح QR. بدون تطبيق.</p>', '<p>Tap with NFC or scan a QR code. No app.</p>'],
  ['aria-label="روابط أسفل الصفحة"', 'aria-label="Footer"'],
  ['>للأعلى<svg', '>Back to top<svg']
];

// ---------- restaurants ----------
const REST_TITLE_AR = 'لمسة تاب للمطاعم والكافيهات — منيو وتقييم قوقل وواي فاي', REST_TITLE_EN = 'LamsaTap for Restaurants &amp; Cafés — Menu, Reviews &amp; Wi-Fi';
const REST_DESC_AR = 'حزمة المحل الكامل للمطاعم والكافيهات: ستاند تقييم قوقل، ومنيو، وواي فاي، وروابط حساباتك، بشعار محلك. تجربة أسبوعين ببلاش.';
const REST_DESC_EN = 'The Full Venue Package for restaurants and cafés: a Google review stand, digital menu, Wi-Fi page, and your links, all with your logo. Free two-week trial.';
const REST = [
  [REST_TITLE_AR, REST_TITLE_EN],
  [REST_DESC_AR, REST_DESC_EN],
  ['s-head-wa" data-wa="shop" hidden><span>كلّمنا على واتساب</span>', 's-head-wa" data-wa="shop" hidden><span>Chat on WhatsApp</span>'],
  // JSON-LD
  ['"name": "حزمة المحل الكامل"', '"name": "Full Venue Package"'],
  ['"name": "جدة"', '"name": "Jeddah"'],
  ['"audienceType": "المطاعم والكافيهات"', '"audienceType": "Restaurants and cafés"'],
  ['"name": "لمسة تاب"', '"name": "LamsaTap"'],
  ['"name": "الاشتراك السنوي"', '"name": "First-year subscription"'],
  ['"name": "التجديد السنوي"', '"name": "Annual renewal"'],
  ['"unitText": "بالسنة"', '"unitText": "per year"'],
  ['"name": "للمطاعم والكافيهات"', '"name": "Restaurants & cafés"'],
  // hero
  ['خلّ جوال زبونك<br>يرد عنك.', 'Let your guests’ phones<br>answer for&nbsp;you.'],
  ['<span>خلّ جوال زبونك</span><span>يرد عنك</span>', '<span>Let your guests’ phones</span><span>answer for you</span>'],
  ['زبونك يقرّب جواله: المنيو، والواي فاي، وصفحة تقييمك في قوقل.', 'One tap brings up your menu, your Wi-Fi, and your Google review page.'],
  ['افتح منيو تجريبي<svg', 'Open a sample menu<svg'],
  ['شوف السعر<svg', 'See pricing<svg'],
  ['aria-label="الخدمات المشمولة"><li>منيو إلكتروني</li><li>تقييم قوقل</li><li>واي فاي</li><li>روابط محلك</li>', 'aria-label="What’s included"><li>Digital menu</li><li>Google reviews</li><li>Wi-Fi</li><li>Your links</li>'],
  ['</svg>مرّر… وتابع اللمسة.</p>', '</svg>Scroll, and follow the tap.</p>'],
  ['alt="ستاند تقييم على طاولة كافيه"', 'alt="A review stand on a café table"'],
  ['aria-label="باركود المنيو التجريبي من لمسة تاب، امسحه بجوالك"', 'aria-label="LamsaTap sample-menu QR code. Scan it with your phone."'],
  ['direction="rtl" fill="#14201F" font-size="13" font-weight="500" font-family="Readex Pro, sans-serif" style="font-family:var(--lt-font-brand, \'Readex Pro\', sans-serif)">امسحه بجوالك</text>',
    'direction="ltr" fill="#14201F" font-size="13" font-weight="500" font-family="Readex Pro, sans-serif" style="font-family:var(--lt-font-brand, \'Readex Pro\', sans-serif)">Scan with your phone</text>'],
  ['<span>بشعار محلك.<br><strong>تجربة تليق بمحلك.</strong></span>', '<span>Your logo on it.<br><strong>An experience that fits your venue.</strong></span>'],
  // section nav
  ['aria-label="أقسام صفحة المطاعم"><div class="s-wrap"><p>لمسة تاب لمحلك</p>', 'aria-label="Restaurant page sections"><div class="s-wrap"><p>LamsaTap for your venue</p>'],
  ['>العرض الحي</a>', '>Live demo</a>'],
  ['>الباقة</a>', '>Pricing</a>'],
  // demo
  ['جرّبها كأنك زبون.', 'Try it like a guest.'],
  ['أمثلة وهمية لكافيه، تنفتح زي ما تنفتح عند زبونك.', 'Sample pages for a made-up café. They open exactly as they will for your guests, in Arabic.'],
  ['<h3 class="s-h3">المنيو</h3><p class="r-card-t">الأصناف بأسعارها وسعراتها.</p>', '<h3 class="s-h3">Menu</h3><p class="r-card-t">Every item with its price and calories.</p>'],
  ['افتح المثال<span class="s-sr">: المنيو</span>', 'Open the sample<span class="s-sr">: menu</span>'],
  ['<h3 class="s-h3">الواي فاي</h3><p class="r-card-t">كلمة المرور قدامه، بزر نسخ.</p>', '<h3 class="s-h3">Wi-Fi</h3><p class="r-card-t">The password, right in front of them, with a copy button.</p>'],
  ['افتح المثال<span class="s-sr">: الواي فاي</span>', 'Open the sample<span class="s-sr">: Wi-Fi</span>'],
  ['<h3 class="s-h3">روابط المحل</h3><p class="r-card-t">واتساب المحل وحساباته وموقعه.</p>', '<h3 class="s-h3">Venue links</h3><p class="r-card-t">Your WhatsApp, social accounts, and location.</p>'],
  ['افتح المثال<span class="s-sr">: روابط المحل</span>', 'Open the sample<span class="s-sr">: venue links</span>'],
  ['وستاند تقييم قوقل يفتح صفحة تقييم محلك في قوقل مباشرة. <a class="lt-link" href="../demo/review/index.html">اعرف كيف يشتغل ستاند التقييم</a>',
    'And the Google review stand opens your review page on Google directly. <a class="lt-link" href="../demo/review/index.html">See how the review stand works</a>'],
  ['ستاند تقييم قوقل ينفع لأي نشاط. <a class="r-any-link" data-wa="reviewAny" hidden>كلّمنا عنه على واتساب</a>', 'The Google review stand works for any business. <a class="r-any-link" data-wa="reviewAny" hidden>Ask us about it on WhatsApp</a>'],
  // experience
  ['كل يوم نفس الأسئلة؟', 'Same questions, every day?'],
  ['كل شوي أحد يسأل عن كلمة الواي فاي؟', 'Someone asking for the Wi-Fi password, again?'],
  ['غيّرت أسعارك، والمنيو المطبوع صار قديم؟', 'Changed your prices, and now the printed menu is out of date?'],
  ['زبونك يبغى يقيّمك، بس ما يلقى صفحتك بسرعة؟', 'Guests want to leave a review but can’t find your page fast?'],
  ['ثلاث أسئلة، ولا وحدة توصلك.', 'Three questions. <br>None of them reach&nbsp;you.'],
  ['<h3 class="s-h3">على الطاولة</h3><p>المنيو بأسعاره وسعراته، مرتب بأقسام.</p>', '<h3 class="s-h3">At the table</h3><p>The menu with prices and calories, organized by section.</p>'],
  ['<h3 class="s-h3">عند الكاشير</h3><p>ستاند التقييم يفتح صفحة تقييم محلك في قوقل مباشرة، ويطلبه من الكل بدون مقابل.</p>', '<h3 class="s-h3">At the counter</h3><p>The review stand opens your Google review page directly. It invites every guest, with nothing offered in return.</p>'],
  ['<h3 class="s-h3">طول الجلسة</h3><p>كلمة مرور الواي فاي بزر نسخ، وروابط حساباتك وموقعك.</p>', '<h3 class="s-h3">Throughout the visit</h3><p>The Wi-Fi password with a copy button, plus your social links and location.</p>'],
  // plan
  ['كل هذا باشتراك واحد', 'All of it. <br>One subscription.'],
  ['ونجهّزها بهويتك ونركّبها عندك.', 'Built in your branding and installed at your venue.'],
  ['<h3 class="s-h3" id="plan-name">حزمة المحل الكامل</h3>', '<h3 class="s-h3" id="plan-name">Full Venue Package</h3>'],
  ['<span>ستاند تقييم قوقل</span>', '<span>Google review stand</span>'],
  ['<span>المنيو بالأسعار والسعرات</span>', '<span>Menu with prices and calories</span>'],
  ['<span>تحديث المنيو مرتين بالشهر</span>', '<span>Menu updates twice a month</span>'],
  ['<span>صفحة الواي فاي</span>', '<span>Wi-Fi page</span>'],
  ['<span>صفحة روابط حساباتك</span>', '<span>Links page for your accounts</span>'],
  ['<span>ستاند بشعار محلك</span>', '<span>Stand with your logo</span>'],
  ['aria-label="السعر للسنة الأولى أو للتجديد"', 'aria-label="Price for the first year or renewal"'],
  ['data-value="first">السنة الأولى</button>', 'data-value="first">First year</button>'],
  ['data-value="renew" tabindex="-1">التجديد</button>', 'data-value="renew" tabindex="-1">Renewal</button>'],
  ['<span class="s-sr" data-swap data-first="1,211 ريال بالسنة" data-renew="798 ريال بالسنة للتجديد">1,211 ريال بالسنة</span>', '<span class="s-sr" data-swap data-first="SAR 1,211 per year" data-renew="SAR 798 per year on renewal">SAR 1,211 per year</span>'],
  ['<span class="s-price-unit" aria-hidden="true">ريال بالسنة</span>', '<span class="s-price-unit" aria-hidden="true">SAR / year</span>'],
  ['والتجديد <span class="s-num">798</span> ريال بالسنة.', 'Renews at SAR <span class="s-num">798</span> per year.'],
  ['<p class="s-price-note">ما يتجدد إلا بتأكيد صريح منك.</p>', '<p class="s-price-note">It renews only with your explicit confirmation.</p>'],
  ['ما نطلب تقييم بمقابل، ولا من الراضين بس.', 'We never offer anything for a review, and we don’t ask only happy guests.'],
  ['ما نكتب تقييمات لمحلك، ولا نبيع «زيادة تقييمات».', 'We don’t write reviews for your venue, and we don’t sell “review boosts.”'],
  ['ما نحط شعارنا على عتادك، إلا سطر صغير لو وافقت.', 'Our logo stays off your hardware, except for one small credit line, and only if you agree.'],
  // faq
  ['<summary>هل زبوني يحتاج تطبيق؟</summary>', '<summary>Do my guests need an app?</summary>'],
  ['<summary>أقدر أغيّر المنيو أو الأسعار بعدين؟</summary>', '<summary>Can I change the menu or prices later?</summary>'],
  ['إيه. ترسل لنا التعديل على واتساب، ونحدّث المنيو مرتين بالشهر داخل الحزمة. والتحديث الزيادة بـ 25 ريال لين 10 أصناف، والأكبر أو المنيو الجديد بعرض سعر. والشريحة نفسها ما تتغير.',
    'Yes. Send us your changes on WhatsApp, and we update your menu twice a month as part of the package. Extra updates are SAR 25 each, up to 10 items. Bigger changes or a new menu get a quote. The tag itself never changes.'],
  ['<summary>هل ستاند التقييم يجيب لي تقييمات أكثر؟</summary>', '<summary>Will the review stand get me more reviews?</summary>'],
  ['ما نوعد بعدد. الستاند يسهّل على زبائنك يوصلون لصفحة تقييمك. ويطلب التقييم من الكل بدون أي مقابل، حسب سياسة قوقل.',
    'We don’t promise a number. The stand makes it easier for your guests to reach your review page. It invites everyone, with nothing offered in return, in line with Google’s policy.'],
  ['ما يتجدد إلا بتأكيد صريح منك. ونذكّرك قبل التجديد بـ 30 يوم، والتجديد 798 ريال بالسنة.', 'It renews only with your explicit confirmation. We remind you 30 days before, and renewal is SAR 798 per year.'],
  ['نجهّز صفحتك ونركّب العتاد عندك، وتجرّبها أسبوعين ببلاش. بدون دفع مقدم ولا التزام فيها، ولو ما كمّلت نشيل العتاد.',
    'We set up your page and install the hardware, and you try it free for two weeks. No upfront payment and no commitment during the trial. If you don’t continue, we pick up the hardware.'],
  // Restaurant Ops (#ops, GM-072 proposal; copy: work/2026-10-01-restaurant-ops/site/ux.md §3)
  ['<span class="s-badge">جديد</span>', '<span class="s-badge">New</span>'],
  ['<span>الطلب من الطاولة</span><svg', '<span>Table ordering</span><svg'],
  ['<a class="is-new" href="#ops">إدارة المطعم</a>', '<a class="is-new" href="#ops">Restaurant Ops</a>'],
  ['id="ops-h">إدارة المطعم</h2>', 'id="ops-h">Restaurant Ops</h2>'],
  ['زبونك يطلب من جواله، أو ينادي النادل بضغطة. والاثنين يوصلونك على شاشة وحدة.', 'Guests order from their phone, or call a waiter with one tap. Either way, it lands on one screen.'],
  ['>يمسح الباركود أو يلمس الستاند</h3>', '>They scan the code or tap the stand</h3>'],
  ['>المنيو يفتح على طول، بدون تطبيق.</p>', '>The menu opens right away. No app needed.</p>'],
  ['>ويختار: يطلب من جواله، أو ينادي النادل</h3>', '>Then they choose: order on their phone, or call a waiter</h3>'],
  ['>اطلب من جوالك</h4>', '>Order on your phone</h4>'],
  ['<li>يختار من المنيو ويرسل طلبه للمطبخ</li>', '<li>Pick from the menu and send it to the kitchen</li>'],
  ['<li>يتابع طلبه: انستلم، يتحضّر، جاهز</li>', '<li>Follow it live: received, preparing, ready</li>'],
  ['>النادل يجي لك</h4>', '>Call a waiter</h4>'],
  ['<li>زر «استدعِ النادل» موجود طول الوقت</li>', '<li>The “Call waiter” button is always on screen</li>'],
  ['<li>أبغى أطلب، الحساب، مساعدة، ماي</li>', '<li>Take my order, the bill, help, water</li>'],
  ['>ويوصلك على شاشة وحدة</h3>', '>And it all reaches one screen</h3>'],
  ['>الطلب والنداء برقم الطاولة ومع صوت، على جوالك أو تابلتك.</p>', '>Orders and calls arrive with the table number and a sound, on your phone or tablet.</p>'],
  ['<p class="r-ops-sm">ولا شي يتحضّر قبل ما موظفك يضغط «استلمت».</p>', '<p class="r-ops-sm">Nothing gets made until your staff taps “Received”.</p>\n<p class="r-ops-sm r-ops-lang">Demo screens are in Arabic.</p>'],
  ['<span>جرّبها كأنك زبون</span>', '<span>Try it as a guest</span>'],
  ['<span>شوف شاشة المطعم</span>', '<span>See the staff screen</span>'],
  ['>كم طاولة عندك؟</p>', '>How many tables?</p>'],
  ['aria-label="عدد الطاولات"', 'aria-label="Number of tables"'],
  ['data-value="s">لين 15</button>', 'data-value="s">Up to 15</button>'],
  ['id="ops-order-h">الطلب من الطاولة</h3>', 'id="ops-order-h">Table Ordering</h3>'],
  ['id="ops-pro-h">برو</h3>', 'id="ops-pro-h">Pro</h3>'],
  ['لكل فرع، لين 15 طاولة', 'Per branch, up to 15 tables'],
  ['لكل فرع، من 16 إلى 30 طاولة', 'Per branch, 16 to 30 tables'],
  ['لكل فرع، من 31 إلى 60 طاولة', 'Per branch, 31 to 60 tables'],
  ['data-swap>السعر قريباً</span>', 'data-swap>Pricing coming soon</span>'],
  ['data-ops-unit hidden>ريال بالشهر</span>', 'data-ops-unit hidden>SAR / month</span>'],
  ['<li class="r-ops-all">كل اللي في حزمة المحل الكامل</li><li>الطلب من الجوال ومتابعة حالته</li><li>استدعاء النادل</li><li>شاشة الطلبات والنداءات</li><li>زر «خلص» يخفي الصنف من المنيو</li><li>تحديث المنيو مرتين بالشهر</li>',
    '<li class="r-ops-all">Everything in the Venue Package</li><li>Phone ordering with live status</li><li>Waiter calls</li><li>One screen for orders and calls</li><li>“Sold out” hides an item instantly</li><li>Menu updates twice a month</li>'],
  ['<li class="r-ops-all">كل اللي في الطلب من الطاولة</li><li>لوحة المدير والتقارير</li><li>أكثر من شاشة</li><li>لوحة وحدة لكل فروعك</li><li>تحديث المنيو 4 مرات بالشهر</li>',
    '<li class="r-ops-all">Everything in Table Ordering</li><li>Manager dashboard and reports</li><li>Multiple screens</li><li>One dashboard for all your branches</li><li>Menu updates 4 times a month</li>'],
  ['>أكثر من 60 طاولة؟ كلّمنا.</p>', '>More than 60 tables? Talk to us.</p>'],
  ['hidden>التأسيس <span data-ops="setup"></span>&nbsp;ريال ويشمل 15 طاولة، و<span data-ops="perTable"></span>&nbsp;ريال لكل طاولة زيادة.</p>',
    'hidden>One-time setup: SAR&nbsp;<span data-ops="setup"></span>, covers 15 tables, plus SAR&nbsp;<span data-ops="perTable"></span> for each extra table.</p>'],
  ['<li>جرّبها أسبوعين ببلاش</li><li>بدون عمولة على الطلبات</li><li>كاشيرك يبقى زي ما هو</li>', '<li>Free for two weeks</li><li>No commission on orders</li><li>Keep your current POS</li>'],
  ['>التجربة بستاندات مؤقتة مرقّمة، والدفع عند الكاشير أو مع النادل.</p>', '>The trial uses temporary numbered stands. Guests pay at the counter or to the waiter.</p>'],
  ['<span>اسأل على واتساب</span>', '<span>Ask on WhatsApp</span>'],
  // close
  ['جرّبها أسبوعين في محلك. علينا.', 'Two weeks in your venue. On us.'],
  ['خبّرنا عن محلك والحي، ونرتب معك التجربة.', 'Tell us about your venue and neighborhood, and we’ll set up your trial.']
];

// ---------- hosts ----------
const HOST_TITLE_AR = 'دليل ضيف ذكي لشقتك المفروشة بلمسة جوال، في جدة — لمسة تاب', HOST_TITLE_EN = 'Smart Guest Guide for Furnished Apartments in Jeddah — LamsaTap';
const HOST_DESC_AR = 'الواي فاي ووقت الخروج وبلاغ الصيانة في دليل يفتحه ضيفك بلمسة جوال أو مسح باركود. من 39.5 ريال للوحدة بالشهر، والعتاد والتركيب علينا. تجربة أسبوعين ببلاش.';
const HOST_DESC_EN = 'Wi-Fi, check-out time, and maintenance requests in a guide guests open with a tap or a QR scan. From SAR 39.50 per unit a month, hardware and installation included. Free two-week trial.';
const HOSTS = [
  [HOST_TITLE_AR, HOST_TITLE_EN],
  [HOST_DESC_AR, HOST_DESC_EN],
  ['s-head-wa" data-wa="host" hidden><span>كلّمنا على واتساب</span>', 's-head-wa" data-wa="host" hidden><span>Chat on WhatsApp</span>'],
  // hero
  ['alt="لوحة بشعار لمسة تاب على جدار جنب باب شقة"', 'alt="A LamsaTap plate on the wall beside an apartment door"'],
  ['<span>من الوصول إلى الخروج.<br><strong>التفاصيل عند ضيفك.</strong></span>', '<span>From arrival to check-out.<br><strong>Every detail in your guest’s hand.</strong></span>'],
  ['<span>ضيفك ما يحتاج</span><span>رقمك</span>', '<span>Your guests don’t need</span><span>your number</span>'],
  ['ضيفك ما يحتاج<br>رقمك.', 'Your guests don’t need<br>your number.'],
  ['الواي فاي ووقت الخروج وبلاغ الصيانة، في دليل يفتحه بلمسة جوال داخل الوحدة.', 'Wi-Fi, check-out time, and maintenance requests, in a guide they open with one tap inside the unit.'],
  ['href="#demo">افتح دليل تجريبي<svg', 'href="#demo">Open a sample guide<svg'],
  ['احسب سعر وحداتك<svg', 'Price your units<svg'],
  ['aria-label="محتويات دليل الضيف"><li>دليل الضيف</li><li>واي فاي</li><li>تسجيل الخروج</li><li>بلاغ صيانة</li>', 'aria-label="What’s in the guest guide"><li>Guest guide</li><li>Wi-Fi</li><li>Check-out</li><li>Maintenance requests</li>'],
  // section nav
  ['aria-label="أقسام صفحة المضيفين"><div class="s-wrap"><p>لمسة تاب لوحداتك</p>', 'aria-label="Host page sections"><div class="s-wrap"><p>LamsaTap for your units</p>'],
  ['>الدليل الحي</a>', '>Live guide</a>'],
  ['>الحاسبة</a>', '>Calculator</a>'],
  // demo
  ['جرّبه كأنك ضيف.', 'Try it like a guest.'],
  ['مثال وهمي لشقة، ينفتح زي ما ينفتح عند ضيفك.', 'A sample guide for a made-up apartment. It opens exactly as it will for your guests, in Arabic.'],
  ['href="../demo/rental-guide/index.html">افتح دليل تجريبي</a>', 'href="../demo/rental-guide/index.html">Open a sample guide</a>'],
  ['<figcaption>امسحه بجوالك</figcaption>', '<figcaption>Scan with your phone</figcaption>'],
  ['<figcaption><ul class="p-table-names"><li>ستاند <span class="s-nw">الواي فاي</span></li><li>ستاند الطوارئ</li><li>ستاند <span class="s-nw">دليل الضيف</span></li></ul></figcaption>',
    // physical order under the photo stays the same (guide left, emergency centre, Wi-Fi right), so LTR lists it left to right
    '<figcaption><ul class="p-table-names"><li><span class="s-nw">Guest guide</span> stand</li><li>Emergency stand</li><li><span class="s-nw">Wi-Fi</span> stand</li></ul></figcaption>'],
  // experience
  ['كل ضيف، نفس الأسئلة؟', 'Every guest, the same questions?'],
  ['ضيفك يسألك عن كلمة الواي فاي الساعة 2 الفجر؟', 'A guest asking for the Wi-Fi password at 2 AM?'],
  ['ضيفك يطلع، وما يقول لأحد؟', 'Guests leaving without telling anyone?'],
  ['ما تبغى رقمك عند كل ضيف؟', 'Rather not give your number to every guest?'],
  ['الدليل يرد عنك. حتى الساعة 2 الفجر.', 'The guide answers for you. Even at 2 AM.'],
  ['<h3 class="s-h3">قبل ما يوصل ضيفك</h3><p>نكتب الدليل من معلوماتك، ونركّب الشريحة والباركود داخل الوحدة.</p>', '<h3 class="s-h3">Before your guest arrives</h3><p>We write the guide from your details and install the NFC tag and QR code inside the unit.</p>'],
  ['<h3 class="s-h3">أثناء الإقامة</h3><p>يلقى الواي فاي بزر نسخ، والتكييف والشروط وأرقام الطوارئ. ولو صار عطل، يرسل لنا بلاغ صيانة على واتساب.</p>', '<h3 class="s-h3">During the stay</h3><p>They find the Wi-Fi with a copy button, the AC, house rules, and emergency numbers. If something breaks, they send us a maintenance request on WhatsApp.</p>'],
  ['<h3 class="s-h3">عند الخروج</h3><p>يشوف وقت الخروج وخطواته، وزر «تم الخروج» يفتح له رسالة واتساب جاهزة لنا.</p>', '<h3 class="s-h3">At check-out</h3><p>They see the check-out time and steps, and the check-out button opens a ready-to-send WhatsApp message to us.</p>'],
  // calculator
  ['كم تدفع عن وحداتك؟', 'What will your units cost?'],
  ['باقة المضيف بسعر للوحدة. نجهّز الدليل بهويتك ونركّبه داخل كل وحدة.', 'The Host Plan is priced per unit. We build the guide in your branding and install it in every unit.'],
  ['كم وحدة عندك؟', 'How many units do you have?'],
  ['aria-label="وحدة زيادة"', 'aria-label="Add a unit"'],
  ['aria-label="وحدة أقل"', 'aria-label="Remove a unit"'],
  ['id="calc-units">3</output><span>وحدات</span>', 'id="calc-units">3</output><span>units</span>'],
  ['<legend class="s-sr">طريقة الدفع</legend>', '<legend class="s-sr">Billing</legend>'],
  ['<span>شهري<small>بالتزام 6 أشهر</small></span>', '<span>Monthly<small>6-month minimum</small></span>'],
  ['<span>سنوي<small>بسعر 11 شهر</small></span>', '<span>Yearly<small>12 months for the price of 11</small></span>'],
  ['<span class="p-calc-fig" data-total>148.5</span><span class="p-calc-unit">ريال <span data-per>بالشهر</span></span>', '<span class="p-calc-fig" data-total>148.50</span><span class="p-calc-unit">SAR <span data-per>/ month</span></span>'],
  ['<p class="p-calc-rate"><span data-rate>49.5</span> ريال للوحدة <span data-per-unit>بالشهر</span>. <span data-tier-note>من 5 وحدات يصير سعر الوحدة 39.5 على كل وحداتك.</span></p>',
    '<p class="p-calc-rate">SAR <span data-rate>49.50</span> per unit, <span data-per-unit>per month</span>. <span data-tier-note>At 5 units or more, every unit drops to SAR 39.50.</span></p>'],
  ['<caption class="s-sr">سعر الوحدة حسب عدد الوحدات</caption>', '<caption class="s-sr">Price per unit by number of units</caption>'],
  ['<th scope="col">الوحدات</th><th scope="col">شهري للوحدة</th><th scope="col">سنوي للوحدة</th>', '<th scope="col">Units</th><th scope="col">Monthly, per unit</th><th scope="col">Yearly, per unit</th>'],
  ['<th scope="row">1 إلى 4</th><td><span class="s-num">49.5</span> ريال</td><td><span class="s-num">544.5</span> ريال</td>', '<th scope="row">1–4</th><td>SAR <span class="s-num">49.50</span></td><td>SAR <span class="s-num">544.50</span></td>'],
  ['<th scope="row">5 أو أكثر</th><td><span class="s-num">39.5</span> ريال</td><td><span class="s-num">434.5</span> ريال</td>', '<th scope="row">5 or more</th><td>SAR <span class="s-num">39.50</span></td><td>SAR <span class="s-num">434.50</span></td>'],
  ['الشهري بالتزام 6 أشهر، والسنوي بسعر 11 شهر. سعر 5 وحدات أو أكثر على كل وحداتك. للمضيف المرخّص من وزارة السياحة.', 'Monthly billing has a 6-month minimum. Yearly is 12 months for the price of 11. The 5+ rate applies to all your units. For hosts licensed by the Ministry of Tourism.'],
  ['<h3 class="s-h3">كل وحدة فيها</h3>', '<h3 class="s-h3">Every unit includes</h3>'],
  ['<span>دليل الضيف: الواي فاي، والتكييف، والشروط، والعنوان</span>', '<span>Guest guide: Wi-Fi, AC, house rules, and address</span>'],
  ['<span>«تم الخروج» و«بلاغ صيانة» برسالة واتساب لنا</span>', '<span>Check-out and maintenance buttons that message us on WhatsApp</span>'],
  ['<span>رابط تقييم في الدليل</span>', '<span>A review link in the guide</span>'],
  ['<span>رقمك ما يظهر للضيف</span>', '<span>Your number stays hidden from guests</span>'],
  ['<span>شريحة الوحدة وملصق الباركود، باسمك أو شعارك</span>', '<span>The unit’s NFC tag and QR sticker, with your name or logo</span>'],
  // cleaning (GM-067)
  ['id="clean-h">نظافة بعد الخروج</h3><span class="s-badge">إضافة اختيارية</span>', 'id="clean-h">Post-checkout cleaning</h3><span class="s-badge">Optional add-on</span>'],
  ['ضيفك طلع؟ لا تشيل هم التنظيف.', 'Guest checked out? Leave the cleaning to us.'],
  ['حالياً في جدة، لمشتركي باقة المضيف.', 'Currently in Jeddah, for Host Plan subscribers.'],
  ['aria-label="إطار «تأكيد الخروج» على باب الوحدة"', 'aria-label="A “Confirm check-out” frame on the unit door"'],
  ['<figcaption class="p-sign-cap">على باب الوحدة من الداخل، بشعارك.</figcaption>', '<figcaption class="p-sign-cap">Inside the unit door, with your logo.</figcaption>'],
  ['<span class="p-clean-t">الضيف وهو طالع يلمس الإطار أو يمسح الباركود</span>', '<span class="p-clean-t">On the way out, the guest taps the frame or scans the code</span>'],
  ['<span class="p-clean-t">توصلنا رسالة إن الوحدة فضت</span>', '<span class="p-clean-t">We get a message that the unit is empty</span>'],
  ['<span class="p-clean-t">نباشر النظافة</span>', '<span class="p-clean-t">We start the cleaning</span>'],
  ['<span class="p-clean-t">توصلك صور الوحدة جاهزة</span>', '<span class="p-clean-t">You get photos of the unit, ready for the next guest</span>'],
  ['id="clean-studio-h">استوديو، أو غرفة وصالة</h4>\n<p class="p-clean-sub">للوحدات الصغيرة.</p>', 'id="clean-studio-h">Studio or one-bedroom</h4>\n<p class="p-clean-sub">For smaller units.</p>'],
  ['id="clean-big-h">غرفتين أو ثلاث غرف</h4>\n<p class="p-clean-sub">للشقق العائلية.</p>', 'id="clean-big-h">Two or three bedrooms</h4>\n<p class="p-clean-sub">For family apartments.</p>'],
  ['class="p-clean-soon">السعر قريباً</span>', 'class="p-clean-soon">Price coming soon</span>'],
  ['<span>اسأل عن النظافة على واتساب</span>', '<span>Ask on WhatsApp</span>'],
  // smart stay (GM-068 proposal)
  ['id="stay-h">الإقامة الذكية</h3><span class="s-badge">جديد</span>', 'id="stay-h">Smart Stay</h3><span class="s-badge">New</span>'],
  ['ضيفك يدخل بلمسة، وأنت تدري.', 'Guests let themselves in with a tap. And you know when they do.'],
  ['قفل ذكي نركّبه بعد ما نشوف بابك. حالياً في جدة. <a class="s-tg-link" href="../demo/door/">شوف مثال «افتح الباب»</a>', 'A smart lock we install after we check your door. Currently in Jeddah. <a class="s-tg-link" href="../demo/door/">See the door-unlock sample</a>'],
  ['جرّبها أسبوعين ببلاش: الدليل واللوحة وتنبيه الخروج. والقفل نركّبه بعد ما تشترك.', 'Try it free for two weeks: the guide, the NFC door plate, and the check-out alert. The lock is installed once you subscribe.'],
  ['id="stay-entry-h">دخول ذكي</h4>\n<p class="p-clean-sub">الباب يفتح من جوال الضيف.</p>', 'id="stay-entry-h">Smart Entry</h4>\n<p class="p-clean-sub">The door opens from your guest’s phone.</p>'],
  ['<span>ضيفك يفتح الباب من جواله: يلمس الشريحة أو يمسح الباركود</span>', '<span>Guests open the door from their phone: tap the tag or scan the code</span>'],
  ['<span>الباب يفتح بس وقت حجزه</span>', '<span>The door opens only during their booking</span>'],
  ['<span>يوصلك تنبيه لما ضيفك يفتح من جواله</span>', '<span>You get an alert when your guest opens it from their phone</span>'],
  ['<span>رمز احتياطي للباب، ومفتاح احتياطي يبقى عندك</span>', '<span>A backup door code, plus a spare key that stays with you</span>'],
  ['<span>اسأل على واتساب</span>', '<span>Ask on WhatsApp</span>'],
  ['id="stay-start-h">ابدأ من الصفر</h4>\n<p class="p-clean-sub">عندك شقة جديدة وتبغى تبدأ إيجار قصير؟ نجهزها وننزّلها لك.</p>', 'id="stay-start-h">Start from Scratch</h4>\n<p class="p-clean-sub">New apartment and want to start short-term renting? We set it up and list it for you.</p>'],
  ['<span>كل اللي في «دخول ذكي»</span>', '<span>Everything in Smart Entry</span>'],
  ['<span>نركّب القفل الذكي والدليل والملصقات</span>', '<span>We install the smart lock, the guest guide and the signs</span>'],
  ['<span>تصوير احترافي لشقتك بأسلوب Airbnb</span>', '<span>Professional Airbnb-style photos of your place</span>'],
  ['<span>نسوّق إعلانك عشان يوصل لضيوف أكثر</span>', '<span>We market your listing to reach more guests</span>'],
  ['<span>ننزّل إعلانها في Airbnb وجاذر إن</span>', '<span>We list it on Airbnb and Gathern</span>'],
  ['<span>بدون دفع مقدم في التجربة</span>', '<span>Nothing upfront during the trial</span>'],
  ['<a href="#start">ابدأ من الصفر</a>', '<a href="#start">Start from scratch</a>'],
  ['id="stay-full-h">دخول + تقويم الحجوزات</h4>\n<p class="p-clean-sub">الدخول الذكي، وتقويم حجوزاتك في مكان واحد.</p>', 'id="stay-full-h">Smart Entry + Calendar</h4>\n<p class="p-clean-sub">Smart Entry and your booking calendar, in one place.</p>'],
  ['<span>تقويم حجوزات تديره بنفسك</span>', '<span>A booking calendar you manage yourself</span>'],
  ['<span>الباب يفتح حسب الحجز اللي تدخله</span>', '<span>The door opens based on the bookings you enter</span>'],
  ['<span>النظافة تنضاف بطلبك</span>', '<span>Cleaning added on request</span>'],
  ['الدفع والتواصل مع ضيفك يبقون عندك.', 'Payments and guest communication stay with you.'],   // 2026-10-02: انشال «الأسعار تطلع هنا بعد اعتمادها» بعد ما انحطت الأسعار (GM-073)
  // what we don't do
  ['ما نطلّع رقمك ولا رقم العاملة للضيف.', 'We never show your number, or your housekeeper’s, to guests.'],
  ['ما نشارك رقم ضيفك مع أحد.', 'We don’t share your guest’s number with anyone.'],
  ['ما نسحب ضيفك للحجز أو الدفع برا المنصة.', 'We never pull your guests into booking or paying off-platform.'],
  // faq
  ['<summary>هل ضيفي يحتاج تطبيق؟</summary>', '<summary>Do my guests need an app?</summary>'],
  ['<summary>أقدر أغيّر كلمة الواي فاي أو الشروط بعدين؟</summary>', '<summary>Can I change the Wi-Fi password or house rules later?</summary>'],
  ['إيه. ترسل لنا التعديل على واتساب، ونغيّره من عندنا بدون ما نرجع للوحدة. والشريحة نفسها ما تتغير.', 'Yes. Send us the change on WhatsApp, and we update it remotely, with no visit to the unit. The tag itself never changes.'],
  ['<summary>هل رقمي أو رقم العاملة يطلع للضيف؟</summary>', '<summary>Will guests see my number, or my housekeeper’s?</summary>'],
  ['لا، أبداً. رسايل «تم الخروج» و«بلاغ صيانة» توصلنا إحنا من جوال الضيف. ورقمك ما يطلع في الصفحة ولا في الرسالة.', 'Never. Check-out and maintenance messages come to us, from the guest’s phone. Your number isn’t on the page or in the message.'],
  ['ما يتجدد إلا بتأكيد صريح منك. ونذكّرك قبل التجديد بـ 7 أيام للشهري، و30 يوم للسنوي.', 'It renews only with your explicit confirmation. We remind you 7 days before renewal on monthly billing, and 30 days before on yearly.'],
  ['نجهّز الدليل ونركّب العتاد في وحدة وحدة، وتجرّبها أسبوعين ببلاش. بدون دفع مقدم ولا التزام فيها، ولو ما كمّلت نشيل العتاد.',
    'We set up the guide and install the hardware in one unit, and you try it free for two weeks. No upfront payment and no commitment during the trial. If you don’t continue, we pick up the hardware.'],
  // close
  ['وحدة وحدة، أسبوعين ببلاش.', 'One unit. Two weeks. On us.'],
  ['خبّرنا كم وحدة عندك والحي، ونرتب معك التجربة.', 'Tell us how many units you have and where, and we’ll set up your trial.']
];

const PAGES = [
  { src: 'ar/index.html', out: 'index.html', ar: 'ar/index.html', canon: '/', T: HOME },
  { src: 'ar/restaurants/index.html', out: 'restaurants/index.html', ar: '../ar/restaurants/index.html', canon: '/restaurants/', T: REST },
  { src: 'ar/hosts/index.html', out: 'hosts/index.html', ar: '../ar/hosts/index.html', canon: '/hosts/', T: HOSTS }
];

function shallow(html) {   // inverse of move-ar.cjs deepen(): shared files lose one ../
  return html.replace(/(\s(?:src|href|srcset|data-tl-src)=")([^"]*)"/g, (m, a, v) =>
    a + v.replace(/(^|[\s,])\.\.\/((?:\.\.\/)*)(?=(?:assets|vendor|demo|templates)\/|config\.js|favicon\.ico)/g, '$1$2') + '"');
}
function must(s, re, rep, what) {
  if (!re.test(s)) throw new Error('No match: ' + what);
  return s.replace(re, rep);
}

const report = [];
for (const P of PAGES) {
  let h = fs.readFileSync(path.join(W, P.src), 'utf8');
  h = h.replace(/<!--[\s\S]*?-->/g, '');                      // comments (and @@ markers) out
  h = shallow(h);
  h = h.replace(/https:\/\/lamsatap\.com\/ar\//g, DOMAIN + '/');   // every /ar/ URL (JSON-LD, hreflang) back to English first
  h = h.replace(/\n{3,}/g, '\n\n');
  // <html>, head meta
  h = must(h, /<html lang="ar" dir="rtl" data-canonical="[^"]*"/, '<html lang="en" dir="ltr" data-canonical="' + P.canon + '"', 'html tag');
  h = must(h, /\n<link rel="canonical"[^>]*>\n<link rel="alternate" hreflang="ar"[^>]*>\n<link rel="alternate" hreflang="en"[^>]*>\n<link rel="alternate" hreflang="x-default"[^>]*>/,
    '\n<link rel="canonical" href="' + DOMAIN + P.canon + '">\n<link rel="alternate" hreflang="en" href="' + DOMAIN + P.canon + '">\n<link rel="alternate" hreflang="ar" href="' + DOMAIN + '/ar' + P.canon + '">\n<link rel="alternate" hreflang="x-default" href="' + DOMAIN + P.canon + '">', 'hreflang block');
  h = must(h, /<meta property="og:locale" content="ar_SA">\n<meta property="og:locale:alternate" content="en_US">/, '<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="ar_SA">', 'og:locale');
  // Latin is the critical font here (Readex still loads for the few Arabic glyphs)
  h = must(h, /<link rel="preload" href="((?:\.\.\/)*)assets\/brand\/fonts\/readex-pro-arabic-latin\.woff"/, '<link rel="preload" href="$1assets/brand/fonts/figtree-latin.woff"', 'font preload');
  const rel = P.out.includes('/') ? '../' : '';
  const V = (h.match(/assets\/site\.css\?v=([\w.-]+)"/) || [])[1] || 'gm070-1';   // ltr.css follows the page's asset version
  h = must(h, /<\/head>/, '<link rel="stylesheet" href="' + rel + 'assets/ltr.css?v=' + V + '">\n</head>', 'head end');
  // switch: «عربي» to the Arabic twin
  h = must(h, GLOBE_RE, '<a class="lt-btn lt-btn--secondary lt-btn--compact s-lang" href="' + P.ar + '" hreflang="ar" lang="ar">$1<span>عربي</span></a>', 'language switch');
  // arrows point the reading way
  h = h.split('M19 12H5m6-6-6 6 6 6').join('M5 12h14m-6-6 6 6-6 6');
  // guest-facing mockups: Arabic, marked as such, never translated
  const keep = [];
  const hold = (s) => '\u0000' + (keep.push(s) - 1) + '\u0000';
  h = h.replace(/<div class="r-demo-phone" data-product-reveal aria-hidden="true">/, '<div class="r-demo-phone" data-product-reveal aria-hidden="true" lang="ar" dir="rtl">');
  h = h.replace(/<figure class="lt-stand-stage" aria-hidden="true" inert>/g, '<figure class="lt-stand-stage" aria-hidden="true" inert lang="ar" dir="rtl">');
  h = h.replace(/<div class="p-sign-frame" aria-hidden="true">/, '<div class="p-sign-frame" aria-hidden="true" lang="ar" dir="rtl">');
  h = h.replace(/<div class="p-demo-phone" data-scan="phone">/, '<p class="s-sr">Preview of a sample guest guide in Arabic: Wi-Fi details, check-out time, a check-out button, and a maintenance request button.</p>\n<div class="p-demo-phone" data-scan="phone" aria-hidden="true" lang="ar" dir="rtl">');
  h = h.replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, hold);
  h = h.replace(/<figure class="lt-stand-stage"[\s\S]*?<\/figure>/g, hold);
  h = h.replace(/<div class="p-sign-paper">[\s\S]*?<\/div>\s*<\/div>/g, hold);   // paper + its row
  h = h.replace(/<a class="lt-btn lt-btn--secondary lt-btn--compact s-lang"[\s\S]*?<\/a>/, hold);
  // copy, longest Arabic first
  const pairs = SHARED.concat(P.T).sort((a, b) => b[0].length - a[0].length);
  for (const [a, e] of pairs) {
    if (!h.includes(a)) {
      if (SHARED.some((p) => p[0] === a)) continue;             // shared line not used on this page
      throw new Error(P.out + ': pair not found: ' + a);
    }
    h = h.split(a).join(e);
  }
  // what is left in Arabic outside the mockups is a bug
  const left = [];
  for (const m of h.matchAll(/>([^<\u0000]*[؀-ۿ][^<\u0000]*)</g)) left.push(m[1].trim());
  for (const m of h.matchAll(/\s([\w:-]+)="([^"]*[؀-ۿ][^"]*)"/g)) left.push('@' + m[1] + '=' + m[2]);
  if (left.length) throw new Error(P.out + ': Arabic left:\n  ' + left.join('\n  '));
  // times never break inside («9 AM–11 PM»)
  h = h.split('9 AM–11 PM').join('9&nbsp;AM&#8288;–&#8288;11&nbsp;PM');   // web-qa: &nbsp; alone still broke after the en dash; U+2060 word joiners hold it (no <span>: .trust__sub is flex)
  // the unit stepper reads minus, count, plus in English (hosts-smart.js finds the buttons by data-step)
  h = h.replace(/(<button type="button" class="p-calc-step" data-step="1"[\s\S]*?<\/button>)\n(<p class="p-calc-n">[\s\S]*?<\/p>)\n(<button type="button" class="p-calc-step" data-step="-1"[\s\S]*?<\/button>)/, '$3\n$2\n$1');
  h = h.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
  h = h.replace(/(<!doctype html>\n)/i, '$1<!-- Generated from ' + P.src + ' by tools/build-en.cjs (GM-070). Edit the Arabic page or the copy table in the tool, then rebuild. -->\n');
  fs.mkdirSync(path.dirname(path.join(W, P.out)), { recursive: true });
  fs.writeFileSync(path.join(W, P.out), h);
  report.push(P.out + ' <- ' + P.src + ' (' + Buffer.byteLength(h) + ' bytes)');
}
console.log(report.join('\n'));
