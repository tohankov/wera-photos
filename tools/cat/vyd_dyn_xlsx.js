// Owner 22.10.2026 (docs/report_1022.md item 3): torque sets of «Викрутки», Kraftform Kompakt, «Діелектричні» -> one kind «Набір з динамометричним інструментом».
// Table for the report: kind before / after, every section of the product with its storefront filters, the torque row of the WERA datasheet.
//   node cat/vyd_dyn_xlsx.js  (after cat/vyd_1022.js <live> vyd_dyn)  -> inventory/vyd_dyn.xlsx
const X = require('xlsx'), path = require('path'); const C = require('./vyd_comp.js'); const R = require('./vyd_dyn_rows.json'); const M = require('../../inventory/sections_map.json');
const P = new Set(require('./vyd_dyn_plan.json').products.map(x => x.article));
const rows = R.filter(r => P.has(r.a)).map(r => ({ Артикул: r.a, Назва: r.title, Було: r.now, Стало: r.to, Правило: r.rule,
  'Динамометричний інструмент у складі WERA': (C.COMP[r.a] || []).filter(g => C.ctype(g.head) === 'dyn').map(g => g.head.replace(/\s+/g, ' ')).join('; '),
  'Розділи (фільтри вітрини)': r.secIds.map((id, i) => `${r.secs[i]}${(M.sections[id] || {}).filters && M.sections[id].filters.length ? ' [' + M.sections[id].filters.join(', ') + ']' : ' [фільтрів немає]'}`).join('\n') }));
const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows), 'Набори'); X.writeFile(wb, path.join(__dirname, '../../inventory/vyd_dyn.xlsx')); console.log('rows', rows.length);
