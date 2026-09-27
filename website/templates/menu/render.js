// المنيو: المنطق كله هنا. يستخدمه القالب (templates/menu/) ونسخة العرض (demo/menu/)، والرئيسية للشاشة المصغرة.
// المواصفة: موجز المدير الفني §5.7 (المنيو) + web-ux ر3-4 و ر4. الصنف سطرين: الاسم والسعر، وتحته «الوصف · السعرات: {cal}».
(function (w) {
  var R = w.LT_RENDER = w.LT_RENDER || {};

  // D = MENU_DATA. o = { p: بادئة IDs، mini: شاشة مصغرة بدون تفاعل ولا طبقة العرض }
  R.menu = function (D, o) {
    D = D || {}; o = o || {};
    var p = o.p || '', demo = D.demo === true && !o.mini, name = str(D.name), h = [];
    var brand = cBrand(D.brand, name);
    var secs = (Array.isArray(D.sections) ? D.sections : []).filter(function (s) { return s && Array.isArray(s.items) && s.items.length; });
    var sid = function (s, i) { var x = String(s.id || '').replace(/[^\w-]/g, ''); return p + 's' + i + (x ? '-' + x : ''); };

    h.push(cIdentity(brand));
    h.push('<h1 class="c-sr">' + esc((name ? name + ' — ' : '') + 'المنيو') + '</h1>');
    if (str(D.note)) h.push('<p class="c-sub m-note">' + esc(D.note) + '</p>');
    // شريط الأقسام: نص مو حبوب، والنشط خط 2px بلون المحل. يطلع بس مع قسمين أو أكثر
    if (secs.length > 1) h.push('<nav class="m-tabs" aria-label="أقسام المنيو"><div class="m-tabs-in">' +
      secs.map(function (s, i) { return '<a href="#' + sid(s, i) + '"' + (i ? '' : ' aria-current="true"') + '>' + esc(s.title) + '</a>'; }).join('') + '</div></nav>');
    secs.forEach(function (s, i) {
      var id = sid(s, i);
      h.push('<section class="m-sec" id="' + id + '" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h">' + esc(s.title) + '</h2>' +
        cPanel(s.items.map(function (it) {
          it = it || {};
          var price = str(it.price), meta = [str(it.desc), str(it.cal) ? 'السعرات: ' + esc(str(it.cal)) : ''];
          meta[0] = esc(meta[0]);
          meta = meta.filter(Boolean).join(' · ');
          return cRow({ cls: 'm-item', html: '<span class="m-top"><span class="m-name">' + esc(it.name) + '</span>' +
            (price ? '<span class="m-price c-num">' + esc(price) + '</span>' : '') + '</span>' +
            (meta ? '<span class="c-sub m-meta">' + meta + '</span>' : '') });
        })) + '</section>');
    });
    // صفحة عميل: واتساب المحل زر أساسي آخر المنيو. العرض: قسم «لصاحب المحل» حقنا
    if (!D.demo && !o.mini) { var wa = cShopWa(D, 'c-btn'); if (wa) h.push('<div class="m-wa">' + wa + '</div>'); }
    if (demo) h.push(cOwner('لصاحب المحل', 'هذي الصفحة اللي يشوفها زبونك لما يقرّب جواله من الستاند أو يمسح الباركود. ونسويها بشعار محلك وألوانه.', 'أبغى منيو مثله لمحلي', 'demoMenu'));

    return {
      title: (name ? name + ' — ' : '') + 'المنيو',
      bar: demo ? cDemoBar(name || 'منيو مثال', 'demoMenu') : '',
      html: h.join(''), brand: brand, poweredBy: D.poweredBy,
      bind: function () { bindTabs(p); }
    };
  };

  // التبويب النشط يتبع التمرير (IntersectionObserver) والضغط. القفز فوري بدون تمرير ناعم (GM-011)
  function bindTabs(p) {
    var nav = document.querySelector('.m-tabs'), strip = nav && nav.querySelector('.m-tabs-in');
    if (!strip) return;
    var tabs = [].slice.call(strip.querySelectorAll('a'));
    var set = function (id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('href') === '#' + id;
        if (on) { t.setAttribute('aria-current', 'true'); keepVisible(strip, t); } else t.removeAttribute('aria-current');
      });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { set(t.getAttribute('href').slice(1)); }); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) set(e.target.id); });
      }, { rootMargin: '-64px 0px -70% 0px' });
      [].forEach.call(document.querySelectorAll('.m-sec'), function (s) { io.observe(s); });
    }
    // تلاشي 24px على الطرف اللي فيه باقي تبويبات (يدل على شي، مو زينة)
    var fade = function () {
      var max = strip.scrollWidth - strip.clientWidth, x = Math.abs(strip.scrollLeft);
      nav.classList.toggle('is-more-end', max - x > 2);
      nav.classList.toggle('is-more-start', x > 2);
    };
    strip.addEventListener('scroll', fade, { passive: true });
    window.addEventListener('resize', fade);
    fade();
  }
  function keepVisible(strip, t) {
    var s = strip.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.left < s.left) strip.scrollLeft -= s.left - r.left + 24;
    else if (r.right > s.right) strip.scrollLeft += r.right - s.right + 24;
  }

  if (!w.LT_NO_MOUNT && document.getElementById('app')) {
    var D = w.MENU_DATA || {}, r = R.menu(D, {});
    applyShop(r.brand);
    document.title = r.title;
    cMount(r.bar, r.html, r.poweredBy);
    r.bind();
  }
})(window);
