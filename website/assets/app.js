// أدوات مشتركة خفيفة لكل صفحات website/: اسم الشركة، أزرار الواتساب، وضع العرض، النسخ.
// بدون أي طلب خارجي ولا fetch()، وكل شي يشتغل من file://.
(function (d, w) {
  var S = w.SITE || {}, NAME = 'لمسة تاب';
  // مجلد assets/ محسوب من مكان هذا الملف، عشان الصفحات تشتغل على أي عمق مجلد
  var me = d.currentScript && d.currentScript.getAttribute('src');
  w.ASSETS = me ? me.replace(/app\.js(\?.*)?$/, '') : 'assets/';

  // أيقونة المحادثة حقتنا (brand/icons/chat.svg). مو شعار واتساب (web-brand.md §3)
  var ICON = '<svg class="lt-wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4h10a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4v3.5L12.5 17H7a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="10.5" r="1.3" fill="currentColor"/><circle cx="12" cy="10.5" r="1.3" fill="currentColor"/><circle cx="16" cy="10.5" r="1.3" fill="currentColor"/></svg>';

  function all(sel, root) { return [].slice.call((root || d).querySelectorAll(sel)); }
  w.$ = function (id) { return d.getElementById(id); };
  w.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  w.str = function (v) { return String(v == null ? '' : v).trim(); };
  w.companyName = function () { return str(S.companyName) || NAME; };

  // الواتساب: الرقم أرقام بس، والرابط https://wa.me/<رقم>?text=<رسالة مرمّزة>
  w.waNum = function (n) { return String(n == null ? '' : n).replace(/\D/g, ''); };
  w.waHref = function (num, text) {
    num = waNum(num);
    if (!num) return '';
    return 'https://wa.me/' + num + (text ? '?text=' + encodeURIComponent(text) : '');
  };
  w.waIcon = function (el) {
    if (!el.querySelector('.lt-wa-icon')) el.insertAdjacentHTML('afterbegin', ICON);
    return el;
  };
  // رسالة من config (SITE.waText)، و{unitRef} ينعوض
  w.waText = function (key, unitRef) {
    var t = (S.waText || {})[key];
    t = typeof t === 'string' ? t : '';
    return unitRef == null ? t : t.split('{unitRef}').join(unitRef);
  };

  // اسم الشركة: [data-company] نص، [data-company-alt] نص بديل للشعار، والعنوان إذا فيه الاسم الاحتياطي
  w.fillCompany = function () {
    var n = companyName(), en = str(S.companyNameEn);
    all('[data-company]').forEach(function (el) { el.textContent = n; });
    all('[data-company-alt]').forEach(function (el) { el.alt = en ? n + ' — ' + en : n; });
    if (n !== NAME) d.title = d.title.split(NAME).join(n);
  };

  // أزرار واتساب الشركة: [data-wa="<مفتاح في waText>"]. بدون رقم: hidden، مو زر معطّل (GM-010)
  // [data-wa-empty]: سطر يطلع بدالها لما الرقم فاضي (الرئيسية بس)
  w.fillWhatsapp = function () {
    var num = waNum(S.whatsapp);
    all('[data-wa]').forEach(function (a) {
      if (num) {
        a.href = waHref(num, waText(a.getAttribute('data-wa')));
        a.hidden = false;
        if (a.classList.contains('lt-wa') || a.classList.contains('wa-link')) waIcon(a);
      } else {
        a.removeAttribute('href');
        a.hidden = true;
      }
    });
    all('[data-wa-empty]').forEach(function (el) { el.hidden = !!num; });
  };

  // النسخ: clipboard في https و localhost، و execCommand في file://
  w.copyText = function (text, cb) {
    function fallback() {
      var t = d.createElement('textarea'), ok = false;
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      d.body.appendChild(t);
      t.select();
      t.setSelectionRange(0, text.length);
      try { ok = d.execCommand('copy'); } catch (e) {}
      d.body.removeChild(t);
      cb(ok);
    }
    if (navigator.clipboard && w.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { cb(true); }, fallback);
    } else fallback();
  };

  // زر نسخ: نص الزر «تم النسخ» ثانيتين ويرجع، والرسالة في سطر الحالة (aria-live)
  w.bindCopy = function (btn, getText, status, okMsg, failMsg) {
    var label = btn.textContent, timer;
    btn.addEventListener('click', function () {
      copyText(getText(), function (ok) {
        status.textContent = ok ? okMsg : failMsg;
        if (!ok) return;
        btn.textContent = 'تم النسخ';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = label; }, 2000);
      });
    });
  };

  // سطر «بواسطة لمسة تاب» (components.css: .lt-by)، الرمز 16px
  w.byLine = function () {
    var p = d.createElement('p');
    p.className = 'lt-by';
    p.innerHTML = '<img src="' + w.ASSETS + 'brand/lamsatap-icon.svg" width="16" height="16" alt=""><span>بواسطة <span data-company>' + esc(companyName()) + '</span></span>';
    return p;
  };

  // ===== للقوالب (templates/<القالب>/render.js، ونفسها لنسخ العرض في demo/<القالب>/) =====
  // يحط الصفحة في <main id="app">، وسطر «بواسطة» آخرها، وأيقونة المحادثة على أزرار الواتساب
  w.mount = function (html) {
    var app = $('app');
    app.innerHTML = html;
    app.appendChild(byLine());
    all('.lt-wa:not([data-wa])', app).forEach(waIcon);
    return app;
  };
  // وضع العرض (web-ux ر3-5): شريط رفيع فوق فيه زر «أبغى مثله» الصغير، وزر كبير آخر الصفحة، والاثنين لرقم الشركة.
  // الاسم المقروء للزر الصغير = نصه الظاهر (WCAG 2.5.3)، ووصفه = نص الزر الكبير (aria-describedby)
  w.demoBar = function (label, key) {
    return '<div class="demo-bar"><span>' + esc(label) + '</span><a class="lt-wa" data-wa="' + key + '" aria-describedby="demo-cta-t" hidden><span>أبغى مثله</span></a></div>';
  };
  w.demoEnd = function (who, cta, key) {
    return '<div class="demo-end"><p>هذي الصفحة اللي يشوفها ' + who + ' لما يقرّب جواله من الشريحة أو يمسح الباركود.</p><a class="lt-wa" data-wa="' + key + '" hidden><span id="demo-cta-t">' + esc(cta) + '</span></a></div>';
  };
  // واتساب المحل في صفحة عميل (demo:false): رقمه ورسالته من data.js. بدون رقم ما يطلع شي
  w.shopWa = function (D, cls, label) {
    var href = waHref(D.whatsapp, str(D.waText) || 'السلام عليكم، عندي استفسار');
    return href ? '<a class="' + cls + '" href="' + esc(href) + '"><span>' + esc(label) + '</span></a>' : '';
  };
  // صندوق الواي فاي: نفسه في دليل الوحدة وصفحة الواي فاي (web-ux ر3-2 بند 2)
  w.wifiBox = function (wf, withHeading) {
    wf = wf || {};
    var ssid = str(wf.ssid), pw = String(wf.password == null ? '' : wf.password), x;
    if (!ssid && !pw.trim()) return '';
    x = withHeading ? '<section class="wifi" aria-labelledby="wifi-h"><h2 id="wifi-h">الواي فاي</h2>' : '<section class="wifi" aria-label="الواي فاي">';
    if (ssid) x += '<p class="lbl">الشبكة</p><p class="val" dir="ltr" translate="no">' + esc(ssid) + '</p>';
    if (pw.trim()) {
      x += '<p class="lbl">كلمة المرور</p><p class="pw" dir="ltr" translate="no">' + esc(pw) + '</p>' +
        '<button class="btn" type="button" id="wifi-copy">انسخ كلمة المرور</button>' +
        '<p class="status" id="wifi-st" role="status" aria-live="polite"></p>';
    } else x += '<p class="open">الشبكة مفتوحة، بدون كلمة مرور.</p>';
    return x + '</section>';
  };
  w.bindWifi = function (wf) {
    var b = $('wifi-copy'), pw = String((wf || {}).password == null ? '' : wf.password);
    if (b) bindCopy(b, function () { return pw; }, $('wifi-st'),
      'تم النسخ. اختر الشبكة من إعدادات الواي فاي والصق كلمة المرور.',
      'ما قدرنا ننسخ. اكتب كلمة المرور يدوياً.');
  };

  // سفاري آيفون ما يطبّق :active (لون الضغط) إلا إذا الصفحة فيها مستمع touchstart
  d.addEventListener('touchstart', function () {}, { passive: true });

  d.addEventListener('DOMContentLoaded', function () { fillCompany(); fillWhatsapp(); });
})(document, window);
