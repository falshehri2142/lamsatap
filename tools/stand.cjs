// مكوّن ستاند التقييم المصغر (التقييم 2، القرار 2: «المنتج نفسه هو الرسمة»). دالة وحدة تطلّع HTML ثابت، وتنسيقه
// في website/assets/stand.css. يستخدمها tools/build-home-minis.cjs في صفحة شرح التقييم (@@stand:review) و«كيف نشتغل» في الرئيسية.
// - المقاسات: print/dims.js (stand) نفسه، يعني نفس وجه قالب الطباعة print/stand/ بالضبط، بس مصغر (--mm في stand.css).
// - الباركود حقيقي: نفس مولّد ورقة QR (website/vendor/qrcode-generator.js، تصحيح M)، والمسافة الهادئة ورقة الستاند البيضاء حوله.
// - الأسطر من web-copy §3: العنوان حسب الغرض («قيّمنا في قوقل» للتقييم)، و«قرّب جوالك هنا»، و«أو امسح الباركود».
// - النقطة بلون المحل لو تباينه مع الأبيض 3 أو أكثر، وإلا حبر (نفس قاعدة print/print.js).
'use strict';
const PT = 25.4 / 72;   // النقطة الطباعية بالمليمتر
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function lum(h) {
  const c = [1, 3, 5].map((i) => { const v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// الباركود كمسار SVG واحد (viewBox 0 0 n n): كل صف، الوحدات السودا المتجاورة مستطيل واحد (نفس الشكل، وحجم أقل بكثير
// من مربع لكل وحدة). يستخدمه الستاند هنا، و«حقل QR» في الرئيسية (web-motion، data-scan="qr-field") عن طريق build-home-minis.cjs
function qrPath(qrcode, url, level, hole) {
  const q = qrcode(0, level || 'M'); q.addData(url); q.make();
  const n = q.getModuleCount();
  // hole: فتحة مربعة في الوسط (k وحدة) لرمزنا. وحداتها تنكتب في center (للحركة بس)، والباقي في path
  const k = hole || 0, x0 = Math.floor((n - k) / 2), inH = (r, c) => k && r >= x0 && c >= x0 && r < x0 + k && c < x0 + k;
  const run = (keep) => {
    let p = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!q.isDark(r, c) || !keep(r, c)) continue;
        let e = c;
        while (e + 1 < n && q.isDark(r, e + 1) && keep(r, e + 1)) e++;
        p += 'M' + c + ' ' + r + 'h' + (e - c + 1) + 'v1h-' + (e - c + 1) + 'z';
        c = e;
      }
    }
    return p;
  };
  return { n, path: run((r, c) => !inH(r, c)), center: k ? run(inH) : '', hole: k ? [x0, k] : null, version: q.getTypeNumber ? q.getTypeNumber() : 0 };
}

// o = { dims: PRINT_DIMS.stand، qrcode: دالة المكتبة، url: رابط الباركود، title، logo: مسار الشعار من الصفحة، color: لون المحل }
module.exports = function standHtml(o) {
  const D = o.dims, base = +D.baseCover || 0;
  const { n, path } = qrPath(o.qrcode, o.url);
  const dot = /^#[0-9A-Fa-f]{6}$/.test(o.color || '') && 1.05 / (lum(o.color) + 0.05) >= 3 ? o.color : 'var(--lt-ink)';
  const mm = (v) => 'calc(' + Number(v.toFixed(3)) + ' * var(--mm))';
  const box = (top, w, h) => 'top:' + mm(top) + ';left:' + mm((D.sheetW - w) / 2) + ';width:' + mm(w) + ';height:' + mm(h);
  const line = (top, pt, weight, text) => '<p class="lt-stand-line" style="top:' + mm(top) + ';font-size:' + mm(pt * PT) + ';font-weight:' + weight + '">' + esc(text) + '</p>';
  return '<figure class="lt-stand-stage" aria-hidden="true" inert><div class="lt-stand" data-qr-url="' + esc(o.url) + '">' +
    '<img class="lt-stand-logo" src="' + esc(o.logo) + '" alt="" style="' + box(D.logoTop, D.logoW, D.logoH) + '">' +
    line(D.titleTop, D.titlePt, 600, o.title) +
    '<span class="lt-stand-dot" style="' + box(D.chipY - D.dotD / 2, D.dotD, D.dotD) + ';background:' + dot + '"></span>' +
    line(D.touchTop, D.touchPt, 600, 'قرّب جوالك هنا') +
    line(D.qrLineTop - base, D.qrLinePt, 500, 'أو امسح الباركود') +
    '<svg class="lt-stand-qr" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges" focusable="false" style="' + box(D.qrTop - base, D.qrSize, D.qrSize) + '">' +
    '<path fill="currentColor" d="' + path + '"/></svg></div></figure>';
};
module.exports.qrPath = qrPath;
