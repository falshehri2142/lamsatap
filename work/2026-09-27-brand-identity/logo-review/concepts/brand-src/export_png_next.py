"""يصدّر PNG و favicon.ico و JPG الإيداع من ملفات build_logo.py عبر Edge بدون واجهة، ثم يعيد MANIFEST.txt.

التشغيل من جذر المشروع (بعد build_logo.py):  python brand/src/export_png.py
تجربة على مجلد ثاني:  python brand/src/export_png.py <مجلد فيه ملفات build_logo.py>
يحتاج: Microsoft Edge أو Chrome، و Pillow.
"""
import importlib.util
import os
import pathlib
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = next((d for d in [HERE, *HERE.parents] if (d / "brand" / "fonts" / "source").is_dir()), pathlib.Path.cwd())
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

# (ملف المصدر، المقاس، اسم الناتج، معتم؟)
JOBS = [
    ("lamsatap-avatar.svg", 1080, "lamsatap-avatar-1080.png", True),   # صورة الحساب: مربع مصمت بدون شفافية (التسويق بند 6)
    ("lamsatap-avatar.svg", 512, "lamsatap-icon-512.png", True),       # السوشال وأي مكان ما يقبل SVG
    ("lamsatap-avatar.svg", 180, "lamsatap-icon-180.png", True),       # apple-touch-icon: مربع كامل، آيفون يدوّر الزوايا بنفسه
    ("lamsatap-icon-circle.svg", 32, "lamsatap-icon-32.png", False),   # favicon احتياط للمتصفحات اللي ما تقرا SVG
    ("lamsatap-icon-circle.svg", 16, "_ico-16.png", False),
    ("lamsatap-icon-circle.svg", 48, "_ico-48.png", False),
]


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
    logo = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "brand" / "logo"
    png = logo / "png"
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome")
    png.mkdir(parents=True, exist_ok=True)
    from PIL import Image
    for src, size, name, opaque in JOBS:
        render(browser, logo / src, size, size, png / name, opaque)
        if opaque:  # بدون قناة شفافية أصلاً
            Image.open(png / name).convert("RGB").save(png / name)
        print(name, (png / name).stat().st_size, "bytes")
    imgs = {s: Image.open(png / f).convert("RGBA") for s, f in ((16, "_ico-16.png"), (32, "lamsatap-icon-32.png"), (48, "_ico-48.png"))}
    imgs[48].save(logo / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[imgs[16], imgs[32]])
    print("favicon.ico", (logo / "favicon.ico").stat().st_size, "bytes")
    for f in ("_ico-16.png", "_ico-48.png"):
        (png / f).unlink()
    # JPG الإيداع (loyer ق6): الشعار الكامل والأفقي لون واحد، أسود على أبيض
    import re
    for src, h, name in (("lamsatap-logo-mono.svg", 1200, "lamsatap-logo-mono.jpg"), ("lamsatap-horizontal-mono.svg", 600, "lamsatap-horizontal-mono.jpg")):
        s = (logo / src).read_text(encoding="utf-8")
        _, _, vw, vh = (float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split())
        w = round(h * vw / vh)
        pad = round(h * 0.25)
        tmp = png / "_jpg.png"
        render(browser, logo / src, w, h, tmp, True)
        im = Image.open(tmp).convert("RGB")
        canvas = Image.new("RGB", (w + 2 * pad, h + 2 * pad), "white")
        canvas.paste(im, (pad, pad))
        canvas.save(png / name, quality=95)
        tmp.unlink()
        print(name, (png / name).stat().st_size, "bytes")
    # النسخة المجمّدة: نعيد MANIFEST.txt بعد ما انضافت الصور
    src = next((HERE / f for f in ("build_logo.py", "build_logo_next.py") if (HERE / f).exists()), None)
    spec = importlib.util.spec_from_file_location("build_logo", src) if src else None
    if spec:
        bl = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(bl)
        bl.write_manifest(str(logo))


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    main()
