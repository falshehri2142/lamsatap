// Local test of (ج) Code nodes: node systems/n8n/workflows/test-invoice-payment.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/invoice-payment.js', 'utf8');
function codeOf(name) {
  const i = src.indexOf("name: '" + name + "'");
  const j = src.indexOf('jsCode: "', i) + 'jsCode: '.length;
  let k = j + 1;
  while (!(src[k] === '"' && src[k - 1] !== '\\')) k++;
  return JSON.parse(src.slice(j, k + 1));
}
const lux = { toISODate: () => '2026-09-27' };
function run(js, nodes) {
  const $ = (n) => ({ all: () => nodes[n].map(j => ({ json: j })), first: () => ({ json: nodes[n][0] }) });
  return new Function('$', '$today', js)($, lux);
}
let fail = 0;
const check = (label, cond, extra) => { if (!cond) fail++; console.log(cond ? 'PASS' : 'FAIL', label, extra || ''); };

const nextInv = codeOf('Next invoice number');
const r1 = run(nextInv, { 'Get all invoices': [{}], 'Form issue invoice': [{ client: 'c1', description: 'x', amount_sar: '150' }] })[0].json;
check('first invoice = INV-0001', r1.invoice_no === 'INV-0001', r1.invoice_no);
const r2 = run(nextInv, { 'Get all invoices': [{ id: 1, invoice_no: 'INV-0001' }, { id: 2, invoice_no: 'INV-0007' }], 'Form issue invoice': [{ client: 'c1', description: 'x', amount_sar: 150 }] })[0].json;
check('next after 7 = INV-0008', r2.invoice_no === 'INV-0008', r2.invoice_no);

const prep = codeOf('Prepare payment and entry');
const base = (form, inv, pays, led) => run(prep, { 'Form record payment': [form], 'Get the invoice': [inv], 'Get payments of invoice': pays, 'Get ledger': led })[0].json;
const inv = { id: 1, invoice_no: 'INV-0001', client: 'c1', amount_sar: 150, status: 'issued' };
const f = { invoice_no: 'INV-0001', date: '2026-09-27', amount_sar: 100, payment_method: 'bank_transfer', bank_ref: 'TRX1', revenue_account: '4200' };

let o = base(f, inv, [{}], [{}]);
check('bank partial valid', o.valid === true && o.willBePaid === false);
check('JE-0001 two balanced lines', o.lines.length === 2 && o.lines[0].entry_no === 'JE-0001' && o.lines[0].account_code === '1110' && o.lines[1].account_code === '4200' && o.lines[0].debit_sar === 100 && o.lines[1].credit_sar === 100);
o = base({ ...f, amount_sar: 50, payment_method: 'cash', bank_ref: '' }, inv, [{ id: 1, amount_sar: 100, payment_method: 'bank_transfer', bank_ref: 'TRX1', date: '2026-09-27' }], [{ id: 1, entry_no: 'JE-0001' }, { id: 2, entry_no: 'JE-0001' }]);
check('cash completes -> paid, CASH ref, 1100, JE-0002', o.valid && o.willBePaid && o.payment.bank_ref === 'CASH-INV-0001-1' && o.lines[0].account_code === '1100' && o.lines[0].entry_no === 'JE-0002', o.payment && o.payment.bank_ref);
o = base(f, {}, [{}], [{}]);
check('no invoice -> invalid', o.valid === false, o.text);
o = base(f, { ...inv, status: 'void' }, [{}], [{}]);
check('void -> invalid', o.valid === false);
o = base({ ...f, payment_method: 'other' }, inv, [{}], [{}]);
check('other method -> invalid', o.valid === false);
o = base(f, inv, [{ id: 1, amount_sar: 100, payment_method: 'bank_transfer', bank_ref: 'TRX1', date: '2026-09-27T00:00:00.000Z' }], [{}]);
check('duplicate ref+date -> invalid', o.valid === false, o.text);
o = base({ ...f, bank_ref: '' }, inv, [{}], [{}]);
check('bank without ref -> invalid', o.valid === false);
o = base({ ...f, revenue_account: '4100' }, inv, [{}], [{}]);
check('4100 revenue line', o.lines[1].account_code === '4100');
o = base({ ...f, amount_sar: 200 }, inv, [{}], [{}]);
check('overpay -> invalid', o.valid === false, o.text);

// Race: two cash payments of 100 approved at the same time on a 150 invoice.
const recheck = codeOf('Recheck after approval');
const re = (form, inv2, pays, led) => run(recheck, { 'Form record payment': [form], 'Re-read invoice': [inv2], 'Re-read payments': pays, 'Re-read ledger': led })[0].json;
const cashF = { ...f, amount_sar: 100, payment_method: 'cash', bank_ref: '' };
const first = re(cashF, inv, [{}], [{}]);
check('race: first recheck valid JE-0001', first.valid && first.lines[0].entry_no === 'JE-0001' && first.payment.bank_ref === 'CASH-INV-0001-1');
const second = re(cashF, inv, [{ id: 1, amount_sar: 100, payment_method: 'cash', bank_ref: 'CASH-INV-0001-1', date: '2026-09-27' }], [{ id: 1, entry_no: 'JE-0001' }, { id: 2, entry_no: 'JE-0001' }]);
check('race: second sees first -> overpay rejected', second.valid === false, second.text);
const secondSmall = re({ ...cashF, amount_sar: 50 }, inv, [{ id: 1, amount_sar: 100, payment_method: 'cash', bank_ref: 'CASH-INV-0001-1', date: '2026-09-27' }], [{ id: 1, entry_no: 'JE-0001' }, { id: 2, entry_no: 'JE-0001' }]);
check('race: second (50) gets JE-0002, CASH-2, paid', secondSmall.valid && secondSmall.lines[0].entry_no === 'JE-0002' && secondSmall.payment.bank_ref === 'CASH-INV-0001-2' && secondSmall.willBePaid === true);
process.exit(fail ? 1 : 0);
