// أدوات مشتركة خفيفة لكل صفحات website/: اسم الشركة، أزرار الواتساب، النسخ، canonical.
// بدون أي طلب خارجي ولا fetch()، وكل شي يشتغل من file://.
(function (d, w) {
  var S = w.SITE || {}, NAME = 'لمسة تاب';
  // مجلد assets/ محسوب من مكان هذا الملف، عشان الصفحات تشتغل على أي عمق مجلد
  var me = d.currentScript && d.currentScript.getAttribute('src');
  w.ASSETS = me ? me.replace(/app\.js(\?.*)?$/, '') : 'assets/';

  // أيقونة المحادثة حقتنا، مو شعار واتساب (web-brand.md §3). على شبكة 20 وخط 1.75 مثل باقي الأيقونات (موجز §3.3)،
  // المسار من مجموعة web-illustrator (illustrations-src/build_illustrations.py). للواتساب بس.
  var ICON = '<svg class="lt-btn-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8A3.5 3.5 0 0 1 17.5 7v4A3.5 3.5 0 0 1 14 14.5v2.8L10.6 14.5H6A3.5 3.5 0 0 1 2.5 11V7A3.5 3.5 0 0 1 6 3.5z"/><path d="M6.6 9h.01M10 9h.01M13.4 9h.01" stroke-width="2.3"/></svg>';

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
    if (!el.querySelector('.lt-btn-icon')) el.insertAdjacentHTML('afterbegin', ICON);
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
    all('[data-company-en]').forEach(function (el) { el.textContent = en || 'LamsaTap'; });
    all('[data-company-alt]').forEach(function (el) { el.alt = en ? n + ' — ' + en : n; });
    if (n !== NAME) d.title = d.title.split(NAME).join(n);
  };

  // أزرار واتساب الشركة: [data-wa="<مفتاح في waText>"]. بدون رقم: hidden، مو زر معطّل (GM-010، web-ux ر4-4)
  // [data-wa-empty]: سطر يطلع بدالها لما الرقم فاضي (الرئيسية بس). [data-wa-only]: قسم يطلع بس مع الرقم
  w.fillWhatsapp = function () {
    var num = waNum(S.whatsapp);
    all('[data-wa]').forEach(function (a) {
      if (num) {
        a.href = waHref(num, waText(a.getAttribute('data-wa')));
        a.hidden = false;
        if (a.classList.contains('lt-btn')) waIcon(a);   // الأزرار بس. الروابط المستقلة (.lt-link) بدون أيقونة
      } else {
        a.removeAttribute('href');
        a.hidden = true;
      }
    });
    all('[data-wa-empty]').forEach(function (el) { el.hidden = !!num; });
    all('[data-wa-only]').forEach(function (el) { el.hidden = !num; });
    // زوج الأزرار (الاتجاه 2 §3.5): الزر الثاني ثانوي بس لما زر الواتساب ظاهر. بدون رقم يبقى بشكل الأساسي، عشان ما يبان ناقص
    all('[data-wa-second]').forEach(function (el) { el.classList.toggle('lt-btn--secondary', !!num); });
  };

  // العبارة المتبدلة في h1 (الاتجاه 2 §3.8): التوقيت في home.css (CSS بس، وتقف عند 3.8 ثانية).
  // أي تمرير أو تركيز أو لمس داخل البطل يقفز للعبارة الأخيرة على طول (interruptible)
  w.bindRotator = function () {
    var rot = d.querySelector('.h-rot'), hero = rot && rot.closest('section');
    if (!hero) return;
    function end() {
      rot.classList.add('is-end');
      ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { hero.removeEventListener(t, end); });
    }
    ['pointerover', 'focusin', 'touchstart'].forEach(function (t) { hero.addEventListener(t, end, { passive: true }); });
  };

  // روابط السياسات في الذيل (التقييم 2 بند 7): [data-link="privacy|terms"] يطلع بس لو رابطه https في config.js (SITE.links)،
  // وإلا يبقى مخفي. مثل أزرار الواتساب: ولا رابط يودّي لـ #
  w.fillLinks = function () {
    var L = S.links || {};
    all('[data-link]').forEach(function (a) {
      var u = str(L[a.getAttribute('data-link')]);
      if (/^https:\/\/[^\s"'<>]+$/.test(u)) { a.href = u; a.hidden = false; }
      else { a.removeAttribute('href'); a.hidden = true; }
    });
  };

  // canonical و og:url من config.domain (بس للصفحة اللي عليها <html data-canonical="<المسار>">، يعني الرئيسية)
  w.fillCanonical = function () {
    var p = d.documentElement.getAttribute('data-canonical'), dom = str(S.domain).replace(/\/+$/, ''), url, el;
    if (p == null || !/^https:\/\//.test(dom)) return;
    url = dom + p;
    el = d.querySelector('link[rel="canonical"]') || d.head.appendChild(d.createElement('link'));
    el.rel = 'canonical';
    el.href = url;
    el = d.querySelector('meta[property="og:url"]') || d.head.appendChild(d.createElement('meta'));
    el.setAttribute('property', 'og:url');
    el.content = url;
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

  // أدوات صفحات الزبون (الهوية، اللوحات، الواي فاي، طبقة العرض) في assets/client.js

  // سفاري آيفون ما يطبّق :active (لون الضغط) إلا إذا الصفحة فيها مستمع touchstart
  d.addEventListener('touchstart', function () {}, { passive: true });

  d.addEventListener('DOMContentLoaded', function () { fillCompany(); fillWhatsapp(); fillLinks(); fillCanonical(); bindRotator(); });
})(document, window);
