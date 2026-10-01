"""تكلفة الكوالين الذكية كاملة في السعودية وربح التركيب (لمسة تاب، دخول ذكي). stdlib فقط.
التشغيل:
  python3 work/2026-10-01-smart-stay/locks/landed_cost.py > work/2026-10-01-smart-stay/locks/landed_cost.out.txt
المدخلات:
  locks/prices.json  : صفوف الأسعار (رابط + تاريخ + الضريبة) + الخيارات + الافتراضات
  cost/inputs.csv    : مصاريف الاشتراك الشهرية ونسبة العطل ورسوم الدفع (نفس نموذج التكلفة)
القاعدة: نختار أرخص سعر سعودي «مؤكد». لو ما فيه مؤكد، نختار أرخص غير مؤكد ونكتب «غير مؤكد».
أي بند ناقص أو سعر غلط يوقف التشغيل برسالة فيها اسم البند (مقصود)."""
import csv, json, math, os, sys

sys.stdout.reconfigure(encoding="utf-8")
H = os.path.dirname(os.path.abspath(__file__))
SC = ("low", "base", "high")


def die(msg):
    sys.exit("خطأ: " + msg)


# ---------- قراءة وفحص المدخلات ----------
try:
    P = json.load(open(os.path.join(H, "prices.json"), encoding="utf-8"))
except Exception as e:  # noqa: BLE001
    die(f"prices.json ما انقرا: {e}")

ROWS = {}
for r in P.get("rows", []):
    rid = r.get("id")
    if not rid:
        die("صف بدون id في prices.json")
    if rid in ROWS:
        die(f"صف مكرر: {rid}")
    pr = r.get("priceSAR")
    if not isinstance(pr, (int, float)) or isinstance(pr, bool) or math.isnan(pr) or pr < 0:
        die(f"سعر غلط في الصف {rid}")
    if not r.get("url"):
        die(f"الصف {rid} بدون رابط مصدر")
    ROWS[rid] = r

CI = {}
ci_path = os.path.join(H, "..", "cost", "inputs.csv")
try:
    for r in csv.DictReader(open(ci_path, encoding="utf-8")):
        try:
            CI[r["key"]] = {c: float(r[c]) for c in SC}
        except ValueError:
            die(f"قيمة مو رقم في cost/inputs.csv: {r['key']}")
except FileNotFoundError:
    die("cost/inputs.csv مو موجود")
for k in ("hosting_unit", "wa_msg_cost", "wa_msgs_unit_month", "sms_cost", "sms_msgs_unit_month",
          "support_min_unit_month", "labor_rate", "battery_unit_year", "payment_fee_pct",
          "failure_rate_year", "nfc_sign", "install_transport"):
    if k not in CI:
        die(f"بند ناقص في cost/inputs.csv: {k}")
    if any(math.isnan(v) or v < 0 for v in CI[k].values()):
        die(f"قيمة سالبة أو nan في cost/inputs.csv: {k}")
for k in ("payment_fee_pct", "failure_rate_year"):
    if any(not 0 <= v <= 1 for v in CI[k].values()):
        die(f"نسبة برا 0..1 في cost/inputs.csv: {k}")


def ci(k, c="base"):
    return CI[k][c]


A = P.get("assumptions") or die("assumptions ناقصة في prices.json")
for k in ("fx_usd_sar", "extras", "setup_prices", "monthly_prices", "owner_hours_per_install",
          "lock_fob_qty_premium", "weight_kg", "freight_usd_per_kg", "duty_rate", "import_vat",
          "retail_vat_if_excluded", "warranty_retail_months"):
    if k not in A:
        die(f"افتراض ناقص في prices.json: {k}")

FX = A["fx_usd_sar"]["value"]
EX = {k: v["value"] for k, v in A["extras"].items()}
for k in ("nfc_sign", "key_box", "transport"):
    if k not in EX:
        die(f"إضافة ناقصة في extras: {k}")
EXTRAS = sum(EX.values())                                                  # 19 + 40 + 30
EXTRAS_HIGH = ci("nfc_sign", "high") + EX["key_box"] + ci("install_transport", "high")
FEE, FEE_H = ci("payment_fee_pct"), ci("payment_fee_pct", "high")
SETUPS, MONTHLY = A["setup_prices"], A["monthly_prices"]
HOURS = A["owner_hours_per_install"]["value"]
VAT_IMP = A["import_vat"]["value"]
VAT_RET = A["retail_vat_if_excluded"]["value"]
TRIP = EX["transport"]
TARGET = 200  # ربح التركيب المستهدف في pricing-owner-install.md (حوالي 200 للوحدة)
EXCL = {e["id"] for e in P.get("excluded", [])}
for e in EXCL:
    if e not in ROWS:
        die(f"صف مستبعد مو موجود: {e}")


# ---------- الحساب ----------
def pick(ids, role, okey):
    for i in ids:
        if i not in ROWS:
            die(f"الخيار {okey} ({role}) يشير لصف مو موجود: {i}")
    pool = [ROWS[i] for i in ids if i not in EXCL and ROWS[i].get("ksa")]
    if not pool:
        die(f"الخيار {okey} ({role}) ما له سعر سعودي")
    ver = [r for r in pool if r.get("verified") is True]
    r = min(ver or pool, key=lambda x: x["priceSAR"])
    return r, ("مؤكد" if ver else "غير مؤكد")


def vat_txt(r):
    v = r.get("vatIncluded")
    return "شامل" if v is True else ("بدون" if v is False else "غير مؤكد")


def month_margin(price, c="base"):
    """مساهمة الوحدة بالشهر قبل الثابت وقبل احتياط العطل (من cost/inputs.csv)."""
    var = (ci("hosting_unit", c) + ci("wa_msg_cost", c) * ci("wa_msgs_unit_month", c)
           + ci("sms_cost", c) * ci("sms_msgs_unit_month", c)
           + ci("support_min_unit_month", c) / 60 * ci("labor_rate", c)
           + ci("battery_unit_year", c) / 12 + ci("payment_fee_pct", c) * price)
    return price - var


def option(o):
    parts = []
    for role in ("bundle", "lock", "gateway"):
        if o.get(role):
            r, st = pick(o[role], role, o["key"])
            parts.append((role, r, st))
    if not parts:
        die(f"الخيار {o['key']} بدون قطع")
    hw = sum(r["priceSAR"] for _, r, _ in parts)
    hw_w = sum(r["priceSAR"] * (1 if r.get("vatIncluded") is True else 1 + VAT_RET) for _, r, _ in parts)
    rep = sum(r["priceSAR"] for role, r, _ in parts if role in ("lock", "bundle"))
    return dict(o=o, parts=parts, hw=hw, hw_w=hw_w, cost=hw + EXTRAS, cost_w=hw_w + EXTRAS_HIGH,
                rep=rep, status="غير مؤكد" if any(st != "مؤكد" for *_, st in parts) else "مؤكد",
                missing=o.get("missing", []))


def landed(w, q, i):
    a = A
    prem = a["lock_fob_qty_premium"][str(q)][i]
    lock = w["lock_fob_usd"] * prem * FX
    gw = w["gateway_fob_usd"][str(q)] * FX
    kg = a["weight_kg"]["lock"][i] + a["weight_kg"]["gateway"][i]
    fr = kg * a["freight_usd_per_kg"][str(q)][i] * FX
    cif = lock + gw + fr
    duty = cif * a["duty_rate"]["value"][i]
    vat = (cif + duty) * VAT_IMP
    return dict(lock=lock, gw=gw, fr=fr, duty=duty, vat=vat, total=cif + duty + vat)


def f0(x):
    return "∞" if x == float("inf") else f"{x:,.0f}"


def f1(x):
    return "∞" if x == float("inf") else f"{x:,.1f}"


OPTS = [option(o) for o in P["options"]]
OBYK = {x["o"]["key"]: x for x in OPTS}
MM = {p: month_margin(p) for p in MONTHLY}
MM_H = {p: month_margin(p, "high") for p in MONTHLY}
p99, p149 = MONTHLY[0], MONTHLY[-1]

# ---------- المخرجات ----------
print("# تكلفة الكوالين الكاملة في السعودية وربح التركيب (fin-modeler)")
print(f"تاريخ الأسعار: {P['meta']['seen']}. المصدر: locks/prices.json + cost/inputs.csv.")
print("تنبيه: ولا سعر مؤكد. كل الصفحات محجوبة، والأسعار من مقتطفات البحث = «غير مؤكد».")
print("الشركة غير مسجلة في الضريبة (accountant/tax.md): الضريبة اللي ندفعها تكلفة، و549/599/649 بدون ضريبة مخرجات.")
print(f"الإضافات لكل تركيب: لوحة NFC {EX['nfc_sign']:g} + صندوق مفتاح {EX['key_box']:g} + مشوار {EX['transport']:g} = {EXTRAS:g} ريال "
      f"(أسوأ حالة {EXTRAS_HIGH:g}). رسوم الدفع {FEE*100:g}% (أسوأ {FEE_H*100:g}%).")

print("\n## 1) سعر التجزئة: أرخص سعر سعودي لكل خيار (قفل + البوابة اللازمة)")
print("| الخيار | القطعة | السعر | المتجر | الضريبة | الحالة | الرابط |")
print("|---|---|---|---|---|---|---|")
for x in OPTS:
    for role, r, st in x["parts"]:
        nm = {"lock": "قفل", "gateway": "بوابة", "bundle": "باقة"}[role]
        print(f"| {x['o']['key']} {x['o']['name']} | {nm}: {r['brand']} {r['model']} | {r['priceSAR']:,.2f} | {r['channel']} | {vat_txt(r)} | {st} | {r['url']} |")
    for m in x["missing"]:
        print(f"| {x['o']['key']} {x['o']['name']} | ناقص: {m} | ؟ | - | - | غير مؤكد | ما فيه سعر سعودي |")

print("\n## 2) تكلفة التركيب الواحد وربح صاحب المشروع (التجزئة)")
print("التكلفة = القفل + البوابة + الإضافات. الربح = سعر التجهيز × (1 − رسوم الدفع) − التكلفة. وقت صاحب المشروع ربح له، مو مصروف.")
print("أسوأ حالة = لو السعر المعروض بدون ضريبة (+15%) + لوحة 25 + مشوار 40 + رسوم دفع 3%.")
hdr = " | ".join(f"ربح {s}" for s in SETUPS)
print(f"| الخيار | العتاد | تكلفة التركيب | {hdr} | ربح 599 أسوأ حالة | ربح/ساعة عند 599 | التجهيز اللازم لربح {TARGET} | ملاحظة |")
print("|---|---|---|" + "---|" * len(SETUPS) + "---|---|---|---|")
for x in OPTS:
    pf = [s * (1 - FEE) - x["cost"] for s in SETUPS]
    pw = 599 * (1 - FEE_H) - x["cost_w"]
    note = x["status"] + (" + ناقص " + "، ".join(x["missing"]) + " (الربح أعلى من الحقيقي)" if x["missing"] else "")
    print(f"| {x['o']['key']} {x['o']['name']} | {x['hw']:,.2f} | {x['cost']:,.2f} | "
          + " | ".join(f0(v) for v in pf) + f" | {f0(pw)} | {f0((599*(1-FEE)-x['cost'])/HOURS)} | {f0((x['cost']+TARGET)/(1-FEE))} | {note} |")

print("\n## 3) الاشتراك الشهري واسترداد العتاد")
print("الهامش الشهري = السعر − (استضافة + واتساب + SMS + دعم + بطارية + رسوم دفع)، base من cost/inputs.csv، قبل الثابت (n8n) وقبل احتياط العطل.")
for p in MONTHLY:
    print(f"- {p}/شهر: هامش {MM[p]:.2f} (أسوأ {MM_H[p]:.2f})")
print("استرداد = كم شهر يرجع تكلفة التركيب من الهامش. لو التجهيز مدفوع (549 أو أكثر) العتاد يرجع من أول يوم.")
print(f"| الخيار | تكلفة التركيب | شهور لو التجهيز مجاني ({p99}) | شهور لو التجهيز مجاني ({p149}) | شهور عند 549 | الباقي على العميل عند 599 |")
print("|---|---|---|---|---|---|")
for x in OPTS:
    pb = lambda setup, p: max(0.0, x["cost"] - setup * (1 - FEE)) / MM[p]  # noqa: E731
    left = 599 * (1 - FEE) - x["cost"]
    print(f"| {x['o']['key']} | {x['cost']:,.0f} | {f1(pb(0, p99))} | {f1(pb(0, p149))} | {f1(pb(549, p99))} | "
          + ("يغطي ويزيد " + f0(left) if left >= 0 else "ناقص " + f0(-left)) + " |")

print("\n## 4) الجملة والاستيراد (علي بابا FOB + شحن جوي + جمارك + ضريبة استيراد 15%)")
print("افتراضات (كلها غير مؤكدة، مكتوبة في prices.json):")
print(f"- الدولار {FX} ريال (ربط ساما). سعر القفل في علي بابا للكمية 100-499؛ للـ10 حبات ×{A['lock_fob_qty_premium']['10']} وللـ50 ×{A['lock_fob_qty_premium']['50']} (low/base/high).")
print(f"- الوزن: قفل {A['weight_kg']['lock']} كجم + بوابة {A['weight_kg']['gateway'][1]} كجم. الشحن $/كجم: 10 حبات {A['freight_usd_per_kg']['10']}، 50 حبة {A['freight_usd_per_kg']['50']}.")
print(f"- الجمارك {A['duty_rate']['value']} (5% عادي، 15% لو القفل دخل ضمن الكهربائيات اللي ارتفعت نوفمبر 2025). الضريبة 15% على (القيمة + الشحن + الجمارك).")
print("- البوابة محسوبة حتى مع قفل M8 «WiFi»، لأن ما تأكدنا إن الواي فاي المدمج يكفي للفتح عن بعد.")
print("- ما حسبنا رسوم ثابتة للشحنة (تخليص + سابر PCoC + شهادة شحنة + مستورد مسجل): رقمها غير معروف. بدالها: «أقصى رسوم ثابتة» = التوفير للحبة × الكمية. لو الرسوم الحقيقية أكثر، الاستيراد يخسر.")
print("| الخيار | الكمية | الحالة | قفل | بوابة | شحن | جمارك | ضريبة | تكلفة الحبة واصلة | تكلفة التركيب | ربح 599 | توفير مقابل التجزئة/حبة | أقصى رسوم ثابتة للشحنة |")
print("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
WH = {}
for w in P["wholesale"]:
    for k in ("lock_row", "gateway_row"):
        if w[k] not in ROWS:
            die(f"الجملة {w['key']} تشير لصف مو موجود: {w[k]}")
    rc = OBYK.get(w["retail_compare"]) or die(f"retail_compare مو موجود: {w['retail_compare']}")
    for q in (10, 50):
        for i, c in enumerate(SC):
            L = landed(w, q, i)
            cost = L["total"] + EXTRAS
            save = rc["hw"] - L["total"]
            WH[(w["key"], q, c)] = (L, cost)
            print(f"| {w['key']} {w['name']} | {q} | {c} | {L['lock']:,.0f} | {L['gw']:,.0f} | {L['fr']:,.0f} | {L['duty']:,.0f} | {L['vat']:,.0f} | "
                  f"{L['total']:,.0f} | {cost:,.0f} | {f0(599*(1-FEE)-cost)} | {f0(save)} (مقابل {rc['o']['key']} {rc['hw']:,.0f}) | "
                  + (f0(save * q) if save > 0 else "الاستيراد أغلى حتى بدون رسوم") + " |")

print("\n## 5) مخاطرة عطل القفل (الضمان)")
fr_ = {c: ci("failure_rate_year", c) for c in SC}
wm = A["warranty_retail_months"]["value"]
print(f"نسبة العطل بالسنة: {fr_['low']:.0%} / {fr_['base']:.0%} / {fr_['high']:.0%} (cost/inputs.csv، افتراض غير مؤكد).")
print(f"داخل الضمان (نفترض {wm} شهر من البائع السعودي، غير مؤكد): ندفع المشوار {TRIP:g} بس. برا الضمان أو مستورد: قفل جديد + مشوار.")
print("المستورد من علي بابا ما له ضمان محلي: العطل علينا من أول يوم، وننصح بحبة احتياط لكل 10.")
print(f"| الخيار | تكلفة العطل الواحد بدون ضمان | داخل الضمان | المتوقع بالسنة بدون ضمان (5/10/20%) | يأكل كم شهر من هامش {p99} | يأكل كم % من ربح 599 | هامش {p99} بعد احتياط العطل |")
print("|---|---|---|---|---|---|---|")


def risk_row(label, rep, profit599, warr=None):
    one = rep + TRIP
    exp = " / ".join(f0(fr_[c] * one) for c in SC)
    if profit599 <= 0:
        share = "التركيب خسران أصلاً"
    elif one > profit599:
        share = f"أكثر من ربح التركيب كله (×{one/profit599:.1f})"
    else:
        share = f"{one/profit599:.0%}"
    adj = MM[p99] - fr_["base"] * one / 12
    warr = warr or f"{TRIP:g}"
    return f"| {label} | {one:,.0f} | {warr} | {exp} | {one/MM[p99]:.1f} | {share} | {adj:.2f} |"


for x in OPTS:
    print(risk_row(f"{x['o']['key']} {x['o']['name']}", x["rep"], 599 * (1 - FEE) - x["cost"]))
for w in P["wholesale"]:
    for q in (10, 50):
        L, cost = WH[(w["key"], q, "base")]
        kl, kg = A["weight_kg"]["lock"][1], A["weight_kg"]["gateway"][1]
        lock_landed = (L["lock"] + L["fr"] * kl / (kl + kg)) * (1 + A["duty_rate"]["value"][1]) * (1 + VAT_IMP)
        print(risk_row(f"{w['key']} مستورد {q} حبة (base)", lock_landed, 599 * (1 - FEE) - cost, "ما فيه ضمان محلي"))

inst = [r["priceSAR"] for r in ROWS.values() if r["part"] == "install"]
print("\n## 6) مقارنة بالسوق")
print(f"- تركيب قفل ذكي عند الفنيين في السعودية: {min(inst):g} – {max(inst):g} ريال (مقتطفات بحث، غير مؤكد، والضريبة غير مؤكدة).")
o1 = OPTS[0]
print(f"- يعني أرخص قفل + بوابة ({o1['hw']:,.0f}) + فني ({min(inst):g}–{max(inst):g}) = {o1['hw']+min(inst):,.0f} – {o1['hw']+max(inst):,.0f} ريال عند غيرنا، "
      "بدون لوحة NFC ولا صندوق ولا ربط حجوزات. باقتنا 599 فيها كل هذا.")

print("\n## 7) الخلاصة")
print(f"| الخيار | العتاد | تكلفة التركيب | ربح 549 | ربح 599 | ربح 649 | ربح 599 أسوأ حالة | استرداد لو التجهيز مجاني ({p99}) | عطل واحد بدون ضمان | الحالة |")
print("|---|---|---|---|---|---|---|---|---|---|")
for x in OPTS:
    pf = [s * (1 - FEE) - x["cost"] for s in SETUPS]
    print(f"| {x['o']['key']} {x['o']['name']} | {x['hw']:,.0f} | {x['cost']:,.0f} | " + " | ".join(f0(v) for v in pf)
          + f" | {f0(599*(1-FEE_H)-x['cost_w'])} | {f1(x['cost']/MM[p99])} شهر | {x['rep']+TRIP:,.0f} | {x['status']}"
          + (" + ناقص" if x["missing"] else "") + " |")
for w in P["wholesale"]:
    for q in (10, 50):
        L, cost = WH[(w["key"], q, "base")]
        _, cost_h = WH[(w["key"], q, "high")]
        pf = [s * (1 - FEE) - cost for s in SETUPS]
        print(f"| {w['key']} مستورد {q} حبة (base) | {L['total']:,.0f} | {cost:,.0f} | " + " | ".join(f0(v) for v in pf)
              + f" | {f0(599*(1-FEE_H)-cost_h - (EXTRAS_HIGH-EXTRAS))} | {f1(cost/MM[p99])} شهر | بدون ضمان | غير مؤكد + بدون رسوم سابر والتخليص |")
print("\nكل الأرقام «غير مؤكد» لين صاحب المشروع يفتح الصفحات بنفسه ويأكد السعر والضمان.")
