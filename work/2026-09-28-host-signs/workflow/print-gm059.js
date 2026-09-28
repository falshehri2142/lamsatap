export const meta = {
  name: 'print-gm050-051-059',
  description: 'GM-050/051/059 at max: signs fix + impeccable review, in parallel A5 visit sheets + Telegram images with the design skills; export and prepress each',
  phases: [
    { title: 'Signs design', detail: 'print-designer: 3 sign templates; ad-creative: export tool' },
    { title: 'Signs export', detail: 'ad-creative renders PDF + PNG' },
    { title: 'Signs prepress', detail: 'print-prepress PASS/FAIL + one fix round' },
    { title: 'B2B design', detail: 'print-designer: A5 visit sheets; ad-creative: Telegram images' },
    { title: 'B2B export', detail: 'ad-creative renders' },
    { title: 'B2B prepress', detail: 'print-prepress PASS/FAIL + one fix round' },
  ],
}

const T = 'work/2026-09-28-host-signs'
const E = 'max'
const BASE = `
You work in the current git worktree (project LamsaTap / لمسة تاب). Do NOT commit, push, publish, order anything, or edit files outside the paths named for your step.
Department skill: .claude/skills/print-studio/SKILL.md. Decisions: management/decision-register.md (GM-017, GM-021, GM-023, GM-025, GM-027, GM-042, GM-045, GM-046, GM-047, GM-050, GM-051 matter most). Owner order GM-051: all print work in ultracode with agents at max effort — be thorough.
Existing print system to build on (same conventions): print/README.md, print/dims.js (every mm with its source), print/print.js, print/print.css, print/stand/*, print/host-stickers/*.
Every line of copy must cite a source file in the project; if there is no source, leave it out and say so. Anything unconfirmed is written «غير مؤكد». Write notes in plain short Saudi Arabic, file paths in Latin letters.
Use the ui-ux-pro-max skill (and frontend-design if useful) for layout/typography rules; GM decisions override its defaults. Style GM-021: American-clean craft (Apple/Stripe/Square/Toast level: bold type, generous whitespace, precise details), Saudi audience and Arabic-first RTL.
Rendering: open pages in a headless browser (node + locally installed Chrome/Edge via DevTools protocol, or $HOME/.claude/tools/ui-probe.cjs) and LOOK at screenshots before finishing.`

const SIGN_RULES = `
TASK A (GM-050). Brief (binding): ${T}/goal.md. Reference photo: brand-source/real-work/2026-09-28-awa-home-checkout-sign.jpg + README.md next to it (its faults: «إشعار فوري للمضيف» is forbidden by GM-017; the QR must never be real; the name AWA HOME must not appear).
Engineering: engineering/host-unit-and-stand-alternatives.md (option B: acrylic ~100x150 printed from the back + on-metal NTAG213 45x45 behind it; ferrite direction «غير مؤكد»), engineering/stand-dimensions.md (QR >=30mm with 4-module quiet zone; >=10mm gap chip-sticker edge to QR quiet zone; stand chip centre 62mm from top). No metal/foil/metal frame over or near the chip zone.
Client hardware = CLIENT identity only: property/shop name as text in the neutral ink + sand theme from brand/tokens.css, or the client's logo; NO LamsaTap logo, NO saffron, no LamsaTap colours; optional small «بواسطة لمسة تاب» only if the client file says poweredBy:true (default false). Touch mark = solid filled dot (GM-027), never waves/rings/arcs around it, with «قرّب جوالك هنا». QR secondary and fake (https://example.com/t/EXAMPLE.../). No Google logo, no "G", no stars. Allowed copy e.g. «بدون تطبيق», «بلمسة أو بالباركود»; forbidden «إشعار فوري للمضيف» or any claim that the host is notified directly/instantly (the message reaches LamsaTap, who informs the host from the company phone, GM-017). Copy sources: work/2026-09-27-brand-identity/web-copy.md (§0, §3), sales/host-track.md, marketing/telegram-plan.md §5 (m4/m5 wording), marketing skill fixed rules.
WEBSITE DELIVERY (GM request, the export step makes it, prepress verifies it): folder print/renders/ with EXACTLY these transparent-background 2x PNGs of the final pieces: checkout-sign.png, wifi-stand.png, emergency-stand.png, guest-guide-stand.png, restaurant-stand.png (= the restaurant REVIEW face). Plus print/renders/SIZES.md: for each file its piece, real size in mm, pixel size, aspect ratio (w:h and decimal), all measured from the actual files (not copied from the design). Nobody writes inside website/ (the website designer copies them).`

const B2B_RULES = `
TASK B (GM-051), same visual language as the finished Task A signs, but these are OUR B2B materials in OUR identity (GM-042, brand/logo/v1.0.0/USAGE.md): the BLACK logo for documents/printed sheets, the TEAL logo (white on teal #0B7A75) for marketing/social. Use the logo files as they are (no redraw, no shadows/gradients on the logo; teal gradient allowed only as background around it; no ®). Saffron is our B2B accent (GM-025) — use sparingly if at all. Forbidden in any of our graphics: dot trails (Lamsa logo), rings/waves (Tap Payments/EMVCo), single letter or letter+dot, payment cues, national/religious symbols (marketing skill fixed rules). No Google logo/G/stars. Sales promise must be written in full: «رد خلال ساعة على الواتساب أو التليجرام، من 9 الصبح لين 11 الليل» (GM-046/047). Contact details (WhatsApp number, Telegram handle, site URL, QR) are PLACEHOLDERS, clearly fake, until launch (GM-006).`

const DESIGNER_A = `${BASE}${SIGN_RULES}
ROLE: print-designer (مصمم الطباعة). Read .claude/agents/print-designer.md and follow it.
IMPORTANT: the brief has an owner addendum at the end of ${T}/goal.md («نماذج الطاولة») that CHANGES item 2 — read it; it wins over the earlier item list.
GOAL: one final design per item (no options), clearly better than the AWA HOME sign, ONE visual language across all pieces:
1) DOOR: check-out confirmation sign ONLY (inside the flat, next to/behind the door, 120-140cm). Nothing else goes on the door/wall.
2) TABLE inside the unit: small stands, ONE action each, same language:
   a) Wi-Fi: network name and password printed (placeholders from the client file), the touch opens the Wi-Fi page with a copy button (website/templates/wifi — read it, do not edit it). iPhone cannot join Wi-Fi from a tag; never promise auto-connect.
   b) Emergency: official Saudi emergency numbers printed; the touch opens a page with tap-to-call. EVERY number must come from an official government source (fetch it, cite URL + date in your notes); any number not confirmed from an official source is written «غير مؤكد» in the notes and NOT printed. Host number optional, typed by the host into the client file, never stored in n8n (GM-017).
   c) Guest guide: a table stand (replaces the old guest-guide wall sign).
   DECIDE: one stand per action, or one two-sided stand — write the reason (clarity, cost, number of chips: each action needs its own chip/URL; engineering/stand-dimensions.md). Prefer reusing the A6 stand holder + 100x150 sheet geometry of print/stand (chip centre 62mm) unless you prove something better.
3) Restaurant stand face A6 (review and menu purposes): update the existing template print/stand to the same language, keeping its engineering geometry (chip centre 62mm, QR zone, dims.js values/sources) and keeping existing client files working (example-cafe, example-nologo).
"Better" = ONE action per piece; big title; the touch zone (solid dot on the chip centre) is the hero; QR clearly secondary; clear hierarchy, generous whitespace, fewer words; consistent self-drawn line icons (one stroke width), max 3 benefits (fewer is fine, each approved copy); Arabic first, short English second (foreign guests); light background.
SIZE of the door sign: choose ONE size from what is available (A5, A4, acrylic 100x150) and write the reason (cost, legibility at 120-140cm, chip placement behind the sign, frame without metal near the chip). Put new geometry in print/dims.js under new keys, a source/reason for every number (own proposals «غير مؤكد»).
BUILD at real size in mm: new folder print/host-signs/ with index.html (?client=<name>&sign=checkout|wifi|emergency|guide), signs.js, clients/<unit>.js (one file per unit: every piece's URL, property name, Wi-Fi name/password placeholders, optional host number, optional logo/colour, poweredBy). Example client(s) with clearly fictional names (no real business, not AWA HOME). Print/PDF mode with 3mm bleed + safe area + crop marks (e.g. &bleed=1), preview-guides toggle like the existing templates, mono/engrave mode where the stand has one. Each sheet = one element with class p-sheet and data-sign (checkout, wifi-stand, emergency-stand, guest-guide-stand, stand-review, stand-menu; the restaurant stand needs ?client=...&purpose=menu or a menu example client) so the export tool can screenshot it; screen-only UI hidden under @media print. Local Readex Pro (brand/fonts) and local QR lib website/vendor/qrcode-generator.js. Minimum printed text 9pt. No overflow:hidden on Arabic text (dots get clipped).
Update print/README.md (host-signs section) and record icon/illustration sources in print/CREDITS.md (create if missing).
Notes to ${T}/print-designer.md: size decision + reason, table-stand decision + reason, emergency numbers with official source URL + date, copy table (Arabic, English, source), file list, how to open each template, «غير مؤكد» list, and what page each touch must open (for the website designer / systems supervisor: e.g. an emergency page does not exist yet).`

const DESIGN_SCHEMA = {
  type: 'object',
  properties: {
    decisions: { type: 'string', description: 'size/format decision per piece and why' },
    files: { type: 'array', items: { type: 'string' } },
    exportTargets: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, outDir: { type: 'string' }, name: { type: 'string' }, kind: { type: 'string', description: 'print-transparent | print-sheet | social-px' } }, required: ['url', 'outDir', 'name', 'kind'] } },
    copyTable: { type: 'array', items: { type: 'object', properties: { piece: { type: 'string' }, ar: { type: 'string' }, en: { type: 'string' }, source: { type: 'string' } }, required: ['piece', 'ar', 'source'] } },
    uncertain: { type: 'array', items: { type: 'string' } },
  },
  required: ['decisions', 'files', 'exportTargets', 'copyTable', 'uncertain'],
}

const TOOL = `${BASE}
ROLE: ad-creative (مصمم الإعلانات). Read .claude/agents/ad-creative.md and follow it.
GOAL (in parallel with print-designer, who is editing print/stand/*, print/dims.js, print/print.*, print/README.md and creating print/host-signs/*; do NOT edit those): build a reusable export tool print/export.cjs (plain Node, no npm install; drive a locally installed Chrome/Edge headless via the DevTools protocol; Node has a global WebSocket). It serves the repo root over a local http server (templates load ../../website/... files), opens a template URL, waits for fonts and render, then:
 a) PDF at exact real size (use the page's own @page size; supports the template's bleed mode), printBackground, no margins, no header/footer;
 b) PNG of every .p-sheet element (file name from data-sign) with optional TRANSPARENT page background (Emulation.setDefaultBackgroundColorOverride alpha 0), screen guides/preview bar hidden (print media emulation or hide .p-screen/.p-guide), at any list of scales: "2x" for website (@2x) and 300dpi (scale 300/96, @300dpi) for print;
 c) social mode: pages sized in CSS px (e.g. 1080x1080) captured at scale 1 to exact pixel size, opaque.
CLI e.g.: node print/export.cjs --url "print/host-stickers/index.html?client=example-flats" --out <dir> --name <base> --pdf --png 2x,300dpi --transparent
Test now on print/host-stickers (not being edited) into ${T}/export-test/ (delete test outputs after verifying; keep a short log). Verify with real measurements: PDF MediaBox in mm, PNG pixel sizes = mm*96/25.4*scale, PNG alpha channel + transparent corners; Read one PNG to look at it.
Document the tool in a separate file print/EXPORT.md; notes to ${T}/ad-creative.md.`

const TOOL_SCHEMA = {
  type: 'object',
  properties: { tool: { type: 'string' }, usage: { type: 'string' }, browser: { type: 'string' }, tested: { type: 'boolean' }, testEvidence: { type: 'string' }, problems: { type: 'array', items: { type: 'string' } } },
  required: ['tool', 'usage', 'tested', 'testEvidence'],
}

const EXPORT_SCHEMA = {
  type: 'object',
  properties: {
    websitePng: { type: 'array', items: { type: 'string' } },
    printPng: { type: 'array', items: { type: 'string' } },
    socialPng: { type: 'array', items: { type: 'string' } },
    pdfs: { type: 'array', items: { type: 'string' } },
    visualIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['websitePng', 'printPng', 'socialPng', 'pdfs', 'visualIssues'],
}

const PRE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
    rows: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, check: { type: 'string' }, result: { type: 'string', enum: ['PASS', 'FAIL', 'غير مؤكد'] }, evidence: { type: 'string' } }, required: ['item', 'check', 'result', 'evidence'] } },
    mustFix: { type: 'array', items: { type: 'string' } },
    openForOwner: { type: 'array', items: { type: 'string' }, description: 'cannot be verified without a physical sample/printer (CMYK proof, ferrite direction, QR scan from paper, official platform sizes)' },
  },
  required: ['verdict', 'rows', 'mustFix', 'openForOwner'],
}

const exportPrompt = (rules, design, tool, label) => `${BASE}${rules}
ROLE: ad-creative (مصمم الإعلانات), export step "${label}". Read .claude/agents/ad-creative.md.
print-designer/ad-creative design summary: ${JSON.stringify(design)}
Export tool: ${JSON.stringify(tool)}
Export EVERY target with print/export.cjs (fix the tool if it fails; keep it backward compatible):
- print pieces: PDF with bleed into <folder>/pdf/, PNG @300dpi, and website PNG @2x (transparent outside the piece for signs/stands) into <folder>/png/ named <piece>@2x.png / <piece>@300dpi.png;
- social pieces: exact pixel PNGs into their folder.
Remove stale exports of the same pieces. Then LOOK at every website/social PNG (Read the image) as an ad designer: is the hierarchy obvious at a glance, touch dot the hero on signs, Arabic dots clipped?, identity correct (client identity on hardware; our black/teal logo on our materials), forbidden elements (waves around the dot, Google G/stars, forbidden copy, real-looking QR/phone), text cut or cramped? List concrete visual issues (empty if none). Append a short log to ${T}/ad-creative.md.`

const prepressPrompt = (rules, design, exp, round, scope) => `${BASE}${rules}
ROLE: print-prepress (فاحص ما قبل الطباعة). Read .claude/agents/print-prepress.md and follow it strictly. Adversarial: reject anything incomplete; never trust the other agents' summaries; measure yourself with real tools.
Scope: ${scope}. Round ${round}. Design summary: ${JSON.stringify(design)}
Export summary: ${JSON.stringify(exp)}
Check EVERY exported file and template with evidence (commands + numbers):
- PDF page size in mm = trim + 2x bleed (parse MediaBox); PNG pixel sizes = mm*96/25.4*scale (print) or exact px (social); alpha where transparency is promised.
- Geometry in the rendered DOM: all text inside the safe area; min text 9pt on print; Arabic dots not clipped; on hardware: touch-dot centre vs chip centre within print/dims.js tolerance, QR >=30mm with quiet zone, >=10mm chip-to-QR gap, stand chip centre 62mm and existing client files still work (example-cafe, example-nologo, mono if present). Social: avatar content survives a circle crop; nothing important in the outer edge.
- Identity: hardware = client identity, no LamsaTap logo/saffron/colours (compare hex values in brand/tokens.css), «بواسطة لمسة تاب» only with poweredBy:true. Our materials = official logo files unmodified, black for documents, teal for marketing (GM-042), no ®.
- Copy: every visible line (Arabic + English) has a real project source; prices exactly as services/pricing.md incl. its tax rule; no forbidden claims (instant/direct host notification, Google logo/G/stars, invented numbers), full response-promise wording where used; fake QR/contact placeholders only; no AWA HOME, no real business names.
- Engineering: no metal/foil/metal frame near the chip; placement matches engineering/*.md; size decision reason written.
- Files: dims numbers have sources; print/CREDITS.md covers every icon/image; README/EXPORT docs match reality.
- CMYK: HTML→PDF is RGB — never fake a PASS; mark «غير مؤكد» and add "request a CMYK proof from the printer" to openForOwner. Fonts embedded/outlined: check with a real tool and report.
Append a "جولة ${round} — ${scope}" PASS/FAIL table to ${T}/print-prepress.md. verdict=FAIL if any mustFix remains; mustFix items concrete and fixable in files.`

const SKILLS = `
DESIGN SKILLS (owner order GM-059, mandatory): before designing or fixing, invoke the Skill tool for "frontend-design" and "ui-ux-pro-max" (typography, colour, hierarchy), and "canvas-design" for any visual composition (Telegram images, visit sheets, scenes). Apply work/2026-09-28-frontend-rules/rules.md where it fits print (brand files first, identity fonts only, Arabic letter-spacing always 0, spacing from brand tokens). GM decisions override skill defaults. An impeccable finish review runs before prepress.`

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', description: 'ship / fix-first' },
    fixes: { type: 'array', items: { type: 'object', properties: { piece: { type: 'string' }, owner: { type: 'string', description: 'print-designer or ad-creative' }, problem: { type: 'string' }, fix: { type: 'string' }, evidence: { type: 'string' } }, required: ['piece', 'owner', 'problem', 'fix', 'evidence'] } },
    strengths: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'fixes'],
}

const reviewPrompt = (rules, design, scope) => `${BASE}${rules}
ROLE: impeccable finish review (GM-059) for the print department, scope "${scope}", BEFORE prepress. You do NOT edit project files (scratch output only under ${T}/review-scratch/).
Direction contract: ${T}/goal.md (incl. the owner addendum) and the rules above; the comp to beat: brand-source/real-work/2026-09-28-awa-home-checkout-sign.jpg; quality bar: GM-021 (American-clean craft, Saudi audience) + ui-ux-pro-max quick reference + work/2026-09-28-frontend-rules/rules.md (print-applicable parts).
Design summary: ${JSON.stringify(design)}
Look at the REAL rendered pieces (Read the PNGs in print/renders/, print/*/png/, print/social/telegram/png/, print/visit-sheet/ exports; if missing or stale, render with: node print/export.cjs ... --out ${T}/review-scratch/ ). Judge hierarchy, typography (Arabic + English pairing, sizes, spacing), whitespace balance, alignment, colour/contrast, identity correctness, consistency across the family, legibility at real size and distance, and anything that looks templated or unfinished.
Return an ORDERED list of MATERIAL fixes only (no taste nitpicks), each with the piece, the owner role (print-designer for templates/sheets/stands/signs, ad-creative for Telegram/social images), the problem, a concrete fix, and evidence (file + measurement or what you saw). Also append a short "مراجعة impeccable — ${scope}" section in Saudi Arabic to ${T}/impeccable-review.md via Bash.`

const applyPrompt = (rules, role, design, rev) => `${BASE}${rules}${SKILLS}
ROLE: ${role}, applying the impeccable finish review. Read .claude/agents/${role.split(' ')[0]}.md.
Your current summary: ${JSON.stringify(design)}
Review fixes (apply every one whose owner is your role; if one is wrong or breaks a GM rule/engineering spec, reject it with evidence): ${JSON.stringify(rev.fixes)}
Re-render and LOOK after fixing. Add a "مراجعة impeccable" section to your notes in ${T}/. Return the same summary shape, updated.`

const fixPrompt = (rules, role, design, pre, exp) => `${BASE}${rules}${SKILLS}
ROLE: ${role}, fix round. Read .claude/agents/${role.split(' ')[0]}.md.
Your previous summary: ${JSON.stringify(design)}
print-prepress rejected with these mustFix items — fix ALL that belong to your pieces in the files (if one is wrong, prove it with evidence): ${JSON.stringify(pre.mustFix)}
Visual issues from the export review (fix the real ones for your pieces): ${JSON.stringify((exp && exp.visualIssues) || [])}
Look at your pages again in a headless browser after fixing. Add a "إصلاحات" section to your notes file in ${T}/. Return the same summary shape, updated.`

const merge = (design, roles, results) => {
  if (roles.length === 1) return results[0] || design
  const o = Object.assign({}, design)
  roles.forEach((r, i) => { if (results[i]) o[r.key] = results[i] })
  return o
}

async function reviewApply(rules, design, scope, ph, roles) {
  let rev = null
  try {
    rev = await agent(reviewPrompt(rules, design, scope), { label: `impeccable review (${scope})`, phase: ph, agentType: 'impeccable-finish-reviewer', schema: REVIEW_SCHEMA, effort: E })
  } catch (e) { log(`impeccable-finish-reviewer not available (${e}); using a default agent with the impeccable skill`) }
  if (!rev) rev = await agent(reviewPrompt(rules, design, scope) + '\nInvoke the Skill tool "impeccable" (critique/audit lens) for this review.', { label: `impeccable review via skill (${scope})`, phase: ph, schema: REVIEW_SCHEMA, effort: E })
  if (!rev || !rev.fixes || !rev.fixes.length) return design
  log(`${scope}: impeccable review → ${rev.fixes.length} fixes`)
  const res = await parallel(roles.map(r => () => agent(applyPrompt(rules, r.role, r.design(design), rev), { label: `${r.role.split(' ')[0]}: apply review (${scope})`, phase: ph, schema: DESIGN_SCHEMA, effort: E })))
  return merge(design, roles, res)
}

// ===== Task A round 1 (same calls/prompts as the earlier run → cached)
phase('Signs design')
const [signDesign, tool] = await parallel([
  () => agent(DESIGNER_A, { label: 'print-designer: signs', phase: 'Signs design', schema: DESIGN_SCHEMA, effort: E }),
  () => agent(TOOL, { label: 'ad-creative: export tool', phase: 'Signs design', schema: TOOL_SCHEMA, effort: E }),
])
if (!signDesign) return { error: 'print-designer (signs) did not return' }
const exp1 = await agent(exportPrompt(SIGN_RULES, signDesign, tool, 'signs'), { label: `ad-creative: export (signs)`, phase: 'Signs export', schema: EXPORT_SCHEMA, effort: E })
const pre1 = await agent(prepressPrompt(SIGN_RULES, signDesign, exp1, 1, 'signs'), { label: `print-prepress (signs)`, phase: 'Signs prepress', schema: PRE_SCHEMA, effort: E })

const SIGN_ROLES = [{ role: 'print-designer (مصمم الطباعة)', design: d => d }]
const B_ROLES = [
  { role: 'print-designer (مصمم الطباعة)', key: 'visitSheets', design: d => d.visitSheets || d },
  { role: 'ad-creative (مصمم الإعلانات)', key: 'telegram', design: d => d.telegram || d },
]

async function signsFinish() {
  const ph = 'Signs fix + review'
  let design = signDesign
  if (pre1 && pre1.verdict === 'FAIL') {
    log(`signs: prepress FAIL, ${pre1.mustFix.length} must-fix → fix round`)
    const f = await agent(fixPrompt(SIGN_RULES, SIGN_ROLES[0].role, design, pre1, exp1), { label: 'print-designer: fix (signs)', phase: ph, schema: DESIGN_SCHEMA, effort: E })
    if (f) design = f
  }
  design = await reviewApply(SIGN_RULES, design, 'signs', ph, SIGN_ROLES)
  let exp = await agent(exportPrompt(SIGN_RULES, design, tool, 'signs re-export'), { label: 'ad-creative: re-export (signs)', phase: ph, schema: EXPORT_SCHEMA, effort: E })
  let pre = await agent(prepressPrompt(SIGN_RULES, design, exp, 2, 'signs'), { label: 'print-prepress: recheck (signs)', phase: ph, schema: PRE_SCHEMA, effort: E })
  let rounds = 2
  if (pre && pre.verdict === 'FAIL') {
    log(`signs: FAIL in round 2 (${pre.mustFix.length} must-fix) → round 3`)
    const f3 = await agent(fixPrompt(SIGN_RULES, SIGN_ROLES[0].role, design, pre, exp), { label: 'print-designer: fix round 3 (signs)', phase: ph, schema: DESIGN_SCHEMA, effort: E })
    if (f3) design = f3
    design = await reviewApply(SIGN_RULES, design, 'signs round 3', ph, SIGN_ROLES)
    exp = await agent(exportPrompt(SIGN_RULES, design, tool, 'signs re-export round 3'), { label: 'ad-creative: re-export round 3 (signs)', phase: ph, schema: EXPORT_SCHEMA, effort: E })
    pre = await agent(prepressPrompt(SIGN_RULES, design, exp, 3, 'signs'), { label: 'print-prepress: recheck round 3 (signs)', phase: ph, schema: PRE_SCHEMA, effort: E })
    rounds = 3
    if (pre && pre.verdict === 'FAIL') log('signs: still FAIL after round 3 — reported')
  }
  return { design, exp, pre, rounds }
}

const DESIGNER_B = `${BASE}${B2B_RULES}${SKILLS}
ROLE: print-designer (مصمم الطباعة). Read .claude/agents/print-designer.md.
Visual language to follow: the client pieces from Task A (summary: ${JSON.stringify(signDesign)}) — study the templates and PNGs themselves in print/host-signs/, print/stand/, print/renders/ (they are being polished in parallel; follow the language, not pixel details).
GOAL: two A5 printed visit sheets (leave-behind after a visit), one final design each:
 1) restaurants & cafés — copy from sales/pitch.md, price from services/pricing.md (shop package), with its rules as written there (e.g. tax wording);
 2) short-term-rental hosts — copy from sales/pitch.md and sales/host-track.md, prices from services/pricing.md (host package tiers as written).
Our identity: BLACK logo (documents), from brand/logo/v1.0.0/ (see USAGE.md). A5 148x210mm, 3mm bleed, safe area, crop marks, real mm, min 9pt. One clear message, price shown honestly with its conditions, the response promise in full, placeholder contact + fake QR. Only claims present in those files (no invented numbers, no "بدون أي التزام" unless trial terms are approved — see marketing fixed rules). No "ادفع أونلاين" (GM-002; see work/2026-09-28-online-subscriptions/print.md).
BUILD in a new folder print/visit-sheet/ (index.html?sheet=restaurant|host, its own js/css and its own dims file with sources). Do NOT edit print/dims.js, print/print.*, print/stand/*, print/host-signs/*, print/renders/*, print/README.md or print/export.cjs (other agents run in parallel); add print/visit-sheet/README.md. Each sheet = one .p-sheet element with data-sign (visit-restaurant, visit-host). Record external assets in print/CREDITS.md only by appending (re-read before writing).
Notes to ${T}/print-designer-b2b.md: decisions, copy table with sources, files, «غير مؤكد».`

const CREATIVE_B = `${BASE}${B2B_RULES}${SKILLS}
ROLE: ad-creative (مصمم الإعلانات). Read .claude/agents/ad-creative.md and the marketing skill fixed rules.
Visual language to echo: the client pieces from Task A (summary: ${JSON.stringify(signDesign)}); Read print/renders/*.png.
Export tool: ${JSON.stringify(tool)}
print/social/telegram/ may already hold an unfinished draft from an interrupted run — review it critically and build on it or replace it.
GOAL: Telegram channel images per marketing/telegram-plan.md §5 and §6, TEAL marketing identity (GM-042), one final design each:
 1) channel + contact-account photo 1024x1024 (circle crop safe) from brand/logo/v1.0.0/social/avatar-white-on-teal-1024.png (or its SVG);
 2) pinned-message image 1280x720 from brand/logo/v1.0.0/horizontal-teal.svg (or the white variant on a teal field per USAGE.md) with exactly two lines: «منيو، تقييم، واي فاي بلمسة» and «رد خلال ساعة على الواتساب أو التليجرام، من 9 الصبح لين 11 الليل»;
 3) square 1080x1080 from brand/logo/v1.0.0/stacked-teal.svg (or stacked-white on teal);
 4) one image for each first post m1..m6 in §5 (menu, Google review, Wi-Fi, guest guide, check-out, maintenance) — short Arabic headline taken from that post's approved text, a clean product visual in the Task A language (you may place the Task A PNGs from print/renders/ in the scene; they carry the fictional client identity, that's fine), our teal logo small. Choose the post size with a source or «غير مؤكد».
No prices on any image (§6), no Google logo/G/stars, Arabic RTL, no publishing. Official platform sizes unconfirmed → «غير مؤكد».
BUILD as HTML pages sized in px in print/social/telegram/ (index.html?img=<name>, each image one .p-sheet with data-sign telegram-<name>), render with node print/export.cjs ... --social into print/social/telegram/png/. Do NOT edit print/dims.js, print/print.*, print/stand/*, print/host-signs/*, print/renders/*, print/README.md, print/export.cjs (others run in parallel; if the tool truly fails, report it). Record external assets in print/CREDITS.md only by appending (re-read before writing).
Notes to ${T}/ad-creative-telegram.md: sizes with sources, copy table with sources, files, «غير مؤكد».`

async function b2bFinish() {
  const ph = 'B2B'
  const [v, t] = await parallel([
    () => agent(DESIGNER_B, { label: 'print-designer: A5 visit sheets', phase: ph, schema: DESIGN_SCHEMA, effort: E }),
    () => agent(CREATIVE_B, { label: 'ad-creative: Telegram images', phase: ph, schema: DESIGN_SCHEMA, effort: E }),
  ])
  let design = { visitSheets: v, telegram: t }
  design = await reviewApply(B2B_RULES, design, 'visit sheets + telegram', ph, B_ROLES)
  let exp = await agent(exportPrompt(B2B_RULES, design, tool, 'visit sheets + telegram'), { label: 'ad-creative: export (b2b)', phase: ph, schema: EXPORT_SCHEMA, effort: E })
  let pre = await agent(prepressPrompt(B2B_RULES, design, exp, 1, 'visit sheets + telegram'), { label: 'print-prepress (b2b)', phase: ph, schema: PRE_SCHEMA, effort: E })
  let rounds = 1
  if (pre && pre.verdict === 'FAIL') {
    log(`b2b: prepress FAIL, ${pre.mustFix.length} must-fix → fix round`)
    const res = await parallel(B_ROLES.map(r => () => agent(fixPrompt(B2B_RULES, r.role, r.design(design), pre, exp), { label: `${r.role.split(' ')[0]}: fix (b2b)`, phase: ph, schema: DESIGN_SCHEMA, effort: E })))
    design = merge(design, B_ROLES, res)
    design = await reviewApply(B2B_RULES, design, 'visit sheets + telegram (after fixes)', ph, B_ROLES)
    exp = await agent(exportPrompt(B2B_RULES, design, tool, 'visit sheets + telegram re-export'), { label: 'ad-creative: re-export (b2b)', phase: ph, schema: EXPORT_SCHEMA, effort: E })
    pre = await agent(prepressPrompt(B2B_RULES, design, exp, 2, 'visit sheets + telegram'), { label: 'print-prepress: recheck (b2b)', phase: ph, schema: PRE_SCHEMA, effort: E })
    rounds = 2
    if (pre && pre.verdict === 'FAIL') {
      log(`b2b: FAIL in round 2 (${pre.mustFix.length} must-fix) → round 3`)
      const res3 = await parallel(B_ROLES.map(r => () => agent(fixPrompt(B2B_RULES, r.role, r.design(design), pre, exp), { label: `${r.role.split(' ')[0]}: fix round 3 (b2b)`, phase: ph, schema: DESIGN_SCHEMA, effort: E })))
      design = merge(design, B_ROLES, res3)
      design = await reviewApply(B2B_RULES, design, 'visit sheets + telegram (round 3)', ph, B_ROLES)
      exp = await agent(exportPrompt(B2B_RULES, design, tool, 'visit sheets + telegram re-export round 3'), { label: 'ad-creative: re-export round 3 (b2b)', phase: ph, schema: EXPORT_SCHEMA, effort: E })
      pre = await agent(prepressPrompt(B2B_RULES, design, exp, 3, 'visit sheets + telegram'), { label: 'print-prepress: recheck round 3 (b2b)', phase: ph, schema: PRE_SCHEMA, effort: E })
      rounds = 3
      if (pre && pre.verdict === 'FAIL') log('b2b: still FAIL after round 3 — reported')
    }
  }
  return { design, exp, pre, rounds }
}

// signs polish and B2B run side by side (disjoint files)
const [A, B] = await parallel([() => signsFinish(), () => b2bFinish()])
return { tool, signs: A, b2b: B }
