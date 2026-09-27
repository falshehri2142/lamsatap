// دليل الوحدة: المنطق كله هنا. يستخدمه القالب (templates/rental-guide/) ونسخة العرض (demo/rental-guide/).
// المواصفة: web-ux.md ر3-2 و ر4-3 (الترتيب والتواصل والعنوان والطوارئ). الإشعار حرفياً من legal/register.md بند 21.
// ممنوع في الصفحة (GM-003، systems/architecture.md §8): رقم المضيف أو العاملة، رمز الباب أو مكان المفتاح،
// رابط حجز أو دفع، أي حقل يجمع بيانات الضيف، وأي وقت في رسائل الواتساب.
// العرض (demo:true، ر4-1): أي زر يطلع برا الصفحة (واتساب، اتصال، خرائط) يكتب سطر حالة بدل ما يفتح، إلا زر البيع حقنا.
(function () {
  var D = window.GUIDE_DATA || {}, S = window.SITE || {};
  var demo = D.demo === true, num = waNum(S.whatsapp), ref = str(D.unitRef), unit = str(D.unit), co = esc(companyName());
  var hasRef = function (k) { return waText(k).indexOf('{unitRef}') > -1; };
  // دليل عميل: القسم يطلع بس لو فيه رقم الشركة ومرجع وحدة 12 حرف أو أكثر، والرسائل فيها {unitRef} (ر3-2 «حماية»)
  var live = !demo && !!num && ref.length >= 12 && hasRef('checkout') && hasRef('maintenance');
  var list = function (a) { return (Array.isArray(a) ? a : []).map(str).filter(Boolean); };
  var li = function (s) { return '<li>' + esc(s) + '</li>'; };
  // زر يفتح واتساب: رابط حقيقي في دليل العميل، وزر بدون رابط في العرض
  var waBtn = function (id, cls, label, key) {
    return demo
      ? '<button class="' + cls + '" type="button" id="' + id + '"><span>' + label + '</span></button>'
      : '<a class="' + cls + '" id="' + id + '" href="' + esc(waHref(num, waText(key, ref))) + '"><span>' + label + '</span></a>';
  };
  var h = [];

  document.title = (unit ? unit + ' — ' : '') + 'دليل الوحدة';
  if (demo) h.push(demoBar('عرض تجريبي: وحدة مثال', 'demoGuide'));
  h.push('<h1>' + (unit ? 'أهلاً في ' + esc(unit) : 'أهلاً وسهلاً') + '</h1>');

  // 2) الواي فاي: أول شي بدون أي ضغطة
  h.push(wifiBox(D.wifi, true));

  // 3) الخروج والصيانة والتواصل مع الشركة المشغّلة. رقم المضيف أو العاملة ما يطلع أبداً
  if (demo || live) {
    var time = str(D.checkoutTime), steps = list(D.beforeLeaving).slice(0, 3);
    h.push('<section class="sec" aria-labelledby="out-h"><h2 id="out-h">الخروج والصيانة</h2>');
    if (time) h.push('<p class="lbl">وقت الخروج</p><p class="val">' + esc(time) + '</p>');
    h.push('<p class="notice">بالضغط يفتح واتساب وترسل رسالة من رقمك إلى <span data-company>' + co +
      '</span>، مشغّل خدمة الوحدة. نستخدم رقمك لهذا الطلب فقط، ما نشاركه مع أحد، ونحذف المحادثة بعد إغلاق الطلب. <a href="#privacy-policy">سياسة الخصوصية</a></p>');
    h.push('<div class="acts"><button class="lt-wa" type="button" id="out"><span>تم الخروج</span></button>');
    h.push('<div class="confirm" id="out-confirm" hidden>' +
      (steps.length ? '<p class="confirm-h">قبل ما تطلع:</p><ul class="steps">' + steps.map(li).join('') + '</ul>' : '') +
      '<p>متأكد إنك طلعت من الوحدة؟ بيفتح واتساب برسالة جاهزة، اضغط «إرسال» عشان نبلغ المضيف.</p>' +
      waBtn('out-yes', 'lt-wa', 'نعم، طلعت', 'checkout') +
      '<button class="btn alt" type="button" id="out-no">لا، رجوع</button></div>');
    h.push(waBtn('fix', 'lt-wa lt-wa--quiet', 'بلاغ صيانة', 'maintenance') + '</div>');
    var ask = demo || hasRef('contact');
    h.push('<p class="ask-h">سؤال ثاني؟ تواصل مع <span data-company>' + co + '</span>:</p><div class="pair">' +
      (ask ? waBtn('ask', 'lt-wa lt-wa--quiet', 'استفسار على واتساب', 'contact') : '') +
      (demo ? '<button class="btn alt" type="button" id="call">اتصل بنا</button>'
            : '<a class="btn alt" id="call" href="tel:+' + num + '">اتصل بنا</a>') + '</div>');
    h.push('<p class="status" id="out-st" role="status" aria-live="polite"></p></section>');
  }

  // 4) التكييف: بعد الخروج، لأنه أول شي يحتاجه الضيف بعد ما يدخل (ر4-3)
  var ac = str(D.ac);
  if (ac) h.push('<section class="sec" aria-labelledby="ac-h"><h2 id="ac-h">التكييف</h2><p class="pre">' + esc(ac) + '</p></section>');

  // 5) العنوان (اختياري): للتوصيل والتاكسي، بدون رقم الوحدة ولا الدور
  var addr = str(D.address), map = str(D.mapUrl), mapOk = /^https:\/\/[^\s"'<>]+$/.test(map);
  if (addr) {
    h.push('<section class="sec" aria-labelledby="addr-h"><h2 id="addr-h">العنوان</h2><p class="pre">' + esc(addr) + '</p><div class="pair">' +
      '<button class="btn alt" type="button" id="addr-copy">انسخ العنوان</button>' +
      (mapOk ? (demo ? '<button class="btn alt" type="button" id="map">افتح في الخرائط</button>'
                     : '<a class="btn alt" id="map" href="' + esc(map) + '" target="_blank" rel="noopener">افتح في الخرائط</a>') : '') +
      '</div><p class="status" id="addr-st" role="status" aria-live="polite"></p></section>');
  }

  // 6) شروط الإقامة: أسطر مختصرة من المضيف نفسه
  var rules = list(D.rules);
  if (rules.length) h.push('<section class="sec" aria-labelledby="rules-h"><h2 id="rules-h">شروط الإقامة</h2><ul class="rules">' + rules.map(li).join('') + '</ul></section>');

  // 7) الطوارئ: أرقام وطنية من config.js بمصدرها (ر4-2). أول رقم زر عرض كامل، والباقي صف.
  //    في العرض نص عادي مو روابط اتصال، عشان ما أحد يتصل بالطوارئ بالغلط وهو يجرب
  var sos = (Array.isArray(S.emergency) ? S.emergency : []).filter(function (e) { return e && str(e.label) && waNum(e.number); });
  if (sos.length) {
    var call = function (cls, n, inner) {
      return demo ? '<span class="' + cls + ' is-demo">' + inner + '</span>' : '<a class="' + cls + '" href="tel:' + n + '">' + inner + '</a>';
    };
    var n0 = waNum(sos[0].number);
    h.push('<section class="sec" aria-labelledby="sos-h"><h2 id="sos-h">الطوارئ</h2>' +
      call('btn alt sos-main', n0, 'اتصل بالطوارئ <span dir="ltr">' + n0 + '</span>') +
      (sos.length > 1 ? '<div class="sos-row">' + sos.slice(1).map(function (e) {
        var n = waNum(e.number);
        return call('btn alt sos-btn', n, '<span>' + esc(e.label) + '</span><span dir="ltr">' + n + '</span>');
      }).join('') + '</div>' : '') +
      (demo ? '<p class="sos-note">عرض تجريبي: الأرقام هنا للعرض، والضغط ما يتصل.</p>' : '') + '</section>');
  }

  // 8) سياسة الخصوصية: placeholder. ما ينرفع دليل عميل قبل ما تنكتب ويتغير الرابط (بند 21 أ)
  h.push('<p class="privacy" id="privacy-policy">سياسة الخصوصية: ما انكتبت للحين.</p>');
  if (demo) h.push(demoEnd('ضيفك', 'أبغى دليل مثل هذا لوحداتي', 'demoGuide'));

  mount(h.join(''));
  bindWifi(D.wifi);

  // الخروج: تأكيد مكان الزر، و«بلاغ صيانة» يبقى تحته
  var out = $('out'), box = $('out-confirm'), st = $('out-st');
  var say = function (el, id, demoMsg, liveMsg) {
    if (el) el.addEventListener('click', function () { $(id).textContent = demo ? demoMsg : liveMsg; });
  };
  if (out) {
    out.addEventListener('click', function () {
      box.hidden = false; out.hidden = true; st.textContent = '';
      $('out-yes').focus();
    });
    $('out-no').addEventListener('click', function () { box.hidden = true; out.hidden = false; out.focus(); });
    $('out-yes').addEventListener('click', function () {
      // الرابط يفتح واتساب بنفس الضغطة، وبعدها يرجع زر «تم الخروج» مكانه
      setTimeout(function () {
        box.hidden = true; out.hidden = false;
        st.textContent = demo
          ? 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة، وإحنا نبلغ المضيف.'
          : 'انفتح واتساب؟ اضغط «إرسال». ما يوصلنا شي لين ترسل.';
        out.focus();
      }, 0);
    });
    say($('fix'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب المشكلة.',
      'انفتح واتساب؟ اكتب المشكلة واضغط «إرسال».');
    say($('ask'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب سؤاله.',
      'انفتح واتساب؟ اكتب سؤالك واضغط «إرسال».');
    if (demo) say($('call'), 'out-st', 'عرض تجريبي: في النسخة الحقيقية يتصل برقم ' + companyName() + '.', '');
  }
  if ($('addr-copy')) bindCopy($('addr-copy'), function () { return addr; }, $('addr-st'),
    'تم نسخ العنوان.', 'ما قدرنا ننسخ. اكتب العنوان يدوياً.');
  if (demo) say($('map'), 'addr-st', 'عرض تجريبي: في النسخة الحقيقية يفتح موقع العمارة في الخرائط.', '');
})();
