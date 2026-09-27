"""ATA seam: current TAP A (slope 0.3936) vs same-skeleton TAP A (slope 0.412), 1600 px crops."""
import pathlib, sys
from PIL import Image
from render_review import shoot, at, SAND
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "build" / "cand-b"))
import build_logo_v1_b as B
orig = B.lamsa_tap_glyphs
def word_svg(slope):
    def patched():
        gl = orig()
        gl[6] = B.glyph_A(B.LIGHT, B.WIDTH["A2"], slope, 210, 198, 175, 350, r_notch=20, r_counter=8)
        return gl
    B.lamsa_tap_glyphs = patched
    w = B.word_parts()
    B.lamsa_tap_glyphs = orig
    return B.svg_doc(B.merged_by_colour(dict(heavy=w["heavy"], light=w["light"]), B.LIGHT_SET))
blocks, y = [], 20
W = 4200
for sl in (B.A_SLOPE, 0.412):
    s = word_svg(sl)
    vw, vh = B.svg_size(s)
    h = W * vh / vw
    # show only the right part (A T A P): shift left so x from 55% of the word is visible
    blocks.append(at(-0.55 * W + 20, y, B.sized(s, W, round(h, 2))))
    y += h + 40
shoot("14-ATAP-now-top-slope0412-bottom.png", int(0.45 * W + 40), int(y), SAND, blocks)
