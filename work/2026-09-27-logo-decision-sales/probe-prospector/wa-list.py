# فحص صورة حساب الواتساب في قائمة المحادثات (sales-prospector، 2026-09-27)
# يرسم الرمز دائرة 56 و48 و40px بين صور حسابات ثانية، على خلفية فاتحة وداكنة وسوداء.
# الاستخدام:
#   python wa-list.py [مسار ملف الرمز SVG أو PNG]
# بعدها ارسم بـEdge (عرض 600 لأن النافذة بدون واجهة ما تصغر عن حوالي 500، وبعدين قص أول 390px):
#   msedge --headless=new --hide-scrollbars --allow-file-access-from-files --window-size=600,1680 --force-device-scale-factor=1 --screenshot=wa-list-dpr1.png file:///.../wa-list.html
#   (ونفسه بـ --force-device-scale-factor=3)
# ألوان الواتساب الداكنة هنا تقريبية من مصادر غير رسمية (#111B21)، والأسود الكامل #000 للاحتياط.
import sys
from pathlib import Path

DEFAULT_ICON = "C:/Users/TechTroniX/Desktop/NFC/.claude/worktrees/elegant-mclean-8e29f3/brand/logo/lamsatap-icon.svg"
icon = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_ICON
ICON = "file:///" + Path(icon).resolve().as_posix().lstrip("/")

themes = [
    ("light", "#FFFFFF", "#111B21", "#667781", "#E9EDEF", "فاتح (خلفية بيضاء)"),
    ("dark", "#111B21", "#E9EDEF", "#8696A0", "#222D34", "داكن (#111B21 تقريبي، غير رسمي)"),
    ("black", "#000000", "#E9EDEF", "#8696A0", "#1F1F1F", "داكن أسود كامل (#000)"),
]


def ours(sz):
    return f'<div class="av" style="width:{sz}px;height:{sz}px"><img src="{ICON}" width="{sz}" height="{sz}" alt=""></div>'


def silhouette(sz, dark):
    bg = "#6A7175" if dark else "#DFE5E7"
    fg = "#AEBAC1" if dark else "#FFFFFF"
    return (f'<div class="av" style="width:{sz}px;height:{sz}px;background:{bg}">'
            f'<svg viewBox="0 0 40 40" width="{sz}" height="{sz}"><circle cx="20" cy="15" r="7" fill="{fg}"/>'
            f'<path d="M6 36c2-8 8-12 14-12s12 4 14 12z" fill="{fg}"/></svg></div>')


def photo(sz):
    return f'<div class="av" style="width:{sz}px;height:{sz}px;background:radial-gradient(circle at 35% 35%,#e8c9a0,#8a5a3c 55%,#3b2a22)"></div>'


def lettertile(sz, letter, color):
    return f'<div class="av lt" style="width:{sz}px;height:{sz}px;background:{color};font-size:{int(sz*0.5)}px">{letter}</div>'


def cafe(sz):
    return f'<div class="av lt" style="width:{sz}px;height:{sz}px;background:#1b1b1b;font-size:{int(sz*0.26)}px;letter-spacing:.5px">CAFE</div>'


def row(av, name, msg, t, c_name, c_msg, c_line, label=""):
    lab = f'<span class="tag">{label}</span>' if label else ''
    return (f'<div class="row" style="border-bottom:1px solid {c_line}">{av}'
            f'<div class="txt"><div class="top"><b style="color:{c_name}">{name}</b><span style="color:{c_msg}">{t}</span></div>'
            f'<div style="color:{c_msg}">{msg} {lab}</div></div></div>')


parts = []
for key, bg, cn, cm, cl, title in themes:
    dark = key != "light"
    rows = [
        row(photo(48), "أبو فهد", "تمام، بكرة الساعة 4", "4:12 م", cn, cm, cl),
        row(ours(56), "لمسة تاب", "هلا، تم تركيب الستاند في الكاشير", "3:58 م", cn, cm, cl, "56px"),
        row(lettertile(48, "م", "#128C7E"), "مكتب مرافق", "وصلت الفاتورة؟", "3:40 م", cn, cm, cl),
        row(ours(48), "لمسة تاب", "التجربة من اليوم لين 11 أكتوبر", "3:21 م", cn, cm, cl, "48px"),
        row(silhouette(48, dark), "+966 5x xxx xxxx", "مرحبا", "2:05 م", cn, cm, cl),
        row(cafe(48), "Cafe Nord", "شكراً على الزيارة", "1:47 م", cn, cm, cl),
        row(ours(40), "لمسة تاب", "كيف شايف الستاند؟", "أمس", cn, cm, cl, "40px"),
        row(lettertile(40, "ب", "#0B7A75"), "بيت القهوة", "رسالة", "أمس", cn, cm, cl, "letter tile"),
    ]
    parts.append(f'<section style="background:{bg}"><h2 style="color:{cm}">{title}</h2>{"".join(rows)}</section>')

html = f'''<!doctype html><html lang="ar"><head><meta charset="utf-8"><style>
body{{margin:0;direction:ltr;font-family:"Segoe UI",Tahoma,sans-serif;background:#888}}
.wrap{{display:flex;gap:0;flex-direction:column;width:390px;direction:rtl}}
section{{padding:6px 0 4px}}
h2{{font-size:11px;margin:2px 12px 4px;font-weight:400}}
.row{{display:flex;align-items:center;gap:12px;padding:8px 12px;min-height:60px;box-sizing:border-box}}
.av{{border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center}}
.av img{{display:block}}
.lt{{color:#fff;font-weight:700;font-family:"Segoe UI",Tahoma,sans-serif}}
.txt{{flex:1;min-width:0;font-size:14px;line-height:1.35}}
.top{{display:flex;justify-content:space-between;font-size:15px}}
.top span{{font-size:11px}}
.tag{{font-size:10px;border:1px solid currentColor;border-radius:4px;padding:0 3px;margin-inline-start:4px}}
</style></head><body><div class="wrap">{"".join(parts)}</div></body></html>'''

out = Path(__file__).with_name("wa-list.html")
out.write_text(html, encoding="utf-8")
print("wrote", out, "icon:", ICON)
