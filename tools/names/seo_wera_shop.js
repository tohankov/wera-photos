// Owner 19.10.2026: «інтернет-магазин WERA» back in the meta titles. Store SEO templates 31 (product), 23 (category), 25 (filter) UA/RU, and the own
// seo_title of category 1269 «Сумки для інструментів Wera 2go» (its name already has Wera: no second WERA). Descriptions are not touched.
//   node names/seo_wera_shop.js dry | write  -> backup/seo_wera_shop_before_<ts>.json; dryRun (only names[i18n][3|1][handler] / seo_title); save; re-read
const fs = require('fs'); const S = require('../lib/session.js').open(); const WRITE = process.argv[2] === 'write';
const F = '{filter[name(:) value](,)}';   // the filter token the live template 25 already uses (renders «Профіль: PH (Phillips)»)
const T = { 31: ['{mod_title} — купити в інтернет-магазині WERA | TL-Shop', '{mod_title} — купить в интернет-магазине WERA | TL-Shop'],
  23: ['{title} — купити в інтернет-магазині WERA | TL-Shop', '{title} — купить в интернет-магазине WERA | TL-Shop'],
  25: [`{title} ${F} — купити в інтернет-магазині WERA | TL-Shop`, `{title} ${F} — купить в интернет-магазине WERA | TL-Shop`] };
const C1269 = ['Сумки для інструментів Wera 2go — купити в інтернет-магазині | TL-Shop', 'Сумки для инструментов Wera 2go — купить в интернет-магазине | TL-Shop'];
const OLD = { 31: ['{mod_title} — купити | TL-Shop', '{mod_title} — купить | TL-Shop'], 23: ['{title} WERA — купити | TL-Shop', '{title} WERA — купить | TL-Shop'],
  25: [`{title} ${F} WERA — купити | TL-Shop`, `{title} ${F} WERA — купить | TL-Shop`] };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); }; const sleep = ms => new Promise(r => setTimeout(r, ms));
const H = l => `names[i18n][${l}][handler]`;
(async () => { const bk = {};
  for (const id of Object.keys(T)) { await sleep(1000); const r = await S.call('horoshop_admin_record_get', { entity: 'seo_templates', id: +id, fields: [H(3), H(1)] }); bk[id] = r.fields;
    if (r.fields[H(3)] !== OLD[id][0] || r.fields[H(1)] !== OLD[id][1]) stop(`template ${id} is not the expected one: ${r.fields[H(3)]} | ${r.fields[H(1)]}`); }
  const pg = await S.call('horoshop_admin_page_get', { id: 1269, allowLarge: true }); bk[1269] = { ua: pg.languages.ua.seo_title, ru: pg.languages.ru.seo_title };
  console.log('1269 now', bk[1269].ua, '|', bk[1269].ru);
  if (WRITE) fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/seo_wera_shop_before_${Date.now()}.json`, JSON.stringify(bk, null, 1));
  for (const [id, [ua, ru]] of Object.entries(T)) { await sleep(1000);
    const r = await S.call('horoshop_admin_record_save', { entity: 'seo_templates', id: +id, dryRun: !WRITE, set: { [H(3)]: ua, [H(1)]: ru } });
    const ch = (r.willChange || r.changes || []); if (r.error || !ch.length || ch.some(c => ![H(3), H(1)].includes(c.field))) stop(id + ' ' + JSON.stringify(r).slice(0, 400));
    console.log(id, WRITE ? 'saved' : 'dryRun', ch.map(c => `${c.field}: ${c.to}${c.persisted === undefined ? '' : ' persisted ' + c.persisted}`).join(' ; ')); }
  await sleep(1000); const r = await S.call('horoshop_admin_page_seo_set', { id: 1269, dryRun: !WRITE, langs: { ua: { seo_title: C1269[0] }, ru: { seo_title: C1269[1] } } });
  if (r.error || JSON.stringify(r).match(/"(title|h1|text|seo_keywords|seo_description)"\s*:\s*\{\s*"from"/)) stop('1269 ' + JSON.stringify(r).slice(0, 500)); console.log('1269', WRITE ? 'saved' : 'dryRun', JSON.stringify(r).slice(0, 400));
  if (WRITE) { for (const [id, [ua, ru]] of Object.entries(T)) { await sleep(1000); const g = await S.call('horoshop_admin_record_get', { entity: 'seo_templates', id: +id, fields: [H(3), H(1)] });
      console.log('verify', id, g.fields[H(3)] === ua && g.fields[H(1)] === ru ? 'ok' : 'DIFF'); }
    const g = await S.call('horoshop_admin_page_get', { id: 1269, allowLarge: true }); console.log('verify 1269', g.languages.ua.seo_title === C1269[0] && g.languages.ru.seo_title === C1269[1] ? 'ok' : 'DIFF', g.languages.ua.seo_title); }
  S.close(); })().catch(e => { console.error(e); S.close(); process.exit(1); });
