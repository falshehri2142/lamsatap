// إدارة المطعم: صفحة الزبون (عرض). المنطق كله هنا، والتخزين والربط في store.js.
// بدون أي طلب شبكة. السلة وطلبات هذي الجلسة في sessionStorage (تبقى لو حدّث الصفحة).
(function (w, d) {
  var S = w.LT_ORDER, $ = function (i) { return d.getElementById(i); };
  var TABLE = 7;
  var COUNTER = /[?&]counter=1\b/.test(location.search);   // كافيه بدون نادل: الاستلام من الكاشير برقم الطلب
  var CART_KEY = 'lt-order-cart', MINE_KEY = 'lt-order-mine';
  var D = w.MENU_DATA || {}, items = S.catalog();
  var esc = w.esc || function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };

  if (w.applyShop) w.applyShop(D.brand);

  // ===== الحالة المحلية =====
  function load(k, def) { try { var v = JSON.parse(sessionStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function save(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } }
  var cart = load(CART_KEY, []);          // [{ key, id, qty, note }]
  var mine = load(MINE_KEY, { orders: [], calls: [] });
  var state = S.read();
  function byId(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function sold(id) { return state.soldOut.indexOf(id) !== -1; }
  function cartLive() { return cart.filter(function (c) { return byId(c.id) && !sold(c.id); }); }
  function totals() {
    var n = 0, sum = 0;
    cartLive().forEach(function (c) { n += c.qty; sum += c.qty * byId(c.id).price; });
    return { n: n, sum: sum };
  }
  function qtyOf(id) { var n = 0; cart.forEach(function (c) { if (c.id === id) n += c.qty; }); return n; }
  function say(t) { var a = $('o-announce'); a.textContent = ''; setTimeout(function () { a.textContent = t; }, 30); }

  // ===== المنيو: أقسام بتبويبات (نفس شكل demo/menu)، والصف كله زر يفتح ورقة الصنف =====
  // الهيكل ينبني مرة وحدة، وبعدها updateMenu() يحدّث نهاية كل صف بس (الكمية و«خلص»)، عشان التركيز والمراقب ما يضيعون
  function renderMenu() {
    var secs = (D.sections || []).filter(function (s) { return s && s.items && s.items.length; });
    var h = [];
    h.push('<nav class="m-tabs" aria-label="أقسام المنيو"><div class="m-tabs-in">' + secs.map(function (s, i) {
      return '<a class="m-tab" href="#sec-' + esc(s.id) + '"' + (i ? '' : ' aria-current="true"') + '>' + esc(s.title) + '</a>';
    }).join('') + '</div></nav>');
    secs.forEach(function (s) {
      h.push('<section class="m-sec o-sec" id="sec-' + esc(s.id) + '" aria-labelledby="sec-' + esc(s.id) + '-h"><h2 id="sec-' + esc(s.id) + '-h">' + esc(s.title) + '</h2><div class="lt-panel o-list">');
      items.filter(function (it) { return it.sec === s.id; }).forEach(function (it) {
        h.push('<button type="button" class="lt-row o-item" data-id="' + esc(it.id) + '">' +
          '<span class="lt-row-body"><span class="lt-row-title">' + esc(it.name) + '</span>' +
          (it.desc ? '<span class="lt-row-sub">' + esc(it.desc) + '</span>' : '') +
          (it.cal ? '<span class="lt-row-sub o-cal">' + esc(it.cal) + ' سعرة حرارية</span>' : '') + '</span>' +
          '<span class="o-item-end"></span></button>');
      });
      h.push('</div></section>');
    });
    $('o-menu').innerHTML = h.join('');
  }
  function updateMenu() {
    [].forEach.call(d.querySelectorAll('.o-item'), function (b) {
      var id = b.getAttribute('data-id'), it = byId(id), out = sold(id), q = qtyOf(id);
      var key = (out ? 'x' : '') + q;
      if (b.getAttribute('data-k') === key) return;
      b.setAttribute('data-k', key);
      b.hidden = out;   // «خلص» من شاشة المطعم: الصنف يختفي من المنيو
      b.querySelector('.o-item-end').innerHTML = '<span class="o-price">' + S.sar(it.price) + '</span>' +
        (q ? '<span class="o-in"><span class="c-sr">في السلة </span>' + q + '</span>' : '<span class="o-plus" aria-hidden="true">+</span>');
    });
    // قسم خلص كله: سطر بداله، عشان العنوان ما يبقى فاضي
    [].forEach.call(d.querySelectorAll('.o-sec'), function (sec) {
      var left = sec.querySelectorAll('.o-item:not([hidden])').length, n = sec.querySelector('.o-sec-out');
      if (!left && !n) sec.insertAdjacentHTML('beforeend', '<p class="c-sub o-sec-out">خلص كل اللي في هالقسم اليوم.</p>');
      if (left && n) n.remove();
    });
  }
  // التبويب النشط يتبع التمرير. القفز فوري (بدون تمرير ناعم)
  function bindTabs() {
    var tabs = [].slice.call(d.querySelectorAll('.m-tab'));
    function set(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('href') === '#' + id;
        if (on) { t.setAttribute('aria-current', 'true'); keep(t); } else t.removeAttribute('aria-current');
      });
    }
    // التبويب النشط يبقى ظاهر داخل الشريط (بدون تحريك الصفحة)
    function keep(t) {
      var strip = t.parentNode, a = t.getBoundingClientRect(), b = strip.getBoundingClientRect();
      if (a.left < b.left) strip.scrollLeft -= (b.left - a.left) + 24;
      else if (a.right > b.right) strip.scrollLeft += (a.right - b.right) + 24;
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { set(t.getAttribute('href').slice(1)); }); });
    // أعلى الصفحة: أول قسم دايماً
    w.addEventListener('scroll', function () { if (w.scrollY < 80 && tabs[0]) set(tabs[0].getAttribute('href').slice(1)); }, { passive: true });
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(e.target.id); }); }, { rootMargin: '-64px 0px -70% 0px' });
      [].forEach.call(d.querySelectorAll('.o-sec'), function (s) { io.observe(s); });
    }
  }

  // ===== الأوراق (dialog) =====
  function open(dlg) { if (!dlg.open) { dlg.showModal(); } }
  function close(dlg) { if (dlg.open) dlg.close(); }
  [].forEach.call(d.querySelectorAll('dialog'), function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) close(dlg);                       // ضغط على الخلفية
      if (e.target.closest('[data-close]')) close(dlg);
    });
  });

  // ===== ورقة الصنف =====
  var cur = null, curQty = 1;
  function openItem(id) {
    var it = byId(id); if (!it || sold(id)) return;
    cur = it; curQty = 1;
    $('o-item-h').textContent = it.name;
    $('o-item-desc').textContent = (it.desc ? it.desc + ' · ' : '') + S.sar(it.price);
    $('o-item-note').value = '';
    paintItem();
    open($('o-item'));
  }
  function paintItem() {
    $('o-item-qty').textContent = curQty;
    $('o-item-minus').disabled = curQty <= 1;
    $('o-item-add').innerHTML = '<span>أضف للسلة</span><span class="o-btn-sum">' + S.sar(curQty * cur.price) + '</span>';
  }
  $('o-item-minus').addEventListener('click', function () { if (curQty > 1) { curQty--; paintItem(); } });
  $('o-item-plus').addEventListener('click', function () { if (curQty < 20) { curQty++; paintItem(); } });
  $('o-item-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cur) return;
    var note = $('o-item-note').value.trim().slice(0, 80);
    var same = cart.filter(function (c) { return c.id === cur.id && c.note === note; })[0];
    if (same) same.qty = Math.min(20, same.qty + curQty);
    else cart.push({ key: S.uid(), id: cur.id, qty: curQty, note: note });
    save(CART_KEY, cart);
    close($('o-item'));
    toast('انضاف ' + cur.name + (curQty > 1 ? ' × ' + curQty : '') + ' للسلة');
    paint();
  });

  $('o-menu').addEventListener('click', function (e) {
    var b = e.target.closest('.o-item'); if (!b) return;
    openItem(b.getAttribute('data-id'));
  });

  // ===== السلة =====
  function renderCart() {
    var live = cartLive(), gone = cart.filter(function (c) { return !byId(c.id) || sold(c.id); }), t = totals(), h = [];
    if (!cart.length) {
      h.push('<div class="o-empty"><p>سلتك فاضية.</p><p class="c-sub">اختر من المنيو، أو استدعِ النادل وهو ياخذ طلبك.</p></div>');
      $('o-cart-body').innerHTML = h.join('');
      return;
    }
    h.push('<div class="lt-panel o-lines">');
    cart.forEach(function (c) {
      var it = byId(c.id); if (!it) return;
      var out = sold(c.id);
      h.push('<div class="o-line' + (out ? ' is-out' : '') + '" data-key="' + esc(c.key) + '">' +
        '<div class="o-line-main"><p class="o-line-name">' + esc(it.name) + '</p>' +
        (c.note ? '<p class="o-line-note">' + esc(c.note) + '</p>' : '') +
        (out ? '<p class="o-line-out">خلص اليوم، ما راح يدخل في الطلب</p>' : '') + '</div>' +
        '<div class="o-line-end">' + (out
          ? '<button type="button" class="o-text-btn" data-act="del">شيله</button>'
          : '<div class="o-step o-step--sm" role="group" aria-label="كمية ' + esc(it.name) + '"><button type="button" class="o-step-b" data-act="minus" aria-label="' + (c.qty > 1 ? 'أنقص واحد' : 'شيل ' + esc(it.name)) + '">' + (c.qty > 1 ? '−' : '<svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12M8 6V4.5h4V6M6 6l.7 10h6.6L14 6"/></svg>') + '</button><output>' + c.qty + '</output><button type="button" class="o-step-b" data-act="plus" aria-label="زد واحد">+</button></div>' +
            '<p class="o-line-sum">' + S.sar(c.qty * it.price) + '</p>') +
        '</div></div>');
    });
    h.push('</div>');
    h.push('<div class="o-total"><span>المجموع</span><span class="o-total-n">' + S.sar(t.sum) + '</span></div>');
    h.push('<p class="c-sub o-total-pay">' + (COUNTER ? 'تدفع عند الكاشير وقت الاستلام.' : 'تدفع عند الكاشير أو مع النادل.') + '</p>');
    if (gone.length && !live.length) h.push('<p class="c-sub">كل اللي في سلتك خلص. اختر شي ثاني من المنيو.</p>');
    h.push('<div class="o-choose" role="group" aria-label="كيف ترسل طلبك؟"><p class="c-label">كيف تبغى ترسل طلبك؟</p>');
    h.push('<button type="button" class="lt-btn lt-btn--shop o-send" id="o-send"' + (live.length ? '' : ' disabled') + '><span>' + (COUNTER ? 'أرسل الطلب الآن' : 'أرسل الطلب للمطبخ الآن') + '</span></button>');
    h.push('<p class="c-sub o-choose-sub">' + (COUNTER ? 'نعطيك رقم، واستلم طلبك من الكاشير لما يجهز.' : 'يوصل المطبخ على طول، وتشوف حالته هنا.') + '</p>');
    if (!COUNTER) {
      h.push('<button type="button" class="lt-btn lt-btn--secondary o-send" id="o-waiter-take"><span>خلّ النادل يجي ياخذ طلبي</span></button>');
      h.push('<p class="c-sub o-choose-sub">النادل يجي لطاولتك ومعه طلبك مكتوب، وتعدّل عليه معه.</p>');
    }
    h.push('</div>');
    $('o-cart-body').innerHTML = h.join('');
  }
  $('o-cart-body').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'o-send') return sendOrder();
    if (b.id === 'o-waiter-take') return callWaiter('take_order', true);
    var line = b.closest('.o-line'); if (!line) return;
    var key = line.getAttribute('data-key'), c = cart.filter(function (x) { return x.key === key; })[0]; if (!c) return;
    var act = b.getAttribute('data-act');
    if (act === 'plus') c.qty = Math.min(20, c.qty + 1);
    if (act === 'minus') c.qty -= 1;
    if (act === 'del' || c.qty < 1) cart = cart.filter(function (x) { return x !== c; });
    save(CART_KEY, cart);
    paint();
    // التركيز يرجع لنفس الزر بعد إعادة الرسم
    var again = $('o-cart-body').querySelector('[data-key="' + key + '"] [data-act="' + act + '"]');
    (again || $('o-cart-body').querySelector('button') || $('o-cart')).focus();
  });
  $('o-cart-btn').addEventListener('click', function () { renderCart(); open($('o-cart')); });

  // ===== الإرسال =====
  function lines() {
    return cartLive().map(function (c) { var it = byId(c.id); return { id: c.id, name: it.name, price: it.price, qty: c.qty, note: c.note }; });
  }
  function sendOrder() {
    var L = lines(); if (!L.length) return;
    var t = totals();
    var o = S.mutate(function (s) {
      s.seq = (s.seq || 0) + 1;
      var ord = { id: S.uid(), no: s.seq, table: TABLE, counter: COUNTER, items: L, total: t.sum, status: 'new', t: { created: S.now() } };
      s.orders.push(ord);
      return ord;
    }, { type: 'order' });
    mine.orders.push(o.id); save(MINE_KEY, mine);
    cart = []; save(CART_KEY, cart);
    close($('o-cart'));
    updateMenu(); paintBar();
    showStatus(o.id);
  }
  function callWaiter(reason, withCart) {
    var L = withCart ? lines() : null;
    var c = S.mutate(function (s) {
      // نفس السبب من نفس الطاولة خلال دقيقة وما انرد عليه: نفس البطاقة و«×2» (system.md «التكرار»)
      var dup = s.calls.filter(function (x) { return x.table === TABLE && x.reason === reason && !x.t.acked && S.now() - x.t.created < 60000; })[0];
      if (dup) { dup.count = (dup.count || 1) + 1; if (L) dup.items = L; return dup; }
      var x = { id: S.uid(), table: TABLE, reason: reason, items: L, count: 1, t: { created: S.now() } };
      s.calls.push(x);
      return x;
    }, { type: 'call' });
    if (mine.calls.indexOf(c.id) === -1) { mine.calls.push(c.id); save(MINE_KEY, mine); }
    if (withCart) {
      close($('o-cart'));
      $('o-call-ask').hidden = true; $('o-call-done').hidden = false;
      $('o-call-why').textContent = 'وصله إنك تبغى تطلب، ومعه سلتك مكتوبة. خلّها مثل ما هي لين يجيك.';
      open($('o-call'));
      $('o-call-done').focus();
    } else {
      $('o-call-ask').hidden = true; $('o-call-done').hidden = false;
      $('o-call-why').textContent = 'وصله طلبك: ' + ({ take_order: 'تبغى تطلب', bill: 'الحساب', help: 'مساعدة', water: 'ماي' })[reason] + '.';
      $('o-call-done').focus();
    }
    paint();
  }
  $('o-call-btn').addEventListener('click', function () {
    $('o-call-ask').hidden = false; $('o-call-done').hidden = true;
    open($('o-call'));
  });
  [].forEach.call(d.querySelectorAll('.o-reason'), function (b) {
    b.addEventListener('click', function () { callWaiter(b.getAttribute('data-reason')); });
  });

  // ===== حالة الطلب =====
  var STEPS = ['انستلم', 'يتحضر', 'جاهز'];
  var POS = { new: 0, preparing: 1, ready: 2, served: 3 };
  var viewing = null;
  function headline(o) {
    if (o.status === 'new') return o.counter ? { h: 'وصل طلبك', s: 'ادفع عند الكاشير وقل رقمك ' + o.no + '.' } : { h: 'وصل طلبك للمطعم', s: 'ننتظر الموظف يستلمه.' };
    if (o.status === 'preparing') return { h: 'طلبك يتحضر', s: 'الموظف استلمه والمطبخ شغّال عليه.' };
    if (o.status === 'ready') return o.counter ? { h: 'طلبك جاهز', s: 'استلمه من الكاشير، رقمك ' + o.no + '.' } : { h: 'طلبك جاهز', s: 'النادل جايبه لطاولتك.' };
    return { h: 'بالعافية', s: o.counter ? 'استلمت طلبك.' : 'انسلّم طلبك.' };
  }
  function renderStatus() {
    var o = S.find(state.orders, viewing), box = $('o-status');
    if (!o) { box.innerHTML = '<p>ما لقينا الطلب.</p>'; return; }
    var hl = headline(o);
    var readyS = o.counter ? 'استلمه من الكاشير برقم ' + o.no : 'يوصلك على الطاولة';
    var h = [];
    h.push('<p class="o-st-where">مقهى المثال · ' + (o.counter ? 'استلام من الكاشير' : 'طاولة ' + o.table) + '</p>');
    h.push('<div class="o-st-head"><p class="c-label">' + (o.counter ? 'رقم طلبك' : 'طلب رقم') + '</p><p class="o-st-no">' + o.no + '</p>' +
      '<h1 id="o-st-h" class="o-st-h">' + hl.h + '</h1><p class="c-sub">' + hl.s + '</p></div>');
    h.push('<ol class="lt-panel o-steps" aria-label="حالة الطلب">');
    var cur = POS[o.status] || 0;
    var subs = [
      cur === 0 ? 'ينتظر الموظف يستلمه' : 'الموظف شاف طلبك',
      cur < 1 ? 'المطبخ يبدأ بعد الاستلام' : cur === 1 ? 'المطبخ يجهّزه الحين' : 'خلص تحضيره',
      readyS
    ];
    STEPS.forEach(function (t, i) {
      var done = i < cur || (i === 0 && cur > 0), now = i === cur;
      var cls = done ? 'is-done' : now ? 'is-now' : '';
      h.push('<li class="o-step-i ' + cls + '"' + (now ? ' aria-current="step"' : '') + '><span class="o-dot" aria-hidden="true"></span><span class="o-step-b2"><span class="o-step-t">' + t + '</span>' +
        '<span class="o-step-s">' + subs[i] + '</span></span><span class="c-sr">' + (done ? ' (تم)' : now ? ' (الحين)' : '') + '</span></li>');
    });
    h.push('</ol>');
    h.push('<h2 class="o-st-sub">طلبك</h2><div class="lt-panel o-lines">' + o.items.map(function (l) {
      return '<div class="o-line"><div class="o-line-main"><p class="o-line-name">' + esc(l.name) + ' <span class="o-x-n">× ' + l.qty + '</span></p>' + (l.note ? '<p class="o-line-note">' + esc(l.note) + '</p>' : '') + '</div><div class="o-line-end"><p class="o-line-sum">' + S.sar(l.qty * l.price) + '</p></div></div>';
    }).join('') + '</div>');
    h.push('<div class="o-total"><span>المجموع</span><span class="o-total-n">' + S.sar(o.total) + '</span></div>');
    h.push('<p class="c-sub o-total-pay">' + (o.counter ? 'تدفع عند الكاشير وقت الاستلام.' : 'تدفع عند الكاشير أو مع النادل.') + '</p>');
    h.push('<button type="button" class="lt-btn lt-btn--secondary o-back" id="o-back"><span>رجوع للمنيو</span></button>');
    box.innerHTML = h.join('');
  }
  function showStatus(id) {
    viewing = id;
    renderStatus();
    $('o-main').hidden = true; $('o-status').hidden = false;
    $('o-status').focus({ preventScroll: true });
    w.scrollTo(0, 0);
    say('وصل طلبك للمطعم. رقم الطلب ' + S.find(state.orders, id).no + '.');
  }
  function hideStatus() {
    viewing = null;
    $('o-status').hidden = true; $('o-main').hidden = false;
    paint();
  }
  $('o-status').addEventListener('click', function (e) { if (e.target.closest('#o-back')) { hideStatus(); $('o-live').hidden ? $('o-cart-btn').focus() : $('o-live').focus(); } });
  $('o-live').addEventListener('click', function (e) { e.preventDefault(); var id = this.getAttribute('data-id'); if (id) showStatus(id); });

  // شريط آخر طلب فوق المنيو
  function paintLive() {
    var last = null;
    mine.orders.forEach(function (id) { var o = S.find(state.orders, id); if (o && o.status !== 'served') last = o; });
    var a = $('o-live');
    if (!last) { a.hidden = true; return; }
    var hl = headline(last);
    a.hidden = false; a.setAttribute('data-id', last.id);
    a.className = 'lt-panel o-live is-' + last.status;
    a.innerHTML = '<span class="o-dot" aria-hidden="true"></span><span class="o-live-t"><span class="o-live-h">طلب ' + last.no + ': ' + hl.h + '</span><span class="o-live-s">' + hl.s + '</span></span><span class="o-live-go">الحالة</span>';
  }

  // ===== الشريط الثابت والتنبيهات =====
  var toastT = 0;
  function toast(t) {
    var el = $('o-toast');
    el.textContent = t; el.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
  }
  function paintBar() {
    var t = totals();
    $('o-cart-sum').textContent = t.n ? S.sar(t.sum) : 'فاضية';
    $('o-cart-n').textContent = t.n; $('o-cart-n').hidden = !t.n;
    $('o-cart-btn').setAttribute('aria-label', t.n ? 'السلة، ' + t.n + ' أصناف، المجموع ' + S.sar(t.sum) : 'السلة فاضية');
  }
  function paint() {
    updateMenu(); paintBar(); paintLive();
    if ($('o-cart').open) renderCart();
    if (viewing) renderStatus();
  }

  // ===== تحديثات من شاشة المطعم =====
  var prev = JSON.stringify(state);
  S.subscribe(function (s) {
    var old = JSON.parse(prev); prev = JSON.stringify(s); state = s;
    // تغيّر حالة طلب من طلباتي
    mine.orders.forEach(function (id) {
      var a = S.find(old.orders, id), b = S.find(s.orders, id);
      if (a && b && a.status !== b.status) {
        var hl = headline(b); toast('طلب ' + b.no + ': ' + hl.h); say('طلب ' + b.no + ': ' + hl.h + '. ' + hl.s);
      }
    });
    // النادل شاف ندائي
    mine.calls.forEach(function (id) {
      var a = S.find(old.calls, id), b = S.find(s.calls, id);
      if (a && b && !a.t.acked && b.t.acked) { toast('النادل شاف ندائك وجاي لك'); say('النادل شاف ندائك وجاي لك.'); }
    });
    // صنف خلص وهو في السلة
    var newlyOut = s.soldOut.filter(function (x) { return old.soldOut.indexOf(x) === -1 && qtyOf(x); });
    if (newlyOut.length) toast(byId(newlyOut[0]).name + ' خلص اليوم، وما راح يدخل في طلبك');
    paint();
  });

  // ===== البداية =====
  if (COUNTER) {
    $('o-call-btn').hidden = true;
    d.body.classList.add('is-counter');
    $('o-table').textContent = 'استلام من الكاشير';
    $('o-pay-note').textContent = 'تدفع عند الكاشير وقت الاستلام.';
    $('o-cart-h').textContent = 'سلتك';
    $('o-alt').innerHTML = '<a class="lt-link" href="./"><span>شوف النسخة اللي فيها نادل</span></a>';
  } else {
    $('o-alt').innerHTML = '<a class="lt-link" href="?counter=1"><span>كافيه بدون نادل؟ شوف نسخة الاستلام من الكاشير</span></a>';
  }
  renderMenu();
  paint();
  bindTabs();
})(window, document);
