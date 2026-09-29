// Builds the update_workflow operations that turn «LT telegram inbound» (mocsmio6hCqQAMvk) into the pro bot.
// node systems/n8n/workflows/telegram-pro-ops.js > out.json   (the live trigger, credential and door path stay as they are)
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/telegram-classify.js', 'utf8').trim();
const CRED = { telegramApi: { id: '0432qINokSfkjuq4', name: 'Telegram account' } };
const btn = (text, data) => ({ text, additionalFields: { callback_data: data } });
const kb = (...rows) => ({ rows: rows.map((b) => ({ row: { buttons: b } })) });
const MENU = btn('↩️ القائمة', 'menu');
const TRIAL = btn('🎁 اطلب تجربة ببلاش', 'trial');
const FAQ = btn('❓ أسئلة شائعة', 'faq');
const KB = {
  main: kb([btn('☕ مطعم أو كافيه', 'seg_food')], [btn('🏠 شقق أو إيجار قصير', 'seg_host')], [btn('👀 كيف تشتغل', 'how'), btn('💰 الأسعار', 'prices')], [FAQ, btn('👤 كلّم شخص', 'human')]),
  seg: kb([TRIAL], [btn('📸 صور من الشغل', '={{ $json.pics }}'), btn('💰 الأسعار', 'prices')], [FAQ, MENU]),
  after: kb([TRIAL], [FAQ, btn('👤 كلّم شخص', 'human')], [MENU]),
  trial: kb([btn('☕ مطعم أو كافيه', 'trial_food')], [btn('🏠 شقق أو إيجار قصير', 'trial_host')], [MENU]),
  faq: kb(
    [btn('عندي QR ببلاش، وش الفرق؟', 'faq_1')], [btn('وش الفايدة لمحلي؟', 'faq_2')], [btn('يشتغل على الآيفون؟', 'faq_3')],
    [btn('بتحطون شعاركم عندي؟', 'faq_4')], [btn('رقمي يطلع للضيف؟', 'faq_5')], [btn('يحتاج الزبون تطبيق؟', 'faq_6')],
    [btn('مين يركّب، ووين؟', 'faq_7')], [MENU]),
  back: kb([MENU]),
  handoff: { rows: [{ row: { buttons: [{ text: '🟢 كلّمنا على واتساب', additionalFields: { url: '={{ $json.url }}' } }] } }, { row: { buttons: [MENU] } }] }
};
const FIELDS = { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true };
let y = 0;
const sender = (name, op, markup, extra = {}) => {
  y += 150;
  const p = { resource: 'message', operation: op, chatId: '={{ $json.chat }}' };
  if (op === 'sendMessage') { p.text = '={{ $json.text }}'; p.additionalFields = Object.assign({}, FIELDS, extra); }
  else { p.file = '={{ $json.file }}'; p.additionalFields = { caption: '={{ $json.text }}', parse_mode: 'HTML' }; }
  if (markup === 'force') { p.replyMarkup = 'forceReply'; p.forceReply = { force_reply: true }; }
  else if (markup) { p.replyMarkup = 'inlineKeyboard'; p.inlineKeyboard = KB[markup]; }
  return { type: 'addNode', node: { name, type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [1120, y], parameters: p, credentials: CRED } };
};
const ROUTES = [
  ['answer', 'Answer button'], ['door', 'Ack guest (no data kept)'], ['text_plain', 'Send plain'],
  ['text_main', 'Text + main menu'], ['text_after', 'Text + next steps'], ['text_trial', 'Text + trial type'],
  ['text_faq', 'Text + FAQ'], ['text_back', 'Text + back'], ['text_force', 'Text + ask (force reply)'],
  ['photo_main', 'Photo + main menu'], ['photo_seg', 'Photo + segment'], ['photo_after', 'Photo + next steps'], ['album', 'Album'], ['text_handoff', 'Text + handoff']
];
const rule = (key) => ({ outputKey: key, conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.route }}', operator: { type: 'string', operation: 'equals' }, rightValue: key }], combinator: 'and' } });
const ASSET_KEYS = ['whatsapp', 'owner_username', 'welcome', 'food', 'host', 'how', 'food_scene', 'food_menu', 'food_review', 'food_wifi', 'host_scene', 'host_guide', 'host_checkout', 'host_maint'];
const assets = JSON.parse(fs.existsSync(__dirname + '/telegram-assets.json') ? fs.readFileSync(__dirname + '/telegram-assets.json', 'utf8') : '{}');

const ops = [
  ...['Welcome', 'Forward to owner', 'Ack client', 'Segment reply', 'Tell owner segment', 'Route by kind'].map((n) => ({ type: 'removeNode', nodeName: n })),
  { type: 'removeConnection', source: 'Read CHANNEL', target: 'Classify message' },
  { type: 'addNode', node: { name: 'ASSETS', type: 'n8n-nodes-base.set', typeVersion: 3.4, position: [336, 288], parameters: { mode: 'manual', includeOtherFields: false, assignments: { assignments: ASSET_KEYS.map((k, i) => ({ id: 'a' + i, name: k, type: 'string', value: assets[k] || (k === 'whatsapp' ? '966507250396' : '') })) }, options: {} }, notes: 'Telegram file_id for each bot picture (print/telegram-bot-assets/upload). Empty = the bot sends text instead.' } },
  { type: 'setNodeSettings', nodeName: 'ASSETS', settings: { executeOnce: true } },
  { type: 'addConnection', source: 'Read CHANNEL', target: 'ASSETS' },
  { type: 'addConnection', source: 'ASSETS', target: 'Classify message' },
  { type: 'setNodePosition', nodeName: 'Classify message', position: [560, 288] },
  { type: 'setNodeParameter', nodeName: 'Classify message', path: '/jsCode', value: code },
  { type: 'renameNode', oldName: 'Owner reply to client', newName: 'Send plain' },
  { type: 'updateNodeParameters', nodeName: 'Send plain', replace: true, parameters: { resource: 'message', operation: 'sendMessage', chatId: '={{ $json.chat }}', text: '={{ $json.text }}', additionalFields: Object.assign({}, FIELDS, { disable_notification: '={{ $json.silent === true }}' }) } },
  sender('Text + main menu', 'sendMessage', 'main'),
  sender('Text + next steps', 'sendMessage', 'after'),
  sender('Text + trial type', 'sendMessage', 'trial'),
  sender('Text + FAQ', 'sendMessage', 'faq'),
  sender('Text + back', 'sendMessage', 'back'),
  sender('Text + ask (force reply)', 'sendMessage', 'force'),
  sender('Text + handoff', 'sendMessage', 'handoff'),
  sender('Photo + main menu', 'sendPhoto', 'main'),
  sender('Photo + segment', 'sendPhoto', 'seg'),
  sender('Photo + next steps', 'sendPhoto', 'after'),
  { type: 'addNode', node: { name: 'Album', type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [1120, y + 150], credentials: CRED, parameters: { resource: 'message', operation: 'sendMediaGroup', chatId: '={{ $json.chat }}', media: { media: [0, 1, 2, 3].map((i) => ({ type: 'photo', media: `={{ $json.media[${i}] }}` })) }, additionalFields: {} } } },
  { type: 'addNode', node: { name: 'After album', type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [1344, y + 150], credentials: CRED, parameters: { resource: 'message', operation: 'sendMessage', chatId: "={{ $('Classify message').item.json.chat }}", text: "={{ $('Classify message').item.json.text }}", replyMarkup: 'inlineKeyboard', inlineKeyboard: KB.after, additionalFields: FIELDS } } },
  { type: 'addConnection', source: 'Album', target: 'After album' },
  { type: 'addNode', node: { name: 'Route action', type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [784, 288], parameters: { rules: { values: ROUTES.map(([k]) => rule(k)) }, options: {} } } },
  { type: 'addConnection', source: 'Classify message', target: 'Route action' },
  ...ROUTES.map(([, target], i) => ({ type: 'addConnection', source: 'Route action', sourceIndex: i, target })),
  { type: 'setNodeParameter', nodeName: 'Answer button', path: '/queryId', value: '={{ $json.qid }}' }
];
// A failed send (user blocked the bot, bad file_id) must not stop the other messages of the same update.
for (const n of ['Send plain', 'Answer button', 'Album', 'After album', ...ROUTES.slice(3, 12).map((r) => r[1]), 'Text + handoff']) ops.push({ type: 'setNodeSettings', nodeName: n, settings: { onError: 'continueRegularOutput' } });
ops.push({ type: 'updateNodeParameters', nodeName: 'Sticky Note e80c16d8', parameters: { content: '## LamsaTap bot (pro, 2026-09-30)\nClassify message = the whole bot (texts from systems/bot-brief.md, source: systems/n8n/workflows/telegram-classify.js). Menus: buttons -> photo/text screens. Trial request: answers travel inside the bot\'s own reply-request message (nothing stored). Clients\' free text -> owner with #c<chat_id>; owner replies -> client. Door links: owner gets code + place only (GM-017).\nASSETS = Telegram file_ids. Execution data OFF.' } });
process.stdout.write(JSON.stringify(ops));
