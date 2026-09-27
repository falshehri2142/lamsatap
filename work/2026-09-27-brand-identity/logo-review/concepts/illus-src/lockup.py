"""Horizontal lockup per AD 16.5 (concept-level, not final kerning):
«لمسة تاب» Readex Pro 600 + «LamsaTap» Readex Pro 500 under it, right-aligned; Latin cap height = Arabic tooth height;
mark on the right, surface height h = top of «ل» to Latin baseline, gap mark-name = 0.3h, dot at the outer right."""
import pathlib

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
VF = str(ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf")
AR, EN = "لمسة تاب", "LamsaTap"   # GM-012 (website/config.js companyName / companyNameEn)
_inst = {}


def font(w):
    if w not in _inst:
        _inst[w] = instancer.instantiateVariableFont(TTFont(VF), {"wght": w, "HEXP": 0})
    return _inst[w]


def shape(text, w):
    f = hb.Font(hb.Face(hb.Blob.from_file_path(VF)))
    f.set_variations({"wght": w, "HEXP": 0})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(f, buf, {})
    order = font(w).getGlyphOrder()
    return [(order[i.codepoint], p.x_advance, p.x_offset, p.y_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


class Run:
    """Shaped text in font units (y up). bbox = ink bounds."""

    def __init__(self, text, w):
        gs = font(w).getGlyphSet()
        self.gs = gs
        self.items, x = [], 0
        b = BoundsPen(gs)
        for name, adv, xo, yo in shape(text, w):
            self.items.append((gs[name], x + xo, yo))
            gs[name].draw(TransformPen(b, (1, 0, 0, 1, x + xo, yo)))
            x += adv
        self.bbox = b.bounds  # x0, y0, x1, y1

    def path(self, left, base, s):
        """SVG path: ink left edge at `left`, baseline at `base` (y down), scale s px per unit."""
        pen = SVGPathPen(self.gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        x0 = self.bbox[0]
        for g, dx, dy in self.items:
            g.draw(TransformPen(pen, (s, 0, 0, -s, left + (dx - x0) * s, base - dy * s)))
        return pen.getCommands()


def glyph_top(text, w, char):
    """yMax of the glyph(s) that render `char` inside `text` (e.g. the tooth of س in لمسة)."""
    gs = font(w).getGlyphSet()
    cmap = font(w).getBestCmap()
    target = cmap.get(ord(char))
    tops = []
    for name, *_ in shape(text, w):
        if target and (name == target or name.startswith(target.split(".")[0])) or char == "س" and "seen" in name.lower():
            b = BoundsPen(gs)
            gs[name].draw(b)
            tops.append(b.bounds[3])
    return max(tops) if tops else None


def metrics():
    ar, en = Run(AR, 600), Run(EN, 500)
    gs = font(600).getGlyphSet()
    # Arabic body (tooth) height: medial seen from the shaped run
    seen = [n for n, *_ in shape(AR, 600) if n.startswith("uni0633")]
    tooth = None
    for n in seen:
        b = BoundsPen(gs)
        gs[n].draw(b)
        tooth = b.bounds[3]
    cap = BoundsPen(font(500).getGlyphSet())
    font(500).getGlyphSet()["L"].draw(cap)
    return ar, en, tooth, cap.bounds[3], seen


def build(mark_paths, surface_box, colors=("#14201F", "#14201F", "#F2A93B"), ar_em=100.0, en_gap_em=0.24, gap_h=0.30):
    """mark_paths: (surface_d, dot_d) in 512 units. surface_box: (x0, y0, x1, y1) of the part whose height = h.
    Layout (y down, px): y=0 at the top of «ل»; Arabic baseline at 740*s; Latin cap top en_gap_em below the Arabic
    baseline; h = top of «ل» to Latin baseline. Mark scaled so the surface spans exactly h, gap to name = gap_h*h."""
    ar, en, tooth, cap, _ = metrics()
    gs = font(600).getGlyphSet()
    lam = BoundsPen(gs)
    gs["uni0644.init"].draw(lam)
    lam_top = lam.bounds[3]
    k_en = tooth / cap
    s_ar = ar_em / 1000.0
    s_en = s_ar * k_en
    base_ar = lam_top * s_ar
    base_en = base_ar + en_gap_em * ar_em + cap * s_en
    h = base_en
    ar_w = (ar.bbox[2] - ar.bbox[0]) * s_ar
    en_w = (en.bbox[2] - en.bbox[0]) * s_en
    name_w = max(ar_w, en_w)
    sx0, sy0, sx1, sy1 = surface_box
    k = h / (sy1 - sy0)
    tx = name_w + gap_h * h - sx0 * k
    ty = -sy0 * k
    fill_name, fill_surf, fill_dot = colors
    name_d = ar.path(name_w - ar_w, base_ar, s_ar) + en.path(name_w - en_w, base_en, s_en)
    return dict(name_d=name_d, h=h, k=k, tx=tx, ty=ty, name_w=name_w, top_ink=-(ar.bbox[3] - lam_top) * s_ar,
                bottom_ink=base_en + (-en.bbox[1]) * s_en, fills=colors, mark=mark_paths, s_ar=s_ar, s_en=s_en, k_en=k_en,
                tooth=tooth, cap=cap)


def transform_path(d, k, tx, ty):
    """Apply scale k then translate to an SVG path made only of M/L/A/Z commands with absolute coords (our marks)."""
    import re
    toks = re.findall(r"[MLAZ]|-?\d+(?:\.\d+)?", d)
    out, i = [], 0
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    while i < len(toks):
        c = toks[i]; i += 1
        if c in "ML":
            x, y = float(toks[i]), float(toks[i + 1]); i += 2
            out.append(f"{c}{f(x * k + tx)} {f(y * k + ty)}")
        elif c == "A":
            rx, ry, rot, la, sw, x, y = (float(t) for t in toks[i:i + 7]); i += 7
            out.append(f"A{f(rx * k)} {f(ry * k)} {int(rot)} {int(la)} {int(sw)} {f(x * k + tx)} {f(y * k + ty)}")
        elif c == "Z":
            out.append("Z")
    return "".join(out)


def svg_doc(L, mode="light", title="لمسة تاب — LamsaTap"):
    """Standalone SVG of the lockup, cropped to ink (viewBox), paths only, no transforms."""
    name_fill, surf_fill, dot_fill = {"light": ("#14201F", "#14201F", "#F2A93B"), "dark": ("#ECF2F0", "#ECF2F0", "#F2A93B"),
                                      "mono": ("#000000", "#000000", "#000000"), "mono-white": ("#FFFFFF", "#FFFFFF", "#FFFFFF")}[mode]
    sd, dd = L["mark"]
    sd2 = transform_path(sd, L["k"], L["tx"], L["ty"])
    dd2 = transform_path(dd, L["k"], L["tx"], L["ty"])
    return name_fill, surf_fill, dot_fill, L["name_d"], sd2, dd2


if __name__ == "__main__":
    ar, en, tooth, cap, seen = metrics()
    print("ar bbox", ar.bbox, "en bbox", en.bbox, "tooth", tooth, "cap", cap, "seen glyphs", seen)
