"""NFC pricing model v3. stdlib only. Run: python finance/model.py
Prices are before VAT. Rows with service=ref are market references only (used only in the market check).
Unknown keys raise an error (no silent zeros)."""
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
U = "غير مؤكد"
HERE = os.path.dirname(os.path.abspath(__file__))
INF = float("inf")

D = {}
with open(os.path.join(HERE, "inputs.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        a = r["actual_value"].strip()
        raw = a or r["estimate"].strip()
        try:
            D[(r["service"], r["key"])] = (float(raw.replace(",", "")), not a)
        except ValueError:
            sys.exit(f"خطأ في inputs.csv: البند {r['service']}/{r['key']} قيمته '{raw}' مو رقم")


class Ctx:
    """Reads inputs (service row first, then 'all'), tracks uncertainty, applies overrides."""
    def __init__(self, s, ov=None):
        self.s, self.ov, self.unc = s, ov or {}, False

    def __call__(self, k):
        if k in self.ov:
            return self.ov[k]
        hit = D.get((self.s, k)) or D.get(("all", k))
        if hit is None:
            raise KeyError(f"inputs.csv ما فيه البند '{k}' للخدمة '{self.s}' ولا في 'all'")
        self.unc |= hit[1]
        return hit[0]


def repl_cost_yr(g, repl_unit_cost, share_key="free_replacement_share"):
    """Expected yearly free-replacement cost per unit (fin-risk formula)."""
    return g("risk_damage_rate") * g(share_key) * (
        repl_unit_cost + g("replacement_shipping_cost") + g("replacement_labor_min") / 60 * g("labor_cost_per_hour"))


def fixed_year1(g, extra_monthly=0.0):
    return g("fixed_startup") + 12 * (g("fixed_monthly") + extra_monthly)


def paid_months(c, horizon):
    return sum((1 - c) ** i for i in range(horizon))


# ---------- review stand: basic / brand / pack5 (one-time sale per client) ----------
PRODUCTS = {"basic": ("price_review_basic", None), "brand": ("price_review_brand", "brand"),
            "pack5": ("price_review_pack5", "brand")}


def review(product="basic", ov=None, pm=1.0, cm=1.0):
    g = Ctx("review_stand", ov)
    price_key, tier = PRODUCTS[product]
    n = g("pack5_units") if product == "pack5" else 1
    price = g(price_key) * pm
    chip = g("cost_chip")
    hw_unit = chip * (1 + g("dead_on_arrival_rate")) + g("cost_stand_print") + g("cost_shipping")  # DOA on chip only
    labor = n * g("labor_minutes") / 60 * g("labor_cost_per_hour")
    if tier == "brand":
        labor += g("design_minutes_brand") / 60 * g("labor_cost_per_hour")
        # wider policy: breakage covered -> reprint of custom stand (fin-risk: custom print is not stock)
        repl = n * repl_cost_yr(g, chip + g("cost_stand_print"), "free_replacement_share_brand")
    else:
        # basic: factory defect within 30 days only -> chip swap
        repl = n * repl_cost_yr(g, chip)
    once = g("install_delivery") + g("cac_per_client")
    cost = (n * hw_unit + labor + repl + once) * cm
    fee = price * g("payment_fee_pct")
    refund = g("refund_rate_setup") * (price - (1 - g("refund_setup_nonrecoverable")) * n * hw_unit * cm)
    m = price - cost - fee - refund
    be = fixed_year1(g) / m if m > 0 else INF
    return dict(units=n, cost_per_client=cost, price=price, payment_fee=fee, refund_loss=refund,
                margin_per_client=m, margin_pct=m / price * 100,
                be_clients_year1=be), g.unc


# ---------- subscriptions ----------
def subscription(s, ov=None, pm=1.0, cm=1.0, discount=False):
    g = Ctx(s, ov)
    extra_fixed = 0.0
    if s == "menu":
        setup_p, mp = g("price_menu_setup"), g("price_menu_monthly")
        n, unit = g("menu_tags_included"), g("cost_tag_unit")
        hw = n * unit * (1 + g("dead_on_arrival_rate"))  # tag cost treated as chip cost
        labor_min = g("labor_minutes") + g("design_minutes")
        mcost = g("cost_hosting_monthly") + g("support_minutes_monthly") / 60 * g("labor_cost_per_hour")
        repl = n * repl_cost_yr(g, unit) / 12
    else:
        setup_p, mp = g("price_host_setup_per_unit"), g("price_host_monthly_per_unit")
        if discount:
            mp *= 1 - g("host_volume_discount_pct")
        chip = g("cost_chip")
        hw = chip * (1 + g("dead_on_arrival_rate")) + g("cost_shipping")
        labor_min = g("labor_minutes")
        mcost = g("cost_hosting_monthly") + g("whatsapp_msg_cost") * g("whatsapp_msgs_per_unit_month")
        repl = repl_cost_yr(g, chip) / 12
        extra_fixed = g("wa_platform_monthly")
    setup_p, mp = setup_p * pm, mp * pm
    setup_c = (hw + labor_min / 60 * g("labor_cost_per_hour") + g("install_delivery") + g("cac_per_client")) * cm
    mc = (mcost + repl) * cm
    collect = 1 - g("payment_failure_rate") * g("bad_debt_share") - g("payment_fee_pct")
    mm = mp * collect - mc
    rr = g("refund_rate_setup")
    refund_loss = rr * (setup_p - (1 - g("refund_setup_nonrecoverable")) * hw * cm)
    setup_net = setup_p * (1 - g("payment_fee_pct")) - setup_c - refund_loss
    recover = 0.0 if setup_net >= 0 else (-setup_net / mm if mm > 0 else INF)
    c = g("risk_monthly_churn")
    stay = 1 - rr  # refunded clients never pay monthly
    p12 = setup_net + mm * paid_months(c, 12) * stay
    # clients joining evenly: one per month over year 1, each earns only the months left in the year
    avg_even = sum(setup_net + mm * paid_months(c, 12 - j) * stay for j in range(12)) / 12
    fx = fixed_year1(g, extra_fixed)
    be = fx / p12 if p12 > 0 else INF
    be_even = fx / avg_even if avg_even > 0 else INF
    return dict(setup_cost=setup_c, setup_price=setup_p, setup_net=setup_net, monthly_cost=mc,
                monthly_price=mp, monthly_margin=mm, months_to_recover_setup=recover,
                profit_12m_per_client=p12, year1_fixed_costs=fx,
                be_clients_if_all_join_day1=be, be_clients_if_join_evenly_year1=be_even), g.unc


def fmt(x):
    return "لا نهائي" if x == INF else f"{x + 0.0:,.1f}".replace("-0.0", "0.0")


def tg(u):
    return f" [{U}]" if u else ""


def grid(fn, key, t):
    cms = (0.7, 1.0, 1.3)
    print(f"\nحساسية {key} (صفوف: السعر، أعمدة: التكلفة){t}")
    print("| السعر / التكلفة | " + " | ".join(f"{round((c - 1) * 100):+d}%" for c in cms) + " |\n|---|---|---|---|")
    for pm in (0.8, 1.0, 1.2):
        print(f"| {round((pm - 1) * 100):+d}% | " + " | ".join(fmt(fn(pm=pm, cm=c)[0][key]) for c in cms) + " |")


def block(title, r, u):
    print(f"\n## {title}")
    for k, v in r.items():
        print(f"- {k}: {fmt(v)}{tg(u)}")


print(f"# مخرجات نموذج التسعير v3 (ريال قبل الضريبة، {U} ما دامت actual_value فاضية)")
print("ملاحظة: التكاليف الثابتة (fixed_startup + 12 × fixed_monthly) ما تتوزع على الخدمات؛ كل نقطة تعادل تحسب "
      "لو الخدمة وحدها تغطي كل الثابت. الاستضافة محسوبة لكل عميل فقط، وfixed_monthly بدونها. "
      "ستاند التقييم بيع مرة وحدة، فنقطة التعادل له ما تتأثر بموعد انضمام العميل.")

for p in PRODUCTS:
    fn = lambda ov=None, pm=1.0, cm=1.0, p=p: review(p, ov, pm, cm)
    r, u = fn()
    block(f"review_stand / {p}", r, u)
    grid(fn, "margin_per_client", tg(u))

for s, churns in (("menu", (0.01, 0.03, 0.05, 0.08)), ("host_bundle", (0.02, 0.04, 0.06, 0.10, 0.15))):
    fn = lambda ov=None, pm=1.0, cm=1.0, s=s: subscription(s, ov, pm, cm)
    r, u = fn()
    block(s, r, u)
    grid(fn, "profit_12m_per_client", tg(u))
    print(f"\nحساسية الإلغاء الشهري{tg(u)}\n| churn | profit_12m_per_client | be_day1 | be_evenly |\n|---|---|---|---|")
    for c in churns:
        rr = fn({"risk_monthly_churn": c})[0]
        print(f"| {c:.0%} | {fmt(rr['profit_12m_per_client'])} | {fmt(rr['be_clients_if_all_join_day1'])} | "
              f"{fmt(rr['be_clients_if_join_evenly_year1'])} |")

r, u = subscription("host_bundle", discount=True)
block("host_bundle بخصم 5 وحدات فأكثر (لكل وحدة)", r, u)
print(f"\nحساسية تكلفة رسالة واتساب (host_bundle){tg(u)}")
print("| SAR/رسالة | monthly_margin | profit_12m | profit_12m بالخصم |\n|---|---|---|---|")
for w in (0.0, 0.1, 0.2, 0.4, 0.8):
    a = subscription("host_bundle", {"whatsapp_msg_cost": w})[0]
    b = subscription("host_bundle", {"whatsapp_msg_cost": w}, discount=True)[0]
    print(f"| {w} | {fmt(a['monthly_margin'])} | {fmt(a['profit_12m_per_client'])} | {fmt(b['profit_12m_per_client'])} |")

# ---------- market range check (mkt_* rows) ----------
def ref(k):
    return D[("ref", k)]


print("\n## مقارنة بالسوق (صفوف mkt_* من fin-pricing)")
lo, hi = ref("mkt_review_low"), ref("mkt_review_high")
for p in ("basic", "brand"):
    g = Ctx("review_stand")
    v = g(PRODUCTS[p][0])
    pos = "داخل" if lo[0] <= v <= hi[0] else ("فوق" if v > hi[0] else "تحت")
    print(f"- ستاند {p} {fmt(v)}: {pos} نطاق السوق {fmt(lo[0])}-{fmt(hi[0])}{tg(g.unc or lo[1] or hi[1])}")
g = Ctx("review_stand")
per = g("price_review_pack5") / g("pack5_units")
pos = "داخل" if lo[0] <= per <= hi[0] else ("فوق" if per > hi[0] else "تحت")
print(f"- باقة 5 للقطعة {fmt(per)}: {pos} نطاق السوق {fmt(lo[0])}-{fmt(hi[0])}{tg(True)}")
lo, hi = ref("mkt_menu_monthly_low"), ref("mkt_menu_monthly_high")
v = Ctx("menu")("price_menu_monthly")
pos = "داخل" if lo[0] <= v <= hi[0] else ("فوق" if v > hi[0] else "تحت")
print(f"- المنيو الشهري {fmt(v)}: {pos} نطاق السوق {fmt(lo[0])}-{fmt(hi[0])}{tg(True)}")
m = ref("mkt_host_monthly_ref")
g = Ctx("host_bundle")
v, vd = g("price_host_monthly_per_unit"), g("price_host_monthly_per_unit") * (1 - g("host_volume_discount_pct"))
print(f"- المضيف الشهري {fmt(v)} (بالخصم {fmt(vd)}): {v / m[0]:.1f}× و{vd / m[0]:.1f}× من المرجع العالمي "
      f"{fmt(m[0])}{tg(True)}")

# ---------- worst case + GO/NO-GO (fin-risk rule) ----------
print("\n## أسوأ حالة مجمّعة وقرار GO/NO-GO (قاعدة fin-risk: لو الهامش سالب، الخدمة ما تنطلق بهذا السعر)")
print("الافتراضات: السعر −20٪؛ مضاعف ×1.5 على تكاليف الأجهزة والعمل والتوصيل وجلب العميل والاستبدال والتشغيل الشهري "
      "(عمولة الدفع ومبلغ الإرجاع يتبعون السعر بدون مضاعف)؛ تالف 50٪؛ استبدال مجاني 100٪ لكل الباقات؛ إرجاع 15٪؛ "
      "عمولة 3٪؛ الإلغاء = أعلى قيمة لكل خدمة عند fin-risk.")
bad = {"risk_damage_rate": 0.5, "free_replacement_share": 1.0, "free_replacement_share_brand": 1.0,
       "refund_rate_setup": 0.15, "payment_fee_pct": 0.03}


def verdict(v):
    return "GO" if v > 0 else "NO-GO"


for p in PRODUCTS:
    r, u = review(p, bad, 0.8, 1.5)
    v = r["margin_per_client"]
    print(f"- review_stand/{p}: margin_per_client = {fmt(v)} → {verdict(v)}{tg(u)}")
for s, disc in (("menu", False), ("host_bundle", False), ("host_bundle", True)):
    ov = dict(bad, risk_monthly_churn=D[(s, "risk_churn_max")][0])
    r, u = subscription(s, ov, 0.8, 1.5, disc)
    u |= D[(s, "risk_churn_max")][1]
    v = r["profit_12m_per_client"]
    print(f"- {s}{' بالخصم' if disc else ''} (churn {ov['risk_monthly_churn']:.0%}): profit_12m_per_client = "
          f"{fmt(v)} → {verdict(v)}{tg(u)}")
