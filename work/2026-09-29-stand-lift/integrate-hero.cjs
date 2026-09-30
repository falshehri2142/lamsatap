const fs = require('node:fs');
const path = require('node:path');
const page = path.resolve(__dirname, '../../website/restaurants/index.html');
let html = fs.readFileSync(page, 'utf8');
if (html.includes('data-stand-lift')) throw new Error('Lift already integrated');
html = html.replace('data-expand data-expand-inline>', 'data-expand data-expand-inline data-stand-lift>');
html = html.replace('<div class="r-hero-media"', '<div class="r-lift-stage" data-lift-stage>\n<div class="r-hero-media"');
html = html.replace('<!-- /@@img:hero --></div></div>', '<!-- /@@img:hero --></div><img class="r-lift-plate" data-lift-plate src="../assets/images/restaurant-lift-plate-800.webp" srcset="../assets/images/restaurant-lift-plate-800.webp 800w, ../assets/images/restaurant-lift-plate-1600.webp 1600w" sizes="(min-width: 1024px) 70vw, 178vw" width="1600" height="900" alt="" aria-hidden="true" decoding="async"></div>\n<span class="r-lift-shadow" data-lift-shadow aria-hidden="true"></span>\n<img class="r-lift-object" data-lift-object src="../assets/images/restaurant-lift-stand.webp" width="752" height="1004" alt="" aria-hidden="true" decoding="async">');
html = html.replace(/(<div class="a-photo-caption">[^\r\n]*<\/div>)\r?\n<\/section>/, (_, caption) => caption + '\n</div>\n</section>');
html = html.replace(/(<ul class="a-service-list"[^\r\n]*<\/ul>)/, (_, services) => services + '\n<p class="r-lift-cue" aria-hidden="true"><svg viewBox="0 0 16 20" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 2v15m-4-4 4 4 4-4"/></svg>مرّر، وشوف الستاند يرتفع.</p>');
// Refresh the two edited resources for an already-open local preview.
html = html.replace('href="../assets/restaurants.css"', 'href="../assets/restaurants.css?v=stand-lift-v1"');
html = html.replace('src="../assets/motion.js"', 'src="../assets/motion.js?v=stand-lift-v1"');
fs.writeFileSync(page, html);
console.log('Installed layered hero, retaining original photo and direct demo links.');
