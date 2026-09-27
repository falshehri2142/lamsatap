"""يبني كل ملفات شعار «لمسة تاب — LamsaTap» (GM-026، اتجاه «الميلان» في web-art-director.md القسم 16).

الرمز مسار ثابت في ملف مصدر واحد: brand/src/lamsatap-mark.svg (شبكة 512: مسار السطح id="surface" ومسار النقطة id="dot"،
تعبئة بس، أوامر M L H V A C Q Z مطلقة). أي تعديل على الرمز يصير هناك، والسكربت ما يرسم الرمز من عنده.
الاسم «لمسة تاب — LamsaTap» (GM-012) ينقرى من website/config.js (companyName و companyNameEn)، والحروف مسارات
من خط Readex Pro (OFL)، مدموجة بـ skia-pathops (مسار واحد نظيف لكل لون، بدون تداخل).

التشغيل من جذر المشروع:  python brand/src/build_logo.py && python brand/src/export_png.py
للتجربة في مجلد ثاني:     --config <config.js> --mark <master.svg> --out <مجلد>
يحتاج: fonttools و uharfbuzz و skia-pathops (pip install skia-pathops).
الناتج: كل الملفات في brand/logo/، و MANIFEST.txt فيه رقم الإصدار وبصمة SHA-256 لكل ملف (النسخة المجمّدة، loyer ق7).
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
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

try:
    import pathops
except ImportError:
    raise SystemExit("يحتاج skia-pathops عشان يدمج الحروف:  pip install skia-pathops")

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

# الألوان (GM-020 و16.4): الشعار كله بدون تيل. الحبر، والفاتح للداكن، والزعفران للنقطة بكود واحد.
INK, LIGHT, WHITE, BLACK, SAFFRON = "#14201F", "#ECF2F0", "#FFFFFF", "#000000", "#F2A93B"
STYLES = {  # اسم النسخة: (لون السطح والاسم، لون النقطة)
    "": (INK, SAFFRON),            # على الفاتح
    "-dark": (LIGHT, SAFFRON),     # على الداكن
    "-mono": (BLACK, BLACK),       # لون واحد أسود: حفر وختم وطباعة أبيض وأسود (موجب، بدون خلفية)
    "-mono-white": (WHITE, WHITE),  # لون واحد أبيض: على مادة غامقة
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
AVATAR_FILL = 0.8    # صورة الحساب: الرمز (لوح 512) داخل دائرة 80% في النص (التسويق بند 6)

# أصغر حجم (الارتفاع): الحرف اللاتيني الكبير ≥ 7px على الشاشة، والحفر من قياس check_logo.py (web-qa)
MIN_CAP_PX = 7


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


def text_run(text, weight, scale, tracking=0.0, space=None):
    """سطر نص كمسار pathops مدموج، حافة حبره اليمنى عند x=0 وخط قاعدته y=0 (SVG: y لتحت)."""
    gs = instance(weight).getGlyphSet()
    path = pathops.Path()
    pen = path.getPen(glyphSet=gs)
    glyphs = shape(text, weight)
    cur = 0.0
    for i, (name, adv, xo, yo) in enumerate(glyphs):
        if name == "space":
            cur += space if space is not None else adv
            continue
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, (cur + xo) * scale, -yo * scale)))
        cur += adv + tracking
        if i + 1 < len(glyphs):
            cur += PAIR.get((name, glyphs[i + 1][0]), 0)
    path.simplify(fix_winding=True)
    return moved(path, -path.bounds[2], 0)


def moved(path, dx, dy):
    p = pathops.Path()
    path.draw(TransformPen(p.getPen(), (1, 0, 0, 1, dx, dy)))
    return p


def path_d(path, nd=2):
    pen = SVGPathPen(None, ntos=lambda v: num(v, nd))
    path.draw(pen)
    return pen.getCommands()


class Name:
    """كتلة الاسم: العربي فوق، واللاتيني تحته محاذي لبدايته (يمين). الإحداثيات: حافة الحبر اليمنى x=0،
    وخط قاعدة العربي y=0."""

    def __init__(self, names, latin=True):
        s_ar = E / 1000
        tooth = glyph_top("uni0633.medi", W_AR)   # أسنان «سـ» الوسطية
        lam = glyph_top("uni0644.init", W_AR)                                           # أعلى «ل»
        s_en = s_ar * tooth / CAP_EN     # الحرف اللاتيني الكبير = أسنان «مسـ» (16.5)
        self.ar = text_run(names[0], W_AR, s_ar, space=SPACE_ADV)
        self.lam_top = -lam * s_ar
        self.cap_px = tooth * s_ar       # ارتفاع الحرف اللاتيني الكبير بوحدات الملف
        if latin:
            base = (LINE_GAP + tooth) * s_ar
            self.en = moved(text_run(names[1], W_EN, s_en, tracking=EN_TRACK), 0, base)
            self.bottom = base
        else:
            self.en, self.bottom = None, 0.0
        self.h = self.bottom - self.lam_top

    def ink(self):
        p = pathops.Path()
        self.ar.draw(p.getPen())
        if self.en is not None:
            self.en.draw(p.getPen())
        p.simplify(fix_winding=True)
        return p

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
            pts += [(a[j], a[j + 1]) for j in range(0, len(a), 2)]  # نقاط التحكم: حدود أوسع شوي، تكفي للتركيب
    return pts


class Mark:
    """الرمز من ملف المصدر: مسار السطح ومسار النقطة على لوح 512."""

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
        sp, dp = outline(self.surface), outline(self.dot)
        self.top, self.bottom = min(y for _, y in sp), max(y for _, y in sp)
        self.left = min(x for x, _ in sp)
        allp = sp + dp
        self.bbox = (min(x for x, _ in allp), min(y for _, y in allp), max(x for x, _ in allp), max(y for _, y in allp))

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
    box = (x0, min(y0, by0 * k + oy), bx1 * k + ox - x0, max(y1, by1 * k + oy) - min(y0, by0 * k + oy))
    return nm, k, ox, oy, box


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
    t = path_d(nm.ink())
    if fg == dotc:
        return f'<path fill="{fg}" d="{s}{t}{d}"/>'
    return f'<path fill="{fg}" d="{s}{t}"/><path fill="{dotc}" d="{d}"/>'


def build(names, mark):
    files, notes = {}, {}
    icon = (0, 0, 512, 512)
    for sfx, (fg, dc) in STYLES.items():
        files[f"lamsatap-icon{sfx}.svg"] = svg_doc(names, icon, mark.body(fg, dc))
    # على الحبر (صورة الحساب وملف فحص التباين): سطح أبيض ونقطة
    files["lamsatap-icon-onink.svg"] = svg_doc(names, icon, mark.body(WHITE, SAFFRON))
    # favicon بدون خلفية ويتكيف (16.4)
    files["lamsatap-favicon.svg"] = svg_doc(names, icon, (
        f'<path class="s" fill="{INK}" d="{xform_d(mark.surface, 1, 0, 0)}"/>'
        f'<path fill="{SAFFRON}" d="{xform_d(mark.dot, 1, 0, 0)}"/>'),
        extra=f'<style>@media (prefers-color-scheme:dark){{.s{{fill:{LIGHT}}}}}</style>')
    # صورة الحساب: مربع حبر مصمت، والرمز داخل دائرة 80% (للـ PNG 1080 و512)
    k = AVATAR_FILL
    o = (512 - 512 * k) / 2
    files["lamsatap-avatar.svg"] = svg_doc(names, icon, f'<rect width="512" height="512" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, k, o, o))
    # احتياط favicon.ico و PNG 32 (المتصفحات اللي ما تقرا SVG): دائرة حبر، تبان على التبويب الفاتح والداكن
    files["lamsatap-icon-circle.svg"] = svg_doc(names, icon, f'<circle cx="256" cy="256" r="256" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, k, o, o))
    # الأقفال
    hz = lockup_horizontal(mark, names)
    ar = lockup_horizontal(mark, names, latin=False)
    vt = lockup_vertical(mark, names)
    for base, (nm, kk, ox, oy, box) in (("lamsatap-horizontal", hz), ("lamsatap-horizontal-ar", ar), ("lamsatap-logo", vt)):
        for sfx, (fg, dc) in STYLES.items():
            files[f"{base}{sfx}.svg"] = svg_doc(names, box, lock_body(mark, nm, kk, ox, oy, fg, dc))
        cap = nm.cap_px if nm.en is not None else None
        notes[base] = dict(box=box, h=nm.h, cap=cap)
    return files, notes


def main():
    ap = argparse.ArgumentParser(description="يبني ملفات الشعار: الرمز من lamsatap-mark.svg، والاسم من config.js")
    ap.add_argument("--config", default=CONFIG)
    ap.add_argument("--mark", default=MARK)
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    names = read_names(a.config)
    mark = Mark(a.mark)
    files, notes = build(names, mark)   # يبني كل شي قبل الكتابة
    os.makedirs(a.out, exist_ok=True)
    print(f"الاسم: {names[0]} — {names[1]}   الإصدار {VERSION}")
    for name, content in files.items():
        with open(os.path.join(a.out, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        vb = re.search(r'viewBox="[^ ]+ [^ ]+ ([^ ]+) ([^"]+)"', content)
        print(f"{name}: {vb.group(1)}x{vb.group(2)}, {len(content.encode('utf-8'))} bytes")
    print("أصغر حجم على الشاشة (الحرف اللاتيني الكبير ≥ 7px):")
    for base, n in notes.items():
        x, y, w, h = n["box"]
        if n["cap"]:
            hp = math.ceil(MIN_CAP_PX * h / n["cap"])
            print(f"  {base}: ارتفاع {hp}px × عرض {math.ceil(hp * w / h)}px")
    write_manifest(a.out)


def write_manifest(out):
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
            "# النسخة المجمّدة (loyer ق7): أي تعديل على أي ملف هنا = إصدار جديد، ويرجع لـ loyer قبل الإيداع.\n"
            "# الفحص: sha256sum -c MANIFEST.txt (من داخل المجلد)\n")
    with open(os.path.join(out, "MANIFEST.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(head + "\n".join(sorted(rows, key=lambda r: r.split("  ", 1)[1])) + "\n")
    print(f"MANIFEST.txt: {len(rows)} ملف، الإصدار {VERSION}")


if __name__ == "__main__":
    main()
