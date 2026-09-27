#!/usr/bin/env node
// Manage links.json then rebuild with build.js. No external packages.
//   node links-cli.js list
//   node links-cli.js add <code>|--gen --client <c> --place <p> --dest <https-url>
//   node links-cli.js set-dest <code> <https-url> [--reactivate]
//   node links-cli.js cancel <code>
// Option --dir <folder> (or env SHORTLINKS_DIR): folder containing links.json + build.js (default: this folder).
// Validation of codes/dest/published is left to build.js; on build failure links.json is restored byte-for-byte.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');

function die(msg) { console.error('ERROR: ' + msg); process.exit(2); }
const argv = process.argv.slice(2), pos = [], opt = {};
const FLAGS = new Set(['gen', 'reactivate']), VALS = new Set(['dir', 'client', 'place', 'dest']);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    if (FLAGS.has(k)) opt[k] = true;
    else if (VALS.has(k)) { if (i + 1 >= argv.length) die(`--${k} needs a value`); opt[k] = argv[++i]; }
    else die(`unknown option --${k}`);
  } else pos.push(a);
}
const dir = path.resolve(opt.dir || process.env.SHORTLINKS_DIR || __dirname);
const linksFile = path.join(dir, 'links.json'), buildFile = path.join(dir, 'build.js');
if (!fs.existsSync(linksFile) || !fs.existsSync(buildFile)) die(`links.json/build.js not found in ${dir}`);
const original = fs.readFileSync(linksFile, 'utf8');
const links = JSON.parse(original);
const find = c => links.find(l => l.code === c);
const today = new Date().toISOString().slice(0, 10);
const cmd = pos.shift();

function genCode() {
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789'; // no 0/o/1/l (easy to misread)
  for (;;) {
    let s = ''; for (const b of crypto.randomBytes(8)) s += abc[b % 32]; // 32 divides 256: unbiased
    if (!find(s)) return s;
  }
}

function saveAndBuild(msg) {
  fs.writeFileSync(linksFile, '[\n' + links.map(l => '  ' + JSON.stringify(l)).join(',\n') + '\n]\n');
  const r = spawnSync(process.execPath, [buildFile], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) {
    fs.writeFileSync(linksFile, original); // rollback; published.txt is written only on success, dist/out may be partial
    process.stderr.write(r.stdout + r.stderr);
    console.error('ROLLED BACK: links.json restored. Run build.js again before uploading (dist/ or out/ may be from a partial build).');
    process.exit(1);
  }
  process.stdout.write(r.stdout); process.stderr.write(r.stderr); // keep build warnings (e.g. example domain)
  console.log('OK: ' + msg);
}

switch (cmd) {
  case 'list': {
    if (pos.length) die('list takes no arguments');
    for (const l of links) console.log([l.code, l.status, l.client || '-', l.place, l.dest].join('\t'));
    break;
  }
  case 'add': {
    let code = opt.gen ? genCode() : pos.shift();
    if (opt.gen && pos.length) die('use either <code> or --gen, not both');
    if (!code || pos.length) die('usage: add <code>|--gen --client <c> --place <p> --dest <url>');
    code = String(code); // no lowercasing: build.js rejects uppercase so the typo is visible
    for (const k of ['client', 'place', 'dest']) if (!opt[k] || !opt[k].trim()) die(`--${k} is required`);
    if (find(code)) die(`code exists: ${code} (${find(code).status}). Codes are never reused.`);
    links.push({ code, client: opt.client.trim(), place: opt.place.trim(), dest: opt.dest, status: 'active', programmed: today });
    saveAndBuild(`added ${code}`);
    break;
  }
  case 'set-dest': {
    const [code, url] = pos;
    if (!code || !url || pos.length !== 2) die('usage: set-dest <code> <url> [--reactivate]');
    const l = find(code); if (!l) die(`no such code: ${code}`);
    if (l.status === 'cancelled' && !opt.reactivate) die(`${code} is cancelled; add --reactivate if you really mean to reopen it`);
    l.dest = url; l.status = 'active';
    saveAndBuild(`${code} -> ${url}${opt.reactivate ? ' (reactivated)' : ''}`);
    break;
  }
  case 'cancel': {
    const [code] = pos;
    if (!code || pos.length !== 1) die('usage: cancel <code>');
    const l = find(code); if (!l) die(`no such code: ${code}`);
    if (l.status === 'cancelled') die(`${code} already cancelled`);
    l.status = 'cancelled';
    saveAndBuild(`cancelled ${code} (now -> /t/inactive/)`);
    break;
  }
  default:
    die('commands: list | add | set-dest | cancel   (options: --dir, --gen, --client, --place, --dest, --reactivate)');
}
