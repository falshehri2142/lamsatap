"""فحوص المراجع (acc-auditor) على نموذج fin-modeler وقيود acc-bookkeeper — 2026-10-01.
ما يغيّر النموذج: يستورد دوال model/model.py ويقرأ نفس model/inputs.csv، ويغيّر نسخة بالذاكرة بس.
التشغيل من مجلد المستودع:
  python3 work/2026-10-01-smart-stay/full-management/audit/audit_checks.py > work/2026-10-01-smart-stay/full-management/audit/audit_checks.out.txt
كل الأسعار مقترح، غير معتمد. كل الافتراضات ومصادرها في model/inputs.csv (وأغلبها «غير مؤكد»).
"""
import contextlib, copy, io, os, sys

sys.stdout.reconfigure(encoding="utf-8")
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "model", "model.py")
P = os.path.abspath(P)


class _Sink(io.StringIO):
    def reconfigure(self, **k):
        pass


ns = {"__file__": P, "__name__": "model"}
with contextlib.redirect_stdout(_Sink()):
    exec(compile(open(P, encoding="utf-8").read(), P, "exec"), ns)
unit, portfolio, staff, g, I = ns["unit"], ns["portfolio"], ns["staff"], ns["g"], ns["I"]
ORIG = copy.deepcopy(I)


def reset():
    for k in ORIG:
        I[k] = copy.deepcopy(ORIG[k])


F20 = ("20% أو 249", 0, 0.20, 249)
F25 = ("25% أو 349", 0, 0.25, 349)
CELLS = ((250, 0.24), (250, 0.37), (350, 0.37), (350, 0.65))
TIME_KEYS = ("min_booking_msgs", "min_booking_checkin", "min_booking_cleaning", "min_unit_listing",
             "min_unit_owner_admin", "visits_per_booking", "inspections_month", "min_per_visit",
             "onboarding_hours", "unit_life_months", "los_nights", "lite_min_booking",
             "lite_min_unit_month", "lite_onboarding_hours")
RATE = g("labor_rate")


def c(a, o):
    return f"{a}×{int(round(o*100))}%"


print("# فحوص المراجع على نموذج الإدارة الكاملة (acc-auditor، 2026-10-01)")
print("المصدر: model/model.py و model/inputs.csv بدون تعديل. كل الأسعار مقترح، غير معتمد.\n")

print("## A) شرط GO لباقة «إدارة كاملة» (20% أو 249): أقصى ساعات للوحدة بالشهر قبل ما يصير الربح بعد وقته سالب")
print("worst-non-time = كل المدخلات السيئة (منصة 20%، نظافة أغلى + ضريبة، ديون 5%، تعويض 3%) بس الوقت base")
print("الخانة | base: ساعات / أقصى ساعات | worst كامل: ساعات / أقصى ساعات / ربح | worst-non-time: ساعات / أقصى ساعات / ربح")
for a, o in CELLS:
    b = unit(a, o, F20, "base")
    w = unit(a, o, F20, "worst")
    reset()
    for k in TIME_KEYS:
        I[k]["worst"] = I[k]["base"]
    wn = unit(a, o, F20, "worst")
    reset()
    print(f"{c(a,o)} | {b['hours']:.1f} / {b['cash']/RATE:.1f} | {w['hours']:.1f} / {w['cash']/RATE:.1f} / {w['econ_total']:,.0f} "
          f"| {wn['hours']:.1f} / {wn['cash']/RATE:.1f} / {wn['econ_total']:,.0f}")

print("\n## B) worst مع الروافع اللي بيدنا: سعر النظافة = عرض الشركة شامل ضريبتها × 1.5، والديون المعدومة 2% (دفع خلال 7 أيام وإيقاف الحجوزات الجديدة)")
I["cleaning_markup"]["worst"] = 1.5
I["cleaning_vendor_vat"]["worst"] = 0.0
I["bad_debt_pct"]["worst"] = 0.02
print("الخانة | 20% أو 249: ربح بعد وقته / ساعات | 25% أو 349: ربح بعد وقته")
for a, o in CELLS:
    u20 = unit(a, o, F20, "worst")
    u25 = unit(a, o, F25, "worst")
    print(f"{c(a,o)} | {u20['econ_total']:,.0f} / {u20['hours']:.1f} | {u25['econ_total']:,.0f}")
reset()

print("\n## C) باقة «حجوزات ودخول» (المالك يسعّر، والنظافة على منظفه): الربح بعد وقته base / worst / worst-non-time")
for op in (("12% أو 149", 0, 0.12, 149), ("15% أو 199", 0, 0.15, 199), ("18% أو 249", 0, 0.18, 249)):
    cells = []
    for a, o in CELLS:
        b = unit(a, o, op, "base", lite=True)
        w = unit(a, o, op, "worst", lite=True)
        for k in TIME_KEYS:
            I[k]["worst"] = I[k]["base"]
        wn = unit(a, o, op, "worst", lite=True)
        reset()
        cells.append(f"{c(a,o)}: {b['econ_total']:,.0f} / {w['econ_total']:,.0f} / {wn['econ_total']:,.0f} (رسوم {b['fee']:,.0f}، ساعات {b['hours']:.1f})")
    print(op[0] + " | " + " | ".join(cells))

print("\n## D) ربح صاحب المشروع بالشهر لـ5 و10 و20 وحدة (إدارة كاملة، صاحب المشروع 60 ساعة، والزايد مساعد بالساعة بسعر ساعة الموظف)")
loaded, prod, srate = staff()
fixed = g("fixed_platform_month") + g("pms_fixed_month")
print(f"ساعة المساعد = {srate:.1f} (راتب محمّل {loaded:,.0f} ÷ {prod:.0f} ساعة منتجة). الثابت {fixed:,.0f} بالشهر. الربح قبل الزكاة، وقبل أثر التسجيل في الضريبة، وبدون أرباح التجهيز لمرة وحدة.")
print("الحالة | الوحدات | ساعات الكل | ساعات صاحب المشروع | ساعات المساعد | ربح الشهر (مساعد بالساعة) | ربح الشهر (موظف دوام كامل) | دخل السنة الأولى للضريبة | لو سعّرنا شامل الضريبة بعد التسجيل: ينقص بالشهر | دخول أزحم يوم")
for lbl, (a, o) in (("ضعيف 250×24%", (250, 0.24)), ("السوق 250×37%", (250, 0.37)), ("الطلب 350×65%", (350, 0.65))):
    u = unit(a, o, F20)
    for N in (5, 10, 20):
        p = portfolio(N, u)
        asst = max(0.0, p["total_h"] - g("owner_hours_avail"))
        frac = N * u["total"] - fixed - p["frac_staff_cost"]
        vat_loss = N * (u["fee"] + u["clean_rev"]) * g("vat_rate") / (1 + g("vat_rate"))
        reg = ("إلزامي" if p["turnover"] >= g("vat_threshold_mandatory") else
               "اختياري" if p["turnover"] >= g("vat_threshold_voluntary") else "تحت الحد")
        print(f"{lbl} | {N} | {p['total_h']:.0f} | {p['owner_h']:.0f} | {asst:.0f} | {frac:,.0f} | {p['profit']:,.0f} "
              f"| {p['turnover']:,.0f} ({reg}) | {vat_loss:,.0f} | {p['peak']:.1f}")
print("ربح التجهيز لمرة وحدة لكل وحدة جديدة: القفل 216 + الإعلان 299 × (1 − 4.5%) = "
      f"{216 + 299*(1-unit(250,0.37,F20)['col']):,.0f}")

print("\n## E) أسوأ حالة كاملة للمحفظة (كل المدخلات worst، وصاحب المشروع 60 ساعة)")
lw, pw, rw = staff("worst")
fw = g("fixed_platform_month", "worst") + g("pms_fixed_month", "worst")
for lbl, (a, o) in (("السوق 250×37%", (250, 0.37)), ("الطلب 350×65%", (350, 0.65))):
    u = unit(a, o, F20, "worst")
    row = []
    for N in (5, 10, 20):
        tot = N * u["hours"]
        exc = max(0.0, tot - 60)
        row.append(f"{N} وحدات: ساعات {tot:.0f}، ربح {N*u['total'] - fw - exc/pw*lw:,.0f}")
    print(f"{lbl} (ساعة المساعد {rw:.1f}) | " + " | ".join(row))

print("\n## F) لو المنصة صارت «مورد حكمي» وسعر الليلة شامل الضريبة: رسومنا (20% من الصافي بدون الضريبة)")
for a, o in ((250, 0.37), (350, 0.65)):
    u = unit(a, o, F20)
    print(f"{c(a,o)}: {u['fee']:,.0f} → {max(0.20*u['net']/1.15, 249):,.0f} بالشهر للوحدة")

print("\n## G) ربح تجهيز القفل 599 (locks/prices-ksa.md: R1 198 + G2 80.99 + لوحة 19 + صندوق 40 + مشوار 30)")
cost = 198 + 80.99 + 19 + 40 + 30
print(f"التكلفة {cost:.2f} | تحويل بنكي {599-cost:.2f} | بوابة 2.5% {599*0.975-cost:.2f} | بوابة 2.5% وعليها 15% ضريبة ما تنسترد (قاعدة GM-052) {599-599*0.025*1.15-cost:.2f}")

print("\n## H) قيود acc-bookkeeper JE-01..JE-16 (الهيكل 2، 3 وحدات)")
JE = [("JE-01", [("1120", 4056)], [("2500-01", 4056)]),
      ("JE-02", [("1120", 1200)], [("2520", 900), ("2510", 300)]),
      ("JE-03", [("2520", 900)], [("2500-01", 900)]),
      ("JE-04", [("2510", 300)], [("1120", 300)]),
      ("JE-05", [("1120", 3570)], [("2500-02", 3570)]),
      ("JE-06", [("2500-02", 180)], [("1120", 180)]),
      ("JE-07", [("1120", 3502.5)], [("2500-03", 3502.5)]),
      ("JE-08", [("2500-03", 250)], [("1120", 250)]),
      ("JE-09", [("1120", 250)], [("2500-03", 250)]),
      ("JE-10", [("5650", 1671.96)], [("2100", 1671.96)]),
      ("JE-11", [("1200", 4007.85)], [("4710", 297), ("4700", 1202.85), ("4720", 2508)]),
      ("JE-12", [("1230", 59.5)], [("4700", 59.5)]),
      ("JE-13", [("2500-01", 1489.6), ("2500-02", 1172), ("2500-03", 1346.25)], [("1200", 4007.85)]),
      ("JE-14", [("1110", 4007.85)], [("1120", 4007.85)]),
      ("JE-15", [("2500-01", 3466.4), ("2500-02", 2218), ("2500-03", 2156.25)], [("1120", 7840.65)]),
      ("JE-16", [("2100", 1671.96)], [("1110", 1671.96)])]
bal, snap, bad = {}, None, []
for n, d, cr in JE:
    if round(sum(x for _, x in d), 2) != round(sum(x for _, x in cr), 2):
        bad.append(n)
    for a_, x in d:
        bal[a_] = round(bal.get(a_, 0) + x, 2)
    for a_, x in cr:
        bal[a_] = round(bal.get(a_, 0) - x, 2)
    if n == "JE-14":
        snap = dict(bal)
print("كل قيد متوازن" if not bad else "قيود غير متوازنة: " + "، ".join(bad))
owners = -(snap["2500-01"] + snap["2500-02"] + snap["2500-03"])
print(f"يوم 30: بنك الأمانات 1120 = {snap['1120']:,.2f} | مجموع 2500 = {owners:,.2f} | 2510 = {snap.get('2510', 0):,.2f} | 2520 = {snap.get('2520', 0):,.2f}")
print(f"المطابقة الثلاثية بدون خصم 1210: {'سليمة' if abs(snap['1120'] - owners - (-snap.get('2510',0)) - (-snap.get('2520',0))) < 0.005 else 'فيها فرق'}")
rev = -(bal["4700"] + bal["4710"] + bal["4720"])
print(f"الإيراد {rev:,.2f} (4700 {-bal['4700']:,.2f} + 4710 {-bal['4710']:,.2f} + 4720 {-bal['4720']:,.2f}) | تكلفة النظافة {bal['5650']:,.2f} | المساهمة {rev - bal['5650']:,.2f}")
print(f"الفرق بين الفواتير 4,007.85 والإيراد {rev:,.2f} = {rev-4007.85:,.2f} (عمولة مستحقة 1230)")

print("\n## I) أقل إشغال يخلي «إدارة كاملة» (20% أو 249) GO في أسوأ حالة مع الروافع (نفس B)")
I["cleaning_markup"]["worst"] = 1.5
I["cleaning_vendor_vat"]["worst"] = 0.0
I["bad_debt_pct"]["worst"] = 0.02
for adr in (250, 300, 350):
    lo, hi = 0.05, 0.90
    for _ in range(60):
        m = (lo + hi) / 2
        if unit(adr, m, F20, "worst")["econ_total"] < 0:
            lo = m
        else:
            hi = m
    print(f"الليلة {adr}: الإشغال لازم يكون {hi*100:.1f}% فأكثر")
reset()

print("\n## J) أمانات الملاك آخر الشهر (الهيكل 2) لو الضيف يدفع رسوم النظافة في الإعلان (تصحيح على model §13)")
for a, o in ((250, 0.37), (350, 0.65)):
    u = unit(a, o, F20)
    print(f"{c(a,o)}: model §13 = {u['owner_net']:,.0f} | مع رسوم النظافة اللي يدفعها الضيف = {u['owner_net'] + u['clean_rev']:,.0f} للوحدة "
          f"| 10 وحدات = {10*(u['owner_net'] + u['clean_rev']):,.0f}")
