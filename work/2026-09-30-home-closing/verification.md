# Home closing redesign — 2026-09-30

Replaced the isolated boxed contact panel and tall stacked footer with one light closing area. The heading, service location, response hours and contact action now form two columns on desktop and stack on mobile. Footer uses the native horizontal logo, compact navigation and a back-to-top link.

Preserved contact data attributes and hidden-channel behaviour. Extended `logo:foot` with an opt-in `layout="horizontal"` variant so regeneration preserves the home footer without changing other pages.

Verified in the localhost browser at widths 1280, 768 and 390 px:

- No horizontal page overflow.
- Telegram solo-mode button and disclosure use the available column width: 380 px desktop, 271.75 px tablet, 335 px mobile.
- Active contact URL remains `https://t.me/lamsatap_bot`; no message was sent.
- Hidden footer links remain hidden.
- Back-to-top link returns to the opening section.
- No warning/error console entries on the QA tab.
- `node --check tools/build-home-minis.cjs` and `git diff --check` pass (Git reports only existing line-ending normalization warnings).

Visual evidence: `closing-desktop.png`, `closing-mobile.png`.
