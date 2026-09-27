import contextlib, io, os, sys, runpy
root = r"C:\Users\TechTroniX\Desktop\NFC"
os.chdir(root)
buf = io.TextIOWrapper(io.BytesIO(), encoding='utf-8')
with contextlib.redirect_stdout(buf):
    ns = runpy.run_path(os.path.join(root, "finance", "model.py"))
bundle = ns["bundle"]

print("== start-up cost per model (upfront_sunk_cost) ==")
SU = {}
for b in ("shop", "host", "host5"):
    full = bundle(b)[0]
    nocac = bundle(b, {"cac_per_client": 0})[0]
    nocac_nodel = bundle(b, {"cac_per_client": 0, "install_delivery": 0})[0]
    run_m = full["running_cost_y1"] / 12
    SU[b] = dict(full=full["upfront_sunk_cost"], nocac=nocac["upfront_sunk_cost"], run_m=run_m)
    print(f"{b}: upfront={full['upfront_sunk_cost']:.1f}  no_CAC={nocac['upfront_sunk_cost']:.1f}  "
          f"no_CAC_no_delivery={nocac_nodel['upfront_sunk_cost']:.1f}  running/month={run_m:.2f}")

PROP = {"shop": 190, "host": 41, "host5": 41}

def row(case, k, paid, refund, extra, b):
    keep = paid - refund + extra
    su_p = PROP.get(b, 0)
    su_m = SU[b]["nocac"] if b else 0
    run = SU[b]["run_m"] * k if b else 0
    print(f"| {case} | {k} | {paid:.1f} | {refund:.1f} | {extra:.1f} | {keep:.1f} | {keep - su_p:.1f} | "
          f"{keep - su_m:.1f} | {keep - su_m - run:.1f} |")
    return keep

print("\n| case | months used | paid upfront/so far | refund | extra charge | we keep | keep-proposal startup |"
      " keep-model startup(no CAC) | same minus running cost |")
print("|---|---|---|---|---|---|---|---|---|")
for k in (1, 3, 6, 9, 11):
    row("shop y1 1199", k, 1199, max(0, (12 - k) * 100 - 200), 0, "shop")
for k in (1, 6, 11):
    keep = 790 - (12 - k) * 65
    print(f"| shop renewal 790 | {k} | 790.0 | {(12-k)*65:.1f} | 0.0 | {keep:.1f} | {keep:.1f} (no start-up) | - | "
          f"{keep - SU['shop']['run_m']*k:.1f} |")

cmp = {}
for rate, annual, b in ((49, 539, "host"), (39, 429, "host5")):
    for k in (1, 2, 4, 6):
        pen = max(0, 6 - k) / 2 * rate
        cmp[(b, k, "m")] = row(f"host monthly {rate}", k, k * rate, 0, pen, b)
    for k in (1, 2, 4, 6, 10, 11):
        cmp[(b, k, "a")] = row(f"host annual {annual}", k, annual, max(0, annual - k * rate), 0, b)

print("\n== monthly vs annual, same exit month (total the customer pays us) ==")
for b in ("host", "host5"):
    for k in (1, 2, 4, 6):
        m, a = cmp[(b, k, "m")], cmp[(b, k, "a")]
        flag = "ANNUAL PAYS LESS" if a < m else ("equal" if a == m else "annual pays more")
        print(f"{b} exit after {k}: monthly {m:.1f} vs annual {a:.1f} -> {flag}")

print("\n== ratio checks ==")
print("1199/12 =", round(1199 / 12, 2), " 790/12 =", round(790 / 12, 2), " 11*49 =", 11 * 49, " 11*39 =", 11 * 39)
