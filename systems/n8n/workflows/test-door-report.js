// Local test of door-report phone stripping: node systems/n8n/workflows/test-door-report.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/door-report.js', 'utf8');
const i = src.indexOf('jsCode: "') + 'jsCode: '.length;
let k = i + 1;
while (!(src[k] === '"' && src[k - 1] !== '\\')) k++;
const f = new Function('$json', JSON.parse(src.slice(i, k + 1)));
const norm = (t) => t.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x6F0)).replace(/[０-９]/g, d => String(d.charCodeAt(0) - 0xFF10));
const longestDigits = (t) => Math.max(0, ...norm(t).split(/\p{L}+/u).map(x => x.replace(/\D/g, '').length));
const phones = [
  'المكيف خربان اتصل 0551234567', 'رقمي +966 55 123 4567 شكرا', '٠٥٥١٢٣٤٥٦٧', '055-123-4567 عاجل', '00966551234567',
  '055،123،4567', '055–123–4567', '055/123/4567', '055_123_4567', '055,123,4567', '055*123*4567',
  '055‏1234567', '０５５１２３４５６７', '۰۵۵۱۲۳۴۵۶۷', 'x'.repeat(295) + ' 0551234567'
];
const keep = ['الغرفة 12 والدور 3', 'كود الباب 1234', 'شقة 4، دور 2، مبنى 7'];
let fail = 0;
for (const p of phones) {
  const out = f({ ref: 'x', request: 'maintenance', problem: p }).json.problem;
  const ok = longestDigits(out) < 7 && out.length <= 300;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', 'strip', JSON.stringify(p.slice(-30)), '->', JSON.stringify(out.slice(-40)));
}
for (const p of keep) {
  const out = f({ ref: 'x', request: 'maintenance', problem: p }).json.problem;
  const ok = out === p;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', 'keep', JSON.stringify(p), '->', JSON.stringify(out));
}
process.exit(fail ? 1 : 0);
