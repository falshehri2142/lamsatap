"""يقص Figtree للاتيني والأرقام في صفحات الشركة (الاتجاه 2 §6 في web-art-director.md).

المصدر: brand/fonts/source/Figtree[wght].ttf من مستودع Google Fonts (OFL 1.1، وسطر الحقوق بدون Reserved Font Name،
فالقص والتعديل مسموحين بنفس الاسم). الرخصة: brand/fonts/source/OFL-Figtree.txt.

الخطوات:
  1) الوزن بـ fontTools.varLib.instancer: الأصل 300 إلى 900 وافتراضيه 300.
     **مطابقة سماكة Readex (الافتراضي):** Figtree أنحف من Readex بنفس الرقم: جذع «l» بوزن 400 = 80 في Figtree
     و103 في Readex (من 1000). فالملف ياخذ تصميم Figtree من 550 إلى 850، ويسمّيه 400 إلى 700: كذا CSS 400 يطلع
     بسماكة Readex 400 (103 و103)، و500 (122 و122)، و600 (144 و142). بدون المطابقة الأرقام تطلع أنحف من العربي
     اللي جنبها في نفس السطر. للنسخة الحرفية (تصميم 400 إلى 700 بدون مطابقة): --no-match
  2) القص (pyftsubset نفسه، fontTools.subset): المدى تحت **بدون المسافة** (U+0020 و U+00A0)، عشان المسافة بين الكلمات
     العربية تبقى من Readex. الميزات: kern,liga,calt,tnum,lnum,case,ccmp,locl,mark,mkmk، ومعها rvrn: الخط يبدّل
     شكل «$» في الأوزان الثقيلة (FeatureVariations)، وبدونها يطلع «$» الثقيل بشكل الخفيف.
     الصيغة WOFF، لأن brotli مو موجود (نفس Readex).
  3) الفحص: tnum موجود، والأرقام 0-9 تتحول لأرقام بعرض واحد في الأوزان 400 و500 و600 و700، والأرقام بدون tnum
     متفاوتة (يعني الميزة تغيّر شي فعلاً)، وسماكة الجذع مقابل Readex بنفس الأوزان.

الناتج: brand/fonts/figtree-latin.woff، ونسخة مطابقة في website/assets/brand/fonts/ ومع كل وحدة OFL-Figtree.txt.
التشغيل من جذر المشروع:  python brand/src/build_figtree.py   (أو --no-match)
"""
import io
import pathlib
import shutil
import sys

from fontTools import subset
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "brand" / "fonts" / "source" / "Figtree[wght].ttf"
READEX = ROOT / "brand" / "fonts" / "source" / "ReadexPro[HEXP,wght].ttf"
LICENSE = ROOT / "brand" / "fonts" / "source" / "OFL-Figtree.txt"
OUT = ROOT / "brand" / "fonts" / "figtree-latin.woff"
SITE = ROOT / "website" / "assets" / "brand" / "fonts"

# نفس unicode-range في @font-face "LT Latin" (tokens.css). بدون U+0020 و U+00A0.
RANGES = [(0x21, 0x7E), (0xA1, 0xFF), (0x2013, 0x2014), (0x2018, 0x201D), (0x2026, 0x2026), (0x20AC, 0x20AC)]
UNICODES = [c for a, b in RANGES for c in range(a, b + 1)]
FEATURES = ["kern", "liga", "calt", "tnum", "lnum", "case", "ccmp", "locl", "mark", "mkmk", "rvrn"]
WEIGHTS = (400, 500, 600, 700)
DIGITS = [chr(c) for c in range(0x30, 0x3A)]
MATCH = 150      # الإزاحة: CSS 400 = تصميم Figtree 550 (سماكة Readex 400)


def lookup_map(font, tag):
    """كل الاستبدالات المفردة في ميزة GSUB وحدة (نوع 1، أو 7 اللي يلفه)."""
    gsub = font["GSUB"].table
    idx = set()
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag == tag:
            idx.update(fr.Feature.LookupListIndex)
    mapping = {}
    for li in sorted(idx):
        lookup = gsub.LookupList.Lookup[li]
        for st in lookup.SubTable:
            t = st.ExtSubTable if lookup.LookupType == 7 else st
            if hasattr(t, "mapping"):
                mapping.update(t.mapping)
    return mapping


def relabel(font):
    """المحور يصير 400 إلى 700 (والتصميم تحته 550 إلى 850). الأسماء تقول إنها نسخة معدّلة."""
    axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
    axis.minValue, axis.defaultValue, axis.maxValue = 400, 400, 700
    font["fvar"].instances = []           # أسماء الأوزان القديمة (SemiBold وغيره) ما عاد تطابق الأرقام
    if "STAT" in font:
        del font["STAT"]                  # نفس السبب. المتصفح ما يستخدمه
    font["OS/2"].usWeightClass = 400
    name = font["name"]
    for nid in (16, 17):
        name.removeNames(nameID=nid)
    for nid, val in {
        1: "Figtree", 2: "Regular", 4: "Figtree Regular", 6: "Figtree-Regular",
        3: "2.002;LamsaTap;Figtree-Regular",
        5: "Version 2.002; LamsaTap subset: Latin and figures, wght 400-700 = Figtree 550-850 (stroke matched to Readex Pro)",
    }.items():
        name.setName(val, nid, 3, 1, 0x409)


def build(match):
    font = TTFont(SRC)
    axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
    print(f"المصدر: {SRC.name}، {SRC.stat().st_size:,} بايت، wght {axis.minValue:g} إلى {axis.maxValue:g} "
          f"(الافتراضي {axis.defaultValue:g})")
    lo = 400 + (MATCH if match else 0)
    font = instancer.instantiateVariableFont(font, {"wght": (lo, lo, lo + 300)}, updateFontNames=not match)
    if match:
        relabel(font)
    print("تصميم Figtree المستخدم:", f"{lo} إلى {lo + 300}", "(مطابق لسماكة Readex)" if match else "(بدون مطابقة)")

    opts = subset.Options()
    opts.flavor = "woff"
    opts.layout_features = FEATURES
    opts.name_IDs = ["*"]                 # يبقى سطر الحقوق (0) والرخصة ورابطها (13 و14) داخل الملف (شرط 2 في OFL)
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(font)
    font.flavor = "woff"
    buf = io.BytesIO()
    font.save(buf)
    OUT.write_bytes(buf.getvalue())
    print(f"الناتج: {OUT.relative_to(ROOT)}، {OUT.stat().st_size:,} بايت")


def stem(path, weight, char="l"):
    """عرض جذع الحرف (من 1000) في وزن معيّن."""
    font = TTFont(path)
    loc = {a.axisTag: (weight if a.axisTag == "wght" else a.defaultValue) for a in font["fvar"].axes}
    static = instancer.instantiateVariableFont(font, loc)
    glyphs = static.getGlyphSet()
    pen = BoundsPen(glyphs)
    glyphs[static.getBestCmap()[ord(char)]].draw(pen)
    return round((pen.bounds[2] - pen.bounds[0]) * 1000 / static["head"].unitsPerEm, 1)


def check():
    ok = True
    font = TTFont(OUT)
    axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
    print(f"wght {axis.minValue:g} إلى {axis.maxValue:g} (الافتراضي {axis.defaultValue:g})، "
          f"usWeightClass {font['OS/2'].usWeightClass}، الاسم «{font['name'].getDebugName(4)}»")
    feats = sorted({fr.FeatureTag for fr in font["GSUB"].table.FeatureList.FeatureRecord})
    gpos = sorted({fr.FeatureTag for fr in font["GPOS"].table.FeatureList.FeatureRecord})
    print("ميزات GSUB:", ",".join(feats), "| GPOS:", ",".join(gpos))
    cmap = font.getBestCmap()
    missing = [f"U+{c:04X}" for c in UNICODES if c not in cmap]
    print("من المدى وما هو في الخط الأصلي أصلاً:", ", ".join(missing) or "ولا شي")
    if 0x20 in cmap or 0xA0 in cmap:
        print("غلط: المسافة داخل الملف")
        ok = False
    tnum = lookup_map(font, "tnum")
    if "tnum" not in feats or not all(cmap.get(ord(d)) in tnum for d in DIGITS):
        print("غلط: tnum ناقص أو ما يغطي الأرقام 0-9. Figtree يطيح ونكمل بـ Readex")
        return False
    for w in WEIGHTS:
        static = instancer.instantiateVariableFont(TTFont(OUT), {"wght": w})
        hmtx, cm = static["hmtx"], static.getBestCmap()
        tab = {hmtx[tnum[cm[ord(d)]]][0] for d in DIGITS}
        prop = [hmtx[cm[ord(d)]][0] for d in DIGITS]
        good = len(tab) == 1 and len(set(prop)) > 1
        ok &= good
        rdx = f"، وجذع «l» {stem(OUT, w)} مقابل Readex {stem(READEX, w)}" if READEX.exists() else ""
        print(f"وزن {w}: بـ tnum كل الأرقام بعرض {sorted(tab)}، وبدونها من {min(prop)} إلى {max(prop)}{rdx}"
              f" {'✓' if good else '✗'}")
    return ok


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not SRC.exists() or not LICENSE.exists():
        raise SystemExit("ما لقيت Figtree[wght].ttf أو OFL-Figtree.txt في brand/fonts/source/")
    build(match="--no-match" not in sys.argv[1:])
    if not check():
        OUT.unlink()
        raise SystemExit("الفحص فشل: ما انسخ شي للموقع")
    SITE.mkdir(parents=True, exist_ok=True)
    for dst in (OUT.parent, SITE):
        shutil.copyfile(LICENSE, dst / "OFL-Figtree.txt")
    shutil.copyfile(OUT, SITE / OUT.name)
    print("انسخ للموقع:", (SITE / OUT.name).relative_to(ROOT), "و OFL-Figtree.txt جنب النسختين")


if __name__ == "__main__":
    main()
