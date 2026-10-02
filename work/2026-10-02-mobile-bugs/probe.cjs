// Mobile bug probe (2026-10-02): NODE_PATH=/tmp/claude-0/sp/node_modules node probe.cjs <port> <outDir> [shots=1]
// Opens the 6 company pages at 360/390/430, scrolls screen by screen (viewport shots), and reports:
// h-scroll, clipped text, small tap targets, Arabic on EN pages, price lines, images not filling their frame,
// anchor targets hidden under the sticky header, and the header logo state.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const PORT=process.argv[2]||8851,B=`http://localhost:${PORT}`;const OUT=path.resolve(process.argv[3]||'shots');const SHOTS=process.argv[4]!=='0';
const PAGES=['/ar/','/ar/restaurants/','/ar/hosts/','/','/restaurants/','/hosts/'];const W=[360,390,430];
fs.mkdirSync(OUT,{recursive:true});const issues=[];
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const u of PAGES)for(const w of W){const ctx=await br.newContext({viewport:{width:w,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(B+u,{waitUntil:'networkidle'});await p.waitForTimeout(600);
 const tag=(u.replace(/\//g,'_')||'_')+'-'+w;
 const H=await p.evaluate(()=>document.documentElement.scrollHeight);let i=0;
 for(let y=0;y<H;y+=640){await p.evaluate(y=>window.scrollTo(0,y),y);await p.waitForTimeout(450);
  if(SHOTS)await p.screenshot({path:path.join(OUT,`${tag}-${String(i).padStart(2,'0')}.png`)});i++;
  // per-screen: images not filling frame (only those currently in view, after animations settle)
  const gaps=await p.evaluate(()=>[...document.querySelectorAll('img,picture,video')].filter(e=>{const r=e.getBoundingClientRect();return r.width>40&&r.bottom>0&&r.top<innerHeight}).map(e=>{const im=e.tagName==='PICTURE'?e.querySelector('img'):e;if(!im)return null;const cs=getComputedStyle(im);if(cs.objectFit!=='cover')return null;
   let f=im.parentElement;while(f&&f.tagName==='PICTURE')f=f.parentElement;const fr=f.getBoundingClientRect(),r=im.getBoundingClientRect();const fs=getComputedStyle(f);if(fs.overflow==='visible'&&fs.overflowY==='visible')return null;
   const d={t:Math.round(r.top-fr.top),b:Math.round(fr.bottom-r.bottom),l:Math.round(r.left-fr.left),r:Math.round(fr.right-r.right)};
   const bad=Object.values(d).some(v=>v>1);return bad?`${(im.currentSrc||im.src).split('/').pop()} in ${f.tagName}.${(f.className+'').split(' ')[0]} gap ${JSON.stringify(d)}`:null}).filter(Boolean));
  gaps.forEach(g=>issues.push(`${u}@${w} y${y} img-gap ${g}`));}
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(300);
 const info=await p.evaluate(()=>{const d=document.documentElement;const out={};
  out.hs=d.scrollWidth>d.clientWidth?`${d.scrollWidth}/${d.clientWidth}`:'';
  const wide=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width)return false;let x=e;for(;x;x=x.parentElement){const o=getComputedStyle(x).overflowX;if(o!=='visible'&&x!==e)return false}return r.right>innerWidth+1||r.left<-1}).slice(0,6).map(e=>e.tagName+'.'+(e.className+'').split(' ')[0]+' '+Math.round(e.getBoundingClientRect().left)+'..'+Math.round(e.getBoundingClientRect().right));
  out.wide=wide;
  out.clip=[...document.querySelectorAll('body *')].filter(e=>{if(!e.getClientRects().length)return false;const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!t)return false;const cs=getComputedStyle(e);
   const hid=cs.overflow!=='visible'||cs.overflowX!=='visible';return hid&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+2)&&!e.closest('[aria-hidden=true],.sr-only,.visually-hidden,iframe')}).map(e=>`${e.tagName}.${(e.className+'').split(' ')[0]} "${e.textContent.trim().slice(0,30)}" ${e.scrollWidth}x${e.scrollHeight}>${e.clientWidth}x${e.clientHeight}`);
  out.small=[...document.querySelectorAll('a,button,[role=tab],[role=button],input,select')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||e.closest('[aria-hidden=true]'))return false;
   if(e.tagName==='A'&&cs.display==='inline'&&e.parentElement&&e.parentElement.textContent.trim().length>e.textContent.trim().length+5)return false;return r.width<44||r.height<44}).map(e=>`${e.tagName}.${(e.className+'').split(' ')[0]} "${(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,20)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
  out.ar=d.lang==='en'?[...document.querySelectorAll('body *')].filter(e=>{const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return /[؀-ۿ]/.test(t)&&!e.closest('[lang=ar]')&&e.getClientRects().length}).map(e=>e.tagName+'.'+(e.className+'').split(' ')[0]+' '+e.textContent.trim().slice(0,40)):[];
  // price-looking leaves: lines count
  out.prices=[...document.querySelectorAll('body *')].filter(e=>{if(!e.getClientRects().length||e.closest('[aria-hidden=true],[hidden]'))return false;const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return /(ريال|SAR|\bsetup\b|تجهيز|تأسيس|\/month|بالشهر|per visit|للزيارة|قريباً|coming soon)/i.test(own)}).map(e=>{const cs=getComputedStyle(e);const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.4;const rng=document.createRange();rng.selectNodeContents(e);const lines=new Set([...rng.getClientRects()].map(r=>Math.round(r.top))).size;return `${lines}L ${e.tagName}.${(e.className+'').split(' ')[0]} w${Math.round(e.getBoundingClientRect().width)} "${e.textContent.trim().replace(/\s+/g,' ').slice(0,70)}"`});
  const logo=document.querySelector('.s-top .s-logo, .s-logo, header a[class*=logo]');if(logo){const im=logo.querySelector('img,svg');const cs=im&&getComputedStyle(im);out.logo={cls:document.documentElement.className+' | '+document.body.className,clip:cs&&cs.clipPath,w:Math.round(logo.getBoundingClientRect().width)}}
  const top=document.querySelector('.s-top');out.headH=top?Math.round(top.getBoundingClientRect().height):0;
  out.anchors=[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1))];
  return out});
 // anchors: jump and check target top vs sticky header bottom
 const under=[];for(const h of info.anchors){const r=await p.evaluate(h=>{const t=document.querySelector(h);if(!t)return null;t.scrollIntoView({behavior:'instant',block:'start'});return null},h).catch(()=>null);
  await p.waitForTimeout(250);const m=await p.evaluate(h=>{const t=document.querySelector(h);if(!t)return 'missing';const top=document.querySelector('.s-top');const hb=top?top.getBoundingClientRect().bottom:0;const tr=t.getBoundingClientRect();const head=t.querySelector('h2,h3,.s-eyebrow')||t;const hr=head.getBoundingClientRect();return hr.top<hb-1?`${h} heading top ${Math.round(hr.top)} < header ${Math.round(hb)}`:''},h);if(m)under.push(m);}
 const k=`${u}@${w}`;
 if(errs.length)issues.push(`${k} pageerror ${errs.join('|')}`);
 if(info.hs)issues.push(`${k} h-scroll ${info.hs}`);if(info.wide.length)issues.push(`${k} offscreen ${info.wide.join('; ')}`);
 info.clip.forEach(c=>issues.push(`${k} clip ${c}`));info.small.forEach(c=>issues.push(`${k} small ${c}`));info.ar.forEach(c=>issues.push(`${k} arabic-in-en ${c}`));
 under.forEach(c=>issues.push(`${k} under-header ${c}`));
 issues.push(`${k} INFO logo ${JSON.stringify(info.logo)} head ${info.headH}`);info.prices.forEach(c=>issues.push(`${k} PRICE ${c}`));
 await ctx.close();}
await br.close();fs.writeFileSync(path.join(OUT,'issues.txt'),issues.join('\n')+'\n');console.log(issues.filter(x=>!/ INFO | PRICE /.test(x)).join('\n'));console.log('---',issues.length,'lines');})();
