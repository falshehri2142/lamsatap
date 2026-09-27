import { workflow, node, trigger, sticky, newCredential, switchCase, expr } from '@n8n/workflow-sdk';

const calledBy = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Send request (after approval only)',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: { values: [
        { name: 'client_id', type: 'string' },
        { name: 'template', type: 'string' },
        { name: 'text', type: 'string' }
      ] }
    }
  },
  output: [{ client_id: 'demo-cafe', template: 'renewal_reminder', text: 'نص الرسالة' }]
});

const readChannel = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Read CHANNEL',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'G36lB9xwPJEK1s7R', cachedResultName: 'LT get-channel' },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ channel: 'email', owner_email: 'owner@example.com', owner_whatsapp: '9665XXXXXXXX', wa_phone_number_id: '000000000000000' }]
});

const getClient = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get client',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: { __rl: true, mode: 'id', value: 'L2vQJFbR5OpAuRwk', cachedResultName: 'clients' },
      matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'client_id', condition: 'eq', keyValue: expr("{{ $('Send request (after approval only)').item.json.client_id }}") } ] },
      limit: 1
    }
  },
  output: [{ id: 1, client_id: 'demo-cafe', name: 'Demo cafe', whatsapp: '9665XXXXXXXX' }]
});

const decide = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Decide path',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'path', name: 'path', value: expr("{{ !$json.whatsapp ? 'no_number' : $('Read CHANNEL').item.json.channel }}"), type: 'string' },
        { id: 'to', name: 'to', value: expr("{{ String($json.whatsapp || '').replace(/[^0-9]/g, '') }}"), type: 'string' },
        { id: 'client_name', name: 'client_name', value: expr("{{ $json.name || $('Send request (after approval only)').item.json.client_id }}"), type: 'string' },
        { id: 'text', name: 'text', value: expr("{{ $('Send request (after approval only)').item.json.text }}"), type: 'string' },
        { id: 'template', name: 'template', value: expr("{{ $('Send request (after approval only)').item.json.template }}"), type: 'string' },
        { id: 'wa_phone_number_id', name: 'wa_phone_number_id', value: expr("{{ $('Read CHANNEL').item.json.wa_phone_number_id }}"), type: 'string' }
      ] }
    }
  },
  output: [{ path: 'email', to: '9665XXXXXXXX', client_name: 'Demo cafe', text: 'نص', template: 'renewal_reminder', wa_phone_number_id: '0' }]
});

const route = switchCase({
  version: 3.2,
  config: {
    name: 'Route',
    parameters: {
      rules: { values: [
        { outputKey: 'whatsapp', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.path }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'whatsapp' } ], combinator: 'and' } },
        { outputKey: 'email', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.path }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'email' } ], combinator: 'and' } },
        { outputKey: 'no_number', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.path }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'no_number' } ], combinator: 'and' } }
      ] }
    }
  }
});

const waSend = node({
  type: 'n8n-nodes-base.whatsApp',
  version: 1.1,
  config: {
    name: 'WhatsApp template to client',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'sendTemplate',
      phoneNumberId: expr('{{ $json.wa_phone_number_id }}'),
      recipientPhoneNumber: expr('{{ $json.to }}'),
      template: expr('{{ $json.template }}'),
      components: { component: [ { type: 'body', bodyParameters: { parameter: [ { type: 'text', text: expr('{{ $json.text }}') } ] } } ] }
    },
    credentials: { whatsAppApi: newCredential('WhatsApp LamsaTap') }
  },
  output: [{ messaging_product: 'whatsapp', messages: [{ id: 'wamid.x' }] }]
});

const waResult = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result WhatsApp',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'sent_to_client', name: 'sent_to_client', value: expr('{{ !!($json.messages && $json.messages.length) }}'), type: 'boolean' }
      ] }
    }
  },
  output: [{ sent_to_client: true }]
});

const linkForOwner = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Give owner a wa.me link',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr('أرسلها بنفسك لـ {{ $json.client_name }}:\nhttps://wa.me/{{ $json.to }}?text={{ encodeURIComponent($json.text) }}'), kind: 'info', timeout_min: 30, subject: expr('أرسل لـ {{ $json.client_name }}') },
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
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const notSent = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result not sent to client',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [ { id: 'sent_to_client', name: 'sent_to_client', value: false, type: 'boolean' } ] }
    }
  },
  output: [{ sent_to_client: false }]
});

const noNumber = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Tell owner: client has no number',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr('العميل {{ $json.client_name }} بلا رقم واتساب في جدول clients. الرسالة ما انرسلت:\n{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'عميل بلا رقم' },
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
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const notSent2 = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result no number',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [ { id: 'sent_to_client', name: 'sent_to_client', value: false, type: 'boolean' } ] }
    }
  },
  output: [{ sent_to_client: false }]
});

const note = sticky('## client-send (spec §2.0)\nCall ONLY after owner approval (approved = true).\nwhatsapp: template to the client, returns sent_to_client = true on success.\nemail (fallback): NO email to any client; the owner gets a wa.me link and sends it himself; returns false.\nNo number: tells the owner; returns false. Execution data OFF.', [decide], { color: 4 });

export default workflow('client-send', 'LT client-send')
  .add(calledBy)
  .to(readChannel)
  .to(getClient)
  .to(decide)
  .to(route
    .onCase(0, waSend.to(waResult))
    .onCase(1, linkForOwner.to(notSent))
    .onCase(2, noNumber.to(notSent2)))
  .add(note);
