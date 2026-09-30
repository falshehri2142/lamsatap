// Export responsive site derivatives after the logo edit made with imagegen.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const root = path.resolve(__dirname, '../..');
const generated = path.join(process.env.USERPROFILE, '.codex/generated_images/01a0eeb2-49a4-7b00-8651-1e68542b6c6b');
const sources = [
  ['restaurant-cafe-stand', 'exec-74de9af3-855c-4bae-bc56-0618697bd782.png', 180, 180],
  ['host-door-frame', 'exec-b455f81b-5f81-4f15-99d9-7bf3085586da.png', 180, 180],
  ['scene-hosts-table', 'exec-f1820e8e-ebda-41c2-a0cd-62c2b91f6697.png', 120, 160],
];
async function main() {
  const report = [];
  for (const [name, file, bwLimit, colorLimit] of sources) {
    const master = path.join(root, 'brand/photos/composites', name + '-logo-v1.png');
    if (!fs.existsSync(master)) fs.copyFileSync(path.join(generated, file), master);
    const metadata = await sharp(master).metadata();
    if (Math.abs(metadata.width / metadata.height - 16 / 9) > 0.01) throw new Error('Unexpected aspect ratio: ' + name);
    for (const width of [1600, 800]) {
      const height = Math.round(width * 9 / 16);
      for (const layer of ['color', 'bw']) {
        let pipeline = sharp(master).resize(width, height);
        if (layer === 'bw') {
          // Neutral luminance in the existing ink / sand palette, with matching geometry.
          pipeline = pipeline.recomb([[0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722]])
            .linear([230 / 255, 215 / 255, 211 / 255], [20, 32, 31]);
        }
        const limit = (layer === 'bw' ? bwLimit : colorLimit) * 1024 * width / 1600;
        let data, quality;
        for (quality = 88; quality >= 48; quality -= 4) {
          data = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
          if (data.length <= limit) break;
        }
        if (data.length > limit) throw new Error('Image exceeds size budget: ' + name);
        const output = name + '-' + layer + '-' + width + '.webp';
        fs.writeFileSync(path.join(root, 'website/assets/images', output), data);
        report.push({ file: output, width, height, bytes: data.length, quality });
      }
    }
  }
  fs.writeFileSync(path.join(__dirname, 'exports.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
