"""يصدّر PNG و favicon.ico و JPG الإيداع من ملفات build_logo.py عبر Edge بدون واجهة، ثم يعيد MANIFEST.txt.

التشغيل من جذر المشروع (بعد build_logo.py):  python brand/src/export_png.py
تجربة على مجلد ثاني:  python brand/src/export_png.py <مجلد فيه ملفات build_logo.py>
يحتاج: Microsoft Edge أو Chrome، و Pillow.

- صورة الحساب 1080 و512، وأيقونة آيفون 180: مربع حبر مصمت بدون شفافية (التسويق بند 6، والموجز 16.4).
- favicon.ico (16 و32 و48) و PNG 32: دائرة حبر، احتياط للمتصفحات اللي ما تقرا favicon بصيغة SVG.
- JPG الإيداع (loyer ق6): الكامل والأفقي لون واحد، أسود على أبيض، بهامش ربع الارتفاع.
"""
import os
import pathlib
import re
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_logo as bl  # noqa: E402

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

# (ملف المصدر، المقاس، اسم الناتج، معتم؟)
JOBS = [
    ("lamsatap-avatar.svg", 1080, "png/lamsatap-avatar-1080.png", True),     # صورة الحساب لكل المنصات
    ("lamsatap-avatar.svg", 512, "png/lamsatap-icon-512.png", True),         # السوشال وأي مكان ما يقبل SVG
    ("lamsatap-avatar.svg", 180, "png/lamsatap-icon-180.png", True),         # apple-touch-icon: آيفون يدوّر الزوايا بنفسه
    ("lamsatap-icon-circle.svg", 32, "png/lamsatap-icon-32.png", False),     # favicon احتياط
    ("lamsatap-icon-circle.svg", 16, "png/_ico-16.png", False),
    ("lamsatap-icon-circle.svg", 48, "png/_ico-48.png", False),
]
JPGS = [("lamsatap-logo-mono.svg", 1200, "png/lamsatap-logo-mono.jpg"), ("lamsatap-horizontal-mono.svg", 600, "png/lamsatap-horizontal-mono.jpg")]


def render(browser, svg, w, h, out, opaque):
    bg = "#FFFFFF" if opaque else "transparent"
    html = (f'<!doctype html><html style="background:{bg}"><body style="margin:0;background:{bg}">'
            f'<img src="{svg.as_uri()}" width="{w}" height="{h}" style="display:block"></body></html>')
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        args = [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                f"--window-size={w},{h}", f"--user-data-dir={tmp}", f"--screenshot={out}", page.as_uri()]
        if not opaque:
            args.insert(4, "--default-background-color=00000000")
        subprocess.run(args, check=True, capture_output=True, timeout=60)


def main():
    logo = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(bl.OUT)
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome")
    (logo / "png").mkdir(parents=True, exist_ok=True)
    from PIL import Image
    for src, size, name, opaque in JOBS:
        out = logo / name
        render(browser, logo / src, size, size, out, opaque)
        if opaque:  # بدون قناة شفافية أصلاً
            Image.open(out).convert("RGB").save(out)
        if not name.startswith("png/_"):
            print(name, out.stat().st_size, "bytes")
    imgs = {s: Image.open(logo / f).convert("RGBA") for s, f in ((16, "png/_ico-16.png"), (32, "png/lamsatap-icon-32.png"), (48, "png/_ico-48.png"))}
    imgs[48].save(logo / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[imgs[16], imgs[32]])
    print("favicon.ico", (logo / "favicon.ico").stat().st_size, "bytes")
    for f in ("png/_ico-16.png", "png/_ico-48.png"):
        (logo / f).unlink()
    for src, h, name in JPGS:
        s = (logo / src).read_text(encoding="utf-8")
        _, _, vw, vh = (float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split())
        w, pad = round(h * vw / vh), round(h * 0.25)
        tmp = logo / "png" / "_jpg.png"
        render(browser, logo / src, w, h, tmp, True)
        canvas = Image.new("RGB", (w + 2 * pad, h + 2 * pad), "white")
        canvas.paste(Image.open(tmp).convert("RGB"), (pad, pad))
        canvas.save(logo / name, quality=95)
        tmp.unlink()
        print(name, (logo / name).stat().st_size, "bytes")
    made = {n for _, _, n, _ in JOBS if not n.startswith("png/_")} | {n for _, _, n in JPGS} | {"favicon.ico"}
    assert made == set(bl.EXPORT_FILES), "ملفات export_png.py ما تطابق EXPORT_FILES في build_logo.py"
    bl.write_manifest(str(logo))


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    main()
