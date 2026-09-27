// Test: a link whose dest has a #fragment keeps it through every redirect layer.
// Usage: node systems/shortlinks/test-anchor.js   (works on a temp copy; the real links.json is untouched)
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const src = __dirname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-anchor-'));
for (const f of ['build.js', 'links-cli.js', 'config.json', 'links.json', 'published.txt']) fs.copyFileSync(path.join(src, f), path.join(tmp, f));
const dest = 'https://example.org/guide/unit-a/#emergency';
const add = cp.spawnSync('node', [path.join(tmp, 'links-cli.js'), '--dir', tmp, 'add', 'emrg01', '--client', 'demo-host', '--place', 'ستاند الطوارئ', '--dest', dest, '--type', 'emergency'], { encoding: 'utf8' });
let fail = 0;
const check = (name, ok, extra) => { if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', name, extra || ''); };
check('add emergency link', add.status === 0, (add.stdout + add.stderr).trim().split('\n').pop());
const links = JSON.parse(fs.readFileSync(path.join(tmp, 'links.json'), 'utf8'));
const l = links.find(x => x.code === 'emrg01');
check('type emergency stored, no ref', l && l.type === 'emergency' && !l.ref);
const html = fs.readFileSync(path.join(tmp, 'dist/t/emrg01/index.html'), 'utf8');
check('meta refresh keeps #emergency', html.includes('url=https://example.org/guide/unit-a/#emergency'));
const red = fs.readFileSync(path.join(tmp, 'dist/_redirects'), 'utf8');
check('_redirects line keeps #emergency', red.split('\n').some(x => x.startsWith('/t/emrg01/ ') && x.includes('https://example.org/guide/unit-a/#emergency')));
// Run the page script with a fake location (NFC tap adds ?src=nfc)
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
let went = null;
new Function('location', 'URL', 'URLSearchParams', js)({ href: 'https://example.com/t/emrg01/?src=nfc', search: '?src=nfc', replace: (u) => { went = u; } }, URL, URLSearchParams);
check('JS redirect keeps #emergency and adds src', went === 'https://example.org/guide/unit-a/?src=nfc#emergency', went);
const bad = cp.spawnSync('node', [path.join(tmp, 'links-cli.js'), '--dir', tmp, 'add', 'emrg02', '--client', 'x', '--place', 'x', '--dest', dest, '--type', 'nope'], { encoding: 'utf8' });
check('unknown type rejected', bad.status !== 0);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
