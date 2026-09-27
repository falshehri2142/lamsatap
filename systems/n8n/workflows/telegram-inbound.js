import { workflow, node, trigger, sticky, newCredential, switchCase, ifElse, expr } from '@n8n/workflow-sdk';

const tgCred = { telegramApi: newCredential('Telegram LamsaTap bot') };

const incoming = trigger({
  type: 'n8n-nodes-base.telegramTrigger',
  version: 1.5,
  config: { name: 'Telegram message in', parameters: { updates: ['message'] }, credentials: tgCred },
  output: [{ update_id: 1, message: { message_id: 10, chat: { id: 111, type: 'private' }, from: { id: 111, first_name: 'Ali', username: 'ali' }, text: '/start co_abcd1234efgh5678' } }]
});

const readChannel = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Read CHANNEL',
    executeOnce: true,
    parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: 'G36lB9xwPJEK1s7R', cachedResultName: 'LT get-channel' }, options: { waitForSubWorkflow: true } }
  },
  output: [{ channel: 'email', owner_telegram_chat_id: '999' }]
});

const classify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Classify message',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const cfg = $('Read CHANNEL').first().json;\nconst owner = String(cfg.owner_telegram_chat_id || '').trim();\nconst esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\nreturn $('Telegram message in').all().map(it => {\n  const m = it.json.message || {};\n  const chat = String((m.chat && m.chat.id) || '');\n  const text = String(m.text || '').slice(0, 2000);\n  if (!chat || (m.chat && m.chat.type !== 'private')) return { json: { kind: 'ignore' } };\n  if (owner && chat === owner) {\n    const r = m.reply_to_message && String(m.reply_to_message.text || '');\n    const t = r && r.match(/#c(\\d{3,20})/);\n    return { json: t && text ? { kind: 'relay', to: t[1], text } : { kind: 'ignore' } };\n  }\n  const d = text.match(/^\\/start\\s+(co|mt)_([a-z0-9]{12,32})$/i);\n  if (d) return { json: { kind: 'door', chat, request: d[1].toLowerCase() === 'mt' ? 'maintenance' : 'checkout', ref: d[2].toLowerCase() } };\n  if (/^\\/start\\b/.test(text)) return { json: { kind: 'welcome', chat } };\n  const tag = /منيو|menu/i.test(text) ? '[طلب تحديث منيو] ' : '';\n  const who = [m.from && m.from.first_name, m.from && m.from.username ? '@' + m.from.username : ''].filter(Boolean).join(' ');\n  return { json: { kind: 'client', chat, header: esc(tag + 'رسالة تليجرام #c' + chat + (who ? ' من ' + who : '')), text: text ? esc(text) : '(رسالة بدون نص: صورة أو ملف — افتحها من تليجرام)' } };\n});"
    }
  },
  output: [{ kind: 'door', chat: '111', request: 'checkout', ref: 'abcd1234efgh5678' }]
});

const route = switchCase({
  version: 3.2,
  config: {
    name: 'Route by kind',
    parameters: {
      rules: { values: [
        { outputKey: 'relay', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'relay' } ], combinator: 'and' } },
        { outputKey: 'door', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'door' } ], combinator: 'and' } },
        { outputKey: 'welcome', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'welcome' } ], combinator: 'and' } },
        { outputKey: 'client', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'client' } ], combinator: 'and' } }
      ] }
    }
  }
});

const relay = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Owner reply to client',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: expr('{{ $json.to }}'), text: expr('{{ $json.text }}'), additionalFields: { appendAttribution: false } },
    credentials: tgCred
  },
  output: [{ ok: true }]
});

const doorAck = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Ack guest (no data kept)',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: expr('{{ $json.chat }}'), text: 'وصل طلبك وبنبلّغ المضيف. للصيانة اكتب المشكلة في صفحة الوحدة أو على رقم الشركة المكتوب فيها.', additionalFields: { appendAttribution: false } },
    credentials: tgCred
  },
  output: [{ ok: true }]
});

const findUnit = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Find unit by ref',
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'HuJnYZFYt3Jukd0A', cachedResultName: 'units' }, matchType: 'allConditions', filters: { conditions: [ { keyName: 'ref', condition: 'eq', keyValue: expr("{{ $('Classify message').item.json.ref }}") } ] }, limit: 1 }
  },
  output: [{ id: 3, code: 'door01', place: 'شقة 3', type: 'door', status: 'active' }]
});

const isDoor = ifElse({
  version: 2.2,
  config: {
    name: 'Active door unit?',
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [
      { leftValue: expr('{{ $json.type }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'door' },
      { leftValue: expr('{{ $json.status }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'active' }
    ], combinator: 'and' } }
  }
});

const doorNotify = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Tell owner (code + place only)',
    parameters: {
      mode: 'once', source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr("{{ $('Classify message').item.json.request === 'maintenance' ? 'بلاغ صيانة (تليجرام) — الوحدة ' + $json.code + ' (' + $json.place + '). حوّل للمضيف من جوال الشركة بنص جديد.' : 'تشيك أوت (تليجرام) — الوحدة ' + $json.code + ' (' + $json.place + '). حوّل للمضيف من جوال الشركة: تأكد قبل الدخول.' }}"), kind: 'info', timeout_min: 30, subject: 'بلاغ وحدة' },
        matchingColumns: [],
        schema: [
          { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'timeout_min', displayName: 'timeout_min', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' },
          { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
        ],
        attemptToConvertTypes: false, convertFieldsToString: true
      },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: false, channel: 'telegram' }]
});

const welcome = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Welcome',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: expr('{{ $json.chat }}'), text: 'هلا فيك في لمسة تاب. اكتب سؤالك أو طلبك هنا ونرد عليك بأقرب وقت.', additionalFields: { appendAttribution: false } },
    credentials: tgCred
  },
  output: [{ ok: true }]
});

const toOwner = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Forward to owner',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: expr("{{ $('Read CHANNEL').first().json.owner_telegram_chat_id }}"), text: expr("{{ $json.header }}\n{{ $json.text }}\n\n↩️ رد على هالرسالة عشان يوصل ردك للعميل."), additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } },
    credentials: tgCred
  },
  output: [{ ok: true }]
});

const clientAck = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Ack client',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: expr("{{ $('Classify message').item.json.chat }}"), text: 'وصلت رسالتك، نرد عليك قريب.', additionalFields: { appendAttribution: false } },
    credentials: tgCred
  },
  output: [{ ok: true }]
});

const note = sticky('## Telegram inbound (GM-047)\nOne bot: client messages -> forwarded to the owner with #c<chat_id>; owner replies to that message -> relayed back. Nothing is stored in tables.\nGuest door deep links (/start co_<ref>, mt_<ref>): owner gets code + place only (GM-017); the guest chat id is used only to send the ack and is never stored or forwarded.\nExecution data OFF. Unpublished. Token: owner adds credential himself.', [classify], { color: 4 });

export default workflow('telegram-inbound', 'LT telegram inbound')
  .add(incoming)
  .to(readChannel)
  .to(classify)
  .to(route
    .onCase(0, relay)
    .onCase(1, doorAck.to(findUnit.to(isDoor.onTrue(doorNotify))))
    .onCase(2, welcome)
    .onCase(3, toOwner.to(clientAck)))
  .add(note);
