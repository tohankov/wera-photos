// 422 articles of sheet «Есть у GRN, нет у нас» -> list.json
const ExcelJS = require('exceljs'), fs = require('fs');
(async () => {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile('C:/Users/Techlight/Desktop/wera-photos/inventory/grn_compare.xlsx');
  const rows = []; wb.getWorksheet('Есть у GRN, нет у нас').eachRow((r, i) => { if (i > 1) rows.push({ article: String(r.getCell(1).value), name: String(r.getCell(2).value || ''), grn_price: r.getCell(3).value, grn_stock: String(r.getCell(4).value ?? ''), grn_url: r.getCell(5).value?.text || r.getCell(5).value }); });
  fs.writeFileSync(__dirname + '/list.json', JSON.stringify(rows, null, 1));
  const st = {}; for (const r of rows) st[r.grn_stock] = (st[r.grn_stock] || 0) + 1; console.log(rows.length, st);
})();
