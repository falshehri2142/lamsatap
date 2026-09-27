"""يبني رسمة البطل brand/illustrations/tap-hero.svg: جوال يلمس ستاند لمسة تاب، ونقطة الستاند تنزل على صفحة المنيو اللي انفتحت.

الرمز على الستاند هو نفس رمز الشعار بالضبط (من build_logo.py)، فلو تغير الرمز تتغير الرسمة معه.
لحظة اللمس: الجوال يلمس طرف الستاند، والنقطة الزعفرانية تطلع من نقطة الرمز على خط مستقيم وتكبر لين
تنزل على رأس الصفحة في الجوال (وصول، مو انتظار). لا حلقة ولا أقواس (تشبه EMVCo أو الواي فاي)،
والنقاط والجوال برّا المساحة الفارغة حول الرمز (ربع المربع).
الألوان من tokens.css: var(--lt-*) لو الرسمة داخل الصفحة، وقيم احتياطية فاتح وداكن لو انفتحت كملف <img>.

التشغيل من جذر المشروع:  python brand/src/build_illustration.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from build_logo import ROOT, num, symbol, symbol_geometry  # noqa: E402
except ImportError:  # الشعار الجديد 1.0.0 (GM-026) ما فيه رمز «ب»
    raise SystemExit("هذي الرسمة القديمة مبنية على رمز «ب» المرفوض (GM-022)، ومولّدها وقف مع الشعار الجديد 1.0.0. "
                     "الملف tap-hero.svg باقي زي ما هو، والبديل رسومات web-illustrator (website/assets/illustrations/).")

OUT = os.path.join(ROOT, "brand", "illustrations", "tap-hero.svg")
TITLE = "جوال يلمس الستاند، ونقطة الستاند تنزل على صفحة المنيو اللي انفتحت في الجوال"

# (الصنف، الفاتح، الداكن، الخاصية، المتغير)
PAINT = [
    ("th-ln", "#14201F", "#ECF2F0", "stroke", "--lt-text"),
    ("th-sf", "#FFFFFF", "#152120", "fill", "--lt-surface"),
    ("th-tx", "#14201F", "#ECF2F0", "fill", "--lt-text"),
    ("th-mu", "#56625F", "#A3B2AE", "fill", "--lt-muted"),
    ("th-so", "#E3F3F1", "#123A37", "fill", "--lt-primary-soft"),
    ("th-pr", "#0B7A75", "#3FC1B6", "fill", "--lt-primary"),
    ("th-ps", "#0B7A75", "#3FC1B6", "stroke", "--lt-primary"),
    ("th-ct", "#075E5A", "#6AD6CC", "fill", "--lt-primary-strong"),
    ("th-on", "#FFFFFF", "#062522", "fill", "--lt-on-primary"),
    ("th-dt", "#F2A93B", "#F5B85A", "fill", "--lt-accent"),
    ("th-tb", "#E4DCD0", "#2A3B38", "stroke", "--lt-border"),
]

# الستاند (لوح وقاعدة) والرمز عليه
PANEL = (300, 440, 110, 318, 16)       # x0, x1, فوق, تحت, زاوية
TILE = 72                               # مقاس الرمز على الستاند
TILE_Y = 134
# الجوال: المقاس المحلي، المركز، الميلان باتجاه الستاند
PH_W, PH_H, PH_C, PH_ANGLE = 128, 232, (235, 195), 10
LAND = (30, 44)                          # مكان نزول النقطة على رأس الصفحة (إحداثيات الجوال)
DOT_R = (4.5, 6, 8)                      # النقاط: تكبر لين توصل


def style():
    light = "".join(f".{c}{{{p}:var({v},{l})}}" for c, l, d, p, v in PAINT)
    dark = "".join(f".{c}{{{p}:var({v},{d})}}" for c, l, d, p, v in PAINT)
    return (f"<style>{light}.th-ln{{fill:none;stroke-width:3;stroke-linejoin:round}}"
            f".th-ps{{fill:none;stroke-width:1.6;stroke-linecap:round}}"
            f".th-tb{{fill:none;stroke-width:6;stroke-linecap:round}}"
            f"@media (prefers-color-scheme:dark){{{dark}}}</style>")


def rect(x, y, w, h, r, cls):
    return f'<rect class="{cls}" x="{num(x)}" y="{num(y)}" width="{num(w)}" height="{num(h)}" rx="{num(r)}"/>'


def to_abs(p):
    """نقطة من إحداثيات الجوال المحلية إلى إحداثيات الرسمة."""
    a = math.radians(PH_ANGLE)
    x, y = p[0] - PH_W / 2, p[1] - PH_H / 2
    return PH_C[0] + x * math.cos(a) - y * math.sin(a), PH_C[1] + x * math.sin(a) + y * math.cos(a)


def cup(x, y):
    """فنجان صغير داخل صورة الصنف (منيو كافيه)."""
    return (rect(x + 4.5, y + 6, 8, 6.5, 2, "th-pr")
            + f'<path class="th-ps" d="M{num(x + 12.5)} {num(y + 7.5)}h1.5a1.8 1.8 0 0 1 0 3.6h-1.5"/>'
            + rect(x + 3.5, y + 13.5, 11, 1.6, 0.8, "th-pr"))


def phone():
    """الجوال وشاشته: صفحة منيو كافيه مبسطة، من اليمين (عربي)."""
    out = rect(0, 0, PH_W, PH_H, 22, "th-tx")                 # الجسم
    out += rect(8, 8, PH_W - 16, PH_H - 16, 15, "th-sf")      # الشاشة
    out += rect(46, 15, 36, 6, 3, "th-tx")                    # السماعة
    page = rect(18, 30, 92, 40, 8, "th-so")                   # رأس الصفحة (النقطة تنزل على يساره)
    page += rect(58, 40, 44, 7, 3.5, "th-tx") + rect(72, 53, 30, 5, 2.5, "th-mu")
    page += rect(80, 80, 30, 12, 6, "th-pr") + rect(46, 80, 30, 12, 6, "th-so")  # التصنيفات
    for i in range(3):                                        # الأصناف: صورة فنجان، اسم، وصف، سعر
        y = 104 + i * 28
        page += rect(92, y, 18, 18, 5, "th-so") + cup(92, y)
        page += rect(48, y + 3, 38, 6, 3, "th-tx") + rect(60, y + 12, 26, 4, 2, "th-mu")
        page += rect(18, y + 5, 18, 7, 3.5, "th-pr")
    page += rect(18, 194, 92, 20, 7, "th-ct") + rect(50, 202, 28, 4, 2, "th-on")  # الزر
    return out + f'<g id="th-page">{page}</g>'


def stand():
    """الستاند: لوح بزوايا فوق دائرية على قاعدة، وعليه الرمز وسطرين كلام."""
    x0, x1, top, bot, r = PANEL
    edge = f"M{x0} {bot}V{top + r}A{r} {r} 0 0 1 {x0 + r} {top}H{x1 - r}A{r} {r} 0 0 1 {x1} {top + r}V{bot}"
    out = f'<path class="th-sf" d="{edge}Z"/><path class="th-ln" d="{edge}"/>'
    out += rect(x0 - 14, bot, x1 - x0 + 28, 14, 7, "th-sf") + rect(x0 - 14, bot, x1 - x0 + 28, 14, 7, "th-ln")
    tx = (x0 + x1 - TILE) / 2
    out += f'<g id="th-symbol" transform="translate({num(tx)} {TILE_Y}) scale({TILE / 512:.6g})">{symbol()}</g>'
    cx = (x0 + x1) / 2
    out += rect(cx - 38, TILE_Y + TILE + 34, 76, 8, 4, "th-tx") + rect(cx - 26, TILE_Y + TILE + 52, 52, 6, 3, "th-mu")
    return out


def trail():
    """النقطة من نقطة الرمز للجوال: على خط مستقيم، أول وحدة برّا المساحة الفارغة، والأخيرة على رأس الصفحة."""
    x0, x1 = PANEL[0], PANEL[1]
    tx = (x0 + x1 - TILE) / 2
    _, (dcx, dcy, _) = symbol_geometry(512)
    k = TILE / 512
    src = (tx + dcx * k, TILE_Y + dcy * k)                    # نقطة الرمز
    dst = to_abs(LAND)                                        # مكان النزول
    clear = tx - TILE / 4                                     # حد المساحة الفارغة يسار الرمز
    t1 = (src[0] - (clear - DOT_R[0] - 6)) / (src[0] - dst[0])
    ts = (t1, (t1 + 1) / 2, 1.0)
    out = '<g id="th-trail">'
    for i, (t, r) in enumerate(zip(ts, DOT_R)):
        x, y = src[0] + (dst[0] - src[0]) * t, src[1] + (dst[1] - src[1]) * t
        out += f'<circle id="th-dot-{i + 1}" class="th-dt" cx="{num(x)}" cy="{num(y)}" r="{num(r)}"/>'
    return out + "</g>"


def build():
    ph = (f'<g id="th-phone"><g transform="translate({PH_C[0]} {PH_C[1]}) rotate({PH_ANGLE}) '
          f'translate({-PH_W / 2} {-PH_H / 2})">{phone()}</g></g>')
    table = '<path class="th-tb" d="M132 338H462"/>'
    vb = (94, 50, 408, 306)  # 4:3 والرسمة في النص
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(map(str, vb))}" '
            f'width="{vb[2]}" height="{vb[3]}" role="img" aria-labelledby="th-title">'
            f'<title id="th-title">{TITLE}</title>{style()}{table}{stand()}{ph}{trail()}</svg>\n')


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    svg = build()
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print(f"tap-hero.svg: {len(svg.encode('utf-8'))} bytes")


if __name__ == "__main__":
    main()
