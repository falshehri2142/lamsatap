// أدوات صفحات الزبون (البيئة ب، موجز المدير الفني §5). ينربط بعد app.js و shop-color.js وقبل render.js.
// بدون أي طلب خارجي ولا fetch()، ويشتغل من file://.
(function (w, d) {
  // الأيقونات: مجموعة وحدة، currentColor، خط دائري (§3.3). المحادثة من brand/icons/chat.svg.
  // الباقي مؤقت مني لين يسلّم web-illustrator مجموعته (website/assets/illustrations/)، وينحط مكانه هنا.
  var ICONS = {
    chat: '<path d="M7 4h10a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4v3.5L12.5 17H7a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"/><circle cx="8" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="10.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="10.5" r="1.3" fill="currentColor" stroke="none"/>',
    call: '<path d="M6.6 3.5h2.6l1.5 4.2-2 1.4a11 11 0 0 0 6.2 6.2l1.4-2 4.2 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6.5A2.5 2.5 0 0 0 13 4H6.5A2.5 2.5 0 0 0 4 6.5V13a2.5 2.5 0 0 0 2.5 2.5h2"/>',
    location: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chevron: '<path d="M14.5 6l-6 6 6 6"/>'  // سهم التقدّم في RTL يأشر يسار
  };
  w.cIcon = function (name, cls) {
    return '<svg class="' + (cls || 'c-ico') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  };

  // المسار لازم يكون محلي ونسبي (GM-006: ولا طلب خارجي). رابط من برّا أو صيغة غريبة = ما ينقرى، ويطلع الاسم
  function localImg(p) {
    p = str(p);
    return /^(?![a-z][a-z0-9+.-]*:)(?![\\/])[^\s"'<>]+\.(svg|png|webp)$/i.test(p) ? p : '';
  }

  // رأس الهوية (§5.3): شعار المحل، أو اسمه كشعار كتابي بالثيم المحايد (GM-027). small = 40px (دليل الوحدة لو لزم)
  w.cIdentity = function (brand, small) {
    brand = brand || {};
    var name = str(brand.name), logo = localImg(brand.logo), dark = localImg(brand.logoDark);
    var cls = 'c-id' + (small ? ' c-id--sm' : '');
    if (!logo) return name ? '<header class="' + cls + '"><p class="c-id-name">' + esc(name) + '</p></header>' : '';
    var img = '<img class="c-logo' + (dark ? '' : ' c-plate') + '" src="' + esc(logo) + '" alt="' + esc(name) + '" data-name="' + esc(name) + '">';
    return '<header class="' + cls + '">' + (dark ? '<picture><source srcset="' + esc(dark) + '" media="(prefers-color-scheme: dark)">' + img + '</picture>' : img) + '</header>';
  };
  // لو ملف الشعار ما انفتح: الاسم مكانه
  function logoFallback(root) {
    [].forEach.call(root.querySelectorAll('img.c-logo[data-name]'), function (img) {
      img.addEventListener('error', function () {
        var h = img.closest('.c-id'), n = img.getAttribute('data-name');
        if (h) h.innerHTML = n ? '<p class="c-id-name">' + esc(n) + '</p>' : '';
      });
    });
  }

  // لوحة مجمّعة من صفوف (§5.6). كل صف: { tag, cls, attrs, icon, text, value, strong, chevron, html }
  w.cRow = function (r) {
    var tag = r.tag || 'div';
    var inner = r.html || ((r.icon ? cIcon(r.icon) : '') + '<span class="c-row-t">' + r.text + '</span>' +
      (r.value != null ? '<span class="c-row-v' + (r.strong ? ' is-strong' : '') + '">' + r.value + '</span>' : '') +
      (r.chevron ? cIcon('chevron', 'c-chev') : ''));
    return '<' + tag + ' class="c-row' + (r.cls ? ' ' + r.cls : '') + '"' + (tag === 'button' ? ' type="button"' : '') + (r.attrs || '') + '>' + inner + '</' + tag + '>';
  };
  w.cPanel = function (rows, attrs) {
    return '<ul class="c-panel"' + (attrs || '') + '>' + rows.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
  };

  // صندوق الواي فاي (§5.7): نفسه في دليل الوحدة وصفحة الواي فاي. p = بادئة الـ IDs
  w.cWifi = function (wf, heading, p) {
    wf = wf || {}; p = p || '';
    var ssid = str(wf.ssid), pw = String(wf.password == null ? '' : wf.password), x;
    if (!ssid && !pw.trim()) return '';
    x = heading ? '<section aria-labelledby="' + p + 'wifi-h"><h2 id="' + p + 'wifi-h">الواي فاي</h2>' : '<section aria-label="الواي فاي">';
    x += '<div class="c-wifi">';
    if (ssid) x += '<p class="c-label">الشبكة</p><p class="c-wifi-v" dir="ltr" translate="no">' + esc(ssid) + '</p>';
    if (pw.trim()) x += '<p class="c-label">كلمة المرور</p><p class="c-pw" dir="ltr" translate="no">' + esc(pw) + '</p>' +
      '<button class="c-btn" type="button" id="' + p + 'wifi-copy">انسخ كلمة المرور</button>';
    else x += '<p class="c-wifi-open">الشبكة مفتوحة، بدون كلمة مرور.</p>';
    return x + '</div><p class="c-status" id="' + p + 'wifi-st" role="status" aria-live="polite"></p></section>';
  };
  // زر نسخ: «تم النسخ» مع علامة صح ثانيتين ويرجع فوراً (بدون حركة)، والرسالة في سطر الحالة
  w.cCopy = function (btn, getText, status, okMsg, failMsg) {
    if (!btn) return;
    var label = btn.innerHTML, timer;
    btn.addEventListener('click', function () {
      copyText(getText(), function (ok) {
        status.textContent = ok ? okMsg : failMsg;
        if (!ok) return;
        btn.innerHTML = cIcon('check') + '<span>تم النسخ</span>';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.innerHTML = label; }, 2000);
      });
    });
  };
  w.cBindWifi = function (wf, p) {
    p = p || '';
    var pw = String((wf || {}).password == null ? '' : wf.password);
    cCopy($(p + 'wifi-copy'), function () { return pw; }, $(p + 'wifi-st'),
      'تم النسخ. اختر الشبكة من إعدادات الواي فاي والصق كلمة المرور.', 'ما قدرنا ننسخ. اكتب كلمة المرور يدوياً.');
  };

  // واتساب المحل في صفحة العميل: الزر بلون المحل مع أيقونة المحادثة (GM-023). cls = c-btn أو c-btn2
  w.cShopWa = function (D, cls, label) {
    var href = waHref(D.whatsapp, str(D.waText) || 'السلام عليكم، عندي استفسار');
    return href ? '<a class="' + cls + '" href="' + esc(href) + '">' + cIcon('chat') + '<span>' + esc(label) + '</span></a>' : '';
  };

  // طبقة لمسة تاب في نسخ العرض (§5.6): شريط فوق بعرض الشاشة، وقسم «لصاحب المحل» آخر الصفحة، والزرين لرقم الشركة.
  // اسم الزر الصغير = نصه الظاهر (WCAG 2.5.3)، ووصفه = نص الزر الكبير
  w.cDemoBar = function (label, key) {
    return '<aside class="c-demo" aria-label="عرض تجريبي"><div class="c-demo-in"><span>عرض تجريبي · ' + esc(label) + '</span>' +
      '<a class="c-demo-btn" data-wa="' + key + '" aria-describedby="demo-cta-t" hidden><span>أبغى مثله</span></a></div></aside>';
  };
  w.cOwner = function (who, cta, key) {
    return '<section class="c-owner" aria-labelledby="owner-h"><h2 id="owner-h">لصاحب المحل</h2>' +
      '<p>هذي الصفحة اللي يشوفها ' + who + ' لما يقرّب جواله من الشريحة أو يمسح الباركود.</p>' +
      '<a class="lt-wa" data-wa="' + key + '" hidden><span id="demo-cta-t">' + esc(cta) + '</span></a></section>';
  };
  // «بواسطة لمسة تاب»: نص بس، ويطلع بس لو poweredBy: true (GM-023). بدون رمز (GM-022)
  w.cBy = function (on) {
    return on === true ? '<p class="c-by">بواسطة <span data-company>' + esc(companyName()) + '</span></p>' : '';
  };

  // لون شريط المتصفح = خلفية الصفحة (§5.6)، ويتبع الوضع الداكن
  function themeColor() {
    var m = d.querySelector('meta[name="theme-color"]');
    if (!m) { m = d.createElement('meta'); m.name = 'theme-color'; d.head.appendChild(m); }
    m.content = getComputedStyle(d.documentElement).getPropertyValue('--lt-bg').trim();
  }

  // يركّب الصفحة: شريط العرض (لو فيه) برّا العمود، والمحتوى في العمود، و«بواسطة» آخره
  w.cMount = function (bar, html, poweredBy) {
    var app = $('app');
    app.innerHTML = (bar || '') + '<main class="c-main">' + html + cBy(poweredBy) + '</main>';
    [].forEach.call(app.querySelectorAll('.c-demo-btn,.lt-wa'), function (a) { waIcon(a); });
    logoFallback(app);
    themeColor();
    if (w.matchMedia) {
      var mq = w.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', themeColor);
    }
    return app;
  };
})(window, document);
