// يولّد الأجزاء الثابتة في صفحات الشركة بين علامات <!-- @@<مفتاح> --> ... <!-- /@@<مفتاح> -->:
//   البوابة index.html، و restaurants/index.html، و hosts/index.html (اللي ما انبنت للحين تنتخطى بدون خطأ)،
//   وصفحة شرح التقييم demo/review/index.html، وورقة الباركود demo/review/qr-sheet.html.
// كل علامة تقول وش تبي بنفسها (الجدول تحت)، فأي صفحة تقدر تستخدم أي علامة. العلامة المجهولة = خطأ واضح.
//
// التشغيل (من جذر المشروع): node tools/build-home-minis.cjs [صفحات...]
//   بدون صفحات = كلها. مع صفحة = هي بس، مثل: node tools/build-home-minis.cjs restaurants/index.html
//   الملف ما ينكتب إلا لو محتواه تغيّر.
// أعد تشغيله بعد أي تعديل في templates/*/render.js أو demo/*/data.js أو demo/_brands/ أو assets/client.js أو محرك اللون،
// أو ملفات الشعار في assets/brand/، أو لما تنضاف صورة في assets/images/ أو مشهد في assets/mockups/، أو يتغير domain في config.js.
//
// العلامات (المفتاح بعد @@، وبعده اختياري attributes مثل alt="..." و sizes="..."):
//   logo:head            رابط شعار الرأس (logo-horizontal.svg، الحبر، GM-042) للصفحة الرئيسية. البوابة شعارها ثابت في HTML (data-open-logo)
//   logo:foot            شعار التذييل: logo-stack.svg بعرض 120، و logo-stack-since.svg من 1024 (عرض 160، §11.5)
//                        layout="horizontal": الشعار الأفقي الأصلي للفوتر المختصر في البوابة.
//   logo:sheet           الشعار الأفقي في ورقة الباركود
//   qr:logo              باركود البداية الحقيقي (تصحيح H، ورمزنا في وسطه): SITE.domain + /demo/rental-guide/ (البوابة بس)
//   qr:field             نفس الباركود بدون رمز (احتياط الحركة)
//   qr:<مثال>            باركود ثابت حقيقي (menu، rental-guide، wifi، links، review) يفتح SITE.domain + /demo/<مثال>/، زخرفي (aria-hidden)
//   phone:<شاشة>[-<لاحقة>]  جوال (phone-frame.svg) فيه شاشة مصغرة حقيقية: guide أو menu أو wifi أو links. اللاحقة تفرق بين نسختين في نفس الصفحة
//                        frame="false": نفس الشاشة الحقيقية بدون جسم الجوال (AD-41، بطاقة القصة المثبّتة): svg بعرض صفحة الزبون (390)
//                        ونسبة 1:2، يتصغر على قد خانته. الزاوية والظل والحد من CSS البطاقة (.s-story-card في site.css)
//   minis-style          ألوان محلات العرض داخل الشاشات المصغرة (فاتح بس) وتنسيق قالبي الروابط والواي فاي. لازم لو فيه phone:*
//   img:hero             صورة البطل بطبقتين (الأبيض والأسود ثم الملونة data-tint) من HERO_PHOTO حسب الصفحة
//   photo:<خانة>         صورة بطبقتين من assets/images/<خانة>-bw-* و -color-* (CREDITS.md). alt="" افتراضي (زخرفية)
//                        color="true": صورة ملونة واحدة للمشاهد التي لا تحتاج مسح التلوين.
//   scene:<اسم>          مشهد المنتج (GM-049/050) بترميز assets/scenes.css، أو مكان فاضي فاتح لو ملفاته ما وصلت (تحت: SCENES).
//                        attributes اختيارية: alt="..." و sizes="..." و phone="false" (بدون الجوال الثابت) و scan="tint" و fill="true"
//                        و target="<خانة طباعة>" (يحط data-story-target على الخانة، هدف جوال القصة) و pulse="true" (ومعه data-pulse)
//   scenes               في <head>: <link> لـ assets/scenes.css و <script defer> لـ assets/mockups/print-art.js و assets/scenes.js (الموجود منها بس)
//   scenes-css           نفسه بدون السكربتات
//   stand:review         ستاند التقييم (tools/stand.cjs بمقاسات print/dims.js وباركود حقيقي): صفحة الشرح، و«كيف نشتغل» في البوابة
//                        (impeccable 6)، والعرض الحي في المطاعم (impeccable 5). pulse="true" يحط data-pulse على نقطة اللمس
//                        (motion.js pulses(): تنبض مرة وحدة لما يطلع الستاند، المطاعم بس، «الاتجاه 3» §10)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const W = path.join(__dirname, '..', 'website');
const read = (f) => fs.readFileSync(path.join(W, f), 'utf8');
const has = (f) => fs.existsSync(path.join(W, f));

// بيئة متصفح بسيطة: الدوال اللي تبني النص بس (ما فيه DOM حقيقي)
const noop = () => {};
const doc = { currentScript: null, addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], documentElement: { getAttribute: () => null }, title: '' };
const ctx = { document: doc, console, Math, JSON, Object, Array, String, Number, RegExp, encodeURIComponent, setTimeout: noop, navigator: {} };
ctx.window = ctx; vm.createContext(ctx);
const run = (f) => vm.runInContext(read(f), ctx, { filename: f });
['config.js', 'assets/app.js', 'assets/shop-color.js', 'assets/client.js', 'demo/_brands/brands.js', 'vendor/qrcode-generator.js'].forEach(run);
// مقاسات الستاند من قالب الطباعة نفسه (مصدر واحد)، ومكوّنه
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'print', 'dims.js'), 'utf8'), ctx, { filename: 'print/dims.js' });
const standHtml = require('./stand.cjs');
const { qrPath } = standHtml;
const { buildRestaurantCard } = require('./build-restaurant-card.cjs');
const { buildHostCard } = require('./build-host-card.cjs');
ctx.LT_NO_MOUNT = true;
['demo/menu/data.js', 'templates/menu/render.js', 'demo/wifi/data.js', 'templates/wifi/render.js',
  'demo/links/data.js', 'templates/links/render.js', 'demo/rental-guide/data.js', 'templates/rental-guide/render.js'].forEach(run);
const R = ctx.LT_RENDER;
const site = ctx.SITE;
const DOMAIN = String(site.domain || 'https://example.com').replace(/\/+$/, '');
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// صورة البطل لكل صفحة جمهور. ملفات الطبقتين في assets/images/.
// المشاهد المولّدة المعتمدة (brief-gm040.md «مشاهد المنتج المعتمدة»، GM-058/060، والمدير الفني AD-14 §5 بند 1): بطل المطاعم وبابها من
//   brand/photos/generated/restaurants-hero-imagen-1-upscaled-1.webp (restaurant-cafe-stand، المزاج warm)، وبطل المضيفين وبابهم من
//   hosts-hero-imagen-1-upscaled-1.webp (host-door-frame، المزاج light). طبقتينها بدوال tools/convert-images.py نفسها (حد البطل 180KB).
//   صورة اليد والجوال بشعارنا (restaurant-hand-phone) ما تنستخدم في أي بطل ولا باب (AD-14). الأبواب: @@photo:<الاسم> في index.html.
// Restaurant hero uses a blank photograph under the native QR card overlay.
const HERO_PHOTO = { 'restaurants/index.html': 'scene-restaurants', 'hosts/index.html': 'host-symbol-plate' };

// مشاهد المنتج (GM-049/050): الترميز من assets/scenes.css (وكيل المشاهد، web-illustrator): .lt-scene > .lt-scene-stage فيها
// الخلفية بطبقتين (assets/mockups/scene-<src>-bw/-color -800/-1600، والنص البديل على الأبيض والأسود)، ثم خانات الطباعة .lt-slot[data-print]
// (مستطيل أبيض لين تنكتب صورة الطباعة في assets/mockups/print-art.js، و assets/scenes.js يحطها)، ثم الجوال اللي يلمس.
// المفتاح اسم العلامة (@@scene:<المفتاح>)، و src اسم المشهد، و alt من web-copy «GM-049/050: نصوص المشاهد».
//   door: قص الباب في البوابة (lt-scene--fill lt-scene--door، و data-scan="tint" على المسرح عشان خط المسح يطابق حافة اللون).
//   hero: البطل (lt-scene--fill داخل [data-expand-media]، بدون data-scan لأن البطل يكشف اللون بنفسه، والصورة أولوية تحميل).
//   phone: false يشيل الجوال الثابت (لو فيه جوال ثاني يتحرك في القصة).
// ملفات الخلفية ناقصة: مكان فاضي فاتح .s-scene--ph (aria-hidden). مفتاح مو في الجدول: src = المفتاح، بدون خانات، وبدون نص بديل.
// لو ضاف وكيل المشاهد مشهد جديد (مثل طاولة داخل الشقة لصفحة المضيفين)، ينضاف سطره هنا بخاناته.
const PHONE = '<span class="lt-scene-phone"></span>';
const SLOTS = {
  hosts: (ph) => '<span class="lt-slot lt-slot--wall" data-print="checkout-sign"><span class="lt-slot-face"></span>' + ph + '</span>',
  restaurants: (ph) => '<span class="lt-slot lt-slot--flat" data-print="restaurant-menu"><span class="lt-slot-face"></span></span>' +
    '<span class="lt-slot lt-slot--stand" data-print="restaurant-stand"><span class="lt-slot-face"></span>' + ph + '</span>'
};
const DOOR_SIZES = '(min-width: 1024px) 48vw, (min-width: 768px) 60vw, 120vw';
const SCENES = {
  'restaurants-door': { src: 'restaurants', door: true, alt: 'ستاند تقييم على طاولة كافيه، وجوال يلمسه' },
  'hosts-door': { src: 'hosts', door: true, alt: 'لوحة خروج جنب باب شقة، وجوال يلمسها' },
  'restaurants-hero': { src: 'restaurants', hero: true, alt: 'ستاند تقييم قوقل ومنيو على طاولة كافيه، وجوال يلمس الستاند' },
  'hosts-hero': { src: 'hosts', hero: true, alt: 'لوحة تسجيل خروج على جدار جنب باب شقة، وجوال يلمسها' }
};

// ===== الشاشات المصغرة (نفس دوال القوالب ونفس بيانات العرض) =====
// الشاشة المصغرة تعرض أول 851px بس، فنقص اللي تحت الطي عشان الصفحة تبقى خفيفة
const menu = Object.assign({}, ctx.MENU_DATA, { sections: ctx.MENU_DATA.sections.slice(0, 2).map((s, i) => i ? Object.assign({}, s, { items: s.items.slice(0, 2) }) : s) });
const guide = Object.assign({}, ctx.GUIDE_DATA, { ac: '', address: '', rules: [] });
// داخل صفحة الشركة: ولا h1 ثانية ولا main ثاني ولا header أو nav زيادة، وولا aria-live. rel = المسار من الصفحة لجذر website/
function tame(html, rel) {
  return html
    .replace(/<h1\b([^>]*)>/g, '<div$1 data-h="1">').replace(/<\/h1>/g, '</div>')
    .replace(/<h2\b([^>]*)>/g, '<div$1 data-h="2">').replace(/<\/h2>/g, '</div>')
    .replace(/<(header|nav|section|aside)\b/g, '<div').replace(/<\/(header|nav|section|aside)>/g, '</div>')
    .replace(/ (role="status"|aria-live="polite"|aria-label="[^"]*"|aria-labelledby="[^"]*"|aria-describedby="[^"]*")/g, '')
    // صورة مو صفحة: الروابط والأزرار تصير span (ما تنضغط ولا تنحسب أهداف لمس)
    .replace(/<(a|button)\b/g, '<span').replace(/<\/(a|button)>/g, '</span>')
    .replace(/ (href|target|rel|type)="[^"]*"/g, '')
    // صفحات الشركة فاتحة دايماً (GM-038): شعار المحل بنسخته الفاتحة بس. <source> الداكن كان يبدّل «مقهى المثال» و«شقق المثال»
    // لنسخهم الداكنة على شاشة فاتحة لما الجهاز داكن (AD-12)
    .replace(/<source\b[^>]*prefers-color-scheme:\s*dark[^>]*>/g, '')
    .replace(/(src|srcset)="\.\.\/_brands\//g, '$1="' + rel + 'demo/_brands/');
}
// الشاشة: صفحة بعرض 390، و style مكانها وتصغيرها داخل الخانة من الزاوية 0 0. .lt-page ترجعها لأدوار صفحة الزبون (فاتحة)
const mini = (cls, html, rel, style) => '<div class="c mini lt-page ' + cls + '" inert' + (style ? ' style="' + style + '"' : '') + '><div class="c-main">' + tame(html, rel) + '</div></div>';
const shots = {
  guide: (p, rel) => (st) => { const sos = site.emergency; site.emergency = []; try { return mini('mini--flats', R.guide(guide, { mini: true, p }).html, rel, st); } finally { site.emergency = sos; } },
  menu: (p, rel) => (st) => mini('mini--cafe', R.menu(menu, { mini: true, p }).html, rel, st),
  wifi: (p, rel) => (st) => mini('mini--cafe', R.wifi(ctx.WIFI_DATA, { mini: true, p }).html, rel, st),
  links: (p, rel) => (st) => mini('mini--cafe', R.links(ctx.LINKS_DATA, { mini: true, p }).html, rel, st)
};
// الشاشة داخل خانة رسمة: foreignObject بعد الخانة مباشرة (قبل الكاميرا، فتبقى الكاميرا فوق)
function slotFill(svg, slotRe, screenHtml) {
  const slot = svg.match(slotRe);
  if (!slot) throw new Error('slot not found: ' + slotRe);
  const [tag, x, y, w, h, rx] = slot, k = (+w / 390), H = Math.ceil(+h / k);
  const fo = '<foreignObject x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"><div class="fo-screen" style="position:relative;overflow:hidden;width:100%;height:100%;border-radius:' + rx + 'px">' +
    screenHtml('position:absolute;left:0;top:0;width:390px;height:' + H + 'px;transform:scale(' + k.toFixed(5) + ');transform-origin:0 0') + '</div></foreignObject>';
  return { tag, fo };
}
const rectRe = (id) => new RegExp('<rect id="' + id + '" x="([-\\d.]+)" y="([-\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"[^>]*/>');
// جوال (phone-frame.svg، web-illustrator §4): زخرفي (aria-hidden)، بدون title ولا id مكرر
const frame = fs.readFileSync(path.join(W, 'assets/illustrations/phone-frame.svg'), 'utf8').trim();
function phone(screenHtml) {
  const { tag, fo } = slotFill(frame, rectRe('pf-slot-screen'), screenHtml);
  return frame.replace(tag, tag.replace(/ id="[^"]*"/, '') + fo)
    .replace(/<title[^>]*>[^<]*<\/title>/, '').replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/ (role|aria-labelledby|data-slot|data-slot-radius)="[^"]*"/g, '')
    .replace(/^<svg /, '<svg class="h-phone-svg" aria-hidden="true" focusable="false" ');
}
// الشاشة بدون جسم الجوال (frame="false"، AD-41): الصفحة المصغرة بعرضها الحقيقي (390) داخل svg بـ viewBox، فتتصغر مع عرض البطاقة
// في أي مقاس بدون حساب. slice: تعبّي البطاقة حتى لو نسبتها ما طابقت 1:2 بالبكسل (الحد 1px). زخرفية (aria-hidden)، والشاشة inert
const SCREEN_W = 390, SCREEN_H = 780;
function screenOnly(screenHtml) {
  return '<svg class="h-screen-svg" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + SCREEN_W + ' ' + SCREEN_H +
    '" width="' + SCREEN_W + '" height="' + SCREEN_H + '" preserveAspectRatio="xMidYMin slice"><foreignObject x="0" y="0" width="' + SCREEN_W + '" height="' + SCREEN_H + '">' +
    '<div class="fo-screen" style="position:relative;overflow:hidden;width:100%;height:100%">' +
    screenHtml('position:absolute;left:0;top:0;width:' + SCREEN_W + 'px;height:' + SCREEN_H + 'px') + '</div></foreignObject></svg>';
}
function minisStyle() {
  // ألوان المحلين من محرك اللون، فاتح بس: صفحات الشركة فاتحة دايماً (GM-038، web-brand.md: بالداكن كان تباين صندوق الواي فاي 1.14)
  const vars = (x) => '--shop:' + x.shop + ';--on-shop:' + x.onShop + ';--shop-press:' + x.press + ';--shop-line:' + x.line + ';--shop-tint:' + x.tint + ';--shop-hl:' + x.hl;
  let style = '';
  for (const [cls, b] of [['mini--cafe', ctx.DEMO_BRANDS.cafe], ['mini--flats', ctx.DEMO_BRANDS.flats]]) style += '.' + cls + '{' + vars(ctx.shopColors(b).light) + '}';
  // تنسيق قالبي الروابط والواي فاي صغير، فينحط هنا بدل ملفين زيادة
  for (const f of ['templates/links/style.css', 'templates/wifi/style.css']) style += read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '');
  return '<style>' + style + '</style>';
}

// ===== الصور (WebP أو PNG أو JPEG بعرضين 800 و1600) =====
// المقاس من رأس الملف نفسه (WebP: VP8 و VP8L و VP8X، و PNG: IHDR، و JPEG: SOF)، عشان width و height صح (image-dimension)
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const c = b.toString('ascii', 12, 16);
    if (c === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (c === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (c === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  }
  if (b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error('unknown image format: ' + file);
}
// ملف بعرضين: يرجّع { u(عرض), a, b } أو null. base مسار من جذر website/ بدون -800.ext
function pair(base) {
  for (const ext of ['webp', 'png', 'jpg']) {
    const f = (wd) => path.join(W, base + '-' + wd + '.' + ext);
    if (!fs.existsSync(f(800)) || !fs.existsSync(f(1600))) continue;
    return { a: dims(f(800)), b: dims(f(1600)), u: (wd) => base + '-' + wd + '.' + ext };
  }
  return null;
}
const coverSizes = (b) => '(max-aspect-ratio: ' + b.w + '/' + b.h + ') ' + Math.ceil(100 * b.w / b.h) + 'vh, 100vw';
function imgTag(p, rel, o) {
  const src = (wd) => rel + p.u(wd);
  return '<img' + (o.tint ? ' data-tint' : '') + ' src="' + src(800) + '" srcset="' + src(800) + ' ' + p.a.w + 'w, ' + src(1600) + ' ' + p.b.w + 'w" sizes="' + attr(o.sizes) +
    '" width="' + p.b.w + '" height="' + p.b.h + '" alt="' + attr(o.alt || '') + '"' +
    (o.lcp ? (o.tint ? ' decoding="async"' : ' fetchpriority="high"') : ' loading="lazy" decoding="async"') + '>';
}
// طبقتين («الاتجاه 3» §4): الأبيض والأسود أول (هو اللي يطلع بدون JS)، والملونة فوقه data-tint (الحركة تكشفها، وتقليل الحركة يطلّعها على طول)
function layers(bwBase, colorBase, rel, o) {
  const bw = pair(bwBase), col = pair(colorBase);
  if (!bw || !col) return '';
  const sizes = o.sizes || (o.lcp ? coverSizes(bw.b) : '(min-width: 1024px) 50vw, 100vw');
  return imgTag(bw, rel, { sizes, alt: o.alt, lcp: o.lcp }) + imgTag(col, rel, { sizes, alt: '', lcp: o.lcp, tint: true });
}
function photo(slot, rel, o) {
  if (o.colorOnly) {
    const col = pair('assets/images/' + slot + '-color');
    if (!col) throw new Error('Missing color photograph: ' + slot);
    return imgTag(col, rel, { sizes: o.sizes || '100vw', alt: o.alt || '', lcp: !!o.lcp });
  }
  const out = layers('assets/images/' + slot + '-bw', 'assets/images/' + slot + '-color', rel, o);
  if (!out) throw new Error('ملفات الصورة ناقصة: assets/images/' + slot + '-bw/-color -800/-1600');
  return out;
}

// ===== المشاهد (GM-049/050) =====
function scene(key, rel, o) {
  const cfg = SCENES[key] || { src: key }, src = cfg.src, alt = o.alt != null ? o.alt : (cfg.alt || '');
  const bw = pair('assets/mockups/scene-' + src + '-bw'), col = pair('assets/mockups/scene-' + src + '-color');
  if (!bw || !col) return '<div class="s-scene s-scene--ph" data-scene="' + attr(src) + '" aria-hidden="true"></div>';
  const sizes = o.sizes || (cfg.door ? DOOR_SIZES : '100vw');
  const bg = (p, extra) => imgTag(p, rel, { sizes, alt: extra.alt, lcp: !!cfg.hero, tint: extra.tint }).replace('<img', '<img class="lt-scene-bg"');
  const ph = (o.phone || cfg.phone) === 'false' || cfg.phone === false ? '' : PHONE;
  return '<div class="lt-scene' + (cfg.door || cfg.hero || o.fill === 'true' ? ' lt-scene--fill' : '') + (cfg.door ? ' lt-scene--door' : '') + '" data-scene="' + attr(src) + '">' +
    '<div class="lt-scene-stage"' + (cfg.door || o.scan === 'tint' ? ' data-scan="tint"' : '') + '>' +
    bg(bw, { alt }) + bg(col, { alt: '', tint: true }) + (SLOTS[src] ? SLOTS[src](ph) : '').replace(o.target ? 'data-print="' + o.target + '"' : /(?!)/,
      (m) => m + ' data-story-target' + (o.pulse === 'true' ? ' data-pulse' : '')) + '</div></div>';
}
// تنسيق المشاهد وسكربتاتها (لو موجودة): scenes.css، ثم print-art.js (قائمة صور الطباعة)، ثم scenes.js (يحطها في الخانات). defer، بدون أي طلب لملف مو موجود
function scenesHead(rel, withJs) {
  let out = has('assets/scenes.css') ? '<link rel="stylesheet" href="' + rel + 'assets/scenes.css">' : '';
  if (withJs) for (const f of ['assets/mockups/print-art.js', 'assets/scenes.js']) if (has(f)) out += '<script src="' + rel + f + '" defer></script>';
  return out;
}

// ===== الباركود =====
function qrSvg(url, label) {
  const { n, path: d } = qrPath(ctx.qrcode, url), v = n + 8;
  return '<svg class="m-qr" viewBox="-4 -4 ' + v + ' ' + v + '" width="' + v * 8 + '" height="' + v * 8 + '" shape-rendering="crispEdges" ' +
    (label ? 'role="img" aria-label="' + attr(label) + '"' : 'aria-hidden="true" focusable="false"') + ' data-qr-url="' + attr(url) + '"><path fill="currentColor" d="' + d + '"/></svg>';
}
// باركود البداية بتصحيح H وفتحة في وسطه للرمز: الرمز 8×8 وحدات بالضبط وحوله وحدة فاضية = فتحة 10×10 (7.3% من 37×37، §11.2)،
// وما يغطي مربعات الزوايا ولا خطوط التوقيت ولا مربع المحاذاة. الرمز نافذة على ملف الشعار الأفقي (بدون تعديل ولا نسخ، GM-036/042)
function qrLogo(url, rel) {
  const probe = qrPath(ctx.qrcode, url, 'H'), n = probe.n;
  if (n >= 45) throw new Error('الرابط طويل: باركود H نسخة 7 أو أكبر فيه مربع محاذاة في الوسط، والرمز بيغطيه (' + url + ')');
  // الباركود ضلعه فردي، فالفتحة الزوجية تبعد نص وحدة عن النص بالضبط (عشان حواف الرمز تبقى على خطوط الوحدات)
  const k = 10, q = qrPath(ctx.qrcode, url, 'H', k), v = n + 8, pct = (x) => +(100 * x / v).toFixed(4) + '%';
  const x0 = q.hole[0], box = 'left:' + pct(4 + x0 + 1) + ';top:' + pct(4 + x0 + 1) + ';width:' + pct(k - 2) + ';height:' + pct(k - 2);
  return '<svg class="m-qr" viewBox="-4 -4 ' + v + ' ' + v + '" width="' + v * 8 + '" height="' + v * 8 + '" style="--qv:' + v + '" shape-rendering="crispEdges" role="img" aria-label="باركود فيه رمز لمسة تاب، يفتح الدليل التجريبي" data-qr-url="' + attr(url) + '" data-qr-hole="' + x0 + ' ' + k + '">' +
    '<path fill="currentColor" d="' + q.path + '"/><path data-qr-center fill="none" d="' + q.center + '"/></svg>' +
    '<span class="h-open-sym" data-open-sym style="' + box + '"><img src="' + rel + LOGO.h + '" alt="" width="1069" height="200"></span>';
}
const DEMOS = ['menu', 'rental-guide', 'wifi', 'links', 'review'];

// ===== الشعار (GM-041/042): ملفات v1.0.0 بالحبر في assets/brand/، فاتح بس (ولا نسخ داكنة). الملفات نفسها ما نلمسها =====
const LOGO = {
  h: 'assets/brand/logo-horizontal.svg',               // الأفقي: رأس الصفحات، ونافذتي الرمز والكلمة في البداية، وورقة QR
  stack: 'assets/brand/logo-stack.svg',                // المكدّس: التذييل بعرض 120 تحت 1024
  stackSince: 'assets/brand/logo-stack-since.svg'      // المكدّس مع «SINCE 2026»: التذييل من 1024 (عرض 160، لأنه يبي 160 أو أكثر)
};
// نسبة العرض للارتفاع من viewBox الملف، عشان width و height في <img> (image-dimension)
function ratio(f) {
  const m = read(f).match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (!m) throw new Error('الشعار بدون viewBox: ' + f);
  return +m[1] / +m[2];
}
const logoImg = (rel, f, cls, h) => '<img class="' + cls + '" src="' + rel + f + '" width="' + Math.round(h * ratio(f)) + '" height="' + h + '" alt="لمسة تاب — LamsaTap" data-company-alt>';
const logoW = (rel, f, cls, w) => '<img class="' + cls + '" src="' + rel + f + '" width="' + w + '" height="' + Math.round(w / ratio(f)) + '" alt="لمسة تاب — LamsaTap" data-company-alt>';
const WORD = {
  head: (rel) => '<a class="s-word" href="' + rel + 'index.html" data-company>لمسة تاب</a>',
  foot: '<p class="s-foot-name" data-company>لمسة تاب</p>',
  sheet: '<p class="q-word" data-company>لمسة تاب</p>'
};
const logo = {
  head: (rel) => !has(LOGO.h) ? WORD.head(rel) : '<a class="s-logo-link" href="' + rel + 'index.html">' + logoImg(rel, LOGO.h, 's-logo-h', 40) + '</a>',
  foot: (rel) => !has(LOGO.stack) ? WORD.foot :
    (has(LOGO.stackSince) ? '<picture class="s-foot-logo"><source srcset="' + rel + LOGO.stackSince + '" media="(min-width: 1024px)" width="160" height="' + Math.round(160 / ratio(LOGO.stackSince)) + '">' + logoW(rel, LOGO.stack, 's-logo-stack', 120) + '</picture>' : logoW(rel, LOGO.stack, 's-logo-stack', 120)),
  sheet: (rel) => !has(LOGO.h) ? WORD.sheet : logoImg(rel, LOGO.h, 'q-logo', 45)
};

// ===== مفتاح العلامة ← محتواها =====
function resolve(key, page, rel, o) {
  const [kind, name] = [key.split(':')[0], key.split(':').slice(1).join(':')];
  if (key === 'logo:head') return logo.head(rel);
  if (key === 'logo:foot' && o.layout === 'horizontal') return '<img class="h-footer-logo" src="' + rel + LOGO.h + '" width="214" height="40" alt="لمسة تاب — LamsaTap" data-company-alt>';
  if (key === 'logo:foot') return logo.foot(rel);
  if (key === 'logo:sheet') return logo.sheet(rel);
  if (key === 'minis-style') return minisStyle();
  if (key === 'scenes') return scenesHead(rel, true);
  if (key === 'scenes-css') return scenesHead(rel, false);
  if (key === 'qr:logo') return qrLogo(DOMAIN + '/demo/rental-guide/', rel);
  if (key === 'qr:field') return qrSvg(DOMAIN + '/demo/rental-guide/', 'باركود يفتح الدليل التجريبي');
  if (kind === 'qr' && DEMOS.includes(name)) return qrSvg(DOMAIN + '/demo/' + name + '/', '');
  if (key === 'stand:review') {
    // «مقهى المثال» ولونه من demo/_brands/brands.js، والباركود يودّي لصفحة الشرح (نفس رابط ورقة QR في demo/review/config.js)
    const html = standHtml({ dims: ctx.PRINT_DIMS.stand, qrcode: ctx.qrcode, title: 'قيّمنا في قوقل', logo: rel + 'demo/_brands/cafe.svg', color: ctx.DEMO_BRANDS.cafe.color, url: DOMAIN + '/demo/review/' });
    return o.pulse === 'true' ? html.replace('<span class="lt-stand-dot"', '<span class="lt-stand-dot" data-pulse') : html;
  }
  if (kind === 'phone') {
    const shot = name.split('-')[0];
    if (!shots[shot]) throw new Error('شاشة مو معروفة في ' + page + ': ' + key + ' (المعروفة: ' + Object.keys(shots).join('، ') + ')');
    const screen = shots[shot]('p' + name.replace(/[^a-z0-9]/g, '') + '-', rel);   // بادئة id مختلفة لكل نسخة
    return o.frame === 'false' ? screenOnly(screen) : phone(screen);
  }
  if (key === 'img:hero') {
    if (!HERO_PHOTO[page]) throw new Error('img:hero بدون صورة بطل لـ ' + page + ' (HERO_PHOTO)');
    if (page === 'hosts/index.html') {
      const plate = pair('assets/images/' + HERO_PHOTO[page]);
      if (!plate) throw new Error('Missing blank host symbol plate.');
      const sizes = o.sizes || '100vw';
      return imgTag(plate, rel, { sizes, alt: o.alt || '', lcp: true }) + imgTag(plate, rel, { sizes, alt: '', tint: true }).replace('<img', '<img data-lift-photo');
    }
    return photo(HERO_PHOTO[page], rel, { lcp: true, alt: o.alt || '', sizes: o.sizes });
  }
  if (key === 'card:restaurant') return buildRestaurantCard({ url: DOMAIN + '/demo/menu/' }).svg;
  if (key === 'card:host') return buildHostCard().svg;
  if (kind === 'photo') return photo(name, rel, { alt: o.alt || '', sizes: o.sizes, colorOnly: o.color === 'true' });
  if (kind === 'scene') return scene(name, rel, o);
  throw new Error('علامة مو معروفة في ' + page + ': @@' + key);
}

// الصفحات بالترتيب. اللي ما انبنت (restaurants/ و hosts/ الحين) تنتخطى بدون خطأ
const PAGES = ['index.html', 'restaurants/index.html', 'hosts/index.html', 'demo/review/index.html', 'demo/review/qr-sheet.html'];
// <!-- @@مفتاح[ attributes أو : تعليق] --> المحتوى <!-- /@@مفتاح -->
const MARK = /(<!-- @@([a-z][\w.-]*(?::[\w.-]+)*)((?::?\s)[^>]*?)? -->)([\s\S]*?)(<!-- \/@@\2 -->)/g;
const targets = process.argv.slice(2).map((p) => p.replace(/\\/g, '/').replace(/^website\//, ''));
for (const t of targets) if (!PAGES.includes(t)) throw new Error('صفحة مو معروفة: ' + t + ' (المعروفة: ' + PAGES.join('، ') + ')');
for (const page of (targets.length ? targets : PAGES)) {
  if (!has(page)) { console.log(page + ': ما انبنت للحين (انتخطت)'); continue; }
  const rel = '../'.repeat(page.split('/').length - 1), before = read(page), sizes = [];
  const html = before.replace(MARK, (m, open, key, tail, _old, close) => {
    const o = {}; String(tail || '').replace(/([\w-]+)="([^"]*)"/g, (x, k, v) => { o[k] = v; });
    const v = resolve(key, page, rel, o);
    sizes.push(key + ' ' + Buffer.byteLength(v) + 'B');
    return open + v + close;
  });
  if (html !== before) fs.writeFileSync(path.join(W, page), html);
  console.log(page + (html !== before ? ' (انكتب)' : ' (ما تغيّر)') + ': ' + (sizes.join(', ') || 'ولا علامة'));
  console.log('  الحجم:', Buffer.byteLength(html), 'bytes');
}
