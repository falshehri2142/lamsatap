'use strict';
// Native mark and wordmark for the host door-frame photograph. Requiring this
// module has no write effects; only its CLI writes the three work artifacts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'work/2026-09-29-host-symbol-lift');
const number = value => Number(value.toFixed(6));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function buildHostCard() {
  const source = path.join(root, 'website/assets/brand/logo-horizontal.svg');
  const sourceBytes = fs.readFileSync(source);
  const paths = [...sourceBytes.toString('utf8').matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(m => m[1]);
  if (paths.length !== 1) throw new Error('Expected the native combined logo path.');
  const full = paths[0], marker = 'M0.1 46.81', split = full.indexOf(marker);
  if (split < 1 || full.indexOf(marker, split + marker.length) !== -1) throw new Error('Native symbol marker is not unique.');
  const word = full.slice(0, split), symbol = full.slice(split);
  if ((symbol.match(/M/g) || []).length !== 4) throw new Error('Expected four native symbol subpaths.');
  const box = { x: 952, y: 284, size: 84 };
  const wordBox = { x: 918, y: 380, width: 152, height: 152 * 105 / 808.75 };
  const svg = `<svg class="p-card-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" aria-hidden="true" focusable="false" data-card-symbol-box="${box.x} ${box.y} ${box.size}">
  <g class="p-card-symbol-fallback" data-card-symbol-fallback transform="translate(${box.x} ${box.y}) scale(${number(box.size / 200)})">
    <path fill="#14201F" d="${symbol}"/>
  </g>
  <svg class="p-card-wordmark" x="${wordBox.x}" y="${wordBox.y}" width="${wordBox.width}" height="${number(wordBox.height)}" viewBox="260 47.4 808.75 105" preserveAspectRatio="xMidYMid meet">
    <path fill="#14201F" d="${word}"/>
  </svg>
</svg>
`;
  if (hash(fs.readFileSync(source)) !== hash(sourceBytes)) throw new Error('Source logo changed.');
  return {
    svg,
    report: {
      canvas: { width: 1600, height: 900, transparent: true },
      photo: 'website/assets/images/host-symbol-plate-1600.webp',
      sourcePhoto: 'brand/photos/generated/hosts-hero-imagen-1-upscaled-1.webp',
      photoObjectPosition: { x: 0.59, y: 0.5 },
      frameInnerPaper: { left: 911.875, top: 232.5, right: 1076.25, bottom: 456.875 },
      symbol: { ...box, centerX: box.x + box.size / 2, centerY: box.y + box.size / 2, image: 'website/assets/brand/symbol-ink.svg' },
      wordmark: { ...wordBox, viewBox: '260 47.4 808.75 105' },
      nativeGeometry: { source: 'website/assets/brand/logo-horizontal.svg', sourceSha256: hash(sourceBytes), sourceUnchanged: true, symbolPathVerbatim: true, wordPathVerbatim: true },
      integration: { marker: 'card:host', factory: 'buildHostCard', photoHook: 'data-lift-photo', positionHook: 'data-lift-position="0.59"', registration: 'data-card-symbol-box="952 284 84"' },
      fallback: 'Native square and wordmark remain visible without JS, with reduced motion, on short screens and after motion initialization failure.'
    }
  };
}

module.exports = { buildHostCard };
if (require.main === module) {
  const { svg, report } = buildHostCard();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'card-art.svg'), svg);
  fs.writeFileSync(path.join(output, 'native-card-fragment.html'), svg);
  fs.writeFileSync(path.join(output, 'card-art-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
