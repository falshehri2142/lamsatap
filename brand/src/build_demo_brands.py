"""يبني شعارات محلات العرض الوهمية (الموجز الفني 5.8، GM-023 بند 2) في website/demo/_brands/.

«مقهى المثال» #7A3E2B: حبة قهوة مجردة (بيضاوي + شق)، و«شقق المثال» #1F3B57: باب بقوس (باب + مقبض).
كل رمز شكلين بس، وما يشبه شعارنا ولا أي علامة حقيقية. الاسم مسارات من Readex Pro وزن 600 (الرخصة تسمح)،
بنقاط الخط نفسها (النقاط الدائرية توقيعنا، مو توقيع المحل). ولا زعفران ولا تيل.
لكل محل ملفين: للخلفية الفاتحة، و-dark للداكنة (brand.logoDark): الرمز بلون المحل مفتّح في OKLCH
لين تباينه مع خلفية الداكن 4.5، والاسم #ECF2F0.

التشغيل من جذر المشروع:  python brand/src/build_demo_brands.py
"""
import html
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_logo import ROOT, Text, num  # noqa: E402

OUT = os.path.join(ROOT, "website", "demo", "_brands")
DARK_BG, DARK_SURFACE, DARK_TEXT = "#0E1615", "#152120", "#ECF2F0"
H = 56            # ارتفاع الشعار = ارتفاع الرمز
GAP = 12          # بين الرمز والاسم
TEXT_H = 40       # ارتفاع حبر الاسم (من أعلى نقطة لأسفل ذيل)
W_NAME = 600

SHOPS = {
    "cafe": ("مقهى المثال", "#7A3E2B", "bean"),
    "apartments": ("شقق المثال", "#1F3B57", "door"),
}


# ---------- الألوان (WCAG و OKLCH) ----------

def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _gam(c):
    c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return max(0, min(255, round(c * 255)))


def hex2rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def rgb2hex(c):
    return "#" + "".join(f"{v:02X}" for v in c)


def contrast(a, b):
    def lum(h):
        r, g, b_ = (_lin(v) for v in hex2rgb(h))
        return 0.2126 * r + 0.7152 * g + 0.0722 * b_
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def to_oklch(h):
    r, g, b = (_lin(v) for v in hex2rgb(h))
    l_ = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m_ = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s_ = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, math.hypot(a, b2), math.atan2(b2, a)


def from_oklch(L, C, h):
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
    g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
    b3 = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_
    return rgb2hex([_gam(r), _gam(g), _gam(b3)])


def lighten_until(h, target, backgrounds):
    """يفتّح اللون في OKLCH (نفس الدرجة والتشبع) بخطوات 0.005 لين تباينه مع كل خلفية ≥ target."""
    L, C, hue = to_oklch(h)
    out = h
    while min(contrast(out, bg) for bg in backgrounds) < target and L < 1:
        L += 0.005
        out = from_oklch(L, C, hue)
    return out


# ---------- الرموز (مربع 56 × 56) ----------

def bean(color):
    """حبة قهوة: بيضاوي مايل وشق S مدبب في النص (مفرّغ، evenodd)."""
    cx, cy, rx, ry, rot = 28, 28, 19, 25.5, math.radians(-28)

    def R(x, y):
        return cx + x * math.cos(rot) - y * math.sin(rot), cy + x * math.sin(rot) + y * math.cos(rot)

    pts = [R(rx * math.cos(t), ry * math.sin(t)) for t in (i * 2 * math.pi / 96 for i in range(96))]
    body = "M" + "L".join(f"{num(x)} {num(y)}" for x, y in pts) + "Z"
    # خط الشق: منحنى S من فوق لتحت، عرضه يكبر في النص ويدق عند الطرفين
    p0, p1, p2, p3 = (0, -19.5), (9, -7), (-9, 7), (0, 19.5)
    n, wmax = 40, 4.6
    left, right = [], []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0]
        y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]
        dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
        dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
        k = math.hypot(dx, dy) or 1
        w = wmax / 2 * math.sin(math.pi * t) ** 0.8
        left.append(R(x - dy / k * w, y + dx / k * w))
        right.append(R(x + dy / k * w, y - dx / k * w))
    crease = "M" + "L".join(f"{num(x)} {num(y)}" for x, y in left + right[::-1]) + "Z"
    xs = [x for x, _ in pts]
    return f'<path fill="{color}" fill-rule="evenodd" d="{body}{crease}"/>', (min(xs), max(xs))


def door(color):
    """باب بقوس: قوس ممتلئ بنسبة باب (1:2، مو مربع عريض يشبه شاهد قبر أو محراب) ومقبض دائري مفرّغ (evenodd)."""
    x0, x1, top, bot = 15, 41, 2, 54
    r = (x1 - x0) / 2
    body = f"M{x0} {bot}V{top + r}A{r} {r} 0 0 1 {x1} {top + r}V{bot}Z"
    kx, ky, kr = x0 + 6.5, 32, 2.8
    knob = f"M{num(kx - kr)} {ky}a{kr} {kr} 0 1 0 {num(2 * kr)} 0a{kr} {kr} 0 1 0 {num(-2 * kr)} 0Z"
    return f'<path fill="{color}" fill-rule="evenodd" d="{body}{knob}"/>', (x0, x1)


def logo(name, symbol, text_color):
    """الرمز يمين (بداية القراءة) والاسم يساره، في النص عمودياً، وبينهم GAP من حبر الرمز.
    الإطار مقصوص على الشعار."""
    symbol_svg, (sx0, sx1) = symbol
    t = Text(name, W_NAME, split_dots=False)
    x0, y0, x1, y1 = t.bbox
    s = TEXT_H / (y1 - y0)
    tw = (x1 - x0) * s
    W = tw + GAP + (sx1 - sx0)
    base = (H - TEXT_H) / 2 + y1 * s               # حبر الاسم في النص عمودياً
    body = t.svg(0, base, s, text_color, text_color)
    body += f'<g transform="translate({num(tw + GAP - sx0)} 0)">{symbol_svg}</g>'
    title = html.escape(name)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {num(W)} {H}" width="{num(W)}" height="{H}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    os.makedirs(OUT, exist_ok=True)
    for key, (name, color, kind) in SHOPS.items():
        draw = bean if kind == "bean" else door
        dark = lighten_until(color, 4.5, (DARK_BG, DARK_SURFACE))
        files = {f"{key}.svg": logo(name, draw(color), color),
                 f"{key}-dark.svg": logo(name, draw(dark), DARK_TEXT)}
        for fname, svg in files.items():
            with open(os.path.join(OUT, fname), "w", encoding="utf-8", newline="\n") as f:
                f.write(svg)
            print(f"{fname}: {len(svg.encode('utf-8'))} bytes")
        print(f"  {name}: {color} على الأبيض {contrast(color, '#FFFFFF'):.2f}؛ "
              f"الداكن: الرمز {dark} ({contrast(dark, DARK_BG):.2f} على الخلفية، {contrast(dark, DARK_SURFACE):.2f} على السطح)، "
              f"الاسم {DARK_TEXT} ({contrast(DARK_TEXT, DARK_BG):.2f})")


if __name__ == "__main__":
    main()
