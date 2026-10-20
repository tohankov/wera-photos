// Map «product -> all its sections (main + alt_parent) -> storefront filters of each section» (owner 21.10.2026: before changing a product look at ALL its
// sections and their filters; after writing check every touched section on the storefront — cat/sec_check.js).
//   node cat/sections_map.js <live.json> <scan.json> <menu_tree.json>
//   -> inventory/sections_map.json  { at, sections: {id: {path, url, filters:[UA titles], products}}, products: {article: {title, vis, sections:[{id, main}], missing:{secId:[filter titles without a value]}}} }
//   -> inventory/sections_map.xlsx  (sheet «Товари»: one row per product × section; «Розділи»: filters of every section)
// live.json — lib/full_export.js (article,title,parent,alt_parent,display_in_showcase,characteristics,link); scan.json — vt/sec_scan.js (storefront filters UA)
// «missing»: a filter of the section the product has no value in — it disappears when that filter is used.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const [, , LIVE, SCAN, MENU] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')), SC = JSON.parse(fs.readFileSync(SCAN, 'utf8')), M = JSON.parse(fs.readFileSync(MENU, 'utf8'));
const TITLE = require('./char_titles.js'); const KEY = Object.fromEntries(Object.entries(TITLE).map(([k, t]) => [t, k]));
const P = Object.fromEntries(M.map(s => [s.id, s])); const secs = p => [...new Set([p.parent && +p.parent.id, ...(p.alt_parent || []).map(x => +x.id)].filter(Boolean))];
const v = (p, k) => ((p.characteristics || {})[k] || []).length;
const filtersOf = id => ((SC[id] || {}).ua || { filters: [] }).filters.map(f => f.title).filter(t => t && t !== '?' && t !== 'Бренд');
const out = { at: new Date().toISOString(), live: path.basename(LIVE), scan: path.basename(SCAN), sections: {}, products: {} };
for (const s of M) out.sections[s.id] = { path: s.path.trim(), url: s.url, filters: filtersOf(s.id), products: 0 };
const rows = [];
for (const p of L) { const ss = secs(p); const vis = +p.display_in_showcase === 1; const rec = { title: p.title.ua, vis, sections: ss.map(id => ({ id, main: id === +p.parent.id })), missing: {} };
  for (const id of ss) { const sec = out.sections[id] || (out.sections[id] = { path: '(немає в меню) ' + id, url: null, filters: [], products: 0 }); if (vis) sec.products++;
    const miss = sec.filters.filter(t => KEY[t] && !v(p, KEY[t])); if (miss.length) rec.missing[id] = miss;
    rows.push({ Артикул: p.article, Назва: p.title.ua, Видимий: vis ? 'так' : 'ні', Розділ: sec.path, Тип: id === +p.parent.id ? 'основний' : 'alt', 'Фільтри розділу': sec.filters.join(', '), 'Немає значення у фільтрі': miss.join(', ') }); }
  out.products[p.article] = rec; }
const INV = path.join(__dirname, '../../inventory'); fs.writeFileSync(path.join(INV, 'sections_map.json'), JSON.stringify(out));
const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows), 'Товари');
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(Object.entries(out.sections).map(([id, s]) => ({ id, Розділ: s.path, 'Товарів (видимих)': s.products, Фільтри: s.filters.join(' → ') }))), 'Розділи');
X.writeFile(wb, path.join(INV, 'sections_map.xlsx'));
const multi = Object.values(out.products).filter(r => r.sections.length > 1).length; const miss = Object.values(out.products).filter(r => r.vis && Object.keys(r.missing).length).length;
console.log('products', L.length, '| in 2+ sections', multi, '| sections', Object.keys(out.sections).length, '| visible products missing a value in a filter of their section', miss);
