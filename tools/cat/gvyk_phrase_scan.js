// Owner 25.10.2026: one WERA sentence per feature our text does not name (Lasertip, Take it easy, Hex-Plus, Black Point, VDE / ударний / магніт / HF).
// Scan (read-only): for every visible product of the group, the feature named in a SHORT bullet line of the datasheet page 1 (the product's own text)
// and absent from our UA prose -> {art: [{f, line}]} + the distinct WERA lines (each translated once).   node cat/gvyk_phrase_scan.js <group live.json> <out.json>
const fs = require('fs'), path = require('path'); const [, , LIVE, OUT] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1);
const FEAT = [['Lasertip', /Lasertip/i, /Lasertip/i], ['Take it easy', /Take it easy/i, /Take it easy/i], ['Hex-Plus', /Hex-Plus/i, /Hex-Plus/i], ['Black Point', /Black Point/i, /Black Point/i],
  ['VDE', /\bVDE\b|изолирова/i, /\bVDE\b|ізольован/i], ['ударний', /ударн(?!о-поворот)/i, /ударн/i], ['магніт', /(?<!не|без )магнит/i, /магніт/i], ['HF', /фиксирующ/i, /фіксуюч|\bHF\b/i]];
const p1 = a => { try { return fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8').split('\n').filter(l => l.startsWith('p1 ')).map(l => l.slice(3)); } catch { return []; } };
const prose = h => String(h || '').replace(/<table[\s\S]*?<\/table>/g, '').replace(/<h3>(?:Інші варіанти|Дізнайтеся більше)[\s\S]*$/, '').replace(/<[^>]+>/g, ' ');
const out = {}, lines = {};
for (const p of L) { const a = p.article; const ds = p1(a); if (!ds.length) continue; const ours = prose(p.description.ua);
  // the short bullet lines: after the header block (EAN / № / тариф) and before the long description paragraph; a bullet is < 140 chars, no « | »
  const bul = ds.slice(1).filter(l => l.length < 140 && !/\|/.test(l) && !/^(EAN|№|тарифа|происхождения|Ссылка|https?:|Wera )/.test(l) && /^[А-ЯЁA-Z]/.test(l));
  for (const [f, re, our] of FEAT) { if (our.test(ours)) continue; const l = bul.find(x => re.test(x)); if (!l) continue; (out[a] = out[a] || []).push({ f, line: l }); lines[l] = (lines[l] || 0) + 1; } }
fs.writeFileSync(OUT, JSON.stringify({ products: out, lines }, null, 1));
console.log('products', Object.keys(out).length, 'phrases', Object.values(out).flat().length, 'distinct WERA lines', Object.keys(lines).length);
const by = {}; for (const v of Object.values(out).flat()) by[v.f] = (by[v.f] || 0) + 1; console.log(by); for (const [l, n] of Object.entries(lines).sort((x, y) => y[1] - x[1])) console.log(n, '|', l);
