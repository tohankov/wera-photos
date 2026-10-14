// Groups for the 422: Знятий (GRN) / А (in our variant table without link) / Б (series on our site without table, or similar products) / В (new). Neighbours -> proposed section.
const fs = require('fs');
const list = require('./list.json'), T = require('./tables.json'), W = fs.existsSync(__dirname + '/wscan.json') ? require('./wscan.json') : {};
const ours = require('./ours.json'), byArt = Object.fromEntries(ours.map(p => [p.article, p]));
const DC = __dirname + '/../inv/dcache/';
const CODES = require('./codes.json');
const TYPE = [[/Серия 7400 Imperial/, 1206], [/Серия 7400/, 1204], [/^WERA 375 /, 1102], [/^WERA 3368 /, 1122], [/^WERA 780 [BC] /, 1089]];
const SECNAME = {}; for (const p of require('./ours.json')) { SECNAME[p.parent.id] = p.parent.value; }
const secById = id => ({ parent: id, parentName: SECNAME[id] || '(раздел без товаров)', alt: [] });
const ds = a => { const f = DC + a + '.json'; if (!fs.existsSync(f)) return null; const j = JSON.parse(fs.readFileSync(f)); return j.title ? 200 : j.status; };
const key = s => (s.replace(/^WERA\s+/, '').split(/,|\s[-–]\s/)[0].match(/[A-Za-z][A-Za-z+\-]*|\d{3,5}(?:\/\d+)?/g) || []);
// model codes like 840/1 also count as their base 840
const toks = s => { const t = s.match(/[A-Za-z][A-Za-z+\-]*|\d{3,5}(?:\/\d+)?/g) || []; return new Set([...t, ...t.filter(x => x.includes('/')).map(x => x.split('/')[0])]); };
const ourTok = ours.map(p => ({ p, t: toks(p.title.ru + ' ' + p.title.ua) }));
// words that make a different product line: a hit that has one the candidate lacks (or vice versa) is a weaker neighbour
const DIST = ['Deep', 'VDE', 'Stainless', 'Imperial', 'Impaktor', 'BiTorsion', 'Diamond', 'ESD', 'HF', 'Micro', 'Black'];
const STOP = new Set(['WERA', 'mm', 'x', 'SB', 'Set', 'Imperial', 'i']);
function similar(name) {
  let k = key(name).filter(t => !STOP.has(t));
  while (k.length) {
    const strong = k.length >= 2 || /^\d{3,5}/.test(k[0]);
    if (strong) { const hit = ourTok.filter(o => k.every(t => o.t.has(t))); if (hit.length) { const cand = toks(name); const best = hit.filter(o => DIST.every(d => o.t.has(d) === cand.has(d))); return { tokens: k.join(' '), hits: (best.length ? best : hit).map(o => o.p.article), exact: best.length > 0 }; } }
    k = k.slice(0, -1);
  }
  // last resort: the model code's base (851/4 -> 851) alone
  const base = (key(name)[0] || '').split('/')[0];
  if (/^\d{3,5}$/.test(base)) { const hit = ourTok.filter(o => o.t.has(base)); if (hit.length) return { tokens: base, hits: hit.map(o => o.p.article), exact: false }; }
  // series code known from earlier wera.de checks of our own products (titles of ours often lack the code, e.g. 367)
  if (CODES[base]) { const hits = CODES[base].filter(a => byArt[a]); if (hits.length) return { tokens: 'серия ' + base + ' на wera.de', hits, exact: false }; }
  return null;
}
const secOf = arts => { const c = {}; for (const a of arts) { const p = byArt[a]; if (!p) continue; const k = p.parent.id + '|' + (p.alt_parent || []).map(x => x.id).join(','); c[k] = (c[k] || 0) + 1; } const best = Object.entries(c).sort((x, y) => y[1] - x[1])[0]; if (!best) return null; const [par, alt] = best[0].split('|'); const p = arts.map(a => byArt[a]).find(q => q && String(q.parent.id) === par); return { parent: +par, parentName: p.parent.value, alt: alt ? alt.split(',').map(Number) : [] }; };
const rows = list.map(r => {
  const a = r.article, w = W[a] || {}, t = T[a];
  const page = w.status === 200 ? 'да' : w.status === 404 ? 'нет (404)' : w.status ? String(w.status) : 'не проверено';
  const seriesOurs = (w.pid || []).filter(x => byArt[x] && x !== a);
  const packshot = w.status !== 200 ? 'нет страницы' : (w.pid || []).length <= 1 ? 'свой (страница артикула)' : 'общий снимок серии';
  let group, neigh = [], why = '';
  if (r.grn_stock === 'Знятий з виробництва') group = 'Знятий';
  else if (t && t.unlinked.length) { group = 'А'; neigh = t.unlinked; why = 'в таблице вариантов у ' + t.unlinked.length + ' наших'; }
  else if (seriesOurs.length) { group = 'Б'; neigh = seriesOurs; why = 'серия на wera.de, у нас без таблицы: ' + seriesOurs.length; }
  else { const s = similar(r.name); if (s) { group = 'Б'; neigh = s.hits; why = 'похожие у нас по «' + s.tokens + '»: ' + s.hits.length + (s.exact ? '' : ' (другая линейка — раздел проверить)'); } else group = 'В'; }
  // series whose type already has our section, though no title/series match (set by hand)
  let typeSec = null;
  if (group === 'В') for (const [re, id] of TYPE) if (re.test(r.name)) { typeSec = id; group = 'Б'; why = 'раздел по типу (вручную), похожих по названию нет — проверить'; break; }
  const sec = neigh.length ? secOf(neigh) : typeSec ? secById(typeSec) : null;
  return { ...r, group, why, neighbours: neigh.slice(0, 5).join(' '), page, wera_url: w.status === 200 ? w.url : '', wera_title: w.title || '', datasheet: ds(a) ?? 'нет в кэше', packshot, section: sec };
});
fs.writeFileSync(__dirname + '/classified.json', JSON.stringify(rows, null, 1));
const c = {}; for (const r of rows) c[r.group] = (c[r.group] || 0) + 1; console.log(c);
