// One-time migration from the earlier logo-only plate to the native full card.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'website/restaurants/index.html');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'card-art-report.json'), 'utf8'));
const mark = report.flyingSymbol;
let art = fs.readFileSync(path.join(__dirname, 'native-card-fragment.html'), 'utf8').trim();
if (!art.includes('data-card-symbol-box=')) art = art.replace('<svg ', `<svg data-card-symbol-box="${mark.x} ${mark.y} ${mark.width}" `);
let html = fs.readFileSync(file, 'utf8');
const plate = /<img class="r-lift-plate"[^>]*>/;
if (!plate.test(html)) throw Error('Expected earlier image plate missing');
html = html.replace(plate, '<!-- @@card:restaurant -->' + art + '<!-- /@@card:restaurant -->');
html = html.replace(/(<!-- @@img:hero[\s\S]*?<!-- \/@@img:hero -->)/, block => block.replaceAll('restaurant-cafe-stand-', 'scene-restaurants-').replaceAll('?v=logo-v1', ''));
html = html.replace('restaurants.css?v=symbol-flight-2', 'restaurants.css?v=full-card-1').replace('motion.js?v=symbol-flight-1', 'motion.js?v=full-card-1');
fs.writeFileSync(file, html);
console.log('Native full card integrated; photo and artwork stay still.');
