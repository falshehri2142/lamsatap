"""Spacing and measuring for candidate A.

Spacing rule: the gap between two neighbouring letters is the shortest distance between their outlines
(what the eye reads as the gap), not the distance between their boxes.
"""
import math

import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree

from geom import polygonize
from raster import rasterize


def outline_points(glyph, step=1.0, dx=0.0, dy=0.0, s=1.0):
    pts = np.concatenate([polygonize(c, step) for c in glyph.contours], 0)
    return pts * s + np.array([dx, dy])


def min_dist(pa, pb):
    d, _ = cKDTree(pa).query(pb, k=1)
    return float(d.min())


def place_after(pa, glyph_b, target, x_guess, s=1.0, dy=0.0, step=1.0):
    """x offset for glyph_b (its local x=0 at the returned value, before scaling) so that the shortest
    outline distance to point set pa equals target."""
    pb0 = outline_points(glyph_b, step, 0.0, dy, s)

    def gap(x):
        return min_dist(pa, pb0 + np.array([x, 0.0])) - target

    lo, hi = x_guess - 2000 * s, x_guess + 2000 * s
    # make sure lo gives overlap (negative) and hi gives positive gap
    while gap(hi) < 0:
        hi += 1000 * s
    a, b = lo, hi
    for _ in range(80):
        m = (a + b) / 2
        if gap(m) < 0:
            a = m
        else:
            b = m
    return (a + b) / 2


# ---------------------------------------------------------------- raster measurements

def glyph_mask(glyph, px_per_unit, pad=20):
    """Binary-ish coverage of one glyph at px_per_unit, with pad px around. Returns (cov, to_px) where
    to_px maps design coordinates to pixel coordinates."""
    k = px_per_unit
    W = int(math.ceil(glyph.width * k)) + 2 * pad
    Hh = int(math.ceil((glyph.ymax - glyph.ymin) * k)) + 2 * pad
    polys = []
    for c in glyph.contours:
        p = polygonize(c, 0.5 / k)
        X = (p[:, 0] - glyph.xmin) * k + pad
        Y = (glyph.ymax - p[:, 1]) * k + pad
        polys.append(np.stack([X, Y], 1))
    cov = rasterize(polys, W, Hh, ss=2)
    return cov


def holes(ink):
    """Enclosed white regions (not connected to the border)."""
    white = ~ink
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    return [lab == i for i in range(1, n + 1) if i not in border]


def hole_metrics(hole, k):
    ys, xs = np.where(hole)
    dt = ndimage.distance_transform_edt(hole)
    widths = hole.sum(axis=1)
    heights = hole.sum(axis=0)
    return dict(width=float(widths.max()) / k, height=float(heights.max()) / k, incircle=float(2 * dt.max()) / k)


def aperture(ink, seed, k):
    """Diameter (design units) of the largest disc that can travel from `seed` (a pixel inside the counter)
    to the outside of the glyph through the white space. Binary search on the distance transform."""
    white = ~ink
    dt = ndimage.distance_transform_edt(np.pad(white, 1, constant_values=True))[1:-1, 1:-1]
    lo, hi = 0.0, float(dt[seed])
    for _ in range(40):
        m = (lo + hi) / 2
        ok = dt >= m
        lab, _ = ndimage.label(ok)
        s = lab[seed]
        border = np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])
        if s != 0 and s in set(border.tolist()):
            lo = m
        else:
            hi = m
    return 2 * lo / k


def run_widths(ink, row, k):
    """Widths (design units) of ink runs on one pixel row."""
    r = ink[row]
    out, i = [], 0
    while i < len(r):
        if r[i]:
            j = i
            while j < len(r) and r[j]:
                j += 1
            out.append((j - i) / k)
            i = j
        else:
            i += 1
    return out
