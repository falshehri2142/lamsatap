# Company-page bundle sizes

Measured against baseline HEAD `f43dc4478ebf12be88146b93308814ef362119f5`. Read-only calculation; no build, deletion, source rewriting or budget changes.

The build gate is **100 KiB raw / 50 KiB gzip** per page. These are sums of HTML plus its directly referenced local CSS/JS, using exactly the build comment stripping and independent gzip level 9 per resource; images and fonts are excluded. Query strings are removed as in the current build. Values below are KiB (1,024 bytes).

| Page | HEAD raw / gzip | Current raw / gzip | Change raw / gzip | HEAD gate | Current gate |
|---|---:|---:|---:|---|---|
| index.html | 258.6 / 87.2 | 258.3 / 85.3 | -0.3 / -2.0 | Fail | Fail |
| restaurants/index.html | 287.9 / 92.7 | 295.2 / 94.2 | +7.3 / +1.5 | Fail | Fail |
| hosts/index.html | 289.8 / 92.6 | 296.5 / 93.8 | +6.7 / +1.3 | Fail | Fail |

Exact byte totals (raw / gzip):

- index.html: HEAD **264,802 / 89,328**; current **264,471 / 87,323**.
- restaurants/index.html: HEAD **294,787 / 94,932**; current **302,247 / 96,456**.
- hosts/index.html: HEAD **296,757 / 94,800**; current **303,596 / 96,097**.

## Main source of the overage

The already-minified local GSAP core and ScrollTrigger together contribute **114.8 KiB raw / 45.3 KiB gzip to every company page** (HEAD: 114.7 / 45.3). Vendor files retain their license comments, matching the build. Their source is identical after normalizing CRLF to LF; the current raw sum has 22 extra bytes from checkout line endings, not a library change.

| Shared vendor resource | HEAD raw / gzip | Current raw / gzip |
|---|---:|---:|
| vendor/gsap/gsap.min.js | 71.2 / 27.7 | 71.2 / 27.7 |
| vendor/gsap/ScrollTrigger.min.js | 43.5 / 17.6 | 43.5 / 17.6 |

| Page, current | HTML raw / gzip | Non-vendor CSS raw / gzip | Non-vendor JS raw / gzip | All vendor raw / gzip |
|---|---:|---:|---:|---:|
| index.html | 20.7 / 5.4 | 51.4 / 11.5 | 71.5 / 23.1 | 114.8 / 45.3 |
| restaurants/index.html | 38.4 / 8.6 | 69.0 / 16.3 | 73.0 / 24.0 | 114.8 / 45.3 |
| hosts/index.html | 40.4 / 8.6 | 68.3 / 16.0 | 73.0 / 24.0 | 114.8 / 45.3 |

Largest audience-page changes, in exact bytes:

| Page | Resource | Raw change | Gzip change |
|---|---|---:|---:|
| restaurants/index.html | assets/restaurants.css | +5,824 | +922 |
| restaurants/index.html | restaurants/index.html | +923 | +466 |
| restaurants/index.html | assets/site.css | +434 | +60 |
| hosts/index.html | assets/hosts.css | +5,206 | +790 |
| hosts/index.html | hosts/index.html | +920 | +370 |
| hosts/index.html | assets/site.css | +434 | +60 |

## Interpretation

All three company pages already failed both size thresholds at HEAD. The current upgrade did not introduce the existence of these build failures. There is nevertheless a measured size increase on restaurants/index.html, hosts/index.html, so an unqualified “no bundle-size regression” would be inaccurate. The table quantifies the change.

Exact byte totals and per-resource attribution are saved in `bundle-size.json`. Git HEAD content is measured as stored; current content is measured as present on disk, which also preserves any source newline differences exactly as the build does.
