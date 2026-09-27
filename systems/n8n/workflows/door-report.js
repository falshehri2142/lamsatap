import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';

const receive = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Unit page button',
    parameters: {
      httpMethod: 'POST',
      path: 'lt-door-report',
      authentication: 'none',
      responseMode: 'onReceived',
      options: { ignoreBots: true, responseData: 'وصل طلبك. إذا ما جاك رد، تواصل على رقم الشركة المكتوب في الصفحة.' }
    }
  },
  output: [{ body: { ref: 'abcd1234efgh5678', request: 'checkout', problem: '' } }]
});

const keepThree = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Keep ref, request, problem only',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'ref', name: 'ref', value: expr("{{ String($json.body?.ref ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32) }}"), type: 'string' },
        { id: 'request', name: 'request', value: expr("{{ $json.body?.request === 'maintenance' ? 'maintenance' : 'checkout' }}"), type: 'string' },
        { id: 'problem', name: 'problem', value: expr("{{ String($json.body?.problem ?? '').slice(0, 300) }}"), type: 'string' }
      ] }
    }
  },
  output: [{ ref: 'abcd1234efgh5678', request: 'checkout', problem: '' }]
});

const stripPhones = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Remove phone numbers from problem',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: "const ar = '٠١٢٣٤٥٦٧٨٩', fa = '۰۱۲۳۴۵۶۷۸۹';\nlet t = String($json.problem || '').replace(/[٠-٩]/g, d => String(ar.indexOf(d))).replace(/[۰-۹]/g, d => String(fa.indexOf(d)));\nt = t.replace(/(\\+|00)?[\\d][\\d\\s\\-().]{7,}\\d/g, m => { const d = m.replace(/\\D/g, ''); return (/^(966|00966)?0?5\\d{8}$/.test(d) || d.length >= 9) ? '[رقم محذوف]' : m; });\nreturn { json: { ref: $json.ref, request: $json.request, problem: t } };"
    }
  },
  output: [{ ref: 'abcd1234efgh5678', request: 'checkout', problem: '' }]
});

const getUnit = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Find unit by ref',
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'id', value: 'HuJnYZFYt3Jukd0A', cachedResultName: 'units' },
      matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'ref', condition: 'eq', keyValue: expr('{{ $json.ref }}') } ] },
      limit: 1
    }
  },
  output: [{ id: 3, code: 'door01', ref: 'abcd1234efgh5678', place: 'شقة 3', type: 'door', status: 'active' }]
});

const isDoor = ifElse({
  version: 2.2,
  config: {
    name: 'Active door unit?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          { leftValue: expr('{{ $json.type }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'door' },
          { leftValue: expr('{{ $json.status }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'active' },
          { leftValue: expr("{{ $('Remove phone numbers from problem').item.json.ref }}"), operator: { type: 'string', operation: 'notEmpty', singleValue: true } }
        ],
        combinator: 'and'
      }
    }
  }
});

const ownerText = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Text for owner (code + place only)',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'text', name: 'text', value: expr("{{ $('Remove phone numbers from problem').item.json.request === 'maintenance' ? 'بلاغ صيانة — الوحدة ' + $json.code + ' (' + $json.place + '): ' + ($('Remove phone numbers from problem').item.json.problem || '(بدون وصف)') + '. حوّل للمضيف من جوال الشركة بنص جديد.' : 'تشيك أوت — الوحدة ' + $json.code + ' (' + $json.place + '). حوّل للمضيف من جوال الشركة: تأكد قبل الدخول.' }}"), type: 'string' }
      ] }
    }
  },
  output: [{ text: 'تشيك أوت — الوحدة door01 (شقة 3).' }]
});

const notifyOwner = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Tell owner via owner-notify',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr('{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'بلاغ وحدة' },
        matchingColumns: [],
        schema: [
          { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
          { id: 'timeout_min', displayName: 'timeout_min', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' },
          { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
        ],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      },
      options: { waitForSubWorkflow: true }
    },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000
  },
  output: [{ approved: false, channel: 'email' }]
});

const note = sticky('## (أ) door-report (GM-017, items 20/21/26/28)\nGuest page sends ref + request + problem only. Headers/IP dropped at once; phone numbers in problem removed.\nOwner gets unit code + place only and forwards to the host MANUALLY from the company phone.\nNo host/worker/guest numbers in n8n. Reads units only, writes nothing. Execution data OFF.\nPublishing needs item 23 done + owner decision.', [keepThree], { color: 3 });

export default workflow('door-report', 'LT (أ) door report')
  .add(receive)
  .to(keepThree)
  .to(stripPhones)
  .to(getUnit)
  .to(isDoor.onTrue(ownerText.to(notifyOwner)))
  .add(note);
