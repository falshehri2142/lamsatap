/* Export web derivatives of the approved imagegen edit. No artwork is redrawn. */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));

const root = path.resolve(__dirname, '../..');
const generated = path.join(process.env.USERPROFILE, '.codex/generated_images/01a0eeb2-49a4-7b00-8651-1e68542b6c6b');
const compositeDir = path.join(root, 'brand/photos/composites');
const webDir = path.join(root, 'website/assets/images');

function alphaBounds(data, width, height, threshold) {
  let left = width, top = height, right = -1, bottom = -1, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= threshold) continue;
      count++;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (!count) throw new Error(`No pixels above alpha ${threshold}`);
  return { left, top, width: right - left + 1, height: bottom - top + 1, count };
}

async function exportPlate(input, width, limit) {
  const output = path.join(webDir, `restaurant-lift-plate-${width}.webp`);
  let quality = 88, bytes;
  do {
    const buffer = await sharp(input).resize(width, Math.round(width * 9 / 16), { fit: 'cover' }).webp({ quality, effort: 6 }).toBuffer();
    bytes = buffer.length;
    if (bytes <= limit) {
      await fs.writeFile(output, buffer);
      return { path: path.relative(root, output), width, height: Math.round(width * 9 / 16), quality, bytes };
    }
    quality -= 2;
  } while (quality >= 50);
  throw new Error(`Cannot fit ${width}px plate within ${limit} bytes.`);
}

async function main() {
  await fs.mkdir(compositeDir, { recursive: true });
  await fs.mkdir(webDir, { recursive: true });
  const plate = path.join(compositeDir, 'restaurant-lift-plate-v1.png');
  const stand = path.join(compositeDir, 'restaurant-lift-stand-v1.png');
  await fs.copyFile(path.join(generated, 'exec-0a78af54-7b56-45e0-8cd0-565a88d2224f.png'), plate);
  await fs.copyFile(path.join(generated, 'exec-b03e23b1-dba2-4c40-b3cc-88a8337ac5b7.png'), stand);
  const plateExports = await Promise.all([
    exportPlate(plate, 1600, 180 * 1024),
    exportPlate(plate, 800, 90 * 1024)
  ]);
  const { data, info } = await sharp(stand).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = [0, 16, 128].map(threshold => ({ threshold, ...alphaBounds(data, info.width, info.height, threshold) }));
  const { left, top, width, height } = bounds[2];
  const standOutput = path.join(webDir, 'restaurant-lift-stand.webp');
  await sharp(stand).extract({ left, top, width, height }).resize({ width: Math.min(800, width), withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(standOutput);
  const metadata = await sharp(standOutput).metadata();
  const alpha = await sharp(standOutput).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0, partial = 0, opaque = 0;
  for (let i = 3; i < alpha.data.length; i += 4) {
    const a = alpha.data[i];
    if (a === 0) transparent++; else if (a === 255) opaque++; else partial++;
  }
  const report = {
    originals: [plate, stand].map(p => path.relative(root, p)),
    plate: plateExports,
    sourceStand: { width: info.width, height: info.height, bounds },
    stand: { path: path.relative(root, standOutput), width: metadata.width, height: metadata.height,
      hasAlpha: metadata.hasAlpha, bytes: (await fs.stat(standOutput)).size, alpha: { transparent, partial, opaque } }
  };
  await fs.writeFile(path.join(__dirname, 'export-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
