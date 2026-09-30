const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const tag=process.argv[2]||'a';
for(const w of [320,390,1024,1440]){const p=await b.newPage({viewport:{width:w,height:w<800?844:900}});const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8811/index.html',{waitUntil:'networkidle'});
for(let y=0;y<6000;y+=400){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(120);} await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(800);
const m=await p.evaluate(()=>{const f=s=>{const e=document.querySelector(s);return e?getComputedStyle(e).fontSize:null};return {h1:f('h1'),h2:f('#doors-h'),tl:f('#tl-title'),fig:f('.s-step-n'),H:document.documentElement.scrollHeight,ox:document.documentElement.scrollWidth-innerWidth,state:(document.querySelector('[data-tl-stage]')||{}).dataset?.state}});
console.log(w,JSON.stringify(m),errs);
if(w==390||w==1440)await p.screenshot({path:`${tag}-${w}.png`,fullPage:true});await p.close();}
await b.close();})();
