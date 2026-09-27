"""Search tilt variants for surface heights 192/224/256 with d in 128/160: checker-valid (extremes on 32-grid, dot px),
AD-ish ranges. Prints the best per (h, d, s, r)."""
import itertools
import math
import pathlib
import sys

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import concepts as C  # noqa
from geo import sample_poly  # noqa

rows = []
for h, d in itertools.product((192, 224, 256), (128, 160)):
    R = d / 2
    for s, r in itertools.product((48, 56, 64, 72), (16, 24, 32)):
        c = C.lean_c(s, h)
        for top in range(96, 225, 32):
            bot = top + h
            if bot > 448:
                continue
            for xleft in range(32, 129, 32):
                for ext in (192, 224, 256, 288):
                    w = ext - s + 2 * c * r
                    xl = xleft - c * r
                    P = [(xl, top), (xl + w, top), (xl + w + s, bot), (xl + s, bot)]
                    pts = np.array(sample_poly(P, r, step=1.0))
                    for cx in range(224, 481, 16):
                        if (cx - R) % 32:
                            continue
                        for cy in range(top, bot + 1, 16):
                            if (cy - R) % 32:
                                continue
                            f = (cy - top) / h
                            if not (0.28 <= f <= 0.46):
                                continue
                            gap = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy).min() - R
                            if not (44 <= gap <= 70):
                                continue
                            off = math.hypot(cx - 256, cy - 256) / 512
                            if not (0.20 <= off <= 0.30):
                                continue
                            far = max(np.hypot(pts[:, 0] - 256, pts[:, 1] - 256).max(), math.hypot(cx - 256, cy - 256) + R)
                            if far > 256:
                                continue
                            x0, x1 = xleft, max(xleft + ext, cx + R)
                            y0, y1 = min(top, cy - R), max(bot, cy + R)
                            bc = ((x0 + x1) / 2 - 256, (y0 + y1) / 2 - 256)
                            rows.append(dict(h=h, d=d, s=s, r=r, top=top, xleft=xleft, ext=ext, w=round(w, 1), ratio=round(w / h, 2),
                                             cx=cx, cy=cy, f=round(f, 3), gap=round(float(gap), 1), off=round(off, 3), far=round(float(far), 1),
                                             bc=bc))
best = {}
for o in rows:
    key = (o["h"], o["d"], o["s"], o["r"])
    score = abs(o["bc"][0]) + abs(o["bc"][1]) + max(0, o["far"] - 224) * 1.5 + abs(o["gap"] - 58) * 0.3 + abs(o["f"] - 0.37) * 40
    if key not in best or score < best[key][0]:
        best[key] = (score, o)
for key in sorted(best):
    sc, o = best[key]
    print(round(sc, 1), o)
