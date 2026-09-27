"""هندسة رمز «الميلان» على شبكة 512 (web-brand، مفاهيم داخلية، اتجاه المدير الفني القسم 16).

السطح متوازي أضلاع مايل (الضلع العلوي منزاح لليسار بمقدار s)، زواياه الأربع بنفس نصف القطر r.
الأطراف (أقصى يسار وأقصى يمين) تنحط على مضاعفات 32 عشان فحص الشبكة في brand/src/check_logo.py،
فالرؤوس نفسها تطلع برّا الـ16 بكم وحدة (الزاوية الحادة المدوّرة تسحب الطرف للداخل).
النقطة دائرة، وحوافها الأربع على مضاعفات 32 (قطر 96 أو 128؛ 112 ما يركب على الشبكة).
"""
import math

GRID = 512
CENTER = (256.0, 256.0)


def num(v, nd=2):
    s = f"{v:.{nd}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "", "-") else s


def _unit(vx, vy):
    L = math.hypot(vx, vy)
    return vx / L, vy / L


def corners(pts, r):
    """لكل رأس: (بداية القوس، نهايته، المركز، زاوية البداية، مقدار الدوران، اتجاه القوس)."""
    out = []
    n = len(pts)
    for i in range(n):
        P, V, N = pts[i - 1], pts[i], pts[(i + 1) % n]
        u1 = _unit(P[0] - V[0], P[1] - V[1])
        u2 = _unit(N[0] - V[0], N[1] - V[1])
        ang = math.acos(max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1])))
        t = r / math.tan(ang / 2)
        A = (V[0] + u1[0] * t, V[1] + u1[1] * t)
        B = (V[0] + u2[0] * t, V[1] + u2[1] * t)
        bis = _unit(u1[0] + u2[0], u1[1] + u2[1])
        dc = r / math.sin(ang / 2)
        C = (V[0] + bis[0] * dc, V[1] + bis[1] * dc)
        cross = (V[0] - P[0]) * (N[1] - V[1]) - (V[1] - P[1]) * (N[0] - V[0])
        a0 = math.atan2(A[1] - C[1], A[0] - C[0])
        a1 = math.atan2(B[1] - C[1], B[0] - C[0])
        da = a1 - a0
        while da > math.pi:
            da -= 2 * math.pi
        while da < -math.pi:
            da += 2 * math.pi
        out.append(dict(A=A, B=B, C=C, a0=a0, da=da, sweep=1 if cross > 0 else 0, r=r))
    return out


def rounded_path(pts, r, k=1.0, ox=0.0, oy=0.0, nd=2):
    """مسار SVG (أقواس A) للمضلع المدوّر، بمقياس k وإزاحة (ox, oy)."""
    cs = corners(pts, r)
    f = lambda p: f"{num(p[0] * k + ox, nd)} {num(p[1] * k + oy, nd)}"
    d = "M" + f(cs[0]["B"])
    for c in cs[1:] + cs[:1]:
        d += "L" + f(c["A"])
        d += f"A{num(r * k, nd)} {num(r * k, nd)} 0 0 {c['sweep']} " + f(c["B"])
    return d + "Z"


def outline(pts, r, steps=48, seg=24):
    """نقاط كثيفة على حدود المضلع المدوّر (للقياس)."""
    cs = corners(pts, r)
    out = []
    for i, c in enumerate(cs):
        for j in range(steps + 1):
            a = c["a0"] + c["da"] * j / steps
            out.append((c["C"][0] + c["r"] * math.cos(a), c["C"][1] + c["r"] * math.sin(a)))
        nxt = cs[(i + 1) % len(cs)]
        for j in range(1, seg):
            t = j / seg
            out.append((c["B"][0] + (nxt["A"][0] - c["B"][0]) * t, c["B"][1] + (nxt["A"][1] - c["B"][1]) * t))
    return out


def circle_path(cx, cy, rr, k=1.0, ox=0.0, oy=0.0, nd=2):
    x0, x1, y = (cx - rr) * k + ox, (cx + rr) * k + ox, cy * k + oy
    R = num(rr * k, nd)
    return f"M{num(x0, nd)} {num(y, nd)}A{R} {R} 0 1 0 {num(x1, nd)} {num(y, nd)}A{R} {R} 0 1 0 {num(x0, nd)} {num(y, nd)}Z"


def seg_dist(p, a, b):
    ax, ay, bx, by = a[0], a[1], b[0], b[1]
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    t = 0 if L2 == 0 else max(0, min(1, ((p[0] - ax) * vx + (p[1] - ay) * vy) / L2))
    return math.hypot(p[0] - ax - t * vx, p[1] - ay - t * vy)


def poly_dist(p, pts):
    return min(seg_dist(p, pts[i - 1], pts[i]) for i in range(len(pts)))


def area(pts):
    return abs(sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts)))) / 2


class Lean:
    """سطح «الميلان» + النقطة.
    T, B: أعلى وأسفل السطح (مضاعفات 32). XL, XR: أقصى يسار وأقصى يمين للسطح بعد التدوير (مضاعفات 32).
    s: إزاحة الضلع العلوي لليسار. r: نصف قطر الزوايا. d: قطر النقطة، ومركزها dot."""

    def __init__(self, s, r, d, dot, XL, XR, T=160, B=384):
        self.s, self.r, self.d, self.T, self.B, self.XL, self.XR = s, r, d, T, B, XL, XR
        # طرف الزاوية الحادة المدوّرة ينسحب للداخل بمقدار delta عن الرأس
        probe = self._pts(0.0, 200.0)
        delta = min(p[0] for p in outline(probe, r)) - 0.0
        self.delta = delta
        xtl = XL - delta
        W = XR - xtl - s + delta
        self.W = W
        self.pts = self._pts(xtl, W)
        self.dot = (float(dot[0]), float(dot[1]), d / 2)

    def _pts(self, xtl, W):
        T, B, s = self.T, self.B, self.s
        return [(xtl, T), (xtl + W, T), (xtl + W + s, B), (xtl + s, B)]

    # ---- قياسات ----
    def metrics(self):
        ol = outline(self.pts, self.r, 64, 64)
        cx, cy, rr = self.dot
        gap = poly_dist((cx, cy), ol) - rr
        far = max(max(math.hypot(x - 256, y - 256) for x, y in ol), math.hypot(cx - 256, cy - 256) + rr)
        xs = [p[0] for p in ol] + [cx - rr, cx + rr]
        ys = [p[1] for p in ol] + [cy - rr, cy + rr]
        a_s, a_d = area(ol), math.pi * rr * rr
        gx = (sum(p[0] for p in self.pts) / 4 * a_s + cx * a_d) / (a_s + a_d)
        gy = (sum(p[1] for p in self.pts) / 4 * a_s + cy * a_d) / (a_s + a_d)
        H = self.B - self.T
        ang = math.degrees(math.atan2(self.s, H))
        return dict(
            W=self.W, s=self.s, r=self.r, d=self.d, angle=ang, ratio=self.W / H,
            gap=gap, offset=math.hypot(cx - 256, cy - 256) / GRID, dot_height=(cy - self.T) / H,
            far=far, far_frac=far / GRID, bbox=(min(xs), min(ys), max(xs), max(ys)),
            bbox_center=((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2), mass=(gx, gy),
            engrave=(a_s + a_d) / GRID ** 2, vertices=self.pts, left=min(p[0] for p in ol),
            right=max(p[0] for p in ol), top=min(p[1] for p in ol), bottom=max(p[1] for p in ol),
        )

    # ---- مسارات ----
    def surface_d(self, k=1.0, ox=0.0, oy=0.0, nd=2):
        return rounded_path(self.pts, self.r, k, ox, oy, nd)

    def dot_d(self, k=1.0, ox=0.0, oy=0.0, nd=2):
        return circle_path(*self.dot, k, ox, oy, nd)

    def ink_bounds(self):
        m = self.metrics()
        return m["bbox"]
