// Local test of the Telegram classifier: node systems/n8n/workflows/test-telegram.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/telegram-inbound.js', 'utf8');
const i = src.indexOf('jsCode: "') + 'jsCode: '.length;
let k = i + 1;
while (k < src.length && !(src[k] === '"' && src[k - 1] !== '\\')) k++;
const f = new Function('$', JSON.parse(src.slice(i, k + 1)));
const run = (msg, owner) => f((n) => n === 'Read CHANNEL'
  ? { first: () => ({ json: { owner_telegram_chat_id: owner || '999' } }) }
  : { all: () => [{ json: { message: msg } }] })[0].json;
const P = { type: 'private' };
const cases = [
  ['door checkout link', run({ chat: { id: 111, ...P }, text: '/start co_abcd1234efgh5678' }), j => j.kind === 'door' && j.request === 'checkout' && j.ref === 'abcd1234efgh5678' && !('text' in j)],
  ['door maintenance link', run({ chat: { id: 111, ...P }, text: '/start MT_ABCD1234EFGH5678' }), j => j.kind === 'door' && j.request === 'maintenance'],
  ['short ref is not a door link', run({ chat: { id: 111, ...P }, text: '/start co_abc' }), j => j.kind === 'welcome'],
  ['welcome', run({ chat: { id: 111, ...P }, text: '/start' }), j => j.kind === 'welcome'],
  ['client menu tag + HTML escape', run({ chat: { id: 111, ...P }, from: { first_name: 'Ali', username: 'ali' }, text: 'أبغى تحديث المنيو <b>' }), j => j.kind === 'client' && j.header.includes('[طلب تحديث منيو]') && j.header.includes('#c111') && j.text.includes('&lt;b&gt;')],
  ['owner reply relays to tagged chat', run({ chat: { id: 999, ...P }, text: 'تمام', reply_to_message: { text: 'رسالة تليجرام #c111 من Ali' } }), j => j.kind === 'relay' && j.to === '111'],
  ['owner message without reply is ignored', run({ chat: { id: 999, ...P }, text: 'hi' }), j => j.kind === 'ignore'],
  ['groups are ignored', run({ chat: { id: -5, type: 'group' }, text: 'hi' }), j => j.kind === 'ignore'],
  ['photo without text', run({ chat: { id: 111, ...P } }), j => j.kind === 'client' && j.text.includes('بدون نص')]
];
let fail = 0;
for (const [n, j, ok] of cases) { const r = ok(j); if (!r) fail++; console.log(r ? 'PASS' : 'FAIL', n); }
process.exit(fail ? 1 : 0);
