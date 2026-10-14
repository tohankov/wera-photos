// inventory/add_422_plan.xlsx from classified.json + price.json. Read-only analysis.
const ExcelJS = require('exceljs'), fs = require('fs');
const P = require('./price.json');
// no price anywhere -> own sheet, not part of А/Б/В for now
const rows = require('./classified.json').map(r => r.group !== 'Знятий' && P[r.article]?.price == null ? { ...r, groupBefore: r.group, group: 'Без цены' } : r);
const ours = Object.fromEntries(require('./ours.json').map(p => [p.article, p]));
(async () => {
  const wb = new ExcelJS.Workbook();
  const cols = [['article', 'Артикул', 14], ['name', 'Название (даташит WERA)', 60], ['group', 'Группа', 7], ['why', 'Почему в группе', 45], ['neighbours', 'Соседи у нас (артикулы)', 40],
    ['section', 'Наш раздел (по соседям)', 55], ['alt', 'Доп. разделы', 14], ['page', 'Страница wera.de', 11], ['datasheet', 'Даташит', 9], ['packshot', 'Packshot', 24],
    ['grn_price', 'Цена GRN', 10], ['rrp', 'РРЦ (half-up)', 11], ['price', 'Ставим цену', 11], ['rule', 'Правило цены', 30], ['grn_stock', 'Наличие GRN', 16], ['wera_url', 'wera.de', 50], ['grn_url', 'Товар GRN', 45]];
  const add = (name, list) => {
    const ws = wb.addWorksheet(name); ws.columns = cols.map(([key, header, width]) => ({ key, header, width }));
    for (const r of list) { const p = P[r.article] || {}; ws.addRow({ ...r, section: r.section ? r.section.parent + ' ' + r.section.parentName : '', alt: r.section ? r.section.alt.join(', ') : '', grn_price: p.grn ?? '', rrp: p.rrp ?? '', price: p.price ?? '', rule: p.rule + (p.pack > 1 ? ` (РРЦ за ${p.pack} шт → за 1)` : '') }); }
    ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; ws.autoFilter = { from: 'A1', to: { row: 1, column: cols.length } };
  };
  const by = g => rows.filter(r => r.group === g);
  add('А — серия с таблицей', by('А')); add('Б — серия без таблицы, похожие', by('Б')); add('В — новое', by('В')); add('Знятий з виробництва (GRN)', by('Знятий')); add('Без цены (не трогаем)', by('Без цены'));
  add('Цена = РРЦ вместо GRN', rows.filter(r => (P[r.article]?.rule || '').startsWith('РРЦ: GRN')));
  const s = wb.addWorksheet('Итог'); s.columns = [{ header: 'Показатель', key: 'k', width: 60 }, { header: 'Значение', key: 'v', width: 14 }];
  const cnt = (f) => rows.filter(f).length;
  for (const [k, v] of [['Всего на листе «Есть у GRN, нет у нас»', rows.length], ['Знятий з виробництва (GRN) — отдельно', by('Знятий').length], ['А — серия с таблицей у нас', by('А').length], ['Б — серия без таблицы / похожие', by('Б').length], ['В — новое', by('В').length], ['Без цены ни у GRN, ни в прайсе — отдельно, не трогаем', by('Без цены').length],
    ['Страница wera.de есть (А+Б+В)', cnt(r => 'АБВ'.includes(r.group) && r.page === 'да')], ['Даташит 200 (А+Б+В)', cnt(r => 'АБВ'.includes(r.group) && r.datasheet === 200)], ['Packshot свой (А+Б+В)', cnt(r => 'АБВ'.includes(r.group) && r.packshot.startsWith('свой'))],
    ['Цена = РРЦ (GRN ниже РРЦ)', cnt(r => (P[r.article]?.rule || '').startsWith('РРЦ: GRN'))], ]) s.addRow({ k, v });
  s.getRow(1).font = { bold: true };
  await wb.xlsx.writeFile('C:/Users/Techlight/Desktop/wera-photos/inventory/add_422_plan.xlsx'); console.log('saved');
})();
