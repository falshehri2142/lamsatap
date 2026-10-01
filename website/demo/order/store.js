// إدارة المطعم (عرض محلي): مخزن مشترك بين صفحة الزبون (demo/order/) وشاشة المطعم (demo/order/staff/).
// الهدف: work/2026-10-01-restaurant-ops/goal.md «قرار تصميم مبدئي».
// كل شي محلي: localStorage (الحالة) + BroadcastChannel (تنبيه التبويب الثاني فوراً) + حدث storage (احتياط للمتصفح اللي ما يدعمه).
// ولا شبكة ولا n8n ولا fetch. افتح الصفحتين في تبويبين من نفس السيرفر المحلي وتشوف الطلب يوصل.
//
// ===== مكان الاستبدال بالنظام الحقيقي (لاحقاً، بعد قرار صاحب المشروع ومشرف الشبكة) =====
// الواجهة المقترحة في work/2026-10-01-restaurant-ops/system.md (§الـ API): POST /api/orders و POST /api/calls و POST /api/staff/orders/<id>.
// مشرف الشبكة ينصح ما يكون n8n في طريق الطلب (حد التنفيذات، system.md §4)، فالـ webhook هنا يعني الخدمة اللي يعتمدها هو.
// 1) LT_ORDER.mutate(): بدل الكتابة في localStorage، أرسل الحدث للـ webhook (POST بـ JSON: النوع، والطاولة، والأصناف).
//    الرابط من config.js، والمفاتيح ما تنكتب في الواجهة أبداً (CLAUDE.md «الأسرار»). الجهة اللي تستقبل تحفظ وتبعث تنبيه تليجرام الاحتياطي.
// 2) LT_ORDER.subscribe(): بدل BroadcastChannel، شاشة المطعم تسحب الحالة كل كم ثانية (أو SSE) من نفس الخدمة،
//    وصفحة الزبون تسحب حالة طلبها برقمه بس.
// 3) رقم الطاولة: من الرابط المطبوع على الستاند (?t=7)، والخادم يتحقق إنه طاولة موجودة عند المحل.
// باقي الكود (الواجهة والحالات) ما يتغير.
(function (w) {
  var KEY = 'lt-order-demo-v1', CH = 'lt-order-demo';
  var bc = null, subs = [];
  try { bc = 'BroadcastChannel' in w ? new BroadcastChannel(CH) : null; } catch (e) { bc = null; }

  // v = رقم النسخة: يزيد مع كل تغيير، والأكبر هو الأحدث.
  // الرسالة تحمل الحالة كاملة، لأن localStorage بين تبويبين ممكن يتأخر عن رسالة BroadcastChannel (انمسك في فحص Playwright).
  function blank() { return { v: 0, seq: 0, orders: [], calls: [], soldOut: [] }; }
  function valid(s) { return s && Array.isArray(s.orders) && Array.isArray(s.calls) && Array.isArray(s.soldOut); }
  function parse(txt) { try { var s = JSON.parse(txt || 'null'); if (valid(s)) { s.v = s.v || 0; return s; } } catch (e) { /* حالة خربانة */ } return null; }
  var mem = null;   // آخر نسخة نعرفها (من التخزين أو من رسالة)
  function read() {
    var disk = null;
    try { disk = parse(localStorage.getItem(KEY)); } catch (e) { /* التخزين مقفول */ }
    if (!mem || (disk && disk.v > mem.v)) mem = disk || blank();
    return JSON.parse(JSON.stringify(mem));
  }
  function write(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* التخزين ممتلي أو مقفول */ } }
  function notify(s, evt) {
    var copy = JSON.parse(JSON.stringify(s));
    subs.forEach(function (f) { f(copy, evt || {}); });
  }
  function incoming(s, evt) {
    if (!valid(s) || (mem && s.v <= mem.v)) return;   // قديمة أو وصلت من الطريقين: نتجاهلها
    mem = s; notify(s, evt);
  }

  // كل تغيير: نقرا آخر نسخة، نعدّل، نكتب، ونرسل الحالة للتبويب الثاني. evt = { type, id } يوصل للمشتركين (للصوت والتنبيه)
  function mutate(fn, evt) {
    var s = read();
    var r = fn(s);
    s.v = (s.v || 0) + 1;
    write(s);
    if (bc) { try { bc.postMessage({ evt: evt || { type: 'sync' }, state: s }); } catch (e) { /* */ } }
    notify(s, evt);
    return r;
  }
  function subscribe(f) { subs.push(f); }

  if (bc) bc.onmessage = function (m) { if (m.data) incoming(m.data.state, m.data.evt); };
  // احتياط: حدث storage (يوصل للتبويبات الثانية بس). لو الاثنين وصلوا، رقم النسخة يمنع التكرار
  w.addEventListener('storage', function (e) { if (e.key === KEY) incoming(parse(e.newValue), { type: 'sync' }); });

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function now() { return Date.now(); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // أسباب النداء: نفس النص في الصفحتين
  var REASONS = {
    take_order: 'ياخذ الطلب',   // نفس أسماء system.md: take_order و bill و help و water
    bill: 'الحساب',
    help: 'مساعدة',
    water: 'ماي'
  };
  // حالات الطلب: new (وصل، ينتظر) ← preparing (استلمه الموظف ويتحضر) ← ready (جاهز) ← served (انسلّم).
  // system.md فيه accepted بين new و preparing؛ هنا خطوة وحدة («استلمت» = يتحضر)، وهذا الخيار اللي يسمح فيه system.md للمطعم.
  // الرفض والانتهاء (rejected و expired) ما انبنوا في العرض.
  var NEXT = { new: 'preparing', preparing: 'ready', ready: 'served' };

  // السعر: الرقم من نص مثل "12 ريال" في data.js
  function priceNum(p) { var m = String(p == null ? '' : p).replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).match(/\d+(\.\d+)?/); return m ? +m[0] : 0; }
  function sar(n) { return (Math.round(n * 100) / 100) + ' ريال'; }

  // الأصناف من بيانات المنيو التجريبية (demo/menu/data.js)، مع id ثابت لكل صنف: <القسم>-<الترتيب>
  function catalog() {
    var D = w.MENU_DATA || {}, out = [];
    (D.sections || []).forEach(function (s) {
      (s.items || []).forEach(function (it, i) {
        out.push({ id: (s.id || 's') + '-' + i, sec: s.id, secTitle: s.title, name: it.name, desc: it.desc || '', price: priceNum(it.price), cal: it.cal });
      });
    });
    return out;
  }

  // «منذ ...» بعربي سعودي بسيط
  function ago(t) {
    var s = Math.max(0, Math.round((now() - t) / 1000));
    if (s < 10) return 'الحين';
    if (s < 60) return 'منذ ' + (Math.floor(s / 10) * 10) + ' ثانية';
    var m = Math.floor(s / 60);
    if (m === 1) return 'منذ دقيقة';
    if (m === 2) return 'منذ دقيقتين';
    if (m <= 10) return 'منذ ' + m + ' دقايق';
    if (m < 60) return 'منذ ' + m + ' دقيقة';
    var h = Math.floor(m / 60);
    return h === 1 ? 'منذ ساعة' : 'منذ ' + h + ' ساعات';
  }
  function clock(t) {
    var d = new Date(t), h = d.getHours(), m = d.getMinutes();
    return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' ص' : ' م');
  }
  function dur(ms) {
    var s = Math.max(1, Math.ceil(ms / 1000));
    if (s < 60) return s + ' ث';
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) + ' د';
  }
  function sameDay(t) { var a = new Date(t), b = new Date(); return a.toDateString() === b.toDateString(); }

  w.LT_ORDER = {
    read: read, mutate: mutate, subscribe: subscribe, reset: function () { mutate(function (s) { s.seq = 0; s.orders = []; s.calls = []; s.soldOut = []; }, { type: 'reset' }); },
    uid: uid, now: now, find: find, REASONS: REASONS, NEXT: NEXT,
    catalog: catalog, priceNum: priceNum, sar: sar, ago: ago, clock: clock, dur: dur, sameDay: sameDay
  };
})(window);
