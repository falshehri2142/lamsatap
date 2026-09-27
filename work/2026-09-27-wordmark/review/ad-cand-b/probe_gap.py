"""Tip gap 0.05 vs 0.08 cell at real screen sizes and at 900 px (reads build/cand-b; writes here only)."""
import pathlib, sys
from PIL import Image
from render_review import shoot, at, SAND, TEAL, WHITE, INK
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "build" / "cand-b"))
import build_logo_v1_b as B
svgs = {}
for gr in (0.05, 0.08):
    p, side = B.symbol(100.0, gr)
    svgs[gr] = B.svg_doc([(TEAL, p)], scale=1.0)
# 1) small real sizes, device pixels, then x4 nearest for inspection
blocks, x = [], 16
for gr in (0.05, 0.08):
    y = 16
    for sz in (48, 64, 96, 128, 200):
        blocks.append(at(x, y, B.sized(svgs[gr], sz, sz)))
        y += sz + 16
    x += 216
shoot("_gap-small.png", x, 560, SAND, blocks)
im = Image.open(HERE / "_gap-small.png")
im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(HERE / "12-gap-005-left-008-right-x3.png")
# 2) 900 px side by side
blocks = [at(20, 20, B.sized(svgs[0.05], 900, 900)), at(960, 20, B.sized(svgs[0.08], 900, 900))]
shoot("13-gap-005-left-008-right-900.png", 1880, 940, SAND, blocks)
