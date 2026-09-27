"""يبني كل ملفات الشعار (SVG) من خط Readex Pro، والاسم من website/config.js.

الفكرة «النقطة لمسة»: الرمز حرف «ب»: الحوض = سطح الستاند أو البطاقة، والنقطة الزعفرانية تحته = الشريحة
(نقطة اللمس). كل نقاط الاسم العربي دوائر زعفرانية، ونقاط الحرف الواحد منفصلة عن بعض (كل نقطة لمسة).
موجة اللمسة تعيش في الحركة (web-motion: موجة من نقطة الضغط)، مو في الشعار الثابت. القرار وسببه:
work/2026-09-27-brand-identity/web-brand.md

التشغيل من جذر المشروع:  python brand/src/build_logo.py && python brand/src/export_png.py
الاسم «لمسة تاب — LamsaTap» (GM-012) ينقرى من website/config.js (companyName و companyNameEn)، مصدر واحد للموقع والشعار.
للتجربة في مجلد ثاني بدون لمس الموقع:  --config <ملف config.js> --out <مجلد>
يحتاج: fonttools و uharfbuzz و opencv-python و numpy (الأخيرتين لتفريغ «ب» في نسخ اللون الواحد؛ بدونها يوقف قبل ما يكتب أي ملف).
الخط: brand/fonts/source/ReadexPro[HEXP,wght].ttf (رخصة OFL). النص يطلع مسارات (paths)، فالملفات ما تحتاج الخط مثبّت.
"""
import argparse
import html
import itertools
import math
import os
import re
import sys

import uharfbuzz as hb
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VF = os.path.join(ROOT, "brand", "fonts", "source", "ReadexPro[HEXP,wght].ttf")
OUT = os.path.join(ROOT, "brand", "logo")
CONFIG = os.path.join(ROOT, "website", "config.js")
FALLBACK_EN = "LamsaTap"

# ألوان الهوية (نفس brand/tokens.css)
TEAL = "#0B7A75"         # الأساسي: الاسم اللاتيني على الفاتح
TEAL_DEEP = "#075E5A"    # مربع الرمز
TEAL_LIGHT = "#3FC1B6"   # الاسم اللاتيني على الداكن
SAFFRON = "#F2A93B"      # نقطة الرمز ونقاط الاسم على الفاتح
SAFFRON_LIGHT = "#F5B85A"  # نقاط الاسم على الداكن
INK = "#14201F"          # الاسم العربي على الفاتح
LIGHT_TEXT = "#ECF2F0"   # الاسم العربي على الداكن
MONO_BLACK, MONO_WHITE = "#000000", "#FFFFFF"  # نسخ اللون الواحد (حفر ليزر، طباعة أبيض وأسود)

STYLES = {  # (الاسم العربي، نقاطه، الاسم اللاتيني، الرمز)
    "light": (INK, SAFFRON, TEAL, None),
    "dark": (LIGHT_TEXT, SAFFRON_LIGHT, TEAL_LIGHT, None),
    "mono": (MONO_BLACK, MONO_BLACK, MONO_BLACK, MONO_BLACK),
    "mono-white": (MONO_WHITE, MONO_WHITE, MONO_WHITE, MONO_WHITE),
}

W_AR, W_EN = 700, 500   # أوزان الخط في الشعار
DOT_SCALE = 0.86        # قطر الدائرة ÷ حجم معيّن النقطة الأصلي في الخط
DOT_GAP = 0.30          # أقل فراغ بين نقطتين من نفس الحرف (× القطر): النقطتين ما يلتصقون في الأحجام الصغيرة
EN_RATIO = 0.42         # حجم الاسم اللاتيني ÷ حجم العربي
EN_TRACK = 20           # تباعد الحروف اللاتينية (وحدات الخط)

# مقاييس اسمية ثابتة (وحدات الخط، em = 1000): التخطيط ما يتغير مع حروف الاسم، والإطار يُقص على الحبر الفعلي
AR_TOP, AR_BOTTOM = 803, -269    # أعلى نقاط فوق الحروف، وأسفل النقطة تحت
EN_TOP, EN_BOTTOM = 700, -220    # ارتفاع الحروف الكبيرة، ونزول p

# الرمز (من 512): عرض «ب»، نصف قطر النقطة، الفراغ بينهم، زاوية المربع
SYM_BODY_W, SYM_DOT_R, SYM_GAP, SYM_RADIUS = 330, 46, 40, 115
# الشعار الكامل (عمودي): حجم الرمز، حجم العربي (px لكل em)، الفراغات
ST_ICON, ST_AR_EM, ST_G1, ST_G2 = 240, 117, 44, 26
# الشعار الأفقي: حجم العربي، الفراغ بين النص والرمز، بين السطرين، الرمز ÷ ارتفاع كتلة النص
HZ_AR_EM, HZ_GX, HZ_GY, HZ_ICON_K = 90, 34, 22, 1.08

# أصغر حجم: الاسم اللاتيني (ارتفاع الحرف الكبير) يبقى مقروء، والفراغ بين نقطتي الحرف ما ينسد
MIN_CAP_PX, MIN_GAP_PX = 7, 1        # الشاشة: حرف لاتيني كبير ≥ 7px (نص 10px تقريباً)، فراغ النقطتين ≥ 1px
MIN_CAP_MM, MIN_GAP_MM = 1.8, 0.35   # الطباعة والحفر: حرف كبير ≥ 1.8mm (نص 7pt تقريباً)، فراغ النقطتين ≥ 0.35mm
SYM_MIN_PX, SYM_MIN_MM = 16, 6       # الرمز لحاله: 16px (favicon) و 6mm (أضيق فراغ فيه عندها 0.47mm)


def num(v):
    s = f"{v:.1f}"
    s = s[:-2] if s.endswith(".0") else s
    return "0" if s == "-0" else s


# ---------- الاسم من config.js ----------

def strip_js_comments(src):
    """يشيل تعليقات // و /* */ من ملف JS، ويخلي اللي داخل النصوص على حاله (مثل https://)."""
    out, i, n, quote = [], 0, len(src), None
    while i < n:
        c = src[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(src[i + 1])
                i += 2
                continue
            if c == quote:
                quote = None
            i += 1
        elif c in "\"'`":
            quote = c
            out.append(c)
            i += 1
        elif src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def read_names(path):
    with open(path, encoding="utf-8") as f:
        src = strip_js_comments(f.read())

    def field(key):  # مثل JavaScript: آخر قيمة تغلب، والمفتاح ممكن يكون بين علامتي تنصيص
        ms = list(re.finditer(r"[\"']?\b" + key + r"\b[\"']?\s*:\s*([\"'`])((?:\\.|(?!\1).)*)\1", src))
        return re.sub(r"\\(.)", r"\1", ms[-1].group(2)).strip() if ms else ""

    ar, en = field("companyName"), field("companyNameEn")
    if not ar:
        raise SystemExit(f"ما لقيت companyName في {path}")
    if not en:
        print(f"تنبيه: companyNameEn ناقص في {path}، استخدمت {FALLBACK_EN}")
        en = FALLBACK_EN
    if "ب" not in ar:
        print(f"تنبيه: الرمز «ب» ما هو في الاسم «{ar}». web-brand يراجع الرمز (GM-009).")
    return ar, en


# ---------- الخط ----------

_fonts = {}


def instance(w):
    if w not in _fonts:
        _fonts[w] = instancer.instantiateVariableFont(TTFont(VF), {"wght": w, "HEXP": 0})
    return _fonts[w]


def shape(text, w):
    font = hb.Font(hb.Face(hb.Blob.from_file_path(VF)))
    font.set_variations({"wght": w, "HEXP": 0})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {})
    order = instance(w).getGlyphOrder()
    if any(i.codepoint == 0 for i in buf.glyph_infos):
        raise SystemExit(f"خط Readex Pro ما فيه كل حروف «{text}»")
    # HarfBuzz يرجع النص العربي بالترتيب المرئي (من اليسار)
    return [(order[i.codepoint], p.x_advance, p.x_offset, p.y_offset)
            for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def split_contours(ops):
    contours, cur = [], []
    for op, args in ops:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            contours.append(cur)
            cur = []
    return contours


def dot_group(gs, name, dx, dy):
    """نقاط حرف واحد كدوائر (x, y, القطر) في أماكنها الأصلية بالخط."""
    rec = RecordingPen()
    gs[name].draw(rec)
    dots = []
    for contour in split_contours(rec.value):
        b = BoundsPen(gs)
        for op, args in contour:
            getattr(b, op)(*args)
        x0, y0, x1, y1 = b.bounds
        dots.append(((x0 + x1) / 2 + dx, (y0 + y1) / 2 + dy, max(x1 - x0, y1 - y0) * DOT_SCALE))
    return dots


def clearance(a, b):
    """الفراغ بين حافتي دائرتين (سالب = متداخلة)."""
    return math.dist(a[:2], b[:2]) - (a[2] + b[2]) / 2


def spread_dots(groups):
    """يباعد نقاط كل حرف لين يصير بينها فراغ DOT_GAP × القطر. التباعد أفقي عشان النقاط ما تنزل على
    أسنان الحرف (مثل ش)، إلا لو النقاط فوق بعض فيصير من مركزها. وما يقرّب نقاط حرف من نقاط الحرف
    اللي جنبه أكثر من الخط الأصلي أو من DOT_GAP (مثل «تت» و«يي»).
    يرجع كل النقاط، وأضيق فراغ بين أي نقطتين في الاسم (None لو فيه نقطة وحدة بس)، وهل فيه حرف
    ما انفصلت نقاطه (الجار ما خلى مكان، فترجع لمسافة الخط الأصلية)."""
    def place(g, k, radial):
        mx, my = sum(d[0] for d in g) / len(g), sum(d[1] for d in g) / len(g)
        return [(mx + (x - mx) * k, my + (y - my) * k if radial else y, d) for x, y, d in g]

    def inner_ok(g, k, radial):
        return all(clearance(a, b) >= DOT_GAP * max(a[2], b[2]) - 1e-6
                   for a, b in itertools.combinations(place(g, k, radial), 2))

    plan = []  # [k, radial] لكل حرف
    for g in groups:
        if len(g) < 2 or inner_ok(g, 1.0, False):
            plan.append([1.0, False])
            continue
        radial = not inner_ok(g, 3.0, False)  # الأفقي ما يكفي: النقاط فوق بعض
        lo, hi = 1.0, 3.0
        for _ in range(50):  # أقل تباعد يعطي الفراغ المطلوب
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if inner_ok(g, mid, radial) else (mid, hi)
        plan.append([hi, radial])

    pairs = list(itertools.combinations(range(len(groups)), 2))
    limit = {(i, j): min(clearance(a, b) for a in groups[i] for b in groups[j]) for i, j in pairs}
    for _ in range(300):  # نقاط الحروف المتجاورة: نخفف التباعد لين ترجع مسافتها مقبولة
        pts = [place(g, k, r) for g, (k, r) in zip(groups, plan)]
        bad = [(i, j) for i, j in pairs
               if min(clearance(a, b) for a in pts[i] for b in pts[j])
               < min(limit[(i, j)], DOT_GAP * max(d[2] for d in pts[i] + pts[j])) - 1e-6]
        movable = [g for i, j in bad for g in (i, j) if plan[g][0] > 1.0]
        if not movable:
            break
        for g in set(movable):
            plan[g][0] = max(1.0, plan[g][0] - 0.01)
    placed = [place(g, k, r) for g, (k, r) in zip(groups, plan)]
    short = any(not inner_ok(p, 1.0, False) for p in placed if len(p) > 1)
    dots = [p for g in placed for p in g]
    gaps = [clearance(a, b) for a, b in itertools.combinations(dots, 2)]
    return dots, (min(gaps) if gaps else None), short


class Text:
    """نص مشكّل: الجسم مسارات، والنقاط (لو split_dots) دوائر. bbox = الحبر الفعلي بوحدات الخط."""

    def __init__(self, text, w, split_dots=True, tracking=0):
        font = instance(w)
        gs, glyf = font.getGlyphSet(), font["glyf"]
        self.parts, groups, x = [], [], 0
        ink = BoundsPen(gs)
        for name, adv, xo, yo in shape(text, w):
            g = glyf[name]
            comps = [(c.glyphName, c.x, c.y) for c in g.components] if g.isComposite() else [(name, 0, 0)]
            for cname, cx, cy in comps:
                dx, dy = x + xo + cx, yo + cy
                if split_dots and "dot" in cname.lower():
                    groups.append(dot_group(gs, cname, dx, dy))
                else:
                    self.parts.append((gs[cname], dx, dy))
                    gs[cname].draw(TransformPen(ink, (1, 0, 0, 1, dx, dy)))
            x += adv + tracking
        self.dots, self.min_gap, self.dots_short = spread_dots(groups) if groups else ([], None, False)
        x0, y0, x1, y1 = ink.bounds
        for cx, cy, d in self.dots:
            x0, y0, x1, y1 = min(x0, cx - d / 2), min(y0, cy - d / 2), max(x1, cx + d / 2), max(y1, cy + d / 2)
        self.bbox = (x0, y0, x1, y1)

    def extent(self, s):
        """(عرض الحبر، ارتفاعه فوق خط القاعدة، نزوله تحت خط القاعدة) بمقياس s."""
        x0, y0, x1, y1 = self.bbox
        return (x1 - x0) * s, y1 * s, -y0 * s

    def svg(self, x, base, s, fill, dot_fill):
        """يرسم النص: حافة الحبر اليسرى عند x، وخط القاعدة عند base (y لتحت)."""
        x0 = self.bbox[0]
        pen = SVGPathPen(None, ntos=num)
        for glyph, dx, dy in self.parts:
            glyph.draw(TransformPen(pen, (s, 0, 0, -s, x + (dx - x0) * s, base - dy * s)))
        out = f'<path fill="{fill}" d="{pen.getCommands()}"/>'
        for cx, cy, d in self.dots:
            out += (f'<circle cx="{num(x + (cx - x0) * s)}" cy="{num(base - cy * s)}" '
                    f'r="{num(d * s / 2)}" fill="{dot_fill}"/>')
        return out


# ---------- الرمز ----------

def bbox_of(name, w):
    gs = instance(w).getGlyphSet()
    b = BoundsPen(gs)
    gs[name].draw(b)
    return b.bounds


def symbol_geometry(size=512):
    """مكان «ب» ونقطتها داخل المربع: (تحويل الحرف، (cx, cy, r))."""
    k = size / 512
    x0, y0, x1, y1 = bbox_of("uni066E", W_AR)
    s = SYM_BODY_W * k / (x1 - x0)
    bw, bh = (x1 - x0) * s, (y1 - y0) * s
    r, gap = SYM_DOT_R * k, SYM_GAP * k
    top = (size - (bh + gap + 2 * r)) / 2
    left = (size - bw) / 2
    transform = (s, 0, 0, -s, left - x0 * s, top + y1 * s)
    return transform, (size / 2, top + bh + gap + r, r)


def beh_path(transform):
    pen = SVGPathPen(None, ntos=num)
    instance(W_AR).getGlyphSet()["uni066E"].draw(TransformPen(pen, transform))
    return pen.getCommands()


def rounded_rect(size, r):
    if r <= 0:
        return f"M0 0H{num(size)}V{num(size)}H0Z"
    a, b, c = num(r), num(size - r), num(size)
    return (f"M{a} 0H{b}A{a} {a} 0 0 1 {c} {a}V{b}A{a} {a} 0 0 1 {b} {c}"
            f"H{a}A{a} {a} 0 0 1 0 {b}V{a}A{a} {a} 0 0 1 {a} 0Z")


def circle_path(cx, cy, r):
    return f"M{num(cx - r)} {num(cy)}a{num(r)} {num(r)} 0 1 0 {num(2 * r)} 0a{num(r)} {num(r)} 0 1 0 {num(-2 * r)} 0Z"


class _FlattenPen(BasePen):
    """يحوّل مسار الحرف لمضلعات (للتفريغ في نسخة اللون الواحد)."""

    def __init__(self, glyphset, steps=32):
        super().__init__(glyphset)
        self.polys, self.cur, self.steps = [], [], steps

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            u = 1 - t
            self.cur.append((u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
                             u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]))

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            u = 1 - t
            self.cur.append(tuple(u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d
                                  for a, b, c, d in zip(p0, p1, p2, p3)))

    def _closePath(self):
        if self.cur:
            self.polys.append(self.cur)
        self.cur = []

    _endPath = _closePath


def beh_union_path(transform, res=16):
    """حدود «ب» كمسار واحد بدون تداخل (خطوط الحرف في الخط متداخلة، والتفريغ evenodd يبيها نظيفة).
    يرسم الحرف بدقة res بكسل لكل وحدة ويتتبع حدوده؛ أقصى فرق مقاس عن الحرف الأصلي 0.12 من 512."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        raise SystemExit("نسخ اللون الواحد تحتاج opencv-python و numpy:  pip install opencv-python numpy")
    gs = instance(W_AR).getGlyphSet()
    pen = _FlattenPen(gs)
    gs["uni066E"].draw(TransformPen(pen, transform))
    pts = [p for poly in pen.polys for p in poly]
    ox, oy = min(p[0] for p in pts) - 2, min(p[1] for p in pts) - 2
    w = int((max(p[0] for p in pts) - ox + 4) * res)
    h = int((max(p[1] for p in pts) - oy + 4) * res)
    mask = np.zeros((h, w), np.uint8)
    for poly in pen.polys:  # كل خط لحاله: الاتحاد بدون مشكلة التداخل
        arr = np.array([[round((x - ox) * res * 16), round((y - oy) * res * 16)] for x, y in poly], np.int32)
        cv2.fillPoly(mask, [arr], 255, lineType=cv2.LINE_8, shift=4)
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = ""
    for c in contours:
        pts = []
        for px, py in cv2.approxPolyDP(c, 1.2, True)[:, 0, :]:
            p = f"{num(px / res + ox)} {num(py / res + oy)}"  # مراكز البكسل أعداد صحيحة (نظام OpenCV)
            if not pts or pts[-1] != p:
                pts.append(p)
        out += "M" + "L".join(pts) + "Z"
    return out


def symbol(size=512, full_bleed=False, mono=None):
    """الرمز المربع. mono=لون: نسخة لون واحد، المربع بهذا اللون و«ب» والنقطة مفرّغة (شفافة)."""
    transform, (cx, cy, r) = symbol_geometry(size)
    radius = 0 if full_bleed else SYM_RADIUS * size / 512
    if mono:
        return (f'<path fill="{mono}" fill-rule="evenodd" d="{rounded_rect(size, radius)}'
                f'{beh_union_path(transform)}{circle_path(cx, cy, r)}"/>')
    return (f'<rect width="{num(size)}" height="{num(size)}" rx="{num(radius)}" fill="{TEAL_DEEP}"/>'
            f'<path fill="#fff" d="{beh_path(transform)}"/>'
            f'<circle cx="{num(cx)}" cy="{num(cy)}" r="{num(r)}" fill="{SAFFRON}"/>')


# ---------- الملفات ----------

def svg_doc(names, x, y, w, h, body):
    title = html.escape(f"{names[0]} — {names[1]}", quote=True)  # & و " و < في الاسم ما يكسرون الملف
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x)} {num(y)} {num(w)} {num(h)}" '
            f'width="{num(w)}" height="{num(h)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def line_box(text, top, bottom):
    """حدود السطر (وحدات الخط): المقاس الاسمي، ويتمدد لو حبر الاسم أطول (ذيل م ع ي، أو الشدة)
    عشان الفراغ بين السطرين ما يقل عن المخطط."""
    return max(top, text.bbox[3]), min(bottom, text.bbox[1])


def placed_symbol(x, y, size, style):
    return (f'<g transform="translate({num(x)} {num(y)}) scale({size / 512:.6g})">'
            f'{symbol(mono=STYLES[style][3])}</g>')


def stacked(names, style):
    """الشعار الكامل: الرمز فوق، الاسم العربي، ثم اللاتيني. الإطار مقصوص على الحبر (المساحة الفارغة في القواعد)."""
    fg, dotc, enc, _ = STYLES[style]
    ar, en = Text(names[0], W_AR), Text(names[1], W_EN, split_dots=False, tracking=EN_TRACK)
    s_ar = ST_AR_EM / 1000
    s_en = s_ar * EN_RATIO
    (aw, a_up, a_dn), (ew, e_up, e_dn) = ar.extent(s_ar), en.extent(s_en)
    (a_top, a_bot), (e_top, e_bot) = line_box(ar, AR_TOP, AR_BOTTOM), line_box(en, EN_TOP, EN_BOTTOM)
    y_ar = ST_ICON + ST_G1 + a_top * s_ar
    y_en = y_ar - a_bot * s_ar + ST_G2 + e_top * s_en
    W = max(ST_ICON, aw, ew)
    body = placed_symbol((W - ST_ICON) / 2, 0, ST_ICON, style)
    body += ar.svg((W - aw) / 2, y_ar, s_ar, fg, dotc)
    body += en.svg((W - ew) / 2, y_en, s_en, enc, enc)
    y0 = min(0, y_ar - a_up)
    y1 = max(ST_ICON, y_ar + a_dn, y_en + e_dn)
    return svg_doc(names, 0, y0, W, y1 - y0, body), min_size(y1 - y0, W, EN_TOP * s_en, ar.min_gap and ar.min_gap * s_ar)


def horizontal(names, style):
    """الشعار الأفقي: الرمز يمين (بداية القراءة)، والنص يساره محاذى لجهة الرمز.
    ارتفاع الملف = ارتفاع الرمز (166 لـ«لمسة تاب»)، إلا لو علامة فوق الحروف (مثل الشدة) طلعت فوقه شوي."""
    fg, dotc, enc, _ = STYLES[style]
    ar, en = Text(names[0], W_AR), Text(names[1], W_EN, split_dots=False, tracking=EN_TRACK)
    s_ar = HZ_AR_EM / 1000
    s_en = s_ar * EN_RATIO
    (aw, a_up, a_dn), (ew, e_up, e_dn) = ar.extent(s_ar), en.extent(s_en)
    (a_top, a_bot), (e_top, e_bot) = line_box(ar, AR_TOP, AR_BOTTOM), line_box(en, EN_TOP, EN_BOTTOM)
    text_h = (AR_TOP - AR_BOTTOM) * s_ar + HZ_GY + (EN_TOP - EN_BOTTOM) * s_en  # اسمي: حجم الرمز ثابت
    icon = round(text_h * HZ_ICON_K)
    block_h = (a_top - a_bot) * s_ar + HZ_GY + (e_top - e_bot) * s_en       # الفعلي: الأسطر ما تتلامس
    W = max(aw, ew) + HZ_GX + icon
    ix = W - icon
    top = (icon - block_h) / 2
    y_ar = top + a_top * s_ar
    y_en = top + (a_top - a_bot) * s_ar + HZ_GY + e_top * s_en
    right = ix - HZ_GX
    body = placed_symbol(ix, 0, icon, style)
    body += ar.svg(right - aw, y_ar, s_ar, fg, dotc)
    body += en.svg(right - ew, y_en, s_en, enc, enc)
    y0 = min(0, y_ar - a_up, y_en - e_up)
    y1 = max(icon, y_ar + a_dn, y_en + e_dn)
    return svg_doc(names, 0, y0, W, y1 - y0, body), min_size(y1 - y0, W, EN_TOP * s_en, ar.min_gap and ar.min_gap * s_ar)


def min_size(h, w, cap, gap):
    """أصغر ارتفاع (px للشاشة، mm للطباعة) حسب MIN_*، والعرض المقابل. h وw وcap وgap بوحدات الملف."""
    gap = gap if gap and gap > 0 else None  # نقاط متلاصقة ما يحلها التكبير (عليها تنبيه في main)
    px = max(MIN_CAP_PX * h / cap, MIN_GAP_PX * h / gap if gap else 0)
    mm = max(MIN_CAP_MM * h / cap, MIN_GAP_MM * h / gap if gap else 0)
    px, mm = math.ceil(px), math.ceil(mm)
    return {"px": px, "px_w": math.ceil(px * w / h), "mm": mm, "mm_w": math.ceil(mm * w / h)}


def build(names):
    files = {
        "lamsatap-icon.svg": svg_doc(names, 0, 0, 512, 512, symbol()),
        "lamsatap-icon-fullbleed.svg": svg_doc(names, 0, 0, 512, 512, symbol(full_bleed=True)),
        "lamsatap-icon-mono.svg": svg_doc(names, 0, 0, 512, 512, symbol(mono=MONO_BLACK)),
        "lamsatap-icon-mono-white.svg": svg_doc(names, 0, 0, 512, 512, symbol(mono=MONO_WHITE)),
    }
    sizes = {}
    suffix = {"light": "", "dark": "-dark", "mono": "-mono", "mono-white": "-mono-white"}
    for style, sfx in suffix.items():
        files[f"lamsatap-logo{sfx}.svg"], sizes["الشعار الكامل lamsatap-logo*"] = stacked(names, style)
        files[f"lamsatap-horizontal{sfx}.svg"], sizes["الشعار الأفقي lamsatap-horizontal*"] = horizontal(names, style)
    return files, sizes


def main():
    ap = argparse.ArgumentParser(description="يبني ملفات الشعار من الخط، والاسم من config.js")
    ap.add_argument("--config", default=CONFIG, help="ملف config.js (الافتراضي: website/config.js)")
    ap.add_argument("--out", default=OUT, help="مجلد الناتج (الافتراضي: brand/logo)")
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):  # الرسائل العربية في طرفية ويندوز
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    names = read_names(a.config)
    if Text(names[0], W_AR).dots_short:
        print(f"تنبيه: في «{names[0]}» حرف ما انفصلت نقاطه (جاره قريب)، فبقت بمسافة الخط الأصلية. web-brand يراجع الشعار.")
    files, sizes = build(names)  # يبني كل شي قبل الكتابة: لو وقف، ما يترك مجلد فاضي ولا ملفات ناقصة
    print(f"الاسم: {names[0]} — {names[1]}")
    os.makedirs(a.out, exist_ok=True)
    for name, content in files.items():
        with open(os.path.join(a.out, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        vb = re.search(r'viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^"]+)"', content)
        print(f"{name}: {vb.group(1)}x{vb.group(2)}, {len(content.encode('utf-8'))} bytes")
    print("أصغر حجم (ارتفاع × عرض):")
    print(f"  الرمز lamsatap-icon*: الشاشة {SYM_MIN_PX}px، الطباعة {SYM_MIN_MM}mm")
    for label, m in sizes.items():
        print(f"  {label}: الشاشة {m['px']}×{m['px_w']}px، الطباعة {m['mm']}×{m['mm_w']}mm")


if __name__ == "__main__":
    main()
