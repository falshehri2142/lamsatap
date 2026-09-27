"""The four-piece symbol (GM-032), rebuilt on its 4 x 4 grid (cell c, side 4c).

Owner's construction (fit to the reference at IoU 0.974, work/2026-09-27-wordmark/reference-fit/):
each piece = outer quarter disc (radius c) + edge cell + inner quarter disc (radius c), the four pieces turned
90 degrees about the centre. The negative space between the four inner quarter discs is the 4-point star; the
four empty edge cells are the notches.

Craft changes (GM-033 "star tips must not touch as a hairline; a clear minimum distance at the tips"):
- each star tip ends in a round cap of radius `tip`, so the star stops short of the notch corner and the
  pieces are joined there by a solid bridge of at least `bridge` (no zero-width point, no zero-angle cusp);
- the notch corners get small radii: convex `r_out`, concave `r_in` (same softness as the wordmark).
Everything else is the owner's exact grid geometry: circles of radius c centred on grid points.
"""
import math

import numpy as np

from geom import Arc, Ell, Line, Sim, TAU, circle_arc_between, fillet_line_ellipse, map_contour, rounded_polygon, unit


def tip_for_bridge(bridge):
    """Cap radius rho (in cells) that leaves `bridge` cells of ink between the cap and the notch corner."""
    lo, hi = 1e-6, 0.2
    for _ in range(200):
        m = (lo + hi) / 2
        d = math.sqrt(2 * m + m * m) - m
        if d < bridge:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def build_symbol(c=250.0, bridge=0.12, r_out=0.06, r_in=0.02):
    """Returns (contours, meta). y up, origin at the bottom-left corner, side 4c.
    bridge, r_out, r_in are in cells."""
    S = 4 * c
    rho = tip_for_bridge(bridge) * c
    ro, ri = r_out * c, r_in * c

    def uv(u, v):  # owner's cell coordinates (u right, v down) -> design space (y up)
        return np.array([u * c, S - v * c])

    # ---- outer contour: one quarter (top edge, from the top-left big arc to the top-right big arc), turned 4x
    # quarter runs: big arc TL (centre (1,1)) from (0,1) to (1,0); line to (2,0) [convex]; down to (2,1) [concave];
    # right to (3,1) [concave]; up to (3,0) [convex, meets big arc TR centred (3,1)].
    ctr_tl = uv(1, 1)
    ctr_tr = uv(3, 1)
    big_tl = Ell(ctr_tl, c, c)
    big_tr = Ell(ctr_tr, c, c)
    # straight part as a polygon with fillets: (1,0) (2,0) (2,1) (3,1) (3,0)
    pA, pB, pC, pD, pE = uv(1, 0), uv(2, 0), uv(2, 1), uv(3, 1), uv(3, 0)
    # fillet at pB (line-line convex) and pC, pD (concave): use rounded_polygon on a closed helper path
    # built from the polyline; we only keep the fillets we need.
    def ll_fillet(p_prev, p, p_next, r):
        u, v = unit(p_prev - p), unit(p_next - p)
        ang = math.acos(max(-1.0, min(1.0, float(u @ v))))
        d = r / math.tan(ang / 2)
        t_in, t_out = p + u * d, p + v * d
        cc = p + unit(u + v) * (r / math.sin(ang / 2))
        left = (p - p_prev)[0] * (p_next - p)[1] - (p - p_prev)[1] * (p_next - p)[0] > 0
        return t_in, t_out, circle_arc_between(cc, r, t_in, t_out, left)

    b_in, b_out, b_arc = ll_fillet(pA, pB, pC, ro)
    c_in, c_out, c_arc = ll_fillet(pB, pC, pD, ri)
    d_in, d_out, d_arc = ll_fillet(pC, pD, pE, ri)
    # convex corner at pE between the vertical notch side (going up) and big arc TR (circle centre (3,1), r = c):
    # fillet circle inside the big circle, left of the upward line
    up = np.array([0.0, 1.0])
    ce, fe, te = fillet_line_ellipse(pD, up, big_tr, ro, True, -1, math.pi / 2 - 0.6, math.pi / 2 - 1e-9)
    # the fillet touches the big circle at parameter te (just right of the top point, which is at pi/2)
    quarter = [
        big_tl.arc(math.pi, math.pi / 2),            # (0,1) -> (1,0): clockwise on the circle (y up)
        Line(pA, b_in), b_arc,
        Line(b_out, c_in), c_arc,
        Line(c_out, d_in), d_arc,
        Line(d_out, fe),
        circle_arc_between(ce, ro, fe, big_tr.pt(te), False),
    ]
    # the big TR arc then runs from te to 0 (clockwise), ending at (4,1); the next quarter starts with it.
    # Build the full contour by turning the quarter; the big arc of the next quarter starts where this ends.
    # To keep one set of pieces, the quarter's first arc is the TL corner arc starting at (0,1): the previous
    # (turned) quarter ends at big arc TL parameter te' - so we split the big arcs at the fillet point.
    # Simplest exact form: quarter' = [TL big arc from (turned te) to pi/2] + straight part + fillet at pE.
    te_turned = te + math.pi / 2          # the same fillet point on the TL circle, seen from the previous quarter
    quarter[0] = big_tl.arc(te_turned, math.pi / 2)
    center = np.array([S / 2, S / 2])
    outer = []
    for k in range(4):
        f = Sim(1.0, 0.0, 0.0, k=-k)
        g = lambda p, f=f: f.pt(p - center) + center
        for s in quarter:
            if s.kind == "L":
                outer.append(Line(g(s.p0), g(s.p1)))
            else:
                a = s.map(Sim(1.0, 0, 0, k=-k))
                a.c = g(s.c)
                outer.append(a)
    # quarters are generated counter-clockwise around the mark? k = 0 is the top edge running left -> right
    # (clockwise when seen with y up); turning by -90 each time walks top -> right -> bottom -> left: clockwise.
    # Outer contours must run counter-clockwise, so reverse.
    from geom import reverse_contour
    outer = reverse_contour(outer)

    # ---- star (hole, clockwise): quarter = top cap + concave arc on circle centred (3,1) down to the right tip
    dc = math.sqrt((c + rho) ** 2 - c * c)
    phi = math.atan2(dc, c)
    top_tip = uv(2, 1)
    cap_c = top_tip - np.array([0.0, dc])
    circ_r = uv(3, 1)   # piece 2's inner quarter disc centre
    circ_l = uv(1, 1)
    p_capL = circ_l + c * unit(cap_c - circ_l)
    p_capR = circ_r + c * unit(cap_c - circ_r)
    cap = circle_arc_between(cap_c, rho, p_capL, p_capR, False)       # over the top of the cap, clockwise
    # concave arc on circle centred (3,1) from the cap to the right tip's cap; angles from 180+phi to 270-phi
    arc = Arc(circ_r, c, c, math.pi + phi, 1.5 * math.pi - phi)
    squarter = [cap, arc]
    star = []
    for k in range(4):
        f = Sim(1.0, 0.0, 0.0, k=-k)
        g = lambda p, f=f: f.pt(p - center) + center
        for s in squarter:
            a = s.map(Sim(1.0, 0, 0, k=-k))
            a.c = g(s.c)
            star.append(a)
    tipgap = dc - rho
    meta = dict(cell=c, side=S, tip_radius=rho, bridge=tipgap, r_out=ro, r_in=ri)
    return [outer, star], meta
