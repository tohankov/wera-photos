// Our variant tables: for every article in a table's first column — linked or not, and in which products' tables. -> tables.json, ours.json
const fs = require('fs');
const ours = [];
for (const o of [0, 500, 1000, 1500, 2000, 2500, 3000]) ours.push(...((require(`./d${o}_out.json`).response || {}).products || []));
const inTable = {}; // art -> {unlinked:[ourArt], linked:[ourArt]}
let withTable = 0;
for (const p of ours) {
  const d = p.description?.ua || ''; const i = d.indexOf('<table'); if (i < 0) continue; withTable++;
  const seg = d.slice(i, d.lastIndexOf('</table>') + 8);
  for (const m of seg.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const td = (m[0].match(/<td[^>]*>([\s\S]*?)<\/td>/) || [])[1]; if (!td) continue;
    const a = (td.match(/0\d{10}/) || [])[0]; if (!a) continue;
    const linked = /<a\s/.test(td), cur = a === p.article;
    const e = inTable[a] = inTable[a] || { unlinked: [], linked: [], current: [] };
    (cur ? e.current : linked ? e.linked : e.unlinked).push(p.article);
  }
}
fs.writeFileSync(__dirname + '/tables.json', JSON.stringify(inTable));
fs.writeFileSync(__dirname + '/ours.json', JSON.stringify(ours.map(p => ({ article: p.article, parent_article: p.parent_article, title: p.title, slug: p.slug, parent: p.parent, alt_parent: p.alt_parent, price: p.price, show: p.display_in_showcase, nimg: (p.images || []).length, hasTable: (p.description?.ua || '').includes('<table') }))));
const list = require('./list.json'); const ourSet = new Set(ours.map(p => p.article));
const A = list.filter(r => inTable[r.article]?.unlinked.length);
console.log('ours', ours.length, 'with table', withTable, 'articles in tables', Object.keys(inTable).length);
console.log('422 in some table unlinked:', A.length, '| in table linked (?!):', list.filter(r => inTable[r.article]?.linked.length && !inTable[r.article]?.unlinked.length).length, '| already ours:', list.filter(r => ourSet.has(r.article)).length);
// datasheet cache coverage
const DC = __dirname + '/../inv/dcache/'; let ds = { 200: 0, other: 0, none: 0 };
for (const r of list) { const f = DC + r.article + '.json'; if (!fs.existsSync(f)) { ds.none++; continue; } const j = JSON.parse(fs.readFileSync(f)); (j.status === 200 || j.title) ? ds[200]++ : ds.other++; }
console.log('datasheet cache', ds);
