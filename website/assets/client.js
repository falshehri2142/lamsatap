// أدوات صفحات الزبون (البيئة ب، موجز المدير الفني §5). ينربط بعد app.js و shop-color.js وقبل render.js.
// بدون أي طلب خارجي ولا fetch()، ويشتغل من file://.
(function (w, d) {
  // الأيقونات (موجز §3.3): شبكة 20، خط 1.75، أطراف دائرية، currentColor. المسارات من مجموعة web-illustrator
  // (work/2026-09-27-brand-identity/illustrations-src/build_illustrations.py) لين يعتمدها web-brand. inline عشان تاخذ لون النص.
  var ICONS = {
    chat: '<path d="M6 3.5h8A3.5 3.5 0 0 1 17.5 7v4A3.5 3.5 0 0 1 14 14.5v2.8L10.6 14.5H6A3.5 3.5 0 0 1 2.5 11V7A3.5 3.5 0 0 1 6 3.5z"/><path d="M6.6 9h.01M10 9h.01M13.4 9h.01" stroke-width="2.3"/>',
    call: '<path d="M6.2 2.8 8.4 3.6 9.2 6.9 7.5 8.4Q8.9 11.1 11.6 12.5L13.1 10.8 16.4 11.6 17.2 13.8Q17.2 16.9 14.4 17.2 4.6 16.6 2.8 5.6 3.1 2.8 6.2 2.8z"/>',
    copy: '<rect x="7.5" y="7.5" width="9.5" height="9.5" rx="2.2"/><path d="M12.5 4.8V4.7A1.7 1.7 0 0 0 10.8 3H4.7A1.7 1.7 0 0 0 3 4.7v6.1a1.7 1.7 0 0 0 1.7 1.7h.1"/>',
    location: '<path d="M10 17.6S15.6 12.6 15.6 8.3A5.6 5.6 0 0 0 4.4 8.3C4.4 12.6 10 17.6 10 17.6z"/><circle cx="10" cy="8.3" r="2.1"/>',
    arrow: '<path d="M16 10H4M8.8 5.2 4 10l4.8 4.8"/>',
    chevron: '<path d="M12 5 7 10l5 5"/>',   // في RTL يأشر يسار (التقدّم)
    check: '<path d="M4.2 10.4 8.2 14.3 15.8 6"/>'
  };
  w.cIcon = function (name, cls) {
    return '<svg class="' + (cls || 'c-ico') + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  };

  // المسار لازم يكون محلي ونسبي (GM-006: ولا طلب خارجي). رابط من برّا أو صيغة غريبة = ما ينقرى، ويطلع الاسم
  function localImg(p) {
    p = str(p);
    return /^(?![a-z][a-z0-9+.-]*:)(?![\\/])[^\s"'<>]+\.(svg|png|webp)$/i.test(p) ? p : '';
  }

  // هوية المحل من data.js: brand، والاسم الفاضي ياخذ اسم الصفحة (المحل أو الوحدة)
  w.cBrand = function (b, name) { b = Object.assign({}, b || {}); if (!str(b.name)) b.name = str(name); return b; };

  // رأس الهوية (§5.3): شعار المحل، أو اسمه كشعار كتابي بالثيم المحايد (GM-027). small = 40px (دليل الوحدة لو لزم)
  w.cIdentity = function (brand, small) {
    brand = brand || {};
    var name = str(brand.name), logo = localImg(brand.logo), dark = d.documentElement.getAttribute('data-lt-scheme') === 'light' ? '' : localImg(brand.logoDark);
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

  // لوحة مجمّعة من صفوف (§5.6) بمكوّنات components.css: .lt-panel و .lt-row.
  // الصف: { tag, cls, attrs, icon, title, sub, value (قيمة مهمة 17/600)، end (قيمة ثانوية)، chevron، html }
  w.cRow = function (r) {
    var tag = r.tag || 'div';
    var inner = r.html != null ? r.html :
      (r.icon ? cIcon(r.icon, 'lt-row-icon') : '') +
      '<span class="lt-row-body"><span class="lt-row-title">' + r.title + '</span>' + (r.sub ? '<span class="lt-row-sub">' + r.sub + '</span>' : '') + '</span>' +
      (r.value != null ? '<span class="lt-row-end lt-row-end--value">' + r.value + '</span>' : '') +
      (r.end != null ? '<span class="lt-row-end">' + r.end + '</span>' : '') +
      (r.chevron ? cIcon('chevron', 'lt-row-chevron') : '');
    return '<' + tag + ' class="lt-row' + (r.cls ? ' ' + r.cls : '') + '"' + (tag === 'button' ? ' type="button"' : '') + (r.attrs || '') + '>' + inner + '</' + tag + '>';
  };
  w.cPanel = function (rows, attrs) { return '<div class="lt-panel"' + (attrs || '') + '>' + rows.join('') + '</div>'; };

  // صندوق الواي فاي (§5.7): نفسه في دليل الوحدة وصفحة الواي فاي. p = بادئة الـ IDs
  w.cWifi = function (wf, heading, p) {
    wf = wf || {}; p = p || '';
    var ssid = str(wf.ssid), pw = String(wf.password == null ? '' : wf.password), x;
    if (!ssid && !pw.trim()) return '';
    x = heading ? '<section aria-labelledby="' + p + 'wifi-h"><h2 id="' + p + 'wifi-h">الواي فاي</h2>' : '<section aria-label="الواي فاي">';
    x += '<div class="c-wifi">';
    if (ssid) x += '<p class="c-label">الشبكة</p><p class="c-wifi-v" dir="ltr" translate="no">' + esc(ssid) + '</p>';
    if (pw.trim()) x += '<p class="c-label">كلمة المرور</p><p class="c-pw" dir="ltr" translate="no">' + esc(pw) + '</p>' +
      '<button class="lt-btn lt-btn--shop" type="button" id="' + p + 'wifi-copy">انسخ كلمة المرور</button>';
    else x += '<p class="c-wifi-open">الشبكة مفتوحة، بدون كلمة مرور.</p>';
    return x + '</div><p class="c-status" id="' + p + 'wifi-st" role="status" aria-live="polite"></p></section>';
  };
  // زر نسخ: «تم النسخ» مع علامة صح ثانيتين ويرجع فوراً (بدون حركة)، والرسالة في سطر الحالة
  w.cCopy = function (btn, getText, status, okMsg, failMsg) {
    if (!btn) return;
    var label = btn.innerHTML, timer, row = btn.classList.contains('lt-row');
    btn.addEventListener('click', function () {
      copyText(getText(), function (ok) {
        status.textContent = ok ? okMsg : failMsg;
        if (!ok) return;
        btn.innerHTML = row ? cIcon('check', 'lt-row-icon') + '<span class="lt-row-body"><span class="lt-row-title">تم النسخ</span></span>'
          : cIcon('check', 'lt-btn-icon') + '<span>تم النسخ</span>';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.innerHTML = label; }, 2000);
      });
    });
  };
  w.cBindWifi = function (wf, p) {
    p = p || '';
    var pw = String((wf || {}).password == null ? '' : wf.password);
    cCopy($(p + 'wifi-copy'), function () { return pw; }, $(p + 'wifi-st'),
      'تم النسخ. اختر الشبكة من إعدادات الواي فاي، والصق كلمة المرور.', 'ما قدرنا ننسخ. اكتب كلمة المرور يدوياً.');
  };

  // واتساب المحل في صفحة العميل: الزر بلون المحل مع أيقونة المحادثة (GM-023). النوع: shop (أساسي) أو secondary.
  // النص «كلّمنا على واتساب» (web-copy 2.0)
  w.cShopWa = function (D, kind, label) {
    label = label || 'كلّمنا على واتساب';
    var href = waHref(D.whatsapp, str(D.waText) || 'السلام عليكم، عندي استفسار');
    return href ? '<a class="lt-btn lt-btn--' + (kind || 'shop') + '" href="' + esc(href) + '">' + cIcon('chat', 'lt-btn-icon') + '<span>' + esc(label) + '</span></a>' : '';
  };

  // طبقة لمسة تاب في نسخ العرض (§5.6): شريط حبر فوق، وقسم آخر الصفحة، والزرين لرقم الشركة.
  // الشريط لوحة حبر (.lt-ink من tokens.css) بالوضعين (التقييم 2 بند 8)، وزره الأساسي داخلها يطلع فاتح على الحبر.
  // اسم الزر المختصر = نصه الظاهر (WCAG 2.5.3)، ووصفه = نص الزر الكبير (aria-describedby)
  // «عرض تجريبي» بس، بدون نقطة وسطى ولا اسم المحل: الاسم موجود في رأس الصفحة (الاتجاه 2 §3.3). label باقي للتوافق وما يُستخدم
  w.cDemoBar = function (label, key) {
    return '<aside class="c-demo lt-ink" aria-label="عرض تجريبي"><div class="c-demo-in"><span>عرض تجريبي</span>' +
      (key ? '<a class="lt-btn lt-btn--compact" data-wa="' + key + '" aria-describedby="demo-cta-t" hidden><span>أبغى مثله</span></a>' : '') +
      '</div></aside>';
  };
  // آخر العرض (web-copy 2.0 و ر5-2): العنوان والسطر والزر حسب الصفحة، ورابط الرجوع لموقعنا
  w.cOwner = function (title, line, cta, key) {
    var home = (w.ASSETS || '../../assets/').replace(/assets\/$/, '') + 'index.html';
    return '<section class="c-owner" aria-labelledby="owner-h"><h2 id="owner-h">' + title + '</h2>' +
      '<p>' + line + '</p>' +
      '<a class="lt-btn" data-wa="' + key + '" hidden><span id="demo-cta-t">' + esc(cta) + '</span></a>' +
      '<p class="c-owner-back"><a class="lt-link" href="' + esc(home) + '"><span>رجوع لموقع <span data-company>' + esc(companyName()) + '</span></span></a></p></section>';   // النص في span واحد: .lt-link مرن (inline-flex) ويشيل المسافة قبل الاسم
  };
  // «بواسطة لمسة تاب» (components.css: .lt-by): نص بس، ويطلع بس لو poweredBy: true (GM-023). بدون رمز (GM-022)
  w.cBy = function (on) {
    return on === true ? '<p class="lt-by">بواسطة <span data-company>' + esc(companyName()) + '</span></p>' : '';
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
    [].forEach.call(app.querySelectorAll('.lt-btn[data-wa]'), function (a) { waIcon(a); });
    logoFallback(app);
    themeColor();
    // رابط فيه #قسم (مثل #emergency من ستاند الطوارئ): الصفحة تنبني بالسكربت، فالمتصفح ما يلقى القسم وقت ما يدوّر عليه. ننزل له هنا.
    // getElementById بس (ما يمر على محدد CSS)، وداخل الصفحة نفسها بس. بدون حركة (يحترم تقليل الحركة من نفسه)
    var hash = w.location.hash.slice(1);
    if (hash) {
      try { hash = decodeURIComponent(hash); } catch (e) { /* يبقى كما هو */ }
      var target = d.getElementById(hash);
      if (target && app.contains(target)) target.scrollIntoView();
    }
    if (w.matchMedia) {
      var mq = w.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', themeColor);
    }
    return app;
  };
})(window, document);
