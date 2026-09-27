"""Exact geometry for web-illustrator logo concepts (512 grid). Imported by the sheet/build scripts."""
import math
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from geo import poly_path, circle_path, sample_poly, fillet_data  # noqa

H = 224  # surface height (AD 16.2)


def lean_c(s, h=H):
    """Inset (per unit radius) of the rendered left/right extreme from the sharp vertex, for the acute corners
    of a parallelogram slanted by s over h: extreme = fillet centre x - r = vertex + (bx/sin(th/2) - 1) * r."""
    L = math.hypot(s, h)
    th = math.acos(s / L)
    bx = (1 + s / L) / math.hypot(1 + s / L, h / L)
    return bx / math.sin(th / 2) - 1


def mail(s, r, top, xleft, extent, cx, cy, d=128, h=H):
    """«الميلان» surface: top edge shifted LEFT by s vs bottom; rendered left extreme at xleft, right extreme at
    xleft+extent (both on the 32 grid). Returns dict with polygon, radius, dot."""
    c = lean_c(s, h)
    xl = xleft - c * r
    w = extent - s + 2 * c * r
    P = [(xl, top), (xl + w, top), (xl + w + s, top + h), (xl + s, top + h)]
    return dict(kind="mail", poly=P, radii=r, dot=(cx, cy, d / 2), s=s, r=r, w=w, top=top, h=h)


def tri(right, top, leg, ra, R, cx, cy, d=128):
    """Concept X1: right isosceles triangle (right angle top-right), dot facing the hypotenuse."""
    vx = right - leg
    P = [(vx, top), (right, top), (right, top + leg)]
    return dict(kind="tri", poly=P, radii=[ra, R, ra], dot=(cx, cy, d / 2), leg=leg, ra=ra, R=R)


def paths(g):
    return poly_path(g["poly"], g["radii"]), circle_path(*g["dot"])


def measures(g):
    pts = np.array(sample_poly(g["poly"], g["radii"], step=0.25))
    cx, cy, R = g["dot"]
    gap = float(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy).min() - R)
    far = max(float(np.hypot(pts[:, 0] - 256, pts[:, 1] - 256).max()), math.hypot(cx - 256, cy - 256) + R)
    off = math.hypot(cx - 256, cy - 256) / 512
    x0 = min(pts[:, 0].min(), cx - R)
    x1 = max(pts[:, 0].max(), cx + R)
    y0 = min(pts[:, 1].min(), cy - R)
    y1 = max(pts[:, 1].max(), cy + R)
    out = dict(gap=round(gap, 1), far=round(far, 1), off=round(off, 3), bbox=tuple(round(v, 2) for v in (x0, y0, x1, y1)),
               shape_ext=tuple(round(v, 2) for v in (pts[:, 0].min(), pts[:, 1].min(), pts[:, 0].max(), pts[:, 1].max())))
    if g["kind"] == "mail":
        out["f"] = round((cy - g["top"]) / g["h"], 3)
        out["w"] = round(g["w"], 2)
        out["slant_deg"] = round(math.degrees(math.atan2(g["s"], g["h"])), 1)
    return out


# ---- the concepts (final choices are made in the notes) ----
AD_START = dict(kind="mail", poly=[(64, 160), (256, 160), (320, 384), (128, 384)], radii=24, dot=(400, 240, 48), s=64, r=24, w=192,
                top=160, h=H)

TRI_INSET = 1 / math.sin(math.radians(22.5)) * math.cos(math.radians(22.5)) - 1  # 45deg corner: extreme = vertex + 1.414 r


def tri_on_grid(right, top, left_ext, r, cx, cy, d=128):
    """Right-angle top-right triangle with ALL corners radius r, sized so its rounded left/bottom extremes sit on left_ext."""
    vx = left_ext - TRI_INSET * r
    leg = right - vx
    return tri(right, top, leg, r, r, cx, cy, d)


CONCEPTS = {
    # 1 «البلاطة»: 6-cell surface (192), 16.3deg, corners 32, nearly square (w/h .99), dot at 1/3, centred on both axes
    "illus-1": mail(s=56, r=32, top=160, xleft=64, extent=224, cx=384, cy=224, h=192),
    # 2 «الصفحة»: 8-cell surface (256), 12.3deg, corners 24, page proportion (w/h .70 ~ 1:sqrt2), dot at 3/8, centred
    "illus-2": mail(s=56, r=24, top=128, xleft=64, extent=224, cx=384, cy=224, h=256),
    # 3 «البلاطة الحادة»: same 6-cell tile and 16.3deg as illus-1, corners 16 (crisp), w/h .93, dot at 1/3, centred
    "illus-3": mail(s=56, r=16, top=160, xleft=64, extent=224, cx=384, cy=224, h=192),
    # 4 «المماس» (outside the direction): right triangle + nested dot, all corners 28, centred
    "illus-4": tri_on_grid(right=416, top=96, left_ext=128, r=28, cx=160, cy=352),
}

NAMES = {"illus-1": "البلاطة", "illus-2": "الصفحة", "illus-3": "البلاطة الحادة", "illus-4": "المماس"}

if __name__ == "__main__":
    for k, g in {"AD": AD_START, **CONCEPTS}.items():
        print(k, measures(g))
