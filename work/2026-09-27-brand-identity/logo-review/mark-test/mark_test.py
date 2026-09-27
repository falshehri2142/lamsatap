"""اختبار أي رمز على الستاند والملصق والحفر (web-illustrator، 2026-09-27).

يرسم الرمز المرشح بمقاسه الحقيقي على: قالب الستاند A6 المعتمد (موجز المدير الفني، القسم 6)، حفر ليزر (خشب فاتح، جوز، أكريليك شفاف)،
ملصقات دائرية 30 و25mm، والشاشة من 16 لين 64px. ويطلع تقرير قياسات يصلح لأي رمز:
تداخل المسارات، أنحف جزء وأضيق فراغ (كنسبة من طول الرمز وبالـ mm على أصغر مقاس)، وأكبر مقاس يدخل في الملصق الدائري.
الرسم محاكاة تقريبية للمواد (مو صورة حرق حقيقي). حد الحفر 0.3mm قاعدة web-qa المبدئية (logo-review/web-qa.md)، غير مؤكدة لين عينة المورد.
القياس: «أنحف جزء» و«أضيق فراغ» = أول مكان ينقسم فيه الحبر أو ينسد فيه الفراغ لما ننحته أو ننشره (مو أطراف الخطوط).

التشغيل (أي مجلد):
  python mark_test.py --color mark.svg --mono mark-mono.svg --out <مجلد> [--color-dark mark-dark.svg] [--touch 0.5,0.8] [--min-mm 6] [--stand-mm 18]
  --color       الرمز الملون بدون خلفية (للطباعة والشاشة)
  --mono        نسخة لون واحد: حبر غامق على شفاف (للحفر والطباعة بلون واحد). نفس الملف اللي ينرسل للمورد
  --color-dark  (اختياري) نسخة الرمز للخلفية الداكنة (الملصق التيل، والشاشة الداكنة)
  --touch u,v   (اختياري) مكان عنصر «المس هنا» داخل الرمز (0 إلى 1 من عرضه وطوله): ينحط فوق مركز الشريحة بالضبط
  --stand-mm    مقاس الرمز على الستاند (أطول ضلع، الافتراضي 18 = علامة اللمس في الموجز)
  --min-mm      أصغر مقاس مطبوع أو محفور للرمز (أطول ضلع، الافتراضي 6)
يحتاج: Microsoft Edge أو Chrome، و numpy و opencv-python و Pillow.
"""
import argparse
import math
import os
import pathlib
import re
import subprocess
import sys
import tempfile

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[3]
FONT = (ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf").as_uri()
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]
# ألوان الهوية المعتمدة (GM-020) + ألوان المواد في المحاكاة
DEEP, SAND, INK, MUTED = "#075E5A", "#FAF7F2", "#14201F", "#56625F"
MIN_FEATURE_MM = 0.3  # أرفع خط وأضيق فراغ في الحفر (قاعدة web-qa المبدئية، غير مؤكدة لين عينة المورد)


def shot(html, out, w, h, scale=1):
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome")
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                        f"--force-device-scale-factor={scale}", f"--window-size={w},{h}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", page.as_uri()], check=True, capture_output=True, timeout=120)


def page(body, bg="#EFE9DF"):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>@font-face{{font-family:RX;src:url("{FONT}");'
            f'font-weight:160 700}}body{{margin:0;background:{bg}}}svg{{display:block}}</style></head><body>{body}</body></html>')


def aspect(svg_path):
    s = pathlib.Path(svg_path).read_text(encoding="utf-8")
    m = re.search(r'viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)', s)
    if m:
        return float(m.group(1)) / float(m.group(2))
    w, h = re.search(r'width="([\d.]+)', s), re.search(r'height="([\d.]+)', s)
    return float(w.group(1)) / float(h.group(1)) if w and h else 1.0


def box(size, a):
    """أطول ضلع = size، مع نسبة الرمز a (عرض ÷ طول)."""
    return (size, size / a) if a >= 1 else (size * a, size)


ASPECT = {}  # نسبة كل ملف (رابطه ← عرض ÷ طول)، تنعبى في main


def fit(uri, size):
    return box(size, ASPECT[uri])


def image(uri, x, y, w, h, extra=""):
    return f'<image href="{uri}" x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" preserveAspectRatio="none" {extra}/>'


FILTERS = """<defs>
<filter id="burn" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 .227 0 0 0 0 .133 0 0 0 0 .071 0 0 0 1 0" result="s"/>
<feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="2" seed="3" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.35 1.1" result="a"/><feComposite in="s" in2="a" operator="in"/></filter>
<filter id="frost" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 .95 0 0 0 0 .95 0 0 0 0 .94 0 0 0 1 0" result="s"/>
<feTurbulence type="fractalNoise" baseFrequency=".9" seed="5" result="n"/>
<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.3 .85" result="a"/><feComposite in="s" in2="a" operator="in"/></filter>
<filter id="white" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>
<filter id="black" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>"""


def grain(x, y, w, h, base, line, seed, r):
    import random
    rnd = random.Random(seed)
    out = [f'<clipPath id="g{seed}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>',
           f'<g clip-path="url(#g{seed})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{base}"/>']
    for _ in range(70):
        yy, amp, ph = y + rnd.uniform(-10, h + 10), rnd.uniform(2, 9), rnd.uniform(0, 6.28)
        pts = " ".join(f"{x - 10 + (w + 20) * k / 40:.1f},{yy + amp * math.sin(ph + k * .35) + 3 * math.sin(k * 1.1 + ph):.1f}"
                       for k in range(41))
        out.append(f'<polyline points="{pts}" fill="none" stroke="{line}" stroke-opacity="{rnd.uniform(.08, .28):.2f}" '
                   f'stroke-width="{rnd.uniform(.6, 2.4):.1f}"/>')
    return "".join(out) + "</g>"


def fake_qr(x, y, s, seed=7):
    import random
    rnd, n = random.Random(seed), 25
    m = s / n
    out = [f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="#fff"/>']
    for fx, fy in ((0, 0), (n - 7, 0), (0, n - 7)):
        out.append(f'<rect x="{x + fx * m}" y="{y + fy * m}" width="{7 * m}" height="{7 * m}" fill="{INK}"/>'
                   f'<rect x="{x + (fx + 1) * m}" y="{y + (fy + 1) * m}" width="{5 * m}" height="{5 * m}" fill="#fff"/>'
                   f'<rect x="{x + (fx + 2) * m}" y="{y + (fy + 2) * m}" width="{3 * m}" height="{3 * m}" fill="{INK}"/>')
    for i in range(n):
        for j in range(n):
            if (i < 8 and j < 8) or (i >= n - 8 and j < 8) or (i < 8 and j >= n - 8):
                continue
            if rnd.random() < .45:
                out.append(f'<rect x="{x + i * m:.2f}" y="{y + j * m:.2f}" width="{m + .3:.2f}" height="{m + .3:.2f}" fill="{INK}"/>')
    return "".join(out)


# ---------- المشاهد ----------

def scene_stand(color, mono, touch, size_mm):
    """قالب الستاند المعتمد في موجز المدير الفني (web-art-director.md، القسم 6): وجه أبيض A6، خانة شعار المحل
    70×18mm من 12 لين 30mm، ومنطقة الشريحة دائرة 30mm مركزها 62mm، والباركود 32mm من 90 لين 122mm."""
    K = 3.2  # px لكل mm
    W, H = mm(105, K), mm(148, K)
    out = [FILTERS, '<filter id="shop" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" '
                    'values="0 0 0 0 .122 0 0 0 0 .231 0 0 0 0 .341 0 0 0 1 0"/></filter>',
           '<rect width="1000" height="560" fill="#E9E3D8"/><rect y="560" width="1000" height="200" fill="#8C6644"/>']
    for i, (uri, flt) in enumerate(((color, ""), (mono, 'filter="url(#shop)"'))):
        x, y = 70 + i * 460, 560 - H - mm(10, K)
        chip = (x + W / 2, y + mm(62, K))
        bw, bh = fit(uri, mm(size_mm, K))
        u, v = touch if touch else (.5, .5)
        out += [f'<ellipse cx="{x + W / 2}" cy="{y + H + mm(12, K)}" rx="{W * .62}" ry="{mm(4, K)}" fill="#000" opacity=".18" filter="url(#soft)"/>',
                f'<rect x="{x}" y="{y}" width="{W}" height="{H}" rx="{mm(2, K)}" fill="#FFFFFF" stroke="#E4DCD0"/>',
                f'<rect x="{x + mm(17.5, K)}" y="{y + mm(12, K)}" width="{mm(70, K)}" height="{mm(18, K)}" rx="{mm(2, K)}" fill="#E4DCD0"/>',
                f'<text x="{x + W / 2}" y="{y + mm(41, K)}" text-anchor="middle" font-family="RX" font-weight="600" font-size="{mm(6.35, K)}" fill="#000">المنيو</text>',
                image(uri, chip[0] - u * bw, chip[1] - v * bh, bw, bh, flt),
                f'<circle cx="{chip[0]}" cy="{chip[1]}" r="{mm(15, K)}" fill="none" stroke="#E4572E" stroke-width="1.4" stroke-dasharray="5 4"/>',
                f'<circle cx="{chip[0]}" cy="{chip[1]}" r="2.2" fill="#E4572E"/>',
                f'<text x="{x + W / 2}" y="{y + mm(85, K)}" text-anchor="middle" font-family="RX" font-weight="600" font-size="{mm(3.88, K)}" fill="#000">قرّب جوالك هنا</text>']
        qs = mm(32, K)
        out += [fake_qr(x + (W - qs) / 2, y + mm(90, K), qs),
                f'<text x="{x + W / 2}" y="{y + mm(131, K)}" text-anchor="middle" font-family="RX" font-weight="500" font-size="{mm(3.53, K)}" fill="#000">أو امسح الباركود</text>',
                f'<rect x="{x - mm(8, K)}" y="{y + H - mm(2, K)}" width="{W + mm(16, K)}" height="{mm(14, K)}" rx="{mm(1.5, K)}" fill="#14201F"/>']
    cap = (f'<div style="direction:rtl;font:15px RX;color:#14201F;padding:6px 16px">قالب الستاند من موجز المدير الفني: الرمز {size_mm:g}mm في منطقة الشريحة '
           '(المتقطع الأحمر 30mm، والنقطة الحمراء مركزها 62mm من فوق). يسار: الملف الملون، ويمين: ملف اللون الواحد بلون محل عرض #1F3B57. '
           'لو عنصر «المس هنا» مو فوق النقطة الحمراء، الستاند يكذب.</div>')
    return page(f'<svg width="1000" height="760" viewBox="0 0 1000 760">{"".join(out)}</svg>{cap}'), 1000, 820


def scene_engrave(mono):
    K = 4.0
    S, s12, B = mm(40, K), mm(12, K), mm(100, K)
    out = [FILTERS, '<rect width="1360" height="560" fill="#EFE9DF"/><rect x="910" width="450" height="560" fill="#221E1B"/>']
    labels = []
    for i, (kind, base, line) in enumerate((("خشب فاتح", "#D8B68C", "#8A5A30"), ("خشب جوز", "#6E4A30", "#2A170B"), ("أكريليك شفاف", None, None))):
        x, y = 50 + i * 450, 40
        if base:
            out.append(grain(x, y, B, B, base, line, 10 + i, mm(4, K)))
            f = "burn"
        else:
            out.append(f'<rect x="{x}" y="{y}" width="{B}" height="{B}" rx="{mm(4, K)}" fill="#fff" fill-opacity=".05" stroke="#fff" stroke-opacity=".5"/>')
            f = "frost"
        bw, bh = fit(mono, S)
        out.append(image(mono, x + (B - bw) / 2, y + (B - bh) / 2 - mm(6, K), bw, bh, f'filter="url(#{f})"'))
        sw, sh = fit(mono, s12)
        out.append(image(mono, x + B - sw - mm(6, K), y + B - sh - mm(6, K), sw, sh, f'filter="url(#{f})"'))
        labels.append(f'<div style="flex:1;text-align:center;direction:rtl">{kind}: الرمز 40mm، وفي الزاوية 12mm</div>')
    cap = '<div style="display:flex;direction:ltr;font:15px RX;color:#14201F;padding:6px 40px">' + "".join(labels) + '</div>'
    return page(f'<svg width="1360" height="480" viewBox="0 0 1360 480">{"".join(out)}</svg>{cap}'), 1360, 520


def scene_stickers(color, dark, mono, rho):
    K = 8.0
    out = [FILTERS, '<rect width="1500" height="430" fill="#EFE9DF"/>']
    items = ((30, "#FFFFFF", color, "", "30mm أبيض + الملون"), (30, DEEP, dark, "", "30mm تيل + نسخة الداكن"),
             (25, "#1B1B1B", mono, 'filter="url(#white)"', "25mm on-metal أسود + لون واحد أبيض"), (25, "#FFFFFF", mono, 'filter="url(#black)"', "25mm أبيض + لون واحد"))
    caps = []
    for i, (d, bg, uri, flt, lab) in enumerate(items):
        cx, cy, r = 190 + i * 370, 200, mm(d, K) / 2
        L = (r - mm(2, K)) / rho  # أكبر رمز يدخل بحاشية 2mm
        bw, bh = fit(uri, L)
        out += [f'<circle cx="{cx + 3}" cy="{cy + 5}" r="{r}" fill="#000" opacity=".18" filter="url(#soft)"/>',
                f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}" stroke="#D9D2C6"/>', image(uri, cx - bw / 2, cy - bh / 2, bw, bh, flt)]
        caps.append(f'<div style="flex:1;text-align:center;direction:rtl">{lab}: الرمز {L / K:.1f}mm</div>')
    R = 96 / 25.4  # المقاس الحقيقي على شاشة 96dpi
    real = ['<rect width="1500" height="120" fill="#EFE9DF"/>', FILTERS]
    for i, (d, bg, uri, flt, _) in enumerate(items):
        cx, cy, r = 190 + i * 370, 60, d * R / 2
        L = (r - 2 * R) / rho
        bw, bh = fit(uri, L)
        real += [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}" stroke="#D9D2C6"/>', image(uri, cx - bw / 2, cy - bh / 2, bw, bh, flt)]
    cap = '<div style="display:flex;direction:ltr;font:15px RX;color:#14201F;padding:0 30px">' + "".join(caps) + '</div>'
    return page(f'<svg width="1500" height="430" viewBox="0 0 1500 430">{"".join(out)}</svg>{cap}'
                f'<svg width="1500" height="120" viewBox="0 0 1500 120">{"".join(real)}</svg>'
                '<div style="direction:rtl;font:14px RX;color:#56625F;padding:0 30px">تحت: نفس الملصقات بمقاسها الحقيقي تقريباً (96dpi)</div>'), 1500, 620


def scene_sizes(color, dark):
    rows = []
    for bg, uri in (("#FAF7F2", color), ("#FFFFFF", color), ("#0E1615", dark), ("#35363A", dark)):
        cells = "".join('<img src="{}" style="display:block;width:{:.2f}px;height:{:.2f}px">'.format(uri, *fit(uri, s))
                        for s in (16, 24, 32, 48, 64))
        rows.append(f'<div style="display:flex;gap:10px;align-items:flex-end;padding:8px;background:{bg};height:80px">{cells}</div>')
    return page("".join(rows)), 380, 390


def mm(v, K):
    return v * K


# ---------- القياسات ----------

def raster(svg, px, evenodd=False):
    """يرسم ملف اللون الواحد بطول px على أبيض ويرجع قناع الحبر (True = حبر)."""
    src = pathlib.Path(svg).read_text(encoding="utf-8")
    if evenodd:
        src = re.sub(r"<path (?![^>]*fill-rule)", '<path fill-rule="evenodd" ', src)
    with tempfile.TemporaryDirectory() as tmp:
        f = pathlib.Path(tmp) / "m.svg"
        f.write_text(src, encoding="utf-8")
        a = aspect(svg)
        w, h = (px, round(px / a)) if a >= 1 else (round(px * a), px)
        pad = 60
        out = pathlib.Path(tmp) / "m.png"
        shot(f'<!doctype html><html><body style="margin:0;background:#fff"><img src="{f.as_uri()}" '
             f'style="display:block;margin:{pad}px;width:{w}px;height:{h}px"></body></html>', out, w + 2 * pad, h + 2 * pad)
        g = np.array(Image.open(out).convert("L"))
    return g < 128


def topo(mask):
    n_ink = cv2.connectedComponents(mask.astype(np.uint8), connectivity=8)[0] - 1
    n_bg, lab = cv2.connectedComponents((~mask).astype(np.uint8), connectivity=4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    holes = sum(1 for i in range(1, n_bg) if i not in border)
    return n_ink, holes


def first_change(mask, erode, L, limit=0.4):
    """أول نصف قطر يغيّر شكل الرمز (عدد الأجزاء أو الفراغات) لما ننحت الحبر (erode) أو ننشره (dilate).
    يرجع (نصف القطر، القناع قبل التغيير، القناع بعده)."""
    base, prev = topo(mask), mask
    op = cv2.erode if erode else cv2.dilate
    for r in range(1, int(L * limit)):
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
        cur = op(mask.astype(np.uint8), k) > 0
        if topo(cur) != base:
            return r, prev, cur
        prev = cur
    return None, None, None


def spots(before, after, erode, most=12):
    """مكان التغيير بالضبط، لكل حالة: جزء انقسم أو اختفى، فراغين اندمجوا، جزئين التصقوا، فراغ انقسم أو انقفل أو اختفى.
    العلامة = منتصف أقرب نقطتين بين المنطقتين (مكان الاختناق)."""
    def comps(mask, conn):
        return cv2.connectedComponents(mask.astype(np.uint8), connectivity=conn)

    def closest_mid(A, B):
        dA = cv2.distanceTransform((~A).astype(np.uint8), cv2.DIST_L2, 5)
        dB = cv2.distanceTransform((~B).astype(np.uint8), cv2.DIST_L2, 5)
        pb = np.unravel_index(np.argmin(np.where(B, dA, np.inf)), A.shape)
        pa = np.unravel_index(np.argmin(np.where(A, dB, np.inf)), A.shape)
        return ((pa[1] + pb[1]) / 2, (pa[0] + pb[0]) / 2)

    def centroid(M):
        yy, xx = np.nonzero(M)
        return (xx.mean(), yy.mean())

    pts = []
    # (الكبير، الصغير): كل منطقة في الصغير داخل منطقة وحدة في الكبير
    if erode:  # الحبر ينحت: جزء ينقسم أو يختفي، أو فراغات تندمج
        pairs = [((before, 8), (after, 8)), ((~after, 4), (~before, 4))]
    else:  # الحبر ينتشر: أجزاء تلتصق، أو فراغ ينقسم أو ينقفل أو يختفي
        pairs = [((after, 8), (before, 8)), ((~before, 4), (~after, 4))]
    for (big, cb), (small, cs) in pairs:
        nb, lb = comps(big, cb)
        ns, ls = comps(small, cs)
        for i in range(1, nb):
            inside = [j for j in np.unique(ls[lb == i]) if j]
            if not inside:  # اختفى كله
                pts.append(centroid(lb == i))
            for j, k in zip(inside, inside[1:]):  # انقسم (أو اندمج، حسب الاتجاه)
                pts.append(closest_mid(ls == j, ls == k))
            if len(pts) >= most:
                return pts[:most]
    return pts


def measure(mono, out_dir, min_mm):
    rep = []
    src = pathlib.Path(mono).read_text(encoding="utf-8")
    ds = re.findall(r'\sd="([^"]+)"', src)
    curves = sum(len(re.findall(r"[CcQqSsTtAa]", d)) for d in ds)
    lines = sum(len(re.findall(r"[LlHhVv]", d)) for d in ds)
    rep.append(f"مسارات ملف اللون الواحد: {len(ds)} مسار، {sum(d.count('M') + d.count('m') for d in ds)} شكل، منحنيات {curves}، خطوط مستقيمة {lines}"
               + ("  <- تحذير: شكله متتبّع من صورة (خطوط كثيرة بدل منحنيات)" if lines > 60 and lines > 3 * curves else ""))
    a = aspect(mono)
    m1 = raster(mono, 1200)
    m2 = raster(mono, 1200, evenodd=True)
    diff = np.logical_xor(m1, m2).sum() / max(1, m1.sum()) * 100
    rep.append(f"تداخل المسارات (نفس الملف بتعبئة even-odd): فرق {diff:.2f}% من الحبر -> "
               + ("ناجح" if diff < 0.05 else "راسب: برامج الحفر أو القص اللي تعبي even-odd بتطلع فراغات، والقص بيقطع خطوط داخلية. ادمج المسارات (union)"))
    Image.fromarray(np.where(np.logical_xor(m1, m2), 0, np.where(m1, 150, 255)).astype(np.uint8)).save(out_dir / "evenodd-diff.png")
    PX = 2000
    m = raster(mono, PX)
    ys, xs = np.nonzero(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    L = max(x1 - x0, y1 - y0) + 1
    exp_w, exp_h = (PX, PX / a) if a >= 1 else (PX * a, PX)
    pad_note = "" if abs((x1 - x0 + 1) - exp_w) < .02 * PX and abs((y1 - y0 + 1) - exp_h) < .02 * PX else "  (الملف فيه حاشية فاضية حول الحبر)"
    P = int(.45 * L)  # حاشية عشان النشر ما يوصل حافة الصورة
    m = np.pad(m[y0:y1 + 1, x0:x1 + 1], P)
    n_ink, holes = topo(m)
    rep.append(f"أجزاء الحبر المنفصلة: {n_ink}، الفراغات المقفلة داخله: {holes}{pad_note}")
    rt, bt, at = first_change(m, True, L)
    rg, bg, ag = first_change(m, False, L)
    t = 2 * rt / L if rt else None
    g = 2 * rg / L if rg else None
    for name, v in (("أنحف جزء في الحبر", t), ("أضيق فراغ (بين جزئين أو داخل الشكل)", g)):
        if v:
            at_mm = "، ".join(f"{v * s:.2f}mm على {s:g}mm" for s in sorted({min_mm, 12, 30}))
            rep.append(f"{name}: {v * 100:.1f}% من طول الرمز = {at_mm}")
        else:
            rep.append(f"{name}: ما تغير شكل الرمز لين 40% من طوله")
    worst = min(v for v in (t, g) if v) if (t or g) else None
    if worst:
        need = MIN_FEATURE_MM / worst
        rep.append(f"أصغر مقاس يخلي أنحف جزء وأضيق فراغ {MIN_FEATURE_MM}mm أو أكثر: {need:.1f}mm (أطول ضلع). "
                   f"المطلوب {min_mm:g}mm -> " + ("ناجح" if need <= min_mm else "راسب"))
    iy, ix = np.nonzero(m)
    cy, cx = (iy.min() + iy.max()) / 2, (ix.min() + ix.max()) / 2
    rho = float(np.sqrt((ix - cx) ** 2 + (iy - cy) ** 2).max() / L)
    for d in (25, 30):
        rep.append(f"أكبر رمز داخل ملصق دائري {d}mm بحاشية 2mm: {(d / 2 - 2) / rho:.1f}mm (أطول ضلع)")
    vis = np.full(m.shape + (3,), 255, np.uint8)
    vis[m] = (175, 175, 175)
    R = max(12, int(.035 * L))
    for pts, col in ((spots(bt, at, True) if rt else [], (40, 50, 225)), (spots(bg, ag, False) if rg else [], (225, 110, 20))):
        for px, py in pts:
            cv2.circle(vis, (int(px), int(py)), R, col, 6)
    cv2.imwrite(str(out_dir / "weak-spots.png"), vis[P // 2:-P // 2, P // 2:-P // 2])
    rep.append("weak-spots.png: الدائرة الحمراء = أنحف جزء في الحبر، والزرقاء = أضيق فراغ (مكان أول تغيّر في الشكل)")
    return rep, rho


def main():
    ap = argparse.ArgumentParser(description="اختبار أي رمز على الستاند والملصق والحفر")
    ap.add_argument("--color", required=True)
    ap.add_argument("--mono", required=True)
    ap.add_argument("--color-dark")
    ap.add_argument("--touch")
    ap.add_argument("--min-mm", type=float, default=6)
    ap.add_argument("--stand-mm", type=float, default=18)
    ap.add_argument("--out", required=True)
    o = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):  # الرسائل العربية في طرفية ويندوز
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    out = pathlib.Path(o.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    color, mono = pathlib.Path(o.color).resolve().as_uri(), pathlib.Path(o.mono).resolve().as_uri()
    dark = pathlib.Path(o.color_dark).resolve().as_uri() if o.color_dark else color
    touch = tuple(float(v) for v in o.touch.split(",")) if o.touch else None
    for path in (o.color, o.mono, o.color_dark or o.color):
        ASPECT[pathlib.Path(path).resolve().as_uri()] = aspect(path)
    rep, rho = measure(o.mono, out, o.min_mm)
    for name, (html, w, h) in {"stand": scene_stand(color, mono, touch, o.stand_mm), "engrave": scene_engrave(mono),
                               "stickers": scene_stickers(color, dark, mono, rho)}.items():
        shot(html, out / f"{name}.png", w, h)
    html, w, h = scene_sizes(color, dark)
    for sc in (1, 2):
        shot(html, out / f"sizes-{sc}x.png", w, h, sc)
        im = Image.open(out / f"sizes-{sc}x.png")
        im.resize((im.width * (3 if sc == 1 else 2), im.height * (3 if sc == 1 else 2)), Image.NEAREST).save(out / f"sizes-{sc}x-zoom.png")
    (out / "report.txt").write_text("\n".join(rep) + "\n", encoding="utf-8")
    print("\n".join(rep))
    print(f"الصور في {out}")


if __name__ == "__main__":
    main()
