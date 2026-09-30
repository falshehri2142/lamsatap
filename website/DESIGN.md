# LamsaTap — product studio

Updated 2026-09-29 for the owner's request to improve the existing website.

## Product and visual direction

Arabic-first NFC and QR services for restaurants, cafés, and short-stay hosts in Jeddah. The marketing pages help an owner understand the physical product, open an honest demo, find the relevant plan, and contact the configured company channel.

The visual direction is a warm, light product studio: large Readex Pro headlines, original hospitality photographs, ink actions, sand surfaces, and generous whitespace. Keep the original logo, local fonts, and approved pricing. No invented testimonials, adoption metrics, or commercial claims.

## Page composition

- Home: readable promise and immediate actions next to a product photograph, with the existing real QR in an inset white plaque. Then four practical benefits, two audience choices, three setup steps, contact, and footer. No prices on home.
- Audience pages: readable headline, direct demo action, price link, product photo, then section navigation, use cases, the existing story, live demos, the original plans and FAQ, contact, and footer.
- The `data-expand-inline` marker opts the new audience heroes out of the old scroll-pinned expansion. Content and actions are present from the first frame. The lower story and scan animations remain.
- Home retains the QR assembly sequence but does not dock the QR/logo into the header or pin the hero. The brand is always visible in the header.

## Implementation

Static HTML/CSS/JS, no new dependencies or external asset requests. Shared primitives remain in `assets/site.css`; page layout lives in `home.css`, `restaurants.css`, and `hosts.css`. Brand tokens and logo artwork are unchanged. Inline icons follow the existing 1.75px rounded stroke system.

Layout spacing uses the existing token scale. The 1200px content measure, 20/32/48px gutters, white/ink/sand palette, and audience accent icon colors remain. Product photos keep their native coloring. Rounded corners on the home photograph and audience doors echo the existing brand geometry.

## Behavior and resilience

- Local demo links work without JavaScript; audience pricing retains its static alternate-price fallback.
- Navigation wraps below 768px instead of overflowing narrow RTL viewports.
- Price controls preserve RTL keyboard navigation and read the current reduced-motion preference at each change.
- Reduced motion and failed GSAP loading retain readable content.
- The existing `config.js` owns contact channels and deployment settings. QR payloads still use its placeholder domain until launch.

## Verification

Evidence and reproducible QA: `../work/2026-09-29-site-upgrade/`.
The mechanical design detector's cream palette warning is an intentional match to the approved brand. Its section-padding warnings require rendered verification: these sections have nested padded containers and logical `padding-block`/`padding-inline`, which the heuristic does not fully resolve.

The release checker still enforces its original size limits. See `bundle-size.md` in the work directory for the before/after measurements; do not raise those limits to conceal an over-budget result.
