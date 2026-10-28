// Set positions without our product (owner 28.10.2026, rule В): the datasheet row (cat/ds_comp_all.json) is matched to the row of wera.de «Werkzeuge in
// diesem Set» (inventory/wera/pages.json) — same article, else the same series code + size + qty. A wera.de article that IS ours makes it an ordinary
// card (CLAUDE.md: «позиция без артикула в паспорте — артикул из строки wera.de»); otherwise the position needs the WERA picture (wera.de img) through
// the owner, the article of the wera.de row (none — no article line) and the name from the datasheet (RU) / our UA. Read-only.
//   node vt/noart_resolve.js <all.json> <menu_tree.json> <out.json> "<section path regex>"
const fs = require('fs'), path = require('path'); const T = path.join(__dirname, '..') + '/';
const C = require(T + 'cat/ds_comp_all.json'); const W = require(T + '../inventory/wera/pages.json');
const nsz = s => String(s || '').toLowerCase().replace(/мм|mm/g, '').replace(/,/g, '.').replace(/[″"]/g, '"').replace(/\s*x\s*/g, 'x').replace(/\s+/g, ' ').trim();
const code = s => (String(s).match(/^\d{3,4}(?:\/\d+)?(?:\s[A-Z]{1,5}(?=\s|$))*/) || [''])[0];
const wrowsOf = s => { const wp = W.pages[W.art[s]]; return (wp && wp.setItems || []).flatMap(i => i.rows.map(r => ({ ...r, name: i.name, img: i.img }))); };
// the wera.de row of one datasheet position g / x of set s -> { w, how }
function wmatch(s, g, x, wrows = wrowsOf(s)) {
  let w = x.art ? wrows.find(r => r.art === x.art) : null; let how = w ? 'art' : '';
  if (!w) { const c = code(g.head), sz = nsz(x.size); const cand = wrows.filter(r => nsz(r.size) === sz && r.qty === x.qty && (!c || code(r.name) === c));
    if (cand.length === 1) { w = cand[0]; how = 'size'; } else if (cand.length > 1) how = 'ambiguous ' + cand.length;
    // velcro strips: the datasheet «Набор полосок на липучках (№) N» = wera.de «Klettstreifen N» (sizes written in the other order)
    const k = !w && g.head.match(/липучках\s+(?:№\s*)?(\d+)/); if (k) { const v = wrows.filter(r => r.name === 'Klettstreifen ' + k[1] && r.qty === x.qty); if (v.length === 1) { w = v[0]; how = 'velcro'; } } }
  return { w, how: how || 'none' }; }
module.exports = { wmatch, wrowsOf };
if (require.main === module) { const [, , ALL, MENU, OUT, RX] = process.argv;
const A = JSON.parse(fs.readFileSync(ALL, 'utf8')); const L = Object.fromEntries(A.map(p => [p.article, p]));
const ids = new Set(JSON.parse(fs.readFileSync(MENU, 'utf8')).filter(x => new RegExp(RX).test(x.path.trim())).map(x => +x.id));
const secs = p => [p.parent && +(p.parent.id || p.parent), ...(p.alt_parent || []).map(x => +(x.id || x))];
const SKIP = new Set(['05135824001', '05133126001', '05135826001']);
const res = { sets: {}, pos: {} };
for (const p of A) { if (+p.display_in_showcase !== 1 || SKIP.has(p.article) || /Home Kraftform/i.test(p.mod_title.ua) || !secs(p).some(s => ids.has(s))) continue;
  const comp = (C[p.article] || []).filter(g => g.items && g.items.length); if (!comp.length) continue;
  const wrows = wrowsOf(p.article);
  const out = [];
  for (const g of comp) for (const x of g.items) { if (x.art && L[x.art]) continue; if (/KNIPEX 87 01 250|Cobra® 250/.test(g.head) && !x.art) continue;
    const { w, how } = wmatch(p.article, g, x, wrows);
    const wart = w && w.art; const ours = wart && L[wart];
    const key = wart || x.art || (w ? 'W:' + w.name + '|' + w.size : 'D:' + g.head);
    out.push({ head: g.head, ds_art: x.art, size: x.size, qty: x.qty, how: how || 'none', wera: w ? { name: w.name, art: w.art, size: w.size, img: w.img } : null, ours: !!ours, key });
    if (!ours) { const o = res.pos[key] = res.pos[key] || { key, head: g.head, art: wart || x.art || null, size: x.size, wera: w ? { name: w.name, size: w.size, img: w.img } : null, sets: [] }; o.sets.push(p.article); } }
  if (out.length) res.sets[p.article] = { name: p.mod_title.ua, noWera: !wrows.length, out }; }
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
const all = Object.values(res.sets).flatMap(s => s.out); const cnt = {}; for (const o of all) { const k = o.ours ? 'wera.de article is ours' : o.wera ? 'WERA picture needed' : 'no wera.de row (' + o.how + ')'; cnt[k] = (cnt[k] || 0) + 1; }
console.log('sets', Object.keys(res.sets).length, '| positions', all.length, cnt, '| distinct positions needing a WERA picture', Object.values(res.pos).filter(o => o.wera).length, '| without wera.de row', Object.values(res.pos).filter(o => !o.wera).length); }
