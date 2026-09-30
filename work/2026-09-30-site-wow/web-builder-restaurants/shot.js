const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const w of [320,390,1024,1440]){const p=await b.newPage({viewport:{width:w,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8812/restaurants/',{waitUntil:'networkidle'});
for(let y=0;y<12000;y+=600){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(80);}
await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(400);
const m=await p.evaluate(()=>({h1:getComputedStyle(document.querySelector('h1')).fontSize,h2:getComputedStyle(document.querySelector('#demo-h')).fontSize,price:getComputedStyle(document.querySelector('.s-price-fig')).fontSize,H:document.documentElement.scrollHeight,ox:document.documentElement.scrollWidth-innerWidth}));
console.log(w,JSON.stringify(m),errs);
if(w==390||w==1440)await p.screenshot({path:__dirname+'/r-'+w+'.png',fullPage:true});}
await b.close();})();
