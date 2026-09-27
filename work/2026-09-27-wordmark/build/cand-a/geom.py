"""Exact 2D geometry for the LamsaTap logo, candidate A: lines, circular and axis-aligned elliptical arcs.

Design space: y points UP, cap height H = 1000 units, baseline y = 0. SVG output flips y.
A contour is a closed list of segments (Line / Arc), each segment's end = next segment's start.
Outer contours run counter-clockwise (ink on the left), holes clockwise, and no two contours of one colour
overlap, so every colour is one path that fills the same under nonzero and evenodd.
"""
import math

import numpy as np
from scipy.optimize import brentq

TAU = 2 * math.pi
EPS = 1e-9


def P(x, y):
    return np.array([float(x), float(y)])


def unit(v):
    n = math.hypot(v[0], v[1])
    return v / n


def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]


def rot90(v):  # +90 degrees (counter-clockwise, y up)
    return np.array([-v[1], v[0]])


class Line:
    kind = "L"

    def __init__(self, p0, p1):
        self.p0, self.p1 = np.asarray(p0, float), np.asarray(p1, float)

    def start(self):
        return self.p0

    def end(self):
        return self.p1

    def length(self):
        return float(np.linalg.norm(self.p1 - self.p0))

    def sample(self, step):
        n = max(1, int(math.ceil(self.length() / step)))
        t = np.linspace(0, 1, n + 1)[:-1]
        return self.p0[None, :] + (self.p1 - self.p0)[None, :] * t[:, None]

    def map(self, f):
        return Line(f.pt(self.p0), f.pt(self.p1))


class Arc:
    """Axis-aligned elliptical arc: c + (rx cos t, ry sin t), t from t0 to t1 (t1 > t0 = counter-clockwise)."""
    kind = "A"

    def __init__(self, c, rx, ry, t0, t1):
        self.c, self.rx, self.ry, self.t0, self.t1 = np.asarray(c, float), float(rx), float(ry), float(t0), float(t1)

    def point(self, t):
        return self.c + np.array([self.rx * math.cos(t), self.ry * math.sin(t)])

    def start(self):
        return self.point(self.t0)

    def end(self):
        return self.point(self.t1)

    def sample(self, step):
        r = max(self.rx, self.ry)
        n = max(2, int(math.ceil(abs(self.t1 - self.t0) * r / step)))
        t = np.linspace(self.t0, self.t1, n + 1)[:-1]
        return np.stack([self.c[0] + self.rx * np.cos(t), self.c[1] + self.ry * np.sin(t)], 1)

    def map(self, f):
        # f: similarity with rotation k*90 degrees and optional mirror in x
        c = f.pt(self.c)
        rx, ry = self.rx * f.s, self.ry * f.s
        t0, t1 = self.t0, self.t1
        if f.mirror_x:
            t0, t1 = math.pi - t0, math.pi - t1
        k = f.k % 4
        if k % 2 == 1:
            rx, ry = ry, rx
        t0, t1 = t0 + k * math.pi / 2, t1 + k * math.pi / 2
        return Arc(c, rx, ry, t0, t1)


class Sim:
    """Similarity: optional mirror in x, then rotate k*90 deg about origin, then scale s, then translate (dx, dy)."""

    def __init__(self, s=1.0, dx=0.0, dy=0.0, k=0, mirror_x=False):
        self.s, self.dx, self.dy, self.k, self.mirror_x = s, dx, dy, k, mirror_x

    def pt(self, p):
        x, y = float(p[0]), float(p[1])
        if self.mirror_x:
            x = -x
        for _ in range(self.k % 4):
            x, y = -y, x
        return np.array([x * self.s + self.dx, y * self.s + self.dy])


def map_contour(cont, f):
    segs = [s.map(f) for s in cont]
    if f.mirror_x:  # mirroring reverses orientation: reverse the contour
        segs = reverse_contour(segs)
    return segs


def reverse_contour(cont):
    out = []
    for s in reversed(cont):
        if s.kind == "L":
            out.append(Line(s.p1, s.p0))
        else:
            out.append(Arc(s.c, s.rx, s.ry, s.t1, s.t0))
    return out


def circle_arc_between(c, r, p0, p1, ccw):
    t0 = math.atan2(p0[1] - c[1], p0[0] - c[0])
    t1 = math.atan2(p1[1] - c[1], p1[0] - c[0])
    if ccw:
        while t1 <= t0:
            t1 += TAU
    else:
        while t1 >= t0:
            t1 -= TAU
    return Arc(c, r, r, t0, t1)


def ellipse_param(c, rx, ry, p):
    return math.atan2((p[1] - c[1]) / ry, (p[0] - c[0]) / rx)


# ---------- rounded polygons (line-line fillets) ----------

def rounded_polygon(pts, radii):
    """pts: polygon vertices (counter-clockwise for ink, clockwise for a hole); radii: fillet radius per vertex (0 = sharp).
    Returns a contour of lines and circular fillet arcs. Raises if two fillets overlap on one edge."""
    n = len(pts)
    pts = [np.asarray(p, float) for p in pts]
    fil = []
    for i in range(n):
        p, a, b = pts[i], pts[i - 1], pts[(i + 1) % n]
        r = radii[i]
        u, v = unit(a - p), unit(b - p)
        ang = math.acos(max(-1.0, min(1.0, float(u @ v))))
        if r <= 0 or ang > math.pi - 1e-6:
            fil.append((p, p, None, 0.0))
            continue
        d = r / math.tan(ang / 2)
        t_in, t_out = p + u * d, p + v * d
        c = p + unit(u + v) * (r / math.sin(ang / 2))
        turn = cross(p - a, b - p)  # >0 left turn (convex for CCW contour)
        fil.append((t_in, t_out, c, r, turn > 0))
    for i in range(n):  # edge i -> i+1 must hold both tangent lengths
        e = np.linalg.norm(pts[(i + 1) % n] - pts[i])
        d0 = np.linalg.norm(fil[i][1] - pts[i])
        d1 = np.linalg.norm(fil[(i + 1) % n][0] - pts[(i + 1) % n])
        if d0 + d1 > e + 1e-6:
            raise ValueError(f"fillets overlap on edge {i}: {d0:.2f}+{d1:.2f} > {e:.2f}")
    cont = []
    for i in range(n):
        f = fil[i]
        if f[2] is not None:
            cont.append(circle_arc_between(f[2], f[3], f[0], f[1], f[4]))
        nxt = fil[(i + 1) % n][0]
        if np.linalg.norm(nxt - f[1]) > 1e-9:
            cont.append(Line(f[1], nxt))
    return cont


# ---------- ellipse helpers ----------

class Ell:
    def __init__(self, c, rx, ry):
        self.c, self.rx, self.ry = np.asarray(c, float), float(rx), float(ry)

    def pt(self, t):
        return self.c + np.array([self.rx * math.cos(t), self.ry * math.sin(t)])

    def tangent(self, t):  # d/dt, counter-clockwise direction
        return np.array([-self.rx * math.sin(t), self.ry * math.cos(t)])

    def normal(self, t):  # outward unit normal
        return unit(np.array([self.ry * math.cos(t), self.rx * math.sin(t)]))

    def param(self, p):
        return ellipse_param(self.c, self.rx, self.ry, p)

    def support(self, n):
        """max of n.p over the ellipse, and the point where it is reached."""
        s = math.sqrt((self.rx * n[0]) ** 2 + (self.ry * n[1]) ** 2)
        p = self.c + np.array([self.rx ** 2 * n[0], self.ry ** 2 * n[1]]) / s
        return float(n @ self.c) + s, p

    def arc(self, t0, t1):
        return Arc(self.c, self.rx, self.ry, t0, t1)

    def x_at_y(self, y, right=True):
        v = (y - self.c[1]) / self.ry
        if abs(v) > 1:
            return None
        dx = self.rx * math.sqrt(1 - v * v)
        return self.c[0] + (dx if right else -dx)


def common_tangent(E1, E2, phi_lo, phi_hi):
    """Line with unit normal n = (cos phi, sin phi) that keeps E1 on its + side and E2 on its - side, touching both.
    Returns (n, d, p1, p2): line n.p = d, tangent point p1 on E1, p2 on E2."""
    def F(phi):
        n = np.array([math.cos(phi), math.sin(phi)])
        m1, _ = E1.support(-n)   # min of n.p over E1 = -m1
        m2, _ = E2.support(n)    # max of n.p over E2
        return (-m1) - m2
    phi = brentq(F, phi_lo, phi_hi, xtol=1e-14)
    n = np.array([math.cos(phi), math.sin(phi)])
    m1, p1 = E1.support(-n)
    m2, p2 = E2.support(n)
    return n, m2, p1, p2


def line_ellipse_hits(p0, d, E):
    """Intersections of the line p0 + s d with ellipse E: list of (s, t)."""
    q = (p0 - E.c) / np.array([E.rx, E.ry])
    dd = d / np.array([E.rx, E.ry])
    A, B, C = dd @ dd, 2 * q @ dd, q @ q - 1
    disc = B * B - 4 * A * C
    if disc < 0:
        return []
    out = []
    for sgn in (-1, 1):
        s = (-B + sgn * math.sqrt(disc)) / (2 * A)
        out.append((s, E.param(p0 + s * d)))
    return sorted(out)


def fillet_line_ellipse(p0, d, E, r, inside, side, t_lo, t_hi):
    """Circle of radius r tangent to line (p0, direction d) and to ellipse E.
    inside: centre inside E (True) or outside. side: +1 centre left of d, -1 right of d.
    Searches the ellipse parameter in [t_lo, t_hi]. Returns (centre, point on line, t on ellipse)."""
    d = unit(d)

    def Z(t):
        nrm = E.normal(t)
        return E.pt(t) + (-r if inside else r) * nrm

    def g(t):
        return cross(d, Z(t) - p0) - side * r

    ts = np.linspace(t_lo, t_hi, 721)
    vals = [g(t) for t in ts]
    roots = []
    for i in range(len(ts) - 1):
        if vals[i] == 0 or vals[i] * vals[i + 1] < 0:
            roots.append(brentq(g, ts[i], ts[i + 1], xtol=1e-14))
    if not roots:
        raise ValueError("no line-ellipse fillet in range")
    if len(roots) > 1:
        raise ValueError(f"ambiguous line-ellipse fillet: {roots}")
    t = roots[0]
    c = Z(t)
    foot = p0 + d * float((c - p0) @ d)
    return c, foot, t


# ---------- output ----------

def fmt(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def contour_to_d(cont, f):
    """SVG path data for one contour. f(p) -> (X, Y) in SVG space (y down)."""
    p = f(cont[0].start())
    out = [f"M{fmt(p[0])} {fmt(p[1])}"]
    for s in cont:
        q = f(s.end())
        if s.kind == "L":
            out.append(f"L{fmt(q[0])} {fmt(q[1])}")
        else:
            sc = f.scale
            large = 1 if abs(s.t1 - s.t0) > math.pi else 0
            sweep = 0 if s.t1 > s.t0 else 1  # y flip: counter-clockwise (y up) is sweep 0 in SVG
            out.append(f"A{fmt(s.rx * sc)} {fmt(s.ry * sc)} 0 {large} {sweep} {fmt(q[0])} {fmt(q[1])}")
    out.append("Z")
    return "".join(out)


class ToSVG:
    """Design space (y up) -> SVG (y down): X = ox + s x, Y = oy - s y."""

    def __init__(self, s, ox, oy):
        self.scale, self.ox, self.oy = s, ox, oy

    def __call__(self, p):
        return (self.ox + self.scale * p[0], self.oy - self.scale * p[1])


def check_closed(cont, tol=1e-6):
    for i, s in enumerate(cont):
        nxt = cont[(i + 1) % len(cont)]
        if np.linalg.norm(s.end() - nxt.start()) > tol:
            raise ValueError(f"contour gap after segment {i}: {s.end()} -> {nxt.start()}")


def polygonize(cont, step=1.0):
    return np.concatenate([s.sample(step) for s in cont], 0)


def signed_area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))
