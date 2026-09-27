# Page override: Gateway (`website/index.html`)
Overrides MASTER.md for the home page only. Source: `web-art-director.md` «الاتجاه 3» §3 and §10; web-copy «الاتجاه 3» (gateway, line ~81).

- **Audience attribute:** none on `<html>`, so the accent is neutral ink. Each door carries its own world: `data-audience="restaurants"` on door 1 and `"hosts"` on door 2.
- **Intro, "our logo is the barcode":**
  - A canvas QR-module field (modules share the logo's rounded-square language) is swept by a scan line and resolves into a **real, scannable QR** (EC level H).
  - Our symbol assembles in its centre as exactly 8×8 modules (one symbol cell = 2 modules), with one empty module ring around it: 7.3% of the QR, under the 12% cap.
  - LAMSATAP writes in underneath, then «امسحه بجوالك» on desktop. Mobile gets the «افتح المثال» button instead.
  - On scroll the logo flies into the sticky header (shared element, measured once and on resize).
  - Total auto-play is 1.7s or less. The h1 promise is readable from the first frame.
- **Doors (the strongest motion moment):**
  - Two white cards («عندي مطعم أو كافيه» and «عندي شقق أو إيجار قصير»); each whole card is a link.
  - Each card is shaped as a piece of the symbol (§11).
  - Each card has a photo (R1 dallah / H1 hallway, two-layer) and an icon in its accent.
  - Warm scan on door 1, then bright scan on door 2.
  - On mobile the doors stack.
- **Sections:** intro → promise → doors → «كيف نشتغل» → «اسأل إنسان» → footer.
  - **No prices.** No «خدمات ثانية» section (GM-043).
  - No second QR section below the intro.
- **SEO:** the h1 is the promise. The canonical is the root of the placeholder domain.
