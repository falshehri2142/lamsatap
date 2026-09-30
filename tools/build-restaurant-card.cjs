'use strict';
// Build the transparent native card overlay. No photographs or website sources
// are modified. The only outputs are the SVG, inline fragment and report below.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const web = path.join(root, 'website');
const output = path.join(root, 'work/2026-09-29-symbol-lift');
const destinations = {
  artwork: path.join(output, 'card-art.svg'),
  fragment: path.join(output, 'native-card-fragment.html'),
  report: path.join(output, 'card-art-report.json')
};
const qrcode = require(path.join(web, 'vendor/qrcode-generator.js'));
const { qrPath } = require('./stand.cjs');
const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const number = value => Number(value.toFixed(6));

function buildRestaurantCard({ url: providedUrl } = {}) {
const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(web, 'config.js'), 'utf8'), context, { filename: 'website/config.js' });
const domain = String(context.SITE.domain || 'https://example.com').replace(/\/+$/, '');
const url = providedUrl === undefined ? domain + '/demo/menu/' : String(providedUrl);
if (!/^https?:\/\//.test(url) || !url.endsWith('/demo/menu/')) throw new Error('QR destination must be the configured demo menu.');

const qr = qrPath(qrcode, url, 'H', 10);
if (qr.n >= 45) throw new Error('QR is too dense for the existing central symbol-hole pattern.');
const sourceLogo = path.join(web, 'assets/brand/logo-horizontal.svg');
const logoBefore = fs.readFileSync(sourceLogo);
const nativePaths = [...logoBefore.toString('utf8').matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m => m[1]);
if (nativePaths.length !== 1) throw new Error('Expected one native combined logo path.');
const marker = 'M0.1 46.81';
const fullPath = nativePaths[0], cut = fullPath.indexOf(marker);
if (cut <= 0 || fullPath.indexOf(marker, cut + marker.length) !== -1) throw new Error('Native symbol marker is missing or duplicated.');
const wordPath = fullPath.slice(0, cut);
const symbolPath = fullPath.slice(cut);
if ((symbolPath.match(/M/g) || []).length !== 4) throw new Error('Expected the four native symbol pieces.');

const ink = '#14201F';
const qrBox = { x: 650, y: 342, size: 220 };
const unit = qrBox.size / qr.n;
const symbolBox = {
  x: qrBox.x + (qr.hole[0] + 1) * unit,
  y: qrBox.y + (qr.hole[0] + 1) * unit,
  width: 8 * unit,
  height: 8 * unit
};
const center = { x: symbolBox.x + symbolBox.width / 2, y: symbolBox.y + symbolBox.height / 2 };
const wordBox = { x: 650, y: 595, width: 220, height: 220 * 105 / 808.75 };
const registration = [symbolBox.x, symbolBox.y, symbolBox.width].map(number).join(' ');
const svg = `<svg class="r-card-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" role="img" aria-label="باركود المنيو التجريبي من لمسة تاب، امسحه بجوالك" data-qr-url="${xml(url)}" data-card-symbol-box="${registration}">
  <g class="r-card-qr" transform="translate(${qrBox.x} ${qrBox.y}) scale(${number(unit)})" shape-rendering="crispEdges">
    <path fill="${ink}" d="${qr.path}"/>
  </g>
  <g class="r-card-symbol-fallback" transform="translate(${number(symbolBox.x)} ${number(symbolBox.y)}) scale(${number(symbolBox.width / 200)})">
    <path fill="${ink}" d="${symbolPath}"/>
  </g>
  <svg class="r-card-wordmark" x="${wordBox.x}" y="${wordBox.y}" width="${wordBox.width}" height="${number(wordBox.height)}" viewBox="260 47.4 808.75 105" preserveAspectRatio="xMidYMid meet">
    <path fill="${ink}" d="${wordPath}"/>
  </svg>
  <text class="r-card-instruction" x="760" y="648" text-anchor="middle" direction="rtl" fill="${ink}" font-size="13" font-weight="500" font-family="Readex Pro, sans-serif" style="font-family:var(--lt-font-brand, 'Readex Pro', sans-serif)">امسحه بجوالك</text>
</svg>
`;

if (hash(fs.readFileSync(sourceLogo)) !== hash(logoBefore)) throw new Error('Source logo unexpectedly changed.');
if (!svg.includes('d="' + wordPath + '"') || !svg.includes('d="' + symbolPath + '"')) throw new Error('Native geometry failed the verbatim check.');

const report = {
  destination: url,
  configuredDomain: domain,
  localDemo: 'website/demo/menu/index.html',
  canvas: { width: 1600, height: 900, transparent: true, photo: 'website/assets/images/scene-restaurants-color-1600.webp' },
  qr: { correction: 'H', modules: qr.n, x: qrBox.x, y: qrBox.y, inkSize: qrBox.size, moduleSize: unit, centerHole: { firstModule: qr.hole[0], sizeModules: qr.hole[1] }, quietZone: 'Provided by blank paper in the underlying scene; no added SVG quiet-zone padding.' },
  flyingSymbol: { ...symbolBox, centerX: center.x, centerY: center.y, source: 'website/assets/brand/symbol-ink.svg', staticFallbackClass: 'r-card-symbol-fallback', sizeModules: 8 },
  wordmark: { ...wordBox, viewBox: '260 47.4 808.75 105', pathVerbatim: true },
  instruction: { text: 'امسحه بجوالك', x: 760, y: 648, fontSize: 13, fontFamily: "var(--lt-font-brand, 'Readex Pro', sans-serif)", inlineSvgUsesPageFont: true },
  nativeGeometry: { source: 'website/assets/brand/logo-horizontal.svg', sourceSha256: hash(logoBefore), sourceUnchanged: true, symbolPathStart: marker, symbolClosedSubpaths: 4, symbolPathVerbatim: true, wordmarkPathVerbatim: true },
  animation: 'Only the separate native symbol moves. Keep QR modules, wordmark and Arabic text static. The fallback symbol is visible by default and should be hidden only once the normal-motion flight layer is ready.',
  outputs: Object.fromEntries(Object.entries(destinations).map(([key,file]) => [key, path.relative(root, file).split(path.sep).join('/')])),
  bytes: Buffer.byteLength(svg),
  verification: { generatedFromLocalQrLibrary: true, nativePathsExact: true, sourceLogoUnchanged: true, rasterDecode: 'Not run by this builder; check the final rendered overlay.' }
};
return { svg, report };
}

module.exports = { buildRestaurantCard };

if (require.main === module) {
  const { svg, report } = buildRestaurantCard();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(destinations.artwork, svg);
  fs.writeFileSync(destinations.fragment, svg);
  fs.writeFileSync(destinations.report, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ destination: report.destination, modules: report.qr.modules, symbol: report.flyingSymbol, wordmark: report.wordmark, output: report.outputs, bytes: report.bytes }, null, 2));
}
