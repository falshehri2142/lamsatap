import os
import pathlib
import subprocess
import tempfile

BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]


def shot(html, out, w, h, scale=1):
    browser = next(b for b in BROWSERS if os.path.exists(b))
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "p.html"
        page.write_text(html, encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                        f"--force-device-scale-factor={scale}", f"--window-size={w},{h}", f"--user-data-dir={tmp}",
                        f"--screenshot={out}", page.as_uri()], check=True, capture_output=True, timeout=180)
