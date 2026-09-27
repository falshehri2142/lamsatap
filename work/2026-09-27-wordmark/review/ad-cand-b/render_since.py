"""SINCE 2026: candidate B vs owner, same width, white on teal (reads build/cand-b; writes here)."""
import pathlib
import numpy as np
from PIL import Image
from render_review import shoot, sized, vb, svg, at, recolour, TEAL, INK, WHITE, REF
HERE = pathlib.Path(__file__).resolve().parent
s = svg("stacked-light-since2026.svg")
w_, h_ = vb(s)
ref = Image.open(REF).convert("RGB")
a = np.asarray(ref).astype(int)
white = a.min(axis=2) > 200
band = white[445:490]
cols = np.where(band.any(axis=0))[0]; rows = np.where(band.any(axis=1))[0]
x0, x1, y0, y1 = cols.min(), cols.max(), 445 + rows.min(), 445 + rows.max()
print("owner SINCE bbox", x0, y0, x1, y1, "h", y1 - y0 + 1, "w", x1 - x0 + 1)
K = 6
oc = ref.crop((x0 - 6, y0 - 6, x1 + 7, y1 + 7))
oc = oc.resize((oc.width * K, oc.height * K), Image.LANCZOS)
# candidate: render the whole stacked lockup so its SINCE line has the owner's SINCE width, then crop the line
# SINCE width / word width = 0.761 (build); word width = viewBox width
since_w_units = 0.761 * w_
scale = (x1 - x0 + 1) * K / since_w_units
W, H = w_ * scale, h_ * scale
shoot("_since-cand.png", int(W + 40), int(H + 40), TEAL, [at(20, 20, sized(recolour(s, {TEAL: WHITE, INK: WHITE}), W, H))])
cim = Image.open(HERE / "_since-cand.png")
cc = cim.crop((0, int(cim.height - (y1 - y0 + 1) * K - 20 - 40), cim.width, cim.height))
sheet = Image.new("RGB", (max(oc.width, cc.width), oc.height + cc.height + 16), (255, 255, 255))
sheet.paste(oc, (0, 0)); sheet.paste(cc, (0, oc.height + 16))
sheet.save(HERE / "09-since-owner-top-cand-bottom.png")
