// «Діелектричні інструменти» text fixes for cat/global_desc_plan.js (owner 26.10.2026, docs/global_vde.md answer 1):
// Kompakt VDE sets — «154 мм» of the interchangeable blades -> «157 мм» where the set's datasheet gives the blades as «… x 157 мм» and never «x 154 мм»
// (712 i VDE adapter 05006642001 / 05073702001 is 154 мм by its own datasheet — not a set, not touched); prose only, tables untouched.
const fs = require('fs'), path = require('path'); const C = require('./ds_comp_all.json');
const dsTxt = a => { try { return fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8'); } catch { return ''; } };
module.exports = (p, lang, h) => { const a = p.article; const why = [];
  // Christmas calendar 2024: its composition table writes sizes «1/4″ x 50 мм» — «×» there too (the variant tables are already in our format)
  if (a === '05136609001') { const o = h.replace(/>([^<]+)</g, (m, s) => '>' + s.replace(/(\d″?)\s?x\s?(?=\d)/g, '$1×') + '<'); if (o !== h) { why.push('«x» → «×» в таблице состава'); h = o; } }
  if (!C[a]) return { html: h, why }; const t = dsTxt(a); if (!/x 157 мм/.test(t) || /x 154 мм/.test(t)) return { html: h, why };
  const out = h.split(/(<table[\s\S]*?<\/table>)/).map((part, i) => i % 2 ? part : part.replace(/>([^<]+)</g, (m, s) => '>' + s.replace(/\b154 мм/g, '157 мм') + '<')).join('');
  if (out !== h) why.push('154 → 157 мм (паспорт набора: вставки «x 157 мм»)'); return { html: out, why }; };
