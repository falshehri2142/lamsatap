"""Art-director review renders for candidate B (reads build/cand-b; writes only into this folder).
Run: python render_review.py
"""
import os
import pathlib
import re
import subprocess
import tempfile

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
WM = HERE.parents[1]
CAND = WM / "build" / "cand-b"
REF = WM.parents[1] / "brand-source" / "owner-logo-2026-09-27.png"

TEAL, INK, SAND, SAFFRON, WHITE = "#0B7A75", "#14201F", "#FAF7F2", "#F2A93B", "#FFFFFF"
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]


def shoot_html(html, w, h, out):
    exe = next(b for b in BROWSERS if os.path.exists(b))
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        args = [exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                f"--window-size={w},{h}", f"--user-data-dir={tmp}", f"--screenshot={out}", page.as_uri()]
        subprocess.run(args, check=True, capture_output=True, timeout=120)
    return out


def svg(name):
    return (CAND / name).read_text(encoding="utf-8")


def vb(s):
    w, h = (float(v) for v in re.search(r'viewBox="0 0 ([^ ]+) ([^"]+)"', s).group(1, 2))
    return w, h


def recolour(s, mapping):
    for a, b in mapping.items():
        s = s.replace(f'fill="{a}"', f'fill="{b}"')
    return s


def sized(s, w, h):
    s = re.sub(r' width="[^"]+" height="[^"]+"', "", s, count=1)
    return s.replace("<svg ", f'<svg width="{w:.3f}" height="{h:.3f}" style="display:block" ', 1)


def page(W, H, bg, blocks):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;padding:0;'
            f'background:{bg};width:{W}px;height:{H}px;overflow:hidden;font:12px sans-serif}}</style></head>'
            f'<body>{"".join(blocks)}</body></html>')


def at(x, y, inner, extra=""):
    return f'<div style="position:absolute;left:{x}px;top:{y}px;{extra}">{inner}</div>'


def shoot(name, W, H, bg, blocks):
    out = HERE / name
    shoot_html(page(W, H, bg, blocks), W, H, out)
    return out


def main():
    sym = svg("symbol.svg")
    word = svg("wordmark-light.svg")
    stk = svg("stacked-light.svg")
    stks = svg("stacked-light-since2026.svg")
    hor = svg("horizontal-light.svg")
    mono = svg("stacked-mono-black.svg")

    # 1. symbol big (tips, arcs) + 4000 px for tip crops
    shoot("01-symbol-1000.png", 1100, 1100, SAND, [at(50, 50, sized(sym, 1000, 1000))])
    shoot("01b-symbol-4000.png", 4000, 4000, SAND, [at(0, 0, sized(sym, 4000, 4000))])
    big = Image.open(HERE / "01b-symbol-4000.png")
    # top star tip + TR notch corner (tip at x=200/405, y=100/405 of the mark)
    k = 4000 / 405.0
    cx, cy = 202.5 * k, 100 * k
    big.crop((int(cx - 300), int(cy - 300), int(cx + 300), int(cy + 300))).save(HERE / "01c-tip-top-crop.png")

    # 2. owner mark vs candidate mark, overlaid at the owner's scale x8 (red = owner only, blue = cand only)
    ref = Image.open(REF).convert("RGB")
    a = np.asarray(ref).astype(float)
    x0, y0, c = 273.75, 132.75, 56.0   # reference-fit/analysis/fit.json
    S = 8
    side = 4 * c
    crop = ref.crop((int(x0 - 8), int(y0 - 8), int(x0 + side + 8), int(y0 + side + 8)))
    crop = crop.resize((crop.width * S, crop.height * S), Image.LANCZOS)
    ca = np.asarray(crop).astype(float)
    bgv = np.median(ca[..., 0][ca.min(axis=2) < 150])
    own = np.clip((ca[..., 0] - bgv) / (255 - bgv), 0, 1)
    # candidate at the same scale: symbol side 405 units = 4 cells + gap -> 4 cells = side px
    csz = side * S * 405 / 400.0
    ox, oy = x0 - int(x0 - 8), y0 - int(y0 - 8)          # mark origin inside the crop (scale 1)
    g2 = (405 - 400) / 2 / 100 * c                          # candidate pieces sit gap/2 outside the grid
    shoot("_cand_sym_owner_scale.png", crop.width, crop.height, "#000000",
          [at((ox - g2) * S, (oy - g2) * S, sized(recolour(sym, {TEAL: WHITE}), csz, csz))])
    cm = np.asarray(Image.open(HERE / "_cand_sym_owner_scale.png").convert("L")).astype(float) / 255
    h = min(own.shape[0], cm.shape[0]); w = min(own.shape[1], cm.shape[1])
    own, cm = own[:h, :w], cm[:h, :w]
    diff = own - cm
    over = np.ones((h, w, 3))
    over[..., 0] = 1 - np.clip(-diff, 0, 1)
    over[..., 2] = 1 - np.clip(diff, 0, 1)
    over[..., 1] = 1 - np.abs(diff)
    inter = np.minimum(own, cm).sum(); uni = np.maximum(own, cm).sum()
    print("owner vs cand symbol IoU:", round(float(inter / uni), 4))
    Image.fromarray((over * 255).astype(np.uint8)).save(HERE / "02-symbol-owner-vs-cand-diff.png")

    # 3. wordmark 2400 px wide, light colours
    w_, h_ = vb(word)
    ww = 2400
    wh = ww * h_ / w_
    shoot("03-word-2400.png", ww + 100, int(wh + 100), SAND, [at(50, 50, sized(word, ww, wh))])

    # 4. owner word x4 vs candidate word, both white on teal, same cap height, one sheet
    white = a.min(axis=2) > 200
    band = white[370:445]
    cols = np.where(band.any(axis=0))[0]
    rows = np.where(band.any(axis=1))[0]
    wx0, wx1 = cols.min(), cols.max()
    wy0, wy1 = 370 + rows.min(), 370 + rows.max()
    print("owner word bbox", wx0, wy0, wx1, wy1, "cap(incl. S overshoot)", wy1 - wy0 + 1, "width", wx1 - wx0 + 1)
    K = 4
    wc = ref.crop((wx0 - 8, wy0 - 8, wx1 + 9, wy1 + 9))
    wc = wc.resize((wc.width * K, wc.height * K), Image.LANCZOS)
    wc.save(HERE / "04b-owner-word-x4.png")
    # candidate word, same overall width as the owner's word
    cw = (wx1 - wx0 + 1) * K
    ch = cw * h_ / w_
    shoot("04a-cand-word-owner-width.png", int(cw + 64), int(ch + 64), TEAL,
          [at(32, 32, sized(recolour(word, {TEAL: WHITE, INK: WHITE}), cw, ch))])
    A = Image.open(HERE / "04a-cand-word-owner-width.png")
    sheet = Image.new("RGB", (max(A.width, wc.width), A.height + wc.height + 20), (255, 255, 255))
    sheet.paste(wc, (0, 0))
    sheet.paste(A, (0, wc.height + 20))
    sheet.save(HERE / "04-owner-top-cand-bottom.png")

    # 5. small sizes, light, device px
    blocks, y = [], 20
    hw, hh = vb(hor)
    for capH in (7, 9, 12, 16, 24):
        kk = capH / 100.0
        blocks.append(at(20, y, sized(hor, hw * kk, hh * kk)))
        blocks.append(at(20 + hw * kk + 20, y + hh * kk / 2 - 7, f"H={capH}px"))
        y += int(hh * kk) + 18
    x = 20
    for s_ in (16, 20, 24, 32, 48, 64):
        blocks.append(at(x, y, sized(sym, s_, s_)))
        x += s_ + 20
    y += 80
    x = 20
    for dia in (32, 40, 64, 96):
        s_ = dia * 0.60
        blocks.append(at(x, y, "", f"width:{dia}px;height:{dia}px;border-radius:50%;background:{TEAL}"))
        blocks.append(at(x + (dia - s_) / 2, y + (dia - s_) / 2, sized(recolour(sym, {TEAL: SAND}), s_, s_)))
        x += dia + 20
    y += 110
    shoot("05-small-light.png", 560, y, SAND, blocks)
    im = Image.open(HERE / "05-small-light.png")
    im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(HERE / "05x3-small-light.png")

    # 6. weight split without colour: mono / on teal / dark, word only
    blocks, y = [], 20
    variants = [("mono", {TEAL: "#000000", INK: "#000000"}, SAND),
                ("teal", {TEAL: WHITE, INK: WHITE}, TEAL),
                ("dark", {TEAL: SAND, INK: SAFFRON}, INK)]
    Wsheet = 900
    for nm, mp, bg in variants:
        for capH in (8, 10, 14, 28, 56):
            kk = capH / 100.0
            lw, lh = w_ * kk, h_ * kk
            blocks.append(at(0, y - 8, "", f"width:{Wsheet}px;height:{int(lh + 16)}px;background:{bg}"))
            blocks.append(at(20, y, sized(recolour(word, mp), lw, lh)))
            blocks.append(at(40 + lw, y + lh / 2 - 7, f"<span style='color:#888'>{nm} H={capH}</span>"))
            y += int(lh) + 16
    shoot("06-weight-split-variants.png", Wsheet, y + 10, "#ffffff", blocks)

    # 7. stacked lockups: light with SINCE, dark, teal, mono, each with clear space
    sw2, sh2 = vb(stks)
    lw = 440
    lh = lw * sh2 / sw2
    pad = 60
    tiles = [(stks, {}, SAND), (stks, {TEAL: SAND, INK: SAFFRON}, INK),
             (stks, {TEAL: WHITE, INK: WHITE}, TEAL), (stks, {TEAL: "#000000", INK: "#000000"}, WHITE)]
    blocks = []
    for i, (s_, mp, bg) in enumerate(tiles):
        X = i * (lw + 2 * pad)
        blocks.append(at(X, 0, "", f"width:{lw + 2 * pad}px;height:{int(lh + 2 * pad)}px;background:{bg}"))
        blocks.append(at(X + pad, pad, sized(recolour(s_, mp), lw, lh)))
    shoot("07-stacked-four-pairs.png", 4 * (lw + 2 * pad), int(lh + 2 * pad), SAND, blocks)

    # 8. in-use mock: site header (horizontal at H=14px) and stand face (stacked 260 px)
    blocks = [at(0, 0, "", f"width:1200px;height:72px;background:{WHITE};border-bottom:1px solid #e6e2da"),
              at(32, (72 - hh * 0.14) / 2, sized(hor, hw * 0.14, hh * 0.14)),
              at(0, 72, "", f"width:1200px;height:520px;background:{SAND}"),
              at(470, 150, sized(stk, 260, 260 * vb(stk)[1] / vb(stk)[0]))]
    shoot("08-in-use.png", 1200, 592, SAND, blocks)


if __name__ == "__main__":
    main()
