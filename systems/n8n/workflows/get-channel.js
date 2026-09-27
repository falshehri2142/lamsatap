import { workflow, node, trigger, sticky, placeholder, expr } from '@n8n/workflow-sdk';

const calledBy = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: {
    name: 'Called by other workflows',
    parameters: { inputSource: 'passthrough' }
  }
});

const channelSetting = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'CHANNEL',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'channel', name: 'channel', value: 'email', type: 'string' },
          { id: 'owner_email', name: 'owner_email', value: placeholder('Owner email for fallback notices (internal only)'), type: 'string' },
          { id: 'owner_whatsapp', name: 'owner_whatsapp', value: placeholder('Owner personal WhatsApp number with country code, not the company API number'), type: 'string' },
          { id: 'wa_phone_number_id', name: 'wa_phone_number_id', value: placeholder('WhatsApp Cloud API phone number ID of the company number'), type: 'string' },
          { id: 'wa_template_lang', name: 'wa_template_lang', value: 'ar', type: 'string' }
        ]
      }
    }
  },
  output: [{ channel: 'email', owner_email: 'owner@example.com', owner_whatsapp: '9665XXXXXXXX', wa_phone_number_id: '000000000000000' }]
});

const note = sticky('## CHANNEL = the only switch (GM-010)\nchannel: email (internal fallback now) or whatsapp (after the owner activates WhatsApp Cloud API).\nChange ONLY this node. Every other workflow reads it.\nOwner fills the three values himself. No phone numbers of guests, hosts or workers here (GM-017).', [channelSetting], { color: 4 });

export default workflow('get-channel', 'LT get-channel')
  .add(calledBy)
  .to(channelSetting)
  .add(note);
