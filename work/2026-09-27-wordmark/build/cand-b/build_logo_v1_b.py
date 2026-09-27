#!/usr/bin/env python3
"""LamsaTap logo, candidate B ("optical craft"), version 1.

Brief: work/2026-09-27-wordmark/decision.md (GM-033). Reference: brand-source/owner-logo-2026-09-27.png.

Every outline in this file is drawn here from geometry (lines, circular arcs, cubic curves).
No font file is opened or copied: the wordmark and SINCE 2026 are our own drawing, which the
trademark filing needs. Paths are merged with skia-pathops, one filled path per colour.

Units: H = cap height = 1000, y up, baseline y = 0. SVG files are written with H = 100.

Run from anywhere:
    python build_logo_v1_b.py              # SVG files + measurements
    python build_logo_v1_b.py --previews   # also the preview PNGs (headless Edge or Chrome)
"""
import argparse
import math
import os
import shutil
import subprocess
import sys
import tempfile

import pathops
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------- colours (decision.md table)
TEAL, INK, SAND, SAFFRON, WHITE, BLACK = "#0B7A75", "#14201F", "#FAF7F2", "#F2A93B", "#FFFFFF", "#000000"

# ---------------------------------------------------------------- the two weights
# Brief numbers: LAMSA stem 0.30H, horizontals 0.21-0.26H, corner radius 0.07H;
# TAP stem 0.20H, horizontals 0.175H, corner radius 0.045H.
HEAVY = dict(stem=300.0, horiz=235.0, r=70.0)
LIGHT = dict(stem=200.0, horiz=175.0, r=45.0)


# ================================================================ geometry kernel
def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def mul(a, k):
    return (a[0] * k, a[1] * k)


def norm(a):
    n = math.hypot(a[0], a[1])
    return (a[0] / n, a[1] / n)


def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1]


def rot(a, t):
    c, s = math.cos(t), math.sin(t)
    return (a[0] * c - a[1] * s, a[0] * s + a[1] * c)


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


class Contour:
    """A closed outline: a start point, then ('L', p) and ('C', c1, c2, p) segments."""

    def __init__(self, start):
        self.start = start
        self.segs = []

    @property
    def end(self):
        return self.segs[-1][-1] if self.segs else self.start

    def line(self, p):
        if math.dist(p, self.end) > 1e-9:
            self.segs.append(("L", p))
        return self

    def curve(self, c1, c2, p):
        self.segs.append(("C", c1, c2, p))
        return self

    def turn(self, u, v, r, corner):
        """Circular fillet of radius r at `corner` between direction u (in) and v (out).
        The contour must already sit on the incoming tangent point; returns the outgoing one."""
        phi = math.atan2(cross(u, v), dot(u, v))
        a = abs(phi)
        d = r * math.tan(a / 2)
        t1, t2 = sub(corner, mul(u, d)), add(corner, mul(v, d))
        self.line(t1)
        arc_between(self, t1, u, t2, v, r, phi)
        return t2

    def draw(self, pen):
        pen.moveTo(self.start)
        for s in self.segs:
            if s[0] == "L":
                pen.lineTo(s[1])
            else:
                pen.curveTo(s[1], s[2], s[3])
        pen.closePath()

    def moved(self, dx, dy):
        f = lambda p: (p[0] + dx, p[1] + dy)
        c = Contour(f(self.start))
        c.segs = [(s[0],) + tuple(f(p) for p in s[1:]) for s in self.segs]
        return c

    def transformed(self, fn):
        c = Contour(fn(self.start))
        c.segs = [(s[0],) + tuple(fn(p) for p in s[1:]) for s in self.segs]
        return c


def arc_between(c, t1, u, t2, v, r, phi):
    """Append a circular arc from t1 (tangent u) to t2 (tangent v); phi = signed turn angle.
    Arcs over 90 degrees are split in two so the cubic error stays under 0.03% of r."""
    a = abs(phi)
    if a < 1e-9:
        c.line(t2)
        return
    if a > math.pi / 2 + 1e-9:
        # centre of the arc, then the middle point and its tangent
        n = (-u[1], u[0]) if phi > 0 else (u[1], -u[0])
        ctr = add(t1, mul(n, r))
        m = add(ctr, rot(sub(t1, ctr), phi / 2))
        um = rot(u, phi / 2)
        arc_between(c, t1, u, m, um, r, phi / 2)
        arc_between(c, m, um, t2, v, r, phi / 2)
        return
    k = 4.0 / 3.0 * math.tan(a / 4) * r
    c.curve(add(t1, mul(u, k)), sub(t2, mul(v, k)), t2)


def rpoly(pts, radii):
    """Polygon with a circular fillet at every vertex (radius 0 = sharp). Works for convex and
    concave corners; checks that neighbouring fillets fit on each edge."""
    n = len(pts)
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * n
    fil = []
    for i in range(n):
        a, p, b = pts[i - 1], pts[i], pts[(i + 1) % n]
        u, v = norm(sub(p, a)), norm(sub(b, p))
        phi = math.atan2(cross(u, v), dot(u, v))
        r = radii[i]
        d = r * math.tan(abs(phi) / 2) if r > 0 else 0.0
        fil.append((p, u, v, phi, r, d))
    for i in range(n):
        p, _, _, _, _, d0 = fil[i]
        q, _, _, _, _, d1 = fil[(i + 1) % n]
        if d0 + d1 > math.dist(p, q) + 1e-6:
            raise ValueError(f"fillets overlap on edge {i}: {d0:.1f} + {d1:.1f} > {math.dist(p, q):.1f}")
    p, u, v, phi, r, d = fil[0]
    c = Contour(add(p, mul(v, d)))
    for i in list(range(1, n)) + [0]:
        p, u, v, phi, r, d = fil[i]
        if d == 0:
            c.line(p)
        else:
            t1, t2 = sub(p, mul(u, d)), add(p, mul(v, d))
            c.line(t1)
            arc_between(c, t1, u, t2, v, r, phi)
    return c


def circle(cx, cy, r, ccw=True):
    k = 4.0 / 3.0 * math.tan(math.pi / 8) * r
    c = Contour((cx + r, cy))
    pts = [(cx + r, cy), (cx, cy + r), (cx - r, cy), (cx, cy - r)]
    if not ccw:
        pts = [pts[0], pts[3], pts[2], pts[1]]
    for i in range(4):
        p, q = pts[i], pts[(i + 1) % 4]
        tp = norm(rot(sub(p, (cx, cy)), math.pi / 2 if ccw else -math.pi / 2))
        tq = norm(rot(sub(q, (cx, cy)), math.pi / 2 if ccw else -math.pi / 2))
        c.curve(add(p, mul(tp, k)), sub(q, mul(tq, k)), q)
    return c


# ---------------------------------------------------------------- boolean ops (skia-pathops)
def to_path(contours):
    p = pathops.Path()
    pen = p.getPen()
    for c in contours:
        c.draw(pen)
    return p


def p_union(paths):
    out = pathops.Path()
    for p in paths:
        out = pathops.op(out, p, pathops.PathOp.UNION)
    return out


def p_diff(a, b):
    return pathops.op(a, b, pathops.PathOp.DIFFERENCE)


def p_moved(path, dx, dy, k=1.0):
    out = pathops.Path()
    path.draw(TransformPen(out.getPen(), (k, 0, 0, k, dx, dy)))
    return out


def p_record(path):
    rp = RecordingPen()
    path.draw(rp)
    return rp.value


def p_bounds(path):
    if not list(path.segments):
        return None
    return path.bounds  # (xmin, ymin, xmax, ymax)


class Glyph:
    """Ink = union(pos) minus union(neg). adv_l/adv_r are the ink edges (computed)."""

    def __init__(self, name, pos, neg=(), weight=None):
        self.name, self.weight = name, weight
        path = p_union([to_path([c]) for c in pos])
        if neg:
            path = p_diff(path, p_union([to_path([c]) for c in neg]))
        self.path = path
        self.bounds = p_bounds(path)


# ================================================================ letters of LAMSATAP
H = 1000.0


def glyph_L(w, W):
    s, f, r = w["stem"], w["horiz"], w["r"]
    pts = [(0, 0), (W, 0), (W, f), (s, f), (s, H), (0, H)]
    return Glyph("L", [rpoly(pts, [r, r, r, 0, r, r])], weight=w)


def a_trim(r, s):
    """How far the rounded foot of an A (acute corner) sits inside the unrounded vertex."""
    alpha = math.atan2(1.0, s)            # inside angle at the foot
    return r * (1.0 / math.tan(alpha / 2) - 1.0)


def glyph_A(w, W, slope, run_bot, run_top, bar_bot, bar_top, r_notch=0.0, r_counter=0.0,
            apex_trap=None):
    """Flat-apex A. slope = dx/dy of the outer edges; run_* = horizontal leg width at y=0 / y=H
    (run_top < run_bot tapers the legs into the apex); bar_* = crossbar edges.
    apex_trap = (depth, half_width): optional ink trap cut into the top of the counter."""
    r = w["r"]
    B = W + 2 * a_trim(r, slope)
    x0 = -B / 2

    def outer(y):
        return x0 + slope * y

    def inner(y):
        return x0 + slope * y + run_bot + (run_top - run_bot) * y / H

    y_apex = (-x0 - run_bot) / (slope + (run_top - run_bot) / H)
    pts = [(x0, 0), (inner(0), 0), (inner(bar_bot), bar_bot), (-inner(bar_bot), bar_bot),
           (-inner(0), 0), (-x0, 0), (-outer(H), H), (outer(H), H)]
    radii = [r, r, r_notch, r_notch, r, r, r, r]
    body = rpoly(pts, radii)
    cpts = [(inner(bar_top), bar_top), (-inner(bar_top), bar_top), (0.0, y_apex)]
    counter = rpoly(cpts, [r_counter, r_counter, 0.0])
    neg = [counter]
    if apex_trap:
        depth, hw = apex_trap
        # a narrow slot that continues the counter's apex upward, round-ended
        neg.append(rpoly([(-hw, y_apex - 4 * hw), (hw, y_apex - 4 * hw), (hw, y_apex + depth),
                          (-hw, y_apex + depth)], [0, 0, hw * 0.999, hw * 0.999]))
    g = Glyph("A", [body.moved(B / 2 - a_trim(r, slope), 0)],
              [c.moved(B / 2 - a_trim(r, slope), 0) for c in neg], weight=w)
    g.y_apex, g.B = y_apex, B
    return g


def glyph_M(w, W, stem, diag, slope, r_side=0.0, r_notch=0.0, r_v=None):
    """M with vertical stems; diagonals start on the stem centre line at the cap height."""
    r = w["r"]
    xs = stem / 2
    h = diag * math.sqrt(1 + slope * slope)          # horizontal run of the diagonal
    xt = xs + h / 2                                    # top flat of each half ends here
    y_n = H - (W / 2 - xs - h / 2) / slope            # top notch vertex
    y_sn = H - (stem - xs + h / 2) / slope            # side notch apex
    y_vb = H - (W / 2 - xs + h / 2) / slope           # V bottom (sharp) vertex
    pts = [(0, 0), (stem, 0), (stem, y_sn), (W / 2, y_vb), (W - stem, y_sn), (W - stem, 0), (W, 0),
           (W, H), (W - xt, H), (W / 2, y_n), (xt, H), (0, H)]
    rv = r if r_v is None else r_v
    radii = [r, r, r_side, rv, r_side, r, r, r, r, r_notch, r, r]
    g = Glyph("M", [rpoly(pts, radii)], weight=w)
    g.y_n, g.y_sn, g.y_vb = y_n, y_sn, y_vb
    return g


def glyph_T(w, W, stem, bar, trap=None):
    """T. trap = (depth, width): ink traps cut into the stem just under the bar."""
    r = w["r"]
    xs0, xs1 = (W - stem) / 2, (W + stem) / 2
    yb = H - bar
    pts = [(xs0, 0), (xs1, 0), (xs1, yb), (W, yb), (W, H), (0, H), (0, yb), (xs0, yb)]
    neg = []
    if trap:
        d, tw = trap
        for sx, x in ((1, xs0), (-1, xs1)):
            # a small rounded notch that eats into the stem under the bar
            neg.append(rpoly([(x - sx * 1, yb + 1), (x + sx * d, yb + 1), (x + sx * d, yb - tw), (x - sx * 1, yb - tw)]
                             if sx > 0 else
                             [(x + d * sx, yb + 1), (x + 1, yb + 1), (x + 1, yb - tw), (x + d * sx, yb - tw)],
                             [0, 0, 0, 0]))
    return Glyph("T", [rpoly(pts, [r, r, 0, r, r, r, r, 0])], neg, weight=w)


def bowl_curve(c, p0, p1, k0, k1, first_h=True):
    """Quarter 'squircle' from p0 to p1. first_h: tangent at p0 is horizontal (else vertical).
    k0, k1 = handle length as a fraction of the extent in each direction."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    if first_h:
        c.curve((p0[0] + k0 * dx, p0[1]), (p1[0], p1[1] - k1 * dy), p1)
    else:
        c.curve((p0[0], p0[1] + k0 * dy), (p1[0] - k1 * dx, p1[1]), p1)


def glyph_P(w, W, stem, top, bot, right, y_pb, k_out=0.60, k_in=0.66, r_in=0.0, x_flat=None):
    """P: stem + D-shaped bowl. top/bot = bowl stroke thickness, right = bowl's right side,
    y_pb = outer bottom of the bowl. x_flat = where the outer top/bottom flats end."""
    r = w["r"]
    y_m = (H + y_pb) / 2
    a_out = (H - y_pb) / 2 if x_flat is None else W - x_flat
    xf = W - a_out
    c = Contour((r, 0.0))
    c.line((stem - r, 0.0))
    c.turn((1, 0), (0, 1), r, (stem, 0.0))
    c.line((stem, y_pb))                       # crotch under the bowl: sharp
    c.line((xf, y_pb))
    bowl_curve(c, (xf, y_pb), (W, y_m), k_out, k_out, first_h=True)
    bowl_curve(c, (W, y_m), (xf, H), k_out, k_out, first_h=False)
    c.line((r, H))
    c.turn((-1, 0), (0, -1), r, (0.0, H))
    c.line((0.0, r))
    c.turn((0, -1), (1, 0), r, (0.0, 0.0))
    # counter
    yt, yb = H - top, y_pb + bot
    xr = W - right
    ym_i = (yt + yb) / 2
    a_in = xr - xf
    cc = Contour((stem, yb))
    cc.line((xf, yb))
    bowl_curve(cc, (xf, yb), (xr, ym_i), k_in, k_in, first_h=True)
    bowl_curve(cc, (xr, ym_i), (xf, yt), k_in, k_in, first_h=False)
    cc.line((stem, yt))
    g = Glyph("P", [c], [cc], weight=w)
    g.counter = (stem, yb, xr, yt)
    return g


# ---------------------------------------------------------------- cubic helpers (for the S)
def cub_at(P, t):
    p0, c1, c2, p3 = P
    mt = 1 - t
    return (mt ** 3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p3[0],
            mt ** 3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p3[1])


def cub_tan(P, t):
    p0, c1, c2, p3 = P
    mt = 1 - t
    d = (3 * mt * mt * (c1[0] - p0[0]) + 6 * mt * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]),
         3 * mt * mt * (c1[1] - p0[1]) + 6 * mt * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1]))
    return norm(d)


def cub_split(P, t):
    p0, c1, c2, p3 = P
    a, b, c = lerp(p0, c1, t), lerp(c1, c2, t), lerp(c2, p3, t)
    d, e = lerp(a, b, t), lerp(b, c, t)
    m = lerp(d, e, t)
    return (p0, a, d, m), (m, e, c, p3)


def cub_rev(P):
    return (P[3], P[2], P[1], P[0])


def quarter(p, q, k, h_first):
    """Quarter squircle from p to q. h_first: horizontal tangent at p (vertical at q), else the reverse.
    k = handle length as a fraction of the extent (0.5523 = circle; higher = squarer)."""
    if h_first:
        return (p, (p[0] + k * (q[0] - p[0]), p[1]), (q[0], q[1] + k * (p[1] - q[1])), q)
    return (p, (p[0], p[1] + k * (q[1] - p[1])), (q[0] + k * (p[0] - q[0]), q[1]), q)


def fillet_vertical(P, X, r, ink_left, forward=True, ink_right_of_travel=True):
    """Circle of radius r tangent to cubic P (traversed forward or backward) and to the vertical
    line x = X. ink_left: the ink lies left of the cut line. ink_right_of_travel: the ink lies on
    the right of the travel direction (clockwise contour). Returns (t, centre, point, tangent)."""
    want = X - r if ink_left else X + r

    def centre(t):
        tg = cub_tan(P, t)
        if not forward:
            tg = (-tg[0], -tg[1])
        q = cub_at(P, t)
        nrm = (tg[1], -tg[0]) if ink_right_of_travel else (-tg[1], tg[0])
        return add(q, mul(nrm, r)), q, tg

    lo, hi = 0.0, 1.0
    f_lo = centre(lo)[0][0] - want
    for _ in range(80):
        mid = (lo + hi) / 2
        f = centre(mid)[0][0] - want
        if (f > 0) == (f_lo > 0):
            lo, f_lo = mid, f
        else:
            hi = mid
    t = (lo + hi) / 2
    ctr, q, tg = centre(t)
    return t, ctr, q, tg


def glyph_S(w, p):
    """S built from four squircle bowls (outer/inner, upper/lower) joined by a controlled spine,
    with vertical terminal cuts and exact curve-to-line fillets. Clockwise from the top."""
    r = w["r"] * p.get("r_scale", 1.0)
    yt, yb = H + p["ot"], -p["ob"]
    A2, Ro, A3 = (p["xo_top"], yt), (p["xo_r"], p["yo_r"]), (p["xo_l"], p["yo_l"])
    B5, Ri, B4 = (p["xi_top"], yt - p["t_top"]), (p["xi_r"], p["yi_r"]), (p["xi_l"], p["yi_l"])
    B2, Lo, B3 = (p["xo_bot"], yb), (p["xo_bl"], p["yo_bl"]), (p["xo_br"], p["yo_br"])
    A5, Li, A4 = (p["xi_bot"], yb + p["t_bot"]), (p["xi_bl"], p["yi_bl"]), (p["xi_br"], p["yi_br"])
    th = math.radians(p["a_sp"])
    d = (math.cos(th), -math.sin(th))            # spine heading (right, down)
    nrm = (math.sin(th), math.cos(th))
    C = (p["x_sp"], p["y_sp"])
    Bsp, Asp = add(C, mul(nrm, p["t_sp"] / 2)), sub(C, mul(nrm, p["t_sp"] / 2))

    Qo_ur = quarter(A2, Ro, p["k_o"], True)
    Qi_ur = quarter(B5, Ri, p["k_i"], True)
    Qo_ul = quarter(A3, A2, p["k_o"], False)
    Qi_ul = quarter(B5, B4, p["k_i"], True)
    Qo_lr = quarter(B3, B2, p["k_o"], False)
    Qo_ll = quarter(B2, Lo, p["k_o"], True)
    Qi_lr = quarter(A5, A4, p["k_i"], True)
    Qi_ll = quarter(A5, Li, p["k_i"], True)

    c = Contour(A2)
    # top terminal: cut at x = X_t, ink on the left of the cut
    Xt = p["x_tr"]
    t1, c1, q1, g1 = fillet_vertical(Qo_ur, Xt, r, ink_left=True, forward=True)
    seg, _ = cub_split(Qo_ur, t1)
    c.curve(seg[1], seg[2], seg[3])
    e1 = (Xt, c1[1])
    arc_between(c, q1, g1, e1, (0, -1), r, math.atan2(cross(g1, (0, -1)), dot(g1, (0, -1))))
    t2, c2, q2, g2 = fillet_vertical(Qi_ur, Xt, r, ink_left=True, forward=False)
    if c2[1] > c1[1] + 1e-6:
        raise ValueError(f"S top terminal: fillets overlap ({c2[1]:.1f} > {c1[1]:.1f})")
    c.line((Xt, c2[1]))
    arc_between(c, (Xt, c2[1]), (0, -1), q2, g2, r, math.atan2(cross((0, -1), g2), dot((0, -1), g2)))
    seg, _ = cub_split(Qi_ur, t2)
    seg = cub_rev(seg)
    c.curve(seg[1], seg[2], seg[3])                                   # back to B5
    c.curve(Qi_ul[1], Qi_ul[2], Qi_ul[3])                              # B5 -> B4
    # spine, upper edge: B4 -> Bsp -> B3
    c.curve((B4[0], B4[1] - p["h_s1"] * (B4[1] - Bsp[1])), sub(Bsp, mul(d, p["h_s2"] * math.dist(B4, Bsp))), Bsp)
    c.curve(add(Bsp, mul(d, p["h_s3"] * math.dist(Bsp, B3))), (B3[0], B3[1] + p["h_s4"] * (Bsp[1] - B3[1])), B3)
    c.curve(Qo_lr[1], Qo_lr[2], Qo_lr[3])                              # B3 -> B2
    # bottom terminal: cut at x = X_b, ink on the right of the cut
    Xb = p["x_bl"]
    t3, c3, q3, g3 = fillet_vertical(Qo_ll, Xb, r, ink_left=False, forward=True)
    seg, _ = cub_split(Qo_ll, t3)
    c.curve(seg[1], seg[2], seg[3])
    f1 = (Xb, c3[1])
    arc_between(c, q3, g3, f1, (0, 1), r, math.atan2(cross(g3, (0, 1)), dot(g3, (0, 1))))
    t4, c4, q4, g4 = fillet_vertical(Qi_ll, Xb, r, ink_left=False, forward=False)
    if c4[1] < c3[1] - 1e-6:
        raise ValueError(f"S bottom terminal: fillets overlap ({c4[1]:.1f} < {c3[1]:.1f})")
    c.line((Xb, c4[1]))
    arc_between(c, (Xb, c4[1]), (0, 1), q4, g4, r, math.atan2(cross((0, 1), g4), dot((0, 1), g4)))
    seg, _ = cub_split(Qi_ll, t4)
    seg = cub_rev(seg)
    c.curve(seg[1], seg[2], seg[3])                                   # back to A5
    c.curve(Qi_lr[1], Qi_lr[2], Qi_lr[3])                              # A5 -> A4
    # spine, lower edge: A4 -> Asp -> A3
    c.curve((A4[0], A4[1] + p["h_s5"] * (Asp[1] - A4[1])), add(Asp, mul(d, p["h_s6"] * math.dist(A4, Asp))), Asp)
    c.curve(sub(Asp, mul(d, p["h_s7"] * math.dist(Asp, A3))), (A3[0], A3[1] - p["h_s8"] * (A3[1] - Asp[1])), A3)
    c.curve(Qo_ul[1], Qo_ul[2], Qo_ul[3])                              # A3 -> A2
    g = Glyph("S", [c], weight=w)
    g.pts = dict(A2=A2, A3=A3, A4=A4, A5=A5, B2=B2, B3=B3, B4=B4, B5=B5, Asp=Asp, Bsp=Bsp, C=C,
                 T1=q1, T2=q2, T3=q3, T4=q4)
    return g


# ================================================================ the symbol (owner's four pieces)
def symbol(cell=100.0, gap_ratio=0.10):
    """Owner's mark on a 4x4 grid (reference fit IoU 0.974, work/2026-09-27-wordmark/reference-fit).
    Each piece: outer quarter disc in a corner cell + the next edge cell + an inner quarter disc
    (same centre as the outer one) that bulges toward the middle. Four pieces, rotated 90 degrees.
    The pieces touched at the four star tips in the reference; here each piece moves out along its
    diagonal by gap/2 in x and y, so every tip has a clear gap = gap_ratio * cell (brief: no hairline
    contact, clean cut for vinyl). Returns the merged path with the mark's top-left at (0, 0) in
    y-up units (so the mark spans y from -side to 0), and the side length."""
    c = cell
    g = gap_ratio * c
    pieces = []
    # top-left piece in y-DOWN grid units (x right, y down), then converted to y-up
    k = 4.0 / 3.0 * math.tan(math.pi / 8)

    def tl_piece():
        # outline (y down): (0,1) -arc-> (1,0) -> (2,0) -> (2,1) -arc-> (1,2) -> (1,1) -> close
        P = lambda x, y: (x * c, -y * c)      # to y-up
        cc = Contour(P(0, 1))
        # outer corner arc, centre (1,1), from (0,1) to (1,0) (counter-clockwise on screen = up-left)
        cc.curve(P(0, 1 - k), P(1 - k, 0), P(1, 0))
        cc.line(P(2, 0))
        cc.line(P(2, 1))
        # inner arc, centre (1,1), from (2,1) to (1,2), bulging toward the middle
        cc.curve(P(2, 1 + k), P(1 + k, 2), P(1, 2))
        cc.line(P(1, 1))
        cc.line(P(0, 1))
        return cc

    base = tl_piece()
    ctr = (2 * c, -2 * c)
    for i in range(4):
        ang = -math.pi / 2 * i                 # clockwise on screen = negative in y-up
        dx = (-1 if i in (0, 3) else 1) * g / 2
        dy = (1 if i in (0, 1) else -1) * g / 2  # y-up: top pieces move up
        fn = (lambda a, dx, dy: (lambda p: add(add(rot(sub(p, ctr), a), ctr), (dx, dy))))(ang, dx, dy)
        pieces.append(base.transformed(fn))
    path = p_union([to_path([pc]) for pc in pieces])
    side = 4 * c + g
    # move so that the top-left of the mark is at (0, 0)
    path = p_moved(path, g / 2, -g / 2)
    return path, side


# ================================================================ SINCE 2026 (TAP weight, own cap = 1000)
def squircle(cx, cy, al, ar, bt, bb, k):
    """Closed squircle, counter-clockwise, extremes at left/right/top/bottom."""
    T, R, B, L = (cx, cy + bt), (cx + ar, cy), (cx, cy - bb), (cx - al, cy)
    c = Contour(R)
    for q in (quarter(R, T, k, False), quarter(T, L, k, True), quarter(L, B, k, False), quarter(B, R, k, True)):
        c.curve(q[1], q[2], q[3])
    return c


def _fill_arc(c, p0, u, p1, v, r):
    arc_between(c, p0, u, p1, v, r, math.atan2(cross(u, v), dot(u, v)))


def glyph_C(w, W, os, side, tb, x_cut, k_o=0.58, k_i=0.60, name="C"):
    """Open ring cut by the vertical line x = x_cut on the right (both terminals).
    side = stroke at the left extreme, tb = stroke at top/bottom. Counter-clockwise contour."""
    r = w["r"]
    cy = H / 2
    bo = H / 2 + os
    OT, OR, OB, OL = (W / 2, cy + bo), (W, cy), (W / 2, cy - bo), (0.0, cy)
    bi = bo - tb
    IT, IR, IB, IL = (W / 2, cy + bi), (W - side, cy), (W / 2, cy - bi), (side, cy)
    q_or = quarter(OR, OT, k_o, False)       # upper-right outer, from the right extreme up to the top
    q_br = quarter(OB, OR, k_o, True)        # lower-right outer, from the bottom to the right extreme
    q_ir = quarter(IR, IT, k_i, False)
    q_ibr = quarter(IB, IR, k_i, True)
    t1, c1, p1, g1 = fillet_vertical(q_or, x_cut, r, ink_left=True, forward=True, ink_right_of_travel=False)
    t2, c2, p2, g2 = fillet_vertical(q_br, x_cut, r, ink_left=True, forward=True, ink_right_of_travel=False)
    t3, c3, p3, g3 = fillet_vertical(q_ibr, x_cut, r, ink_left=True, forward=False, ink_right_of_travel=False)
    t4, c4, p4, g4 = fillet_vertical(q_ir, x_cut, r, ink_left=True, forward=False, ink_right_of_travel=False)
    if not (c2[1] <= c3[1] and c4[1] <= c1[1]):
        raise ValueError("C terminals too short for the fillet radius")
    e_top = (x_cut, c1[1])
    c = Contour(e_top)
    _fill_arc(c, e_top, (0, 1), p1, g1, r)
    _, seg = cub_split(q_or, t1)
    c.curve(seg[1], seg[2], seg[3])                                     # -> OT
    for q in (quarter(OT, OL, k_o, True), quarter(OL, OB, k_o, False)):
        c.curve(q[1], q[2], q[3])
    seg, _ = cub_split(q_br, t2)
    c.curve(seg[1], seg[2], seg[3])                                     # -> lower terminal
    _fill_arc(c, p2, g2, (x_cut, c2[1]), (0, 1), r)
    c.line((x_cut, c3[1]))
    _fill_arc(c, (x_cut, c3[1]), (0, 1), p3, g3, r)
    seg, _ = cub_split(q_ibr, t3)
    seg = cub_rev(seg)
    c.curve(seg[1], seg[2], seg[3])                                     # -> IB
    for q in (quarter(IB, IL, k_i, True), quarter(IL, IT, k_i, False)):
        c.curve(q[1], q[2], q[3])
    _, seg = cub_split(q_ir, t4)
    seg = cub_rev(seg)
    c.curve(seg[1], seg[2], seg[3])                                     # IT -> upper terminal
    _fill_arc(c, p4, g4, (x_cut, c4[1]), (0, 1), r)
    c.line(e_top)
    return Glyph(name, [c], weight=w)


def glyph_O(w, W, os, side, tb, k_o=0.58, k_i=0.60, name="0"):
    cy, bo = H / 2, H / 2 + os
    outer = squircle(W / 2, cy, W / 2, W / 2, bo, bo, k_o)
    inner = squircle(W / 2, cy, W / 2 - side, W / 2 - side, bo - tb, bo - tb, k_i)
    return Glyph(name, [outer], [inner], weight=w)


def glyph_I(w):
    s, r = w["stem"], w["r"]
    return Glyph("I", [rpoly([(0, 0), (s, 0), (s, H), (0, H)], r)], weight=w)


def glyph_E(w, W, arm, mid_w, mid_y):
    s, r = w["stem"], w["r"]
    a = arm
    pts = [(0, 0), (W, 0), (W, a), (s, a), (s, mid_y - a / 2), (mid_w, mid_y - a / 2), (mid_w, mid_y + a / 2),
           (s, mid_y + a / 2), (s, H - a), (W, H - a), (W, H), (0, H)]
    radii = [r, r, r, 0, 0, r, r, 0, 0, r, r, r]
    return Glyph("E", [rpoly(pts, radii)], weight=w)


def glyph_N(w, W, stem, diag):
    """N: diagonal from the top of the left stem to the foot of the right stem."""
    r = w["r"]
    s = stem
    # diagonal band: left/upper edge from (0, H) to (W - h, 0); right/lower edge from (h, H) to (W, 0)
    # h chosen so the perpendicular thickness is `diag`
    L = math.hypot(W, H)
    h = diag * L / H                       # horizontal run of the band (approx; refined below)
    for _ in range(20):
        dx = W - h
        h = diag * math.hypot(dx, H) / H
    y_a = H * (1 - s / (W - h))            # band's lower-left edge meets the left stem
    y_c = H * (1 - (W - s - h) / (W - h))  # band's upper-right edge meets the right stem
    pts = [(0, 0), (s, 0), (s, y_a), (W - h, 0), (W, 0), (W, H), (W - s, H), (W - s, y_c), (h, H), (0, H)]
    radii = [r, r, 0, r, r, r, r, 0, r, r]
    return Glyph("N", [rpoly(pts, radii)], weight=w)


def glyph_2(w, W, os, p):
    """Two: squircle hook (left terminal cut vertically) flowing into a straight-ish diagonal that
    lands on a flat base. Clockwise contour, ink on the right."""
    r, tb = w["r"], w["horiz"]
    k_o, k_i = p["k_o"], p["k_i"]
    OT, OR, OL = (p["xo_t"], H + os), (W - p["r_in"], p["y_r"]), (p["xo_l"], p["yo_l"])
    IT, IR, IL = (p["xi_t"], H + os - p["t_top"]), (W - p["r_in"] - p["side"], p["y_ri"]), (p["xi_l"], p["yi_l"])
    al = math.radians(p["a_diag"])
    dl = (-math.cos(al), -math.sin(al))          # diagonal heading (down, left)
    Dl = (0.0, p["y_dl"])                        # inner diagonal edge lands on the left side
    Dr = (p["x_dr"], tb)                         # outer diagonal edge lands on the base
    x_tl = p["x_tl"]
    q_il = quarter(IT, IL, k_i, True)
    q_ol = quarter(OL, OT, k_o, False)
    ta, ca, pa, ga = fillet_vertical(q_il, x_tl, r, ink_left=False, forward=True)
    tb_, cb, pb, gb = fillet_vertical(q_ol, x_tl, r, ink_left=False, forward=True)
    if ca[1] > cb[1]:
        raise ValueError("2: terminal too short")
    # left edge / inner diagonal corner fillet (line up the left side, then up-right along -dl)
    u, v = (0.0, 1.0), (-dl[0], -dl[1])
    phi = math.atan2(cross(u, v), dot(u, v))
    d = r * math.tan(abs(phi) / 2)
    c = Contour((0.0, r))
    c.line((0.0, p["y_dl"] - d))
    s1 = add(Dl, mul(v, d))
    arc_between(c, (0.0, p["y_dl"] - d), u, s1, v, r, phi)
    c.curve(add(s1, mul(v, p["h_d1"] * math.dist(s1, IR))), (IR[0], IR[1] - p["h_d2"] * (IR[1] - s1[1])), IR)
    q = quarter(IR, IT, k_i, False)
    c.curve(q[1], q[2], q[3])
    seg, _ = cub_split(q_il, ta)
    c.curve(seg[1], seg[2], seg[3])
    _fill_arc(c, pa, ga, (x_tl, ca[1]), (0, 1), r)
    c.line((x_tl, cb[1]))
    _fill_arc(c, (x_tl, cb[1]), (0, 1), pb, gb, r)
    _, seg = cub_split(q_ol, tb_)
    c.curve(seg[1], seg[2], seg[3])                                    # -> OT
    q = quarter(OT, OR, k_o, True)
    c.curve(q[1], q[2], q[3])                                           # -> OR
    c.curve((OR[0], OR[1] - p["h_d3"] * (OR[1] - Dr[1])), sub(Dr, mul(dl, p["h_d4"] * math.dist(OR, Dr))), Dr)
    c.line((W - r, tb))
    c.turn((1, 0), (0, -1), r, (W, tb))
    c.line((W, r))
    c.turn((0, -1), (-1, 0), r, (W, 0.0))
    c.line((r, 0.0))
    c.turn((-1, 0), (0, 1), r, (0.0, 0.0))
    return Glyph("2", [c], weight=w)


def glyph_6(w, W, os, p):
    """Six: squircle bowl + a straight stem tangent to the bowl's upper left, cut square to the
    stroke at the top with rounded corners."""
    r = w["r"]
    bh = p["bowl_h"]
    b = bh / 2
    cy = b - os
    k_o, k_i = p["k_o"], p["k_i"]
    outer = squircle(W / 2, cy, W / 2, W / 2, b, b, k_o)
    inner = squircle(W / 2, cy, W / 2 - p["side"], W / 2 - p["side"], b - p["tb"], b - p["tb"], k_i)
    th = math.radians(p["a_stem"])
    u = (math.cos(th), math.sin(th))             # stem heading (up, right)
    n = (math.sin(th), -math.cos(th))            # to its right
    q = quarter((0.0, cy), (W / 2, cy + b), k_o, False)   # upper-left quarter of the bowl
    lo, hi = 0.0, 1.0                             # tangent angle falls from 90 to 0 degrees
    for _ in range(80):
        mid = (lo + hi) / 2
        g = cub_tan(q, mid)
        if math.atan2(g[1], g[0]) > th:
            lo = mid
        else:
            hi = mid
    t0 = cub_at(q, (lo + hi) / 2)
    L = (H + p.get("top_os", 0.0) - t0[1]) / u[1]
    top_l = add(t0, mul(u, L))
    top_r = add(top_l, mul(n, p["stem"]))
    bot_r = add(t0, mul(n, p["stem"]))
    # foot = the bowl's inward normal at the tangent point: it stays inside the ring (any part that
    # reaches the counter is removed with the counter), so the stem's left edge meets the bowl smoothly
    stem = rpoly([t0, bot_r, top_r, top_l], [0, 0, r, r])
    g = Glyph("6", [outer, stem], [inner], weight=w)
    return g


# ================================================================ the drawing: all numbers in one place
# LAMSA letter widths follow the owner's drawing (measured at 50% coverage against the flat cap height)
# scaled 0.956, so the brief's TAP widths (T 0.79H, A 1.05H, P 0.81H) are exactly 3% narrower.
WIDTH = dict(L=788.0, A=1082.0, M=1098.0, T=790.0, A2=1050.0, P=810.0)
A_SLOPE = 0.3936                     # dx/dy of the A legs (owner: 0.3925); both weights share it
M_PARTS = dict(stem=276.0, diag=276.0, slope=0.62)
S_HEAVY = dict(ot=26, ob=24,
               xo_top=432, xo_r=880, yo_r=820, xo_l=10, yo_l=720,
               xi_top=445, t_top=212, xi_r=905, yi_r=450, xi_l=310, yi_l=728,
               xo_bot=445, xo_bl=-5, yo_bl=210, xo_br=875, yo_br=282,
               xi_bot=432, t_bot=216, xi_bl=-30, yi_bl=570, xi_br=570, yi_br=276,
               x_sp=440, y_sp=502, a_sp=19, t_sp=243,
               x_tr=836, x_bl=12, k_o=0.58, k_i=0.58,
               h_s1=0.55, h_s2=0.35, h_s3=0.35, h_s4=0.55, h_s5=0.55, h_s6=0.35, h_s7=0.35, h_s8=0.55)
# minimum horizontal gap between neighbours (x H/1000). LAMSA = owner's gaps; TAP = owner's + 20
# (brief); the A|T seam 215 sits inside the brief's 200-230 window.
GAPS = dict(LA=127.0, AM=132.0, MS=116.0, SA=179.0, AT=215.0, TA=216.0, AP=155.0)

# SINCE 2026 (own cap = 1000, drawn at TAP weight, then scaled to 0.52H)
S_LIGHT = dict(ot=15, ob=14,
               xo_top=343, xo_r=735, yo_r=800, xo_l=8, yo_l=725,
               xi_top=350, t_top=172, xi_r=735, yi_r=470, xi_l=208, yi_l=735,
               xo_bot=356, xo_bl=-25, yo_bl=200, xo_br=700, yo_br=275,
               xi_bot=350, t_bot=176, xi_bl=-30, yi_bl=540, xi_br=495, yi_br=268,
               x_sp=352, y_sp=500, a_sp=26, t_sp=200,
               x_tr=668, x_bl=10, k_o=0.58, k_i=0.60,
               h_s1=0.55, h_s2=0.35, h_s3=0.35, h_s4=0.55, h_s5=0.55, h_s6=0.35, h_s7=0.35, h_s8=0.55)
TWO = dict(k_o=0.58, k_i=0.60, xo_t=372, r_in=0, y_r=690, xo_l=-45, yo_l=820, yi_l=480, xi_t=372, t_top=175,
           side=205, y_ri=680, xi_l=-70, a_diag=48, y_dl=205, x_dr=300, x_tl=18,
           h_d1=0.45, h_d2=0.45, h_d3=0.45, h_d4=0.45)
SIX = dict(bowl_h=690, k_o=0.58, k_i=0.60, side=205, tb=180, a_stem=56, stem=190, top_os=21)

# lockups (brief): stacked = mark above, gap 0.72H, mark width 0.58 x word width; SINCE 2026 at 0.52H.
# horizontal = mark 2.0H tall, gap 0.6H. Symbol tip gap = 0.08 of a grid cell.
STACK_GAP, STACK_MARK = 0.72, 0.58
SINCE_CAP, SINCE_GAP, SINCE_SPAN = 0.52, 0.40, 0.761   # span = owner's SINCE width / word width
H_MARK, H_GAP = 2.0, 0.6
TIP_GAP = 0.08


def lamsa_tap_glyphs():
    HV, LT = HEAVY, LIGHT
    A_h = lambda: glyph_A(HV, WIDTH["A"], A_SLOPE, 310, 296, 128, 340, r_notch=30, r_counter=12)
    return [glyph_L(HV, WIDTH["L"]),
            A_h(),
            glyph_M(HV, WIDTH["M"], M_PARTS["stem"], M_PARTS["diag"], M_PARTS["slope"], r_side=12, r_v=60),
            glyph_S(HV, S_HEAVY),
            A_h(),
            glyph_T(LT, WIDTH["T"], LT["stem"], LT["horiz"]),
            glyph_A(LT, WIDTH["A2"], A_SLOPE, 210, 198, 175, 350, r_notch=20, r_counter=8),
            glyph_P(LT, WIDTH["P"], LT["stem"], LT["horiz"], LT["horiz"], 208, 262)]


def since_glyphs():
    LT = LIGHT
    return [glyph_S(LT, S_LIGHT), glyph_I(LT), glyph_N(LT, 858, 190, 190),
            glyph_C(LT, 920, 15, 205, 180, 920 * 0.75), glyph_E(LT, 690, 175, 640, 505),
            glyph_2(LT, 740, 15, TWO), glyph_O(LT, 780, 15, 205, 180),
            glyph_2(LT, 740, 15, TWO), glyph_6(LT, 770, 15, SIX)]


# ---------------------------------------------------------------- flattening and scanline measuring
def flatten(path, steps=48):
    polys, cur = [], []
    for op, pts in p_record(path):
        if op == "moveTo":
            cur = [pts[0]]
        elif op == "lineTo":
            cur.append(pts[0])
        elif op == "curveTo":
            p0 = cur[-1]
            for i in range(1, steps + 1):
                cur.append(cub_at((p0,) + tuple(pts), i / steps))
        elif op == "qCurveTo":
            p0, (c1, p2) = cur[-1], pts
            for i in range(1, steps + 1):
                t = i / steps
                cur.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c1[0] + t * t * p2[0],
                            (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c1[1] + t * t * p2[1]))
        elif op in ("closePath", "endPath"):
            if len(cur) > 2:
                polys.append(cur)
            cur = []
    return polys


def spans(polys, axis, v):
    """Ink spans along the line x = v (axis 'x', spans in y) or y = v (axis 'y', spans in x)."""
    hits = []
    for P in polys:
        n = len(P)
        for i in range(n):
            (x0, y0), (x1, y1) = P[i], P[(i + 1) % n]
            a0, a1, b0, b1 = (x0, x1, y0, y1) if axis == "x" else (y0, y1, x0, x1)
            if (a0 <= v < a1) or (a1 <= v < a0):
                t = (v - a0) / (a1 - a0)
                hits.append((b0 + t * (b1 - b0), 1 if a1 > a0 else -1))
    hits.sort()
    out, wnd, st = [], 0, None
    for pos, dn in hits:
        prev, wnd = wnd, wnd + dn
        if prev == 0 and wnd != 0:
            st = pos
        elif prev != 0 and wnd == 0:
            out.append((st, pos))
    return out


def edge_profile(polys, ys):
    """Leftmost and rightmost ink x at each y."""
    L, R = [], []
    for y in ys:
        sp = spans(polys, "y", y)
        L.append(sp[0][0] if sp else None)
        R.append(sp[-1][1] if sp else None)
    return L, R


PROFILE_Y = [y for y in range(-40, 1051, 2)]


def min_gap(left_polys, dx_left, right_polys, dx_right):
    _, R = edge_profile(left_polys, PROFILE_Y)
    L, _ = edge_profile(right_polys, PROFILE_Y)
    best = None
    for y, r, l in zip(PROFILE_Y, R, L):
        if r is None or l is None:
            continue
        g = (l + dx_right) - (r + dx_left)
        if best is None or g < best[0]:
            best = (g, y)
    return best


def place(glyphs, gaps):
    """x offset for each glyph so that the minimum horizontal gap to its left neighbour = gaps[i-1]."""
    polys = [flatten(g.path) for g in glyphs]
    xs = [-glyphs[0].bounds[0]]
    for i in range(1, len(glyphs)):
        g0, _ = min_gap(polys[i - 1], xs[i - 1], polys[i], 0.0)
        xs.append(gaps[i - 1] - g0)
    return xs, polys
