const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [n,u] of [['home','/'],['restaurants','/restaurants/'],['hosts','/hosts/']])for(const w of [390,1440]){
const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:8841'+u,{waitUntil:'networkidle'});
const H=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<H;y+=400){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60)}
await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(500);
const m=await p.evaluate(()=>{const f=s=>{const e=document.querySelector(s);return e?parseFloat(getComputedStyle(e).fontSize):null};return {h1:f('h1'),h2:f('main h2'),H:document.body.scrollHeight}});
console.log(n,w,JSON.stringify(m));await p.screenshot({path:`art/final/${n}-${w}.png`,fullPage:true});await p.close()}
await b.close()})();
