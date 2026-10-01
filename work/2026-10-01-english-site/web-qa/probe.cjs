// web-qa probe for GM-070 (2026-10-01). Usage:
//   NODE_PATH=/tmp/claude-0/sp/node_modules node probe.cjs <port> <out-dir>
// Checks: head (lang/dir/canonical/hreflang/og), switch round-trips, same-language internal links,
// Arabic left anywhere on English pages (text, attributes, meta, JSON-LD, hidden nodes, runtime strings),
// element-level overflow/clipping at 9 widths, arrows, dark-scheme stays light, numbers next to prices.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const PORT=process.argv[2]||8861,B=`http://localhost:${PORT}`,OUT=path.resolve(process.argv[3]||'.');fs.mkdirSync(OUT,{recursive:true});
const EN=['/','/restaurants/','/hosts/'],AR=['/ar/','/ar/restaurants/','/ar/hosts/'],TWIN={'/':'/ar/','/restaurants/':'/ar/restaurants/','/hosts/':'/ar/hosts/'};
for(const k of Object.keys(TWIN))TWIN[TWIN[k]]=k;
const R=[];const add=(c,ok,d)=>{R.push({c,ok,d:typeof d==='string'?d:JSON.stringify(d)});};
const norm=u=>{const p=new URL(u).pathname.replace(/index\.html$/,'');return p;};
const ARX=/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
async function scrollAll(p){const h=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<h;y+=500){await p.mouse.wheel(0,500);await p.waitForTimeout(30);}await p.mouse.wheel(0,-h-2000);await p.waitForTimeout(300);}
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
// ---------- head + links + Arabic residue ----------
for(const u of [...EN,...AR,'/404.html']){const ctx=await br.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();
 await p.goto(B+u,{waitUntil:'networkidle'});await scrollAll(p);
 const h=await p.evaluate(()=>{const q=s=>document.querySelector(s);const m=s=>(q(s)||{}).content||null;
  const alts={};document.querySelectorAll('link[rel=alternate][hreflang]').forEach(l=>alts[l.hreflang]=new URL(l.href).pathname);
  return{lang:document.documentElement.lang,dir:document.documentElement.dir,title:document.title,canon:(q('link[rel=canonical]')||{}).href||null,alts,
   ogLocale:m('meta[property="og:locale"]'),ogAlt:[...document.querySelectorAll('meta[property="og:locale:alternate"]')].map(e=>e.content),ogUrl:m('meta[property="og:url"]'),
   sw:(()=>{const s=q('.s-lang');return s&&{href:s.getAttribute('href'),abs:s.href,text:s.textContent.trim(),lang:s.lang,hl:s.hreflang}})(),
   links:[...document.querySelectorAll('a[href]')].filter(a=>a.href.startsWith(location.origin)&&!a.classList.contains('s-lang')).map(a=>({h:new URL(a.href).pathname,t:(a.textContent||a.getAttribute('aria-label')||'').trim().slice(0,40)}))}});
 const en=EN.includes(u)||u==='/404.html';
 add(`${u} lang/dir`,en?(h.lang==='en'&&h.dir==='ltr'):(h.lang.startsWith('ar')&&h.dir==='rtl'),h.lang+'/'+h.dir);
 if(u!=='/404.html'){const self=u,tw=TWIN[u],enU=en?self:tw,arU=en?tw:self;
  add(`${u} canonical self`,h.canon&&new URL(h.canon).pathname===self&&h.canon.startsWith('https://lamsatap.com'),h.canon);
  add(`${u} hreflang reciprocal`,h.alts.en===enU&&h.alts.ar===arU&&h.alts['x-default']===enU,h.alts);
  add(`${u} og:locale`,en?(h.ogLocale==='en_US'&&h.ogAlt.includes('ar_SA')):(h.ogLocale==='ar_SA'&&h.ogAlt.includes('en_US')),{l:h.ogLocale,a:h.ogAlt,url:h.ogUrl});
  add(`${u} switch target`,h.sw&&norm(h.sw.abs)===tw&&h.sw.hl===(en?'ar':'en'),h.sw);
  // company links must stay in the same language
  const wrong=h.links.filter(l=>{const p=l.h.replace(/index\.html$/,'');if(/^\/(demo|templates|assets|vendor)\//.test(p))return false;if(/^\/(ar\/)?(restaurants\/|hosts\/)?$/.test(p))return en?p.startsWith('/ar/'):!p.startsWith('/ar/');return false;});
  add(`${u} internal links same language`,wrong.length===0,wrong);}
 else{const ar=h.links.filter(l=>l.h.startsWith('/ar/'));add(`/404.html links`,h.links.some(l=>l.h==='/'||l.h==='/index.html')&&ar.length>=1,h.links);}
 if(en){const res=await p.evaluate((src)=>{const AR=new RegExp(src);const out={visText:[],hiddenText:[],attrs:[],meta:[],jsonld:[]};
   const vis=e=>{for(let x=e;x;x=x.parentElement){const cs=getComputedStyle(x);if(cs.display==='none'||cs.visibility==='hidden')return false;}return e.getClientRects().length>0};
   const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!AR.test(n.textContent))continue;const e=n.parentElement;if(e.closest('script,style'))continue;if(e.closest('[lang=ar]'))continue;(vis(e)?out.visText:out.hiddenText).push(e.tagName+'.'+(e.className.baseVal??e.className)+': '+n.textContent.trim().slice(0,60));}
   document.querySelectorAll('body *').forEach(e=>{if(e.closest('[lang=ar]'))return;for(const a of e.attributes){if(/^(d|points|viewBox|class|style|src|srcset|id)$/.test(a.name))continue;if(AR.test(a.value))out.attrs.push(e.tagName+'['+a.name+']='+a.value.slice(0,60));}});
   document.querySelectorAll('head meta, head title, head link').forEach(e=>{const v=e.content||e.textContent||e.getAttribute('title')||'';if(AR.test(v))out.meta.push((e.getAttribute('name')||e.getAttribute('property')||e.tagName)+'='+v.slice(0,60));});
   document.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{const t=s.textContent;const m=t.match(/"[^"]*[؀-ۿ][^"]*"/g);if(m)out.jsonld.push(...m.map(x=>x.slice(0,60)));});
   out.arIslands=[...document.querySelectorAll('[lang=ar]')].filter(e=>!e.parentElement.closest('[lang=ar]')).map(e=>e.tagName+'.'+((e.className.baseVal??e.className)+'').split(' ')[0]+' '+(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,40));
   return out;},ARX.source);
  add(`${u} no Arabic visible text outside [lang=ar]`,res.visText.length===0,res.visText);
  add(`${u} no Arabic hidden text outside [lang=ar]`,res.hiddenText.length===0,res.hiddenText);
  add(`${u} no Arabic in attributes outside [lang=ar]`,res.attrs.length===0,res.attrs);
  add(`${u} no Arabic in <head>`,res.meta.length===0,res.meta);
  add(`${u} no Arabic in JSON-LD`,res.jsonld.length===0,res.jsonld);
  add(`${u} Arabic islands (info)`,true,res.arIslands);
  // numbers in visible text near a price word
  const nums=await p.evaluate(()=>{const t=document.body.innerText;const out=[];for(const m of t.matchAll(/[^\n]{0,30}\b\d[\d,.]*\b[^\n]{0,30}/g))if(/SAR|riyal|\/\s?(yr|year|mo|month)|per (unit|year|month)|refund|fee/i.test(m[0]))out.push(m[0].trim());return out});
  add(`${u} price-like strings (info)`,true,[...new Set(nums)]);}
 await ctx.close();}
// ---------- Arabic customer demos link back to the Arabic company pages ----------
for(const u of ['/demo/menu/','/demo/review/','/demo/wifi/','/demo/links/','/demo/rental-guide/','/demo/door/']){const ctx=await br.newContext({viewport:{width:390,height:800}});const p=await ctx.newPage();
 await p.goto(B+u,{waitUntil:'networkidle'});const L=await p.$$eval('a[href]',a=>a.filter(x=>x.href.startsWith(location.origin)).map(x=>new URL(x.href).pathname.replace(/index\.html$/,'')));
 const company=L.filter(x=>/^\/(ar\/)?(restaurants\/|hosts\/)?$/.test(x));const wrong=company.filter(x=>!x.startsWith('/ar/'));
 add(`${u} company links -> /ar/`,wrong.length===0,{company,wrong});await ctx.close();}
// ---------- switch round-trips by clicking ----------
for(const u of [...EN,...AR])for(const w of [320,1440]){const ctx=await br.newContext({viewport:{width:w,height:800}});const p=await ctx.newPage();
 await p.goto(B+u,{waitUntil:'networkidle'});await p.click('.s-lang');await p.waitForLoadState('networkidle');const a=norm(p.url());const la=await p.evaluate(()=>document.documentElement.lang);
 await p.click('.s-lang');await p.waitForLoadState('networkidle');const b=norm(p.url());
 add(`round-trip ${u} @${w}`,a===TWIN[u]&&b===u&&(EN.includes(u)?la.startsWith('ar'):la==='en'),`${u} -> ${a} (${la}) -> ${b}`);await ctx.close();}
// ---------- layout: element overflow and clipped text ----------
for(const u of [...EN,'/404.html',...AR])for(const w of [320,360,375,390,414,768,1024,1280,1440]){const ctx=await br.newContext({viewport:{width:w,height:800},reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(B+u,{waitUntil:'networkidle'});await scrollAll(p);
 const L=await p.evaluate(()=>{const vw=document.documentElement.clientWidth;const out={off:[],clip:[]};
  const clippedByAncestor=e=>{for(let x=e.parentElement;x&&x!==document.body;x=x.parentElement){const cs=getComputedStyle(x);if(/(hidden|clip|auto|scroll)/.test(cs.overflowX)){const r=x.getBoundingClientRect();if(r.left>=-1&&r.right<=vw+1)return true;}}return false};
  for(const e of document.querySelectorAll('body *')){if(e.closest('[aria-hidden=true],svg,.sr-only,.visually-hidden,[hidden]'))continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed')continue;const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
   if(e.closest('.s-sr')||e.clientWidth<=4||e.clientHeight<=4)continue; // screen-reader-only (1px clip) pattern
   const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
   if(hasText&&(r.right>vw+1||r.left<-1)&&!clippedByAncestor(e))out.off.push(e.tagName+'.'+(e.className+'').split(' ')[0]+' '+Math.round(r.left)+'..'+Math.round(r.right)+' "'+e.textContent.trim().slice(0,30)+'"');
   if(hasText&&/(hidden|clip)/.test(cs.overflowX+cs.overflowY)&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+2))out.clip.push(e.tagName+'.'+(e.className+'').split(' ')[0]+' sw'+e.scrollWidth+'/'+e.clientWidth+' sh'+e.scrollHeight+'/'+e.clientHeight+' "'+e.textContent.trim().slice(0,30)+'"');
   if(hasText&&cs.textOverflow==='ellipsis'&&e.scrollWidth>e.clientWidth)out.clip.push('ellipsis '+e.tagName+'.'+(e.className+'').split(' ')[0]);}
  out.hs=document.documentElement.scrollWidth>vw;
  const head=document.querySelector('.s-top');out.headH=head?Math.round(head.getBoundingClientRect().height):null;
  return out});
 add(`layout ${u} @${w}`,!L.hs&&L.off.length===0&&L.clip.length===0&&errs.length===0,{hs:L.hs,off:L.off.slice(0,6),clip:L.clip.slice(0,6),headH:L.headH,errs});await ctx.close();}
// ---------- arrows: EN arrows point right (path differs from AR twin, no scaleX(-1) on top) ----------
for(const u of EN){const ctx=await br.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();await p.goto(B+u,{waitUntil:'networkidle'});
 const ar=await (async()=>{const p2=await ctx.newPage();await p2.goto(B+TWIN[u],{waitUntil:'networkidle'});const d=await p2.$$eval('.h-arrow, .r-lab-link svg, .p-lab-link svg, .h-door-more svg',a=>a.map(s=>s.innerHTML));await p2.close();return d})();
 const en=await p.$$eval('.h-arrow, .r-lab-link svg, .p-lab-link svg, .h-door-more svg',a=>a.map(s=>({h:s.innerHTML,t:getComputedStyle(s).transform})));
 const same=en.filter((e,i)=>ar[i]===e.h&&!/matrix\(-1/.test(e.t)).length;
 // pseudo arrows
 const after=await p.$$eval('.lt-btn',a=>a.map(b=>getComputedStyle(b,'::after').content).filter(c=>c&&c!=='none'&&c!=='normal'));
 add(`arrows ${u}`,same===0&&!after.some(c=>/←/.test(c)),{n:en.length,sameAsArabic:same,after:[...new Set(after)]});
 // screenshot the arrows for the eye
 let i=0;for(const s of await p.$$('.h-nav-action, .h-door-more, .r-lab-link, .p-lab-link, .h-ask .s-cta .lt-btn')){if(i>=4)break;if(!(await s.isVisible()))continue;await s.scrollIntoViewIfNeeded();await s.screenshot({path:path.join(OUT,`arrow${u.replace(/\//g,'_')}${i++}.png`)});}
 await ctx.close();}
// ---------- dark preference: company pages stay light (GM-038) ----------
for(const u of [...EN,...AR]){const out={};for(const cs of ['light','dark']){const ctx=await br.newContext({viewport:{width:390,height:800},colorScheme:cs,reducedMotion:'reduce'});const p=await ctx.newPage();await p.goto(B+u,{waitUntil:'networkidle'});
 out[cs]=await p.evaluate(()=>[getComputedStyle(document.body).backgroundColor,getComputedStyle(document.body).color,getComputedStyle(document.querySelector('h1')).color].join(' | '));
 if(cs==='dark'&&(u==='/'||u==='/hosts/'))await p.screenshot({path:path.join(OUT,`dark${u.replace(/\//g,'_')}390.png`)});await ctx.close();}
 add(`dark scheme stays light ${u}`,out.light===out.dark,out);}
await br.close();
const fail=R.filter(r=>!r.ok);for(const r of R)console.log(r.ok?'PASS':'FAIL',r.c,'::',r.d.slice(0,400));console.log(`\n${R.length-fail.length}/${R.length} pass`);
fs.writeFileSync(path.join(OUT,'probe.json'),JSON.stringify(R,null,1));process.exit(fail.length?1:0)})();
