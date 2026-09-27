import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const daily = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Every day 20:00 Riyadh',
    parameters: { rule: { interval: [ { field: 'days', daysInterval: 1, triggerAtHour: 20, triggerAtMinute: 0 } ] } }
  }
});

const getSubs = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get subscriptions',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'tZCBojaddmxSgJ7a', cachedResultName: 'subscriptions' }, returnAll: true }
  },
  output: [{ subscription_id: 'S1', client_id: 'demo-cafe', status: 'active', end_date: '2026-10-20T00:00:00.000Z' }]
});

const getInvoices = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get invoices',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'ZywD2nHdG3S26I7a', cachedResultName: 'invoices' }, returnAll: true }
  },
  output: [{ invoice_no: 'INV-0001', client: 'demo-cafe', amount_sar: 100, status: 'issued' }]
});

const getProspects = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get prospects',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'nKMAgkZAHTfHUHQv', cachedResultName: 'prospects' }, returnAll: true }
  },
  output: [{ prospect_no: 1, name: 'Demo', stage: 'contact', last_followup: '2026-09-20T00:00:00.000Z' }]
});

const getTaps = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get daily_taps',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'RUmelZoGTabI3qqQ', cachedResultName: 'daily_taps' }, returnAll: true }
  },
  output: [{ code: 'demo01', day: '2026-09-26T00:00:00.000Z', src: 'nfc', count: 3 }]
});

const buildReport = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Arabic report',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const rows = (n) => $(n).all().map(i => i.json).filter(r => r && r.id !== undefined);\nconst subs = rows('Get subscriptions');\nconst inv = rows('Get invoices');\nconst pros = rows('Get prospects');\nconst taps = rows('Get daily_taps');\nconst today = $today;\nconst dayStr = (d) => d ? String(d).slice(0, 10) : '';\nconst daysTo = (d) => Math.round((new Date(d) - today.toJSDate()) / 86400000);\nconst ending = subs.filter(s => s.status === 'active' && s.end_date && daysTo(s.end_date) >= 0 && daysTo(s.end_date) <= 30);\nconst awaiting = subs.filter(s => s.status === 'awaiting_renewal');\nconst unpaid = inv.filter(i => i.status === 'issued');\nconst late = pros.filter(p => ['contact','visit','trial'].includes(p.stage) && (!p.last_followup || daysTo(p.last_followup) <= -3));\nconst y = today.minus({ days: 1 }).toISODate();\nconst tapsY = taps.filter(t => dayStr(t.day) === y).reduce((a, t) => a + (Number(t.count) || 0), 0);\nconst lines = [];\nlines.push('تقرير لمسة تاب ' + today.toISODate());\nlines.push('اشتراكات تنتهي خلال 30 يوم: ' + ending.length + (ending.length ? ' (' + ending.map(s => s.client_id + ' ' + dayStr(s.end_date)).join('، ') + ')' : ''));\nlines.push('بانتظار التجديد: ' + awaiting.length + (awaiting.length ? ' (' + awaiting.map(s => s.client_id).join('، ') + ')' : ''));\nlines.push('فواتير غير مدفوعة: ' + unpaid.length + (unpaid.length ? ' (' + unpaid.map(i => i.invoice_no + ' ' + i.amount_sar + ' ر.س').join('، ') + ')' : ''));\nlines.push('متابعات مبيعات متأخرة: ' + late.length + (late.length ? ' (' + late.map(p => p.name).join('، ') + ')' : ''));\nlines.push('لمسات أمس (public فقط): ' + tapsY);\nreturn [{ json: { text: lines.join('\\n') } }];"
    }
  },
  output: [{ text: 'تقرير لمسة تاب' }]
});

const sendToOwner = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Send via owner-notify',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { text: expr('{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'تقرير لمسة تاب اليومي' },
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

const note = sticky('## (د) Daily report (spec §2 (د))\nReads subscriptions, invoices, prospects, daily_taps. No guest data, nothing about door units.\nEmpty tables do not break it (alwaysOutputData + filter on id).\nSends to the owner via owner-notify (kind=info). Unpublished.', [buildReport], { color: 4 });

export default workflow('daily-report', 'LT (د) daily report')
  .add(daily)
  .to(getSubs)
  .to(getInvoices)
  .to(getProspects)
  .to(getTaps)
  .to(buildReport)
  .to(sendToOwner)
  .add(note);
