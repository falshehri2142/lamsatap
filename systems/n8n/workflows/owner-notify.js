import { workflow, node, trigger, sticky, newCredential, switchCase, expr } from '@n8n/workflow-sdk';

const calledBy = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Notify request',
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: { values: [
        { name: 'text', type: 'string' },
        { name: 'kind', type: 'string' },
        { name: 'timeout_min', type: 'number' },
        { name: 'subject', type: 'string' }
      ] }
    }
  },
  output: [{ text: 'Test notice', kind: 'info', timeout_min: 30, subject: 'LamsaTap' }]
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

const buildRoute = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Build route key',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: { assignments: [
        { id: 'route', name: 'route', value: expr("{{ $json.channel }}_{{ $('Notify request').item.json.kind }}"), type: 'string' },
        { id: 'text', name: 'text', value: expr("{{ $('Notify request').item.json.text }}"), type: 'string' },
        { id: 'subject', name: 'subject', value: expr("{{ $('Notify request').item.json.subject || 'LamsaTap' }}"), type: 'string' },
        { id: 'timeout_min', name: 'timeout_min', value: expr("{{ $('Notify request').item.json.timeout_min || 30 }}"), type: 'number' }
      ] }
    }
  },
  output: [{ route: 'email_info', text: 'Test notice', subject: 'LamsaTap', timeout_min: 30, channel: 'email', owner_email: 'owner@example.com', owner_whatsapp: '9665XXXXXXXX', wa_phone_number_id: '000000000000000' }]
});

const route = switchCase({
  version: 3.2,
  config: {
    name: 'Route by channel and kind',
    parameters: {
      rules: { values: [
        { outputKey: 'whatsapp_info', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.route }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'whatsapp_info' } ], combinator: 'and' } },
        { outputKey: 'whatsapp_approval', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.route }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'whatsapp_approval' } ], combinator: 'and' } },
        { outputKey: 'email_info', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.route }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'email_info' } ], combinator: 'and' } },
        { outputKey: 'email_approval', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.route }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'email_approval' } ], combinator: 'and' } }
      ] }
    }
  }
});

const waInfo = node({
  type: 'n8n-nodes-base.whatsApp',
  version: 1.1,
  config: {
    name: 'WhatsApp owner_alert',
    parameters: {
      resource: 'message',
      operation: 'sendTemplate',
      phoneNumberId: expr('{{ $json.wa_phone_number_id }}'),
      recipientPhoneNumber: expr('{{ $json.owner_whatsapp }}'),
      template: 'owner_alert',
      components: { component: [ { type: 'body', bodyParameters: { parameter: [ { type: 'text', text: expr('{{ $json.text }}') } ] } } ] }
    },
    credentials: { whatsAppApi: newCredential('WhatsApp LamsaTap') }
  },
  output: [{ messaging_product: 'whatsapp', messages: [{ id: 'wamid.x' }] }]
});

const waApproval = node({
  type: 'n8n-nodes-base.whatsApp',
  version: 1.1,
  config: {
    name: 'WhatsApp owner_approval',
    parameters: {
      resource: 'message',
      operation: 'sendTemplate',
      phoneNumberId: expr('{{ $json.wa_phone_number_id }}'),
      recipientPhoneNumber: expr('{{ $json.owner_whatsapp }}'),
      template: 'owner_approval',
      components: { component: [ { type: 'body', bodyParameters: { parameter: [
        { type: 'text', text: expr('{{ $json.text }}') },
        { type: 'text', text: expr('{{ $execution.resumeUrl }}?d=yes') },
        { type: 'text', text: expr('{{ $execution.resumeUrl }}?d=no') }
      ] } } ] }
    },
    credentials: { whatsAppApi: newCredential('WhatsApp LamsaTap') }
  },
  output: [{ messaging_product: 'whatsapp', messages: [{ id: 'wamid.x' }] }]
});

const waWait = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait for owner tap',
    parameters: {
      resume: 'webhook',
      httpMethod: 'GET',
      limitWaitTime: true,
      limitType: 'afterTimeInterval',
      resumeAmount: expr("{{ $('Build route key').item.json.timeout_min }}"),
      resumeUnit: 'minutes',
      options: { ignoreBots: true }
    }
  },
  output: [{ query: { d: 'yes' } }]
});

const waResult = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result WhatsApp approval',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'approved', name: 'approved', value: expr("{{ $json.query?.d === 'yes' }}"), type: 'boolean' },
        { id: 'channel', name: 'channel', value: 'whatsapp', type: 'string' }
      ] }
    }
  },
  output: [{ approved: true, channel: 'whatsapp' }]
});

const waInfoResult = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result WhatsApp info',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'approved', name: 'approved', value: false, type: 'boolean' },
        { id: 'channel', name: 'channel', value: 'whatsapp', type: 'string' }
      ] }
    }
  },
  output: [{ approved: false, channel: 'whatsapp' }]
});

const mailInfo = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Email owner notice',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: expr('{{ $json.owner_email }}'),
      subject: expr('{{ $json.subject }}'),
      emailType: 'text',
      message: expr('{{ $json.text }}'),
      options: { appendAttribution: false }
    },
    credentials: { gmailOAuth2: newCredential('Gmail LamsaTap') }
  },
  output: [{ id: 'msg1' }]
});

const mailInfoResult = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result email info',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'approved', name: 'approved', value: false, type: 'boolean' },
        { id: 'channel', name: 'channel', value: 'email', type: 'string' }
      ] }
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const mailApproval = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Email owner approval',
    parameters: {
      resource: 'message',
      operation: 'sendAndWait',
      sendTo: expr('{{ $json.owner_email }}'),
      subject: expr('{{ $json.subject }}'),
      message: expr('{{ $json.text }}'),
      responseType: 'approval',
      approvalOptions: { values: { approvalType: 'double', approveLabel: 'موافق', disapproveLabel: 'مرفوض' } },
      options: {
        appendAttribution: false,
        limitWaitTime: { values: { limitType: 'afterTimeInterval', resumeAmount: expr('{{ $json.timeout_min }}'), resumeUnit: 'minutes' } }
      }
    },
    credentials: { gmailOAuth2: newCredential('Gmail LamsaTap') }
  },
  output: [{ data: { approved: true } }]
});

const mailResult = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Result email approval',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [
        { id: 'approved', name: 'approved', value: expr('{{ $json.data?.approved === true }}'), type: 'boolean' },
        { id: 'channel', name: 'channel', value: 'email', type: 'string' }
      ] }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const note = sticky('## owner-notify (spec §2.0)\nInputs: text, kind (info|approval), timeout_min, subject.\nReturns: approved (true/false; timeout = false), channel.\nWhatsApp approval = template owner_approval with two links from $execution.resumeUrl (?d=yes / ?d=no) + Wait. Not Send-and-Wait (free text, fails outside 24h).\nEmail = internal fallback to the owner only.\nExecution data saving is OFF (item 26).', [buildRoute], { color: 4 });

export default workflow('owner-notify', 'LT owner-notify')
  .add(calledBy)
  .to(readChannel)
  .to(buildRoute)
  .to(route
    .onCase(0, waInfo.to(waInfoResult))
    .onCase(1, waApproval.to(waWait.to(waResult)))
    .onCase(2, mailInfo.to(mailInfoResult))
    .onCase(3, mailApproval.to(mailResult)))
  .add(note);
