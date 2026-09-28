"""يبني الأيقونة المؤقتة للموقع لين يسلّم المدير العام الشعار v1.0.0 (GM-035).

على اتجاه GM-039 (الرمز أبيض على دائرة حبر): دائرة حبر #14201F، وفي نصها نقطة مصمتة بيضاء قطرها 40%
(علامة اللمس، GM-027)، لأن رمز الشعار نفسه عند المدير العام وما نلمسه. الأبيض على الحبر 16.72.
قبلها (الاتجاه 2 §3.7): مربع حبر بزوايا 22% ونقطة رملي. بدون حرف ولا زعفران ولا تيل. ما يلمس brand/logo/.

الناتج في brand/icons/:
  app-icon-temp.svg            (favicon.svg: دائرة، والزوايا شفافة)
  app-icon-temp-fullbleed.svg  (مصدر apple-touch-icon: مربع حبر كامل، لأن آيفون يدوّر الزوايا بنفسه ويسوّد الشفاف)
  png/app-icon-temp-180.png    (apple-touch-icon)
  app-icon-temp.ico            (favicon.ico: 16 و32 و48، من الدائرة)
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
INK, MARK = "#14201F", "#FFFFFF"
S = 512
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]
TITLE = "لمسة تاب"


def svg(circle):
    """circle=True: دائرة حبر (favicon). circle=False: مربع حبر كامل (مصدر أيقونة آيفون)."""
    dot_r = S * 0.40 / 2
    ground = (f'<circle cx="{S / 2:g}" cy="{S / 2:g}" r="{S / 2:g}" fill="{INK}"/>' if circle
              else f'<rect width="{S}" height="{S}" fill="{INK}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img" '
            f'aria-label="{TITLE}"><title>{TITLE}</title>{ground}'
            f'<circle cx="{S / 2:g}" cy="{S / 2:g}" r="{dot_r:g}" fill="{MARK}"/></svg>\n')


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
    rounded.write_text(svg(circle=True), encoding="utf-8", newline="\n")
    full.write_text(svg(circle=False), encoding="utf-8", newline="\n")
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
