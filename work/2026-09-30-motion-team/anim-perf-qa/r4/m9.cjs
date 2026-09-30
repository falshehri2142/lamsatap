const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME});
for(const rm of ['no-preference','reduce'])for(const [pg,sel] of [['/','main h2'],['/restaurants/','main h2'],['/hosts/','.p-calc'],['/hosts/','[data-story]'],['/hosts/','details']]){const p=await b.newPage({viewport:{width:1440,height:900}});await p.emulateMedia({reducedMotion:rm});await p.goto('http://localhost:8942'+pg,{waitUntil:'networkidle'});
const y=await p.evaluate(s=>{const e=document.querySelectorAll(s);const t=e[Math.floor(e.length/2)]||e[0];window.__t=t;let o=0,n=t;while(n){o+=n.offsetTop;n=n.offsetParent}return o-200},sel);
await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(1500);
const pos=()=>p.evaluate(()=>{let o=0,n=__t;while(n){o+=n.offsetTop;n=n.offsetParent}return Math.round(o-scrollY)});
const a=await pos();await p.setViewportSize({width:1200,height:900});await p.waitForTimeout(1200);const c=await pos();await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(1200);const d=await pos();
console.log(rm,pg,sel,'jump',c-a,d-c);await p.close()}await b.close()})()
