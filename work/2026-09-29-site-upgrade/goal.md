# Website upgrade — 2026-09-29

Owner request: inspect the existing NFC website and deliver a substantial improvement.

Scope: homepage, restaurants and hosts marketing pages, shared responsive navigation, motion behavior and verification. Preserve product truth, approved brand assets, prices, local static stack, demos, and configuration. Preparation stays local.

Direction: warm product studio with immediately visible content, original product photographs, direct demo actions, clear audience selection, and practical section navigation. Home keeps the original QR assembly within a product plaque, without scroll pinning or hiding the header brand. Audience heroes opt out of their old scroll-gated expansion.

Implemented:
- Redesigned home hero, audience cards, setup sequence and contact composition.
- Rebuilt audience heroes, added section links and refined demos, story steps and pricing layouts.
- Fixed shared 320px nav overflow and live reduced-motion response in price controls.
- Fixed release QR validation to allow the existing approved demo routes; added a guard around build output cleanup.
- Added revisioned CSS/JS URLs for refreshed local previews.

Evidence:
- `qa-notes.md`, `qa-browser/`, `qa-browser-final/`: runtime, keyboard and responsive verification, including no-JS/reduced-motion/failure fallbacks.
- `audience.md`: audience implementation notes and screenshot corrections.
- `bundle-size.md`: before/after size gate measurements.
- `../../website/DESIGN.md`: delivered design and implementation context.

No publication, external messaging, paid generation, framework changes, or new dependencies were required.
