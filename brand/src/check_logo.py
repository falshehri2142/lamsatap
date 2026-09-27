"""فحص آلي للرمز والشعار حسب موجز الشعار الملزم GM-026 (work/2026-09-27-logo-decision/decision.md).

يطلع PASS أو FAIL لكل بند يتقاس، ومعه الرقم:
  البند 3: أرفع خط ≥ 0.096 من الضلع، أضيق فراغ ≥ 0.078، قطر النقطة ≥ 0.15، وللحفر كل خط وفراغ ≥ 0.05.
  البند 4: يدخل دائرة (أبعد نقطة ≤ 0.5 من الضلع عن المركز)، يشتغل بدون خلفية، تعبئة بس (بدون stroke
           ولا تدرج ولا شفافية ولا صورة)، مسار واحد مدموج لكل لون (فحص even-odd).
  البند 5: شبكة 16px من 512: خط ≥ 64، فراغ ≥ 64 (الأفضل)، نقطة ≥ 92، والحواف على مضاعفات 32.
  البند 8: السطر اللاتيني في الشعار الكامل والأفقي (لون واحد) على مقاس الحفر: كل خط وفراغ ≥ 0.3mm.
  البند 1: صورة مقارنة: الرمز في دائرة 32 و40px، على صفحة فاتحة وداكنة وسوداء، ملون وبالرمادي.
  إضافي: تباين كل جزء ≥ 3:1 على خلفية الرمز (#0B7A75 أو الحبر #14201F).
البنود 2 و6 و7 تنفحص بالعين والقانوني، مو هنا.

التشغيل من جذر المشروع:
  python brand/src/check_logo.py                       # مثال: ملفات brand/logo الحالية
  python brand/src/check_logo.py <مجلد>                # كل مفهوم في المجلد (وفروعه)، حسب أسماء الملفات تحت
  python brand/src/check_logo.py --icon a.svg --mono a-mono.svg --full-mono b.svg --horizontal-mono c.svg
  python brand/src/check_logo.py --self-test           # يجرّب طريقة القياس على أشكال مقاسها معروف
أسماء الملفات في المجلد: <اسم>-icon.svg (الرمز ملون، أو -mark أو -symbol)، <اسم>-icon-mono.svg (لون واحد أسود)،
  <اسم>-logo-mono.svg (الكامل لون واحد)، <اسم>-horizontal-mono.svg (الأفقي لون واحد).
الناتج: التقرير في الطرفية، ونسخة منه (report.txt و report.json) والصور في --out (الافتراضي مجلد مؤقت برّا المشروع).
رمز الخروج: 0 لو كل البنود PASS، و1 لو فيه FAIL. السكربت ما يعدّل أي ملف SVG.
يحتاج: Microsoft Edge أو Chrome، و numpy و opencv-python و Pillow (نفس متطلبات build_logo.py و export_png.py).

طريقة القياس (نفسها في --self-test):
- الرمز ينرسم بالمتصفح على 2048px، وينقاس على 1024px (بكسلين لكل وحدة من 512، الدقة ±0.5 وحدة تقريباً).
- «أرفع خط» = أكبر قطر دائرة تمشي داخل كل أجزاء الشكل بدون ما يضيع منها جزء له وزن (مثل نقطة ليزر).
  القطع الصغيرة في الزوايا (أقل من ربع مربع القطر) ما تنحسب. «أضيق فراغ» = نفس الشي على الفراغ،
  مع أقل مسافة بين أي جزئين منفصلين.
"""
import argparse
import json
import math
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
BRAND_LOGO = ROOT / "brand" / "logo"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

# ---------- حدود GM-026 ----------
LINE_MIN, GAP_MIN, DOT_MIN = 0.096, 0.078, 0.15      # البند 3 (من ضلع الرمز)
ENGRAVE_MIN = 0.05                                     # البند 3: الحفر
CIRCLE_MAX = 0.5                                       # البند 4
GRID_UNITS, GRID_STEP = 512, 32                        # البند 5
GRID_LINE, GRID_GAP_BEST, GRID_DOT = 64, 64, 92
LATIN_MM = 0.3                                         # البند 8: أرفع خط وأضيق فراغ للحفر
LATIN_TARGET_MM = {"horizontal": 15.2, "full": 34.0}   # أصغر ارتفاع حفر في الموجز
CONTRAST_MIN = 3.0                                     # الفحص الإضافي
BACKGROUNDS = ["#0B7A75", "#14201F"]
DOT_COLORS = ["#F2A93B", "#F5B85A"]
REF_COLORS = [("#005A5A", "لتين"), ("#075E54", "تيل واتساب، مصدره غير رسمي")]
PRINT_TOLERANCE_DE = 3.5                               # سماحية المطبعة ΔE2000 (web-qa.md [ت1])
DOT_OFFSET = (0.12, 0.30)                              # التسويق بند 3: بعد مركز النقطة عن المركز
ENGRAVE_AREA_MAX = 0.30                                # المهندس: مساحة الحفر (رقم مقترح)
AVATAR_SIZES, AVATAR_FILL = (32, 40), 0.8              # التسويق بند 6: الرمز داخل 80% من الدائرة
PAGES = [("فاتح", "#FFFFFF"), ("داكن", "#121212"), ("أسود", "#000000")]
MARKETING_DOT_PX = {32: 5, 40: 6}                      # التسويق بند 7 والمبيعات م1

SHAPES = {"path", "rect", "circle", "ellipse", "polygon", "polyline", "line"}
BANNED = {"text": "نص <text>", "tspan": "نص <tspan>", "image": "صورة نقطية مدمجة",
          "linearGradient": "تدرج", "radialGradient": "تدرج", "pattern": "نقش pattern",
          "filter": "فلتر أو ظل", "mask": "قناع mask", "foreignObject": "foreignObject",
          "style": "تنسيق <style>", "use": "نسخة <use>"}
NO_PAINT = {"defs", "clipPath", "mask", "symbol", "marker", "pattern", "title", "desc", "metadata"}
NAMED = {"black": "#000000", "white": "#FFFFFF", "red": "#FF0000", "green": "#008000", "blue": "#0000FF"}


# ---------- الألوان ----------

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = (_lin(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(hex2rgb(a)), luminance(hex2rgb(b))
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def lab(h):
    r, g, b = (_lin(v) for v in hex2rgb(h))
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883

    def f(t):
        return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def de2000(c1, c2):
    """CIEDE2000 (Sharma, Wu, Dalal 2005)، يطابق بيانات الاختبار الـ34 حقتهم."""
    (L1, a1, b1), (L2, a2, b2) = lab(c1), lab(c2)
    cb = (math.hypot(a1, b1) + math.hypot(a2, b2)) / 2
    g = 0.5 * (1 - math.sqrt(cb ** 7 / (cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + g) * a1, (1 + g) * a2
    c1p, c2p = math.hypot(a1p, b1), math.hypot(a2p, b2)

    def hue(a, b):
        if a == 0 and b == 0:
            return 0.0
        h = math.degrees(math.atan2(b, a))
        return h + 360 if h < 0 else h
    h1, h2 = hue(a1p, b1), hue(a2p, b2)
    dl, dc = L2 - L1, c2p - c1p
    dh = 0.0 if c1p * c2p == 0 else (h2 - h1 - 360 if h2 - h1 > 180 else h2 - h1 + 360 if h2 - h1 < -180 else h2 - h1)
    dH = 2 * math.sqrt(c1p * c2p) * math.sin(math.radians(dh / 2))
    lb, cbp = (L1 + L2) / 2, (c1p + c2p) / 2
    if c1p * c2p == 0:
        hb = h1 + h2
    elif abs(h1 - h2) <= 180:
        hb = (h1 + h2) / 2
    else:
        hb = (h1 + h2 + 360) / 2 if h1 + h2 < 360 else (h1 + h2 - 360) / 2
    t = (1 - 0.17 * math.cos(math.radians(hb - 30)) + 0.24 * math.cos(math.radians(2 * hb))
         + 0.32 * math.cos(math.radians(3 * hb + 6)) - 0.20 * math.cos(math.radians(4 * hb - 63)))
    rc = 2 * math.sqrt(cbp ** 7 / (cbp ** 7 + 25 ** 7))
    sl = 1 + 0.015 * (lb - 50) ** 2 / math.sqrt(20 + (lb - 50) ** 2)
    sc, sh = 1 + 0.045 * cbp, 1 + 0.015 * cbp * t
    rt = -math.sin(math.radians(60 * math.exp(-(((hb - 275) / 25) ** 2)))) * rc
    return math.sqrt((dl / sl) ** 2 + (dc / sc) ** 2 + (dH / sh) ** 2 + rt * (dc / sc) * (dH / sh))


def norm_color(c):
    if c is None:
        return None
    c = c.strip()
    low = c.lower()
    if low in ("none", "transparent"):
        return "none"
    if low.startswith("url("):
        return "url"
    if low == "currentcolor":
        return "#000000"
    m = re.fullmatch(r"#([0-9a-fA-F]{3})", c)
    if m:
        return "#" + "".join(ch * 2 for ch in m.group(1)).upper()
    if re.fullmatch(r"#[0-9a-fA-F]{6}", c):
        return c.upper()
    m = re.fullmatch(r"rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)", c)
    if m:
        return "#%02X%02X%02X" % tuple(int(v) for v in m.groups())
    return NAMED.get(low, c)


# ---------- الرسم بالمتصفح ----------

def find_browser():
    b = next((p for p in BROWSERS if os.path.exists(p)), None)
    if not b:
        raise SystemExit("ما لقيت Edge أو Chrome")
    return b


def shoot(html, w, h, dpr=1, transparent=True):
    """يرسم صفحة HTML بمتصفح بدون واجهة ويرجع مصفوفة RGBA بمقاس w×h (بكسل CSS × dpr)."""
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        page, shot = pathlib.Path(tmp) / "p.html", pathlib.Path(tmp) / "s.png"
        page.write_text(html, encoding="utf-8")
        args = [find_browser(), "--headless=new", "--disable-gpu", "--hide-scrollbars",
                f"--force-device-scale-factor={dpr}",
                f"--window-size={max(math.ceil(w) + 8, 256)},{max(math.ceil(h) + 8, 256)}",
                f"--user-data-dir={tmp}", f"--screenshot={shot}"]
        if transparent:
            args.append("--default-background-color=00000000")
        subprocess.run(args + [page.as_uri()], check=True, capture_output=True, timeout=180)
        im = Image.open(shot).convert("RGBA")
        im.load()
    return np.array(im.crop((0, 0, math.ceil(w * dpr - 1e-6), math.ceil(h * dpr - 1e-6))))


def render_svg(path, w, h, bg=None, dpr=1):
    css = bg or "transparent"
    html = (f'<!doctype html><html style="background:{css}"><body style="margin:0;background:{css}">'
            f'<img src="{pathlib.Path(path).resolve().as_uri()}" style="display:block;position:absolute;'
            f'left:0;top:0;width:{w}px;height:{h}px"></body></html>')
    return shoot(html, w, h, dpr, transparent=bg is None)


def parallel(jobs):
    with ThreadPoolExecutor(6) as ex:
        return list(ex.map(lambda j: j[0](*j[1:]), jobs))


# ---------- قراءة SVG ----------

def style_of(el):
    out = {}
    for part in (el.get("style") or "").split(";"):
        if ":" in part:
            k, v = part.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def viewbox(path):
    root = ET.parse(path).getroot()
    vb = root.get("viewBox")
    if vb:
        return tuple(float(v) for v in re.split(r"[\s,]+", vb.strip()))
    return 0.0, 0.0, float(re.sub(r"[^\d.]", "", root.get("width", "0"))), float(re.sub(r"[^\d.]", "", root.get("height", "0")))


def scan_svg(path):
    """الأشكال المرسومة مع لونها الفعلي (بالوراثة)، والعناصر الممنوعة."""
    root = ET.parse(path).getroot()
    shapes, banned = [], []

    def walk(el, inh, opacity, painted):
        tag = el.tag.split("}")[-1]
        st = style_of(el)
        cur = dict(inh)
        for k in ("fill", "stroke", "fill-rule"):
            v = st.get(k, el.get(k))
            if v is not None:
                cur[k] = v
        op = opacity
        for k in ("opacity", "fill-opacity"):
            v = st.get(k, el.get(k))
            if v is not None:
                try:
                    op *= float(v)
                except ValueError:
                    pass
        if tag in BANNED:
            banned.append(BANNED[tag])
        paint = painted and tag not in NO_PAINT
        if paint and tag in SHAPES:
            stroke = norm_color(cur.get("stroke"))
            shapes.append(dict(tag=tag, fill=norm_color(cur.get("fill", "#000000")),
                               stroke=None if stroke in (None, "none") else stroke,
                               opacity=op, rule=cur.get("fill-rule", "nonzero")))
        for ch in el:
            walk(ch, cur, op, paint)
    walk(root, {"fill": "#000000"}, 1.0, True)
    return shapes, banned


def evenodd_copy(path, out):
    """نسخة كل أشكالها fill-rule=evenodd: لو اختلف رسمها عن الأصل، فيه مسارات متداخلة (مو مدموجة)."""
    tree = ET.parse(path)
    for el in tree.getroot().iter():
        if el.tag.split("}")[-1] in SHAPES:
            el.set("fill-rule", "evenodd")
            st = style_of(el)
            if "fill-rule" in st:
                del st["fill-rule"]
                el.set("style", ";".join(f"{k}:{v}" for k, v in st.items()))
    tree.write(out, encoding="utf-8")


def recolor_copy(path, out, keep):
    """نسخة فيها بس الأشكال اللي لونها في keep (الباقي fill=none): قناع دقيق لكل لون بدون خلط الحواف."""
    tree = ET.parse(path)

    def walk(el, inh):
        st = style_of(el)
        cur = dict(inh)
        v = st.get("fill", el.get("fill"))
        if v is not None:
            cur["fill"] = v
        if el.tag.split("}")[-1] in SHAPES and norm_color(cur.get("fill", "#000000")) not in keep:
            el.set("fill", "none")
            el.set("stroke", "none")
            for k in ("fill", "stroke"):
                st.pop(k, None)
            el.set("style", ";".join(f"{k}:{v}" for k, v in st.items()))
        for ch in el:
            walk(ch, cur)
    walk(tree.getroot(), {"fill": "#000000"})
    tree.write(out, encoding="utf-8")


# ---------- القياس ----------

def edt(mask):
    return cv2.distanceTransform(mask.astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)


def keeps(F, D, d, regions=None):
    """هل دائرة قطرها d بكسل تغطي كل أجزاء F اللي لها وزن؟ يرجع (نعم/لا، مكان أكبر جزء ضاع).
    الجزء اللي يضيع له وزن إذا: مساحته ≥ ربع مربع القطر (مو قصاصة زاوية)، أو يلمس منطقتين منفصلتين
    برّا F (جسر بين فتحتين، أو فراغ بين جزئين): هذا يضيع حتى لو صغير."""
    E = (D - 0.5) >= d / 2 - 1e-6
    if not E.any():
        ys, xs = np.nonzero(F)
        return False, (float(xs.mean()), float(ys.mean())) if len(xs) else None
    lost = F & ~(edt(~E) <= d / 2 + 0.5)
    n, lab_, st, ce = cv2.connectedComponentsWithStats(lost.astype(np.uint8), connectivity=8)
    thr = max(0.25 * d * d, 3 * d)
    sig = []
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a >= thr:
            sig.append(i)
        elif regions is not None and a >= 2:
            x, y, w, h = (int(st[i, k]) for k in (cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT))
            y0, x0 = max(0, y - 1), max(0, x - 1)
            piece = cv2.dilate((lab_[y0:y + h + 1, x0:x + w + 1] == i).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
            near = np.unique(regions[y0:y + h + 1, x0:x + w + 1][piece])
            if (near > 0).sum() >= 2:
                sig.append(i)
    if sig:
        i = max(sig, key=lambda j: st[j, cv2.CC_STAT_AREA])
        return False, (float(ce[i][0]), float(ce[i][1]))
    return True, None


def critical(F):
    """أكبر قطر (بكسل) يغطي كل أجزاء F اللي لها وزن، ومكان أول جزء يضيع بعده."""
    if not F.any():
        return 0.0, None
    D = edt(F)
    regions = cv2.connectedComponents((~F).astype(np.uint8), connectivity=4)[1]
    dmax = 2 * float(D.max()) + 2
    lo, hi, where, d = 0.0, None, None, 1.0
    while d <= dmax:
        ok, w = keeps(F, D, d, regions)
        if not ok:
            hi, where = d, w
            break
        lo, d = d, max(d + 0.5, d * 1.15)
    if hi is None:
        return lo, None
    while hi - lo > 0.5:
        mid = (lo + hi) / 2
        ok, w = keeps(F, D, mid, regions)
        if ok:
            lo = mid
        else:
            hi, where = mid, w
    return lo, where


def components(F, min_area=4, conn=8):
    n, lab_, st, _ = cv2.connectedComponentsWithStats(F.astype(np.uint8), connectivity=conn)
    keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= min_area]
    return lab_, keep


def part_gaps(F, min_area=4, conn=8):
    """أقل مسافة (بكسل، من حافة لحافة) بين أي جزئين منفصلين، ومكانها. None لو جزء واحد."""
    lab_, keep = components(F, min_area, conn)
    if len(keep) < 2:
        return None, None, len(keep)
    best = (float("inf"), None)
    allparts = np.isin(lab_, keep)
    for i in keep:
        m = lab_ == i
        dist = edt(~m)
        other = allparts & ~m
        v = float(dist[other].min())
        if v < best[0]:
            ys, xs = np.nonzero(other & (dist == v))
            best = (v, (float(xs[0]), float(ys[0])))
    return best[0] - 1, best[1], len(keep)


def min_line(F, pad=16):
    """أرفع خط: الأصغر بين (أرفع جزء في الشكل، بطريقة نقطة الليزر) و(أرفع جدار بين فتحتين أو بين فتحة والبرّا).
    الجدار ينقاس بالمسافة الدقيقة بين مناطق الفراغ المنفصلة، لأن الجسر بين حافة مستقيمة ودائرة يطلع
    بطريقة الليزر أعرض من حقيقته."""
    Fp = np.pad(F, pad, constant_values=False)
    lc, lat = critical(Fp)
    wg, wat, _ = part_gaps(~Fp, 4, 4)
    shift = lambda a: None if a is None else (a[0] - pad, a[1] - pad)
    return dict(stroke=lc, stroke_at=shift(lat), wall=wg, wall_at=shift(wat), value=lc if wg is None else min(lc, wg))


def white_of(F, pad):
    return ~np.pad(F, pad, constant_values=False), pad


def min_gap(F, pad=None):
    """أضيق فراغ: الأصغر بين (الفراغ بين جزئين منفصلين) و(أضيق فتحة أو زاوية داخل الشكل).
    برّا الملف فراغ مفتوح: الحشوة كبيرة (ربع المقاس) عشان حافة الصورة ما تنحسب فراغ."""
    pad = pad or max(64, max(F.shape) // 4)
    pg, pg_at, n = part_gaps(F)
    W, p = white_of(F, pad)
    wc, wat = critical(W)
    wat = None if wat is None else (wat[0] - p, wat[1] - p)
    return dict(parts=n, between=pg, between_at=pg_at, inside=wc, inside_at=wat,
                value=wc if pg is None else min(pg, wc))


# ---------- الرمز: فرز الألوان ----------

def classify(rgba, fills):
    """كل بكسل (شفافيته ≥ 50%) لأقرب لون تعبئة في الملف."""
    a = rgba[..., 3] >= 128
    rgb = rgba[..., :3].astype(np.float32)
    best, idx = None, None
    for k, c in enumerate(fills):
        d = ((rgb - np.array(hex2rgb(c), np.float32)) ** 2).sum(-1)
        if best is None:
            best, idx = d, np.zeros(d.shape, np.int32)
        else:
            m = d < best
            best[m], idx[m] = d[m], k
    return a, idx


def down(M, size):
    return cv2.resize(M.astype(np.float32), (size, size), interpolation=cv2.INTER_AREA) >= 0.5


def edges_on_grid(M, px_per_unit, min_len_units=8, tol=1.0):
    """الحواف الأفقية والرأسية الطويلة وأطراف كل جزء، ومكانها بوحدات 512، وهل هي على مضاعفات 32."""
    out = []
    min_len = int(min_len_units * px_per_unit)

    def longest(row):
        if not row.any():
            return 0
        d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
        s, e = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
        return int((e - s).max())
    for axis, name in ((0, "أفقية"), (1, "رأسية")):
        T = (M[1:, :] != M[:-1, :]) if axis == 0 else (M[:, 1:] != M[:, :-1]).T
        for i in range(T.shape[0]):
            if T[i].sum() >= min_len and longest(T[i]) >= min_len:
                out.append((name, (i + 1) / px_per_unit))
    lab_, keep = components(M, int(4 * px_per_unit ** 2))
    for i in keep:
        ys, xs = np.nonzero(lab_ == i)
        for name, v in (("طرف فوق", ys.min()), ("طرف تحت", ys.max() + 1), ("طرف يسار", xs.min()), ("طرف يمين", xs.max() + 1)):
            out.append((name, v / px_per_unit))
    seen, res = set(), []
    for name, v in out:
        key = (name, round(v * 2) / 2)
        if key in seen:
            continue
        seen.add(key)
        off = abs(v - GRID_STEP * round(v / GRID_STEP))
        res.append(dict(kind=name, at=round(v, 2), off=round(off, 2), ok=off <= tol))
    return res


# ---------- التقرير ----------

class Report:
    def __init__(self, name):
        self.name, self.rows = name, []

    def add(self, item, label, value, status, note=""):
        self.rows.append(dict(item=item, label=label, value=value, status=status, note=note))

    def text(self):
        lines = [f"== {self.name}"]
        for r in self.rows:
            note = f"  ({r['note']})" if r["note"] else ""
            lines.append(f"[{r['status']:<4}] البند {r['item']}: {r['label']}: {r['value']}{note}")
        c = {s: sum(r["status"] == s for r in self.rows) for s in ("PASS", "FAIL", "WARN", "INFO", "SKIP")}
        lines.append(f"-- PASS {c['PASS']} | FAIL {c['FAIL']} | WARN {c['WARN']} | INFO {c['INFO']} | SKIP {c['SKIP']}")
        return "\n".join(lines)


TOL = 1.0 / GRID_UNITS  # دقة القياس: وحدة وحدة من 512


def status(ok, near=False):
    return "PASS" if ok else "FAIL"


def at_least(value, limit, tol=TOL):
    """(الحكم، ملاحظة): ينجح لو القيمة ≥ الحد ناقص الدقة، ويكتب «على الحد» لو الفرق داخل الدقة."""
    return ("PASS" if value >= limit - tol else "FAIL"), (" على الحد" if abs(value - limit) <= tol else "")


def u(frac):
    return f"{frac:.4f} من الضلع ({frac * GRID_UNITS:.1f} من 512)"


def font(size):
    for f in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def mag(arr, k):
    im = Image.fromarray(arr).convert("RGB")
    big = im.resize((im.width * k, im.height * k), Image.NEAREST)
    if k >= 6:
        d = ImageDraw.Draw(big)
        for x in range(0, big.width, k):
            d.line([(x, 0), (x, big.height)], fill=(200, 200, 200))
        for y in range(0, big.height, k):
            d.line([(0, y), (big.width, y)], fill=(200, 200, 200))
    return big


def on_white(rgba):
    a = rgba[..., 3:4].astype(np.float32) / 255
    return (rgba[..., :3] * a + 255 * (1 - a)).astype(np.uint8)


# ---------- فحص الرمز ----------

def check_icon(rep, icon, mono, out, tag):
    x0, y0, W, H = viewbox(icon)
    side = max(W, H)
    if abs(W - H) > 1e-6:
        rep.add("4", "الـviewBox مربع", f"{W:g}×{H:g}", "WARN", "الضلع = الأكبر")
    shapes, banned = scan_svg(icon)
    fills = sorted({s["fill"] for s in shapes if s["fill"] not in (None, "none", "url")})
    tmp = out / f"{tag}-evenodd.svg"
    evenodd_copy(icon, tmp)
    jobs = [(render_svg, icon, 2048, 2048), (render_svg, tmp, 1024, 1024), (render_svg, icon, 1024, 1024),
            (render_svg, icon, 16, 16), (render_svg, icon, 32, 32)]
    if mono:
        mt = out / f"{tag}-mono-evenodd.svg"
        evenodd_copy(mono, mt)
        jobs += [(render_svg, mono, 1024, 1024, "#FFFFFF"), (render_svg, mt, 1024, 1024), (render_svg, mono, 1024, 1024)]
    r = parallel(jobs)
    big, eo, norm1k, v16, v32 = r[:5]
    tmp.unlink(missing_ok=True)
    if mono:
        mt.unlink(missing_ok=True)

    # الخلفية داخل الملف (مربع أو دائرة) = لون يغطي 50% أو أكثر من المربع (تقدير بالفرز، والقياس بعده من رسم لكل لون)
    alpha, idx = classify(big, fills or ["#000000"])
    area = {c: float((alpha & (idx == k)).mean()) for k, c in enumerate(fills)}
    bg = max(area, key=area.get) if area and max(area.values()) >= 0.5 else None
    fg_cols = [c for c in fills if c != bg]
    dot_cols = [c for c in fg_cols if min(de2000(c, d) for d in DOT_COLORS) < 10]
    fg_svg, dot_svg = out / f"{tag}-fg.svg", out / f"{tag}-dot.svg"
    recolor_copy(icon, fg_svg, set(fg_cols))
    recolor_copy(icon, dot_svg, set(dot_cols))
    s_a, s_b = (round(D * AVATAR_FILL) for D in AVATAR_SIZES)
    fg2, dotr, r16, r32, ra, rb = parallel([(render_svg, fg_svg, 2048, 2048), (render_svg, dot_svg, 2048, 2048),
                                            (render_svg, fg_svg, 16, 16), (render_svg, fg_svg, 32, 32),
                                            (render_svg, fg_svg, s_a, s_a), (render_svg, fg_svg, s_b, s_b)])
    fg_svg.unlink(missing_ok=True)
    dot_svg.unlink(missing_ok=True)
    F2 = fg2[..., 3] >= 128
    F = down(F2, 1024)
    frac = 1 / 1024   # كسر الضلع لكل بكسل

    # ---- البند 3 ----
    L = min_line(F)
    lc_at = L["wall_at"] if L["wall"] is not None and L["wall"] <= L["stroke"] else L["stroke_at"]
    g = min_gap(F)
    line, gap = L["value"] * frac, (g["value"] or 0) * frac
    lwhere = "جدار بين فراغين" if L["wall"] is not None and L["wall"] <= L["stroke"] else "داخل الشكل"
    st_, nt = at_least(line, LINE_MIN)
    rep.add("3", "أرفع خط", u(line) + f"، {lwhere}", st_, f"الحد {LINE_MIN}{nt}")
    if g["between"] is None and g["inside"] * frac >= 0.4:
        rep.add("3", "أضيق فراغ", "الرمز جزء واحد بدون فتحات ضيقة", "PASS")
    else:
        where = "بين جزئين منفصلين" if g["between"] is not None and g["between"] <= g["inside"] else "داخل الشكل (فتحة أو زاوية داخلية)"
        st_, nt = at_least(gap, GAP_MIN)
        rep.add("3", "أضيق فراغ", u(gap) + f"، {where}", st_, f"الحد {GAP_MIN}{nt}")
    dot = None
    if dot_cols:
        lab_, keep = components(dotr[..., 3] >= 128, 16)
        if keep:
            st = [(int((lab_ == i).sum()), i) for i in keep]
            a_, i_ = max(st)
            m = lab_ == i_
            ys, xs = np.nonzero(m)
            eq = 2 * math.sqrt(a_ / math.pi) / 2048
            ins = 2 * float(edt(np.pad(m, 2)).max()) / 2048
            cx, cy = xs.mean() / 2048, ys.mean() / 2048
            off = math.hypot(cx - 0.5, cy - 0.5)
            dot = dict(d=eq, inscribed=ins, n=len(keep), offset=off, center=(cx, cy))
            st_, nt = at_least(eq, DOT_MIN)
            rep.add("3", "قطر النقطة", u(eq) + f"، استدارتها {ins / eq:.2f}", st_, f"الحد {DOT_MIN}{nt}")
            rep.add("+", "عدد النقاط الزعفرانية في الرمز", str(len(keep)), status(len(keep) == 1), "القرار §1: نقطة وحدة")
            rep.add("+", "بعد مركز النقطة عن مركز الرمز", f"{off:.3f} من الضلع",
                    status(DOT_OFFSET[0] <= off <= DOT_OFFSET[1]), f"التسويق بند 3: {DOT_OFFSET[0]} إلى {DOT_OFFSET[1]}")
    if not dot:
        rep.add("3", "قطر النقطة", "ما لقيت نقطة زعفران (#F2A93B أو #F5B85A)", "FAIL")

    # ---- البند 3: الحفر (نسخة اللون الواحد) ----
    if mono:
        mr, meo, mplain = r[5], r[6], r[7]
        M = (mr[..., :3].mean(-1) < 128)
        mline = min_line(M)["value"]
        mg = min_gap(M)
        st_, nt = at_least(mline * frac, ENGRAVE_MIN)
        rep.add("3", "الحفر: أرفع خط (لون واحد)", u(mline * frac), st_, f"الحد {ENGRAVE_MIN}{nt}")
        st_, nt = at_least((mg["value"] or 0) * frac, ENGRAVE_MIN)
        rep.add("3", "الحفر: أضيق فراغ (لون واحد)", u((mg["value"] or 0) * frac), st_, f"الحد {ENGRAVE_MIN}{nt}")
        cover = float(M.mean())
        rep.add("4", "مساحة الحفر في نسخة اللون الواحد", f"{cover * 100:.1f}% من المربع",
                "PASS" if cover <= ENGRAVE_AREA_MAX else "WARN", f"مقترح المهندس ≤ {ENGRAVE_AREA_MAX * 100:.0f}%")
        eo_diff = np.abs(meo.astype(int) - mplain.astype(int)).max(-1) > 32
        rep.add("4", "مسار مدموج في نسخة اللون الواحد (even-odd)", f"{eo_diff.mean() * 100:.3f}% بكسلات تتغير",
                status(eo_diff.mean() <= 0.0005))
    else:
        rep.add("3", "الحفر", "ما فيه ملف لون واحد (-mono)", "SKIP")

    # ---- البند 4 ----
    ys, xs = np.nonzero(alpha)
    far = float(np.hypot((xs + 0.5) / 2048 - 0.5, (ys + 0.5) / 2048 - 0.5).max()) if len(xs) else 0
    rep.add("4", "يدخل دائرة: أبعد نقطة عن المركز", f"{far:.3f} من الضلع", status(far <= CIRCLE_MAX + TOL), f"الحد {CIRCLE_MAX}")
    rep.add("4", "يشتغل بدون خلفية", "فيه خلفية داخل الملف " + bg + f" ({area[bg] * 100:.0f}% من المربع)" if bg else "بدون خلفية",
            status(bg is None))
    strokes = [s for s in shapes if s["stroke"]]
    rep.add("4", "تعبئة بس بدون stroke", f"{len(strokes)} شكل عليه stroke", status(not strokes))
    other = sorted(set(banned)) + (["شفافية"] if any(s["opacity"] < 1 for s in shapes) else []) + \
        (["تعبئة بتدرج"] if any(s["fill"] == "url" for s in shapes) else [])
    rep.add("4", "بدون تدرج ولا شفافية ولا صورة ولا نص", "، ".join(other) if other else "ما فيه", status(not other))
    per = {c: sum(s["fill"] == c for s in shapes) for c in fills}
    rep.add("4", "مسار واحد لكل لون", "، ".join(f"{c}: {n}" for c, n in per.items()), status(all(n == 1 for n in per.values())))
    diff = np.abs(eo.astype(int) - norm1k.astype(int)).max(-1) > 32
    rep.add("4", "مسار مدموج (even-odd ما يفتح فراغ)", f"{diff.mean() * 100:.3f}% بكسلات تتغير", status(diff.mean() <= 0.0005),
            "فوق 0.05% = مسارات متداخلة")

    # ---- البند 5 ----
    lu, gu = line * GRID_UNITS, gap * GRID_UNITS
    st_, nt = at_least(lu, GRID_LINE, 1.0)
    rep.add("5", "الخط على شبكة 16px", f"{lu:.1f} من 512 ({lu / 32:.2f}px على 16px)", st_, f"الحد {GRID_LINE}{nt}")
    if not (g["between"] is None and g["inside"] * frac >= 0.4):
        rep.add("5", "الفراغ على شبكة 16px", f"{gu:.1f} من 512 ({gu / 32:.2f}px على 16px)",
                "PASS" if gu >= GRID_GAP_BEST - 1.0 else "WARN", f"الأفضل {GRID_GAP_BEST}، وأقله {GAP_MIN * 512:.0f} (البند 3)")
    if dot:
        du = dot["d"] * GRID_UNITS
        st_, nt = at_least(du, GRID_DOT, 1.0)
        rep.add("5", "النقطة على شبكة 16px", f"{du:.1f} من 512 ({du / 32:.2f}px على 16px)", st_, f"الحد {GRID_DOT}{nt}")
    ed = edges_on_grid(F2, 2048 / GRID_UNITS)
    bad = [e for e in ed if not e["ok"]]
    rep.add("5", "الحواف على مضاعفات 32", f"{len(ed) - len(bad)} من {len(ed)} على الشبكة" +
            (": برّاها " + "، ".join(f"{e['kind']} {e['at']:g}" for e in bad[:8]) + (" ..." if len(bad) > 8 else "") if bad else ""),
            status(not bad), "تسامح وحدة وحدة")

    # الفصل بين الأجزاء على 16 و32px وفي صورة الحساب
    ref_n = len(components(F, 16)[1])

    def parts_at(rgba):
        return len(components(rgba[..., 3] >= 128, 1)[1])
    for s_, rr in ((16, r16), (32, r32)):
        n_ = parts_at(rr)
        rep.add("5", f"الأجزاء منفصلة على {s_}px", f"{n_} من {ref_n} جزء", status(n_ == ref_n))
    for D, rr in zip(AVATAR_SIZES, (ra, rb)):
        s_ = round(D * AVATAR_FILL)
        n_ = parts_at(rr)
        rep.add("1", f"الأجزاء منفصلة في دائرة {D}px (الرمز {s_}px)", f"{n_} من {ref_n} جزء", status(n_ == ref_n))
        if dot:
            dpx = dot["d"] * s_
            st_, nt = at_least(dpx, MARKETING_DOT_PX[D], TOL * s_)
            rep.add("1", f"النقطة في دائرة {D}px", f"{dpx:.2f}px", st_, f"الحد {MARKETING_DOT_PX[D]}px (التسويق 7، المبيعات م1){nt}")

    # ---- الفحص الإضافي: التباين ----
    parts = fg_cols
    for b in BACKGROUNDS + ([bg] if bg and bg not in BACKGROUNDS else []):
        vals = [(c, contrast(c, b)) for c in parts]
        rep.add("+", f"تباين الأجزاء على {b}" + (" (خلفية الملف)" if b == bg else ""),
                "، ".join(f"{c} {v:.2f}" for c, v in vals), status(all(v >= CONTRAST_MIN for _, v in vals)), f"الحد {CONTRAST_MIN}:1")
    for b in BACKGROUNDS + ([bg] if bg and bg not in BACKGROUNDS else []):
        ds = [(n, de2000(b, rc)) for rc, n in REF_COLORS]
        rep.add("+", f"بعد {b} عن ألوان قريبة (ΔE2000)", "، ".join(f"{n} {v:.2f}" for n, v in ds),
                status(all(v > PRINT_TOLERANCE_DE for _, v in ds)), f"سماحية المطبعة {PRINT_TOLERANCE_DE}")

    # ---- الصور ----
    view = on_white(norm1k)
    ov = view.copy()
    Fp = np.pad(F, 16, constant_values=False)
    lost = Fp & ~((edt(~((edt(Fp) - 0.5) >= LINE_MIN * 512 - 1e-6)) <= LINE_MIN * 512 + 0.5))
    ov[lost[16:-16, 16:-16]] = (220, 30, 30)
    Wm, p = white_of(F, 256)
    lost_w = Wm & ~((edt(~((edt(Wm) - 0.5) >= GAP_MIN * 512 - 1e-6)) <= GAP_MIN * 512 + 0.5))
    ov[lost_w[p:-p, p:-p] & ~F] = (30, 90, 230)
    im = Image.fromarray(ov)
    d = ImageDraw.Draw(im)
    for i in range(0, 1025, 64):  # شبكة 16px = كل 32 من 512
        d.line([(i, 0), (i, 1024)], fill=(0, 170, 0))
        d.line([(0, i), (1024, i)], fill=(0, 170, 0))
    for at, col in ((lc_at, (220, 30, 30)), (g["inside_at"], (30, 90, 230)), (g["between_at"], (30, 90, 230))):
        if at:
            d.ellipse([at[0] - 22, at[1] - 22, at[0] + 22, at[1] + 22], outline=col, width=4)
    for e in bad:
        if e["kind"] in ("أفقية", "طرف فوق", "طرف تحت"):
            y = e["at"] * 2
            d.line([(0, y), (1024, y)], fill=(255, 0, 255), width=1)
        else:
            x = e["at"] * 2
            d.line([(x, 0), (x, 1024)], fill=(255, 0, 255), width=1)
    im.save(out / f"{tag}-item3-5-measure.png")
    def on(rgba, hx):
        a = rgba[..., 3:4].astype(np.float32) / 255
        return (rgba[..., :3] * a + np.array(hex2rgb(hx), np.float32) * (1 - a)).astype(np.uint8)
    sheet = Image.new("RGB", (4 * 256 + 5 * 20, 256 + 40), "white")
    for i, (arr, k, hx) in enumerate(((v16, 16, "#FFFFFF"), (v32, 8, "#FFFFFF"), (v16, 16, "#202124"), (v32, 8, "#202124"))):
        sheet.paste(mag(on(arr, hx), k), (20 + i * 276, 20))
    sheet.save(out / f"{tag}-item5-16px-32px.png")
    if diff.any():
        dv = view.copy()
        dv[diff] = (255, 0, 255)
        Image.fromarray(dv).save(out / f"{tag}-item4-evenodd-diff.png")
    return dict(bg=bg, fg=fg_cols, dot=dot, line=line, gap=gap)


# ---------- البند 1: صورة المقارنة ----------

def avatar_sheet(icon, mono, own_bg, out, tag):
    icon_uri = pathlib.Path(icon).resolve().as_uri()
    mono_uri = pathlib.Path(mono).resolve().as_uri() if mono else None
    cols = []
    if own_bg:
        cols += [("خلفية الملف", None, D) for D in AVATAR_SIZES]
    cols += [(b, b, D) for b in BACKGROUNDS for D in AVATAR_SIZES]
    if mono_uri:
        cols += [("بدون خلفية", "mono", s) for s in (16, 32)]
    rows = [(f"{pn} ملون", pc, "") for pn, pc in PAGES] + [(f"{pn} رمادي", pc, "filter:grayscale(1);") for pn, pc in PAGES]
    CW, LW, HH = 64, 96, 44
    Wd, Hd = LW + CW * len(cols), HH + CW * len(rows)
    h = [f'<!doctype html><html><body style="margin:0;background:#fff;font:11px Tahoma,Arial,sans-serif;color:#222">']
    for j, (name, kind, D) in enumerate(cols):
        h.append(f'<div style="position:absolute;left:{LW + j * CW}px;top:2px;width:{CW}px;text-align:center;line-height:13px">{name}<br>{D}px</div>')
    for i, (rname, page, filt) in enumerate(rows):
        y = HH + i * CW
        h.append(f'<div style="position:absolute;left:2px;top:{y + 24}px;width:{LW - 4}px;direction:rtl">{rname}</div>')
        for j, (name, kind, D) in enumerate(cols):
            x = LW + j * CW
            cell = [f'<div style="position:absolute;left:{x}px;top:{y}px;width:{CW}px;height:{CW}px;background:{page};{filt}">']
            o = (CW - D) // 2
            if kind == "mono":
                inv = "filter:invert(1);" if luminance(hex2rgb(page)) < 0.2 else ""
                cell.append(f'<img src="{mono_uri}" style="position:absolute;left:{o}px;top:{o}px;width:{D}px;height:{D}px;{inv}">')
            else:
                s = D if kind is None else round(D * AVATAR_FILL)
                bgc = "" if kind is None else f"background:{kind};"
                cell.append(f'<div style="position:absolute;left:{o}px;top:{o}px;width:{D}px;height:{D}px;border-radius:50%;overflow:hidden;{bgc}">'
                            f'<img src="{icon_uri}" style="position:absolute;left:{(D - s) // 2}px;top:{(D - s) // 2}px;width:{s}px;height:{s}px"></div>')
            cell.append("</div>")
            h.append("".join(cell))
    h.append("</body></html>")
    html = "".join(h)
    one, three = parallel([(shoot, html, Wd, Hd, 1, False), (shoot, html, Wd, Hd, 3, False)])
    mag(one[..., :3], 4).save(out / f"{tag}-item1-avatars-1x-zoom4.png")
    Image.fromarray(three[..., :3]).save(out / f"{tag}-item1-avatars-3x.png")


# ---------- البند 8: السطر اللاتيني ----------

def _bands(profile, min_gap):
    runs, start, last, gap = [], None, None, 0
    for i, v in enumerate(profile > 0):
        if v:
            start = i if start is None else start
            last, gap = i, 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                runs.append((start, last + 1))
                start, gap = None, 0
    if start is not None:
        runs.append((start, last + 1))
    return runs


def latin_band(ink):
    H, W = ink.shape
    cols = _bands(ink.sum(0), max(3, int(0.01 * W)))
    stacked = len(_bands(ink.sum(1), max(2, int(0.004 * H)))) >= 2  # الكامل: الرمز فوق والنص تحت
    if len(cols) > 1 and not stacked:  # الأفقي: نشيل عمود الرمز (على طرف الملف، بطوله تقريباً ومربع)
        def is_symbol(c0, c1):
            rows = np.nonzero(ink[:, c0:c1].any(1))[0]
            h = rows[-1] - rows[0] + 1
            return (c0 <= 2 or c1 >= W - 2) and h >= 0.9 * H and 0.8 <= (c1 - c0) / h <= 1.25
        cols = [c for c in cols if not is_symbol(*c)] or cols
    x0, x1 = (cols[0][0], cols[-1][1]) if not stacked else (0, W)
    rows = _bands(ink[:, x0:x1].sum(1), max(2, int(0.004 * H)))
    if len(rows) < 2:
        return None
    r0, r1 = rows[-1]
    if r1 - r0 > 0.5 * H:
        return None
    cs = np.nonzero(ink[r0:r1, x0:x1].any(0))[0]
    return r0, r1, x0 + cs[0], x0 + cs[-1] + 1


def check_latin(rep, svg, kind, out, tag, dpi=1200):
    target = LATIN_TARGET_MM[kind]
    x, y, W, H = viewbox(svg)
    hpx = target / 25.4 * dpi
    img = render_svg(svg, hpx * W / H, hpx, "#FFFFFF")
    ink = img[..., :3].mean(-1) < 128
    band = latin_band(ink)
    label = {"horizontal": "الأفقي", "full": "الكامل"}[kind]
    if not band:
        rep.add("8", f"السطر اللاتيني في {label}", "ما قدرت أحدد السطر (آخر سطر نص)", "SKIP")
        return
    r0, r1, c0, c1 = band
    p = max(64, r1 - r0)
    sub = np.zeros((r1 - r0 + 2 * p, c1 - c0 + 2 * p), bool)
    sub[p:-p, p:-p] = ink[r0:r1, c0:c1]
    mm = 25.4 / dpi
    Ld = min_line(sub, 0)
    lc = Ld["value"]
    lat = Ld["wall_at"] if Ld["wall"] is not None and Ld["wall"] <= Ld["stroke"] else Ld["stroke_at"]
    pg, pgat, n = part_gaps(sub)
    # الفراغ داخل الحروف: العيون المقفلة (مثل عين a وp) تُحسب، والزوايا الداخلية الحادة (مثل ملتقى القوس بالساق) تنبيه بس
    wl, wk = components(~sub, 1, 4)
    border = set(np.unique(np.concatenate([wl[0], wl[-1], wl[:, 0], wl[:, -1]]))) - {0}
    holes = [i for i in wk if i not in border]
    eye, eyeat = None, None
    for i in holes:
        v, at = critical(np.pad(wl == i, 2, constant_values=False))
        if eye is None or v < eye:
            eye, eyeat = v, None if at is None else (at[0] - 2, at[1] - 2)
    outside = np.isin(wl, list(border))
    wc, wat = critical(outside)
    rows = [("أرفع خط", lc * mm, "FAIL"), ("أضيق فراغ بين حرفين", None if pg is None else pg * mm, "FAIL"),
            ("أصغر عين حرف مقفلة", None if eye is None else eye * mm, "FAIL"),
            ("أضيق زاوية داخلية مفتوحة", wc * mm, "WARN")]
    need, need_strict = [], []
    for k, v, bad in rows:
        if v is None:
            continue
        ok = v >= LATIN_MM - mm / 2
        rep.add("8", f"{label} على {target:g}mm: {k}", f"{v:.3f}mm", "PASS" if ok else bad, f"الحد {LATIN_MM}mm")
        need_strict.append(target * LATIN_MM / max(v, 1e-6))
        if bad == "FAIL":
            need.append(target * LATIN_MM / max(v, 1e-6))
    rep.add("8", f"{label}: أصغر ارتفاع حفر يخلي الخطوط والفراغات والعيون ≥ {LATIN_MM}mm", f"{max(need):.1f}mm",
            "INFO", f"ومع الزوايا الداخلية {max(need_strict):.1f}mm. ارتفاع السطر اللاتيني على {target:g}mm = {(r1 - r0) * mm:.2f}mm، والدقة ±{mm:.3f}mm")
    ov = np.stack([np.where(sub, 150, 255)] * 3, -1).astype(np.uint8)
    im = Image.fromarray(ov)
    d = ImageDraw.Draw(im)
    for at, col in ((lat, (220, 30, 30)), (wat, (30, 90, 230)), (pgat, (30, 160, 60)), (eyeat, (200, 120, 0))):
        if at:
            d.ellipse([at[0] - 12, at[1] - 12, at[0] + 12, at[1] + 12], outline=col, width=3)
    im.save(out / f"{tag}-item8-{kind}-latin-{target:g}mm.png")


# ---------- الملفات والمجموعات ----------

ROLE_RE = re.compile(r"^(?P<prefix>.*?)[-_](?P<kind>icon|mark|symbol|logo|horizontal)(?P<rest>.*)$", re.I)


def roles_in(folder):
    groups = {}
    for f in sorted(pathlib.Path(folder).rglob("*.svg")):
        m = ROLE_RE.match(f.stem)
        if not m:
            continue
        pre, kind, rest = m.group("prefix"), m.group("kind").lower(), m.group("rest").lower()
        g = groups.setdefault(str(f.parent / pre), {})
        mono = "mono" in rest and "white" not in rest
        if kind in ("icon", "mark", "symbol"):
            if mono:
                g.setdefault("mono", f)
            elif rest == "":
                g["icon"] = f
            elif not any(w in rest for w in ("mono", "white", "fullbleed", "dark", "circle", "avatar", "favicon")):
                g.setdefault("icon", f)
        elif kind == "logo" and mono:
            g.setdefault("full_mono", f)
        elif kind == "horizontal" and mono:
            g.setdefault("horizontal_mono", f)
    return {k: v for k, v in groups.items() if v}


def run_group(name, files, out):
    rep = Report(name)
    tag = re.sub(r"[^\w.-]+", "_", pathlib.Path(name).name) or "logo"
    rep.add("-", "الملفات", "، ".join(f"{k}={pathlib.Path(v).name}" for k, v in files.items()), "INFO")
    info = None
    if files.get("icon"):
        info = check_icon(rep, files["icon"], files.get("mono"), out, tag)
        avatar_sheet(files["icon"], files.get("mono"), info["bg"], out, tag)
        rep.add("1", "صورة المقارنة (دائرة 32 و40px، فاتح وداكن وأسود، ملون ورمادي)",
                str(out / f"{tag}-item1-avatars-1x-zoom4.png"), "INFO", "الحكم بالعين: ينعرف؟")
    else:
        rep.add("3", "الرمز", "ما فيه ملف رمز (-icon)", "SKIP")
    for key, kind in (("horizontal_mono", "horizontal"), ("full_mono", "full")):
        if files.get(key):
            check_latin(rep, files[key], kind, out, tag)
        else:
            rep.add("8", f"السطر اللاتيني ({kind})", "ما فيه ملف لون واحد", "SKIP")
    return rep


# ---------- تجربة طريقة القياس ----------

def self_test():
    def aa(draw, shape, ss=8):
        big = np.zeros((shape[0] * ss, shape[1] * ss), np.uint8)
        draw(big, ss)
        return cv2.resize(big, (shape[1], shape[0]), interpolation=cv2.INTER_AREA) >= 128
    tests = []
    for w in (7, 11):
        a = np.zeros((80, 300), bool)
        a[30:30 + w, 20:280] = True
        tests.append((f"شرطة عرضها {w}", "line", a, w))
    a = np.zeros((140, 320), bool)
    a[20:120, 20:120] = True
    a[20:120, 200:300] = True
    a[65:70, 110:210] = True
    tests.append(("مربعين بينهم عنق 5", "line", a, 5))
    t = aa(lambda b, s: (cv2.rectangle(b, (40 * s, 20 * s), (260 * s, 80 * s), 255, -1),
                         cv2.circle(b, (150 * s, (80 + 11 + 22) * s), 22 * s, 255, -1)), (200, 300))
    tests.append(("حافة مستقيمة ودائرة بينهم 11", "gap", t, 11))
    tests.append(("جسر بين فتحتين (مستقيمة ودائرة) عرضه 11", "line", ~t, 11))
    t = aa(lambda b, s: (cv2.circle(b, (60 * s, 50 * s), 10 * s, 255, -1), cv2.circle(b, (83 * s, 50 * s), 10 * s, 255, -1)), (100, 140))
    tests.append(("نقطتين بينهم 3", "gap", t, 3))
    ok_all = True
    for name, kind, F, exp in tests:
        F = np.pad(F, 20, constant_values=False)
        v = min_line(F, 0)["value"] if kind == "line" else min_gap(F)["value"]
        ok = abs(v - exp) <= 1.0
        ok_all &= ok
        print(f"[{'PASS' if ok else 'FAIL'}] {name}: المتوقع {exp}px، المقاس {v:.1f}px")
    return ok_all


def main():
    ap = argparse.ArgumentParser(description="فحص الرمز والشعار حسب GM-026")
    ap.add_argument("folder", nargs="?", help="مجلد فيه ملفات المفهوم (الافتراضي brand/logo)")
    ap.add_argument("--icon")
    ap.add_argument("--mono")
    ap.add_argument("--full-mono")
    ap.add_argument("--horizontal-mono")
    ap.add_argument("--out", help="مجلد الصور والتقرير (الافتراضي مجلد مؤقت برّا المشروع)")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    if a.self_test:
        sys.exit(0 if self_test() else 1)
    out = pathlib.Path(a.out or os.path.join(tempfile.gettempdir(), "lamsatap-check-logo")).resolve()
    out.mkdir(parents=True, exist_ok=True)
    if ROOT / "brand" / "logo" in out.parents or out == ROOT / "brand" / "logo":
        raise SystemExit("--out ما يكون داخل brand/logo")
    explicit = {k: v for k, v in (("icon", a.icon), ("mono", a.mono), ("full_mono", a.full_mono), ("horizontal_mono", a.horizontal_mono)) if v}
    if explicit:
        groups = {"مفهوم": {k: pathlib.Path(v) for k, v in explicit.items()}}
    else:
        folder = pathlib.Path(a.folder) if a.folder else BRAND_LOGO
        groups = roles_in(folder)
        if not groups:
            raise SystemExit(f"ما لقيت ملفات بأسماء *-icon.svg أو *-logo-mono.svg أو *-horizontal-mono.svg في {folder}")
    reports, fail = [], False
    for name, files in groups.items():
        rep = run_group(name, files, out)
        print(rep.text() + "\n")
        reports.append(rep)
        fail |= any(r["status"] == "FAIL" for r in rep.rows)
    (out / "report.txt").write_text("\n\n".join(r.text() for r in reports) + "\n", encoding="utf-8")
    (out / "report.json").write_text(json.dumps([dict(name=r.name, rows=r.rows) for r in reports], ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"الصور والتقرير: {out}")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()
