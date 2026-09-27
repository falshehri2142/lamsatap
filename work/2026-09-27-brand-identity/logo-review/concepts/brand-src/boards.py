"""لوحتين مشتركتين للمفاهيم الأربعة (المدير الفني 16.6 و16.7):
- brand-compare.png: المقارنة مع المنافسين والمراجع، 32 و56px، ملون ورمادي، على أبيض وأسود (التسويق بند 2).
- brand-letters.png: اختبار الحرف والشي على 32 و256px (الحروف والأرقام ونقطة آخر السطر، والأشياء الممنوعة).
أشكال الغير هنا **تقريب مرسوم بأيدينا** من وصف ملفات التسويق (mkt-strategist.md) عشان المقارنة الداخلية بس،
مو ملفاتهم الأصلية، وما تنستخدم في أي مادة. pixel-nfc: ألوانهم بس، لأن شكل شعارهم ما تأكدنا منه.
التشغيل من جذر المشروع:  python work/2026-09-27-brand-identity/logo-review/concepts/brand-src/boards.py
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_concepts import CONCEPTS, CONCEPTS_DIR, CSS, shot, trim, INK, WHITE, SAFFRON  # noqa: E402
from geometry import Lean  # noqa: E402

ARIAL = "Arial,Helvetica,sans-serif"


def sv(body, vb="0 0 100 100"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="100%" height="100%">{body}</svg>'


def ours(c, on_dark):
    L = Lean(c["s"], c["r"], c["d"], c["dot"], c["XL"], c["XR"])
    fg = WHITE if on_dark else INK
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">'
            f'<path fill="{fg}" d="{L.surface_d()}"/><path fill="{SAFFRON}" d="{L.dot_d()}"/></svg>')


def ours_avatar(c):
    L = Lean(c["s"], c["r"], c["d"], c["dot"], c["XL"], c["XR"])
    k, o = 0.8, 51.2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">'
            f'<circle cx="256" cy="256" r="256" fill="{INK}"/>'
            f'<path fill="#fff" d="{L.surface_d(k, o, o)}"/><path fill="{SAFFRON}" d="{L.dot_d(k, o, o)}"/></svg>')


def txt(t, fill, size=62, x=50, y=70, weight=700, fam=ARIAL):
    return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="{fam}" font-weight="{weight}" font-size="{size}" fill="{fill}">{t}</text>'


def sq(fill, r=22):
    return f'<rect x="4" y="4" width="92" height="92" rx="{r}" fill="{fill}"/>'


# تقريب لأشكال الغير (من وصف mkt-strategist.md)، ما هي ملفاتهم
OTHERS = [
    ("Tap Payments (حلقتين)", lambda d: sv('<g fill="none" stroke="#6E6B6A" stroke-width="9"><circle cx="40" cy="50" r="26"/><circle cx="62" cy="50" r="26"/></g>')),
    ("Lamsa (ثلاث نقاط تكبر)", lambda d: sv('<circle cx="18" cy="58" r="8" fill="#6DBFAE"/><circle cx="42" cy="54" r="12" fill="#D33D5C"/><circle cx="74" cy="50" r="17" fill="#5B3296"/>')),
    ("فودكس (f ونقطة)", lambda d: sv(sq("#6C3FB5") + txt("f", "#fff", 62, 50, 64) + '<circle cx="50" cy="80" r="7" fill="#fff"/>')),
    ("Booking (B.)", lambda d: sv(sq("#003B95", 26) + txt("B", "#fff", 56, 44, 70) + '<circle cx="72" cy="66" r="6" fill="#fff"/>')),
    ("تابي (t)", lambda d: sv(sq("#3DF2C0") + txt("t", "#111", 66, 50, 72))),
    ("سلة (سلة وابتسامة)", lambda d: sv(sq("#BAF3E6") + '<path d="M24 38h52l-7 38H31z" fill="none" stroke="#004956" stroke-width="7" stroke-linejoin="round"/>'
                                        '<path d="M38 54q12 10 24 0" fill="none" stroke="#004956" stroke-width="6" stroke-linecap="round"/>')),
    ("جاذر إن (قوس/باب)", lambda d: sv(sq("#4B2A8C") + '<path d="M30 80V48a20 20 0 0 1 40 0v32" fill="none" stroke="#FF8A2A" stroke-width="10" stroke-linecap="round"/>')),
    ("تقييم (حلقة بألوان قوقل)", lambda d: sv('<g fill="none" stroke-width="12"><path d="M50 18a32 32 0 0 1 32 32" stroke="#4285F4"/><path d="M82 50a32 32 0 0 1-32 32" stroke="#34A853"/>'
                                              '<path d="M50 82a32 32 0 0 1-32-32" stroke="#FBBC05"/><path d="M18 50a32 32 0 0 1 32-32" stroke="#EA4335"/></g>')),
    ("RATECARDS (دائرة وموجات)", lambda d: sv('<circle cx="50" cy="50" r="46" fill="#111"/><g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">'
                                              '<path d="M40 36a20 20 0 0 1 0 28"/><path d="M52 28a32 32 0 0 1 0 44"/><path d="M64 20a44 44 0 0 1 0 60"/></g>')),
    ("360TapIt (حلقات وأقواس)", lambda d: sv('<g fill="none" stroke="#1E6FD9" stroke-width="7"><circle cx="42" cy="58" r="20"/><circle cx="60" cy="58" r="20"/>'
                                             '<path d="M34 28a26 26 0 0 1 34 0" stroke-linecap="round"/></g>')),
    ("NexNFC (كلمة زرقاء)", lambda d: sv(txt("nexnfc", "#1E63D6", 30, 50, 60, 700))),
    ("pixel-nfc (ألوانهم بس)", lambda d: sv('<rect x="6" y="20" width="44" height="60" fill="#111111"/><rect x="50" y="20" width="44" height="60" fill="#F59E0B"/>')),
    ("لتين (كلمة تيل)", lambda d: sv(txt("لتين", "#005A5A", 44, 50, 64, 700, "Segoe UI,Tahoma"))),
    ("Square (مربع في مربع)", lambda d: sv('<rect x="10" y="10" width="80" height="80" rx="16" fill="none" stroke="#111" stroke-width="12"/><rect x="36" y="36" width="28" height="28" rx="4" fill="#111"/>')),
    ("Stripe (S)", lambda d: sv(sq("#635BFF") + txt("S", "#fff", 62, 50, 72))),
    ("Airbnb (حلقة)", lambda d: sv('<path d="M50 14c-8 0-12 10-18 24S18 70 26 80s20 2 24-8c4 10 16 18 24 8s-2-28-6-42S58 14 50 14zm0 30c6 10 10 24 0 30c-10-6-6-20 0-30z" fill="#FF5A5F"/>')),
    ("Toast (تقريب)", lambda d: sv(sq("#FF4C00") + '<path d="M28 76V46a22 22 0 1 1 44 0v30z" fill="#fff"/>')),
    ("Apple (تفاحة)", lambda d: sv('<path d="M50 30c8-8 26-6 30 8c-10 6-10 24 2 30c-4 12-12 24-20 24s-8-4-12-4s-6 4-12 4s-18-14-20-30s8-34 22-34c6 0 8 2 10 2z" fill="#111"/>'
                                   '<path d="M52 26c0-8 6-14 14-16c0 8-6 14-14 16z" fill="#111"/>')),
    ("Nike (سوش)", lambda d: sv('<path d="M8 62c-4 12 6 16 18 12L94 38 30 60c-10 4-16 2-10-10c-6 4-10 8-12 12z" fill="#111"/>')),
    ("قوقل (G)", lambda d: sv(txt("G", "#4285F4", 70, 50, 74))),
]

# اختبار الشي (المدير الفني 16.6 بند 3)
OBJECTS = [
    ("جوال", '<rect x="30" y="8" width="40" height="84" rx="8" fill="#222"/><rect x="34" y="16" width="32" height="64" rx="3" fill="#9AA"/>'),
    ("بطاقة", '<rect x="8" y="26" width="84" height="52" rx="7" fill="#222"/><rect x="18" y="40" width="16" height="12" rx="2" fill="#C9A227"/>'),
    ("أزرار تشغيل ■●", '<rect x="10" y="32" width="34" height="34" fill="#222"/><circle cx="72" cy="49" r="18" fill="#D33"/>'),
    ("أيقونة وشارة", '<rect x="12" y="18" width="68" height="68" rx="16" fill="#3478F6"/><circle cx="78" cy="22" r="14" fill="#FF3B30"/>'),
    ("فقاعة محادثة", '<path d="M14 20h72v46H44L26 82V66H14z" fill="#222"/>'),
    ("دبوس خرائط", '<path d="M50 92C34 70 22 56 22 40a28 28 0 0 1 56 0c0 16-12 30-28 52z" fill="#222"/><circle cx="50" cy="40" r="10" fill="#fff"/>'),
    ("شخص", '<circle cx="50" cy="30" r="16" fill="#222"/><path d="M20 90a30 30 0 0 1 60 0z" fill="#222"/>'),
    ("شمس فوق أفق", '<path d="M26 64a24 24 0 0 1 48 0z" fill="#E8A33A"/><rect x="8" y="66" width="84" height="8" fill="#222"/>'),
    ("عين", '<path d="M8 50q42-40 84 0q-42 40-84 0z" fill="#222"/><circle cx="50" cy="50" r="12" fill="#fff"/>'),
    ("كبسولة دوا", '<rect x="12" y="36" width="76" height="28" rx="14" fill="#222" transform="rotate(-30 50 50)"/>'),
    ("بطارية", '<rect x="10" y="30" width="72" height="40" rx="6" fill="none" stroke="#222" stroke-width="7"/><rect x="84" y="42" width="8" height="16" fill="#222"/><rect x="18" y="38" width="36" height="24" fill="#222"/>'),
    ("علم", '<rect x="16" y="10" width="6" height="84" fill="#222"/><path d="M22 14h60l-12 18 12 18H22z" fill="#222"/>'),
    ("باب", '<rect x="26" y="10" width="48" height="84" rx="4" fill="#222"/><circle cx="64" cy="54" r="4" fill="#fff"/>'),
    ("سماعة صوت", '<path d="M14 38h16l22-18v60L30 62H14z" fill="#222"/>'),
]

LETTERS = [
    ("ز", "Traditional Arabic,serif"), ("ذ", "Traditional Arabic,serif"), ("ن", "Traditional Arabic,serif"), ("ب", "Traditional Arabic,serif"),
    ("ف", "Traditional Arabic,serif"), ("ز", "RX"), ("ذ", "RX"), ("ن", "RX"), ("ب", "RX"),
    ("١", "Traditional Arabic,serif"), ("٧", "Traditional Arabic,serif"), ("٠", "Traditional Arabic,serif"), ("١", "RX"), ("٧", "RX"),
    ("I", ARIAL), ("l", ARIAL), ("i", ARIAL), ("D", ARIAL), ("b", ARIAL), ("P", ARIAL), ("1", ARIAL), ("7", ARIAL), ("!", ARIAL), ("l.", ARIAL),
]


def tile(inner, size, bg, flt=""):
    return f'<div style="width:{size}px;height:{size}px;background:{bg};{flt}">{inner}</div>'


def compare_board():
    rows = [(f"{c['key']} «{c['title']}»", (lambda c=c: (ours(c, False), ours(c, True))), True) for c in CONCEPTS]
    rows += [(f"{c['key']} صورة الحساب", (lambda c=c: (ours_avatar(c), ours_avatar(c))), True) for c in CONCEPTS]
    inv = ("Square", "Apple", "Nike")  # أشكال سوداء: على الأسود نقلبها أبيض عشان تنشاف
    rows += [(n, (lambda f=f, n=n: (f(0), f"<div style='width:100%;height:100%;filter:invert(1)'>{f(0)}</div>" if n.startswith(inv) else f(0))), False)
             for n, f in OTHERS]
    head = ("<div style='display:grid;grid-template-columns:230px repeat(8,76px);gap:6px;align-items:center;direction:rtl;font:12px RX'>"
            "<div></div>" + "".join(f"<div style='text-align:center'>{t}</div>" for t in (
                "32 أبيض", "56 أبيض", "32 أبيض رمادي", "56 أبيض رمادي", "32 أسود", "56 أسود", "32 أسود رمادي", "56 أسود رمادي")))
    body = []
    for name, fn, ourrow in rows:
        light, dark = fn()
        cells = []
        for bg, src in (("#FFFFFF", light), ("#000000", dark)):
            for flt in ("", "filter:grayscale(1)"):
                for s in (32, 56):
                    cells.append(f"<div style='display:flex;justify-content:center;align-items:center;height:64px;background:{bg}'>{tile(src, s, 'transparent', flt)}</div>")
        # الترتيب في الرأس: أبيض 32 56 ثم رمادي...
        order = [0, 1, 2, 3, 4, 5, 6, 7]
        style = "font-weight:600" if ourrow else "color:#56625F"
        body.append(f"<div style='{style}'>{name}</div>" + "".join(cells[i] for i in order))
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='sec' style='border:0'>"
            "<div class='h'>لوحة المقارنة (التسويق بند 2، المدير الفني 16.6 بند 4): «يشبه؟» لازم «لا» للكل</div>"
            "<div class='note'>أشكال الغير تقريب مرسوم بأيدينا من وصف mkt-strategist.md للمقارنة الداخلية بس، مو ملفاتهم. pixel-nfc: ألوانهم بس (الشكل غير مؤكد).</div>"
            + head + "".join(body) + "</div></div></body></html>")
    out = CONCEPTS_DIR / "brand-compare.png"
    shot(html, out, 1000, 3200)
    trim(out, (255, 255, 255))
    return out


def letters_board():
    cols = "".join(f"<div style='width:44px;text-align:center'>{('نسخ' if 'Traditional' in f else 'كوفي/هندسي' if f == 'RX' else 'لاتيني')}</div>" for _, f in LETTERS)
    blocks = []
    for c in CONCEPTS:
        mk = ours(c, False)
        big = f"<div style='width:256px;height:256px;flex:none;background:#fff'>{mk}</div>"
        glyph_big = "".join(f"<div style='width:120px;height:256px;display:flex;align-items:center;justify-content:center;font-family:{f};font-size:190px;font-weight:700;color:#14201F;background:#fff'>{g}</div>" for g, f in LETTERS[:0])
        small = "".join(f"<div style='width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#fff;font-family:{f};font-size:34px;font-weight:700;color:#14201F'>{g}</div>" for g, f in LETTERS)
        blocks.append(f"<div style='display:flex;gap:18px;align-items:center;margin:14px 0;direction:rtl'>"
                      f"<div style='width:170px;font-weight:600'>{c['key']} «{c['title']}»</div>{big}"
                      f"<div><div style='display:flex;gap:4px;align-items:center'><div style='width:44px;height:44px'>{tile(mk, 32, '#fff')}</div>{small}</div>"
                      f"<div style='display:flex;gap:4px;font-size:9px;color:#56625F'><div style='width:44px;text-align:center'>32px</div>{cols}</div></div></div>")
    objs = "".join(f"<div><div style='width:64px;height:64px;background:#fff'>{sv(b)}</div><div class='lab'>{n}</div></div>" for n, b in OBJECTS)
    ourset = "".join(f"<div><div style='width:64px;height:64px;background:#fff'>{ours(c, False)}</div><div class='lab'>{c['key']}</div></div>" for c in CONCEPTS)
    big_letters = "".join(f"<div style='width:180px;height:256px;display:flex;align-items:center;justify-content:center;background:#fff;font-family:{f};font-size:200px;font-weight:700;color:#14201F'>{g}</div>"
                          for g, f in (("ز", "Traditional Arabic,serif"), ("ز", "RX"), ("l.", ARIAL), ("i", ARIAL), ("٧", "RX")))
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='sec' style='border:0;background:#F3EEE6'>"
            "<div class='h'>لوحة الحرف (المدير الفني 16.6 بند 2): الرمز جنب الحروف والأرقام ونقطة آخر السطر، 32 و256px</div>"
            "<div class='note'>الحكم ثلاثة كل واحد لحاله: المدير الفني وweb-copy وweb-ux. «نعم» وحدة = رفض. الحروف: نسخ (Traditional Arabic) وكوفي هندسي (Readex Pro) ولاتيني (Arial).</div>"
            + "".join(blocks) +
            f"<div class='h' style='margin-top:18px'>أقرب الحروف على 256px (ز نسخ، ز هندسي، l. ، i ، ٧)</div><div style='display:flex;gap:10px;direction:ltr'>{big_letters}</div>"
            f"<div class='h' style='margin-top:18px'>اختبار الشي (16.6 بند 3): رسومات تقريبية للأشياء الممنوعة جنب المفاهيم على 64px</div>"
            f"<div class='row' style='direction:rtl'>{ourset}<div style='width:30px'></div>{objs}</div>"
            "</div></body></html>")
    out = CONCEPTS_DIR / "brand-letters.png"
    shot(html, out, 1840, 2000)
    trim(out)
    return out


if __name__ == "__main__":
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")
    print(compare_board())
    print(letters_board())
