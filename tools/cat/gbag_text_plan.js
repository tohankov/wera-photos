// «Сумки Wera 2go» (1269), rule Б (owner 27–28.10.2026): only the FACT is corrected by the current WERA datasheet, the wording stays.
//   9401 05136450001 — the datasheet: «для набора инструментов 8006 SC 1», «вместимостью до 13 предметов»; ours named ratchet sets 1/2″ and
//                      sockets «до 23 мм» (not in the datasheet / wera.de — cat/global_desc.js);
//   9422 05136471001 — the datasheet: «для хранения до 33 инструментов Kraftform Kompakt» (no VDE; ours «… Kraftform Kompakt VDE»).
// Read-only: a plan for cat/desc_write.js.   node cat/gbag_text_plan.js <group live.json> <out plan.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p]));
const FIX = {
  '05136450001': { why: 'паспорт 9401: для набора 8006 SC 1, до 13 предметов (не «головки до 23 мм»)',
    ua: [['для наборів з тріскачкою 1/2″; для торцевих голівок довжиною до 23 мм;', 'для набору інструментів 8006 SC 1, до 13 предметів;']],
    ru: [['для наборов с трещоткой 1/2″; для торцовых головок длиной до 23 мм;', 'для набора инструментов 8006 SC 1, до 13 предметов;']] },
  '05136471001': { why: 'паспорт 9422: до 33 инструментов Kraftform Kompakt (без VDE)',
    ua: [['до 33 інструментів Kraftform Kompakt VDE', 'до 33 інструментів Kraftform Kompakt']], ru: [['до 33 инструментов Kraftform Kompakt VDE', 'до 33 инструментов Kraftform Kompakt']] } };
const plan = { name: 'gbag_text', products: {} }; const miss = [];
for (const [a, f] of Object.entries(FIX)) { const p = L[a]; const nw = {};
  for (const l of ['ua', 'ru']) { let h = p.description[l]; for (const [o, n] of f[l]) { if (h.split(o).length !== 2) { miss.push(`${a} ${l}: «${o.slice(0, 50)}» не найдено`); continue; } h = h.replace(o, () => n); } nw[l] = h; }
  if (nw.ua !== p.description.ua || nw.ru !== p.description.ru) plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [f.why] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, miss.length ? miss : '');
