// دليل الوحدة: المنطق كله هنا. يستخدمه القالب (templates/rental-guide/) ونسخة العرض (demo/rental-guide/).
// المواصفة: web-ux.md ر3-2 + قرارات مراجعة المدير العام (goal.md). الإشعار حرفياً من legal/register.md بند 21.
// ممنوع في الصفحة (GM-003، systems/architecture.md §8): رقم المضيف أو العاملة، رمز الباب أو مكان المفتاح،
// رابط حجز أو دفع، أي حقل يجمع بيانات الضيف، وأي وقت في رسائل الواتساب.
(function () {
  var D = window.GUIDE_DATA || {}, S = window.SITE || {};
  var demo = D.demo === true, num = waNum(S.whatsapp), ref = str(D.unitRef), unit = str(D.unit);
  var hasRef = function (k) { return waText(k).indexOf('{unitRef}') > -1; };
  // دليل عميل: أزرار الواتساب تطلع بس لو فيه رقم الشركة ومرجع وحدة 12 حرف أو أكثر، والرسائل فيها {unitRef} (ر3-2 «حماية»)
  var live = !demo && !!num && ref.length >= 12 && hasRef('checkout') && hasRef('maintenance');
  var list = function (a) { return (Array.isArray(a) ? a : []).map(str).filter(Boolean); };
  var li = function (s) { return '<li>' + esc(s) + '</li>'; };
  // زر واتساب: رابط حقيقي في دليل العميل، وزر بدون رابط في العرض (يكتب في سطر الحالة بس)
  var waBtn = function (id, cls, label, key) {
    return demo
      ? '<button class="' + cls + '" type="button" id="' + id + '"><span>' + label + '</span></button>'
      : '<a class="' + cls + '" id="' + id + '" href="' + esc(waHref(num, waText(key, ref))) + '"><span>' + label + '</span></a>';
  };
  var h = [];

  document.title = (unit ? unit + ' — ' : '') + 'دليل الوحدة';
  if (demo) h.push(demoBar('عرض تجريبي: وحدة مثال', 'demoGuide'));
  h.push('<h1>' + (unit ? 'أهلاً في ' + esc(unit) : 'أهلاً وسهلاً') + '</h1>');

  // 1) الواي فاي: أول شي بدون أي ضغطة
  h.push(wifiBox(D.wifi, true));

  // 2) الخروج والصيانة والتواصل مع الشركة المشغّلة (رقم المضيف ما يطلع أبداً)
  if (demo || live) {
    var time = str(D.checkoutTime), steps = list(D.beforeLeaving).slice(0, 3);
    h.push('<section class="sec" aria-labelledby="out-h"><h2 id="out-h">الخروج والصيانة</h2>');
    if (time) h.push('<p class="lbl">وقت الخروج</p><p class="val">' + esc(time) + '</p>');
    h.push('<p class="notice">بالضغط يفتح واتساب وترسل رسالة من رقمك إلى <span data-company>' + esc(companyName()) +
      '</span>، مشغّل خدمة الوحدة. نستخدم رقمك لهذا الطلب فقط، ما نشاركه مع أحد، ونحذف المحادثة بعد إغلاق الطلب. <a href="#privacy-policy">سياسة الخصوصية</a></p>');
    h.push('<div class="acts">');
    h.push('<button class="lt-wa" type="button" id="out"><span>تم الخروج</span></button>');
    h.push('<div class="confirm" id="out-confirm" hidden>' +
      (steps.length ? '<p class="confirm-h">قبل ما تطلع:</p><ul class="steps">' + steps.map(li).join('') + '</ul>' : '') +
      '<p>متأكد إنك طلعت من الوحدة؟ بيفتح واتساب برسالة جاهزة، اضغط «إرسال» عشان نبلغ المضيف.</p>' +
      waBtn('out-yes', 'lt-wa', 'نعم، طلعت', 'checkout') +
      '<button class="btn alt" type="button" id="out-no">لا، رجوع</button></div>');
    h.push(waBtn('fix', 'lt-wa lt-wa--quiet', 'بلاغ صيانة', 'maintenance'));
    if (demo || hasRef('contact')) h.push(waBtn('ask', 'lt-wa lt-wa--quiet', 'تواصل معنا', 'contact'));
    h.push('</div><p class="status" id="out-st" role="status" aria-live="polite"></p>');
    if (num) h.push('<p class="alt-line">ما عندك واتساب؟ كلّمنا على: <a class="tel" href="tel:+' + num + '" dir="ltr">+' + num + '</a></p>');
    h.push('</section>');
  }

  // 3) العنوان (اختياري): للتوصيل والتاكسي، بدون رقم الوحدة ولا الدور
  var addr = str(D.address), map = str(D.mapUrl), mapOk = /^https:\/\/[^\s"'<>]+$/.test(map);
  if (addr || (demo ? map : mapOk)) {
    h.push('<section class="sec" aria-labelledby="addr-h"><h2 id="addr-h">العنوان</h2>');
    if (addr) h.push('<p class="pre">' + esc(addr) + '</p>');
    h.push('<div class="pair">');
    if (addr) h.push('<button class="btn alt" type="button" id="addr-copy">انسخ العنوان</button>');
    if (demo && map) h.push('<button class="btn alt" type="button" id="map-demo">افتح في الخرائط</button>');
    else if (mapOk) h.push('<a class="btn alt" href="' + esc(map) + '" rel="noopener">افتح في الخرائط</a>');
    h.push('</div><p class="status" id="addr-st" role="status" aria-live="polite"></p></section>');
  }

  // 4) التكييف و 5) الشروط: أسطر مختصرة من المضيف نفسه
  var ac = str(D.ac), rules = list(D.rules);
  if (ac) h.push('<section class="sec" aria-labelledby="ac-h"><h2 id="ac-h">التكييف</h2><p class="pre">' + esc(ac) + '</p></section>');
  if (rules.length) h.push('<section class="sec" aria-labelledby="rules-h"><h2 id="rules-h">شروط الإقامة</h2><ul class="rules">' + rules.map(li).join('') + '</ul></section>');

  // 6) الطوارئ: أرقام وطنية من config.js (بمصدر رسمي). فاضي = ما يطلع
  var sos = (Array.isArray(S.emergency) ? S.emergency : []).filter(function (e) { return e && str(e.label) && waNum(e.number); });
  if (sos.length) h.push('<section class="sec" aria-labelledby="sos-h"><h2 id="sos-h">الطوارئ</h2><ul class="sos">' +
    sos.map(function (e) { var n = waNum(e.number); return '<li><span>' + esc(e.label) + '</span><a href="tel:' + n + '" dir="ltr">' + n + '</a></li>'; }).join('') +
    '</ul></section>');

  // 7) سياسة الخصوصية: placeholder. ما ينرفع دليل عميل قبل ما تنكتب ويتغير الرابط (بند 21 أ)
  h.push('<p class="privacy" id="privacy-policy">سياسة الخصوصية: ما انكتبت للحين.</p>');
  if (demo) h.push(demoEnd('ضيفك', 'أبغى دليل مثل هذا لوحداتي', 'demoGuide'));

  mount(h.join(''));
  bindWifi(D.wifi);

  // الخروج: تأكيد مكان الزر، و«بلاغ صيانة» يبقى تحته
  var out = $('out'), box = $('out-confirm'), st = $('out-st');
  if (out) {
    out.addEventListener('click', function () {
      box.hidden = false; out.hidden = true; st.textContent = '';
      $('out-yes').focus();
    });
    $('out-no').addEventListener('click', function () { box.hidden = true; out.hidden = false; out.focus(); });
    $('out-yes').addEventListener('click', function () {
      // الرابط يفتح واتساب بنفس الضغطة، وبعدها يرجع الزر مكانه
      setTimeout(function () {
        box.hidden = true; out.hidden = false;
        st.textContent = demo
          ? 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة، وإحنا نبلغ المضيف.'
          : 'انفتح واتساب؟ اضغط «إرسال». ما يوصلنا شي لين ترسل.';
        out.focus();
      }, 0);
    });
    $('fix').addEventListener('click', function () {
      st.textContent = demo
        ? 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب المشكلة.'
        : 'انفتح واتساب؟ اكتب المشكلة واضغط «إرسال».';
    });
    if ($('ask')) $('ask').addEventListener('click', function () {
      st.textContent = demo
        ? 'عرض تجريبي: في النسخة الحقيقية يفتح واتساب برسالة جاهزة فيها مرجع الوحدة، والضيف يكتب سؤاله.'
        : 'انفتح واتساب؟ اكتب سؤالك واضغط «إرسال».';
    });
  }
  if ($('addr-copy')) bindCopy($('addr-copy'), function () { return addr; }, $('addr-st'),
    'تم نسخ العنوان. الصقه في تطبيق التوصيل أو التاكسي.', 'ما قدرنا ننسخ. اكتب العنوان يدوياً.');
  if ($('map-demo')) $('map-demo').addEventListener('click', function () {
    $('addr-st').textContent = 'عرض تجريبي: في النسخة الحقيقية يفتح موقع الوحدة في الخرائط.';
  });
})();
