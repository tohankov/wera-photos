// What every renamed product should now carry (title = mod_title, UA/RU), from the write runs in names/write_state.json:
// mechanics (names/mech_written.json — the title run; the mod_title run copied it), mechanics written later (both), then the word rules (words).
// node names/final.js — live export of all of them: title and mod_title (UA/RU) equal the expected text.
const fs = require('fs'), path = require('path'); const st = require('./write_state.json');
function expected() { const W = require('./mech_written.json'), M = require('./mech_plan.json'); const P = Object.fromEntries(require('./preview.json').review.map(r => [r['Артикул'], r]));
  const out = {}; const set = (a, old, ua, ru, step) => { out[a] = out[a] || { oldUa: old.ua, oldRu: old.ru, steps: [] }; Object.assign(out[a], { ua, ru }); out[a].steps.push(step); };
  for (const [a, w] of Object.entries(W)) set(a, { ua: w.oldUa, ru: w.oldRu }, w.ua, w.ru, 'mech');
  for (const a of (st.both || {}).done || []) set(a, { ua: M[a].oldUa, ru: M[a].oldRu }, M[a].ua, M[a].ru, 'mech');
  for (const a of (st.words || {}).done || []) { const r = P[a]; set(a, { ua: r['Текущее UA (после механики)'], ru: r['Текущее RU (после механики)'] }, r['Предлагаемое UA'], r['Предлагаемое RU'], 'words'); }
  if ((st.set_ipr || {}).done) { const SP = require('./set_plan_ipr.json'); for (const x of st.set_ipr.done) set(x, SP[x].oldTitle, SP[x].ua, SP[x].ru, 'set'); }   // 17.10: IPR 40/45, Belt mod_title
  if ((st.set || {}).done) { const SP = require('./set_plan.json'); for (const a of st.set.done) set(a, SP[a].oldTitle, SP[a].ua, SP[a].ru, 'set'); }
  return out; }
module.exports = { expected };
if (require.main === module) (async () => { const S = require('../lib/session.js').open(); const E = expected(), arts = Object.keys(E); const bad = []; let n = 0;
  for (let i = 0; i < arts.length; i += 100) { await new Promise(r => setTimeout(r, 1500));
    const r = await S.call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: ['article', 'title', 'mod_title', 'link'], limit: 100, allowLarge: true });
    if (!r.response) { console.log('export failed', JSON.stringify(r).slice(0, 200)); break; }
    for (const p of r.response.products) { n++; const e = E[p.article]; for (const f of ['title', 'mod_title']) for (const l of ['ua', 'ru']) if ((p[f] || {})[l] !== e[l]) bad.push(`${p.article} ${f}.${l}: «${(p[f] || {})[l]}» ≠ «${e[l]}»`); } }
  fs.writeFileSync(path.join(__dirname, 'final_problems.json'), JSON.stringify(bad, null, 1));
  console.log(`expected ${arts.length}, exported ${n}, problems ${bad.length}`); bad.slice(0, 10).forEach(b => console.log(b)); S.close(); })();
