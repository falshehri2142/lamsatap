// Local test of the Telegram bot brain: node systems/n8n/workflows/test-telegram.js
// Loads telegram-classify.js (the exact jsCode of «Classify message») with stubbed n8n helpers.
const fs = require('fs');
const code = fs.readFileSync(__dirname + '/telegram-classify.js', 'utf8');
const f = new Function('$', '$now', code);
const FULL = { welcome: 'F_W', food: 'F_F', host: 'F_H', how: 'F_HOW', food_scene: 'a', food_menu: 'b', food_review: 'c', food_wifi: 'd', host_scene: 'e', host_guide: 'f', host_checkout: 'g', host_maint: 'h' };
const OWNER = '999';
const run = (update, o = {}) => f((n) => n === 'Read CHANNEL' ? { first: () => ({ json: { owner_telegram_chat_id: OWNER } }) }
  : n === 'ASSETS' ? { first: () => ({ json: o.assets || FULL }) }
  : { all: () => [{ json: update }] }, { setZone: () => ({ hour: o.hour === undefined ? 12 : o.hour }) }).map((x) => x.json);
const P = { type: 'private' };
const msg = (text, extra = {}) => ({ message: Object.assign({ message_id: 5, chat: { id: 111, ...P }, from: { id: 111, first_name: 'Ali', username: 'ali' }, text }, extra) });
const cq = (data, chat = 111) => ({ callback_query: { id: 'q1', data, from: { id: chat, first_name: 'Ali' }, message: { chat: { id: chat, ...P } } } });
const botMsg = (text) => ({ from: { id: 1, is_bot: true }, text });
const routes = (r) => r.map((x) => x.route + '>' + x.chat).join(',');
const lenOk = (r) => r.every((x) => !x.text || (x.file ? x.text.length <= 1024 : x.text.length <= 4096));

const cases = [];
const t = (name, r, ok) => cases.push([name, r, ok]);

t('/start -> welcome photo with main menu', run(msg('/start')), (r) => r.length === 1 && r[0].route === 'photo_main' && r[0].file === 'F_W' && r[0].text.includes('أسبوعين ببلاش'));
t('/start without assets -> text main', run(msg('/start'), { assets: {} }), (r) => r[0].route === 'text_main');
t('/start campaign payload -> welcome', run(msg('/start c01')), (r) => r[0].route === 'photo_main');
t('/start@lamsatap_bot', run(msg('/start@lamsatap_bot')), (r) => r[0].route === 'photo_main');
t('door checkout link', run(msg('/start co_abcd1234efgh5678')), (r) => r.length === 1 && r[0].route === 'door' && r[0].request === 'checkout' && r[0].ref === 'abcd1234efgh5678' && !r[0].text);
t('door maintenance link', run(msg('/start MT_ABCD1234EFGH5678')), (r) => r[0].route === 'door' && r[0].request === 'maintenance');
t('short ref -> welcome', run(msg('/start co_abc')), (r) => r[0].route === 'photo_main');
t('/prices', run(msg('/prices')), (r) => r[0].route === 'text_after' && r[0].text.includes('1,211') && r[0].text.includes('798') && r[0].text.includes('49.5') && r[0].text.includes('434.5') && r[0].text.includes('بدون ضريبة'));
t('/how -> photo', run(msg('/how')), (r) => r[0].route === 'photo_after' && r[0].file === 'F_HOW' && !r[0].text.includes('مباشرة'));
t('/contact in hours', run(msg('/contact')), (r) => routes(r) === 'text_back>111,text_plain>999' && r[0].text.includes('خلال ساعة') && r[1].text.includes('#c111'));
t('/contact after hours', run(msg('/contact'), { hour: 23 }), (r) => r[0].text.includes('بكرة من 9'));
t('/contact at 8:59', run(msg('/contact'), { hour: 8 }), (r) => r[0].text.includes('بكرة من 9'));
t('unknown command -> menu', run(msg('/xyz')), (r) => r[0].route === 'text_main');
t('button food -> answer + poster + silent owner note', run(cq('seg_food')), (r) => routes(r) === 'answer>undefined,photo_seg>111,text_plain>999' && r[1].file === 'F_F' && r[1].pics === 'pics_food' && r[2].silent === true && r[2].text.includes('#c111'));
t('button host -> poster', run(cq('seg_host')), (r) => r[1].route === 'photo_seg' && r[1].file === 'F_H' && r[1].pics === 'pics_host' && r[1].text.includes('ما نطلّع رقمك'));
t('pics food -> album of 4', run(cq('pics_food')), (r) => r[1].route === 'album' && r[1].media.join('') === 'abcd');
t('pics without assets -> text', run(cq('pics_host'), { assets: { host_scene: 'e' } }), (r) => r[1].route === 'text_after');
t('faq menu + answers', run(cq('faq')), (r) => r[1].route === 'text_faq');
t('faq_5 answer', run(cq('faq_5')), (r) => r[1].route === 'text_after' && r[1].text.includes('ورقمك ما يطلع'));
t('unknown button ignored', run(cq('xyz')), (r) => r.length === 0);
t('group callback ignored', run({ callback_query: { id: 'q', data: 'menu', from: { id: 1 }, message: { chat: { id: -5, type: 'group' } } } }), (r) => r.length === 0);
t('owner can press buttons (test)', run(cq('seg_food', 999)), (r) => r[1].route === 'photo_seg' && r[1].chat === '999');

// Trial flow (state lives in the bot message)
let r1 = run(cq('trial'));
t('trial -> type question', r1, (r) => r[1].route === 'text_trial');
let r2 = run(cq('trial_host'));
t('trial_host -> force name', r2, (r) => r[1].route === 'text_force' && r[1].text.startsWith('🎁 طلب تجربة | النوع: شقق أو إيجار قصير |') && r[1].text.includes('اسم الشقق'));
const plain = (html) => html.replace(/<[^>]+>/g, '');
let r3 = run(msg('شقق | الريم: <b>', { reply_to_message: botMsg(plain(r2[1].text)) }));
t('name answer cleaned -> ask district', r3, (r) => r.length === 1 && r[0].route === 'text_force' && r[0].text.includes('الاسم: شقق الريم b |') && !/<b>\s*\|/.test(r[0].text) && r[0].text.includes('في أي حي'));
let r4 = run(msg('الروضة', { reply_to_message: botMsg(plain(r3[0].text)) }));
t('district -> ask units', r4, (r) => r[0].route === 'text_force' && r[0].text.includes('الحي: الروضة |') && r[0].text.includes('كم وحدة'));
let r5 = run(msg('كثير', { reply_to_message: botMsg(plain(r4[0].text)) }));
t('units not a number -> re-ask', r5, (r) => r[0].route === 'text_force' && r[0].text.includes('اكتب الرقم بس'));
let r6 = run(msg('عندي ٧ شقق', { reply_to_message: botMsg(plain(r4[0].text)) }));
t('arabic digits -> done + lead card', r6, (r) => routes(r) === 'text_back>111,text_plain>999' && r[0].text.includes('وصل طلبك') && r[1].text.includes('الوحدات: 7') && r[1].text.includes('الحي: الروضة') && r[1].text.includes('#c111') && !r[1].silent);
let f2 = run(cq('trial_food'));
let f3 = run(msg('كافيه المثال', { reply_to_message: botMsg(plain(f2[1].text)) }));
let f4 = run(msg('الشاطئ', { reply_to_message: botMsg(plain(f3[0].text)) }), { hour: 2 });
t('food trial has no units step, after-hours done', f4, (r) => routes(r) === 'text_back>111,text_plain>999' && !r[1].text.includes('الوحدات') && r[0].text.includes('بكرة من 9'));
t('empty answer re-asks', run(msg('|||', { reply_to_message: botMsg(plain(f2[1].text)) })), (r) => r[0].route === 'text_force' && r[0].text.includes('وش اسم المحل'));
t('forged reply to user msg is not a trial', run(msg('x', { reply_to_message: { from: { id: 5, is_bot: false }, text: '🎁 طلب تجربة | النوع: مطعم أو كافيه |' } })), (r) => r.some((x) => x.route === 'text_plain' && x.chat === '999'));

// Free text and owner
t('client text -> owner (escaped, menu tag) + ack', run(msg('أبغى تحديث المنيو <b>')), (r) => routes(r) === 'text_plain>999,text_back>111' && r[0].text.includes('[طلب تحديث منيو]') && r[0].text.includes('&lt;b&gt;') && r[1].text.includes('وصلتنا'));
t('client photo without text', run(msg(undefined, { photo: [{ file_id: 'x', width: 1, height: 1 }] })), (r) => r[0].text.includes('صورة أو ملف'));
t('name with html escaped', run(msg('hi', { from: { id: 111, first_name: '<i>A&B', username: 'ali' } })), (r) => r[0].text.includes('&lt;i&gt;A&amp;B'));
t('owner reply relays escaped', run({ message: { chat: { id: 999, ...P }, text: 'تمام <3', reply_to_message: { text: '💬 رسالة من Ali #c111\nhi' } } }), (r) => routes(r) === 'text_plain>111' && r[0].text === 'تمام &lt;3');
t('owner photo -> file_id note', run({ message: { chat: { id: 999, ...P }, photo: [{ file_id: 's', width: 90, height: 90 }, { file_id: 'BIG', width: 944, height: 1180 }] } }), (r) => r[0].chat === '999' && r[0].text.includes('944×1180') && r[0].text.includes('BIG'));
t('owner free text -> hint', run({ message: { chat: { id: 999, ...P }, text: 'hi' } }), (r) => routes(r) === 'text_plain>999' && r[0].text.includes('اضغط «رد»'));
t('groups ignored', run({ message: { chat: { id: -5, type: 'group' }, text: 'hi' } }), (r) => r.length === 0);
t('all texts within Telegram limits', [].concat(run(msg('/start')), run(cq('seg_food')), run(cq('seg_host')), run(msg('/how')), run(msg('/prices'))), lenOk);

let fail = 0;
for (const [n, r, ok] of cases) { let pass = false; try { pass = ok(r); } catch (e) { pass = false; } if (!pass) { fail++; console.log('FAIL', n, JSON.stringify(r)); } else console.log('PASS', n); }
console.log(cases.length - fail + '/' + cases.length + ' pass');
process.exit(fail ? 1 : 0);
