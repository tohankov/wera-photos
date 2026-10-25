// Fix of 25.10.2026: the WERA sentences of cat/gvyk_phrase_plan.js were written without the final full stop — add it (only to those inserted sentences).
//   node cat/gvyk_phrase_dot.js <fresh group export.json> <written plan.json> <out plan.json>   -> cat/desc_write.js
const fs = require('fs'); const [, , LIVE, WP, OUT] = process.argv; const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const W = JSON.parse(fs.readFileSync(WP, 'utf8')).products;
const plan = { name: 'gvyk_phrase_dot', products: {} }; let n = 0;
for (const [a, x] of Object.entries(W)) { const p = L[a]; const nw = {};
  for (const l of ['ua', 'ru']) { let h = p.description[l]; const old = x.old[l];
    // the sentences this write inserted: <p>/<li> in the written «new» that are not in «old»
    const ins = [...x.new[l].matchAll(/<(p|li)>([^<]+)<\/\1>/g)].map(m => m[0]).filter(t => !old.includes(t));
    for (const t of ins) { const d = t.replace(/([^.])<\/(p|li)>$/, '$1.</$2>'); if (d !== t && h.includes(t)) { h = h.replace(t, d); n++; } } nw[l] = h; }
  if (nw.ua !== p.description.ua || nw.ru !== p.description.ru) plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: ['точка в конце фразы WERA'] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, 'sentences', n);
