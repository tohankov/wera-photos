// Composition of a set expanded down to its leaf components (a component that is itself a set with a WERA composition is opened, up to 4 levels):
// [{art, head, size, vals, nonProduct, set}] — vals from cat/member_vals.json (every group + bits) or, for an article-less row, from the unambiguous
// composition text (sets_fill.fromText). Used by «… у складі» (g_sklad.js) and 1055 (g_trolley.js).
const C = require('./sets_comp.json'), M = require('./member_vals.json'); const { fromText } = require('./sets_fill.js');
function expand(a, depth = 0, seen = new Set([a])) { const out = [];
  for (const g of (C[a] || [])) for (const x of g.items) { if (x.art && seen.has(x.art)) continue;
    const sub = x.art && C[x.art] && C[x.art].length && depth < 4; const m = x.art && M[x.art] ? M[x.art] : (x.art ? null : fromText(g.head, x.size));
    out.push({ art: x.art, head: g.head, size: x.size, vals: m ? m.vals : {}, nonProduct: !!(m && m.nonProduct), known: !!m, set: !!sub });
    if (sub) out.push(...expand(x.art, depth + 1, new Set([...seen, x.art]))); }
  return out; }
module.exports = { expand, hasComp: a => !!(C[a] && C[a].length) };
