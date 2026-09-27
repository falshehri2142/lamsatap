# يحوّل صورة أصلية (بعد إذن التنزيل من صاحب المشروع) لملفات WebP بعرض 800 و1600 في website/assets/images/.
# نوعين من الأسماء:
# 1) صور «الاتجاه 2» (NAMES، الرئيسية القديمة): ملف ملون بس، بدون فلتر ولا قص (القص بـ object-fit في home.css).
#    الحدود من «الاتجاه 2» §5.3 (web-art-director.md): ص1 (hero-hospitality) الـ1600 حده 180KB والـ800 حده 70KB،
#    والباقي الـ1600 حده 140KB والـ800 حده 60KB.
# 2) صور «الاتجاه 3» (LAYERS، المطاعم والمضيفين والبابين): طبقتين لكل خانة، بنفس القص ونفس الأبعاد بالبكسل (§4 و§7.1):
#    <الاسم>-bw-800/1600: أبيض وأسود «بحبرنا على ورقنا» (وصفة ملحق الفاتح §6). تحت، وهي اللي تبان بدون JS.
#    <الاسم>-color-800/1600: اللون بمزاج الصفحة (§4). فوقها، وينكشف بخط المسح.
#    الـ800 من الـ1600 نفسها بنفس التصغير للطبقتين، فتنطبق وحدة على الثانية.
#    القص ينخبز في الملف بس لو الخانة تبي ملف لحالها (H2)، والباقي تقصه الصفحة بـ object-fit و object-position.
# الكل: بدون تكبير، وبدون بيانات EXIF ولا ملف ألوان (الأصول sRGB). لو Pillow ما يدعم WebP: JPEG progressive بنفس الحدود (§5.3).
# التشغيل: python tools/convert-images.py <الصورة الأصلية> <الاسم>
#            الأسماء: hero-hospitality · host-entry · shop-counter · touch-moment (ملون بس)
#                     restaurant-dallah · restaurant-phone-stand · restaurant-counter · host-hallway-door · host-door-closeup (طبقتين)
#          python tools/convert-images.py --layers   (خانات «الاتجاه 3» كلها من أصولها في brand/photos/originals/)
# يحتاج Pillow و numpy (موجودين). بعده: node tools/build-home-minis.cjs (يركّب <img> بـ srcset و sizes و width و height)، أو ركّبه بنفسك
# بنفس القيم للطبقتين، وسجّل الصورة في website/assets/images/CREDITS.md.
import os, sys, io, zlib
import numpy as np
from PIL import Image, ImageOps, features

NAMES = {'hero-hospitality': (180, 70), 'host-entry': (140, 60), 'shop-counter': (140, 60), 'touch-moment': (140, 60)}
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'website', 'assets', 'images')
SRC = os.path.join(ROOT, 'brand', 'photos', 'originals')

# خانات «الاتجاه 3»: الاسم: (الأصل، المزاج، بطل؟، القص). المزاج warm للمطاعم (يطلع الدفا) و light للمضيفين (يطلع الضوء).
# القص نسب من الأصل (x من اليسار و y من فوق) ومعه النسبة عرض/ارتفاع: العرض من x، والارتفاع من النسبة حول وسط y.
LAYERS = {
    'restaurant-dallah':      ('restaurant-dallah.jpg',      'warm',  True,  None),                   # R1: بطل المطاعم وباب المطاعم
    'restaurant-phone-stand': ('restaurant-phone-stand.jpg', 'warm',  False, None),                   # R2: قصة المطاعم
    'restaurant-counter':     ('shop-counter.jpg',           'warm',  False, None),                   # R3: مشهد العرض الحي للمطاعم
    'host-hallway-door':      ('host-hallway-door.jpg',      'light', True,  None),                   # H1: بطل المضيفين وبابهم
    'host-door-closeup':      ('host-hallway-door.jpg',      'light', False, (36, 39, 72, 73, 4 / 5)),  # H2: قصة المضيفين، الباب واللوحة (4:5)
}
# حدود «الاتجاه 3» §4 بالـKB، للـ1600: (الأبيض والأسود، اللون). والـ800 نصها.
LIMITS = {True: (180, 180), False: (120, 160)}

INK = np.array((0x14, 0x20, 0x1F)) / 255      # الحبر --lt-ink
SAND = np.array((0xFA, 0xF7, 0xF2)) / 255     # الرملي --lt-sand-50 (خلفية الصفحة)
SAFFRON = np.array((0xF2, 0xA9, 0x3B)) / 255  # الزعفران --lt-saffron
TEAL = np.array((0x0B, 0x7A, 0x75)) / 255     # التيل --lt-teal
LIFT = np.array((0x2A, 0x3B, 0x38)) / 255     # ظلال المضيفين (§4)
XYZ = np.array(((0.4124564, 0.3575761, 0.1804375), (0.2126729, 0.7151522, 0.0721750), (0.0193339, 0.1191920, 0.9503041)))
REC709 = XYZ[1]                               # إضاءة Rec.709 (نفس أساسيات sRGB)
D65 = XYZ.sum(1)

def lin(u):   # sRGB من 0 لـ 1 -> ضوء خطي
    return np.where(u <= 0.04045, u / 12.92, ((u + 0.055) / 1.055) ** 2.4)

def srgb(v):  # ضوء خطي -> sRGB من 0 لـ 1
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)

def lstar(y):  # إضاءة خطية -> L* من 0 لـ 100
    return np.where(y > 216 / 24389, 116 * np.cbrt(y) - 16, y * 24389 / 27)

def y_of(l):   # L* -> إضاءة خطية
    return np.where(l > 8, ((l + 16) / 116) ** 3, l * 27 / 24389)

def to_lab(v):   # ضوء خطي -> CIELAB (D65)
    f = v @ XYZ.T / D65
    f = np.where(f > 216 / 24389, np.cbrt(f), (24389 / 27 * f + 16) / 116)
    return np.stack((116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])), -1)

def from_lab(c):  # CIELAB -> ضوء خطي
    fy = (c[..., 0] + 16) / 116
    f = np.stack((fy + c[..., 1] / 500, fy, fy - c[..., 2] / 200), -1)
    return (np.where(f > 6 / 29, f ** 3, (116 * f - 16) * 27 / 24389) * D65) @ np.linalg.inv(XYZ).T

def smooth(a, b, x):  # smoothstep
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def s_curve(x):  # S خفيف: ميل الوسط 1.08 (تباين الوسط +8%)، والطرفين ثابتين
    return x - 0.08 / (2 * np.pi) * np.sin(2 * np.pi * x)

# خط «حبر على ورق»: لكل t من 0 (حبر) لـ 1 (رملي) لون يخلط الحبر والرملي بالضوء الخطي مثل الطباعة،
# ونسبة الحبر محسوبة عشان L* يمشي خطي مع t. يعني الظلال حبر مايل للتيل، والوسط رمادي دافي، والفاتح ورق.
L_INK, L_SAND = float(lstar(lin(INK) @ REC709)), float(lstar(lin(SAND) @ REC709))
def ramp(t):
    y = y_of(L_INK + t * (L_SAND - L_INK))
    ink = (lin(SAND) @ REC709 - y) / (lin(SAND) @ REC709 - lin(INK) @ REC709)
    return srgb((1 - ink)[..., None] * lin(SAND) + ink[..., None] * lin(INK))
RAMP = ramp(np.linspace(0, 1, 4096))

def bw_layer(rgb, hero, seed, sigma):
    """الطبقة الأولى (ملحق الفاتح §6): الرمادي Rec.709، ثم أغمق 1% حبر وأفتح 1% رملي، ثم التعريض، ثم S، ثم الحبيبات."""
    l = lstar(lin(rgb / 255.0) @ REC709)
    lo, hi = np.percentile(l, (1, 99))
    x = np.clip((l - lo) / (hi - lo), 0, 1)
    # التعريض: وسيط L* النهائي بين 42 و58، والبطل مسموح له ينزل لين 35 عشان الدراما. لو برّا: أقرب حد،
    # بمنحنى Schlick (bias) يحرك الوسط والطرفين ثابتين، وما يطمس الظلال مثل gamma (خشب الأبواب يبقى له ملمس).
    m = float(np.clip(np.median(x), 1e-3, 1 - 1e-3))
    band = (35, 58) if hero else (42, 58)
    now = L_INK + s_curve(m) * (L_SAND - L_INK)
    want = min(max(now, band[0] + 0.5), band[1] - 0.5)
    if abs(want - now) > 1e-6:
        grid = np.linspace(0, 1, 4097)
        a = (m / np.interp((want - L_INK) / (L_SAND - L_INK), s_curve(grid), grid) - 1) / (1 - m)
        x = x / (a * (1 - x) + 1)
    out = RAMP[np.rint(s_curve(x) * 4095).astype(np.int32)] * 255
    # الحبيبات: أحادية (نفس القيمة للقنوات الثلاث)، σ من 255، بـ seed ثابت عشان نفس الملف كل مرة
    out += np.random.default_rng(seed).normal(0, sigma, out.shape[:2])[..., None]
    return Image.fromarray(np.clip(np.rint(out), 0, 255).astype(np.uint8)), now

# المزاج (§4): المطاعم أدفى درجة (+10 mired، مثل فلتر 81، ضرايب محسوبة من خط Planck وإضاءة المحايد ثابتة)،
# والفاتح يميل للزعفران 10%، والظلال تنزل لين الحبر، والتعريض نفسه، والتشبع 90%.
# المضيفين: توازن محايد، والفاتح ينظف لين الرملي، والظلال ترتفع لين #2A3B38 وتميل للتيل 6%، والتعريض +0.3 EV، والتشبع 85%.
MOODS = {
    'warm':  dict(wb=(1.0338, 0.9962, 0.9381), ev=0.0, sat=0.90, black=INK,  white=np.ones(3), hi=(SAFFRON, 0.10), lo=None,        clean=False),
    'light': dict(wb=(1.0, 1.0, 1.0),          ev=0.3, sat=0.85, black=LIFT, white=SAND,       hi=None,           lo=(TEAL, 0.06), clean=True),
}

def color_layer(rgb, mood):
    """الطبقة الثانية (§4): نفس البكسلات بالضبط، واللون بس يتغير. الإضاءة والتشبع في CIELAB عشان اللون ما يتلوث."""
    k = MOODS[mood]
    v = lin(rgb / 255.0) * np.array(k['wb']) * 2 ** k['ev']
    v = np.where(v > 0.75, 0.75 + 0.25 * np.tanh((v - 0.75) / 0.25), v)   # كتف ناعم للفاتح بدل ما ينقص (بعد +EV)
    c = to_lab(v)
    c[..., 1:] *= k['sat']                                                # التشبع: الـchroma × 0.90 أو 0.85، والدرجة نفسها
    if k['clean']:   # «الفاتح ينظف لين الرملي»: لون الفاتح ياخذ لون الرملي، بنفس إضاءته
        c[..., 1:] += smooth(55, 95, c[..., 0])[..., None] * (to_lab(lin(SAND))[1:] - c[..., 1:])
    c[..., 0] = lstar(y_of(c[..., 0]) * (lin(k['white']) @ REC709))       # الأبيض: أبيض للمطاعم، ورملي للمضيفين
    # الظلال: أغمق 1% يوصل لـ L* لون الظلال (الحبر 11.1، أو #2A3B38 23.4)، والفرق يخف لين يختفي عند L* 50.
    # الإضاءة بس تتغير، واللون يبقى (البني الغامق يبقى بني). وأغمق الظلال (أقل من L* الظلال + 8) تاخذ لون الظلال نفسه.
    lb, ab = to_lab(lin(k['black']))[0], to_lab(lin(k['black']))[1:]
    l1 = np.percentile(c[..., 0], 1)
    c[..., 0] = np.maximum(c[..., 0] + (lb - l1) * (1 - smooth(l1, 50, c[..., 0])), lb)
    c[..., 1:] += (1 - smooth(lb, lb + 8, c[..., 0]))[..., None] * (ab - c[..., 1:])
    u, l = srgb(from_lab(c)), c[..., 0:1] / 100
    if k['hi']:   # الفاتح يميل للون (المطاعم: زعفران 10%)
        u = u + k['hi'][1] * smooth(0.5, 1.0, l) * (k['hi'][0] - u)
    if k['lo']:   # الظلال تميل للون (المضيفين: تيل 6%)
        u = u + k['lo'][1] * (1 - smooth(0.0, 0.5, l)) * (k['lo'][0] - u)
    return Image.fromarray(np.clip(np.rint(u * 255), 0, 255).astype(np.uint8))

def encode(img, fmt, limit_kb, qs=range(84, 44, -4), must=True):
    for q in qs:
        buf = io.BytesIO()
        if fmt == 'WEBP':
            img.save(buf, 'WEBP', quality=q, method=6)
        else:
            img.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
        if buf.tell() <= limit_kb * 1024:
            return buf.getvalue(), q
    if not must:
        return None, None
    raise SystemExit('ما قدر يوصل تحت %dKB حتى بجودة 48. اختر صورة أبسط أو قص أصغر.' % limit_kb)

def write(name, width, data, fmt, ext, size, note):
    path = os.path.join(OUT, '%s-%d.%s' % (name, width, ext))
    with open(path, 'wb') as f:
        f.write(data)
    print('%s  %dx%d  %d bytes  (%s)' % (os.path.relpath(path), size[0], size[1], len(data), note))

def crop(im, c):
    if not c:
        return im
    x0, y0, x1, y1, ratio = c
    l, r = round(im.width * x0 / 100), round(im.width * x1 / 100)
    h = round((r - l) / ratio)
    t = round(im.height * (y0 + y1) / 200 - h / 2)
    return im.crop((l, t, r, t + h))

def layers(src, name, fmt, ext):
    _, mood, hero, box = LAYERS[name]
    im = crop(ImageOps.exif_transpose(Image.open(src)).convert('RGB'), box)   # الاتجاه من EXIF، وبعدها بدون أي بيانات
    lim_bw, lim_col = LIMITS[hero]
    w = min(1600, im.width)                                                    # بدون تكبير
    size = (w, round(im.height * w / im.width))
    size8 = (min(800, im.width), round(im.height * min(800, im.width) / im.width))
    base = np.asarray(im.resize(size, Image.LANCZOS), dtype=np.float64)
    col = color_layer(base, mood)
    seed = zlib.crc32(name.encode())
    for sigma in (2, 1):   # الحبيبات σ=2 على الـ1600 قبل التصغير، ولو الملف عدّى حده بجودة 84 تنزل لـ 1 (§6)
        bw, med = bw_layer(base, hero, seed, sigma)
        data, q = encode(bw, fmt, lim_bw, (84,), must=False) if sigma == 2 else encode(bw, fmt, lim_bw)
        if data:
            break
    l_out = float(np.median(lstar(lin(np.asarray(bw, dtype=np.float64) / 255) @ REC709)))
    write(name + '-bw', 1600, data, fmt, ext, size, '%s q%d، الحد %dKB، حبيبات %d، وسيط L* %.1f وكان %.1f' % (fmt, q, lim_bw, sigma, l_out, med))
    data, q = encode(col, fmt, lim_col)
    write(name + '-color', 1600, data, fmt, ext, size, '%s q%d، الحد %dKB، المزاج %s' % (fmt, q, lim_col, mood))
    for layer, img, lim in (('bw', bw, lim_bw), ('color', col, lim_col)):   # الـ800 من الـ1600 نفسها، بنفس التصغير للطبقتين
        data, q = encode(img.resize(size8, Image.LANCZOS), fmt, lim / 2)
        write('%s-%s' % (name, layer), 800, data, fmt, ext, size8, '%s q%d، الحد %gKB' % (fmt, q, lim / 2))

def main():
    fmt, ext = ('WEBP', 'webp') if features.check('webp') else ('JPEG', 'jpg')
    if sys.argv[1:] == ['--layers']:
        for name, spec in LAYERS.items():
            layers(os.path.join(SRC, spec[0]), name, fmt, ext)
        return
    if len(sys.argv) != 3 or (sys.argv[2] not in NAMES and sys.argv[2] not in LAYERS):
        raise SystemExit('الاستخدام: python tools/convert-images.py <الصورة> <' + ' | '.join(list(NAMES) + list(LAYERS)) + '>\n'
                         '      أو: python tools/convert-images.py --layers')
    src, name = sys.argv[1], sys.argv[2]
    if name in LAYERS:
        return layers(src, name, fmt, ext)
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')   # الاتجاه من EXIF، وبعدها بدون أي بيانات
    for width, limit in zip((1600, 800), NAMES[name]):
        w = min(width, im.width)                                   # بدون تكبير
        h = round(im.height * w / im.width)
        data, q = encode(im.resize((w, h), Image.LANCZOS), fmt, limit)
        write(name, width, data, fmt, ext, (w, h), '%s q%d، الحد %dKB' % (fmt, q, limit))

if __name__ == '__main__':
    main()
