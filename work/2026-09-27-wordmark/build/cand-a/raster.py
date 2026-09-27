"""Render helpers for candidate A: headless Edge for real previews, a numpy even-odd rasteriser for measuring."""
import os
import pathlib
import subprocess
import tempfile

import numpy as np

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]


def browser():
    for b in BROWSERS:
        if os.path.exists(b):
            return b
    raise SystemExit("Edge or Chrome not found")


def shoot_html(html, w, h, out):
    """Screenshot an HTML string at w x h CSS px (device scale 1) with headless Edge."""
    out = pathlib.Path(out)
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        args = [browser(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                f"--window-size={w},{h}", f"--user-data-dir={tmp}", f"--screenshot={out}", page.as_uri()]
        subprocess.run(args, check=True, capture_output=True, timeout=90)
    return out


def svg_page(svg_text, w, h, bg, pad=0, circle=None):
    """HTML page showing an inline SVG at exactly w x h (minus pad), on background bg.
    circle: optional (diameter_px, colour) drawn behind the SVG, centred."""
    inner_w, inner_h = w - 2 * pad, h - 2 * pad
    svg_text = svg_text.replace("<svg ", f'<svg width="{inner_w}" height="{inner_h}" style="display:block" ', 1)
    circ = ""
    if circle:
        dia, col = circle
        circ = (f'<div style="position:absolute;left:{(w - dia) / 2}px;top:{(h - dia) / 2}px;width:{dia}px;height:{dia}px;'
                f'border-radius:50%;background:{col}"></div>')
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;padding:0;background:{bg};'
            f'width:{w}px;height:{h}px;overflow:hidden}}</style></head><body>{circ}'
            f'<div style="position:absolute;left:{pad}px;top:{pad}px">{svg_text}</div></body></html>')


def rasterize(polys, width, height, ss=4):
    """Even-odd coverage (0..1) of polygons given in pixel coordinates (x right, y down).
    ss x ss samples per pixel. polys: list of (N, 2) arrays."""
    H, W = height * ss, width * ss
    edges = []
    for p in polys:
        q = np.asarray(p, float) * ss
        a, b = q, np.roll(q, -1, axis=0)
        keep = a[:, 1] != b[:, 1]
        edges.append(np.concatenate([a[keep], b[keep]], 1))
    E = np.concatenate(edges, 0)
    y0, x0, y1, x1 = E[:, 1], E[:, 0], E[:, 3], E[:, 2]
    ymin, ymax = np.minimum(y0, y1), np.maximum(y0, y1)
    img = np.zeros((H, W), bool)
    order = np.argsort(ymin)
    E, y0, x0, y1, x1, ymin, ymax = E[order], y0[order], x0[order], y1[order], x1[order], ymin[order], ymax[order]
    for row in range(H):
        yc = row + 0.5
        act = (ymin <= yc) & (ymax > yc)
        if not act.any():
            continue
        xs = x0[act] + (yc - y0[act]) * (x1[act] - x0[act]) / (y1[act] - y0[act])
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            a = int(np.ceil(xs[i] - 0.5))
            b = int(np.floor(xs[i + 1] - 0.5))
            a, b = max(a, 0), min(b, W - 1)
            if b >= a:
                img[row, a:b + 1] = True
    return img.reshape(height, ss, width, ss).mean(axis=(1, 3))
