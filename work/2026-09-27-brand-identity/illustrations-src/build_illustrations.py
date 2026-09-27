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
                d.append("M" + "L".join(f"{f(x, prec)} {f(y, prec)}" for x, y in pts) + "Z")
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
def phone_parts(k, p, slot_id, hi=True, ox=0):
    """جوال من قدام بإحداثيات محلية: (0,0) = نص الحافة العليا، والجوال نازل لتحت. k = px لكل mm.
    72×150mm، زاوية 10mm، حافة متساوية 3mm، وكاميرا دائرية صغيرة في النص فوق.
    يرجع (الجسم، الشاشة، الكاميرا، أبعاد الشاشة)."""
    W, H, R, b = 72 * k, 150 * k, 10 * k, 3 * k
    body = f'<path fill="{INK}" class="{p}edge" d="{rrect(ox - W / 2, 0, W, H, R)}"/>'
    if hi:  # حافة عليا أفتح (النور من فوق)
        body += f'<path fill="{INK_EDGE}" d="{rrect(ox - W / 2 + R * .9, 0, W - R * 1.8, 1.4 * k / 1.85 + .6, .8)}"/>'
    sx, sy, sw, sh, sr = ox - W / 2 + b, b, W - 2 * b, H - 2 * b, R - b
    screen = f'<rect id="{slot_id}" x="{f(sx)}" y="{f(sy)}" width="{f(sw)}" height="{f(sh)}" rx="{f(sr)}" fill="#FFFFFF"/>'
    cam = f'<circle cx="{f(ox)}" cy="{f(sy + 3.2 * k)}" r="{f(1.35 * k)}" fill="{INK}"/>'
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


# ---------- 4) الأشياء ----------
DEPTH = (-4, -4)  # العمق الخفيف: نشوف الجنب اليسار (أغمق) والحافة العليا (أفتح)، والنور من فوق يمين


def block(x, y, w, h, front, top, side, d=DEPTH, r=0):
    """مكعب مواجه بعمق خفيف: الوجه، والحافة العليا، والجنب اليسار."""
    dx, dy = d
    t = poly([(x, y), (x + w, y), (x + w + dx, y + dy), (x + dx, y + dy)])
    s = poly([(x, y), (x + dx, y + dy), (x + dx, y + h + dy), (x, y + h)])
    fr = rrect(x, y, w, h, r) if r else poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)])
    return f'<path fill="{side}" d="{s}"/><path fill="{top}" d="{t}"/><path fill="{front}" d="{fr}"/>'


def face_content(x0, y0, k, shop_cls, name, title, parts=("name", "title", "dot")):
    """وجه الستاند أو اللوحة بمقاسات قالب الستاند (الموجز الفني القسم 6)، بالمليمتر من الزاوية العليا.
    اسم المحل نص بلون المحل في خانة الشعار (GM-027)، والعنوان حبر، والنقطة بلون المحل على مركز الشريحة (62mm)."""
    out = []
    cx = x0 + 52.5 * k
    if "name" in parts:  # خانة الشعار 70×18mm من 12 لين 30mm: الاسم بارتفاع حبر 9mm
        d, w, _ = text_path(name, 600, height=9 * k, cx=cx, cy=y0 + 21 * k, simplify=.12)
        if w > 64 * k:
            d, w, _ = text_path(name, 600, height=9 * k * 64 * k / w, cx=cx, cy=y0 + 21 * k, simplify=.12)
        out.append(f'<path class="{shop_cls}" fill="currentColor" d="{d}"/>')
    if "title" in parts:  # العنوان 18pt (6.35mm) من 34 لين 42mm
        d, _, _ = text_path(title, 600, size=6.35 * k, cx=cx, cy=y0 + 38.5 * k, simplify=.1)
        out.append(f'<path fill="{INK}" d="{d}"/>')
    dot = (cx, y0 + 62 * k, DOT_MM / 2 * k)
    if "dot" in parts:
        out.append(f'<path class="{shop_cls}" fill="currentColor" d="{circle(*dot)}"/>')
    return "".join(out), dot


def stand(p, cx, floor_y, k, shop_cls, name, title):
    """ستاند A6: وجه أبيض 105×148mm على قاعدة حبر 120×12mm. يرجع (الرسم، مركز النقطة ونصف قطرها، حدود القاعدة)."""
    bw, bh = 120 * k, 12 * k
    bx, by = cx - bw / 2, floor_y - bh
    fw, fh = 105 * k, 148 * k
    fx, fy = cx - fw / 2, by + 1.5 - fh
    g = [block(bx, by, bw, bh, INK, INK_EDGE, INK_DEEP),
         block(fx, fy, fw, fh, WHITE, WHITE, SAND200, d=(-3.2, -2.4), r=2 * k)]
    content, dot = face_content(fx, fy, k, shop_cls, name, title)
    g.append(content)
    return "".join(g), dot, (bx, bw)


def dalla(p, x, y, u):
    """دلة حديثة سادة: حبر مطفي بإضاءات #56625F على اليمين (النور من فوق يمين). (x, y) = نص القاعدة، u = مقياس."""
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
    return (f'<path fill="{INK}" d="{spout}"/><path fill="{INK}" d="{handle}"/><path fill="{INK}" d="{body}"/>'
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


# ---------- 5) مشهد البطل: كاونتر ضيافة ----------
def hero():
    p = "hc-"
    W, H = 600, 520
    top_y, front_y = 380, 392          # الكاونتر: الحافة الخلفية للسطح، وحافته القدامية
    k, kp, tilt = 1.75, 1.78, 13        # px/mm للستاند والجوال، وميلان الجوال
    style = (f".{p}wall{{fill:var(--lt-surface-2,#F3EEE6)}}.{p}top{{fill:var(--lt-surface,#FFFFFF)}}"
             f".{p}front{{fill:var(--lt-border,#E4DCD0)}}.{p}shop{{color:var(--il-cafe,{CAFE})}}.{p}edge{{stroke:none}}"
             f"@media (prefers-color-scheme:dark){{.{p}wall{{fill:var(--lt-surface-2,#1C2B29)}}"
             f".{p}top{{fill:var(--lt-border,#2A3B38)}}.{p}front{{fill:var(--lt-surface,#152120)}}"
             f".{p}edge{{stroke:{INK_EDGE};stroke-width:1}}}}" + shadow_css(p))
    g = [f"<defs>{shadow_def(p)}</defs>",
         f'<rect class="{p}wall" width="{W}" height="{top_y}"/>',
         f'<rect class="{p}top" y="{top_y}" width="{W}" height="{front_y - top_y}"/>',
         f'<rect class="{p}front" y="{front_y}" width="{W}" height="{H - front_y}"/>']
    # الدلة والفنجالين ورا الستاند (الصف الخلفي)
    g.append(shadow(p, 150, 383, 54, 6))
    g.append(dalla(p, 154, 383, .88))
    g.append(shadow(p, 56, 385, 32, 5))
    g.append(finjan(60, 385, 26))
    g.append(shadow(p, 234, 386, 32, 5))
    g.append(finjan(238, 386, 26))
    # الستاند
    s, (dx, dy, dr), (bx, bw) = stand(p, 408, 388, k, p + "shop", "مقهى المثال", "المنيو")
    g.append(shadow(p, bx + bw / 2 - 6, 388, bw * .62, 8))
    g.append(s)
    # الجوال: حافته العليا تلمس النقطة، مايل 13° (أعلاه لليمين)، وينزل لتحت يسار
    body, screen, cam, _ = phone_parts(kp, p, "hc-slot-menu")
    a = math.radians(tilt)
    gap = 1.2
    tx, ty = dx - (dr + gap) * math.sin(a), dy + (dr + gap) * math.cos(a)
    g.append(f'<g id="hc-phone" transform="translate({f(tx)} {f(ty)}) rotate({tilt})"><g class="hc-phone-move">'
             f"{body}{screen}{cam}</g></g>")
    title = "جوال يلمس نقطة ستاند «مقهى المثال» على كاونتر الضيافة، وتنفتح على شاشته منيو المقهى"
    return svg_doc(W, H, title, "".join(g), style, p), {"phone": (tx, ty, tilt), "dot": (dx, dy, dr)}


# ---------- 6) مشهد باب الشقة: ملصق الشريحة وملصق الباركود جنب الباب ----------
def fake_qr(x, y, s, seed=11):
    """باركود ما ينقرى (الموجز الفني القسم 7): 3 مربعات زوايا وملمس نقاط، مسار واحد."""
    rnd, n = random.Random(seed), 21
    m = s / n
    d = []
    for fx, fy in ((0, 0), (n - 7, 0), (0, n - 7)):
        X, Y = x + fx * m, y + fy * m
        d.append(f"M{f(X)} {f(Y)}h{f(7 * m)}v{f(7 * m)}h{f(-7 * m)}zM{f(X + m)} {f(Y + m)}v{f(5 * m)}h{f(5 * m)}v{f(-5 * m)}z"
                 f"M{f(X + 2 * m)} {f(Y + 2 * m)}h{f(3 * m)}v{f(3 * m)}h{f(-3 * m)}z")
    for j in range(n):  # كل صف: الخلايا المتلاصقة مستطيل واحد
        run = None
        for i in range(n + 1):
            skip = i == n or (i < 8 and j < 8) or (i >= n - 8 and j < 8) or (i < 8 and j >= n - 8)
            on = not skip and rnd.random() < .42
            if on and run is None:
                run = i
            if not on and run is not None:
                d.append(f"M{f(x + run * m)} {f(y + j * m)}h{f((i - run) * m)}v{f(m)}h{f(-(i - run) * m)}z")
                run = None
    return f'<path fill="{INK}" fill-rule="evenodd" d="{"".join(d)}"/>'


def sticker(x, y, w, h, k):
    """ملصق أبيض على الجدار: زاوية 3mm، وسماكة خفيفة (جنب يسار وتحت أغمق)."""
    r = 3 * k
    return (f'<path fill="{SAND200}" d="{rrect(x - 1.6, y + 1.6, w, h, r)}"/>'
            f'<path fill="{WHITE}" d="{rrect(x, y, w, h, r)}"/>')


def host():
    p = "hd-"
    W, H = 560, 520
    kw, kp, tilt = 1.5, 1.75, 13         # px/mm للجدار والملصقات، وللجوال (أقرب للكاميرا)، وميلانه
    top_cm = 136                          # أعلى المشهد على ارتفاع 136cm، وتحته كل 1cm = 15px
    y_at = lambda cm: (top_cm - cm) * 10 * kw
    style = (f".{p}wall{{fill:var(--lt-surface-2,#F3EEE6)}}.{p}shop{{color:var(--il-apartments,{APARTMENTS})}}.{p}edge{{stroke:none}}"
             f"@media (prefers-color-scheme:dark){{.{p}wall{{fill:var(--lt-surface-2,#1C2B29)}}"
             f".{p}edge{{stroke:{INK_EDGE};stroke-width:1}}}}" + shadow_css(p))
    g = [f"<defs>{shadow_def(p)}</defs>", f'<rect class="{p}wall" width="{W}" height="{H}"/>']
    # الباب: درفة بيضاء، وفتحة بحافة #E4DCD0، وإطار أبيض (حلق) بعرض 6cm، ومقبض حبر
    leaf_r, frame_w = 74, 6 * 10 * kw
    g.append(f'<rect fill="{WHITE}" x="-2" y="-2" width="{leaf_r + 2}" height="{H + 4}"/>')
    g.append(f'<rect fill="{SAND200}" x="{leaf_r - 5}" y="-2" width="7" height="{H + 4}"/>')          # حافة الدرفة والفتحة
    g.append(f'<rect fill="{SAND200}" x="{leaf_r + 2}" y="-2" width="5" height="{H + 4}"/>')          # جنب الإطار (ظل)
    g.append(f'<rect fill="{WHITE}" x="{leaf_r + 7}" y="-2" width="{f(frame_w - 5)}" height="{H + 4}"/>')
    hx, hy = leaf_r - 30, y_at(108)                                                                   # المقبض على 108cm
    g.append(f'<path fill="{INK}" d="{circle(hx, hy, 22)}"/>')
    g.append(f'<path fill="{INK}" d="{rrect(hx - 118, hy - 9, 124, 18, 9)}"/>')
    g.append(f'<path fill="{SLATE}" d="{rrect(hx - 112, hy - 9, 114, 4, 2)}"/>')
    # الملصقين على 125cm (مركز الشريحة): الشريحة 45×45، وبعدها بـ 16mm ملصق الباركود 55×75
    cs = 45 * kw
    cx0 = leaf_r + frame_w + 112
    cy = y_at(125)
    x_chip, y_chip = cx0, cy - cs / 2
    g.append(shadow(p, x_chip + cs / 2 - 3, y_chip + cs + 2, cs * .55, 3))
    g.append(sticker(x_chip, y_chip, cs, cs, kw))
    dot = (x_chip + cs / 2, cy, DOT_MM / 2 * kw)
    g.append(f'<path class="{p}shop" fill="currentColor" d="{circle(*dot)}"/>')
    qw, qh = 55 * kw, 75 * kw
    x_qr, y_qr = x_chip + cs + 16 * kw, y_chip
    g.append(shadow(p, x_qr + qw / 2 - 3, y_qr + qh + 2, qw * .55, 3))
    g.append(sticker(x_qr, y_qr, qw, qh, kw))
    qcx = x_qr + qw / 2
    d, _, _ = text_path("شقق المثال", 600, height=5 * kw, cx=qcx, cy=y_qr + 8 * kw, simplify=.15)
    g.append(f'<path class="{p}shop" fill="currentColor" d="{d}"/>')
    d, _, _ = text_path("الواي فاي ودليل الوحدة", 600, size=3.6 * kw, cx=qcx, cy=y_qr + 17 * kw, simplify=.24)
    g.append(f'<path fill="{INK}" d="{d}"/>')
    qs = 32 * kw
    g.append(fake_qr(qcx - qs / 2, y_qr + 24 * kw, qs))
    d, _, _ = text_path("امسح الباركود", 500, size=3.2 * kw, cx=qcx, cy=y_qr + 64 * kw, simplify=.24)
    g.append(f'<path fill="{INK}" d="{d}"/>')
    # الجوال يلمس النقطة
    body, screen, cam, _ = phone_parts(kp, p, "hd-slot-guide")
    a = math.radians(tilt)
    gap = 1.2
    tx, ty = dot[0] - (dot[2] + gap) * math.sin(a), dot[1] + (dot[2] + gap) * math.cos(a)
    g.append(f'<g id="hd-phone" transform="translate({f(tx)} {f(ty)}) rotate({tilt})"><g class="hd-phone-move">'
             f"{body}{screen}{cam}</g></g>")
    title = "داخل شقة جنب الباب: جوال يلمس نقطة ملصق الشريحة، وجنبه ملصق الباركود، وتنفتح على الشاشة دليل «شقق المثال»"
    return svg_doc(W, H, title, "".join(g), style, p), {"phone": (tx, ty, tilt), "dot": dot, "qr_left": (x_qr,)}


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
    for name, content in files.items():
        path = os.path.join(a.out, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(content)
        print(f"{name}: {len(content.encode('utf-8'))} bytes")
    print("phone-frame slot (x y w h r):", " ".join(f(v) for v in slot))


if __name__ == "__main__":
    main()
