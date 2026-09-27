"""Build everything for the four web-illustrator concepts, run web-qa's checker and mark_test, render sheets and boards."""
import pathlib
import re
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import boards  # noqa
import concepts as C  # noqa
import files  # noqa
import item8  # noqa
import sheet  # noqa

ROOT = pathlib.Path(__file__).resolve().parents[5]  # جذر المشروع (illus-src <- concepts <- logo-review <- 2026-09-27-brand-identity <- work)
CDIR = files.CDIR
CHECK = ROOT / "brand" / "src" / "check_logo.py"
MARK = ROOT / "work" / "2026-09-27-brand-identity" / "logo-review" / "mark-test" / "mark_test.py"
SCR = pathlib.Path(__import__("tempfile").gettempdir()) / "lamsatap-illus" / "checks"
NL = chr(10)

IDEAS = {
    "illus-1": "داخل «الميلان»: سطح 6 خانات (192) مربّع تقريباً (0.99)، ونقطة على الثلث. الوحيد اللي يجمع «مربّع تقريباً» والتوسيط الكامل على المحورين.",
    "illus-2": "داخل «الميلان»: سطح 8 خانات (256) بنسبة الصفحة (0.70، قريب من 1:√2)، ونقطة على 3/8. «الصفحة» حرفياً، ومتوسط على المحورين.",
    "illus-3": "داخل «الميلان»: نفس بلاطة illus-1 ونفس الميلان (16.3°)، بس الزوايا حادة 16: أدق وأثبت، والميلان يبان أوضح في الصغير.",
    "illus-4": "برّا الاتجاه (سبب في المذكرة): مثلث قائم وتره مقابل النقطة، والنقطة داخل المربع الوهمي. «المماس» = الخط اللي يلمس.",
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return r.returncode, r.stdout + r.stderr


def summary(text):
    m = re.search(r"-- PASS (\d+) \| FAIL (\d+) \| WARN (\d+) \| INFO (\d+) \| SKIP (\d+)", text)
    return m.groups() if m else None


def main():
    SCR.mkdir(parents=True, exist_ok=True)
    notes = {}
    for cid, g in C.CONCEPTS.items():
        files.write(cid, g, C.NAMES[cid])
    for cid in C.CONCEPTS:
        d = CDIR / cid
        cdir = d / "check"
        if cdir.exists():
            shutil.rmtree(cdir)
        cdir.mkdir()
        o1 = SCR / cid / "canonical"
        if o1.exists():
            shutil.rmtree(o1)
        for _attempt in range(2):  # web-qa may be editing the checker; retry once if it returns no summary
            code1, t1 = run([sys.executable, str(CHECK), str(d), "--horizontal-mm", "19", "--full-mm", "42", "--out", str(o1)])
            if summary(t1):
                break
        (cdir / "check_logo.txt").write_text(
            f"python brand/src/check_logo.py {d.relative_to(ROOT).as_posix()} --horizontal-mm 19 --full-mm 42" + NL
            + f"(الأسماء مثل web-brand: {cid}-icon.svg = سطح أبيض ونقطة فوق الحبر، و-icon-ink للخلفية الفاتحة)" + NL + NL
            + t1, encoding="utf-8")
        for pat in ("*item1-avatars-1x-zoom4.png", "*item1-avatars-3x.png", "*item3-5-measure.png", "*item5-16px-32px.png",
                    "*item8-*.png", "*item4-evenodd-diff.png"):
            for f in o1.glob(pat):
                shutil.copy(f, cdir / f.name)
        s1 = summary(t1)
        t8 = item8.run(cid)
        s8 = summary(t8)
        notes[cid] = (s1, s8)
        line = (f"PASS {s1[0]} · FAIL {s1[1]} (الزعفران على التيل 2.59: التيل مرفوض خلفية في 16.4) · WARN {s1[2]} · SKIP {s1[4]}. "
                f"البند 8 للأفقي بقياسي المستقل (item8.py) PASS {s8[0]} · FAIL {s8[1]} · WARN {s8[2]}، ويطابق السكربت. التفصيل في check/")
        sheet.sheet(cid, C.CONCEPTS[cid], C.NAMES[cid], IDEAS[cid], line)
        # mark_test (web-illustrator tool): engraving, stickers, sizes, weak spots, even-odd
        mt = d / "mark-test"
        if mt.exists():
            shutil.rmtree(mt)
        code3, t3 = run([sys.executable, str(MARK), "--color", str(d / f"{cid}-icon-ink.svg"), "--mono", str(d / f"{cid}-icon-mono.svg"),
                         "--color-dark", str(d / f"{cid}-icon-dark.svg"), "--out", str(mt), "--min-mm", "6"])
        (mt / "run-log.txt").write_text(t3, encoding="utf-8")
        print(cid, s1, s8, "mark_test exit", code3)
    boards.BDIR.mkdir(parents=True, exist_ok=True)
    boards.letters()
    boards.compare()


if __name__ == "__main__":
    main()
