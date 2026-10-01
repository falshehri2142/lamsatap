"""نموذج ربح «إدارة المطعم» (fin-modeler، 2026-10-01). بايثون قياسي بدون مكتبات.
التشغيل: python work/2026-10-01-restaurant-ops/model.py > work/2026-10-01-restaurant-ops/output.txt
المدخلات: ops_inputs.csv بنفس المجلد (key, scope, actual_value, estimate, unit, source).
scope = all | <package> | <tier> | <package>:<tier> | ref. الأولوية: package:tier ثم package ثم tier ثم all.
ليش ملف منفصل عن finance/model.py: النموذج هناك يرفض أي خدمة أو بند ما يقرأه، و«الحزم» فيه ما فيها درجات طاولات
ولا تجربة ولا دفع شهري بالتزام للمطاعم؛ نفس القواعد (تحقق قبل الطباعة، «غير مؤكد» لما actual_value فاضي) مطبقة هنا.
الأسعار المعلنة بدون ضريبة (الشركة غير مسجلة، services/pricing.md)، والمشتريات بالسعر الشامل (ما تنسترد ضريبتها)."""
import csv, math, os, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
U = "غير مؤكد"
HERE = os.path.dirname(os.path.abspath(__file__))
INF = float("inf")
PKGS = ("waiter", "waiter_addon", "order", "pro")
TIERS = ("S", "M", "L45", "L60")
NAMES = {"waiter": "نداء النادل (بدون حزمة المحل)", "waiter_addon": "نداء النادل (إضافة على حزمة المحل)",
         "order": "الطلب من الطاولة (فيها حزمة المحل)", "pro": "إدارة المطعم برو"}
SCOPES = {"all", "ref", *PKGS, *TIERS, *(f"{p}:{t}" for p in PKGS for t in TIERS)}


def die(msg):
    sys.exit(f"خطأ في ops_inputs.csv: {msg}")


D = {}
with open(os.path.join(HERE, "ops_inputs.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        k, s, unit = r["key"].strip(), r["scope"].strip(), r["unit"].strip()
        name = f"{s}/{k}"
        if s not in SCOPES:
            die(f"البند {name}: النطاق '{s}' مو معروف")
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
        if unit.startswith("ratio") and not unit.startswith("ratio_mult") and v > 1:
            die(f"البند {name} نسبة لازم بين 0 و1 (القيمة {raw})")
        if unit == "flag" and v not in (0, 1):
            die(f"البند {name} لازم 0 أو 1 (القيمة {raw})")
        if unit == "tables" and v == 0:
            die(f"البند {name} عدد الطاولات صفر")
        D[(s, k)] = (v, not a)
USED = set()


def get(k, p=None, t=None):
    for s in (f"{p}:{t}", p, t, "all"):
        if s and (s, k) in D:
            USED.add((s, k))
            return D[(s, k)][0]
    raise KeyError(f"ops_inputs.csv ما فيه البند '{k}' للباقة '{p}' والدرجة '{t}'")


def ref(k):
    USED.add(("ref", k))
    if ("ref", k) not in D:
        raise KeyError(f"ops_inputs.csv ما فيه المرجع '{k}'")
    return D[("ref", k)][0]


class Prices:
    """مجموعة أسعار: 'proposal' = market.md كما هي (تجربة بتركيب كامل)، 'rec' = توصية fin-modeler.
    over يغيّر بند واحد (monthly / setup / commit / kit) للبحث عن أقل سعر وجدول التصحيحات."""
    def __init__(self, kind, over=None):
        self.kind, self.over = kind, over or {}

    def monthly(self, p, t):
        if "monthly" in self.over:
            return self.over["monthly"]
        return get("price_monthly" if self.kind == "proposal" else "rec_price_monthly", p, t)

    def setup(self, p, t, n):
        if "setup" in self.over:
            return self.over["setup"]
        if self.kind == "proposal":
            return get("price_setup", p, t)
        return get("rec_setup_base", p, t) + get("rec_setup_per_table", p, t) * max(0, n - get("rec_setup_free_tables", p, t))

    def commit(self, p, t):
        if "commit" in self.over:
            return self.over["commit"]
        return get("commit_months" if self.kind == "proposal" else "rec_commit_months", p, t)

    def kit(self, p, t):
        if "kit" in self.over:
            return self.over["kit"]
        return self.kind == "rec" and get("rec_trial_kit", p, t) == 1


def nat(c, h, start=0):
    """أشهر مخدومة متوقعة: الشهر الأول للكل، والإلغاء الشهري c بعده."""
    return sum((1 - c) ** i for i in range(start, start + int(h)))


def calc(p, t, pr, worst=False, ov=None, stress=False):
    """worst = تعريف القسم: السعر −20% + التكاليف ×1.3 + إلغاء 8% + تحصيل الالتزام 50%.
    stress = worst + تحويل التجربة conv_stress."""
    ov = ov or {}
    g = lambda k: ov[k] if k in ov else get(k, p, t)
    worst = worst or stress
    n = g("tables")
    h = g("labor_cost_per_hour")
    pm = g("price_mult_worst") if worst else 1.0
    cm = g("cost_mult_worst") if worst else 1.0
    c = g("churn_worst") if worst else g("churn_monthly")
    conv = g("conv_stress") if stress else g("trial_conversion")
    rc = g("commit_collect_worst") if worst else g("commit_collect_rate")
    price = pr.monthly(p, t) * pm
    setup_p = pr.setup(p, t, n) * pm
    K = pr.commit(p, t)
    kit = pr.kit(p, t)
    fee = g("payment_fee_pct") * (1 + g("payment_fee_vat"))
    stands = lambda x: x + math.ceil(x * g("spare_ratio"))
    su = g("stand_unit_incl") + g("lamination_per_stand")
    shop_hw = g("shop_stands") * g("shop_stand_incl")
    # --- التأسيس الدائم للعميل اللي يدفع (ستاندات كل الطاولات بشعاره) ---
    hw = (stands(n) * su + g("order_shipping_incl") + shop_hw) * cm
    once_min = (g("setup_fixed_min") + g("menu_entry_min") + g("menu_design_min") + g("logo_design_min")
                + g("shop_install_min") + g("training_min") + g("extra_setup_min"))
    setup_min = once_min + g("per_table_min") * n + g("hypercare_min")
    visits = g("visits")
    support_min = g("support_min_base") + g("support_min_per_table") * n
    repl_yr = (n * (g("stand_loss_rate_yr") * (su + g("repl_min") / 60 * h + g("repl_delivery"))
                    + g("paper_refresh_rate_yr") * (g("paper_incl") + g("paper_refresh_min") / 60 * h))
               * (1 - g("client_chargeback_share"))
               + g("shop_stands") * g("shop_damage_rate_yr") * (g("shop_stand_incl") + g("repl_delivery")
                                                                   + g("repl_min") / 60 * h))
    run_m = (g("run_monthly") + support_min / 60 * h + repl_yr / 12) * cm
    trial_service = g("trial_months") * run_m
    if kit:
        # تجربة بطقم متنقل: ما نطبع للمطعم قبل الدفع؛ الفاشلة تخسر وقت المنيو والإعداد والتدريب وتلف الطقم
        kn = min(n, g("kit_tables"))
        wear = stands(kn) * su * g("kit_wear_rate")
        t_min = g("menu_entry_min") + g("kit_setup_min") + g("training_min") + g("kit_per_table_min") * kn
        fail = (wear + (t_min + g("pickup_min")) / 60 * h + g("visit_cost") + g("pickup_cost")) * cm + trial_service
        setup_min += 2 * g("kit_per_table_min") * kn  # العميل اللي يتحول: حط الطقم وشيله
        hw += wear * cm
        visits += 1  # زيارة التجربة قبل التركيب الدائم
    else:
        # تجربة بتركيب كامل (market.md): الفاشلة تخسر الورق والشرائح والتغليف والشحن وستاندي المحل وكل العمل
        kn = n
        fail = ((stands(n) * (su - g("holder_incl") * g("holder_recovery")) + g("order_shipping_incl") + shop_hw)
                + (once_min + g("per_table_min") * n + g("pickup_min")) / 60 * h
                + g("visits") * g("visit_cost") + g("pickup_cost")) * cm + trial_service
    labor = setup_min / 60 * h * cm
    trips = visits * g("visit_cost") * cm
    cac = g("cac_per_trial") * cm / conv
    trial_loss = fail * (1 - conv) / conv
    upfront = hw + labor + trips + cac + trial_loss + trial_service
    collect = 1 - g("payment_failure_rate") * g("bad_debt_share") - fee
    mm = price * collect - run_m
    setup_net = setup_p * (1 - fee)

    def y1(H):  # شهري بالتزام K: المغادر داخل الالتزام يدفع الباقي بنسبة rc
        served = nat(c, H)
        owed = rc * (min(K, H) - nat(c, min(K, H)))
        return setup_net - upfront + (served + owed) * price * collect - served * run_m, served + owed

    Y1, paid1 = y1(12)
    Y2 = nat(c, 12, 12) * mm
    rev1 = setup_p + paid1 * price
    # سنوي مقدم (11 شهر): المغادر بعد k شهر يسترد الباقي ناقص شهر الخصم، فصافيه k × الشهري (افتراض)
    am = g("annual_months_charged")
    coll = sum((1 - c) ** (k - 1) * c * min(k, am) * price for k in range(1, 12)) + (1 - c) ** 11 * am * price
    cycle = coll - fee * am * price - nat(c, 12) * run_m
    Y1a = setup_net - upfront + cycle
    Y2a = (1 - c) ** 12 * cycle
    fx_line = g("line_fixed_startup") + 12 * g("line_fixed_monthly")
    fx_all = g("company_fixed_startup") + 12 * (g("company_fixed_monthly") + g("line_fixed_monthly"))
    even = sum(y1(12 - j)[0] for j in range(12)) / 12
    return dict(
        tables=n, trial_tables=kn, price_monthly=price, price_annual=am * price, setup_price=setup_p,
        rev_y1_nominal=setup_p + 12 * price, rev_y1_expected=rev1,
        hw=hw, setup_minutes=setup_min, labor=labor, trips=trips, cac_per_paying=cac,
        trial_fail_cost=fail, trial_loss_per_paying=trial_loss, upfront=upfront,
        support_min=support_min, repl_yr=repl_yr * cm, run_month=run_m,
        month_margin=mm, month_margin_pct=mm / price * 100 if price else -INF,
        months_to_recover=(upfront - setup_net) / mm if mm > 0 else INF,
        profit_y1=Y1, profit_y2=Y2, profit_2y=Y1 + Y2, margin_y1_pct=Y1 / rev1 * 100 if rev1 else -INF,
        profit_y1_annual=Y1a, profit_2y_annual=Y1a + Y2a,
        be_line_day1=fx_line / Y1 if Y1 > 0 else INF, be_line_even=fx_line / even if even > 0 else INF,
        be_all_day1=fx_all / Y1 if Y1 > 0 else INF, be_all_even=fx_all / even if even > 0 else INF,
    )


def fmt(x, d=0):
    if x == INF:
        return "لا نهائي"
    if x is None:
        return "ما فيه"
    return f"{x + 0.0:,.{d}f}".replace("-0", "0") if abs(x) >= 0.5 or d else "0"


def verdict(r):
    return "GO" if r["profit_2y"] > 0 else "NO-GO"


def bsearch(ok, lo=0.0, hi=5000.0):
    if not ok(hi):
        return None
    for _ in range(50):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if ok(mid) else (mid, hi)
    return hi


def validate():
    try:
        for kind in ("proposal", "rec"):
            for p in PKGS:
                for t in TIERS:
                    calc(p, t, Prices(kind)), calc(p, t, Prices(kind), stress=True)
        for k in [k for s, k in D if s == "ref"]:
            ref(k)
    except KeyError as ex:
        sys.exit(f"خطأ: {ex.args[0]}")
    unused = sorted(set(D) - USED)
    if unused:
        die("بنود ما يقرأها النموذج: " + "، ".join(f"{s}/{k}" for s, k in unused))


validate()
validate()
UNC = [f"{s}/{k}" for (s, k), (_, u) in D.items() if not u and s != "ref"]
print("# مخرجات نموذج «إدارة المطعم» (ريال، الأسعار المعلنة بدون ضريبة، المشتريات بالسعر الشامل)")
print(f"كل الأرقام {U} ما عدا البنود اللي لها actual_value: {', '.join(UNC)}.")
print("الدرجة محسوبة على حدها الأعلى من الطاولات (S=15، M=30، L45، L60). «ربح س1/س2» = دفع شهري بالتزام؛ "
      "«سنوي» = 11 شهر مقدم. الحكم GO/NO-GO على ربح السنتين في أسوأ حالة (قاعدة القسم)، وربح السنة الأولى جنبه.")
print("أسوأ حالة (تعريف القسم) = السعر −20% + كل التكاليف ×1.3 + إلغاء 8% شهرياً + تحصيل باقي الالتزام 50%. "
      "ضغط = أسوأ حالة + تحويل التجربة 30% بدل 50%.")
print("«تأسيس كلي» = عتاد + عمل + مشاوير + جلب ÷ التحويل + نصيب التجارب الفاشلة + أسبوعين تشغيل مجاني. "
      "«أشهر الاسترداد» = (تأسيس كلي − رسوم التأسيس الصافية) ÷ هامش الشهر = تعادل العميل. "
      "«تعادل خط» = عدد المطاعم اللي يغطي ثابت الخط (عدة عرض 614 + Workers 21.56 × 12).")

COLS = [("price_monthly", "شهري"), ("price_annual", "سنوي"), ("setup_price", "تأسيس"),
        ("rev_y1_nominal", "إيراد س1"), ("hw", "عتاد"), ("setup_minutes", "دقائق"),
        ("labor", "عمل"), ("trips", "مشاوير"), ("cac_per_paying", "جلب/عميل"),
        ("trial_loss_per_paying", "تجارب فاشلة/عميل"), ("upfront", "تأسيس كلي"), ("support_min", "دعم د/ش"),
        ("run_month", "تكلفة الشهر"), ("month_margin", "هامش الشهر"), ("month_margin_pct", "هامش الشهر %"),
        ("months_to_recover", "أشهر الاسترداد"), ("profit_y1", "ربح س1"), ("profit_y2", "ربح س2"),
        ("margin_y1_pct", "هامش س1 %"), ("profit_y1_annual", "ربح س1 سنوي"), ("profit_2y_annual", "سنتين سنوي"),
        ("be_line_day1", "تعادل خط"), ("be_all_day1", "تعادل كل الثابت")]
ONE = ("months_to_recover", "be_line_day1", "be_all_day1")
MODES = {"base": "الحالة الأساسية", "worst": "أسوأ حالة", "stress": "ضغط (أسوأ + تحويل 30%)"}


def run(p, t, pr, mode, ov=None):
    return calc(p, t, pr, worst=mode == "worst", stress=mode == "stress", ov=ov)


def table(kind, mode):
    pr = Prices(kind)
    title = {"proposal": "أسعار fin-pricing (market.md، تجربة بتركيب كامل)",
             "rec": "الأسعار الموصى فيها (fin-modeler، تجربة بطقم متنقل)"}[kind]
    print(f"\n## {title}: {MODES[mode]} [{U}]")
    print("| الباقة/الدرجة | " + " | ".join(n for _, n in COLS) + " | الحكم |")
    print("|" + "---|" * (len(COLS) + 2))
    for p in PKGS:
        for t in TIERS:
            r = run(p, t, pr, mode)
            print(f"| {p}/{t} | " + " | ".join(fmt(r[k], 1 if k in ONE else 0) for k, _ in COLS)
                  + f" | {verdict(r)} |")


for kind, modes in (("proposal", ("base", "worst")), ("rec", ("base", "worst", "stress"))):
    for m in modes:
        table(kind, m)

print(f"\n## تكلفة التجربة اللي ما تتحول [{U}]")
print("«تركيب كامل» (market.md): نطبع ستاندات المطعم وستاندي المحل قبل الدفع، والفاشلة تخسر الورق والشرائح والشحن "
      "وكل العمل (الحوامل ترجع 80%). «طقم متنقل» (التوصية): 15 ستاند مرقّم نعيد توجيه أكوادها لكل مطعم، والفاشلة تخسر "
      "وقت المنيو والإعداد والتدريب و10% تلف الطقم. «لكل عميل يدفع» = تكلفة الفاشلة × (1 − التحويل) ÷ التحويل.")
print("| الباقة/الدرجة | تركيب كامل: للتجربة | لكل عميل (تحويل 50%) | (تحويل 30%) | طقم: للتجربة | "
      "لكل عميل (50%) | (30%) |\n|---|---|---|---|---|---|---|")
for p in PKGS:
    for t in TIERS:
        a = calc(p, t, Prices("rec", {"kit": False}))
        a3 = calc(p, t, Prices("rec", {"kit": False}), ov={"trial_conversion": 0.3})
        b = calc(p, t, Prices("rec", {"kit": True}))
        b3 = calc(p, t, Prices("rec", {"kit": True}), ov={"trial_conversion": 0.3})
        print(f"| {p}/{t} | {fmt(a['trial_fail_cost'])} | {fmt(a['trial_loss_per_paying'])} | "
              f"{fmt(a3['trial_loss_per_paying'])} | {fmt(b['trial_fail_cost'])} | {fmt(b['trial_loss_per_paying'])} | "
              f"{fmt(b3['trial_loss_per_paying'])} |")

print(f"\n## أقل سعر شهري معلن يحقق كل شرط (تأسيس والتزام وتجربة التوصية) [{U}]")
print("| الباقة/الدرجة | هامش الشهر ≥60% (أساسي) | ربح س1 ≥ 0 (أساسي) | GO سنتين (أسوأ) | ربح س1 ≥ 0 (أسوأ) | "
      "GO سنتين (ضغط) | الموصى |\n|---|---|---|---|---|---|---|")
for p in PKGS:
    for t in TIERS:
        mk = lambda x: Prices("rec", {"monthly": x})
        conds = [lambda x: run(p, t, mk(x), "base")["month_margin_pct"] >= 60,
                 lambda x: run(p, t, mk(x), "base")["profit_y1"] >= 0,
                 lambda x: run(p, t, mk(x), "worst")["profit_2y"] > 0,
                 lambda x: run(p, t, mk(x), "worst")["profit_y1"] >= 0,
                 lambda x: run(p, t, mk(x), "stress")["profit_2y"] > 0]
        print(f"| {p}/{t} | " + " | ".join(fmt(bsearch(f)) for f in conds) + f" | {fmt(Prices('rec').monthly(p, t))} |")

print(f"\n## L على 60 طاولة: أثر كل تصحيح (تراكمي) [{U}]")
print("| التصحيح | التأسيس | الشهري | التزام | التجربة | ربح س1 أساسي | ربح س1 أسوأ | سنتين أسوأ | الحكم أسوأ |"
      "\n|---|---|---|---|---|---|---|---|---|")
for p, prices in (("order", (319, 329, 469)), ("pro", (479, 499, 629))):
    base_setup = get("rec_setup_base", p, "L60")
    per = get("rec_setup_per_table", p, "L60") * max(0, 60 - get("rec_setup_free_tables", p, "L60"))
    LEV = [("market.md كما هو", dict(setup=400, monthly=prices[0], commit=3, kit=False)),
           (f"+ تأسيس {fmt(get('rec_setup_per_table', p, 'L60'))} لكل طاولة فوق "
            f"{fmt(get('rec_setup_free_tables', p, 'L60'))}", dict(setup=base_setup + per, monthly=prices[0], commit=3, kit=False)),
           ("+ التجربة بطقم متنقل", dict(setup=base_setup + per, monthly=prices[0], commit=3, kit=True)),
           ("+ التزام 6 أشهر للشهري", dict(setup=base_setup + per, monthly=prices[0], commit=6, kit=True)),
           ("+ الشهري الموصى", dict(setup=base_setup + per, monthly=Prices("rec").monthly(p, "L60"), commit=6, kit=True)),
           ("بديل بدل التأسيس: +5 ريال/طاولة فوق 30 بالشهر", dict(setup=400, monthly=prices[2], commit=3, kit=False))]
    print(f"| **{p}** | | | | | | | | |")
    for name, o in LEV:
        pr = Prices("rec", o)
        b, w = run(p, "L60", pr, "base"), run(p, "L60", pr, "worst")
        print(f"| {name} | {fmt(o['setup'])} | {fmt(o['monthly'])} | {o['commit']} | {'طقم' if o['kit'] else 'كامل'} | "
              f"{fmt(b['profit_y1'])} | {fmt(w['profit_y1'])} | {fmt(w['profit_2y'])} | {verdict(w)} |")

print(f"\n## حساسية بالأسعار الموصى فيها: ربح السنتين في أسوأ حالة لو تغيّر بند واحد [{U}]")
SENS = [("بدون تغيير", {}), ("تحويل 30%", {"trial_conversion": 0.3}), ("إلغاء 12% شهرياً", {"churn_worst": 0.12}),
        ("دعم ×2", "support"), ("استبدال الستاند ×2", {"stand_loss_rate_yr": 0.4, "paper_refresh_rate_yr": 0.5}),
        ("عمولة 3.5%", {"payment_fee_pct": 0.035}), ("التزام بدون تحصيل", {"commit_collect_worst": 0}),
        ("العميل يدفع نص الكسر", {"client_chargeback_share": 0.5}),
        ("ستيكر QR بدون شريحة (3 ريال)", {"stand_unit_incl": 3, "lamination_per_stand": 0, "holder_incl": 0})]
print("| الباقة/الدرجة | " + " | ".join(n for n, _ in SENS) + " |\n|" + "---|" * (len(SENS) + 1))
for p in PKGS:
    for t in TIERS:
        cells = []
        for _, o in SENS:
            if o == "support":
                o = {"support_min_base": get("support_min_base", p, t) * 2,
                     "support_min_per_table": get("support_min_per_table", p, t) * 2}
            cells.append(fmt(run(p, t, Prices("rec"), "worst", o)["profit_2y"]))
        print(f"| {p}/{t} | " + " | ".join(cells) + " |")

print(f"\n## الجدول النهائي: الأسعار الموصى فيها والحكم [{U}]")
print("التأسيس = rec_setup_base + rec_setup_per_table لكل طاولة فوق rec_setup_free_tables. «أقل سعر GO» = أقل شهري معلن "
      "يخلي ربح السنتين في أسوأ حالة > 0 بنفس التأسيس والالتزام والتجربة.")
print("| الباقة | الدرجة | شهري | سنوي (11 شهر) | تأسيس | التزام | هامش الشهر | ربح س1 أساسي | ربح س1 أسوأ | "
      "سنتين أسوأ | سنتين ضغط | أشهر الاسترداد | أقل سعر GO | الحكم |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
for p in PKGS:
    for t in TIERS:
        pr = Prices("rec")
        b, w, s = run(p, t, pr, "base"), run(p, t, pr, "worst"), run(p, t, pr, "stress")
        floor = bsearch(lambda x: run(p, t, Prices("rec", {"monthly": x}), "worst")["profit_2y"] > 0)
        v = verdict(w) + ("" if s["profit_2y"] > 0 else " (يسقط في الضغط)")
        print(f"| {NAMES[p]} | {t} | {fmt(b['price_monthly'])} | {fmt(b['price_annual'])} | {fmt(b['setup_price'])} | "
              f"{fmt(pr.commit(p, t))} | {fmt(b['month_margin_pct'])}% | {fmt(b['profit_y1'])} | {fmt(w['profit_y1'])} | "
              f"{fmt(w['profit_2y'])} | {fmt(s['profit_2y'])} | {fmt(b['months_to_recover'], 1)} | {fmt(floor)} | {v} |")

print(f"\n## مقارنة بالسوق (market.md، كلها من ملخصات بحث {U})")
for k, label in (("ref_menu_qr_high", "منيو QR محلي (أعلى)"), ("ref_sapaad_online", "Sapaad.Online"),
                 ("ref_marn_pro", "Marn Pro"), ("ref_foodics_starter", "Foodics Starter سنوي"),
                 ("ref_marn_enterprise", "Marn Enterprise")):
    print(f"- {label}: {fmt(ref(k))} ريال/شهر")
print(f"- جهاز نداء نادل يُشترى مرة: {fmt(ref('ref_waiter_hw_low'))}–{fmt(ref('ref_waiter_hw_high'))} ريال")
for p in ("waiter", "order", "pro"):
    print(f"- {p} (الموصى): " + "، ".join(f"{t} {fmt(Prices('rec').monthly(p, t))}" for t in ("S", "M", "L45")))
