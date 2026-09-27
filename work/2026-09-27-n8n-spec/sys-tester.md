# sys-tester — مواصفة n8n (2026-09-27)

**النتيجة: PASS** (مع ملاحظة ضعف واحدة غير مانعة). ما استُخدمت أي أداة MCP لـ n8n ولا أي اتصال.

## 1. التشغيل الفعلي
- `node systems/n8n/seed/seed.js` → exit 0: units rows=3 cols=7، clients rows=2 cols=8، invoices/payments/ledger rows=0 (8/7/9 أعمدة)، subscriptions 12، prospects 9، daily_taps 4.
- `node systems/n8n/seed/compare-spec.js` → OK للجداول الثمانية، «no differences»، exit 0.
- `systems/n8n/seed/out/` متجاهَل في git (`.gitignore:3`).

## 2. مقارنة يدوية (بدون السكربت)
- الجداول `tables/*.json` مقابل `N8N-SPEC.md` §1.1–1.8: الأسماء والترتيب والأنواع متطابقة عمود بعمود (8 جداول، كل الأنواع ضمن Boolean/Date/Number/String).
- رؤوس `accounting/*.csv` مقابل الجداول: invoices (8) وpayments (7) وledger (9) متطابقة حرفياً بالترتيب.
- الفرقان اللي ذكرهم المعماري: أحسمهما **موافق**: `clients.whatsapp` و`subscriptions.renewal_price_sar` موجودين في المواصفة والمخطط؛ و`owner_confirmed`/`owner_approved` نوعهم String عشان يطابق CSV (`yes`/`no`) = صح.
- ما فيه جدول أو عمود لرقم ضيف أو وقت لمسة door أو IP: `grep -iE "phone|guest|ip|tap_time|user_agent|touched"` على `tables/*.json` ما طلع إلا ملاحظة `clients.whatsapp` («رقم المنشأة فقط، مو ضيف، فاضي في seed»). `daily_taps` = code/day/src/count (يوم بلا ساعة، public فقط حسب §1.8)، و`units` بدون أي عمود وقت.

## 3. اختبارات الفشل (على نسخة في scratchpad/n8nt، كلها لازم تفشل)
| الحالة | النتيجة |
|---|---|
| عمود `guest_phone` في clients.json | FAIL متوقع: `forbidden column clients.guest_phone`، exit 1؛ وcompare-spec «1 difference(s)» |
| عمود `ip` | FAIL متوقع: `forbidden column clients.ip`، exit 1 |
| عمود `tap_time` | FAIL متوقع: `forbidden column clients.tap_time`، exit 1 |
| `0551234567` في place بـ links.json | FAIL متوقع: `phone-like value in units.place` |
| `+966551234567` في dest | FAIL متوقع: `phone-like value in units.dest` |
| رقم جوال في صف payments.csv | FAIL متوقع: `phone-like value in payments.owner_confirmed` |
| رأس invoices.csv `amount` بدل `amount_sar` | FAIL متوقع: `invoices: header mismatch` |
| عمود زيادة في رأس ledger.csv | FAIL متوقع: `ledger: header mismatch` |

## 4. ملاحظة ضعف (مو FAIL)
فحص الرقم (`PHONE` في seed.js) ما يمسك الرقم المكتوب بمسافات: `055 123 4567` و`+966 55 123 4567` مرّوا (false)، وكذلك `0551234567x`. `00966551234567` انمسك. اقتراح لـ sys-builder: شيل المسافات والشرطات قبل الفحص.

## جولة أخيرة (نسخة المواصفة 3) — نفّذها القسم بنفسه بعد انقطاع المختبِر (إعادة تشغيل التطبيق)
- `seed.js`: نجح، 9 جداول، `phone detector self-test: ok`. `compare-spec.js`: الجداول التسعة OK، «no differences».
- BOM: `units.csv` يبدأ بـ `cod` (ما فيه `ef bb bf`).
- `links-cli.js` على نسخة scratch: `--type door` يولّد ref من 16 حرف ومختلف لكل وحدة (door1/door2)، `public` بدون ref. الرفض القديم شغال: كود مكرر، وجهة `//t/`.
- `links.json` و`published.txt` الحقيقيين ما تغيروا.
- النتائج فوق (الجولة الأولى: 8 جداول، subscriptions 12) **قديمة**.
