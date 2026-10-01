"""نموذج الإدارة الكاملة للوحدات (لمسة تاب) — fin-modeler 2026-10-01. بايثون بدون مكتبات خارجية.
التشغيل:
  python3 work/2026-10-01-smart-stay/full-management/model/model.py > work/2026-10-01-smart-stay/full-management/model/output.txt
المدخلات ومصادرها: inputs.csv (best / base / worst). worst = الأسوأ لنا (وقت أكثر، تكلفة أعلى، إقامة أقصر).
كل الأسعار مقترحة وغير معتمدة، وقبل الضريبة (الشركة غير مسجلة في الضريبة).
المحاسبة: إحنا «وكيل» في الإيجار (إيرادنا الرسوم بس، IFRS for SMEs القسم 23)، و«أصيل» في النظافة والتجهيز.
GBV (مبلغ الحجز كامل) مؤشر إداري بس، مو إيراد.
"""
import csv, math, os, sys

sys.stdout.reconfigure(encoding="utf-8")
H = os.path.dirname(os.path.abspath(__file__))
CASES = ("best", "base", "worst")

# ---- شبكة السيناريوهات (من طلب المهمة) + الإشغال الفعلي في السوق ----
ADRS = (250, 350, 450)                  # سعر الليلة (ريال، قبل الضريبة، بدون رسوم النظافة)
OCCS = (0.50, 0.65, 0.80)               # طلب المهمة
OCC_MKT = (0.24, 0.37)                  # AirROI الوسيط 24% / airbtics 37% (جدة، مقتطفات بحث، غير مؤكد)
COMMS = (0.15, 0.20, 0.25)
BASE_CELL = (350, 0.65)
MKT_CELL = (250, 0.37)
# خيار الرسوم: (الاسم، ثابت، نسبة، حد أدنى) → الرسوم = max(ثابت + نسبة × الأساس، الحد الأدنى)
OPT_COMM = [(f"{int(c*100)}%", 0, c, 0) for c in COMMS]
OPT_FIXED = [("ثابت 99", 99, 0, 0), ("ثابت 149", 149, 0, 0)]
OPT_OTHER = [("99+10%", 99, 0.10, 0),                 # خيار (ج) عند acc-bookkeeper
             ("12% أو 149", 0, 0.12, 149),             # مقترحات fin-pricing (الأعلى من النسبة أو الحد الأدنى)
             ("20% أو 249", 0, 0.20, 249),
             ("25% أو 349", 0, 0.25, 349)]
ALL_OPTS = OPT_COMM + OPT_FIXED + OPT_OTHER
PORTFOLIO_N = (1, 3, 5, 8, 10, 15, 20, 30)

RATIO_KEYS = {"platform_fee_pct", "cleaning_vendor_vat", "payment_fee_pct", "bad_debt_pct",
              "compensation_pct", "gosi_employer_pct", "staff_productive_share", "peak_day_share",
              "vat_rate", "zakat_rate"}
NONZERO_KEYS = {"days_month", "los_nights", "cleaning_markup", "unit_life_months",
                "staff_hours_month", "staff_productive_share", "labor_rate"}
REQUIRED = ["days_month", "los_nights", "platform_fee_pct", "cleaning_price_small", "cleaning_price_large",
            "cleaning_large_adr_min", "cleaning_markup", "cleaning_vendor_vat", "payment_fee_pct",
            "bad_debt_pct", "compensation_pct", "min_booking_msgs", "min_booking_checkin",
            "min_booking_cleaning", "min_unit_listing", "min_unit_owner_admin", "min_unit_trust_extra",
            "visits_per_booking", "inspections_month", "min_per_visit", "transport_per_visit",
            "onboarding_hours", "unit_life_months", "tech_unit_month", "pms_unit_month", "pms_fixed_month",
            "fixed_platform_month", "labor_rate", "owner_hours_avail", "staff_salary", "gosi_employer_pct",
            "staff_other_month", "staff_hours_month", "staff_productive_share", "peak_day_share",
            "setup_fee", "setup_profit", "listing_fee", "vat_rate", "vat_threshold_voluntary",
            "vat_threshold_mandatory", "zakat_rate", "install_hours", "lite_min_booking",
            "lite_min_unit_month", "lite_onboarding_hours"]


def die(msg):
    sys.stderr.write("خطأ في inputs.csv: " + msg + "\n")
    sys.exit(1)


def load():
    I = {}
    with open(os.path.join(H, "inputs.csv"), encoding="utf-8") as f:
        rd = csv.DictReader(f)
        need = {"key", "best", "base", "worst", "unit", "source"}
        if not rd.fieldnames or set(rd.fieldnames) != need:
            die(f"الأعمدة لازم تكون {sorted(need)}، ولقيت {rd.fieldnames}")
        for n, r in enumerate(rd, start=2):
            if None in r:
                die(f"سطر {n}: أعمدة زيادة (فاصلة إنجليزية داخل المصدر؟)")
            k = (r["key"] or "").strip()
            if not k:
                die(f"سطر {n}: المفتاح فاضي")
            if k in I:
                die(f"البند مكرر: {k}")
            if not (r["source"] or "").strip():
                die(f"البند {k} بدون مصدر")
            vals = {}
            for c in CASES:
                try:
                    v = float(r[c])
                except (TypeError, ValueError):
                    die(f"البند {k} عمود {c}: القيمة مو رقم ({r[c]!r})")
                if math.isnan(v) or math.isinf(v):
                    die(f"البند {k} عمود {c}: nan أو inf")
                if v < 0:
                    die(f"البند {k} عمود {c}: قيمة سالبة")
                if k in RATIO_KEYS and v > 1:
                    die(f"البند {k} عمود {c}: نسبة برا 0..1")
                if k in NONZERO_KEYS and v == 0:
                    die(f"البند {k} عمود {c}: صفر وهو يُقسم عليه")
                vals[c] = v
            I[k] = vals
    miss = [k for k in REQUIRED if k not in I]
    extra = [k for k in I if k not in REQUIRED]
    if miss:
        die("بنود ناقصة: " + ", ".join(miss))
    if extra:
        die("بنود ما يقرأها النموذج: " + ", ".join(extra))
    return I


I = load()


def g(k, c="base"):
    return I[k][c]


def collect_pct(c, structure):
    # الهيكل 1: المالك يسدد فاتورتنا (رسوم دفع + ديون معدومة). الهيكل 2: نخصم من فلوسه بتفويض، فما فيه.
    return g("payment_fee_pct", c) + g("bad_debt_pct", c) if structure == 1 else 0.0


def unit(adr, occ, opt, c="base", structure=1, gross=False, lite=False):
    """وحدة واحدة بالشهر. structure 1 = الفلوس تنزل في حساب المالك، 2 = نمسك فلوس الملاك.
    lite = باقة «حجوزات ودخول» عند fin-pricing: المالك يسعّر، والنظافة على منظفه (ما فيه هامش نظافة لنا)."""
    nights = occ * g("days_month", c)
    bookings = nights / g("los_nights", c)
    gbv = adr * nights
    net = gbv * (1 - g("platform_fee_pct", c))
    base_amt = gbv if gross else net
    _, fixed, pct, floor = opt
    fee = max(fixed + pct * base_amt, floor)
    cp = g("cleaning_price_large", c) if adr >= g("cleaning_large_adr_min", c) else g("cleaning_price_small", c)
    clean_rev = 0.0 if lite else bookings * cp
    clean_cost = clean_rev / g("cleaning_markup", c) * (1 + g("cleaning_vendor_vat", c))
    col = collect_pct(c, structure)
    visits = bookings * g("visits_per_booking", c) + g("inspections_month", c)
    other = (g("tech_unit_month", c) + g("pms_unit_month", c) + visits * g("transport_per_visit", c)
             + g("compensation_pct", c) * net)
    mgmt = fee - other - col * fee
    clean_m = clean_rev - clean_cost - col * clean_rev
    trust = g("min_unit_trust_extra", c) if structure == 2 else 0.0
    if lite:
        h_book = bookings * g("lite_min_booking", c) / 60
        h_fixed = (g("lite_min_unit_month", c) + trust) / 60
        h_onb = g("lite_onboarding_hours", c) / g("unit_life_months", c)
        retained = h_fixed
    else:
        h_book = bookings * (g("min_booking_msgs", c) + g("min_booking_checkin", c) + g("min_booking_cleaning", c)) / 60
        h_fixed = (g("min_unit_listing", c) + g("min_unit_owner_admin", c) + trust) / 60
        h_onb = g("onboarding_hours", c) / g("unit_life_months", c)
        retained = h_fixed  # التسعير وفلوس الملاك تبقى عند صاحب المشروع
    h_visit = visits * g("min_per_visit", c) / 60
    hours = h_book + h_visit + h_fixed + h_onb
    rate = g("labor_rate", c)
    return dict(nights=nights, bookings=bookings, gbv=gbv, net=net, fee=fee, other=other, col=col,
                clean_rev=clean_rev, clean_cost=clean_cost, clean_m=clean_m, visits=visits,
                mgmt=mgmt, total=mgmt + clean_m, hours=hours, h_book=h_book, h_visit=h_visit,
                h_fixed=h_fixed, h_onb=h_onb, retained=retained,
                econ_mgmt=mgmt - hours * rate, econ_total=mgmt + clean_m - hours * rate,
                per_hour=(mgmt + clean_m) / hours, per_hour_mgmt=mgmt / hours, cash=mgmt + clean_m,
                owner_net=net - fee - clean_rev)


def staff(c="base"):
    loaded = g("staff_salary", c) * (1 + g("gosi_employer_pct", c)) + g("staff_other_month", c)
    prod = g("staff_hours_month", c) * g("staff_productive_share", c)
    return loaded, prod, loaded / prod


def req_fee(u, c="base", margin=0.0, hourly=None):
    """أقل رسوم شهرية تغطي التكاليف ووقت التشغيل (بدون هامش النظافة)."""
    hourly = g("labor_rate", c) if hourly is None else hourly
    d = 1 - u["col"] - margin
    return (u["other"] + u["hours"] * hourly) / d if d > 0 else float("inf")


def portfolio(N, u, c="base"):
    total_h = N * u["hours"]
    A = g("owner_hours_avail", c)
    loaded, prod, _ = staff(c)
    excess = max(0.0, total_h - A)
    n_staff = math.ceil(excess / prod - 1e-9) if excess > 0 else 0
    fixed = g("fixed_platform_month", c) + g("pms_fixed_month", c)
    profit = N * u["total"] - fixed - n_staff * loaded
    turnover_y1 = 12 * N * (u["fee"] + u["clean_rev"]) + N * (g("setup_fee", c) + g("listing_fee", c))
    peak = N * u["bookings"] * 12 / 52 * g("peak_day_share", c)
    return dict(total_h=total_h, owner_h=min(total_h, A), n_staff=n_staff, profit=profit,
                turnover=turnover_y1, peak=peak, overload=N * u["retained"] > A,
                frac_staff_cost=excess / prod * loaded)


def f0(x):
    return f"{x:,.0f}"


def pct(x):
    return f"{x*100:.1f}%"


def occ_rows():
    return [(a, o) for a in ADRS for o in OCC_MKT + OCCS]


print("# نموذج الإدارة الكاملة للوحدات — لمسة تاب (fin-modeler، 2026-10-01)")
print("كل الأسعار مقترح، غير معتمد. قبل الضريبة. كل الافتراضات في inputs.csv ومعها المصدر أو «غير مؤكد».")
print("الإشغال 24% و37% = السوق الفعلي في جدة (مقتطفات بحث). 50/65/80% = طلب المهمة، وهي أعلى من متوسط السوق.")
print("الهيكل 1 (الأساس): فلوس المنصة تنزل في حساب المالك، وإحنا نفوتر رسومنا كل شهر.")
print("«مساهمة» = رسومنا − تكاليفنا المتغيرة، قبل الثابت وقبل وقت صاحب المشروع.")
print("«ربح اقتصادي» = المساهمة − الساعات × 25 (قيمة ساعة صاحب المشروع، قرار 2026-09-27).")
print("كل الساعات محسوبة على الإدارة (حتى تنسيق النظافة)، فهامش النظافة ربح فوقها.")

# ---------------------------------------------------------------- 1
print("\n## 1) تشغيل الوحدة بالشهر (base، الإقامة %.1f ليلة، عمولة المنصة %s)" % (g("los_nights"), pct(g("platform_fee_pct"))))
print("الليلة | الإشغال | ليالي | حجوزات | GBV (مؤشر) | صافي الإيجار | زيارات | ساعات (حجوزات+زيارات+ثابت+تجهيز) | هامش النظافة")
for a, o in occ_rows():
    u = unit(a, o, OPT_COMM[1])
    print(f"{a} | {int(o*100)}% | {u['nights']:.1f} | {u['bookings']:.1f} | {f0(u['gbv'])} | {f0(u['net'])} | "
          f"{u['visits']:.2f} | {u['hours']:.1f} ({u['h_book']:.1f}+{u['h_visit']:.1f}+{u['h_fixed']:.1f}+{u['h_onb']:.1f}) | {f0(u['clean_m'])}")

# ---------------------------------------------------------------- 2
def grid(title, key, c="base", opts=ALL_OPTS):
    print(f"\n{title}")
    print("الليلة | الإشغال | " + " | ".join(o[0] for o in opts))
    for a, o in occ_rows():
        print(f"{a} | {int(o*100)}% | " + " | ".join(f0(unit(a, o, op, c)[key]) for op in opts))

grid("## 2) رسومنا للوحدة بالشهر (base)", "fee")
grid("## 3) مساهمة الإدارة بالشهر، بدون النظافة (base)", "mgmt")
grid("## 4) الربح الاقتصادي بعد وقت صاحب المشروع، بدون النظافة (base)", "econ_mgmt")
grid("## 5) الربح الاقتصادي مع هامش النظافة (base) = ربح الوحدة بالشهر بعد وقته", "econ_total")
print("\n## 6) كم يطلع لصاحب المشروع عن كل ساعة (المساهمة مع النظافة ÷ الساعات، base)")
print("الليلة | الإشغال | ساعات | " + " | ".join(o[0] for o in ALL_OPTS))
for a, o in occ_rows():
    us = [unit(a, o, op) for op in ALL_OPTS]
    print(f"{a} | {int(o*100)}% | {us[0]['hours']:.1f} | " + " | ".join(f0(u['per_hour']) for u in us))

# ---------------------------------------------------------------- 7
loaded, prod, staff_hr = staff()
print("\n## 7) أقل رسوم شهرية للإدارة الكاملة (بدون الاعتماد على هامش النظافة، base)")
print(f"ساعة الموظف الفعلية = {f0(loaded)} ÷ {prod:.0f} ساعة منتجة = {staff_hr:.1f} ريال (مقابل 25 لساعة صاحب المشروع)")
print("الليلة | الإشغال | تعادل بساعة 25 | نفسها كنسبة من الصافي | هامش 30% بساعة 25 | تعادل بساعة الموظف | نفسها كنسبة")
for a, o in occ_rows():
    u = unit(a, o, OPT_COMM[1])
    r0, r30, rs = req_fee(u), req_fee(u, margin=0.30), req_fee(u, hourly=staff_hr)
    print(f"{a} | {int(o*100)}% | {f0(r0)} | {pct(r0/u['net'])} | {f0(r30)} | {f0(rs)} | {pct(rs/u['net'])}")

# ---------------------------------------------------------------- 8
print("\n## 8) أسوأ حالة (كل المدخلات worst: إقامة 2 ليلة، منصة 20%، وقت أعلى، نظافة أغلى) — الربح الاقتصادي مع النظافة")
print("الحكم: GO لو ≥ 0 في أسوأ حالة (قاعدة السكيل). الخانة تعرض «مع النظافة / بدونها».")
print("الليلة | الإشغال | ساعات | " + " | ".join(o[0] for o in ALL_OPTS))
nogo = {}
for a, o in occ_rows():
    us = [unit(a, o, op, "worst") for op in ALL_OPTS]
    cells = []
    for op, u in zip(ALL_OPTS, us):
        cells.append(f"{f0(u['econ_total'])}/{f0(u['econ_mgmt'])}")
        if u["econ_total"] < 0:
            nogo.setdefault(op[0], []).append(f"{a}×{int(o*100)}%")
    print(f"{a} | {int(o*100)}% | {us[0]['hours']:.1f} | " + " | ".join(cells))
print("\nالرافعة: أقل رسوم شهرية تعادل وقته (25) في أسوأ حالة، بدون هامش النظافة — ومعه — ونسبتها من الصافي، والنقد قبل وقته بعمولة 20%")
print("الليلة | الإشغال | تعادل بدون النظافة / نسبته | تعادل مع النظافة / نسبته | نقد 20% قبل وقته | ريال للساعة بـ20%")
for a, o in occ_rows():
    u = unit(a, o, OPT_COMM[1], "worst")
    r = req_fee(u, "worst")
    r_c = max(0.0, r - u["clean_m"] / (1 - u["col"]))
    print(f"{a} | {int(o*100)}% | {f0(r)} / {pct(r/u['net'])} | {f0(r_c)} / {pct(r_c/u['net'])} | {f0(u['cash'])} | {f0(u['per_hour'])}")
print("NO-GO (ربح أسوأ حالة مع النظافة بالسالب):")
for op in ALL_OPTS:
    bad = nogo.get(op[0], [])
    print(f"  {op[0]}: " + ("GO في كل الخانات" if not bad else f"سالب في {len(bad)} من {len(occ_rows())}: " + "، ".join(bad)))

# ---------------------------------------------------------------- 9
print("\n## 9) الحساسية في الخانة الأساسية (الليلة %d، الإشغال %d%%، عمولة 20%% من الصافي)" % (BASE_CELL[0], BASE_CELL[1]*100))
ub = unit(*BASE_CELL, OPT_COMM[1])
print(f"الأساس: رسوم {f0(ub['fee'])} | مساهمة الإدارة {f0(ub['mgmt'])} | النظافة {f0(ub['clean_m'])} | ساعات {ub['hours']:.1f} | ربح اقتصادي {f0(ub['econ_total'])}")
ug = unit(*BASE_CELL, OPT_COMM[1], gross=True)
print(f"العمولة على الإجمالي بدل الصافي: رسوم {f0(ug['fee'])} (+{f0(ug['fee']-ub['fee'])})، والمالك يدفع عمولة على عمولة المنصة")
for k in ("los_nights", "platform_fee_pct", "min_booking_msgs", "visits_per_booking", "min_per_visit",
          "cleaning_markup", "cleaning_vendor_vat", "pms_unit_month", "compensation_pct", "bad_debt_pct"):
    keep = I[k]["base"]
    for c in ("best", "worst"):
        I[k]["base"] = I[k][c]
        u = unit(*BASE_CELL, OPT_COMM[1])
        print(f"  {k} = {I[k][c]:g} ({c}): ساعات {u['hours']:.1f} | ربح اقتصادي {f0(u['econ_total'])} ({u['econ_total']-ub['econ_total']:+,.0f})")
    I[k]["base"] = keep

# ---------------------------------------------------------------- 10
print("\n## 10) سنة كاملة للوحدة (السنة الأولى، base، عمولة 20% أو 249)")
for a, o in (MKT_CELL, BASE_CELL):
    u = unit(a, o, OPT_OTHER[2])
    col = u["col"]
    y_setup = g("setup_profit") + g("listing_fee") * (1 - col)
    y_cash = 12 * u["total"] + y_setup
    print(f"الليلة {a}، الإشغال {int(o*100)}%: GBV للمالك {f0(12*u['gbv'])} (مؤشر) | إيرادنا {f0(12*(u['fee']+u['clean_rev'])+g('setup_fee')+g('listing_fee'))} "
          f"| ربح نقدي {f0(y_cash)} (منها تجهيز القفل {f0(g('setup_profit'))} والإعلان {f0(g('listing_fee')*(1-col))}) "
          f"| ساعات {12*u['hours']+g('install_hours'):.0f} (منها تركيب القفل {g('install_hours'):g}) "
          f"| بعد وقته {f0(y_cash-(12*u['hours']+g('install_hours'))*g('labor_rate'))} | صافي المالك بعد المنصة ورسومنا والنظافة {f0(12*u['owner_net'])}")

# ---------------------------------------------------------------- 11
print("\n## 11) السعة: كم وحدة يقدر صاحب المشروع يشغّل بنفسه، ومتى يحتاج موظف")
print(f"الموظف (سعودي، دوام كامل): راتب {f0(g('staff_salary'))} + تأمينات {pct(g('gosi_employer_pct'))} + {f0(g('staff_other_month'))} = {f0(loaded)} بالشهر، "
      f"و{prod:.0f} ساعة منتجة ({g('staff_hours_month'):.0f} × {pct(g('staff_productive_share'))})")
print("الحالة | ساعات/وحدة | وحدات لصاحب المشروع بـ30 / 60 / 120 ساعة | وحدات للموظف الواحد | وحدات تغطي راتب الموظف (+الثابت) | وحدات لما الزايد عن وقته = 80% من دوام كامل")
for label, (a, o), op in (("السوق 250×37% (20% أو 249)", MKT_CELL, OPT_OTHER[2]),
                          ("طلب المهمة 350×65% (20%)", BASE_CELL, OPT_COMM[1]),
                          ("350×80% (20%)", (350, 0.80), OPT_COMM[1]),
                          ("أسوأ حالة 350×65% (20%)", BASE_CELL, OPT_COMM[1])):
    c = "worst" if "أسوأ" in label else "base"
    u = unit(a, o, op, c)
    ld, pr, _ = staff(c)
    caps = " / ".join(f"{h/u['hours']:.1f}" for h in (30, 60, 120))
    per_staff = pr / max(u["hours"] - u["retained"], 1e-9)
    fixed = g("fixed_platform_month", c) + g("pms_fixed_month", c)
    be_staff = (ld + fixed) / u["total"] if u["total"] > 0 else float("inf")
    ft_point = (g("owner_hours_avail", c) + 0.8 * pr) / u["hours"]
    print(f"{label} | {u['hours']:.1f} | {caps} | {per_staff:.1f} | {be_staff:.1f} | {ft_point:.1f}")

for label, (a, o), op in (("السوق 250×37%، 20% أو 249", MKT_CELL, OPT_OTHER[2]),
                          ("طلب المهمة 350×65%، 20%", BASE_CELL, OPT_COMM[1])):
    u = unit(a, o, op)
    fixed = g("fixed_platform_month") + g("pms_fixed_month")
    print(f"\nمحفظة: {label} (صاحب المشروع {g('owner_hours_avail'):.0f} ساعة بالشهر، والثابت {f0(fixed)} = n8n وواتساب + PMS)")
    print(f"التعادل على الثابت: {fixed/u['total']:.1f} وحدة")
    print("وحدات | ساعات الكل | ساعات صاحب المشروع | موظفين (دوام كامل) | ربح الشهر بعد الثابت والرواتب | ريال لكل ساعة من وقته | بديل: ساعات بالقطعة بنفس سعر الموظف | دخل السنة الأولى (حد الضريبة) | دخول أزحم يوم")
    for N in PORTFOLIO_N:
        p = portfolio(N, u)
        frac_profit = N * u["total"] - fixed - p["frac_staff_cost"]
        reg = ("إلزامي" if p["turnover"] >= g("vat_threshold_mandatory") else
               "اختياري" if p["turnover"] >= g("vat_threshold_voluntary") else "تحت الحد")
        warn = " (صاحب المشروع ما يلحق حتى على الإدارة والفلوس)" if p["overload"] else ""
        print(f"{N} | {p['total_h']:.0f} | {p['owner_h']:.0f} | {p['n_staff']} | {f0(p['profit'])} | "
              f"{f0(p['profit']/p['owner_h']) if p['owner_h'] else '-'} | {f0(frac_profit)} | {f0(p['turnover'])} ({reg}) | {p['peak']:.1f}{warn}")

# ---------------------------------------------------------------- 12
print("\n## 12) ضريبة القيمة المضافة: كم وحدة توصلنا حد التسجيل (السنة الأولى، عمولة 20% أو 249، base)")
print("وكيل = رسومنا + النظافة + التجهيز. وكيل بدون نظافة = لو الشركة تفوتر المالك مباشرة. أصيل = لو انحسب مبلغ الحجز كامل علينا (إعلان باسمنا، أو ضمان دخل، أو خلط فلوس الملاك).")
print("الليلة | الإشغال | وكيل: دخل الوحدة / وحدات لـ187,500 / لـ375,000 | وكيل بدون نظافة: لـ375,000 | أصيل: دخل الوحدة / لـ375,000")
for a, o in occ_rows():
    u = unit(a, o, OPT_OTHER[2])
    one = g("setup_fee") + g("listing_fee")
    ag = 12 * (u["fee"] + u["clean_rev"]) + one
    ag_nc = 12 * u["fee"] + one
    pr_ = 12 * (u["gbv"] + u["clean_rev"]) + one
    vv, vm = g("vat_threshold_voluntary"), g("vat_threshold_mandatory")
    print(f"{a} | {int(o*100)}% | {f0(ag)} / {vv/ag:.1f} / {vm/ag:.1f} | {vm/ag_nc:.1f} | {f0(pr_)} / {vm/pr_:.1f}")

u = unit(*BASE_CELL, OPT_COMM[1])
vr = g("vat_rate")
rev = u["fee"] + u["clean_rev"]
lost = rev * vr / (1 + vr)
print(f"\nبعد التسجيل (الخانة {BASE_CELL[0]}×{int(BASE_CELL[1]*100)}%، 20%):")
print(f"  (أ) نسعّر شامل الضريبة: ينقص دخلنا {f0(lost)} بالشهر للوحدة (15/115 من {f0(rev)})، فالمساهمة مع النظافة {f0(u['total'])} → {f0(u['total']-lost)}. "
      f"ونسترد ضريبة شركة النظافة لو كانت مسجلة.")
print(f"  (ب) نضيف الضريبة فوق السعر: دخلنا ما يتغير، والمالك الفرد ما يستردها، فعمولته الفعلية {pct(0.20*(1+vr))} بدل 20%، والنظافة {f0(179*(1+vr))} بدل 179.")
print(f"  لو صرنا أصيل ومسجلين وسعر الضيف شامل: ضريبة الإقامة {f0(u['gbv']*vr/(1+vr))} بالشهر للوحدة، يعني {pct(u['gbv']*vr/(1+vr)/u['fee'])} من رسومنا كلها.")

# ---------------------------------------------------------------- 13
print("\n## 13) مسك فلوس الملاك (الهيكل 2) مقابل الهيكل 1 (base، 20%)")
for a, o in (MKT_CELL, BASE_CELL):
    u1 = unit(a, o, OPT_COMM[1], structure=1)
    u2 = unit(a, o, OPT_COMM[1], structure=2)
    print(f"الليلة {a}، {int(o*100)}%: ساعات {u1['hours']:.1f} → {u2['hours']:.1f} | ربح اقتصادي {f0(u1['econ_total'])} → {f0(u2['econ_total'])} "
          f"| فلوس المالك عندنا آخر الشهر قبل التحويل ≈ {f0(u2['owner_net'])} للوحدة")
    print("   " + " | ".join(f"{N} وحدات: {f0(N*u2['owner_net'])} أمانة (التزام مو إيراد)" for N in (5, 10, 20)))
print("   الهيكل 2 يوفّر رسوم الدفع والديون المعدومة، بس يزيد الوقت، ويخلي الأمانة نقد مقيد في حساب منفصل، ولو انخلطت ممكن تنحسب إيراد (البند 12: أصيل).")

# ---------------------------------------------------------------- 14
print("\n## 14) زكاة تقديرية (تبسيط: 2.5% من صافي الربح السنوي كحد أدنى للوعاء، غير مؤكد — الوعاء الحقيقي يحسبه المحاسب)")
for N in (5, 10):
    for label, (a, o), op in (("السوق 250×37%", MKT_CELL, OPT_OTHER[2]), ("350×65%", BASE_CELL, OPT_COMM[1])):
        p = portfolio(N, unit(a, o, op))
        print(f"  {N} وحدات، {label}: ربح السنة {f0(12*p['profit'])} → زكاة تقريبية {f0(max(0.0, 12*p['profit'])*g('zakat_rate'))}"
              + (" (خسارة: ما فيه وعاء ربح، والوعاء من حقوق الملكية يحسبه المحاسب)" if p['profit'] < 0 else ""))

# ---------------------------------------------------------------- 15
print("\n## 15) باقة «حجوزات ودخول» عند fin-pricing (12% أو 149) بنطاقها الأقل: المالك يسعّر، والنظافة على منظفه")
print("الربح الاقتصادي بعد وقته (base / worst) | الساعات (base)")
print("الليلة | الإشغال | ساعات | 12% أو 149 | ثابت 99 | ثابت 149 | أقل رسوم تعادل (base) / نسبتها")
lite_opts = (OPT_OTHER[1], OPT_FIXED[0], OPT_FIXED[1])
for a, o in occ_rows():
    ub_ = [unit(a, o, op, "base", lite=True) for op in lite_opts]
    uw_ = [unit(a, o, op, "worst", lite=True) for op in lite_opts]
    r = req_fee(ub_[0])
    print(f"{a} | {int(o*100)}% | {ub_[0]['hours']:.1f} | " + " | ".join(f"{f0(b['econ_total'])} / {f0(w['econ_total'])}" for b, w in zip(ub_, uw_))
          + f" | {f0(r)} / {pct(r/ub_[0]['net'])}")
