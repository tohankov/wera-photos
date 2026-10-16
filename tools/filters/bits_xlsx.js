// inventory/filters_bits_preview.xlsx from filters/bits_values.json (run bits_analyze.js first). Read-only.
const X = require('xlsx'); const R = require('./bits_values.json'); const live = Object.fromEntries(require('./bits_live.json').map(p => [p.article, p]));
const bits = R.filter(r => r.isBit);
const len = (v, l) => v == null ? '' : `${String(v).replace('.', ',')} мм`;
const FILTERS = [
  ['Профіль', 'Профиль', r => r.profile ? [r.profile] : []],
  ['Розмір', 'Размер', r => r.size ? [[r.size, r.size]] : []],
  ['Довжина', 'Длина', r => r.length != null ? [[len(r.length), len(r.length)]] : []],
  ['Тип біти', 'Тип биты', r => r.type ? [r.type] : []],
  ['Хвостовик', 'Хвостовик', r => r.shank ? [r.shank] : []],
  ['Особливості', 'Особенности', r => r.features.filter(f => /Алмаз|Нержав|Кульков|фіксуюч|^Магнітна/.test(f[0]))],
];
const wb = X.utils.book_new();
// 1 full layout
const head = ['Артикул', 'Название UA', 'Раздел', 'Профіль', 'Розмір', 'Довжина', 'Тип біти', 'Хвостовик', 'Особливості', 'Серия (справочно, не фильтр)', 'Источник: размер', 'Источник: длина', 'Источник: хвостовик', 'Источник: тип', 'Конфликт данных', 'Ссылка'];
const rows = bits.map(r => [r.a, r.title, `${r.sec} ${r.secName}`, r.profile?.[0] || '', r.size || '', len(r.length), r.type?.[0] || '', r.shank?.[0] || '', FILTERS[5][2](r).map(f => f[0]).join('; '), r.series || '', r.src.size || '', r.src.length || '', r.src.shank || '', r.src.type || '', r.conflicts.join('; '), live[r.a]?.link || '']);
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([head, ...rows]), 'Раскладка (900 бит)');
// 2 values per filter
const vrows = [['Фильтр UA', 'Фильтр RU', 'Значение UA', 'Значение RU', 'Бит']];
for (const [ua, ru, get] of FILTERS) { const c = new Map(); for (const r of bits) for (const v of get(r)) { const k = v[0]; c.set(k, { ru: v[1], n: (c.get(k)?.n || 0) + 1 }); }
  const sorted = [...c.entries()].sort((a, b) => ua === 'Довжина' ? parseFloat(a[0].replace(',', '.')) - parseFloat(b[0].replace(',', '.')) : b[1].n - a[1].n);
  for (const [k, v] of sorted) vrows.push([ua, ru, k, v.ru, v.n]); vrows.push([]); }
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(vrows), 'Значения фильтров');
// 3 coverage
const cov = [['Фильтр', 'Заполнено', '%', 'Откуда берётся']];
const pct = f => { const n = bits.filter(r => f(r)).length; return [n, Math.round(n / bits.length * 1000) / 10]; };
cov.push(['Профіль', ...pct(r => r.profile), 'раздел (подраздел = профиль); для раздела 1459 Micro — из названия']);
cov.push(['Розмір', ...pct(r => r.size), 'название (нормализовано); сверено с таблицей серии у 660 бит — расхождений нет']);
cov.push(['Довжина', ...pct(r => r.length != null), `таблица серии ${bits.filter(r => r.src.length === 'таблица серии').length}, название ${bits.filter(r => r.src.length === 'название').length}`]);
cov.push(['Тип біти', ...pct(r => r.type), `ударная/торсионная — по словам в названии, серии, описании (${bits.filter(r => !/умолчанию/.test(r.src.type)).length}); остальные «Стандартна» по умолчанию (${bits.filter(r => /умолчанию/.test(r.src.type)).length})`]);
cov.push(['Хвостовик', ...pct(r => r.shank), 'описание (хвостовик 1/4″ / 5/16″ / Halfmoon / HIOS / резьба) и название']);
cov.push(['Особливості', ...pct(r => FILTERS[5][2](r).length), 'название, серия, начало описания; у остальных признаков нет — значение не ставится (это нормально)']);
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(cov), 'Заполняемость');
// 4 data problems
const prob = [['Артикул', 'Название', 'Проблема', 'Что сделать']];
for (const r of bits) { if (!r.size) prob.push([r.a, r.title, 'размер не указан в названии и нет таблицы', 'уточнить по даташиту WERA']); for (const c of r.conflicts) prob.push([r.a, r.title, c, 'проверить по даташиту и исправить название']); }
for (const r of R.filter(r => !r.isBit)) prob.push([r.a, r.title, `не бита, но лежит в разделе ${r.sec} ${r.secName}`, 'не заполнять фильтры бит (или убрать из 1459)']);
X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(prob), 'Проблемы данных');
X.writeFile(wb, 'C:/Users/Techlight/Desktop/wera-photos/inventory/filters_bits_preview.xlsx');
console.log('rows', rows.length, 'values', vrows.length, 'problems', prob.length - 1);
console.log(cov.map(r => r.join(' | ')).join('\n'));
