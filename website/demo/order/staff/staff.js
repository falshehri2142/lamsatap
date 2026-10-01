// إدارة المطعم: شاشة المطعم (عرض). تقرا وتكتب في نفس المخزن حق صفحة الزبون (../store.js).
// بدون شبكة. لاحقاً: نفس الواجهة، والمخزن يصير خدمة (التعليق في رأس store.js).
(function (w, d) {
  var S = w.LT_ORDER, $ = function (i) { return d.getElementById(i); };
  var items = S.catalog();
  var reduce = w.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ACT = { new: 'استلمت', preparing: 'جاهز', ready: 'انسلّم' };
  var CHIP = { new: 'جديد', preparing: 'يتحضر', ready: 'جاهز', served: 'انسلّم' };
  var LATE_ORDER = 2 * 60 * 1000, LATE_CALL = 60 * 1000;   // بعدها الكرت يتعلّم «متأخر» (رقم مقترح للعرض)
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  var state = S.read();

  // ===== الصوت: WebAudio بسيط، بعد ضغطة الموظف بس =====
  var ac = null, soundOn = false;
  function tone(f, t0, len, vol) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + len + 0.02);
  }
  function chime(kind) {
    if (!soundOn || !ac) return;
    if (ac.state === 'suspended') ac.resume();
    var t = ac.currentTime + 0.02;
    if (kind === 'call') { tone(1175, t, 0.12, 0.22); tone(1175, t + 0.18, 0.12, 0.22); tone(1568, t + 0.36, 0.22, 0.22); }
    else { tone(880, t, 0.16, 0.25); tone(1320, t + 0.17, 0.28, 0.25); }
  }
  $('k-sound').addEventListener('click', function () {
    if (!ac) { var C = w.AudioContext || w.webkitAudioContext; if (C) ac = new C(); }
    if (!ac) { say('المتصفح هذا ما يدعم الصوت. التنبيه يطلع على الشاشة بس.'); return; }
    soundOn = !soundOn;
    if (soundOn && ac.state === 'suspended') ac.resume();
    this.setAttribute('aria-pressed', String(soundOn));
    $('k-sound-t').textContent = soundOn ? 'الصوت شغّال' : 'فعّل الصوت';
    if (soundOn) chime('order');
    say(soundOn ? 'الصوت شغّال. أي طلب أو نداء جديد يطلع له صوت.' : 'الصوت طافي.');
  });

  // ===== التنبيه البصري =====
  var alertT = 0, unseen = 0, baseTitle = d.title;
  function alertBar(text, kind) {
    var el = $('k-alert');
    el.className = 'k-alert is-on is-' + kind;
    el.textContent = text;
    clearTimeout(alertT); alertT = setTimeout(function () { el.className = 'k-alert'; el.textContent = ''; }, 6000);
    if (d.hidden) { unseen++; d.title = '(' + unseen + ') ' + baseTitle; }
  }
  d.addEventListener('visibilitychange', function () { if (!d.hidden) { unseen = 0; d.title = baseTitle; } });
  function say(t) { var a = $('k-announce'); a.textContent = ''; setTimeout(function () { a.textContent = t; }, 30); }

  // ===== الرسم =====
  function today(list) { return list.filter(function (x) { return S.sameDay(x.t.created); }); }
  function agoHtml(t) { return '<span data-ago="' + t + '">' + S.ago(t) + '</span>'; }
  function itemsHtml(L) {
    return '<ul class="k-lines">' + L.map(function (l) {
      return '<li><span class="k-q">' + l.qty + '×</span><span class="k-n">' + esc(l.name) + (l.note ? '<span class="k-note">' + esc(l.note) + '</span>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function orderCard(o, fresh) {
    var late = o.status === 'new' && S.now() - o.t.created > LATE_ORDER;
    return '<article class="k-card k-order is-' + o.status + (late ? ' is-late' : '') + (fresh ? ' is-fresh' : '') + '" data-id="' + o.id + '" aria-labelledby="h-' + o.id + '">' +
      '<div class="k-card-top"><h3 class="k-table" id="h-' + o.id + '">' + (o.counter ? 'كاشير' : 'طاولة ' + o.table) + '</h3>' +
      '<span class="k-no">#' + o.no + '</span><span class="k-chip">' + CHIP[o.status] + '</span></div>' +
      '<p class="k-meta">' + agoHtml(o.t.created) + ' · ' + S.clock(o.t.created) + (o.counter ? ' · استلام من الكاشير' : '') + (late ? ' · <strong>متأخر</strong>' : '') + '</p>' +
      itemsHtml(o.items) +
      '<p class="k-total">' + S.sar(o.total) + ' · الدفع عند ' + (o.counter ? 'الكاشير' : 'الكاشير أو مع النادل') + '</p>' +
      (ACT[o.status] ? '<button type="button" class="lt-btn k-act k-act--' + o.status + '" data-act="next" data-f="o-' + o.id + '"><span>' + ACT[o.status] + '</span></button>' : '') +
      '</article>';
  }
  function callCard(c, fresh) {
    var late = S.now() - c.t.created > LATE_CALL;
    return '<article class="k-card k-call' + (late ? ' is-late' : '') + (fresh ? ' is-fresh' : '') + '" data-id="' + c.id + '" aria-labelledby="h-' + c.id + '">' +
      '<div class="k-card-top"><h3 class="k-table" id="h-' + c.id + '">طاولة ' + c.table + '</h3><span class="k-reason">' + esc(S.REASONS[c.reason] || c.reason) + (c.count > 1 ? ' ×' + c.count : '') + '</span></div>' +
      '<p class="k-meta">' + agoHtml(c.t.created) + (late ? ' · <strong>متأخر</strong>' : '') + '</p>' +
      (c.items && c.items.length ? '<p class="k-hint">سلته الحين:</p>' + itemsHtml(c.items) : '') +
      '<button type="button" class="lt-btn k-act" data-act="ack" data-f="c-' + c.id + '"><span>رحت له</span></button>' +
      '</article>';
  }
  var freshIds = {};
  function render() {
    var f = d.activeElement && d.activeElement.getAttribute && d.activeElement.getAttribute('data-f');
    var ord = { new: 0, preparing: 1, ready: 2 };
    var open = state.orders.filter(function (o) { return o.status !== 'served'; })
      .sort(function (a, b) { return (ord[a.status] - ord[b.status]) || (a.t.created - b.t.created); });
    var done = today(state.orders).filter(function (o) { return o.status === 'served'; }).reverse();
    var calls = state.calls.filter(function (c) { return !c.t.acked; }).sort(function (a, b) { return a.t.created - b.t.created; });

    $('k-order-list').innerHTML = open.length ? open.map(function (o) { return orderCard(o, freshIds[o.id]); }).join('')
      : '<div class="k-empty"><p>ما فيه طلبات الحين.</p><p class="k-hint">أول ما يطلب أحد من طاولته، يطلع هنا مع صوت.</p></div>';
    $('k-call-list').innerHTML = calls.length ? calls.map(function (c) { return callCard(c, freshIds[c.id]); }).join('')
      : '<div class="k-empty"><p>ما فيه نداءات.</p></div>';
    $('k-done-n').textContent = done.length;
    $('k-done').hidden = !done.length;
    $('k-done-list').innerHTML = done.map(function (o) {
      return '<div class="k-done-row"><span>' + (o.counter ? 'كاشير' : 'طاولة ' + o.table) + ' · #' + o.no + '</span><span>' + o.items.reduce(function (n, l) { return n + l.qty; }, 0) + ' أصناف · ' + S.sar(o.total) + '</span><span>' + S.clock(o.t.served || o.t.created) + '</span></div>';
    }).join('');

    $('k-item-list').innerHTML = items.map(function (it) {
      var out = state.soldOut.indexOf(it.id) !== -1;
      return '<div class="k-item' + (out ? ' is-out' : '') + '"><span class="k-item-n">' + esc(it.name) + '<span class="k-item-s">' + esc(it.secTitle) + ' · ' + S.sar(it.price) + '</span></span>' +
        '<button type="button" class="k-toggle" data-act="sold" data-item="' + esc(it.id) + '" data-f="i-' + esc(it.id) + '" aria-pressed="' + out + '" aria-label="' + esc(it.name) + ': ' + (out ? 'خلص، اضغط ترجّعه' : 'متوفر، اضغط إذا خلص') + '">' + (out ? 'رجّعه' : 'خلص') + '</button></div>';
    }).join('');

    // العدّادات والملخص
    $('k-c-orders').textContent = open.length;
    $('k-c-calls').textContent = calls.length;
    $('k-c-calls').classList.toggle('is-hot', calls.length > 0);
    $('k-c-orders').classList.toggle('is-hot', open.some(function (o) { return o.status === 'new'; }));
    $('k-c-items').textContent = state.soldOut.length; $('k-c-items').hidden = !state.soldOut.length;
    var tOrders = today(state.orders), tCalls = today(state.calls), resp = [];
    tOrders.forEach(function (o) { if (o.t.accepted) resp.push(o.t.accepted - o.t.created); });
    tCalls.forEach(function (c) { if (c.t.acked) resp.push(c.t.acked - c.t.created); });
    $('k-s-orders').textContent = tOrders.length;
    $('k-s-calls').textContent = tCalls.length;
    $('k-s-resp').textContent = resp.length ? S.dur(resp.reduce(function (a, b) { return a + b; }, 0) / resp.length) : '—';
    $('k-s-sales').textContent = S.sar(tOrders.reduce(function (n, o) { return n + o.total; }, 0));

    if (f) { var el = d.querySelector('[data-f="' + f + '"]'); if (el) el.focus(); }
  }

  // ===== الأفعال =====
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), card = b.closest('[data-id]'), id = card && card.getAttribute('data-id');
    if (act === 'next') {
      S.mutate(function (s) {
        var o = S.find(s.orders, id); if (!o || !S.NEXT[o.status]) return;
        o.status = S.NEXT[o.status];
        o.t[o.status === 'preparing' ? 'accepted' : o.status] = S.now();
      }, { type: 'status', id: id });
      var o = S.find(S.read().orders, id);
      if (o) say((o.counter ? 'طلب ' + o.no : 'طاولة ' + o.table) + ': ' + CHIP[o.status]);
      if (o && o.status === 'served') { var next = d.querySelector('.k-order .k-act'); if (next) next.focus(); }
    }
    if (act === 'ack') {
      S.mutate(function (s) { var c = S.find(s.calls, id); if (c) c.t.acked = S.now(); }, { type: 'ack', id: id });
      say('تمام. انشال النداء.');
      var nb = d.querySelector('.k-call .k-act'); if (nb) nb.focus(); else $('k-calls').focus();
    }
    if (act === 'sold') {
      var it = b.getAttribute('data-item');
      S.mutate(function (s) {
        var i = s.soldOut.indexOf(it);
        if (i === -1) s.soldOut.push(it); else s.soldOut.splice(i, 1);
      }, { type: 'sold', id: it });
    }
  });

  // ===== التحديث من صفحة الزبون =====
  S.subscribe(function (s, evt) {
    var oldOrders = state.orders.map(function (o) { return o.id; }), oldCalls = {};
    state.calls.forEach(function (c) { oldCalls[c.id] = c.count || 1; });
    state = s;
    var newO = s.orders.filter(function (o) { return oldOrders.indexOf(o.id) === -1; });
    var newC = s.calls.filter(function (c) { return !(c.id in oldCalls) || (c.count || 1) > oldCalls[c.id]; });
    newO.concat(newC).forEach(function (x) { freshIds[x.id] = 1; setTimeout(function () { delete freshIds[x.id]; }, 2400); });
    render();
    if (newO.length) {
      var o = newO[newO.length - 1];
      alertBar('طلب جديد · ' + (o.counter ? 'استلام من الكاشير، #' + o.no : 'طاولة ' + o.table) + ' · ' + o.items.reduce(function (n, l) { return n + l.qty; }, 0) + ' أصناف', 'order');
      chime('order');
      if (isNarrow() && cur !== 'k-orders') bump('k-tab-orders');
    }
    if (newC.length) {
      var c = newC[newC.length - 1];
      alertBar('نداء · طاولة ' + c.table + ' · ' + (S.REASONS[c.reason] || ''), 'call');
      chime('call');
      if (isNarrow() && cur !== 'k-calls') bump('k-tab-calls');
    }
    if (evt && evt.type === 'reset') { freshIds = {}; }
  });

  // ===== التبويبات (الجوال). من 900px الأعمدة كلها ظاهرة =====
  var mq = w.matchMedia('(min-width: 900px)'), cur = 'k-orders', TABS = ['k-tab-orders', 'k-tab-calls', 'k-tab-items'];
  function isNarrow() { return !mq.matches; }
  function bump(tabId) { var t = $(tabId); t.classList.remove('is-bump'); void t.offsetWidth; t.classList.add('is-bump'); }
  function select(tabId, focus) {
    TABS.forEach(function (t) {
      var on = t === tabId, el = $(t), panel = $(el.getAttribute('aria-controls'));
      el.setAttribute('aria-selected', String(on)); el.tabIndex = on ? 0 : -1;
      if (on) { cur = panel.id; el.classList.remove('is-bump'); }
      panel.classList.toggle('is-active', on);
    });
    if (focus) $(tabId).focus();
  }
  TABS.forEach(function (t, i) {
    $(t).addEventListener('click', function () { select(t); });
    $(t).addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowLeft') n = TABS[(i + 1) % TABS.length];          // RTL: اليسار = التالي
      if (k === 'ArrowRight') n = TABS[(i + TABS.length - 1) % TABS.length];
      if (k === 'Home') n = TABS[0];
      if (k === 'End') n = TABS[TABS.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
  select('k-tab-orders');

  // ===== أدوات العرض =====
  function pick(n) { return items.filter(function (it) { return state.soldOut.indexOf(it.id) === -1; }).slice(0, n); }
  $('k-fake-order').addEventListener('click', function () {
    var a = pick(6), L = [a[3], a[5]].filter(Boolean).map(function (it, i) { return { id: it.id, name: it.name, price: it.price, qty: i ? 1 : 2, note: i ? '' : 'واحد منهم بدون سكر' }; });
    if (!L.length) return;
    S.mutate(function (s) {
      s.seq = (s.seq || 0) + 1;
      s.orders.push({ id: S.uid(), no: s.seq, table: 4, items: L, total: L.reduce(function (n, l) { return n + l.qty * l.price; }, 0), status: 'new', t: { created: S.now() } });
    }, { type: 'order' });
  });
  $('k-fake-call').addEventListener('click', function () {
    S.mutate(function (s) { s.calls.push({ id: S.uid(), table: 2, reason: 'bill', items: null, t: { created: S.now() - 30000 } }); }, { type: 'call' });
  });
  $('k-reset').addEventListener('click', function () { S.reset(); say('انمسح العرض.'); });

  // ===== الوقت =====
  function tick() {
    var n = new Date(); $('k-clock').textContent = S.clock(n.getTime());
    [].forEach.call(d.querySelectorAll('[data-ago]'), function (el) { el.textContent = S.ago(+el.getAttribute('data-ago')); });
  }
  setInterval(function () { tick(); }, 5000);
  // كل 30 ثانية نعيد الرسم عشان «متأخر» يطلع بدون ما يصير تغيير
  setInterval(function () { if (!d.querySelector('.k-card:focus-within')) render(); }, 30000);
  render(); tick();
  if (reduce) d.documentElement.classList.add('k-reduce');
})(window, document);
