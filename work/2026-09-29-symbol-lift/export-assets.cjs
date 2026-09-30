'use strict';
// Export the approved imagegen plate and the verbatim native brand symbol.
// This script only writes the owned master, web derivatives, symbol and report.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));

const root = path.resolve(__dirname, '../..');
const source = path.join(process.env.USERPROFILE, '.codex/generated_images/01a0eeb2-49a4-7b00-8651-1e68542b6c6b/exec-16dec599-f420-4ecf-ac51-59de1a724c68.png');
const master = path.join(root, 'brand/photos/composites/restaurant-symbol-plate-v1.png');
const logo = path.join(root, 'website/assets/brand/logo-horizontal.svg');
const symbol = path.join(root, 'website/assets/brand/symbol-ink.svg');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const relative = file => path.relative(root, file).split(path.sep).join('/');

async function main() {
  const sourceBytes = await fs.readFile(source);
  const sourceMeta = await sharp(sourceBytes).metadata();
  await fs.mkdir(path.dirname(master), { recursive: true });
  await fs.copyFile(source, master);
  const masterBytes = await fs.readFile(master);
  if (hash(sourceBytes) !== hash(masterBytes)) throw new Error('Master differs from approved source.');

  const exports = [];
  for (const width of [800, 1600]) {
    const height = width * 9 / 16;
    const file = path.join(root, `website/assets/images/restaurant-symbol-plate-${width}.webp`);
    await sharp(masterBytes).resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 88, effort: 6 }).toFile(file);
    const [metadata, bytes] = await Promise.all([sharp(file).metadata(), fs.readFile(file)]);
    if (metadata.width !== width || metadata.height !== height || metadata.format !== 'webp') throw new Error('Incorrect web export: ' + file);
    exports.push({ path: relative(file), width: metadata.width, height: metadata.height, format: metadata.format, bytes: bytes.length, quality: 88, sha256: hash(bytes) });
  }

  const logoBytes = await fs.readFile(logo);
  const paths = [...logoBytes.toString('utf8').matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(match => match[1]);
  const marker = 'M0.1 46.81';
  const candidates = paths.filter(d => d.includes(marker));
  if (candidates.length !== 1 || candidates[0].split(marker).length !== 2) throw new Error('Native symbol marker is not unique.');
  const geometry = candidates[0].slice(candidates[0].indexOf(marker));
  if ((geometry.match(/M/g) || []).length !== 4 || !geometry.endsWith('Z')) throw new Error('Expected four native closed symbol subpaths.');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="LamsaTap symbol"><title>LamsaTap symbol</title><path fill="#14201F" d="' + geometry + '"/></svg>\n';
  await fs.writeFile(symbol, svg);
  const symbolBytes = await fs.readFile(symbol);
  const exportedGeometry = symbolBytes.toString('utf8').match(/<path\b[^>]*\bd="([^"]+)"/)[1];
  const symbolMeta = await sharp(symbolBytes).metadata();
  if (exportedGeometry !== geometry || symbolMeta.width !== 200 || symbolMeta.height !== 200) throw new Error('Symbol geometry or dimensions changed.');
  if (hash(await fs.readFile(logo)) !== hash(logoBytes)) throw new Error('Source logo was unexpectedly modified.');

  const report = {
    source: { path: source, width: sourceMeta.width, height: sourceMeta.height, bytes: sourceBytes.length, sha256: hash(sourceBytes) },
    master: { path: relative(master), width: sourceMeta.width, height: sourceMeta.height, bytes: masterBytes.length, byteIdenticalToSource: true },
    resize: { aspectRatio: '16:9', fit: 'cover', position: 'centre', artworkChanged: false },
    exports,
    symbol: { path: relative(symbol), source: relative(logo), width: symbolMeta.width, height: symbolMeta.height, viewBox: '0 0 200 200', fill: '#14201F', pathStart: marker, closedSubpaths: 4, geometryVerbatim: exportedGeometry === geometry, sourceLogoUnchanged: true, bytes: symbolBytes.length, sha256: hash(symbolBytes) }
  };
  await fs.writeFile(path.join(__dirname, 'export-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
