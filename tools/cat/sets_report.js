// Per-set report of the composition fill -> inventory/filters_sets_report.xlsx. node cat/sets_report.js
const X = require('xlsx'), path = require('path'); const C = require('./sets_comp.json'), M = require('./member_vals.json');
const PFX = /^(PH|PZ|TX|IP) ?\d+ x \d+(?:[.,]\d+)? мм$/; const rows = [], sum = [];
for (const g of ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'bitsets']) { const G = require(`./g_${g}.js`); const sets = new Set(require('./sets_list.json')[g === 'bitsets' ? 'bitsets' : g] || []);
  const dis = new Map(G.disputed.filter(d => d.what === 'Состав набора').map(d => [d.a, d.why])); let n = 0, full = 0, part = 0;
  for (const it of G.items.filter(i => sets.has(i.a))) { n++; const comp = C[it.a] || []; const items = comp.flatMap(x => x.items.map(y => ({ ...y, head: x.head })));
    const unres = items.filter(y => !(y.art && M[y.art]) && !require('./sets_fill.js').fromText(y.head, y.size)); const res = items.length - unres.length;
    const status = dis.has(it.a) ? 'спорный' : !items.length ? (it.single ? 'из заголовка datasheet' : 'нет состава') : unres.length ? 'частично' : 'полностью'; if (status === 'полностью' || status === 'из заголовка datasheet') full++; if (status === 'частично') part++;
    rows.push({ 'Группа': g, 'Артикул': it.a, 'Название': it.title, 'Статус': status, 'Позиций в составе': items.length, 'Распознано': res, 'Не распознано': unres.map(y => (y.art || '') + ' ' + y.size + ' (' + y.head.slice(0, 40) + ')').join('; ').slice(0, 900),
      'Профіль': (it.vals.profil || []).join(', '), 'Причина (спорные)': dis.get(it.a) || '' }); }
  sum.push({ 'Группа': g, 'Наборов': n, 'Состав распознан полностью': full, 'Частично': part, 'Спорные': dis.size }); }
const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(sum), 'Итог'); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows), 'Наборы');
X.writeFile(wb, path.join('C:/Users/Techlight/Desktop/wera-photos/inventory', 'filters_sets_report.xlsx')); console.table(sum);
