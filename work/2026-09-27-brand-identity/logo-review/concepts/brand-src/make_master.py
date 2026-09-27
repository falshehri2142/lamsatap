"""يكتب ملف مصدر الرمز (lamsatap-mark.svg) من مفهوم مختار: مسار السطح id="surface" ومسار النقطة id="dot" على لوح 512.
هذا الملف هو اللي يقرأه build_logo.py بعد الاختيار (الرمز مسار ثابت، والسكربت ما يرسمه من عنده).
التشغيل:  python make_master.py brand-3 <مسار الملف الناتج>
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from build_concepts import CONCEPTS  # noqa: E402
from geometry import Lean  # noqa: E402

INK, SAFFRON = "#14201F", "#F2A93B"


def master(key, version="1.0.0"):
    c = next((c for c in CONCEPTS if c["key"] == key), None)
    if not c:
        raise SystemExit(f"ما فيه مفهوم اسمه {key}")
    L = Lean(c["s"], c["r"], c["d"], c["dot"], c["XL"], c["XR"])
    m = L.metrics()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">'
            f'<title>لمسة تاب — مصدر الرمز {version} ({key} «{c["title"]}»: ميلان {c["s"]}، زوايا {c["r"]}، '
            f'سطح {m["W"]:.1f}×224، نقطة {c["d"]} على ({c["dot"][0]}، {c["dot"][1]}))</title>'
            f'<path id="surface" fill="{INK}" d="{L.surface_d()}"/><path id="dot" fill="{SAFFRON}" d="{L.dot_d()}"/></svg>\n')


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("الاستخدام: python make_master.py <المفهوم> <الملف الناتج>")
    out = pathlib.Path(sys.argv[2])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(master(sys.argv[1]), encoding="utf-8", newline="\n")
    print(out)
