"""Per-concept sheet (AD 16.7): construction, 256px on 4 backgrounds, 16-64px ladder (colour / mono / grey) on white, sand,
ink and #202124, WhatsApp list 40px light+dark, favicon tabs light+dark (1x and 4x zoom), horizontal lockup at 48 and 120px."""
import math
import pathlib
import sys

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import concepts as C  # noqa
from geo import sample_poly  # noqa
from shot import shot  # noqa

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
CDIR = ROOT / "work" / "2026-09-27-brand-identity" / "logo-review" / "concepts"
FONT = (ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf").as_uri()
INK, SAF, SAND, DARK, TABD = "#14201F", "#F2A93B", "#FAF7F2", "#0E1615", "#202124"
TMP = pathlib.Path(__import__("tempfile").gettempdir()) / "lamsatap-illus" / "tmp"
TMP.mkdir(parents=True, exist_ok=True)


def uri(p):
    return pathlib.Path(p).as_uri()


def construction(g, size=420):
    sd, dd = C.paths(g)
    m = C.measures(g)
    cx, cy, R = g["dot"]
    pts = np.array(sample_poly(g["poly"], g["radii"], step=0.25))
    dist = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy)
    near = pts[dist.argmin()]
    ux, uy = (near[0] - cx) / dist.min(), (near[1] - cy) / dist.min()
    gx0, gy0 = cx + ux * R, cy + uy * R
    grid = "".join(f'<line x1="{v}" y1="0" x2="{v}" y2="512" stroke="#D9D2C6" stroke-width="{1.4 if v % 128 == 0 else .7}"/>'
                   f'<line x1="0" y1="{v}" x2="512" y2="{v}" stroke="#D9D2C6" stroke-width="{1.4 if v % 128 == 0 else .7}"/>'
                   for v in range(0, 513, 32))
    ann = [f'<circle cx="256" cy="256" r="224" fill="none" stroke="#0B7A75" stroke-width="1.6" stroke-dasharray="6 5"/>',
           f'<circle cx="256" cy="256" r="256" fill="none" stroke="#0B7A75" stroke-width="1"/>',
           f'<path d="{sd}" fill="{INK}" fill-opacity=".92"/><path d="{dd}" fill="{SAF}"/>',
           f'<line x1="{gx0:.1f}" y1="{gy0:.1f}" x2="{near[0]:.1f}" y2="{near[1]:.1f}" stroke="#D0342C" stroke-width="3"/>',
           f'<text x="{(gx0 + near[0]) / 2:.0f}" y="{(gy0 + near[1]) / 2 - 10:.0f}" font-size="17" fill="#D0342C" text-anchor="middle" '
           f'font-family="Tahoma">{m["gap"]:.0f}</text>',
           f'<line x1="{cx - 10}" y1="{cy}" x2="{cx + 10}" y2="{cy}" stroke="{INK}" stroke-width="1.5"/>'
           f'<line x1="{cx}" y1="{cy - 10}" x2="{cx}" y2="{cy + 10}" stroke="{INK}" stroke-width="1.5"/>',
           '<line x1="248" y1="256" x2="264" y2="256" stroke="#0B7A75"/><line x1="256" y1="248" x2="256" y2="264" stroke="#0B7A75"/>']
    if g["kind"] == "mail":
        top, h = g["top"], g["h"]
        ann.append(f'<line x1="40" y1="{cy}" x2="{cx}" y2="{cy}" stroke="#D0342C" stroke-width="1" stroke-dasharray="3 3"/>'
                   f'<text x="30" y="{cy + 5}" font-size="14" fill="#D0342C" text-anchor="end" font-family="Tahoma">{m["f"]:.3f}</text>')
        tl = g["poly"][0]
        bl = g["poly"][3]
        ann.append(f'<line x1="{tl[0]:.1f}" y1="{top - 14}" x2="{bl[0]:.1f}" y2="{top - 14}" stroke="#0B7A75" stroke-width="3"/>'
                   f'<text x="{(tl[0] + bl[0]) / 2:.0f}" y="{top - 22}" font-size="14" fill="#0B7A75" text-anchor="middle" '
                   f'font-family="Tahoma">s={g["s"]}</text>')
    return (f'<svg width="{size}" height="{size}" viewBox="-40 -40 592 592" style="background:#fff">{grid}{"".join(ann)}'
            f'<text x="-30" y="-18" font-size="14" fill="#56625F" font-family="Tahoma">شبكة 32 · دائرة 224 (متقطعة) و256 · الأحمر: أقرب مسافة</text></svg>')


def img(p, px, style=""):
    return f'<img src="{uri(p)}" width="{px}" height="{px}" style="display:block;{style}">'


def context_html(cid):
    d = CDIR / cid
    av = d / f"{cid}-avatar.svg"
    fav_l, fav_d = d / f"{cid}-icon-ink.svg", d / f"{cid}-icon-dark.svg"
    others = [("مقهى المثال", "#7A3E2B", "م"), ("أبو فهد", "#8696A0", ""), ("ورشة التكييف", "#1F3B57", "و")]

    def wa(bg, fg, sub, line, mine_first=True):
        rows = [("لمسة تاب", av, "تمام، الستاند يوصلكم الأحد إن شاء الله", "10:42")] + \
               [(n, None, "طيب، وش السعر؟", "09:15") for n, *_ in others]
        out = []
        for i, (name, a, msg, t) in enumerate(rows):
            if a:
                pic = f'<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;flex:none">{img(a, 40)}</div>'
            else:
                col, ch = others[i - 1][1], others[i - 1][2]
                pic = (f'<div style="width:40px;height:40px;border-radius:50%;background:{col};color:#fff;flex:none;display:flex;'
                       f'align-items:center;justify-content:center;font:600 17px Tahoma">{ch}</div>')
            out.append(f'<div style="display:flex;gap:12px;align-items:center;padding:8px 14px;border-bottom:1px solid {line}">{pic}'
                       f'<div style="flex:1;direction:rtl;font:15px Tahoma;color:{fg}"><div style="display:flex;justify-content:space-between">'
                       f'<b style="font-weight:600">{name}</b><span style="font-size:12px;color:{sub}">{t}</span></div>'
                       f'<div style="font-size:13px;color:{sub};margin-top:2px">{msg}</div></div></div>')
        return f'<div style="width:360px;background:{bg};direction:rtl">{"".join(out)}</div>'

    def tabs(strip, active, inactive_txt, active_txt, fav):
        return (f'<div style="width:420px;height:40px;background:{strip};display:flex;align-items:flex-end;padding:0 8px;box-sizing:border-box">'
                f'<div style="height:32px;width:200px;background:{active};border-radius:8px 8px 0 0;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box">'
                f'{img(fav, 16)}<span style="font:12px Segoe UI,Tahoma;color:{active_txt};white-space:nowrap">لمسة تاب — LamsaTap</span></div>'
                f'<div style="height:32px;width:160px;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box">'
                f'<span style="width:16px;height:16px;border-radius:3px;background:#8696A0;display:block"></span>'
                f'<span style="font:12px Segoe UI,Tahoma;color:{inactive_txt}">صفحة ثانية</span></div></div>')
    body = (f'<div id="wa" style="display:flex;gap:20px;padding:10px">{wa("#FFFFFF", "#111B21", "#667781", "#E9EDEF")}'
            f'{wa("#0B141A", "#E9EDEF", "#8696A0", "#222D34")}</div>'
            f'<div style="display:flex;gap:20px;padding:10px">{tabs("#DEE1E6", "#FFFFFF", "#5F6368", "#202124", fav_l)}'
            f'{tabs("#202124", "#35363A", "#9AA0A6", "#E8EAED", fav_d)}</div>')
    return f'<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff">{body}</body></html>'


def render_context(cid):
    out = TMP / f"{cid}-ctx.png"
    shot(context_html(cid), str(out), 900, 330)
    im = Image.open(out).convert("RGB")
    # favicon tab crops (first 60px of each tab strip) and avatar crop, zoom x4 nearest
    tab_y = 10 + 4 * 57 + 10 + 10  # approx; find via scan below instead
    arr = np.array(im)
    # locate tab strips by their strip colours
    rows_l = np.where((np.abs(arr[:, 15, :].astype(int) - [0xDE, 0xE1, 0xE6]).sum(1) < 6))[0]
    rows_d = np.where((np.abs(arr[:, 460, :].astype(int) - [0x20, 0x21, 0x24]).sum(1) < 6))[0]
    zooms = {}
    if len(rows_l):
        y0 = rows_l.min()
        zooms["tab-light"] = im.crop((10 + 8, y0 + 8, 10 + 8 + 64, y0 + 40)).resize((256, 128), Image.NEAREST)
    if len(rows_d):
        y0 = rows_d.min()
        zooms["tab-dark"] = im.crop((450 + 8, y0 + 8, 450 + 8 + 64, y0 + 40)).resize((256, 128), Image.NEAREST)
    zooms["wa-light"] = im.crop((10 + 306, 10 + 4, 10 + 356, 10 + 54)).resize((200, 200), Image.NEAREST)
    zooms["wa-dark"] = im.crop((390 + 306, 10 + 4, 390 + 356, 10 + 54)).resize((200, 200), Image.NEAREST)
    paths = {}
    for k, z in zooms.items():
        p = TMP / f"{cid}-{k}-zoom.png"
        z.save(p)
        paths[k] = p
    return out, paths


def ladder(cid):
    d = CDIR / cid
    icon, dark, mono = d / f"{cid}-icon-ink.svg", d / f"{cid}-icon-dark.svg", d / f"{cid}-icon-mono.svg"
    sizes = (16, 24, 32, 40, 48, 64)
    blocks = [("أبيض #FFFFFF", "#FFFFFF", icon, ""), ("رملي #FAF7F2", SAND, icon, ""),
              ("حبر #14201F", INK, dark, "invert(1)"), ("تبويب داكن #202124", TABD, dark, "invert(1)")]
    out = ['<table style="border-collapse:collapse;font:12px Tahoma;color:#56625F">']
    out.append('<tr><td></td><td></td>' + "".join(f'<td style="text-align:center;padding:2px 6px">{s}px</td>' for s in sizes) + '</tr>')
    for lab, bg, colf, inv in blocks:
        for vi, (vn, f, flt) in enumerate((("ملون", colf, ""), ("لون واحد", mono, inv), ("رمادي", colf, "grayscale(1)"))):
            cells = "".join(f'<td style="background:{bg};padding:6px 8px;vertical-align:middle">'
                            f'<img src="{uri(f)}" width="{s}" height="{s}" style="display:block;margin:auto;filter:{flt or "none"}"></td>'
                            for s in sizes)
            first = f'<td rowspan="3" style="padding:0 8px;direction:rtl;white-space:nowrap">{lab}</td>' if vi == 0 else ""
            out.append(f'<tr>{first}<td style="padding:0 6px;direction:rtl">{vn}</td>{cells}</tr>')
    out.append('</table>')
    return "".join(out)


def sheet(cid, g, title, idea, checks):
    d = CDIR / cid
    m = C.measures(g)
    ctx, zooms = render_context(cid)
    icon, dark, white, mono = (d / f"{cid}-icon-ink.svg", d / f"{cid}-icon-dark.svg", d / f"{cid}-icon.svg",
                               d / f"{cid}-icon-mono.svg")
    vl, vld = d / f"{cid}-logo.svg", d / f"{cid}-logo-dark.svg"
    hz, hzd, hzm = d / f"{cid}-horizontal.svg", d / f"{cid}-horizontal-dark.svg", d / f"{cid}-horizontal-mono.svg"
    if g["kind"] == "mail":
        params = (f'السطح: ارتفاع {g["h"]} ({g["h"] // 32} خانات)، الضلع الأفقي {m["w"]:.1f} (النسبة {m["w"] / g["h"]:.2f})، الميلان {g["s"]} '
                  f'({m["slant_deg"]}°)، الزوايا {g["r"]}. النقطة {2 * g["dot"][2]:.0f} عند {m["f"] * 100:.1f}% من فوق. '
                  f'المسافة {m["gap"]}، البعد عن المركز {m["off"]}، أبعد نقطة {m["far"]}.')
    else:
        params = (f'مثلث قائم ضلعه {g["leg"]:.1f} وكل زواياه {g["ra"]}، والنقطة {2 * g["dot"][2]:.0f} مقابل الوتر. '
                  f'المسافة {m["gap"]}، البعد عن المركز {m["off"]}، أبعد نقطة {m["far"]}.')
    big = "".join(f'<div style="background:{bg};padding:12px;line-height:0">{img(f, 230)}</div>'
                  for bg, f in (("#FFFFFF", icon), (SAND, icon), (INK, white), (TABD, dark)))
    lock = (f'<div style="background:{SAND};padding:18px;display:flex;gap:40px;align-items:center">'
            f'<img src="{uri(hz)}" style="height:120px"><img src="{uri(hz)}" style="height:48px"></div>'
            f'<div style="background:{DARK};padding:18px;display:flex;gap:40px;align-items:center">'
            f'<img src="{uri(hzd)}" style="height:120px"><img src="{uri(hzd)}" style="height:48px"></div>'
            f'<div style="background:#FFFFFF;padding:18px;display:flex;gap:40px;align-items:center;border:1px solid #eee">'
            f'<img src="{uri(hzm)}" style="height:48px"><span style="font:13px Tahoma;color:#56625F;direction:rtl">لون واحد 48px</span></div>'
            f'<div style="display:flex;gap:0"><div style="background:{SAND};padding:18px"><img src="{uri(vl)}" style="height:200px"></div>'
            f'<div style="background:{DARK};padding:18px"><img src="{uri(vld)}" style="height:200px"></div>'
            f'<div style="padding:18px;font:13px Tahoma;color:#56625F;direction:rtl;align-self:center">القفل العمودي (16.5): الرمز فوق، والمسافة 0.35h</div></div>')
    zoom = "".join(f'<div style="text-align:center;font:12px Tahoma;color:#56625F"><img src="{uri(p)}" style="display:block;image-rendering:pixelated">{k}</div>'
                   for k, p in zooms.items())
    h = f'''<!doctype html><html><head><meta charset="utf-8"><style>@font-face{{font-family:RX;src:url("{FONT}");font-weight:160 700}}
body{{margin:0;background:#fff;font-family:RX,Tahoma;color:#14201F}} h2{{font:600 22px RX;margin:0}} .sec{{padding:14px 24px}}
.lab{{font:600 14px RX;color:#56625F;margin:0 0 8px;direction:rtl}}</style></head><body>
<div class="sec" style="direction:rtl;border-bottom:1px solid #E4DCD0"><h2>{cid} · «{title}» — مفهوم داخلي (web-illustrator)</h2>
<div style="font:15px RX;margin-top:6px">{idea}</div><div style="font:13px RX;color:#56625F;margin-top:6px">{params}</div>
<div style="font:13px RX;color:#56625F;margin-top:4px">check_logo.py: {checks}</div></div>
<div class="sec" style="display:flex;gap:24px;align-items:flex-start">{construction(g)}
<div><div class="lab">256px: أبيض، رملي، حبر (أبيض ونقطة)، تبويب داكن (#ECF2F0 ونقطة)</div><div style="display:grid;grid-template-columns:repeat(2,254px);gap:10px">{big}</div></div></div>
<div class="sec"><div class="lab">من 16 لين 64px: ملون، لون واحد، رمادي (1x، بدون تكبير)</div>{ladder(cid)}</div>
<div class="sec"><div class="lab">صورة الحساب في قائمة واتساب 40px (فاتح وداكن، ألوان واتساب تقريبية)، والـ favicon على تبويب فاتح وداكن</div>
<img src="{uri(ctx)}" style="display:block"><div class="lab" style="margin-top:10px">تكبير ×4 للبكسلات (favicon 16px وصورة الحساب 40px)</div><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">{zoom}</div></div>
<div class="sec"><div class="lab">القفل الأفقي على 120 و48px (رملي، داكن #0E1615، لون واحد)، والعمودي</div>{lock}</div>
</body></html>'''
    out = d / f"{cid}-sheet.png"
    shot(h, str(out), 1240, 3400)
    im = Image.open(out)
    arr = np.array(im.convert("L"))
    rows = np.where(arr.min(1) < 250)[0]
    if len(rows):
        im.crop((0, 0, im.width, min(im.height, rows.max() + 24))).save(out, optimize=True)
    return out
