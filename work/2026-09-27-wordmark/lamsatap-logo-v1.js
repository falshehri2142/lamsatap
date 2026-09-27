export const meta = {
  name: 'lamsatap-logo-v1',
  description: 'Ultracode build of the LamsaTap logo v1.0.0 from GM-033: two redraws, judged, refined to 9/10, exported and verified',
  phases: [
    { title: 'Build', detail: 'two independent custom-path redraws' },
    { title: 'Judge', detail: 'art director + QA score each candidate' },
    { title: 'Refine', detail: 'fix the winner until 9/10 and QA pass' },
    { title: 'Export', detail: 'all versions, v1.0.0 manifest, brand README' },
    { title: 'Verify', detail: 'UI trio adversarial check' },
  ],
}

const ROOT = 'C:\\Users\\TechTroniX\\Desktop\\NFC'
const CTX = `
You are working on the LamsaTap (لمسة تاب) logo. Repository root: ${ROOT} (write ONLY inside this root; never write in ${ROOT}\\.claude\\worktrees\\ — that is another team's copy, read-only).
AUTHORITATIVE BRIEF: ${ROOT}\\work\\2026-09-27-wordmark\\decision.md (GM-033). Read it fully first; its numbers and colour table rule.
Owner-approved reference: ${ROOT}\\brand-source\\owner-logo-2026-09-27.png — four rounded-corner pieces whose negative space forms a 4-point star, above "LAMSATAP" in a bold rounded geometric caps, "SINCE 2026" below. Keep this concept; improve craft only.
Approved proof of the idea (approximate, TAP's A is distorted): ${ROOT}\\work\\2026-09-27-wordmark\\proof-weight-step-light.png.
Key rules: ENGLISH ONLY (no Arabic anywhere). LAMSATAP is ONE word, no space/dot/separator; LAMSA heavy (stem 0.30H), TAP same skeletons lighter (stem 0.20H, ratio 0.62-0.68), seam A|T 0.20-0.23H. Light: symbol + LAMSA teal #0B7A75, TAP ink #14201F on sand #FAF7F2. Dark (ink bg): symbol + LAMSA sand #FAF7F2, TAP saffron #F2A93B. On teal: all white. One colour: weight carries the split. No gradients, no strokes (fill only), no transparency tricks, one merged path per colour, custom-drawn paths (NOT font outlines copied from a font file) — legal requirement for trademark filing.
Existing tools you may read/run: ${ROOT}\\brand\\src\\ (build_logo.py, export_png.py, check_logo.py), fonts in ${ROOT}\\brand\\fonts\\. Python with PIL and fontTools is installed; cairosvg is NOT. To SEE an SVG, render it to PNG (e.g. node "%USERPROFILE%\\.claude\\tools\\ui-probe.cjs" on a small local HTML page embedding the SVG, or write a small rasteriser) and Read the PNG yourself. Never judge a file you have not looked at.
Style: American craft (Square/Stripe/Airbnb precision), Saudi company. Be exact, no filler.`

const BUILD = {
  type: 'object',
  properties: {
    folder: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    previews: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['folder', 'files', 'previews', 'summary'],
}
const JUDGE = {
  type: 'object',
  properties: {
    score: { type: 'number', description: '0-10' },
    strengths: { type: 'array', items: { type: 'string' } },
    fixes: { type: 'array', items: { type: 'string' }, description: 'concrete, executable fixes' },
    verdict: { type: 'string' },
  },
  required: ['score', 'strengths', 'fixes', 'verdict'],
}
const QA = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    failures: { type: 'array', items: { type: 'string' } },
    measurements: { type: 'string' },
  },
  required: ['pass', 'failures', 'measurements'],
}

const CANDIDATES = [
  { key: 'a', label: 'redraw A · parametric geometry', approach: 'PARAMETRIC GEOMETRY: write a Python script build_logo_v1_a.py that constructs the symbol and every letter of LAMSATAP from the brief\'s parameters (H, stems, radii, widths, seam) as exact vector geometry (arcs + lines), outputs SVG paths. Precision first, then check it against the owner reference visually.' },
  { key: 'b', label: 'redraw B · optical craft', approach: 'OPTICAL CRAFT: match the owner reference proportions closely (measure it), then apply type-designer optical corrections — overshoots on round letters, A apex and crossbar balance, S spine weight, ink traps where TAP joins/corners would fill in when engraved, T crossbar tuning at the A|T seam so the weight change reads as deliberate. Script: build_logo_v1_b.py.' },
]

phase('Build')
const judged = await pipeline(
  CANDIDATES,
  (c) => agent(`${CTX}\n\nTASK: produce candidate ${c.key.toUpperCase()} of the logo.\nApproach — ${c.approach}\nIf the other team left a partial redraw in ${ROOT}\\.claude\\worktrees\\elegant-mclean-8e29f3\\brand or its work\\2026-09-27-wordmark folder, you may READ it as a starting point.\nWrite everything into ${ROOT}\\work\\2026-09-27-wordmark\\build\\cand-${c.key}\\ : the build script, symbol.svg, stacked-light.svg (with and without SINCE 2026), horizontal-light.svg, stacked-mono-black.svg, and preview PNGs: stacked-light at 1200px wide, horizontal at 600px, the symbol at 40px in a teal circle, and the wordmark at cap height 9px. Look at every preview. Return the folder, files, previews and a short summary with your measured values (stems, ratio, seam, counters in H).`,
    { label: c.label, phase: 'Build', agentType: 'web-brand', schema: BUILD }),
  (b, c) => b ? parallel([
    () => agent(`${CTX}\n\nYou are the ART DIRECTOR. Judge candidate ${c.key.toUpperCase()} in ${b.folder}. Look at every preview PNG (render more if needed) next to the owner reference. Score 0-10 on: fidelity to the owner's concept, premium craft (Square/Stripe level), quality of the LAMSA|TAP weight split (deliberate, same family, not a second font), balance of symbol vs word, and small-size behaviour. 9+ means ready to ship. Give concrete fixes (numbers where possible).`,
      { label: `art director · ${c.key}`, phase: 'Judge', agentType: 'web-art-director', schema: JUDGE }),
    () => agent(`${CTX}\n\nYou are QA. Measure candidate ${c.key.toUpperCase()} in ${b.folder} against EVERY number and colour in decision.md (stems 0.30H/0.20H, ratio 0.62-0.68, seam 0.20-0.23H, counters A>=0.18H S>=0.18H P>=0.20H, star tips not touching by a hairline, fill-only paths, no Arabic, no gradients, colours exact hex). Run or adapt ${ROOT}\\brand\\src\\check_logo.py where useful. Also check the 21mm horizontal engraving minimum (TAP stroke >= 0.30mm). Pass only if everything holds.`,
      { label: `QA · ${c.key}`, phase: 'Judge', agentType: 'web-qa', schema: QA }),
  ]).then(([art, qa]) => ({ key: c.key, build: b, art, qa })) : null,
)

const cands = judged.filter(Boolean).filter(j => j.art)
if (!cands.length) { log('No candidate survived the build stage.'); return { error: 'no candidates' } }
cands.sort((x, y) => (y.art.score + (y.qa && y.qa.pass ? 0.5 : 0)) - (x.art.score + (x.qa && x.qa.pass ? 0.5 : 0)))
const win = cands[0]
const lose = cands[1]
log(`Winner: candidate ${win.key.toUpperCase()} (art ${win.art.score}/10, QA ${win.qa && win.qa.pass ? 'pass' : 'fail'})` + (lose ? ` vs ${lose.key.toUpperCase()} (${lose.art.score}/10)` : ''))

phase('Refine')
let art = win.art, qa = win.qa, round = 0
let fixes = [...(art.fixes || []), ...((qa && qa.failures) || [])]
const graft = lose ? `Also graft these strengths from the other candidate (${lose.build.folder}) where they improve the result: ${(lose.art.strengths || []).join(' | ')}` : ''
while ((art.score < 9 || !(qa && qa.pass)) && round < 3) {
  round++
  await agent(`${CTX}\n\nREFINE round ${round}. Work in ${win.build.folder} (the winning candidate ${win.key.toUpperCase()}). Apply ALL of these fixes precisely:\n- ${fixes.join('\n- ')}\n${graft}\nRe-render all previews and look at them. Keep the owner's concept.`,
    { label: `refine r${round}`, phase: 'Refine', agentType: 'web-brand' })
  const res = await parallel([
    () => agent(`${CTX}\n\nART DIRECTOR re-score after refine round ${round}: candidate folder ${win.build.folder}. Same criteria, 0-10, 9+ = ship. Concrete remaining fixes only.`,
      { label: `art director r${round}`, phase: 'Refine', agentType: 'web-art-director', schema: JUDGE }),
    () => agent(`${CTX}\n\nQA re-check after refine round ${round}: ${win.build.folder}. Every number and colour in decision.md.`,
      { label: `QA r${round}`, phase: 'Refine', agentType: 'web-qa', schema: QA }),
  ])
  if (res[0]) art = res[0]
  if (res[1]) qa = res[1]
  fixes = [...(art.fixes || []), ...((qa && qa.failures) || [])]
  log(`Round ${round}: art ${art.score}/10, QA ${qa && qa.pass ? 'pass' : 'fail'}`)
}
if (art.score < 9 || !(qa && qa.pass)) log(`Stopped after ${round} refine rounds below target (art ${art.score}, QA ${qa && qa.pass}). Exporting best state and flagging.`)

phase('Export')
const exp = await agent(`${CTX}\n\nEXPORT v1.0.0 from the final candidate in ${win.build.folder}. Create ${ROOT}\\brand\\logo\\v1.0.0\\ with SVG (fill-only, one merged path per colour) for: symbol-light, symbol-dark, symbol-mono-black, symbol-mono-white; stacked-light, stacked-light-since2026, stacked-dark, stacked-teal (all white), stacked-mono-black, stacked-mono-white; horizontal-light, horizontal-dark, horizontal-teal, horizontal-mono-black, horizontal-mono-white; engrave-positive (one colour, for laser); avatar (sand symbol on teal #0B7A75 circle). PNG exports: avatar 512/180/32, stacked-light 1200 wide, horizontal-light 600 wide. favicon.svg + favicon.ico (16/32/48). Put the final build script at ${ROOT}\\brand\\src\\build_logo_v1.py. Write MANIFEST.txt with version 1.0.0 and SHA-256 of every file. Update ONLY the logo section of ${ROOT}\\brand\\README.md: which file where, the four colour pairs from decision.md, minimum sizes (horizontal 21mm engraved, stacked with SINCE 2026 >= 42mm/160px, wordmark hidden below H 9px), and that saffron appears only as TAP on dark. Do NOT delete the old logo files and do NOT touch website/. Look at every PNG you export.`,
  { label: 'export v1.0.0', phase: 'Export', agentType: 'web-brand', schema: BUILD })

phase('Verify')
const VERIFY = { type: 'object', properties: { lens: { type: 'string' }, pass: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } } }, required: ['lens', 'pass', 'issues'] }
const lenses = [
  { t: 'ui-fact-checker', p: 'Check every claim in brand/README.md logo section and MANIFEST.txt against the actual files in brand/logo/v1.0.0: colours are the exact hex values, English only, no gradients/strokes, hashes match, files listed exist, colour pairs match decision.md.' },
  { t: 'ui-reality-tester', p: 'Render every SVG in brand/logo/v1.0.0 at large and small sizes (avatar 40px, favicon 16/32, horizontal at cap height 9px, horizontal at 21mm@600dpi) and look at them. Report anything broken, clipped, blurred, touching hairlines, wrong colours, or LAMSA|TAP split not visible in one colour.' },
  { t: 'ui-skeptic', p: 'Try to REFUTE the claim "this logo v1.0.0 is premium, faithful to the owner\'s concept, and ready to ship". Compare with brand-source/owner-logo-2026-09-27.png and decision.md. Every objection needs evidence (file + what you saw).' },
]
const ver = await parallel(lenses.map(l => () => agent(`${CTX}\n\n${l.p} Files: ${ROOT}\\brand\\logo\\v1.0.0\\. Do not modify anything.`,
  { label: l.t, phase: 'Verify', agentType: l.t, schema: VERIFY })))
const issues = ver.filter(Boolean).filter(v => !v.pass).flatMap(v => v.issues.map(i => `[${v.lens}] ${i}`))

let finalFix = null
if (issues.length) {
  log(`Verification found ${issues.length} issue(s); running one fix pass.`)
  finalFix = await agent(`${CTX}\n\nFIX these verification issues in ${ROOT}\\brand\\logo\\v1.0.0 (and the build script / README / MANIFEST as needed; recompute SHA-256):\n- ${issues.join('\n- ')}\nLook at every file you change. Return what you fixed and anything you could not fix.`,
    { label: 'final fix', phase: 'Verify', agentType: 'web-brand' })
}

return {
  winner: win.key, candidates: cands.map(c => ({ key: c.key, art: c.art.score, qa: c.qa && c.qa.pass, folder: c.build.folder })),
  refineRounds: round, finalArt: art, finalQa: qa, export: exp, verify: ver.filter(Boolean), finalFix,
}
