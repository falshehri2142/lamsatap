"""LamsaTap logo, candidate A: parametric geometry (GM-033, work/2026-09-27-wordmark/decision.md).

Every shape is constructed from the brief's numbers as exact lines, circular arcs and axis-aligned elliptical
arcs (geom.py, glyphs.py, symbol.py). No font file is read: the letters are our own drawing (trademark filing).

Run from anywhere:  python build_logo_v1_a.py            (writes SVGs, previews and measurements.json here)
                    python build_logo_v1_a.py --no-png   (SVGs and measurements only)
Needs: numpy, scipy, Pillow; Microsoft Edge (headless) for the PNG previews.

Units: design space has cap height H = 1000 (y up). SVG lockups use H = 100 (y down); symbol.svg uses cell = 100.
"""
import argparse
import json
import math
import pathlib
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import glyphs as G  # noqa: E402
import layout as LY  # noqa: E402
from geom import ToSVG, check_closed, contour_to_d, fmt, polygonize, signed_area  # noqa: E402
from symbol import build_symbol  # noqa: E402

# ------------------------------------------------------------------ colours (decision.md, colour table)
TEAL, INK, SAND, SAFFRON, WHITE, BLACK = "#0B7A75", "#14201F", "#FAF7F2", "#F2A93B", "#FFFFFF", "#000000"

# ------------------------------------------------------------------ brief numbers (H = 1000)
H = 1000.0
HEAVY = dict(            # LAMSA: stem 0.30H, horizontals 0.21-0.26H, corner radius 0.07H
    stem=300, foot=235, bar=220, diag=290, R=70, r=22,
    m_stem=275, m_diag=275,                           # M: four strokes, optically lighter (owner's M: 0.88 x stem)
    s_top=215, s_bot=215, s_side1=300, s_side2=300, s_spine=265)
LIGHT = dict(            # TAP: stem 0.20H, horizontals 0.175H, corner radius 0.045H (ratio 0.667)
    stem=200, foot=175, bar=175, diag=195, R=45, r=14,
    p_top=175, p_bot=175, p_round=210)
WIDTH = dict(L=780, A=1082.5, M=1100, S=870,          # LAMSA (A = TAP's A / 0.97)
             T=790, A2=1050, P=810)                   # TAP: T 0.79H, A 1.05H, P 0.81H (3% narrower)
SHAPE = dict(
    A_alpha=20.5, A_bar_mid=240,                      # heavy A: leg angle from vertical, crossbar centre
    A2_alpha=21.5, A2_bar_mid=262.5,                  # light A: same structure; crossbar top level with the heavy A's
    M_alpha=31.6, M_shoulder=297,                     # M: diagonal angle (owner's 31.6), flat top of each stem
    S_o=18, S_spine=21, S_counter=240, S_term=32,     # S: overshoot, spine angle, counter half-width, terminal angle
    P_bowl=290, P_curve=370)                          # P: bowl bottom, where the bowl's curve starts
# gaps = shortest distance between neighbouring outlines. Owner's measured gaps (true cap height):
# L|A 0.128  A|M 0.135  M|S 0.118  S|A 0.169  A|T 0.190  T|A 0.189  A|P 0.137.
# TAP = owner + 0.02H; seam A|T in 0.20-0.23H (never 0.28H+).
GAPS = [128, 135, 118, 169, 210, 209, 157]

# SINCE 2026: TAP's weight (stem 0.20 of its own cap), cap = 0.52H, TAP's construction scaled
SINCE_CAP = 0.52
LS = dict(stem=200, bar=175, R=45, r=14, n_diag=185, o_side=205, o_top=175,
          s_top=175, s_bot=175, s_side1=205, s_side2=205, s_spine=190)
SINCE = dict(wS=760, o=15, spS=24, aS=195, tuS=34, wN=820, nFlat=20, wC=840, tC=34, wE=660, wEm=600, wEt=640,
             w2=740, xf2=20, t2=160, ry2=305, w0=840, w6=780, ry6=330, a6=60, asc6=190,
             track=550, space=1300)            # box gaps in SINCE units (owner: 0.55 x its cap; word space 1.3 x)

# lockups (decision.md "النسخ والأحجام")
STACK_GAP = 0.72          # symbol -> word, x H
STACK_SYMBOL = 0.58       # symbol width / word width
SINCE_GAP = 0.40          # word baseline -> SINCE cap line, x H (owner's reference: 0.39)
HORIZ_SYMBOL = 2.0        # symbol height, x H
HORIZ_GAP = 0.6           # symbol -> word, x H
SYMBOL = dict(bridge=0.12, r_out=0.06, r_in=0.02)   # star-tip bridge and notch corner radii, in cells
AVATAR_SYMBOL = 0.60      # symbol side / circle diameter


# ------------------------------------------------------------------ build
def word_glyphs():
    return [G.glyph_L(HEAVY, WIDTH["L"]),
            G.glyph_A(HEAVY, WIDTH["A"], SHAPE["A_alpha"], SHAPE["A_bar_mid"]),
            G.glyph_M(HEAVY, WIDTH["M"], SHAPE["M_alpha"], SHAPE["M_shoulder"]),
            G.glyph_S(HEAVY, WIDTH["S"], SHAPE["S_o"], SHAPE["S_spine"], 0, SHAPE["S_counter"], SHAPE["S_counter"],
                      SHAPE["S_term"], 180 + SHAPE["S_term"]),
            G.glyph_A(HEAVY, WIDTH["A"], SHAPE["A_alpha"], SHAPE["A_bar_mid"]),
            G.glyph_T(LIGHT, WIDTH["T"]),
            G.glyph_A(LIGHT, WIDTH["A2"], SHAPE["A2_alpha"], SHAPE["A2_bar_mid"]),
            G.glyph_P(LIGHT, WIDTH["P"], SHAPE["P_bowl"], SHAPE["P_curve"])]


def layout_word(gl):
    """x offset of each glyph's local origin so that neighbouring outlines are GAPS apart."""
    xs = [-gl[0].xmin]
    pa = LY.outline_points(gl[0], 1.0, xs[0])
    for g, gap in zip(gl[1:], GAPS):
        xo = LY.place_after(pa, g, gap, xs[-1] + 1000, step=1.0)
        xs.append(xo)
        pa = LY.outline_points(g, 1.0, xo)
    return xs


def since_glyphs():
    P = SINCE
    return [G.glyph_S(LS, P["wS"], P["o"], P["spS"], 0, P["aS"], P["aS"], P["tuS"], 180 + P["tuS"]),
            G.glyph_I(LS),
            G.glyph_N(LS, P["wN"], LS["stem"] + P["nFlat"], LS["stem"] + P["nFlat"]),
            G.glyph_C(LS, P["wC"], P["o"], P["tC"]),
            G.glyph_E(LS, P["wE"], P["wEm"], P["wEt"]),
            None,
            G.glyph_2(LS, P["w2"], P["o"], P["xf2"], P["t2"], P["ry2"], LS["bar"]),
            G.glyph_O(LS, P["w0"], P["o"]),
            G.glyph_2(LS, P["w2"], P["o"], P["xf2"], P["t2"], P["ry2"], LS["bar"]),
            G.glyph_6(LS, P["w6"], P["o"], P["ry6"], P["a6"], P["asc6"])]


def layout_since(gl):
    xs, x = [], 0.0
    for g in gl:
        if g is None:
            x += SINCE["space"] - SINCE["track"]
            xs.append(None)
            continue
        xs.append(x - g.xmin)
        x += g.width + SINCE["track"]
    return xs, x - SINCE["track"]


class Item:
    """A placed shape: contours in their own design space, mapped by (scale s, dx, dy) into lockup space
    (y up, H = 1000 for the word)."""

    def __init__(self, contours, s, dx, dy, role):
        self.contours, self.s, self.dx, self.dy, self.role = contours, s, dx, dy, role

    def pts(self, step=2.0):
        return [polygonize(c, step / self.s) * self.s + np.array([self.dx, self.dy]) for c in self.contours]


def compose(kind, with_since=False):
    """Lockup items in word space (H = 1000, baseline y = 0, word starts at x = 0)."""
    gl = word_glyphs()
    xs = layout_word(gl)
    items = []
    for i, (g, x) in enumerate(zip(gl, xs)):
        items.append(Item(g.contours, 1.0, x, 0.0, "lamsa" if i < 5 else "tap"))
    word_w = xs[-1] + gl[-1].xmax
    sym, smeta = build_symbol(250.0, **SYMBOL)          # side 1000
    if kind == "word":
        return items, dict(word_w=word_w, xs=xs, glyphs=gl)
    if kind == "stacked":
        side = STACK_SYMBOL * word_w
        k = side / 1000.0
        top_of_word = H
        items.append(Item(sym, k, (word_w - side) / 2, top_of_word + STACK_GAP * H, "symbol"))
        if with_since:
            sg = since_glyphs()
            sx, sw = layout_since(sg)
            ks = SINCE_CAP
            x0 = (word_w - sw * ks) / 2
            y0 = -SINCE_GAP * H - SINCE_CAP * H          # SINCE baseline
            for g, x in zip(sg, sx):
                if g is not None:
                    items.append(Item(g.contours, ks, x0 + x * ks, y0, "since"))
        return items, dict(word_w=word_w, side=side, xs=xs, glyphs=gl, symbol=smeta)
    if kind == "horizontal":
        side = HORIZ_SYMBOL * H
        k = side / 1000.0
        # word cap-centre on the symbol centre: symbol from y = -0.5H to 1.5H
        for it in items:
            it.dx += side + HORIZ_GAP * H
        items.append(Item(sym, k, 0.0, H / 2 - side / 2, "symbol"))
        return items, dict(word_w=word_w, side=side, xs=xs, glyphs=gl, symbol=smeta)
    if kind == "symbol":
        return [Item(sym, 1.0, 0.0, 0.0, "symbol")], dict(symbol=smeta)
    raise ValueError(kind)


def bounds(items):
    P = np.concatenate([p for it in items for p in it.pts()], 0)
    return P[:, 0].min(), P[:, 1].min(), P[:, 0].max(), P[:, 1].max()


def to_svg(items, colours, unit=10.0, title="LamsaTap"):
    """One <path> per colour. unit = design units per SVG unit (10 -> H = 100). Tight viewBox on the ink."""
    x0, y0, x1, y1 = bounds(items)
    paths = {}
    for it in items:
        col = colours[it.role]
        f = ToSVG(it.s / unit, (it.dx - x0) / unit, (y1 - it.dy) / unit)
        paths.setdefault(col, []).extend(contour_to_d(c, f) for c in it.contours)
    w, h = (x1 - x0) / unit, (y1 - y0) / unit
    body = "".join(f'<path fill="{c}" d="{"".join(d)}"/>' for c, d in paths.items())
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}">'
            f'<title>{title}</title>{body}</svg>\n'), w, h


LIGHT_COLOURS = dict(symbol=TEAL, lamsa=TEAL, since=TEAL, tap=INK)
MONO_BLACK = dict(symbol=BLACK, lamsa=BLACK, since=BLACK, tap=BLACK)
AVATAR_COLOURS = dict(symbol=SAND)


# ------------------------------------------------------------------ measurements
def measure():
    gl = word_glyphs()
    xs = layout_word(gl)
    out = {"H": "cap height; all values below are in H"}
    k = 0.5                                                 # raster: 0.5 px per unit (H = 500 px)
    m = {}
    names = ["L", "A", "M", "S", "A", "T", "A", "P"]
    # stems and strokes from the raster, at fixed heights
    def runs(g, y):
        cov = LY.glyph_mask(g, k, pad=10)
        row = int(round((g.ymax - y) * k + 10))
        return [round(v / H, 4) for v in LY.run_widths(cov > 0.5, row, k)]
    m["L_stem_at_0.6H"] = runs(gl[0], 600)
    m["M_strokes_at_0.9H"] = runs(gl[2], 900)
    m["T_stem_at_0.4H"] = runs(gl[5], 400)
    m["P_stem_and_bowl_at_0.6H"] = runs(gl[7], 600)
    m["A_heavy_legs_horizontal_at_0.55H"] = runs(gl[1], 550)
    m["A_light_legs_horizontal_at_0.55H"] = runs(gl[6], 550)
    out["raster_runs"] = m
    out["stems"] = dict(LAMSA=HEAVY["stem"] / H, TAP=LIGHT["stem"] / H, ratio=round(LIGHT["stem"] / HEAVY["stem"], 4),
                        M_LAMSA=HEAVY["m_stem"] / H, A_legs_LAMSA=HEAVY["diag"] / H, A_legs_TAP=LIGHT["diag"] / H,
                        S_spine=HEAVY["s_spine"] / H)
    out["horizontals"] = dict(L_foot=HEAVY["foot"] / H, A_bar=HEAVY["bar"] / H, S_top_bottom=HEAVY["s_top"] / H,
                              T_bar=LIGHT["bar"] / H, A2_bar=LIGHT["bar"] / H, P_bowl=LIGHT["p_top"] / H)
    out["corner_radius"] = dict(LAMSA=HEAVY["R"] / H, TAP=LIGHT["R"] / H, inner_LAMSA=HEAVY["r"] / H,
                                inner_TAP=LIGHT["r"] / H)
    out["widths"] = {f"{i}{g.name}": round(g.width / H, 4) for i, g in enumerate(gl)}
    # gaps (shortest outline distance) between neighbours
    gaps = {}
    for i in range(len(gl) - 1):
        pa = LY.outline_points(gl[i], 0.5, xs[i])
        pb = LY.outline_points(gl[i + 1], 0.5, xs[i + 1])
        gaps[f"{names[i]}|{names[i + 1]}"] = round(LY.min_dist(pa, pb) / H, 4)
    out["gaps"] = gaps
    out["seam_A|T"] = gaps["A|T"]
    # counters
    cnt = {}
    for label, g in (("A_LAMSA", gl[1]), ("A_TAP", gl[6]), ("P_TAP", gl[7])):
        cov = LY.glyph_mask(g, k, pad=10)
        hs = LY.holes(cov > 0.5)
        mt = LY.hole_metrics(hs[0], k)
        cnt[label] = {kk: round(v / H, 4) for kk, v in mt.items()}
    # S: apertures = shortest distance from each rounded terminal end to the body across the opening;
    # counter = largest disc that fits in each counter slit
    S = gl[3]
    from scipy.spatial import cKDTree
    c = S.contours[0]
    seg = lambda idx: np.concatenate([c[i].sample(0.5) for i in idx], 0)
    up_term, up_body = seg([10, 11, 0]), seg([7, 8])
    lo_term, lo_body = seg([4, 5, 6]), seg([1, 2])
    ap_up = cKDTree(up_body).query(up_term)[0].min()
    ap_lo = cKDTree(lo_body).query(lo_term)[0].min()
    covS = LY.glyph_mask(S, k, pad=10)
    inkS = covS > 0.5
    px = lambda p: (int(round((S.ymax - p[1]) * k + 10)), int(round((p[0] - S.xmin) * k + 10)))
    disc_up = LY.aperture(inkS, px(S.meta["E1i"].c), k)
    disc_lo = LY.aperture(inkS, px(S.meta["E2i"].c), k)
    cnt["S_apertures"] = [round(ap_up / H, 4), round(ap_lo / H, 4)]
    cnt["S_counter_slits"] = [round(disc_up / H, 4), round(disc_lo / H, 4)]
    out["counters"] = cnt
    # symbol
    sym, smeta = build_symbol(250.0, **SYMBOL)
    out["symbol"] = dict(cell="c = side/4", bridge_at_star_tips=round(smeta["bridge"] / 250, 4),
                         tip_round_radius=round(smeta["tip_radius"] / 250, 4), notch_corner_out=SYMBOL["r_out"],
                         notch_corner_in=SYMBOL["r_in"])
    word_w = xs[-1] + gl[-1].xmax
    out["word_width"] = round(word_w / H, 4)
    out["stacked"] = dict(symbol_over_word_width=STACK_SYMBOL, gap=STACK_GAP, since_cap=SINCE_CAP, since_gap=SINCE_GAP)
    out["horizontal"] = dict(symbol=HORIZ_SYMBOL, gap=HORIZ_GAP)
    return out


# ------------------------------------------------------------------ files
def write_all(png=True):
    files = {}

    def save(name, text):
        (HERE / name).write_text(text, encoding="utf-8")
        files[name] = text

    items, meta = compose("symbol")
    svg, _, _ = to_svg(items, dict(symbol=TEAL), unit=2.5, title="LamsaTap symbol")   # cell = 100
    save("symbol.svg", svg)
    items, meta = compose("stacked")
    save("stacked-light.svg", to_svg(items, LIGHT_COLOURS, title="LamsaTap")[0])
    save("stacked-mono-black.svg", to_svg(items, MONO_BLACK, title="LamsaTap")[0])
    items, meta = compose("stacked", with_since=True)
    save("stacked-light-since.svg", to_svg(items, LIGHT_COLOURS, title="LamsaTap since 2026")[0])
    items, meta = compose("horizontal")
    save("horizontal-light.svg", to_svg(items, LIGHT_COLOURS, title="LamsaTap")[0])
    items, meta = compose("word")
    save("wordmark-light.svg", to_svg(items, LIGHT_COLOURS, title="LamsaTap")[0])
    if png:
        previews(files)
    return files


def previews(files):
    from raster import shoot_html, svg_page
    import re
    from PIL import Image

    def vb(svg):
        w, h = (float(v) for v in re.search(r'viewBox="0 0 ([^ ]+) ([^"]+)"', svg).group(1, 2))
        return w, h

    # stacked-light: 1200 px wide canvas, logo 1000 px wide
    for name, out in (("stacked-light.svg", "preview-stacked-light-1200.png"),
                      ("stacked-light-since.svg", "preview-stacked-light-since-1200.png")):
        svg = files[name]
        w, h = vb(svg)
        lw = 1000
        lh = lw * h / w
        pad = 100
        W, Hh = 1200, int(round(lh + 2 * pad))
        page = svg_page(svg.replace('viewBox', f'width="{lw}" height="{lh:.2f}" viewBox', 1), W, Hh, SAND)
        page = page.replace('<svg width', '<svg style="position:absolute;left:100px;top:100px" width', 1)
        shoot_html(_abs_page(svg, W, Hh, SAND, 100, 100, lw, lh), W, Hh, HERE / out)
    # horizontal: 600 px wide canvas, logo 540 px wide
    svg = files["horizontal-light.svg"]
    w, h = vb(svg)
    lw = 540
    lh = lw * h / w
    W, Hh = 600, int(round(lh + 60))
    shoot_html(_abs_page(svg, W, Hh, SAND, 30, 30, lw, lh), W, Hh, HERE / "preview-horizontal-light-600.png")
    # symbol 40 px on a teal circle (avatar): sand symbol, side = AVATAR_SYMBOL x 40
    items, _ = compose("symbol")
    ssvg, sw, sh = to_svg(items, AVATAR_COLOURS, unit=2.5, title="avatar")
    side = 40 * AVATAR_SYMBOL
    html = (f'<!doctype html><html><body style="margin:0;background:{SAND};width:40px;height:40px;overflow:hidden">'
            f'<div style="position:absolute;left:0;top:0;width:40px;height:40px;border-radius:50%;background:{TEAL}"></div>'
            f'<div style="position:absolute;left:{(40 - side) / 2}px;top:{(40 - side) / 2}px">'
            f'{ssvg.replace("<svg ", f"<svg width=\"{side}\" height=\"{side}\" style=\"display:block\" ", 1)}</div>'
            f'</body></html>')
    shoot_html(html, 40, 40, HERE / "preview-symbol-40-teal-circle.png")
    # wordmark at cap height 9 px
    svg = files["wordmark-light.svg"]
    w, h = vb(svg)
    capH = 9.0
    scale = capH / 100.0                      # SVG units: H = 100
    lw, lh = w * scale, h * scale
    W, Hh = int(math.ceil(lw + 16)), int(math.ceil(lh + 16))
    shoot_html(_abs_page(svg, W, Hh, SAND, 8, 8, lw, lh), W, Hh, HERE / "preview-wordmark-cap9.png")
    # magnified copies of the two tiny previews, for review only (nearest neighbour, 8x)
    for src in ("preview-symbol-40-teal-circle.png", "preview-wordmark-cap9.png"):
        im = Image.open(HERE / src)
        im.resize((im.width * 8, im.height * 8), Image.NEAREST).save(HERE / src.replace(".png", "-x8.png"))


def _abs_page(svg, W, Hh, bg, left, top, lw, lh):
    svg = svg.replace("<svg ", f'<svg width="{lw:.3f}" height="{lh:.3f}" style="display:block" ', 1)
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;padding:0;background:{bg};'
            f'width:{W}px;height:{Hh}px;overflow:hidden}}</style></head><body>'
            f'<div style="position:absolute;left:{left}px;top:{top}px">{svg}</div></body></html>')


def selfcheck():
    """Every contour closed; outer contours counter-clockwise, counters clockwise; no ink overlaps between items."""
    for kind, since in (("stacked", True), ("horizontal", False)):
        items, _ = compose(kind, since)
        for it in items:
            for c in it.contours:
                check_closed(c)
    gl = word_glyphs()
    for g in gl:
        areas = [signed_area(polygonize(c)) for c in g.contours]
        assert areas[0] > 0 and all(a < 0 for a in areas[1:]), (g.name, areas)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-png", action="store_true")
    a = ap.parse_args()
    selfcheck()
    files = write_all(png=not a.no_png)
    meas = measure()
    (HERE / "measurements.json").write_text(json.dumps(meas, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(meas, indent=1, ensure_ascii=False))
    print("files:", ", ".join(sorted(files)))


if __name__ == "__main__":
    main()
