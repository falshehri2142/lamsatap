# يفحص كل باركود داخل صور الموقع (رسالة المدير العام بعد af691d7، و GM-049 و GM-061): يا وهمي ما ينقرى، يا يودّي لـ /demo/ بس.
# يقرأ كل صورة بقارئين: OpenCV (QRCodeDetector) و jsQR (نفس مكتبة فحص الإطلاق)، بعدة مقاسات، وبقطع مكبّرة من الصورة
#   (مثل جوال يقرّب الكاميرا على جزء من الشاشة)، لأن الباركود الصغير داخل مشهد ما ينقرى من الصورة كاملة.
# الاستخدام: python tools/check-qr.py <صور...> --jsqr <مجلد مكتبة jsqr> [--allow /demo/] [--no-tiles]
#   jsQR مو داخل المشروع: مرّر مجلدها (فيه package.json و dist/jsQR.js) بـ --jsqr أو متغير البيئة LT_JSQR.
#   بدونها الفحص بـ OpenCV بس، ويقولها في النتيجة (مو سكوت).
# النتيجة: سطر لكل صورة (PASS أو FAIL) وكل نص انقرى، والخروج 1 لو فيه FAIL.
import argparse, json, os, pathlib, struct, subprocess, sys
import numpy as np
import cv2

# عامل jsQR: يقرأ من stdin رسائل (عرض، ارتفاع، RGBA) ويرد سطر JSON لكل وحدة
WORKER = r"""
const jsQR = require(process.argv[1]);
let chunks = [], have = 0, need = null;
function take(n) {
  const out = Buffer.allocUnsafe(n); let off = 0;
  while (off < n) { const c = chunks[0], k = Math.min(c.length, n - off); c.copy(out, off, 0, k); off += k;
    if (k === c.length) chunks.shift(); else chunks[0] = c.subarray(k); }
  have -= n; return out;
}
process.stdin.on('data', d => { chunks.push(d); have += d.length;
  for (;;) {
    if (need === null) { if (have < 8) break; const h = take(8); need = { w: h.readUInt32LE(0), h: h.readUInt32LE(4) }; }
    const n = need.w * need.h * 4; if (have < n) break;
    const px = new Uint8ClampedArray(take(n)); const r = jsQR(px, need.w, need.h, { inversionAttempts: 'attemptBoth' });
    process.stdout.write(JSON.stringify(r ? r.data : null) + '\n'); need = null;
  }
});
"""


def variants(img, tiles):
    """الصورة كاملة بعدة مقاسات، وقطع مكبّرة (ثلث وخمس الصورة، بتداخل النص، مكبّرة لين أقصرها 720)."""
    h, w = img.shape[:2]
    for s in (0.5, 1.0, 2.0):
        if max(h, w) * s <= 3200:
            yield f"x{s}", cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    if not tiles:
        return
    for div in (3, 5):
        tw, th = w // div, h // div
        if min(tw, th) < 60:
            continue
        k = max(1.0, 720 / min(tw, th))
        for y in range(0, h - th + 1, max(1, th // 2)):
            for x in range(0, w - tw + 1, max(1, tw // 2)):
                crop = img[y:y + th, x:x + tw]
                yield f"tile/{div}@{x},{y}×{k:.1f}", cv2.resize(crop, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)


def load(path):
    a = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if a is None:
        raise SystemExit(f"ما قدرت أقرأ {path}")
    if a.ndim == 2:
        a = cv2.cvtColor(a, cv2.COLOR_GRAY2BGR)
    if a.shape[2] == 4:   # الشفاف على أبيض (مثل الصفحة)
        al = a[..., 3:4] / 255.0
        a = (a[..., :3] * al + 255 * (1 - al)).astype(np.uint8)
    return a


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--jsqr", default=os.environ.get("LT_JSQR", ""))
    ap.add_argument("--allow", default="/demo/", help="النص اللي لازم يكون في أي رابط ينقرى")
    ap.add_argument("--no-tiles", action="store_true")
    ap.add_argument("--json", help="يحفظ النتيجة كاملة هنا")
    a = ap.parse_args()
    worker = None
    if a.jsqr:
        if not (pathlib.Path(a.jsqr) / "package.json").exists():
            raise SystemExit(f"--jsqr: ما لقيت package.json في {a.jsqr}")
        worker = subprocess.Popen(["node", "-e", WORKER, str(pathlib.Path(a.jsqr).resolve())],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE)
        ver = json.loads((pathlib.Path(a.jsqr) / "package.json").read_text(encoding="utf-8")).get("version")
        print(f"jsQR {ver} من {a.jsqr}")
    else:
        print("تنبيه: بدون jsQR (مرّر --jsqr أو LT_JSQR). الفحص بـ OpenCV بس.")
    det = cv2.QRCodeDetector()
    report, bad = [], 0
    for f in a.files:
        img = load(f)
        found, n = {}, 0
        for label, v in variants(img, not a.no_tiles):
            n += 1
            try:
                ok, texts, *_ = det.detectAndDecodeMulti(v)
                texts = [t for t in (texts if ok else []) if t]
            except cv2.error:
                texts = []
            if not texts:
                t, *_ = det.detectAndDecode(v)
                texts = [t] if t else []
            for t in texts:
                found.setdefault(t, []).append("opencv " + label)
            if worker:
                rgba = cv2.cvtColor(v, cv2.COLOR_BGR2RGBA)
                worker.stdin.write(struct.pack("<II", rgba.shape[1], rgba.shape[0]) + rgba.tobytes())
                worker.stdin.flush()
                t = json.loads(worker.stdout.readline())
                if t:
                    found.setdefault(t, []).append("jsqr " + label)
        fails = [t for t in found if a.allow not in t]
        verdict = "FAIL" if fails else "PASS"
        bad += bool(fails)
        what = "ولا باركود ينقرى" if not found else "، ".join(f"«{t}» ({len(v)} مرة، أولها {v[0]})" for t, v in found.items())
        print(f"{verdict}  {f}  ({n} قراءة لكل قارئ): {what}")
        report.append({"file": str(f), "verdict": verdict, "reads": n, "decoded": found})
    if worker:
        worker.stdin.close(); worker.wait()
    if a.json:
        pathlib.Path(a.json).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
