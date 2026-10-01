// web-qa screenshots for GM-070: full page (reduced motion, after scrolling so lazy images load) per page/width.
// NODE_PATH=/tmp/claude-0/sp/node_modules node shots.cjs <port> <out-dir> [pages] [widths]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const PORT=process.argv[2]||8861,B=`http://localhost:${PORT}`,OUT=path.resolve(process.argv[3]||'shots');fs.mkdirSync(OUT,{recursive:true});
const PAGES=(process.argv[4]||'/,/restaurants/,/hosts/,/404.html').split(','),W=(process.argv[5]||'390,1440').split(',').map(Number);
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const u of PAGES)for(const w of W){const ctx=await br.newContext({viewport:{width:w,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();
 await p.goto(B+u,{waitUntil:'networkidle'});const h=await p.evaluate(()=>document.body.scrollHeight);for(let y=0;y<h;y+=600){await p.mouse.wheel(0,600);await p.waitForTimeout(60);}
 await p.waitForTimeout(800);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);
 const name=(u.replace(/\//g,'_').replace(/^_|_$/g,'')||'home')+'-'+w;
 await p.screenshot({path:path.join(OUT,name+'-top.png')});
 await p.screenshot({path:path.join(OUT,name+'-full.png'),fullPage:true});
 const CH=w<768?1700:1100;const H=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0,i=0;y<H;y+=CH,i++)await p.screenshot({path:path.join(OUT,name+'-part'+i+'.png'),fullPage:true,clip:{x:0,y,width:w,height:Math.min(CH,H-y)}});console.log(name,h);await ctx.close();}
await br.close();})();
