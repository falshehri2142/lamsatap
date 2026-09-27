"""Geometry helpers for logo concepts (web-illustrator scratch).
All shapes: closed outlines made of straight segments + circular fillet arcs (SVG 'A').
Coordinates: 512 grid, y down.
"""
import math

import numpy as np

C = 256.0


def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def rot(p, deg, c=(C, C)):
    a = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def rect(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


def orient(poly):
    """Signed area (screen coords, y down): >0 means clockwise on screen."""
    a = 0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        a += x1 * y2 - x2 * y1
    return a / 2


def fillet_data(poly, radii):
    n = len(poly)
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * n
    cw = orient(poly) > 0
    out = []
    for i in range(n):
        A, P, B = np.array(poly[i - 1], float), np.array(poly[i], float), np.array(poly[(i + 1) % n], float)
        r = radii[i]
        u = (A - P) / np.linalg.norm(A - P)
        v = (B - P) / np.linalg.norm(B - P)
        cross = (P - A)[0] * (B - P)[1] - (P - A)[1] * (B - P)[0]
        convex = (cross > 0) == cw
        if r <= 0:
            out.append(dict(P=P, p1=P, p2=P, r=0, sweep=0, convex=convex))
            continue
        th = math.acos(max(-1, min(1, float(u @ v))))
        t = r / math.tan(th / 2)
        p1, p2 = P + u * t, P + v * t
        bis = (u + v) / np.linalg.norm(u + v)
        center = P + bis * (r / math.sin(th / 2))
        sweep = 1 if cross > 0 else 0
        out.append(dict(P=P, p1=p1, p2=p2, r=r, sweep=sweep, center=center, convex=convex,
                        tlen=t, elen=(float(np.linalg.norm(A - P)), float(np.linalg.norm(B - P)))))
    return out


def poly_path(poly, radii=0):
    d = fillet_data(poly, radii)
    s = [f"M{fmt(d[-1]['p2'][0])} {fmt(d[-1]['p2'][1])}"]
    for f in d:
        s.append(f"L{fmt(f['p1'][0])} {fmt(f['p1'][1])}")
        if f["r"] > 0:
            s.append(f"A{fmt(f['r'])} {fmt(f['r'])} 0 0 {f['sweep']} {fmt(f['p2'][0])} {fmt(f['p2'][1])}")
    s.append("Z")
    return "".join(s)


def check_fillets(poly, radii):
    """Warn if tangent lengths overlap on an edge."""
    d = fillet_data(poly, radii)
    n = len(poly)
    bad = []
    for i in range(n):
        j = (i + 1) % n
        L = float(np.linalg.norm(np.array(poly[j]) - np.array(poly[i])))
        need = d[i].get("tlen", 0) + d[j].get("tlen", 0)
        if need > L + 1e-6:
            bad.append((i, j, L, need))
    return bad


def circle_path(cx, cy, r):
    return (f"M{fmt(cx - r)} {fmt(cy)}A{fmt(r)} {fmt(r)} 0 1 0 {fmt(cx + r)} {fmt(cy)}"
            f"A{fmt(r)} {fmt(r)} 0 1 0 {fmt(cx - r)} {fmt(cy)}Z")


def sample_poly(poly, radii=0, step=0.5):
    """Dense outline points (for measuring)."""
    d = fillet_data(poly, radii)
    pts = []
    for f in d:
        if f["r"] > 0:
            c = f["center"]
            a1 = math.atan2(f["p1"][1] - c[1], f["p1"][0] - c[0])
            a2 = math.atan2(f["p2"][1] - c[1], f["p2"][0] - c[0])
            # go the short way consistent with sweep
            da = a2 - a1
            if f["sweep"] == 1:
                while da < 0:
                    da += 2 * math.pi
            else:
                while da > 0:
                    da -= 2 * math.pi
            k = max(2, int(abs(da) * f["r"] / step))
            for t in np.linspace(0, 1, k):
                a = a1 + da * t
                pts.append((c[0] + f["r"] * math.cos(a), c[1] + f["r"] * math.sin(a)))
        else:
            pts.append(tuple(f["P"]))
    # add straight segments densely
    dense = []
    for i in range(len(pts)):
        a, b = np.array(pts[i]), np.array(pts[(i + 1) % len(pts)])
        L = np.linalg.norm(b - a)
        k = max(1, int(L / step))
        for t in np.linspace(0, 1, k, endpoint=False):
            dense.append(tuple(a + (b - a) * t))
    return dense


def sample_circle(cx, cy, r, step=0.5):
    k = max(16, int(2 * math.pi * r / step))
    return [(cx + r * math.cos(t), cy + r * math.sin(t)) for t in np.linspace(0, 2 * math.pi, k, endpoint=False)]


def far(points):
    p = np.array(points)
    return float(np.hypot(p[:, 0] - C, p[:, 1] - C).max())


def min_dist(points, cx, cy):
    p = np.array(points)
    return float(np.hypot(p[:, 0] - cx, p[:, 1] - cy).min())


def bbox(points):
    p = np.array(points)
    return p[:, 0].min(), p[:, 1].min(), p[:, 0].max(), p[:, 1].max()


def svg(paths, size=512, title="", bg=None):
    """paths: list of (d, fill)."""
    body = "".join(f'<path d="{d}" fill="{f}"/>' for d, f in paths)
    t = f"<title>{title}</title>" if title else ""
    b = f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img">{t}{b}{body}</svg>')
