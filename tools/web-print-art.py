# نسخة الموقع من صور قسم الطباعة (print/renders/*.png -> website/assets/print/*.png)، بباركود وهمي ما ينقرى.
# ليش: صور الطباعة فيها باركود حقيقي ينقرى (https://example.com/t/...)، وقاعدة المدير العام للصور (GM-049، ورسالته بعد af691d7،
#   و GM-061): أي باركود داخل صورة في الموقع يا وهمي ما ينقرى، يا يودّي لـ /demo/ بس. فنخربط وحدات البيانات وصيغة الباركود
#   (format)، ونخلي أنماط التحديد الثلاثة والتوقيت والمحاذاة، فيبان باركود بنفس الكثافة والشكل، وما يفك.
#   ملفات قسم الطباعة نفسها ما تتغير (print/renders/ حقهم).
# الاستخدام: python tools/web-print-art.py            (كل الصور)
#            python tools/web-print-art.py checkout-sign  (صورة وحدة)
# بعده: python tools/check-qr.py website/assets/print/*.png --jsqr <مسار jsqr>   (يفحص بـ OpenCV و jsQR)
import pathlib, sys, zlib
import numpy as np
import cv2

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "print" / "renders", ROOT / "website" / "assets" / "print"
SS = 32   # بكسل لكل وحدة في الرسم الكبير، وبعدين يتصغر بـ INTER_AREA (حواف ناعمة مثل الأصل)


def function_mask(n):
    """وحدات الباركود الثابتة (ما تتخربط): أنماط التحديد وفواصلها، والتوقيت، والمحاذاة، والوحدة الغامقة. الإصدار 2 لين 6."""
    v = (n - 17) // 4
    if not 2 <= v <= 6:
        raise SystemExit(f"الباركود {n}×{n} (إصدار {v}): الأداة تعرف الإصدار 2 لين 6 بس")
    m = np.zeros((n, n), bool)
    m[:8, :8] = m[:8, n - 8:] = m[n - 8:, :8] = True        # التحديد + الفاصل
    m[6, :] = m[:, 6] = True                                # التوقيت
    a = 4 * v + 10                                          # مركز المحاذاة الوحيد في الإصدار 2-6
    m[a - 2:a + 3, a - 2:a + 3] = True
    m[4 * v + 9, 8] = True                                  # الوحدة الغامقة
    return m


def fake(name):
    src = SRC / f"{name}.png"
    art = cv2.imread(str(src), cv2.IMREAD_UNCHANGED)
    if art is None:
        raise SystemExit(f"ما لقيت {src}")
    alpha = art[..., 3:4] / 255.0 if art.shape[2] == 4 else 1.0
    flat = (art[..., :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
    det = cv2.QRCodeDetector()
    text, pts, straight = det.detectAndDecode(flat)
    if pts is None or straight is None:
        raise SystemExit(f"{name}: ما لقيت باركود")
    pts = pts.reshape(-1, 2)
    n = straight.shape[0]
    x0, y0 = pts.min(0); x1, y1 = pts.max(0)
    p = ((x1 - x0) + (y1 - y0)) / 2 / n
    gray = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY)
    c = (np.arange(n) + 0.5) * p
    mat = gray[np.rint(y0 + c).astype(int)[:, None], np.rint(x0 + c).astype(int)[None, :]] < 128
    fm = function_mask(n)
    # تأكد إن القراءة صحيحة: نمط التحديد فوق يسار (7×7: إطار غامق، حلقة فاتحة، مربع 3×3 غامق)
    ring = np.ones((7, 7), bool); ring[1:6, 1:6] = False; ring[2:5, 2:5] = True
    if not (mat[:7, :7] == ring).all():
        raise SystemExit(f"{name}: قراءة الوحدات غلط (نمط التحديد ما طابق)")
    dark = np.median(flat[np.rint(y0 + c).astype(int)[:, None], np.rint(x0 + c).astype(int)[None, :]][mat], axis=0)
    rng = np.random.default_rng(zlib.crc32(name.encode()))
    free = ~fm
    vals = mat[free].copy()
    for _ in range(20):   # نخربط لين يطلع مختلف عن الأصل في أغلب الوحدات
        rng.shuffle(vals)
        if (vals != mat[free]).mean() > 0.4:
            break
    new = mat.copy(); new[free] = vals
    # الرسم: أبيض ثم الوحدات الغامقة بلون الأصل، كبير ثم يتصغر لنفس مربع الباركود بالضبط
    big = np.full((n * SS, n * SS, 3), 255, np.uint8)
    for i, j in zip(*np.nonzero(new)):
        big[i * SS:(i + 1) * SS, j * SS:(j + 1) * SS] = dark
    side = int(round(n * p)); L, T = int(round(x0)), int(round(y0))
    out = art.copy()
    out[T:T + side, L:L + side, :3] = cv2.resize(big, (side, side), interpolation=cv2.INTER_AREA)
    if out.shape[2] == 4:
        out[T:T + side, L:L + side, 3] = 255
    # الفحص: ولا مقاس يفك (OpenCV هنا، و jsQR في tools/check-qr.py)
    flat2 = out[..., :3] if out.shape[2] == 3 else (out[..., :3] * (out[..., 3:4] / 255.0) + 255 * (1 - out[..., 3:4] / 255.0)).astype(np.uint8)
    for s in (0.35, 0.5, 0.75, 1.0, 1.5, 2.0):
        t, *_ = det.detectAndDecode(cv2.resize(flat2, None, fx=s, fy=s, interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC))
        if t:
            raise SystemExit(f"{name}: الباركود الوهمي انقرى بمقاس {s}: {t}")
    OUT.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(OUT / f"{name}.png"), out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    changed = int((new != mat).sum())
    print(f"{name}: الأصل «{text}»، {n}×{n}، الوحدة {p:.2f}px، تغيّرت {changed} وحدة من {int(free.sum())} -> {OUT / (name + '.png')}")


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8", errors="replace")
    names = sys.argv[1:] or sorted(f.stem for f in SRC.glob("*.png"))
    for n in names:
        fake(n)


if __name__ == "__main__":
    main()
