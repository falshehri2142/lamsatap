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
#   python tools/kie-image.py generate work/2026-09-28-kie-scenes/plan.json --approved "GM-058 <تاريخ الموافقة>" [--only <id>] [--skip a,b]
#   python tools/kie-image.py fetch      (يكمّل تنزيل مهام خلصت بعدين، بدون أي صرف)
#   python tools/kie-image.py upscale --names a-1,b-1 --approved "..."   (Recraft Crisp Upscale، 0.5 credit للصورة)
# قاعدة: ولا توليد بدون --approved، والموافقة من صاحب المشروع عن طريق المدير العام (GM-057 و GM-058).
import argparse, json, pathlib, subprocess, sys, time, urllib.error, urllib.request

API = "https://api.kie.ai/api/v1"
# (credits لكل صورة، دولار) من جدول https://kie.ai/pricing — 2026-09-28
PRICES = {
    ("google/imagen4-ultra", None): (12, 0.06),
    ("flux-2/pro-text-to-image", "2K"): (7, 0.035),
    ("flux-2/pro-text-to-image", "1K"): (5, 0.025),
    ("recraft/crisp-upscale", None): (0.5, 0.0025),
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


def save_result(d, task, job_id, body, out_dir, approved, idx=1):
    urls = json.loads(d.get("resultJson") or "{}").get("resultUrls", [])
    for k, u in enumerate(urls):
        ext = pathlib.Path(u.split("?")[0]).suffix or ".png"
        f = out_dir / f"{job_id}-{idx}{'-' + str(k + 1) if len(urls) > 1 else ''}{ext}"
        urllib.request.urlretrieve(u, f)  # الملف كما هو: ما نشيل علامة مائية ولا بيانات وصفية (رد المحامي)
        meta = {"file": f.name, "model": d.get("model") or body.get("model"), "input": body.get("input"), "taskId": task,
                "creditsConsumed": d.get("creditsConsumed"), "createTime": d.get("createTime"),
                "completeTime": d.get("completeTime"), "approved": approved, "source": "kie.ai generated (GM-058)"}
        f.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  نزلت {f}", flush=True)


def cmd_generate(plan, out_dir, only, approved, skip):
    """يرسل كل المهام أول، وبعدين ينتظرها مع بعض (أسرع لما طابور موديل بطيء)، ويحفظ المعرّفات في tasks.json."""
    if not approved:
        raise SystemExit("ممنوع التوليد بدون --approved (موافقة صاحب المشروع عن طريق المدير العام)")
    key = load_key()
    out_dir.mkdir(parents=True, exist_ok=True)
    log = out_dir / "tasks.json"
    tasks = json.loads(log.read_text(encoding="utf-8")) if log.exists() else []
    pending = []
    for job in plan["jobs"]:
        if (only and job["id"] != only) or job["id"] in skip:
            continue
        for i in range(job.get("count", 1)):
            body = {"model": job["model"], "input": dict(job["input"])}
            if body["input"].get("seed") and i:
                body["input"]["seed"] = f"{body['input']['seed']}-{i}"
            task = call("POST", "/jobs/createTask", key, body)["data"]["taskId"]
            print(f"{job['id']}#{i + 1}: مهمة {task}", flush=True)
            rec = {"task": task, "job": job["id"], "idx": i + 1, "body": body, "approved": approved, "done": False}
            tasks.append(rec); pending.append(rec)
            log.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    wait_all(pending, key, out_dir, log, tasks)


def wait_all(pending, key, out_dir, log, tasks, minutes=25):
    for _ in range(minutes * 12):
        if not pending:
            break
        time.sleep(5)
        for rec in list(pending):
            d = call("GET", f"/jobs/recordInfo?taskId={rec['task']}", key)["data"]
            if d.get("state") == "success":
                save_result(d, rec["task"], rec["job"], rec["body"], out_dir, rec["approved"], rec["idx"])
                rec["done"] = True; pending.remove(rec)
            elif d.get("state") == "fail":
                print(f"  {rec['job']}#{rec['idx']} فشلت: {d.get('failMsg', '')}", flush=True)
                rec["done"] = "fail"; pending.remove(rec)
        log.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    for rec in pending:
        print(f"  {rec['job']}#{rec['idx']} لسا ما خلصت (مهمة {rec['task']}). بعدين: python tools/kie-image.py fetch", flush=True)


def cmd_fetch(out_dir):
    """يكمّل تنزيل أي مهمة في tasks.json خلصت بعد ما انتهى الانتظار (ما يرسل مهام جديدة ولا يصرف رصيد)."""
    key = load_key()
    log = out_dir / "tasks.json"
    tasks = json.loads(log.read_text(encoding="utf-8")) if log.exists() else []
    pending = [t for t in tasks if t.get("done") is False]
    print(f"مهام معلقة: {len(pending)}")
    wait_all(pending, key, out_dir, log, tasks, minutes=10)


def cmd_upscale(out_dir, names, approved):
    """يكبّر صور مولّدة (Recraft Crisp Upscale) من روابطها الأصلية عند kie.ai (تبقى 14 يوم). الأصل ما يتغير."""
    if not approved:
        raise SystemExit("ممنوع التكبير بدون --approved (يكلف رصيد)")
    key = load_key()
    log = out_dir / "tasks.json"
    tasks = json.loads(log.read_text(encoding="utf-8"))
    pending = []
    for rec in tasks:
        base = f"{rec['job']}-{rec['idx']}"
        if rec.get("done") is not True or base not in names:
            continue
        d = call("GET", f"/jobs/recordInfo?taskId={rec['task']}", key)["data"]
        url = json.loads(d.get("resultJson") or "{}").get("resultUrls", [None])[0]
        if not url:
            print(f"  {base}: ما لقيت رابط الأصل (يمكن انتهت 14 يوم)"); continue
        body = {"model": "recraft/crisp-upscale", "input": {"image": url}}
        task = call("POST", "/jobs/createTask", key, body)["data"]["taskId"]
        print(f"{base}: تكبير، مهمة {task}", flush=True)
        up = {"task": task, "job": base + "-upscaled", "idx": 1, "body": body, "approved": approved, "done": False}
        tasks.append(up); pending.append(up)
        log.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
    wait_all(pending, key, out_dir, log, tasks, minutes=10)


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, "reconfigure"):
            st.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["price", "credits", "generate", "fetch", "upscale"])
    ap.add_argument("plan", nargs="?")
    ap.add_argument("--out", default="brand/photos/generated")
    ap.add_argument("--only")
    ap.add_argument("--approved", default="")
    ap.add_argument("--skip", default="", help="أسماء مهام مفصولة بفاصلة ما تنرسل (خلصت قبل)")
    ap.add_argument("--names", default="", help="للتكبير: أسماء الصور بدون امتداد، مفصولة بفاصلة")
    a = ap.parse_args()
    if a.cmd == "credits":
        print("الرصيد:", call("GET", "/chat/credit", load_key())["data"], "credit")
        return
    if a.cmd == "fetch":
        cmd_fetch(pathlib.Path(a.out))
        return
    if a.cmd == "upscale":
        cmd_upscale(pathlib.Path(a.out), set(x for x in a.names.split(",") if x), a.approved)
        return
    plan = json.loads(pathlib.Path(a.plan).read_text(encoding="utf-8"))
    if a.cmd == "price":
        cmd_price(plan)
    else:
        cmd_generate(plan, pathlib.Path(a.out), a.only, a.approved, set(x for x in a.skip.split(',') if x))


if __name__ == "__main__":
    main()
