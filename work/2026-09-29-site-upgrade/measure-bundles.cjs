'use strict';
// Read-only source measurement: never invokes build-dist or writes into website/dist.
// Mirrors the strip functions, direct-resource collection and per-file gzip level 9
// calculation from tools/build-dist.cjs. Only its report files are written here.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const pages = ['index.html', 'restaurants/index.html', 'hosts/index.html'];
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripJs = (s) => s.replace(/^[ \t]*\/\/.*(\r?\n|$)/gm, '');
const dropBlank = (s) => s.replace(/^[ \t]*\r?\n/gm, '');
function stripHtml(s) {
  return dropBlank(s.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i).map((p, i) => {
    if (i % 2 === 0) return p.replace(/<!--[\s\S]*?-->/g, '');
    return /^<style/i.test(p) ? stripCss(p) : stripJs(p);
  }).join(''));
}
const git = args => execFileSync('git', args, { cwd: ROOT, maxBuffer: 12 * 1024 * 1024 });
const cache = new Map();
function builtFile(version, file) {
  const key = version + ':' + file;
  if (cache.has(key)) return cache.get(key);
  const source = version === 'HEAD' ? git(['show', 'HEAD:website/' + file]) : fs.readFileSync(path.join(ROOT, 'website', file));
  const ext = path.extname(file).toLowerCase();
  let built = source;
  if (!file.startsWith('vendor/') && ['.html', '.css', '.js'].includes(ext)) {
    const s = source.toString('utf8');
    built = Buffer.from(ext === '.html' ? stripHtml(s) : ext === '.css' ? dropBlank(stripCss(s)) : dropBlank(stripJs(s)));
  }
  cache.set(key, built);
  return built;
}
function measure(version, page) {
  const html = builtFile(version, page).toString('utf8'), files = [page];
  for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<script\b[^>]*src="([^"]+)"/g)) {
    const u = m[1] || m[2];
    if (/^[a-z]+:|^\/\//i.test(u)) continue;
    files.push(path.posix.normalize(path.posix.join(path.posix.dirname(page), u.split(/[?#]/)[0])));
  }
  const resources = files.map(file => { const b = builtFile(version, file); return { file, raw: b.length, gzip: zlib.gzipSync(b, { level: 9 }).length }; });
  return { page, version, raw: resources.reduce((n,f) => n + f.raw, 0), gzip: resources.reduce((n,f) => n + f.gzip, 0), resources };
}
const commit = git(['rev-parse', 'HEAD']).toString('utf8').trim();
const result = pages.map(page => ({ before: measure('HEAD', page), after: measure('working-tree', page) }));
const kb = n => (n / 1024).toFixed(1);
const signed = n => (n >= 0 ? '+' : '') + kb(n);
const sum = resources => ({ raw: resources.reduce((n,x) => n + x.raw, 0), gzip: resources.reduce((n,x) => n + x.gzip, 0) });
const vendorBefore = sum(result[0].before.resources.filter(x => x.file.startsWith('vendor/gsap/')));
const vendorAfter = sum(result[0].after.resources.filter(x => x.file.startsWith('vendor/gsap/')));
const vendorMatches = result[0].after.resources.filter(x => x.file.startsWith('vendor/gsap/')).every(x => builtFile('HEAD', x.file).toString('utf8').replace(/\r\n/g, '\n') === builtFile('working-tree', x.file).toString('utf8').replace(/\r\n/g, '\n'));
let md = '# Company-page bundle sizes\n\n';
md += `Measured against baseline HEAD \`${commit}\`. Read-only calculation; no build, deletion, source rewriting or budget changes.\n\n`;
md += 'The build gate is **100 KiB raw / 50 KiB gzip** per page. These are sums of HTML plus its directly referenced local CSS/JS, using exactly the build comment stripping and independent gzip level 9 per resource; images and fonts are excluded. Query strings are removed as in the current build. Values below are KiB (1,024 bytes).\n\n';
md += '| Page | HEAD raw / gzip | Current raw / gzip | Change raw / gzip | HEAD gate | Current gate |\n|---|---:|---:|---:|---|---|\n';
for (const { before:b, after:a } of result) md += `| ${a.page} | ${kb(b.raw)} / ${kb(b.gzip)} | ${kb(a.raw)} / ${kb(a.gzip)} | ${signed(a.raw-b.raw)} / ${signed(a.gzip-b.gzip)} | ${b.raw>102400||b.gzip>51200?'Fail':'Pass'} | ${a.raw>102400||a.gzip>51200?'Fail':'Pass'} |\n`;
md += '\nExact byte totals (raw / gzip):\n\n';
for (const {before:b,after:a} of result) md += `- ${a.page}: HEAD **${b.raw.toLocaleString('en-US')} / ${b.gzip.toLocaleString('en-US')}**; current **${a.raw.toLocaleString('en-US')} / ${a.gzip.toLocaleString('en-US')}**.\n`;
md += '\n## Main source of the overage\n\n';
md += `The already-minified local GSAP core and ScrollTrigger together contribute **${kb(vendorAfter.raw)} KiB raw / ${kb(vendorAfter.gzip)} KiB gzip to every company page** (HEAD: ${kb(vendorBefore.raw)} / ${kb(vendorBefore.gzip)}). Vendor files retain their license comments, matching the build. Their source is ${vendorMatches?'identical after normalizing CRLF to LF':'different after normalizing CRLF to LF'}; the current raw sum has ${vendorAfter.raw-vendorBefore.raw} extra bytes from checkout line endings, not a library change.\n\n`;
md += '| Shared vendor resource | HEAD raw / gzip | Current raw / gzip |\n|---|---:|---:|\n';
for (const v of result[0].after.resources.filter(x=>x.file.startsWith('vendor/gsap/'))) { const b=result[0].before.resources.find(x=>x.file===v.file); md += `| ${v.file} | ${kb(b.raw)} / ${kb(b.gzip)} | ${kb(v.raw)} / ${kb(v.gzip)} |\n`; }
md += '\n| Page, current | HTML raw / gzip | Non-vendor CSS raw / gzip | Non-vendor JS raw / gzip | All vendor raw / gzip |\n|---|---:|---:|---:|---:|\n';
for (const {after:a} of result) { const groups=[a.resources.filter(x=>x.file.endsWith('.html')),a.resources.filter(x=>!x.file.startsWith('vendor/')&&x.file.endsWith('.css')),a.resources.filter(x=>!x.file.startsWith('vendor/')&&x.file.endsWith('.js')),a.resources.filter(x=>x.file.startsWith('vendor/'))]; md+=`| ${a.page} | ${groups.map(x=>{const t=sum(x);return `${kb(t.raw)} / ${kb(t.gzip)}`;}).join(' | ')} |\n`; }
md += '\nLargest audience-page changes, in exact bytes:\n\n| Page | Resource | Raw change | Gzip change |\n|---|---|---:|---:|\n';
for (const {before:b,after:a} of result.slice(1)) {
  const diffs = a.resources.map(x => { const old=b.resources.find(y=>y.file===x.file); return {file:x.file,raw:x.raw-(old?.raw||0),gzip:x.gzip-(old?.gzip||0)}; }).filter(x=>x.raw>0).sort((x,y)=>y.raw-x.raw).slice(0,3);
  for (const x of diffs) md += `| ${a.page} | ${x.file} | +${x.raw.toLocaleString('en-US')} | +${x.gzip.toLocaleString('en-US')} |\n`;
}
md += '\n## Interpretation\n\n';
const increases=result.filter(({before:b,after:a})=>a.raw>b.raw||a.gzip>b.gzip);
md += 'All three company pages already failed both size thresholds at HEAD. The current upgrade did not introduce the existence of these build failures. ';
md += increases.length ? 'There is nevertheless a measured size increase on '+increases.map(x=>x.after.page).join(', ')+', so an unqualified “no bundle-size regression” would be inaccurate. The table quantifies the change.' : 'All three current bundles are smaller in both measured totals than HEAD; no bundle-size regression was measured.';
md += '\n\nExact byte totals and per-resource attribution are saved in `bundle-size.json`. Git HEAD content is measured as stored; current content is measured as present on disk, which also preserves any source newline differences exactly as the build does.\n';
fs.writeFileSync(path.join(__dirname, 'bundle-size.json'), JSON.stringify({ baseline: commit, limits: { raw:102400, gzip:51200 }, result }, null, 2));
fs.writeFileSync(path.join(__dirname, 'bundle-size.md'), md);
console.log(md);
