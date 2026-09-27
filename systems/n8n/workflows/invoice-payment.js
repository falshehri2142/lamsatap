import { workflow, node, trigger, sticky, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const ownerNotifySchema = [
  { id: 'text', displayName: 'text', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'timeout_min', displayName: 'timeout_min', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'number' },
  { id: 'subject', displayName: 'subject', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' }
];
const invoicesTable = { __rl: true, mode: 'id', value: 'ZywD2nHdG3S26I7a', cachedResultName: 'invoices' };
const paymentsTable = { __rl: true, mode: 'id', value: 'N7FV7J9liK4m2m8k', cachedResultName: 'payments' };
const ledgerTable = { __rl: true, mode: 'id', value: 'QwY5Z5g2kDHTamuP', cachedResultName: 'ledger' };
const ownerNotifyId = { __rl: true, mode: 'id', value: 'tyTmFhxRAh99uQIO', cachedResultName: 'LT owner-notify' };
const isTrue = { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' };

const invoiceForm = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Form issue invoice',
    parameters: {
      authentication: 'basicAuth',
      formTitle: 'أصدر فاتورة',
      formDescription: 'لصاحب المشروع فقط. بدون ضريبة إلا بقرار المحاسب.',
      formFields: { values: [
        { fieldLabel: 'client_id', fieldName: 'client', fieldType: 'text', requiredField: true },
        { fieldLabel: 'الوصف', fieldName: 'description', fieldType: 'text', requiredField: true },
        { fieldLabel: 'المبلغ (ريال)', fieldName: 'amount_sar', fieldType: 'number', requiredField: true }
      ] },
      responseMode: 'onReceived',
      options: { appendAttribution: false, respondWithOptions: { values: { respondWith: 'text', formSubmittedText: 'وصل. بانتظار موافقتك.' } } }
    },
    credentials: { httpBasicAuth: newCredential('LamsaTap forms') }
  },
  output: [{ client: 'demo-cafe', description: 'ستاند تقييم', amount_sar: 150 }]
});

const invoiceDraft = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Invoice draft text (no number yet)',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: { assignments: [
        { id: 'text', name: 'text', value: expr('فاتورة جديدة (الرقم يُحدد عند الموافقة)\nالعميل: {{ $json.client }}\nالوصف: {{ $json.description }}\nالمبلغ: {{ $json.amount_sar }} ريال\nالرسالة اللي بتروح للعميل: «فاتورة INV-(الرقم) من لمسة تاب: {{ $json.description }} — {{ $json.amount_sar }} ريال.»\nأوافق؟'), type: 'string' }
      ] }
    }
  },
  output: [{ client: 'demo-cafe', description: 'ستاند تقييم', amount_sar: 150, text: 'فاتورة جديدة' }]
});

const approveInvoice = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Owner approves invoice',
    parameters: {
      mode: 'once', source: 'database', workflowId: ownerNotifyId,
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'approval', timeout_min: 1440, subject: 'موافقة: فاتورة' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const invoiceApproved = ifElse({ version: 2.2, config: { name: 'Invoice approved?', parameters: { conditions: isTrue } } });

const getInvoices = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get all invoices', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: invoicesTable, returnAll: true } },
  output: [{ id: 1, invoice_no: 'INV-0001' }]
});

const nextInvoice = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Next invoice number',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const nos = $('Get all invoices').all().map(i => i.json.invoice_no).filter(Boolean);\nconst max = nos.reduce((m, n) => Math.max(m, parseInt(String(n).replace(/\\D/g, ''), 10) || 0), 0);\nconst no = 'INV-' + String(max + 1).padStart(4, '0');\nif (nos.includes(no)) throw new Error('duplicate invoice number ' + no);\nconst f = $('Form issue invoice').first().json;\nreturn [{ json: { invoice_no: no, date: $today.toISODate(), client: f.client, description: f.description, amount_sar: Number(f.amount_sar), status: 'issued' } }];"
    }
  },
  output: [{ invoice_no: 'INV-0002', date: '2026-09-27', client: 'demo-cafe', description: 'ستاند تقييم', amount_sar: 150, status: 'issued' }]
});

const insertInvoice = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert invoice',
    parameters: {
      resource: 'row', operation: 'insert', dataTableId: invoicesTable,
      columns: {
        mappingMode: 'defineBelow',
        value: { invoice_no: expr('{{ $json.invoice_no }}'), date: expr('{{ $json.date }}'), client: expr('{{ $json.client }}'), description: expr('{{ $json.description }}'), amount_sar: expr('{{ $json.amount_sar }}'), status: 'issued' },
        matchingColumns: [],
        schema: [
          { id: 'invoice_no', displayName: 'invoice_no', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'date', displayName: 'date', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'client', displayName: 'client', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'description', displayName: 'description', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'amount_sar', displayName: 'amount_sar', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 2, invoice_no: 'INV-0002' }]
});

const sendInvoice = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'client-send invoice',
    parameters: {
      mode: 'once', source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'wrxHqyElTEwoCPOX', cachedResultName: 'LT client-send' },
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { client_id: expr("{{ $('Next invoice number').item.json.client }}"), template: 'invoice_issued', text: expr("فاتورة {{ $('Next invoice number').item.json.invoice_no }} من لمسة تاب: {{ $('Next invoice number').item.json.description }} — {{ $('Next invoice number').item.json.amount_sar }} ريال.") },
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
  output: [{ sent_to_client: false }]
});

const paymentForm = trigger({
  type: 'n8n-nodes-base.formTrigger',
  version: 2.6,
  config: {
    name: 'Form record payment',
    parameters: {
      authentication: 'basicAuth',
      formTitle: 'سجّل دفعة',
      formDescription: 'لصاحب المشروع فقط. ما فيه دفعة بدون فاتورة.',
      formFields: { values: [
        { fieldLabel: 'رقم الفاتورة', fieldName: 'invoice_no', fieldType: 'text', requiredField: true, placeholder: 'INV-0001' },
        { fieldLabel: 'تاريخ الدفعة', fieldName: 'date', fieldType: 'date', requiredField: true },
        { fieldLabel: 'المبلغ (ريال)', fieldName: 'amount_sar', fieldType: 'number', requiredField: true },
        { fieldLabel: 'طريقة الدفع', fieldName: 'payment_method', fieldType: 'dropdown', requiredField: true, fieldOptions: { values: [ { option: 'bank_transfer' }, { option: 'cash' }, { option: 'other' } ] } },
        { fieldLabel: 'مرجع التحويل البنكي (فاضي للنقد)', fieldName: 'bank_ref', fieldType: 'text' },
        { fieldLabel: 'حساب الإيراد', fieldName: 'revenue_account', fieldType: 'dropdown', requiredField: true, defaultValue: '4200', fieldOptions: { values: [ { option: '4200' }, { option: '4100' } ] } }
      ] },
      responseMode: 'onReceived',
      options: { appendAttribution: false, respondWithOptions: { values: { respondWith: 'text', formSubmittedText: 'وصل. بانتظار موافقتك.' } } }
    },
    credentials: { httpBasicAuth: newCredential('LamsaTap forms') }
  },
  output: [{ invoice_no: 'INV-0001', date: '2026-09-27', amount_sar: 150, payment_method: 'bank_transfer', bank_ref: 'TRX1', revenue_account: '4200' }]
});

const getInvoice = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get the invoice', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: invoicesTable, matchType: 'allConditions', filters: { conditions: [ { keyName: 'invoice_no', condition: 'eq', keyValue: expr('{{ $json.invoice_no }}') } ] }, limit: 1 } },
  output: [{ id: 1, invoice_no: 'INV-0001', client: 'demo-cafe', amount_sar: 150, status: 'issued' }]
});

const getPayments = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get payments of invoice', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: paymentsTable, matchType: 'allConditions', filters: { conditions: [ { keyName: 'invoice_no', condition: 'eq', keyValue: expr("{{ $('Form record payment').first().json.invoice_no }}") } ] }, returnAll: true } },
  output: [{ id: 1, invoice_no: 'INV-0001', amount_sar: 50, payment_method: 'cash', bank_ref: 'CASH-INV-0001-1' }]
});

const getLedger = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Get ledger', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: ledgerTable, returnAll: true } },
  output: [{ id: 1, entry_no: 'JE-0001', line_no: 1 }]
});

const preparePayment = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prepare payment and entry',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const f = $('Form record payment').first().json;\nconst inv = $('Get the invoice').first().json;\nconst pays = $('Get payments of invoice').all().map(i => i.json).filter(p => p.id !== undefined);\nconst led = $('Get ledger').all().map(i => i.json).filter(l => l.id !== undefined);\nconst amount = Math.round(Number(f.amount_sar) * 100) / 100;\nconst err = (m) => [{ json: { valid: false, text: 'دفعة ما انسجلت: ' + m + ' (' + f.invoice_no + ')' } }];\nif (!inv || inv.id === undefined) return err('الفاتورة غير موجودة');\nif (inv.status === 'void') return err('الفاتورة ملغاة');\nif (inv.status === 'paid') return err('الفاتورة مدفوعة بالكامل');\nif (!(amount > 0)) return err('مبلغ غير صحيح');\nif (f.payment_method === 'other') return err('طريقة دفع أخرى: يسجلها المحاسب يدوياً');\nconst cash = f.payment_method === 'cash';\nlet bankRef = String(f.bank_ref || '').trim();\nif (cash) bankRef = 'CASH-' + f.invoice_no + '-' + (pays.filter(p => p.payment_method === 'cash').length + 1);\nif (!bankRef) return err('مرجع التحويل مطلوب');\nif (pays.some(p => p.bank_ref === bankRef && String(p.date).slice(0, 10) === String(f.date).slice(0, 10))) return err('دفعة مكررة بنفس المرجع والتاريخ');\nconst maxJe = led.reduce((m, l) => Math.max(m, parseInt(String(l.entry_no).replace(/\\D/g, ''), 10) || 0), 0);\nconst je = 'JE-' + String(maxJe + 1).padStart(4, '0');\nif (led.some(l => l.entry_no === je)) return err('رقم قيد مكرر');\nconst rev = f.revenue_account === '4100' ? { code: '4100', name: 'إيراد بيع مرة وحدة' } : { code: '4200', name: 'إيراد اشتراكات' };\nconst dr = cash ? { code: '1100', name: 'الصندوق (نقد)' } : { code: '1110', name: 'البنك' };\nconst lines = [\n  { entry_no: je, line_no: 1, date: f.date, account_code: dr.code, account_name: dr.name, debit_sar: amount, credit_sar: 0, description: 'دفعة ' + f.invoice_no, reference: f.invoice_no, owner_approved: 'yes' },\n  { entry_no: je, line_no: 2, date: f.date, account_code: rev.code, account_name: rev.name, debit_sar: 0, credit_sar: amount, description: 'دفعة ' + f.invoice_no, reference: f.invoice_no, owner_approved: 'yes' }\n];\nconst d = lines.reduce((a, l) => a + l.debit_sar, 0), c = lines.reduce((a, l) => a + l.credit_sar, 0);\nif (Math.abs(d - c) > 0.001) return err('القيد غير متوازن');\nconst prevPaid = pays.reduce((a, p) => a + (Number(p.amount_sar) || 0), 0);\nif (prevPaid + amount > Number(inv.amount_sar) + 0.001) return err('الدفعة أكبر من المتبقي (' + (Number(inv.amount_sar) - prevPaid) + ' ريال)');\nconst willBePaid = prevPaid + amount >= Number(inv.amount_sar);\nconst text = 'وصل المبلغ؟\\nالفاتورة ' + f.invoice_no + ' (' + inv.client + ') بمبلغ ' + inv.amount_sar + ' ريال\\nالدفعة: ' + amount + ' ريال ' + f.payment_method + ' مرجع ' + bankRef + ' بتاريخ ' + String(f.date).slice(0, 10) + '\\nالقيد ' + je + ': مدين ' + dr.code + ' ' + dr.name + ' ' + amount + ' / دائن ' + rev.code + ' ' + rev.name + ' ' + amount + '\\n' + (willBePaid ? 'الفاتورة تصير مدفوعة.' : 'دفعة جزئية: المدفوع ' + (prevPaid + amount) + ' من ' + inv.amount_sar + '.');\nreturn [{ json: { valid: true, text, payment: { date: f.date, invoice_no: f.invoice_no, client: inv.client, amount_sar: amount, payment_method: f.payment_method, bank_ref: bankRef, owner_confirmed: 'yes' }, lines, willBePaid } }];"
    }
  },
  output: [{ valid: true, text: 'وصل المبلغ؟', payment: { date: '2026-09-27', invoice_no: 'INV-0001', client: 'demo-cafe', amount_sar: 100, payment_method: 'bank_transfer', bank_ref: 'TRX1', owner_confirmed: 'yes' }, lines: [], willBePaid: true }]
});

const rereadInvoice = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Re-read invoice', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: invoicesTable, matchType: 'allConditions', filters: { conditions: [ { keyName: 'invoice_no', condition: 'eq', keyValue: expr("{{ $('Form record payment').first().json.invoice_no }}") } ] }, limit: 1 } },
  output: [{ id: 1, invoice_no: 'INV-0001', client: 'demo-cafe', amount_sar: 150, status: 'issued' }]
});

const rereadPayments = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Re-read payments', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: paymentsTable, matchType: 'allConditions', filters: { conditions: [ { keyName: 'invoice_no', condition: 'eq', keyValue: expr("{{ $('Form record payment').first().json.invoice_no }}") } ] }, returnAll: true } },
  output: [{ id: 1, invoice_no: 'INV-0001', amount_sar: 50, payment_method: 'cash', bank_ref: 'CASH-INV-0001-1' }]
});

const rereadLedger = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Re-read ledger', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: ledgerTable, returnAll: true } },
  output: [{ id: 1, entry_no: 'JE-0001', line_no: 1 }]
});

const recheck = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Recheck after approval',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const f = $('Form record payment').first().json;\nconst inv = $('Re-read invoice').first().json;\nconst pays = $('Re-read payments').all().map(i => i.json).filter(p => p.id !== undefined);\nconst led = $('Re-read ledger').all().map(i => i.json).filter(l => l.id !== undefined);\nconst amount = Math.round(Number(f.amount_sar) * 100) / 100;\nconst err = (m) => [{ json: { valid: false, text: 'دفعة ما انسجلت بعد الموافقة (تغيّرت البيانات): ' + m + ' (' + f.invoice_no + ')' } }];\nif (!inv || inv.id === undefined) return err('الفاتورة غير موجودة');\nif (inv.status === 'void') return err('الفاتورة ملغاة');\nif (inv.status === 'paid') return err('الفاتورة مدفوعة بالكامل');\nif (!(amount > 0)) return err('مبلغ غير صحيح');\nif (f.payment_method === 'other') return err('طريقة دفع أخرى: يسجلها المحاسب يدوياً');\nconst cash = f.payment_method === 'cash';\nlet bankRef = String(f.bank_ref || '').trim();\nif (cash) bankRef = 'CASH-' + f.invoice_no + '-' + (pays.filter(p => p.payment_method === 'cash').length + 1);\nif (!bankRef) return err('مرجع التحويل مطلوب');\nif (pays.some(p => p.bank_ref === bankRef && String(p.date).slice(0, 10) === String(f.date).slice(0, 10))) return err('دفعة مكررة بنفس المرجع والتاريخ');\nconst maxJe = led.reduce((m, l) => Math.max(m, parseInt(String(l.entry_no).replace(/\\D/g, ''), 10) || 0), 0);\nconst je = 'JE-' + String(maxJe + 1).padStart(4, '0');\nif (led.some(l => l.entry_no === je)) return err('رقم قيد مكرر');\nconst rev = f.revenue_account === '4100' ? { code: '4100', name: 'إيراد بيع مرة وحدة' } : { code: '4200', name: 'إيراد اشتراكات' };\nconst dr = cash ? { code: '1100', name: 'الصندوق (نقد)' } : { code: '1110', name: 'البنك' };\nconst lines = [\n  { entry_no: je, line_no: 1, date: f.date, account_code: dr.code, account_name: dr.name, debit_sar: amount, credit_sar: 0, description: 'دفعة ' + f.invoice_no, reference: f.invoice_no, owner_approved: 'yes' },\n  { entry_no: je, line_no: 2, date: f.date, account_code: rev.code, account_name: rev.name, debit_sar: 0, credit_sar: amount, description: 'دفعة ' + f.invoice_no, reference: f.invoice_no, owner_approved: 'yes' }\n];\nconst d = lines.reduce((a, l) => a + l.debit_sar, 0), c = lines.reduce((a, l) => a + l.credit_sar, 0);\nif (Math.abs(d - c) > 0.001) return err('القيد غير متوازن');\nconst prevPaid = pays.reduce((a, p) => a + (Number(p.amount_sar) || 0), 0);\nif (prevPaid + amount > Number(inv.amount_sar) + 0.001) return err('الدفعة أكبر من المتبقي (' + (Number(inv.amount_sar) - prevPaid) + ' ريال)');\nconst willBePaid = prevPaid + amount >= Number(inv.amount_sar);\nconst text = 'وصل المبلغ؟\\nالفاتورة ' + f.invoice_no + ' (' + inv.client + ') بمبلغ ' + inv.amount_sar + ' ريال\\nالدفعة: ' + amount + ' ريال ' + f.payment_method + ' مرجع ' + bankRef + ' بتاريخ ' + String(f.date).slice(0, 10) + '\\nالقيد ' + je + ': مدين ' + dr.code + ' ' + dr.name + ' ' + amount + ' / دائن ' + rev.code + ' ' + rev.name + ' ' + amount + '\\n' + (willBePaid ? 'الفاتورة تصير مدفوعة.' : 'دفعة جزئية: المدفوع ' + (prevPaid + amount) + ' من ' + inv.amount_sar + '.');\nreturn [{ json: { valid: true, text, payment: { date: f.date, invoice_no: f.invoice_no, client: inv.client, amount_sar: amount, payment_method: f.payment_method, bank_ref: bankRef, owner_confirmed: 'yes' }, lines, willBePaid } }];"
    }
  },
  output: [{ valid: true, text: 'وصل المبلغ؟', payment: { date: '2026-09-27', invoice_no: 'INV-0001', client: 'demo-cafe', amount_sar: 100, payment_method: 'bank_transfer', bank_ref: 'TRX1', owner_confirmed: 'yes' }, lines: [], willBePaid: true }]
});

const stillValid = ifElse({ version: 2.2, config: { name: 'Still valid?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } } } });

const tellChanged = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Tell owner: changed after approval',
    parameters: {
      mode: 'once', source: 'database', workflowId: ownerNotifyId,
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'دفعة ما انسجلت' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const isValid = ifElse({ version: 2.2, config: { name: 'Valid?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr('{{ $json.valid }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } } } });

const tellInvalid = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Tell owner: payment rejected',
    parameters: {
      mode: 'once', source: 'database', workflowId: ownerNotifyId,
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'info', timeout_min: 30, subject: 'دفعة ما انسجلت' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: false, channel: 'email' }]
});

const approvePayment = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Owner confirms payment',
    parameters: {
      mode: 'once', source: 'database', workflowId: ownerNotifyId,
      workflowInputs: { mappingMode: 'defineBelow', value: { text: expr('{{ $json.text }}'), kind: 'approval', timeout_min: 2880, subject: 'موافقة: دفعة وقيد' }, matchingColumns: [], schema: ownerNotifySchema, attemptToConvertTypes: false, convertFieldsToString: true },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [{ approved: true, channel: 'email' }]
});

const paymentApproved = ifElse({ version: 2.2, config: { name: 'Payment approved?', parameters: { conditions: isTrue } } });

const insertPayment = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert payment',
    parameters: {
      resource: 'row', operation: 'insert', dataTableId: paymentsTable,
      columns: {
        mappingMode: 'defineBelow',
        value: {
          date: expr("{{ $('Recheck after approval').item.json.payment.date }}"),
          invoice_no: expr("{{ $('Recheck after approval').item.json.payment.invoice_no }}"),
          client: expr("{{ $('Recheck after approval').item.json.payment.client }}"),
          amount_sar: expr("{{ $('Recheck after approval').item.json.payment.amount_sar }}"),
          payment_method: expr("{{ $('Recheck after approval').item.json.payment.payment_method }}"),
          bank_ref: expr("{{ $('Recheck after approval').item.json.payment.bank_ref }}"),
          owner_confirmed: 'yes'
        },
        matchingColumns: [],
        schema: [
          { id: 'date', displayName: 'date', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'invoice_no', displayName: 'invoice_no', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'client', displayName: 'client', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'amount_sar', displayName: 'amount_sar', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'payment_method', displayName: 'payment_method', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'bank_ref', displayName: 'bank_ref', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'owner_confirmed', displayName: 'owner_confirmed', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const splitLines = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Two ledger lines',
    parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: "return $('Recheck after approval').first().json.lines.map(l => ({ json: l }));" }
  },
  output: [{ entry_no: 'JE-0002', line_no: 1, date: '2026-09-27', account_code: '1110', account_name: 'البنك', debit_sar: 100, credit_sar: 0, description: 'دفعة INV-0001', reference: 'INV-0001', owner_approved: 'yes' }]
});

const insertLedger = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Insert ledger lines',
    parameters: {
      resource: 'row', operation: 'insert', dataTableId: ledgerTable,
      columns: {
        mappingMode: 'defineBelow',
        value: {
          entry_no: expr('{{ $json.entry_no }}'), line_no: expr('{{ $json.line_no }}'), date: expr('{{ $json.date }}'),
          account_code: expr('{{ $json.account_code }}'), account_name: expr('{{ $json.account_name }}'),
          debit_sar: expr('{{ $json.debit_sar }}'), credit_sar: expr('{{ $json.credit_sar }}'),
          description: expr('{{ $json.description }}'), reference: expr('{{ $json.reference }}'), owner_approved: 'yes'
        },
        matchingColumns: [],
        schema: [
          { id: 'entry_no', displayName: 'entry_no', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'line_no', displayName: 'line_no', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'date', displayName: 'date', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true },
          { id: 'account_code', displayName: 'account_code', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'account_name', displayName: 'account_name', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'debit_sar', displayName: 'debit_sar', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'credit_sar', displayName: 'credit_sar', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
          { id: 'description', displayName: 'description', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'reference', displayName: 'reference', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'owner_approved', displayName: 'owner_approved', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const fullyPaid = ifElse({
  version: 2.2,
  config: {
    name: 'Fully paid now?',
    executeOnce: true,
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [ { leftValue: expr("{{ $('Recheck after approval').first().json.willBePaid }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } } ], combinator: 'and' } }
  }
});

const markPaid = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Mark invoice paid',
    executeOnce: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: invoicesTable, matchType: 'allConditions',
      filters: { conditions: [ { keyName: 'invoice_no', condition: 'eq', keyValue: expr("{{ $('Recheck after approval').first().json.payment.invoice_no }}") } ] },
      columns: {
        mappingMode: 'defineBelow',
        value: { status: 'paid', payment_ref: expr("{{ $('Recheck after approval').first().json.payment.bank_ref }}") },
        matchingColumns: [],
        schema: [
          { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'payment_ref', displayName: 'payment_ref', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      }
    }
  },
  output: [{ id: 1 }]
});

const note = sticky('## (ج) Invoice and payment (spec §2 (ج))\nج1: form -> owner approval FIRST -> next INV number -> insert -> client-send (WhatsApp, or wa.me link to owner in fallback).\nج2: form -> checks (invoice exists, not void/paid, method not other, no duplicate) -> balanced 2-line entry (1110/1100 vs 4200/4100) -> owner approval -> RE-READ and recheck (race-safe) -> insert payment + 2 ledger lines -> paid only when total >= amount.\nNo VAT unless the accountant decides. Nothing is written before approval. Unpublished.', [preparePayment], { color: 4 });

export default workflow('invoice-payment', 'LT (ج) invoice and payment')
  .add(invoiceForm)
  .to(invoiceDraft)
  .to(approveInvoice)
  .to(invoiceApproved.onTrue(getInvoices.to(nextInvoice.to(insertInvoice.to(sendInvoice)))))
  .add(paymentForm)
  .to(getInvoice)
  .to(getPayments)
  .to(getLedger)
  .to(preparePayment)
  .to(isValid
    .onTrue(approvePayment.to(paymentApproved.onTrue(rereadInvoice.to(rereadPayments.to(rereadLedger.to(recheck.to(stillValid.onTrue(insertPayment.to(splitLines.to(insertLedger.to(fullyPaid.onTrue(markPaid))))).onFalse(tellChanged))))))))
    .onFalse(tellInvalid))
  .add(note);
