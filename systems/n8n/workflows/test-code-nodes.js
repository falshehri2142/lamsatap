// Local test of Code-node logic: node systems/n8n/workflows/test-code-nodes.js systems/n8n/workflows
const fs = require('fs');
function codeOf(src, name) {
  const i = src.indexOf("name: '" + name + "'");
  const j = src.indexOf('jsCode: "', i) + 'jsCode: '.length;
  let k = j + 1;
  while (!(src[k] === '"' && src[k - 1] !== '\\')) k++;
  return JSON.parse(src.slice(j, k + 1));
}
const today = new Date('2026-09-27T00:00:00Z');
const lux = { toJSDate: () => today, toISODate: () => '2026-09-27', minus: () => ({ toISODate: () => '2026-09-26' }) };
function run(js, nodes, input) {
  const $ = (n) => ({ all: () => nodes[n].map(j => ({ json: j })), first: () => ({ json: nodes[n][0] }) });
  const $input = { all: () => (input || []).map(j => ({ json: j })) };
  return new Function('$', '$input', '$today', js)($, $input, lux);
}
const dir = process.argv[2];
const tap = fs.readFileSync(dir + '/tap-import.js', 'utf8');
console.log('TAP', JSON.stringify(run(codeOf(tap, 'Public codes only, daily totals only'), {
  'Get units': [{ code: 'demo01', type: 'public' }, { code: 'demo02', type: 'public' }, { code: 'door1', type: 'door' }],
  'Keep rows only': [{ rows: [
    { code: 'DEMO01', day: '2026-09-26', src: 'nfc', count: 3 },
    { code: 'door1', day: '2026-09-26', src: 'nfc', count: 4 },
    { code: 'zzz', day: '2026-09-26', src: 'nfc', count: 5 },
    { code: 'demo01', day: 'bad', src: 'nfc', count: 1 },
    { code: 'demo02', day: '2026-09-26T00:00:00Z', src: 'sms', count: 2 }] }]
})));
const rr = fs.readFileSync(dir + '/renewal-reminder.js', 'utf8');
const subs = [
  { subscription_id: 'A', client_id: 'c1', status: 'active', period: 'annual', end_date: '2026-10-20', price_sar: 100, renewal_price_sar: 120, reminder_30_sent: false, reminder_7_sent: false },
  { subscription_id: 'B', client_id: 'c2', status: 'active', period: 'annual', end_date: '2026-10-01', price_sar: 100, renewal_price_sar: 100, reminder_30_sent: true, reminder_7_sent: false },
  { subscription_id: 'C', client_id: 'c3', status: 'active', period: 'monthly', end_date: '2026-10-20', price_sar: 50, reminder_30_sent: false, reminder_7_sent: false },
  { subscription_id: 'D', client_id: 'c4', status: 'active', period: 'annual', end_date: '2026-09-20', renewal_confirmed: false },
  { subscription_id: 'E', client_id: 'c5', status: 'awaiting_renewal', period: 'annual', end_date: '2026-09-01' },
  { subscription_id: 'F', client_id: 'c6', status: 'awaiting_renewal', period: 'annual', end_date: '2026-09-20' },
  { subscription_id: 'G', client_id: 'c7', status: 'expired', period: 'annual', end_date: '2026-01-01' }];
const out = run(codeOf(rr, 'Classify subscriptions'), { 'Get subscriptions': subs, 'Get clients': [{ client_id: 'c1', name: 'كافيه أ' }] });
for (const o of out) console.log('CLS', o.json.subscription_id, o.json.action, o.json.which || '', o.json.r30 ?? '', o.json.r7 ?? '', (o.json.text || '').slice(0, 140));
const dr = fs.readFileSync(dir + '/daily-report.js', 'utf8');
console.log(run(codeOf(dr, 'Build Arabic report'), {
  'Get subscriptions': [{ id: 1, client_id: 'c1', status: 'active', end_date: '2026-10-10' }, {}],
  'Get invoices': [{}], 'Get prospects': [{ id: 1, name: 'مطعم ب', stage: 'visit', last_followup: '2026-09-20' }],
  'Get daily_taps': [{ id: 1, code: 'demo01', day: '2026-09-26T00:00:00.000Z', src: 'nfc', count: 3 }, { id: 2, code: 'demo02', day: '2026-09-26', src: 'qr', count: 2 }]
})[0].json.text);
