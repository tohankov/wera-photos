// tl-shop <-> grn-tools.com.ua (site crawl only, no price list) -> inventory/grn_compare.xlsx with three sheets. Read-only.
// Names for articles we do not sell come from the WERA datasheet title (ru), never from GRN.
// node compare2.js   (needs grn/ours.json = fresh export of our catalog)
const fs = require('fs');
const ExcelJS = require('exceljs');
const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/', BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const DC = __dirname + '/../inv/dcache/';
const prog = JSON.parse(fs.readFileSync(INV + 'grn_progress.json', 'utf8'));
const site = prog.rows;
const ours = {}; for (const p of require('./ours.json')) ours[p.article] = p;
const tieOld = new Set(require(BK + 'tie_before.json').products.map(p => p.article));
const ourLink = p => `https://tl-shop.com.ua/${p.slug}/`;
async function wTitle(a) { // WERA datasheet title (cached in inv/dcache by ds_fetch.mjs, or fetched here)
  const f = DC + a + '.json';
  if (fs.existsSync(f)) { const j = JSON.parse(fs.readFileSync(f)); if (j.title) return j.title; if (j.status && j.status !== 200) return ''; }
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  try {
    const r = await fetch(`https://hybris-media.wera.de/download/pdfgenerator-datasheets/ru/${a}.pdf`);
    if (r.status !== 200) { fs.writeFileSync(f, JSON.stringify({ article: a, status: r.status })); return ''; }
    const doc = await getDocument({ data: new Uint8Array(await r.arrayBuffer()), verbosity: 0 }).promise;
    const tc = await (await doc.getPage(1)).getTextContent();
    const title = tc.items.filter(i => i.str.trim() && i.transform[5] > 800).map(i => i.str.trim()).join(' ');
    await doc.destroy();
    fs.writeFileSync(f, JSON.stringify({ article: a, status: 200, title, titleOnly: true }));
    return title;
  } catch (e) { return ''; }
}
(async () => {
  const A = Object.keys(site).filter(a => !ours[a]).sort();
  const names = {}; const q = [...A];
  await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) { const a = q.shift(); names[a] = await wTitle(a); } }));
  const s1 = A.map(a => ({ article: a, name: names[a] ? 'WERA ' + names[a] : '(нет даташита WERA)', grn_price: site[a].price, grn_stock: site[a].stock, grn_url: site[a].url }));
  const B = Object.keys(ours).filter(a => !site[a]).sort();
  const s2 = B.map(a => ({ article: a, title: ours[a].title?.ua || '', our_price: ours[a].price, our_url: ourLink(ours[a]), note: tieOld.has(a) ? 'исключение — старая конфигурация на складе' : '' }));
  const both = Object.keys(ours).filter(a => site[a] && site[a].price !== '' && site[a].price != null);
  const s3 = both.filter(a => +site[a].price !== +ours[a].price).sort().map(a => { const o = +ours[a].price, g = +site[a].price; return { article: a, our_price: o, grn_price: g, diff_uah: o - g, diff_pct: Math.round((o - g) / g * 1000) / 10, our_url: ourLink(ours[a]), grn_url: site[a].url }; });
  const noPrice = Object.keys(ours).filter(a => site[a] && (site[a].price === '' || site[a].price == null));
  const wb = new ExcelJS.Workbook();
  const add = (name, rows, cols) => { const ws = wb.addWorksheet(name); ws.columns = cols.map(([key, header, width]) => ({ key, header, width })); rows.forEach(r => ws.addRow(r)); ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; ws.autoFilter = { from: 'A1', to: { row: 1, column: cols.length } }; };
  add('Есть у GRN, нет у нас', s1, [['article', 'Артикул', 14], ['name', 'Название (WERA, даташит)', 70], ['grn_price', 'Цена GRN, грн', 14], ['grn_stock', 'Наличие GRN', 22], ['grn_url', 'Ссылка GRN', 50]]);
  add('Есть у нас, нет у GRN', s2, [['article', 'Артикул', 14], ['title', 'Наше название', 80], ['our_price', 'Наша цена, грн', 14], ['our_url', 'Наш товар', 60], ['note', 'Примечание', 40]]);
  add('Разница в цене', s3, [['article', 'Артикул', 14], ['our_price', 'Наша цена, грн', 14], ['grn_price', 'Цена GRN, грн', 14], ['diff_uah', 'Разница, грн', 13], ['diff_pct', 'Разница, %', 11], ['our_url', 'Наш товар', 60], ['grn_url', 'Товар GRN', 50]]);
  await wb.xlsx.writeFile(INV + 'grn_compare.xlsx');
  const sum = { at: new Date().toISOString(), grnWera: Object.keys(site).length, grnPagesDone: prog.done.length, grnQueueLeft: prog.queue.length, ours: Object.keys(ours).length,
    sheet1: s1.length, sheet1NoDatasheet: s1.filter(r => r.name.startsWith('(')).length, sheet2: s2.length, sheet2TIE: s2.filter(r => r.note).length,
    bothWithGrnPrice: both.length, bothWithoutGrnPrice: noPrice.length, sheet3: s3.length, sheet3OursHigher: s3.filter(r => r.diff_uah > 0).length, sheet3OursLower: s3.filter(r => r.diff_uah < 0).length };
  fs.writeFileSync(INV + 'grn_summary.json', JSON.stringify(sum, null, 1));
  console.log(JSON.stringify(sum, null, 1));
})();
