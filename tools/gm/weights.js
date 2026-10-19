// PREVIEW (nothing written): weight of every visible product from its WERA datasheet (tools/batch/ds/<article>.txt, «Вес: … g/kg»), the Nova Poshta parcel band
// and rate -> inventory/gm_weights.xlsx (sheets: Ваги, Понад 10 кг, Зведення). The site has no weight (novapost_actual_weight = 0 everywhere, 19.10.2026).
//   node gm/weights.js <live export json with article, title, display_in_showcase, novapost_actual_weight, link>
const fs = require('fs'), path = require('path'), X = require('xlsx'); const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const vis = L.filter(p => +p.display_in_showcase === 1); const BAND = [[2000, 'до 2 кг', 90], [10000, 'до 10 кг', 135], [30000, 'до 30 кг', 200], [Infinity, 'понад 30 кг — вантаж', null]];
const rows = vis.map(p => { const f = path.join(__dirname, '../batch/ds', p.article + '.txt'); let g = null;
  if (fs.existsSync(f)) { const m = fs.readFileSync(f, 'utf8').match(/Вес:\s*\|?\s*([\d.,\s]+)\s*(kg|g|кг|г)\b/); if (m) { g = parseFloat(m[1].replace(/\s/g, '').replace(',', '.')); if (/k|кг/.test(m[2])) g *= 1000; } }
  const b = g == null ? null : BAND.find(x => g <= x[0]);
  return { 'Артикул': p.article, 'Назва': p.title.ua, 'Вага WERA, г': g, 'Вага на сайті (НП), кг': +p.novapost_actual_weight || 0, 'Посилка НП': b ? b[1] : 'ваги немає', 'Тариф НП по Україні, грн': b ? b[2] : null,
    'Близько до межі (≥90% межі)': g != null && b && b[0] !== Infinity && g >= 0.9 * b[0] ? 'так' : '', 'Посилання': p.link || '' }; });
const cnt = k => rows.filter(r => r['Посилка НП'] === k).length;
const sum = [['Видимих товарів', vis.length], ['Вага заповнена на сайті (novapost_actual_weight > 0)', rows.filter(r => r['Вага на сайті (НП), кг'] > 0).length], ['Вага є в datasheet WERA', rows.filter(r => r['Вага WERA, г'] != null).length],
  ...BAND.map(b => [b[1] + (b[2] ? ` (${b[2]} грн)` : ''), cnt(b[1])]), ['Без ваги', cnt('ваги немає')], ['Близько до межі 2 / 10 / 30 кг (вага без упаковки ≥ 90% межі)', rows.filter(r => r['Близько до межі (≥90% межі)']).length]];
const wb = X.utils.book_new(); const add = (r, n, w) => { const ws = Array.isArray(r[0]) ? X.utils.aoa_to_sheet(r) : X.utils.json_to_sheet(r); ws['!cols'] = w.map(x => ({ wch: x })); X.utils.book_append_sheet(wb, ws, n); };
add(sum, 'Зведення', [70, 10]); add(rows.filter(r => (r['Вага WERA, г'] || 0) > 10000 || r['Посилка НП'] === 'ваги немає'), 'Понад 10 кг і без ваги', [14, 80, 12, 12, 22, 12, 12, 60]); add(rows, 'Ваги', [14, 80, 12, 12, 22, 12, 12, 60]);
X.writeFile(wb, 'C:/Users/Techlight/Desktop/wera-photos/inventory/gm_weights.xlsx'); console.log(sum.map(r => r.join(': ')).join('\n'));
console.log('без ваги:', rows.filter(r => r['Посилка НП'] === 'ваги немає').map(r => r['Артикул']).join(' '));
