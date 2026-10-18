// PREVIEW ONLY (nothing is written to the site): «Опис для маркетплейсів» (marketplace_description) UA/RU as clean text from the current product description.
// node gm/mdesc.js <catalog export json with article, mod_title, description> [article ...]  -> inventory/gm_marketplace_desc_preview.xlsx + the given examples printed.
// Logic: the text paragraphs, «Застосування / Привід / Виконання …» lines and bullet lists are kept; the series table «Інші варіанти серії …» is dropped, but this product's
// own row of it is kept as «Характеристики» (column name: value, footnote marks removed); dropped too: icons, links, the paragraph with «Натисніть на артикул…» (it also holds the table footnotes), «Дізнайтеся більше про цей товар» and the PDF link.
// HTML -> plain text with line breaks, entities decoded, ≤5000 characters (cut at the last full sentence/line before the limit), GRN must not occur.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const ENT = { nbsp: ' ', amp: '&', quot: '"', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', times: '×', deg: '°', reg: '®', trade: '™', copy: '©', prime: '′', Prime: '″', frac12: '½', frac14: '¼', frac34: '¾', plusmn: '±', lt: '<', gt: '>', apos: "'" };
const dec = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m);
const txt = h => dec(h.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
function ownRow(table) {   // this product's row of the series table -> [[label, value]]
  const th = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => { const unit = (m[1].match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1]; const label = txt(m[1].replace(/<span[^>]*>[\s\S]*?<\/span>/g, ''));
    return unit ? `${label}, ${txt(unit)}` : label; });
  const row = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => m[1]).find(r => /цей товар|этот товар/.test(r)); if (!row) return [];
  const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => txt(m[1].replace(/<br\s*\/?>[\s\S]*$/, '')));
  return th.map((l, i) => [l, td[i]]).filter(([l, v], i) => i > 0 && v && v !== '-' && v !== '–');
}
function clean(html, lang) {
  if (!html) return '';
  let h = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<img[^>]*>/gi, '');
  const tables = [...h.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0].replace(/<sup[^>]*>\s*\d\)?\s*<\/sup>/gi, ''));   // footnote marks
  const own = tables.flatMap(ownRow);
  h = h.replace(/\[embed\][\s\S]*?\[\/embed\]/gi, '');                                                 // YouTube embeds
  h = h.replace(/<h3[^>]*>[\s\S]*?<\/h3>/gi, '').replace(/<table[\s\S]*?<\/table>/gi, '');
  h = h.replace(/<a[^>]*href="[^"]*\.pdf"[^>]*>[\s\S]*?<\/a>/gi, '');                                   // datasheet link
  const out = [];
  for (const m of h.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi)) { const t = txt(m[2]); if (!t) continue;
    if (/Натисніть на артикул|Нажмите на артикул|^(Завантажити технічний паспорт|Скачать технический паспорт)/i.test(t)) continue;   // the table's footnotes «1) … 2) …» share this paragraph
    out.push(m[1].toLowerCase() === 'li' ? '– ' + t : t); }
  if (own.length) out.push((lang === 'ru' ? 'Характеристики:' : 'Характеристики:'), ...own.map(([l, v]) => `${l}: ${v}`));
  let s = out.join('\n');
  if (s.length > 5000) { const cut = s.slice(0, 5000); const i = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. ') + 1); s = cut.slice(0, i > 3000 ? i : 5000).trim(); }
  if (/grn/i.test(s.replace(/\d\s*грн/gi, ''))) throw new Error('GRN in text');
  return s;
}
module.exports = { clean };
if (require.main === module) {
  const [file, ...show] = process.argv.slice(2); const all = require(path.resolve(file)); const rows = [];
  for (const p of all) { const ua = clean(p.description?.ua, 'ua'), ru = clean(p.description?.ru, 'ru');
    rows.push({ 'Артикул': p.article, 'Название': p.mod_title?.ua, 'Видимый': p.display_in_showcase, 'UA символов': ua.length, 'RU символов': ru.length, 'Опис для маркетплейсів UA': ua, 'Описание для маркетплейсов RU': ru }); }
  const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 60, 8, 10, 10, 100, 100].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Опис для маркетплейсів');
  X.writeFile(wb, path.join(__dirname, '../../inventory/gm_marketplace_desc_preview.xlsx'));
  const len = rows.flatMap(r => [r['UA символов'], r['RU символов']]); console.log('products', rows.length, 'empty UA', rows.filter(r => !r['UA символов']).length, 'max', Math.max(...len), 'over 5000', len.filter(x => x > 5000).length, 'with Характеристики', rows.filter(r => /Характеристики:/.test(r['Опис для маркетплейсів UA'])).length);
  for (const a of show) { const r = rows.find(x => x['Артикул'] === a); console.log(`\n===== ${a} ${r['Название']}\n--- UA (${r['UA символов']}):\n${r['Опис для маркетплейсів UA']}\n--- RU (${r['RU символов']}):\n${r['Описание для маркетплейсов RU']}`); }
}
