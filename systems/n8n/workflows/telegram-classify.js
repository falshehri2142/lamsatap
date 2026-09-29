// «Classify message» in LT telegram inbound (mocsmio6hCqQAMvk). Pro bot, 2026-09-30.
// Every client-facing line comes from systems/bot-brief.md (code in the comment). No storage: the trial
// request carries its answers inside the bot's own ForceReply message. Test: node systems/n8n/workflows/test-telegram.js
// Output items: { route, chat, text, file?, pics?, media?, qid?, silent? } -> «Route action» switch.
const cfg = $('Read CHANNEL').first().json;
const A = $('ASSETS').first().json;
const owner = String(cfg.owner_telegram_chat_id || '').trim();
const hour = Number($now.setZone('Asia/Riyadh').hour);
// B20 (owner, 2026-09-30): replies 24/7. Set ALWAYS_OPEN = false to go back to 9:00-22:59 with the after-hours texts.
const ALWAYS_OPEN = true;
const open = ALWAYS_OPEN || (hour >= 9 && hour < 23);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The #c<chat> tag is the reply address: user text never carries '#', and the tag always sits on the card's first line.
const whoOf = (f, chat) => [f && f.first_name ? esc(String(f.first_name).replace(/#/g, '').slice(0, 64)) : '', f && f.username ? '@' + esc(f.username) : '', '#c' + chat].filter(Boolean).join(' ');
const WHEN = hour < 9 ? 'اليوم' : 'بكرة'; // closed hours: 23:00-23:59 -> بكرة, 00:00-08:59 -> اليوم
const REPLY_HINT = '↩️ رد على هالرسالة عشان يوصل ردك له.';
const FREE = '🎁 أسبوعين ببلاش · ما عجبك؟ نشيل العتاد، بدون دفع مقدم ولا التزام في التجربة'; // B18

const T = {
  // B01 + B18
  welcome: '<b>أهلاً فيك في لمسة تاب 👋</b>\nمنيو وتقييم قوقل وواي فاي بلمسة جوال أو باركود، للمطاعم والكافيهات والشقق المفروشة في جدة.\n\n' + FREE + '\n\nوش نشاطك؟ 👇',
  menu: '<b>القائمة</b> 👇\nاختر اللي يناسبك.',
  // B05 + B06 + B07 + B18
  food: '<b>☕ للمطاعم والكافيهات</b>\nخلّ جوال زبونك يرد عنك: المنيو وتقييم قوقل والواي فاي، زبونك يقرّب جواله ويفتحها.\n\n<b>حزمة المحل الكامل:</b>\n• ستاند تقييم قوقل\n• منيو إلكتروني\n• واي فاي\n• صفحة روابط\n• العتاد والتركيب علينا طول الاشتراك\n• تحديث المنيو مرتين بالشهر\n\nالستاند بهوية محلك، مو إعلان لنا.\n\n' + FREE,
  // B09 + B10 + B11 + B18
  host: '<b>🏠 للشقق والإيجار القصير</b>\nدليل كل وحدة، عند بابها: شريحة وباركود داخل الوحدة، وضيفك يفتح منهم الدليل بجواله.\n\n<b>الباقة لكل وحدة:</b>\n• شريحة الوحدة وملصق الباركود\n• دليل الضيف: الواي فاي، التكييف، الشروط، العنوان\n• زر تشيك أوت وبلاغ صيانة يوصلون لنا\n• تقييم\n• العتاد والتركيب علينا\n\nما نطلّع رقمك ولا رقم العاملة للضيف.\n\n' + FREE,
  // B25: fake QR in the pictures
  pics: '📸 هذي صور توضيحية من شغلنا، والباركود فيها للعرض بس.',
  noPics: '📸 الصور بتنضاف هنا قريب.',
  // B12 + B13 + B14 + B03 + B04
  how: '<b>👀 كيف تشتغل؟</b>\n١. زبونك أو ضيفك يقرّب جواله من الستاند أو الملصق.\n٢. تنفتح الصفحة في متصفح جواله، بدون تطبيق.\n\n📱 <b>الآيفون:</b> حط راس الجوال على النقطة، واضغط الإشعار اللي يطلع لك.\n🔳 <b>جواله ما قرأ الشريحة؟</b> يمسح الباركود اللي جنبها، ويفتح نفس الصفحة.\n\n<b>وإحنا؟</b> نجهّزها بهويتك ونركّبها عندك. نركّب بنفسنا، وحالياً في جدة بس، ونجرّب كل شريحة قبل التسليم.',
  // B15 + B27 + B16 + B17 + B19 + B18
  prices: '<b>💰 الأسعار</b>\n\n<b>☕ مطعم أو كافيه · حزمة المحل الكامل</b>\n1,211 ريال للسنة الأولى\nالتجديد السنوي 798 ريال\nتحديث المنيو مرتين بالشهر، والتحديث الزايد 25 ريال (لين 10 أصناف)\n\n<b>🏠 شقق · السعر لكل وحدة</b>\n• من 1 إلى 4 وحدات: 49.5 ريال شهرياً، أو 544.5 ريال سنوياً\n• 5 وحدات فأكثر: 39.5 ريال شهرياً، أو 434.5 ريال سنوياً، ويسري على جميع وحداتك\nالشهري بالتزام 6 أشهر.\n\nالأسعار بدون ضريبة.\nما يتجدد إلا بتأكيد صريح منك.\n\n' + FREE,
  faq: '<b>❓ أسئلة شائعة</b>\nاختر سؤالك 👇',
  faqA: {
    faq_1: '<b>عندي QR ببلاش، وش الفرق؟</b>\nصح، وتقدر تسويه. الفرق: الستاند يشتغل باللمس ومعه باركود، وشكله مرتب بهوية محلك، وإحنا نركبه ونتأكد إنه يفتح صفحة تقييمك الصح. جرّبه أسبوعين ببلاش وقارن بنفسك.', // F1
    faq_2: '<b>وش الفايدة لمحلي؟</b>\nعملاؤك الراضين موجودين، بس قليل منهم يتعب يدور صفحتك ويقيّم. الستاند يختصر عليهم الطريق. وما نوعدك برقم.', // F2
    faq_3: '<b>يشتغل على الآيفون؟</b>\nالآيفون الحديث يقرأ الشريحة: يحط راس الجوال على النقطة، ويطلع له إشعار يضغطه. وإذا جواله ما قرأ الشريحة، يمسح الباركود اللي جنبها ويفتح نفس الصفحة.', // F3 + B14 (B13 bans «أي جوال»)
    faq_4: '<b>بتحطون شعاركم عندي؟</b>\nلا، الستاند بهوية محلك: شعارك أنت، مو إعلان لنا. اسمنا سطر صغير ورا الستاند، وإذا ما تبيه ما نحطه.', // F4
    faq_5: '<b>رقمي أو رقم العاملة يطلع للضيف؟</b>\nلا، أبداً. رسايل «تم الخروج» و«بلاغ صيانة» توصلنا إحنا من جوال الضيف. ورقمك ما يطلع في الصفحة ولا في الرسالة.', // F5
    faq_6: '<b>يحتاج الزبون تطبيق؟</b>\nلا، الصفحة تنفتح في متصفح جواله.', // B12
    faq_7: '<b>مين يركّب، ووين؟</b>\nإحنا نركّب بنفسنا، وحالياً في جدة بس. والتركيب علينا، ونجرّب كل شريحة قبل التسليم.' // B04
  },
  // B20 / B21
  humanOpen: '<b>👤 أبشر</b>\nكلّمنا مباشرة على واتساب من الزر تحت، أو اكتب سؤالك هنا ويوصلنا على طول.\nنرد خلال ساعة، 24 ساعة، 7 أيام بالأسبوع.',
  humanClosed: '<b>👤 أبشر</b>\nكلّمنا على واتساب من الزر تحت، أو اكتب سؤالك هنا. وقتنا الحين برا الدوام، ويرد عليك واحد منا ' + WHEN + ' من 9 الصبح.',
  ackOpen: '✅ وصلت رسالتك، ويرد عليك واحد منا.',
  ackClosed: '✅ وصلت رسالتك. وقتنا الحين برا الدوام، ويرد عليك واحد منا ' + WHEN + ' من 9 الصبح.',
  // B18
  trial: '<b>🎁 أسبوعين ببلاش</b>\nما عجبك؟ نشيل العتاد، بدون دفع مقدم ولا التزام في التجربة.\n\nوش نوع نشاطك؟',
  trialDoneOpen: '<b>✅ وصل طلبك</b>\nيرد عليك واحد منا خلال ساعة، 24 ساعة، 7 أيام بالأسبوع.\nتبي تكلّمنا الحين؟ اضغط واتساب تحت، أو اكتب هنا.',
  trialDoneClosed: '<b>✅ وصل طلبك</b>\nوقتنا الحين برا الدوام، ويرد عليك واحد منا ' + WHEN + ' من 9 الصبح.',
  ownerHint: 'ℹ️ عشان ترد على عميل: اضغط «رد» على رسالته هنا واكتب ردك.'
};

const TYPES = { trial_food: 'مطعم أو كافيه', trial_host: 'شقق أو إيجار قصير' };
const HOST = TYPES.trial_host;
const TR = '🎁 طلب تجربة |';
const FIELDS = ['النوع', 'الاسم', 'الحي', 'الوحدات'];
const clean = (s) => String(s || '').replace(/[#|:<>&\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
const digits = (s) => String(s || '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const encode = (f) => TR + ' ' + FIELDS.filter((k) => f[k]).map((k) => k + ': ' + f[k] + ' |').join(' ');
const parse = (line) => { const f = {}; const re = /([^\s|:]+): ([^|]*) \|/g; let m; while ((m = re.exec(line))) if (FIELDS.includes(m[1])) f[m[1]] = clean(m[2]); return f; };
const need = (f) => !f['الاسم'] ? 'الاسم' : !f['الحي'] ? 'الحي' : (f['النوع'] === HOST && !f['الوحدات']) ? 'الوحدات' : null;
const QUESTION = (f, k) => k === 'الاسم' ? (f['النوع'] === HOST ? 'وش اسمك أو اسم الشقق؟' : 'وش اسم المحل؟') : k === 'الحي' ? 'في أي حي بجدة؟' : 'كم وحدة عندك؟ (اكتب رقم)';

const out = [];
const send = (route, chat, text, extra) => out.push({ json: Object.assign({ route, chat: String(chat), text }, extra || {}) });
const photo = (route, fallback, chat, key, text, extra) => {
  const file = String(A[key] || '').trim();
  if (file) send(route, chat, text, Object.assign({ file }, extra || {}));
  else send(fallback, chat, text);
};
const toOwner = (text, silent) => { if (owner) send('text_plain', owner, text, { silent: !!silent }); };
// Real handoff (owner, 2026-09-30): after the marketing part the client gets a WhatsApp button to the company number
// (ASSETS.whatsapp, from the owner's posters) and the owner's Telegram @ if ASSETS.owner_username is set.
const WA = String(A.whatsapp || '').replace(/[^0-9]/g, '');
const TG = String(A.owner_username || '').replace(/[^A-Za-z0-9_]/g, '');
const handoff = (chat, text) => {
  const line = TG ? '\n\nأو كلّمنا مباشرة على تليجرام: @' + TG : '';
  if (WA) send('text_handoff', chat, text + line, { url: 'https://wa.me/' + WA + '?text=' + encodeURIComponent('السلام عليكم، جاي من بوت لمسة تاب') });
  else send('text_back', chat, text + line);
};
const ask = (chat, f, k, retry) => send('text_force', chat, encode(f) + '\n' + (retry ? retry + '\n' : '') + '<b>' + QUESTION(f, k) + '</b>');

function screen(name, chat, who) {
  if (name === 'welcome') return photo('photo_main', 'text_main', chat, 'welcome', T.welcome);
  if (name === 'menu') return send('text_main', chat, T.menu);
  if (name === 'seg_food' || name === 'seg_host') {
    const food = name === 'seg_food';
    photo('photo_seg', 'text_after', chat, food ? 'food' : 'host', food ? T.food : T.host, { pics: food ? 'pics_food' : 'pics_host' });
    return toOwner('👀 فتح «' + (food ? TYPES.trial_food : HOST) + '» — ' + who);
  }
  if (name === 'pics_food' || name === 'pics_host') {
    const keys = name === 'pics_food' ? ['food_scene', 'food_menu', 'food_review', 'food_wifi'] : ['host_scene', 'host_guide', 'host_checkout', 'host_maint'];
    const media = keys.map((k) => String(A[k] || '').trim());
    return media.every(Boolean) ? send('album', chat, T.pics, { media }) : send('text_after', chat, T.noPics);
  }
  if (name === 'how') return photo('photo_after', 'text_after', chat, 'how', T.how);
  if (name === 'prices') return send('text_after', chat, T.prices);
  if (name === 'faq') return send('text_faq', chat, T.faq);
  if (T.faqA[name]) return send('text_after', chat, T.faqA[name]);
  if (name === 'human') {
    handoff(chat, open ? T.humanOpen : T.humanClosed);
    return toOwner('👤 <b>يبي يكلم شخص</b> — ' + who + '\n' + REPLY_HINT);
  }
  if (name === 'trial') return send('text_trial', chat, T.trial);
  if (TYPES[name]) return ask(chat, { 'النوع': TYPES[name] }, 'الاسم');
  return send('text_main', chat, T.menu);
}

const COMMANDS = { start: 'welcome', menu: 'menu', prices: 'prices', how: 'how', contact: 'human', faq: 'faq', trial: 'trial' };
const BUTTONS = ['menu', 'seg_food', 'seg_host', 'pics_food', 'pics_host', 'how', 'prices', 'faq', 'human', 'trial', 'trial_food', 'trial_host'].concat(Object.keys(T.faqA));

for (const it of $('Telegram message in').all()) {
  const cq = it.json.callback_query;
  if (cq) {
    const msgChat = cq.message && cq.message.chat;
    if (!msgChat || msgChat.type !== 'private' || !BUTTONS.includes(cq.data)) continue;
    const chat = String(msgChat.id);
    out.push({ json: { route: 'answer', qid: String(cq.id) } });
    screen(cq.data, chat, whoOf(cq.from, chat));
    continue;
  }
  const m = it.json.message || {};
  if (!m.chat || m.chat.type !== 'private') continue;
  const chat = String(m.chat.id);
  const isOwner = owner && chat === owner;
  const who = whoOf(m.from, chat);
  const raw = String(m.text || m.caption || '').slice(0, 2000);
  const rep = m.reply_to_message;
  const repText = rep ? String(rep.text || rep.caption || '') : '';

  // Trial request: the answer is a reply to the bot's own ForceReply message.
  if (rep && rep.from && rep.from.is_bot && repText.startsWith(TR)) {
    const f = parse(repText.split('\n')[0]);
    const k = need(f);
    if (!f['النوع'] || !k) { screen('trial', chat, who); continue; }
    if (k === 'الوحدات') {
      const n = (digits(raw).match(/\d{1,4}/) || [])[0];
      if (!n || Number(n) < 1) { ask(chat, f, k, 'اكتب الرقم بس، مثل 3.'); continue; }
      f[k] = String(Number(n));
    } else {
      const v = clean(raw);
      if (!v) { ask(chat, f, k); continue; }
      f[k] = v;
    }
    const next = need(f);
    if (next) { ask(chat, f, next); continue; }
    handoff(chat, open ? T.trialDoneOpen : T.trialDoneClosed);
    toOwner('🆕 <b>طلب تجربة</b> — ' + who + '\nالنوع: ' + f['النوع'] + '\nالاسم: ' + f['الاسم'] + '\nالحي: ' + f['الحي'] + (f['الوحدات'] ? '\nالوحدات: ' + f['الوحدات'] : '') + '\n' + REPLY_HINT);
    continue;
  }

  // Commands (the owner can use them too, to test the bot).
  const c = raw.match(/^\/([a-z]+)(?:@\w+)?(?:\s+(\S+))?\s*$/i);
  if (c) {
    const d = c[1].toLowerCase() === 'start' && c[2] && c[2].match(/^(co|mt)_([a-z0-9]{12,32})$/i);
    if (d) { out.push({ json: { route: 'door', chat, request: d[1].toLowerCase() === 'mt' ? 'maintenance' : 'checkout', ref: d[2].toLowerCase() } }); continue; }
    screen(COMMANDS[c[1].toLowerCase()] || 'menu', chat, who);
    continue;
  }

  if (isOwner) {
    const t = repText.split('\n')[0].match(/#c(\d{3,20})/);
    if (t && m.text) { send('text_plain', t[1], esc(String(m.text).slice(0, 4000))); continue; }
    if (Array.isArray(m.photo) && m.photo.length) {
      const p = m.photo[m.photo.length - 1];
      send('text_plain', chat, '🖼️ ' + p.width + '×' + p.height + '\n<code>' + esc(p.file_id) + '</code>', { silent: true });
      continue;
    }
    send('text_plain', chat, T.ownerHint, { silent: true });
    continue;
  }

  // Anything else from a client goes to the owner at once (live chat through the bot). Short silent ack,
  // skipped when the client is replying to one of the bot's messages (already in a conversation).
  const tag = /منيو|menu/i.test(raw) ? '[طلب تحديث منيو] ' : '';
  toOwner('💬 ' + tag + 'رسالة من ' + who + '\n' + (raw ? esc(raw) : '(صورة أو ملف بدون نص، افتحها من تليجرام)') + '\n\n' + REPLY_HINT);
  if (!(rep && rep.from && rep.from.is_bot)) send('text_plain', chat, open ? T.ackOpen : T.ackClosed, { silent: true });
}
return out;
