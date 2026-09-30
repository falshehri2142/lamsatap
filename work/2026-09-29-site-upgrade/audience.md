# Audience pages — 2026-09-29

## Direction
Warm Arabic product studio: the real service proposition and a usable demonstration appear immediately beside a generous product photograph. Readex Pro, LT Latin, ink, sand, white, approved audience accent details and existing photography remain the visual vocabulary.

## Changed
- `website/restaurants/index.html`
- `website/hosts/index.html`
- `website/assets/restaurants.css`
- `website/assets/hosts.css`

Both heroes now use a readable split composition with `data-expand-inline`, an audience context, one direct demo action, a price-section link and the approved trial reassurance. All legacy media data hooks remain. Parent updates shared motion initialization to exclude this inline treatment from the old pinned expansion.

Contact, pricing, Telegram notices, renewal terms, plan controls and demo destinations remain in their existing lower-page sections. No prices, logo assets, configuration or product photography changed. A compact section navigation gives direct access to the story, live demo, plans and FAQ; the missing host demo anchor was added.

Supporting content uses shorter problem sections, numbered steps that remain meaningful without animation, open demo rows, and subtle desktop price-panel differentiation.

## Verification
- Read MASTER and both page overrides, GM-055 rules, authoritative service prices and frontend-design instructions.
- Tried ui-ux-pro-max design-system/domain search. Python missing from PATH; explicit Python312 executable denied by sandbox. Parent owns central skill execution; authoritative local system takes precedence over generic generated output.
- Source checks pass: one H1 per page; seven sections each; no duplicate IDs; all fragment links resolve; existing price radiogroups retained; `git diff --check` clean.
- First rendered comparison: read `qa-browser/restaurants-1440.png`, `restaurants-390.png`, `hosts-1440.png` and `hosts-390.png`. Desktop photo height is 600px with readable 64px maximum H1 and actions in the first viewport. At 390px the photo began near y=680 due to repeated service metadata.
- Refinement after first comparison: mobile hero padding 40→32px, context gap 24→16px, section gap 32→24px; redundant service list hidden below 768px. Caption's `dir=ltr` metadata uses explicit physical auto margin so it aligns with the photo's left edge.
- Second screenshot and interaction checks are coordinated with the parent QA agent, who owns `qa-interactions.cjs` and its reports.

## Remaining
No publication or live contact submission performed. Existing blank product artwork is retained as instructed in the project decisions.
