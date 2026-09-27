// Local test of door-report phone stripping: node systems/n8n/workflows/test-door-report.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/door-report.js', 'utf8');
const i = src.indexOf('jsCode: "') + 'jsCode: '.length;
let k = i + 1;
while (!(src[k] === '"' && src[k - 1] !== '\\')) k++;
const f = new Function('$json', JSON.parse(src.slice(i, k + 1)));
const cases = [
  ['المكيف خربان اتصل 0551234567', true],
  ['رقمي +966 55 123 4567 شكرا', true],
  ['٠٥٥١٢٣٤٥٦٧', true],
  ['055-123-4567 عاجل', true],
  ['00966551234567', true],
  ['الغرفة 12 والدور 3', false],
  ['كود الباب 1234', false]
];
let fail = 0;
for (const [p, shouldStrip] of cases) {
  const out = f({ ref: 'x', request: 'maintenance', problem: p }).json.problem;
  const stripped = out.includes('[رقم محذوف]') && !/\d{7,}/.test(out.replace(/\D/g, ' ').replace(/ +/g, ''));
  const ok = shouldStrip ? out.includes('[رقم محذوف]') : out === p;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(p), '->', JSON.stringify(out));
}
process.exit(fail ? 1 : 0);
