# يركّب صورة (تصميم طباعة PNG أو شعار SVG) داخل صورة حقيقية بالمنظور — الأداة الثابتة لـ GM-054 و GM-057.
# الاستخدام:
#   شاشة جوال خضرا (يلقى المكان لحاله):
#     python tools/place-artwork.py --photo brand/photos/originals/hand-phone-cafe.jpg --green \
#       --art website/assets/brand/logo-stack.svg --canvas "#FAF7F2" --art-scale 0.52 --glare 0.06 \
#       --out brand/photos/originals/hand-phone-cafe-logo.jpg
#   لوحة أو ستاند على جدار/طاولة (أربع زوايا بالبكسل: فوق يمين الصورة؟ لا — الترتيب دايماً: فوق يسار، فوق يمين، تحت يمين، تحت يسار):
#     python tools/place-artwork.py --photo <صورة المكان> --art website/assets/print/checkout-sign.png \
#       --quad "812,402 1190,410 1186,690 808,684" --shadow 0.35 --glare 0.04 --out <الناتج.jpg>
#   تصميم على كرت أبيض موجود في الصورة (ستاند أكريليك، برواز فيه ورقة): --fit contain --blend multiply
#     التصميم يدخل الكرت بنسبته (بدون مط)، والباقي أبيض، وبعدين «ضرب» في الصورة: الأبيض = الصورة نفسها بالضبط
#     (نفس الإضاءة والظل والانعكاس والحبيبات)، والحبر ياخذ إضاءة المكان. فالتركيب ما يبان، ودقة الزوايا ±2px ما تفرق.
#     python tools/place-artwork.py --photo <المشهد> --art website/assets/print/restaurant-stand.png \
#       --quad "1001.6,431 1427.5,431 1427.5,1103.9 1011.3,1130.9" --fit contain --blend multiply --soften 0.6 --out <الناتج.webp>
#   الوصفة الكاملة لمشاهد الموقع: brand/photos/composites/README.md
# القواعد (GM-054): لو التركيب بان إنه مركّب، نرجع للأبسط (صورة المكان والمنتج جنبها أصغر). المدير الفني يحكم (9/10).
# يحتاج: opencv-python و numpy و Pillow، و Edge أو Chrome لرسم SVG.
import argparse, os, pathlib, subprocess, tempfile
import numpy as np
import cv2

BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]


def render_svg(svg, w, h, canvas, scale):
    """يرسم SVG (أو صورة) في وسط لوحة بلون canvas بمقاس w×h، بعرض scale من العرض."""
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("ما لقيت Edge أو Chrome لرسم SVG")
    with tempfile.TemporaryDirectory() as tmp:
        page = pathlib.Path(tmp) / "a.html"
        out = pathlib.Path(tmp) / "a.png"
        page.write_text(f'<!doctype html><html><body style="margin:0;background:{canvas};width:{w}px;height:{h}px;'
                        f'display:flex;align-items:center;justify-content:center"><img src="{pathlib.Path(svg).resolve().as_uri()}" '
                        f'style="width:{int(w * scale)}px;height:auto;display:block"></body></html>', encoding="utf-8")
        subprocess.run([browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                        f"--window-size={w},{h}", f"--user-data-dir={tmp}", f"--screenshot={out}", page.as_uri()],
                       check=True, capture_output=True, timeout=90)
        img = cv2.imread(str(out), cv2.IMREAD_UNCHANGED)
    return cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)


def resize_rgba(img, size):
    """تصغير PNG شفاف بدون حافة غامقة: اللون يتصغر مضروب في الشفافية، وبعدين ينقسم عليها.
    (الشفاف الكامل لونه أسود عادة، والتصغير العادي يسحب هالأسود على الحافة: قوس رمادي عند الزوايا المدورة)"""
    if img.shape[2] != 4:
        return cv2.resize(img, size, interpolation=cv2.INTER_AREA)
    al = img[..., 3].astype(np.float32) / 255.0
    pm = cv2.resize(img[..., :3].astype(np.float32) * al[..., None], size, interpolation=cv2.INTER_AREA)
    al = cv2.resize(al, size, interpolation=cv2.INTER_AREA)
    rgb = np.where(al[..., None] > 1e-4, pm / np.maximum(al[..., None], 1e-4), 0)
    return np.dstack([np.clip(rgb, 0, 255), al * 255]).round().astype(np.uint8)


def green_quad(photo):
    b, g, r = [photo[..., i].astype(int) for i in range(3)]
    mask = ((g > 120) & (g > r + 50) & (g > b + 50)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        raise SystemExit("ما لقيت شاشة خضرا في الصورة")
    box = cv2.boxPoints(cv2.minAreaRect(max(cnts, key=cv2.contourArea)))
    s, d = box.sum(1), np.diff(box, axis=1).ravel()
    return np.float32([box[np.argmin(s)], box[np.argmin(d)], box[np.argmax(s)], box[np.argmax(d)]]), mask


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--photo", required=True)
    ap.add_argument("--art", required=True, help="PNG (يفضل شفاف) أو SVG")
    ap.add_argument("--out", required=True)
    ap.add_argument("--green", action="store_true", help="يلقى شاشة خضرا ويستبدلها")
    ap.add_argument("--quad", help='"x,y x,y x,y x,y": فوق يسار، فوق يمين، تحت يمين، تحت يسار')
    ap.add_argument("--canvas", default="#FAF7F2", help="لون خلفية اللوحة لما الفن SVG")
    ap.add_argument("--art-scale", type=float, default=1.0, help="عرض الفن من عرض اللوحة (SVG)")
    ap.add_argument("--glare", type=float, default=0.0, help="لمعة زجاج 0 إلى 0.1")
    ap.add_argument("--shadow", type=float, default=0.0, help="ظل ناعم تحت الفن 0 إلى 0.5")
    ap.add_argument("--feather", type=float, default=1.5)
    ap.add_argument("--fit", choices=["stretch", "contain"], default="stretch",
                    help="stretch: التصميم ياخذ شكل الزوايا. contain: بنسبته داخلها والباقي بلون --pad (للكروت البيضاء)")
    ap.add_argument("--pad", default="#FFFFFF", help="لون الفراغ حول التصميم مع --fit contain")
    ap.add_argument("--blend", choices=["normal", "multiply"], default="normal",
                    help="multiply: التصميم × الصورة (ورق مطبوع تحت نفس الضو). للكروت البيضاء بس")
    ap.add_argument("--soften", type=float, default=0.0, help="تنعيم خفيف للتصميم بعد التركيب (σ بالبكسل) عشان يطابق حدة الصورة")
    a = ap.parse_args()

    photo = cv2.imread(a.photo)
    h, w = photo.shape[:2]
    if a.green:
        quad, mask = green_quad(photo)
    elif a.quad:
        quad = np.float32([[float(v) for v in p.split(",")] for p in a.quad.split()])
        mask = np.zeros((h, w), np.uint8)
        cv2.fillConvexPoly(mask, quad.astype(np.int32), 255)
    else:
        raise SystemExit("حدد --green أو --quad")
    # مقاس اللوحة = متوسط أضلاع الزوايا. التصميم يتصغر لهالمقاس بـ INTER_AREA قبل المنظور (تصغير بدون تشرشر للنص والباركود)،
    # وبعدين المنظور تقريباً 1:1. الـ SVG ينرسم 3 أضعاف وبعدين يتصغر بنفس الطريقة
    W = int(round((np.linalg.norm(quad[1] - quad[0]) + np.linalg.norm(quad[2] - quad[3])) / 2))
    H = int(round((np.linalg.norm(quad[3] - quad[0]) + np.linalg.norm(quad[2] - quad[1])) / 2))
    if a.art.lower().endswith(".svg"):
        art = cv2.resize(render_svg(a.art, W * 3, H * 3, a.canvas, a.art_scale), (W, H), interpolation=cv2.INTER_AREA)
    else:
        art = cv2.imread(a.art, cv2.IMREAD_UNCHANGED)
        if art is None:
            raise SystemExit(f"ما قدرت أقرأ {a.art}")
        if art.ndim == 2:
            art = cv2.cvtColor(art, cv2.COLOR_GRAY2BGR)
        if a.fit == "contain":   # بنسبته داخل W×H، والباقي بلون --pad (معتم). الشفاف ينفرش على نفس اللون قبل التصغير
            k = min(W / art.shape[1], H / art.shape[0])
            aw, ah = max(1, int(round(art.shape[1] * k))), max(1, int(round(art.shape[0] * k)))
            pad = np.array([int(a.pad.lstrip("#")[i:i + 2], 16) for i in (4, 2, 0)], float)   # BGR
            if art.shape[2] == 4:
                al = art[..., 3:4] / 255.0
                art = np.clip(np.rint(art[..., :3] * al + pad * (1 - al)), 0, 255).astype(np.uint8)
            small = cv2.resize(art, (aw, ah), interpolation=cv2.INTER_AREA).astype(float)
            canvas = np.empty((H, W, 3)); canvas[:] = pad
            x, y = (W - aw) // 2, (H - ah) // 2
            canvas[y:y + ah, x:x + aw] = small[..., :3]
            art = np.clip(np.rint(canvas), 0, 255).astype(np.uint8)
            print(f"contain: اللوحة {W}×{H} (نسبة {W / H:.3f})، التصميم {aw}×{ah} (نسبة {aw / ah:.3f})")
        else:
            art = resize_rgba(art, (W, H))
    if art.shape[2] == 4:
        art_alpha = art[..., 3].astype(float) / 255.0
        art = art[..., :3]
    else:
        art_alpha = np.ones((H, W))
    if a.glare > 0:
        yy, xx = np.mgrid[0:H, 0:W]
        g = np.clip(1 - np.abs((xx / W) + (yy / H) - 0.55) / 0.35, 0, 1) * a.glare
        art = np.clip(art.astype(float) + 255 * g[..., None], 0, 255).astype(np.uint8)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]]), quad)
    warped = cv2.warpPerspective(art, M, (w, h), flags=cv2.INTER_LANCZOS4, borderValue=(255, 255, 255))
    walpha = cv2.warpPerspective(art_alpha, M, (w, h), flags=cv2.INTER_LINEAR)
    if a.soften > 0:
        warped = cv2.GaussianBlur(warped, (0, 0), a.soften)
    base = photo.astype(float)
    if a.shadow > 0:  # ظل ناعم مزاح لتحت، ينحسب من شكل الفن نفسه
        sh = cv2.GaussianBlur(walpha, (0, 0), max(4.0, qh * 0.03))
        sh = np.roll(sh, int(qh * 0.02), axis=0) * a.shadow
        base = base * (1 - sh[..., None])
    region = cv2.GaussianBlur(mask.astype(float) / 255.0, (0, 0), a.feather) if a.green else walpha
    alpha = (region * (walpha if a.green else 1.0))[..., None]
    top = np.clip(warped.astype(float), 0, 255)
    if a.blend == "multiply":   # ورق تحت نفس الضو: الأبيض يرجع الصورة نفسها، والحبر يغمق بإضاءة المكان
        top = top / 255.0 * base
    comp = top * alpha + base * (1 - alpha)
    if a.green:  # إزالة بقايا الأخضر على الحافة
        ring = (region > 0.02) & (region < 0.98)
        cb, cg, cr = comp[..., 0], comp[..., 1], comp[..., 2]
        cg[ring] = np.minimum(cg[ring], np.maximum(cb, cr)[ring] + 6)
        comp = np.dstack([cb, cg, cr])
    out = np.clip(comp, 0, 255).astype(np.uint8)
    ext = a.out.lower().rsplit(".", 1)[-1]
    params = {"webp": [cv2.IMWRITE_WEBP_QUALITY, 95], "png": [cv2.IMWRITE_PNG_COMPRESSION, 6]}.get(ext, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not cv2.imwrite(a.out, out, params):
        raise SystemExit(f"ما قدرت أكتب {a.out}")
    left = int(((out[..., 1].astype(int) > out[..., 2].astype(int) + 50) & (out[..., 1].astype(int) > out[..., 0].astype(int) + 50)).sum())
    print(f"تم: {a.out}  الزوايا {quad.round(1).tolist()}  بقايا أخضر قوي: {left}")


if __name__ == "__main__":
    import sys
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8", errors="replace")
    main()
