// Shared helpers for adding group-А products: our variant-table blocks, slugs, product photos.
const C = { bg: '#191816', line: '#363434', green: '#1e9676', cur: '#16302a' };
const zebra = hex => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * 0.95 + 237 * 0.05).toString(16).padStart(2, '0')).join('');
const CUR = { ua: 'цей товар', ru: 'этот товар' };

// [before, tableBlock, after]; tableBlock = <h3>Інші варіанти…</h3><table>…</table><p …>hint</p>
function splitTable(html) {
  const i = html.search(/<h3>(Інші варіанти серії|Другие варианты серии)/); if (i < 0) return null;
  const j = html.indexOf('</table>', i) + 8; const k = html.indexOf('</p>', j) + 4;
  return [html.slice(0, i), html.slice(i, k), html.slice(k)];
}
const rowsOf = block => [...block.slice(block.indexOf('<tbody>')).matchAll(/<tr[^>]*><td[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/g)].map(m => ({ art: (m[1].replace(/<[^>]+>/g, ' ').match(/\b0\d{10}\b/) || [])[0], sup: (m[1].match(/<sup[\s\S]*?<\/sup>/) || [''])[0], rest: m[2] }));
// column labels (with unit) of a table block
function headers(block) {
  const head = block.slice(block.indexOf('<thead>'), block.indexOf('</thead>'));
  return [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].slice(1).map(m => { const unit = (m[1].match(/<span[^>]*>([^<]*)<\/span>/) || [])[1] || ''; const label = m[1].replace(/<span[\s\S]*?<\/span>/, '').replace(/<[^>]+>/g, '').trim(); return { label, unit }; });
}
// values of one article's row + its footnote numbers + the footnote texts of the block
function rowOf(block, art) {
  const r = rowsOf(block).find(x => x.art === art); if (!r) return null;
  const vals = [...r.rest.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m => m[1].trim());
  const marks = [...r.sup.matchAll(/(\d+)\)/g)].map(m => m[1]);
  const notesP = block.slice(block.lastIndexOf('<p')); const notes = {};
  for (const m of notesP.matchAll(/<sup>(\d+)\)<\/sup>\s*([^<]+)/g)) notes[m[1]] = m[2].trim();
  return { vals, marks, notes: marks.map(n => notes[n]).filter(Boolean) };
}
// re-render the rows with a new current article and link map (styles exactly as vt/table2.js)
function rerender(block, lang, current, links) {
  const head = block.slice(0, block.indexOf('<tbody>') + 7), tail = block.slice(block.indexOf('</tbody>'));
  const body = rowsOf(block).map((r, i) => {
    const isCur = r.art === current, base = isCur ? C.cur : C.bg, bg = i % 2 === 0 ? zebra(base) : base;
    const first = isCur ? `${r.art}${r.sup}<br><span style="display:inline-block;margin-top:3px;padding:0 8px;border-radius:10px;background:${C.green};color:#fff;font-size:11px">${CUR[lang]}</span>`
      : (links[r.art] ? `<a href="${links[r.art]}">${r.art}</a>` : r.art) + r.sup;
    return `<tr style="border-top:1px solid ${C.line}${isCur ? ';background:' + C.cur + ';font-weight:700' : ''}"><td style="text-align:left;position:sticky;left:0;background:${bg}${isCur ? ';box-shadow:inset 4px 0 ' + C.green : ''}">${first}</td>${r.rest}</tr>`;
  }).join('');
  return head + body + tail;
}
const linksIn = block => Object.fromEntries([...block.matchAll(/<a href="([^"]+)">(0\d{10})<\/a>/g)].map(m => [m[2], m[1]]));
const stripLinks = s => s.replace(/<a href="[^"]*">(0\d{10})<\/a>/g, '$1');

// Ukrainian transliteration as Horoshop does it, but with × -> x (Horoshop drops ×) — checked against the created slug
const TR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '' };
const slugOf = title => title.toLowerCase().replace(/[″"®™]/g, '').replace(/×/g, 'x').split('').map(c => TR[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// product photo: datasheet/wera.de picture on a 1000x1000 white square, long side 840 px
async function squarePhoto(sharp, src, out) {
  const im = sharp(src).flatten({ background: '#ffffff' }); const m = await im.metadata();
  const k = 840 / Math.max(m.width, m.height), w = Math.round(m.width * k), h = Math.round(m.height * k);
  const buf = await sharp(src).flatten({ background: '#ffffff' }).resize(w, h, { kernel: 'lanczos3' }).toBuffer();
  await sharp({ create: { width: 1000, height: 1000, channels: 3, background: '#ffffff' } }).composite([{ input: buf, left: Math.round((1000 - w) / 2), top: Math.round((1000 - h) / 2) }]).jpeg({ quality: 92 }).toFile(out);
}
module.exports = { splitTable, rowsOf, headers, rowOf, rerender, linksIn, stripLinks, slugOf, squarePhoto };
