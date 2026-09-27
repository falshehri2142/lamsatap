"""قبل التجميد (المدير الفني «قرار الشعار»): البنود 1 و2 و3 ومقاسات README، على ملفات brand-3 في scratch."""
import json
import math
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

REPO = pathlib.Path(r"C:\Users\TechTroniX\Desktop\NFC\.claude\worktrees\elegant-mclean-8e29f3")
SRC = REPO / "work" / "2026-09-27-brand-identity" / "logo-review" / "concepts" / "brand-src"
BF = pathlib.Path(__file__).resolve().parent / "before-freeze"
LOGO = BF / "logo"
OUT = BF / "tests"
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(SRC))
sys.path.insert(0, str(REPO / "brand" / "src"))
import build_logo_next as bl  # noqa: E402
import check_logo as cl  # noqa: E402

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
INK, LIGHT, WHITE, SAFFRON = "#14201F", "#ECF2F0", "#FFFFFF", "#F2A93B"
FONT_URI = (REPO / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf").as_uri()


def shot(html, out, w, h, scale=1):
    with tempfile.TemporaryDirectory() as tmp:
        p = pathlib.Path(tmp) / "p.html"
        p.write_text(html, encoding="utf-8")
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                        f"--force-device-scale-factor={scale}", f"--window-size={w},{h}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", p.as_uri()], check=True, capture_output=True, timeout=120)


def uri(p):
    return pathlib.Path(p).resolve().as_uri()


mark = bl.Mark(str(BF / "lamsatap-mark.svg"))
names = bl.read_names(bl.CONFIG)
report = {}

# ---------------- البند 1: المحاذاة وحدة الحافة العليا على 16 و32px ----------------
# نسخة الدائرة القديمة (مقياس 0.8 في النص) للمقارنة مع الجديدة (6/7 على حدود البكسل)
k, ox, oy = bl.framed(mark, 0.8)
old_circle = BF / "old-circle.svg"
old_circle.write_text(bl.svg_doc(names, (0, 0, 512, 512), f'<circle cx="256" cy="256" r="256" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, k, ox, oy)), encoding="utf-8")
new_k, new_ox, new_oy = bl.framed(mark, bl.ICO_SCALE, snap=True, dot_x=bl.ICO_DOT_X)
VARIANTS = [  # (الاسم، الملف، الخلفية، لون السطح، لون النقطة، التحويل k, ox, oy)
    ("favicon فاتح (تبويب أبيض)", LOGO / "lamsatap-icon.svg", WHITE, INK, SAFFRON, (1, 0, 0)),
    ("favicon داكن (تبويب #202124)", LOGO / "lamsatap-icon-dark.svg", "#202124", LIGHT, SAFFRON, (1, 0, 0)),
    ("ico الجديد: دائرة، 6/7 على البكسل", LOGO / "lamsatap-icon-circle.svg", "#FFFFFF", WHITE, SAFFRON, (new_k, new_ox, new_oy)),
    ("ico القديم: دائرة، 0.8 في النص", old_circle, "#FFFFFF", WHITE, SAFFRON, (k, ox, oy)),
]


def hex2rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)


def coverage(img, fg, bg):
    """نسبة تغطية كل بكسل بلون fg فوق bg (من القناة اللي فرقها أكبر)."""
    f, b = hex2rgb(fg), hex2rgb(bg)
    c = int(np.argmax(np.abs(f - b)))
    return np.clip((img[..., c] - b[c]) / (f[c] - b[c]), 0, 1)


item1 = []
tiles = []
for name, f, bg, fgc, dotc, (kk, oxx, oyy) in VARIANTS:
    for S in (16, 32):
        png = OUT / f"_{S}.png"
        # الدائرة نفسها حبر: الخلفية الفعلية حول الرمز = الحبر
        page_bg = bg
        shot(f'<!doctype html><html><body style="margin:0;background:{page_bg}"><img src="{uri(f)}" width="{S}" height="{S}" style="display:block"></body></html>', png, S, S)
        im = np.array(Image.open(png).convert("RGB"), float)
        local_bg = INK if "دائرة" in name else bg
        s = S / 512
        top = (mark.top * kk + oyy) * s                  # أعلى السطح وأعلى النقطة (نفس الخط)
        cx, r = (mark.cx * kk + oxx) * s, mark.r * kk * s
        row = int(math.floor(top + 1e-6))
        frac = top - row
        dot_cols = list(range(int(math.floor(cx - r)), int(math.ceil(cx + r))))
        cov_dot = coverage(im, dotc, local_bg)
        cov_srf = coverage(im, fgc, local_bg)
        mid = [c for c in dot_cols if abs(c + 0.5 - cx) < r * 0.6]
        d_top = max(cov_dot[row, c] for c in mid)
        d_above = max(cov_dot[row - 1, c] for c in dot_cols) if row > 0 else 0
        sx0 = (mark.left + 20) * kk + oxx
        sx1 = (mark.left + 120) * kk + oxx
        s_cols = list(range(int(math.ceil(sx0 * s)), int(math.floor(sx1 * s))))
        s_top = float(np.mean([cov_srf[row, c] for c in s_cols])) if s_cols else float("nan")
        s_above = float(max(cov_srf[row - 1, c] for c in s_cols)) if s_cols and row > 0 else 0.0
        item1.append(dict(variant=name, size=S, top_px=round(top, 3), off_grid=round(frac, 3),
                          dot_top_row=round(float(d_top) * 100), dot_row_above=round(float(d_above) * 100),
                          surface_top_row=round(s_top * 100), surface_row_above=round(s_above * 100)))
        kz = 12 if S == 16 else 7
        t = Image.open(png).convert("RGB").resize((S * kz, S * kz), Image.NEAREST)
        d = ImageDraw.Draw(t)
        for i in range(0, S * kz, kz):
            d.line([(i, 0), (i, S * kz)], fill=(128, 128, 128))
            d.line([(0, i), (S * kz, i)], fill=(128, 128, 128))
        y = int(top * kz)
        d.line([(0, y), (S * kz, y)], fill=(230, 40, 40), width=2)
        tiles.append((name, S, t))
        png.unlink()
report["item1"] = item1

# لوحة البند 1
W = sum(t.width for _, _, t in tiles[:2]) + 40
rows = [tiles[i:i + 2] for i in range(0, len(tiles), 2)]
Hh = sum(max(t.height for _, _, t in r) + 40 for r in rows)
board = Image.new("RGB", (W + 20, Hh + 20), "white")
try:
    fnt = ImageFont.truetype(str(REPO / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf"), 16)
except OSError:
    fnt = ImageFont.load_default()
yy = 10
for r in rows:
    xx = 10
    for name, S, t in r:
        board.paste(t, (xx, yy + 26))
        ImageDraw.Draw(board).text((xx, yy + 4), f"{S}px", fill=(20, 32, 31), font=fnt)
        xx += t.width + 20
    yy += max(t.height for _, _, t in r) + 40
board.save(OUT / "item1-pixels.png")

# ---------------- البند 2: صورة الحساب بإزاحة 16 لليمين ----------------
def avatar(shift):
    kk, oxx, oyy = bl.framed(mark, bl.AVATAR_SCALE, shift)
    f = OUT / f"avatar-shift{int(shift)}.svg"
    f.write_text(bl.svg_doc(names, (0, 0, 512, 512), f'<rect width="512" height="512" fill="{INK}"/>' + mark.body(WHITE, SAFFRON, kk, oxx, oyy)), encoding="utf-8")
    mx, my = mark.mass[0] * kk + oxx, mark.mass[1] * kk + oyy
    bx = ((mark.bbox[0] + mark.bbox[2]) / 2) * kk + oxx
    far = 0.0
    for c, a in mark.surface:
        if c in "ML":
            far = max(far, math.hypot(a[0] * kk + oxx - 256, a[1] * kk + oyy - 256))
    far = max(far, math.hypot(mark.cx * kk + oxx - 256, mark.cy * kk + oyy - 256) + mark.r * kk)
    return f, dict(shift=shift, mass=(round(mx, 1), round(my, 1)), mass_dx=round(mx - 256, 1), bbox_cx=round(bx, 1),
                   far=round(far, 1), inside_80=far <= 0.4 * 512)


a0, i0 = avatar(0)
a16, i16 = avatar(16)
report["item2"] = [i0, i16]


def wa(av_a, av_b, dark):
    bg, fg, sub, line = ("#0B141A", "#E9EDEF", "#8696A0", "#222D34") if dark else ("#FFFFFF", "#111B21", "#667781", "#E9EDEF")
    out = f'<div style="width:330px;background:{bg};direction:rtl;font-family:Segoe UI,Tahoma,Arial">'
    for av, lab in ((av_a, "لمسة تاب (بدون إزاحة)"), (av_b, "لمسة تاب (+16)"), (None, "كافيه المثال")):
        pic = (f'<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex:none"><img src="{uri(av)}" width="40" height="40"></div>'
               if av else '<div style="width:40px;height:40px;border-radius:50%;background:#6B7C85;flex:none"></div>')
        out += (f'<div style="display:flex;gap:12px;align-items:center;padding:10px 14px">{pic}<div style="flex:1;border-bottom:1px solid {line};padding-bottom:10px">'
                f'<div style="color:{fg};font-size:15px">{lab}</div><div style="color:{sub};font-size:13px">العرض جاهز</div></div></div>')
    return out + "</div>"


def ring(av, s):
    return f'<div style="width:{s}px;height:{s}px;border-radius:50%;overflow:hidden"><img src="{uri(av)}" width="{s}" height="{s}"></div>'


cross = lambda av: (f'<div style="position:relative;width:256px;height:256px"><img src="{uri(av)}" width="256" height="256" style="border-radius:50%">'
                    '<div style="position:absolute;left:127px;top:0;width:2px;height:256px;background:#E4572E"></div>'
                    '<div style="position:absolute;top:127px;left:0;height:2px;width:256px;background:#E4572E"></div></div>')
html = (f"<!doctype html><html><head><meta charset='utf-8'><style>@font-face{{font-family:RX;src:url('{FONT_URI}')}}"
        "body{margin:0;padding:16px;background:#fff;font:14px RX;color:#14201F}.r{display:flex;gap:18px;align-items:flex-end;margin:10px 0}</style></head><body>"
        f"<div class='r'><div>بدون إزاحة: الكتلة {i0['mass_dx']} عن المركز<br>{cross(a0)}</div><div>+16: الكتلة {i16['mass_dx']} عن المركز<br>{cross(a16)}</div></div>"
        f"<div class='r'>{ring(a0, 120)}{ring(a16, 120)}{ring(a0, 56)}{ring(a16, 56)}{ring(a0, 40)}{ring(a16, 40)}{ring(a0, 32)}{ring(a16, 32)}</div>"
        f"<div class='r'>{wa(a0, a16, False)}{wa(a0, a16, True)}</div></body></html>")
shot(html, OUT / "item2-avatar.png", 760, 760)
shot(html, OUT / "item2-avatar-2x.png", 760, 760, 2)

# ---------------- البند 3: المساحة الفارغة من حافة الحبر (ويمين القفل من حافة النقطة) ----------------
files, notes = bl.build(names, mark)
diag = []
for base, label in (("lamsatap-horizontal", "الأفقي"), ("lamsatap-horizontal-ar", "العربي بس"), ("lamsatap-logo", "الكامل (العمودي)")):
    n = notes[base]
    x, y, w, h = n["box"]
    c = bl.CLEAR * n["h"]
    scale = 360 / (h + 2 * c) if base == "lamsatap-logo" else 900 / (w + 2 * c)
    W_, H_ = (w + 2 * c) * scale, (h + 2 * c) * scale
    dr = (n["dot_right"] - x + c) * scale
    diag.append(f'<div style="margin:14px 0"><div>{label}: h = {n["h"]:.1f}، المساحة 0.5h = {c:.1f} (بوحدات الملف)، ويمينها من حافة النقطة</div>'
                f'<div style="position:relative;width:{W_:.0f}px;height:{H_:.0f}px;background:repeating-linear-gradient(45deg,#F3EEE6 0 6px,#fff 6px 12px);outline:1px dashed #E4572E">'
                f'<img src="{uri(LOGO / (base + ".svg"))}" style="position:absolute;left:{c * scale:.1f}px;top:{c * scale:.1f}px;width:{w * scale:.1f}px;height:{h * scale:.1f}px;background:#FAF7F2">'
                f'<div style="position:absolute;left:{dr:.1f}px;top:0;width:1px;height:{H_:.0f}px;background:#0B7A75"></div></div></div>')
mk = mark.bbox
c = bl.CLEAR * (mark.bottom - mark.top)
sc = 1.0
diag.append(f'<div style="margin:14px 0"><div>الرمز لحاله: المساحة نص ارتفاع السطح (112 من 512) من حافة الحبر، مو من حافة ملف 512 (هامشه 64 يمين ويسار)</div>'
            f'<div style="position:relative;width:{(mk[2] - mk[0] + 2 * c) * 0.6:.0f}px;height:{(mk[3] - mk[1] + 2 * c) * 0.6:.0f}px;background:repeating-linear-gradient(45deg,#F3EEE6 0 6px,#fff 6px 12px);outline:1px dashed #E4572E">'
            f'<img src="{uri(LOGO / "lamsatap-icon.svg")}" style="position:absolute;left:{(c - mk[0]) * 0.6:.1f}px;top:{(c - mk[1]) * 0.6:.1f}px;width:{512 * 0.6:.1f}px;height:{512 * 0.6:.1f}px"></div></div>')
html = (f"<!doctype html><html><head><meta charset='utf-8'><style>@font-face{{font-family:RX;src:url('{FONT_URI}')}}"
        "body{margin:0;padding:16px;background:#fff;font:14px RX;color:#14201F;direction:rtl}</style></head><body>" + "".join(diag) + "</body></html>")
shot(html, OUT / "item3-clearspace.png", 1000, 1500)
report["item3"] = {b: dict(h=round(notes[b]["h"], 2), clear=round(bl.CLEAR * notes[b]["h"], 2), file_h=round(notes[b]["box"][3], 2),
                           right_edge_is_dot=abs(notes[b]["box"][0] + notes[b]["box"][2] - notes[b]["dot_right"]) < 0.01)
                   for b in ("lamsatap-horizontal", "lamsatap-horizontal-ar", "lamsatap-logo")}

# ---------------- المقاسات الصغرى (البند 5، README) ----------------
def measure_region(svg, x0, x1, target_mm, dpi=1200):
    """نفس قياسات check_latin (الخط، والفراغ بين جزئين، والعيون المقفلة) على منطقة أفقية من الملف."""
    vx, vy, vw, vh = cl.viewbox(svg)
    hpx = target_mm / 25.4 * dpi
    img = cl.render_svg(svg, hpx * vw / vh, hpx, "#FFFFFF")
    ink = img[..., :3].mean(-1) < 128
    kx = ink.shape[1] / vw
    c0, c1 = max(0, int((x0 - vx) * kx)), min(ink.shape[1], int(math.ceil((x1 - vx) * kx)))
    sub = ink[:, c0:c1]
    p = 64
    pad = np.zeros((sub.shape[0] + 2 * p, sub.shape[1] + 2 * p), bool)
    pad[p:-p, p:-p] = sub
    mm = 25.4 / dpi
    line = cl.min_line(pad, 0)["value"] * mm
    pg, _, _ = cl.part_gaps(pad)
    wl, wk = cl.components(~pad, 1, 4)
    border = set(np.unique(np.concatenate([wl[0], wl[-1], wl[:, 0], wl[:, -1]]))) - {0}
    eyes = [cl.critical(np.pad(wl == i, 2, constant_values=False))[0] for i in wk if i not in border]
    vals = dict(line=line, gap=None if pg is None else pg * mm, eye=min(eyes) * mm if eyes else None)
    worst = min(v for v in vals.values() if v)
    return vals, target_mm * 0.3 / worst, worst / target_mm


sizes = {}
# العربي يتقاس مرة وحدة في ملف «العربي بس» (بدون السطر اللاتيني)، ويتحوّل لوحدات الملف لكل قفل
svg = LOGO / "lamsatap-horizontal-ar-mono.svg"
vx, vy, vw, vh = cl.viewbox(svg)
nb = bl.Name(names, False).ar.bounds
vals, _, ratio = measure_region(svg, nb[0] - 1, nb[2] + 1, 30.0)
u_ar = ratio * vh                     # أضيق شي في العربي بوحدات الملف (نفس المقياس في كل الأقفال)
sizes["arabic_worst_units"] = round(u_ar, 3)
sizes["arabic_at_30mm_ar_lockup"] = {k: (round(v, 3) if v else None) for k, v in vals.items()}
for base, kind in (("lamsatap-horizontal-ar", "العربي بس"), ("lamsatap-horizontal", "الأفقي"), ("lamsatap-logo", "الكامل")):
    fh = notes[base]["box"][3]
    sizes[kind] = dict(file_h_units=round(fh, 2),
                       arabic_engrave_min_mm=round(0.3 * fh / u_ar, 1),     # أضيق شي في العربي ≥ 0.3mm
                       arabic_screen_min_px=math.ceil(1.0 * fh / u_ar))    # أضيق شي في العربي ≥ 1px
report["sizes"] = sizes
(OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=1))
