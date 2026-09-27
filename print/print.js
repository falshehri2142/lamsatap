// أدوات مشتركة لقوالب الطباعة (print/stand/ و print/host-stickers/). أداة داخلية، مو صفحة منشورة (GM-023 بند 3).
// كل المقاسات من print/dims.js بالمليمتر. بدون أي طلب خارجي، ويشتغل من file://.
// بهوية العميل: بدون شعار لمسة تاب ولا زعفرانها ولا أي لون من ألوانها (GM-023 و GM-025)، إلا سطر «بواسطة» الاختياري.
(function (w, d) {
  var BLACK = '#000000', WHITE = '#FFFFFF';   // الطباعة: النص والباركود أسود K100 على أبيض (الموجز §6 و §4.5)

  w.$p = function (id) { return d.getElementById(id); };
  w.escP = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  function s(v) { return String(v == null ? '' : v).trim(); }

  // ملف العميل: ?client=<اسم> ← clients/<اسم>.js (script عادي يشتغل من file://). الاسم حروف وأرقام وشرطة بس
  w.loadClient = function (fallback, cb) {
    var m = /[?&]client=([\w-]+)/.exec(location.search), id = m ? m[1] : fallback, el = d.createElement('script');
    el.src = 'clients/' + id + '.js';
    el.onload = function () { cb(id, true); };
    el.onerror = function () { cb(id, false); };
    d.body.appendChild(el);
  };

  // تباين WCAG مع الأبيض: علامة اللمس بلون المحل لو 3 أو أكثر، وإلا أسود (الموجز §6)
  function lum(h) {
    h = h.replace('#', '');
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  w.validColor = function (h) { return /^#[0-9A-Fa-f]{6}$/.test(s(h)); };
  w.dotColor = function (brand, mono) {
    var c = s((brand || {}).color);
    if (mono || !validColor(c)) return BLACK;
    return (1.05 / (lum(c) + 0.05)) >= 3 ? c : BLACK;
  };

  // علامة مكان اللمس (GM-027): نقطة مصمتة. المسار نفسه من website/assets/illustrations/touch-mark.svg (web-illustrator)،
  // inline عشان تاخذ لون المحل (currentColor). في الحفر أسود مثل touch-mark-engrave.svg
  w.touchMark = function (color, sizeMM, top, left) {
    return '<svg class="p-el p-mark" viewBox="0 0 14 14" width="' + sizeMM + 'mm" height="' + sizeMM + 'mm" style="top:' + top + ';left:' + left + ';color:' + color +
      '" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 7a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z"/></svg>';
  };

  // الشعار: ملف محلي بس (SVG أو PNG). بدونه: اسم المحل شعار كتابي بدون لوح (GM-027، والتقييم 1 بند 6)
  w.localLogo = function (p) {
    p = s(p);
    return /^(?![a-z][a-z0-9+.-]*:)(?!\/\/)[^\s"'<>]+\.(svg|png)$/i.test(p) ? p : '';
  };
  w.logoHtml = function (brand, mono) {
    var logo = localLogo((brand || {}).logo), name = s((brand || {}).name);
    if (logo) return '<img class="p-logo" src="' + escP(logo) + '" alt="' + escP(name) + '">';
    return name ? '<span class="p-name">' + escP(name) + '</span>' : '';
  };
  // ينتظر خط الهوية (Readex Pro، محلي) قبل أي قياس للنص
  w.afterFont = function (cb) {
    if (!d.fonts || !d.fonts.load) return cb();
    Promise.all([d.fonts.load('600 16px "Readex Pro"', 'قيّم'), d.fonts.load('500 16px "Readex Pro"', 'قرّب')]).then(cb, cb);
  };
  // عرض النص نفسه (Range)، مو عرض الصندوق: يكشف الطول الزايد بدون ما نقص النص (القص كان ياكل نقاط الياء، التقييم 1 بند 5)
  function inkW(el) { var r = d.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; }
  w.overflowsP = function (el) { return !!el && inkW(el) > el.clientWidth + 0.5; };
  // سطر واحد: يصغر من fromPt لين minPt لين يدخل عرضه
  w.fitText = function (el, fromPt, minPt) {
    if (!el) return;
    for (var pt = fromPt; pt >= minPt; pt -= 0.5) {
      el.style.fontSize = pt + 'pt';
      if (!overflowsP(el)) return pt;
    }
    return minPt;
  };
  // اسم المحل بدون شعار: أكبر حجم من maxPt لين minPt يدخل في maxLines سطر وداخل صندوق الشعار.
  // يرجّع الحجم، أو 0 لو ما دخل حتى بأقل حجم (ويبقى على أقل حجم، والقالب ينبّه)
  w.fitName = function (el, maxPt, minPt, maxLines) {
    if (!el) return -1;
    var box = el.parentNode;
    for (var pt = maxPt; pt >= minPt; pt -= 0.5) {
      el.style.fontSize = pt + 'pt';
      var lh = parseFloat(getComputedStyle(el).lineHeight), h = el.offsetHeight;
      if (Math.round(h / lh) <= maxLines && h <= box.clientHeight + 0.5 && !overflowsP(el)) return pt;
    }
    el.style.fontSize = minPt + 'pt';
    return 0;
  };

  // الباركود من المكتبة المحلية (website/vendor/qrcode-generator.js)، تصحيح M، أسود على أبيض.
  // sizeMM = مقاس المربع بدون المسافة الهادئة، و quiet = عدد وحدات المسافة الهادئة من كل جهة
  w.qrSvg = function (url, sizeMM, quiet) {
    if (typeof qrcode !== 'function' || !s(url)) return null;
    var q = qrcode(0, 'M'); q.addData(s(url)); q.make();
    var n = q.getModuleCount(), cell = sizeMM / n, total = n + 2 * quiet, path = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
    return {
      html: '<svg class="p-qr-svg" viewBox="0 0 ' + total + ' ' + total + '" width="' + (total * cell).toFixed(2) + 'mm" height="' + (total * cell).toFixed(2) +
        'mm" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect width="' + total + '" height="' + total + '" fill="' + WHITE + '"/><path fill="' + BLACK + '" d="' + path + '"/></svg>',
      moduleMM: cell, quietMM: quiet * cell, totalMM: total * cell, modules: n
    };
  };

  // شريط المعاينة (على الشاشة بس، ما ينطبع): النسخة، وحدود الأمان، والتنبيهات (web-copy §3)
  w.previewBar = function (opts) {
    var bar = $p('p-bar');
    bar.innerHTML =
      '<p class="p-bar-h">' + escP(opts.title) + '</p>' +
      '<div class="p-bar-acts">' +
      '<button type="button" id="p-variant">' + (opts.mono ? 'اعرض الملوّن' : 'اعرض نسخة الحفر') + '</button>' +
      '<button type="button" id="p-safe" aria-pressed="false">أظهر حدود الأمان</button>' +
      '<button type="button" id="p-print">اطبع</button></div>' +
      (opts.warnings.length ? '<ul class="p-warn" role="status">' + opts.warnings.map(function (x) { return '<li>' + escP(x) + '</li>'; }).join('') + '</ul>' : '');
    $p('p-safe').addEventListener('click', function () {
      var on = d.body.classList.toggle('show-safe');
      this.textContent = on ? 'أخفِ حدود الأمان' : 'أظهر حدود الأمان';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $p('p-print').addEventListener('click', function () { w.print(); });
    $p('p-variant').addEventListener('click', function () {
      var u = new URL(location.href);
      if (opts.mono) u.searchParams.delete('mono'); else u.searchParams.set('mono', '1');
      location.href = u.href;
    });
  };
  w.isMono = function () { return /[?&]mono=1/.test(location.search); };
  w.companyNameP = function () { return s((w.SITE || {}).companyName) || 'لمسة تاب'; };
})(window, document);
