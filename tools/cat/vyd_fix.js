// Owner 21.10.2026: «Вид інструменту» errors found by cat/vyd_audit.js (WERA datasheet unambiguous) -> plan for cat/night_write.js.
// New value = the union of what every generator gives now (after the fixes in zyklop.js, vykrutky.js, vde.js, g_kk.js; cat/vyd_sources.json),
// written only for the articles below and only if it differs from the site; any other value on the site (outside the generators) stops the plan.
//   node cat/vyd_fix.js <live.json>  -> cat/vyd_1021_plan.json + inventory/vyd_audit.xlsx
const fs = require('fs'), path = require('path'), X = require('xlsx'); const C = require('./vyd_comp.js');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const by = Object.fromEntries(L.map(p => [p.article, p]));
const SRC = require('./vyd_sources.json'), OLD = require('./vyd_sources_before.json'); const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const QUOTE = { '05049002001': 'Tool-Check Modular Micro 1: «1014 Kraftform Micro Ручка-держатель для насадок» + 20 «Micro Насадки» (PH, PZ, TX, SL, Hex) — тріскачки немає',
  '05049003001': 'Tool-Check Modular Hex-Plus 1: «950 Г-образный ключ» × 7 + «Переходник для 9549» — тріскачки немає',
  '05018111001': 'Kraftform Kompakt 900 Imperial Set 1, 19 предметов: «921 Ударный винтовёрт» + біти — набір',
  '05018110001': 'Kraftform Kompakt 900 Set 1, 19 предметов: «921 Ударный винтовёрт» + біти — набір',
  '05004184001': 'Набор для велосипедиста 13, 2 предмета: «9502 Лопатка-монтировка с битодержателем», «9503 Лопатка-монтировка с узлом для вывинчивания ниппеля» — викруток немає',
  '05136700001': '9108/2 «Набор инструментов для монтажа коннекторов MC4, 2 предмета»: «2 ключа 9108» — викруток немає',
  '05136400001': '«8000 E Деблокиратор» — не тріскачка, приладдя до неї',
  '05006147001': '«160 i/7 Rack Набор отвёрток Kraftform Plus серия 100 + однополюсный тестер»: 162 i PH, 160 i … + 247 тестер — набір викруток',
  '05006148001': '«160 i/165 i/7 Rack Набор отвёрток Kraftform Plus серия 100 + однополюсный тестер»: 165 i PZ, 160 i … + 247 тестер — набір викруток',
  '05006480001': '«160 iS/7 Rack Набор отвёрток Kraftform Plus серия 100 + однополюсный тестер»: 162 iS, 165 iS … + 247 тестер — набір викруток' };
const stop = m => { console.log('STOP', m); process.exit(2); };
const uni = s => [...new Set((s || []).flatMap(x => x.v))];
const plan = [], rows = [];
for (const a of Object.keys(QUOTE)) { const p = by[a]; const now = v(p, 'vyd_instrumentu'); const before = uni(OLD[a]), after = uni(SRC[a]);
  if (JSON.stringify([...now].sort()) !== JSON.stringify([...before].sort())) stop(`${a}: site ${now} != generators ${before} (a value from outside)`);
  if (JSON.stringify([...after].sort()) === JSON.stringify([...now].sort())) stop(`${a}: nothing to change`);
  plan.push({ article: a, characteristics: { vyd_instrumentu: after } }); rows.push({ Артикул: a, Назва: p.title.ua, Було: now.join(' + '), Стало: after.join(' + '), 'Даташит WERA': QUOTE[a], 'Перша строка даташиту': C.first(a) }); }
fs.writeFileSync(path.join(__dirname, 'vyd_1021_plan.json'), JSON.stringify({ name: 'vyd_1021', keys: ['vyd_instrumentu'], products: plan }, null, 1));
const A = require('./vyd_audit.json'); const wb = X.utils.book_new();
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows), 'Виправлено');
const fixed = new Set(Object.keys(QUOTE)); const disp = A.rows.filter(r => !fixed.has(r.a));
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(disp.map(r => ({ Артикул: r.a, Назва: r.title, 'Вид зараз': r.all, Значення: r.val, Генератор: r.src, Чому: r.why, 'Даташит WERA': r.quote || '' }))), 'Спірні');
X.writeFile(wb, 'C:/Users/Techlight/Desktop/wera-photos/inventory/vyd_audit.xlsx');
console.log('plan', plan.length, '| disputed', disp.length); rows.forEach(r => console.log(' ', r.Артикул, r.Було, '->', r.Стало));
