// GM-067 «زي الباقات»: فحص قسم النظافة على 390 و1440 (مع تقليل الحركة وبدونه)، وتجربة تعبئة السعر من config.js
const { chromium } = require('playwright');
const BASE = 'http://localhost:' + (process.argv[2] || 8850);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});let fail=0;
for (const rm of ['no-preference','reduce']) for (const [w,h] of [[390,900],[1440,900]]){
const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:rm});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await pg.goto(BASE+'/hosts/?v=cl'+w+rm,{waitUntil:'networkidle'});
const H=await pg.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=400){await pg.evaluate(y=>scrollTo(0,y),y);await pg.waitForTimeout(30);}
await pg.evaluate(()=>document.querySelector('.p-clean').scrollIntoView());await pg.waitForTimeout(900);
const r=await pg.evaluate(()=>{const c=document.querySelector('.p-clean'),row=document.querySelector('.p-plan-row'),dont=document.querySelector('.p-dont');
 const cards=[...c.querySelectorAll('.s-plan')];const cr=c.getBoundingClientRect();
 return {order: row.getBoundingClientRect().bottom<=cr.top && cr.bottom<=dont.getBoundingClientRect().top,
  cards: cards.length, soon: cards.every(k=>k.querySelector('[data-clean-price]').textContent.trim()==='السعر قريباً'),
  noDigits: !/[0-9٠-٩]/.test(c.innerText), noBanned: !/فريقنا|ساعة|ساعتين|دقيقة/.test(c.innerText),
  badgeNotBelow: (k=>{const a=k.querySelector('.p-clean-h').getBoundingClientRect(),s=k.querySelector('.s-badge').getBoundingClientRect();return s.bottom<=a.top+1})(c),
  wa: cards.every(k=>{const a=k.querySelector('[data-wa="hostCleaning"]');return !a.hidden && decodeURIComponent(a.href).includes('أبغى نظافة بعد الخروج لوحداتي')}),
  tgSecond: cards.every(k=>{const t=k.querySelector('[data-tg-link]'),a=k.querySelector('[data-wa="hostCleaning"]');return t && !t.closest('[data-tg]').hidden && t.getBoundingClientRect().top>a.getBoundingClientRect().bottom}),
  hscroll: document.documentElement.scrollWidth>document.documentElement.clientWidth}});
const ok=r.order&&r.cards===2&&r.soon&&r.noDigits&&r.noBanned&&r.badgeNotBelow&&r.wa&&r.tgSecond&&!r.hscroll&&!errs.length; if(!ok) fail++;
console.log(ok?'PASS':'FAIL',rm,w,JSON.stringify(r),errs);
if(rm==='no-preference') await (await pg.$('.p-clean')).screenshot({path:__dirname+`/card-${w}.png`});
await ctx.close();}
// تعبئة السعر: config.js بقيمة تجريبية (في المتصفح بس) تبدّل «السعر قريباً»
const pg=await b.newPage();await pg.route('**/config.js*',async r=>{const res=await r.fetch();r.fulfill({response:res,body:(await res.text()).replace('cleaningPrices: { studio: "", twoThree: "" }','cleaningPrices: { studio: "X ريال", twoThree: "" }')});});
await pg.goto(BASE+'/hosts/?v=fill',{waitUntil:'networkidle'});
const f=await pg.evaluate(()=>[...document.querySelectorAll('[data-clean-price]')].map(e=>e.textContent.trim()));
const fok=f[0]==='X ريال'&&f[1]==='السعر قريباً';if(!fok)fail++;console.log(fok?'PASS':'FAIL','config fill',f);
await b.close();process.exit(fail?1:0);})();
