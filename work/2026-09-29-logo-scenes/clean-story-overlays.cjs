// One-time removal of the decorations authored for the formerly blank signs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
for (const [page, prefix] of [['restaurants', 'r'], ['hosts', 'p']]) {
  const htmlPath = path.join(root, 'website', page, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  const ring = new RegExp('<span class="lt-slot ' + prefix + '-story-touch" aria-hidden="true"><span class="s-story-ring" data-story-ring(?: data-pulse)?></span></span>', 'g');
  const card = new RegExp('^<div class="s-story-card ' + prefix + '-story-card"[^\\r\\n]*\\r?\\n', 'gm');
  if ((html.match(ring) || []).length !== 1 || (html.match(card) || []).length !== 1) {
    throw new Error('Expected one decorative ring and card in ' + page);
  }
  html = html.replace(ring, '').replace(card, '');
  html = html.replace(/<!-- 4\) [\s\S]*?-->\s*(?=<section class="s-band [rp]-story")/,
    '<!-- 4) القصة: صورة المنتج بشعار لمسة تاب، مع تلوين الصورة وتتابع الخطوات أثناء التمرير.\n' +
    '     2026-09-29: أزيلت حلقة اللمس وبطاقة الشاشة القديمة لأنها تتداخل مع الشعار.\n' +
    '     التجربة التفاعلية باقية في قسم العرض الحي، والصورة زخرفية لأنها مكررة من البطل. -->\n');
  fs.writeFileSync(htmlPath, html);

  const cssPath = path.join(root, 'website/assets', page + '.css');
  let css = fs.readFileSync(cssPath, 'utf8');
  const section = prefix === 'r' ? '.r-story-grid' : '.p-story {';
  const start = css.indexOf('/* ===== 4)');
  const end = css.indexOf(section, start);
  if (start < 0 || end < 0) throw new Error('Story stylesheet section missing: ' + page);
  css = css.slice(0, start) + '/* ===== 4) القصة: الصورة بالشعار دون طبقات فوق اللوحة. التلوين وتتابع النص من motion.js. ===== */\n' + css.slice(end);
  css = css.replace(new RegExp('^\\.' + prefix + '-story-(?:photo|stage) > \\.' + prefix + '-story-touch \\{[^}]*\\}[^\\r\\n]*\\r?\\n', 'gm'), '');
  css = css.replace(new RegExp('^[ \\t]*\\.' + prefix + '-story-card \\{[^}]*\\}[^\\r\\n]*\\r?\\n', 'gm'), '');
  fs.writeFileSync(cssPath, css);
  console.log('Removed ring/card from ' + page + '; retained story, scene and live demo.');
}
