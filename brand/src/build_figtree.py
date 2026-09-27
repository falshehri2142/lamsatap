"""يقص Figtree للاتيني والأرقام في صفحات الشركة (الاتجاه 2 §6 في web-art-director.md).

المصدر: brand/fonts/source/Figtree[wght].ttf من مستودع Google Fonts (OFL 1.1، وسطر الحقوق بدون Reserved Font Name،
فالقص مسموح بنفس الاسم). الرخصة: brand/fonts/source/OFL-Figtree.txt.

الخطوات:
  1) الوزن 400 إلى 700 والافتراضي 400 (الأصل 300 إلى 900 وافتراضيه 300) بـ fontTools.varLib.instancer.
  2) القص (pyftsubset نفسه، fontTools.subset): المدى تحت **بدون المسافة** (U+0020 و U+00A0)، عشان المسافة بين الكلمات
     العربية تبقى من Readex. الميزات: kern,liga,calt,tnum,lnum,case,ccmp,locl,mark,mkmk، ومعها rvrn: الخط يبدّل
     شكل «$» من وزن 591 تقريباً (FeatureVariations)، وبدونها يطلع «$» الثقيل بشكل الوزن الخفيف.
     الصيغة WOFF، لأن brotli مو موجود (نفس Readex).
  3) الفحص: tnum موجود، والأرقام 0-9 تتحول لأرقام بعرض واحد في الأوزان 400 و500 و600 و700، والأرقام بدون tnum
     متفاوتة (يعني الميزة تغيّر شي فعلاً).

الناتج: brand/fonts/figtree-latin.woff، ونسخة مطابقة في website/assets/brand/fonts/ ومع كل وحدة OFL-Figtree.txt.
التشغيل من جذر المشروع:  python brand/src/build_figtree.py
"""
import io
import pathlib
import shutil
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "brand" / "fonts" / "source" / "Figtree[wght].ttf"
LICENSE = ROOT / "brand" / "fonts" / "source" / "OFL-Figtree.txt"
OUT = ROOT / "brand" / "fonts" / "figtree-latin.woff"
SITE = ROOT / "website" / "assets" / "brand" / "fonts"

# نفس unicode-range في @font-face "LT Latin" (tokens.css). بدون U+0020 و U+00A0.
RANGES = [(0x21, 0x7E), (0xA1, 0xFF), (0x2013, 0x2014), (0x2018, 0x201D), (0x2026, 0x2026), (0x20AC, 0x20AC)]
UNICODES = [c for a, b in RANGES for c in range(a, b + 1)]
FEATURES = ["kern", "liga", "calt", "tnum", "lnum", "case", "ccmp", "locl", "mark", "mkmk", "rvrn"]
WEIGHTS = (400, 500, 600, 700)
DIGITS = [chr(c) for c in range(0x30, 0x3A)]


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


def build():
    font = TTFont(SRC)
    axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
    print(f"المصدر: {SRC.name}، {SRC.stat().st_size:,} بايت، wght {axis.minValue:g} إلى {axis.maxValue:g} "
          f"(الافتراضي {axis.defaultValue:g})")
    font = instancer.instantiateVariableFont(font, {"wght": (400, 400, 700)}, updateFontNames=True)

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
        print(f"وزن {w}: بـ tnum كل الأرقام بعرض {sorted(tab)}، وبدونها من {min(prop)} إلى {max(prop)}"
              f" {'✓' if good else '✗'}")
    return ok


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if not SRC.exists() or not LICENSE.exists():
        raise SystemExit("ما لقيت Figtree[wght].ttf أو OFL-Figtree.txt في brand/fonts/source/")
    build()
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
