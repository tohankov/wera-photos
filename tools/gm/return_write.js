// Owner 19.10.2026: two facts for Google Merchant on «Обмін та повернення» (page 573) and on the product card tab «Повернення» (site settings info_return), UA/RU.
// Two rows in the existing row style are inserted right after the «Інші міста» / «Другие города» row; the rest of the text is not touched.
// node gm/return_write.js dry | write  -> backup/return_before_<ts>.json; dryRun; save; re-read: the stored text must equal old text + the insertion exactly.
const fs = require('fs'); const S = require('../lib/session.js').open(); const MODE = process.argv[2] || 'dry';
const ROWS = { 3: [['Доставка', 'Зворотну доставку оплачує покупець.'], ['Кошти', 'Повну вартість товару повертаємо в день звернення на картку або рахунок покупця.']],
  1: [['Доставка', 'Обратную доставку оплачивает покупатель.'], ['Деньги', 'Полную стоимость товара возвращаем в день обращения на карту или счёт покупателя.']] };
const R = 'display:flex;flex-wrap:wrap;column-gap:12px;row-gap:2px;margin:0 0 10px', L = 'flex:0 0 100px;color:#999', V = 'flex:1 1 220px;min-width:0';
const pageRow = ([l, v]) => `<div style="${R}"><div style="${L}">${l}</div><div style="${V}">${v}</div></div>`;            // page 573: one line, no breaks
const tabRow = ([l, v]) => `<div style="${R}">\r\n<div style="${L}">${l}</div>\r\n\r\n<div style="${V}">${v}</div>\r\n</div>\r\n\r\n`;   // tab: the editor's \r\n layout
const T = [ // entity, id, field, anchor (end of the «other cities» row, must occur once), rows html
  ['pages', 573, 'extra[i18n][3][text]', 'можуть відправити нам товар «Новою поштою»</div></div>', ROWS[3].map(pageRow).join('')],
  ['pages', 573, 'extra[i18n][1][text]', 'могут отправить нам товар «Новой почтой»</div></div>', ROWS[1].map(pageRow).join('')],
  ['site_settings', 1, 'extra[i18n][3][info_return]', 'Надішліть товар &laquo;Новою поштою&raquo;</div>\r\n</div>\r\n\r\n', ROWS[3].map(tabRow).join('')],
  ['site_settings', 1, 'extra[i18n][1][info_return]', 'Отправьте товар &laquo;Новой почтой&raquo;</div>\r\n</div>\r\n\r\n', ROWS[1].map(tabRow).join('')] ];
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const read = async (e, id, f) => { const r = await S.call('horoshop_admin_record_get', { entity: e, id, fields: [f], allowLarge: true }); const v = r.fields && r.fields[f]; if (typeof v !== 'string') stop('read ' + e + ' ' + f + ' ' + JSON.stringify(r).slice(0, 200)); return v; };
(async () => { const bk = {}, want = {};
  for (const [e, id, f, anchor, ins] of T) { const old = await read(e, id, f); bk[`${e} ${id} ${f}`] = old;
    if (/повертаємо в день звернення|возвращаем в день обращения/.test(old)) stop(`${e} ${f}: the rows are already there`);
    const n = old.split(anchor).length - 1; if (n !== 1) stop(`${e} ${f}: anchor found ${n} times`);
    want[`${e}|${id}|${f}`] = old.replace(anchor, anchor + ins); console.log(e, id, f, 'length', old.length, '->', want[`${e}|${id}|${f}`].length); }
  if (MODE === 'write') fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/return_before_${Date.now()}.json`, JSON.stringify(bk, null, 1));
  for (const [e, id] of [['pages', 573], ['site_settings', 1]]) { const set = Object.fromEntries(Object.entries(want).filter(([k]) => k.startsWith(`${e}|${id}|`)).map(([k, v]) => [k.split('|')[2], v]));
    const r = await S.call('horoshop_admin_record_save', { entity: e, id, set, dryRun: MODE !== 'write' });
    const ch = r.willChange || r.changes || []; console.log(e, id, MODE, 'fields', ch.map(c => `${c.field}${c.persisted === undefined ? '' : ' persisted ' + c.persisted}`).join(', ') || JSON.stringify(r).slice(0, 400),
      'setFields', JSON.stringify(r.setFields || []), 'unknown', JSON.stringify(r.unknownFields || [])); if (!ch.length || ch.some(c => !Object.values(set).length || !(c.field in set))) stop('unexpected answer'); }
  if (MODE === 'write') for (const [k, v] of Object.entries(want)) { const [e, id, f] = k.split('|'); const now = await read(e, +id, f);
    const ok = now.replace(/\r\n/g, '\n') === v.replace(/\r\n/g, '\n'); console.log('verify', e, id, f, ok ? 'ok' : 'DIFF at ' + [...now].findIndex((c, i) => c !== v[i])); }
  S.close(); })().catch(e => { console.error(e); S.close(); process.exit(1); });
