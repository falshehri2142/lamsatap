"""يبني رسومات موقع لمسة تاب (web-illustrator، الموجز الفني القسم 7، وGM-022 وGM-023 وGM-025 وGM-027).

الأسلوب: «تصوير منتج مسطح بالظلال»: بدون خطوط محيطة، النور من فوق يمين، ظل تلامس بس (التدرج الوحيد)،
وكل مادة 2 إلى 3 درجات. الديكور من tokens (يتبدل مع الوضع الداكن)، والأشياء المادية بألوانها الثابتة.
ولا ناس، ولا «ب»، ولا شعارنا، ولا زعفران (GM-025). اسم المحل نص في خانة الشعار، والنقطة بلون المحل (GM-027).

التشغيل من جذر المشروع:  python work/2026-09-27-brand-identity/illustrations-src/build_illustrations.py [--out <مجلد>]
الافتراضي يكتب في website/assets/illustrations/. يحتاج fonttools و uharfbuzz. الخط: brand/fonts/source (قراءة بس).
"""
import argparse
import math
import os
import random
import sys

import uharfbuzz as hb
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
VF = os.path.join(ROOT, "brand", "fonts", "source", "ReadexPro[HEXP,wght].ttf")
OUT = os.path.join(ROOT, "website", "assets", "illustrations")

# ألوان ثابتة للأشياء المادية (الموجز الفني القسم 7) — نفس قيم tokens، وما تتغير بالليل
WHITE, SAND200, INK, SLATE, INK_EDGE, INK_DEEP = "#FFFFFF", "#E4DCD0", "#14201F", "#56625F", "#2A3B38", "#0E1615"
CAFE, APARTMENTS = "#7A3E2B", "#1F3B57"   # لون محلي العرض (web-art-director.md 5.8)
DOT_MM = 14                                  # علامة مكان اللمس: نقطة مصمتة قطرها 14mm (GM-027، القرار في web-illustrator.md)


def f(v, p=1):
    """رقم قصير: منزلة وحدة، بدون .0 وبدون -0."""
    s = f"{round(v, p):.{p}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


# ---------- النص (مسارات من Readex Pro) ----------
_fonts = {}


def _inst(w):
    if w not in _fonts:
        _fonts[w] = instancer.instantiateVariableFont(TTFont(VF), {"wght": w, "HEXP": 0})
    return _fonts[w]


class _Flat(BasePen):
    """يحوّل حدود الحرف لمضلعات (منحنيات مقسومة لقطع قصيرة)."""

    def __init__(self, gs, steps=6):
        super().__init__(gs)
        self.polys, self.cur, self.steps = [], [], steps

    def _moveTo(self, pt):
        self.cur = [pt]

    def _lineTo(self, pt):
        self.cur.append(pt)

    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            u = 1 - t
            self.cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            u = 1 - t
            self.cur.append(tuple(u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3)))

    def _closePath(self):
        if len(self.cur) > 2:
            self.polys.append(self.cur)
        self.cur = []

    _endPath = _closePath


def _rdp(pts, eps):
    """Ramer–Douglas–Peucker: يشيل النقاط اللي بعدها عن الخط أقل من eps."""
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, -1
    for j in range(1, len(pts) - 1):
        d = abs(dy * (pts[j][0] - x0) - dx * (pts[j][1] - y0)) / n
        if d > dmax:
            i, dmax = j, d
    if dmax <= eps:
        return [pts[0], pts[-1]]
    return _rdp(pts[:i + 1], eps)[:-1] + _rdp(pts[i:], eps)


def _num10(v):
    """رقم بالأعشار (عدد صحيح) ← نص قصير: 12.3 و-.5 و7."""
    sgn, v = ("-" if v < 0 else ""), abs(v)
    a, b = divmod(v, 10)
    return sgn + (f"{a}" if a else "") + (f".{b}" if b else ("" if a else "0"))


def _poly_rel(pts):
    """مضلع مقفل بإحداثيات نسبية مختصرة (m ثم l)، والتقريب يتحسب من النقطة المقرّبة اللي قبلها فما يتراكم."""
    ip = [(round(x * 10), round(y * 10)) for x, y in pts]
    out, prev, seq = [f"M{_num10(ip[0][0])} {_num10(ip[0][1])}l"], ip[0], []
    for x, y in ip[1:]:
        dx, dy = x - prev[0], y - prev[1]
        if dx or dy:
            seq += [_num10(dx), _num10(dy)]
            prev = (x, y)
    body = ""
    for t in seq:
        body += t if (not body or t.startswith("-")) else " " + t
    return out[0] + body + "z"


def text_path(text, w, height=None, size=None, cx=0, cy=0, anchor="middle", prec=1, simplify=None):
    """نص عربي مشكّل كمسار. يا size (حجم الخط بوحدات الرسم) يا height (ارتفاع الحبر).
    anchor=middle: مركز الحبر عند (cx, cy). simplify=eps: حدود مبسطة بخطوط مستقيمة (للنص الصغير، أخف بكثير).
    يرجع (d، عرض الحبر، ارتفاعه)."""
    font = hb.Font(hb.Face(hb.Blob.from_file_path(VF)))
    font.set_variations({"wght": w, "HEXP": 0})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {})
    tt = _inst(w)
    gs, order = tt.getGlyphSet(), tt.getGlyphOrder()
    upm = tt["head"].unitsPerEm
    parts, x = [], 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        parts.append((order[info.codepoint], x + pos.x_offset, pos.y_offset))
        x += pos.x_advance
    bp = BoundsPen(gs)
    for name, dx, dy in parts:
        gs[name].draw(TransformPen(bp, (1, 0, 0, 1, dx, dy)))
    x0, y0, x1, y1 = bp.bounds
    s = (size / upm) if size else height / (y1 - y0)
    ox = cx - (x0 + x1) / 2 * s
    oy = cy + (y0 + y1) / 2 * s
    if simplify:
        fl = _Flat(gs)
        for name, dx, dy in parts:
            gs[name].draw(TransformPen(fl, (s, 0, 0, -s, ox + dx * s, oy - dy * s)))
        d = []
        for poly_ in fl.polys:
            # حد مقفل: نقسمه عند أبعد نقطة عن البداية، ونبسّط النصين (خط القاعدة ما يصير صفر)
            k = max(range(len(poly_)), key=lambda i: math.dist(poly_[0], poly_[i]))
            pts = _rdp(poly_[:k + 1], simplify)[:-1] + _rdp(poly_[k:] + [poly_[0]], simplify)[:-1]
            if len(pts) > 2:
                d.append(_poly_rel(pts))
        return "".join(d), (x1 - x0) * s, (y1 - y0) * s
    pen = SVGPathPen(gs, ntos=lambda v: f(v, prec))
    for name, dx, dy in parts:
        gs[name].draw(TransformPen(pen, (s, 0, 0, -s, ox + dx * s, oy - dy * s)))
    return pen.getCommands(), (x1 - x0) * s, (y1 - y0) * s


# ---------- أشكال ----------
def rrect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    return (f"M{f(x + r)} {f(y)}H{f(x + w - r)}A{f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)}V{f(y + h - r)}"
            f"A{f(r)} {f(r)} 0 0 1 {f(x + w - r)} {f(y + h)}H{f(x + r)}A{f(r)} {f(r)} 0 0 1 {f(x)} {f(y + h - r)}"
            f"V{f(y + r)}A{f(r)} {f(r)} 0 0 1 {f(x + r)} {f(y)}Z")


def circle(cx, cy, r):
    """دائرة بقوسين. القطر = ضعف نصف القطر المقرّب بالضبط، وإلا القوس الكبير يطلع الدائرة بيضاوية."""
    r = float(f(r))
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 0 {f(2 * r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2 * r)} 0Z"


def poly(pts):
    return "M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"


def svg_doc(w, h, title, body, style="", cls="", extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}" '
            f'role="img" aria-labelledby="{cls}t"{extra}><title id="{cls}t">{title}</title>'
            + (f"<style>{style}</style>" if style else "") + body + "</svg>\n")


def shadow_css(p):
    """ظل التلامس: حبر 12% ← 0 في الفاتح، وأسود 45% ← 0 في الداكن (الموجز الفني القسم 7)."""
    return (f".{p}s0{{stop-color:#14201F;stop-opacity:.12}}.{p}s1{{stop-color:#14201F;stop-opacity:0}}"
            f"@media (prefers-color-scheme:dark){{.{p}s0{{stop-color:#000;stop-opacity:.45}}.{p}s1{{stop-color:#000;stop-opacity:0}}}}")


def shadow_def(p):
    return f'<radialGradient id="{p}g"><stop offset="0" class="{p}s0"/><stop offset="1" class="{p}s1"/></radialGradient>'


def shadow(p, cx, cy, rx, ry):
    return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="url(#{p}g)"/>'


# ---------- 1) علامة مكان اللمس: نقطة مصمتة (GM-027) ----------
def touch_marks():
    d = DOT_MM
    r = d / 2
    screen = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {d} {d}" width="{d}mm" height="{d}mm" '
              f'aria-hidden="true" focusable="false"><path fill="currentColor" d="{circle(r, r, r)}"/></svg>\n')
    engrave = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {d} {d}" width="{d}mm" height="{d}mm">'
               f'<title>علامة مكان اللمس، {d}mm، للحفر والطباعة بلون واحد</title>'
               f'<path fill="#000000" d="{circle(r, r, r)}"/></svg>\n')
    return {"touch-mark.svg": screen, "touch-mark-engrave.svg": engrave}


# ---------- 2) الأيقونات (الموجز الفني 3.3): شبكة 20، خط 1.75، أطراف دائرية، currentColor ----------
ICONS = {
    # المحادثة: نفس فكرة brand/icons/chat.svg (فقاعة مستطيلة، ذيلها تحت يمين، 3 نقاط) على شبكة 20
    "chat": ('<path d="M6 3.5h8A3.5 3.5 0 0 1 17.5 7v4A3.5 3.5 0 0 1 14 14.5v2.8L10.6 14.5H6A3.5 3.5 0 0 1 2.5 11V7A3.5 3.5 0 0 1 6 3.5z"/>'
             '<path d="M6.6 9h.01M10 9h.01M13.4 9h.01" stroke-width="2.3"/>'),
    # الاتصال: سماعة
    "call": '<path d="M6.2 2.8 8.4 3.6 9.2 6.9 7.5 8.4Q8.9 11.1 11.6 12.5L13.1 10.8 16.4 11.6 17.2 13.8Q17.2 16.9 14.4 17.2 4.6 16.6 2.8 5.6 3.1 2.8 6.2 2.8z"/>',
    # النسخ: ورقتين
    "copy": '<rect x="7.5" y="7.5" width="9.5" height="9.5" rx="2.2"/><path d="M12.5 4.8V4.7A1.7 1.7 0 0 0 10.8 3H4.7A1.7 1.7 0 0 0 3 4.7v6.1a1.7 1.7 0 0 0 1.7 1.7h.1"/>',
    # الموقع: دبوس
    "location": '<path d="M10 17.6S15.6 12.6 15.6 8.3A5.6 5.6 0 0 0 4.4 8.3C4.4 12.6 10 17.6 10 17.6z"/><circle cx="10" cy="8.3" r="2.1"/>',
    # سهم التقدّم: في RTL يأشر يسار
    "arrow": '<path d="M16 10H4M8.8 5.2 4 10l4.8 4.8"/>',
    # السهم الصغير: في RTL يأشر يسار
    "chevron": '<path d="M12 5 7 10l5 5"/>',
    # علامة الصح
    "check": '<path d="M4.2 10.4 8.2 14.3 15.8 6"/>',
}


def icons():
    out = {}
    for name, body in ICONS.items():
        out[f"icons/{name}.svg"] = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" '
            'focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" '
            f'stroke-linejoin="round">{body}</svg>\n')
    return out


# ---------- 3) الجوال ----------
PHONE_BEZEL_MM = 1.8   # حافة الشاشة: 6px على عرض 240 (تقييم المدير الفني 1، البند 3). نفس الجوال في كل الرسومات


def phone_parts(k, p, slot_id, hi=True, ox=0, screen_fill=WHITE):
    """جوال من قدام بإحداثيات محلية: (0,0) = نص الحافة العليا، والجوال نازل لتحت. k = px لكل mm.
    72×150mm، زاوية 10mm، حافة متساوية 1.8mm، وكاميرا دائرية صغيرة في النص فوق (مركزها 5mm من الحافة العليا).
    يرجع (الجسم، الشاشة، الكاميرا، أبعاد الشاشة)."""
    W, H, R, b = 72 * k, 150 * k, 10 * k, PHONE_BEZEL_MM * k
    body = f'<path fill="{INK}" class="{p}edge" d="{rrect(ox - W / 2, 0, W, H, R)}"/>'
    if hi:  # حافة عليا أفتح (النور من فوق)
        body += f'<path fill="{INK_EDGE}" d="{rrect(ox - W / 2 + R * .9, 0, W - R * 1.8, max(.9, .75 * k), .6)}"/>'
    sx, sy, sw, sh, sr = ox - W / 2 + b, b, W - 2 * b, H - 2 * b, R - b
    screen = f'<rect id="{slot_id}" x="{f(sx)}" y="{f(sy)}" width="{f(sw)}" height="{f(sh)}" rx="{f(sr)}" fill="{screen_fill}"/>'
    cam = f'<circle cx="{f(ox)}" cy="{f(5 * k)}" r="{f(1.35 * k)}" fill="{INK}"/>'
    return body, screen, cam, (sx, sy, sw, sh, sr)


def phone_frame():
    """إطار الجوال لشاشات المحل (بلاطة المحل في الرئيسية): 240×500، والشاشة خانة فاضية."""
    k = 240 / 72
    p = "pf-"
    body, screen, cam, (sx, sy, sw, sh, sr) = phone_parts(k, p, "pf-slot-screen", hi=True, ox=120)
    style = (f".{p}edge{{stroke:none}}@media (prefers-color-scheme:dark){{.{p}edge{{stroke:{INK_EDGE};stroke-width:1}}}}")
    g = f'{body}{screen}{cam}'
    meta = (f' data-slot="{f(sx)} {f(sy)} {f(sw)} {f(sh)}" data-slot-radius="{f(sr)}"')
    return svg_doc(240, 500, "إطار جوال", g, style, p, meta), (sx, sy, sw, sh, sr)


def phone_at(p, slot_id, dot, k, tilt, screen_fill=WHITE):
    """جوال مايل حافته العليا تلمس النقطة (dot = مركزها ونصف قطرها). tilt موجب = أعلاه لليمين."""
    body, screen, cam, _ = phone_parts(k, p, slot_id, screen_fill=screen_fill)
    a = math.radians(tilt)
    gap = 1.2
    tx, ty = dot[0] - (dot[2] + gap) * math.sin(a), dot[1] + (dot[2] + gap) * math.cos(a)
    g = (f'<g id="{p}phone" transform="translate({f(tx)} {f(ty)}) rotate({tilt})"><g class="{p}phone-move">'
         f"{body}{screen}{cam}</g></g>")
    return g, (tx, ty, tilt)


# ---------- 4) الأشياء ----------
DEPTH = (-4, -4)  # العمق الخفيف: نشوف الجنب اليسار (أغمق) والحافة العليا (أفتح)، والنور من فوق يمين


def block(x, y, w, h, front, top, side, d=DEPTH, r=0):
    """مكعب مواجه بعمق خفيف: الوجه، والحافة العليا، والجنب اليسار."""
    dx, dy = d
    t = poly([(x, y), (x + w, y), (x + w + dx, y + dy), (x + dx, y + dy)])
    s = poly([(x, y), (x + dx, y + dy), (x + dx, y + h + dy), (x, y + h)])
    fr = rrect(x, y, w, h, r) if r else poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)])
    return f'<path fill="{side}" d="{s}"/><path fill="{top}" d="{t}"/><path fill="{front}" d="{fr}"/>'


# ورقة الستاند بمقاسات print/dims.js (قالب web-builder)، ومعها تصحيح المدير الفني (صندوق الشعار 60×16mm)
SHEET = dict(w=100, h=150, logo_top=12, logo_w=60, logo_h=16, title=38, dot=62, touch=82.5, scan=99, qr_top=110, qr=30)


def _parse_path(d):
    """مسار SVG (M L H V Q C Z، مطلق ونسبي) ← مضلعات (المنحنيات مقسومة)."""
    import re as _re
    toks = _re.findall(r"[MmLlHhVvQqCcZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?", d)
    polys, cur, i, cmd, x, y, sx, sy = [], [], 0, None, 0.0, 0.0, 0.0, 0.0

    def nums(n):
        nonlocal i
        v = [float(t) for t in toks[i:i + n]]
        i += n
        return v
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    polys.append(cur)
                cur, x, y = [], sx, sy
                continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            nx, ny = nums(2)
            if rel:
                nx, ny = nx + x, ny + y
            if cur:
                polys.append(cur)
            cur, x, y, sx, sy = [(nx, ny)], nx, ny, nx, ny
            cmd = "l" if rel else "L"
        elif c == "L":
            nx, ny = nums(2)
            x, y = (nx + x, ny + y) if rel else (nx, ny)
            cur.append((x, y))
        elif c == "H":
            (nx,) = nums(1)
            x = nx + x if rel else nx
            cur.append((x, y))
        elif c == "V":
            (ny,) = nums(1)
            y = ny + y if rel else ny
            cur.append((x, y))
        elif c == "Q":
            x1, y1, x2, y2 = nums(4)
            if rel:
                x1, y1, x2, y2 = x1 + x, y1 + y, x2 + x, y2 + y
            for j in range(1, 7):
                t = j / 6
                u = 1 - t
                cur.append((u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2))
            x, y = x2, y2
        elif c == "C":
            x1, y1, x2, y2, x3, y3 = nums(6)
            if rel:
                x1, y1, x2, y2, x3, y3 = x1 + x, y1 + y, x2 + x, y2 + y, x3 + x, y3 + y
            for j in range(1, 9):
                t = j / 8
                u = 1 - t
                cur.append((u ** 3 * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
                            u ** 3 * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3))
            x, y = x3, y3
    if cur:
        polys.append(cur)
    return polys


def _polys_d(polys, eps, prec=1):
    out = []
    for pl in polys:
        if len(pl) < 3:
            continue
        k = max(range(len(pl)), key=lambda i: math.dist(pl[0], pl[i]))
        pts = _rdp(pl[:k + 1], eps)[:-1] + _rdp(pl[k:] + [pl[0]], eps)[:-1]
        if len(pts) > 2:
            out.append(_poly_rel(pts))
    return "".join(out)


def logo_paths(svg_file, x, y, w, h, cls, eps=.1):
    """يحط شعار محل العرض (ملف web-brand) داخل صندوق (x, y, w, h) بدون ما يتمطط، بلون cls (currentColor)."""
    import re as _re
    src = open(svg_file, encoding="utf-8").read()
    vw, vh = [float(v) for v in _re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).group(1, 2)]
    s = min(w / vw, h / vh)
    ox, oy = x + (w - vw * s) / 2, y + (h - vh * s) / 2
    out = []
    pat = r'(<g transform="translate\(([-\d.]+) ([-\d.]+)\)">)?<path fill="[^"]+"( fill-rule="evenodd")? d="([^"]+)"'
    for m in _re.finditer(pat, src):
        gx, gy = float(m.group(2) or 0), float(m.group(3) or 0)
        polys = [[(ox + (px + gx) * s, oy + (py + gy) * s) for px, py in pl] for pl in _parse_path(m.group(5))]
        rule = ' fill-rule="evenodd"' if m.group(4) else ""
        out.append(f'<path class="{cls}" fill="currentColor"{rule} d="{_polys_d(polys, eps)}"/>')
    return "".join(out)


def fake_qr(x, y, s, seed=11, n=21):
    """باركود ما ينقرى (الموجز الفني القسم 7): 3 مربعات زوايا وملمس نقاط، مسار واحد بأرقام مختصرة."""
    rnd = random.Random(seed)
    m = s / n
    t = lambda v: _num10(round(v * 10))    # noqa: E731
    d = []
    for fx, fy in ((0, 0), (n - 7, 0), (0, n - 7)):
        X, Y = x + fx * m, y + fy * m
        d.append(f"M{t(X)} {t(Y)}h{t(7 * m)}v{t(7 * m)}h{t(-7 * m)}zM{t(X + m)} {t(Y + m)}v{t(5 * m)}h{t(5 * m)}v{t(-5 * m)}z"
                 f"M{t(X + 2 * m)} {t(Y + 2 * m)}h{t(3 * m)}v{t(3 * m)}h{t(-3 * m)}z")
    for j in range(n):  # كل صف: الخلايا المتلاصقة مستطيل واحد
        run = None
        for i in range(n + 1):
            skip = i == n or (i < 8 and j < 8) or (i >= n - 8 and j < 8) or (i < 8 and j >= n - 8)
            on = not skip and rnd.random() < .42
            if on and run is None:
                run = i
            if not on and run is not None:
                d.append(f"M{t(x + run * m)} {t(y + j * m)}h{t((i - run) * m)}v{t(m)}h{t(-(i - run) * m)}z")
                run = None
    return f'<path fill="{INK}" fill-rule="evenodd" d="{"".join(d)}"/>'


def face_content(x0, y0, k, shop_cls, title, name=None, logo=None, parts=("logo", "title", "dot")):
    """وجه الستاند بمقاسات القالب (SHEET، بالمليمتر من زاوية الورقة العليا): الشعار أو الاسم في صندوق 60×16،
    والعنوان حبر، والنقطة بلون المحل على مركز الشريحة (62mm)، وسطر اللمس، وسطر الباركود فوقه، والباركود 30mm."""
    S, out = SHEET, []
    cx = x0 + S["w"] / 2 * k
    if "logo" in parts:
        bx, by, bw, bh = cx - S["logo_w"] / 2 * k, y0 + S["logo_top"] * k, S["logo_w"] * k, S["logo_h"] * k
        if logo:
            out.append(logo_paths(logo, bx, by, bw, bh, shop_cls, eps=max(.1, .0016 * bw)))
        else:  # بدون شعار: الاسم نص بلون المحل (GM-027)، ارتفاع حبره 8mm
            d, w, _ = text_path(name, 600, height=8 * k, cx=cx, cy=by + bh / 2, simplify=.12)
            if w > bw:
                d, w, _ = text_path(name, 600, height=8 * k * bw / w, cx=cx, cy=by + bh / 2, simplify=.12)
            out.append(f'<path class="{shop_cls}" fill="currentColor" d="{d}"/>')
    if "title" in parts:  # 18pt = 6.35mm، من 34 لين 42mm
        d, _, _ = text_path(title, 600, size=6.35 * k, cx=cx, cy=y0 + S["title"] * k, simplify=max(.1, .015 * 6.35 * k))
        out.append(f'<path fill="{INK}" d="{d}"/>')
    dot = (cx, y0 + S["dot"] * k, DOT_MM / 2 * k)
    if "dot" in parts:
        out.append(f'<path class="{shop_cls}" fill="currentColor" d="{circle(*dot)}"/>')
    if "touch" in parts:  # 11pt = 3.88mm، من 80 لين 85mm
        d, _, _ = text_path("قرّب جوالك هنا", 600, size=3.88 * k, cx=cx, cy=y0 + S["touch"] * k, simplify=max(.1, .02 * 3.88 * k))
        out.append(f'<path fill="{INK}" d="{d}"/>')
    if "scan" in parts:  # 10pt = 3.53mm، من 97 لين 101mm (فوق الباركود، قرار المدير الفني)
        d, _, _ = text_path("أو امسح الباركود", 500, size=3.53 * k, cx=cx, cy=y0 + S["scan"] * k, simplify=max(.1, .02 * 3.53 * k))
        out.append(f'<path fill="{INK}" d="{d}"/>')
    if "qr" in parts:
        q = S["qr"] * k
        out.append(fake_qr(cx - q / 2, y0 + S["qr_top"] * k, q))
    return "".join(out), dot


def stand(p, cx, floor_y, k, shop_cls, title, name=None, logo=None, parts=("logo", "title", "dot")):
    """ستاند: ورقة 100×150mm بيضاء (قالب print/stand) على قاعدة حبر 120×12mm.
    يرجع (الرسم، مركز النقطة ونصف قطرها، حدود القاعدة)."""
    bw, bh = 120 * k, 12 * k
    bx, by = cx - bw / 2, floor_y - bh
    fw, fh = SHEET["w"] * k, SHEET["h"] * k
    fx, fy = cx - fw / 2, by + 1.5 - fh
    g = [block(bx, by, bw, bh, INK, INK_EDGE, INK_DEEP),
         block(fx, fy, fw, fh, WHITE, WHITE, SAND200, d=(-3.2, -2.4), r=2 * k)]
    content, dot = face_content(fx, fy, k, shop_cls, title, name=name, logo=logo, parts=parts)
    g.append(content)
    return "".join(g), dot, (bx, bw)


def dalla(p, x, y, u, halo_cls=None):
    """دلة حديثة سادة: حبر مطفي بإضاءات #56625F على اليمين (النور من فوق يمين). (x, y) = نص القاعدة، u = مقياس.
    halo_cls: حافة 1px في الداكن (خط 2px تحت الأشكال، فيبين نصه برّا بس)."""
    def P(pts):
        return " ".join(f"{f(x + px * u)} {f(y + py * u)}" for px, py in pts)
    body = ("M" + P([(-34, 0)]) + "L" + P([(34, 0), (32, -7)])
            + "C" + P([(56, -18), (62, -58), (46, -88)])
            + "C" + P([(38, -102), (22, -108), (20, -118)])
            + "L" + P([(20, -128)]) + "C" + P([(24, -140), (36, -154), (42, -166)])
            + "L" + P([(45, -172), (41, -176)]) + "C" + P([(38, -192), (22, -200), (6, -201)])
            + "L" + P([(3, -212)]) + "A" + f(6 * u) + " " + f(6 * u) + " 0 1 0 " + P([(-3, -212)])
            + "L" + P([(-6, -201)]) + "C" + P([(-22, -200), (-38, -192), (-41, -176)])
            + "L" + P([(-45, -172), (-42, -166)]) + "C" + P([(-36, -154), (-24, -140), (-20, -128)])
            + "L" + P([(-20, -118)]) + "C" + P([(-22, -108), (-38, -102), (-46, -88)])
            + "C" + P([(-62, -58), (-56, -18), (-32, -7)]) + "Z")
    spout = ("M" + P([(-44, -92)]) + "C" + P([(-66, -106), (-86, -140), (-96, -178)])
             + "L" + P([(-106, -190), (-99, -174)]) + "C" + P([(-90, -136), (-72, -84), (-50, -62)]) + "Z")
    handle = ("M" + P([(40, -160)]) + "C" + P([(84, -164), (92, -100), (52, -70)])
              + "L" + P([(49, -78)]) + "C" + P([(76, -102), (72, -150), (39, -150)]) + "Z")
    hi = ("M" + P([(30, -16)]) + "C" + P([(48, -30), (52, -64), (38, -92)])
          + "C" + P([(44, -64), (42, -36), (30, -16)]) + "Z"
          + "M" + P([(17, -135)]) + "C" + P([(22, -145), (28, -153), (33, -161)])
          + "C" + P([(28, -157), (22, -149), (15, -137)]) + "Z"
          + "M" + P([(10, -196)]) + "C" + P([(22, -193), (32, -187), (36, -178)])
          + "C" + P([(28, -184), (20, -189), (10, -196)]) + "Z")
    foot = poly([(x - 34 * u, y), (x + 34 * u, y), (x + 32 * u, y - 7 * u), (x - 32 * u, y - 7 * u)])
    halo = f'<path class="{halo_cls}" fill="none" d="{spout}{handle}{body}"/>' if halo_cls else ""
    return (halo + f'<path fill="{INK}" d="{spout}"/><path fill="{INK}" d="{handle}"/><path fill="{INK}" d="{body}"/>'
            f'<path fill="{INK_DEEP}" d="{foot}"/><path fill="{SLATE}" d="{hi}"/>')


def finjan(x, y, a):
    """فنجال بدون يد: أبيض، وداخله #E4DCD0، وجنبه اليسار أغمق. (x, y) = نص القاعدة، a = نصف عرض الفم."""
    h, b = a * 1.25, a * .3
    body = (f"M{f(x - a)} {f(y - h)}C{f(x - a)} {f(y - h * .38)} {f(x - a * .56)} {f(y - h * .06)} {f(x - a * .46)} {f(y)}"
            f"H{f(x + a * .46)}C{f(x + a * .56)} {f(y - h * .06)} {f(x + a)} {f(y - h * .38)} {f(x + a)} {f(y - h)}Z")
    shade = (f"M{f(x - a)} {f(y - h)}C{f(x - a)} {f(y - h * .38)} {f(x - a * .56)} {f(y - h * .06)} {f(x - a * .46)} {f(y)}"
             f"H{f(x - a * .2)}C{f(x - a * .5)} {f(y - h * .2)} {f(x - a * .74)} {f(y - h * .55)} {f(x - a * .7)} {f(y - h)}Z")
    rim = f'<ellipse cx="{f(x)}" cy="{f(y - h)}" rx="{f(a)}" ry="{f(b)}" fill="{WHITE}"/>'
    ins = f'<ellipse cx="{f(x)}" cy="{f(y - h + b * .12)}" rx="{f(a * .86)}" ry="{f(b * .74)}" fill="{SAND200}"/>'
    return f'<path fill="{WHITE}" d="{body}"/><path fill="{SAND200}" d="{shade}"/>{rim}{ins}'


def counter_css(p):
    return (f".{p}wall{{fill:var(--lt-surface-2,#F3EEE6)}}.{p}top{{fill:var(--lt-surface,#FFFFFF)}}"
            f".{p}front{{fill:var(--lt-border,#E4DCD0)}}.{p}shop{{color:var(--il-cafe,{CAFE})}}.{p}edge{{stroke:none}}"
            f"@media (prefers-color-scheme:dark){{.{p}wall{{fill:var(--lt-surface-2,#1C2B29)}}"
            f".{p}top{{fill:var(--lt-border,#2A3B38)}}.{p}front{{fill:var(--lt-surface,#152120)}}"
            f".{p}edge{{stroke:{INK_EDGE};stroke-width:1}}}}" + shadow_css(p))


def counter(p, W, H, top_y, front_y):
    return [f"<defs>{shadow_def(p)}</defs>",
            f'<rect class="{p}wall" width="{W}" height="{top_y}"/>',
            f'<rect class="{p}top" y="{top_y}" width="{W}" height="{front_y - top_y}"/>',
            f'<rect class="{p}front" y="{front_y}" width="{W}" height="{H - front_y}"/>']


# ---------- 5) مشهد البطل: كاونتر ضيافة ----------
def hero():
    p = "hc-"
    W, H = 600, 520
    top_y, front_y = 380, 392          # الكاونتر: الحافة الخلفية للسطح، وحافته القدامية
    k, kp, tilt = 1.75, 1.78, 13        # px/mm للستاند والجوال، وميلان الجوال
    style = (counter_css(p) + f".{p}dedge{{stroke:none}}"
             f"@media (prefers-color-scheme:dark){{.{p}dedge{{stroke:{INK_EDGE};stroke-width:2}}}}")
    g = counter(p, W, H, top_y, front_y)
    # الدلة أصغر 20% (0.88 ← 0.70) ومتأخرة ورا الستاند (مقبضها مستور)، والفنجالين قدامها يسار (تقييم المدير الفني 1، البند 2)
    g.append(shadow(p, 270, 382, 40, 5))
    g.append(dalla(p, 272, 382, .70, halo_cls=p + "dedge"))
    g.append(shadow(p, 124, 388, 30, 5))
    g.append(finjan(128, 388, 24))
    g.append(shadow(p, 186, 389, 30, 5))
    g.append(finjan(190, 389, 24))
    # الستاند (قالب print/stand): اسم المحل نص في خانة الشعار (GM-027)
    s, dot, (bx, bw) = stand(p, 408, 388, k, p + "shop", "المنيو", name="مقهى المثال")
    g.append(shadow(p, bx + bw / 2 - 6, 388, bw * .62, 8))
    g.append(s)
    # الجوال: الشاشة مطفية بحبر الجوال (#14201F)، عشان ما يطلع وميض أبيض قبل ما تنكشف المنيو (قرار رئيس القسم)
    ph, meta = phone_at(p, "hc-slot-menu", dot, kp, tilt, screen_fill=INK)
    g.append(ph)
    title = "جوال يلمس نقطة ستاند «مقهى المثال» على كاونتر الضيافة، وتنفتح على شاشته منيو المقهى"
    return svg_doc(W, H, title, "".join(g), style, p), {"phone": meta, "dot": dot}


# ---------- 6) مشهد باب الشقة: الباب كامل داخل الجدار، وجنبه ملصق الباركود وملصق الشريحة ----------
def host():
    """تقييم المدير الفني 1، البند 1: الجدار ورا الباب وحوله، والباب كامل داخل المشهد وبعيد عن حافته 24 أو أكثر،
    وحافة 1px (#E4DCD0 فاتح، #2A3B38 داكن)، والباب أبيض في الوضعين.
    المقياس: الغرفة 0.2px لكل mm (الباب كامل)، والملصقين والجوال مكبّرين 3.6 مرات بنفس النسبة،
    عشان يبانون وهم أصغر بكثير من الباب، وعلاقتهم ببعض تبقى حقيقية."""
    p = "hd-"
    W, H = 560, 520
    s = .2                         # px لكل mm للجدار والباب
    ks = kp = s * 3.6               # الملصقين والجوال بنفس التكبير، عشان علاقتهم ببعض تبقى حقيقية
    tilt = -13
    floor_y = 478                  # خط الأرض
    style = (f".{p}wall{{fill:var(--lt-surface-2,#F3EEE6)}}.{p}floor{{fill:var(--lt-border,#E4DCD0)}}"
             f".{p}line{{stroke:{SAND200};stroke-width:1}}.{p}shop{{color:var(--il-apartments,{APARTMENTS})}}.{p}edge{{stroke:none}}"
             f"@media (prefers-color-scheme:dark){{.{p}wall{{fill:var(--lt-surface-2,#1C2B29)}}.{p}floor{{fill:var(--lt-border,#2A3B38)}}"
             f".{p}line{{stroke:{INK_EDGE}}}.{p}edge{{stroke:{INK_EDGE};stroke-width:1}}}}" + shadow_css(p))
    g = [f"<defs>{shadow_def(p)}</defs>", f'<rect class="{p}wall" width="{W}" height="{H}"/>',
         f'<rect class="{p}floor" y="{floor_y}" width="{W}" height="{H - floor_y}"/>']
    # الباب: درفة 0.9×2.05m، وحلق 7cm حوالينها، ومقبض على 1.05m، وعين الباب على 1.5m
    lw, lh, fw = 900 * s, 2050 * s, 70 * s
    x0 = 100                                          # حافة الحلق اليسرى
    top = floor_y - lh - fw
    g.append(f'<rect class="{p}line" fill="{WHITE}" x="{f(x0)}" y="{f(top)}" width="{f(lw + 2 * fw)}" height="{f(lh + fw)}"/>')
    lx, ly = x0 + fw, top + fw
    g.append(f'<rect class="{p}line" fill="{WHITE}" x="{f(lx)}" y="{f(ly)}" width="{f(lw)}" height="{f(lh)}"/>')
    shade = poly([(lx + .5, ly + .5), (lx + lw - .5, ly + .5), (lx + lw - .5, ly + 3.5), (lx + 3.5, ly + 3.5),
                  (lx + 3.5, floor_y - .5), (lx + .5, floor_y - .5)])
    g.append(f'<path fill="{SAND200}" d="{shade}"/>')    # ظل الحلق على الدرفة (النور من فوق يمين)
    hx, hy = lx + lw - 24, floor_y - 1050 * s          # المقبض
    g.append(f'<path fill="{INK}" d="{circle(hx, hy, 5.2)}{rrect(hx - 26, hy - 2.2, 28, 4.4, 2.2)}"/>')
    g.append(f'<path fill="{SLATE}" d="{rrect(hx - 24, hy - 2.2, 24, 1.2, .6)}"/>')
    g.append(f'<path fill="{INK}" d="{circle(lx + lw / 2, floor_y - 1500 * s, 2.2)}"/>')      # عين الباب
    # الملصقين على 1.25m: ملصق الباركود أقرب للباب، وبعده بـ 16mm (المطلوب 10 أو أكثر) ملصق الشريحة 45×45 (print/dims.js)
    cy = floor_y - 1250 * s
    qw, qh, cw = 45 * ks, 68 * ks, 45 * ks
    x_qr = x0 + lw + 2 * fw + 150 * s
    y_top = cy - cw / 2
    gap = 16 * ks
    for x, w, h in ((x_qr, qw, qh), (x_qr + qw + gap, cw, cw)):
        g.append(shadow(p, x + w / 2 - 2, y_top + h + 1.5, w * .55, 2.2))
        g.append(f'<path class="{p}line" fill="{WHITE}" d="{rrect(x, y_top, w, h, 3 * ks)}"/>')
    qcx = x_qr + qw / 2
    d, _, _ = text_path("شقق المثال", 600, height=5 * ks, cx=qcx, cy=y_top + 7 * ks, simplify=.12)
    g.append(f'<path class="{p}shop" fill="currentColor" d="{d}"/>')
    q = 30 * ks
    g.append(fake_qr(qcx - q / 2, y_top + 22 * ks, q, n=15))
    x_chip = x_qr + qw + gap
    dot = (x_chip + cw / 2, cy, DOT_MM / 2 * ks)
    g.append(f'<path class="{p}shop" fill="currentColor" d="{circle(*dot)}"/>')
    # الجوال يلمس النقطة، مايل 13° (أعلاه لليسار) وينزل لتحت يمين في الجدار الفاضي
    ph, meta = phone_at(p, "hd-slot-guide", dot, kp, tilt)
    g.append(ph)
    title = "داخل شقة: الباب، وجنبه ملصق الباركود وملصق الشريحة، وجوال يلمس النقطة وتنفتح على شاشته دليل «شقق المثال»"
    return svg_doc(W, H, title, "".join(g), style, p), {"phone": meta, "dot": dot, "door": (x0, top, lw + 2 * fw, lh + fw)}


# ---------- 7) صفحة شرح التقييم: ستاند التقييم قريب ----------
def review():
    """تقييم المدير الفني 1، البند 4: ستاند تقييم قريب بنفس أسلوب البطل: شعار «مقهى المثال» (ملف web-brand)،
    و«قيّمنا في قوقل» نص عادي بدون G ولا نجوم، ونقطة اللمس، وباركود ما ينقرى. بدون زعفراننا."""
    p = "rs-"
    W, H = 600, 520
    top_y, front_y = 470, 482
    k = 2.75
    style = counter_css(p)
    g = counter(p, W, H, top_y, front_y)
    logo = os.path.join(ROOT, "website", "demo", "_brands", "cafe.svg")
    s, dot, (bx, bw) = stand(p, 306, 478, k, p + "shop", "قيّمنا في قوقل", logo=logo,
                              parts=("logo", "title", "dot", "touch", "scan", "qr"))
    g.append(shadow(p, bx + bw / 2 - 8, 478, bw * .62, 9))
    g.append(s)
    title = "ستاند تقييم «مقهى المثال» على الكاونتر: شعار المقهى، و«قيّمنا في قوقل»، ونقطة اللمس، والباركود"
    return svg_doc(W, H, title, "".join(g), style, p), {"dot": dot}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    files = {}
    files.update(touch_marks())
    files.update(icons())
    pf, slot = phone_frame()
    files["phone-frame.svg"] = pf
    hc, hc_meta = hero()
    files["hero-counter.svg"] = hc
    print("hero:", {k: tuple(round(v, 1) for v in t) for k, t in hc_meta.items()})
    hd, hd_meta = host()
    files["host-door.svg"] = hd
    print("host:", {k: tuple(round(v, 1) for v in t) for k, t in hd_meta.items()})
    rv, rv_meta = review()
    files["review-stand.svg"] = rv
    print("review:", {k: tuple(round(v, 1) for v in t) for k, t in rv_meta.items()})
    for name, content in files.items():
        path = os.path.join(a.out, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)
        print(f"{name}: {len(content.encode('utf-8'))} bytes")
    print("phone-frame slot (x y w h r):", " ".join(f(v) for v in slot))


if __name__ == "__main__":
    main()
