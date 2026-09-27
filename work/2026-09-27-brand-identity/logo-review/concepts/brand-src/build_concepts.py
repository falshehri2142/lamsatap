"""مفاهيم web-brand الداخلية على اتجاه «الميلان» (web-art-director.md القسم 16). ما توصل صاحب المشروع.

التشغيل من جذر المشروع (يحتاج Edge و skia-pathops و numpy و opencv-python و Pillow):
  python work/2026-09-27-brand-identity/logo-review/concepts/brand-src/build_concepts.py            # الملفات والأوراق
  python .../build_concepts.py --check                                                             # ومعها check_logo.py و mark_test.py
الناتج في concepts/brand-1 إلى brand-4: ملفات SVG بأسماء check_logo.py، وأوراق PNG، ومجلد check/ و mark-test/.
"""
import argparse
import json
import math
import pathlib
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from geometry import Lean, num  # noqa: E402
import lockup as lk  # noqa: E402

ROOT = lk.ROOT
CONCEPTS_DIR = HERE.parent
FONT_URI = (ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf").as_uri()
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]

INK, LIGHT, WHITE, BLACK, SAFFRON = "#14201F", "#ECF2F0", "#FFFFFF", "#000000", "#F2A93B"
SAND, DARK_PAGE, TAB_DARK = "#FAF7F2", "#0E1615", "#202124"

# المفاهيم: كلها داخل «الميلان». الأطراف على مضاعفات 32، والنقطة حوافها على مضاعفات 32.
CONCEPTS = [
    dict(key="brand-1", title="الدافئ", s=48, r=32, d=128, dot=(384, 256), XL=64, XR=288,
         idea="ميلان هادي 12° وزوايا ناعمة 32 وسطح طولي، والنقطة 128 على 43% من الارتفاع. الوحيد اللي يدخل كل نطاقات المدير الفني (16.2) وكل بنود check_logo.",
         relax=[]),
    dict(key="brand-2", title="الدفعة", s=48, r=32, d=128, dot=(384, 224), XL=64, XR=288,
         idea="نفس سطح «الدافئ»، والنقطة مرفوعة للثلث العلوي (29%): تبان اللمسة عند أعلى السطح، والسطح مايل عنها. المسافة تكبر من 49 إلى 56.",
         relax=["ارتفاع النقطة 28.6% (المدى 30-45%): الشبكة ما تسمح لنقطة 128 إلا 28.6% أو 42.9%"]),
    dict(key="brand-3", title="الحادّ", s=64, r=16, d=128, dot=(384, 224), XL=64, XR=288,
         idea="أقصى ميلان 16° وزوايا حادة 16 وسطح طولي ضيق، والنقطة فوق. أدق شكل وأوضح «دفعة»، والمسافة 67 (أفضل من 64).",
         relax=["عرض السطح 170 (المدى 192-224)", "ارتفاع النقطة 28.6% (المدى 30-45%)"]),
    dict(key="brand-4", title="العريض", s=56, r=24, d=128, dot=(384, 224), XL=32, XR=288,
         idea="الوسط: ميلان 14° وزوايا 24 وسطح عريض 214 (شبه مربع)، والنقطة فوق. أثقل حضور للسطح.",
         relax=["أبعد نقطة 237 من المركز (هدف المدير الفني 224، والملزم 256)", "ارتفاع النقطة 28.6% (المدى 30-45%)",
                "مركز الإطار الخارجي منزاح 16 لليسار (السطح العريض والشبكة)"]),
]


# ---------- الرسم بالمتصفح ----------

def browser():
    import os
    b = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not b:
        raise SystemExit("ما لقيت Edge أو Chrome")
    return b


def shot(html, out, w, h, scale=1):
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([browser(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                        f"--force-device-scale-factor={scale}", f"--window-size={w},{h}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", page.as_uri()], check=True, capture_output=True, timeout=180)


def trim(png, bg=None, pad=16):
    from PIL import Image, ImageChops
    im = Image.open(png).convert("RGB")
    ref = Image.new("RGB", im.size, bg or im.getpixel((im.width - 1, im.height - 1)))
    box = ImageChops.difference(im, ref).getbbox()
    if box:
        x0, y0, x1, y1 = box
        im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))).save(png)


# ---------- ملفات SVG ----------

def svg_doc(names, vb, body, size=None):
    import html as H
    t = H.escape(f"{names[0]} — {names[1]}", quote=True)
    x, y, w, h = vb
    wh = f' width="{num(size[0])}" height="{num(size[1])}"' if size else f' width="{num(w)}" height="{num(h)}"'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x)} {num(y)} {num(w)} {num(h)}"{wh} role="img" '
            f'aria-label="{t}"><title>{t}</title>{body}</svg>\n')


def mark_body(L, fg, dot_fill, k=1.0, ox=0.0, oy=0.0):
    if fg == dot_fill:  # لون واحد: مسار واحد
        return f'<path fill="{fg}" d="{L.surface_d(k, ox, oy)}{L.dot_d(k, ox, oy)}"/>'
    return f'<path fill="{fg}" d="{L.surface_d(k, ox, oy)}"/><path fill="{dot_fill}" d="{L.dot_d(k, ox, oy)}"/>'


def lock_body(res, fg, dot_fill):
    d = res["surface"] + lk.path_d(res["text"])
    if fg == dot_fill:
        return f'<path fill="{fg}" d="{d}{res["dot"]}"/>'
    return f'<path fill="{fg}" d="{d}"/><path fill="{dot_fill}" d="{res["dot"]}"/>'


def favicon_svg(names, L):
    """favicon بدون خلفية ويتكيف: فاتح = سطح حبر، داكن = سطح #ECF2F0. النقطة زعفران بالوضعين."""
    body = (f'<style>.s{{fill:{INK}}}@media (prefers-color-scheme:dark){{.s{{fill:{LIGHT}}}}}</style>'
            f'<path class="s" d="{L.surface_d()}"/><path fill="{SAFFRON}" d="{L.dot_d()}"/>')
    return svg_doc(names, (0, 0, 512, 512), body)


def avatar_svg(names, L, size=512):
    """صورة الحساب: مربع حبر مصمت، والرمز داخل دائرة 80% في النص (السطح أبيض والنقطة زعفران)."""
    k = 0.8 * size / 512
    o = (size - 512 * k) / 2
    return svg_doc(names, (0, 0, size, size), f'<rect width="{size}" height="{size}" fill="{INK}"/>' + mark_body(L, WHITE, SAFFRON, k, o, o))


def write_files(c, L, names, out):
    f = {}
    f["icon"] = svg_doc(names, (0, 0, 512, 512), mark_body(L, WHITE, SAFFRON))           # على الحبر (صورة الحساب)
    f["icon-ink"] = svg_doc(names, (0, 0, 512, 512), mark_body(L, INK, SAFFRON))         # على الفاتح
    f["icon-dark"] = svg_doc(names, (0, 0, 512, 512), mark_body(L, LIGHT, SAFFRON))      # على الداكن (#ECF2F0)
    f["icon-mono"] = svg_doc(names, (0, 0, 512, 512), mark_body(L, BLACK, BLACK))        # لون واحد، موجب للحفر
    f["icon-mono-white"] = svg_doc(names, (0, 0, 512, 512), mark_body(L, WHITE, WHITE))
    f["favicon"] = favicon_svg(names, L)
    f["avatar"] = avatar_svg(names, L)
    hz = lk.horizontal(L, names)
    ar = lk.horizontal(L, names, latin=False)
    vt = lk.vertical(L, names, mark_k=1.3)
    for key, res in (("horizontal", hz), ("horizontal-ar", ar), ("logo", vt)):
        f[key] = svg_doc(names, res["box"], lock_body(res, INK, SAFFRON))
        f[key + "-dark"] = svg_doc(names, res["box"], lock_body(res, LIGHT, SAFFRON))
        f[key + "-mono"] = svg_doc(names, res["box"], lock_body(res, BLACK, BLACK))
    out.mkdir(parents=True, exist_ok=True)
    paths = {}
    for k_, s in f.items():
        p = out / f"{c['key']}-{k_}.svg"
        p.write_text(s, encoding="utf-8", newline="\n")
        paths[k_] = p
    return paths, dict(horizontal=hz, ar=ar, vertical=vt)


# ---------- الأوراق ----------

CSS = (f"@font-face{{font-family:RX;src:url('{FONT_URI}');font-weight:160 700}}"
       "body{margin:0;background:#fff;font-family:RX,Arial;color:#14201F}"
       ".sec{padding:20px 28px;border-top:1px solid #E4DCD0}.h{font-weight:600;font-size:18px;margin:0 0 10px;direction:rtl}"
       ".note{font-size:13px;color:#56625F;direction:rtl;margin:4px 0 10px}.row{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}"
       ".lab{font-size:11px;color:#56625F;text-align:center;margin-top:4px}img{display:block}")


def uri(p):
    return pathlib.Path(p).resolve().as_uri()


def cell(inner, bg, pad=10, lab=None, w=None):
    ww = f"width:{w}px;" if w else ""
    l = f'<div class="lab">{lab}</div>' if lab else ""
    return f'<div><div style="background:{bg};padding:{pad}px;{ww}display:flex;align-items:flex-end;gap:12px">{inner}</div>{l}</div>'


def img(p, w, h=None, extra=""):
    h = h or w
    return f'<img src="{uri(p)}" style="width:{w}px;height:{h}px;{extra}">'


def pixel_zoom(c, files, out):
    """16 و32px على أبيض وعلى تبويب داكن، مرسومة على 1x ومكبّرة بدون تنعيم (بكسل = مربع)."""
    from PIL import Image
    html = f"<!doctype html><html><head><style>body{{margin:0}}</style></head><body>"
    spots = []
    x = 0
    for bg, f_ in ((WHITE, files["icon-ink"]), (TAB_DARK, files["icon-dark"]), (INK, files["icon"])):
        for s in (16, 32):
            html += f'<div style="position:absolute;left:{x}px;top:0;width:{s + 8}px;height:{s + 8}px;background:{bg}"><img src="{uri(f_)}" style="position:absolute;left:4px;top:4px;width:{s}px;height:{s}px"></div>'
            spots.append((x, s, bg))
            x += s + 16
    html += "</body></html>"
    raw = out / "_zoom-raw.png"
    shot(html, raw, x + 10, 50)
    im = Image.open(raw).convert("RGB")
    tiles = []
    for x0, s, bg in spots:
        t = im.crop((x0, 0, x0 + s + 8, s + 8))
        k = 12 if s == 16 else 7
        tiles.append(t.resize((t.width * k, t.height * k), Image.NEAREST))
    W = sum(t.width for t in tiles) + 16 * (len(tiles) - 1)
    Hh = max(t.height for t in tiles)
    sheet = Image.new("RGB", (W, Hh), "white")
    xx = 0
    for t in tiles:
        sheet.paste(t, (xx, Hh - t.height))
        xx += t.width + 16
    p = out / f"{c['key']}-pixels.png"
    sheet.save(p)
    raw.unlink()
    return p


def wa_list(files, dark):
    bg, fg, sub, line = ("#0B141A", "#E9EDEF", "#8696A0", "#222D34") if dark else ("#FFFFFF", "#111B21", "#667781", "#E9EDEF")
    rows = [("لمسة تاب", "العرض جاهز، أرسل لك الملف الحين؟", None),
            ("كافيه المثال", "تمام، نشوفكم بكرة الساعة 4", "#6B7C85"),
            ("مورد الستاندات", "الطلب طلع من المستودع", "#9AA7AE"),
            ("شقق المثال", "شكراً على التركيب", "#7E8D95")]
    out = f'<div style="width:360px;background:{bg};direction:rtl;font-family:Segoe UI,Tahoma,Arial">'
    for name, msg, col in rows:
        av = (f'<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex:none">{img(files["avatar"], 40)}</div>' if col is None
              else f'<div style="width:40px;height:40px;border-radius:50%;background:{col};flex:none"></div>')
        out += (f'<div style="display:flex;gap:12px;align-items:center;padding:10px 14px">{av}<div style="flex:1;border-bottom:1px solid {line};padding-bottom:10px">'
                f'<div style="color:{fg};font-size:15px">{name}</div><div style="color:{sub};font-size:13px">{msg}</div></div></div>')
    return out + "</div>"


def tabs(files, dark):
    bar, act, fg = ("#202124", "#35363A", "#E8EAED") if dark else ("#DEE1E6", "#FFFFFF", "#202124")
    f_ = files["icon-dark"] if dark else files["icon-ink"]
    t = lambda a, title, ico: (f'<div style="display:flex;align-items:center;gap:8px;width:190px;height:34px;padding:0 12px;'
                               f'background:{act if a else bar};border-radius:8px 8px 0 0;color:{fg};font:12px Segoe UI,Arial;direction:rtl">'
                               f'{ico}<span>{title}</span></div>')
    ico = img(f_, 16)
    gen = f'<div style="width:16px;height:16px;border-radius:50%;background:{"#5F6368" if dark else "#9AA0A6"}"></div>'
    return (f'<div style="display:flex;gap:2px;background:{bar};padding:8px 8px 0;width:600px;direction:rtl">'
            f'{t(True, "لمسة تاب", ico)}{t(False, "بريد", gen)}{t(False, "التقويم", gen)}</div>')


def sheet(c, L, m, files, lock, out, names):
    sizes = (16, 24, 32, 40, 48, 64)
    bgs = [("أبيض", WHITE, files["icon-ink"], files["icon-mono"]), ("رملي", SAND, files["icon-ink"], files["icon-mono"]),
           ("حبر", INK, files["icon"], files["icon-mono-white"]), ("تبويب داكن #202124", TAB_DARK, files["icon-dark"], files["icon-mono-white"])]
    H = [f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>"]
    relax = (f"<div class='note' style='color:#8A4B00'>يرخّي: {' · '.join(c['relax'])}</div>" if c["relax"]
             else "<div class='note' style='color:#0B5F3A'>داخل كل نطاقات 16.2 وبنود الفحص الملزمة</div>")
    H.append(f"<div class='sec' style='border:0;direction:rtl'><div style='font-size:28px;font-weight:600'>{c['key']} «{c['title']}»</div>"
             f"<div class='note' style='font-size:15px'>{c['idea']}</div>" + relax +
             f"<div class='note'>الميلان {c['s']} ({m['angle']:.1f}°) · السطح {m['W']:.1f}×224 (نسبة {m['ratio']:.2f}) · الزوايا {c['r']} · "
             f"النقطة {c['d']} ({c['d'] / 512:.3f}) مركزها ({c['dot'][0]}، {c['dot'][1]}) على {m['dot_height'] * 100:.0f}% من ارتفاع السطح · "
             f"المسافة {m['gap']:.1f} ({m['gap'] / 512:.3f}) · بعد النقطة عن المركز {m['offset']:.3f} · أبعد نقطة {m['far']:.0f} من 256 · مساحة الحفر {m['engrave'] * 100:.1f}%</div></div>")
    # 256px على أربع خلفيات
    H.append("<div class='sec'><div class='h'>الرمز 256px</div><div class='row'>")
    for name, bg, f_, _ in bgs:
        H.append(cell(img(f_, 256), bg, 12, name))
    H.append(cell(img(files["icon-mono"], 256), WHITE, 12, "لون واحد (موجب للحفر)"))
    H.append("</div></div>")
    # شبكة الأحجام
    H.append("<div class='sec'><div class='h'>16 · 24 · 32 · 40 · 48 · 64px: ملون، لون واحد، رمادي (1x، بكسلات حقيقية)</div>")
    H.append("<div style='display:grid;grid-template-columns:repeat(3,auto);gap:10px 26px;justify-content:start'>")
    for name, bg, f_, mono in bgs:
        for mode, src, flt in (("ملون", f_, ""), ("لون واحد", mono, ""), ("رمادي", f_, "filter:grayscale(1)")):
            inner = "".join(img(src, s, extra=flt) for s in sizes)
            H.append(cell(inner, bg, 10, f"{name} · {mode}"))
    H.append("</div></div>")
    # تكبير البكسلات
    pz = pixel_zoom(c, files, out)
    H.append(f"<div class='sec'><div class='h'>16 و32px مكبّرة (كل مربع = بكسل): على أبيض، وتبويب داكن، وحبر</div><img src='{uri(pz)}'></div>")
    # صورة الحساب
    H.append("<div class='sec'><div class='h'>صورة الحساب (مربع حبر، والرمز داخل 80%): 120 · 56 · 40 · 32px</div><div class='row'>")
    for name, bg in (("صفحة فاتحة", WHITE), ("#121212", "#121212"), ("أسود", BLACK)):
        for flt in ("", "filter:grayscale(1)"):
            inner = "".join(f'<div style="width:{s}px;height:{s}px;border-radius:50%;overflow:hidden;{flt}">{img(files["avatar"], s)}</div>' for s in (120, 56, 40, 32))
            H.append(cell(inner, bg, 12, name + (" · رمادي" if flt else "")))
    H.append("</div></div>")
    # واتساب والتبويب
    H.append(f"<div class='sec'><div class='h'>قائمة واتساب 40px (فاتح وداكن، رسم تقريبي) · favicon على تبويب فاتح وداكن (16px)</div>"
             f"<div class='row' style='align-items:flex-start'>{wa_list(files, False)}{wa_list(files, True)}"
             f"<div style='display:flex;flex-direction:column;gap:14px'>{tabs(files, False)}{tabs(files, True)}</div></div></div>")
    # الأقفال
    hz, ar, vt = lock["horizontal"], lock["ar"], lock["vertical"]
    wh = lambda res, Hh: Hh * res["box"][2] / res["box"][3]
    H.append("<div class='sec'><div class='h'>القفل الأفقي (الأساسي) 120px و48px · العربي بس 48px · فاتح وداكن ولون واحد</div>")
    for (bg, sfx) in ((SAND, ""), (DARK_PAGE, "-dark"), (WHITE, "-mono")):
        H.append("<div class='row' style='margin-bottom:12px'>")
        H.append(cell(img(files["horizontal" + sfx], wh(hz, 120), 120), bg, 20))
        H.append(cell(img(files["horizontal" + sfx], wh(hz, 48), 48), bg, 20))
        H.append(cell(img(files["horizontal-ar" + sfx], wh(ar, 48), 48), bg, 20))
        H.append("</div>")
    H.append("</div>")
    H.append("<div class='sec'><div class='h'>القفل العمودي (الكامل) 240px: فاتح وداكن ولون واحد</div><div class='row'>")
    for bg, sfx in ((SAND, ""), (DARK_PAGE, "-dark"), (WHITE, "-mono")):
        H.append(cell(img(files["logo" + sfx], wh(vt, 240), 240), bg, 24))
    H.append("</div></div></body></html>")
    p = out / f"{c['key']}-sheet.png"
    shot("".join(H), p, 1500, 4200)
    trim(p, (255, 255, 255))
    return p


# ---------- الفحص ----------

def run_checks(c, files, lock, out):
    import os
    env = dict(os.environ)
    check_dir = out / "check"
    cmd = [sys.executable, str(ROOT / "brand" / "src" / "check_logo.py"), "--icon", str(files["icon"]), "--mono", str(files["icon-mono"]),
           "--full-mono", str(files["logo-mono"]), "--horizontal-mono", str(files["horizontal-mono"]),
           "--horizontal-mm", "19", "--full-mm", "42", "--out", str(check_dir)]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", env=env)
    (check_dir / "run.txt").write_text(" ".join(cmd) + "\n\n" + r.stdout + r.stderr, encoding="utf-8")
    # البند 8 بالسطر اللاتيني المعروف مكانه (كشف السطر في check_logo يفترض الرمز على طرف الملف وبطوله)
    latin = latin_item8(files, lock, check_dir)
    mt_dir = out / "mark-test"
    cmd2 = [sys.executable, str(ROOT / "work" / "2026-09-27-brand-identity" / "logo-review" / "mark-test" / "mark_test.py"),
            "--color", str(files["icon-ink"]), "--mono", str(files["icon-mono"]), "--color-dark", str(files["icon"]),
            "--touch", f"{c['dot'][0] / 512:.4f},{c['dot'][1] / 512:.4f}", "--out", str(mt_dir)]
    r2 = subprocess.run(cmd2, capture_output=True, text=True, encoding="utf-8", env=env)
    (mt_dir / "run.txt").write_text(" ".join(cmd2) + "\n\n" + r2.stdout + r2.stderr, encoding="utf-8")
    return r.returncode, latin


def latin_item8(files, lock, out):
    """نفس check_latin في check_logo.py حرفياً، بس السطر اللاتيني نعطيه مكانه من التركيب بدل الكشف الآلي."""
    sys.path.insert(0, str(ROOT / "brand" / "src"))
    import check_logo as cl
    cl.LATIN_TARGET_MM.update(horizontal=19.0, full=42.0)
    rep = cl.Report("البند 8 (السطر اللاتيني بمكانه المعروف)")
    orig = cl.latin_band
    for kind, key, res in (("horizontal", "horizontal-mono", lock["horizontal"]), ("full", "logo-mono", lock["vertical"])):
        x, y, w, h = res["box"]
        bx0, by0, bx1, by1 = res["latin_box"]
        hpx = cl.LATIN_TARGET_MM[kind] / 25.4 * 1200
        k = hpx / h

        def band(ink, bx0=bx0, by0=by0, bx1=bx1, by1=by1, x=x, y=y, k=k):
            H_, W_ = ink.shape
            r0, r1 = max(0, int((by0 - y) * k) - 2), min(H_, int(math.ceil((by1 - y) * k)) + 2)
            c0, c1 = max(0, int((bx0 - x) * k) - 2), min(W_, int(math.ceil((bx1 - x) * k)) + 2)
            return r0, r1, c0, c1
        cl.latin_band = band
        cl.check_latin(rep, files[key], kind, out, "latin")
    cl.latin_band = orig
    txt = rep.text()
    (out / "item8-latin.txt").write_text(txt + "\n", encoding="utf-8")
    return txt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only")
    a = ap.parse_args()
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")
    names = lk.bl.read_names(str(ROOT / "website" / "config.js"))
    summary = {}
    for c in CONCEPTS:
        if a.only and c["key"] != a.only:
            continue
        L = Lean(c["s"], c["r"], c["d"], c["dot"], c["XL"], c["XR"])
        m = L.metrics()
        out = CONCEPTS_DIR / c["key"]
        files, lock = write_files(c, L, names, out)
        sp = sheet(c, L, m, files, lock, out, names)
        info = {k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items() if k not in ("vertices",)}
        info["vertices"] = [tuple(round(v, 2) for v in p) for p in m["vertices"]]
        info["lockup_h_units"] = round(lock["horizontal"]["h"], 2)
        print(c["key"], "sheet", sp.name, json.dumps({k: info[k] for k in ("W", "angle", "gap", "offset", "dot_height", "far", "engrave")}, ensure_ascii=False))
        if a.check:
            rc, latin = run_checks(c, files, lock, out)
            print(c["key"], "check_logo exit", rc)
            print(latin)
        summary[c["key"]] = info
        (out / f"{c['key']}-geometry.json").write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
