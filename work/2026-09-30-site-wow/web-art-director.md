# موجز فني — ترقية الموقع «site-wow» (المدير الفني، 2026-09-30)
قرار واحد. المرجع: Stripe (وضوح + حركة لها معنى) و Apple (مسافات، طباعة، منتج في المركز). عملي أولاً (GM-011)، فاتح دايماً (GM-038)، الألوان والخطوط والمسافات من tokens.css فقط.

## 0. النقد (قياس فعلي، Playwright، منفذ 8801)
- الرئيسية 1440: h1 72px ممتاز، لكن h2 44 ثم الأقسام بعدها بدون قفزة ثانية؛ أول ~780px فراغ رملي في اللقطة الكاملة (مسرح data-lift-stage يعتمد على السكرول، وبدون JS/لقطة يبان فاضي) = خطر ثقة. 3 أقسام بس بعد البطل: الصفحة قصيرة (3857px) وما فيها أي شي «يجرّب».
- الرئيسية 390: h1 38px (نبي 44). الهيدر الثابت يغطي قسم «كيف نشتغل» وقت السكرول.
- المطاعم/المضيفين 1440: h1 64 و h2 32 فقط: فرق 2x ضعيف، الأقسام متساوية الوزن فالعين ما تعرف وين تقف. 390: الصفحة 7659–8486px، كثافة عالية، شريط الضمانات مكرر نصياً بدل مكوّن واحد.
- ما فيه أخطاء كونسول، ولا سكرول أفقي (scrollWidth = العرض).
التقييم الحالي: فخامة 7، ثقة 7، وضوح 8، إتقان 7.5 → يرجع للفريق بهالموجز.

## a) التفاعل التوقيعي: «مختبر اللمسة» Tap Lab (الرئيسية، بعد البطل مباشرة، id="tap-lab")
الفكرة: تختار سيناريو، والجوال ينزلق فوق ستاند NFC، تطلع موجة لمس، وتنفتح في شاشة الجوال صفحة الديمو الحقيقية الموجودة (iframe كسول). مفيد: صاحب المحل يشوف بالضبط وش يشوف زبونه.

### العقد (HTML حرفي — يُلصق كما هو)
```html
<section class="tl" id="tap-lab" data-tl aria-labelledby="tl-title">
  <div class="tl__head">
    <p class="tl__eyebrow">جرّبها الحين</p>
    <h2 class="tl__title" id="tl-title">اختر وش يشوف زبونك، وقرّب الجوال.</h2>
  </div>
  <div class="tl__body">
    <div class="tl__picker" role="tablist" aria-label="اختر التجربة" data-tl-picker>
      <button class="tl__opt" role="tab" id="tl-tab-menu"   aria-selected="true"  aria-controls="tl-stage" data-tl-opt="menu"   data-tl-src="/demo/menu/">المنيو</button>
      <button class="tl__opt" role="tab" id="tl-tab-review" aria-selected="false" aria-controls="tl-stage" data-tl-opt="review" data-tl-src="/demo/review/" tabindex="-1">تقييم قوقل</button>
      <button class="tl__opt" role="tab" id="tl-tab-wifi"   aria-selected="false" aria-controls="tl-stage" data-tl-opt="wifi"   data-tl-src="/demo/wifi/"   tabindex="-1">الواي فاي</button>
      <button class="tl__opt" role="tab" id="tl-tab-guide"  aria-selected="false" aria-controls="tl-stage" data-tl-opt="guide"  data-tl-src="/demo/rental-guide/" tabindex="-1">دليل الضيف</button>
    </div>
    <div class="tl__stage" id="tl-stage" role="tabpanel" aria-live="polite" data-tl-stage data-state="idle">
      <div class="tl__stand" aria-hidden="true" data-tl-stand><!-- SVG ستاند يدوي: لوح حبر + رمز الشعار من brand/ --></div>
      <span class="tl__ripple" aria-hidden="true" data-tl-ripple></span>
      <div class="tl__phone" data-tl-phone>
        <div class="tl__screen">
          <iframe class="tl__frame" data-tl-frame title="معاينة التجربة" loading="lazy" tabindex="-1" src="about:blank"></iframe>
          <img class="tl__poster" data-tl-poster src="/assets/images/restaurant-hand-phone-color-800.webp" alt="" width="800" height="1000">
        </div>
      </div>
      <p class="tl__caption" data-tl-caption>زبونك يقرّب جواله من الستاند، وتنفتح المنيو فوراً. بدون تطبيق.</p>
    </div>
  </div>
  <a class="tl__open" data-tl-open href="/demo/menu/" target="_blank" rel="noopener">افتح التجربة كاملة</a>
  <noscript><style>.tl__opt{pointer-events:none}</style></noscript>
</section>
```
- signature.js يقرأ النص الفرعي لكل سيناريو من خريطة داخلية (menu/review/wifi/guide) بنصوص منسوخة من الصفحات الحالية؛ الواي فاي يذكر: «أندرويد يتصل باللمسة، والآيفون يفتح صفحة فيها كلمة المرور».
- الملفات: website/assets/signature.css + signature.js (IIFE، بدون مكتبات، GSAP اختياري إذا window.gsap موجود وإلا Web Animations API).

### الحالات (data-state على [data-tl-stage])
idle → approach → tap → open. تبديل السيناريو: open → approach (يرجع الجوال 24px) → tap → open.
### التوقيت (transform/opacity فقط)
- approach: الجوال translateY(24px)→0 و rotate(-4deg)→0، 520ms، cubic-bezier(.2,.9,.25,1.15) (نابض).
- tap: الموجة scale(.2)→1.6 و opacity .5→0، 640ms ease-out، لون الحلقة var(--lt-teal) (المكان الوحيد للتيل كتعبئة حركة)، مرتين بفاصل 120ms.
- open: الـ poster opacity 1→0 بعد تحميل iframe (onload)، 240ms. حد أقصى للانتظار 1500ms ثم يبقى poster مع زر «افتح التجربة كاملة».
- تشغيل أول مرة عند دخول القسم 40% من الشاشة (IntersectionObserver) مرة وحدة. لا تشغيل تلقائي متكرر.
- لوحة المفاتيح: أسهم يمين/يسار تنقل بين tabs (RTL: السهم الأيسر = التالي)، Home/End. focus-visible: حلقة 2px var(--lt-teal-deep) offset 3px.
### reduced-motion
لا انزلاق ولا موجة؛ التبديل = crossfade 120ms للـ poster/iframe فقط.
### بدون JS
الـ poster ظاهر، الأزرار نصوص ثابتة، ورابط [data-tl-open] يفتح المنيو. iframe يبقى about:blank (ما ينزل أي شي).
### التخطيط
- ≥1024: عمودين (12 عمود): picker + head في 5 أعمدة يمين، stage في 7. الجوال 300×620، الستاند تحته متداخل 48px.
- 768–1023: نفس العمودين 6/6، الجوال 260 عرض.
- <768: head ثم picker كشريط أفقي 4 أزرار بعرض متساوي (grid 2×2 تحت 360px)، ارتفاع 48px كل زر، ثم stage بعرض 100% والجوال 240×500 وسط. بدون سكرول أفقي.
- الأزرار: خلفية --lt-surface، حد --lt-hairline --lt-sand-200، radius --lt-radius-m؛ المختار: خلفية --lt-ink ونص أبيض. hover: translateY(-1px) + --lt-elev-raised. active: scale(.98).
- الوزن: iframe ما يتحمل إلا بعد أول تفاعل أو دخول القسم؛ poster صورة 800 موجودة. لا ملفات جديدة كبيرة؛ signature.js ≤ 8KB غير مضغوط.

## b) الحركات الجريئة
- سلم الطباعة (الشركة): h1 جوال 44 / تابلت 56 / كمبيوتر 80 (الرئيسية) و 64 (الجمهور). h2 جوال 30 / كمبيوتر 48. eyebrow 14. نص 17/19، line-height 1.7، letter-spacing 0 للعربي دائماً، وزن العناوين var(--lt-weight-heading).
- الأرقام الكبيرة (السعر 1,211، 49.5، الخطوات 01–03): 64px كمبيوتر/44 جوال، var(--lt-weight-figure)، tabular-nums، ووحدتها var(--lt-weight-unit) 18px.
- الإيقاع: كل قسم padding بـ var(--lt-section). تبادل الأسطح: --lt-bg (رملي) ← --lt-surface (أبيض، .s-band--white) ← رملي. ممنوع قسمين أبيض متتاليين.
- العمق: البطاقات --lt-elev-raised، والجوال في Tap Lab والبطل --lt-elev-float فوق raised. لا ظلال مخترعة.
- قاعدة اللون الواحدة: الحبر للأفعال كلها. التيل فقط: حلقة التركيز (teal-deep)، موجة اللمس، ونقطة الحالة «نرد خلال ساعة». الزعفران ممنوع. data-audience يبقى كما هو.
- الصور: أبيض وأسود (-bw) في أقسام الشرح، والملونة فقط في البطل وحالة hover/in-view الموجودة (data-tint) — لا تغيير لهالنظام.

## c) نظام الثقة (ضمانات معتمدة فقط)
مكوّن واحد `.trust` (قائمة ul بأربعة عناصر، أيقونة SVG خط 1.5px حبر + جملة ≤ 6 كلمات):
1. «جرّبها أسبوعين مجاناً» 2. «بدون دفع مقدم» 3. «العتاد والتركيب علينا طول الاشتراك» 4. «نركّب في جدة» + سطر «نرد خلال ساعة، 9 الصبح لين 11 الليل، كل يوم».
- الأماكن: الرئيسية تحت البطل (يستبدل الشريط الحالي النصي بنفس المحتوى + البنود المعتمدة)، والمطاعم/المضيفين: تحت البطل وملاصق لبطاقة السعر في #plan. 4 أعمدة ≥1024، 2×2 جوال.
- «كيف نركّب في جدة» (#how في الرئيسية، و #experience عند الحاجة): 3 خطوات ثابتة الموجودة (نتفاهم على واتساب ← نجهز كل شي بهويتك ← نركّب عندك ونجرّب كل شريحة). الرقم كبير حسب §b.
- ممنوع: آراء عملاء، أعداد، تقييمات، شعارات عملاء. أي جملة ضمان غير موجودة في pricing.md/السكيل تُحذف.
- قنوات التواصل من config.js فقط (data-wa، data-tg…).

## d) المهام لكل ملف
**الرئيسية — index.html + assets/home.css**
1. البطل: h1 80/44؛ أصلح فراغ أول الشاشة: محتوى [data-lift-stage] يكون مرئياً افتراضياً (CSS)، والحركة إضافة فوقه فقط.
2. ركّب `.trust` تحت البطل بدل شريط الأربع نقاط.
3. ركّب Tap Lab (العقد حرفياً) بين الـ trust و #solutions، وأضف signature.css/js (defer).
4. #solutions: h2 48، البطاقتين raised، hover رفعة 2px.
5. #how: الأرقام 64، وتأكد الهيدر الثابت ما يغطي (scroll-margin-top = ارتفاع الهيدر + 16).
6. #contact: يبقى، مع سطر الرد خلال ساعة ونقطة تيل.
**المطاعم — restaurants/index.html + assets/restaurants.css**
1. h1 64/44، h2 48/30. 2. `.trust` تحت البطل وبجانب #plan. 3. #plan: السعر 1,211 ريال/سنة و التجديد 798 بالسلم الرقمي، بطاقة float. 4. #demo: رابط «جرّبها في الرئيسية» يودي /#tap-lab؛ لا تكرار للمكوّن. 5. قلّل الطول بالجوال: FAQ مطوية (details) كما هي، واحذف تكرار نص الضمانات.
**المضيفين — hosts/index.html + assets/hosts.css**
نفس بنود المطاعم؛ السعر 49.5 للوحدة (1–4) و39.5 (5+)، وسنوياً 544.5/434.5. أصلح عنصر main p الأول (يقيس 92px في الكمبيوتر و40 بالجوال: رمز داخل p بدل عنصر زخرفي؛ حوّله span aria-hidden).
**المكوّن — assets/signature.css + signature.js**
حسب §a بالحرف: الحالات، التوقيت، tabs ARIA، reduced-motion، no-JS، الأحجام. لا طلبات خارجية. بدون أخطاء كونسول لو القسم مو موجود في الصفحة (يخرج بصمت).
**النظام — assets/motion.css + motion.js + site.css**
1. site.css: متغيرات السلم (--h1، --h2، --fig) في مكان واحد وبـ clamp بين الأرقام أعلاه. 2. الأزرار والروابط: hover/focus-visible/active موحدة، هدف ≥ 48px (--lt-tap-min). 3. motion.css: حذف أي transition: all؛ منحنى موحد --ease-spring: cubic-bezier(.2,.9,.25,1.15)، والخروج ease-out 200ms. 4. motion.js: كل reveal يبدأ من المحتوى الظاهر (class على html يُضاف قبل الإخفاء)، وفشل GSAP = المحتوى ظاهر. لا تكسر أي data-* حالي. 5. `node tools/build-dist.cjs` لازم يمر بدون رفع الميزانيات.

## القبول (أقيّم بعدها)
لقطات 390/1440 بعد السكرول، h1/h2 بالأرقام أعلاه، صفر أخطاء كونسول، صفر سكرول أفقي عند 320–1440، reduced-motion مفحوص، Tap Lab يبدّل الأربع صفحات بلوحة المفاتيح. أقل من 9 في (فخامة، ثقة، وضوح، إتقان) = يرجع.
