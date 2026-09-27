// يولّد الشاشات المصغرة في الرئيسية (website/index.html) من صفحات العرض الحقيقية (الموجز الفني §4.4):
// نفس دوال render.js ونفس بيانات demo/ ونفس classes، فاللي يشوفه الزائر هو اللي يطلع. الرئيسية ما تشغّل render.js (ثابتة، أخف).
// التشغيل (من جذر المشروع): node tools/build-home-minis.cjs
// أعد تشغيله بعد أي تعديل في templates/*/render.js أو demo/*/data.js أو demo/_brands/ أو assets/client.js أو محرك اللون.
const fs = require('fs'), path = require('path'), vm = require('vm');
const W = path.join(__dirname, '..', 'website');
const read = (f) => fs.readFileSync(path.join(W, f), 'utf8');

// بيئة متصفح بسيطة: الدوال اللي تبني النص بس (ما فيه DOM حقيقي)
const noop = () => {};
const doc = { currentScript: null, addEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], documentElement: { getAttribute: () => null }, title: '' };
const ctx = { document: doc, console, Math, JSON, Object, Array, String, Number, RegExp, encodeURIComponent, setTimeout: noop, navigator: {} };
ctx.window = ctx; vm.createContext(ctx);
const run = (f) => vm.runInContext(read(f), ctx, { filename: f });
['config.js', 'assets/app.js', 'assets/shop-color.js', 'assets/client.js', 'demo/_brands/brands.js'].forEach(run);
ctx.LT_NO_MOUNT = true;
['demo/menu/data.js', 'templates/menu/render.js', 'demo/wifi/data.js', 'templates/wifi/render.js',
  'demo/links/data.js', 'templates/links/render.js', 'demo/rental-guide/data.js', 'templates/rental-guide/render.js'].forEach(run);
const R = ctx.LT_RENDER;

// الشاشة المصغرة تعرض أول 851px بس، فنقص اللي تحت الطي عشان الصفحة تبقى خفيفة
const menu = Object.assign({}, ctx.MENU_DATA, { sections: ctx.MENU_DATA.sections.slice(0, 2).map((s, i) => i ? Object.assign({}, s, { items: s.items.slice(0, 2) }) : s) });
const guide = Object.assign({}, ctx.GUIDE_DATA, { ac: '', address: '', rules: [] });
const site = ctx.SITE; const sos = site.emergency; site.emergency = [];

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
// الشاشة: صفحة بعرض 390. style = مكانها وتصغيرها (في مشهد: داخل الخانة من الزاوية 0 0، ملاحظة web-illustrator §7 عن RTL)
const mini = (cls, html, style) => '<div class="c mini ' + cls + '" inert' + (style ? ' style="' + style + '"' : '') + '><div class="c-main">' + tame(html) + '</div></div>';
const out = {
  'mini:menu2': mini('mini--cafe', R.menu(menu, { mini: true, p: 'mf-' }).html),
  'mini:wifi': mini('mini--cafe', R.wifi(ctx.WIFI_DATA, { mini: true, p: 'mw-' }).html),
  'mini:links': mini('mini--cafe', R.links(ctx.LINKS_DATA, { mini: true, p: 'ml-' }).html)
};

// المشاهد (website/assets/illustrations/، web-illustrator.md §2 و §3): inline، والشاشة داخل foreignObject بعد الخانة مباشرة
// (قبل دائرة الكاميرا، فتبقى الكاميرا فوق). النص البديل من web-copy.md §5 (مرجع النصوص)
function scene(file, slotId, alt, screenHtml) {
  let svg = fs.readFileSync(path.join(W, 'assets/illustrations', file), 'utf8').trim();
  const slot = svg.match(new RegExp('<rect id="' + slotId + '" x="([-\\d.]+)" y="([-\\d.]+)" width="([\\d.]+)" height="([\\d.]+)" rx="([\\d.]+)"[^>]*/>'));
  if (!slot) throw new Error('slot not found: ' + slotId);
  const [tag, x, y, w, h, rx] = slot, k = (+w / 390), H = Math.ceil(+h / k);
  const fo = '<foreignObject x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"><div class="fo-screen" style="position:relative;overflow:hidden;width:100%;height:100%;border-radius:' + rx + 'px">' +
    screenHtml('position:absolute;left:0;top:0;width:390px;height:' + H + 'px;transform:scale(' + k.toFixed(5) + ');transform-origin:0 0') + '</div></foreignObject>';
  const slotTag = slotId === 'hc-slot-menu' ? tag.replace(/fill="#FFFFFF"/, 'fill="#14201F"') : tag;
  svg = svg.replace(tag, slotTag + fo).replace(/(<title id="[^"]*">)[^<]*(<\/title>)/, (m, a, b) => a + alt + b);
  return svg.replace(/^<svg /, '<svg class="h-scene-svg" ');
}
out['scene:hero'] = scene('hero-counter.svg', 'hc-slot-menu', 'جوال يلمس ستاند «مقهى المثال» على كاونتر القهوة، وعلى شاشته منيو المقهى.',
  (st) => mini('mini--cafe', R.menu(menu, { mini: true, p: 'mh-' }).html, st));
out['scene:host'] = scene('host-door.svg', 'hd-slot-guide', 'جوال يلمس ملصق الشريحة جنب باب «شقق المثال»، وعلى شاشته دليل الوحدة.',
  (st) => mini('mini--flats', R.guide(guide, { mini: true, p: 'mg-' }).html, st));
site.emergency = sos;

// ألوان المحلين من محرك اللون، على صندوق الشاشة المصغرة (فاتح وداكن)
const vars = (x) => '--shop:' + x.shop + ';--on-shop:' + x.onShop + ';--shop-press:' + x.press + ';--shop-line:' + x.line + ';--shop-tint:' + x.tint + ';--shop-hl:' + x.hl;
let style = '';
for (const [cls, b] of [['mini--cafe', ctx.DEMO_BRANDS.cafe], ['mini--flats', ctx.DEMO_BRANDS.flats]]) {
  const t = ctx.shopColors(b);
  style += '.' + cls + '{' + vars(t.light) + '}@media (prefers-color-scheme:dark){.' + cls + '{' + vars(t.dark) + '}}';
}
out['minis-style'] = '<style>' + style + '</style>';

// نكتبها بين العلامات في index.html
let html = read('index.html');
for (const [k, v] of Object.entries(out)) {
  const re = new RegExp('(<!-- @@' + k.replace(/[-]/g, '\\-') + '(?::[^>]*)? -->)[\\s\\S]*?(<!-- /@@' + k.replace(/[-]/g, '\\-') + ' -->)');
  if (!re.test(html)) throw new Error('marker not found: ' + k);
  html = html.replace(re, (m, a, b) => a + v + b);
}
fs.writeFileSync(path.join(W, 'index.html'), html);
console.log('minis written:', Object.keys(out).map((k) => k + ' ' + out[k].length + 'B').join(', '));
console.log('index.html:', Buffer.byteLength(html), 'bytes');
