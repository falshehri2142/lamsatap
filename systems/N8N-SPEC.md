# مواصفة n8n للشركة (GM-013)

التاريخ: 2026-09-27 (النسخة 2 بعد مراجعة المشكّك). الكاتب: sys-architect. الحالة: **مواصفة فقط** — لا شي مبني ولا مربوط.
الـ instance الوحيد المسموح: `https://lamsatap.app.n8n.cloud`. ممنوع أي n8n ثاني (المصدر: `management/n8n-access.md`، GM-014).
**الوصول والصلاحيات:** `management/n8n-access.md` (GM-014): مهندس تقنية NFC ينشئ الجداول ويرفع البيانات، مشرف الشبكة يبني الـ workflows، الكونيكتور المسموح هو المذكور هناك فقط، و`search_projects` قبل أي كتابة للتأكد إنه مشروع لمسة تاب.
كل workflow يُبنى **غير منشور / غير مفعّل** (GM-006). التفعيل والنشر والحسابات والمفاتيح = صاحب المشروع بنفسه.

محادثة البناء تمشي بالترتيب: §1 الجداول ← §3 مراحل البناء ← §2 الـ workflows واحد واحد.

**مصطلح «اقتراح»:** أي رقم مكتوب جنبه «اقتراح» (مهل، مدد، حدود) ما هو معتمد؛ يعتمده صاحب المشروع أو القسم المذكور.

---

## 0. حقائق n8n اللي تنبني عليها المواصفة (مصادر رسمية، فُتحت 2026-09-27)
| الحقيقة | المصدر |
|---|---|
| أنواع أعمدة Data Tables: **Boolean, Date, Number, String** فقط | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/tables.md |
| عمليات الصفوف: Insert, Get, Update, Upsert, Delete, If row exists, If row does not exist | https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datatable/rows.md |
| مجموع كل الجداول في الـ instance محدود افتراضياً بـ **200 MiB**؛ فيه استيراد CSV وتنزيل CSV | https://docs.n8n.io/build/work-with-data/data-tables.md |
| أعمدة النظام (id، createdAt) وحد عدد الصفوف وقيود أسماء الأعمدة | **غير مؤكد** (الصفحات ما تذكرها). لذلك كل جدول له مفتاح خاص فيه، وما نعتمد على id النظام |

قاعدة التسمية: أسماء الجداول والأعمدة snake_case إنجليزي صغير. القيم المنطقية في جداول المحاسبة **نص `yes`/`no`** مثل ملفات CSV بالضبط (استيراد وتصدير ذهاب وإياب بدون تحويل).

---

## 1. الجداول (Data Tables)

**ممنوع في أي جدول:** رقم جوال ضيف، اسم ضيف، وقت لمسة أو ضغطة لشريحة/وحدة `door`، IP، user-agent، headers، وقت لمسة دقيق لأي شريحة (اليوم بس). أرقام الحسابات البنكية والبطاقات والآيبان ممنوعة كذلك (`accounting/payments.md`).

**طريقة الإنشاء (خطوة صريحة، ينفذها مهندس تقنية NFC حسب GM-014):**
1. ينشئ الجدول فاضي **بالأعمدة والأنواع المكتوبة هنا بالضبط** (لا يترك الاستيراد يخمّن الأنواع).
2. يفحص ملف CSV من `systems/n8n/seed/`: أول سطر = أسماء الأعمدة نفسها بنفس الترتيب، **بدون BOM** (أول 3 بايتات مو `EF BB BF`)، ترميز UTF-8، التواريخ `YYYY-MM-DD`.
3. يستورد CSV في الجدول الموجود، ثم يقارن عدد الصفوف مع الملف.
4. إذا الاستيراد غيّر نوع عمود أو أضاف عمود: يحذف الجدول ويعيد من الخطوة 1 (سلوك الاستيراد مع جدول موجود **غير مؤكد**، يُفحص بجدول تجربة أول).

### 1.1 `clients` — العملاء
المصدر: `clients/<client>/` + `links.json` (حقل `client`). يكتب فيه: صاحب المشروع، أو workflow (هـ) بعد موافقته.
| العمود | النوع | ملاحظة |
|---|---|---|
| `client_id` | String | **المفتاح**. = `client` في `links.json`. **للعميل الجديد (اقتراح):** slug لاتيني صغير من اسم المنشأة بشرطات (مثل `al-bait-cafe`)، ولو تكرر يُضاف رقم (`-2`)؛ يعتمده صاحب المشروع، وبعدها ما يتغير. مجلدات `clients/` ما انبنت بعد، ولما تنبني تاخذ نفس الاسم |
| `name` | String | اسم المنشأة |
| `kind` | String | `restaurant` / `cafe` / `shop` / `host` |
| `district` | String | |
| `whatsapp` | String | رقم **المنشأة/المضيف** (عميلنا) للتذكير والفاتورة. مو رقم ضيف. يُعبأ يدوياً بعد موافقة العميل؛ فاضي في بيانات التجربة. `status=cancelled` → يُمسح |
| `status` | String | `active` / `cancelled` |
| `created` | Date | |
| `notes` | String | |

### 1.2 `subscriptions` — الاشتراكات
المصدر: الحزم الثلاث في `finance/inputs.csv`: `shop_bundle`، `review_sub` (بنسختين: `price_review_sub_annual` مع تركيب و`price_review_sub_lite_annual` بلا تركيب)، `host_free_hw` (شهري لكل وحدة، شريحة 1-4 و5+). `services/README.md` يقول «لا توجد خدمة معتمدة بعد»، فالأسعار **ما تنكتب في أي workflow**: `price_sar` يعبيه صاحب المشروع. يكتب فيه: صاحب المشروع (عبر Form التجديد)، و workflow (ب) يكتب بس `status` و`reminder_*_sent` بعد ضغط صاحب المشروع «أرسلت».
| العمود | النوع | ملاحظة |
|---|---|---|
| `subscription_id` | String | **المفتاح**. `SUB-0001`… |
| `client_id` | String | → `clients.client_id` |
| `bundle` | String | `shop_bundle` / `review_sub` / `host_free_hw` (نفس قيم عمود service في inputs.csv) |
| `variant` | String | `review_sub`: `with_install` / `no_install`. غيرها فاضي (شريحة المضيف 1-4 أو 5+ تُحسب من `units`) |
| `period` | String | `annual` (shop_bundle, review_sub) / `monthly` (host_free_hw) |
| `units` | Number | عدد الوحدات (للمضيف)، وإلا 1 |
| `start_date` | Date | بداية الفترة الحالية |
| `end_date` | Date | نهاية الفترة المدفوعة الحالية |
| `price_sar` | Number | سعر الفترة الحالية (من صاحب المشروع؛ أرقام inputs.csv تقديرات **غير مؤكدة**) |
| `renewal_price_sar` | Number | سعر التجديد المعروض. لو أعلى من `price_sar` التذكير يذكر الزيادة صراحة (بند 18) |
| `status` | String | `active` / `awaiting_renewal` / `expired` / `cancelled` |
| `renewal_confirmed` | Boolean | `true` **بس** بتأكيد صريح (رد مكتوب أو دفع) يسجله صاحب المشروع. ما في تجديد تلقائي (بند 18، GM-007). يرجع `false` بعد تطبيق التجديد |
| `renewal_confirmed_at` | Date | تاريخ التأكيد الصريح الأخير (يبقى بعد التجديد كسجل) |
| `renewal_confirmed_ref` | String | نوع ومرجع التأكيد: `reply:<تاريخ الرسالة>` أو `payment:<invoice_no>` (بدون أرقام جوال) |
| `reminder_30_sent` | Boolean | يقلبه صاحب المشروع بعد الإرسال الفعلي |
| `reminder_7_sent` | Boolean | نفسه |

### 1.3 `units` — الوحدات والشرائح
المصدر: `systems/shortlinks/links.json` (المرجع الأصلي يبقى الملف؛ الجدول نسخة للقراءة). يكتب فيه: سكربت seed (استيراد CSV) بس، ما عدا `ref`. **لا workflow يعدّل الروابط** — التعديل عبر `links-cli.js` ثم إعادة الاستيراد.
| العمود | النوع | ملاحظة |
|---|---|---|
| `code` | String | **المفتاح** |
| `ref` | String | لـ `door` بس: مرجع الوحدة، 12 حرف أو أكثر عشوائي، مو اسم الوحدة ولا عنوانها (§8). **مين يولّده (اقتراح):** `links-cli.js add ... --type door` يولّد `ref` عشوائي (مولد آمن مثل `crypto.randomBytes`) ويكتبه في `links.json` (تعديل على links-cli.js يسويه sys-builder بطلب منفصل)، وseed ينقله للجدول، وصفحة دليل الوحدة تاخذه من إعداد الوحدة. `public` = فاضي. إعادة الاستيراد = **Upsert على `code`** (ما يتغير `ref` لأنه ثابت في links.json). seed التجربة: فاضي لأن ما فيه وحدة door |
| `client_id` | String | = `client` في links.json |
| `place` | String | |
| `dest` | String | |
| `type` | String | `public` / `door`. ناقص في links.json = `public` (`links-cli.js` سطر 57) |
| `status` | String | `active` / `cancelled` |
| `programmed` | Date | |

ما فيه أي عمود وقت لمس هنا.

### 1.4 `unit_contacts` — أرقام الإشعار لوحدات المضيف (جديد)
الغرض الوحيد: إشعار تشيك أوت/صيانة (بند 13). يكتب فيه: صاحب المشروع يدوياً. يقرأه: workflow (أ) فقط. **منفصل عن `units`** لأن `units` نسخة من `links.json` (في git) والأرقام ما تدخل git.
| العمود | النوع | ملاحظة |
|---|---|---|
| `code` | String | **المفتاح** → `units.code` (door فقط) |
| `client_id` | String | المضيف |
| `host_whatsapp` | String | رقم المضيف للإشعار |
| `worker_whatsapp` | String | رقم العاملة. **ما يُعبأ إلا بعد موافقتها الموثقة** |
| `worker_consent_date` | Date | تاريخ الموافقة الموثقة (فاضي = لا يُرسل للعاملة) |
| `worker_consent_ref` | String | مكان حفظ الموافقة (مرجع ملف، مو صورة الهوية) |
| `status` | String | `active` / `cancelled`. **`cancelled` = يُمسح `host_whatsapp` و`worker_whatsapp` في نفس الخطوة** (بند 13: حذف عند الإلغاء) |

الأرقام ما تظهر للضيف أبداً (لا في الصفحة ولا في الرابط). seed التجربة: فاضي.

### 1.5 `invoices` — الفواتير (أعمدة `accounting/invoices.csv` بالضبط)
يكتب فيه: workflow (ج1) **بعد موافقة صاحب المشروع**، و(ج2) يحدّث الحالة.
`invoice_no` String **المفتاح** (INV-0001 متسلسل بلا تخطي ولا تكرار) · `date` Date · `client` String · `description` String · `amount_sar` Number · `status` String · `payment_ref` String · `notes` String.
الحالات `draft` / `issued` / `paid` / `void` = **اقتراح يعتمده المحاسب**. لا عناصر ضريبة (المنشأة غير مسجلة، `accounting/invoice-template.md`).

### 1.6 `payments` — الدفعات (أعمدة `accounting/payments.csv` بالضبط)
يكتب فيه: workflow (ج2) **بعد موافقة صاحب المشروع فقط**. المفتاح: مركّب `invoice_no + date + bank_ref` (الدفعة الجزئية سطر لكل دفعة).
`date` Date · `invoice_no` String (لازم موجود في `invoices`) · `client` String · `amount_sar` Number · `payment_method` String (`bank_transfer`/`cash`/`other`) · `bank_ref` String (رقم عملية فقط، لا حساب ولا آيبان ولا بطاقة) · `owner_confirmed` String `yes`/`no`.

### 1.7 `ledger` — الدفتر (أعمدة `accounting/ledger.csv` + `line_no`)
يكتب فيه: workflow (ج2) **بعد موافقة صاحب المشروع على نفس القيد** (`accounting/chart-of-accounts.md`).
| العمود | النوع | ملاحظة |
|---|---|---|
| `entry_no` | String | JE-0001… القيد عدة أسطر بنفس الرقم |
| `line_no` | Number | 1، 2… داخل القيد. **المفتاح = `entry_no + line_no`**. عمود زائد في n8n فقط؛ التصدير لـ `ledger.csv` يشيله، والاستيراد يولده من ترتيب الأسطر داخل القيد |
| `date` | Date | |
| `account_code` | String | من دليل الحسابات فقط (1100، 1110، 1200، 4100، 4200 …) |
| `account_name` | String | نفس الاسم في الدليل |
| `debit_sar` | Number | سطر فيه مدين أو دائن فقط، والثاني فاضي |
| `credit_sar` | Number | |
| `description` | String | |
| `reference` | String | = invoice_no |
| `owner_approved` | String | `yes`/`no` |

**فحص التوازن:** قبل أي Insert، Code يتأكد لكل `entry_no`: مجموع المدين = مجموع الدائن، وإلا يوقف.

### 1.8 `prospects` — العملاء المحتملين (من `sales/pipeline.md`)
يكتب فيه: قسم المبيعات/صاحب المشروع؛ workflow (هـ) يحدث `stage`/`last_followup` من Form.
| العمود | النوع | من عمود pipeline.md |
|---|---|---|
| `prospect_no` | Number | # (**المفتاح**) |
| `name` | String | الاسم |
| `activity` | String | النشاط |
| `district` | String | الحي |
| `reviews_at_visit` | Number | عدد التقييمات يوم الزيارة |
| `owner_rep` | String | المسؤول |
| `stage` | String | `contact`/`visit`/`trial`/`signed`/`rejected` (تواصل، زيارة، تجربة، موقّع، مرفوض) |
| `last_followup` | Date | آخر متابعة |
| `notes` | String | ملاحظات |

### 1.9 `daily_taps` — عداد اللمسات (من `systems/tap-counter.md`)
يكتب فيه: workflow (و) فقط. **شرائح `public` فقط.** المفتاح مركّب `code + day + src`.
`code` String · `day` Date (يوم بتوقيت الرياض، بلا ساعة) · `src` String (`nfc`/`qr`/`other`) · `count` Number.

---

## 2. الـ workflows (بالأولوية)

أسماء العقد عامة: Schedule Trigger, Webhook, Form Trigger, Data Table, IF, Switch, Set (Edit Fields), Code, Send-and-Wait, HTTP Request, WhatsApp Business Cloud, Gmail/Email.

**قواعد عامة لكل الـ workflows:**
- **أي رسالة تطلع لعميل أو مضيف أو عاملة تمر بموافقة صاحب المشروع على كل دفعة إرسال — حتى مع API.** الموافقة = Send-and-Wait لصاحب المشروع فيها النص النهائي بالضبط، وما يطلع شي قبل «موافق».
- **Basic Auth إلزامي على كل Form Trigger** (بيانات الدخول يحطها صاحب المشروع بنفسه).
- **المنطقة الزمنية:** n8n افتراضياً America/New_York؛ كل workflow يُضبط Settings → Timezone = `Asia/Riyadh`، وكل الأوقات هنا بتوقيت الرياض.
- **Code node ما يقرأ Data Tables مباشرة:** أي حساب من الجدول (مثل «أعلى رقم +1») يسبقه Data Table Get.
- **التسويق مؤجل**: لا workflow تسويق في هذي المواصفة، ولا رسائل جماعية أبداً (GM-010).
- ولا رسالة واتساب حقيقية ولا بيانات عملاء حقيقية قبل الإطلاق (`management/n8n-access.md`).

### جدول: وش يشتغل بدون WhatsApp API؟
| workflow | بدون API (المرحلة 1 الحالية §8) | مع API |
|---|---|---|
| (أ) إشعار المضيف | **ما فيه workflow.** يدوي بالكامل كما في §8 (الرسالة توصل جوال الشركة، ما توصل n8n) | زر الصفحة → n8n → موافقة صاحب المشروع → المضيف |
| (ب) تذكير التجديد | يشتغل: إيميل لصاحب المشروع فيه رابط wa.me جاهز لكل عميل + رابط «أرسلت»، وهو يرسل بنفسه | نفسه، أو بعد موافقته يرسل قالب utility |
| (ج) الفاتورة والدفعة | يشتغل كامل (جداول + إيميل)، والإرسال للعميل يدوي على واتساب (GM-010) | يرسل الفاتورة بعد موافقته |
| (د) التقرير اليومي | يشتغل بالإيميل لصاحب المشروع | على واتساب صاحب المشروع |
| (هـ) متابعة المبيعات | يشتغل (قائمة يومية لصاحب المشروع + روابط wa.me) | نفسه؛ ما يرسل للمحتملين آلياً |
| (و) عداد اللمسات | ما يحتاج واتساب؛ يحتاج مصدر العد (انظر و) | — |

### (أ) إشعار المضيف: تشيك أوت / بلاغ صيانة (مع API فقط)
- **بدون API:** ما فيه workflow. يبقى يدوي كما في `systems/architecture.md` §8 المرحلة 1.
- **المدخل الوحيد مع API:** زر «تم الخروج» / «بلاغ صيانة» في صفحة دليل الوحدة يرسل لـ Webhook في n8n **مرجع الوحدة (`ref`) ونوع الطلب ونص المشكلة فقط**. الضيف ما يرسل رقمه أصلاً (§8 المرحلة 2). **ممنوع** Webhook رسائل واتساب الواردة كمدخل: الرسالة الواردة فيها رقم الضيف (ضد بند 21 و§8).
- **الخطوات:**
  1. Webhook يستقبل. العقدة التالية مباشرة Set (Edit Fields) بخيار «احتفظ بالحقول المحددة فقط»: `ref`, `request` (`checkout`/`maintenance`), `problem` (أقصى 300 حرف، اقتراح). كل الباقي يُرمى، ولا عقدة بعدها تشوف الـ payload الخام.
     **غير مؤكد:** وش يحمل Webhook في الـ headers على n8n Cloud (ممكن IP عبر `x-forwarded-for` وuser-agent). **خطوة فحص في البناء:** نداء تجربة ببيانات وهمية، ونفتح مخرج عقدة Webhook ونسجل الحقول الموجودة في `work/<task>/`، ونتأكد إن عقدة Set تشيلها كلها.
  2. Data Table Get على `units` بـ `ref` → IF: `type = door` و`status = active`، وإلا وقف بدون أي كتابة.
  3. «If row exists» على `unit_contacts` بـ `code` و`status = active` و`host_whatsapp` مو فاضي؛ ويحدد هل فيه عاملة (`worker_whatsapp` و`worker_consent_date` موجودين). الأرقام نفسها ما تنمرر هنا.
  4. Set: نص جديد: «الوحدة <place> — تشيك أوت. تأكد قبل الدخول.» أو «الوحدة <place> — بلاغ صيانة: <problem>». بدون أي بيانات ضيف.
  5. **الانقسام لـ workflowين (عشان انتظار الموافقة ما يحفظ الطلب الخام):**
     - **workflow «door-intake»:** Webhook (Respond: Immediately — يرد على الصفحة فوراً) → Set (الخطوة 1) → Data Table Get (الخطوة 2-3) → Set (الخطوة 4) → Execute Workflow يمرر **3 حقول بس**: `code`، نص المضيف الجديد، وهل فيه عاملة (true/false). ينتهي فوراً (خيار Execute Workflow «Wait for sub-workflow completion» = لا؛ اسم الخيار بالضبط يُفحص في البناء).
     - **sub-workflow «door-approve»:** Execute Workflow Trigger يستقبل الحقول الثلاثة → يجيب الأرقام من `unit_contacts` بـ `code` → **Send-and-Wait لصاحب المشروع يحمل النص الجديد فقط** (لا payload، لا IP، لا headers، لا وقت الضغطة) بمهلة قصيرة: 30 دقيقة (اقتراح). هذي الحماية من اللمسة الكاذبة والتكرار: كل رسالة تمر عليه.
  6. موافق → WhatsApp Business Cloud: قالب utility معتمد للمضيف، **وللعاملة كذلك** إذا رقمها موجود وموافقتها موثقة (نفس §8). مرفوض أو انتهت المهلة → لا شي (الضيف يتواصل يدوياً عبر رقم الشركة المكتوب في الصفحة).
- **لا حد إرسال آلي ولا عداد:** ممنوع static data أو أي عداد أو سجل لأوقات الأبواب (static data تنحفظ مع الـ workflow، ولا تشتغل أصلاً وهو غير منشور). الحماية = الخطوة 5.
- **الجداول:** قراءة `units`, `unit_contacts`. **لا كتابة في أي جدول.**
- **إعدادات التنفيذ (في الاثنين، موثقة في docs.n8n.io صفحة configure workflow settings):** من ⋯ ← Settings: Save failed production executions = لا، Save successful production executions = لا، Save manual executions = لا. **Redact production execution data مو حماية هنا:** متاح في Enterprise بس، وما يغيّر المحفوظ. ولا static data (تبقى بين التنفيذات وتحتاج نشر) ولا أي عداد للأبواب.
- **قيود loyer:** بند 13 (أرقام المضيف والعاملة: موافقة، غرض الإشعار فقط، حذف عند الإلغاء)، بند 20 (لا وقت ضغط/لمس door في أي مكان)، بند 21 (ج: نص جديد بلا رقم الضيف)، بند 23 (ما يُفعّل قبل ما يكون جوال الشركة والنسخ الاحتياطي وإجراء الحذف جاهزة).
- **أسئلة مفتوحة لـ loyer (قبل البناء):**
  1. أرقام المضيفين والعاملات بتنحفظ في n8n Cloud، واستضافته في الاتحاد الأوروبي (حسب n8n؛ **غير مؤكد** المنطقة بالضبط لهذا الـ instance): هل هذا نقل بيانات خارج المملكة يحتاج شرط أو إجراء؟
  2. إيميل/رسالة الموافقة لصاحب المشروع لها وقت وصول (يعني وقت ضغط الباب تقريباً)، وتبقى في صندوق بريده: هل تُعامل مثل محادثة الواتساب (حذف خلال 7 أيام من إغلاق الطلب، 30 حد أقصى)؟
- **الفشل:** `ref` مو موجود أو وحدة ملغاة → لا شي. لا أرقام في `unit_contacts` → تنبيه لصاحب المشروع بدون أي بيانات من الطلب. فشل API → إعادة مرة، ثم تنبيه صاحب المشروع ليحوّل يدوياً.

### (ب) تذكير التجديد (بند 18)
- **المدخل:** Schedule Trigger يومي 9 صباحاً بتوقيت الرياض.
- **الخطوات:**
  1. Data Table Get `subscriptions` بحالة `active` **أو** `awaiting_renewal`.
  2. Code يحسب الأيام لـ `end_date` → Switch:
     - 30 يوم أو أقل و`reminder_30_sent = false` (للسنوي؛ الشهري `monthly` يتخطى تذكير 30 — اقتراح) → للقائمة.
     - 7 أيام أو أقل و`reminder_7_sent = false` → للقائمة.
     - فات `end_date` و`renewal_confirmed = false` و`status = active` → Update `status = awaiting_renewal`.
     - `awaiting_renewal` وفات `end_date` بأكثر من 14 يوم (مهلة — اقتراح) → Update `status = expired`. ما في تجديد تلقائي أبداً.
  3. Get `clients` للاسم والرقم. نص التذكير: تاريخ الانتهاء، سعر التجديد (`renewal_price_sar`)، ولو أعلى من `price_sar` جملة صريحة بالزيادة، و«للتجديد رد بـ نعم أو ادفع؛ للإلغاء رد بـ إلغاء».
  4. إيميل واحد لصاحب المشروع: لكل عميل رابط wa.me جاهز + رابط «أرسلت» (Form بـ Basic Auth؛ الرابط يحمل `subscription_id` ونوع التذكير كـ query parameters). **تعبئة الحقول من query parameters تشتغل في رابط production بس** (يعني بعد النشر)؛ في التجربة غير المنشورة يكتب صاحب المشروع `subscription_id` يدوياً في الـ Form.
  5. **`reminder_*_sent` ما يتغير عند إرسال الإيميل.** يتغير بس لما صاحب المشروع يضغط «أرسلت» بعد ما يرسل فعلاً.
- **خطوة التجديد (Form «سجّل تجديد»، Basic Auth، صاحب المشروع فقط):** بعد التأكيد الصريح من العميل: Send-and-Wait تأكيد → Update: `renewal_confirmed = true`، `renewal_confirmed_at` = تاريخ التأكيد، `renewal_confirmed_ref` = نوع ومرجع التأكيد ثم تطبيق التجديد في نفس الخطوة: `start_date = end_date` القديم، `end_date` += سنة (`annual`) أو شهر (`monthly`)، `price_sar = renewal_price_sar`، `status = active`، `reminder_30_sent = false`، `reminder_7_sent = false`، `renewal_confirmed = false` (استُهلك).
- **الجداول:** قراءة `subscriptions`, `clients`؛ كتابة `status`, `reminder_*_sent`, وأعمدة التجديد من Form.
- **الفشل:** عميل بلا رقم → في القائمة بعلامة «بلا رقم». فشل الإيميل → إعادة بعد ساعة (اقتراح)؛ ما يتغير أي عمود.

### (ج) الفاتورة والدفعة
**الترتيب:** الفاتورة تسبق الدفعة، والدفعة تنربط بنفس رقم الفاتورة. **الموافقة قبل أي Insert** (`accounting/payments.md`، `accounting/chart-of-accounts.md`).

**(ج1) إصدار فاتورة** — Form Trigger «أصدر فاتورة» (Basic Auth): client، description، amount_sar.
1. Code يجهز نص الفاتورة حسب `invoice-template.md` **بدون رقم** (مكانه «يُحدد عند الموافقة»).
2. Send-and-Wait لصاحب المشروع بنص الفاتورة.
3. موافق → **بعدها** Data Table Get كل `invoices` → Code يحسب أعلى `invoice_no` +1 → «If row does not exist» بنفس الرقم → Insert `invoices` بـ `status = issued`. مرفوض → لا شي، وما انحجز رقم (ما في تخطي).
4. إيميل لصاحب المشروع بالفاتورة ليرسلها للعميل على واتساب (أو مع API: إرسال بعد نفس الموافقة).

**(ج2) تسجيل دفعة** — Form Trigger «سجّل دفعة» (Basic Auth): invoice_no، date، amount_sar، payment_method، bank_ref (للنقد يولّده الـ workflow: `CASH-<invoice_no>-<n>`)، حساب الإيراد (`4100` بيع مرة وحدة / `4200` اشتراكات؛ الافتراضي 4200 لأن الحزم الثلاث اشتراكات).
1. Get `invoices` بالرقم → IF ما موجودة أو `void` → وقف وتنبيه. **ما فيه دفعة بدون فاتورة.**
2. Data Table Get `ledger` (لأعلى `entry_no`) → Code يجهز القيد سطرين من دليل الحسابات:
   - سطر 1: مدين `1110 البنك` (bank_transfer) أو `1100 الصندوق (نقد)` (cash) = المبلغ.
   - سطر 2: دائن `4100` أو `4200` = المبلغ.
   - `payment_method = other` → وقف، يسجله المحاسب يدوياً.
   - فحص: مجموع المدين = مجموع الدائن، وإلا وقف.
   (نفس مثال 1 في `chart-of-accounts.md`. هل القيد يمر بذمم العملاء 1200 عند الإصدار = قرار المحاسب؛ هذا التصميم على أساس النقد.)
3. **Send-and-Wait لصاحب المشروع:** «وصل المبلغ؟» + سطري القيد. لا رد خلال 48 ساعة (اقتراح) = مرفوض.
4. موافق فقط → Insert `payments` (`owner_confirmed = yes`) → Insert سطري `ledger` (`owner_approved = yes`، `entry_no` التالي، `line_no` 1 و2، `reference = invoice_no`).
5. Data Table Get كل `payments` لنفس `invoice_no` → Code يجمعها: إذا المجموع ≥ `amount_sar` → Update `invoices.status = paid` و`payment_ref = bank_ref` الأخير. أقل → تبقى `issued` (دفعة جزئية).
- **الجداول:** `invoices`, `payments`, `ledger`.
- **الفشل:** رفض/لا رد → ما ينكتب ولا صف. رقم فاتورة أو قيد مكرر → وقف وتنبيه. **لا ضريبة** إلا بقرار المحاسب. تعارض أرقام لو فُتح Form مرتين بنفس الوقت: مستخدم واحد (صاحب المشروع)، والرقم يُحسب لحظة الموافقة؛ وجود الرقم يُفحص بـ «If row exists» قبل Insert. دفعة نقد: `bank_ref = CASH-<invoice_no>-<n>` (n = رقم الدفعة النقدية لنفس الفاتورة 1، 2…) عشان المفتاح المركب ما يتكرر.

### (د) تقرير يومي لصاحب المشروع
- **المدخل:** Schedule Trigger يومي 8 مساءً.
- **الخطوات:** Get من `subscriptions` (تنتهي خلال 30 يوم، `awaiting_renewal`)، `invoices` (`issued` غير مدفوعة)، `prospects` (متابعة متأخرة)، `daily_taps` (مجموع أمس) → Code يبني نص قصير عربي → إرسال.
- **الإرسال:** بدون API: إيميل. مع API: قالب utility لرقم صاحب المشروع (الرقم في إعداد الـ credential، مو في الكود). رسالة لصاحب المشروع نفسه، فما تحتاج موافقة.
- **قيود:** لا بيانات ضيوف، ولا أي شي عن وحدات door أو طلباتها.
- **الفشل:** فشل الإرسال → إعادة بعد ساعة (اقتراح)؛ جدول فاضي → «لا شي».

### (هـ) متابعة المبيعات
- **المدخل:** Schedule Trigger يومي 9 صباحاً.
- **الخطوات:** Get `prospects` بـ stage ∈ {contact, visit, trial} و`last_followup` أقدم من 3 أيام (اقتراح، يعدله قسم المبيعات) → قائمة لصاحب المشروع فيها الاسم والمرحلة. Form «حدّث عميل محتمل» (Basic Auth) يحدث `stage`/`last_followup`؛ لو `signed` → Send-and-Wait لصاحب المشروع → Insert في `clients`.
- **قيود:** ما يرسل للمحتملين آلياً أبداً (GM-010).
- **الفشل:** اسم ناقص → يتجاهل الصف ويذكره في التقرير.

### (و) عداد اللمسات اليومي (public فقط)
- **الواقع:** n8n ما يشوف اللمسات. التحويل في Cloudflare (`tap-counter.md`، Pages Function + D1 **غير مبني**). يوم الإطلاق بدون عداد.
- **المدخل:** Schedule Trigger يومي 3 فجراً.
- **الخطوات:** HTTP Request لنقطة تصدير مجاميع أمس من D1 (تُبنى مع الـ Function لاحقاً؛ credential يدخلها صاحب المشروع) → Code: **يرمي أي كود `type=door`** بالمقارنة مع `units` (حماية ثانية) → Upsert `daily_taps` على (code, day, src).
- **الجداول:** قراءة `units`، كتابة `daily_taps`.
- **قيود:** بند 20. لا IP ولا ساعة.
- **الفشل:** التصدير ما رد → لا شي يكتب، يذكر في التقرير (د).
- **الحالة:** مؤجل لين يوافق صاحب المشروع على الـ Function + D1.

---

## 3. مراحل البناء
كل شي **غير منشور/غير مفعّل** (GM-006). ما في credentials إلا يضيفها صاحب المشروع. التفعيل والنشر قراره. الصلاحيات حسب `management/n8n-access.md`.

| الترتيب | الشي | مين | يحتاج | «جاهز» لما |
|---|---|---|---|---|
| 1 | الجداول التسعة (§1، طريقة الإنشاء) | مهندس تقنية NFC | `search_projects` يؤكد مشروع لمسة تاب | الأنواع مطابقة، CSV بلا BOM استورد، عدد الصفوف مطابق، ولا عمود ممنوع |
| 2 | (ج1)+(ج2) | مشرف الشبكة | إيميل صاحب المشروع | ببيانات وهمية: رفض الموافقة = ولا صف؛ موافقة = دفعة + قيد متوازن سطرين؛ دفعة جزئية تخلي الفاتورة `issued`، والمكملة تقلبها `paid`؛ دفعة بدون فاتورة توقف |
| 3 | (ب) | مشرف الشبكة | إيميل | اشتراك وهمي: التذكير يظهر في القائمة كل يوم لين يُضغط «أرسلت»؛ **في التجربة (غير منشور) رابط «أرسلت» ما يعبي `subscription_id` من الرابط، فيُكتب يدوياً في الـ Form** — والمعيار ينجح بالكتابة اليدوية، وتعبئة الرابط تُفحص بعد النشر؛ منتهي بلا تأكيد → `awaiting_renewal` ثم `expired` بعد المهلة؛ Form التجديد يحدث التواريخ ويصفّر الأعلام ويعبي `renewal_confirmed_at`/`renewal_confirmed_ref` |
| 4 | (د) | مشرف الشبكة | إيميل | نص صحيح من بيانات وهمية، وجدول فاضي ما يكسره |
| 5 | (هـ) | مشرف الشبكة | إيميل | `signed` ما يدخل `clients` بدون موافقة |
| 6 | (أ) | مشرف الشبكة | WhatsApp API + قرار صاحب المشروع + بند 23 مكتمل + رد loyer على السؤالين | نداء وهمي: فحص headers مسجل؛ الـ workflow المستقبل يرد فوراً ويمرر 3 حقول بس للـ sub-workflow؛ لا كتابة في أي جدول؛ حفظ التنفيذ مطفّى في الاثنين؛ لا إرسال بدون موافقة؛ انتهاء المهلة = لا إرسال؛ وحدة ملغاة توقف |
| 7 | (و) | مشرف الشبكة | Function + D1 مبنية وموافَق عليها | door ما ينكتب حتى لو جا في التصدير |

---

## 4. التكاليف
| البند | الرقم | المصدر |
|---|---|---|
| n8n Cloud Starter | €20/شهر بالدفع السنوي (€240/سنة)، و€24 بالدفع الشهري؛ 2.5K تنفيذ/شهر، workflows نشطة غير محدودة | https://n8n.io/pricing/ (فُتحت 2026-09-27؛ رقم الشهري مستنتج من بيانات الصفحة حسب مدقق الحقائق، **يحتاج نظرة** قبل القرار) |
| n8n Cloud Pro | €50/شهر بالدفع السنوي، و€60 بالشهري (نفس التحفظ)؛ 10K تنفيذ/شهر | نفس المصدر |
| التجربة المجانية | بدون بطاقة؛ 1,000 تنفيذ، 5 تنفيذات متزامنة، مهلة 180 ثانية للتنفيذ (حسب مدقق الحقائق من نفس الصفحة). المدة **غير مؤكد** | نفس المصدر |
| تقدير الاستهلاك | 4 workflows يومية ≈ 120 تنفيذ/شهر + الفواتير والدفعات + (أ) حسب الطلبات → Starter يكفي مبدئياً (**تقدير**) | حساب |
| WhatsApp Business Platform | يُحاسب لكل رسالة قالب تُسلَّم، حسب الفئة (marketing/utility/authentication) وبلد المستلم. نسختي من الصفحة (2026-09-27) تقول: «Utility templates delivered within an open customer service window are free.» المشكّك يقول إن Meta تحاسب عليها **من 2026-10-01**؛ ما لقيت الجملة في النسخة اللي انفتحت لي = **غير مؤكد**، والتصميم والتكلفة يفترضون إنها **مدفوعة** (الأحوط). السعودية: «Effective October 1, 2025 … Saudi Arabia – Lower utility and authentication rates»، وسعر marketing أعلى «Effective April 1, 2026» (مشرف الشبكة فتح الصفحة 2026-09-27 ولقى جملة «free» للـ utility داخل النافذة، وما لقى جملة 2026-10-01). الدفع بالريال (SAR): صفحة updates-to-pricing تقول «Effective April 1, 2026»، وصفحة pricing ظهرت لي بـ 2025 = نعتمد 2026-04-01 مع تحفظ. سعر الرسالة بالريال: **غير مؤكد** (rate card) | https://developers.facebook.com/docs/whatsapp/pricing/ و https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/ |
| رصيد الذكاء الاصطناعي | ما فيه workflow هنا يحتاجه. لو انضاف: **غير مؤكد** | — |

`finance/inputs.csv` `whatsapp_msg_cost = 0.2` يبقى تقدير غير مؤكد لين يُقرأ الـ rate card.

---

## 5. غير مؤكد
- حد صفوف Data Tables، أعمدة النظام، قيود الأسماء، وسلوك استيراد CSV في جدول موجود.
- headers اللي يحملها Webhook على n8n Cloud (تُفحص في البناء، مرحلة 6).
- منطقة استضافة هذا الـ instance (سؤال loyer).
- هل رقم واتساب العادي يشتغل مع API بنفس الوقت، ومدة اعتماد القوالب.
- سعر n8n بالدفع الشهري (€24/€60 يحتاج نظرة)، ومدة التجربة.
- Send and Wait موجود في عقدة Gmail، لكن توفره في Starter **غير مؤكد**.
- **سؤال للبناء:** هل Send-and-Wait يشتغل والـ workflow غير منشور (تجربة يدوية)؟ **غير مؤكد**.
- **سؤال للبناء:** مهلة 180 ثانية في التجربة: هل تشمل وقت انتظار Send-and-Wait (لو تشمله، أي موافقة تتأخر 3 دقائق تفشل في التجربة)؟ **غير مؤكد**.
- هل Meta تحاسب على utility داخل نافذة الخدمة من 2026-10-01 (§4).
