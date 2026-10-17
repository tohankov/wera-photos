// Series facts for the title template: WERA model code («867/4 Z», «851/1 BTZ», «8767 B HF», «367») and the size part of the datasheet title
// («TX 20 x 70 мм» -> «TX 20×70 мм»), both from the WERA datasheet (names/ds.js).
const ds = require('./ds.js'); const { RULES } = require('./rules.js');
const fmt = t => RULES.filter(([id]) => ['inch', 'dec', 'mm', 'prof', 'x', 'tm'].includes(id)).reduce((s, [, , f]) => f(s), t).replace(/\s{2,}/g, ' ').trim();
// model: leading tokens of the datasheet title — a number («867/4», «8767», «367») then short Latin codes («Z», «BTZ», «B», «HF», «SB») — up to a ® word, a Cyrillic word or a comma
function model(title) { const tok = title.split(' '); if (!/^\d/.test(tok[0] || '')) return '';
  const out = [tok[0].replace(/,$/, '')]; if (/,$/.test(tok[0])) return out[0];
  for (const w of tok.slice(1)) { if (/[а-яё]/i.test(w) || /®/.test(w) || !/^[A-Z0-9]{1,4},?$/.test(w) || /^(PH|PZ|TX|HEX|SL|IP|IPR|SW)$/.test(w.replace(',', ''))) break; out.push(w.replace(/,$/, '')); if (/,$/.test(w)) break; }
  return out.join(' '); }
// size part: «PH 2 x 25 мм», «TX 20 x 70 мм», «1,0 x 5,5 x 70 мм», «5/16" x 50 мм», «20 IP x 60 мм», «# 2 x 25 мм»
const SZ = /(?:(?:PH\/S|PZ\/S|PH|PZ|TX|HEX|SL|SW|#) ?)?(?:\d+[,.]?\d*(?:\/\d+)?"? ?(?:IPR?|IP)? ?x ?)+\d+[,.]?\d*(?:\/\d+)?"? ?мм/g;
function size(title) { const m = title.match(SZ); return m ? fmt(m[m.length - 1].replace('# ', '#')) : ''; }
function facts(a) { const d = ds(a); if (!d) return null; return { ...d, model: model(d.title), size: size(d.title) }; }
const hasModel = (t, m) => !!m && new RegExp(String.raw`(^|[\s(«])${m.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?=[\s,)»]|$)`).test(t);
module.exports = { facts, model, size, hasModel, fmt };
if (require.main === module) for (const a of process.argv.slice(2)) { const f = facts(a); console.log(a, f && f.title, '|', f && f.model, '|', f && f.size); }
