"""NFC pricing model v4. stdlib only. Run: python finance/model.py > finance/output.txt
Part 1 (النموذج السابق: بيع القطعة): review_stand / menu / host_bundle, unchanged from v3.
Part 2 (v4, العتاد مجاني داخل الاشتراك): shop_bundle / review_sub / host_free_hw (work/2026-09-27-bundle-pricing).
Prices are before VAT unless prices_include_vat=1. Rows with service=ref are market references only.
inputs.csv is validated before anything prints: unknown service, duplicate row, non-number, nan/inf, negative value,
ratio outside 0..1, flag not 0/1, units = 0, a key the model needs but is missing, or a row the model never reads
-> clean exit with an Arabic message naming the row."""
import csv, math, os, sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
U = "غير مؤكد"
HERE = os.path.dirname(os.path.abspath(__file__))
INF = float("inf")
SERVICES = {"review_stand", "menu", "host_bundle", "shop_bundle", "review_sub", "host_free_hw", "all", "ref"}


def die(msg):
    sys.exit(f"خطأ في inputs.csv: {msg}")


D = {}
with open(os.path.join(HERE, "inputs.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        s, k, unit = r["service"].strip(), r["key"].strip(), r["unit"].strip()
        name = f"{s}/{k}"
        if s not in SERVICES:
            die(f"البند {name}: الخدمة '{s}' مو معروفة (المسموح: {', '.join(sorted(SERVICES))})")
        if (s, k) in D:
            die(f"البند {name} مكرر")
        a = r["actual_value"].strip()
        raw = a or r["estimate"].strip()
        try:
            v = float(raw.replace(",", ""))
        except ValueError:
            die(f"البند {name} قيمته '{raw}' مو رقم")
        if math.isnan(v) or math.isinf(v):
            die(f"البند {name} قيمته '{raw}' مو رقم صالح")
        if v < 0:
            die(f"البند {name} قيمته سالبة ({raw})")
        if unit.startswith("ratio") and v > 1:
            die(f"البند {name} نسبة لازم بين 0 و1 (القيمة {raw})")
        if unit == "flag" and v not in (0, 1):
            die(f"البند {name} لازم 0 أو 1 (القيمة {raw})")
        if unit == "units" and v == 0:
            die(f"البند {name} عدد الوحدات صفر")
        D[(s, k)] = (v, not a)
KEYS = {k for _, k in D}
USED = set()


def dget(s, k):
    if (s, k) not in D:
        raise KeyError(f"inputs.csv ما فيه البند '{k}' للخدمة '{s}'")
    USED.add((s, k))
    return D[(s, k)]


def ref(k):
    return dget("ref", k)


def verdict(v):
    return "GO" if v > 0 else "NO-GO"


class Ctx:
    """Reads inputs (service row first, then 'all'), tracks uncertainty, applies overrides."""
    def __init__(self, s, ov=None):
        self.s, self.ov, self.unc = s, ov or {}, False
        bad = [k for k in self.ov if k not in KEYS]
        if bad:
            raise KeyError(f"بند غير معروف في الحساسية: {', '.join(bad)}")

    def __call__(self, k):
        if k in self.ov:
            return self.ov[k]
        row = (self.s, k) if (self.s, k) in D else ("all", k)
        if row not in D:
            raise KeyError(f"inputs.csv ما فيه البند '{k}' للخدمة '{self.s}' ولا في 'all'")
        USED.add(row)
        self.unc |= D[row][1]
        return D[row][0]


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




# ========== v4: العتاد مجاني داخل الاشتراك (work/2026-09-27-bundle-pricing) ==========
# Hardware is our sunk cost. An early cancel (refund window) returns the price and loses hardware + labour + CAC;
# hardware comes back only for shop_bundle and only if risk_recovery_rate > 0 (fin-risk).
BUNDLES = {
    "shop": ("shop_bundle", "price_shop_annual", "حزمة المحل الكامل (سنوي)"),
    "review": ("review_sub", "price_review_sub_annual", "ستاند التقييم اشتراك سنوي مع تركيب"),
    "review_lite": ("review_sub", "price_review_sub_lite_annual", "ستاند التقييم اشتراك سنوي بلا تركيب"),
    "host": ("host_free_hw", "price_host_monthly_per_unit_free_hw", "المضيف 1-4 وحدات (شهري لكل وحدة)"),
    "host5": ("host_free_hw", "price_host_monthly_per_unit_5plus", "المضيف 5+ وحدات (شهري لكل وحدة)"),
}
REF_KEYS = ("mkt_review_low", "mkt_review_high", "mkt_menu_monthly_low", "mkt_menu_monthly_high",
            "mkt_host_monthly_ref", "review_commodity_low", "review_commodity_high", "mkt_menu_annual_low",
            "mkt_host_unit_low", "mkt_host_unit_high")
# fin-risk worst case (rule 5) + host commit collected at the low end
W = {"risk_early_cancel_rate": 0.25, "risk_nonrenew_rate": 0.6, "labor_cost_per_hour": 50, "cac_per_client": 80,
     "lite_cac_per_client": 80, "risk_defect_rate": 0.08, "risk_damage_replace_rate_yearly": 0.2,
     "prices_include_vat": 1, "risk_host_unit_churn_monthly": 0.10, "host_commit_collect_rate": 0.5}


def hardware(g, s):
    """(hardware incl. supplier shipping, parts only (for a repair), pieces)."""
    if s == "shop_bundle":
        st, tg_ = g("shop_stands_included"), g("shop_tags_included")
        parts = st * g("cost_stand_unit") + tg_ * g("cost_tag_unit")
        return parts + st * g("cost_shipping"), parts, st + tg_
    part = g("cost_stand_unit") if s == "review_sub" else g("cost_chip")
    return part + g("cost_shipping"), part, 1


def host_months(c, commit, h, r):
    """Expected paid months in [0, h): natural churn c (month 1 paid by all), plus the months a leaver still owes
    inside the commitment, collected at rate r."""
    m = min(commit, h)
    nat_m = sum((1 - c) ** i for i in range(int(m)))
    return sum((1 - c) ** i for i in range(int(h))) + r * (m - nat_m)


def bundle(b, ov=None, pm=1.0, cm=1.0):
    s, pkey, _ = BUNDLES[b]
    g = Ctx(s, ov)
    vat = g("vat_rate") * g("prices_include_vat")
    h = g("labor_cost_per_hour")
    lite = b == "review_lite"
    hw, parts, pieces = hardware(g, s)
    hw, parts = hw * cm, parts * cm
    lab_min = g("lite_labor_minutes") if lite else g("labor_minutes")
    if s == "shop_bundle":
        lab_min += g("design_minutes")
    visit = g("lite_delivery") if lite else g("install_delivery")
    cac = g("lite_cac_per_client") if lite else g("cac_per_client")
    n = g("host_volume_threshold_units") if b == "host5" else g("units_per_client")
    # a repair = the part (no second supplier shipping) + delivery to the client + fin-risk's 0.5 h
    repair = parts + pieces * (g("replacement_shipping_cost") + g("risk_defect_labor_min") / 60 * h) * cm
    defect = g("risk_defect_rate") * repair
    upfront = hw + (lab_min / 60 * h + (visit + cac) / n) * cm
    damage_yr = g("risk_damage_replace_rate_yearly") * repair if s in ("shop_bundle", "host_free_hw") else 0.0
    run_m = (g("cost_hosting_monthly") + g("wa_msgs_cost_monthly")
             + g("support_minutes_monthly") / 60 * h) * cm + damage_yr / 12
    e = g("risk_early_cancel_rate")
    recover = g("risk_recovery_rate") * (hw - g("risk_recovery_cost") * cm) if s == "shop_bundle" else 0.0
    lost = e * (recover - upfront)
    fee = g("payment_fee_pct")
    fx = fixed_year1(g, g("wa_platform_monthly") if s == "host_free_hw" else 0.0)
    p1 = g(pkey) * pm / (1 + vat)
    if s == "host_free_hw":
        commit, c, rc = g("host_min_commit_months"), g("risk_host_unit_churn_monthly"), g("host_commit_collect_rate")
        setup = g("price_host_setup_free_hw") * pm / (1 + vat) * (1 - fee)
        mm = p1 * (1 - g("payment_failure_rate") * g("bad_debt_share") - fee) - run_m
        stay = lambda hz: setup + host_months(c, commit, hz, rc) * mm - upfront - defect
        y1 = (1 - e) * stay(12) + lost
        y2 = (1 - e) * sum((1 - c) ** i for i in range(12, 24)) * mm
        y1_even = sum((1 - e) * stay(12 - j) + lost for j in range(12)) / 12
        am = g("host_annual_months_charged")
        prepay = lambda months: (1 - e) * (setup + months * p1 * (1 - fee) - 12 * run_m - upfront - defect) + lost
        rev_y1 = p1 * 12
        extra = dict(monthly_price_net=p1, monthly_margin=mm, units_per_client=n,
                     months_to_recover_hw=(upfront + defect) / mm if mm > 0 else INF, commit_months=commit,
                     profit_y1_if_annual_prepay=prepay(am), profit_y1_if_annual_prepay_11m=prepay(11))
    else:
        p2 = (g("price_shop_renewal") if s == "shop_bundle" else g(pkey)) * pm / (1 + vat)
        # earned basis: an annual fee is earned month by month, so a client joining in month j earns (12-j)/12
        stay = lambda hz: p1 * (1 - fee) * hz / 12 - upfront - defect - run_m * hz
        y1 = (1 - e) * stay(12) + lost
        y2 = (1 - e) * (1 - g("risk_nonrenew_rate")) * (p2 * (1 - fee) - 12 * run_m)
        y1_even = sum((1 - e) * stay(12 - j) + lost for j in range(12)) / 12
        rev_y1 = p1
        extra = dict(renewal_price_net=p2)
    r = dict(price_net_y1=rev_y1, upfront_sunk_cost=upfront, defect_cost=defect, running_cost_y1=run_m * 12,
             profit_y1_per_unit=y1, margin_pct_y1=y1 / rev_y1 * 100 if rev_y1 else -INF, profit_y2_expected=y2,
             profit_2yr_expected=y1 + y2, year1_fixed_costs=fx,
             be_if_all_join_day1=fx / y1 if y1 > 0 else INF,
             be_if_join_evenly_year1=fx / y1_even if y1_even > 0 else INF, **extra)
    return r, g.unc


def bsearch(b, ov, ok):
    """Lowest advertised price (inputs' VAT basis) with ok(result) true; None if not even at 40x the input price."""
    s, pkey, _ = BUNDLES[b]
    base = Ctx(s, ov)(pkey)
    if not ok(bundle(b, ov, pm=40.0)[0]):
        return None
    lo, hi = 0.0, 40.0
    for _ in range(60):
        mid = (lo + hi) / 2
        (lo, hi) = (lo, mid) if ok(bundle(b, ov, pm=mid)[0]) else (mid, hi)
    return hi * base


def bprice_needed(b, target, ov, horizon="y1"):
    k = "profit_y1_per_unit" if horizon == "y1" else "profit_2yr_expected"
    return bsearch(b, ov, lambda r: r[k] >= target / 100 * r["price_net_y1"])


def worst_go_price(b, extra=None):
    return bsearch(b, dict(W, **(extra or {})), lambda r: r["profit_2yr_expected"] > 0)


def fmtp(x):
    return "ما فيه سعر" if x is None else fmt(x)


def validate():
    """Run every model path once, before printing: missing keys and rows the model never reads stop the run."""
    try:
        for p in PRODUCTS:
            review(p)
        subscription("menu"), subscription("host_bundle"), subscription("host_bundle", discount=True)
        Ctx("host_bundle")("host_volume_threshold_units")
        for s in ("menu", "host_bundle"):
            dget(s, "risk_churn_max")
        for b in BUNDLES:
            bundle(b)
        for k in REF_KEYS:
            ref(k)
    except KeyError as ex:
        sys.exit(f"خطأ: {ex.args[0]}")
    unused = sorted(set(D) - USED)
    if unused:
        die("بنود ما يقرأها النموذج (مفتاح غلط أو خدمة غلط): " + "، ".join(f"{s}/{k}" for s, k in unused))


validate()
OLD = "النموذج السابق: بيع القطعة — "
print(f"# مخرجات نموذج التسعير v4 (ريال قبل الضريبة، {U} ما دامت actual_value فاضية)")
print("ملاحظة: التكاليف الثابتة (fixed_startup + 12 × fixed_monthly) ما تتوزع على الخدمات؛ كل نقطة تعادل تحسب "
      "لو الخدمة وحدها تغطي كل الثابت. الاستضافة محسوبة لكل عميل فقط، وfixed_monthly بدونها. "
      "ستاند التقييم بيع مرة وحدة، فنقطة التعادل له ما تتأثر بموعد انضمام العميل.")

for p in PRODUCTS:
    fn = lambda ov=None, pm=1.0, cm=1.0, p=p: review(p, ov, pm, cm)
    r, u = fn()
    block(f"{OLD}review_stand / {p}", r, u)
    grid(fn, "margin_per_client", tg(u))

for s, churns in (("menu", (0.01, 0.03, 0.05, 0.08)), ("host_bundle", (0.02, 0.04, 0.06, 0.10, 0.15))):
    fn = lambda ov=None, pm=1.0, cm=1.0, s=s: subscription(s, ov, pm, cm)
    r, u = fn()
    block(OLD + s, r, u)
    grid(fn, "profit_12m_per_client", tg(u))
    print(f"\nحساسية الإلغاء الشهري{tg(u)}\n| churn | profit_12m_per_client | be_day1 | be_evenly |\n|---|---|---|---|")
    for c in churns:
        rr = fn({"risk_monthly_churn": c})[0]
        print(f"| {c:.0%} | {fmt(rr['profit_12m_per_client'])} | {fmt(rr['be_clients_if_all_join_day1'])} | "
              f"{fmt(rr['be_clients_if_join_evenly_year1'])} |")

r, u = subscription("host_bundle", discount=True)
block(OLD + f"host_bundle بخصم {Ctx('host_bundle')('host_volume_threshold_units'):g} وحدات فأكثر (لكل وحدة)", r, u)
print(f"\n{OLD}حساسية تكلفة رسالة واتساب (host_bundle){tg(u)}")
print("| SAR/رسالة | monthly_margin | profit_12m | profit_12m بالخصم |\n|---|---|---|---|")
for w in (0.0, 0.1, 0.2, 0.4, 0.8):
    a = subscription("host_bundle", {"whatsapp_msg_cost": w})[0]
    b = subscription("host_bundle", {"whatsapp_msg_cost": w}, discount=True)[0]
    print(f"| {w} | {fmt(a['monthly_margin'])} | {fmt(a['profit_12m_per_client'])} | {fmt(b['profit_12m_per_client'])} |")

# ---------- market range check (mkt_* rows) ----------


print(f"\n## {OLD}مقارنة بالسوق (صفوف mkt_* من fin-pricing)")
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
print(f"\n## {OLD}أسوأ حالة مجمّعة وقرار GO/NO-GO (قاعدة fin-risk: لو الهامش سالب، الخدمة ما تنطلق بهذا السعر)")
print("الافتراضات: السعر −20٪؛ مضاعف ×1.5 على تكاليف الأجهزة والعمل والتوصيل وجلب العميل والاستبدال والتشغيل الشهري "
      "(عمولة الدفع ومبلغ الإرجاع يتبعون السعر بدون مضاعف)؛ تالف 50٪؛ استبدال مجاني 100٪ لكل الباقات؛ إرجاع 15٪؛ "
      "عمولة 3٪؛ الإلغاء = أعلى قيمة لكل خدمة عند fin-risk.")
bad = {"risk_damage_rate": 0.5, "free_replacement_share": 1.0, "free_replacement_share_brand": 1.0,
       "refund_rate_setup": 0.15, "payment_fee_pct": 0.03}




for p in PRODUCTS:
    r, u = review(p, bad, 0.8, 1.5)
    v = r["margin_per_client"]
    print(f"- review_stand/{p}: margin_per_client = {fmt(v)} → {verdict(v)}{tg(u)}")
for s, disc in (("menu", False), ("host_bundle", False), ("host_bundle", True)):
    ov = dict(bad, risk_monthly_churn=dget(s, "risk_churn_max")[0])
    r, u = subscription(s, ov, 0.8, 1.5, disc)
    u |= dget(s, "risk_churn_max")[1]
    v = r["profit_12m_per_client"]
    print(f"- {s}{' بالخصم' if disc else ''} (churn {ov['risk_monthly_churn']:.0%}): profit_12m_per_client = "
          f"{fmt(v)} → {verdict(v)}{tg(u)}")


# ---------- السعر المطلوب للستاند بعد أسعار الموردين، وحساسيته لساعة العمل وجلب العميل ----------
def price_needed(product, target_pct, ov):
    """أقل سعر يعطي هامش = target_pct من السعر (bisection)."""
    key = PRODUCTS[product][0]
    lo, hi = 0.0, 5000.0
    for _ in range(60):
        mid = (lo + hi) / 2
        r, _ = review(product, dict(ov, **{key: mid}))
        (lo, hi) = (lo, mid) if r["margin_per_client"] >= target_pct / 100 * mid else (mid, hi)
    return hi

print(f"\n## {OLD}السعر المطلوب للستاند (تعادل للعميل / هامش 30%) حسب ساعة العمل وتكلفة جلب العميل [غير مؤكد]")
print("الستاند 25 ريال مؤكد من المورد؛ الشريحة والشحن والتوصيل والساعة وجلب العميل تقديرات.")
for product in ("basic", "pack5"):
    print(f"\n### {product} (السعر {'للباقة' if product == 'pack5' else 'للقطعة'})")
    print("| ساعة العمل / جلب العميل | 0 | 20 | 40 | 80 |")
    print("|---|---|---|---|---|")
    for h in (0, 25, 50):
        cells = []
        for c in (0, 20, 40, 80):
            ov = {"labor_cost_per_hour": h, "cac_per_client": c}
            cells.append(f"{fmt(price_needed(product, 0, ov))} / {fmt(price_needed(product, 30, ov))}")
        print(f"| {h} | " + " | ".join(cells) + " |")


print("\n\n# النموذج الجديد: العتاد مجاني داخل الاشتراك (3 حزم) [غير مؤكد]")
print("الأسعار قبل الضريبة ما لم يُذكر؛ prices_include_vat=1 يعني السعر المعلن شامل 15% والصافي = السعر ÷ 1.15. "
      "الإلغاء البدري = يسترد خلال النافذة ونخسر العتاد والعمل والجلب (العتاد يبقى عند العميل؛ الاسترجاع للمحل فقط و0 افتراضياً). "
      "المضيف: الأرقام لكل وحدة؛ الجلب والزيارة مقسومين على وحدات العميل (units_per_client للشريحة 1-4، "
      "host_volume_threshold_units للشريحة 5+)؛ الوحدة اللي توقف داخل الالتزام تدفع باقي الالتزام بنسبة تحصيل "
      "host_commit_collect_rate. الحزم السنوية: التعادل «بالتساوي» يحسب الإيراد المكتسب بالأشهر المخدومة مو النقد. "
      "profit_y2_expected = السنة الثانية المتوقعة بعد الإلغاء وعدم التجديد. نقطة التعادل = عدد عملاء/وحدات يغطون الثابت.")
for b, (s, pkey, label) in BUNDLES.items():
    r, u = bundle(b)
    block(f"{b}: {label}", r, u)
    grid(lambda ov=None, pm=1.0, cm=1.0, b=b: bundle(b, ov, pm, cm), "profit_y1_per_unit", tg(u))

print(f"\n## الأسعار اللي يدعمها النموذج{tg(True)}")
print("تعادل y1 وهامش 30% بالافتراضات الأساسية (قبل الضريبة). «سعر GO بأسوأ حالة» = أقل سعر يخلي profit_2yr > 0 "
      "في أسوأ حالة fin-risk (السعر المعلن شامل الضريبة). السعر الحالي «مدعوم» بس إذا ≥ سعر GO بأسوأ حالة و≥ تعادل y1.")
print("| الحزمة | السعر الحالي | تعادل y1 | هامش 30% y1 | سعر GO بأسوأ حالة | الحكم |\n|---|---|---|---|---|---|")
SUPPORT = {}
for b, (s, pkey, _) in BUNDLES.items():
    cur = Ctx(s)(pkey)
    be, m30, wg = bprice_needed(b, 0, {}), bprice_needed(b, 30, {}), worst_go_price(b)
    ok = wg is not None and be is not None and cur >= wg and cur >= be
    SUPPORT[b] = (cur, be, m30, wg, ok)
    print(f"| {b} | {fmt(cur)} | {fmtp(be)} | {fmtp(m30)} | {fmtp(wg)} | {'مدعوم' if ok else 'غير مدعوم'} |")

print(f"\n### رافعات أسوأ حالة: profit_2yr بالسعر الحالي لو تحسّن بند واحد فقط، وسعر GO معه{tg(True)}")
LEVERS = [("بدون تغيير", {}), ("ساعة العمل 25", {"labor_cost_per_hour": 25}),
          ("جلب العميل 40", {"cac_per_client": 40, "lite_cac_per_client": 40}),
          ("بدون دعم شهري", {"support_minutes_monthly": 0}), ("السعر قبل الضريبة", {"prices_include_vat": 0}),
          ("إلغاء بدري 10%", {"risk_early_cancel_rate": 0.10}),
          ("ساعة 25 + بدون دعم شهري", {"labor_cost_per_hour": 25, "support_minutes_monthly": 0})]
print("| الحزمة | " + " | ".join(n for n, _ in LEVERS) + " |\n|" + "---|" * (len(LEVERS) + 1))
for b in BUNDLES:
    cells = []
    for _, x in LEVERS:
        v = bundle(b, dict(W, **x))[0]["profit_2yr_expected"]
        cells.append(f"{fmt(v)} ({fmtp(worst_go_price(b, x))})")
    print(f"| {b} | " + " | ".join(cells) + " |")
print("(كل خانة: profit_2yr بأسوأ حالة بالسعر الحالي، وبين القوسين أقل سعر GO مع هذا التحسين)")

print(f"\n## مقارنة بالسوق للحزم الجديدة{tg(True)}")
mlo, hlo, hhi = ref("mkt_menu_annual_low")[0], ref("mkt_host_unit_low")[0], ref("mkt_host_unit_high")[0]
print(f"- المحل {fmt(SUPPORT['shop'][0])}/سنة = {SUPPORT['shop'][0] / mlo:.1f}× منيو الوسائط {fmt(mlo)}/سنة "
      f"(منيو فقط بلا عتاد ولا تركيب)")
for b in ("host", "host5"):
    v = SUPPORT[b][0]
    print(f"- {b} {fmt(v)}/وحدة/شهر: {v / hlo:.1f}× TapStay {fmt(hlo)} و{v / hhi:.1f}× Touch Stay {fmt(hhi)} (تحويل الدولار {U})")

print(f"\n## الضريبة: نفس الأسعار لو المعلن شامل الضريبة (الصافي ÷1.15){tg(True)}")
print("| الحزمة | profit_y1 قبل الضريبة | profit_y1 شامل | profit_2yr قبل | profit_2yr شامل |\n|---|---|---|---|---|")
for b in BUNDLES:
    a, v = bundle(b)[0], bundle(b, {"prices_include_vat": 1})[0]
    print(f"| {b} | {fmt(a['profit_y1_per_unit'])} | {fmt(v['profit_y1_per_unit'])} | "
          f"{fmt(a['profit_2yr_expected'])} | {fmt(v['profit_2yr_expected'])} |")

print(f"\n## حساسية الإلغاء البدري × عدم التجديد (profit_2yr_expected){tg(True)}")
print("| الحزمة | إلغاء بدري | عدم تجديد 20% | 40% | 60% |\n|---|---|---|---|---|")
for b in ("shop", "review", "review_lite"):
    for e in (0, 0.10, 0.25, 0.40):
        cells = [fmt(bundle(b, {"risk_early_cancel_rate": e, "risk_nonrenew_rate": n})[0]["profit_2yr_expected"])
                 for n in (0.2, 0.4, 0.6)]
        print(f"| {b} | {e:.0%} | " + " | ".join(cells) + " |")

print(f"\n## المضيف: الالتزام (6 fin-pricing / 3 fin-risk / 0) × إيقاف الوحدات × نسبة تحصيل الالتزام "
      f"(profit_y1_per_unit){tg(True)}")
print("| الحزمة | التزام | تحصيل | churn 2% | 5% | 10% |\n|---|---|---|---|---|---|")
for b in ("host", "host5"):
    for k in (6, 3, 0):
        for rc in ((0.5, 0.8, 1.0) if k else (0.8,)):
            cells = [fmt(bundle(b, {"host_min_commit_months": k, "risk_host_unit_churn_monthly": c,
                                    "host_commit_collect_rate": rc})[0]["profit_y1_per_unit"]) for c in (0.02, 0.05, 0.10)]
            print(f"| {b} | {k} | {rc:.0%} | " + " | ".join(cells) + " |")
print(f"\n### المضيف: الدفع السنوي المقدم مقابل الشهري (profit_y1 لكل وحدة){tg(True)}")
for b in ("host", "host5"):
    r = bundle(b)[0]
    flag = "أقل من الشهري" if r["profit_y1_if_annual_prepay"] < r["profit_y1_per_unit"] else "أعلى أو يساوي الشهري"
    print(f"- {b}: شهري {fmt(r['profit_y1_per_unit'])}؛ سنوي بسعر {Ctx('host_free_hw')('host_annual_months_charged'):g} "
          f"أشهر {fmt(r['profit_y1_if_annual_prepay'])} ({flag})؛ سنوي بسعر 11 شهر {fmt(r['profit_y1_if_annual_prepay_11m'])}")
print("(السنوي: ما فيه إيقاف داخل السنة ولا ديون معدومة، مقابل خصم شهرين؛ إذا طلع أقل من الشهري فالخصم أكبر من اللي يوفره)")
print(f"\nالمضيف بعتاد fin-risk الأخف (شريحة 15 وتجهيز 30 دقيقة) بدل 60 و120:{tg(True)}")
for b in ("host", "host5"):
    r = bundle(b, {"cost_chip": 15, "labor_minutes": 30})[0]
    print(f"- {b}: upfront {fmt(r['upfront_sunk_cost'])}، profit_y1 {fmt(r['profit_y1_per_unit'])}، "
          f"أشهر استرداد العتاد {fmt(r['months_to_recover_hw'])}")

# ---------- entry stand vs buying a commodity stand ----------
lo_, hi_ = ref("review_commodity_low")[0], ref("review_commodity_high")[0]
print(f"\n## ستاند التقييم: تكلفة سنتين على العميل مقابل شراء ستاند {fmt(lo_)}-{fmt(hi_)} ريال دفعة وحدة{tg(True)}")
print("المقارنة: memoreis.sa 45 (نفد من المخزون) و lateen.sa 92 شامل الضريبة (عبر saudi-market.md). "
      "«شامل 15%» = لو صرنا مسجلين في الضريبة وأضفناها فوق السعر. الربح بالافتراضات الأساسية (قبل الضريبة).")
print("| الاشتراك السنوي | سنتين قبل الضريبة | سنتين شامل 15% | ÷ 45 | ÷ 92 | y1 مع تركيب | 2yr مع تركيب | y1 بلا تركيب | 2yr بلا تركيب |")
print("|---|---|---|---|---|---|---|---|---|")
for p in (49, 79, 99, 119, 149, 199):
    a = bundle("review", {"price_review_sub_annual": p})[0]
    l = bundle("review_lite", {"price_review_sub_lite_annual": p})[0]
    two = 2 * p
    print(f"| {p} | {two} | {fmt(two * 1.15)} | {two * 1.15 / lo_:.1f}× | {two * 1.15 / hi_:.1f}× | "
          f"{fmt(a['profit_y1_per_unit'])} | {fmt(a['profit_2yr_expected'])} | {fmt(l['profit_y1_per_unit'])} | "
          f"{fmt(l['profit_2yr_expected'])} |")
for b in ("review", "review_lite"):
    print(f"- {b}: تعادل y1 {fmtp(bprice_needed(b, 0, {}))}، تعادل سنتين {fmtp(bprice_needed(b, 0, {}, '2yr'))}، "
          f"سعر GO بأسوأ حالة {fmtp(SUPPORT[b][3])}.")
print(f"- السعر السنوي اللي يخلي سنتين العميل = 92 (شامل الضريبة): {fmt(hi_ / 2 / 1.15)} قبل الضريبة، "
      f"و{fmt(hi_ / 2)} لو ما حنا مسجلين.")

# ---------- price needed: labour 0/25/50 x CAC 0/20/40/80 ----------
print(f"\n## السعر المطلوب للحزم الجديدة: تعادل y1 / هامش 30% y1 / تعادل سنتين، حسب ساعة العمل × جلب العميل{tg(True)}")
print("السعر بنفس أساس inputs (قبل الضريبة)؛ للمضيف السعر شهري لكل وحدة. لـ review_lite الجلب = lite_cac_per_client.")
for b in BUNDLES:
    print(f"\n### {b}: {BUNDLES[b][2]}")
    print("| ساعة العمل / جلب العميل | 0 | 20 | 40 | 80 |\n|---|---|---|---|---|")
    ck = "lite_cac_per_client" if b == "review_lite" else "cac_per_client"
    for hh in (0, 25, 50):
        cells = []
        for c in (0, 20, 40, 80):
            ov = {"labor_cost_per_hour": hh, ck: c}
            cells.append(f"{fmtp(bprice_needed(b, 0, ov))} / {fmtp(bprice_needed(b, 30, ov))} / "
                         f"{fmtp(bprice_needed(b, 0, ov, '2yr'))}")
        print(f"| {hh} | " + " | ".join(cells) + " |")

# ---------- worst case GO/NO-GO (fin-risk rule 5) ----------
print(f"\n## أسوأ حالة للحزم الجديدة وقرار GO/NO-GO{tg(True)}")
print("أسوأ حالة fin-risk: إلغاء بدري 25%، عدم تجديد 60%، ساعة 50، جلب 80، تالف 8%، كسر 20%، السعر شامل الضريبة، "
      "المضيف إيقاف 10% شهرياً وتحصيل الالتزام 50%. **القاعدة تحكم على profit_2yr** (ربح العميل المتوقع مع التجديد، "
      "fin-risk قاعدة 5)، وحكم y1 يُعرض للشفافية.")
for b in BUNDLES:
    for k in ((6, 3) if b.startswith("host") else (None,)):
        ov = dict(W) if k is None else dict(W, host_min_commit_months=k)
        r, u = bundle(b, ov)
        tag = "" if k is None else f" (التزام {k})"
        print(f"- {b}{tag}: y1 = {fmt(r['profit_y1_per_unit'])} → {verdict(r['profit_y1_per_unit'])}؛ "
              f"2yr = {fmt(r['profit_2yr_expected'])} → **{verdict(r['profit_2yr_expected'])}**{tg(u)}")
