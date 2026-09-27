"""يبني كل ملفات شعار «لمسة تاب — LamsaTap» (GM-026، الرمز brand-3 «الحادّ»، web-art-director.md «قرار الشعار»).

الرمز مسار ثابت في ملف مصدر واحد: brand/src/lamsatap-mark.svg (لوح 512: مسار السطح id="surface" ومسار النقطة
id="dot"، تعبئة بس، أوامر مطلقة). أي تعديل على الرمز يصير هناك، والسكربت ما يرسم الرمز من عنده.
الاسم «لمسة تاب — LamsaTap» (GM-012) ينقرى من website/config.js (companyName و companyNameEn)، والحروف مسارات
من خط Readex Pro (OFL)، مدموجة بـ skia-pathops: مسار واحد نظيف لكل لون، بدون تداخل (مهندس NFC بند 6).

التشغيل من جذر المشروع:  python brand/src/build_logo.py && python brand/src/export_png.py
للتجربة في مجلد ثاني:     --config <config.js> --mark <lamsatap-mark.svg> --out <مجلد>
معاينة بدون skia-pathops:  --preview --out <مجلد برّا brand/logo>  (نفس التركيب بالضبط، بس الحروف مو مدموجة: تبان
                           صح في المتصفح، وما تصلح للحفر ولا للتسليم، وما تنكتب في brand/logo أبداً)
يحتاج: fonttools و uharfbuzz، و skia-pathops للتسليم (pip install skia-pathops، بإذن صاحب المشروع).
الناتج: كل الملفات، و MANIFEST.txt فيه رقم الإصدار وبصمة SHA-256 لكل ملف (النسخة المجمّدة، loyer ق7).
"""
import argparse
import hashlib
import html
import math
import os
import re
import sys

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen, RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

try:
    import pathops
except ImportError:
    pathops = None


def _root():
    """جذر المشروع: أول مجلد فوق السكربت فيه brand/fonts/source."""
    d = os.path.dirname(os.path.abspath(__file__))
    while not os.path.isdir(os.path.join(d, "brand", "fonts", "source")):
        if os.path.dirname(d) == d:
            raise SystemExit("ما لقيت جذر المشروع (brand/fonts/source)")
        d = os.path.dirname(d)
    return d


ROOT = _root()
VF = os.path.join(ROOT, "brand", "fonts", "source", "ReadexPro[HEXP,wght].ttf")
OUT = os.path.join(ROOT, "brand", "logo")
CONFIG = os.path.join(ROOT, "website", "config.js")
MARK = os.path.join(ROOT, "brand", "src", "lamsatap-mark.svg")
VERSION = "1.0.0"
FALLBACK_EN = "LamsaTap"
PREVIEW = False  # --preview: الحروف بدون دمج (بدون skia-pathops)

# الألوان (GM-020 و16.4): الشعار كله بدون تيل. الحبر، والفاتح للداكن، والزعفران للنقطة بكود واحد.
INK, LIGHT, WHITE, BLACK, SAFFRON = "#14201F", "#ECF2F0", "#FFFFFF", "#000000", "#F2A93B"
STYLES = {  # اسم النسخة: (لون السطح والاسم، لون النقطة)
    "": (INK, SAFFRON),             # على الفاتح
    "-dark": (LIGHT, SAFFRON),      # على الداكن
    "-mono": (BLACK, BLACK),        # لون واحد أسود: حفر وختم وطباعة أبيض وأسود (موجب، بدون خلفية)
    "-mono-white": (WHITE, WHITE),  # لون واحد أبيض: على مادة غامقة، أو فوق مساحة تيل (16.4)
}

# الاسم (16.5): وحدات الخط العربي، em = 1000
W_AR, W_EN = 600, 500
SPACE_ADV = 250      # مسافة الكلمتين (الخط يعطي 306)
PAIR = {}            # ضبط يدوي بين حرفين: {(اسم يسار، اسم يمين): إضافة}
EN_TRACK = 12        # تباعد حروف LamsaTap (وحدات الخط اللاتيني)
LINE_GAP = 210       # من خط قاعدة العربي لأعلى حروف LamsaTap الكبيرة
CAP_EN = 700.0       # ارتفاع الحرف اللاتيني الكبير في Readex Pro
E = 100.0            # em العربي بوحدات الملف
GAP_H, GAP_V, MARK_V = 0.3, 0.35, 1.3   # المسافة للأفقي والعمودي (×h)، وحجم الرمز في العمودي (×h)
CLEAR = 0.5          # المساحة الفارغة (×h)، تنقاس من حافة الحبر، ويمين القفل من حافة النقطة (قبل التجميد 3)

# صورة الحساب (16.4 والتسويق بند 6): مربع حبر، والرمز داخل دائرة 80% في النص
AVATAR_SCALE = 0.8   # لوح الرمز 512 ← 80% من الصورة
AVATAR_SHIFT = 0.0   # إزاحة لليمين بوحدات الصورة (512)، للتوازن البصري (قبل التجميد 2)
# احتياط favicon.ico و PNG 32: دائرة حبر، والرمز بمقياس 6/7 عشان أعلاه وأسفله يطيحون على حدود البكسل
# في 16 و32 و48px (160 و352 من 512 = مضاعفات 32)، فحافة النقطة العليا حادة (قبل التجميد 1)
ICO_SCALE = 6 / 7

MIN_CAP_PX = 7       # أصغر حجم على الشاشة: الحرف اللاتيني الكبير ≥ 7px


def num(v, nd=2):
    s = f"{v:.{nd}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "", "-") else s


# ---------- الاسم من config.js ----------

def strip_js_comments(src):
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

    def field(key):
        ms = list(re.finditer(r"[\"']?\b" + key + r"\b[\"']?\s*:\s*([\"'`])((?:\\.|(?!\1).)*)\1", src))
        return re.sub(r"\\(.)", r"\1", ms[-1].group(2)).strip() if ms else ""

    ar, en = field("companyName"), field("companyNameEn")
    if not ar:
        raise SystemExit(f"ما لقيت companyName في {path}")
    if not en:
        print(f"تنبيه: companyNameEn ناقص في {path}، استخدمت {FALLBACK_EN}")
        en = FALLBACK_EN
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
    return [(order[i.codepoint], p.x_advance, p.x_offset, p.y_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def glyph_top(name, w):
    gs = instance(w).getGlyphSet()
    b = BoundsPen(gs)
    gs[name].draw(b)
    return b.bounds[3]


class Ink:
    """مسار حروف: مدموج بـ skia-pathops للتسليم، أو مسجّل كما هو في المعاينة (--preview)."""

    def __init__(self, rec=None):
        self.rec = rec if rec is not None else RecordingPen()

    def glyph_pen(self, gs):
        return DecomposingRecordingPen(gs)

    def add(self, other):
        self.rec.value.extend(other.rec.value)

    def union(self):
        if PREVIEW:
            return self
        p = pathops.Path()
        self.rec.replay(p.getPen())
        p.simplify(fix_winding=True)
        out = RecordingPen()
        p.draw(out)
        return Ink(out)

    def moved(self, dx, dy):
        out = RecordingPen()
        self.rec.replay(TransformPen(out, (1, 0, 0, 1, dx, dy)))
        return Ink(out)

    @property
    def bounds(self):
        b = BoundsPen(None)
        self.rec.replay(b)
        return b.bounds

    def d(self, nd=2):
        pen = SVGPathPen(None, ntos=lambda v: num(v, nd))
        self.rec.replay(pen)
        return pen.getCommands()


def text_run(text, weight, scale, tracking=0.0, space=None):
    """سطر نص، حافة حبره اليمنى عند x=0 وخط قاعدته y=0 (SVG: y لتحت)."""
    gs = instance(weight).getGlyphSet()
    ink = Ink()
    glyphs = shape(text, weight)
    cur = 0.0
    for i, (name, adv, xo, yo) in enumerate(glyphs):
        if name == "space":
            cur += space if space is not None else adv
            continue
        pen = DecomposingRecordingPen(gs)
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, (cur + xo) * scale, -yo * scale)))
        ink.rec.value.extend(pen.value)
        cur += adv + tracking
        if i + 1 < len(glyphs):
            cur += PAIR.get((name, glyphs[i + 1][0]), 0)
    ink = ink.union()
    return ink.moved(-ink.bounds[2], 0)


class Name:
    """كتلة الاسم: العربي فوق، واللاتيني تحته محاذي لبدايته (يمين). الإحداثيات: حافة الحبر اليمنى x=0،
    وخط قاعدة العربي y=0."""

    def __init__(self, names, latin=True):
        s_ar = E / 1000
        tooth = glyph_top("uni0633.medi", W_AR)   # أسنان «سـ» الوسطية
        lam = glyph_top("uni0644.init", W_AR)     # أعلى «ل»
        s_en = s_ar * tooth / CAP_EN              # الحرف اللاتيني الكبير = أسنان «مسـ» (16.5)
        self.ar = text_run(names[0], W_AR, s_ar, space=SPACE_ADV)
        self.lam_top = -lam * s_ar
        self.cap_px = tooth * s_ar
        if latin:
            base = (LINE_GAP + tooth) * s_ar
            self.en = text_run(names[1], W_EN, s_en, tracking=EN_TRACK).moved(0, base)
            self.bottom = base
        else:
            self.en, self.bottom = None, 0.0
        self.h = self.bottom - self.lam_top

    def ink(self):
        p = Ink()
        p.add(self.ar)
        if self.en is not None:
            p.add(self.en)
        return p.union()

    def bounds(self):
        bs = [self.ar.bounds] + ([self.en.bounds] if self.en is not None else [])
        return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)


# ---------- الرمز من ملف المصدر ----------

_TOK = re.compile(r"[MLHVACQZmlhvacqz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
_ARGS = {"M": 2, "L": 2, "H": 1, "V": 1, "A": 7, "C": 6, "Q": 4, "Z": 0}


def parse_d(d):
    toks, out, i, cmd = _TOK.findall(d), [], 0, None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            if t.islower():
                raise SystemExit(f"ملف الرمز فيه أمر نسبي «{t}»: خلّه كله مطلق")
            cmd, i = t, i + 1
            if cmd == "Z":
                out.append(("Z", []))
            continue
        n = _ARGS[cmd]
        out.append((cmd, [float(v) for v in toks[i:i + n]]))
        i += n
        if cmd == "M":
            cmd = "L"
    return out


def xform_d(cmds, k, ox, oy, nd=2):
    f = lambda v: num(v, nd)
    s = ""
    for c, a in cmds:
        if c in "ML":
            s += f"{c}{f(a[0] * k + ox)} {f(a[1] * k + oy)}"
        elif c == "H":
            s += f"H{f(a[0] * k + ox)}"
        elif c == "V":
            s += f"V{f(a[0] * k + oy)}"
        elif c == "A":
            s += f"A{f(a[0] * k)} {f(a[1] * k)} {f(a[2])} {int(a[3])} {int(a[4])} {f(a[5] * k + ox)} {f(a[6] * k + oy)}"
        elif c in "CQ":
            s += c + " ".join(f"{f(a[j] * k + ox)} {f(a[j + 1] * k + oy)}" for j in range(0, len(a), 2))
        else:
            s += "Z"
    return s


def arc_points(x0, y0, r, large, sweep, x1, y1, steps=64):
    """نقاط على قوس دائري (rx = ry، بدون دوران) من (x0, y0) لـ (x1, y1)، حسب ملاحظات تنفيذ SVG (F.6.5)."""
    dx, dy = (x0 - x1) / 2, (y0 - y1) / 2
    d2 = dx * dx + dy * dy
    r = max(r, math.sqrt(d2))
    f = math.sqrt(max(0.0, (r * r - d2) / d2)) if d2 else 0.0
    if large == sweep:
        f = -f
    cx, cy = f * dy + (x0 + x1) / 2, -f * dx + (y0 + y1) / 2
    a0, a1 = math.atan2(y0 - cy, x0 - cx), math.atan2(y1 - cy, x1 - cx)
    da = a1 - a0
    if sweep and da < 0:
        da += 2 * math.pi
    elif not sweep and da > 0:
        da -= 2 * math.pi
    return [(cx + r * math.cos(a0 + da * i / steps), cy + r * math.sin(a0 + da * i / steps)) for i in range(steps + 1)]


def outline(cmds):
    pts, cur = [], (0.0, 0.0)
    for c, a in cmds:
        if c in "ML":
            cur = (a[0], a[1])
            pts.append(cur)
        elif c == "H":
            cur = (a[0], cur[1])
            pts.append(cur)
        elif c == "V":
            cur = (cur[0], a[0])
            pts.append(cur)
        elif c == "A":
            if abs(a[0] - a[1]) > 1e-6 or a[2]:
                raise SystemExit("ملف الرمز: الأقواس لازم دائرية بدون دوران")
            pts += arc_points(cur[0], cur[1], a[0], int(a[3]), int(a[4]), a[5], a[6])
            cur = (a[5], a[6])
        elif c in "CQ":
            cur = (a[-2], a[-1])
            pts += [(a[j], a[j + 1]) for j in range(0, len(a), 2)]
    return pts


class Mark:
    """الرمز من ملف المصدر: مسار السطح ومسار النقطة (دائرة) على لوح 512."""

    def __init__(self, path):
        src = open(path, encoding="utf-8").read()
        vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
        if vb != [0, 0, 512, 512]:
            raise SystemExit('ملف الرمز لازم viewBox="0 0 512 512"')

        def get(i):
            m = (re.search(r'<path[^>]*\sid="' + i + r'"[^>]*\sd="([^"]+)"', src)
                 or re.search(r'<path[^>]*\sd="([^"]+)"[^>]*\sid="' + i + r'"', src))
            if not m:
                raise SystemExit(f'ملف الرمز لازم فيه مسار id="{i}"')
            return parse_d(m.group(1))
        self.surface, self.dot = get("surface"), get("dot")
        sp = outline(self.surface)
        self.top, self.bottom = min(y for _, y in sp), max(y for _, y in sp)
        self.left = min(x for x, _ in sp)
        # النقطة دائرة: M على طرفها اليسار، وقوس لطرفها اليمين
        (_, (mx, my)), (_, arc) = self.dot[0], self.dot[1]
        self.r = arc[0]
        self.cx, self.cy = (mx + arc[5]) / 2, my
        if abs(arc[6] - my) > 1e-6 or abs(arc[5] - mx - 2 * self.r) > 1e-6:
            raise SystemExit("ملف الرمز: مسار النقطة لازم دائرة (M على طرفها اليسار ثم قوسين)")
        # قبل التجميد 1: أعلى النقطة على خط أعلى السطح بالضبط
        self.dot_top = self.cy - self.r
        if abs(self.dot_top - self.top) > 0.01:
            raise SystemExit(f"المحاذاة: أعلى النقطة {self.dot_top:g} لازم يساوي أعلى السطح {self.top:g}")
        xs = [x for x, _ in sp] + [self.cx - self.r, self.cx + self.r]
        ys = [y for _, y in sp] + [self.cy - self.r, self.cy + self.r]
        self.bbox = (min(xs), min(ys), max(xs), max(ys))
        # مركز الكتلة (للتوازن البصري في صورة الحساب)
        a_s = abs(sum(sp[i - 1][0] * sp[i][1] - sp[i][0] * sp[i - 1][1] for i in range(len(sp)))) / 2
        cxs = sum((sp[i - 1][0] + sp[i][0]) * (sp[i - 1][0] * sp[i][1] - sp[i][0] * sp[i - 1][1]) for i in range(len(sp)))
        cys = sum((sp[i - 1][1] + sp[i][1]) * (sp[i - 1][0] * sp[i][1] - sp[i][0] * sp[i - 1][1]) for i in range(len(sp)))
        sgn = 1 if sum(sp[i - 1][0] * sp[i][1] - sp[i][0] * sp[i - 1][1] for i in range(len(sp))) > 0 else -1
        gx, gy = sgn * cxs / (6 * a_s), sgn * cys / (6 * a_s)
        a_d = math.pi * self.r ** 2
        self.mass = ((gx * a_s + self.cx * a_d) / (a_s + a_d), (gy * a_s + self.cy * a_d) / (a_s + a_d))

    def body(self, fg, dotc, k=1.0, ox=0.0, oy=0.0):
        s, d = xform_d(self.surface, k, ox, oy), xform_d(self.dot, k, ox, oy)
        if fg == dotc:
            return f'<path fill="{fg}" d="{s}{d}"/>'
        return f'<path fill="{fg}" d="{s}"/><path fill="{dotc}" d="{d}"/>'


# ---------- الملفات ----------

def svg_doc(names, box, body, extra=""):
    t = html.escape(f"{names[0]} — {names[1]}", quote=True)
    x, y, w, h = box
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x)} {num(y)} {num(w)} {num(h)}" width="{num(w)}" '
            f'height="{num(h)}" role="img" aria-label="{t}"><title>{t}</title>{extra}{body}</svg>\n')


def lockup_horizontal(mark, names, latin=True):
    nm = Name(names, latin)
    k = nm.h / (mark.bottom - mark.top)
    ox = GAP_H * nm.h - mark.left * k
    oy = nm.lam_top - mark.top * k
    x0, y0, x1, y1 = nm.bounds()
    bx0, by0, bx1, by1 = mark.bbox
    top = min(y0, by0 * k + oy)
    right = bx1 * k + ox       # حافة النقطة اليمنى = حافة الملف (قبل التجميد 3)
    return nm, k, ox, oy, (x0, top, right - x0, max(y1, by1 * k + oy) - top)


def lockup_vertical(mark, names):
    nm = Name(names, True)
    k = MARK_V * nm.h / (mark.bottom - mark.top)
    x0, y0, x1, y1 = nm.bounds()
    bx0, by0, bx1, by1 = mark.bbox
    ox = (x0 + x1) / 2 - (bx0 + bx1) / 2 * k
    oy = nm.lam_top - GAP_V * nm.h - mark.bottom * k
    X0, X1 = min(x0, bx0 * k + ox), max(x1, bx1 * k + ox)
    Y0 = by0 * k + oy
    return nm, k, ox, oy, (X0, Y0, X1 - X0, y1 - Y0)


def lock_body(mark, nm, k, ox, oy, fg, dotc):
    s = xform_d(mark.surface, k, ox, oy)
    d = xform_d(mark.dot, k, ox, oy)
    t = nm.ink().d()
    if fg == dotc:
        return f'<path fill="{fg}" d="{s}{t}{d}"/>'
    return f'<path fill="{fg}" d="{s}{t}"/><path fill="{dotc}" d="{d}"/>'


def framed(mark, scale, shift_x=0.0, snap=False):
    """(k, ox, oy) لوضع الرمز داخل لوح 512: مقياس scale حول المركز، مع إزاحة لليمين. snap: أعلى السطح يبقى
    على نفس خطه (مضاعف 32) عشان الحواف الأفقية تطيح على حدود البكسل في 16 و32 و48px."""
    bx0, by0, bx1, by1 = mark.bbox
    ox = 256 - (bx0 + bx1) / 2 * scale + shift_x
    oy = mark.top - mark.top * scale if snap else 256 - (by0 + by1) / 2 * scale
    return scale, ox, oy


def build(names, mark):
    files, notes = {}, {}
    icon = (0, 0, 512, 512)
    for sfx, (fg, dc) in STYLES.items():
        files[f"lamsatap-icon{sfx}.svg"] = svg_doc(names, icon, mark.body(fg, dc))
    # على الحبر (صورة الحساب، وملف فحص التباين في check_logo.py): سطح أبيض ونقطة
    files["lamsatap-icon-onink.svg"] = svg_doc(names, icon, mark.body(WHITE, SAFFRON))
    # favicon بدون خلفية ويتكيف (16.4): فاتح = سطح حبر، داكن = #ECF2F0، والنقطة زعفران بالوضعين
    files["lamsatap-favicon.svg"] = svg_doc(names, icon, (
        f'<path class="s" fill="{INK}" d="{xform_d(mark.surface, 1, 0, 0)}"/>'
        f'<path fill="{SAFFRON}" d="{xform_d(mark.dot, 1, 0, 0)}"/>'),
        extra=f'<style>@media (prefers-color-scheme:dark){{.s{{fill:{LIGHT}}}}}</style>')
    # صورة الحساب: مربع حبر مصمت (1080 و512 و180 PNG)، والرمز داخل دائرة 80%
    k, ox, oy = framed(mark, AVATAR_SCALE, AVATAR_SHIFT)
    files["lamsatap-avatar.svg"] = svg_doc(names, icon, f'<rect width="512" height="512" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, k, ox, oy))
    notes["avatar"] = dict(k=k, ox=ox, oy=oy)
    # احتياط favicon.ico و PNG 32: دائرة حبر، تبان على التبويب الفاتح والداكن، والحواف على حدود البكسل
    k, ox, oy = framed(mark, ICO_SCALE, AVATAR_SHIFT * ICO_SCALE / AVATAR_SCALE, snap=True)
    files["lamsatap-icon-circle.svg"] = svg_doc(names, icon, f'<circle cx="256" cy="256" r="256" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, k, ox, oy))
    notes["circle"] = dict(k=k, ox=ox, oy=oy)
    # الأقفال
    hz = lockup_horizontal(mark, names)
    ar = lockup_horizontal(mark, names, latin=False)
    vt = lockup_vertical(mark, names)
    for base, (nm, kk, ox, oy, box) in (("lamsatap-horizontal", hz), ("lamsatap-horizontal-ar", ar), ("lamsatap-logo", vt)):
        for sfx, (fg, dc) in STYLES.items():
            files[f"{base}{sfx}.svg"] = svg_doc(names, box, lock_body(mark, nm, kk, ox, oy, fg, dc))
        dot_right = (mark.cx + mark.r) * kk + ox
        dot_top = (mark.cy - mark.r) * kk + oy
        surf_top = mark.top * kk + oy
        notes[base] = dict(box=box, h=nm.h, cap=nm.cap_px if nm.en is not None else None, k=kk, ox=ox, oy=oy,
                           dot_right=dot_right, surf_h=(mark.bottom - mark.top) * kk, dot_top=dot_top, surf_top=surf_top)
    return files, notes


def main():
    global PREVIEW
    ap = argparse.ArgumentParser(description="يبني ملفات الشعار: الرمز من lamsatap-mark.svg، والاسم من config.js")
    ap.add_argument("--config", default=CONFIG)
    ap.add_argument("--mark", default=MARK)
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--preview", action="store_true", help="بدون skia-pathops: الحروف مو مدموجة، ومو للتسليم")
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    out = os.path.abspath(a.out)
    PREVIEW = a.preview
    if PREVIEW and os.path.normcase(out).startswith(os.path.normcase(OUT)):
        raise SystemExit("المعاينة ما تنكتب في brand/logo")
    if not PREVIEW and pathops is None:
        raise SystemExit("يحتاج skia-pathops عشان يدمج الحروف (pip install skia-pathops، بإذن صاحب المشروع). للمعاينة: --preview --out <مجلد>")
    names = read_names(a.config)
    mark = Mark(a.mark)
    files, notes = build(names, mark)   # يبني كل شي قبل الكتابة
    os.makedirs(out, exist_ok=True)
    tag = "  (معاينة: الحروف مو مدموجة، مو للتسليم)" if PREVIEW else ""
    print(f"الاسم: {names[0]} — {names[1]}   الإصدار {VERSION}{tag}")
    print(f"المحاذاة: أعلى النقطة {mark.dot_top:g} = أعلى السطح {mark.top:g} (من 512)")
    for name, content in files.items():
        with open(os.path.join(out, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        vb = re.search(r'viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^"]+)"', content)
        print(f"{name}: {vb.group(1)}x{vb.group(2)}, {len(content.encode('utf-8'))} bytes")
    print("الأقفال: المساحة الفارغة 0.5h من حافة الحبر، ويمين القفل من حافة النقطة:")
    for base in ("lamsatap-horizontal", "lamsatap-horizontal-ar", "lamsatap-logo"):
        n = notes[base]
        x, y, w, h = n["box"]
        assert abs((x + w) - n["dot_right"]) < 0.01 or base == "lamsatap-logo", base
        assert abs(n["dot_top"] - n["surf_top"]) < 0.01, base
        line = f"  {base}: h = {n['h']:.2f}، المساحة {CLEAR * n['h']:.2f} (= {CLEAR * n['h'] / h:.3f} من ارتفاع الملف)"
        if n["cap"]:
            hp = math.ceil(MIN_CAP_PX * h / n["cap"])
            line += f"، أصغر شاشة: ارتفاع {hp}px × {math.ceil(hp * w / h)}px"
        print(line)
    write_manifest(out, PREVIEW)


def write_manifest(out, preview=False):
    """النسخة المجمّدة: رقم الإصدار وبصمة SHA-256 لكل ملف في المجلد (يعيد الحساب بعد export_png.py كمان)."""
    rows = []
    for root, _, fs in os.walk(out):
        for f in sorted(fs):
            if f == "MANIFEST.txt":
                continue
            p = os.path.join(root, f)
            rel = os.path.relpath(p, out).replace(os.sep, "/")
            rows.append(f"{hashlib.sha256(open(p, 'rb').read()).hexdigest()}  {rel}")
    head = (f"# لمسة تاب — LamsaTap: ملفات الشعار، الإصدار {VERSION}\n"
            + ("# معاينة بدون دمج الحروف: مو النسخة المجمّدة، ولا تنودع ولا تنطبع.\n" if preview else
               "# النسخة المجمّدة (loyer ق7): أي تعديل على أي ملف هنا = إصدار جديد، ويرجع لـ loyer قبل الإيداع.\n")
            + "# الفحص: sha256sum -c MANIFEST.txt (من داخل المجلد)\n")
    with open(os.path.join(out, "MANIFEST.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(head + "\n".join(sorted(rows, key=lambda r: r.split("  ", 1)[1])) + "\n")
    print(f"MANIFEST.txt: {len(rows)} ملف، الإصدار {VERSION}" + (" (معاينة)" if preview else ""))


if __name__ == "__main__":
    main()
