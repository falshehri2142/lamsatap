# MODIFIED (Apache-2.0 §4(b))

These files are copies of `plugin/skills/impeccable/reference/` from https://github.com/pbakaus/impeccable at commit `909726c7e8be484daba481873640f64aa24f62dc` (Apache License 2.0, Copyright 2025 Paul Bakaus; see `LICENSE`). LamsaTap changed them on 2026-09-30. Every changed file starts with a one-line notice that points here. Line numbers below refer to the upstream file at that commit.

Common change in every edited file: added the notice line at the top. The reasons for all edits: the upstream text routes agents to `/impeccable <command>` (which loads a skill whose setup runs `scripts/impeccable` and downloads a remote binary), to the `impeccable` launcher (`detect`, `critique-storage`, `context`), to live mode, and to `new-work.md` / `init.md` (network concept-seed call, telemetry, paid image generation). None of those are installed. Content that only teaches design craft is unchanged.

## animate.md
- line 11: removed the native route (ios.md/android.md are not installed; the site is web only).
- line 89: `/impeccable polish` handoff -> local polish.md.

## craft-floor.md
- line 3: removed the sentence about an active "design hook" (no hooks are installed here).

## overdrive.md
- Not modified. Verbatim copy (no launcher calls or handoffs). Local rules in SOURCE.md apply to it.

## delight.md
- line 70: `/impeccable polish` handoff -> local polish.md.

## polish.md
- lines 29-35: removed the `scripts/impeccable critique-storage latest` step (launcher; downloads a remote binary).
- line 95: replaced "`impeccable context` and hooks" (the launcher command that downloads the binary) with the project's own QA checks.
- lines 99-105: removed the `critique-storage close` step (launcher).

## audit.md
- line 5: removed the native route (audit.native.md is not installed).
- line 60: "Run the bundled detector" -> manual check.
- line 80: dropped "detector findings".
- line 103: `/impeccable <cmd>` list -> local reference files (onboard.md is not installed, so it is dropped).
- lines 117-120: command placeholders -> file placeholders.
- line 122: `/impeccable <cmd>` list -> local reference files.
- lines 126-128: "Re-run `/impeccable audit`" -> re-run audit.md.

## critique-rubrics.md (from `critique.md`)
- kept only lines 277-806 of critique.md; lines 1-275 (detector, live-server, detect.js injection, critique-storage, mandatory sub-agents, AskUserQuestion gate) are excluded. Intro sentence rewritten to say so.
- line 790: `impeccable init` Design Context -> the project's own audience sources.

## typeset.md
- line 9: removed the native route.
- line 11: new-work.md route -> website/DESIGN.md and GM decision.
- lines 24-30: `scripts/impeccable detect` -> manual grep and DevTools scan.
- lines 72-80: removed "Live-mode signature params" (live mode is not installed).
- line 70: `/impeccable polish` handoff -> local polish.md.

## layout.md
- line 9: removed the native route.
- line 11: new-work.md route -> website/DESIGN.md and GM decision.
- lines 25-31: `scripts/impeccable detect` -> manual grep and DevTools scan.
- lines 76-84: removed "Live-mode signature params".
- line 74: `/impeccable polish` handoff -> local polish.md.

## colorize.md
- line 23: new-work.md route -> website/DESIGN.md and GM decision.
- lines 78-86: removed "Live-mode signature params".
- line 76: `/impeccable polish` handoff -> local polish.md.

## bolder.md
- line 3: removed the new-work.md route.
- line 33: `/impeccable polish` handoff -> local polish.md.

## quieter.md
- last line: `/impeccable polish` handoff -> local polish.md.

## adapt.md
- line 5: removed the native route (adapt.native.md is not installed).
- line 197: `/impeccable polish` handoff -> local polish.md.

## harden.md
- last line: `/impeccable polish` handoff -> local polish.md.

## optimize.md
- last line: `/impeccable polish` handoff -> local polish.md.

## clarify.md
- last line: `/impeccable polish` handoff -> local polish.md.

## distill.md
- last line: `/impeccable polish` handoff -> local polish.md.

## document.md
- line 1: named the project file website/DESIGN.md.
- line 3: external spec link kept as plain text with "do not fetch".
- line 7: removed the live-panel mention.
- line 47: sidecar -> prose sections.
- line 66: removed the new-work reference.
- line 71: ask the GM instead of the AskUserQuestion tool.
- lines 73-78: removed "Two paths" (Seed mode routes into the excluded init.md and new-work.md). Scan mode only.
- line 107: removed the live-panel mention.
- line 112: sidecar -> Components prose.
- lines 251-340: removed Step 4b (writes an .impeccable/design.json sidecar into the project for the live panel).
- line 345: removed the sidecar/live-panel line.
- lines 350-390: removed Seed mode (links init.md and new-work.md, PRODUCT.md interview, `/impeccable document`).
- line 416: sidecar -> prose sections.

## shape.md
- line 35: removed the new-work reference.
- line 39 (Phase 2): new-work.md route -> website/DESIGN.md and GM decision.

## operate.md
- line 3: "SKILL.md's modes" -> the visitor modes (the upstream SKILL.md is not installed).

## degraded/documenter.md
- line 1: removed the build comment.
- line 2: replaced the role-swap preamble ("adopt only this file's instructions") with a reference-only note.
- line 7: pointed at the edited local document.md.
- line 11: removed the new-work direction contract and PRODUCT.md from the input contract.
- line 15: removed the sidecar from the spec summary.
- line 16: direction contract -> website/DESIGN.md and GM decisions.
- line 17: no sidecar.
- line 19: added that website/DESIGN.md and GM-021 override the craft-floor bans.

## Not copied
All other files of the repository. The list and the reasons are in SOURCE.md.
