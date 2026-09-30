const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for (const rm of ['no-preference','reduce']) for (const [w,h] of [[390,900],[1440,900]]){
const ctx=await b.newContext({viewport:{width:w,height:h},reducedMotion:rm});const pg=await ctx.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await pg.goto('http://localhost:8850/hosts/?v=clean5',{waitUntil:'networkidle'});
const H=await pg.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=400){await pg.evaluate(y=>scrollTo(0,y),y);await pg.waitForTimeout(40);}
await pg.evaluate(()=>document.querySelector('.p-clean').scrollIntoView({block:'center'}));await pg.waitForTimeout(900);
const r=await pg.evaluate(()=>{const c=document.querySelector('.p-clean'),row=document.querySelector('.p-plan-row'),dont=document.querySelector('.p-dont');
 const cr=c.getBoundingClientRect(),h3=c.querySelector('h3').getBoundingClientRect(),bd=c.querySelector('.s-badge').getBoundingClientRect();
 const wa=c.querySelector('[data-wa="hostCleaning"]'),tg=c.querySelector('[data-tg-link]');
 return {order: row.getBoundingClientRect().bottom<=cr.top && cr.bottom<=dont.getBoundingClientRect().top,
  fullWidth: Math.round(cr.width)+'/'+Math.round(row.getBoundingClientRect().width),
  badgeSameLine: Math.abs((bd.top+bd.bottom)/2-(h3.top+h3.bottom)/2)<12,
  wa: !wa.hidden && decodeURIComponent(wa.href), waCls: wa.className, waH: Math.round(wa.getBoundingClientRect().height),
  tg: tg && !tg.closest('[data-tg]').hidden && tg.href, tgBelow: tg.getBoundingClientRect().top>wa.getBoundingClientRect().bottom,
  hscroll: document.documentElement.scrollWidth>document.documentElement.clientWidth,
  opacity: getComputedStyle(c).opacity}});
console.log(rm,w,JSON.stringify(r),errs);
if(rm==='no-preference') await (await pg.$('.p-clean')).screenshot({path:`/home/user/repo/work/2026-09-30-cleaning-card/card-${w}.png`});
await ctx.close();}
await b.close();})();
