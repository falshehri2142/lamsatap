# يحوّل صورة أصلية (بعد إذن التنزيل من صاحب المشروع) لملفين الرئيسية: WebP بعرض 800 و1600 في website/assets/images/.
# الحدود من «الاتجاه 2» §5.3 (web-art-director.md): ص1 (hero-hospitality) الـ1600 حده 180KB والـ800 حده 70KB،
# والباقي الـ1600 حده 140KB والـ800 حده 60KB. بدون تكبير، وبدون بيانات EXIF، وبدون فلتر ولا قص (القص بـ object-fit في home.css).
# لو Pillow ما يدعم WebP: JPEG progressive بنفس الحدود (§5.3).
# التشغيل: python tools/convert-images.py <الصورة الأصلية> <الاسم>
#   الأسماء: hero-hospitality · host-entry · shop-counter · touch-moment
# بعده: node tools/build-home-minis.cjs (يركّب <img> بـ srcset و sizes و width و height)، وسجّل الصورة في website/assets/images/CREDITS.md.
import os, sys, io
from PIL import Image, ImageOps, features

NAMES = {'hero-hospitality': (180, 70), 'host-entry': (140, 60), 'shop-counter': (140, 60), 'touch-moment': (140, 60)}
OUT = os.path.join(os.path.dirname(__file__), '..', 'website', 'assets', 'images')

def encode(img, fmt, limit_kb):
    for q in range(84, 44, -4):
        buf = io.BytesIO()
        if fmt == 'WEBP':
            img.save(buf, 'WEBP', quality=q, method=6)
        else:
            img.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
        if buf.tell() <= limit_kb * 1024:
            return buf.getvalue(), q
    raise SystemExit('ما قدر يوصل تحت %dKB حتى بجودة 48. اختر صورة أبسط أو قص أصغر.' % limit_kb)

def main():
    if len(sys.argv) != 3 or sys.argv[2] not in NAMES:
        raise SystemExit('الاستخدام: python tools/convert-images.py <الصورة> <' + ' | '.join(NAMES) + '>')
    src, name = sys.argv[1], sys.argv[2]
    fmt, ext = ('WEBP', 'webp') if features.check('webp') else ('JPEG', 'jpg')
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')   # الاتجاه من EXIF، وبعدها بدون أي بيانات
    for width, limit in zip((1600, 800), NAMES[name]):
        w = min(width, im.width)                                   # بدون تكبير
        h = round(im.height * w / im.width)
        data, q = encode(im.resize((w, h), Image.LANCZOS), fmt, limit)
        path = os.path.join(OUT, '%s-%d.%s' % (name, width, ext))
        with open(path, 'wb') as f:
            f.write(data)
        print('%s  %dx%d  %d bytes  (%s q%d، الحد %dKB)' % (os.path.relpath(path), w, h, len(data), fmt, q, limit))

if __name__ == '__main__':
    main()
