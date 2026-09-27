// يولّد الشاشات المصغرة والصور في الرئيسية (website/index.html) حسب «الاتجاه 2» §4 و§5 (web-art-director.md):
// - جوال البطل: دليل الوحدة الحقيقي داخل phone-frame.svg.
// - الأمثلة الأربع: الدليل، والمنيو، والواي فاي، والروابط، كل وحدة داخل جوال.
// - «كيف نشتغل»: مشهد hero-counter.svg ومنيوه المصغر.
// - الصور الأربع (ص1 إلى ص4): تنحط بس لو ملفاتها موجودة في website/assets/images/ (بعد إذن التنزيل والتحويل).
// نفس دوال render.js ونفس بيانات demo/ ونفس classes، فاللي يشوفه الزائر هو اللي يطلع. الرئيسية ما تشغّل render.js (ثابتة، أخف).
// - ستاند التقييم (التقييم 2، القرار 2): tools/stand.cjs بمقاسات print/dims.js وباركود حقيقي، في صفحة الشرح (والرئيسية بعدين).
// التشغيل (من جذر المشروع): node tools/build-home-minis.cjs [صفحات...]
//   بدون صفحات = كلها (index.html و demo/review/index.html و demo/review/qr-sheet.html). مع صفحة = هي بس، مثل: node tools/build-home-minis.cjs demo/review/index.html
//   الملف ما ينكتب إلا لو محتواه تغيّر.
// أعد تشغيله بعد أي تعديل في templates/*/render.js أو demo/*/data.js أو demo/_brands/ أو assets/client.js أو محرك اللون،
// أو assets/brand/tokens.css، أو لما تنضاف صورة في assets/images/.
const fs = require('fs'), path = require('path'), vm = require('vm');
const W = path.join(__dirname, '..', 'website');
const read = (f) => fs.readFileSync(path.join(W, f), 'utf8');

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
ctx.LT_NO_MOUNT = true;
['demo/menu/data.js', 'templates/menu/render.js', 'demo/wifi/data.js', 'templates/wifi/render.js',
  'demo/links/data.js', 'templates/links/render.js', 'demo/rental-guide/data.js', 'templates/rental-guide/render.js'].forEach(run);
const R = ctx.LT_RENDER;

// الشاشة المصغرة تعرض أول 851px بس، فنقص اللي تحت الطي عشان الصفحة تبقى خفيفة
const menu = Object.assign({}, ctx.MENU_DATA, { sections: ctx.MENU_DATA.sections.slice(0, 2).map((s, i) => i ? Object.assign({}, s, { items: s.items.slice(0, 2) }) : s) });
const guide = Object.assign({}, ctx.GUIDE_DATA, { ac: '', address: '', rules: [] });
const site = ctx.SITE; const sos = site.emergency;

// داخل الرئيسية: ولا h1 ثانية ولا main ثاني ولا header أو nav زيادة، وولا aria-live
function tame(html) {
  return html
    .replace(/<h1\b([^>]*)>/g, '<div$1 data-h="1">').replace(/<\/h1>/g, '</div>')
    .replace(/<h2\b([^>]*)>/g, '<div$1 data-h="2">').replace(/<\/h2>/g, '</div>')
    .replace(/<(header|nav|section|aside)\b/g, '<div').replace(/<\/(header|nav|section|aside)>/g, '</div>')
    .replace(/ (role="status"|aria-live="polite"|aria-label="[^"]*"|aria-labelledby="[^"]*"|aria-describedby="[^"]*")/g, '')
    // صورة مو صفحة: الروابط والأزرار تصير span (ما تنضغط ولا تنحسب أهداف لمس)
    .replace(/<(a|button)\b/g, '<span').replace(/<\/(a|button)>/g, '</span>')
    .replace(/ (href|target|rel|type)="[^"]*"/g, '')
    .replace(/(src|srcset)="\.\.\/_brands\//g, '$1="demo/_brands/');
}
// الشاشة: صفحة بعرض 390. style = مكانها وتصغيرها داخل الخانة من الزاوية 0 0 (ملاحظة web-illustrator §7 عن RTL)
// .lt-page (tokens.css): الشاشة ترجع لأدوار الصفحة حتى لو جوالها على لوحة الحبر (صفحة الزبون فاتحة في الفاتح)
const mini = (cls, html, style) => '<div class="c mini lt-page ' + cls + '" inert' + (style ? ' style="' + style + '"' : '') + '><div class="c-main">' + tame(html) + '</div></div>';
const shots = {
  guide: (p) => (st) => mini('mini--flats', R.guide(guide, { mini: true, p }).html, st),
  menu: (p) => (st) => mini('mini--cafe', R.menu(menu, { mini: true, p }).html, st),
  wifi: (p) => (st) => mini('mini--cafe', R.wifi(ctx.WIFI_DATA, { mini: true, p }).html, st),
  links: (p) => (st) => mini('mini--cafe', R.links(ctx.LINKS_DATA, { mini: true, p }).html, st)
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

// مشهد (website/assets/illustrations/، web-illustrator.md §2): inline، والنص البديل من web-copy «الاتجاه 2» ج6
function scene(file, slotId, alt, screenHtml) {
  let svg = fs.readFileSync(path.join(W, 'assets/illustrations', file), 'utf8').trim();
  const { tag, fo } = slotFill(svg, rectRe(slotId), screenHtml);
  svg = svg.replace(tag, tag + fo).replace(/(<title id="[^"]*">)[^<]*(<\/title>)/, (m, a, b) => a + alt + b);
  return svg.replace(/^<svg /, '<svg class="h-scene-svg" ');
}
// جوال (phone-frame.svg، web-illustrator §4): زخرفي (aria-hidden)، بدون title ولا id مكرر.
// تنسيق حافته في الداكن وعلى الحبر في home.css (.pf-edge)
const frame = fs.readFileSync(path.join(W, 'assets/illustrations/phone-frame.svg'), 'utf8').trim();
function phone(screenHtml) {
  const { tag, fo } = slotFill(frame, rectRe('pf-slot-screen'), screenHtml);
  return frame.replace(tag, tag.replace(/ id="[^"]*"/, '') + fo)
    .replace(/<title[^>]*>[^<]*<\/title>/, '').replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/ (role|aria-labelledby|data-slot|data-slot-radius)="[^"]*"/g, '')
    .replace(/^<svg /, '<svg class="h-phone-svg" aria-hidden="true" focusable="false" ');
}

// الصور (§5.3): WebP (أو JPEG) بعرضين 800 و1600 في assets/images/. بدون ملف: الخانة تبقى فاضية بتعبئتها
const IMGS = {
  'hero-hospitality': { sizes: '(min-width: 1024px) 50vw, 100vw', hero: true },
  'host-entry': { sizes: '(min-width: 1024px) 40vw, 100vw' },
  'shop-counter': { sizes: '(min-width: 1024px) 40vw, 100vw' },
  'touch-moment': { sizes: '(min-width: 1024px) 50vw, 100vw' }
};
// المقاس من رأس الملف نفسه (WebP: VP8 و VP8L و VP8X، و JPEG: SOF)، عشان width و height صح (image-dimension)
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const c = b.toString('ascii', 12, 16);
    if (c === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (c === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (c === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
  }
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error('unknown image format: ' + file);
}
function img(name) {
  const cfg = IMGS[name];
  for (const ext of ['webp', 'jpg']) {
    const f = (wd) => path.join(W, 'assets/images', name + '-' + wd + '.' + ext);
    if (!fs.existsSync(f(800)) || !fs.existsSync(f(1600))) continue;
    const a = dims(f(800)), b = dims(f(1600)), u = (wd) => 'assets/images/' + name + '-' + wd + '.' + ext;
    return '<img src="' + u(800) + '" srcset="' + u(800) + ' ' + a.w + 'w, ' + u(1600) + ' ' + b.w + 'w" sizes="' + cfg.sizes + '" width="' + b.w + '" height="' + b.h +
      '" alt=""' + (cfg.hero ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"') + '>';
  }
  return '';
}

// ستاند التقييم (القرار 2): شعار «مقهى المثال» ولونه من demo/_brands/brands.js، والباركود يودّي لصفحة الشرح
// (SITE.domain + /demo/review/، نفس رابط ورقة QR في demo/review/config.js). logo = مسار الشعار من الصفحة نفسها
const stand = (logo) => standHtml({
  dims: ctx.PRINT_DIMS.stand, qrcode: ctx.qrcode, title: 'قيّمنا في قوقل', logo, color: ctx.DEMO_BRANDS.cafe.color,
  url: String(site.domain || 'https://example.com').replace(/\/+$/, '') + '/demo/review/'
});

// خانات الشعار (GM-036): كل خانة تاخذ ملف SVG بمسار واحد في assets/brand/، والملفات يسلمها المدير العام (ما نلمسها).
// لين توصل: الكلمة «لمسة تاب» نص مثل الحين (بدون صورة مكسورة ولا طلب 404). يوم التسليم: الملفات هنا، ثم هالسكربت.
const LOGO = {
  h: 'assets/brand/logo-horizontal.svg',                 // الأفقي على الفاتح (رأس الرملي، وورقة QR)
  hDark: 'assets/brand/logo-horizontal-dark.svg',        // الأفقي على الحبر والداكن (رأس الرئيسية، والرملي في الداكن)
  stack: 'assets/brand/logo-stack-dark.svg',             // المكدّس على الحبر (التذييل)
  stackSince: 'assets/brand/logo-stack-since-dark.svg'   // نفسه مع «SINCE 2026»: بس لما عرضه 160px أو أكثر
};
const hasFile = (f) => fs.existsSync(path.join(W, f));
// نسبة العرض للارتفاع من viewBox الملف، عشان width و height في <img> (image-dimension)
function ratio(f) {
  const m = fs.readFileSync(path.join(W, f), 'utf8').match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (!m) throw new Error('الشعار بدون viewBox: ' + f);
  return +m[1] / +m[2];
}
const logoImg = (rel, f, cls, h) => '<img class="' + cls + '" src="' + rel + f + '" width="' + Math.round(h * ratio(f)) + '" height="' + h + '" alt="لمسة تاب — LamsaTap" data-company-alt>';
// rel = المسار من الصفحة لجذر website/ ('' للرئيسية، و'../../' لصفحات demo)
const logo = {
  // رأس على الرملي: الفاتح، وفي الداكن نسخة الداكن لو موجودة
  headPage: (rel, fallback) => !hasFile(LOGO.h) ? fallback : '<a class="s-logo-link" href="' + rel + 'index.html">' +
    (hasFile(LOGO.hDark) ? '<picture><source srcset="' + rel + LOGO.hDark + '" media="(prefers-color-scheme: dark)">' + logoImg(rel, LOGO.h, 's-logo-h', 44) + '</picture>' : logoImg(rel, LOGO.h, 's-logo-h', 44)) + '</a>',
  // رأس على الحبر (نفس الشي بالوضعين)
  headInk: (rel, fallback) => !hasFile(LOGO.hDark) ? fallback : '<a class="s-logo-link" href="' + rel + 'index.html">' + logoImg(rel, LOGO.hDark, 's-logo-h', 44) + '</a>',
  // التذييل على الحبر: المكدّس، و«SINCE 2026» من 1024 (عرضه هناك 160px)
  foot: (rel, fallback) => !hasFile(LOGO.stack) ? fallback :
    (hasFile(LOGO.stackSince) ? '<picture><source srcset="' + rel + LOGO.stackSince + '" media="(min-width: 1024px)">' + logoImg(rel, LOGO.stack, 's-logo-stack', 120) + '</picture>' : logoImg(rel, LOGO.stack, 's-logo-stack', 120)),
  // ورقة QR (ورق أبيض): الأفقي الفاتح بارتفاع 12mm
  sheet: (rel, fallback) => !hasFile(LOGO.h) ? fallback : logoImg(rel, LOGO.h, 'q-logo', 45)
};
const WORD = {
  review: '<a class="s-word" href="../../index.html" data-company>لمسة تاب</a>',
  reviewFoot: '<p class="s-foot-name" data-company>لمسة تاب</p>',
  sheet: '<p class="q-word" data-company>لمسة تاب</p>'
};

// المخرجات لكل صفحة (تنحسب بس لو الصفحة مطلوبة)
function homeOut() {
  // كل نسخة ببادئة id مختلفة (§4)
  site.emergency = [];
  const out = {
    'phone:hero': phone(shots.guide('hg-')),
    'phone:ex-guide': phone(shots.guide('eg-')),
    'phone:ex-menu': phone(shots.menu('em-')),
    'phone:ex-wifi': phone(shots.wifi('ew-')),
    'phone:ex-links': phone(shots.links('el-')),
    'scene:counter': scene('hero-counter.svg', 'hc-slot-menu', 'جوال يلمس ستاند «مقهى المثال» على كاونتر القهوة، وعلى شاشته منيو المقهى.', shots.menu('mh-'))
  };
  for (const n of Object.keys(IMGS)) out['img:' + n] = img(n);
  site.emergency = sos;
  // ألوان المحلين من محرك اللون، على صندوق الشاشة المصغرة (فاتح وداكن)
  const vars = (x) => '--shop:' + x.shop + ';--on-shop:' + x.onShop + ';--shop-press:' + x.press + ';--shop-line:' + x.line + ';--shop-tint:' + x.tint + ';--shop-hl:' + x.hl;
  let style = '';
  for (const [cls, b] of [['mini--cafe', ctx.DEMO_BRANDS.cafe], ['mini--flats', ctx.DEMO_BRANDS.flats]]) {
    const t = ctx.shopColors(b);
    style += '.' + cls + '{' + vars(t.light) + '}@media (prefers-color-scheme:dark){.' + cls + '{' + vars(t.dark) + '}}';
  }
  // تنسيق قالبي الروابط والواي فاي صغير، فينحط هنا بدل ملفين زيادة
  for (const f of ['templates/links/style.css', 'templates/wifi/style.css']) style += read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '');
  out['minis-style'] = '<style>' + style + '</style>';
  return out;
}
const PAGES = {
  'index.html': homeOut,
  'demo/review/index.html': () => ({
    'stand:review': stand('../_brands/cafe.svg'),
    'logo:head': logo.headPage('../../', WORD.review),
    'logo:foot': logo.foot('../../', WORD.reviewFoot)
  }),
  'demo/review/qr-sheet.html': () => ({ 'logo:sheet': logo.sheet('../../', WORD.sheet) })
};

// نكتبها بين العلامات في كل صفحة مطلوبة
const targets = process.argv.slice(2).map((p) => p.replace(/\\/g, '/').replace(/^website\//, ''));
for (const page of (targets.length ? targets : Object.keys(PAGES))) {
  if (!PAGES[page]) throw new Error('صفحة مو معروفة: ' + page + ' (المعروفة: ' + Object.keys(PAGES).join('، ') + ')');
  const out = PAGES[page](), before = read(page);
  let html = before;
  for (const [k, v] of Object.entries(out)) {
    const re = new RegExp('(<!-- @@' + k.replace(/[-]/g, '\\-') + '(?::[^>]*)? -->)[\\s\\S]*?(<!-- /@@' + k.replace(/[-]/g, '\\-') + ' -->)');
    if (!re.test(html)) throw new Error('marker not found in ' + page + ': ' + k);
    html = html.replace(re, (m, a, b) => a + v + b);
  }
  if (html !== before) fs.writeFileSync(path.join(W, page), html);
  console.log(page + (html !== before ? ' (انكتب)' : ' (ما تغيّر)') + ':', Object.keys(out).map((k) => k + ' ' + Buffer.byteLength(out[k]) + 'B').join(', '));
  console.log('  الحجم:', Buffer.byteLength(html), 'bytes');
}
