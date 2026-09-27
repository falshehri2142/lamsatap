"""Art-director review renders for candidate A (read-only use of build/cand-a; writes only into this folder).
Run: python render_review.py
"""
import pathlib
import re
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
WM = HERE.parents[1]
CAND = WM / "build" / "cand-a"
REF = WM.parents[1] / "brand-source" / "owner-logo-2026-09-27.png"
sys.path.insert(0, str(CAND))
from raster import shoot_html  # noqa: E402

TEAL, INK, SAND, SAFFRON, WHITE = "#0B7A75", "#14201F", "#FAF7F2", "#F2A93B", "#FFFFFF"


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
    return s.replace("<svg ", f'<svg width="{w:.3f}" height="{h:.3f}" style="display:block" ', 1)


def page(W, H, bg, blocks):
    body = "".join(blocks)
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;padding:0;'
            f'background:{bg};width:{W}px;height:{H}px;overflow:hidden;font:12px sans-serif}}</style></head>'
            f'<body>{body}</body></html>')


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
    stks = svg("stacked-light-since.svg")
    hor = svg("horizontal-light.svg")
    mono = svg("stacked-mono-black.svg")

    # 1. symbol big, to read tips / fillets
    shoot("01-symbol-1000.png", 1100, 1100, SAND, [at(50, 50, sized(sym, 1000, 1000))])
    # 1b. tip + notch zoom: symbol at 4000 px, crop later
    shoot("01b-symbol-4000.png", 4000, 4000, SAND, [at(0, 0, sized(sym, 4000, 4000))])

    # 2. wordmark 2400 px wide
    w, h = vb(word)
    ww = 2400
    wh = ww * h / w
    shoot("02-word-2400.png", ww + 100, int(wh + 100), SAND, [at(50, 50, sized(word, ww, wh))])

    # 3. owner vs candidate, both white on teal, matched word width
    ref = Image.open(REF).convert("RGB")
    a = np.asarray(ref).astype(int)
    white = a.min(axis=2) > 200
    ys, xs = np.where(white)
    # word row band: find the word by white rows below the symbol (y > 370)
    band = white[370:445]
    cols = np.where(band.any(axis=0))[0]
    rows = np.where(band.any(axis=1))[0]
    wx0, wx1 = cols.min(), cols.max()
    wy0, wy1 = 370 + rows.min(), 370 + rows.max()
    print("owner word bbox", wx0, wy0, wx1, wy1, "cap", wy1 - wy0 + 1, "width", wx1 - wx0 + 1)
    # candidate in white on teal
    stk_w = recolour(stks, {TEAL: WHITE, INK: WHITE})
    sw, sh = vb(stk_w)
    # match word width: candidate word width is the full viewBox width (word is widest)
    ref_word_w = wx1 - wx0 + 1
    scale_px = 4  # render both 4x the owner's pixel size
    cw = ref_word_w * scale_px
    ch = cw * sh / sw
    shoot("03a-cand-white-on-teal.png", int(cw + 200), int(ch + 200), TEAL, [at(100, 100, sized(stk_w, cw, ch))])
    crop = ref.crop((wx0 - 25, 133 - 25, wx1 + 26, 490))
    crop = crop.resize((crop.width * scale_px, crop.height * scale_px), Image.LANCZOS)
    crop.save(HERE / "03b-owner-crop-x4.png")

    # 4. the eight letters, owner vs candidate, same cap height (owner cap rendered 4x)
    ref_cap = wy1 - wy0 + 1
    capk = ref_cap * scale_px
    k = capk / 100.0
    shoot("04a-cand-word-cap%d.png" % capk, int(w * k + 60), int(h * k + 60), TEAL,
          [at(30, 30, sized(recolour(word, {TEAL: WHITE, INK: WHITE}), w * k, h * k))])
    wc = ref.crop((wx0 - 8, wy0 - 8, wx1 + 9, wy1 + 9))
    wc.resize((wc.width * scale_px, wc.height * scale_px), Image.LANCZOS).save(HERE / "04b-owner-word-x4.png")

    # 5. small sizes, light, one sheet (device px, no scaling)
    blocks, y = [], 20
    for capH in (7, 9, 12, 16, 24):
        hw, hh = vb(hor)
        k = capH / 100.0
        blocks.append(at(20, y, sized(hor, hw * k, hh * k)))
        blocks.append(at(20 + hw * k + 20, y + hh * k / 2 - 7, f"H={capH}px"))
        y += int(hh * k) + 18
    for side in (16, 20, 24, 32, 48):
        blocks.append(at(20 + (side - 16) * 6, y, sized(sym, side, side)))
    y += 60
    # avatars
    x = 20
    for dia in (32, 40, 64, 96):
        side = dia * 0.64
        blocks.append(at(x, y, "", f"width:{dia}px;height:{dia}px;border-radius:50%;background:{TEAL}"))
        blocks.append(at(x + (dia - side) / 2, y + (dia - side) / 2, sized(recolour(sym, {TEAL: SAND}), side, side)))
        x += dia + 20
    y += 110
    shoot("05-small-light.png", 520, y, SAND, blocks)

    # 6. mono black and white-on-teal and dark at small caps (weight split without colour)
    blocks, y = [], 20
    variants = [("mono", {TEAL: "#000000", INK: "#000000"}, SAND),
                ("teal", {TEAL: WHITE, INK: WHITE}, TEAL),
                ("dark", {TEAL: SAND, INK: SAFFRON}, INK)]
    rows = []
    for nm, mp, bg in variants:
        for capH in (8, 10, 14, 28):
            ww_, wh_ = vb(word)
            kk = capH / 100.0
            rows.append((nm, mp, bg, capH, ww_ * kk, wh_ * kk))
    Wsheet = 600
    for nm, mp, bg, capH, lw, lh in rows:
        blocks.append(at(0, y - 8, "", f"width:{Wsheet}px;height:{int(lh + 16)}px;background:{bg}"))
        blocks.append(at(20, y, sized(recolour(word, mp), lw, lh)))
        blocks.append(at(30 + lw, y + lh / 2 - 7, f"<span style='color:#888'>{nm} H={capH}</span>"))
        y += int(lh) + 16
    shoot("06-weight-split-variants.png", Wsheet, y + 10, "#ffffff", blocks)

    # 7. dark + teal full stacked lockups
    dk = recolour(stk, {TEAL: SAND, INK: SAFFRON})
    tl = recolour(stk, {TEAL: WHITE, INK: WHITE})
    sw2, sh2 = vb(stk)
    lw = 520
    lh = lw * sh2 / sw2
    shoot("07-dark-teal-mono.png", 3 * (lw + 80), int(lh + 80), SAND,
          [at(0, 0, "", f"width:{lw + 80}px;height:{int(lh + 80)}px;background:{INK}"),
           at(40, 40, sized(dk, lw, lh)),
           at(lw + 80, 0, "", f"width:{lw + 80}px;height:{int(lh + 80)}px;background:{TEAL}"),
           at(lw + 120, 40, sized(tl, lw, lh)),
           at(2 * (lw + 80) + 40, 40, sized(mono, lw, lh))])


if __name__ == "__main__":
    main()
