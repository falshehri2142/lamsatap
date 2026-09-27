"""Art-director probes on candidate B: TAP A apex and symbol tip gap (reads build/cand-b; writes here only)."""
import math, pathlib, sys
from PIL import Image
from render_review import shoot, at, SAND, TEAL, INK, WHITE
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "build" / "cand-b"))
import build_logo_v1_b as B

LT, HV = B.LIGHT, B.HEAVY

def a_numbers(g, w, W, slope, run_bot, run_top):
    B_ = W + 2 * B.a_trim(w["r"], slope)
    top = B_ - 2 * slope * B.H
    x0 = -B_ / 2
    # centre line of the left leg: base and cap height
    cb, ct = x0 + run_bot / 2, x0 + slope * B.H + run_top / 2
    meet = -cb / ((ct - cb) / B.H)
    return dict(flat_top=round(top / B.H, 3), roof=round((B.H - g.y_apex) / B.H, 3),
                skeleton_apex=round(meet / B.H, 3))

hv = B.glyph_A(HV, B.WIDTH["A"], B.A_SLOPE, 310, 296, 128, 340, r_notch=30, r_counter=12)
print("LAMSA A:", a_numbers(hv, HV, B.WIDTH["A"], B.A_SLOPE, 310, 296))
for sl in (B.A_SLOPE, 0.405, 0.412, 0.419):
    g = B.glyph_A(LT, B.WIDTH["A2"], sl, 210, 198, 175, 350, r_notch=20, r_counter=8)
    polys = B.flatten(g.path)
    print(f"TAP A slope {sl}:", a_numbers(g, LT, B.WIDTH["A2"], sl, 210, 198),
          "counter inscribed", [round(v / B.H, 3) for v in B.inscribed(polys, g.bounds)])

# word with the TAP A at slope 0.419, same spacing rules
orig = B.lamsa_tap_glyphs
def patched():
    gl = orig()
    gl[6] = B.glyph_A(LT, B.WIDTH["A2"], 0.419, 210, 198, 175, 350, r_notch=20, r_counter=8)
    return gl
B.lamsa_tap_glyphs = patched
w = B.word_parts()
wd = dict(heavy=w["heavy"], light=w["light"])
svg_fix = B.svg_doc(B.merged_by_colour(wd, B.LIGHT_SET))
B.lamsa_tap_glyphs = orig
w0 = B.word_parts()
svg_now = B.svg_doc(B.merged_by_colour(dict(heavy=w0["heavy"], light=w0["light"]), B.LIGHT_SET))
names = "LAMSATAP"
for i in range(7):
    g, y = B.min_gap(w["polys"][i], w["xs"][i], w["polys"][i + 1], w["xs"][i + 1])
    print("fixed gap", names[i] + "|" + names[i + 1], round(g, 1))

def sheet(svgs, name, width=1800):
    blocks, y = [], 30
    for s in svgs:
        vw, vh = B.svg_size(s)
        h = width * vh / vw
        blocks.append(at(40, y, B.sized(s, round(width, 2), round(h, 2))))
        y += h + 40
    shoot(name, width + 80, int(y), SAND, blocks)

sheet([svg_now, svg_fix], "10-tapA-now-top-fix-bottom.png")

# symbol tip gap variants
blocks, x = [], 30
for gr in (0.05, 0.08, 0.10, 0.125):
    p, side = B.symbol(100.0, gr)
    s = B.svg_doc([(TEAL, p)], scale=1.0)
    for sz, yy in ((400, 30), (160, 470), (64, 670)):
        blocks.append(at(x, yy, B.sized(s, sz, sz)))
    # avatar 40 px: sand mark 60% on teal circle
    blocks.append(at(x, 770, "", f"width:40px;height:40px;border-radius:50%;background:{TEAL}"))
    blocks.append(at(x + 8, 778, B.sized(s.replace(TEAL, SAND), 24, 24)))
    blocks.append(at(x, 830, f"<span style='font:14px sans-serif;color:#555'>tip gap {gr} cell = {gr/ (4 + gr) * 100:.2f}% of side</span>"))
    x += 440
shoot("11-symbol-gap-variants.png", x + 10, 870, SAND, blocks)
