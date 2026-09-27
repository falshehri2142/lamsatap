"""Parametric letters for LAMSATAP and SINCE 2026 (candidate A). Every letter is built from the brief's numbers:
stems, horizontals, corner radii and widths, as lines and arcs. No font outlines are used anywhere.

Coordinates: y up, cap height H = 1000, baseline 0, ink box starts at x = 0.
Each builder returns a Glyph: a list of closed contours (outer counter-clockwise, counters clockwise).
"""
import math

import numpy as np

from geom import (Arc, Ell, Line, P, TAU, circle_arc_between, common_tangent, cross, fillet_line_ellipse,
                  line_ellipse_hits, polygonize, rounded_polygon, unit)

H = 1000.0


class Glyph:
    def __init__(self, name, contours, meta=None):
        self.name, self.contours, self.meta = name, contours, meta or {}
        pts = np.concatenate([polygonize(c, 2.0) for c in contours], 0)
        self.xmin, self.xmax = float(pts[:, 0].min()), float(pts[:, 0].max())
        self.ymin, self.ymax = float(pts[:, 1].min()), float(pts[:, 1].max())

    @property
    def width(self):
        return self.xmax - self.xmin


def arc_dir(E, t_from, t_to, ccw):
    """Arc on ellipse E from parameter t_from to t_to going counter-clockwise (ccw) or clockwise."""
    if ccw:
        while t_to <= t_from:
            t_to += TAU
        while t_to - t_from > TAU:
            t_to -= TAU
    else:
        while t_to >= t_from:
            t_to -= TAU
        while t_from - t_to > TAU:
            t_to += TAU
    return Arc(E.c, E.rx, E.ry, t_from, t_to)


def poly_with_curves(pts, radii, curves):
    """rounded_polygon, but edge i (pts[i] -> pts[i+1]) is replaced by the segments curves[i] (vertex radii there = 0)."""
    cont = rounded_polygon(pts, radii)
    out = []
    for s in cont:
        hit = None
        if s.kind == "L":
            for i, segs in curves.items():
                a, b = np.asarray(pts[i], float), np.asarray(pts[(i + 1) % len(pts)], float)
                if np.linalg.norm(s.p0 - a) < 1e-6 and np.linalg.norm(s.p1 - b) < 1e-6:
                    hit = segs
        out.extend(hit if hit else [s])
    return out


# ---------------------------------------------------------------- straight letters

def glyph_L(w, W):
    s, hf, R, r = w["stem"], w["foot"], w["R"], w["r"]
    pts = [(0, 0), (W, 0), (W, hf), (s, hf), (s, H), (0, H)]
    return Glyph("L", [rounded_polygon(pts, [R, R, R, r, R, R])], dict(stem=s, foot=hf))


def glyph_I(w):
    s, R = w["stem"], w["R"]
    return Glyph("I", [rounded_polygon([(0, 0), (s, 0), (s, H), (0, H)], [R] * 4)], dict(stem=s))


def glyph_T(w, W):
    s, hb, R, r = w["stem"], w["bar"], w["R"], w["r"]
    xs = (W - s) / 2
    pts = [(xs, 0), (xs + s, 0), (xs + s, H - hb), (W, H - hb), (W, H), (0, H), (0, H - hb), (xs, H - hb)]
    return Glyph("T", [rounded_polygon(pts, [R, R, r, R, R, R, R, r])], dict(stem=s, bar=hb))


def glyph_E(w, W, Wm, Wt):
    s, hb, R, r = w["stem"], w["bar"], w["R"], w["r"]
    hm = w.get("bar_mid", hb)
    ym = H / 2 + w.get("mid_raise", 0.0)
    pts = [(0, 0), (W, 0), (W, hb), (s, hb), (s, ym - hm / 2), (Wm, ym - hm / 2), (Wm, ym + hm / 2),
           (s, ym + hm / 2), (s, H - hb), (Wt, H - hb), (Wt, H), (0, H)]
    rad = [R, R, R, r, r, R, R, r, r, R, R, R]
    return Glyph("E", [rounded_polygon(pts, rad)], dict(stem=s, bar=hb))


def glyph_A(w, W, alpha_deg, bar_mid):
    """Flat-apex A. W = ink width. alpha = leg angle from vertical. bar_mid = height of the crossbar centre line."""
    t, hx, R, r = w["diag"], w["bar"], w["R"], w["r"]
    Ra = w.get("R_apex", R)
    a = math.radians(alpha_deg)
    k = math.tan(a)
    beta = math.pi / 2 - a                        # outer foot angle (acute)
    grow = R / math.tan(beta / 2) - R             # rounding pulls the ink box in by this much per side
    x0 = -grow                                    # sharp outer foot corner, so the ink box starts at 0
    xr = W + grow
    th = t / math.cos(a)                          # horizontal leg thickness
    ytop_l, ytop_r = x0 + k * H, xr - k * H       # apex corners
    if ytop_r - ytop_l < 2 * Ra:
        raise ValueError("apex too narrow")
    xil = lambda y: x0 + th + k * y               # left leg inner edge
    xir = lambda y: xr - th - k * y
    yc = ((x0 + xr) / 2 - x0 - th) / k            # sharp counter apex
    yct, ycb = bar_mid + hx / 2, bar_mid - hx / 2
    outer = [(x0, 0), (x0 + th, 0), (xil(ycb), ycb), (xir(ycb), ycb), (xr - th, 0), (xr, 0), (ytop_r, H), (ytop_l, H)]
    orad = [R, R, r, r, R, R, Ra, Ra]
    counter = [(xil(yct), yct), ((x0 + xr) / 2, yc), (xir(yct), yct)]   # clockwise
    crad = [r, r, r]
    g = Glyph("A", [rounded_polygon(outer, orad), rounded_polygon(counter, crad)],
              dict(diag=t, bar=hx, alpha=alpha_deg, apex_flat=ytop_r - ytop_l, counter_apex=yc,
                   counter_base_sharp=xir(yct) - xil(yct), counter_h_sharp=yc - yct, notch_h=ycb))
    return g


def glyph_M(w, W, alpha_deg, shoulder):
    """Vertical-sided M, V meeting above the baseline. shoulder = flat top of each stem (from the outside)."""
    s, t, R, r = w["m_stem"], w["m_diag"], w["R"], w["r"]
    Rv = w.get("R_v", R)
    a = math.radians(alpha_deg)
    xa = shoulder
    yn = H - (W / 2 - xa) / math.tan(a)                     # upper notch apex (sharp)
    d = np.array([math.sin(a), -math.cos(a)])               # down-right along the left diagonal
    nrm = np.array([-math.cos(a), -math.sin(a)])            # towards lower-left
    q = np.array([xa, H]) + t * nrm                         # a point on the lower edge
    ys = q[1] + (s - q[0]) / d[0] * d[1]                    # lower edge meets the stem's inner side
    yv = q[1] + (W / 2 - q[0]) / d[0] * d[1]                # sharp V bottom
    pts = [(0, 0), (s, 0), (s, ys), (W / 2, yv), (W - s, ys), (W - s, 0), (W, 0), (W, H), (W - xa, H), (W / 2, yn),
           (xa, H), (0, H)]
    rad = [R, R, r, Rv, r, R, R, R, R, r, R, R]
    v_bottom = yv + Rv / math.sin(a) - Rv
    return Glyph("M", [rounded_polygon(pts, rad)], dict(stem=s, diag=t, notch_apex=yn, v_bottom=v_bottom, inner_apex=ys))


def glyph_N(w, W, top_flat, bot_flat):
    """N: two stems and a parallel-sided diagonal (thickness w['n_diag']) from the top-left to the bottom-right.
    The diagonal's upper edge leaves the cap line at x = top_flat, its lower edge reaches the baseline at
    x = W - bot_flat."""
    s, t, R, r = w["stem"], w["n_diag"], w["R"], w["r"]
    A = np.array([top_flat, H])
    B = np.array([W - bot_flat, 0.0])
    v = B - A
    beta = math.asin(t / np.linalg.norm(v))
    ang = math.atan2(v[1], v[0]) + beta
    d = np.array([math.cos(ang), math.sin(ang)])          # down-right, edges are t apart
    y_up_r = A[1] + (W - s - A[0]) / d[0] * d[1]          # upper edge at the right stem's inner side
    y_lo_l = B[1] + (s - B[0]) / d[0] * d[1]              # lower edge at the left stem's inner side
    pts = [(0, 0), (s, 0), (s, y_lo_l), tuple(B), (W, 0), (W, H), (W - s, H), (W - s, y_up_r), tuple(A), (0, H)]
    rad = [R, R, r, R, R, R, R, r, R, R]
    return Glyph("N", [rounded_polygon(pts, rad)], dict(stem=s, diag=t, angle=math.degrees(ang)))


# ---------------------------------------------------------------- bowls

def glyph_P(w, W, bowl_bottom, x_curve):
    """P: stem + D-shaped bowl. Bowl outer = flat top/bottom + half ellipse from x_curve to W."""
    s, ht, hb, tr, R, r = w["stem"], w["p_top"], w["p_bot"], w["p_round"], w["R"], w["r"]
    yb = bowl_bottom
    Eo = Ell((x_curve, (H + yb) / 2), W - x_curve, (H - yb) / 2)
    yi0, yi1 = yb + hb, H - ht
    ai = W - tr - x_curve
    Ei = Ell((x_curve, (yi0 + yi1) / 2), ai, (yi1 - yi0) / 2)
    outer_pts = [(0, 0), (s, 0), (s, yb), (x_curve, yb), (x_curve, H), (0, H)]
    outer = poly_with_curves(outer_pts, [R, R, r, 0, 0, R], {3: [Eo.arc(-math.pi / 2, math.pi / 2)]})
    cpts = [(s, yi0), (s, yi1), (x_curve, yi1), (x_curve, yi0)]   # clockwise
    counter = poly_with_curves(cpts, [r, r, 0, 0], {2: [Ei.arc(math.pi / 2, -math.pi / 2)]})
    return Glyph("P", [outer, counter], dict(stem=s, bowl_top=ht, bowl_bottom_stroke=hb, bowl_round=tr,
                                             counter_w=W - tr - s, counter_h=yi1 - yi0, bowl_bottom=yb))


# ---------------------------------------------------------------- S (two elliptical bowls + straight spine)

def _tangent_b(K, nx, ny, a):
    """Vertical radius b of an ellipse (horizontal radius a) whose centre offset K along n makes it tangent."""
    return (K * K - (a * nx) ** 2) / (2 * K * ny)


def _terminal(Eo, Ei, t_corner, tilt_deg, R_out, R_in, body=+1):
    """Cut the stroke between Eo (outer edge) and Ei (inner edge) at Eo's parameter t_corner, square to the
    stroke (the cut follows the mean of the two edge normals, found by iteration), then turned by tilt.
    body=+1: the stroke continues towards larger parameters (contour: Ei -> inner fillet -> cut out -> outer
    fillet -> Eo). body=-1: towards smaller parameters (contour: Eo -> outer fillet -> cut in -> inner fillet -> Ei).
    Both corners are rounded (R_out, R_in); returns fillet centres, feet on the cut and ellipse parameters."""
    p_out = Eo.pt(t_corner)
    n_o = Eo.normal(t_corner)
    tl = math.radians(tilt_deg)
    rot = lambda v: np.array([v[0] * math.cos(tl) - v[1] * math.sin(tl), v[0] * math.sin(tl) + v[1] * math.cos(tl)])
    dcut = -n_o
    for _ in range(80):
        hits = [h for h in line_ellipse_hits(p_out, rot(dcut), Ei) if h[0] > 0]
        if not hits:
            raise ValueError("terminal cut misses the inner edge")
        s_in, t_in = hits[0]
        new = -unit(n_o + Ei.normal(t_in))
        if np.linalg.norm(new - dcut) < 1e-13:
            break
        dcut = new
    dcut = rot(dcut)
    s_in, t_in = [h for h in line_ellipse_hits(p_out, dcut, Ei) if h[0] > 0][0]
    p_in = p_out + s_in * dcut
    if body > 0:
        d_tr = -dcut                   # traversal along the cut: inner corner -> outer corner
        c_o, f_o, to = fillet_line_ellipse(p_in, d_tr, Eo, R_out, True, +1, t_corner, t_corner + 1.2)
        c_i, f_i, ti = fillet_line_ellipse(p_in, d_tr, Ei, R_in, False, +1, t_in, t_in + 1.2)
    else:
        d_tr = dcut                    # outer corner -> inner corner
        c_o, f_o, to = fillet_line_ellipse(p_out, d_tr, Eo, R_out, True, +1, t_corner - 1.2, t_corner)
        c_i, f_i, ti = fillet_line_ellipse(p_out, d_tr, Ei, R_in, False, +1, t_in - 1.2, t_in)
    if float((f_o - p_in) @ (p_out - p_in)) < float((f_i - p_in) @ (p_out - p_in)):
        raise ValueError("terminal fillets overlap")
    return dict(p_out=p_out, p_in=p_in, c_o=c_o, f_o=f_o, to=to, c_i=c_i, f_i=f_i, ti=ti, R_out=R_out, R_in=R_in,
                cut_len=float(np.linalg.norm(p_out - p_in)))


def terminal_segments(term, Eo, Ei, body):
    """The rounded end as contour segments: body=+1 runs Ei -> end -> Eo, body=-1 runs Eo -> end -> Ei."""
    if body > 0:
        return [circle_arc_between(term["c_i"], term["R_in"], Ei.pt(term["ti"]), term["f_i"], True),
                Line(term["f_i"], term["f_o"]),
                circle_arc_between(term["c_o"], term["R_out"], term["f_o"], Eo.pt(term["to"]), True)]
    return [circle_arc_between(term["c_o"], term["R_out"], Eo.pt(term["to"]), term["f_o"], True),
            Line(term["f_o"], term["f_i"]),
            circle_arc_between(term["c_i"], term["R_in"], term["f_i"], Ei.pt(term["ti"]), True)]


def glyph_S(w, W, o, spine_deg, spine_dy, a1i, a2i, t_u_deg, t_l_deg, tilt_u=0.0, tilt_l=0.0, name="S"):
    """Heavy/light S. Outer bowls are half-width ellipses; counters are ellipses tangent to the straight spine.
    w: top/bot (horizontal strokes), side1/side2 (upper-left / lower-right side strokes), spine (perpendicular),
    R (terminal outer corners), Rt (terminal inner corners)."""
    ttop, tbot, sd1, sd2, tsp = w["s_top"], w["s_bot"], w["s_side1"], w["s_side2"], w["s_spine"]
    R, Rt = w["R"], w.get("R_term_in", w["R"])
    th = math.radians(spine_deg)
    n = np.array([math.sin(th), math.cos(th)])                  # spine normal, up-right
    ctr = np.array([W / 2, H / 2 + spine_dy])
    dc = float(n @ ctr)
    d_ur, d_ll = dc + tsp / 2, dc - tsp / 2
    nx, ny = n
    a = W / 2
    # upper outer: centre (W/2, H+o-b1), E on + side of lower-left spine edge
    K = nx * a + ny * (H + o) - d_ll
    b1 = _tangent_b(K, nx, ny, a)
    E1o = Ell((a, H + o - b1), a, b1)
    # lower outer: centre (W/2, -o+b2), E on - side of upper-right edge
    K = d_ur - nx * a + ny * o
    b2 = _tangent_b(K, nx, ny, a)
    E2o = Ell((a, -o + b2), a, b2)
    # upper counter: left at sd1, top at H+o-ttop, on + side of upper-right edge
    K = nx * (sd1 + a1i) + ny * (H + o - ttop) - d_ur
    b1i = _tangent_b(K, nx, ny, a1i)
    E1i = Ell((sd1 + a1i, H + o - ttop - b1i), a1i, b1i)
    # lower counter: right at W-sd2, bottom at -o+tbot, on - side of lower-left edge
    K = d_ll - nx * (W - sd2 - a2i) - ny * (-o + tbot)
    b2i = _tangent_b(K, nx, ny, a2i)
    E2i = Ell((W - sd2 - a2i, -o + tbot + b2i), a2i, b2i)
    for nm, e in (("b1", b1), ("b2", b2), ("b1i", b1i), ("b2i", b2i)):
        if not e > 0:
            raise ValueError(f"S: {nm} = {e}")
    # tangent points (min/max of n.p)
    _, p1o = E1o.support(-n)
    _, p2i = E2i.support(n)
    _, p2o = E2o.support(n)
    _, p1i = E1i.support(-n)
    if not (p1o[0] < p2i[0] and p1i[0] < p2o[0]):
        raise ValueError("S spine reversed")
    t1o, t2i, t2o, t1i = E1o.param(p1o), E2i.param(p2i), E2o.param(p2o), E1i.param(p1i)
    # terminals
    up = _terminal(E1o, E1i, math.radians(t_u_deg), tilt_u, R, Rt, +1)
    lo = _terminal(E2o, E2i, math.radians(t_l_deg), tilt_l, R, Rt, +1)
    cont = []
    # 1 upper outer fillet (line foot -> ellipse) then E1o ccw to spine
    cont.append(circle_arc_between(up["c_o"], R, up["f_o"], E1o.pt(up["to"]), True))
    cont.append(arc_dir(E1o, up["to"], t1o, True))
    cont.append(Line(p1o, p2i))                                        # spine lower-left edge
    cont.append(arc_dir(E2i, t2i, lo["ti"], False))                    # lower counter, clockwise
    cont.append(circle_arc_between(lo["c_i"], Rt, E2i.pt(lo["ti"]), lo["f_i"], True))
    cont.append(Line(lo["f_i"], lo["f_o"]))                            # lower cut
    cont.append(circle_arc_between(lo["c_o"], R, lo["f_o"], E2o.pt(lo["to"]), True))
    cont.append(arc_dir(E2o, lo["to"], t2o, True))
    cont.append(Line(p2o, p1i))                                        # spine upper-right edge
    cont.append(arc_dir(E1i, t1i, up["ti"], False))                    # upper counter, clockwise
    cont.append(circle_arc_between(up["c_i"], Rt, E1i.pt(up["ti"]), up["f_i"], True))
    cont.append(Line(up["f_i"], up["f_o"]))                            # upper cut
    g = Glyph(name, [cont], dict(E1o=E1o, E1i=E1i, E2o=E2o, E2i=E2i, spine=(p1o, p2i, p2o, p1i), up=up, lo=lo,
                                 b=(b1, b2, b1i, b2i)))
    # shift so the ink box starts at x = 0 is not needed: the outer ellipses span 0..W
    return g


# ---------------------------------------------------------------- round letters for SINCE 2026

def full_ellipse(E, ccw):
    """A whole ellipse as two half arcs (SVG draws nothing for an arc that ends where it starts)."""
    if ccw:
        return [E.arc(-math.pi / 2, math.pi / 2), E.arc(math.pi / 2, 1.5 * math.pi)]
    return [E.arc(1.5 * math.pi, math.pi / 2), E.arc(math.pi / 2, -math.pi / 2)]


def glyph_O(w, W, o, name="0"):
    """Elliptical ring: outer half-width x (H/2+o), inner = outer minus the side / top strokes."""
    ts, tt = w["o_side"], w["o_top"]
    Eo = Ell((W / 2, H / 2), W / 2, H / 2 + o)
    Ei = Ell((W / 2, H / 2), W / 2 - ts, H / 2 + o - tt)
    return Glyph(name, [full_ellipse(Eo, True), full_ellipse(Ei, False)], dict(Eo=Eo, Ei=Ei))


def glyph_C(w, W, o, t_term_deg, tilt=0.0):
    """C: elliptical ring opened on the right; terminals cut square to the stroke, symmetric top/bottom."""
    ts, tt, R = w["o_side"], w["o_top"], w["R"]
    Eo = Ell((W / 2, H / 2), W / 2, H / 2 + o)
    Ei = Ell((W / 2, H / 2), W / 2 - ts, H / 2 + o - tt)
    tu = math.radians(t_term_deg)
    up = _terminal(Eo, Ei, tu, tilt, R, R, +1)
    lo = _terminal(Eo, Ei, -tu, -tilt, R, R, -1)
    cont = [arc_dir(Eo, up["to"], lo["to"], True)]
    cont += terminal_segments(lo, Eo, Ei, -1)
    cont.append(arc_dir(Ei, lo["ti"], up["ti"], False))
    cont += terminal_segments(up, Eo, Ei, +1)
    return Glyph("C", [cont], dict(Eo=Eo, Ei=Ei, up=up, lo=lo))


def _tangent_from_point(Q, E, lo, hi):
    """Parameter t of the point on E whose tangent line passes through Q (searched in [lo, hi])."""
    from scipy.optimize import brentq
    f = lambda t: float((E.pt(t) - Q)[0] * E.tangent(t)[1] - (E.pt(t) - Q)[1] * E.tangent(t)[0])
    ts = np.linspace(lo, hi, 400)
    vals = [f(t) for t in ts]
    for i in range(len(ts) - 1):
        if vals[i] * vals[i + 1] <= 0:
            return brentq(f, ts[i], ts[i + 1], xtol=1e-14)
    raise ValueError("no tangent from point")


def glyph_2(w, W, o, x_foot, t_term_deg, bowl_ry, base, tilt=0.0):
    """2: elliptical top bowl (ring, outer vertical radius bowl_ry, top at H + o) + straight diagonal + flat base.
    The diagonal's upper-left edge runs from (x_foot, 0) tangent to the inner bowl ellipse; its lower-right edge
    is the parallel tangent to the outer bowl ellipse (so the diagonal is parallel-sided; its thickness follows)."""
    ts, tt, R, r = w["o_side"], w["o_top"], w["R"], w["r"]
    Q = np.array([x_foot, 0.0])
    Eo = Ell((W / 2, H + o - bowl_ry), W / 2, bowl_ry)
    Ei = Ell((W / 2, H + o - bowl_ry), W / 2 - ts, bowl_ry - tt)
    ti = _tangent_from_point(Q, Ei, -math.pi / 2, 0.3)          # lower-right side of the counter
    p_i = Ei.pt(ti)
    u = unit(Q - p_i)                                           # down-left
    n = np.array([u[1], -u[0]])
    if float(n @ (Ei.c - p_i)) > 0:
        n = -n
    _, p_o = Eo.support(n)
    thick = float(n @ (p_o - p_i))
    p_j = p_o + ((base - p_o[1]) / u[1]) * u                    # lower-right edge meets the top of the base
    up = _terminal(Eo, Ei, math.radians(t_term_deg), tilt, R, R, -1)
    t_o, t_i = Eo.param(p_o), Ei.param(p_i)
    poly = rounded_polygon([Q, np.array([W, 0.0]), np.array([W, base]), p_j, p_o, p_i], [R, R, R, r, 0, 0])
    out = []
    for sg in poly:
        if sg.kind == "L" and np.linalg.norm(sg.p0 - p_o) < 1e-6 and np.linalg.norm(sg.p1 - p_i) < 1e-6:
            out.append(arc_dir(Eo, t_o, up["to"], True))
            out += terminal_segments(up, Eo, Ei, -1)
            out.append(arc_dir(Ei, up["ti"], t_i, False))
        else:
            out.append(sg)
    return Glyph("2", [out], dict(Eo=Eo, Ei=Ei, up=up, diag=thick,
                                  diag_angle=math.degrees(math.atan2(-u[1], -u[0]))))


def _round_join(cont, i_arc, i_line, E, r):
    """Concave fillet (radius r) where ellipse arc cont[i_arc] (on E) ends and line cont[i_line] starts."""
    arc, line = cont[i_arc], cont[i_line]
    d = unit(line.p1 - line.p0)
    lo, hi = (arc.t1 - 0.8, arc.t1) if arc.t1 > arc.t0 else (arc.t1, arc.t1 + 0.8)
    c, foot, t = fillet_line_ellipse(line.p0, d, E, r, False, -1, lo, hi)
    out = list(cont)
    out[i_arc] = Arc(arc.c, arc.rx, arc.ry, arc.t0, t)
    out[i_line] = Line(foot, line.p1)
    out.insert(i_arc + 1, circle_arc_between(c, r, E.pt(t), foot, False))
    return out


def glyph_6(w, W, o, bowl_ry, asc_deg, asc):
    """6: elliptical bowl (ring) + straight ascender tangent to the bowl's upper-left, rising at asc_deg,
    ended square with rounded corners so that its top touches the cap line."""
    ts, tt, R, r = w["o_side"], w["o_top"], w["R"], w["r"]
    Eo = Ell((W / 2, -o + bowl_ry), W / 2, bowl_ry)
    Ei = Ell((W / 2, -o + bowl_ry), W / 2 - ts, bowl_ry - tt)
    th = math.radians(asc_deg)
    u = np.array([math.cos(th), math.sin(th)])           # up-right
    n = np.array([-u[1], u[0]])                           # up-left
    d_out, p_t = Eo.support(n)
    if not (d_out - asc > Ei.support(n)[0]):
        raise ValueError("6: ascender cuts into the counter")
    q = p_t - asc * n
    s_hit, _ = max(line_ellipse_hits(q, u, Eo))
    p_c = q + s_hit * u

    def top_of(L):
        return (p_t + L * u - R * n - R * u)[1] + R
    lo_L, hi_L = 0.0, 4000.0
    for _ in range(200):
        m = (lo_L + hi_L) / 2
        lo_L, hi_L = (m, hi_L) if top_of(m) < H else (lo_L, m)
    L = (lo_L + hi_L) / 2
    a_end, b_end = p_t + L * u, q + L * u
    end = rounded_polygon([p_c, b_end, a_end, p_t], [0, R, R, 0])
    segs = [s for s in end if not (s.kind == "L" and np.linalg.norm(s.p0 - p_t) < 1e-6
                                   and np.linalg.norm(s.p1 - p_c) < 1e-6)]
    k = next(i for i, s in enumerate(segs) if np.linalg.norm(s.start() - p_c) < 1e-6)
    segs = segs[k:] + segs[:k]
    cont = segs + [arc_dir(Eo, Eo.param(p_t), Eo.param(p_c), True)]
    cont = _round_join(cont, len(cont) - 1, 0, Eo, r)
    return Glyph("6", [cont, full_ellipse(Ei, False)], dict(Eo=Eo, Ei=Ei, p_t=p_t, p_c=p_c, a_end=a_end, b_end=b_end))
