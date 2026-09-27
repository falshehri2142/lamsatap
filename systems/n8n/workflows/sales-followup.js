import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const ownerNotifySchema = [
  { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'timeout_min', displayName: 'timeout_min', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' },
  { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
];

const morning = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Every day 09:00 Riyadh',
    parameters: { rule: { interval: [ { field: 'days', daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 0 } ] } }
  }
});

const getProspects = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get prospects',
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'nKMAgkZAHTfHUHQv', cachedResultName: 'prospects' }, returnAll: true }
  },
  output: [{ id: 1, prospect_no: 1, name: 'Demo', stage: 'contact', last_followup: '2026-09-20T00:00:00.000Z' }]
});

const buildList = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Late follow-ups list',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const today = $today.toJSDate();\nconst late = $input.all().map(i => i.json).filter(p => ['contact','visit','trial'].includes(p.stage) && (!p.last_followup || Math.round((today - new Date(p.last_followup)) / 86400000) >= 3));\nif (!late.length) return [];\nconst lines = ['متابعات المبيعات المتأخرة (3 أيام أو أكثر، اقتراح):'];\nfor (const p of late) lines.push('- #' + p.prospect_no + ' ' + (p.name || '(بدون اسم)') + ' — ' + p.stage + (p.district ? ' — ' + p.district : ''));\nlines.push('حدّث الحالة من نموذج «حدّث عميل محتمل». ما نرسل للمحتملين آلياً أبداً.');\nreturn [{ json: { text: lines.join('\\n') } }];"
    }
  },
  output: [{ text: 'متابعات المبيعات المتأخرة' }]
});

const notifyList = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Send list via owner-notify',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'متابعة المبيعات' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const updateForm = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Form update prospect',
    parameters: {
      authentication: 'basicAuth',
      formTitle: 'حدّث عميل محتمل',
      formDescription: 'لصاحب المشروع فقط.',
      formFields: { values: [
        { fieldLabel: 'رقم العميل المحتمل', fieldName: 'prospect_no', fieldType: 'number', requiredField: true },
        { fieldLabel: 'المرحلة', fieldName: 'stage', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: 'contact' }, { option: 'visit' }, { option: 'trial' }, { option: 'signed' }, { option: 'rejected' } ] } },
        { fieldLabel: 'client_id (لاتيني، مطلوب لو signed)', fieldName: 'client_id', fieldType: 'text', placeholder: 'e.g. cafe-nakheel' },
        { fieldLabel: 'ملاحظات', fieldName: 'notes', fieldType: 'textarea' }
      ] },
      responseMode: 'onReceived',
      options: { appendAttribution: false, respondWithOptions: { values: { respondWith: 'text', formSubmittedText: 'تم التحديث.' } } }
    },
    credentials: { httpBasicAuth: newCredential('LamsaTap forms') }
  },
  output: [{ prospect_no: 1, stage: 'signed', client_id: 'cafe-demo', notes: '' }]
});

const updateRow = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Update prospect row',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: { __rl: true, mode: 'id', value: 'nKMAgkZAHTfHUHQv', cachedResultName: 'prospects' },
      matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'prospect_no', condition: 'eq', keyValue: expr('{{ $json.prospect_no }}') } ] },
      columns: {
        mappingMode: 'defineBelow',
        value: { stage: expr('{{ $json.stage }}'), last_followup: expr('{{ $today.toISODate() }}'), notes: expr('{{ $json.notes }}') },
        matchingColumns: [],
        schema: [
          { id: 'stage', displayName: 'stage', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'last_followup', displayName: 'last_followup', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'notes', displayName: 'notes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1, prospect_no: 1, name: 'Demo', activity: 'cafe', district: 'Nakheel', stage: 'signed' }]
});

const isSigned = ifElse({
  version: 2.2,
  config: {
    name: 'Signed with client_id?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          { leftValue: expr("{{ $('Form update prospect').item.json.stage }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'signed' },
          { leftValue: expr("{{ $('Form update prospect').item.json.client_id }}"), operator: { type: 'string', operation: 'notEmpty', singleValue: true } }
        ],
        combinator: 'and'
      }
    }
  }
});

const askApproval = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Ask owner to add client',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr("العميل المحتمل #{{ $('Form update prospect').item.json.prospect_no }} ({{ $json.name }}) صار موقّع. أضيفه لجدول العملاء باسم {{ $('Form update prospect').item.json.client_id }}؟"), kind: 'approval', timeout_min: 1440, subject: 'موافقة: عميل جديد' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const approvedCheck = ifElse({
  version: 2.2,
  config: {
    name: 'Approved?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [ { leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ],
        combinator: 'and'
      }
    }
  }
});

const insertClient = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert client',
    parameters: {
      resource: 'row',
      operation: 'insert',
      dataTableId: { __rl: true, mode: 'id', value: 'L2vQJFbR5OpAuRwk', cachedResultName: 'clients' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          client_id: expr("{{ $('Form update prospect').item.json.client_id }}"),
          name: expr("{{ $('Update prospect row').item.json.name }}"),
          kind: expr("{{ $('Update prospect row').item.json.activity }}"),
          district: expr("{{ $('Update prospect row').item.json.district }}"),
          status: 'active',
          created: expr('{{ $today.toISODate() }}'),
          notes: expr("من العملاء المحتملين #{{ $('Form update prospect').item.json.prospect_no }}")
        },
        matchingColumns: [],
        schema: [
          { id: 'client_id', displayName: 'client_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'name', displayName: 'name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'district', displayName: 'district', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'created', displayName: 'created', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'notes', displayName: 'notes', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1, client_id: 'cafe-demo' }]
});

const note = sticky('## (هـ) Sales follow-up (spec §2 (هـ))\nMorning: late prospects list to the owner (owner-notify info). Never messages prospects automatically (GM-010).\nForm (Basic Auth): update stage; signed + client_id -> owner approval -> insert into clients.\nWhatsApp number of the client is NOT set here (added by the owner later). Unpublished.', [buildList], { color: 4 });

export default workflow('sales-followup', 'LT (هـ) sales follow-up')
  .add(morning)
  .to(getProspects)
  .to(buildList)
  .to(notifyList)
  .add(updateForm)
  .to(updateRow)
  .to(isSigned.onTrue(askApproval.to(approvedCheck.onTrue(insertClient))))
  .add(note);
