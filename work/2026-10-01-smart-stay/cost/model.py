"""Smart-stay cost model (LamsaTap). stdlib only.
Run: python work/2026-10-01-smart-stay/cost/model.py > work/2026-10-01-smart-stay/cost/output.txt
All prices are proposals before VAT, NOT approved (GM-045 rule). Inputs + sources: inputs.csv."""
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
H = os.path.dirname(os.path.abspath(__file__))
I = {}
for r in csv.DictReader(open(os.path.join(H, "inputs.csv"), encoding="utf-8")):
    I[r["key"]] = {c: float(r[c]) for c in ("low", "base", "high")}
def g(k, c="base"): return I[k][c]

SCEN = [5, 20, 50]
# candidate packages: name, monthly per unit, one-off setup per unit, hardware owned by
PACKS = [("A دخول ذكي (عتاد مجاني داخل الاشتراك)", 99, 0),
         ("B دخول ذكي + تجهيز 299", 99, 299),
         ("C دخول ذكي + حجوزات", 129, 299),
         ("D كامل (دخول+حجوزات+أولوية) ", 149, 299)]
CHURN = [0.03, 0.05, 0.10]

def oneoff(c="base", lock=None):
    lk = g("lock_price", c) if lock is None else lock
    hw = lk + g("gateway_price", c) + g("nfc_sign", c)
    inst = g("locksmith_fee", c) + g("install_transport", c) + g("install_minutes", c) / 60 * g("labor_rate")
    return hw, inst

def monthly_unit(price, c="base", lock=None):
    hw, _ = oneoff(c, lock)
    v = {"hosting": g("hosting_unit", c),
         "whatsapp": g("wa_msg_cost", c) * g("wa_msgs_unit_month", c),
         "sms": g("sms_cost", c) * g("sms_msgs_unit_month", c),
         "support": g("support_min_unit_month", c) / 60 * g("labor_rate"),
         "battery": g("battery_unit_year", c) / 12,
         "reserve": g("failure_rate_year", c) * hw / 12,
         "payfee": g("payment_fee_pct", c) * price}
    return v

def fixed_month(c="base"): return g("n8n_plan_month", c) + g("wa_platform_month", c)

def pack_row(name, price, setup, n, c="base", lock=None, churn=0.05):
    hw, inst = oneoff(c, lock)
    mv = sum(monthly_unit(price, c, lock).values())
    contrib = price - mv                      # per unit per month
    fixed_u = fixed_month(c) / n
    margin = (contrib - fixed_u) / price
    upfront = hw + inst - setup * (1 - g("payment_fee_pct", c))
    payback = upfront / (contrib - fixed_u) if contrib > fixed_u else float("inf")
    life = 1 / churn
    ltv = (contrib - fixed_u) * life - upfront   # profit per unit over expected life
    return contrib, margin, payback, ltv

def be_units(price, c="base"):
    contrib = price - sum(monthly_unit(price, c).values())
    return fixed_month(c) / contrib if contrib > 0 else float("inf")

print("== تكلفة الوحدة مرة واحدة (ريال، قبل الضريبة) ==")
for c in ("low", "base", "high"):
    hw, inst = oneoff(c)
    print(f"{c:5}: عتاد {hw:7.2f} (قفل {g('lock_price',c):.0f} + بوابة {g('gateway_price',c):.0f} + لوحة NFC {g('nfc_sign',c):.2f}) | تركيب {inst:6.2f} | المجموع {hw+inst:7.2f}")
print("\n== تكلفة الوحدة الشهرية المتغيرة (سعر 129) ==")
for c in ("low", "base", "high"):
    v = monthly_unit(129, c)
    print(f"{c:5}: " + ", ".join(f"{k} {x:.2f}" for k, x in v.items()) + f" | المجموع {sum(v.values()):.2f}")
print(f"\nثابت شهري (n8n + منصة واتساب): low {fixed_month('low'):.0f} | base {fixed_month('base'):.0f} | high {fixed_month('high'):.0f}")

print("\n== الباقات المرشحة (base، تسرب 5%/شهر) ==")
print("الباقة | وحدات | مساهمة/وحدة/شهر | هامش بعد الثابت | استرداد العتاد (شهر) | ربح الوحدة على عمرها")
for name, p, s in PACKS:
    for n in SCEN:
        c_, m, pb, ltv = pack_row(name, p, s, n)
        print(f"{name} {p}/شهر +{s} | {n:3} | {c_:6.2f} | {m*100:5.1f}% | {pb:5.1f} | {ltv:8.0f}")
print("\n== نقطة التعادل: كم وحدة تغطي الثابت الشهري ==")
for name, p, s in PACKS:
    print(f"{p}/شهر: base {be_units(p):.1f} وحدة | high {be_units(p,'high'):.1f} وحدة")

print("\n== حساسية سعر القفل (باقة C 129 + 299، 20 وحدة، تسرب 5%) ==")
for lk in (169, 218, 400, 969):
    c_, m, pb, ltv = pack_row("C", 129, 299, 20, lock=lk)
    print(f"قفل {lk:4}: استرداد {pb:5.1f} شهر | ربح الوحدة على عمرها {ltv:7.0f}")
print("\n== حساسية التسرب (20 وحدة) ==")
for name, p, s in PACKS:
    print(name, " | ".join(f"تسرب {int(ch*100)}%: {pack_row(name,p,s,20,churn=ch)[3]:7.0f}" for ch in CHURN))
print("\n== السيناريو المتشائم high (20 وحدة، تسرب 10%) ==")
for name, p, s in PACKS:
    c_, m, pb, ltv = pack_row(name, p, s, 20, c="high", churn=0.10)
    print(f"{name}: هامش {m*100:5.1f}% | استرداد {pb:5.1f} | ربح العمر {ltv:7.0f}")

print("\n== النظافة (إضافة لكل زيارة، تمرير) ==")
for c in ("low", "base", "high"):
    pr = g("cleaning_price_visit", c); cost = pr / g("cleaning_markup", c)
    net = pr - cost - g("payment_fee_pct", c) * pr - g("cleaning_coord_min", c) / 60 * g("labor_rate")
    v = g("cleaning_visits_unit_month", c)
    print(f"{c:5}: سعر {pr:.0f} | تكلفة الشركة {cost:.2f} | صافي الزيارة {net:.2f} ({net/pr*100:.1f}%) | {v:.0f} زيارة/وحدة/شهر = {net*v:.0f}/وحدة/شهر")
