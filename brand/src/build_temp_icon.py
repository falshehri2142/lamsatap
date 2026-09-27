"""يبني الأيقونة المؤقتة للموقع (الاتجاه 2 §3.7) لين يتقرر الشعار الجديد.

مربع حبر #14201F بزوايا 22%، وفي نصه نقطة مصمتة رملي #FAF7F2 قطرها 40% (علامة اللمس المعتمدة، GM-027).
بدون حرف ولا زعفران. «ب» مرفوض (GM-022)، وخلفية #075E5A متقاعدة (GM-026). ما يلمس brand/logo/.

الناتج في brand/icons/:
  app-icon-temp.svg            (favicon.svg: بزوايا)
  app-icon-temp-fullbleed.svg  (مصدر apple-touch-icon: مربع كامل، آيفون يدوّر الزوايا بنفسه)
  png/app-icon-temp-180.png    (apple-touch-icon)
  app-icon-temp.ico            (favicon.ico: 16 و32 و48)
التشغيل من جذر المشروع:  python brand/src/build_temp_icon.py
يحتاج: Microsoft Edge أو Chrome (للرسم)، و Pillow (لملف ico).
"""
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "brand" / "icons"
INK, SAND = "#14201F", "#FAF7F2"
S = 512
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]
TITLE = "لمسة تاب"


def svg(radius_ratio):
    r = round(S * radius_ratio, 2)
    dot_r = S * 0.40 / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img" '
            f'aria-label="{TITLE}"><title>{TITLE}</title>'
            f'<rect width="{S}" height="{S}" rx="{r:g}" fill="{INK}"/>'
            f'<circle cx="{S / 2:g}" cy="{S / 2:g}" r="{dot_r:g}" fill="{SAND}"/></svg>\n')


def render(browser, src, size, out):
    html = (f'<!doctype html><html style="background:transparent"><body style="margin:0;background:transparent">'
            f'<img src="{src.as_uri()}" width="{size}" height="{size}" style="display:block"></body></html>')
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=1", "--default-background-color=00000000",
                        f"--window-size={size},{size}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", page.as_uri()],
                       check=True, capture_output=True, timeout=60)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    (OUT / "png").mkdir(parents=True, exist_ok=True)
    rounded, full = OUT / "app-icon-temp.svg", OUT / "app-icon-temp-fullbleed.svg"
    rounded.write_text(svg(0.22), encoding="utf-8", newline="\n")
    full.write_text(svg(0), encoding="utf-8", newline="\n")
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome")
    render(browser, full, 180, OUT / "png" / "app-icon-temp-180.png")
    with tempfile.TemporaryDirectory() as tmp:
        frames = {}
        for size in (16, 32, 48):
            p = pathlib.Path(tmp) / f"i{size}.png"
            render(browser, rounded, size, p)
            from PIL import Image
            frames[size] = Image.open(p).convert("RGBA")
            frames[size].load()
        frames[48].save(OUT / "app-icon-temp.ico", sizes=[(16, 16), (32, 32), (48, 48)],
                        append_images=[frames[16], frames[32]])
    for f in (rounded, full, OUT / "png" / "app-icon-temp-180.png", OUT / "app-icon-temp.ico"):
        print(f"{f.relative_to(ROOT)}: {f.stat().st_size} bytes")


if __name__ == "__main__":
    main()
