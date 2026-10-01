// GM-070 step 1 (one time): move the Arabic company pages to <website>/ar/ and fix them for the new depth.
// Usage: node move-ar.cjs <website-dir> [--git]
//   --git  uses `git mv` (keeps history); without it a plain rename (for a scratch copy).
// What changes inside the Arabic pages (content and copy stay the same):
//   1. Shared files get one more ../ (assets/, vendor/, demo/, templates/, config.js, favicon.ico).
//      Links between company pages stay as they are, so they now resolve inside /ar/.
//   2. data-canonical and JSON-LD page URLs move to /ar/...
//   3. <head>: canonical + hreflang (ar, en, x-default=en) + og:locale:alternate en_US.
//   4. Header: the «English» switch as the first item of .s-head-end (styles in assets/site.css .s-lang).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const W = path.resolve(process.argv[2] || ''), GIT = process.argv.includes('--git');
if (!fs.existsSync(path.join(W, 'config.js'))) throw new Error('Not a website dir: ' + W);
const DOMAIN = 'https://lamsatap.com';
const PAGES = [
  { from: 'index.html', to: 'ar/index.html', canon: '/', en: '../index.html' },
  { from: 'restaurants/index.html', to: 'ar/restaurants/index.html', canon: '/restaurants/', en: '../../restaurants/index.html' },
  { from: 'hosts/index.html', to: 'ar/hosts/index.html', canon: '/hosts/', en: '../../hosts/index.html' }
];
const GLOBE = '<svg class="s-lang-i" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/></svg>';

function once(s, re, rep, what) {
  const n = (s.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || []).length;
  if (n !== 1) throw new Error(what + ': expected 1 match, got ' + n);
  return s.replace(re, rep);
}
// one more ../ for shared files, in every attribute that holds a path
function deepen(html) {
  return html.replace(/(\s(?:src|href|srcset|data-tl-src)=")([^"]*)"/g, (m, a, v) =>
    a + v.replace(/(^|[\s,])((?:\.\.\/)*)(?=(?:assets|vendor|demo|templates)\/|config\.js|favicon\.ico)/g, '$1../$2') + '"');
}

for (const p of PAGES) {
  const src = path.join(W, p.from), dst = path.join(W, p.to);
  if (!fs.existsSync(src)) throw new Error('Missing ' + p.from);
  if (fs.existsSync(dst)) throw new Error('Already moved: ' + p.to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (GIT) cp.execFileSync('git', ['mv', src, dst], { cwd: W });
  else fs.renameSync(src, dst);
  let h = fs.readFileSync(dst, 'utf8');
  h = deepen(h);
  const canon = '/ar' + p.canon;
  h = once(h, /data-canonical="[^"]*"/, 'data-canonical="' + canon + '"', p.to + ' data-canonical');
  // JSON-LD (restaurants only): the page's own URLs; the organisation stays at the root
  h = h.replace(/("(?:url|item|@id)":\s*")https:\/\/lamsatap\.com\/(restaurants|hosts)\//g, '$1' + DOMAIN + '/ar/$2/');
  h = h.replace(/("position": 1, "name": "[^"]*", "item": ")https:\/\/lamsatap\.com\/"/g, '$1' + DOMAIN + '/ar/"');
  // head: canonical + hreflang, after twitter:card
  const head = '\n<link rel="canonical" href="' + DOMAIN + canon + '">' +
    '\n<link rel="alternate" hreflang="ar" href="' + DOMAIN + canon + '">' +
    '\n<link rel="alternate" hreflang="en" href="' + DOMAIN + p.canon + '">' +
    '\n<link rel="alternate" hreflang="x-default" href="' + DOMAIN + p.canon + '">';
  h = once(h, /(<meta name="twitter:card" content="summary">)/, '$1' + head, p.to + ' twitter:card');
  h = once(h, /(<meta property="og:locale" content="ar_SA">)/, '$1\n<meta property="og:locale:alternate" content="en_US">', p.to + ' og:locale');
  // header: «English» first in .s-head-end
  const sw = '<a class="lt-btn lt-btn--secondary lt-btn--compact s-lang" href="' + p.en + '" hreflang="en" lang="en">' + GLOBE + '<span>English</span></a>';
  h = once(h, /(<div class="s-head-end">\n?)/, '$1' + sw + (h.includes('<div class="s-head-end">\n') ? '\n' : ''), p.to + ' s-head-end');
  fs.writeFileSync(dst, h);
  console.log('moved ' + p.from + ' -> ' + p.to);
}
