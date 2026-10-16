// Final filter values for the bits pilot (decision 15.10.2026): Профіль, Розмір (size only, no profile), Довжина, Тип біти, Хвостовик, Особливості.
// Input: filters/bits_values.json (bits_analyze.js) + fixes confirmed by WERA datasheets. Output: filters/bits_final.json, sorted value lists,
// inventory/filters_bits_preview.xlsx. Read-only.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const R = require('./bits_values.json'); const live = Object.fromEntries(require('./bits_live.json').map(p => [p.article, p]));
const PROF = { 1079: ['PH (Phillips)', 'PH (Phillips)'], 1080: ['PZ (Pozidriv)', 'PZ (Pozidriv)'], 1075: ['PlusMinus (PH/PZ + шліц)', 'PlusMinus (PH/PZ + шлиц)'], 1071: ['SL (шліц)', 'SL (шлиц)'],
  1073: ['HEX (шестигранник)', 'HEX (шестигранник)'], 1074: ['HEX BO (шестигранник з отвором)', 'HEX BO (шестигранник с отверстием)'], 1069: ['TX (TORX®)', 'TX (TORX®)'], 1070: ['TX BO (TORX® з отвором)', 'TX BO (TORX® с отверстием)'],
  1068: ['IPR (TORX PLUS® IPR)', 'IPR (TORX PLUS® IPR)'], 1067: ['IP (TORX PLUS®)', 'IP (TORX PLUS®)'], 1066: ['TORQ-SET® Mplus', 'TORQ-SET® Mplus'], 1078: ['Торцева головка (зовнішній шестигранник)', 'Торцевая головка (наружный шестигранник)'],
  1063: ['XZN (багатозубцевий)', 'XZN (многозубчатый)'], 1065: ['Microstix®', 'Microstix®'], 1072: ['Квадрат (Robertson)', 'Квадрат (Robertson)'], 1076: ['TRI-WING®', 'TRI-WING®'], 1077: ['Spanner (натяжні гвинти)', 'Spanner (натяжные винты)'] };
const STUD = ['Для шпильок (шпилькокрут)', 'Для шпилек (шпилькокрут)'];
const SHANK_FIX = { '4 мм Micro': ['Шестигранник 4 мм (Micro)', 'Шестигранник 4 мм (Micro)'] }; // WERA datasheets 8xx/0 Micro: «Шестигранный хвостовик 4 мм» — neither Halfmoon nor HIOS
const FIX = { // confirmed by WERA datasheets (batch/ds)
  '05066860001': { size: 'm', why: 'даташит 872/21: «Microstix®, m x 40 мм»' },
  '05066850001': { size: 'm', why: 'даташит 872/9: «Microstix®, m x 44 мм»' },
};
// size without the profile; one shared dictionary
function sizeOnly(r) {
  const s = r.size; if (!s) return null;
  if (/^шпилька M/.test(s)) return s.replace('шпилька ', '');
  if (/^SW /.test(s)) return s.slice(3);                    // sockets: «8 мм», «1/4″»
  if (/^(PH|PZ) \d+ \/ SL$/.test(s)) return s.split(' ')[1];   // PlusMinus
  if (/^Microstix /.test(s)) return s.slice(10);
  if (/^\d+ мм$/.test(s) && r.sec === 1077) return s.replace(' мм', ''); // Spanner size is a number without unit (series table 857/4 Z)
  return s.replace(/^(PH|PZ|TX|HEX|SL|TORQ-SET|TRI-WING|XZN) /, '').replace(/^#/, '').replace(/ (IP|IPR)$/, '');
}
// ascending order: 000 < 00 < 0 < 1 …; decimals by value; «мм» values by value; threads M…; inch values by size; letters last
function sortKey(v) {
  if (/^0{2,3}$/.test(v)) return [0, -v.length];
  let m = v.match(/^(\d+(?:,\d+)?)( мм)?$/); if (m) return [0, parseFloat(m[1].replace(',', '.')), m[2] ? 2 : /,/.test(m[1]) ? 1 : 0];
  m = v.match(/^M(\d+)$/); if (m) return [1, +m[1]];
  m = v.match(/^(\d+)\/(\d+)″$/); if (m) return [2, m[1] / m[2]];
  m = v.match(/^(\d+(?:,\d+)?)″$/); if (m) return [2, parseFloat(m[1].replace(',', '.'))];
  return [3, v];
}
const cmp = (a, b) => { const x = sortKey(a), y = sortKey(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if (x[i] === y[i]) continue; if (x[i] === undefined) return -1; if (y[i] === undefined) return 1; return x[i] < y[i] ? -1 : 1; } return 0; };
const lenTxt = l => `${String(l).replace('.', ',')} мм`;
const FEAT_KEEP = /Алмаз|Нержав|Кульков|фіксуюч|^Магнітна/;
const out = [], gaps = [], notBits = [];
for (const r of R) {
  const p = live[r.a]; const secs = [p.parent.id, ...(p.alt_parent || []).map(x => x.id)];
  if (!r.isBit) { notBits.push({ a: r.a, title: r.title, main: p.parent.id, mainName: p.parent.value, alt: (p.alt_parent || []).map(x => x.id) }); continue; }
  const f = FIX[r.a] || {};
  const prof = /шпилька/.test(r.size || '') ? STUD : PROF[r.sec] || r.profile;
  const v = { a: r.a, title: r.title, sec: r.sec, secs, profile: prof, size: f.size || sizeOnly(r), length: r.length != null ? lenTxt(r.length) : null,
    type: r.type ? [r.type[0].replace(/ \(.+\)$/, '').replace('Ударна', 'Ударна (Impaktor)'), r.type[1].replace(/ \(.+\)$/, '').replace('Ударная', 'Ударная (Impaktor)')] : null,
    shank: r.shank ? (SHANK_FIX[r.shank[0]] || r.shank) : null, features: r.features.filter(x => FEAT_KEEP.test(x[0])), conflicts: r.conflicts, fix: f.why || '' };
  for (const k of ['profile', 'size', 'length', 'type', 'shank']) if (!v[k]) gaps.push({ a: r.a, sec: r.sec, what: k, title: r.title });
  out.push(v);
}
fs.writeFileSync(path.join(__dirname, 'bits_final.json'), JSON.stringify({ items: out, gaps, notBits }, null, 1));
// value lists
const list = (get, sort) => { const c = new Map(); for (const v of out) for (const x of get(v)) { const k = Array.isArray(x) ? x[0] : x; c.set(k, { ru: Array.isArray(x) ? x[1] : x, n: (c.get(k)?.n || 0) + 1 }); } const e = [...c.entries()]; return sort ? e.sort((a, b) => sort(a[0], b[0])) : e.sort((a, b) => b[1].n - a[1].n); };
const L = {
  'Профіль': list(v => [v.profile]), 'Розмір': list(v => v.size ? [v.size] : [], cmp), 'Довжина': list(v => v.length ? [v.length] : [], (a, b) => parseFloat(a.replace(',', '.')) - parseFloat(b.replace(',', '.'))),
  'Тип біти': list(v => [v.type]), 'Хвостовик': list(v => [v.shank]), 'Особливості': list(v => v.features) };
fs.writeFileSync(path.join(__dirname, 'bits_lists.json'), JSON.stringify(L, null, 1));
// per subsection: profiles and sizes present
const bySec = {}; for (const v of out) for (const s of v.secs) { (bySec[s] = bySec[s] || { n: 0, prof: new Set(), size: new Set() }); bySec[s].n++; bySec[s].prof.add(v.profile[0]); if (v.size) bySec[s].size.add(v.size); }
// xlsx
const wb = X.utils.book_new();
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Название', 'Основной раздел', 'Все разделы бит', 'Профіль', 'Розмір', 'Довжина', 'Тип біти', 'Хвостовик', 'Особливості', 'Поправка по даташиту', 'Противоречие в данных', 'Ссылка'],
  ...out.map(v => [v.a, v.title, v.sec, v.secs.join(', '), v.profile[0], v.size || '', v.length || '', v.type[0], v.shank[0], v.features.map(x => x[0]).join('; '), v.fix, v.conflicts.join('; '), live[v.a].link])]), 'Раскладка');
const rows = [['Фильтр', 'Порядок', 'Значение UA', 'Значение RU', 'Бит']]; for (const [k, e] of Object.entries(L)) { e.forEach(([ua, x], i) => rows.push([k, i + 1, ua, x.ru, x.n])); rows.push([]); }
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(rows), 'Значения (порядок фильтра)');
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Раздел', 'Товаров', 'Профилей', 'Профили', 'Размеров'], ...Object.entries(bySec).sort((a, b) => b[1].n - a[1].n).map(([s, x]) => [s, x.n, x.prof.size, [...x.prof].join(' | '), x.size.size])]), 'По подразделам');
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Раздел', 'Чего не хватает', 'Название'], ...gaps.map(g => [g.a, g.sec, g.what, g.title])]), 'Пропуски');
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Название', 'Основной раздел', 'alt_parent'], ...notBits.map(n => [n.a, n.title, `${n.main} ${n.mainName}`, n.alt.join(', ')])]), 'Не биты');
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Название', 'Что', 'Источник'], ['05134706001', live['05134706001'].title.ua, 'длина 35 мм, в названии 25 мм — название неверное', 'даташит WERA 867/1 IPR: «40 IPR x 35 мм»'], ['05134707001', live['05134707001'].title.ua, 'длина 35 мм, в названии 25 мм — название неверное', 'даташит WERA 867/1 IPR: «45 IPR x 35 мм»'],
  ['05066860001', live['05066860001'].title.ua, 'размер m (в названии нет)', 'даташит 872/21'], ['05066850001', live['05066850001'].title.ua, 'размер m (в названии нет)', 'даташит 872/9'], ['20 бит 8xx/0 Micro', '', 'хвостовик: шестигранник 4 мм (не Halfmoon, не HIOS)', 'даташиты WERA: «Шестигранный хвостовик 4 мм»']]), 'Проблемы данных');
X.writeFile(wb, 'C:/Users/Techlight/Desktop/wera-photos/inventory/filters_bits_preview.xlsx');
console.log('items', out.length, 'gaps', gaps.length, 'notBits', notBits.length);
for (const [k, e] of Object.entries(L)) console.log(`\n## ${k} (${e.length}): ` + e.map(([ua, x]) => `${ua} — ${x.n}`).join(' · '));
console.log('\n## по подразделам:'); for (const [s, x] of Object.entries(bySec)) console.log(s, x.n, 'профилей', x.prof.size, [...x.prof].join(' | '));
console.log('\nnot bits', JSON.stringify(notBits)); console.log('gaps', JSON.stringify(gaps));
