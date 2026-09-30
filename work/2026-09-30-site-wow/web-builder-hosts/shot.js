const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const tag=process.argv[2]||'r1';
for(const w of [320,375,390,768,1024,1440]){
 for(const rm of (w===390?['no-preference','reduce']:['no-preference'])){
 const p=await b.newPage({viewport:{width:w,height:w<768?800:900},reducedMotion:rm});const errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8813/hosts/',{waitUntil:'networkidle'});
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<H;y+=400){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60);}
 await p.waitForTimeout(600);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(400);
 const m=await p.evaluate(()=>{const f=s=>{const e=document.querySelector(s);return e?parseFloat(getComputedStyle(e).fontSize):null};
  return {h1:f('h1'),h2:f('#demo-h'),fig:f('.p-calc-fig'),sw:document.documentElement.scrollWidth,H:document.documentElement.scrollHeight,p1:document.querySelector('main p').getBoundingClientRect().height,wa:(document.querySelector('[data-calc-wa]')||{}).href}});
 // calc test
 if(w===390&&rm==='no-preference'){await p.click('[data-step="1"]');await p.click('[data-step="1"]');await p.click('label:has(input[value=y])');
   m.calc=await p.evaluate(()=>[document.querySelector('[data-units]').textContent,document.querySelector('[data-total]').textContent,decodeURIComponent(document.querySelector('[data-calc-wa]').href).slice(-60)]);}
 console.log(w,rm,JSON.stringify(m),errs);
 if([390,1440].includes(w)&&rm==='no-preference')await p.screenshot({path:`${tag}-${w}.png`,fullPage:true});
 await p.close();}}
await b.close();})();
