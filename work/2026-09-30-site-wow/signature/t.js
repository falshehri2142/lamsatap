const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h] of [[390,844],[1440,900],[320,700]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('console',m=>m.type()==='error'&&errs.push(m.text()));p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8814/_sig-test.html');await p.waitForTimeout(2500);
await p.focus('#tl-tab-menu');await p.keyboard.press('ArrowLeft');await p.waitForTimeout(1800);
const r=await p.evaluate(()=>({sel:document.activeElement.id,src:document.querySelector('[data-tl-frame]').getAttribute('src'),st:document.querySelector('[data-tl-stage]').dataset.state,ld:document.querySelector('[data-tl-stage]').hasAttribute('data-loaded'),hs:document.documentElement.scrollWidth>innerWidth,cap:document.querySelector('[data-tl-caption]').textContent}));
console.log(w,JSON.stringify(r),errs);await p.screenshot({path:__dirname+'/sig-'+w+'.png',fullPage:true});}
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto('http://localhost:8814/_sig-test.html');await p.waitForTimeout(1500);console.log('rm',await p.evaluate(()=>document.querySelector('[data-tl-stage]').dataset.state));
await b.close()})();
