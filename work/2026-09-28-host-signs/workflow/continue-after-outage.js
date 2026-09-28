export const meta = {
  name: 'print-continue-after-outage',
  description: 'Continue the print run after the internet outage: signs round 3 and B2B fix round, each with impeccable review, export and prepress',
  phases: [
    { title: 'Signs round 3', detail: 'fix → impeccable → export → prepress' },
    { title: 'B2B round 2', detail: 'fix → impeccable → export → prepress (+ round 3 if needed)' },
  ],
}

const T = 'work/2026-09-28-host-signs'
const S = `${T}/workflow/state.json`
const E = 'max'
const BASE = `
You work in the current git worktree (project LamsaTap / لمسة تاب). Do NOT commit, push, publish, order anything, or edit files outside the paths named for your step.
This CONTINUES an interrupted run (the internet dropped at ~08:06; some agent may have left partial edits — check the files, don't assume). The full state of the run (every agent's last output: designs, export results, prepress verdicts and mustFix lists, impeccable reviews) is in ${S} — read the keys named below.
Brief: ${T}/goal.md (with the owner addendum). Department skill: .claude/skills/print-studio/SKILL.md (GM-030/051/059: ultracode, max effort, design skills). Decisions: management/decision-register.md (GM-003, GM-017, GM-021, GM-023, GM-025, GM-027, GM-042, GM-045, GM-046, GM-047, GM-050, GM-051, GM-059).
Tools to reuse (GM-057, tool first): print/export.cjs (see print/EXPORT.md), print/print.js, print/dims.js, $HOME/.claude/tools/ui-probe.cjs.
DESIGN SKILLS (GM-059, mandatory): invoke the Skill tool for "frontend-design" and "ui-ux-pro-max" before fixing layout/typography, and "canvas-design" for visual compositions. Apply work/2026-09-28-frontend-rules/rules.md where it fits print. GM decisions override skill defaults.
Every copy line needs a project source; unconfirmed = «غير مؤكد». Notes in plain short Saudi Arabic, paths in Latin letters.`

const SIGN_RULES = `
SCOPE = Task A (client hardware): print/host-signs/*, print/stand/*, print/renders/* (+SIZES.md), print/dims.js, print/print.*, print/README.md, print/CREDITS.md. Client identity only (no LamsaTap logo/saffron/colours; «بواسطة لمسة تاب» only with poweredBy:true); solid touch dot, no waves; fake QR (example.com); no «إشعار فوري للمضيف»; host phone on the emergency stand must BLOCK export (GM-003) until a GM decision; engineering: engineering/stand-dimensions.md + host-unit-and-stand-alternatives.md (no metal near the chip).`

const B2B_RULES = `
SCOPE = Task B (OUR B2B materials): print/visit-sheet/* (A5 visit sheets, BLACK logo) and print/social/telegram/* (TEAL marketing logo), per GM-042 and brand/logo/v1.0.0/USAGE.md; official logo files unmodified, no ®; prices exactly as services/pricing.md with its tax rule; full response promise «رد خلال ساعة على الواتساب أو التليجرام، من 9 الصبح لين 11 الليل»; no prices on Telegram images; no Google logo/G/stars; placeholder contacts and fake QR; no «ادفع أونلاين» (GM-002). Shared files (print/export.cjs, print/EXPORT.md, print/CREDITS.md): edit only if a mustFix names them; re-read right before writing (another agent runs in parallel).`

const DESIGN = { type: 'object', properties: { decisions: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, uncertain: { type: 'array', items: { type: 'string' } } }, required: ['decisions', 'files', 'uncertain'] }
const REVIEW = { type: 'object', properties: { verdict: { type: 'string' }, fixes: { type: 'array', items: { type: 'object', properties: { piece: { type: 'string' }, owner: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' }, evidence: { type: 'string' } }, required: ['piece', 'owner', 'problem', 'fix', 'evidence'] } } }, required: ['verdict', 'fixes'] }
const EXPORT = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } }, visualIssues: { type: 'array', items: { type: 'string' } } }, required: ['files', 'visualIssues'] }
const PRE = { type: 'object', properties: { verdict: { type: 'string', enum: ['PASS', 'FAIL'] }, mustFix: { type: 'array', items: { type: 'string' } }, openForOwner: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' } }, required: ['verdict', 'mustFix', 'openForOwner', 'summary'] }

const fix = (rules, role, what) => `${BASE}${rules}
ROLE: ${role}. Read .claude/agents/${role.split(' ')[0]}.md.
${what}
Fix ALL items that belong to your role in the files (if one is wrong, prove it with evidence instead). Re-render with a headless browser and LOOK. Add a "إصلاحات (بعد الانقطاع)" section to your notes in ${T}/. Return a short summary.`

const review = (rules, scope) => `${BASE}${rules}
ROLE: impeccable finish review (GM-059), scope "${scope}", BEFORE prepress. Do NOT edit project files; scratch only under ${T}/review-scratch/.
Direction contract: ${T}/goal.md + the rules above; comp to beat: brand-source/real-work/2026-09-28-awa-home-checkout-sign.jpg; quality bar: GM-021 + ui-ux-pro-max quick reference + work/2026-09-28-frontend-rules/rules.md. Render fresh with print/export.cjs into ${T}/review-scratch/ and Read the images. Return ORDERED MATERIAL fixes only (piece, owner role print-designer or ad-creative, problem, fix, evidence). Append a short "مراجعة impeccable — ${scope} (بعد الانقطاع)" section to ${T}/impeccable-review.md via Bash.`

const exportStep = (rules, scope) => `${BASE}${rules}
ROLE: ad-creative (مصمم الإعلانات), export step "${scope}". Read .claude/agents/ad-creative.md.
Re-export EVERY piece in scope with print/export.cjs exactly as documented in print/EXPORT.md and the scope README(s): print pieces → PDF with bleed + PNG @300dpi + website PNG @2x; signs also → print/renders/ (checkout-sign, wifi-stand, emergency-stand, guest-guide-stand, restaurant-stand = review face) and re-measure print/renders/SIZES.md from the files; social → exact px PNGs. Remove stale exports. Read every website/social PNG and list concrete visual issues. Append a short log to ${T}/ad-creative.md.`

const prepress = (rules, scope, round) => `${BASE}${rules}
ROLE: print-prepress (فاحص ما قبل الطباعة). Read .claude/agents/print-prepress.md and follow it strictly. Adversarial; measure yourself with real tools; never trust summaries.
Scope "${scope}", round ${round}. First re-verify EVERY mustFix from the previous round (in ${S}) is really fixed, then run the full checklist from your earlier rounds in ${T}/print-prepress.md (sizes/MediaBox/TrimBox/BleedBox, pixel sizes, alpha, safe area, min 9pt, Arabic dots, geometry vs dims, identity, copy sources and forbidden claims, prices, docs match reality, CREDITS). CMYK and anything needing a physical sample → «غير مؤكد» + openForOwner, never a fake PASS.
Append "جولة ${round} — ${scope}" PASS/FAIL table to ${T}/print-prepress.md. verdict=FAIL if any mustFix remains; mustFix concrete and fixable in files.`

async function reviewApply(rules, scope, ph, roles) {
  let rev = null
  try { rev = await agent(review(rules, scope), { label: `impeccable (${scope})`, phase: ph, agentType: 'impeccable-finish-reviewer', schema: REVIEW, effort: E }) } catch (e) { log(`impeccable agent type failed: ${e}`) }
  if (!rev) rev = await agent(review(rules, scope) + '\nInvoke the Skill tool "impeccable" (critique lens).', { label: `impeccable via skill (${scope})`, phase: ph, schema: REVIEW, effort: E })
  if (!rev || !rev.fixes || !rev.fixes.length) return rev
  log(`${scope}: impeccable → ${rev.fixes.length} fixes`)
  await parallel(roles.map(role => () => agent(fix(rules, role, `Apply the impeccable review fixes whose owner is your role: ${JSON.stringify(rev.fixes)}`), { label: `${role.split(' ')[0]}: apply impeccable (${scope})`, phase: ph, schema: DESIGN, effort: E })))
  return rev
}

async function round(rules, scope, ph, roles, n, fixWhat) {
  await parallel(roles.map(role => () => agent(fix(rules, role, fixWhat), { label: `${role.split(' ')[0]}: fix r${n} (${scope})`, phase: ph, schema: DESIGN, effort: E })))
  const rev = await reviewApply(rules, `${scope} r${n}`, ph, roles)
  const exp = await agent(exportStep(rules, `${scope} r${n}`), { label: `ad-creative: export r${n} (${scope})`, phase: ph, schema: EXPORT, effort: E })
  const pre = await agent(prepress(rules, scope, n), { label: `print-prepress r${n} (${scope})`, phase: ph, schema: PRE, effort: E })
  return { rev, exp, pre }
}

async function signs() {
  const ph = 'Signs round 3'
  let r = await round(SIGN_RULES, 'signs', ph, ['print-designer (مصمم الطباعة)'], 3,
    `print-prepress round 2 rejected the signs: see ${S} key signs.prepressRound2.mustFix (3 items: host-phone export block in signs.js + README/print-designer notes; README flood-white wording for the acrylic; EXPORT.md/export.cjs help text about bleed vs crop marks — NOTE the export.cjs/EXPORT.md item may already have been fixed by ad-creative; verify first and do not undo).`)
  if (r.pre && r.pre.verdict === 'FAIL') {
    log(`signs: FAIL r3 (${r.pre.mustFix.length}) → r4`)
    r = await round(SIGN_RULES, 'signs', ph, ['print-designer (مصمم الطباعة)'], 4, `print-prepress round 3 mustFix: ${JSON.stringify(r.pre.mustFix)}; visual issues: ${JSON.stringify((r.exp && r.exp.visualIssues) || [])}`)
  }
  return r
}

async function b2b() {
  const ph = 'B2B round 2'
  const roles = ['print-designer (مصمم الطباعة)']
  let r = await round(B2B_RULES, 'visit sheets + telegram', ph, roles, 2,
    `print-prepress round 1 rejected: see ${S} key b2b.prepressRound1.mustFix (4 items on print/visit-sheet/* CSS specificity and unsourced mm values, the README export command, and EXPORT.md/export.cjs help text). ad-creative already finished its share (key b2b.telegramFixDone) — do not redo it. Your own earlier fix attempt was cut by the outage around 07:46–08:06 (visit.css, visit.js, content.js, visit-dims.js, README.md, CREDITS.md, print-designer-b2b.md were touched): check what is done and finish the rest.`)
  if (r.pre && r.pre.verdict === 'FAIL') {
    log(`b2b: FAIL r2 (${r.pre.mustFix.length}) → r3`)
    r = await round(B2B_RULES, 'visit sheets + telegram', ph, ['print-designer (مصمم الطباعة)', 'ad-creative (مصمم الإعلانات)'], 3, `print-prepress round 2 mustFix (fix the ones for your pieces): ${JSON.stringify(r.pre.mustFix)}; visual issues: ${JSON.stringify((r.exp && r.exp.visualIssues) || [])}`)
  }
  return r
}

const [A, B] = await parallel([() => signs(), () => b2b()])
return { signs: A, b2b: B }
