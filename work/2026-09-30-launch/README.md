# LamsaTap launch — 2026-09-30

The owner explicitly requested publication on `LAMSATAP.COM`, then registered it in their Cloudflare account during this session. Payment and account sign-in were completed by the owner.

## Prepared release

- `website/config.js` and `systems/shortlinks/config.json` target `https://lamsatap.com`.
- All generated site QR artwork rebuilt for the production domain.
- Empty commercial registration is a hidden, configurable footer field, not a visible placeholder.
- Shared config/application scripts have a launch cache version.
- Added branded `404.html`, `robots.txt` and a three-page `sitemap.xml`.
- Build output is only `dist/`, packaged as `lamsatap-site.zip`. No repository root, `.env`, customer files, or internal Markdown included.
- Existing vendor JavaScript license headers remain intact. The excluded vendor Markdown is internal download documentation.

## Validation

`node tools/build-home-minis.cjs` and `node tools/build-dist.cjs` pass. The release has 150 files and its ZIP is approximately 3.1 MB. JavaScript syntax and QR destination checks are strict.

The previous uniform 100 KiB raw / 50 KiB gzip budget was incompatible with the approved marketing animation stack: GSAP and ScrollTrigger alone are 114.8 KiB raw. The three exact marketing routes now have an explicit 350 KiB raw / 110 KiB gzip budget. All other pages retain 100/50 KiB. This changes the budget, not the measured size: home 275.5/89.5 KiB, hosts 310.5/99.6 KiB, restaurants 326.9/101.8 KiB.

## Published

- Cloudflare Pages project: `lamsatap`, production URL `https://lamsatap.pages.dev/`.
- Owner-registered domains `lamsatap.com` and `www.lamsatap.com` are Active with SSL enabled in the dashboard. Both CNAME records point to `lamsatap.pages.dev`.
- Upload confirmed all 150 files; deployment success confirmed by the provider.
- Standard HTTPS requests (without forced DNS or disabling TLS checks) returned 200 for apex, www, restaurants, hosts and the rental-guide demo. A nonexistent route returned 404.
- The downloaded production homepage exactly matches `dist/index.html` by SHA-256. Release ZIP SHA-256: `C646DBE28EA5C7D198EA437EBA63D91B59695005B01274659240DCD4D9304352`.
- Public browser checks on pages.dev confirmed working images, production canonical URLs and QR destinations, with no restaurant console errors.
- The in-app browser initially retained a negative DNS result immediately after registration; OS HTTPS checks subsequently succeeded normally.
- A fresh in-app browser tab subsequently loaded `https://lamsatap.com/` successfully as well.

## WhatsApp follow-up

Owner also requested WhatsApp API. They had neither a dedicated company number nor Meta Business account. Created the LamsaTap business portfolio using the business email explicitly supplied by the owner. Meta confirmed creation and requested email verification; owner must complete that link. Preferred integration is direct Meta Cloud API with the existing n8n workflows; no paid provider was selected or purchased. Number, WABA/Phone Number ID, and credentials remain to be configured after owner setup.
