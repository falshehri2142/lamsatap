# مشاهد المنتج (GM-049 و GM-050): خلفيات المشهدين + قطع المقدمة، لـ website/assets/mockups/.
# احنا ما نرسم اللوحة ولا وجه الستاند (شغل قسم الطباعة). نرسم المشهد حول «خانة الطباعة» بس:
#   scene-hosts      جدار فاتح جنب باب شقة (حافة الدرفة، الحلق، قفل أرقام بدون أرقام، المقبض). مكان اللوحة فاضي على 130cm.
#   scene-restaurants طاولة كافيه خشب فاتح، وكوب قهوة، وجدار دافي. مكان الستاند والمنيو فاضي.
#   phone-tap.svg    الجوال اللي يلمس (نفس جوال phone-frame.svg: 72x150mm، زاوية 10mm، حافة 3mm، كاميرا دائرية)، بظل تلامس.
#   stand-base.svg   قاعدة الستاند الأكريليك الشفاف (حامل A6 المائل، engineering/host-unit-and-stand-alternatives.md).
# كل لون هنا خلطة من tokens.css (القاموس T تحت)، ما فيه لون من برّا. ولا باركود، ولا نص، ولا شعار، ولا ناس.
# الخلفيات: SVG ← Edge بدون واجهة (لقطة 1600x1200) ← طبقتين WebP (اللون، والأبيض والأسود بوصفة tools/convert-images.py) بعرض 1600 و800.
# التشغيل من جذر المشروع: python work/2026-09-27-brand-identity/illustrations-src/build_scenes.py [--out <مجلد>]
# يحتاج Pillow و numpy و Microsoft Edge (موجودين). ما ينزّل شي ولا يطلب النت.
import os, sys, io, math, random, subprocess, tempfile, importlib.util
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(ROOT, 'website', 'assets', 'mockups')
SRC = os.path.join(HERE, 'scenes')          # نسخة SVG المصدر (للمراجعة)، مو للموقع
EDGE = next((p for p in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
                         r'C:\Program Files\Microsoft\Edge\Application\msedge.exe') if os.path.exists(p)), None)
W, H = 1600, 1200                           # المسرح 4:3. الصفحة تقصه بـ scenes.css (غطاء + نقطة تركيز)
LIMIT = {1600: 180, 800: 90}                # حد «البطل» في الاتجاه 3 §4 بالـKB، لكل طبقة

# ===== الألوان: tokens.css بس =====
T = {'ink': '#14201F', 'slate': '#56625F', 's50': '#FAF7F2', 's100': '#F3EEE6', 's200': '#E4DCD0', 'white': '#FFFFFF',
     'teal': '#0B7A75', 'tealLight': '#3FC1B6', 'saffron': '#F2A93B', 'lift': '#2A3B38'}
def rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)
def mix(**w):
    """خلطة tokens بالأوزان (sRGB). mix(ink=.2, s50=.8)."""
    s = sum(w.values()); v = sum(rgb(T[k]) * (x / s) for k, x in w.items())
    return '#%02X%02X%02X' % tuple(int(round(c)) for c in v)

C = {
    # المضيفين: ضوء نهار نظيف، والظلال تميل للتيل (الاتجاه 3 §4 «يطلع الضوء»)
    'wall':     mix(s50=.72, white=.28),
    'wall_hi':  mix(white=.85, s50=.15),
    'wall_lo':  mix(s100=.62, s200=.30, lift=.08),
    'door':     mix(teal=.40, ink=.35, s200=.25),          # باب مدهون تيل مطفي (لمسة المضيفين، وينكشف بالمسح)
    'door_lo':  mix(teal=.34, ink=.46, s200=.20),
    'door_hi':  mix(teal=.36, ink=.26, s200=.38),
    'casing':   mix(white=.8, s50=.2),
    'casing_lo': mix(s100=.55, s200=.45),
    'lock':     mix(ink=.9, slate=.1),
    'lock_hi':  mix(ink=.62, slate=.38),
    'key':      mix(lift=.75, slate=.25),
    'led':      T['tealLight'],
    # المطاعم: دافي (الاتجاه 3 §4 «يطلع الدفا»)
    'cwall':    mix(s100=.74, s200=.14, saffron=.12),
    'cwall_lo': mix(s200=.70, saffron=.14, ink=.16),
    'glow':     mix(saffron=.55, white=.45),
    'leaf':     mix(teal=.42, saffron=.22, ink=.36),
    'oak':      mix(saffron=.40, s200=.45, s50=.05, ink=.10),       # بلوط فاتح
    'oak_back': mix(saffron=.36, s200=.40, ink=.24),
    'oak_front': mix(saffron=.36, s200=.46, s50=.12, ink=.06),
    'oak_edge': mix(saffron=.36, s200=.30, ink=.34),
    'oak_grain': mix(saffron=.30, ink=.70),
    'floor':    mix(ink=.84, saffron=.08, s200=.08),
    'cup':      T['white'],
    'cup_lo':   mix(s200=.78, slate=.22),
    'coffee':   mix(ink=.62, saffron=.26, s200=.12),
    'crema':    mix(saffron=.46, s100=.40, ink=.14),
    # الجوال
    'body':     mix(ink=.82, slate=.18),
    'rim':      mix(slate=.55, s200=.45),
    'glass':    T['ink'],
    'glass_hi': mix(ink=.78, lift=.22),
}

def blur(i, s):
    return '<filter id="%s" x="-50%%" y="-50%%" width="200%%" height="200%%"><feGaussianBlur stdDeviation="%s"/></filter>' % (i, s)

def grain(i, seed, freq, dark, alpha):
    # حبيبات أحادية: الضجيج يصير شفافية فوق لون واحد (غامق)، فما يلوّث اللون
    r, g, b = rgb(dark) / 255
    return ('<filter id="%s" x="0" y="0" width="100%%" height="100%%"><feTurbulence type="fractalNoise" baseFrequency="%s" numOctaves="2" seed="%d" stitchTiles="stitch"/>'
            '<feColorMatrix type="matrix" values="0 0 0 0 %.3f 0 0 0 0 %.3f 0 0 0 0 %.3f %.3f 0 0 0 %.3f"/></filter>') % (i, freq, seed, r, g, b, alpha * 2.4, -alpha * 1.05)

def leaves(rnd, n, cx, cy, spread, size, fill, op):
    out = []
    for _ in range(n):
        x, y = cx + rnd.uniform(-spread, spread), cy + rnd.uniform(-spread * .8, spread * .8)
        a, l = rnd.uniform(0, 180), size * rnd.uniform(.7, 1.25)
        out.append('<ellipse cx="%.0f" cy="%.0f" rx="%.0f" ry="%.0f" transform="rotate(%.0f %.0f %.0f)" fill="%s" opacity="%.2f"/>' % (x, y, l, l * .36, a, x, y, fill, op))
    return ''.join(out)

# ===== المضيفين: 1600px = 1200mm من الجدار (1.333px لكل mm). أعلى الكادر 1714mm من الأرض، يعني مركز اللوحة (1300mm) على y=552 (46%) =====
def host_svg():
    rnd = random.Random(49)
    k = 4 / 3                                   # px لكل mm
    y_of = lambda mm: (1714 - mm) * k           # ارتفاع من الأرض -> y
    leaf = leaves(rnd, 16, 1480, 150, 170, 58, C['wall_lo'], .55)
    keys = ''.join('<rect x="%.1f" y="%.1f" width="19" height="15" rx="4" fill="%s"/><rect x="%.1f" y="%.1f" width="19" height="2" rx="1" fill="%s" opacity=".35"/>'
                   % (cx - 9.5, cy - 7.5, C['key'], cx - 9.5, cy - 7.5, C['rim'])
                   for cy in (648, 676, 704, 732) for cx in (318, 343, 368))
    hy = y_of(1050)                             # المقبض على 105cm
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<linearGradient id="hw" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C['wall_hi']}"/><stop offset=".5" stop-color="{C['wall']}"/><stop offset="1" stop-color="{C['wall_lo']}"/></linearGradient>
<linearGradient id="hd" x1="0" x2="1"><stop offset="0" stop-color="{C['door_lo']}"/><stop offset=".62" stop-color="{C['door']}"/><stop offset="1" stop-color="{C['door_hi']}"/></linearGradient>
<linearGradient id="hdv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{T['white']}" stop-opacity=".07"/><stop offset="1" stop-color="{T['ink']}" stop-opacity=".10"/></linearGradient>
<linearGradient id="hc" x1="0" x2="1"><stop offset="0" stop-color="{C['casing_lo']}"/><stop offset=".16" stop-color="{C['casing_lo']}"/><stop offset=".17" stop-color="{C['casing']}"/><stop offset=".86" stop-color="{C['casing']}"/><stop offset=".87" stop-color="{T['white']}"/><stop offset="1" stop-color="{T['white']}"/></linearGradient>
<linearGradient id="hl" x1="0" x2="1"><stop offset="0" stop-color="{C['lock']}"/><stop offset=".8" stop-color="{C['lock']}"/><stop offset="1" stop-color="{C['lock_hi']}"/></linearGradient>
<linearGradient id="hv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C['lock_hi']}"/><stop offset=".45" stop-color="{C['lock']}"/><stop offset="1" stop-color="{T['ink']}"/></linearGradient>
<radialGradient id="hr" cx=".62" cy=".32" r=".7"><stop offset="0" stop-color="{C['lock_hi']}"/><stop offset="1" stop-color="{T['ink']}"/></radialGradient>
<linearGradient id="hao" x1="0" x2="1"><stop offset="0" stop-color="{T['lift']}" stop-opacity=".13"/><stop offset="1" stop-color="{T['lift']}" stop-opacity="0"/></linearGradient>
<radialGradient id="hvig" cx=".72" cy=".25" r=".95"><stop offset=".55" stop-color="{T['lift']}" stop-opacity="0"/><stop offset="1" stop-color="{T['lift']}" stop-opacity=".10"/></radialGradient>
{blur('b60', 60)}{blur('b40', 40)}{blur('b18', 18)}{blur('b12', 12)}{blur('b8', 8)}{blur('b4', 4)}{blur('b2', 1.5)}
{grain('gn', 7, '.9', T['ink'], .05)}{grain('gm', 3, '.004', T['lift'], .05)}
</defs>
<rect width="{W}" height="{H}" fill="url(#hw)"/>
<polygon points="600,-80 1720,-80 1720,1280 1010,1280" fill="{T['white']}" opacity=".5" filter="url(#b60)"/>
<g filter="url(#b18)">{leaf}</g>
<rect width="{W}" height="{H}" filter="url(#gm)"/>
<rect width="{W}" height="{H}" fill="url(#hvig)"/>
<!-- الدرفة: تيل مطفي، بلمعة ستان -->
<rect x="-20" y="-20" width="450" height="1240" fill="url(#hd)"/>
<rect x="-20" y="-20" width="450" height="1240" fill="url(#hdv)"/>
<rect x="215" y="-40" width="120" height="1280" fill="{T['white']}" opacity=".06" filter="url(#b40)"/>
<!-- قفل أرقام بدون أرقام ولا علامة، والمقبض (105cm) -->
<rect x="286" y="612" width="94" height="412" rx="16" fill="{T['ink']}" opacity=".32" filter="url(#b8)"/>
<rect x="296" y="598" width="94" height="412" rx="16" fill="url(#hl)"/>
<rect x="388" y="614" width="1.5" height="380" rx=".75" fill="{C['rim']}" opacity=".5"/>
<rect x="297.5" y="599" width="91" height="1.5" rx=".75" fill="{C['rim']}" opacity=".45"/>
<circle cx="343" cy="620" r="7" fill="{C['led']}" opacity=".35" filter="url(#b4)"/><circle cx="343" cy="620" r="3.2" fill="{C['led']}"/>
{keys}
<path d="M343 {hy + 22} H186 a15 15 0 0 1 0 -30 H343 Z" fill="{T['ink']}" opacity=".35" transform="translate(-9 17)" filter="url(#b8)"/>
<circle cx="343" cy="{hy}" r="31" fill="{T['ink']}" opacity=".3" transform="translate(-6 9)" filter="url(#b4)"/>
<circle cx="343" cy="{hy}" r="31" fill="url(#hr)"/>
<path d="M343 {hy + 13} H178 a13 13 0 0 1 0 -26 H343 Z" fill="url(#hv)"/>
<rect x="180" y="{hy - 12}" width="160" height="2" rx="1" fill="{C['rim']}" opacity=".55"/>
<circle cx="343" cy="{hy}" r="13" fill="{C['lock']}"/><circle cx="343" cy="{hy}" r="13" fill="none" stroke="{C['rim']}" stroke-opacity=".35" stroke-width="1.2"/>
<rect x="-40" y="-40" width="480" height="1280" filter="url(#gn)"/>
<!-- ظل الحلق على الدرفة، وحافة الدرفة، والفتحة -->
<rect x="392" y="-40" width="44" height="1280" fill="{T['ink']}" opacity=".26" filter="url(#b12)"/>
<rect x="425" y="-20" width="3" height="1240" fill="{C['door_hi']}" opacity=".9"/>
<rect x="428" y="-20" width="6" height="1240" fill="{T['ink']}" opacity=".6"/>
<!-- الحلق الأبيض 7cm: الحافة الداخلية بالظل، والخارجية بالضوء -->
<rect x="434" y="-20" width="93" height="1240" fill="url(#hc)"/>
<rect x="449" y="-20" width="1" height="1240" fill="{T['ink']}" opacity=".08"/>
<rect x="527" y="-20" width="22" height="1240" fill="url(#hao)"/>
<rect x="526.5" y="-20" width="1" height="1240" fill="{T['lift']}" opacity=".18"/>
<rect x="434" y="-20" width="1" height="1240" fill="{T['ink']}" opacity=".25"/>
<rect x="434" y="-40" width="1130" height="1280" filter="url(#gn)" opacity=".7"/>
</svg>'''

# ===== المطاعم: 1600px = 800mm من الطاولة (2px لكل mm). حافة الطاولة الخلفية على y=540، والأمامية 1140 =====
def cafe_svg():
    rnd = random.Random(50)
    plant = leaves(rnd, 26, 1450, 250, 190, 78, C['leaf'], .55)
    bokeh = ''.join('<circle cx="%d" cy="%d" r="%d" fill="%s" opacity="%.2f"/>' % (x, y, r, C['glow'], o)
                    for x, y, r, o in ((210, 140, 30, .5), (330, 96, 20, .45), (520, 210, 26, .32), (120, 300, 18, .3), (640, 120, 16, .28), (420, 330, 14, .25)))
    cx, sy = 1190, 752                          # الكوب: مركز الصحن
    GR = rgb(C['oak_grain']) / 255
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<linearGradient id="cw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C['cwall']}"/><stop offset=".78" stop-color="{C['cwall']}"/><stop offset="1" stop-color="{C['cwall_lo']}"/></linearGradient>
<radialGradient id="cg" cx=".22" cy=".02" r=".6"><stop offset="0" stop-color="{C['glow']}" stop-opacity=".75"/><stop offset="1" stop-color="{C['glow']}" stop-opacity="0"/></radialGradient>
<linearGradient id="ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{C['oak_back']}"/><stop offset=".45" stop-color="{C['oak']}"/><stop offset="1" stop-color="{C['oak_front']}"/></linearGradient>
<linearGradient id="cfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="cm"><rect x="0" y="540" width="{W}" height="600" fill="url(#cfade)"/></mask>
<linearGradient id="cao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{T['ink']}" stop-opacity=".30"/><stop offset="1" stop-color="{T['ink']}" stop-opacity="0"/></linearGradient>
<linearGradient id="cu" x1="0" x2="1"><stop offset="0" stop-color="{C['cup_lo']}"/><stop offset=".42" stop-color="{C['cup']}"/><stop offset=".72" stop-color="{C['cup']}"/><stop offset=".86" stop-color="{T['s100']}"/><stop offset="1" stop-color="{C['cup_lo']}"/></linearGradient>
<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{T['white']}"/><stop offset="1" stop-color="{C['cup_lo']}"/></linearGradient>
<radialGradient id="ccr" cx=".55" cy=".45" r=".6"><stop offset="0" stop-color="{C['crema']}"/><stop offset=".7" stop-color="{C['crema']}"/><stop offset="1" stop-color="{C['coffee']}"/></radialGradient>
<filter id="cg1" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0024 .19" numOctaves="4" seed="11" stitchTiles="stitch"/>
<feColorMatrix type="matrix" values="0 0 0 0 {GR[0]:.3f} 0 0 0 0 {GR[1]:.3f} 0 0 0 0 {GR[2]:.3f} 1.7 0 0 0 -.74"/></filter>
<filter id="cg2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0020 .12" numOctaves="4" seed="12" stitchTiles="stitch"/>
<feColorMatrix type="matrix" values="0 0 0 0 {GR[0]:.3f} 0 0 0 0 {GR[1]:.3f} 0 0 0 0 {GR[2]:.3f} 1.7 0 0 0 -.74"/></filter>
<filter id="cg3" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0016 .075" numOctaves="4" seed="13" stitchTiles="stitch"/>
<feColorMatrix type="matrix" values="0 0 0 0 {GR[0]:.3f} 0 0 0 0 {GR[1]:.3f} 0 0 0 0 {GR[2]:.3f} 1.7 0 0 0 -.74"/></filter>
<filter id="cgf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .6" numOctaves="4" seed="5" stitchTiles="stitch"/>
<feColorMatrix type="matrix" values="0 0 0 0 {GR[0]:.3f} 0 0 0 0 {GR[1]:.3f} 0 0 0 0 {GR[2]:.3f} .9 0 0 0 -.40"/></filter>
<linearGradient id="k1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".30" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="k2" x1="0" y1="0" x2="0" y2="1"><stop offset=".28" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff"/><stop offset=".62" stop-color="#fff"/><stop offset=".78" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="k3" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#fff"/></linearGradient>
<mask id="m1"><rect y="540" width="{W}" height="600" fill="url(#k1)"/></mask><mask id="m2"><rect y="540" width="{W}" height="600" fill="url(#k2)"/></mask><mask id="m3"><rect y="540" width="{W}" height="600" fill="url(#k3)"/></mask>
{blur('b60', 60)}{blur('b30', 30)}{blur('b24', 24)}{blur('b10', 10)}{blur('b6', 6)}{blur('b3', 3)}{blur('b2', 1.5)}
{grain('gn', 9, '.9', T['ink'], .05)}
</defs>
<rect width="{W}" height="560" fill="url(#cw)"/>
<rect width="{W}" height="560" fill="url(#cg)"/>
<g filter="url(#b6)">{bokeh}</g>
<g filter="url(#b24)">{plant}</g>
<!-- سطح الطاولة: بلوط فاتح، والعروق تخف لورا (عمق) -->
<rect y="540" width="{W}" height="600" fill="url(#ct)"/>
<g mask="url(#cm)"><g mask="url(#m1)"><rect y="540" width="{W}" height="600" filter="url(#cg1)"/></g><g mask="url(#m2)"><rect y="540" width="{W}" height="600" filter="url(#cg2)"/></g><g mask="url(#m3)"><rect y="540" width="{W}" height="600" filter="url(#cg3)"/></g><rect y="540" width="{W}" height="600" filter="url(#cgf)" opacity=".5"/></g>
<ellipse cx="520" cy="660" rx="620" ry="70" fill="{T['white']}" opacity=".26" filter="url(#b30)"/>
<rect y="540" width="{W}" height="22" fill="url(#cao)"/>
<rect y="538" width="{W}" height="3" fill="{C['oak_edge']}" opacity=".5"/>
<!-- الحافة الأمامية -->
<rect y="1140" width="{W}" height="42" fill="{C['oak_edge']}"/>
<rect y="1140" width="{W}" height="3" fill="{C['oak_front']}"/>
<rect y="1143" width="{W}" height="10" fill="{T['white']}" opacity=".08"/>
<rect y="1182" width="{W}" height="18" fill="{C['floor']}"/>
<!-- الكوب والصحن (الضوء من فوق يمين، فالظل لتحت يسار) -->
<ellipse cx="{cx - 26}" cy="{sy + 16}" rx="168" ry="40" fill="{T['ink']}" opacity=".30" filter="url(#b10)"/>
<ellipse cx="{cx}" cy="{sy}" rx="152" ry="40" fill="url(#cs)"/>
<ellipse cx="{cx}" cy="{sy + 5}" rx="152" ry="38" fill="none" stroke="{C['cup_lo']}" stroke-width="3" opacity=".55"/>
<ellipse cx="{cx}" cy="{sy - 4}" rx="104" ry="24" fill="{C['cup_lo']}" opacity=".45"/>
<ellipse cx="{cx - 18}" cy="{sy - 2}" rx="80" ry="16" fill="{T['ink']}" opacity=".22" filter="url(#b6)"/>
<path d="M{cx + 88} {sy - 112} c38 -8 60 12 56 36 c-4 24 -30 34 -58 30" fill="none" stroke="{C['cup_lo']}" stroke-width="17" stroke-linecap="round"/>
<path d="M{cx + 88} {sy - 112} c38 -8 60 12 56 36 c-4 24 -30 34 -58 30" fill="none" stroke="{T['white']}" stroke-width="7" stroke-linecap="round" opacity=".9" transform="translate(1 -3)"/>
<path d="M{cx - 92} {sy - 128} C{cx - 90} {sy - 60} {cx - 70} {sy - 22} {cx - 40} {sy - 12} Q{cx} {sy - 4} {cx + 40} {sy - 12} C{cx + 70} {sy - 22} {cx + 90} {sy - 60} {cx + 92} {sy - 128} Z" fill="url(#cu)"/>
<ellipse cx="{cx}" cy="{sy - 128}" rx="92" ry="25" fill="{T['white']}"/>
<ellipse cx="{cx}" cy="{sy - 126}" rx="83" ry="20" fill="url(#ccr)"/>
<ellipse cx="{cx}" cy="{sy - 128}" rx="92" ry="25" fill="none" stroke="{C['cup_lo']}" stroke-width="1.5" opacity=".6"/>
<path d="M{cx + 50} {sy - 110} C{cx + 60} {sy - 80} {cx + 58} {sy - 50} {cx + 44} {sy - 26}" fill="none" stroke="{T['white']}" stroke-width="8" stroke-linecap="round" opacity=".7" filter="url(#b3)"/>
<rect width="{W}" height="{H}" filter="url(#gn)"/>
</svg>'''

# ===== الجوال اللي يلمس: نفس هندسة phone-frame.svg (240x500)، وحوله فراغ للظل. نقطة اللمس (منتصف الحافة العليا + 8) على (230, 38) من 420x640 =====
PHONE_PAD = (110, 30, 70, 110)   # الظل الواسع ينقص على حافة الملف بنعومة (blur 24 داخل 80px)    # يسار، فوق، يمين، تحت
def phone_svg():
    l, t, r, b = PHONE_PAD
    vw, vh = 240 + l + r, 500 + t + b
    body = 'M33.3 0H206.7A33.3 33.3 0 0 1 240 33.3V466.7A33.3 33.3 0 0 1 206.7 500H33.3A33.3 33.3 0 0 1 0 466.7V33.3A33.3 33.3 0 0 1 33.3 0Z'
    # الظل: تلامس ضيق عند الحافة العليا (لامسة اللوحة)، وظل أوسع وأبعد لتحت (طرف الجوال بعيد عن السطح).
    # الإزاحة محسوبة لدوران -22° عشان يطلع الظل في العالم لتحت يسار (الضوء من فوق يمين)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-l} {-t} {vw} {vh}" width="{vw}" height="{vh}" aria-hidden="true" focusable="false">
<defs>
<filter id="pt-b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="pt-b16" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="24"/></filter>
<linearGradient id="pt-mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="pt-mb" x1="0" y1="0" x2="0" y2="1"><stop offset=".1" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="pt-kt" maskUnits="userSpaceOnUse" x="{-l}" y="{-t}" width="{vw}" height="{vh}"><rect x="{-l}" y="{-t}" width="{vw}" height="{vh}" fill="url(#pt-mt)"/></mask>
<mask id="pt-kb" maskUnits="userSpaceOnUse" x="{-l}" y="{-t}" width="{vw}" height="{vh}"><rect x="{-l}" y="{-t}" width="{vw}" height="{vh}" fill="url(#pt-mb)"/></mask>
<linearGradient id="pt-rim" x1="0" x2="1"><stop offset="0" stop-color="{C['rim']}" stop-opacity=".35"/><stop offset=".8" stop-color="{C['rim']}" stop-opacity=".5"/><stop offset="1" stop-color="{C['rim']}"/></linearGradient>
<linearGradient id="pt-gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{C['glass_hi']}"/><stop offset=".55" stop-color="{C['glass']}"/><stop offset="1" stop-color="{C['glass']}"/></linearGradient>
<linearGradient id="pt-rf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="pt-sc"><rect x="10" y="10" width="220" height="480" rx="23.3"/></clipPath>
</defs>
<g mask="url(#pt-kt)"><path d="{body}" transform="translate(-5 3)" fill="{T['ink']}" opacity=".45" filter="url(#pt-b3)"/></g>
<g mask="url(#pt-kb)"><path d="{body}" transform="translate(-30 26)" fill="{T['ink']}" opacity=".24" filter="url(#pt-b16)"/></g>
<rect x="-2.2" y="112" width="3" height="30" rx="1.5" fill="{C['rim']}"/><rect x="-2.2" y="160" width="3" height="54" rx="1.5" fill="{C['rim']}"/><rect x="239.2" y="150" width="3" height="76" rx="1.5" fill="{C['rim']}"/>
<path d="{body}" fill="{C['body']}"/>
<path d="{body}" fill="none" stroke="url(#pt-rim)" stroke-width="2.4" transform="translate(1.2 1.2) scale(.99)"/>
<rect x="10" y="10" width="220" height="480" rx="23.3" fill="url(#pt-gl)"/>
<g clip-path="url(#pt-sc)"><polygon points="120,10 230,10 230,140 20,490 10,490 10,330" fill="url(#pt-rf)"/></g>
<rect x="10.5" y="10.5" width="219" height="479" rx="22.8" fill="none" stroke="{C['rim']}" stroke-opacity=".18"/>
<circle cx="120" cy="20.7" r="4.5" fill="{T['ink']}"/><circle cx="121.2" cy="19.6" r="1.3" fill="{C['rim']}" opacity=".6"/>
</svg>'''

# ===== قاعدة الستاند: حامل أكريليك شفاف A6 مائل. الإحداثيات بعرض وجه الستاند = 100 (الوجه من 0 إلى 100، وحافته السفلية على y=0) =====
def base_svg():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -2 128 22" width="128" height="22" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<defs>
<filter id="sb-b" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>
<filter id="sb-s" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation=".5"/></filter>
<linearGradient id="sb-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient>
<linearGradient id="sb-e" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient>
</defs>
<ellipse cx="46" cy="14.5" rx="64" ry="3.6" fill="{T['ink']}" opacity=".26" filter="url(#sb-b)"/>
<path d="M-4 0 H104 L110 12 H-10 Z" fill="{T['ink']}" opacity=".06"/>
<path d="M-4 0 H104 L110 12 H-10 Z" fill="url(#sb-p)"/>
<path d="M-10 12 H110 V14.6 H-10 Z" fill="url(#sb-e)"/>
<path d="M-10 14.6 H110" stroke="{T['ink']}" stroke-opacity=".22" stroke-width=".35"/>
<path d="M-4 0 H104" stroke="#fff" stroke-opacity=".9" stroke-width=".35"/>
<path d="M104 0 L110 12" stroke="#fff" stroke-opacity=".8" stroke-width=".4"/>
<path d="M-4 0 L-10 12" stroke="#fff" stroke-opacity=".45" stroke-width=".35"/>
<rect x="0" y="-.2" width="100" height="1.4" fill="{T['ink']}" opacity=".28" filter="url(#sb-s)"/>
</svg>'''

# ===== الرسم والطبقتين =====
def render(svg, png):
    ud = tempfile.mkdtemp(prefix='lt-edge-')
    cmd = [EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=%d,%d' % (W, H),
           '--user-data-dir=' + ud, '--screenshot=' + png, 'file:///' + svg.replace('\\', '/')]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
    im = Image.open(png).convert('RGB')
    assert im.size == (W, H), im.size
    return im

def recipe():
    spec = importlib.util.spec_from_file_location('ci', os.path.join(ROOT, 'tools', 'convert-images.py'))
    ci = importlib.util.module_from_spec(spec); spec.loader.exec_module(ci)   # قراءة بس: نفس الحبر والرملي ومنحنى S
    return ci

def bw_layer(ci, im, seed):
    """وصفة ملحق الفاتح §6 (الحبر على الورق، S خفيف، حبيبات σ=2) بدون إجبار الوسيط على 42-58:
    المشهد فاتح بقرار GM-049 («الخلفية فاتحة»)، والإجبار كان يطفّيه. الوسيط يطلع في التقرير."""
    a = np.asarray(im, dtype=np.float64)
    l = ci.lstar(ci.lin(a / 255.0) @ ci.REC709)
    lo, hi = np.percentile(l, (0.5, 99.5))
    x = np.clip((l - lo) / (hi - lo), 0, 1)
    out = ci.RAMP[np.rint(ci.s_curve(x) * 4095).astype(np.int32)] * 255
    out += np.random.default_rng(seed).normal(0, 2, out.shape[:2])[..., None]
    bw = Image.fromarray(np.clip(np.rint(out), 0, 255).astype(np.uint8))
    med = float(np.median(ci.lstar(ci.lin(np.asarray(bw, dtype=np.float64) / 255) @ ci.REC709)))
    return bw, med

def webp(img, limit_kb):
    for q in range(86, 40, -4):
        buf = io.BytesIO(); img.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= limit_kb * 1024:
            return buf.getvalue(), q
    raise SystemExit('ما قدر يوصل تحت %dKB' % limit_kb)

def main():
    out = OUT
    if '--out' in sys.argv:
        out = sys.argv[sys.argv.index('--out') + 1]
    os.makedirs(out, exist_ok=True); os.makedirs(SRC, exist_ok=True)
    if not EDGE:
        raise SystemExit('ما لقيت Microsoft Edge')
    ci = recipe()
    for name, svg in (('scene-hosts', host_svg()), ('scene-restaurants', cafe_svg())):
        sp = os.path.join(SRC, name + '.svg')
        with open(sp, 'w', encoding='utf-8') as f:
            f.write(svg)
        im = render(sp, os.path.join(tempfile.gettempdir(), name + '.png'))
        bw, med = bw_layer(ci, im, 2049 + len(name))
        for layer, img in (('color', im), ('bw', bw)):
            for w in (1600, 800):
                data, q = webp(img if w == W else img.resize((w, w * H // W), Image.LANCZOS), LIMIT[w])
                p = os.path.join(out, '%s-%s-%d.webp' % (name, layer, w))
                with open(p, 'wb') as f:
                    f.write(data)
                print('%-44s %dx%d  %7d bytes  q%d%s' % (os.path.relpath(p, ROOT), w, w * H // W, len(data), q, ('  وسيط L* %.1f' % med) if layer == 'bw' and w == W else ''))
    for fn, svg in (('phone-tap.svg', phone_svg()), ('stand-base.svg', base_svg())):
        p = os.path.join(out, fn)
        with open(p, 'w', encoding='utf-8', newline='\n') as f:
            f.write(svg)
        print('%-44s %7d bytes' % (os.path.relpath(p, ROOT), os.path.getsize(p)))

if __name__ == '__main__':
    main()
