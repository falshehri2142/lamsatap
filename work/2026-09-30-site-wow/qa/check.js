// QA gate: NODE_PATH=/tmp/claude-0/sp/node_modules node check.js [port]
// GM-070 (2026-10-01): English company pages at the root, Arabic in /ar/. Each page has its expected lang/dir; the language switch,
// hreflang and «no Arabic outside the Arabic islands» on English pages are checked too. LT_ROOT=<project root> runs it on a copy.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const PORT=process.argv[2]||8831,B=`http://localhost:${PORT}`;const ROOT=process.env.LT_ROOT||path.join(__dirname,'../../..');const WEB=path.join(ROOT,'website');
const EN=['/','/restaurants/','/hosts/'],AR=['/ar/','/ar/restaurants/','/ar/hosts/'];
const PAGES=[...EN,...AR,'/404.html','/demo/menu/','/demo/review/','/demo/wifi/','/demo/links/','/demo/rental-guide/','/demo/door/'];
const CO=[...EN,...AR];const W=[320,375,390,768,1024,1440];
const LANG=u=>(EN.includes(u)||u==='/404.html')?'en':'ar';const TWIN={'/':'/ar/','/restaurants/':'/ar/restaurants/','/hosts/':'/ar/hosts/','/ar/':'/','/ar/restaurants/':'/restaurants/','/ar/hosts/':'/hosts/'};
const SH=path.join(__dirname,'shots');fs.mkdirSync(SH,{recursive:true});
const R=[];const add=(c,ok,d)=>{R.push({c,ok,d});};
const linkCache={};
async function scrollAll(p){const h=await p.evaluate(()=>document.body.scrollHeight).catch(()=>8000);for(let y=0;y<h;y+=400){await p.mouse.wheel(0,400);await p.waitForTimeout(40);}await p.mouse.wheel(0,-h-1000);await p.waitForTimeout(300);}
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const u of PAGES)for(const w of W){const ctx=await br.newContext({viewport:{width:w,height:800}});const p=await ctx.newPage();const errs=[];
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(B))errs.push(r.status()+' '+r.url())});
await p.goto(B+u,{waitUntil:'networkidle'});await scrollAll(p);
const k=`${u} @${w}`;const info=await p.evaluate(()=>{const d=document.documentElement;
const small=[...document.querySelectorAll('a,button,input,select,textarea,[role=tab],[role=button]')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden')return false;
 if(e.tagName==='A'&&cs.display==='inline'&&e.parentElement&&/^(P|LI|SPAN|SMALL|TD|DD|FIGCAPTION)$/.test(e.parentElement.tagName)&&e.parentElement.textContent.trim().length>e.textContent.trim().length+5)return false;
 if(e.closest('[aria-hidden=true]'))return false; return r.width<44||r.height<44}).map(e=>`${e.tagName.toLowerCase()}.${(e.className+'').split(' ')[0]} "${(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,20)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
 const ls=[...document.querySelectorAll('body *')].filter(e=>{const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return /[؀-ۿ]/.test(t)&&e.getClientRects().length&&parseFloat(getComputedStyle(e).letterSpacing||0)!==0&&getComputedStyle(e).letterSpacing!=='normal'}).map(e=>e.tagName+'.'+e.className+' '+getComputedStyle(e).letterSpacing);
 // English pages: Arabic text only inside [lang=ar] islands (guest mockups, the «عربي» switch)
 const arOut=d.lang==='en'?[...document.querySelectorAll('body *')].filter(e=>{const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return /[؀-ۿ]/.test(t)&&!e.closest('[lang=ar]')&&e.getClientRects().length}).map(e=>e.tagName+'.'+e.className+' '+e.textContent.trim().slice(0,30)):[];
 const sw=document.querySelector('.s-lang');let lang=null;if(sw){const r=sw.getBoundingClientRect(),cs=getComputedStyle(sw),top=sw.closest('.s-top');lang={w:Math.round(r.width),h:Math.round(r.height),inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,vis:cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.9,sticky:!!top&&getComputedStyle(top).position==='sticky',text:sw.textContent.trim(),lang:sw.getAttribute('lang'),hl:sw.getAttribute('hreflang'),href:sw.href,border:cs.borderTopWidth}}
 const alt=[...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l=>l.hreflang+'='+new URL(l.href).pathname).sort().join(' '),canon=(document.querySelector('link[rel=canonical]')||{}).href||'';
 return{sw:d.scrollWidth,cw:d.clientWidth,small,ls,arOut,lang,alt,canon,dir:d.dir,lang_:d.lang,h1:document.querySelectorAll('h1').length,title:!!document.title.trim(),desc:!!document.querySelector('meta[name=description]')?.content||/noindex/.test(document.querySelector('meta[name=robots]')?.content||''),
 noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.src),
 links:[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin))}});
add(`${k} console/network`,errs.length===0,errs.join(' | '));
add(`${k} no h-scroll`,info.sw<=info.cw,`${info.sw}/${info.cw}`);
add(`${k} tap>=44`,info.small.length===0,info.small.join('; '));
add(`${k} arabic letter-spacing 0`,info.ls.length===0,info.ls.join('; '));
if(LANG(u)==='en')add(`${k} no Arabic outside [lang=ar]`,info.arOut.length===0,info.arOut.join('; '));
if(CO.includes(u)){const L=info.lang,en=LANG(u)==='en';
 add(`${k} language switch visible`,!!L&&L.vis&&L.inView&&L.sticky&&L.h>=44&&L.w>=44&&L.border!=='0px'&&L.text===(en?'عربي':'English')&&L.lang===(en?'ar':'en')&&L.hl===(en?'ar':'en')&&new URL(L.href).pathname.replace(/index\.html$/,'')===TWIN[u],JSON.stringify(L));}
if(w===390){const want=LANG(u)==='en'?['ltr','en']:['rtl','ar'];add(`${u} ${want[0]}/${want[1]}/h1/meta`,info.dir===want[0]&&info.lang_.startsWith(want[1])&&info.h1===1&&info.title&&info.desc,JSON.stringify({dir:info.dir,lang:info.lang_,h1:info.h1,title:info.title,desc:info.desc}));
 if(CO.includes(u)){const en=EN.includes(u)?u:TWIN[u],ar=AR.includes(u)?u:TWIN[u];add(`${u} hreflang+canonical`,info.alt===`ar=${ar} en=${en} x-default=${en}`&&new URL(info.canon||B).pathname===u,info.alt+' | '+info.canon);}
 add(`${u} img alt`,info.noalt.length===0,info.noalt.join(' '));
 const bad=[];for(const l of new Set(info.links.map(x=>x.split('#')[0]))){if(!(l in linkCache)){const r=await p.request.get(l).catch(()=>null);linkCache[l]=r?r.status():0;}if(linkCache[l]>=400||!linkCache[l])bad.push(l+' '+linkCache[l]);}
 add(`${u} links resolve`,bad.length===0,bad.join(' '));}
await p.screenshot({path:path.join(SH,`${(u.replace(/\//g,'_')||'_')}-${w}.png`),fullPage:true});await ctx.close();}
// reduced motion + no JS
for(const mode of ['reduce','nojs'])for(const u of CO)for(const w of [390,1440]){const ctx=await br.newContext({viewport:{width:w,height:800},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='nojs'});const p=await ctx.newPage();
await p.goto(B+u,{waitUntil:'networkidle'});await scrollAll(p);
const v=await p.evaluate(()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect();let o=1;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden')return false;o*=parseFloat(cs.opacity)}return r.width>0&&o>0.5};
 const h=[...document.querySelectorAll('h1,h2')];const hid=h.filter(e=>!vis(e)&&!e.closest('[hidden],.sr-only,.visually-hidden')).map(e=>e.textContent.trim().slice(0,30));
 const cta=[...document.querySelectorAll('main a.lt-btn, main a[class*=btn], main h1 ~ * a')].find(e=>!e.hidden&&vis(e));return{hid,cta:vis(cta),ctaT:cta&&cta.textContent.trim().slice(0,30),sw:vis(document.querySelector('.s-lang'))}});
add(`${mode} ${u} @${w} headings+CTA+switch visible`,v.hid.length===0&&v.cta&&v.sw,JSON.stringify(v));
if(w===390)await p.screenshot({path:path.join(SH,`${mode}${u.replace(/\//g,'_')}-${w}.png`),fullPage:true});await ctx.close();}
// signature (Tap Lab): the English home is LTR (ArrowRight = next), the Arabic home RTL (ArrowLeft = next)
for(const home of ['/','/ar/'])for(const rm of ['no-preference','reduce']){const ctx=await br.newContext({viewport:{width:1440,height:900},reducedMotion:rm});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(B+home,{waitUntil:'networkidle'});await p.locator('#tap-lab').scrollIntoViewIfNeeded();
const st=()=>p.getAttribute('[data-tl-stage]','data-state');await p.waitForFunction(()=>document.querySelector('[data-tl-stage]').dataset.state==='open',null,{timeout:6000}).catch(()=>{});
const log=[`init:${await st()}`];let ok=(await st())==='open';
for(const o of ['review','wifi','guide','menu']){await p.click(`[data-tl-opt=${o}]`);const src=await p.getAttribute(`[data-tl-opt=${o}]`,'data-tl-src');
 const r=await p.waitForFunction(s=>{const f=document.querySelector('[data-tl-frame]');const st=document.querySelector('[data-tl-stage]').dataset.state;return st==='open'&&f.getAttribute('src').includes(s)},src,{timeout:6000}).then(()=>1).catch(()=>0);
 const sel=await p.getAttribute(`[data-tl-opt=${o}]`,'aria-selected');const href=await p.getAttribute('[data-tl-open]','href');const cap=await p.textContent('[data-tl-caption]');const capOk=home==='/'?!/[؀-ۿ]/.test(cap)&&cap.trim().length>0:/[؀-ۿ]/.test(cap);
 ok=ok&&r&&sel==='true'&&href===src&&capOk;log.push(`${o}:${r?'open':'FAIL'} sel=${sel} href=${href} cap=${capOk?'ok':'BAD:'+cap}`);}
const next=home==='/'?'ArrowRight':'ArrowLeft';
await p.focus('[data-tl-opt=menu]');await p.keyboard.press(next);let f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k1=f==='review';
await p.keyboard.press('End');f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k2=f==='guide';
await p.keyboard.press('Home');f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k3=f==='menu';
const tabbable=await p.$$eval('[data-tl-opt]',a=>a.filter(e=>e.tabIndex===0).length);
add(`signature ${home} (${rm}) clicks`,ok&&!errs.length,log.join(', ')+' '+errs.join('|'));
add(`signature ${home} (${rm}) keyboard`,k1&&k2&&k3&&tabbable===1,`${next}->review:${k1} End->guide:${k2} Home->menu:${k3} tabbable=${tabbable}`);await ctx.close();}
// English WhatsApp texts and host calculator (config.js waText <key>En, assets/hosts-smart.js)
try{const ctx=await br.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();const out=[];let ok=true;
 for(const [u,keys] of [['/',['home']],['/restaurants/',['shop','shopTrial','reviewAny']],['/hosts/',['host','hostTrial','hostCleaning','stayEntry','hostStart','stayFull']],['/ar/hosts/',['host','hostTrial']]]){
  await p.goto(B+u,{waitUntil:'networkidle'});
  for(const key of keys){const t=await p.$eval(`[data-wa="${key}"]`,a=>{try{return new URL(a.href).searchParams.get('text')||''}catch(e){return ''}}).catch(()=>'');const en=EN.includes(u);const good=en?/^Hi, /.test(t)&&!/[؀-ۿ]/.test(t):/^السلام عليكم/.test(t);ok=ok&&good;out.push(`${u}${key}:${good?'ok':'BAD '+t.slice(0,40)}`);}
 }
 await p.goto(B+'/hosts/',{waitUntil:'networkidle'});const step=s=>p.locator(s).dispatchEvent('click');await step('[data-step="1"]');await step('[data-step="1"]');await p.locator('input[name=bill][value=y]').check({force:true});
 const c=await p.evaluate(()=>({n:document.querySelector('[data-units]').textContent,w:document.querySelector('.p-calc-n span').textContent,t:document.querySelector('[data-total]').textContent,per:document.querySelector('[data-per]').textContent,rate:document.querySelector('[data-rate]').textContent,note:document.querySelector('[data-tier-note]').textContent,wa:new URL(document.querySelector('[data-calc-wa]').href).searchParams.get('text')}));
 const cOk=c.n==='5'&&c.w==='units'&&c.t==='2,172.50'&&c.per==='/ year'&&c.rate==='434.50'&&/5\+ unit rate/.test(c.note)&&/I have 5 units, billed yearly\.$/.test(c.wa);ok=ok&&cOk;out.push('calc:'+(cOk?'ok':'BAD '+JSON.stringify(c)));
 await p.goto(B+'/ar/hosts/',{waitUntil:'networkidle'});await step('[data-step="-1"]');
 const a=await p.evaluate(()=>({n:document.querySelector('[data-units]').textContent,w:document.querySelector('.p-calc-n span').textContent,t:document.querySelector('[data-total]').textContent,wa:new URL(document.querySelector('[data-calc-wa]').href).searchParams.get('text')}));
 const aOk=a.n==='2'&&a.w==='وحدتين'&&a.t==='99'&&/عندي وحدتين، والدفع شهري\.$/.test(a.wa);ok=ok&&aOk;out.push('calc-ar:'+(aOk?'ok':'BAD '+JSON.stringify(a)));
 add('English WhatsApp texts + calculator (Arabic unchanged)',ok,out.join(', '));await ctx.close();}catch(e){add('English WhatsApp texts + calculator (Arabic unchanged)',false,String(e.message||e).split('\n')[0]);}
await br.close();
// static: transition all, prices
const css=fs.readdirSync(path.join(WEB,'assets')).filter(f=>f.endsWith('.css'));const ta=css.filter(f=>/transition\s*:\s*all\b|transition-property\s*:\s*all/.test(fs.readFileSync(path.join(WEB,'assets',f),'utf8')));
add('no transition: all in assets/*.css',ta.length===0,ta.join(' '));
const allowed=['1,211','1211','798','49.5','544.5','39.5','434.5','49.50','544.50','39.50','434.50','25','40','60','30','15','100','65','400'];
const pr=[];for(const u of ['index.html','restaurants/index.html','hosts/index.html','ar/index.html','ar/restaurants/index.html','ar/hosts/index.html']){const t=fs.readFileSync(path.join(WEB,u),'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<foreignObject[\s\S]*?<\/foreignObject>/g,'').replace(/data-total>[\d.,]+/g,'').replace(/<\/?(p|li|td|th|tr|label|small|legend|div|h[1-6]|ul|ol|button|figcaption|summary|article|section)\b[^>]*>/g,' | ').replace(/<[^>]+>/g,' ');
 // a block boundary (|) stops a match, so «price of 11» never pairs with the «SAR» of the next block
 for(const m of t.matchAll(/([\d.,٠-٩]+)\s*(ريال|ر\.س|SAR)|SAR\s*([\d.,]+)/g)){const n=(m[1]||m[3]).replace(/[.,]$/,'');if(!allowed.includes(n))pr.push(u+': '+m[0]);}}
add('prices match services/pricing.md',pr.length===0,pr.join('; '));
let out='';try{out=require('child_process').execSync('node tools/build-dist.cjs',{cwd:ROOT,encoding:'utf8',stdio:'pipe'});add('build-dist.cjs',true,out.trim().split('\n').slice(-3).join(' / '))}catch(e){add('build-dist.cjs',false,(e.stdout+e.stderr).trim().split('\n').slice(-5).join(' / '))}
const fail=R.filter(r=>!r.ok);for(const r of fail)console.log('FAIL',r.c,'::',r.d);console.log(`\n${R.length-fail.length}/${R.length} pass`);
fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(R,null,1));process.exit(fail.length?1:0)})();
