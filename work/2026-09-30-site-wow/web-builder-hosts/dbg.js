const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:320,height:800}});
p.on('console',m=>console.log('C',m.text()));await p.goto('http://localhost:8813/hosts/',{waitUntil:'networkidle'});
console.log(await p.evaluate(()=>{const e=document.querySelector('main p');return [e.className,e.outerHTML.slice(0,200),document.querySelector('[data-calc-live]').hidden,[...document.scripts].map(s=>s.src).join(' ')]}));await b.close()})();
