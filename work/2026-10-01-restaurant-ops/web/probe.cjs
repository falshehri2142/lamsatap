// فحص ديمو إدارة المطعم: صفحتين، 390 و1280، السيناريو الكامل.
let errsG = [];
const { chromium } = require('playwright');
const OUT = process.argv[2];
const BASE = 'http://127.0.0.1:8861/demo/order/';
const log = [];
const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ locale: 'ar-SA' });
  const ext = [], errs = []; errsG = errs;
  ctx.on('request', r => { const u = r.url(); if (!u.startsWith('http://127.0.0.1:8861/') && !u.startsWith('data:')) ext.push(u); });
  const cust = await ctx.newPage(), staff = await ctx.newPage();
  for (const p of [cust, staff]) {
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push(String(e)));
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  }
  await cust.setViewportSize({ width: 390, height: 844 });
  await staff.setViewportSize({ width: 1280, height: 800 });
  await cust.goto(BASE);
  await cust.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await cust.reload(); await staff.goto(BASE + 'staff/');
  await cust.waitForTimeout(400);

  const overflow = async (p) => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const smallTargets = async (p) => p.evaluate(() => [...document.querySelectorAll('button, a, summary, [role=tab]')].filter(e => {
    const r = e.getBoundingClientRect(); if (!r.width || e.closest('[hidden]') || getComputedStyle(e).visibility === 'hidden') return false;
    if (e.closest('p') && e.tagName === 'A' && e.classList.contains('lt-link')) return r.height < 44 && false;
    return r.height < 44 || r.width < 44;
  }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + ' ' + e.textContent.trim().slice(0, 20)));

  await staff.click('#k-sound');
  ok(await staff.getAttribute('#k-sound', 'aria-pressed') === 'true', 'sound toggle on after click');
  await staff.focus('#k-tab-orders');
  await cust.screenshot({ path: OUT + '/01-customer-menu-390.png' });
  await cust.screenshot({ path: OUT + '/01b-customer-menu-390-full.png', fullPage: true });
  ok(await overflow(cust) <= 0, 'customer 390 no horizontal overflow');
  const st = await smallTargets(cust); ok(st.length === 0, 'customer 390 tap targets >=44: ' + st.join(' | '));

  // إضافة لاتيه ×2 مع ملاحظة
  await cust.click('.o-item:has-text("لاتيه") >> nth=0');
  await cust.waitForSelector('#o-item[open]');
  await cust.click('#o-item-plus');
  await cust.fill('#o-item-note', 'بدون سكر');
  await cust.waitForTimeout(400);
  await cust.screenshot({ path: OUT + '/02-customer-item-sheet-390.png' });
  await cust.click('#o-item-add');
  await cust.click('.o-item:has-text("كيكة التمر")');
  await cust.click('#o-item-add');
  const bar = await cust.textContent('#o-cart-btn');
  ok(/3/.test(bar) && /56/.test(bar), 'bar shows count and total: ' + bar);
  await cust.waitForTimeout(500);
  await cust.screenshot({ path: OUT + '/03-customer-bar-toast-390.png' });
  await cust.click('#o-cart-btn');
  await cust.waitForTimeout(400);
  await cust.mouse.move(1, 1); await cust.waitForTimeout(200); await cust.screenshot({ path: OUT + '/04-customer-cart-390.png' });
  ok(await cust.isVisible('text=أرسل الطلب للمطبخ الآن') && await cust.isVisible('text=خلّ النادل يجي ياخذ طلبي'), 'cart has two choices');
  const st2 = await smallTargets(cust); ok(st2.length === 0, 'cart tap targets >=44: ' + st2.join(' | '));
  await cust.click('#o-send');
  await cust.waitForSelector('#o-status:not([hidden])');
  await cust.screenshot({ path: OUT + '/05-customer-status-new-390.png' });

  // شاشة الموظف
  await staff.waitForSelector('.k-order:has-text("طاولة 7")', { timeout: 3000 });
  ok(true, 'order reached staff screen');
  ok(await staff.isVisible('.k-order:has-text("بدون سكر")'), 'note visible on staff card');
  ok(await staff.isVisible('#k-alert.is-on'), 'visual alert shown on new order');
  await staff.screenshot({ path: OUT + '/06-staff-new-order-1280.png' });
  ok(await overflow(staff) <= 0, 'staff 1280 no horizontal overflow');
  await staff.click('.k-order:has-text("طاولة 7") >> text=استلمت');
  await cust.waitForTimeout(300);
  ok((await cust.textContent('#o-status')).includes('طلبك يتحضر'), 'customer sees preparing');
  await staff.click('.k-order:has-text("طاولة 7") >> text=جاهز');
  await cust.waitForTimeout(300);
  ok((await cust.textContent('#o-status')).includes('طلبك جاهز'), 'customer sees ready');
  await cust.screenshot({ path: OUT + '/07-customer-status-ready-390.png' });
  await staff.screenshot({ path: OUT + '/08-staff-ready-1280.png' });

  // استدعاء النادل
  await cust.click('#o-back');
  await cust.click('#o-call-btn');
  await cust.waitForSelector('#o-call[open]');
  await cust.mouse.move(1, 1);
  await cust.waitForTimeout(500);
  await cust.screenshot({ path: OUT + '/09-customer-call-sheet-390.png' });
  await cust.click('.o-reason[data-reason="bill"]');
  await cust.waitForTimeout(300);
  ok(await cust.isVisible('text=النادل جاي لطاولة 7'), 'call confirmation shown');
  await cust.screenshot({ path: OUT + '/10-customer-call-done-390.png' });
  await staff.waitForSelector('.k-call:has-text("الحساب")', { timeout: 3000 });
  ok(true, 'call reached staff');
  await staff.mouse.move(640, 790); await staff.screenshot({ path: OUT + '/11-staff-call-1280.png' });
  await cust.click('#o-call-done [data-close]');
  await cust.click('#o-call-btn'); await cust.click('.o-reason[data-reason="bill"]'); await cust.click('#o-call-done [data-close]');
  await staff.waitForTimeout(300);
  ok(await staff.isVisible('.k-call:has-text("×2")') && await staff.locator('.k-call').count() === 1, 'repeat call merges as ×2');

  // خلص صنف
  await staff.click('.k-item:has-text("كيكة التمر") .k-toggle');
  await cust.waitForTimeout(300);
  ok(await cust.isHidden('.o-item:has-text("كيكة التمر")'), 'sold-out item hidden for customer');
  await staff.click('.k-call:has-text("الحساب") >> text=رحت له');
  await cust.waitForTimeout(300);
  ok((await cust.textContent('#o-toast')).includes('النادل شاف'), 'customer told waiter acked');
  await staff.click('.k-order:has-text("طاولة 7") >> text=انسلّم');
  const resp = await staff.textContent('#k-s-resp');
  ok(resp !== '—', 'avg response computed: ' + resp);
  await staff.screenshot({ path: OUT + '/12-staff-summary-1280.png' });
  await staff.screenshot({ path: OUT + '/12b-staff-summary-1280-full.png', fullPage: true });
  const st3 = await smallTargets(staff); ok(st3.length === 0, 'staff 1280 tap targets: ' + st3.join(' | '));

  // «خلّ النادل ياخذ طلبي»
  await cust.click('.o-item:has-text("أمريكانو")'); await cust.click('#o-item-add');
  await cust.click('#o-cart-btn'); await cust.click('#o-waiter-take');
  await staff.waitForSelector('.k-call:has-text("ياخذ الطلب")', { timeout: 3000 });
  ok(await staff.isVisible('.k-call:has-text("أمريكانو")'), 'take-order call carries cart');
  await cust.click('#o-call-done [data-close]');

  // الموظف على 390
  await staff.setViewportSize({ width: 390, height: 844 });
  await staff.click('#k-fake-order');
  await staff.waitForTimeout(300);
  await staff.evaluate(() => scrollTo(0, 0));
  await staff.screenshot({ path: OUT + '/13-staff-orders-390.png' });
  ok(await overflow(staff) <= 0, 'staff 390 no horizontal overflow');
  await staff.focus('#k-tab-orders'); await staff.keyboard.press('ArrowLeft');
  ok(await staff.getAttribute('#k-tab-calls', 'aria-selected') === 'true', 'tab arrow key (RTL) moves to calls');
  await staff.click('#k-tab-calls');
  await staff.screenshot({ path: OUT + '/14-staff-calls-390.png' });
  await staff.click('#k-tab-items');
  await staff.screenshot({ path: OUT + '/15-staff-items-390.png' });
  const st4 = await smallTargets(staff); ok(st4.length === 0, 'staff 390 tap targets: ' + st4.join(' | '));

  // الزبون على 1280
  await cust.setViewportSize({ width: 1280, height: 800 });
  await cust.evaluate(() => scrollTo(0, 0));
  await cust.screenshot({ path: OUT + '/16-customer-menu-1280.png' });
  ok(await overflow(cust) <= 0, 'customer 1280 no horizontal overflow');
  await cust.click('#o-cart-btn'); await cust.waitForTimeout(400);
  await cust.screenshot({ path: OUT + '/17-customer-cart-1280.png' });
  await cust.keyboard.press('Escape');

  // 320
  await cust.setViewportSize({ width: 320, height: 640 });
  await cust.evaluate(() => scrollTo(0, 0));
  await cust.screenshot({ path: OUT + '/19-customer-menu-320.png' });
  ok(await overflow(cust) <= 0, 'customer 320 no horizontal overflow');
  // كافيه بدون نادل
  await cust.setViewportSize({ width: 390, height: 844 });
  await cust.goto(BASE + '?counter=1');
  ok(await cust.isHidden('#o-call-btn'), 'counter mode hides waiter button');
  await cust.click('.o-item:has-text("إسبريسو")'); await cust.click('#o-item-add');
  await cust.click('#o-cart-btn'); await cust.click('#o-send');
  await staff.click('#k-tab-orders');
  await staff.click('.k-order:has(.k-table:text-is("كاشير")) >> text=استلمت');
  await staff.click('.k-order:has(.k-table:text-is("كاشير")) >> text=جاهز');
  await cust.waitForTimeout(300);
  ok((await cust.textContent('.o-st-head')).includes('استلمه من الكاشير'), 'counter ready says pick up at cashier');
  await cust.screenshot({ path: OUT + '/18-customer-counter-ready-390.png' });

  // تقليل الحركة
  const rm = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const rp = await rm.newPage(); await rp.goto(BASE);
  await rp.click('#o-call-btn');
  const an = await rp.evaluate(() => getComputedStyle(document.getElementById('o-call')).animationName);
  ok(an === 'none', 'reduced motion: sheet animation none (' + an + ')');
  await rm.close();

  // file:// (بدون سيرفر)
  const fctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const f1 = await fctx.newPage(), f2 = await fctx.newPage();
  const root = 'file:///home/user/repo/website/demo/order/';
  await f1.goto(root + 'index.html'); await f1.evaluate(() => localStorage.clear()); await f1.reload();
  await f2.goto(root + 'staff/index.html');
  await f1.click('.o-item >> nth=0'); await f1.click('#o-item-add'); await f1.click('#o-cart-btn'); await f1.click('#o-send');
  let fileOk = true; try { await f2.waitForSelector('.k-order', { timeout: 3000 }); } catch (e) { fileOk = false; }
  ok(fileOk, 'file:// order reaches staff');
  await fctx.close();
  ok(ext.length === 0, 'no external requests ' + ext.join(','));
  ok(errs.length === 0, 'no console errors/4xx ' + errs.join(' | '));
  console.log(log.join('\n'));
  await browser.close();
})().catch(e => { console.log("ERRS", errsG.join(" | ")); console.log(log.join('\n')); console.error(e); process.exit(1); });
