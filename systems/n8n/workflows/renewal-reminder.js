import { workflow, node, trigger, sticky, newCredential, switchCase, ifElse, expr } from '@n8n/workflow-sdk';

const ownerNotifySchema = [
  { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'timeout_min', displayName: 'timeout_min', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' },
  { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
];

const subsTable = { __rl: true, mode: 'id', value: 'tZCBojaddmxSgJ7a', cachedResultName: 'subscriptions' };

const morning = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: 'Every day 09:00 Riyadh', parameters: { rule: { interval: [ { field: 'days', daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 0 } ] } } }
});

const getSubs = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get subscriptions', parameters: { resource: 'row', operation: 'get', dataTableId: subsTable, returnAll: true } },
  output: [{ id: 1, subscription_id: 'S1', client_id: 'demo-cafe', period: 'annual', end_date: '2026-10-20T00:00:00.000Z', price_sar: 100, renewal_price_sar: 100, status: 'active', renewal_confirmed: false, reminder_30_sent: false, reminder_7_sent: false }]
});

const getClients = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get clients', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'L2vQJFbR5OpAuRwk', cachedResultName: 'clients' }, returnAll: true } },
  output: [{ id: 1, client_id: 'demo-cafe', name: 'Demo cafe' }]
});

const classify = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Classify subscriptions',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const GRACE_DAYS = 14; // proposal\nconst subs = $('Get subscriptions').all().map(i => i.json).filter(s => ['active','awaiting_renewal'].includes(s.status));\nconst clients = {}; for (const c of $('Get clients').all().map(i => i.json)) if (c.client_id) clients[c.client_id] = c;\nconst today = $today.toJSDate();\nconst out = [];\nfor (const s of subs) {\n  if (!s.end_date) continue;\n  const days = Math.round((new Date(s.end_date) - today) / 86400000);\n  const name = (clients[s.client_id] && clients[s.client_id].name) || s.client_id;\n  if (s.status === 'awaiting_renewal' && days < -GRACE_DAYS) { out.push({ json: { action: 'to_expired', subscription_id: s.subscription_id } }); continue; }\n  if (s.status === 'active' && days < 0 && s.renewal_confirmed !== true) { out.push({ json: { action: 'to_awaiting', subscription_id: s.subscription_id } }); continue; }\n  if (s.status !== 'active') continue;\n  let which = null;\n  if (days >= 0 && days <= 7 && s.reminder_7_sent !== true) which = '7';\n  else if (days >= 0 && days <= 30 && s.reminder_30_sent !== true && s.period !== 'monthly') which = '30';\n  if (!which) continue;\n  const endStr = String(s.end_date).slice(0, 10);\n  const newPrice = Number(s.renewal_price_sar || s.price_sar || 0);\n  const oldPrice = Number(s.price_sar || 0);\n  let text = 'هلا ' + name + '، اشتراككم في لمسة تاب ينتهي ' + endStr + '. سعر التجديد ' + newPrice + ' ريال.';\n  if (newPrice > oldPrice) text += ' تنبيه: السعر الجديد أعلى من الحالي (' + oldPrice + ' ريال).';\n  text += ' للتجديد رد بـ «نعم» أو ادفع؛ للإلغاء رد بـ «إلغاء». ما فيه تجديد تلقائي.';\n  out.push({ json: { action: 'reminder', which, subscription_id: s.subscription_id, client_id: s.client_id, client_name: name, text, r30: which === '30' ? true : s.reminder_30_sent === true, r7: which === '7' ? true : s.reminder_7_sent === true } });\n}\nreturn out;"
    }
  },
  output: [{ action: 'reminder', which: '30', subscription_id: 'S1', client_id: 'demo-cafe', client_name: 'Demo cafe', text: 'نص', r30: true, r7: false }]
});

const routeAction = switchCase({
  version: 3.2,
  config: {
    name: 'Route by action',
    parameters: {
      rules: { values: [
        { outputKey: 'reminder', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'reminder' } ], combinator: 'and' } },
        { outputKey: 'to_awaiting', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'to_awaiting' } ], combinator: 'and' } },
        { outputKey: 'to_expired', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.action }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'to_expired' } ], combinator: 'and' } }
      ] }
    }
  }
});

const setAwaiting = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Set awaiting_renewal',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr('{{ $json.subscription_id }}') } ] },
      columns: { mappingMode: 'defineBelow', value: { status: 'awaiting_renewal' }, matchingColumns: [], schema: [ { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true } ] }
    }
  },
  output: [{ id: 1, subscription_id: 'S1', status: 'awaiting_renewal' }]
});

const setExpired = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Set expired',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr('{{ $json.subscription_id }}') } ] },
      columns: { mappingMode: 'defineBelow', value: { status: 'expired' }, matchingColumns: [], schema: [ { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true } ] }
    }
  },
  output: [{ id: 1, subscription_id: 'S1', status: 'expired' }]
});

const approvalText = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'One approval text',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const r = $input.all().map(i => i.json);\nconst lines = ['تذكيرات تجديد اليوم (' + r.length + '). أوافق على إرسالها للعملاء؟'];\nfor (const x of r) lines.push('- ' + x.client_name + ' (تذكير ' + x.which + ' يوم): ' + x.text);\nreturn [{ json: { text: lines.join('\\n') } }];"
    }
  },
  output: [{ text: 'تذكيرات تجديد اليوم' }]
});

const askOwner = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Owner approves reminders',
    parameters: {
      mode: 'once', source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'approval', timeout_min: 720, subject: 'موافقة: تذكيرات التجديد' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const approved = ifElse({
  version: 2.2,
  config: {
    name: 'Approved?',
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } }
  }
});

const backToReminders = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Back to reminder items',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return $('Classify subscriptions').all().filter(i => i.json.action === 'reminder').map(i => ({ json: i.json }));" }
  },
  output: [{ action: 'reminder', which: '30', subscription_id: 'S1', client_id: 'demo-cafe', client_name: 'Demo cafe', text: 'نص', r30: true, r7: false }]
});

const sendEach = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'client-send each',
    parameters: {
      mode: 'each', source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'wrxHqyElTEwoCPOX', cachedResultName: 'LT client-send' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { client_id: expr('{{ $json.client_id }}'), template: 'renewal_reminder', text: expr('{{ $json.text }}') },
        matchingColumns: [],
        schema: [
          { id: 'client_id', displayName: 'client_id', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'template', displayName: 'template', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
        ],
        attemptToConvertTypes: false, convertFieldsToString: true
      },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ sent_to_client: true }]
});

const sentCheck = ifElse({
  version: 2.2,
  config: {
    name: 'Sent to client?',
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.sent_to_client }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } }
  }
});

const markSent = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark reminder sent',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr("{{ $('Back to reminder items').item.json.subscription_id }}") } ] },
      columns: {
        mappingMode: 'defineBelow',
        value: { reminder_30_sent: expr("{{ $('Back to reminder items').item.json.r30 }}"), reminder_7_sent: expr("{{ $('Back to reminder items').item.json.r7 }}") },
        matchingColumns: [],
        schema: [
          { id: 'reminder_30_sent', displayName: 'reminder_30_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true },
          { id: 'reminder_7_sent', displayName: 'reminder_7_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1, subscription_id: 'S1' }]
});

const sentForm = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Form I sent the reminder',
    parameters: {
      authentication: 'basicAuth',
      formTitle: 'أرسلت تذكير التجديد',
      formDescription: 'لصاحب المشروع فقط: بعد ما ترسل التذكير بنفسك من واتساب.',
      formFields: { values: [
        { fieldLabel: 'subscription_id', fieldName: 'subscription_id', fieldType: 'text', requiredField: true },
        { fieldLabel: 'أي تذكير', fieldName: 'which', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: '30' }, { option: '7' } ] } }
      ] },
      responseMode: 'onReceived',
      options: { appendAttribution: false, respondWithOptions: { values: { respondWith: 'text', formSubmittedText: 'تم التسجيل.' } } }
    },
    credentials: { httpBasicAuth: newCredential('LamsaTap forms') }
  },
  output: [{ subscription_id: 'S1', which: '30' }]
});

const whichFlag = switchCase({
  version: 3.2,
  config: {
    name: 'Which flag',
    parameters: {
      rules: { values: [
        { outputKey: '30', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.which }}'), operator: { type: 'string', operation: 'equals' }, rightValue: '30' } ], combinator: 'and' } },
        { outputKey: '7', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.which }}'), operator: { type: 'string', operation: 'equals' }, rightValue: '7' } ], combinator: 'and' } }
      ] }
    }
  }
});

const mark30 = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark 30 sent (manual)',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr('{{ $json.subscription_id }}') } ] },
      columns: { mappingMode: 'defineBelow', value: { reminder_30_sent: true }, matchingColumns: [], schema: [ { id: 'reminder_30_sent', displayName: 'reminder_30_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true } ] }
    }
  },
  output: [{ id: 1 }]
});

const mark7 = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark 7 sent (manual)',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr('{{ $json.subscription_id }}') } ] },
      columns: { mappingMode: 'defineBelow', value: { reminder_7_sent: true }, matchingColumns: [], schema: [ { id: 'reminder_7_sent', displayName: 'reminder_7_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true } ] }
    }
  },
  output: [{ id: 1 }]
});

const renewForm = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Form record renewal',
    parameters: {
      authentication: 'basicAuth',
      formTitle: 'سجّل تجديد',
      formDescription: 'بعد التأكيد الصريح من العميل فقط (بند 18). ما فيه تجديد تلقائي.',
      formFields: { values: [
        { fieldLabel: 'subscription_id', fieldName: 'subscription_id', fieldType: 'text', requiredField: true },
        { fieldLabel: 'نوع التأكيد', fieldName: 'confirm_type', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: 'reply' }, { option: 'payment' } ] } },
        { fieldLabel: 'مرجع التأكيد (تاريخ الرد أو رقم الفاتورة، بدون أرقام جوال)', fieldName: 'confirm_ref', fieldType: 'text', requiredField: true }
      ] },
      responseMode: 'onReceived',
      options: { appendAttribution: false, respondWithOptions: { values: { respondWith: 'text', formSubmittedText: 'وصل. بانتظار موافقتك النهائية.' } } }
    },
    credentials: { httpBasicAuth: newCredential('LamsaTap forms') }
  },
  output: [{ subscription_id: 'S1', confirm_type: 'reply', confirm_ref: '2026-09-27' }]
});

const getOneSub = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get the subscription',
    parameters: { resource: 'row', operation: 'get', dataTableId: subsTable, matchType: 'allConditions', filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr('{{ $json.subscription_id }}') } ] }, limit: 1 }
  },
  output: [{ id: 1, subscription_id: 'S1', client_id: 'demo-cafe', period: 'annual', end_date: '2026-10-20T00:00:00.000Z', price_sar: 100, renewal_price_sar: 110 }]
});

const computeRenewal = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute renewal',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: "const s = $json;\nconst f = $('Form record renewal').item.json;\nconst end = DateTime.fromISO(String(s.end_date)).startOf('day');\nconst newEnd = s.period === 'monthly' ? end.plus({ months: 1 }) : end.plus({ years: 1 });\nconst price = Number(s.renewal_price_sar || s.price_sar || 0);\nreturn { json: { subscription_id: s.subscription_id, start_date: end.toISODate(), end_date: newEnd.toISODate(), price_sar: price, confirmed_at: $today.toISODate(), confirmed_ref: f.confirm_type + ':' + f.confirm_ref, text: 'تجديد ' + s.subscription_id + ' (' + s.client_id + '): من ' + end.toISODate() + ' إلى ' + newEnd.toISODate() + ' بسعر ' + price + ' ريال. التأكيد: ' + f.confirm_type + ':' + f.confirm_ref + '. أوافق؟' } };"
    }
  },
  output: [{ subscription_id: 'S1', start_date: '2026-10-20', end_date: '2027-10-20', price_sar: 110, confirmed_at: '2026-09-27', confirmed_ref: 'reply:2026-09-27', text: 'تجديد' }]
});

const approveRenewal = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Owner approves renewal',
    parameters: {
      mode: 'once', source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'approval', timeout_min: 1440, subject: 'موافقة: تجديد اشتراك' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const renewalApproved = ifElse({
  version: 2.2,
  config: {
    name: 'Renewal approved?',
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } }
  }
});

const applyRenewal = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Apply renewal',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: subsTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'subscription_id', condition: 'eq', keyValue: expr("{{ $('Compute renewal').item.json.subscription_id }}") } ] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          start_date: expr("{{ $('Compute renewal').item.json.start_date }}"),
          end_date: expr("{{ $('Compute renewal').item.json.end_date }}"),
          price_sar: expr("{{ $('Compute renewal').item.json.price_sar }}"),
          status: 'active',
          renewal_confirmed: false,
          renewal_confirmed_at: expr("{{ $('Compute renewal').item.json.confirmed_at }}"),
          renewal_confirmed_ref: expr("{{ $('Compute renewal').item.json.confirmed_ref }}"),
          reminder_30_sent: false,
          reminder_7_sent: false
        },
        matchingColumns: [],
        schema: [
          { id: 'start_date', displayName: 'start_date', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'end_date', displayName: 'end_date', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'price_sar', displayName: 'price_sar', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'renewal_confirmed', displayName: 'renewal_confirmed', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true },
          { id: 'renewal_confirmed_at', displayName: 'renewal_confirmed_at', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'renewal_confirmed_ref', displayName: 'renewal_confirmed_ref', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reminder_30_sent', displayName: 'reminder_30_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true },
          { id: 'reminder_7_sent', displayName: 'reminder_7_sent', required: false, defaultMatch: false, display: true, type: 'boolean', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1, subscription_id: 'S1' }]
});

const note = sticky('## (ب) Renewal reminder (spec §2 (ب), item 18)\nDaily 09:00: 30/7-day reminders need ONE owner approval, then client-send each. Flags flip only when sent_to_client = true (WhatsApp) or via the form after the owner sends himself (email fallback).\nactive past end_date -> awaiting_renewal; +14 days (proposal) -> expired. No auto-renewal ever.\nRenewal form: after explicit client confirmation + owner approval. Unpublished.', [classify], { color: 4 });

export default workflow('renewal-reminder', 'LT (ب) renewal reminder')
  .add(morning)
  .to(getSubs)
  .to(getClients)
  .to(classify)
  .to(routeAction
    .onCase(0, approvalText.to(askOwner.to(approved.onTrue(backToReminders.to(sendEach.to(sentCheck.onTrue(markSent)))))))
    .onCase(1, setAwaiting)
    .onCase(2, setExpired))
  .add(sentForm)
  .to(whichFlag.onCase(0, mark30).onCase(1, mark7))
  .add(renewForm)
  .to(getOneSub)
  .to(computeRenewal)
  .to(approveRenewal)
  .to(renewalApproved.onTrue(applyRenewal))
  .add(note);
