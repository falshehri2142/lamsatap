# توليد صور المشاهد من kie.ai (GM-058) — الأداة الثابتة (GM-057).
# المفتاح: يقرأ KIE_API_KEY من .env في مجلد المشروع الرئيسي (يلقاه بـ git rev-parse --git-common-dir).
#   ما يطبع المفتاح أبداً، وما يكتبه في أي ملف أو لوق. لا تفتح .env بأي أداة قراءة.
# التوثيق الرسمي (قُرئ 2026-09-28):
#   إنشاء مهمة: POST https://api.kie.ai/api/v1/jobs/createTask  {"model": ..., "input": {...}}
#   حالة المهمة: GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...  (state: waiting|queuing|generating|success|fail،
#                والروابط في data.resultJson -> resultUrls)
#   الرصيد: GET https://api.kie.ai/api/v1/chat/credit  (data = الرصيد)
#   الأسعار: https://kie.ai/pricing (الجدول، قُرئ 2026-09-28) — 200 credit = 1$.
# الاستخدام:
#   python tools/kie-image.py price  work/2026-09-28-kie-scenes/plan.json     (بدون شبكة: التكلفة المتوقعة)
#   python tools/kie-image.py credits                                          (الرصيد بس)
#   python tools/kie-image.py generate work/2026-09-28-kie-scenes/plan.json --approved "GM-058 <تاريخ الموافقة>" [--only <id>]
# قاعدة: ولا توليد بدون --approved، والموافقة من صاحب المشروع عن طريق المدير العام (GM-057 و GM-058).
import argparse, json, pathlib, subprocess, sys, time, urllib.error, urllib.request

API = "https://api.kie.ai/api/v1"
# (credits لكل صورة، دولار) من جدول https://kie.ai/pricing — 2026-09-28
PRICES = {
    ("google/imagen4-ultra", None): (12, 0.06),
    ("flux-2/pro-text-to-image", "2K"): (7, 0.035),
    ("flux-2/pro-text-to-image", "1K"): (5, 0.025),
}


def main_repo():
    out = subprocess.run(["git", "rev-parse", "--git-common-dir"], capture_output=True, text=True, check=True).stdout.strip()
    p = pathlib.Path(out)
    if not p.is_absolute():
        p = (pathlib.Path.cwd() / p).resolve()
    return p.parent


def load_key():
    env = main_repo() / ".env"
    if not env.exists():
        raise SystemExit("ما لقيت .env في مجلد المشروع الرئيسي")
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("KIE_API_KEY="):
            v = line.split("=", 1)[1].strip().strip('"').strip("'")
            if v:
                return v
    raise SystemExit("KIE_API_KEY مو موجود في .env")


def call(method, path, key, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:  # الرد ما فيه المفتاح؛ نطبع الحالة والنص بس
        raise SystemExit(f"خطأ {e.code} من kie.ai: {e.read().decode('utf-8', 'replace')[:500]}")


def cost(job):
    c, usd = PRICES.get((job["model"], job.get("input", {}).get("resolution")), (None, None))
    if c is None:
        raise SystemExit(f"ما عندي سعر للموديل {job['model']}. حدّث PRICES من https://kie.ai/pricing أول.")
    n = job.get("count", 1)
    return c * n, usd * n


def cmd_price(plan):
    tc = tu = 0
    for job in plan["jobs"]:
        c, u = cost(job)
        tc += c; tu += u
        print(f"{job['id']}: {job['model']} ×{job.get('count', 1)} = {c} credit (${u:.3f})")
    print(f"المجموع: {tc} credit ≈ ${tu:.2f}")


def cmd_generate(plan, out_dir, only, approved):
    if not approved:
        raise SystemExit("ممنوع التوليد بدون --approved (موافقة صاحب المشروع عن طريق المدير العام)")
    key = load_key()
    out_dir.mkdir(parents=True, exist_ok=True)
    for job in plan["jobs"]:
        if only and job["id"] != only:
            continue
        for i in range(job.get("count", 1)):
            body = {"model": job["model"], "input": dict(job["input"])}
            if "seed" in body["input"] and i:
                body["input"]["seed"] = f"{body['input']['seed']}-{i}"
            task = call("POST", "/jobs/createTask", key, body)["data"]["taskId"]
            print(f"{job['id']}#{i + 1}: مهمة {task}", flush=True)
            for _ in range(120):
                time.sleep(5)
                d = call("GET", f"/jobs/recordInfo?taskId={task}", key)["data"]
                if d.get("state") in ("success", "fail"):
                    break
            if d.get("state") != "success":
                print(f"  فشلت: {d.get('state')} {d.get('failMsg', '')}")
                continue
            urls = json.loads(d.get("resultJson") or "{}").get("resultUrls", [])
            for k, u in enumerate(urls):
                ext = pathlib.Path(u.split("?")[0]).suffix or ".png"
                f = out_dir / f"{job['id']}-{i + 1}{'-' + str(k + 1) if len(urls) > 1 else ''}{ext}"
                urllib.request.urlretrieve(u, f)
                meta = {"file": f.name, "model": job["model"], "input": body["input"], "taskId": task,
                        "creditsConsumed": d.get("creditsConsumed"), "approved": approved,
                        "source": "kie.ai generated (GM-058)"}
                f.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"  نزلت {f}")


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["price", "credits", "generate"])
    ap.add_argument("plan", nargs="?")
    ap.add_argument("--out", default="brand/photos/generated")
    ap.add_argument("--only")
    ap.add_argument("--approved", default="")
    a = ap.parse_args()
    if a.cmd == "credits":
        print("الرصيد:", call("GET", "/chat/credit", load_key())["data"], "credit")
        return
    plan = json.loads(pathlib.Path(a.plan).read_text(encoding="utf-8"))
    if a.cmd == "price":
        cmd_price(plan)
    else:
        cmd_generate(plan, pathlib.Path(a.out), a.only, a.approved)


if __name__ == "__main__":
    main()
