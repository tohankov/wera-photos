// Owner's answers 22.10.2026 to docs/filters_rule_check.md, items 1, 2, 4, 7, 8, 9 (item 5 «Діапазон моменту» — cat/torque_1022h.js).
// Principle (CLAUDE.md): a value the product really has (WERA datasheet / wera.de) is written so the product is found by the filter; a property it does not
// have is not invented. Values come from the group generators (the same rules that will regenerate them); only the owner-approved (article, key) pairs below
// are planned — other generator differences (new findings) go to the report as proposals.
//   node cat/rule_1022h.js <live.json>  -> cat/rule_1022h_plan.json (cat/night_write.js) + cat/rule_1022h_rows.json (what / why / source per change)
const fs = require('fs'), path = require('path');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const by = Object.fromEntries(L.map(p => [p.article, p]));
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const G = {}; const gen = g => G[g] || (G[g] = Object.fromEntries(require(`./g_${g}.js`).items.map(i => [i.a, i.vals])));
const KIND = require('./vyd_comp.js').KIND_OWNER;
// [article, key, group, why] — values from the group generator; 'kind' = KIND_OWNER (one kind, replaces); 'drop' = only remove the listed values
const RL = 'Для правої та лівої різьби', PG = 'Пістолетна ручка';
const ITEMS = [
  // п. 1 (а) — по паспорту WERA / wera.de
  ['05020017001', 'rozmir_pid_kliuch', 'joker', 'Joker 6000 Black Edition 11 Set — паспорт, стр. 3: «6000 Joker Ring, Black Edition … 8 мм x 144 мм … 19 мм x 246 мм»'],
  ...['05022689001', '05022699001', '05022210001', '05022089001'].map(a => [a, 'rozmir_kliucha', 'lkeys', 'wera.de «Werkzeuge in diesem Set» (cat/pr_size.js WERA_DE)']),
  ['05022860001', 'rozmir_kliucha', 'lkeys', 'паспорт, стр. 4: «3950 SPKL Multicolour Imperial … 5/64" x 101 мм … 3/8" x 224 мм»'],
  ...['05049020001', '05049025001'].flatMap(a => ['rozmir_holovky', 'dovzhyna_holovky', 'profil'].map(k => [a, k, 'zyklop', 'вложенный набор Tool-Check Modular 1 / Imperial 1: «8790 HMA Торцовая головка Zyklop 1/4" … x 23 мм» (cat/comp_expand.js)'])),
  ...['05006605001', '05006633001', '05006634001', '05006635001'].flatMap(a => [[a, 'nalashtuvannia_momentu', 'dyn', 'динамометр у складі WERA (7441 VDE / 7508 / 7516 VDE): регульований'],
    [a, 'pryvid', 'dyn', '7441 VDE «Для рабочих концов Kraftform Kompakt VDE»; 7508 / 7516 VDE «исключительно для насадок Wera Kraftform Kompakt VDE»']]),
  ...[...['05136423001', '05136429001', '05136428001', '05136427001', '05136431001', '05136430001', '05136432001', '05136499001', '05136415001', '05136418001', '05136419001', '05136568001',
    '05136416001', '05136417001', '05136052001', '05136558001'], '05130006001', '05136039001', '05073201001', '05073202001', '05006642001', '05073702001'].map(a => [a, 'vyd_instrumentu', 'kind', KIND[a] && KIND[a][1]]),
  ['05136609001', 'vyd_instrumentu', 'set', 'Набір з тріскачкою', 'паспорт: «9544 Трещоточная головка Zyklop Mini, 1/4"»'],
  ['05136601001', 'vyd_instrumentu', 'set', 'Набір з тріскачкою', 'паспорт: «8008 A Трещотка Zyklop Mini 3»'],
  ['05004186001', 'vyd_instrumentu', 'set', 'Викрутка з набором біт', 'wera.de: «Bits-Handhalter … Die im Griff integrierte Ratsche … Inklusive 7 Edelstahl-Bits» — ручка з тріскачкою не тріскачка'],
  // п. 4 — «Особливості динамометра» по паспорту (Safe-Torque: только правая / левая резьба, без «Функція Torque Lock»)
  ...['05075800001', '05075801001', '05075830001', '05075831001', '05075832001', '05136073001', '05075810001', '05075815001', '05075840001', '05075850001', '05075851001',
    '05075870001', '05075876001', '05006633001', '05006634001', '05006635001', '05075651001', '05075652001', '05075653001', '05075654001', '05075655001', '05075656001', '05075657001',
    '05075670001', '05075671001', '05075672001', '05075673001', '05075670010', '05075671010', '05075672010', '05136076001'].map(a => [a, 'osoblyvosti_dynamometra', 'add', RL, 'паспорт: «для правой и левой затяжки / резьбы»']),
  ...['05074717001', '05074728001', '05074721001'].map(a => [a, 'osoblyvosti_dynamometra', 'add', PG, 'паспорт: «ручка пистолетной формы»']),
  // п. 7 — 712 i VDE: «Довжина робочого кінця» 154 мм (вид — выше)
  ...['05006642001', '05073702001'].map(a => [a, 'dovzhyna_robochoho_kintsia', 'vde', 'паспорт: «Насадка-переходник … 712 i, изолированная, 1/4", 1/4" x 154 мм»']),
  // п. 8 — голые размеры у 5 наборов VDE; набор для рекалибровки — без «Налаштування» (момент — в cat/torque_1022h.js)
  ...['05006613001', '05006614001', '05006616001', '05006632001', '05004967001'].map(a => [a, 'rozmir_robochoho_kintsia', 'vde', 'голі розміри покриті «Профіль і розмір», «… мм» лишаються']),
  ['05137003001', 'nalashtuvannia_momentu', 'set', null, 'паспорт: «Набор для рекалибровки … с ручкой длиной 89 мм» — момента нет'],
  // п. 9 — TL105 по описанию на сайте; Hex-Plus Christmas — одна карта
  ...['profil', 'rozmir', 'dovzhyna', 'typ_bit_u_nabori'].map(k => ['TL105', k, 'bitsets', 'опис на сайті: «Склад: PH1х25мм … HEX4х25мм» (cat/comp_extra.js)']),
  ...['sklad_ph', 'sklad_pz', 'sklad_hex'].map(k => ['TL105', k, 'sklad', 'опис на сайті (cat/comp_extra.js)']),
  ['05135825001', 'rozmir_kliucha', 'lkeys', 'одна карта: «4 Г-образных ключа (размеры 3,0; 4,0; 5,0; 6,0)»'],
  ['05135825001', 'sklad_hex', 'sklad', 'одна карта: «4 Г-образных ключа (размеры 3,0; 4,0; 5,0; 6,0)»'],
];
const out = {}, rows = [];
for (const it of ITEMS) { const [a, k, src] = it; const p = by[a]; if (!p) throw new Error('not in export ' + a); const now = v(p, k); let to, why;
  if (src === 'kind') { to = [KIND[a][0]]; why = it[3]; }
  else if (src === 'set') { to = it[3] === null ? [] : [it[3]]; why = it[4]; }
  else if (src === 'add') { to = [...new Set([...((out[a] || {})[k] || now), it[3]])]; why = it[4]; }
  else { const g = gen(src)[a]; if (!g) throw new Error(`${a} not in g_${src}`); to = g[k] || []; why = it[3];
    if (['pryvid', 'profil'].includes(k)) to = [...new Set([...now, ...to])]; }   // shared dictionaries: keep other groups' values
  if (JSON.stringify([...to].sort()) === JSON.stringify([...now].sort())) { rows.push({ a, k, now, to, why, same: true }); continue; }
  (out[a] = out[a] || {})[k] = to; rows.push({ a, title: p.title.ua, k, now, to, why }); }
const products = Object.entries(out).map(([article, characteristics]) => ({ article, characteristics }));
const keys = [...new Set(products.flatMap(x => Object.keys(x.characteristics)))];
fs.writeFileSync(path.join(__dirname, 'rule_1022h_plan.json'), JSON.stringify({ name: 'rule_1022h', keys, products }, null, 1));
fs.writeFileSync(path.join(__dirname, 'rule_1022h_rows.json'), JSON.stringify(rows, null, 1));
const c = {}; for (const r of rows.filter(r => !r.same)) c[r.k] = (c[r.k] || 0) + 1;
console.log('products', products.length, 'changes', rows.filter(r => !r.same).length, 'already so', rows.filter(r => r.same).map(r => r.a + ' ' + r.k).join(', ') || 0); console.log(c);
