import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const receive = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Receive daily totals',
    parameters: {
      httpMethod: 'POST',
      path: 'lt-daily-taps',
      authentication: 'headerAuth',
      responseMode: 'onReceived',
      options: { noResponseBody: true }
    },
    credentials: { httpHeaderAuth: newCredential('LamsaTap tap import') }
  },
  output: [{ body: { rows: [ { code: 'demo01', day: '2026-09-26', src: 'nfc', count: 3 } ] } }]
});

const keepRows = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Keep rows only',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: { assignments: [ { id: 'rows', name: 'rows', value: expr('{{ $json.body?.rows ?? [] }}'), type: 'array' } ] }
    }
  },
  output: [{ rows: [ { code: 'demo01', day: '2026-09-26', src: 'nfc', count: 3 } ] }]
});

const getUnits = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Get units',
    executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: { __rl: true, mode: 'id', value: 'HuJnYZFYt3Jukd0A', cachedResultName: 'units' }, returnAll: true }
  },
  output: [{ id: 1, code: 'demo01', type: 'public', status: 'active' }]
});

const filterPublic = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Public codes only, daily totals only',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const pub = new Set($('Get units').all().map(i => i.json).filter(u => u.type === 'public').map(u => u.code));\nconst rows = $('Keep rows only').first().json.rows || [];\nconst out = [];\nfor (const r of rows) {\n  const code = String(r.code || '').toLowerCase();\n  const day = String(r.day || '').slice(0, 10);\n  const src = ['nfc','qr'].includes(r.src) ? r.src : 'other';\n  const count = Math.max(0, Math.floor(Number(r.count) || 0));\n  if (!pub.has(code)) continue; // door or unknown codes: never stored (item 20)\n  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(day) || !count) continue;\n  out.push({ json: { code, day, src, count } });\n}\nreturn out;"
    }
  },
  output: [{ code: 'demo01', day: '2026-09-26', src: 'nfc', count: 3 }]
});

const upsert = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Upsert daily_taps',
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: { __rl: true, mode: 'id', value: 'RUmelZoGTabI3qqQ', cachedResultName: 'daily_taps' },
      matchType: 'allConditions',
      filters: { conditions: [
        { keyName: 'code', condition: 'eq', keyValue: expr('{{ $json.code }}') },
        { keyName: 'day', condition: 'eq', keyValue: expr('{{ $json.day }}') },
        { keyName: 'src', condition: 'eq', keyValue: expr('{{ $json.src }}') }
      ] },
      columns: {
        mappingMode: 'defineBelow',
        value: { code: expr('{{ $json.code }}'), day: expr('{{ $json.day }}'), src: expr('{{ $json.src }}'), count: expr('{{ $json.count }}') },
        matchingColumns: [],
        schema: [
          { id: 'code', displayName: 'code', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'day', displayName: 'day', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'src', displayName: 'src', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'count', displayName: 'count', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1, code: 'demo01' }]
});

const note = sticky('## (و) Tap totals import (spec §2 (و), tap-counter.md)\nReceives DAILY TOTALS only {code, day, src, count} (header auth). No IP, no times, no visitors.\nDoor codes and unknown codes are dropped before any write (item 20).\nThe counting source (Pages Function + D1) is NOT built yet (owner approval). Unpublished.', [filterPublic], { color: 4 });

export default workflow('tap-import', 'LT (و) tap totals import')
  .add(receive)
  .to(keepRows)
  .to(getUnits)
  .to(filterPublic)
  .to(upsert)
  .add(note);
