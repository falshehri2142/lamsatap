const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pages=['/','/restaurants/','/hosts/','/demo/menu/','/demo/review/','/demo/wifi/','/demo/rental-guide/'];
for(const rm of ['no-preference','reduce'])for(const w of [320,390,1440])for(const u of pages){
const p=await b.newPage({viewport:{width:w,height:844},reducedMotion:rm});const errs=[];
p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8821'+u,{waitUntil:'networkidle'});
const H=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=600){await p.mouse.wheel(0,600);await p.waitForTimeout(60);}
await p.waitForTimeout(400);
const r=await p.evaluate(()=>({sx:document.documentElement.scrollWidth-innerWidth,h:document.body.scrollHeight,tl:document.querySelector('[data-tl-stage]')?.dataset.state}));
if(w!==320&&rm==='no-preference'&&u.length<12){await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);await p.screenshot({path:`work/2026-09-30-site-wow/motion/${u.replace(/\//g,'_')}${w}.png`,fullPage:true});}
console.log(rm,w,u,JSON.stringify(r),errs.join('|'));await p.close();}
await b.close();})();
