"""Shared boards for the four web-illustrator concepts (AD 16.6 items 2 and 4):
- board-letters.png: each concept at 32 and 256px next to Arabic (Naskh and Kufi-like), Latin and digits.
- board-compare.png: each concept at 32 and 56px next to simplified competitor/reference marks WE drew (no downloads),
  on white and black, colour and grey."""
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import concepts as C  # noqa
from shot import shot  # noqa

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
CDIR = ROOT / "work" / "2026-09-27-brand-identity" / "logo-review" / "concepts"
BDIR = CDIR / "illus-boards"
FONT = (ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf").as_uri()
IDS = list(C.CONCEPTS)


def u(p):
    return pathlib.Path(p).as_uri()


def trim(path, pad=16):
    im = Image.open(path).convert("RGB")
    a = np.array(im.convert("L"))
    rows, cols = np.where(a.min(1) < 250)[0], np.where(a.min(0) < 250)[0]
    if len(rows) and len(cols):
        im.crop((0, 0, min(im.width, cols.max() + pad), min(im.height, rows.max() + pad))).save(path, optimize=True)


def letters():
    small = ["ب", "ت", "ن", "ف", "ق", "ا.", "ـبـ", "١", "٦", "٧", "1", "7", "7.", "I", "l", "i", "D.", "b", "P", "B."]
    large = ["D.", "ا.", "٦", "٧", "b"]
    css = (f'@font-face{{font-family:RX;src:url("{FONT}");font-weight:160 700}}body{{margin:0;background:#fff;font-family:Tahoma}}'
           '.c{display:inline-flex;align-items:center;justify-content:center;background:#FAF7F2;margin:2px;color:#14201F}'
           '.t{font:12px Tahoma;color:#56625F}')
    rows = ['<div style="padding:10px 16px;direction:rtl;font:15px Tahoma;color:#14201F">لوحة الحرف (المدير الفني 16.6 بند 2): '
            'كل مفهوم على 32 و256px جنب حروف عربية بخط Readex Pro (قريب من الكوفي الحديث) وSakkal Majalla (نسخ)، وحروف لاتينية وأرقام بخط Arial. '
            'السؤال لكل خانة: يشبهه؟</div>']
    for cid in IDS:
        icon = CDIR / cid / f"{cid}-icon-ink.svg"
        cells32 = "".join(f'<span class="c" style="width:40px;height:40px;font:600 26px {fam}">{t}</span>'
                          for fam in ("RX", "'Sakkal Majalla'") for t in small[:7]) + \
            "".join(f'<span class="c" style="width:40px;height:40px;font:700 26px Arial">{t}</span>' for t in small[7:])
        cells256 = "".join(f'<span class="c" style="width:256px;height:256px;font:600 190px RX">{t}</span>' for t in large)
        rows.append(f'<div style="padding:8px 16px;border-top:1px solid #E4DCD0"><div class="t">{cid} «{C.NAMES[cid]}»</div>'
                    f'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="c" style="width:40px;height:40px">'
                    f'<img src="{u(icon)}" width="32" height="32"></span>{cells32}</div>'
                    f'<div style="display:flex;gap:6px;margin-top:6px"><span class="c" style="width:256px;height:256px">'
                    f'<img src="{u(icon)}" width="256" height="256"></span>{cells256}</div></div>')
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(rows)}</body></html>'
    out = BDIR / "board-letters.png"
    shot(html, str(out), 1640, 1500)
    trim(out)
    return out


# simplified reference marks, drawn by us in a 100x100 box (approximations for comparison only)
REF = {
    "Tap Payments": '<circle cx="40" cy="50" r="24" fill="none" stroke="#4B4847" stroke-width="10"/><circle cx="60" cy="50" r="24" fill="none" stroke="#4B4847" stroke-width="10"/>',
    "Lamsa": '<circle cx="20" cy="56" r="8" fill="#6DBFAE"/><circle cx="44" cy="53" r="12" fill="#D33D5C"/><circle cx="74" cy="49" r="17" fill="#5B3296"/>',
    "فودكس": '<rect x="8" y="8" width="84" height="84" rx="20" fill="#5A2A82"/><text x="44" y="72" font-family="Arial" font-weight="700" font-size="60" fill="#fff" text-anchor="middle">f</text><circle cx="66" cy="68" r="6" fill="#fff"/>',
    "Booking": '<rect x="8" y="8" width="84" height="84" rx="20" fill="#003B95"/><text x="46" y="72" font-family="Arial" font-weight="700" font-size="56" fill="#fff" text-anchor="middle">B</text><circle cx="72" cy="67" r="6" fill="#fff"/>',
    "تابي": '<rect x="8" y="8" width="84" height="84" rx="20" fill="#3EEDBF"/><text x="50" y="74" font-family="Arial" font-weight="700" font-size="64" fill="#000" text-anchor="middle">t</text>',
    "سلة": '<rect x="8" y="8" width="84" height="84" rx="22" fill="#BAF3E6"/><path d="M30 42h40l-5 34H35z" fill="none" stroke="#004956" stroke-width="7" stroke-linejoin="round"/><path d="M40 42v-8a10 10 0 0 1 20 0v8" fill="none" stroke="#004956" stroke-width="6"/><path d="M41 58q9 8 18 0" fill="none" stroke="#004956" stroke-width="5" stroke-linecap="round"/>',
    "جاذر إن": '<rect x="8" y="8" width="84" height="84" rx="20" fill="#4B2E83"/><path d="M32 76V48a18 18 0 0 1 36 0v28" fill="none" stroke="#FF9750" stroke-width="12"/>',
    "تقييم": '<path d="M50 20a30 30 0 0 1 30 30" stroke="#4285F4" stroke-width="12" fill="none"/><path d="M80 50a30 30 0 0 1-30 30" stroke="#34A853" stroke-width="12" fill="none"/><path d="M50 80a30 30 0 0 1-30-30" stroke="#FBBC05" stroke-width="12" fill="none"/><path d="M20 50a30 30 0 0 1 30-30" stroke="#EA4335" stroke-width="12" fill="none"/>',
    "RATECARDS": '<circle cx="50" cy="50" r="44" fill="#000"/><path d="M36 64a18 18 0 0 1 0-28M28 72a30 30 0 0 1 0-44M20 80a42 42 0 0 1 0-60" stroke="#fff" stroke-width="6" fill="none" transform="rotate(180 50 50) translate(10 0)"/>',
    "360TapIt": '<circle cx="42" cy="56" r="20" fill="none" stroke="#1E6FD9" stroke-width="8"/><circle cx="60" cy="56" r="20" fill="none" stroke="#1E6FD9" stroke-width="8"/><path d="M34 26a26 26 0 0 1 34 0" stroke="#1E6FD9" stroke-width="7" fill="none"/>',
    "NexNFC": '<text x="50" y="60" font-family="Arial" font-weight="700" font-size="26" fill="#1D4ED8" text-anchor="middle">nexnfc</text>',
    "pixel-nfc (ألوان بس)": '<rect x="8" y="8" width="84" height="84" rx="12" fill="#111111"/><rect x="22" y="44" width="56" height="14" fill="#F59E0B"/>',
    "لتين": '<text x="50" y="62" font-family="Arial" font-weight="700" font-size="30" fill="#005A5A" text-anchor="middle">lateen</text>',
    "Square": '<rect x="12" y="12" width="76" height="76" rx="16" fill="none" stroke="#000" stroke-width="10"/><rect x="36" y="36" width="28" height="28" rx="4" fill="#000"/>',
    "Stripe": '<rect x="8" y="8" width="84" height="84" rx="20" fill="#635BFF"/><text x="50" y="72" font-family="Arial" font-weight="700" font-size="60" fill="#fff" text-anchor="middle">S</text>',
    "Airbnb": '<path d="M50 84C38 70 22 54 30 38c6-12 34-12 40 0 8 16-8 32-20 46zM50 20l-4 8" fill="none" stroke="#FF5A5F" stroke-width="9" stroke-linejoin="round"/><circle cx="50" cy="56" r="9" fill="none" stroke="#FF5A5F" stroke-width="7"/>',
    "Toast": '<path d="M24 86V44c-8-4-8-24 10-26h32c18 2 18 22 10 26v42z" fill="#FF4C00"/>',
    "Apple": '<path d="M50 34c-10-8-34-6-32 22 2 22 14 34 22 34 4 0 6-2 10-2s6 2 10 2c8 0 16-10 20-22-10-4-12-20-2-26-6-8-18-10-28-8z" fill="#000"/><path d="M50 30c0-8 6-14 14-14 0 8-6 14-14 14z" fill="#000"/>',
    "Nike": '<path d="M10 64c10 18 34 14 84-30-40 26-64 34-72 30-6-3-6-8-2-16-6 4-12 10-10 16z" fill="#000"/>',
    "Google": '<text x="50" y="72" font-family="Arial" font-weight="700" font-size="64" fill="#4285F4" text-anchor="middle">G</text>',
    "واتساب": '<circle cx="50" cy="50" r="42" fill="#25D366"/><path d="M50 26a24 24 0 0 0-21 36l-4 12 12-4a24 24 0 1 0 13-44z" fill="none" stroke="#fff" stroke-width="6"/>',
}


def compare():
    cols = []
    for cid in IDS:
        cols.append((f"{cid}", "avatar", CDIR / cid / f"{cid}-avatar.svg"))
    for cid in IDS:
        cols.append((f"{cid} بدون دائرة", "plain", cid))
    for name, body in REF.items():
        cols.append((name, "ref", body))
    rows = [("أبيض، ملون", "#FFFFFF", ""), ("أبيض، رمادي", "#FFFFFF", "grayscale(1)"),
            ("أسود، ملون", "#000000", ""), ("أسود، رمادي", "#000000", "grayscale(1)")]
    CW = 118
    head = "".join(f'<div style="width:{CW}px;flex:none;font:11px Tahoma;text-align:center;direction:rtl;height:30px">{n}</div>' for n, *_ in cols)
    out = [f'<div style="display:flex;padding-left:120px">{head}</div>']
    for rname, bg, flt in rows:
        cells = []
        for name, kind, ref in cols:
            items = []
            for px in (32, 56):
                if kind == "avatar":
                    el = f'<img src="{u(ref)}" width="{px}" height="{px}" style="border-radius:50%;display:block">'
                elif kind == "plain":
                    f = CDIR / ref / (f"{ref}-icon-ink.svg" if bg == "#FFFFFF" else f"{ref}-icon-dark.svg")
                    el = f'<img src="{u(f)}" width="{px}" height="{px}" style="display:block">'
                else:
                    body = ref.replace('"#000"', '"#fff"') if bg == "#000000" and name in ("Square", "Apple", "Nike") else ref
                    el = (f'<svg width="{px}" height="{px}" viewBox="0 0 100 100" style="display:block">'
                          + (f'<circle cx="50" cy="50" r="50" fill="#fff"/>' if bg == "#000000" and name in ("NexNFC", "لتين") else "")
                          + f'{body}</svg>')
                items.append(el)
            cells.append(f'<div style="width:{CW}px;flex:none;display:flex;gap:8px;align-items:center;justify-content:center;'
                         f'height:76px;background:{bg};filter:{flt or "none"}">{"".join(items)}</div>')
        out.append(f'<div style="display:flex"><div style="width:120px;flex:none;font:12px Tahoma;direction:rtl;display:flex;'
                   f'align-items:center;justify-content:center">{rname}</div>{"".join(cells)}</div>')
    note = ('<div style="padding:8px 12px;direction:rtl;font:13px Tahoma;color:#56625F">لوحة المقارنة (16.6 بند 4): كل خانة فيها 32 و56px. '
            'رموز الغير رسمناها مبسطة بأنفسنا من وصفها في ملفات اللجنة (mkt-strategist.md وmkt-compliance.md وbrand-color/brand.md)، '
            'بدون تحميل، وألوانها تقريبية: هي للمقارنة الداخلية بس، مو نسخ من الشعارات الأصلية. pixel-nfc ما شفنا شكله، فممثل بلونيه بس.</div>')
    html = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff">' + note + "".join(out) + '</body></html>'
    out_p = BDIR / "board-compare.png"
    shot(html, str(out_p), 120 + CW * len(cols) + 20, 420)
    trim(out_p)
    return out_p


if __name__ == "__main__":
    BDIR.mkdir(parents=True, exist_ok=True)
    print(letters())
    print(compare())
