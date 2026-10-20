// «Вид інструменту» against the WERA datasheet composition (owner 21.10.2026): one place for the audit (cat/vyd_audit.js) and the generators.
// Composition: cat/ds_comp_all.json (every datasheet, lib/ds_set.mjs; built by cat/ds_comp_all.js) + nested components (their own composition and datasheet name).
//   supports(a, 'Набір з тріскачкою') -> true (the composition has it) | 'text' (only the datasheet text mentions it) | false (it does not) | null (no datasheet)
const fs = require('fs'), path = require('path');
const COMP = (() => { try { return require('./ds_comp_all.json'); } catch (e) { return {}; } })();
const DS = path.join(__dirname, '../batch/ds');
const text = a => { const f = path.join(DS, a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/^p\d+ /gm, '') : ''; };
const first = a => text(a).split('\n')[0] || '';
// WERA ratchets: «Трещотка», 8000–8011 (Zyklop Speed / Metal / Comfort / Hybrid / Mini / Pocket, Bit Ratchet, Koloss); 8000 E is the deblocker
const has = {
  ratchet: s => /трещ[оё]тк|ratchet|ratsche|\b80(0[0-9]|1[01])(?! E)\b|Zyklop (Speed|Metal|Comfort|Hybrid|Mini|Pocket)|Koloss/i.test(s),
  driver: s => /отв[её]р?т?к|викрутк|торцовый ключ для электронщ/i.test(s),   // 2069 «Торцовый ключ для электронщиков» is a nut driver (catalog: Викрутка)
  handle: s => /ручк|рукоятк|держатель для насадок/i.test(s),
  bits: s => /насадк|\bбит(?!одерж)|бита|биты|\bbits?\b|Kraftform Kompakt|Take it easy/i.test(s),   // Kompakt blades are interchangeable like bits
  heads: s => /голов|торцов|socket/i.test(s),
  lkey: s => /г-образн|г-подібн/i.test(s),
  key: s => /ключ/i.test(s),
  dyn: s => /динамометр|torque|\d+(,\d+)? ?- ?\d+(,\d+)? ?(nm|нм)\b|x \d+ нм/i.test(s),
  adapter: s => /переходник|адаптер|оправк|удлинит/i.test(s),
  tap: s => /метчик/i.test(s) };
// what a «Набір …» value needs in the composition
const NEED = { 'Набір з тріскачкою': ['тріскачка', s => has.ratchet(s)], 'Набір викруток': ['викрутка (або ручка + біти / стрижні)', s => has.driver(s) || (has.handle(s) && has.bits(s))],
  'Набір біт': ['біти', s => has.bits(s)], 'Набір головок': ['головки', s => has.heads(s)], 'Набір Г-подібних ключів': ['Г-подібні ключі', s => has.lkey(s)], 'Набір ключів': ['ключі', s => has.key(s)],
  'Набір з динамометричним інструментом': ['динамометричний інструмент', s => has.dyn(s)], 'Набір перехідників': ['перехідники', s => has.adapter(s)], 'Набір мітчиків': ['мітчики', s => has.tap(s)],
  'Набір інструментів': ['2+ різних інструменти', () => true] };
// components that do not make a set of tools: holders, pouches, velcro strips, displays, pads
const ACC = /липуч|полос|футляр|сумк|чехол|holster|прокладк|витрин|пустая|подколенн|держатель для головок|магнитн[а-я]* держатель/i;
const comp = a => COMP[a] || [];
const parts = a => comp(a).flatMap(g => g.items.map(i => ({ head: g.head, art: i.art, qty: i.qty, size: i.size })));
function isSet(a) { const tools = comp(a).filter(g => !ACC.test(g.head));
  return new Set(tools.flatMap(g => g.items.map(i => i.art || g.head + i.size))).size >= 2 || (tools.length === 1 && tools[0].items.some(i => i.qty >= 2 && /наб|set/i.test(tools[0].head))); }
// composition heads + nested components (their composition heads and datasheet name) + the set's own datasheet name
function compText(a) { const nested = parts(a).filter(x => x.art && x.art !== a).flatMap(x => [...comp(x.art).map(g => g.head), first(x.art)]);
  return [...new Set(comp(a).map(g => g.head)), ...nested, first(a)].filter(Boolean).join(' | '); }
function supports(a, val) { const need = NEED[val]; if (!need) return null; if (!text(a)) return null;
  if (need[1](compText(a))) return true; return need[1](text(a)) ? 'text' : false; }
module.exports = { COMP, has, NEED, ACC, isSet, compText, supports, text, first, parts };
