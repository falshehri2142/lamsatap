// Build static short links: node build.js  -> dist/
// No external packages. Domain = one line in config.json.
const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
// Placeholder guard: literal "DOMAIN" fails; example.com / the word "domain" only warns.
if (String(cfg.domain).includes('DOMAIN')) { console.error('BUILD FAILED\nconfig.json domain is still the placeholder "DOMAIN"'); process.exit(1); }
const domain = new URL(cfg.domain).origin;
if (/(^|\.)example\.com$/i.test(new URL(domain).hostname) || /domain/i.test(domain)) console.warn(`WARNING: config.json domain is a placeholder (${domain}). Set the real domain before programming tags or uploading.`);
const status302 = cfg.forceBang ? '302!' : '302';
const links = JSON.parse(fs.readFileSync(path.join(root, 'links.json'), 'utf8'));
const publishedFile = path.join(root, 'published.txt');
const CODE = /^[a-z0-9]{3,16}$/;
const RESERVED = new Set(['inactive', '404', 'index', 'admin', 'api', 'assets', 'static', 'www', 'robots', 'favicon', 'sitemap', 'redirects', 'links', 'published', 'null', 'undefined']);
const MAX_REDIRECTS = 2000;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const js = s => JSON.stringify(s).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const errors = [];
function checkDest(code, d) {
  if (typeof d !== 'string' || /[\s<>"'`\\]/.test(d)) return errors.push(`bad chars in dest: ${code}`), null;
  let u; try { u = new URL(d); } catch { return errors.push(`invalid URL: ${code}`), null; }
  if (u.protocol !== 'https:' || u.username || u.password) return errors.push(`dest must be plain https: ${code}`), null;
  if (u.origin === domain) {
    let p; try { p = decodeURIComponent(u.pathname).toLowerCase().replace(/\/+/g, '/'); } catch { return errors.push(`bad %-encoding in dest: ${code}`), null; }
    if (p === '/t' || p.startsWith('/t/')) return errors.push(`dest loops back to /t/: ${code}`), null;
  }
  return u.href;
}
const seen = new Set();
for (const l of links) {
  if (!CODE.test(l.code)) errors.push(`bad code: ${l.code}`);
  if (RESERVED.has(l.code)) errors.push(`reserved code: ${l.code}`);
  if (seen.has(l.code)) errors.push(`duplicate code: ${l.code}`);
  seen.add(l.code);
  if (!l.place || !String(l.place).trim()) errors.push(`place required: ${l.code}`);
  // Control chars (tab/newline/...) would forge extra lines in out/links.txt.
  for (const k of ['place', 'client']) if (l[k] != null && /[\p{Cc}\p{Cf}]/u.test(String(l[k]))) errors.push(`control character in ${k}: ${l.code}`);
  if (l.type == null) l.type = 'public'; // door = unit door (host bundle): tap times never recorded (legal/register.md #20)
  if (!['door', 'public'].includes(l.type)) errors.push(`bad type (door|public): ${l.code}`);
  if (!['active', 'cancelled'].includes(l.status)) errors.push(`bad status: ${l.code}`);
  if (l.status === 'active') l.href = checkDest(l.code, l.dest);
}
// Never delete a published code: every code in published.txt must still exist.
const published = fs.existsSync(publishedFile) ? fs.readFileSync(publishedFile, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
for (const c of published) if (!seen.has(c)) errors.push(`published code removed (set status "cancelled" instead): ${c}`);
const redirectLines = links.length * 2;
if (redirectLines > MAX_REDIRECTS) errors.push(`_redirects would have ${redirectLines} lines (> ${MAX_REDIRECTS})`);
if (errors.length) { console.error('BUILD FAILED\n' + errors.join('\n')); process.exit(1); }

fs.rmSync(out, { recursive: true, force: true });
const write = (rel, s) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const page = (title, body, script = '', refresh = '') => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
${refresh ? `<meta http-equiv="refresh" content="0;url=${esc(refresh)}">` : ''}${script ? `<script>${script}</script>` : ''}<title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:3rem 1rem}</style></head>
<body>${body}</body></html>\n`;
// JS: go to target, carrying only ?src= (nfc/qr) of the tapped URL.
const go = t => `(function(){try{var u=new URL(${js(t)},location.href);var s=new URLSearchParams(location.search).get('src');if(s&&/^[a-z0-9]{1,16}$/.test(s))u.searchParams.set('src',s);location.replace(u.href)}catch(e){location.replace(${js(t)})}})();`;

write('t/inactive/index.html', page('الرابط غير متاح', '<h1>هذا الرابط غير متاح حالياً</h1><p>تواصل مع المحل للمزيد.</p>'));
write('404.html', page('غير موجود', '<h1>الرابط غير موجود</h1>',
  `(function(){var p=location.pathname,m=p.match(new RegExp('^[/]t[/]([A-Za-z0-9]+)[/]?$'));if(m){var n='/t/'+m[1].toLowerCase()+'/';if(n!==p)location.replace(n+location.search);}})();`));
const red = [];
for (const l of links) {
  const target = l.status === 'active' ? l.href : '/t/inactive/';
  write(`t/${l.code}/index.html`, page('جاري التحويل', `<p><a href="${esc(target)}">اضغط هنا إذا ما انتقلت تلقائياً</a></p>`, go(target), target));
  red.push(`/t/${l.code}  ${target}  ${status302}`, `/t/${l.code}/  ${target}  ${status302}`);
}
write('_redirects', red.join('\n') + '\n');
const urls = links.map(l => `${domain}/t/${l.code}/\t${l.status}\t${l.place}`);
// links.txt is private (all codes + places): kept OUT of dist/ so it is never uploaded.
const priv = path.join(root, 'out'); fs.mkdirSync(priv, { recursive: true });
fs.writeFileSync(path.join(priv, 'links.txt'), urls.join('\n') + '\n');
const all = [...new Set([...published, ...links.map(l => l.code)])].sort();
fs.writeFileSync(publishedFile, all.join('\n') + '\n');
console.log(`built ${links.length} links (${red.length} redirect lines) -> ${out}\n` + urls.join('\n'));
