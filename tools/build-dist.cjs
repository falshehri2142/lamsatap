// نسخة الإطلاق: يطلّع dist/ من website/ (التقييم 2 في web-art-director.md، القرار 1). الاستضافة ترفع dist/ بس.
// اللي ينشال (بس، عشان ما ينكسر كود):
//   - تعليقات HTML <!-- --> ومعها علامات @@ (برّا <script> و<style>).
//   - تعليقات CSS /* */ في ملفات .css وداخل <style>.
//   - أسطر JS اللي تبدأ بـ // في ملفات .js وداخل <script>. التعليق بعد كود في نفس السطر يبقى.
//   - والأسطر اللي فضت بعد الشيل.
// ما ينلمس: vendor/ (فيه نص رخصة MIT داخل تعليقات //، والرخصة تشرط يبقى مع الملف)، والصور والخطوط وباقي الملفات.
// ما ينرفع: ملفات .md (README و CREDITS): توثيق الفريق، وفيها مراجع داخلية. السجل يبقى في المستودع.
// بعد النسخ يفحص:
//   1. كل JS ينقرى (syntax) بعد الشيل.
//   2. باركود كل ستاند (data-qr-url) يطابق الدومين في config.js. لو الدومين تغيّر: node tools/build-home-minis.cjs أول.
//   3. حجم كل صفحة: HTML وCSS وJS، بدون الخطوط والصور. حد كل ملف ميزانية يظهر مع القياس أدناه.
// التشغيل (من جذر المشروع): node tools/build-dist.cjs
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'website'), OUT = path.join(ROOT, 'dist');
// The approved marketing motion includes GSAP + ScrollTrigger: 114.8 KiB raw
// before any page code, so the original uniform 100 KiB cap cannot fit it.
// The owner accepted this weight for launch (2026-09-30). Only these three
// exact routes receive the marketing budget; all other pages keep 100/50 KiB.
// Every selected budget remains a strict build gate, alongside syntax and QR checks.
const BUDGETS = {
  lightweight: { raw: 100 * 1024, gzip: 50 * 1024 },
  marketing: { raw: 350 * 1024, gzip: 110 * 1024 }
};
// GM-070: the same three marketing pages now exist twice (English at the root, Arabic in ar/). Same budget, no raise.
const MARKETING_PAGES = new Set(['index.html', 'restaurants/index.html', 'hosts/index.html',
  'ar/index.html', 'ar/restaurants/index.html', 'ar/hosts/index.html']);

const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripJs = (s) => s.replace(/^[ \t]*\/\/.*(\r?\n|$)/gm, '');
const dropBlank = (s) => s.replace(/^[ \t]*\r?\n/gm, '');
function stripHtml(s) {
  // الأجزاء الفردية = <script> و<style> (منها اللي داخل رسومات SVG)، والزوجية = باقي الـ HTML
  return dropBlank(s.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i).map((p, i) => {
    if (i % 2 === 0) return p.replace(/<!--[\s\S]*?-->/g, '');
    return /^<style/i.test(p) ? stripCss(p) : stripJs(p);
  }).join(''));
}

// النسخ
if (path.dirname(path.resolve(OUT)) !== path.resolve(ROOT) || path.basename(OUT) !== 'dist') {
  throw new Error('Build output must be the project dist directory.');
}
fs.rmSync(OUT, { recursive: true, force: true });
const stats = { html: 0, css: 0, js: 0, copied: 0, skipped: [], saved: 0 };
const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, e.name), rel = path.relative(SRC, src).split(path.sep).join('/'), dst = path.join(OUT, rel);
    if (e.isDirectory()) { walk(src); continue; }
    const ext = path.extname(e.name).toLowerCase();
    if (ext === '.md') { stats.skipped.push(rel); continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (rel.startsWith('vendor/') || !['.html', '.css', '.js'].includes(ext)) { fs.copyFileSync(src, dst); stats.copied++; continue; }
    const before = fs.readFileSync(src, 'utf8');
    const after = ext === '.html' ? stripHtml(before) : ext === '.css' ? dropBlank(stripCss(before)) : dropBlank(stripJs(before));
    fs.writeFileSync(dst, after);
    stats[ext.slice(1)]++;
    stats.saved += Buffer.byteLength(before) - Buffer.byteLength(after);
    if (ext === '.html') pages.push(rel);
  }
})(SRC);
console.log('dist/: html ' + stats.html + '، css ' + stats.css + '، js ' + stats.js + '، نسخ زي ما هي ' + stats.copied + '. انشال ' + (stats.saved / 1024).toFixed(1) + 'KB تعليقات');
console.log('ما انرفع (توثيق): ' + stats.skipped.join('، '));

let bad = 0;
// 1) JS ينقرى بعد الشيل (بدون تشغيل)
(function check(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { check(f); continue; }
    if (!/\.js$/.test(e.name)) continue;
    try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); } catch (err) { bad++; console.error('JS انكسر: ' + path.relative(OUT, f) + ': ' + err.message); }
  }
})(OUT);
for (const p of pages) {
  const s = fs.readFileSync(path.join(OUT, p), 'utf8');
  for (const m of s.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { new vm.Script(m[1]); } catch (err) { bad++; console.error('سكربت داخل ' + p + ' انكسر: ' + err.message); }
  }
}

// 2) باركود الستاند يطابق الدومين
const cfg = { window: {} }; cfg.window = cfg; vm.createContext(cfg);
vm.runInContext(fs.readFileSync(path.join(SRC, 'config.js'), 'utf8'), cfg);
const domain = String((cfg.SITE || {}).domain || 'https://example.com').replace(/\/+$/, '');
const demoDestinations = new Set(['review', 'rental-guide', 'menu', 'wifi', 'links'].map(name => domain + '/demo/' + name + '/'));
for (const p of pages) {
  for (const m of fs.readFileSync(path.join(OUT, p), 'utf8').matchAll(/data-qr-url="([^"]*)"/g)) {
    if (!demoDestinations.has(m[1])) { bad++; console.error('باركود في ' + p + ' يودّي إلى رابط خارج أمثلة الموقع المعتمدة: ' + m[1] + '. شغّل node tools/build-home-minis.cjs ثم هذا من جديد'); }
  }
}

// 3) الحجم: الصفحة وملفات <link rel="stylesheet"> و<script src> المحلية اللي تحمّلها
const kb = (n) => (n / 1024).toFixed(1) + 'KiB';
console.log('\nالحجم (بدون الخطوط والصور)، مع ملف الميزانية والحد المطبّق لكل صفحة:');
for (const p of pages.sort()) {
  const html = fs.readFileSync(path.join(OUT, p), 'utf8'), files = [p];
  for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<script\b[^>]*src="([^"]+)"/g)) {
    const u = m[1] || m[2];
    if (/^[a-z]+:|^\/\//i.test(u)) continue;
    files.push(path.posix.normalize(path.posix.join(path.posix.dirname(p), u.split(/[?#]/)[0])));
  }
  let raw = 0, gz = 0;
  for (const f of files) {
    const b = fs.readFileSync(path.join(OUT, f));
    raw += b.length; gz += zlib.gzipSync(b, { level: 9 }).length;
  }
  const profile = MARKETING_PAGES.has(p) ? 'marketing' : 'lightweight', budget = BUDGETS[profile];
  const over = raw > budget.raw || gz > budget.gzip;
  if (over) bad++;
  console.log((over ? '  فوق الحد ' : '  ') + p + ': ' + kb(raw) + ' / gzip ' + kb(gz) + ' (' + files.length + ' ملفات؛ ' + profile + '، الحد ' + kb(budget.raw) + ' / gzip ' + kb(budget.gzip) + ')');
}
if (bad) { console.error('\n' + bad + ' مشكلة. صلّحها قبل الرفع.'); process.exitCode = 1; }
else console.log('\nجاهز للرفع: dist/');
