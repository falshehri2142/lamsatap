// Builds a Telegram-style preview of the bot from the REAL Classify code and pictures:
// node systems/n8n/workflows/telegram-preview.js  -> print/telegram-bot-assets/preview.html
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../../..');
const UP = path.join(ROOT, 'print/telegram-bot-assets/upload');
const man = JSON.parse(fs.readFileSync(path.join(UP, 'manifest.json'), 'utf8'));
const img = {};
for (const m of man) img[m.key] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(UP, m.file)).toString('base64');
const ASSETS = Object.assign({ whatsapp: '966507250396', owner_username: 'LMSATAP' }, Object.fromEntries(man.map((m) => [m.key, m.key])));
const code = fs.readFileSync(path.join(__dirname, 'telegram-classify.js'), 'utf8');
const f = new Function('$', '$now', code);
const run = (update) => f((n) => n === 'Read CHANNEL' ? { first: () => ({ json: { owner_telegram_chat_id: '999' } }) }
  : n === 'ASSETS' ? { first: () => ({ json: ASSETS }) } : { all: () => [{ json: update }] }, { setZone: () => ({ hour: 14 }) }).map((x) => x.json);
const msg = (text, extra = {}) => ({ message: Object.assign({ chat: { id: 111, type: 'private' }, from: { id: 111, first_name: 'عميل' }, text }, extra) });
const cq = (data) => ({ callback_query: { id: 'q', data, from: { id: 111, first_name: 'عميل' }, message: { chat: { id: 111, type: 'private' } } } });
const bot = (text) => ({ from: { is_bot: true }, text: text.replace(/<[^>]+>/g, '') });

const KB = {
  main: [['☕ مطعم أو كافيه'], ['🏠 شقق أو إيجار قصير'], ['👀 كيف تشتغل', '💰 الأسعار'], ['❓ أسئلة شائعة', '👤 كلّم شخص']],
  seg: [['🎁 اطلب تجربة ببلاش'], ['📸 صور من الشغل', '💰 الأسعار'], ['❓ أسئلة شائعة', '↩️ القائمة']],
  after: [['🎁 اطلب تجربة ببلاش'], ['❓ أسئلة شائعة', '👤 كلّم شخص'], ['↩️ القائمة']],
  trial: [['☕ مطعم أو كافيه'], ['🏠 شقق أو إيجار قصير'], ['↩️ القائمة']],
  faq: [['عندي QR ببلاش، وش الفرق؟'], ['وش الفايدة لمحلي؟'], ['يشتغل على الآيفون؟'], ['بتحطون شعاركم عندي؟'], ['رقمي يطلع للضيف؟'], ['يحتاج الزبون تطبيق؟'], ['مين يركّب، ووين؟'], ['↩️ القائمة']],
  back: [['↩️ القائمة']],
  handoff: [['🟢 كلّمنا على واتساب'], ['↩️ القائمة']]
};
const ROUTE_KB = { text_main: 'main', photo_main: 'main', photo_seg: 'seg', text_after: 'after', photo_after: 'after', text_trial: 'trial', text_faq: 'faq', text_back: 'back', text_handoff: 'handoff' };
const html = (s) => String(s).replace(/\n/g, '<br>');
const kbHtml = (k) => k ? '<div class="kb">' + KB[k].map((r) => '<div class="row">' + r.map((b) => `<span class="btn">${b}</span>`).join('') + '</div>').join('') + '</div>' : '';
const bubble = (o) => {
  if (o.route === 'answer') return '';
  if (o.route === 'album') return `<div class="msg bot"><div class="album">${o.media.map((k) => `<img src="${img[k]}">`).join('')}</div></div><div class="msg bot"><div class="b">${html(o.text)}</div>${kbHtml('after')}</div>`;
  const pic = o.file ? `<img class="photo" src="${img[o.file]}">` : '';
  const force = o.route === 'text_force' ? '<div class="hint">↩️ تليجرام يفتح «رد» تلقائي</div>' : '';
  return `<div class="msg bot">${pic}<div class="b">${html(o.text)}</div>${kbHtml(ROUTE_KB[o.route])}${force}</div>`;
};
const user = (t) => `<div class="msg me"><div class="b">${t}</div></div>`;
const ownerCard = (o) => `<div class="owner"><b>📩 يوصلك أنت:</b><br>${html(o.text)}</div>`;
const scene = (title, userLabel, update) => {
  const r = run(update);
  return `<section><h2>${title}</h2>${user(userLabel)}${r.filter((o) => o.chat === '111').map(bubble).join('')}${r.filter((o) => o.chat === '999').map(ownerCard).join('')}</section>`;
};
// Trial flow, step by step with the real reply chaining
const t1 = run(cq('trial_host'))[1];
const t2 = run(msg('شقق الريم', { reply_to_message: bot(t1.text) }))[0];
const t3 = run(msg('الروضة', { reply_to_message: bot(t2.text) }))[0];
const t4 = run(msg('4', { reply_to_message: bot(t3.text) }));
const trial = `<section><h2>٨. طلب تجربة ببلاش (شقق)</h2>${user('🎁 اطلب تجربة ببلاش')}${bubble(run(cq('trial'))[1])}${user('🏠 شقق أو إيجار قصير')}${bubble(t1)}${user('شقق الريم')}${bubble(t2)}${user('الروضة')}${bubble(t3)}${user('4')}${t4.filter((o) => o.chat === '111').map(bubble).join('')}${t4.filter((o) => o.chat === '999').map(ownerCard).join('')}</section>`;

const page = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>معاينة بوت لمسة تاب</title>
<style>
:root{--bg:#dfe7ee;--bot:#fff;--me:#e1f7cb;--ink:#111;--btn:#e9eef3;--btnink:#2a6fb0;--card:#fff8e1}
@media (prefers-color-scheme:dark){:root{--bg:#0e1621;--bot:#182533;--me:#2b5278;--ink:#e8eef4;--btn:#223344;--btnink:#8ec5ff;--card:#3a3220}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
main{max-width:460px;margin:0 auto;padding:16px}
h1{font-size:20px;margin:8px 0 4px}p.note{margin:0 0 12px;opacity:.75;font-size:13px}
section{margin:22px 0 30px;border-top:1px solid rgba(127,127,127,.3);padding-top:10px}h2{font-size:15px;opacity:.8;margin:0 0 8px}
.msg{display:flex;flex-direction:column;margin:6px 0;max-width:88%}.bot{margin-left:auto}.me{margin-right:auto;align-items:flex-start}
.b{background:var(--bot);border-radius:12px;padding:8px 11px;word-wrap:break-word}.me .b{background:var(--me)}
.photo{width:100%;border-radius:12px 12px 0 0;display:block}.photo+.b{border-radius:0 0 12px 12px}
.album{display:grid;grid-template-columns:1fr 1fr;gap:2px}.album img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px}
.kb{margin-top:4px}.row{display:flex;gap:4px;margin-top:4px}.btn{flex:1;text-align:center;background:var(--btn);color:var(--btnink);border-radius:8px;padding:7px 4px;font-size:14px}
.owner{background:var(--card);border:1px dashed #c9a227;border-radius:10px;padding:8px 11px;margin:10px 0;font-size:14px}
.hint{font-size:12px;opacity:.6;margin-top:3px}
</style></head><body><main>
<h1>معاينة بوت @lamsatap_bot</h1>
<p class="note">كل نص هنا طالع من كود البوت الحقيقي (telegram-classify.js)، والصور هي الـ 12 صورة اللي بترفعها. الساعة في المعاينة 2 الظهر.</p>
${scene('١. أول ما يضغط Start', '/start', msg('/start'))}
${scene('٢. مطعم أو كافيه', '☕ مطعم أو كافيه', cq('seg_food'))}
${scene('٣. صور من الشغل (مطاعم)', '📸 صور من الشغل', cq('pics_food'))}
${scene('٤. شقق أو إيجار قصير', '🏠 شقق أو إيجار قصير', cq('seg_host'))}
${scene('٥. كيف تشتغل', '👀 كيف تشتغل', cq('how'))}
${scene('٦. الأسعار', '💰 الأسعار', cq('prices'))}
${scene('٧. أسئلة شائعة', '❓ أسئلة شائعة', cq('faq'))}
${scene('٧ب. جواب سؤال', 'عندي QR ببلاش، وش الفرق؟', cq('faq_1'))}
${trial}
${scene('٩. كلّم شخص', '👤 كلّم شخص', cq('human'))}
${scene('١٠. العميل يكتب أي شي', 'كم يكلف ستاند لمحلين؟', msg('كم يكلف ستاند لمحلين؟'))}
</main></body></html>`;
const out = path.join(ROOT, 'print/telegram-bot-assets/preview.html');
fs.writeFileSync(out, page);
console.log('wrote', out, Math.round(page.length / 1024) + 'KB');
