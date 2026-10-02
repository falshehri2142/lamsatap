// صور قسم «إدارة المطعم» (#ops) من الديمو الحي website/demo/order/، بدون PIL (التحويل لـ WebP بـ canvas داخل Chromium).
// التشغيل (من جذر المشروع، والسيرفر شغال على website/):
//   NODE_PATH=/tmp/claude-0/sp/node_modules node work/2026-10-01-restaurant-ops/site/ops-images.cjs <port>
// الناتج في website/assets/images/: ops-phone-order.webp (390×780) و ops-phone-call.webp (390×780، بدون شريط الديمو الأعلى 64px) و ops-staff.webp (960×600).
// الأهداف (ux.md §2): 35 KB للجوالين، و60 KB للتابلت. الجودة تنزل لين يدخل الملف في الهدف.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PORT = process.argv[2] || 8871, BASE = `http://127.0.0.1:${PORT}/demo/order/`;
const OUT = path.join(__dirname, '../../../website/assets/images');

async function toWebp(page, png, w, h, maxKB, sy = 0) {   // sy: يقص من فوق (شريط «عرض تجريبي» 64px في صفحة الزبون)
  const b64 = png.toString('base64');
  return page.evaluate(async ({ b64, w, h, maxKB, sy }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; if (sy) x.drawImage(img, 0, sy, w, h, 0, 0, w, h); else x.drawImage(img, 0, 0, w, h);
    let q = 0.92, url;
    for (; q >= 0.4; q -= 0.04) { url = c.toDataURL('image/webp', q); if (url.length * 0.75 / 1024 <= maxKB) break; }
    return { url, q: Math.round(q * 100) / 100 };
  }, { b64, w, h, maxKB, sy });
}
function save(name, r) {
  const buf = Buffer.from(r.url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(name, (buf.length / 1024).toFixed(1) + ' KB', 'q=' + r.q);
}

(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await br.newContext({ locale: 'ar-SA', reducedMotion: 'reduce' });
  const cust = await ctx.newPage(), staff = await ctx.newPage(), conv = await ctx.newPage();
  await cust.setViewportSize({ width: 390, height: 844 });
  await staff.setViewportSize({ width: 1280, height: 800 });
  await cust.goto(BASE); await cust.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await cust.reload(); await staff.goto(BASE + 'staff/'); await staff.click('#k-sound');
  await cust.waitForTimeout(400);

  // 1) السلة: لاتيه ×2 بدون سكر، وكيكة التمر
  await cust.click('.o-item:has-text("لاتيه") >> nth=0'); await cust.waitForSelector('#o-item[open]');
  await cust.click('#o-item-plus'); await cust.fill('#o-item-note', 'بدون سكر'); await cust.click('#o-item-add');
  await cust.click('.o-item:has-text("كيكة التمر")'); await cust.click('#o-item-add');
  await cust.waitForTimeout(300); await cust.click('#o-cart-btn'); await cust.waitForTimeout(500); await cust.mouse.move(1, 1);
  save('ops-phone-order.webp', await toWebp(conv, await cust.screenshot(), 390, 780, 35, 64));

  // 2) يرسل الطلب، ثم يفتح «استدعِ النادل»
  await cust.click('#o-send'); await cust.waitForSelector('#o-status:not([hidden])');
  await cust.click('#o-back'); await cust.click('#o-call-btn'); await cust.waitForSelector('#o-call[open]');
  await cust.mouse.move(1, 1); await cust.waitForTimeout(500);
  save('ops-phone-call.webp', await toWebp(conv, await cust.screenshot(), 390, 780, 35, 64));

  // 3) شاشة المطعم: الطلب (جديد، فيه «استلمت») والنداء «الحساب» في نفس الشاشة
  await cust.click('.o-reason[data-reason="bill"]');
  await staff.waitForSelector('.k-call:has-text("الحساب")', { timeout: 4000 });
  await staff.waitForSelector('.k-order:has-text("طاولة 7")');
  await staff.mouse.move(640, 790); await staff.waitForTimeout(300);
  save('ops-staff.webp', await toWebp(conv, await staff.screenshot(), 960, 600, 60));
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
