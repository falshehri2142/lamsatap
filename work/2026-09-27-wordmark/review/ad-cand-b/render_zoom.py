"""Zoomed letter crops of candidate B's wordmark (reads build/cand-b; writes here)."""
import pathlib, sys
from PIL import Image
from render_review import shoot, sized, vb, svg, at, SAND
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "build" / "cand-b"))
import build_logo_v1_b as B
w = B.word_parts()
word = svg("wordmark-light.svg")
w_, h_ = vb(word)           # SVG units: H = 100
W = 6000
k = W / w_                  # px per SVG unit
Hh = h_ * k
if not (HERE / "_word-6000.png").exists():
    shoot("_word-6000.png", W + 200, int(Hh + 200), SAND, [at(100, 100, sized(word, W, Hh))])
im = Image.open(HERE / "_word-6000.png")
x0 = min(g.bounds[0] + x for g, x in zip(w["glyphs"], w["xs"]))
names = ["L", "A1", "M", "S", "A2", "T", "A3", "P"]
for i, (g, x) in enumerate(zip(w["glyphs"], w["xs"])):
    a, b = (g.bounds[0] + x - x0) / 10 * k + 100, (g.bounds[2] + x - x0) / 10 * k + 100
    im.crop((int(a - 60), 40, int(b + 60), int(Hh + 160))).save(HERE / f"z{i}-{names[i]}.png")
    print(names[i], int(a), int(b))
# seam crop: A2 + T
a = (w["glyphs"][4].bounds[0] + w["xs"][4] - x0) / 10 * k + 100
b = (w["glyphs"][6].bounds[2] + w["xs"][6] - x0) / 10 * k + 100
im.crop((int(a - 60), 40, int(b + 60), int(Hh + 160))).save(HERE / "z-seam-ATA.png")
