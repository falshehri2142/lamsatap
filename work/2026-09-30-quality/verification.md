# Website quality pass — 2026-09-30

Scope: the existing Arabic marketing home, restaurants and hosts pages. Preserve approved identity, pricing, contact destinations and symbol motion.

Changes:
- Constrained WhatsApp and Telegram actions to pricing/sidebar card widths. At 1024px, FAQ buttons previously overflowed a 288px card; both now fit its 222px content width.
- Improved small-screen navigation and supporting copy. Corrected a reproduced 320px header overflow (document width 354px before; 305px available content after, including browser scrollbar).
- Reduced small-screen pricing switch padding while retaining 44px minimum controls. RTL keyboard switching works, and modified shortcuts remain available to the browser.
- Reveal each price control only after successful initialization; otherwise retain both static prices.
- Reduced audience closing sections to 48px/64px vertical padding and footer padding to 32px.
- Preloaded the existing Readex font, corrected restaurant responsive image sizes and structured-data production URLs.
- Removed three unused scene resources from each audience page: three fewer requests, 5,671 production bytes / 2,256 gzip bytes per cold audience visit.

Validation:
- Independent HTML and CSS/JS review: no blocking defects. No missing referenced assets; JSON-LD parses; one h1 and one font preload per marketing page.
- 320px home and restaurant: header/navigation fit, no horizontal document overflow; restaurant first-year/renewal radio responds to click and RTL ArrowRight.
- 390px hosts: annual prices remain 544.5 / 434.5; active selection and fallback visibility correct; no horizontal overflow.
- 1024px restaurant and hosts FAQ: both contact buttons stay within the card; matching widths.
- No warnings/errors reported in checked local browser session.
- Production build passes JS syntax, QR destinations and existing size budgets. Marketing gzip: home 89.9KiB, restaurants 99.9KiB, hosts 97.7KiB (excludes images/fonts).
- Motion source unchanged: mobile pin disabled and scrub synchronous; desktop pin/smoothing preserved.

Phone checks use a browser viewport, not physical hardware. Responsive image candidate selection may reuse already-cached larger images. Deployment evidence recorded after live verification below.

Deployment: Cloudflare accepted all 150 files and confirmed Success. Live restaurant page serves site.css, restaurants.css and app.js at quality-20260930-7. At 1024px both contact buttons measure 220px inside the 222px sidebar content area, with one font preload. Live closing/footer screenshot saved as live-quality-faq.png (shows the compact closing section).

Live home at 390x844: end jump reached scrollY 3353 with flying clone hidden; return reached scrollY 0 with source opacity 1 and flying clone hidden. No horizontal overflow. Approved motion version mobile-sync-20260930-6 retained. Saved live-quality-mobile.png. Temporary viewport override reset and deployment tab closed.
