// أدوات مشتركة خفيفة لكل صفحات website/: اسم الشركة، أزرار الواتساب، روابط التليجرام، روابط السياسات، النسخ، canonical.
// بدون أي طلب خارجي ولا fetch()، وكل شي يشتغل من file://.
(function (d, w) {
  var S = w.SITE || {}, NAME = 'لمسة تاب';
  // GM-070: صفحات الشركة الإنجليزية (<html lang="en">) تاخذ الاسم والرسائل الإنجليزية. كل صفحة عربية (والزبون) زي ما هي
  var EN = /^en\b/i.test(String((d.documentElement && d.documentElement.lang) || ''));
  w.LT_EN = EN;
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
  // رسالة من config (SITE.waText)، و{unitRef} ينعوض. الصفحة الإنجليزية تاخذ <key>En، ولو فاضي ترجع للعربي (GM-070)
  w.waText = function (key, unitRef) {
    var M = S.waText || {}, t = EN && typeof M[key + 'En'] === 'string' && str(M[key + 'En']) ? M[key + 'En'] : M[key];
    t = typeof t === 'string' ? t : '';
    return unitRef == null ? t : t.split('{unitRef}').join(unitRef);
  };

  // اسم الشركة: [data-company] نص، [data-company-alt] نص بديل للشعار، والعنوان إذا فيه الاسم الاحتياطي
  w.fillCompany = function () {
    var n = companyName(), en = str(S.companyNameEn), registration = str(S.commercialRegistration);
    all('[data-company]').forEach(function (el) { el.textContent = EN ? (en || 'LamsaTap') : n; });
    all('[data-company-en]').forEach(function (el) { el.textContent = en || 'LamsaTap'; });
    all('[data-company-alt]').forEach(function (el) { el.alt = EN ? (en || 'LamsaTap') : (en ? n + ' — ' + en : n); });
    all('[data-commercial-registration]').forEach(function (el) {
      el.textContent = registration ? (EN ? 'CR No. ' : 'السجل التجاري: ') + registration : '';
      el.hidden = !registration;
    });
    if (!EN && n !== NAME) d.title = d.title.split(NAME).join(n);
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
    // «فيه طريقة تواصل» = رقم واتساب، أو بوت تليجرام لما الرقم فاضي (AD-34 و AD-35):
    //   [data-wa-empty] («الرقم ينضاف قريباً») يطلع بس لما ما فيه ولا قناة.
    //   [data-wa-only] (سطر المخاطرة وأمثاله) يطلع مع أي قناة، لأنه يشرح الزر اللي فوقه (واتساب أو تليجرام).
    //   [data-wa-second]: الزر الثاني ثانوي لما فيه زر تواصل أساسي، عشان زر أساسي واحد لكل شاشة.
    var contact = !!num || !!tgUser(S.telegram);
    all('[data-wa-empty]').forEach(function (el) { el.hidden = contact; });
    all('[data-wa-only]').forEach(function (el) { el.hidden = !contact; });
    all('[data-wa-second]').forEach(function (el) { el.classList.toggle('lt-btn--secondary', contact); });
    // اسم القناة في النص (مثل «نتفاهم على واتساب»): [data-channel-name] يصير «تليجرام» لما الرقم فاضي والبوت موجود
    all('[data-channel-name]').forEach(function (el) {
      if (el.__wa == null) el.__wa = el.textContent;
      el.textContent = (!num && tgUser(S.telegram)) ? (EN ? 'Telegram' : 'تليجرام') : el.__wa;
    });
  };

  // التليجرام (GM-047، وإشعار المحامي بند 34): اليوزر من config.js بدون @ (telegram للبوت، telegramChannel للقناة)،
  // والرابط ينبني https://t.me/<يوزر>. الفاضي (أو الغلط) يخفي الرابط، مثل الواتساب. ولا يوزر مكتوب داخل الصفحات.
  // [data-tg]: مجموعة «أو كلّمنا على تليجرام» وإشعارها تحتها. تطلع بس لو يوزر البوت موجود.
  //   [data-tg="with-wa"]: زر واضح بنفس رتبة زر واتساب، حتى مع وجود الرقم.
  // [data-tg-link]: رابط محادثة البوت. [data-tg-channel]: رابط القناة (التذييل)، ويختفي لو القناة فاضية.
  w.tgUser = function (v) { v = str(v).replace(/^@/, ''); return /^[A-Za-z0-9_]{5,32}$/.test(v) ? v : ''; };
  w.fillTelegram = function () {
    var bot = tgUser(S.telegram), ch = tgUser(S.telegramChannel), wa = !!waNum(S.whatsapp);
    // قناتا التواصل أزرار متساوية البروز. عند غياب واتساب يبقى ترتيب الزر البديل كما هو.
    all('[data-tg]').forEach(function (el) {
      var withWa = el.getAttribute('data-tg') === 'with-wa', solo = withWa && !wa;
      el.hidden = !bot;
      el.classList.toggle('is-solo', !!(bot && solo));
      el.classList.toggle('is-action', !!(bot && withWa));
      var line = el.querySelector('.s-tg-line'), first = line && line.firstChild;
      if (first && first.nodeType === 3) {
        if (first.__or == null) first.__or = first.textContent;
        first.textContent = withWa ? '' : first.__or;
      }
      var link = el.querySelector('[data-tg-link]');
      if (link) {
        link.classList.toggle('lt-btn', !!(bot && withWa));
        // الرتبة: data-tg-rank="secondary" على المجموعة (بطاقة 5 وحدات، أو «اسأل إنسان» اللي يبان مع الخاتمة) = زر بإطار
        link.classList.toggle('lt-btn--secondary', !!(bot && withWa) && el.getAttribute('data-tg-rank') === 'secondary');
        if (bot && withWa) waIcon(link);
      }
    });
    all('[data-tg-link]').forEach(function (a) {
      if (bot) { a.href = 'https://t.me/' + bot; a.hidden = false; } else { a.removeAttribute('href'); a.hidden = true; }
    });
    all('[data-tg-channel]').forEach(function (a) {
      if (ch) { a.href = 'https://t.me/' + ch; a.hidden = false; } else { a.removeAttribute('href'); a.hidden = true; }
    });
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

  // canonical و og:url من config.domain (بس للصفحة اللي عليها <html data-canonical="<المسار>">: البوابة "/"، و"/restaurants/" و"/hosts/")
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
        btn.textContent = EN ? 'Copied' : 'تم النسخ';
        clearTimeout(timer);
        timer = setTimeout(function () { btn.textContent = label; }, 2000);
      });
    });
  };

  // ===== مفتاح الأسعار (web-copy «مفتاح الأسعار» أ و ب و ج و د، ومرجع صاحب المشروع brief-gm040.md) =====
  // [data-price-switch]: role="radiogroup" فيه أزرار role="radio" لكل واحد data-value (مثل month و year، أو first و renew).
  // النطاق: أقرب [data-price-scope] (أو الصفحة). داخله:
  //   [data-roll]: رقم يتدحرج بالخانات، قيمته من data-<القيمة> (aria-hidden، ومكانه نص مخفي [data-swap])
  //   [data-swap]: نصه يصير data-<القيمة> (السعر المقروء كامل، والوحدة «للوحدة بالشهر / بالسنة»). بدون aria-live (ج)
  //   [data-when="<القيمة>"]: يطلع بس مع هالقيمة
  // الكيبورد: الأسهم تنقل الاختيار والتركيز (RTL: اليسار = التالي)، و Home و End، والمختار بس في ترتيب Tab (roving tabindex).
  // تقليل الحركة: الرقم يتبدل مباشر (بدون transition في site.css، وهنا بدون تدحرج). بدون JS: .s-period ما يطلع (site.css)
  var DIG = '<span class="s-roll-col" aria-hidden="true">' + '0123456789'.split('').map(function (n) { return '<span>' + n + '</span>'; }).join('') + '</span>';
  // AD-32 (مرجع صاحب المشروع NumberFlow): الخانة الجديدة (ما لها خانة قديمة بنفس المكان من اليمين) تدخل من تحت بالشفافية، والإخوة
  // (الوحدة «ريال…») تنزلق من مكانها القديم لمكانها الجديد بطريقة FLIP بدل ما تنط لما الرقم يوسع أو يضيق. transform و opacity بس
  var EASE = 'var(--m-out, cubic-bezier(.16, 1, .3, 1))';
  function roll(el, next, anim) {
    var prev = el.getAttribute('data-now') || el.textContent.trim(), cols = [];
    next = String(next == null ? '' : next);
    var sibs = anim && el.parentNode ? [].filter.call(el.parentNode.children, function (s) { return s !== el && !s.classList.contains('s-sr'); }) : [];
    var before = sibs.map(function (s) { var r = s.getBoundingClientRect(); return [r.left, r.top]; });   // المكان الظاهر الحين (حتى لو في نص انزلاق)
    el.setAttribute('data-now', next);
    el.innerHTML = next.split('').map(function (ch, i) {
      var j = prev.length - (next.length - i), pc = j < 0 ? '' : prev.charAt(j);   // نفس الخانة من اليمين (الآحاد مع الآحاد)
      var add = anim && prev && (j < 0 || !/\d/.test(pc) && pc !== ch) ? ' data-in' : '';
      if (!/\d/.test(ch)) return '<span class="s-roll-s"' + add + '>' + esc(ch) + '</span>';
      cols.push([+ch, +ch]);   // الخانة تبدأ على قيمتها النهائية (بدون تدحرج)
      return '<span class="s-roll-d"' + add + '><span class="s-roll-g">' + ch + '</span>' + DIG + '</span>';
    }).join('');
    var list = all('.s-roll-col', el), ins = all('[data-in]', el);
    list.forEach(function (c, i) { c.style.transition = 'none'; c.style.transform = 'translateY(' + (-10 * cols[i][0]) + '%)'; });
    if (el._fade) { try { el._fade.cancel(); } catch (e) {} el._fade = null; }
    if (!anim) {
      // A preference change can happen after a previous FLIP animation.
      // Clear its sibling styles too, including an animation still in flight.
      if (el.parentNode) [].forEach.call(el.parentNode.children, function (s) {
        if (s === el || s.classList.contains('s-sr')) return;
        s.style.transition = 'none'; s.style.transform = '';
      });
      return;
    }
    // anim-micro 2026-09-30 (brief §3 و§6.5): بدون تدحرج ولا عدّ. الرقم الجديد مكتوب على طول، ويظهر من .4 لين 1 في 150ms
    // (ما يصير فاضي أبداً). الضغط السريع يلغي الظهور اللي قبله، والحالة النهائية صريحة (بدون transitionend)
    list.forEach(function (c) { c.style.transition = ''; });
    sibs.forEach(function (s) { s.style.transition = 'none'; s.style.transform = ''; });
    ins.forEach(function (n) { n.removeAttribute('data-in'); });
    if (el.animate) el._fade = el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
  }
  w.initPriceSwitch = function () {
    all('[data-price-switch]').forEach(function (sw) {
      var scope = sw.closest('[data-price-scope]') || d, opts = all('[role="radio"]', sw);
      if (!opts.length) return;
      function set(i, anim) {
        var calm = !w.matchMedia || w.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var k = opts[i].getAttribute('data-value');
        opts.forEach(function (o, j) { o.setAttribute('aria-checked', j === i ? 'true' : 'false'); o.tabIndex = j === i ? 0 : -1; });
        sw.setAttribute('data-on', String(i));
        all('[data-roll]', scope).forEach(function (el) { var v = el.getAttribute('data-' + k); if (v != null) roll(el, v, anim && !calm); });
        all('[data-swap]', scope).forEach(function (el) { var v = el.getAttribute('data-' + k); if (v != null) el.textContent = v; });
        all('[data-when]', scope).forEach(function (el) { el.hidden = el.getAttribute('data-when') !== k; });
      }
      function cur() { for (var j = 0; j < opts.length; j++) if (opts[j].getAttribute('aria-checked') === 'true') return j; return 0; }
      opts.forEach(function (o, i) {
        o.addEventListener('click', function () { if (i !== cur()) set(i, true); });
        o.addEventListener('keydown', function (e) {
          if (e.altKey || e.ctrlKey || e.metaKey) return;
          var n = opts.length, rtl = getComputedStyle(sw).direction === 'rtl', j = null;
          if (e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) j = (i + 1) % n;
          else if (e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) j = (i - 1 + n) % n;
          else if (e.key === 'Home') j = 0;
          else if (e.key === 'End') j = n - 1;
          else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (i !== cur()) set(i, true); return; }
          if (j === null) return;
          e.preventDefault(); set(j, true); opts[j].focus();
        });
      });
      set(cur(), false);
      // Keep both prices readable until this particular control is working.
      var period = sw.closest('.s-period');
      if (period) period.classList.add('is-price-ready');
      if (scope.classList) scope.classList.add('is-price-ready');
    });
  };

  // الرأس الثابت عائم وقت التمرير (GM-055): .s-top.is-stuck لما الصفحة نازلة عن أولها (الظل من --lt-elev-float في site.css)
  w.initHeader = function () {
    var top = d.querySelector('.s-top'), on = null, tick = false;
    if (!top) return;
    function upd() { tick = false; var s = (w.scrollY || w.pageYOffset || 0) > 0; if (s !== on) { on = s; top.classList.toggle('is-stuck', s); } }
    w.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  };

  // أدوات صفحات الزبون (الهوية، اللوحات، الواي فاي، طبقة العرض) في assets/client.js

  // سفاري آيفون ما يطبّق :active (لون الضغط) إلا إذا الصفحة فيها مستمع touchstart
  d.addEventListener('touchstart', function () {}, { passive: true });

  d.addEventListener('DOMContentLoaded', function () { fillCompany(); fillWhatsapp(); fillTelegram(); fillLinks(); fillCanonical(); initPriceSwitch(); initHeader(); });
})(document, window);
