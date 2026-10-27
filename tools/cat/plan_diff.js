// «Что поменять в админке» for one group: the new filter plan (cat/night_plan_<g>.json, night_audit) against what the owner configured
// (cat/night_plan_<g>_configured.json) — the group list and every section's own list; full paths by names.   node cat/plan_diff.js <group> [...]
const path = require('path'); const T = require('./char_titles.js'); const t = k => ({ hits: 'Хіти продажів', price: 'Ціна' }[k] || T[k] || k);
for (const g of process.argv.slice(2)) { const N = require(path.join(__dirname, `night_plan_${g}.json`)), C = require(path.join(__dirname, `night_plan_${g}_configured.json`));
  const own = P => Object.fromEntries((P.own || []).map(x => [x.id, x])); const n = own(N), c = own(C); const out = [];
  if (JSON.stringify(N.rootList) !== JSON.stringify(C.rootList)) out.push(`- **${N.name || g}** (раздел группы): было ${(C.rootList || []).map(t).join(' → ')} → **${(N.rootList || []).map(t).join(' → ')}**`);
  for (const id of new Set([...Object.keys(n), ...Object.keys(c)])) { const a = n[id], b = c[id]; const la = a ? a.list : null, lb = b ? b.list : null;
    if (JSON.stringify(la) === JSON.stringify(lb)) continue; const p = (a || b).path;
    out.push(!a ? `- **${p}**: свой список убрать (наследует список группы)` : !b ? `- **${p}**: задать свой список — Хіти продажів → Ціна → ${la.map(t).join(' → ')}` : `- **${p}**: было ${['Хіти продажів', 'Ціна', ...lb.map(t)].join(' → ')} → **${['Хіти продажів', 'Ціна', ...la.map(t)].join(' → ')}**`); }
  console.log(`## ${g}\n` + (out.length ? out.join('\n') : 'изменений нет')); }
