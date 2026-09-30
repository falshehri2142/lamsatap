# Logo scene integration audit

Read-only inspection on 2026-09-29; no images or site files edited by this audit.

## Website consumers

| Scene asset family | Current consumers |
| --- | --- |
| `restaurant-cafe-stand-{bw,color}-{800,1600}.webp` | `website/index.html:61` restaurant door tile; `website/index.html:65` how-it-works photo; `website/restaurants/index.html:106` hero; `website/restaurants/index.html:147` story |
| `host-door-frame-{bw,color}-{800,1600}.webp` | `website/index.html:62` hosts door tile; `website/hosts/index.html:58` hero; `website/hosts/index.html:112` story |
| `scene-hosts-table-{bw,color}-{800,1600}.webp` | `website/hosts/index.html:136` three stands scene |

## Durable integration

- Preserve original generated scenes. Store logo-bearing source siblings in `brand/photos/composites/`, with explicit new names such as `restaurants-hero-logo.webp`, `hosts-door-logo.webp`, and `hosts-table-logo.webp`.
- Point the three existing LAYERS entries in `tools/convert-images.py:38`, `:41`, and `:42` to those new sources. Otherwise a later `--layers` run restores blank artwork. Keep the public asset-family names unchanged to update all consumers without rewriting page layout.
- Rebuild all four outputs for each family: black-and-white and color, each at 800 and 1600. Both tint layers must contain the same artwork and geometry.
- `tools/build-home-minis.cjs:63` maps heroes to the same names; `photo()` at line 195 reads actual dimensions of each pair. No generator map changes are needed if asset-family names stay unchanged.
- Current `website/index.html`, `website/restaurants/index.html`, and `website/hosts/index.html` have existing uncommitted changes. Preserve them. A blanket rebuild of unrelated HTML markers is unnecessary for same-size assets.
- Keep `website/assets/mockups/print-art.js` empty. Never add a second DOM logo/print overlay on these photographic scenes. Current `.r-story-touch` and `.p-story-touch` spans are touch rings, not print art.
- Update source descriptions in `website/assets/images/CREDITS.md:59`, `website/README.md:150`, and `brand/photos/composites/README.md` so they no longer describe these selected scenes as blank. The old README hold refers to a rejected print-art batch; the current explicit user request authorizes this logo placement.
- Avoid rebuilding unused `scene-restaurants` and `scene-hosts-door` families unless intentionally updating them too; they are separate LAYERS entries from the website’s currently consumed hero families.

## Logo source verification

- Approved stacked ink vector: `brand/logo/v1.0.0/web/logo-stack.svg`, also copied to `website/assets/brand/logo-stack.svg`. Intrinsic size and viewBox: **808.75 × 643.47**. Approved ink color is `#14201F`; approval/provenance recorded in `brand/logo/v1.0.0/USAGE.md` and `MANIFEST.txt`.
- **No verified approved stacked PNG exists in the release folder.** Available approved PNGs are symbol avatars: `brand/logo/v1.0.0/avatar-white-on-ink-512.png` (**512 × 512**) and `brand/logo/v1.0.0/web/apple-touch-icon.png` (**180 × 180**); neither includes the stacked LAMSATAP wordmark.
- Candidate PNGs `work/2026-09-27-wordmark/build/cand-b/previews/stacked-light.png` and `stacked-black.png` are **1009 × 844**, but do not treat them as final approved references: their corresponding `cand-b/stacked-light.svg` SHA-256 differs from the released vector. The release includes the later restored star.
- Safest raster reference is a fresh faithful rendering of the approved `brand/logo/v1.0.0/web/logo-stack.svg` to a new work-folder PNG. Do not alter the official logo assets.

## Scene card geometry (original 2560 × 1440 sources)

Existing measured corners in `brand/photos/composites/README.md`:

- Restaurant card: `1001.6,431 1427.5,431 1427.5,1103.9 1011.3,1130.9`.
- Door frame card: `1459,372 1722,372 1722,731 1459,731`.
- Table left: `668,614 903,614 896,974 660,973`.
- Table center: `1151,614 1386,614 1390,972 1151,972`.
- Table right: `1628,614 1860,615 1871,970 1637,972`.

These are existing measured references, not newly verified pixel selections. Preserve scene crops, perspective, and illumination during the image edit.
