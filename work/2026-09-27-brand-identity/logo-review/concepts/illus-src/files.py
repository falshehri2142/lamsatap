"""Write the SVG deliverables of one concept into logo-review/concepts/<id>/."""
import math
import pathlib
import re
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import concepts as C  # noqa
import lockup as LK  # noqa
from geo import sample_poly, fmt  # noqa

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
CDIR = ROOT / "work" / "2026-09-27-brand-identity" / "logo-review" / "concepts"
INK, DARKTXT, WHITE, SAF, BLACK = "#14201F", "#ECF2F0", "#FFFFFF", "#F2A93B", "#000000"
NS = 'xmlns="http://www.w3.org/2000/svg"'


def doc(vb, body, title):
    return f'<svg {NS} viewBox="{vb}" role="img"><title>{title}</title>{body}</svg>\n'


def scale_path(d, k, cx=256, cy=256):
    """Scale an M/L/A/Z path about (cx, cy)."""
    return LK.transform_path(d, k, cx - cx * k, cy - cy * k)


def surface_box(g):
    pts = np.array(sample_poly(g["poly"], g["radii"], step=0.25))
    return (float(pts[:, 0].min()), float(pts[:, 1].min()), float(pts[:, 0].max()), float(pts[:, 1].max()))


def write(cid, g, title_ar):
    out = CDIR / cid
    out.mkdir(parents=True, exist_ok=True)
    sd, dd = C.paths(g)
    t = f"لمسة تاب: «{title_ar}» (مفهوم داخلي {cid})"
    files = {}
    # naming aligned with web-brand's concepts: -icon = white surface (on ink / avatar), -icon-ink = for light backgrounds
    files[f"{cid}-icon.svg"] = doc("0 0 512 512", f'<path fill="{WHITE}" d="{sd}"/><path fill="{SAF}" d="{dd}"/>', t + "، فوق الحبر")
    files[f"{cid}-icon-ink.svg"] = doc("0 0 512 512", f'<path fill="{INK}" d="{sd}"/><path fill="{SAF}" d="{dd}"/>', t + "، للخلفية الفاتحة")
    files[f"{cid}-icon-dark.svg"] = doc("0 0 512 512", f'<path fill="{DARKTXT}" d="{sd}"/><path fill="{SAF}" d="{dd}"/>', t + "، للخلفية الداكنة")
    files[f"{cid}-icon-mono.svg"] = doc("0 0 512 512", f'<path fill="{BLACK}" d="{sd}{dd}"/>', t + "، لون واحد أسود")
    files[f"{cid}-icon-mono-white.svg"] = doc("0 0 512 512", f'<path fill="{WHITE}" d="{sd}{dd}"/>', t + "، لون واحد أبيض")
    # avatar: full-bleed ink square, mark scaled so its farthest point sits on the 80% circle (radius 0.40*512) minus a hair
    far = C.measures(g)["far"]
    k = (0.40 * 512 - 6) / far
    files[f"{cid}-avatar.svg"] = doc("0 0 512 512", f'<rect width="512" height="512" fill="{INK}"/>'
                                     f'<path fill="{WHITE}" d="{scale_path(sd, k)}"/><path fill="{SAF}" d="{scale_path(dd, k)}"/>',
                                     t + "، صورة الحساب (مربع مصمت، والرمز داخل دائرة 80%)")
    # horizontal lockups
    box = surface_box(g) if g["kind"] == "mail" else (lambda b: b)(C.measures(g)["bbox"])
    L = LK.build((sd, dd), box)
    lock = {}
    for mode in ("light", "dark", "mono"):
        nf, sf, df, nd, s2, d2 = LK.svg_doc(L, mode)
        # ink bounds of the whole lockup
        mk = C.measures(g)["bbox"]
        mx0, my0, mx1, my1 = (mk[0] * L["k"] + L["tx"], mk[1] * L["k"] + L["ty"], mk[2] * L["k"] + L["tx"], mk[3] * L["k"] + L["ty"])
        x0, y0 = 0.0, min(L["top_ink"], my0)
        x1, y1 = mx1, max(L["bottom_ink"], my1)
        vb = f"{fmt(x0)} {fmt(y0)} {fmt(x1 - x0)} {fmt(y1 - y0)}"
        if nf == sf == df:
            body = f'<path fill="{nf}" d="{nd}{s2}{d2}"/>'
        elif nf == sf:
            body = f'<path fill="{nf}" d="{nd}{s2}"/><path fill="{df}" d="{d2}"/>'
        else:
            body = f'<path fill="{nf}" d="{nd}"/><path fill="{sf}" d="{s2}"/><path fill="{df}" d="{d2}"/>'
        suffix = {"light": "", "dark": "-dark", "mono": "-mono"}[mode]
        files[f"{cid}-horizontal{suffix}.svg"] = doc(vb, body, "لمسة تاب — LamsaTap، القفل الأفقي (مفهوم داخلي " + cid + ")")
        lock[mode] = (x1 - x0, y1 - y0, L["h"])
    # vertical lockup (AD 16.5): mark centred above the name block, surface height = h, gap 0.35h
    for mode in ("light", "dark", "mono"):
        nf, sf, df, nd, _, _ = LK.svg_doc(L, mode)
        k = L["k"]
        mk = C.measures(g)["bbox"]
        mw = (mk[2] - mk[0]) * k
        mtop = L["top_ink"] - 0.35 * L["h"] - (mk[3] - mk[1]) * k      # mark above the Arabic ink top
        tx = L["name_w"] / 2 - ((mk[0] + mk[2]) / 2) * k
        ty = mtop - mk[1] * k
        s2 = LK.transform_path(sd, k, tx, ty)
        d2 = LK.transform_path(dd, k, tx, ty)
        x0, y0 = min(0.0, tx + mk[0] * k), mtop
        x1, y1 = max(L["name_w"], tx + mk[2] * k), L["bottom_ink"]
        vb = f"{fmt(x0)} {fmt(y0)} {fmt(x1 - x0)} {fmt(y1 - y0)}"
        if nf == sf == df:
            body = f'<path fill="{nf}" d="{nd}{s2}{d2}"/>'
        else:
            body = f'<path fill="{nf}" d="{nd}{s2}"/><path fill="{df}" d="{d2}"/>'
        suffix = {"light": "", "dark": "-dark", "mono": "-mono"}[mode]
        files[f"{cid}-logo{suffix}.svg"] = doc(vb, body, "لمسة تاب — LamsaTap، القفل العمودي (مفهوم داخلي " + cid + ")")
    for old in out.glob(f"{cid}-*.svg"):
        if old.name not in files:
            old.unlink()
    for name, s in files.items():
        (out / name).write_text(s, encoding="utf-8")
    return out, files, lock, L


if __name__ == "__main__":
    for cid, g in C.CONCEPTS.items():
        out, files, lock, L = write(cid, g, C.NAMES[cid])
        print(cid, {k: len(v) for k, v in files.items()}, lock["light"], round(L["k_en"], 3))
