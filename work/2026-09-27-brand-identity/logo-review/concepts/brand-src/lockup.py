"""تركيب الاسم مع رمز «الميلان» (اتجاه المدير الفني 16.5).

- «لمسة تاب»: Readex Pro 600 مسارات، بالحبر، ونقاط حروفه بالحبر (نقطة الزعفران الوحيدة في الرمز).
- «LamsaTap»: Readex Pro 500، ارتفاع حروفه الكبيرة = ارتفاع أسنان «مسـ»، تحت العربي ومحاذي لبدايته (يمين).
- الأفقي: ارتفاع السطح h = من أعلى «ل» لخط قاعدة LamsaTap، والمسافة بين السطح والاسم 0.3h.
- العربي بس: h = من أعلى «ل» لخط قاعدة العربي. العمودي: الرمز فوق في النص، والمسافة 0.35h.
الحروف تنرسم من الخط، وتندمج بـ skia-pathops (union) عشان يطلع مسار واحد نظيف لكل لون.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
sys.path.insert(0, str(ROOT / "brand" / "src"))
import build_logo as bl  # noqa: E402  (قراءة بس: الاسم من config.js، وتشكيل الحروف)

try:
    import pathops  # noqa: E402
except ImportError:  # pragma: no cover
    raise SystemExit("يحتاج skia-pathops:  pip install skia-pathops")
from fontTools.pens.svgPathPen import SVGPathPen  # noqa: E402
from fontTools.pens.transformPen import TransformPen  # noqa: E402

from geometry import num  # noqa: E402

W_AR, W_EN = 600, 500
TOOTH = None  # ارتفاع أسنان «سـ» الوسطية (وحدات الخط)، ينحسب أول مرة
LAM_TOP = None
CAP_EN = 700.0

# ضبط يدوي للمسافات (وحدات الخط العربي، em = 1000). المفتاح اسم الحرف في الخط.
SPACE_ADV = 250        # مسافة الكلمتين (الخط يعطي 306)
BA_ALEF = 0            # إضافة بين «ب» و«ا» في «تاب» (بالموجب يبعد)
EN_TRACK = 12          # تباعد حروف LamsaTap (وحدات الخط اللاتيني)
LINE_GAP = 210         # من خط قاعدة العربي لأعلى حروف LamsaTap الكبيرة (وحدات العربي)


def _metrics():
    global TOOTH, LAM_TOP
    if TOOTH is None:
        from fontTools.pens.boundsPen import BoundsPen
        gs = bl.instance(W_AR).getGlyphSet()
        b = BoundsPen(gs)
        gs["uni0633.medi"].draw(b)
        TOOTH = b.bounds[3]
        b = BoundsPen(gs)
        gs["uni0644.init"].draw(b)
        LAM_TOP = b.bounds[3]
    return TOOTH, LAM_TOP


def run(text, weight, scale, x, baseline, tracking=0.0, space=None, pair=None):
    """يرسم سطر نص كمسار pathops مدموج. x = بداية الـ advance من اليسار، baseline بإحداثيات SVG (y لتحت).
    space: عرض المسافة (وحدات الخط). pair: {(اسم يسار، اسم يمين): إضافة}."""
    gs = bl.instance(weight).getGlyphSet()
    path = pathops.Path()
    pen = path.getPen(glyphSet=gs)
    glyphs = bl.shape(text, weight)
    cur = 0.0
    for i, (name, adv, xo, yo) in enumerate(glyphs):
        if name == "space":
            cur += space if space is not None else adv
            continue
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x + (cur + xo) * scale, baseline - yo * scale)))
        cur += adv + tracking
        if pair and i + 1 < len(glyphs):
            cur += pair.get((name, glyphs[i + 1][0]), 0)
    path.simplify(fix_winding=True, keep_starting_points=False)
    return path


def path_d(path, nd=2):
    pen = SVGPathPen(None, ntos=lambda v: num(v, nd))
    path.draw(pen)
    return pen.getCommands()


def shift(path, dx, dy):
    p = pathops.Path()
    path.draw(TransformPen(p.getPen(), (1, 0, 0, 1, dx, dy)))
    return p


class Name:
    """كتلة الاسم (عربي فوق، ولاتيني تحته محاذي لليمين) بمقياس em العربي = E."""

    def __init__(self, names, E=100.0, latin=True):
        tooth, lam = _metrics()
        self.E, self.latin = E, latin
        s_ar = E / 1000.0
        s_en = s_ar * tooth / CAP_EN
        self.s_ar, self.s_en = s_ar, s_en
        ar = run(names[0], W_AR, s_ar, 0, 0, space=SPACE_ADV, pair={("uni0628", "uni0627.fina"): BA_ALEF})
        x0, y0, x1, y1 = ar.bounds
        # العربي: الحافة اليمنى للحبر عند x=0، وخط القاعدة y=0 (أعلى «ل» عند -lam*s_ar)
        self.ar = shift(ar, -x1, 0)
        self.lam_top = -lam * s_ar
        self.ar_bounds = self.ar.bounds
        if latin:
            en = run(names[1], W_EN, s_en, 0, 0, tracking=EN_TRACK)
            ex0, ey0, ex1, ey1 = en.bounds
            base_en = LINE_GAP * s_ar + tooth * s_ar  # أعلى الحرف الكبير = LINE_GAP تحت خط العربي
            self.en = shift(en, -ex1, base_en)
            self.base_en = base_en
            self.bottom_line = base_en        # خط قاعدة اللاتيني = أسفل السطح
        else:
            self.en = None
            self.bottom_line = 0.0
        self.h = self.bottom_line - self.lam_top

    def bounds(self):
        bs = [self.ar.bounds] + ([self.en.bounds] if self.en is not None else [])
        return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))

    def ink(self, dx=0.0, dy=0.0):
        p = shift(self.ar, dx, dy)
        if self.en is not None:
            q = shift(self.en, dx, dy)
            p.addPath(q)
            p.simplify(fix_winding=True)
        return p

    def latin_box(self, dx=0.0, dy=0.0):
        if self.en is None:
            return None
        x0, y0, x1, y1 = self.en.bounds
        return (x0 + dx, y0 + dy, x1 + dx, y1 + dy)


def mark_paths(lean, k, ox, oy):
    """(السطح، النقطة) بمقياس k (px لكل وحدة 512) وإزاحة، بدون transform داخل الملف."""
    return lean.surface_d(k, ox, oy), lean.dot_d(k, ox, oy)


def horizontal(lean, names, E=100.0, latin=True, gap_k=0.3):
    """القفل الأفقي: [الاسم] [السطح] [النقطة]. يرجع dict فيه الأبعاد والمسارات."""
    nm = Name(names, E, latin)
    h = nm.h
    m = lean.metrics()
    k = h / (lean.B - lean.T)
    # السطح: أعلاه عند أعلى «ل»، وأقصى يساره بعد الاسم بـ gap_k*h
    name_right = 0.0
    ox = name_right + gap_k * h - m["left"] * k
    oy = nm.lam_top - lean.T * k
    surf, dot = mark_paths(lean, k, ox, oy)
    nb = nm.bounds()
    x0 = nb[0]
    x1 = (lean.dot[0] + lean.dot[2]) * k + ox
    y0 = min(nb[1], nm.lam_top)
    y1 = max(nb[3], lean.B * k + oy)
    return dict(name=nm, h=h, k=k, ox=ox, oy=oy, surface=surf, dot=dot, text=nm.ink(),
                box=(x0, y0, x1 - x0, y1 - y0), latin_box=nm.latin_box())


def vertical(lean, names, E=100.0, gap_k=0.35, mark_k=1.0):
    """القفل العمودي: الرمز فوق في النص، والاسم تحته. mark_k = ارتفاع السطح ÷ h."""
    nm = Name(names, E, True)
    h = nm.h
    k = mark_k * h / (lean.B - lean.T)
    m = lean.metrics()
    nb = nm.bounds()
    name_cx = (nb[0] + nb[2]) / 2
    bx0, by0, bx1, by1 = m["bbox"]
    ox = name_cx - (bx0 + bx1) / 2 * k
    # أسفل السطح فوق أعلى «ل» بـ gap_k*h
    oy = nm.lam_top - gap_k * h - lean.B * k
    surf, dot = mark_paths(lean, k, ox, oy)
    x0 = min(nb[0], bx0 * k + ox)
    x1 = max(nb[2], bx1 * k + ox)
    y0 = by0 * k + oy
    y1 = nb[3]
    return dict(name=nm, h=h, k=k, ox=ox, oy=oy, surface=surf, dot=dot, text=nm.ink(),
                box=(x0, y0, x1 - x0, y1 - y0), latin_box=nm.latin_box())
