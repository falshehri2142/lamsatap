// دليل الوحدة: المنطق كله هنا. يستخدمه القالب (templates/rental-guide/) ونسخة العرض (demo/rental-guide/)، والرئيسية للشاشة المصغرة.
// المواصفة: موجز المدير الفني §5.7 (دليل الوحدة) فوق web-ux ر3-2 و ر4-3. الإشعار حرفياً من legal/register.md بند 21.
// ممنوع في الصفحة (GM-003، systems/architecture.md §8): رقم المضيف أو العاملة، رمز الباب أو مكان المفتاح،
// رابط حجز أو دفع، أي حقل يجمع بيانات الضيف، وأي وقت في رسائل الواتساب.
// العرض (demo:true، ر4-1): أي زر يطلع برا الصفحة (واتساب، اتصال، خرائط) يكتب سطر حالة بدل ما يفتح، إلا زر البيع حقنا.
(function (w) {
  var R = w.LT_RENDER = w.LT_RENDER || {};

  R.guide = function (D, o) {
    D = D || {}; o = o || {};
    var S = w.SITE || {}, p = o.p || '', mini = !!o.mini, demo = D.demo === true;
    var num = waNum(S.whatsapp), ref = str(D.unitRef), unit = str(D.unit), co = esc(companyName());
    var brand = cBrand(D.brand, unit);
    var hasRef = function (k) { return waText(k).indexOf('{unitRef}') > -1; };
    // دليل عميل: القسم يطلع بس مع رقم الشركة ومرجع وحدة 12 حرف أو أكثر، والرسائل فيها {unitRef} (ر3-2 «حماية»)
    var live = !demo && !!num && ref.length >= 12 && hasRef('checkout') && hasRef('maintenance');
    var still = demo || mini;   // العرض والشاشة المصغرة: ما يفتح شي برّا الصفحة
    var list = function (a) { return (Array.isArray(a) ? a : []).map(str).filter(Boolean); };
    var id = function (x) { return p + x; };
    // زر أو صف يفتح واتساب: رابط في دليل العميل، وزر بدون رابط في العرض
    var waBtn = function (x, cls, label, key) {
      return still ? '<button class="' + cls + '" type="button" id="' + id(x) + '">' + cIcon('chat', 'lt-btn-icon') + '<span>' + label + '</span></button>'
        : '<a class="' + cls + '" id="' + id(x) + '" href="' + esc(waHref(num, waText(key, ref))) + '">' + cIcon('chat', 'lt-btn-icon') + '<span>' + label + '</span></a>';
    };
    var h = [];

    // الشعار 40px دايماً: بعده ترحيب h1 على طول، وشعارين كبار ورا بعض يتكررون (التقييم 1 بند 10، في العرض والقالب)
    h.push(cIdentity(brand, true));
    h.push('<h1>' + (unit ? 'أهلاً في ' + esc(unit) : 'أهلاً وسهلاً') + '</h1>');

    // 1) الواي فاي: أول شي بدون أي ضغطة
    h.push(cWifi(D.wifi, false, p));

    // 2) الخروج والصيانة، والتواصل مع الشركة المشغّلة. رقم المضيف أو العاملة ما يطلع أبداً
    if (demo || live) {
      var time = str(D.checkoutTime), steps = list(D.beforeLeaving).slice(0, 3);
      h.push('<section aria-labelledby="' + id('out-h') + '"><h2 id="' + id('out-h') + '">الخروج والصيانة</h2>');
      if (time) h.push(cPanel([cRow({ title: 'وقت الخروج', value: esc(time) })]));
      h.push('<p class="c-sub g-notice">بالضغط يفتح واتساب وترسل رسالة من رقمك إلى <span data-company>' + co +
        '</span>، مشغّل خدمة الوحدة. نستخدم رقمك لهذا الطلب فقط، ما نشاركه مع أحد، ونحذف المحادثة بعد إغلاق الطلب. <a href="#' + id('privacy-policy') + '">سياسة الخصوصية</a></p>');
      h.push('<div class="c-stack"><button class="lt-btn lt-btn--shop" type="button" id="' + id('out') + '">' + cIcon('chat', 'lt-btn-icon') + '<span>تم الخروج</span></button>');
      h.push('<div class="lt-panel g-confirm" id="' + id('out-confirm') + '" hidden>' +
        (steps.length ? '<p class="g-confirm-h">قبل ما تطلع:</p><ul class="g-steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="g-confirm-b"><p>متأكد إنك طلعت من الوحدة؟ بيفتح واتساب برسالة جاهزة، اضغط «إرسال» عشان نبلغ المضيف.</p>' +
        '<div class="c-stack">' + waBtn('out-yes', 'lt-btn lt-btn--shop', 'نعم، طلعت', 'checkout') +
        '<button class="lt-btn lt-btn--secondary" type="button" id="' + id('out-no') + '">لا، رجوع</button></div></div></div>');
      h.push(waBtn('fix', 'lt-btn lt-btn--secondary', 'بلاغ صيانة', 'maintenance') + '</div>');
      var ask = still || hasRef('contact');
      h.push('<p class="c-label g-contact-h">تواصل مع مشغّل خدمة الوحدة</p>' + cPanel([
        ask ? (still ? cRow({ tag: 'button', attrs: ' id="' + id('ask') + '"', icon: 'chat', title: 'استفسار على واتساب', chevron: true })
                     : cRow({ tag: 'a', attrs: ' id="' + id('ask') + '" href="' + esc(waHref(num, waText('contact', ref))) + '"', icon: 'chat', title: 'استفسار على واتساب', chevron: true })) : '',
        still ? cRow({ tag: 'button', attrs: ' id="' + id('call') + '"', icon: 'call', title: 'اتصل بنا', chevron: true })
              : cRow({ tag: 'a', attrs: ' id="' + id('call') + '" href="tel:+' + num + '"', icon: 'call', title: 'اتصل بنا', chevron: true })
      ].filter(Boolean)));
      h.push('<p class="c-status" id="' + id('out-st') + '" role="status" aria-live="polite"></p></section>');
    }

    // 3) التكييف: لوحة فيها نص المضيف بأسطره
    var ac = str(D.ac);
    if (ac) h.push('<section aria-labelledby="' + id('ac-h') + '"><h2 id="' + id('ac-h') + '">التكييف</h2>' + cPanel([cRow({ cls: 'c-row-text g-pre', html: esc(ac) })]) + '</section>');

    // 4) العنوان (اختياري): للتوصيل والتاكسي، بدون رقم الوحدة ولا الدور
    var addr = str(D.address), map = str(D.mapUrl), mapOk = /^https:\/\/[^\s"'<>]+$/.test(map);
    if (addr) {
      h.push('<section aria-labelledby="' + id('addr-h') + '"><h2 id="' + id('addr-h') + '">العنوان</h2>' + cPanel([
        cRow({ cls: 'c-row-text g-pre', html: esc(addr) }),
        cRow({ tag: 'button', attrs: ' id="' + id('addr-copy') + '"', icon: 'copy', title: 'انسخ العنوان' }),
        mapOk ? (still ? cRow({ tag: 'button', attrs: ' id="' + id('map') + '"', icon: 'location', title: 'افتح في الخرائط', chevron: true })
                       : cRow({ tag: 'a', attrs: ' id="' + id('map') + '" href="' + esc(map) + '" target="_blank" rel="noopener"', icon: 'location', title: 'افتح في الخرائط', chevron: true })) : ''
      ].filter(Boolean)) + '<p class="c-status" id="' + id('addr-st') + '" role="status" aria-live="polite"></p></section>');
    }

    // 5) شروط الإقامة: كل شرط صف، بدون نقاط القوائم
    var rules = list(D.rules);
    if (rules.length) h.push('<section aria-labelledby="' + id('rules-h') + '"><h2 id="' + id('rules-h') + '">شروط الإقامة</h2>' +
      cPanel(rules.map(function (x) { return cRow({ cls: 'c-row-text', html: esc(x) }); })) + '</section>');

    // 6) الطوارئ: أرقام وطنية من config.js بمصدرها (ر4-2). مو أحمر. في العرض صفوف بدون روابط
    var sos = (Array.isArray(S.emergency) ? S.emergency : []).filter(function (e) { return e && str(e.label) && waNum(e.number); });
    if (sos.length) h.push('<section aria-labelledby="' + id('sos-h') + '"><h2 id="' + id('sos-h') + '">الطوارئ</h2>' +
      cPanel(sos.map(function (e, i) {
        var n = waNum(e.number), r = { icon: 'call', title: esc(e.label), value: '<span dir="ltr">' + n + '</span>', cls: 'g-sos' + (i ? '' : ' is-first') };
        return still ? cRow(r) : cRow(Object.assign(r, { tag: 'a', attrs: ' href="tel:' + n + '"' }));
      })) + (demo ? '<p class="c-sub g-demo-note">عرض تجريبي: الأرقام هنا للعرض، والضغط ما يتصل.</p>' : '') + '</section>');

    // 7) سياسة الخصوصية: placeholder. ما ينرفع دليل عميل قبل ما تنكتب ويتغير الرابط (بند 21 أ)
    h.push('<p class="c-sub g-privacy" id="' + id('privacy-policy') + '">سياسة الخصوصية: ما انكتبت للحين.</p>');
    if (demo && !mini) h.push(cOwner('للمضيف', 'هذي الصفحة اللي يشوفها ضيفك لما يقرّب جواله من الشريحة أو يمسح الباركود. ونسويها بشعارك وألوانك.', 'أبغى دليل مثله لوحداتي', 'demoGuide'));

    return {
      title: (unit ? unit + ' — ' : '') + 'دليل الوحدة',
      bar: demo && !mini ? cDemoBar(brand.name || 'وحدة مثال', 'demoGuide') : '',
      html: h.join(''), brand: brand, poweredBy: D.poweredBy,
      bind: function () { bind(D, demo, addr, p); }
    };
  };

  function bind(D, demo, addr, p) {
    var $p = function (x) { return $(p + x); };
    var out = $p('out'), box = $p('out-confirm'), st = $p('out-st');
    var say = function (el, target, demoMsg, liveMsg) {
      if (el) el.addEventListener('click', function () { var m = demo ? demoMsg : liveMsg; if (m) $p(target).textContent = m; });
    };
    cBindWifi(D.wifi, p);
    if (out) {
      // «تم الخروج»: التأكيد مكان الزر، و«بلاغ صيانة» يبقى تحته
      out.addEventListener('click', function () { box.hidden = false; out.hidden = true; st.textContent = ''; $p('out-yes').focus(); });
      $p('out-no').addEventListener('click', function () { box.hidden = true; out.hidden = false; out.focus(); });
      $p('out-yes').addEventListener('click', function () {
        // الرابط يفتح واتساب بنفس الضغطة، وبعدها يرجع زر «تم الخروج» مكانه
        setTimeout(function () {
          box.hidden = true; out.hidden = false;
          st.textContent = demo ? 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة، وإحنا نبلغ المضيف.'
            : 'انفتح واتساب؟ اضغط «إرسال». ما يوصلنا شي لين ترسل.';
          out.focus();
        }, 0);
      });
      say($p('fix'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب المشكلة.',
        'انفتح واتساب؟ اكتب المشكلة واضغط «إرسال».');
      say($p('ask'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب سؤاله.',
        'انفتح واتساب؟ اكتب سؤالك واضغط «إرسال».');
      say($p('call'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يتصل الضيف بمشغّل خدمة الوحدة.', '');
    }
    cCopy($p('addr-copy'), function () { return addr; }, $p('addr-st'), 'تم نسخ العنوان.', 'ما قدرنا ننسخ. اكتب العنوان يدوياً.');
    say($p('map'), 'addr-st', 'عرض تجريبي: في النسخة الحقيقية يفتح موقع العمارة في الخرائط.', '');
  }

  if (!w.LT_NO_MOUNT && document.getElementById('app')) {
    var D = w.GUIDE_DATA || {}, r = R.guide(D, {});
    applyShop(r.brand);
    document.title = r.title;
    cMount(r.bar, r.html, r.poweredBy);
    r.bind();
  }
})(window);
