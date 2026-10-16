// Sets get ALL values of their composition (CLAUDE.md filters rule): for each characteristic of the group except «Вид інструменту»,
// a set carries the union of the values of its components (composition from the WERA datasheet, cat/sets_comp.json; component values from
// cat/member_vals.json — every product of every group, bits included). Only values that already exist in the characteristic's dictionary
// are taken (cat/dicts_snapshot.json), so dictionary order stays ascending; the rest are counted as `outside`. No composition -> disputed.
//   fill(name, items, chars) -> { items, disputed, report }      node cat/sets_fill.js build   (rebuild member_vals.json)
const fs = require('fs'), path = require('path');
const J = f => { const p = path.join(__dirname, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const ALT = { rozmir_nakonechnyka: ['rozmir', 'rozmir_robochoho_kintsia'], rozmir_robochoho_kintsia: ['rozmir_nakonechnyka', 'rozmir'] };
const NONPRODUCT = /^(Ручка-тримач|Приладдя|Приладдя для викруток|Бітотримач|Підставка)/;
function fill(name, items, chars) {
  if (process.env.SETS_FILL === 'off') return { items, disputed: [], report: null };
  const L = J('sets_list.json') || {}, C = J('sets_comp.json') || {}, M = J('member_vals.json') || {}, D = J('dicts_snapshot.json') || {};
  const sets = new Set(L[name] || []), disputed = [], rep = { sets: 0, filled: 0, noComp: 0, outside: {} };
  const out = items.map(it => { if (!sets.has(it.a)) return it; rep.sets++; const comp = C[it.a];
    if (!comp || !comp.length) { rep.noComp++; disputed.push({ a: it.a, sec: (it.secs || [])[0], what: 'Состав набора', why: 'состав не найден в datasheet WERA — значения по составу не записаны', title: it.title }); return it; }
    const mem = comp.flatMap(g => g.items.map(x => x.art)).filter(a => a !== it.a).map(a => M[a]).filter(m => m && !m.nonProduct);
    const vals = { ...it.vals }; let added = 0;
    for (const c of chars.filter(c => c.key !== 'vyd_instrumentu')) { const dict = D[c.key] ? new Set(D[c.key].values) : null; const got = new Set(vals[c.key] || []);
      for (const m of mem) for (const k of [c.key, ...(ALT[c.key] || [])]) for (const v of (m.vals[k] || [])) { if (got.has(v)) continue;
        if (k !== c.key && !(dict && dict.has(v))) continue; if (dict && !dict.has(v)) { rep.outside[c.key + ': ' + v] = (rep.outside[c.key + ': ' + v] || 0) + 1; continue; } got.add(v); added++; }
      vals[c.key] = [...got]; }
    const unknown = comp.flatMap(g => g.items.map(x => x.art)).filter(a => a !== it.a && !M[a]);
    if (added) rep.filled++;
    else if (!chars.some(c => c.key !== 'vyd_instrumentu' && (vals[c.key] || []).length)) disputed.push({ a: it.a, sec: (it.secs || [])[0], what: 'Состав набора', why: unknown.length ? `компонентов нет в каталоге (${unknown.length}): ${unknown.slice(0, 6).join(', ')}` : 'в составе из datasheet только принадлежности (ручки, удлинители) — значений нет', title: it.title });
    if (unknown.length) rep.partial = (rep.partial || 0) + 1;
    return { ...it, vals, setFilled: added }; });
  return { items: out, disputed, report: rep }; }
module.exports = fill;
if (require.main === module && process.argv[2] === 'build') { process.env.SETS_FILL = 'off'; const M = {};
  for (const g of ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'holders', 'adapters', 'drills']) { if (!fs.existsSync(path.join(__dirname, `g_${g}.js`))) continue;
    for (const i of require(`./g_${g}.js`).items) { const m = M[i.a] = M[i.a] || { vals: {}, nonProduct: false }; for (const [k, v] of Object.entries(i.vals)) m.vals[k] = [...new Set([...(m.vals[k] || []), ...v])];
      if ((i.vals.vyd_instrumentu || []).some(v => NONPRODUCT.test(v)) && !(i.vals.vyd_instrumentu || []).some(v => /^Набір/.test(v))) m.nonProduct = true; } }
  const NB = ['TL64', '05049002001', '05051278001'];
  for (const p of require('../filters/chars_payload.json').products) { const m = M[p.article] = M[p.article] || { vals: {}, nonProduct: false }; for (const [k, v] of Object.entries(p.characteristics)) if (Array.isArray(v)) m.vals[k] = [...new Set([...(m.vals[k] || []), ...v])]; if (NB.includes(p.article)) m.nonProduct = true; }
  fs.writeFileSync(path.join(__dirname, 'member_vals.json'), JSON.stringify(M)); console.log('member_vals', Object.keys(M).length, 'nonProduct', Object.values(M).filter(m => m.nonProduct).length); }
