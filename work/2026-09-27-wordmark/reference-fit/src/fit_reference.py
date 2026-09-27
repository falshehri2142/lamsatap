"""قياس رمز صاحب المشروع (brand-source/owner-logo-2026-09-27.png) ومطابقته بنموذج شبكة 4×4 (GM-032).

النموذج: الرمز مربع ضلعه S = 4 خانات (c). كل خانة: مربع كامل، أو ربع دائرة نصف قطرها c، أو فاضية.
كل قطعة (من أربع، بتدوير 90°): ربع دائرة للخارج في زاوية الرمز + مربع على الحافة + ربع دائرة للداخل
(مركزها نفس مركز الربع الخارجي = مركز ربع الرمز). النجمة = الفراغ بين أرباع الدوائر الأربعة الداخلية.
يطلع: أفضل (x0, y0, c) بالتطابق (IoU)، وصور مقارنة في analysis/.
التشغيل من جذر المشروع:  python work/2026-09-27-brand-identity/logo-review/gm032/src/fit_reference.py
"""
import json
import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OUT = HERE.parent / "analysis"
OUT.mkdir(exist_ok=True)
REF = ROOT / "brand-source" / "owner-logo-2026-09-27.png"
SS = 8  # تنعيم: عينات لكل بكسل


def ref_coverage():
    """تغطية الأبيض لكل بكسل (0 إلى 1) من القناة الحمراء، والخلفية تتقدّر من المحيط."""
    a = np.asarray(Image.open(REF).convert("RGB")).astype(float)
    r = a[..., 0]
    white = a.min(axis=2) > 200
    # خلفية محلية: متوسط الأحمر للبكسلات اللي مو أبيض في نافذة حول الرمز
    y0, y1, x0, x1 = 120, 370, 260, 510
    win = r[y0:y1, x0:x1]
    bg = np.median(win[~white[y0:y1, x0:x1]])
    cov = np.clip((r - bg) / (255 - bg), 0, 1)
    return cov, bg


def model_mask(x0, y0, c, H, W, gap=0.0, ss=SS):
    """قناع النموذج (تغطية 0..1) بدقة البكسل. gap: فراغ بين القطع عند رؤوس النجمة (0 = مثل المرجع)."""
    ys = (np.arange(H * ss) + 0.5) / ss
    xs = (np.arange(W * ss) + 0.5) / ss
    X, Y = np.meshgrid(xs, ys)
    u, v = (X - x0) / c, (Y - y0) / c          # بوحدات الخانة، الرمز من 0 لـ 4
    m = np.zeros_like(u, dtype=bool)
    # القطعة الأولى (فوق يسار) بإحداثيات الخانات، والباقي بالتدوير حول (2، 2)
    def piece(uu, vv):
        inq = (uu >= 0) & (uu < 2) & (vv >= 0) & (vv < 2)
        outer = (uu < 1) & (vv < 1) & ((uu - 1) ** 2 + (vv - 1) ** 2 <= 1)       # الزاوية الخارجية
        edge = (uu >= 1) & (uu < 2) & (vv < 1) & (vv >= 0)                        # المربع على الحافة
        inner = (uu >= 1) & (vv >= 1) & ((uu - 1) ** 2 + (vv - 1) ** 2 <= 1)      # ربع الدائرة للداخل
        return inq & (outer | edge | inner)
    for k in range(4):
        # تدوير النقطة بـ -90°·k حول (2، 2) ثم نفحص القطعة الأولى
        du, dv = u - 2, v - 2
        for _ in range(k):
            du, dv = dv, -du
        m |= piece(du + 2, dv + 2)
    return m.reshape(H, ss, W, ss).mean(axis=(1, 3))


def iou(a, b):
    return float(np.minimum(a, b).sum() / np.maximum(a, b).sum())


def main():
    cov, bg = ref_coverage()
    H, W = cov.shape
    y0r, y1r, x0r, x1r = 125, 365, 266, 505
    sub = cov[y0r:y1r, x0r:x1r]
    best = None
    for c in np.arange(55.0, 56.6, 0.1):
        for x0 in np.arange(273.5, 275.6, 0.25):
            for y0 in np.arange(132.5, 134.6, 0.25):
                m = model_mask(x0 - x0r, y0 - y0r, c, y1r - y0r, x1r - x0r, ss=4)
                s = iou(sub, m)
                if best is None or s > best[0]:
                    best = (s, x0, y0, c)
    s, x0, y0, c = best
    m = model_mask(x0 - x0r, y0 - y0r, c, y1r - y0r, x1r - x0r)
    s = iou(sub, m)
    diff = sub - m
    res = dict(background_red=round(float(bg), 1), iou=round(s, 4), x0=round(x0, 2), y0=round(y0, 2), cell=round(c, 2),
               side=round(4 * c, 2), mean_abs_diff=round(float(np.abs(diff).mean()), 4),
               pixels_off_over_50=int((np.abs(diff) > 0.5).sum()), mark_pixels=int((sub > 0.5).sum()))
    # صور: المرجع، والنموذج، والفرق (أحمر = في المرجع بس، أزرق = في النموذج بس)
    k = 4
    rgb = np.stack([sub, sub, sub], -1)
    over = np.ones(sub.shape + (3,))
    over[..., 0] = 1 - np.clip(-diff, 0, 1)
    over[..., 2] = 1 - np.clip(diff, 0, 1)
    over[..., 1] = 1 - np.abs(diff)
    img = np.concatenate([rgb, np.stack([m, m, m], -1), over], axis=1)
    Image.fromarray((img * 255).astype(np.uint8)).resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST).save(OUT / "fit-ref-model-diff-x4.png")
    (OUT / "fit.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main()
