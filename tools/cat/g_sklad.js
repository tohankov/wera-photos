// Group «… у складі» for cat/import_group.js: yes/no characteristics «PH у складі», «PZ у складі»… on every SET of every filter group (and 1055).
// Different filters combine as AND on the storefront, values inside one filter as OR — so «PH у складі» + «PZ у складі» shows only sets holding both.
// Value «Так» = the profile is in the set's WERA composition (cat/comp_expand.js, nested sets opened) or in the set's «Профіль» already written by its group
// (that value came from the same composition / datasheet title). Only profiles found in ≥ 20 sets get a characteristic (rarer ones: report only).
// Accessories in a composition (holders, handles: nonProduct) do not count. A set without a composition in the datasheet -> disputed.
const fs = require('fs'), path = require('path'); const { expand, hasComp } = require('./comp_expand.js'); process.env.SKLAD_LOADING = '1';
const L = require('./sets_list.json'); const T = require('../sections/tree_now.json'); const name = Object.fromEntries(T.map(p => [p.id, p.title.ua]));
const P = [['sklad_ph', 'PH (Phillips)', 'PH у складі', 'PH в составе'], ['sklad_pz', 'PZ (Pozidriv)', 'PZ у складі', 'PZ в составе'], ['sklad_tx', 'TX (TORX®)', 'TX у складі', 'TX в составе'],
  ['sklad_sl', 'SL (шліц)', 'SL у складі', 'SL в составе'], ['sklad_hex', 'HEX (шестигранник)', 'HEX у складі', 'HEX в составе'], ['sklad_kvadrat', 'Квадрат (Robertson)', 'Квадрат у складі', 'Квадрат в составе'],
  ['sklad_tx_bo', 'TX BO (TORX® з отвором)', 'TX BO у складі', 'TX BO в составе'], ['sklad_plusminus', 'PlusMinus (PH/PZ + шліц)', 'PlusMinus у складі', 'PlusMinus в составе']];
// since 19.10.2026 the value is not «Так» but the sizes of that profile in the set («PH 1», «PH 2»…; «PH (розмір не вказано)» when WERA gives none):
// PH 1 in one filter + PZ 2 in another = AND. Written values: cat/pr_size_values.json; a new set: computed from the composition (cat/pr_size.js skladValues).
const PS = require('./pr_size.js'); const SNAP = PS.SNAP || {};
// the set's «Профіль» as its group writes it (sets_fill applied), and its sections
const GROUPS = ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'bitsets', 'trolley']; const own = {}, secs = {}, title = {}, vyd = {};
for (const g of GROUPS) { if (!fs.existsSync(path.join(__dirname, `g_${g}.js`))) continue; for (const i of require(`./g_${g}.js`).items) { own[i.a] = [...new Set([...(own[i.a] || []), ...((i.vals || {}).profil || [])])]; secs[i.a] = [...new Set([...(secs[i.a] || []), ...(i.secs || [])])]; title[i.a] = i.title; vyd[i.a] = [...new Set([...(vyd[i.a] || []), ...((i.vals || {}).vyd_instrumentu || [])])]; } }
// cat/sets_fix.js: sets whose composition the parsers missed (prose datasheet, rows without catalog article) — their profiles, and 05004186001 (1056, no group)
const FIX = require('./sets_fix.js');
const sets = [...new Set([...Object.entries(L).filter(([k]) => k !== 'bitsets_fill' && k !== 'bits').flatMap(([, v]) => v), ...Object.keys(FIX)])];
const items = [], disputed = [], rare = {};
for (const a of sets) { const comp = hasComp(a); const leaf = comp ? expand(a).filter(x => !x.nonProduct) : [];
  const prof = new Set([...leaf.flatMap(x => x.vals.profil || []), ...(own[a] || []), ...((FIX[a] || {}).profil || [])]);
  // disputed only for real sets of tools (a repair kit or an accessory caught by the word «комплект» has no profiles to expect)
  if (!comp && !(own[a] || []).length) { if ((vyd[a] || []).some(v => /^Набір/.test(v)) && /набір|\bset\b/i.test(title[a] || '') && !(vyd[a] || []).some(v => /^(Ремкомплект|Приладдя)/.test(v))) disputed.push({ a, sec: (secs[a] || [])[0], what: '… у складі', why: 'состав не найден в datasheet WERA', title: title[a] }); }
  for (const v of prof) if (!P.some(p => p[1] === v)) rare[v] = (rare[v] || 0) + 1;
  items.push({ a, title: title[a], secs: secs[a] || [], kind: 'set', fromComp: comp, vals: Object.fromEntries(P.map(([k, v]) => [k, PS.skladValues(a, k, prof.has(v))])) }); }
// a composition row is a named WERA set without article that matches more than one set in the catalog -> disputed, not guessed
disputed.push({ a: '05134544001', sec: 1274, what: '… у складі', why: 'в datasheet WERA состав «Tool-Check PLUS, 39 предметов» без артикула; в каталоге два таких набора (05049055001, 05049060001 Imperial) — какой именно, не указано', title: title['05134544001'] || 'Набір на радість колінам і рукам 1 з набором Tool-Check PLUS, 40 предметів' });
module.exports = {
  name: 'sklad', root: 0, seed: (items.find(i => P.every(([k]) => i.vals[k].length)) || items.find(i => i.vals.sklad_ph.length)).a, testArticle: '05051012001',
  chars: P.map(([key, , t, tr]) => ({ key, title: t, titleRu: tr, order: 'given', values: (SNAP.dict || {})[key] || [], ru: SNAP.ru || {} })),
  items, disputed, rare,
  required: () => [],
  filterOrder: P.map(p => p[2]),
};
if (require.main === module) { const n = k => items.filter(i => i.vals[k].length).length; console.log('sets', items.length, 'with composition', items.filter(i => i.fromComp).length, 'disputed', disputed.length);
  for (const [k, , t] of P) console.log(' ', t, n(k)); console.log('rare (no characteristic):', rare); console.log('seed', module.exports.seed);
  const bySec = {}; for (const i of items) for (const s of i.secs) { const o = bySec[s] = bySec[s] || { n: 0, k: {} }; o.n++; for (const [k] of P) if (i.vals[k].length) o.k[k] = (o.k[k] || 0) + 1; }
  for (const [s, o] of Object.entries(bySec).sort((a, b) => a[0] - b[0])) console.log(s, name[s], o.n, JSON.stringify(o.k)); }
