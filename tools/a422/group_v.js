// inventory/group_v_proposal.xlsx: group В (74) — proposed section per article (existing one by product type, or a new one with UA/RU name). Nothing is created.
const ExcelJS = require('exceljs');
const rows = require('./classified.json').filter(r => r.group === 'В'), P = require('./price.json');
const RULES = [
  [/Ложемент|^WERA 99\d\d [A-E]\b/, '1055 Інструментальний візок та ложементи', 'существующий: там 60 ложементов'],
  [/Bit-Box 15 Impaktor|Bit-Box.*Impaktor/, '1087 Набори ударних біт Bit-Check Impaktor', 'существующий: ударные наборы бит'],
  [/Bit-Box/, 'НОВЫЙ: Біти та бітотримачі / Набори з бітами / Набори біт Bit-Box (20 біт одного розміру) — RU: Наборы бит Bit-Box (20 бит одного размера)', 'нет раздела для коробок по 15–20 бит одного размера'],
  [/Click-Torque XP/, 'НОВЫЙ: Динамометричний інструмент / Динамометричні ключі Click-Torque XP — RU: Динамометрические ключи Click-Torque XP', 'новая линейка XP, у нас нет'],
  [/7761|7762|7763/, '1221 Серія динамометричних ключів Click-Torque для змінних інструментів', 'проверить: по названию даташита — Click-Torque серии 7760'],
  [/Ремкомплект|9523|9919|9925|9926/, 'НОВЫЙ: Динамометричний інструмент / Ремкомплекти та запчастини — RU: Ремкомплекты и запчасти', 'ремкомплекты некуда положить'],
  [/^WERA 9[4-6]\d\d|Мягкий|Складн|Сумка|Металлическая/, '1269 Сумки для інструментів Wera 2go', 'существующий: там 80 сумок и футляров'],
  [/1267 A/, '1101 Викрутки TORX® Kraftform Plus – серія 300', 'проверить: флажковые TORX-отвёртки, отдельного раздела нет'],
  [/велосипед|Bicycle/i, '1056 Інструменти для велосипедів та електробайків', 'существующий'],
  [/Tool-Check/, '1059 Набори Kraftform Kompakt', 'проверить: Tool-Check у нас в нескольких разделах'],
  [/календарь/i, '1267 Новинки і лімітовані серії', 'существующий: там календарь 2024'],
];
(async () => {
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Группа В (74)');
  ws.columns = [['article', 'Артикул', 14], ['name', 'Название (даташит WERA)', 70], ['price', 'Цена', 9], ['section', 'Предложенный раздел', 80], ['note', 'Почему', 45], ['wera', 'wera.de', 10], ['ds', 'Даташит', 9]].map(([key, header, width]) => ({ key, header, width }));
  const cnt = {};
  for (const r of rows) {
    const hit = RULES.find(([re]) => re.test(r.name)) || [null, r.name.includes('нет даташита') ? 'нужны данные: нет даташита WERA' : 'ВРУЧНУЮ', ''];
    ws.addRow({ article: r.article, name: r.name, price: P[r.article]?.price ?? '', section: hit[1], note: hit[2], wera: r.page, ds: r.datasheet });
    cnt[hit[1]] = (cnt[hit[1]] || 0) + 1;
  }
  ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; ws.autoFilter = { from: 'A1', to: { row: 1, column: 7 } };
  const s = wb.addWorksheet('Итог'); s.columns = [{ header: 'Раздел', key: 'k', width: 100 }, { header: 'Кол-во', key: 'v', width: 8 }];
  for (const [k, v] of Object.entries(cnt).sort((a, b) => b[1] - a[1])) s.addRow({ k, v });
  await wb.xlsx.writeFile('C:/Users/Techlight/Desktop/wera-photos/inventory/group_v_proposal.xlsx');
  console.log(cnt);
})();
