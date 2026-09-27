#!/usr/bin/env python3
"""LamsaTap logo, candidate B ("optical craft"), version 2 = refine round 1.

Brief: work/2026-09-27-wordmark/decision.md (GM-033). Reference: brand-source/owner-logo-2026-09-27.png.

Changes from v1 (art-director review round 1, review/ad-cand-b/):
- TAP A is drawn at slope 0.412 (LAMSA A stays 0.3936): flat apex 0.27H, roof over the counter 0.157H
  (was 0.119H = 0.235 mm at the 21 mm horizontal minimum; now 0.309 mm), skeleton apex 1.089H (LAMSA 1.083H).
  Width 1050, legs 210 -> 198, crossbar 175-350 and all spacing (T|A 216, A|P 155) are unchanged.
- Star-tip cut TIP_GAP 0.05 -> 0.08 cell (1.96% of the symbol side): 2 px at a 100 px symbol,
  0.30 mm from a 15.3 mm symbol. Rule: below a 15 mm symbol the tips close, as in the owner's drawing.
- Symbol grafted from candidate A: true circular arcs (SVG "A" commands) and one corner rule with the
  letters: the convex corners on each piece's outline are rounded 0.06 cell (= 0.07H in the stacked
  lockup, LAMSA's radius); the convex corner at each star tip gets 0.02 cell so the star keeps a crisp
  point; inner corners stay sharp like the L's. Candidate A's closed star (a bridge at each tip) is
  not taken: the brief and the review ask for an open cut at the tips.
- M stems 0.263H -> 0.30H (brief: LAMSA stem 0.30H), diagonals 0.259H -> 0.25H, width 1098 -> 1130.
- DARK_SET: SINCE 2026 is sand on ink. Saffron appears only on TAP (GM-033).
- 6 of SINCE 2026: a curved hook out of the bowl's left side, terminal cut vertical at 0.75W like the C;
  bowl height stays 0.69 (was a straight 56-degree stem).
- Every lockup is exported as its own file in five colours, plus the avatar (sand symbol at 0.68 of a
  teal circle). Every preview carries the clear space: 1H on every side (symbol alone: 1 cell).

Every outline in this file is drawn here from geometry (lines, circular arcs, cubic curves).
No font file is opened or copied: the wordmark and SINCE 2026 are our own drawing, which the
trademark filing needs. Paths are merged with skia-pathops, one filled path per colour.

Units: H = cap height of the flat capitals = 1000, y up, baseline y = 0. SVG files use H = 100.

How the owner's drawing was measured (50% coverage, cap height of the flat letters, not the S):
L stem 0.336H, M strokes 0.295H, L foot 0.263H, A crossbar 0.245H, S counters 0.12H, A counter
0.153H (inscribed), P counter 0.198H, gaps L|A 0.127 A|M 0.132 M|S 0.116 S|A 0.179 A|T 0.201
T|A 0.196 A|P 0.135, S overshoot +0.025/-0.022H. The brief's 0.30H stem comes from a thresholded
measurement normalised by the S height; this candidate follows the brief's number.

Optical decisions (each one is a number below, and report() measures it back from the outlines):
- widths: LAMSA = owner x 0.956 so TAP's brief widths (T 0.79, A 1.05, P 0.81) are 3% narrower.
- A: legs taper 310 -> 296 into the apex; crossbar 128-340 so the counter reaches 0.185H;
  TAP A crossbar top 350 lines up with the heavy A's 340.
- M: stems 0.30H like the L (brief), diagonals 0.25H, width 1130 so the counters stay open.
- S: squircle bowls, vertical terminal cuts with exact curve-to-line fillets, overshoot +26/-24,
  horizontals 212/216, spine 243 at 19 degrees, sides ~0.32H: both counters 0.182H at the centre.
- seam: symmetric T gives 0.222H at the feet and 0.226H at bar height (minimum 0.215H).
- ink traps: none; see the note by GAPS (laser-bleed test).
- symbol: the owner's 4x4 grid (reference fit IoU 0.974); pieces moved apart 0.08 cell at the tips.

Run from anywhere:
    python build_logo_v2_b.py              # SVG files + measurements
    python build_logo_v2_b.py --previews   # also the PNGs (avatar 512 px, previews/ with clear space)
Needs: fonttools (pens and SVG only, no font files), skia-pathops; numpy + scipy for report().
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
    """Ink = union(pos) minus union(neg), merged with skia-pathops; bounds = ink box."""

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


def glyph_A(w, W, slope, run_bot, run_top, bar_bot, bar_top, r_notch=0.0, r_counter=0.0):
    """Flat-apex A. slope = dx/dy of the outer edges; run_* = horizontal leg width at y=0 / y=H
    (run_top < run_bot tapers the legs into the apex); bar_* = crossbar edges."""
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
    counter = rpoly([(inner(bar_top), bar_top), (-inner(bar_top), bar_top), (0.0, y_apex)],
                    [r_counter, r_counter, 0.0])
    dx = B / 2 - a_trim(r, slope)
    g = Glyph("A", [body.moved(dx, 0)], [counter.moved(dx, 0)], weight=w)
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


def glyph_T(w, W, stem, bar):
    """T with a centred stem. Seam check: with the symmetric bar the A|T gap is 0.222H at the feet and
    0.226H at bar height, so the seam is even from top to bottom and needs no asymmetric arm."""
    r = w["r"]
    xs0, xs1 = (W - stem) / 2, (W + stem) / 2
    yb = H - bar
    pts = [(xs0, 0), (xs1, 0), (xs1, yb), (W, yb), (W, H), (0, H), (0, yb), (xs0, yb)]
    return Glyph("T", [rpoly(pts, [r, r, 0, r, r, r, r, 0])], weight=w)


def bowl_curve(c, p0, p1, k0, k1, first_h=True):
    """Quarter 'squircle' from p0 to p1. first_h: tangent at p0 is horizontal (else vertical).
    k0, k1 = handle length as a fraction of the extent in each direction."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    if first_h:
        c.curve((p0[0] + k0 * dx, p0[1]), (p1[0], p1[1] - k1 * dy), p1)
    else:
        c.curve((p0[0], p0[1] + k0 * dy), (p1[0] - k1 * dx, p1[1]), p1)


def glyph_P(w, W, stem, top, bot, right, y_pb, k_out=0.60, k_in=0.66):
    """P: stem + D-shaped bowl. top/bot = bowl stroke thickness, right = bowl's right side,
    y_pb = outer bottom of the bowl (the owner's big bowl: it reaches down to ~0.26H in TAP)."""
    r = w["r"]
    y_m = (H + y_pb) / 2
    xf = W - (H - y_pb) / 2                    # outer flats end here: the round part is a half squircle
    c = Contour((r, 0.0))
    c.line((stem - r, 0.0))
    c.turn((1, 0), (0, 1), r, (stem, 0.0))
    c.line((stem, y_pb))                       # join under the bowl
    c.line((xf, y_pb))
    bowl_curve(c, (xf, y_pb), (W, y_m), k_out, k_out, first_h=True)
    bowl_curve(c, (W, y_m), (xf, H), k_out, k_out, first_h=False)
    c.line((r, H))
    c.turn((-1, 0), (0, -1), r, (0.0, H))
    c.line((0.0, r))
    c.turn((0, -1), (1, 0), r, (0.0, 0.0))
    yt, yb = H - top, y_pb + bot                # counter
    xr = W - right
    ym_i = (yt + yb) / 2
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
class ArcShape:
    """Closed contours made of straight lines and true circular arcs (y up).
    A contour is (start, segs); a seg is ('L', p) or ('A', centre, r, a0, a1, p): the arc runs from
    angle a0 to a1 around centre (a1 < a0 = clockwise). Written to SVG with real "A" commands; turned
    into cubics (arcs split to <= 90 degrees) only for skia-pathops measurements."""

    def __init__(self, contours=None):
        self.contours = contours or []

    def mapped(self, fn, k=1.0, turn=0.0):
        """fn = similarity map of points: uniform scale k (> 0) and rotation `turn` (radians), no mirror."""
        out = []
        for start, segs in self.contours:
            ns = []
            for s in segs:
                if s[0] == "L":
                    ns.append(("L", fn(s[1])))
                else:
                    _, ctr, r, a0, a1, p = s
                    ns.append(("A", fn(ctr), r * k, a0 + turn, a1 + turn, fn(p)))
            out.append((fn(start), ns))
        return ArcShape(out)

    def moved(self, dx, dy, k=1.0):
        return self.mapped(lambda p: (p[0] * k + dx, p[1] * k + dy), k)

    def rotated(self, turn, about=(0.0, 0.0)):
        return self.mapped(lambda p: add(rot(sub(p, about), turn), about), 1.0, turn)

    def __add__(self, other):
        return ArcShape(self.contours + other.contours)

    def to_pathops(self):
        path = pathops.Path()
        pen = path.getPen()
        for start, segs in self.contours:
            pen.moveTo(start)
            cur = start
            for s in segs:
                if s[0] == "L":
                    pen.lineTo(s[1])
                    cur = s[1]
                    continue
                _, ctr, r, a0, a1, p = s
                n = max(1, math.ceil(abs(a1 - a0) / (math.pi / 2) - 1e-9))
                da = (a1 - a0) / n
                kk = 4.0 / 3.0 * math.tan(da / 4) * r
                for i in range(n):
                    t0, t1 = a0 + i * da, a0 + (i + 1) * da
                    q0 = (ctr[0] + r * math.cos(t0), ctr[1] + r * math.sin(t0))
                    q1 = p if i == n - 1 else (ctr[0] + r * math.cos(t1), ctr[1] + r * math.sin(t1))
                    d0, d1 = (-math.sin(t0), math.cos(t0)), (-math.sin(t1), math.cos(t1))
                    pen.curveTo(add(q0, mul(d0, kk)), sub(q1, mul(d1, kk)), q1)
                cur = p
            pen.closePath()
        return path

    def svg_d(self, T):
        """T = (k, tx, ty): SVG point = (k*x + tx, -k*y + ty). The picture keeps its turning direction
        through the y flip: an arc with a1 < a0 (clockwise, y up) is clockwise on screen too, which is
        SVG's positive-angle direction, so its sweep flag = 1."""
        k, tx, ty = T
        P = lambda p: f"{fmt(k * p[0] + tx)} {fmt(-k * p[1] + ty)}"
        out = []
        for start, segs in self.contours:
            out.append("M" + P(start))
            for s in segs:
                if s[0] == "L":
                    out.append("L" + P(s[1]))
                else:
                    _, ctr, r, a0, a1, p = s
                    large = 1 if abs(a1 - a0) > math.pi else 0
                    sweep = 1 if a1 < a0 else 0
                    out.append(f"A{fmt(r * k)} {fmt(r * k)} 0 {large} {sweep} {P(p)}")
            out.append("Z")
        return "".join(out)


def _pt(ctr, r, a):
    return (ctr[0] + r * math.cos(a), ctr[1] + r * math.sin(a))


SYM_R_OUT = 0.06     # convex corners on the outline of every piece, in cells (candidate A's corner rule)
SYM_R_TIP = 0.02     # the convex corner at each star tip: small, so the star keeps a crisp point


def symbol_shape(cell=100.0, gap_ratio=0.08, r_out=SYM_R_OUT, r_tip=SYM_R_TIP):
    """Owner's mark on a 4x4 grid (reference fit IoU 0.974, work/2026-09-27-wordmark/reference-fit).
    Each piece: outer quarter disc in a corner cell + the next edge cell + an inner quarter disc
    (same centre as the outer one) that bulges toward the middle. Four pieces, turned 90 degrees.
    The pieces touch at the four star tips in the reference; here each piece moves out along its
    diagonal by gap/2 in x and y, so every tip has a clean cut = gap_ratio * cell (brief: no hairline
    contact). Convex corners on the outline (the quarter disc's end, the edge cell's outer corner) get a
    fillet r_out * cell; the convex corner at the star tip gets r_tip * cell (0.06 would blunt the
    star's point and flare the cut, see review/ad-cand-b); the inner notch corner stays sharp.
    All arcs are true circles. Returns (ArcShape centred on (0, 0), y up; side length)."""
    c = cell
    g = gap_ratio * c
    rho = r_out * c
    rt = r_tip * c
    o1 = (-c, c)                                  # centre of both quarter discs of the top-left piece
    s = math.sqrt(c * c - 2 * c * rho)            # fillet centre offset along the straight edge
    beta = math.atan2(rho, s)                     # angle the fillet takes off the big arc
    s_t = math.sqrt(c * c - 2 * c * rt)           # the same two numbers for the tip corner
    beta_t = math.atan2(rt, s_t)
    segs = []
    # top-left piece, clockwise, starting where the outer arc leaves its fillet at the left end
    a_start = math.pi - beta
    start = _pt(o1, c, a_start)
    segs.append(("A", o1, c, a_start, math.pi / 2, (-c, 2 * c)))              # outer quarter disc
    if rho > 0:
        segs.append(("L", (-rho, 2 * c)))
        f = (-rho, 2 * c - rho)                                                 # edge cell's outer corner
        segs.append(("A", f, rho, math.pi / 2, 0.0, (0.0, 2 * c - rho)))
    else:
        segs.append(("L", (0.0, 2 * c)))
    segs.append(("L", (0.0, c)))
    a_tip = -math.pi / 2 + beta_t                                                # inner arc, to the star tip
    segs.append(("A", o1, c, 0.0, a_tip, _pt(o1, c, a_tip)))
    if rt > 0:
        f = (-c + rt, c - s_t)                                                  # tip corner (convex)
        a_f0 = math.atan2(_pt(o1, c, a_tip)[1] - f[1], _pt(o1, c, a_tip)[0] - f[0])
        segs.append(("A", f, rt, a_f0, -math.pi, (-c, c - s_t)))
    segs.append(("L", (-c, c)))                                                 # notch corner: sharp
    if rho > 0:
        segs.append(("L", (-c - s, c)))
        f = (-c - s, c + rho)                                                   # quarter disc's left end
        segs.append(("A", f, rho, -math.pi / 2, -math.pi / 2 - (math.pi / 2 + beta), start))
    else:
        segs.append(("L", start))
    tl = ArcShape([(start, segs)]).moved(-g / 2, g / 2)
    mark = ArcShape()
    for i in range(4):
        mark = mark + tl.rotated(-math.pi / 2 * i)
    return mark, 4 * c + g


def symbol(cell=100.0, gap_ratio=0.08):
    """Symbol as a skia-pathops path (cubic copy of the arcs, for measuring and bounds) with the mark's
    top-left at (0, 0) in y-up units (the mark spans y from -side to 0), its ArcShape in the same place,
    and the side length."""
    shape, side = symbol_shape(cell, gap_ratio)
    shape = shape.moved(side / 2, -side / 2)
    return shape.to_pathops(), shape, side


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
    """Six: squircle bowl (height bowl_h, the ring of the 0 and C) + a curved hook that grows out of
    the bowl's left side, runs over the cap height and ends in a vertical cut at x = cut * W with the
    C's terminal fillets. The hook's outer edge leaves the bowl at its left extreme with the same
    vertical tangent, so the left side is one smooth curve. Counter-clockwise, ink on the left."""
    r = w["r"]
    b = p["bowl_h"] / 2
    cy = b - os
    k_o, k_i = p["k_o"], p["k_i"]
    outer = squircle(W / 2, cy, W / 2, W / 2, b, b, k_o)
    inner = squircle(W / 2, cy, W / 2 - p["side"], W / 2 - p["side"], b - p["tb"], b - p["tb"], k_i)
    top = H + os
    OT, OL = (p["x_top"], top), (0.0, cy)                       # hook crest, bowl's left extreme
    IT, IL = (p["x_top"], top - p["t_top"]), (p["side"], cy)
    OR, IR = (W, p["y_r"]), (W - p["side_r"], p["y_r"])        # virtual right side (cut away)
    x_cut = p["cut"] * W
    q_or = quarter(OR, OT, k_o, False)
    q_ir = quarter(IR, IT, k_i, False)
    t1, c1, p1, g1 = fillet_vertical(q_or, x_cut, r, ink_left=True, forward=True, ink_right_of_travel=False)
    t4, c4, p4, g4 = fillet_vertical(q_ir, x_cut, r, ink_left=True, forward=False, ink_right_of_travel=False)
    if c4[1] > c1[1]:
        raise ValueError("6: terminal too short for the fillet radius")
    e_top = (x_cut, c1[1])
    c = Contour(e_top)
    _fill_arc(c, e_top, (0, 1), p1, g1, r)
    _, seg = cub_split(q_or, t1)
    c.curve(seg[1], seg[2], seg[3])                               # -> crest
    q = quarter(OT, OL, p["k_hook_o"], True)
    c.curve(q[1], q[2], q[3])                                     # -> bowl's left extreme
    c.line(IL)                                                    # across the bowl's left stroke (hidden)
    q = quarter(IL, IT, p["k_hook_i"], False)
    c.curve(q[1], q[2], q[3])                                     # inner edge up to the crest
    _, seg = cub_split(q_ir, t4)
    seg = cub_rev(seg)
    c.curve(seg[1], seg[2], seg[3])                               # crest -> terminal
    _fill_arc(c, p4, g4, (x_cut, c4[1]), (0, 1), r)
    c.line(e_top)
    g = Glyph("6", [outer, c], [inner], weight=w)
    g.terminal = (x_cut, c4[1], c1[1])
    return g


# ================================================================ the drawing: all numbers in one place
# LAMSA letter widths follow the owner's drawing (measured at 50% coverage against the flat cap height)
# scaled 0.956, so the brief's TAP widths (T 0.79H, A 1.05H, P 0.81H) are exactly 3% narrower than
# LAMSA's. The M alone is 1130 (owner x 0.984): its stems went up to 0.30H, see M_PARTS.
WIDTH = dict(L=788.0, A=1082.0, M=1130.0, T=790.0, A2=1050.0, P=810.0)
A_SLOPE = 0.3936                     # dx/dy of LAMSA's A legs (owner: 0.3925)
# TAP's A: same width, legs and bar as v1, legs at 0.412 so its skeleton meets LAMSA's (apex 1.089H vs
# 1.083H): the flat apex drops to 0.27H and the roof over the counter grows to 0.157H (0.30 mm at 21 mm)
A_SLOPE_TAP = 0.412
# M: vertical stems at the brief's LAMSA stem 0.30H (the owner's M strokes measure 0.295H), diagonals
# lighter at 0.25H so the V does not clot, and the letter 32 units wider (1098 -> 1130) to keep the
# counters open. Ink per advance goes from 0.653 (v1: stems 0.263H, the owner's 0.878 ratio) to 0.672.
M_PARTS = dict(stem=300.0, diag=250.0, slope=0.62)
S_HEAVY = dict(ot=26, ob=24,
               xo_top=432, xo_r=880, yo_r=820, xo_l=10, yo_l=720,
               xi_top=445, t_top=212, xi_r=905, yi_r=420, xi_l=328, yi_l=728,
               xo_bot=445, xo_bl=-5, yo_bl=210, xo_br=875, yo_br=282,
               xi_bot=432, t_bot=216, xi_bl=-30, yi_bl=600, xi_br=553, yi_br=276,
               x_sp=440, y_sp=504, a_sp=19, t_sp=243,
               x_tr=836, x_bl=12, k_o=0.58, k_i=0.58,
               h_s1=0.55, h_s2=0.35, h_s3=0.35, h_s4=0.55, h_s5=0.55, h_s6=0.35, h_s7=0.35, h_s8=0.55)
# minimum horizontal gap between neighbours (x H/1000). LAMSA = owner's gaps; TAP = owner's + 20
# (brief); the A|T seam 215 sits inside the brief's 200-230 window.
# Ink traps: tested against a laser-bleed simulation (ink grown by 0.025H = 0.05 mm at the brief's
# 21 mm minimum). No TAP join closes: the T and P right-angle joins only gain ~0.035H fillets and every
# counter stays open (LAMSA A 0.136H, TAP A 0.229H, P 0.338H, S 0.131H after bleed). Cut traps (round
# bites or wedges at the joins, a sharpened A apex) read as chips or a spire at display sizes, so none
# are cut: clean joins.
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
# 6: bowl = the 0's ring at 0.69 height; hook crest on the bowl's centre line, terminal cut at 0.75W like
# the C (its virtual right side is 0.2W thinner so the cut crosses the inner edge, as in the C)
SIX = dict(bowl_h=690, k_o=0.58, k_i=0.60, side=205, tb=180, x_top=385, t_top=180, y_r=500, side_r=167.5,
           cut=0.75, k_hook_o=0.50, k_hook_i=0.55)

# lockups (brief): stacked = mark above, gap 0.72H, mark width 0.58 x word width; SINCE 2026 at 0.52H.
# horizontal = mark 2.0H tall, gap 0.6H. Symbol tip gap = 0.08 of a grid cell (1.96% of the side).
STACK_GAP, STACK_MARK = 0.72, 0.58
SINCE_CAP, SINCE_GAP, SINCE_SPAN = 0.52, 0.40, 0.761   # span = owner's SINCE width / word width
H_MARK, H_GAP = 2.0, 0.6
TIP_GAP = 0.08
# clear space (all previews and the usage rule): 1H on every side of any lockup with the word;
# the symbol alone: 1 grid cell (side / 4.08). Avatar: the symbol is 0.68 of the circle's diameter.
CLEAR_H, CLEAR_CELLS, AVATAR_MARK = 1.0, 1.0, 0.68


def lamsa_tap_glyphs():
    HV, LT = HEAVY, LIGHT
    A_h = lambda: glyph_A(HV, WIDTH["A"], A_SLOPE, 310, 296, 128, 340, r_notch=30, r_counter=12)
    return [glyph_L(HV, WIDTH["L"]),
            A_h(),
            glyph_M(HV, WIDTH["M"], M_PARTS["stem"], M_PARTS["diag"], M_PARTS["slope"], r_side=12, r_v=60),
            glyph_S(HV, S_HEAVY),
            A_h(),
            glyph_T(LT, WIDTH["T"], LT["stem"], LT["horiz"]),
            glyph_A(LT, WIDTH["A2"], A_SLOPE_TAP, 210, 198, 175, 350, r_notch=20, r_counter=8),
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


# ================================================================ lockups
def word_parts():
    gl = lamsa_tap_glyphs()
    g = GAPS
    xs, polys = place(gl, [g["LA"], g["AM"], g["MS"], g["SA"], g["AT"], g["TA"], g["AP"]])
    heavy = p_union([p_moved(gl[i].path, xs[i], 0) for i in range(5)])
    light = p_union([p_moved(gl[i].path, xs[i], 0) for i in range(5, 8)])
    x1 = max(heavy.bounds[2], light.bounds[2])
    return dict(glyphs=gl, xs=xs, polys=polys, heavy=heavy, light=light, width=x1)


def since_parts(word_w):
    gl = since_glyphs()
    k = SINCE_CAP
    widths = [(g.bounds[2] - g.bounds[0]) * k for g in gl]
    space_ratio = 33.0 / 14.0          # owner's word space / letter gap in SINCE 2026
    gap = (SINCE_SPAN * word_w - sum(widths)) / (len(gl) - 2 + space_ratio)
    x, paths = 0.0, []
    for i, g in enumerate(gl):
        paths.append(p_moved(g.path, x - g.bounds[0] * k, 0.0, k))
        x += widths[i] + (gap * space_ratio if g.name == "E" else gap)
    return p_union(paths), x - gap, gap


class MarkPart:
    """The symbol inside a lockup: its exact arcs (written to SVG) and a cubic copy (bounds, measuring)."""

    def __init__(self, shape):
        self.shape = shape
        self.path = shape.to_pathops()
        self.bounds = self.path.bounds

    def moved(self, dx, dy, k=1.0):
        return MarkPart(self.shape.moved(dx, dy, k))


def lockup_stacked(since=False):
    w = word_parts()
    W = w["width"]
    side = STACK_MARK * W
    _, shape, mside = symbol(side / (4 + TIP_GAP), TIP_GAP)
    y_bottom = H + STACK_GAP * H
    mark = MarkPart(shape.moved((W - mside) / 2, y_bottom + mside))
    parts = dict(mark=mark, heavy=w["heavy"], light=w["light"])
    if since:
        sp, span, gap = since_parts(W)
        top = -SINCE_GAP * H
        parts["since"] = p_moved(sp, (W - span) / 2, top - SINCE_CAP * H)
    return parts, w


def lockup_horizontal():
    w = word_parts()
    mside = H_MARK * H
    _, shape, s = symbol(mside / (4 + TIP_GAP), TIP_GAP)
    mark = MarkPart(shape.moved(0.0, H / 2 + mside / 2))
    shift = mside + H_GAP * H
    return dict(mark=mark, heavy=p_moved(w["heavy"], shift, 0), light=p_moved(w["light"], shift, 0)), w


# colour sets: which part goes to which colour (brief table). SINCE 2026 is ink in the light set (TAP's
# colour) and sand in the dark set: saffron is TAP's alone.
LIGHT_SET = [("mark", TEAL), ("heavy", TEAL), ("light", INK), ("since", INK)]
DARK_SET = [("mark", SAND), ("heavy", SAND), ("light", SAFFRON), ("since", SAND)]   # saffron only on TAP
TEAL_SET = [("mark", WHITE), ("heavy", WHITE), ("light", WHITE), ("since", WHITE)]
MONO_SET = [("mark", BLACK), ("heavy", BLACK), ("light", BLACK), ("since", BLACK)]
WHITE_SET = [("mark", WHITE), ("heavy", WHITE), ("light", WHITE), ("since", WHITE)]
# the five colourways of every lockup: (name, colour set, preview background, what it is for)
COLOURWAYS = [("light", LIGHT_SET, SAND, "sand or white background"),
              ("dark", DARK_SET, INK, "ink background"),
              ("teal", TEAL_SET, TEAL, "teal background, all white"),
              ("black", MONO_SET, WHITE, "one colour: black (print, stamp, engraving)"),
              ("white", WHITE_SET, BLACK, "one colour: white (dark material, photo)")]


def merged_by_colour(parts, cset):
    """[(colour, merged letter path or None, symbol ArcShape or None)], one entry per colour. The symbol
    never touches a letter, so its arcs are simply added to that colour's single path."""
    order, groups = [], {}
    for key, col in cset:
        if key in parts:
            if col not in groups:
                groups[col] = []
                order.append(col)
            groups[col].append(parts[key])
    out = []
    for col in order:
        paths = [q for q in groups[col] if not isinstance(q, MarkPart)]
        marks = [q for q in groups[col] if isinstance(q, MarkPart)]
        shape = None
        for m in marks:
            shape = m.shape if shape is None else shape + m.shape
        out.append((col, p_union(paths) if paths else None, shape))
    return out


def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def layer_bounds(layers):
    bs = []
    for _, path, shape in layers:
        if path is not None:
            bs.append(path.bounds)
        if shape is not None:
            bs.append(shape.to_pathops().bounds)
    return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)


def svg_doc(layers, scale=0.1, label="LamsaTap"):
    """layers: [(colour, letter path or None, symbol ArcShape or None)] in y-up units -> SVG text
    (y down, H = 100 units with scale 0.1), tight viewBox, one <path> per colour."""
    x0, y0, x1, y1 = layer_bounds(layers)
    w, h = (x1 - x0) * scale, (y1 - y0) * scale
    body = []
    for col, path, shape in layers:
        d = ""
        if path is not None:
            pen = SVGPathPen(None, ntos=fmt)
            path.draw(TransformPen(pen, (scale, 0, 0, -scale, -x0 * scale, y1 * scale)))
            d += pen.getCommands()
        if shape is not None:
            d += shape.svg_d((scale, -x0 * scale, y1 * scale))
        body.append(f'<path fill="{col}" d="{d}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" width="{fmt(w)}" '
            f'height="{fmt(h)}" role="img" aria-label="{label}"><title>{label}</title>{"".join(body)}</svg>\n')


def avatar_doc(size=512.0, fill=AVATAR_MARK):
    """Sand symbol on a teal circle (brief: WhatsApp, social accounts, favicon). The symbol's side is
    `fill` x the diameter; its farthest point (the outer quarter discs) sits at 0.412D from the centre."""
    shape, side = symbol_shape(100.0, TIP_GAP)
    k = fill * size / side
    r = size / 2
    circle = (f"M0 {fmt(r)}A{fmt(r)} {fmt(r)} 0 1 0 {fmt(size)} {fmt(r)}"
              f"A{fmt(r)} {fmt(r)} 0 1 0 0 {fmt(r)}Z")
    d = shape.svg_d((k, r, r))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(size)} {fmt(size)}" width="{fmt(size)}" '
            f'height="{fmt(size)}" role="img" aria-label="LamsaTap"><title>LamsaTap</title>'
            f'<path fill="{TEAL}" d="{circle}"/><path fill="{SAND}" d="{d}"/></svg>\n'), shape, side, k


def build_files():
    """Five lockups x five colourways + the avatar. Returns ({file name: svg text}, extra)."""
    files, meta = {}, {}
    mark_path, mark_shape, side = symbol(100.0, TIP_GAP)
    st, w = lockup_stacked(False)
    st2, _ = lockup_stacked(True)
    hz, _ = lockup_horizontal()
    wd = dict(heavy=w["heavy"], light=w["light"])
    sym = dict(mark=MarkPart(mark_shape))
    versions = [("stacked", st, 0.1), ("stacked-since2026", st2, 0.1), ("horizontal", hz, 0.1),
                ("wordmark", wd, 0.1), ("symbol", sym, 1.0)]
    for vname, parts, scale in versions:
        for cname, cset, bg, _ in COLOURWAYS:
            name = f"{vname}-{cname}.svg"
            files[name] = svg_doc(merged_by_colour(parts, cset), scale=scale)
            meta[name] = dict(version=vname, colourway=cname, background=bg, scale=scale)
    av, _, _, _ = avatar_doc()
    files["avatar-sand-on-teal.svg"] = av
    extra = dict(stacked=st, stacked_since=st2, horizontal=hz, word=wd, mark=mark_path, mark_shape=mark_shape,
                 mark_side=side, w=w, meta=meta)
    return files, extra


# ================================================================ measurements (from the final outlines)
def raster_mask(polys, x0, y0, x1, y1, step=1.0):
    import numpy as np
    xs = np.arange(x0, x1, step) + step / 2
    rows = []
    for y in [y1 - (i + 0.5) * step for i in range(int((y1 - y0) / step))]:
        row = np.zeros(len(xs), bool)
        for a, b in spans(polys, "y", y):
            row |= (xs >= a) & (xs < b)
        rows.append(row)
    return np.array(rows)


def inscribed(polys, bounds, step=1.0):
    """Diameter of the largest circle inside each enclosed counter (holes of the glyph)."""
    from scipy import ndimage as ndi
    x0, y0, x1, y1 = bounds
    ink = raster_mask(polys, x0 - 4, y0 - 4, x1 + 4, y1 + 4, step)
    holes = ndi.binary_fill_holes(ink) & ~ink
    lab, n = ndi.label(holes)
    return [2 * float(ndi.distance_transform_edt(lab == i).max()) * step for i in range(1, n + 1)]


def closest(pa, pb):
    """Closest distance between two outlines (vertex sets of flattened polygons)."""
    import numpy as np
    A = np.concatenate([np.array(p) for p in pa])
    B = np.concatenate([np.array(p) for p in pb])
    best = 1e18
    for i in range(0, len(A), 512):
        d = ((A[i:i + 512, None, :] - B[None, :, :]) ** 2).sum(-1)
        best = min(best, float(d.min()))
    return best ** 0.5


def closest_edges(pa, pb):
    """Closest distance between two outlines, point to segment both ways (straight edges have only two
    vertices, so vertex-to-vertex distances would overstate a gap across a long straight edge)."""
    import numpy as np

    def segs(polys):
        S = []
        for P in polys:
            A = np.array(P)
            S.append(np.stack([A, np.roll(A, -1, axis=0)], 1))
        return np.concatenate(S)

    def pts_to_segs(P, S):
        a, b = S[:, 0], S[:, 1]
        ab = b - a
        L2 = np.maximum((ab ** 2).sum(-1), 1e-12)
        best = 1e18
        for i in range(0, len(P), 256):
            p = P[i:i + 256, None, :]
            t = np.clip(((p - a) * ab).sum(-1) / L2, 0, 1)
            d = ((a + t[..., None] * ab - p) ** 2).sum(-1)
            best = min(best, float(d.min()))
        return best ** 0.5

    A = np.concatenate([np.array(p) for p in pa])
    B = np.concatenate([np.array(p) for p in pb])
    return min(pts_to_segs(A, segs(pb)), pts_to_segs(B, segs(pa)))


def report(extra):
    w = extra["w"]
    gl, xs, polys = w["glyphs"], w["xs"], w["polys"]
    L, A1, M, S, A2, T, A3, P = range(8)
    run = lambda gi, axis, v, which=0: (lambda s: s[which][1] - s[which][0])(spans(polys[gi], axis, v))
    r = {}
    r["H (L stem height)"] = run(L, "x", 150)
    r["LAMSA stem L"] = run(L, "y", 500)
    r["LAMSA stem M"] = run(M, "y", 250)
    th = math.atan(A_SLOPE)
    r["LAMSA A leg (perpendicular at y=500)"] = run(A1, "y", 500) * math.cos(th)
    r["LAMSA M diagonal (perpendicular, drawn)"] = M_PARTS["diag"]
    r["TAP stem T"] = run(T, "y", 400)
    r["TAP stem P"] = run(P, "y", 120)
    r["TAP A leg (perpendicular at y=500)"] = run(A3, "y", 500) * math.cos(math.atan(A_SLOPE_TAP))
    r["ratio TAP/LAMSA stem"] = r["TAP stem T"] / r["LAMSA stem L"]
    for label, gi, w_, W_, sl, rb, rt in (("LAMSA", A1, HEAVY, WIDTH["A"], A_SLOPE, 310, 296),
                                          ("TAP", A3, LIGHT, WIDTH["A2"], A_SLOPE_TAP, 210, 198)):
        Bw = W_ + 2 * a_trim(w_["r"], sl)
        x0_ = -Bw / 2
        cb, ct = x0_ + rb / 2, x0_ + sl * H + rt / 2          # left leg's centre line at y = 0 and y = H
        r[f"{label} A: flat apex / H, roof over counter / H, skeleton apex / H"] = [
            round((Bw - 2 * sl * H) / H, 3), round((H - gl[gi].y_apex) / H, 3), round(-cb / ((ct - cb) / H) / H, 3)]
    r["LAMSA horizontal L foot"] = run(L, "x", 600)
    ax = (gl[A1].bounds[0] + gl[A1].bounds[2]) / 2
    r["LAMSA horizontal A bar"] = [b - a for a, b in spans(polys[A1], "x", ax)][0]
    sx = (gl[S].bounds[0] + gl[S].bounds[2]) / 2
    ss = spans(polys[S], "x", sx)
    r["S strokes at centre (bottom, spine, top)"] = [round(b - a, 1) for a, b in ss]
    r["S counters at centre (lower, upper)"] = [round(ss[i + 1][0] - ss[i][1], 1) for i in range(len(ss) - 1)]
    r["TAP horizontal T bar"] = run(T, "x", 120)
    r["TAP horizontal P bowl top"] = [b - a for a, b in spans(polys[P], "x", 330)][-1]
    r["TAP horizontal P bowl bottom"] = [b - a for a, b in spans(polys[P], "x", 330)][0]
    ax3 = (gl[A3].bounds[0] + gl[A3].bounds[2]) / 2
    r["TAP horizontal A bar"] = [b - a for a, b in spans(polys[A3], "x", ax3)][0]
    for name, gi in (("L", L), ("A", A1), ("M", M), ("S", S), ("T", T), ("A(TAP)", A3), ("P", P)):
        b = gl[gi].bounds
        r[f"width {name}"] = b[2] - b[0]
    names = "LAMSATAP"
    for i in range(7):
        g, y = min_gap(polys[i], xs[i], polys[i + 1], xs[i + 1])
        r[f"gap {names[i]}|{names[i + 1]} (min, at y)"] = (round(g, 1), y)
    # seam in detail: gap between A's top corner region and T's bar, and true closest distance
    moved = lambda gi: [[(x + xs[gi], y) for x, y in poly] for poly in polys[gi]]
    r["seam A|T closest distance"] = closest(moved(A2), moved(T))
    _, RA = edge_profile(polys[A2], [900, 950])
    LT_, _ = edge_profile(polys[T], [900, 950])
    r["seam A|T gap at y=900/950"] = [round(l + xs[T] - (a + xs[A2]), 1) for a, l in zip(RA, LT_)]
    r["counter A (LAMSA) inscribed"] = inscribed(polys[A1], gl[A1].bounds)
    r["counter A (TAP) inscribed"] = inscribed(polys[A3], gl[A3].bounds)
    r["counter P inscribed"] = inscribed(polys[P], gl[P].bounds)
    r["word width"] = w["width"]
    # lockups and symbol, from the assembled parts
    st, hz = extra["stacked"], extra["horizontal"]
    mb, wb = st["mark"].bounds, (0.0, 0.0, w["width"], H)
    r["stacked: mark width / word width"] = (mb[2] - mb[0]) / w["width"]
    r["stacked: gap mark to cap line / H"] = (mb[1] - H) / H
    r["stacked: mark centred (left, right margin)"] = [round(mb[0] - wb[0], 2), round(wb[2] - mb[2], 2)]
    sp = flatten(extra["stacked_since"]["since"])
    sb = extra["stacked_since"]["since"].bounds
    x_i = min(((max(p[0] for p in P) - min(p[0] for p in P)), P) for P in sp)[1]   # the I: narrowest shape
    iy = [p[1] for p in x_i]
    r["SINCE 2026: cap (I) / H, gap baseline to cap / H, width / word"] = [
        round((max(iy) - min(iy)) / H, 3), round(-max(iy) / H, 3), round((sb[2] - sb[0]) / w["width"], 3)]
    hb = hz["mark"].bounds
    r["horizontal: mark height / H, gap / H"] = [round((hb[3] - hb[1]) / H, 3),
                                                  round((hz["heavy"].bounds[0] - hb[2]) / H, 3)]
    mark = extra["mark"]
    pieces = [[q] for q in flatten(mark, 400)]
    cell, side = 100.0, extra["mark_side"]
    cut = min(closest_edges(pieces[i], pieces[j]) for i in range(len(pieces)) for j in range(i + 1, len(pieces)))
    r["symbol: tip cut / cell, / side"] = [round(cut / cell, 4), round(cut / side, 4)]
    r["symbol: tip cut in px at a 64 / 100 / 128 px symbol"] = [round(cut / side * s_, 2) for s_ in (64, 100, 128)]
    r["symbol: side (mm) for a 0.30 mm tip cut"] = round(0.30 * side / cut, 1)
    word_w = w["width"] / H                                 # word width in H
    r["stacked 42 mm wide: symbol side mm, tip cut mm"] = [round(42 * STACK_MARK, 2),
                                                           round(42 * STACK_MARK * cut / side, 3)]
    hz_w = H_MARK + H_GAP + word_w                          # horizontal width in H
    Hmm = 21.0 / hz_w
    r["horizontal 21 mm wide: H mm, TAP stem / A roof / T bar mm, symbol side mm, tip cut mm"] = [
        round(Hmm, 3), round(0.2 * Hmm, 3), round((H - gl[A3].y_apex) / H * Hmm, 3), round(0.175 * Hmm, 3),
        round(H_MARK * Hmm, 2), round(H_MARK * Hmm * cut / side, 3)]
    # avatar: farthest point of the symbol from the circle centre, and the margin left, in diameters
    shape, s_side = symbol_shape(100.0, TIP_GAP)
    far = max(math.hypot(x, y) for poly in flatten(shape.to_pathops(), 400) for x, y in poly)
    D = s_side / AVATAR_MARK
    r["avatar: symbol side / D, farthest point / D, margin / D"] = [AVATAR_MARK, round(far / D, 4),
                                                                    round(0.5 - far / D, 4)]
    six = since_glyphs()[8]
    x_cut, y_in, y_out = six.terminal
    sp6 = spans(flatten(six.path, 200), "x", x_cut - 1)
    r["6: terminal x / W, cut from y to y (own cap 1000), opening under the terminal"] = [
        round(x_cut / (six.bounds[2] - six.bounds[0]), 3), round(y_in), round(y_out), round(sp6[1][0] - sp6[0][1])]
    r["6: bowl height / cap"] = round(SIX["bowl_h"] / H, 3)
    return r


# ================================================================ previews (headless Edge / Chrome renders the SVG files)
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]


def shoot(html, out_png, w, h, transparent=False):
    exe = next((p for p in BROWSERS if os.path.exists(p)), None)
    if not exe:
        raise SystemExit("no Edge/Chrome found for previews")
    tmp = tempfile.mkdtemp(prefix="lamsatap-prev-")
    try:
        page = os.path.join(tmp, "p.html")
        with open(page, "w", encoding="utf-8") as f:
            f.write(html)
        cmd = [exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
               f"--window-size={w},{h}", f"--screenshot={os.path.abspath(out_png)}", "--no-first-run",
               "--no-default-browser-check", "--disable-extensions", f"--user-data-dir={os.path.join(tmp, 'profile')}"]
        if transparent:
            cmd.append("--default-background-color=00000000")
        subprocess.run(cmd + ["file:///" + page.replace("\\", "/")], check=True, timeout=180, capture_output=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def svg_size(svg):
    import re
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    return float(m.group(1)), float(m.group(2))


def sized(svg, w, h):
    import re
    return re.sub(r'width="[^"]+" height="[^"]+"', f'width="{w}" height="{h}"', svg, count=1)


def html_page(inner, bg):
    return ('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;'
            f'background:{bg};overflow:hidden}}svg{{display:block}}</style></head><body>{inner}</body></html>')


def clear_units(meta):
    """Clear space in SVG units: 1H for lockups with the word (H = 100 units), 1 cell for the symbol
    (cell = 100 units in the symbol files)."""
    return 100.0 * (CLEAR_CELLS if meta["version"] == "symbol" else CLEAR_H)


def framed(svg, k, clear, bg):
    """The SVG at k px per unit inside its clear space, on its background."""
    vw, vh = svg_size(svg)
    pad = clear * k
    return (f'<div style="background:{bg};padding:{fmt(pad)}px;width:{fmt(vw * k)}px;height:{fmt(vh * k)}px">'
            f'{sized(svg, fmt(vw * k), fmt(vh * k))}</div>'), vw * k + 2 * pad, vh * k + 2 * pad


def previews(files, extra, out):
    """PNG previews, every one with the clear space (1H, or 1 cell for the symbol) on every side, plus the
    avatar PNG (512 px). Returns the list of files."""
    from concurrent.futures import ThreadPoolExecutor
    from PIL import Image
    pv = os.path.join(out, "previews")
    os.makedirs(pv, exist_ok=True)
    jobs, made = [], []
    meta = extra["meta"]
    # 1) every lockup x colourway at 1 SVG unit = 1 px (H = 100 px; symbol cell = 100 px)
    for name, m in meta.items():
        box, W, Hh = framed(files[name], 1.0, clear_units(m), m["background"])
        jobs.append((html_page(box, m["background"]), os.path.join(pv, name.replace(".svg", ".png")),
                     math.ceil(W), math.ceil(Hh)))
    # 2) contact sheet: rows = lockups, columns = colourways, each cell with its clear space
    cols = [c[0] for c in COLOURWAYS]
    rows = ["stacked", "stacked-since2026", "horizontal", "wordmark", "symbol"]
    cellw, lab = 440, 150
    body, total_h = [], 40
    head = "".join(f'<div style="width:{cellw}px;display:inline-block;font:600 15px sans-serif;color:#444">{c}</div>'
                   for c in cols)
    body.append(f'<div style="margin-left:{lab}px;height:40px;line-height:40px">{head}</div>')
    for r_ in rows:
        cells, hmax = [], 0
        for c in cols:
            name = f"{r_}-{c}.svg"
            m = meta[name]
            vw, vh = svg_size(files[name])
            clear = clear_units(m)
            k = cellw / (vw + 2 * clear)
            box, W, Hh = framed(files[name], k, clear, m["background"])
            hmax = max(hmax, Hh)
            cells.append(f'<div style="display:inline-block;vertical-align:top;width:{cellw}px">{box}</div>')
        body.append(f'<div style="display:flex;align-items:flex-start;margin-bottom:12px">'
                    f'<div style="width:{lab}px;font:600 15px sans-serif;color:#444;padding-top:8px">{r_}</div>'
                    f'{"".join(cells)}</div>')
        total_h += math.ceil(hmax) + 12
    jobs.append((html_page("".join(body), "#E9E6E0"), os.path.join(pv, "all-versions.png"),
                 lab + cellw * len(cols) + 10, total_h + 20))
    # 3) small sizes on sand, light colourway, device pixels (x4 copy made below)
    blocks, y = [], 10
    def at(x, y_, inner):
        return f'<div style="position:absolute;left:{fmt(x)}px;top:{fmt(y_)}px">{inner}</div>'
    for Hpx in (9, 12, 16):
        for nm in ("wordmark-light.svg", "horizontal-light.svg"):
            k = Hpx / 100.0
            box, W, Hh = framed(files[nm], k, 100.0, SAND)
            blocks.append(at(10 if nm.startswith("word") else 330, y, box))
        y += math.ceil(framed(files["horizontal-light.svg"], Hpx / 100.0, 100.0, SAND)[2]) + 6
    x = 10
    for side_px in (16, 24, 32, 48, 64, 100, 128):
        k = side_px / svg_size(files["symbol-light.svg"])[0]
        box, W, Hh = framed(files["symbol-light.svg"], k, 100.0, SAND)
        blocks.append(at(x, y, box))
        x += W + 6
    y += 128 + 2 * 128 / 4.08 + 10
    x = 10
    for d in (32, 40, 48, 64):
        blocks.append(at(x, y, sized(files["avatar-sand-on-teal.svg"], d, d)))
        x += d + 16
    y += 64 + 10
    small = os.path.join(pv, "small-sizes.png")
    jobs.append((html_page(f'<div style="position:relative;width:900px;height:{fmt(y)}px">{"".join(blocks)}</div>', SAND),
                 small, 900, math.ceil(y)))
    # 5) the build task's named previews, now inside the clear space: stacked 1200 px and horizontal 600 px
    #    wide (clear space included), the avatar at 40 px, the wordmark at cap height 9 px (x8 copies below)
    for name, total in (("stacked-light.svg", 1200), ("stacked-since2026-light.svg", 1200),
                        ("horizontal-light.svg", 600)):
        vw, vh = svg_size(files[name])
        k = total / (vw + 2 * 100.0)
        box, W, Hh = framed(files[name], k, 100.0, SAND)
        jobs.append((html_page(box, SAND), os.path.join(pv, f"preview-{name[:-4]}-{total}.png"), total, math.ceil(Hh)))
    av40 = os.path.join(pv, "preview-symbol-40-teal-circle.png")
    jobs.append((html_page(f'<div style="padding:8px">{sized(files["avatar-sand-on-teal.svg"], 40, 40)}</div>', SAND),
                 av40, 56, 56))
    cap9 = os.path.join(pv, "preview-wordmark-cap9.png")
    box, W, Hh = framed(files["wordmark-light.svg"], 0.09, 100.0, SAND)
    jobs.append((html_page(box, SAND), cap9, math.ceil(W), math.ceil(Hh)))
    # 6) before / after: v1 (review round 1) next to this version, same scale
    v1 = os.path.join(HERE, "v1", "stacked-light-since2026.svg")
    if os.path.exists(v1):
        with open(v1, encoding="utf-8") as f:
            old = f.read()
        cells = []
        for label, svg in (("v1", old), ("v2 (this build)", files["stacked-since2026-light.svg"])):
            vw, vh = svg_size(svg)
            box, W, Hh = framed(svg, 0.8, 100.0, SAND)
            cells.append(f'<div style="display:inline-block;vertical-align:top;margin:0 10px">'
                         f'<div style="font:600 15px sans-serif;color:#444;height:28px">{label}</div>{box}</div>')
        jobs.append((html_page("".join(cells), "#E9E6E0"), os.path.join(pv, "compare-v1-v2.png"),
                     2 * math.ceil(W) + 40, math.ceil(Hh) + 30))
    # 7) in the site header (decision.md GM-036 check): the horizontal lockup 48 px tall next to an ink
    #    capsule button and Figtree text, on the site's sand and on its dark #0E1615, at 1440 and 390 px
    fig = os.path.join(HERE, "..", "..", "..", "..", ".claude", "worktrees", "elegant-mclean-8e29f3", "brand",
                       "fonts", "figtree-latin.woff")          # read only: the site team's Figtree subset
    face = ""
    if os.path.exists(fig):
        import base64
        with open(fig, "rb") as f:
            face = ("@font-face{font-family:Figtree;font-weight:300 900;src:url(data:font/woff;base64,"
                    + base64.b64encode(f.read()).decode() + ") format('woff')}")
    for width in (1440, 390):
        bars = []
        for bg, fg, btn_bg, btn_fg, line, svg in ((SAND, INK, INK, SAND, "#E4DCD0", files["horizontal-light.svg"]),
                                                   ("#0E1615", "#ECF2F0", "#ECF2F0", "#0E1615", "#23302E",
                                                    files["horizontal-dark.svg"])):
            vw, vh = svg_size(svg)
            lh = 48 if width > 600 else 32
            logo = sized(svg, fmt(lh * vw / vh), lh)
            nav = ("" if width < 600 else
                   "".join(f'<span style="margin:0 18px;font:500 16px Figtree,sans-serif;color:{fg}">{t}</span>'
                           for t in ("Services", "How it works", "Contact")))
            pad = 48 if width > 600 else 16
            bars.append(f'<div style="display:flex;align-items:center;justify-content:space-between;height:96px;'
                        f'padding:0 {pad}px;background:{bg};border-bottom:1px solid {line}">{logo}'
                        f'<div style="display:flex;align-items:center">{nav}<span style="margin-left:18px;'
                        f'padding:12px 22px;border-radius:999px;background:{btn_bg};color:{btn_fg};'
                        f'font:600 15px Figtree,sans-serif;white-space:nowrap">Get in touch</span></div></div>'
                        f'<div style="height:40px;background:{bg}"></div>')
        # explicit width: headless Chrome lays a page out at least ~500 px wide whatever the window size
        page = html_page(f'<div style="width:{width}px">{"".join(bars)}</div>', SAND).replace("<style>", "<style>" + face)
        jobs.append((page, os.path.join(pv, f"in-header-{width}.png"), width, 2 * 136))
    # 4) avatar PNG, 512 px, transparent outside the circle (deliverable next to the SVG)
    av_png = os.path.join(out, "avatar-sand-on-teal-512.png")
    av_html = ('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;'
               'background:transparent;overflow:hidden}svg{display:block}</style></head><body>'
               f'{files["avatar-sand-on-teal.svg"]}</body></html>')
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda j: shoot(*j), jobs))
    shoot(av_html, av_png, 512, 512, transparent=True)
    im = Image.open(small)
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(os.path.join(pv, "small-sizes-x4.png"))
    x8 = []
    for p in (av40, cap9):
        im = Image.open(p)
        q = p.replace(".png", "-x8.png")
        im.resize((im.width * 8, im.height * 8), Image.NEAREST).save(q)
        x8.append(q)
    made = [j[1] for j in jobs] + [av_png, os.path.join(pv, "small-sizes-x4.png")] + x8
    return made


def arc_check(files, out):
    """The symbol file (true SVG arcs, drawn by the browser) against the cubic copy used for every
    measurement (drawn here by scanlines): intersection over union of the two rasters."""
    import numpy as np
    from PIL import Image
    svg = files["symbol-black.svg"]
    vw, vh = svg_size(svg)
    k = 2.0
    png = os.path.join(tempfile.mkdtemp(prefix="lamsatap-arc-"), "a.png")
    shoot(html_page(sized(svg, vw * k, vh * k), WHITE), png, int(vw * k), int(vh * k))
    got = np.asarray(Image.open(png).convert("L")).astype(float) < 128
    path, _, side = symbol(100.0, TIP_GAP)
    ref = raster_mask(flatten(path, 96), 0.0, -side, side, 0.0, 1.0 / k)
    h, w = min(got.shape[0], ref.shape[0]), min(got.shape[1], ref.shape[1])
    got, ref = got[:h, :w], ref[:h, :w]
    return float((got & ref).sum() / (got | ref).sum())


def contrast(a, b):
    def lum(h):
        c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def check_files(files):
    """Brief rules on the files themselves: fill only, no stroke/gradient/opacity, one path per colour,
    no Arabic characters."""
    import re
    out = {}
    for name, svg in files.items():
        cols = re.findall(r'<path fill="([^"]+)"', svg)
        bad = [t for t in ("stroke", "gradient", "opacity", "mask", "filter", "clip", "<image", "<text")
               if t in svg.lower()]
        arabic = any("\u0600" <= ch <= "\u06ff" for ch in svg)
        out[name] = dict(paths=len(cols), colours=cols, one_path_per_colour=len(cols) == len(set(cols)),
                         forbidden=bad, arabic=arabic, bytes=len(svg.encode("utf-8")))
    return out


def main():
    ap = argparse.ArgumentParser(description="LamsaTap logo, candidate B (optical craft)")
    ap.add_argument("--out", default=HERE)
    ap.add_argument("--previews", action="store_true", help="also render the preview PNGs with headless Edge/Chrome")
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    out = os.path.abspath(a.out)
    os.makedirs(out, exist_ok=True)
    files, extra = build_files()
    for name, text in files.items():
        with open(os.path.join(out, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    print("files:")
    for name, info in check_files(files).items():
        print(f"  {name}: {info}")
    print("colour pairs (WCAG contrast):", {f"{a} on {b}": round(contrast(a, b), 2) for a, b in
                                             ((TEAL, SAND), (INK, SAND), (SAND, INK), (SAFFRON, INK), (WHITE, TEAL))})
    print("measurements (units: H = 1000):")
    for key, val in report(extra).items():
        if isinstance(val, float):
            val = round(val, 3) if abs(val) < 10 else round(val, 1)
        elif isinstance(val, list):
            val = [(round(v, 3) if abs(v) < 10 else round(v, 1)) if isinstance(v, float) else v for v in val]
        print(f"  {key}: {val}")
    if a.previews:
        print("symbol: SVG arcs (browser) vs cubic copy, IoU at 2 px/unit:", round(arc_check(files, out), 5))
        for p in previews(files, extra, out):
            print("preview:", p)


if __name__ == "__main__":
    main()
