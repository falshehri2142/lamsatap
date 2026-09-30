// QA gate: NODE_PATH=/tmp/claude-0/sp/node_modules node check.js [port]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const PORT=process.argv[2]||8831,B=`http://localhost:${PORT}`;
const PAGES=['/','/restaurants/','/hosts/','/404.html','/demo/menu/','/demo/review/','/demo/wifi/','/demo/links/','/demo/rental-guide/'];
const CO=['/','/restaurants/','/hosts/'];const W=[320,375,390,768,1024,1440];
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
 return{sw:d.scrollWidth,cw:d.clientWidth,small,ls,dir:d.dir,lang:d.lang,h1:document.querySelectorAll('h1').length,title:!!document.title.trim(),desc:!!document.querySelector('meta[name=description]')?.content||/noindex/.test(document.querySelector('meta[name=robots]')?.content||''),
 noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.src),
 links:[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin))}});
add(`${k} console/network`,errs.length===0,errs.join(' | '));
add(`${k} no h-scroll`,info.sw<=info.cw,`${info.sw}/${info.cw}`);
add(`${k} tap>=44`,info.small.length===0,info.small.join('; '));
add(`${k} arabic letter-spacing 0`,info.ls.length===0,info.ls.join('; '));
if(w===390){add(`${u} rtl/ar/h1/meta`,info.dir==='rtl'&&info.lang.startsWith('ar')&&info.h1===1&&info.title&&info.desc,JSON.stringify({dir:info.dir,lang:info.lang,h1:info.h1,title:info.title,desc:info.desc}));
 add(`${u} img alt`,info.noalt.length===0,info.noalt.join(' '));
 const bad=[];for(const l of new Set(info.links.map(x=>x.split('#')[0]))){if(!(l in linkCache)){const r=await p.request.get(l).catch(()=>null);linkCache[l]=r?r.status():0;}if(linkCache[l]>=400||!linkCache[l])bad.push(l+' '+linkCache[l]);}
 add(`${u} links resolve`,bad.length===0,bad.join(' '));}
await p.screenshot({path:path.join(SH,`${(u.replace(/\//g,'_')||'_')}-${w}.png`),fullPage:true});await ctx.close();}
// reduced motion + no JS
for(const mode of ['reduce','nojs'])for(const u of CO)for(const w of [390,1440]){const ctx=await br.newContext({viewport:{width:w,height:800},reducedMotion:mode==='reduce'?'reduce':'no-preference',javaScriptEnabled:mode!=='nojs'});const p=await ctx.newPage();
await p.goto(B+u,{waitUntil:'networkidle'});await scrollAll(p);
const v=await p.evaluate(()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect();let o=1;for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden')return false;o*=parseFloat(cs.opacity)}return r.width>0&&o>0.5};
 const h=[...document.querySelectorAll('h1,h2')];const hid=h.filter(e=>!vis(e)&&!e.closest('[hidden],.sr-only,.visually-hidden')).map(e=>e.textContent.trim().slice(0,30));
 const cta=[...document.querySelectorAll('main a.lt-btn, main a[class*=btn], main h1 ~ * a')].find(e=>!e.hidden&&vis(e));return{hid,cta:vis(cta),ctaT:cta&&cta.textContent.trim().slice(0,30)}});
add(`${mode} ${u} @${w} headings+CTA visible`,v.hid.length===0&&v.cta,JSON.stringify(v));
if(w===390)await p.screenshot({path:path.join(SH,`${mode}${u.replace(/\//g,'_')}-${w}.png`),fullPage:true});await ctx.close();}
// signature
for(const rm of ['no-preference','reduce']){const ctx=await br.newContext({viewport:{width:1440,height:900},reducedMotion:rm});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(B+'/',{waitUntil:'networkidle'});await p.locator('#tap-lab').scrollIntoViewIfNeeded();
const st=()=>p.getAttribute('[data-tl-stage]','data-state');await p.waitForFunction(()=>document.querySelector('[data-tl-stage]').dataset.state==='open',null,{timeout:6000}).catch(()=>{});
const log=[`init:${await st()}`];let ok=(await st())==='open';
for(const o of ['review','wifi','guide','menu']){await p.click(`[data-tl-opt=${o}]`);const src=await p.getAttribute(`[data-tl-opt=${o}]`,'data-tl-src');
 const r=await p.waitForFunction(s=>{const f=document.querySelector('[data-tl-frame]');const st=document.querySelector('[data-tl-stage]').dataset.state;return st==='open'&&f.getAttribute('src').includes(s)},src,{timeout:6000}).then(()=>1).catch(()=>0);
 const sel=await p.getAttribute(`[data-tl-opt=${o}]`,'aria-selected');const href=await p.getAttribute('[data-tl-open]','href');ok=ok&&r&&sel==='true'&&href===src;log.push(`${o}:${r?'open':'FAIL'} sel=${sel} href=${href}`);}
await p.focus('[data-tl-opt=menu]');await p.keyboard.press('ArrowLeft');let f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k1=f==='review';
await p.keyboard.press('End');f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k2=f==='guide';
await p.keyboard.press('Home');f=await p.evaluate(()=>document.activeElement.dataset.tlOpt);const k3=f==='menu';
const tabbable=await p.$$eval('[data-tl-opt]',a=>a.filter(e=>e.tabIndex===0).length);
add(`signature (${rm}) clicks`,ok&&!errs.length,log.join(', ')+' '+errs.join('|'));
add(`signature (${rm}) keyboard`,k1&&k2&&k3&&tabbable===1,`ArrowLeft->review:${k1} End->guide:${k2} Home->menu:${k3} tabbable=${tabbable}`);await ctx.close();}
await br.close();
// static: transition all, prices
const css=fs.readdirSync(path.join(__dirname,'../../../website/assets')).filter(f=>f.endsWith('.css'));const ta=css.filter(f=>/transition\s*:\s*all\b|transition-property\s*:\s*all/.test(fs.readFileSync(path.join(__dirname,'../../../website/assets',f),'utf8')));
add('no transition: all in assets/*.css',ta.length===0,ta.join(' '));
const allowed=['1,211','1211','798','49.5','544.5','39.5','434.5','25','40','60','30','15','100','65','400'];
const pr=[];for(const u of ['index.html','restaurants/index.html','hosts/index.html']){const t=fs.readFileSync(path.join(__dirname,'../../../website',u),'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'').replace(/<foreignObject[\s\S]*?<\/foreignObject>/g,'').replace(/data-total>[\d.,]+/g,'').replace(/<[^>]+>/g,' ');
 for(const m of t.matchAll(/([\d.,٠-٩]+)\s*(ريال|ر\.س|SAR)/g)){if(!allowed.includes(m[1]))pr.push(u+': '+m[0]);}}
add('prices match services/pricing.md',pr.length===0,pr.join('; '));
let out='';try{out=require('child_process').execSync('node tools/build-dist.cjs',{cwd:path.join(__dirname,'../../..'),encoding:'utf8',stdio:'pipe'});add('build-dist.cjs',true,out.trim().split('\n').slice(-3).join(' / '))}catch(e){add('build-dist.cjs',false,(e.stdout+e.stderr).trim().split('\n').slice(-5).join(' / '))}
const fail=R.filter(r=>!r.ok);for(const r of fail)console.log('FAIL',r.c,'::',r.d);console.log(`\n${R.length-fail.length}/${R.length} pass`);
fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(R,null,1));process.exit(fail.length?1:0)})();
