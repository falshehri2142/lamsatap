// محرك لون المحل (موجز المدير الفني §5.2، GM-023). يحوّل brand.color (و brand.colorDark) لمتغيرات CSS:
// --shop (تعبئة الزر الأساسي) و --on-shop (نصه) و --shop-press (وقت الضغط) و --shop-line (مؤشر التبويب)
// و --shop-tint (لون صندوق الواي فاي) و --shop-hl (لون اللمس في آيفون: أسود 12% لو النص أبيض، وأبيض 20% لو النص حبر، §5.6)، للفاتح والداكن.
// التعديل دايماً في فاتحية OKLCH بخطوات 0.005 (نحافظ على الدرجة والتشبع). المرجع: art-review/color/engine.js.
// أي قيمة غير #RRGGBB = الثيم المحايد (الحبر)، ولا تيل ولا زعفران (GM-023 و GM-025).
(function (w) {
  // ألوان الأساس من brand/tokens.css (لازم تبقى مطابقة لها): الخلفية والسطح والحبر، فاتح وداكن
  var REF = {
    light: { bg: '#FAF7F2', surf: '#FFFFFF', neutral: '#14201F', tintPct: 0.08 },
    dark: { bg: '#0E1615', surf: '#152120', neutral: '#ECF2F0', tintPct: 0.14 }
  };
  var WHITE = '#FFFFFF', INK = '#14201F';

  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(h) { var c = rgb(h).map(lin); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function oklab(c) {
    var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function gam(c) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
  function fromOklab(p) {
    var l = Math.pow(p[0] + 0.3963377774 * p[1] + 0.2158037573 * p[2], 3);
    var m = Math.pow(p[0] - 0.1055613458 * p[1] - 0.0638541728 * p[2], 3);
    var s = Math.pow(p[0] - 0.0894841775 * p[1] - 1.2914855480 * p[2], 3);
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(gam);
  }
  function hex(c) {
    return '#' + c.map(function (v) {
      return ('0' + Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }
  function inGamut(c) { return c.every(function (v) { return v >= -1e-4 && v <= 1 + 1e-4; }); }
  function lch(h) { var p = oklab(rgb(h)); return [p[0], Math.hypot(p[1], p[2]), Math.atan2(p[2], p[1])]; }
  function fromLch(l, c, hh) {
    var cc = c, out;
    for (var i = 0; i < 60; i++) { out = fromOklab([l, cc * Math.cos(hh), cc * Math.sin(hh)]); if (inGamut(out)) break; cc *= 0.95; }
    return hex(out);
  }
  // نحرّك الفاتحية (dir -1 أغمق، +1 أفتح) لين يتحقق الشرط. يرجّع [اللون، مقدار الحركة] أو [null، 1]
  function shift(h, dir, test) {
    var p = lch(h);
    for (var d = 0; d <= 1.0001; d += 0.005) {
      var nl = p[0] + dir * d;
      if (nl < 0 || nl > 1) break;
      var x = fromLch(nl, p[1], p[2]);
      if (test(x)) return [x, d];
    }
    return [null, 1];
  }
  // خلط sRGB مثل color-mix(in srgb, a p%, b)
  function mix(a, b, p) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v * p + y[i] * (1 - p); })); }
  function valid(h) { return typeof h === 'string' && /^#[0-9A-Fa-f]{6}$/.test(h.trim()); }

  // الحساب لوضع واحد
  function solve(brand, mode) {
    var R = REF[mode], light = mode === 'light', fill = brand.toUpperCase(), fb = false, t;
    if (light) {
      // أبيض أو رمادي فاتح (قريب من الخلفية وتشبعه قليل) = الحبر
      if (cr(fill, R.bg) < 1.5 && lch(fill)[1] < 0.08) { fill = R.neutral; fb = true; }
    } else if (cr(fill, R.bg) < 3) {
      // الداكن: الكحلي والبني يضيعون على الأسود، فيتفتح لين 3. أكثر من 0.25 = الحبر الفاتح
      t = shift(fill, +1, function (y) { return cr(y, R.bg) >= 3; });
      if (!t[0] || t[1] > 0.25) { fill = R.neutral; fb = true; } else fill = t[0];
    }
    // النص على التعبئة: الأبيض أو الحبر، اللي تباينه أعلى. لو الاثنين أقل من 4.5 نحرّك التعبئة أقل حركة
    if (Math.max(cr(fill, WHITE), cr(fill, INK)) < 4.5) {
      var dk = shift(fill, -1, function (x) { return cr(x, WHITE) >= 4.5; });
      var lt = shift(fill, +1, function (x) { return cr(x, INK) >= 4.5; });
      fill = dk[1] <= lt[1] ? dk[0] : lt[0];
    }
    var on = cr(fill, WHITE) >= cr(fill, INK) ? WHITE : INK;
    // الضغط: 0.06 باتجاه يزيد تباين النص. لو وصلنا حد الألوان: الاتجاه الثاني بشرط التباين يبقى 4.5
    var dir = on === WHITE ? -1 : +1, L0 = lch(fill)[0];
    var press = shift(fill, dir, function (x) { return Math.abs(lch(x)[0] - L0) >= 0.06; })[0] ||
      shift(fill, -dir, function (x) { return Math.abs(lch(x)[0] - L0) >= 0.06 && cr(x, on) >= 4.5; })[0] || fill;
    // المؤشر: تباينه 3 مع الخلفية والسطح (مؤشر مو نص). لو التعبئة صارت حبر = حبر
    var line = fb ? fill : brand.toUpperCase();
    if (!fb && !(cr(line, R.bg) >= 3 && cr(line, R.surf) >= 3)) {
      line = shift(line, light ? -1 : +1, function (y) { return cr(y, R.bg) >= 3 && cr(y, R.surf) >= 3; })[0] || R.neutral;
    }
    return {
      shop: fill, onShop: on, press: press, line: line,
      tint: mix(fill, R.surf, R.tintPct),
      hl: on === WHITE ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.2)',
      contrast: +cr(fill, on).toFixed(2), pressContrast: +cr(press, on).toFixed(2),
      lineContrast: +Math.min(cr(line, R.bg), cr(line, R.surf)).toFixed(2), fallback: fb
    };
  }

  // المدخل: brand = { color: '#RRGGBB', colorDark: '#RRGGBB' (اختياري) }. بدون لون صحيح = null (الثيم المحايد)
  w.shopColors = function (brand) {
    brand = brand || {};
    if (!valid(brand.color)) return null;
    var c = brand.color.trim();
    return { light: solve(c, 'light'), dark: solve(valid(brand.colorDark) ? brand.colorDark.trim() : c, 'dark') };
  };

  // يطبّق الألوان كمتغيرات CSS على المحدد (الافتراضي :root). بدون لون صحيح: يشيلها، فيرجع الثيم المحايد (client.css)
  w.applyShop = function (brand, scope) {
    scope = scope || ':root';
    var t = w.shopColors(brand), id = 'shop-' + scope.replace(/[^\w-]/g, ''), el = document.getElementById(id);
    if (!t) { if (el) el.parentNode.removeChild(el); return null; }
    var vars = function (x) {
      return '--shop:' + x.shop + ';--on-shop:' + x.onShop + ';--shop-press:' + x.press + ';--shop-line:' + x.line +
        ';--shop-tint:' + x.tint + ';--shop-hl:' + x.hl;
    };
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = scope + '{' + vars(t.light) + '}@media (prefers-color-scheme:dark){' + scope + '{' + vars(t.dark) + '}}';
    return t;
  };
})(window);
