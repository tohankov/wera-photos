// Collect our data for a catalog group: title, section, own row of the series table (headers -> values), series (wera.de map), datasheet presence.
//   node cat/collect.js <groupRootId>  -> cat/<id>_items.json + summary
const fs = require('fs'), path = require('path'); const V = require('../lib/vt.js');
const root = +process.argv[2]; const t = require('../sections/tree_now.json'); const live = require('../audit_cache/live.json');
const kids = id => t.filter(c => c.parent == id); const sub = id => [id, ...kids(id).flatMap(c => sub(c.id))]; const ids = new Set(sub(root)); const name = Object.fromEntries(t.map(p => [p.id, p.title.ua]));
const codes = require('../a422/codes.json'); const ser = {}; for (const [m, l] of Object.entries(codes)) for (const a of l) ser[a] = m;
const seen = new Set(); const items = [];
for (const p of live) { if (seen.has(p.article)) continue; const secs = [p.parent.id, ...(p.alt_parent || []).map(x => x.id)].filter(s => ids.has(s)); if (!secs.length) continue; seen.add(p.article);
  const tb = V.splitTable(p.description.ua || ''); let row = null, series = null;
  if (tb) { const h = V.headers(tb[1]); const r = V.rowOf(tb[1], p.article); series = (tb[1].match(/Інші варіанти серії (?:WERA )?([^<]+)<\/h3>/) || [])[1]; if (r) row = Object.fromEntries(h.map((x, i) => [x.label + (x.unit ? ' ' + x.unit : ''), r.vals[i]])); }
  const ds = fs.existsSync(path.join(__dirname, '../batch/ds', p.article + '.txt'));
  items.push({ a: p.article, title: p.title.ua, sec: p.parent.id, secName: name[p.parent.id], secs, alt: (p.alt_parent || []).map(x => x.id), visible: p.display_in_showcase, series: series || ser[p.article] || null, row, ds }); }
fs.writeFileSync(path.join(__dirname, `${root}_items.json`), JSON.stringify(items, null, 1));
const bySec = {}; for (const it of items) (bySec[it.sec] = bySec[it.sec] || []).push(it);
console.log('items', items.length, 'with table row', items.filter(i => i.row).length, 'with datasheet', items.filter(i => i.ds).length);
for (const [s, l] of Object.entries(bySec)) { const hdr = {}; for (const i of l) if (i.row) for (const k of Object.keys(i.row)) hdr[k] = (hdr[k] || 0) + 1;
  console.log(`## ${s} ${name[s]} (${l.length})  columns: ${Object.entries(hdr).map(([k, n]) => k + ':' + n).join(' | ')}`); const step = Math.max(1, Math.floor(l.length / 5)); l.filter((x, i) => i % step === 0).slice(0, 5).forEach(i => console.log('     ', i.title.replace(/ WERA \S+$/i, '').slice(0, 100))); }
