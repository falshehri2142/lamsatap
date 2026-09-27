"""يصدّر نسخ PNG و favicon.ico من ملفات الرمز SVG عبر متصفح Edge بدون واجهة.

التشغيل من جذر المشروع (بعد build_logo.py):  python brand/src/export_png.py
تجربة على مجلد ثاني:  python brand/src/export_png.py <مجلد فيه ملفات build_logo.py>
يحتاج: Microsoft Edge أو Chrome، و Pillow (لملف ico فقط).
رمز واحد لكل الأحجام (نفس lamsatap-icon.svg من 16px إلى 512px)، فما فيه نسخة صغيرة منفصلة.
"""
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]

# (ملف المصدر، الحجم، اسم الناتج)
JOBS = [
    ("lamsatap-icon.svg", 512, "lamsatap-icon-512.png"),
    ("lamsatap-icon-fullbleed.svg", 180, "lamsatap-icon-180.png"),  # apple-touch-icon: مربع كامل، آيفون يدوّر الزوايا بنفسه
    ("lamsatap-icon.svg", 32, "lamsatap-icon-32.png"),
    ("lamsatap-icon.svg", 16, "lamsatap-icon-16.png"),
    ("lamsatap-icon.svg", 48, "lamsatap-icon-48.png"),
]


def render(browser, svg, size, out):
    html = (f'<!doctype html><html style="background:transparent"><body style="margin:0;background:transparent">'
            f'<img src="{svg.as_uri()}" width="{size}" height="{size}" style="display:block"></body></html>')
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=1", "--default-background-color=00000000",
                        f"--window-size={size},{size}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", page.as_uri()],
                       check=True, capture_output=True, timeout=60)


def main():
    logo = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "brand" / "logo"
    png = logo / "png"
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome")
    png.mkdir(parents=True, exist_ok=True)
    for src, size, name in JOBS:
        render(browser, logo / src, size, png / name)
        print(name, (png / name).stat().st_size, "bytes")
    from PIL import Image
    imgs = {s: Image.open(png / f"lamsatap-icon-{s}.png").convert("RGBA") for s in (16, 32, 48)}
    imgs[48].save(logo / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[imgs[16], imgs[32]])
    print("favicon.ico", (logo / "favicon.ico").stat().st_size, "bytes")
    for s in (16, 48):  # نسخ مساعدة للـ ico فقط
        (png / f"lamsatap-icon-{s}.png").unlink()


if __name__ == "__main__":
    main()
