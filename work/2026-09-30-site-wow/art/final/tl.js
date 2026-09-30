const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto('http://localhost:8841/');
await p.locator('#tap-lab').scrollIntoViewIfNeeded();await p.waitForTimeout(2500);
console.log(w,await p.evaluate(()=>{const s=document.querySelector('[data-tl-stand]');const r=s.getBoundingClientRect();const cs=getComputedStyle(s);return [s.innerHTML.length,r.x|0,r.y|0,r.width|0,r.height|0,cs.opacity,cs.display, document.querySelector('[data-tl-stage]').dataset.state]}));
await p.locator('#tap-lab').screenshot({path:`art/final/tl-${w}.png`});}
await b.close()})();
