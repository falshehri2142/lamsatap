const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const p of ['','restaurants/','hosts/'])for(const w of [320,390,1024,1440]){const pg=await b.newPage({viewport:{width:w,height:800}});await pg.goto('http://localhost:8802/'+p);
const h=await pg.evaluate(()=>document.body.scrollHeight);for(let y=0;y<h;y+=600){await pg.evaluate(y=>scrollTo(0,y),y);await pg.waitForTimeout(80)}
const r=await pg.evaluate(()=>({h:document.body.scrollHeight,ox:document.documentElement.scrollWidth>innerWidth,secs:document.querySelectorAll('main section').length,ctas:[...document.querySelectorAll('a[data-wa],a[href*="#"]')].slice(0,6).map(a=>a.textContent.trim().slice(0,30))}));
console.log(p||'home',w,JSON.stringify(r));if(w==390)await pg.screenshot({path:`${process.argv[2]}/${(p||'home').replace('/','')}-${w}.png`,fullPage:true});await pg.close()}await b.close()})()
