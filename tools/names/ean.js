// EAN preview (nothing is written to the site): products without a barcode (gtin) -> EAN from the WERA datasheet (batch/ds, hybris ru datasheet).
// Checks: EAN-13 check digit, the datasheet's «№ детали» = our article, several different EANs in one datasheet, one EAN on several products
// (found ones and barcodes already on the site). -> inventory/ean_preview.xlsx (Найдено, Проблемы)
const X = require('xlsx'), path = require('path'); const C = require('./catalog.json'); const ds = require('./ds.js');
const INV = path.join(__dirname, '../../inventory/'); const SRC = a => `WERA datasheet hybris-media.wera.de/download/pdfgenerator-datasheets/ru/${a}.pdf`;
const okDigit = e => { if (!/^\d{13}$/.test(e)) return false; const d = e.split('').map(Number); const s = d.slice(0, 12).reduce((t, v, i) => t + v * (i % 2 ? 3 : 1), 0); return (10 - s % 10) % 10 === d[12]; };
const found = [], prob = []; const owner = {}; // EAN -> articles (site barcodes + found)
for (const p of C) if (p.gtin) (owner[String(p.gtin)] = owner[String(p.gtin)] || []).push({ a: p.article, how: 'штрихкод на сайте' });
let withGtin = 0;
for (const p of C) { const a = p.article, t = p.title.ua; if (p.gtin) { withGtin++; continue; }
  if (!/^\d{11}$/.test(a)) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'не найден', 'Подробности': 'не артикул WERA (товар магазина) — EAN у WERA нет' }); continue; }
  const d = ds(a); if (!d) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'не найден', 'Подробности': 'datasheet WERA (ru) не скачивается — товара нет в базе WERA или снят' }); continue; }
  const eans = [...new Set(d.eans)];
  if (!eans.length) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'не найден', 'Подробности': 'в datasheet WERA нет строки EAN' }); continue; }
  if (d.part && d.part !== a) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'конфликт', 'Подробности': `datasheet относится к другому № детали: ${d.part}`, 'EAN': eans.join(', ') }); continue; }
  if (eans.length > 1) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'конфликт', 'Подробности': `в datasheet несколько разных EAN: ${eans.join(', ')}`, 'EAN': eans.join(', ') }); continue; }
  const e = eans[0]; if (!okDigit(e)) { prob.push({ 'Артикул': a, 'Название': t, 'Проблема': 'неверная контрольная цифра', 'Подробности': `EAN ${e} не проходит проверку EAN-13`, 'EAN': e }); continue; }
  (owner[e] = owner[e] || []).push({ a, how: 'найден в datasheet' }); found.push({ 'Артикул': a, 'Название': t, 'EAN': e, 'Источник': SRC(a) }); }
// one EAN on several products
const dup = new Set(); for (const [e, o] of Object.entries(owner)) { const arts = [...new Set(o.map(x => x.a))]; if (arts.length < 2) continue; dup.add(e);
  for (const x of o.filter(x => x.how === 'найден в datasheet')) prob.push({ 'Артикул': x.a, 'Название': (C.find(p => p.article === x.a) || {}).title.ua, 'Проблема': 'один EAN у разных товаров', 'Подробности': `${e} также у: ${o.filter(y => y.a !== x.a).map(y => `${y.a} (${y.how})`).join(', ')}`, 'EAN': e }); }
// barcodes already on the site: wrong check digit / used twice (for information — they are not changed)
for (const p of C.filter(p => p.gtin)) { const e = String(p.gtin); const d = /^\d{11}$/.test(p.article) ? ds(p.article) : null;
  if (d && d.eans.length && !d.eans.includes(e)) prob.push({ 'Артикул': p.article, 'Название': p.title.ua, 'Проблема': 'конфликт (штрихкод уже на сайте)', 'Подробности': `на сайте ${e}, в datasheet WERA ${[...new Set(d.eans)].join(', ')}`, 'EAN': e });
  if (!okDigit(e)) prob.push({ 'Артикул': p.article, 'Название': p.title.ua, 'Проблема': 'неверная контрольная цифра (штрихкод уже на сайте)', 'Подробности': `штрихкод ${e} не проходит проверку EAN-13`, 'EAN': e });
  else if (dup.has(e) && owner[e].every(x => x.how === 'штрихкод на сайте')) prob.push({ 'Артикул': p.article, 'Название': p.title.ua, 'Проблема': 'один EAN у разных товаров (штрихкоды уже на сайте)', 'Подробности': `${e} также у: ${owner[e].filter(y => y.a !== p.article).map(y => y.a).join(', ')}`, 'EAN': e }); }
const F = found.filter(f => !dup.has(f['EAN']));
const wb = X.utils.book_new(); const add = (r, n, w) => { const ws = X.utils.json_to_sheet(r); ws['!cols'] = w.map(x => ({ wch: x })); X.utils.book_append_sheet(wb, ws, n); };
add(F, 'Найдено', [14, 80, 16, 90]); add(prob, 'Проблемы', [14, 70, 34, 90, 16]); X.writeFile(wb, INV + 'ean_preview.xlsx');
const by = {}; for (const r of prob) by[r['Проблема'] + (r['Проблема'] === 'не найден' ? ': ' + r['Подробности'].split(' — ')[0] : '')] = (by[r['Проблема'] + (r['Проблема'] === 'не найден' ? ': ' + r['Подробности'].split(' — ')[0] : '')] || 0) + 1;
console.log({ total: C.length, withGtin, without: C.length - withGtin, found: F.length, problems: prob.length }); console.log(by);
