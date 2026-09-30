// Local Chromium/CDP QA. No packages, external requests, website edits or publication.
// Run: node work/2026-09-29-site-upgrade/qa-interactions.cjs
'use strict';
const fs = require('fs'), path = require('path'), net = require('net');
const { spawn } = require('child_process');
const { pathToFileURL, fileURLToPath } = require('url');
const root = path.resolve(__dirname, '../../website');
const pricesOnly = process.argv.includes('--prices-only');
const final = process.argv.includes('--final') || pricesOnly;
const base = final ? 'http://127.0.0.1:8123/' : null;
const out = path.join(__dirname, pricesOnly ? 'qa-prices-final' : final ? 'qa-browser-final' : 'qa-browser');
fs.mkdirSync(out, { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
const browser = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const report = { date: new Date().toISOString(), runs: [], interactions: [], issues: [] };
function audit() {
  const shown = el => el && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  const controls = [...document.querySelectorAll('a[href],button,input,select,textarea')].filter(shown);
  return {
    title: document.title, lang: document.documentElement.lang, dir: document.documentElement.dir,
    width: document.documentElement.clientWidth, innerWidth, scrollWidth: document.documentElement.scrollWidth,
    overflowElements: [...document.querySelectorAll('body *')].filter(shown).map(x => ({ el:x.tagName.toLowerCase()+'.'+x.className, left:x.getBoundingClientRect().left, right:x.getBoundingClientRect().right })).filter(x => x.left < -1 || x.right > document.documentElement.clientWidth + 1).slice(0,30),
    h1: [...document.querySelectorAll('h1')].map(x => ({ text: x.innerText, shown: shown(x) })),
    hiddenHeadings: [...document.querySelectorAll('main h1,main h2,main h3')].filter(x=>!x.closest('[aria-hidden="true"]')&&!shown(x)).map(x=>({tag:x.tagName,text:x.textContent})),
    images: [...document.images].filter(x => x.complete && !x.naturalWidth).map(x => x.getAttribute('src')),
    missingAlt: [...document.images].filter(x => !x.hasAttribute('alt')).map(x => x.getAttribute('src')),
    ids: [...document.querySelectorAll('[id]')].map(x => x.id).filter((v,i,a) => a.indexOf(v) !== i),
    unnamed: controls.filter(x => !(x.textContent.trim() || x.getAttribute('aria-label') || x.getAttribute('aria-labelledby') || x.querySelector('img[alt]'))).map(x => x.outerHTML.slice(0,150)),
    contacts: controls.filter(x => /wa\.me|t\.me/.test(x.href || '')).map(x => ({ text: x.innerText, href: x.href })),
    links: [...document.querySelectorAll('a[href]')].filter(shown).map(x => x.href),
    switches: [...document.querySelectorAll('[data-price-switch]')].map(x => ({ shown: shown(x), selected: x.querySelector('[aria-checked="true"]')?.textContent, tabbable: x.querySelectorAll('[tabindex="0"]').length })),
    nojsPrice: [...document.querySelectorAll('.s-nojs')].filter(shown).map(x => x.innerText),
    motionClasses: document.documentElement.className,
    pageHeight: document.documentElement.scrollHeight
  };
}
(async () => {
  if (!browser) throw new Error('No local Chrome or Edge installed.');
  const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const profile = fs.mkdtempSync(path.join(out, 'profile-'));
  const proc = spawn(browser, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--remote-debugging-address=127.0.0.1', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let childError;
  proc.on('error', e => { childError = e; });
  let ws, send, logs = [];
  try {
    let info;
    for (let i=0; i<60; i++) {
      if (childError) throw childError;
      try { info = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); break; } catch { await pause(150); }
    }
    if (!info?.webSocketDebuggerUrl) throw new Error('Local browser debugging port did not become available');
    ws = new WebSocket(info.webSocketDebuggerUrl);
    await new Promise((r,j) => { ws.onopen=r; ws.onerror=j; });
    let seq=0; const pending=new Map();
    ws.onmessage = m => {
      const d=JSON.parse(m.data);
      if (pending.has(d.id)) { const p=pending.get(d.id); pending.delete(d.id); clearTimeout(p.timer); d.error ? p.j(new Error(d.error.message)) : p.r(d.result); }
      if (d.method === 'Runtime.exceptionThrown') logs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
      if (d.method === 'Network.loadingFailed' && !d.params.canceled) logs.push(d.params.errorText);
      if (d.method === 'Fetch.requestPaused') {
        const u=new URL(d.params.request.url); const local=['127.0.0.1','localhost'].includes(u.hostname)||['file:','data:','about:','blob:'].includes(u.protocol);
        send(local?'Fetch.continueRequest':'Fetch.failRequest',{requestId:d.params.requestId,...(local?{}:{errorReason:'BlockedByClient'})}).catch(e=>logs.push(e.message));
      }
    };
    send=(method,params={}) => new Promise((r,j) => { const id=++seq; const timer=setTimeout(() => { pending.delete(id); j(new Error(method+' timeout')); },15000); pending.set(id,{r,j,timer}); ws.send(JSON.stringify({id,method,params})); });
    const js=async expression => { const r=await send('Runtime.evaluate',{ expression, returnByValue:true, awaitPromise:true }); if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
    await Promise.all(['Page.enable','Runtime.enable','Network.enable'].map(m => send(m)));
    await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
    await send('Network.setCacheDisabled',{cacheDisabled:true});
    const media = async reduce => send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduce?'reduce':'no-preference'},{name:'prefers-color-scheme',value:'light'}]});
    const open = async (p, width, nojs=false, reduce=false, failGsap=false) => {
      logs=[];
      await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
      await media(reduce);
      await send('Network.setBlockedURLs',{urls:failGsap?['*gsap.min.js*','*ScrollTrigger.min.js*']:[]});
      await send('Emulation.setScriptExecutionDisabled',{value:nojs});
      const nav=await send('Page.navigate',{url:base?new URL(p+'?qa='+Date.now(),base).href:pathToFileURL(path.join(root,p)).href});
      if(nav.errorText) throw new Error(nav.errorText);
      await pause(1700);
    };
    for (const p of pricesOnly?[]:['index.html','restaurants/index.html','hosts/index.html']) {
      for (const width of final?[320,390,768,1024,1440]:[320,390,1440]) {
        await open(p,width,false,true);
        await js('new Promise(async r=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){scrollTo(0,y);await new Promise(s=>setTimeout(s,70))}scrollTo(0,0);setTimeout(r,150)})');
        const data=await js(`(${audit.toString()})()`);
        const brokenLinks=[];
        for(const href of data.links) {
          const u=new URL(href); if(u.protocol!=='file:'&&!['127.0.0.1','localhost'].includes(u.hostname)) continue;
          let file=u.protocol==='file:'?fileURLToPath(u):path.join(root,decodeURIComponent(u.pathname)); if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
          if(!fs.existsSync(file)) brokenLinks.push(href);
          else if(u.hash) { const hash=decodeURIComponent(u.hash.slice(1)); const exists=file===path.join(root,p)?await js(`!!document.getElementById(${JSON.stringify(hash)})`):new RegExp('id=["\x27]'+hash+'["\x27]').test(fs.readFileSync(file,'utf8')); if(!exists) brokenLinks.push(href); }
        }
        const shot=await send('Page.captureScreenshot',{format:'png'});
        fs.writeFileSync(path.join(out,`${p.split('/')[0].replace('.html','')}-${width}.png`),Buffer.from(shot.data,'base64'));
        report.runs.push({ page:p, width, reduced:true, nojs:false, errors:[...logs], brokenLinks, ...data });
        if(final&&width===1440&&p!=='index.html') for(const anchor of ['experience','plan']) {
          await js(`document.getElementById('${anchor}').scrollIntoView({block:'start'})`); await pause(250);
          const section=await send('Page.captureScreenshot',{format:'png'});
          fs.writeFileSync(path.join(out,`${p.split('/')[0]}-${anchor}-1440.png`),Buffer.from(section.data,'base64'));
        }
      }
      await open(p,390,true,true);
      report.runs.push({ page:p,width:390,reduced:true,nojs:true,errors:[...logs],...await js(`(${audit.toString()})()`) });
      if(final) for(const failedGsap of [false,true]) {
        await open(p,390,false,false,failedGsap);
        await js('new Promise(async r=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo(0,y);await new Promise(s=>setTimeout(s,100))}scrollTo(0,0);setTimeout(r,800)})');
        report.runs.push({page:p,width:390,reduced:false,nojs:false,failedGsap,errors:[...logs],...await js(`(${audit.toString()})()`) });
      }
    }
    await send('Emulation.setScriptExecutionDisabled',{value:false});
    for(const p of ['restaurants/index.html','hosts/index.html']) {
      await open(p,1440,false,false);
      await js('document.querySelector("[data-price-switch]").scrollIntoView({block:"center"});document.querySelector("[data-price-switch] [aria-checked=true]").focus()');
      await pause(500);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
      const state = await js(`({ active:document.activeElement.getAttribute('data-value'), selected:[...document.querySelectorAll('[data-price-switch] [aria-checked="true"]')].map(x=>x.getAttribute('data-value')), prices:[...document.querySelectorAll('[data-roll]')].map(x=>x.getAttribute('data-now')), text:[...document.querySelectorAll('[data-swap]')].map(x=>x.textContent), notes:[...document.querySelectorAll('[data-when]')].filter(x=>!x.hidden).map(x=>x.textContent) })`);
      report.interactions.push({page:p,event:'keyboard ArrowLeft',...state});
      await media(true);
      await pause(200);
      await js('document.querySelector("[data-price-switch] [data-value]").click()');
      report.interactions.push({page:p,event:'reduced-motion computed units',...await js(`({units:[...document.querySelectorAll('.s-price-unit')].map(x=>({duration:getComputedStyle(x).transitionDuration,transform:getComputedStyle(x).transform,runningAnimations:x.getAnimations().filter(a=>a.playState==='running').length}))})`)});
      report.interactions.push({page:p,event:'live prefers-reduced-motion then click',...await js(`({ reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, inlineTransitions:[...document.querySelectorAll('[data-price-scope] [style]')].filter(x=>x.style.transition && /transform/.test(x.style.transition)).map(x=>({class:x.className,transition:x.style.transition,duration:getComputedStyle(x).transitionDuration,transform:getComputedStyle(x).transform,activeAnimations:x.getAnimations().filter(a=>a.playState==='running').length})), selected:document.querySelector('[data-price-switch] [aria-checked="true"]').getAttribute('data-value') })`)});
    }
  } catch(e) { report.fatal=e.stack || String(e); process.exitCode=1; }
  finally {
    if(send) { try { await send('Browser.close'); } catch {} }
    if(ws) ws.close();
    await pause(600);
    if(proc.exitCode===null) proc.kill();
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    // Only remove this run's generated browser profile after verifying the absolute target.
    const resolvedOut=path.resolve(out), resolvedProfile=path.resolve(profile);
    if(path.dirname(resolvedProfile)===resolvedOut && path.basename(resolvedProfile).startsWith('profile-')) {
      try { fs.rmSync(resolvedProfile,{recursive:true,force:true,maxRetries:3,retryDelay:250}); } catch(e) { report.profileCleanupWarning=e.code; }
    }
    console.log(JSON.stringify({runs:report.runs.map(r=>({page:r.page,width:r.width,nojs:r.nojs,failedGsap:r.failedGsap,errors:r.errors,overflow:r.scrollWidth-r.width,images:r.images,missingAlt:r.missingAlt,duplicates:r.ids,unnamed:r.unnamed,brokenLinks:r.brokenLinks,h1:r.h1.length,hiddenHeadings:r.hiddenHeadings,contacts:r.contacts.length,switches:r.switches})),interactions:report.interactions,fatal:report.fatal},null,2));
  }
})();
