"""Item 8 (Latin line in the horizontal lockup, engraving height 19mm) measured with web-qa's own check_logo.py code.
check_logo's latin_band() expects ONE square symbol band at the file edge; our «الميلان» lockups have surface + dot as two
bands, so it returns None and the item is SKIPped. Here we only restrict the search to the name block's columns (known
from our lockup geometry) and call check_logo.check_latin unchanged (read-only import, brand/ is not modified)."""
import importlib.util
import pathlib
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import concepts as C  # noqa
import files as F  # noqa
import lockup as LK  # noqa

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
spec = importlib.util.spec_from_file_location("check_logo", ROOT / "brand" / "src" / "check_logo.py")
CL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(CL)
ORIG_BAND = CL.latin_band


def run(cid, target_mm=19.0):
    g = C.CONCEPTS[cid]
    sd, dd = C.paths(g)
    box = F.surface_box(g) if g["kind"] == "mail" else C.measures(g)["bbox"]
    L = LK.build((sd, dd), box)
    svg = F.CDIR / cid / f"{cid}-horizontal-mono.svg"
    x0, y0, W, H = CL.viewbox(svg)
    name_frac = (L["name_w"] - x0) / W  # right edge of the name block as a fraction of the file width
    en_w = (LK.Run(LK.EN, 500).bbox[2] - LK.Run(LK.EN, 500).bbox[0]) * L["s_en"]
    lat_frac = (L["name_w"] - en_w - x0) / W  # left edge of LamsaTap

    def band(ink):
        Hh, Ww = ink.shape
        a, b = max(0, int(lat_frac * Ww) - 2), int(name_frac * Ww) + 2
        sub = ink[:, a:b]
        rows = CL._bands(sub.sum(1), max(2, int(0.004 * Hh)))
        if len(rows) < 2:
            return None
        r0, r1 = rows[-1]
        cs = np.nonzero(sub[r0:r1].any(0))[0]
        return r0, r1, a + cs[0], a + cs[-1] + 1

    CL.latin_band = band
    CL.LATIN_TARGET_MM["horizontal"] = target_mm
    rep = CL.Report(f"{cid} item 8")
    out = F.CDIR / cid / "check"
    out.mkdir(exist_ok=True)
    CL.check_latin(rep, svg, "horizontal", out, cid)
    CL.latin_band = ORIG_BAND
    txt = ("== البند 8 (السطر اللاتيني في القفل الأفقي على 19mm) بكود check_logo.py نفسه، بعد ما حصرنا البحث في أعمدة LamsaTap\n"
           "(latin_band الأصلية ترجع None لأن الرمز جزئين: السطح والنقطة عمودين منفصلين، فما يتعرف عليه كرمز)\n" + rep.text() + "\n")
    (out / "item8-latin.txt").write_text(txt, encoding="utf-8")
    return txt


if __name__ == "__main__":
    for stream in (sys.stdout,):
        stream.reconfigure(encoding="utf-8", errors="replace")
    for cid in C.CONCEPTS:
        print(run(cid))
