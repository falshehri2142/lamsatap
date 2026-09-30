'use strict';
// Resize-only exports of the existing unmodified blank host photograph.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const root = path.resolve(__dirname, '../..');
async function main() {
  const source = path.join(root, 'brand/photos/generated/hosts-hero-imagen-1-upscaled-1.webp');
  const sourceMeta = await sharp(source).metadata();
  const exports = [];
  for (const width of [800, 1600]) {
    const file = path.join(root, `website/assets/images/host-symbol-plate-${width}.webp`);
    await sharp(source).resize(width, width * 9 / 16, { fit: 'cover' }).webp({ quality: 88, effort: 6 }).toFile(file);
    const meta = await sharp(file).metadata();
    if (meta.width !== width || meta.height !== width * 9 / 16) throw new Error('Wrong image size.');
    exports.push({ file: path.relative(root, file).split(path.sep).join('/'), width: meta.width, height: meta.height, bytes: (await fs.stat(file)).size });
  }
  const report = { source: path.relative(root, source).split(path.sep).join('/'), sourceWidth: sourceMeta.width, sourceHeight: sourceMeta.height, transformation: 'resize/export only; no recolor, inpainting or brand artwork baked into the photo', exports };
  await fs.writeFile(path.join(__dirname, 'export-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
