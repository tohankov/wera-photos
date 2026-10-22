// Owner's answers 22.10.2026 to docs/report_1022h.md «Ждёт тебя» (owner's items 1–8 = report items 1–4, 6–9; Bicycle Set 8 — no answer, not touched).
// Values come from the group generators (the same rules that will regenerate them); only the (article, key) pairs below are planned.
//   node cat/rule_1022i.js <live.json>  -> cat/rule_1022i_plan.json (cat/night_write.js) + cat/rule_1022i_rows.json (what / why / source per change)
const fs = require('fs'), path = require('path');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const by = Object.fromEntries(L.map(p => [p.article, p]));
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const G = {}; const gen = g => G[g] || (G[g] = Object.fromEntries(require(`./g_${g}.js`).items.map(i => [i.a, i.vals])));
// [article, key, group, why] — values from the group generator; shared dictionaries (UNION) keep other groups' values; 'set' = exactly these values
const UNION = ['profil', 'pryvid', 'osoblyvosti_vykrutky', 'osoblyvosti_dynamometra', 'osoblyvosti_kliucha', 'pokryttia'];
const ITEMS = [
  // 1 — Wera 2go E 1 / H 1: «Профіль» by the WERA composition opened through the nested sets; features
  ['05134025001', 'profil', 'kk', 'состав WERA (вложенные наборы): «8100 SA 6 Zyklop Speed» — «8790 HMA Торцовая головка Zyklop 1/4", 5 mm x 23 мм», «867/4 Z TORX® Насадки, TX 10 x 50 мм»; «Kraftform Kompakt Turbo i 1» — «Kompakt VDE 65 iS PZ/S … # 1 x 157 мм», «67 iS TORX® … TX 15 x 157 мм»'],
  ['05134025001', 'osoblyvosti_vykrutky', 'kk', 'паспорт: «4 отвёртки VDE, в т.ч. 2 из нержавеющей» — «3162 i PH VDE Крестовая отвертка из нержавеющей стали», «3165 i PZ VDE … из нержавеющей стали»'],
  ['05134011001', 'profil', 'kk', 'вложенный «Kraftform Kompakt H 1» (паспорт 05135939001): «8790 HMA Торцовая головка Zyklop 1/4", 5.5 mm x 23 мм», «851/4 Z Насадки, PH 1 x 89 мм», «855/4 Z Насадки, PZ 1 x 89 мм», «867/4 Z TORX® BO Насадки с отверстием, TX 10 x 89 мм», «800/4 Z Насадки, 1 мм x 5.5 мм x 89 мм»'],
  ['05134011001', 'osoblyvosti_vykrutky', 'kk', 'вложенный «Kraftform Kompakt H 1» (паспорт 05135939001): «247 Однополюсный тестер фазного напряжения, 0.5 мм x 3 мм x 70 мм»'],
  // 2 — Kompakt VDE 16 Torque: drive as VDE 15 Torque
  ['05006609001', 'pryvid', 'vde', 'паспорт: «Набор динамометрических отвёрток Kraftform Kompakt VDE с установкой момента затяжки» — ручка 7441 VDE для рабочих концов Kraftform Kompakt VDE'],
  // 3 — 9558: right / left thread by the composition
  ['05136062001', 'osoblyvosti_dynamometra', 'dyn', 'состав: «Click-Torque X 2 (10 - 50 Нм)»; паспорт Click-Torque X 2 05075652001: «подходит для правой и левой затяжки»'],
  // 4 — Zyklop inch screwdriver-head sets: inch sizes only in «Профіль і розмір» (already there, dictionary 392), off «Розмір головки»
  ...['05003884001', '05003974001', '05003181001'].map(a => [a, 'rozmir_holovky', 'zyklop', 'правило 21.10: у наборов викруткових головок размеры — в «Профіль і розмір» (HEX 5/64″ … 3/8″ уже стоят, справочник 392); «Розмір головки» — только торцевые']),
  // 5 — recalibration set: no drive in the datasheet
  ['05137003001', 'pryvid', 'set', [], 'паспорт: «Набор для рекалибровки … с ручкой длиной 89 мм» — привода нет'],
  // 6 — 781 A/B VDE / 781 B/A VDE
  ...['05024690001', '05024692001'].map(a => [a, 'vyd_instrumentu', 'vde', 'паспорт: «781 A/B VDE переходник, изолированный, 1/4", 781 A/B VDE x 3/8 x 56 мм x 1/4"» (781 B/A — так же)']),
  // 7 — coating
  ['05024450001', 'pokryttia', 'lkeys', 'wera.de DE: «BlackLaser für hohen Korrosionsschutz» + «Zinkphosphatiert»; EN: «BlackLaser …» + «Zinc phosphate plated»'],
  ['05024460001', 'pokryttia', 'lkeys', 'паспорт: «967/9 TX XL 1 TORX® Набор Г-образных ключей, цинковое фосфатирование» + «Обработка поверхности по технологии BlackLaser»; wera.de: «BlackLaser für hohen Korrosionsschutz» (Zinkphosphatiert на wera.de нет)'],
  // 8 — Hex-Plus Christmas: ball head
  ['05135825001', 'osoblyvosti_kliucha', 'lkeys', 'wera.de: свойство «Kugelkopf» / «Ball tip»; паспорт: «Hex-Plus | Шестигранная шариковая | Г-образный ключ»'],
];
const out = {}, rows = [];
for (const it of ITEMS) { const [a, k, src] = it; const p = by[a]; if (!p) throw new Error('not in export ' + a); const now = v(p, k); let to, why;
  if (src === 'set') { to = it[3]; why = it[4]; }
  else { const g = gen(src)[a]; if (!g) throw new Error(`${a} not in g_${src}`); to = g[k] || []; why = it[3];
    if (UNION.includes(k)) to = [...new Set([...now, ...to])]; }
  if (JSON.stringify([...to].sort()) === JSON.stringify([...now].sort())) { rows.push({ a, k, now, to, why, same: true }); continue; }
  (out[a] = out[a] || {})[k] = to; rows.push({ a, title: p.title.ua, k, now, to, why }); }
const products = Object.entries(out).map(([article, characteristics]) => ({ article, characteristics }));
const keys = [...new Set(products.flatMap(x => Object.keys(x.characteristics)))];
fs.writeFileSync(path.join(__dirname, 'rule_1022i_plan.json'), JSON.stringify({ name: 'rule_1022i', keys, products }, null, 1));
fs.writeFileSync(path.join(__dirname, 'rule_1022i_rows.json'), JSON.stringify(rows, null, 1));
console.log('products', products.length, 'changes', rows.filter(r => !r.same).length, 'already so', rows.filter(r => r.same).map(r => r.a + ' ' + r.k).join(', ') || 0);
for (const r of rows.filter(r => !r.same)) console.log(r.a, r.k, JSON.stringify(r.now), '->', JSON.stringify(r.to));
