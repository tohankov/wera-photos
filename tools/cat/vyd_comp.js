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
// owner 22.10.2026: handles and T-handles with a ratchet function (416 RA, 838 RA, 816 RA, 837 i RA, 410 RA, 80 RA, 814 RA, 411 A RA) are NOT ratchets;
// nor are parts of one (a socket «для трещотки», a pouch, an extension, an empty insert). A ratchet: Zyklop / Bit Ratchet / Koloss / a Joker ratchet wrench.
const RA_HANDLE = s => /ручк|рукоятк|битодержател|отв[её]ртка-(адаптер|переходник)/i.test(s) && !/Zyklop|Bit Ratchet|Koloss|ключ/i.test(s);
has.ratchetTool = s => has.ratchet(s) && !RA_HANDLE(s) && !/для трещотки|кожух|удлинитель|ложемент|неукомплект|Koloss Комплект/i.test(s);
// what a «Набір …» value needs in the composition
const NEED = { 'Набір з тріскачкою': ['тріскачка', s => s.split(' | ').some(h => has.ratchetTool(h))], 'Викрутка з набором біт': ['ручка-тримач + біти / вставки', s => has.handle(s) && has.bits(s)], 'Набір викруток': ['викрутка (або ручка + біти / стрижні)', s => has.driver(s) || (has.handle(s) && has.bits(s))],
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

// ---- «Вид інструменту» of the groups «Викрутки», Kraftform Kompakt, «Діелектричні» by the WERA composition (owner 22.10.2026, docs/preview_vid.md decisions)
// type of one composition row (RU datasheet head); Latin look-alikes («pучка», «Tрещотка») are normalised first
function ctype(h) { const s = h.replace(/[pP](?=учк)/g, 'р').replace(/T(?=рещотк)/g, 'Т').replace(/\s+/g, ' ').trim();
  if (/^(x )?\d+(,\d+)?( ?- ?\d+(,\d+)?)? ?(нм|nm)(?![a-zа-я])/i.test(s)) return 'dyn';                            // a torque tool row without its name («x 4 нм x 192 мм», «1,2-3,0 Nm»: 7441, 7508 / 7516 VDE)
  if (!/[A-Za-zА-Яа-яЁёІіЇїЄє]{3}/.test(s)) return 'unknown';                                           // a broken row («, 1/4" x 300 мм»)
  if (/\d+ предмет|набор(?! полосок)/i.test(s) && !/насадк|бит/i.test(s)) return 'set';                // a nested set (Tool Finder, Bit-Safe, «Набор отверток …»)
  if (/липуч|полос|футляр|чехол|сумк|подсумок|контейнер|коробк|органайзер|пояс|belt|holster|прокладк|витрин|пустая|неукомплект|подставк|держатель настенн|зажим для|магнит adk|маркер|открыв|поднос|переходник для 9549|шарнир для 9550|держатель для размещения/i.test(s)) return 'acc';
  if (/тестер|индикатор/i.test(s)) return 'tester';
  if (/динамометр|\d+(,\d+)? ?- ?\d+(,\d+)? ?(nm|нм)\b|x \d+ нм|torque/i.test(s)) return 'dyn';
  if (/ручк|рукоятк/i.test(s) && !/отв[её]р?т?к[аи]? (для|с поперечн|tor|hex|с фикс)|отв[её]ртка с поперечной|шестигранная отв|отв[её]ртка torx|hf отв/i.test(s)) return 'handle';
  if (/битодержатель с поперечной|отв[её]ртка-адаптер|т-образная отв[её]ртка-переходник|814 RA Отвертка Kraftform с механизмом/i.test(s)) return 'handle';   // handles with a ratchet function are handles
  if (has.ratchetTool(s)) return 'ratchet';
  if (/насадк|\bбит|биты|бита\b/i.test(s)) return 'bit';
  if (/отв[её]р?т?к|торцовый ключ для электронщ|съёмник|инструмент для клеммных/i.test(s)) return 'driver';
  if (/take it easy|Kraftform Kompakt (VDE )?\d+|рабочий конец|^869\b|869\/\d|торцовые головки, магнитные/i.test(s)) return 'bit';   // Kompakt blades, Vario ends, 869/4 nut bits with a 1/4" shank
  if (/г-образн/i.test(s)) return 'lkey';
  if (/ключ/i.test(s)) return 'key';
  if (/головк|торцов/i.test(s)) return 'socket';
  if (/универсальный держатель|битодержатель|оправка|переходник|удлинитель|соединительн|карданн|адаптер/i.test(s)) return 'holder';
  return 'other'; }
// owner's product decisions (22.10.2026)
const KIND_OWNER = { '05136072001': ['Викрутка з набором біт', '416 RA + 816 R + 14 біт + 2 × 869/4 M'], '05136078001': ['Набір викруток', 'рішення власника: залишити'], '05136079001': ['Набір викруток', 'рішення власника: залишити'],
  '05006632001': ['Набір інструментів', '9 торцевих головок Zyklop VDE 8790 A'], '05006610001': ['Набір інструментів', 'кліщі KNIPEX 08 26 185'],
  '05006612001': ['Набір інструментів', 'кліщі KNIPEX VDE 13 96 200'],
  '05008101001': ['Викрутка', 'інструмент 338 — викрутка'], '05008102001': ['Викрутка', 'інструмент 338 — викрутка'], '05008100001': ['Набір викруток', '2 × 338'] };
const STAND = /підставк|тримач для розміщення|магнітний тримач/i;   // stands and holders for screwdrivers / bits (and the Joker holder in «Викрутки → Приладдя»)
// kind(a, title, now) -> { to: [values], rule, border, cnt, tester }   border: F = composition missing / not parsed -> kept as is
function kind(a, t, now) { const cmp = comp(a); const fst = first(a);
  const prts = cmp.map(g => ({ head: g.head, type: ctype(g.head), n: g.items.reduce((s, i) => s + (i.qty || 1), 0) })); const cnt = {}; for (const x of prts) cnt[x.type] = (cnt[x.type] || 0) + x.n;
  const tester = prts.some(x => x.type === 'tester');
  // the handle is often the product itself — the composition table lists only its bits (Kompakt 20/22/25/28, Stubby RA, Pistol, 838 RA …)
  let implicit = false; if (!cnt.handle && !cnt.driver && cnt.bit && /ручк|ручка-біт|викрутк|отв[её]ртк|Kompakt \d|Kompakt Stubby|Pistol|Turbo/i.test(t + ' ' + fst)) { cnt.handle = 1; implicit = true; }
  const R = (to, rule, border = null) => ({ to: Array.isArray(to) ? to : [to], rule, border, cnt, tester, implicit });
  const merged = [...new Set(now.map(x => x === 'Приладдя для викруток' ? 'Приладдя' : x))];   // «Приладдя для викруток» merged into «Приладдя»
  if (KIND_OWNER[a]) return R(KIND_OWNER[a][0], 'рішення власника: ' + KIND_OWNER[a][1]);
  const accOnly = now.length && now.every(x => /^Приладдя/.test(x)) && !/^Набір/i.test(t);
  const isSet_ = !accOnly && (isSet(a) || now.some(x => /^Набір/.test(x)));
  // owner 22.10.2026 (docs/report_1022.md item 3): a torque tool in the WERA composition — one kind «Набір з динамометричним інструментом» (the main tool, as with
  // a ratchet; a torque wrench with a ratchet head is a torque tool), no second kind; checked before the ratchet and before an unparsed composition
  if (isSet_ && cnt.dyn) return R('Набір з динамометричним інструментом', 'у складі динамометричний інструмент');
  if (isSet_ && cnt.ratchet) return R('Набір з тріскачкою', 'у складі тріскачка');   // even when other rows of the composition are not parsed
  if (isSet_) { if (!cmp.length || cnt.unknown || (cnt.set && prts.every(x => x.type === 'set' || x.type === 'acc'))) return R(merged, cmp.length ? 'склад у паспорті неповний / вкладені набори — як є' : 'складу в паспорті немає — як є', 'F');
    const nh = cnt.handle || 0, nb = cnt.bit || 0, nd = cnt.driver || 0, nr = cnt.ratchet || 0;
    const tools = ['other', 'set', 'key', 'lkey', 'socket'].reduce((s, k) => s + (cnt[k] || 0), 0);
    if (nr) return R('Набір з тріскачкою', 'у складі тріскачка');
    if (tools && !nh && !nb && !nd && !tester) { for (const [k, v] of [['key', 'Набір ключів'], ['lkey', 'Набір Г-подібних ключів'], ['socket', 'Набір головок']]) if ((cnt[k] || 0) === tools) return R(v, 'тільки ' + k); }
    if (tools) return R('Набір інструментів', 'інструменти різних видів, тріскачки немає');
    if (nd) return R('Набір викруток', 'викрутки' + (nh || nb ? ' + ручка / біти' : '') + (tester ? ' + індикатор напруги' : ''));
    if (nh && nb) return R('Викрутка з набором біт', (nh > 1 ? nh + ' ручки-тримачі' : 'ручка-тримач') + ' + біти / вставки' + (tester ? ' + індикатор напруги' : '') + (implicit ? ' (ручка — сам товар, у складі тільки біти)' : ''));
    if (nb && !nh) return R('Набір біт', 'біти без ручки');
    return R(merged, 'склад не розпізнано — як є', 'F'); }
  if (merged.includes('Приладдя') && STAND.test(t)) return R(merged.map(x => x === 'Приладдя' ? 'Підставка / тримач' : x), 'підставка / тримач (назва, паспорт)');
  return R(merged, merged.join() !== now.join() ? '«Приладдя для викруток» → «Приладдя»' : 'як є'); }
// «З індикатором напруги» (Особливості викрутки): a voltage tester is in the WERA composition of the set (owner 22.10.2026)
const withTester = a => comp(a).some(g => ctype(g.head) === 'tester');
// generators (owner 22.10.2026): the written kind of every product of the three groups is cat/vyd_final.json (built by cat/vyd_1022.js from the site);
// a product not in it (new) gets kind() of the generator's own value. compute=false (cat/import_group.js, every group): only vyd_final.json.
// A «Викрутка з набором біт» carries no «Довжина стрижня»; a set with a voltage tester in the composition gets «З індикатором напруги».
let FINAL = null; const finalOf = a => { if (FINAL === null) { try { FINAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'vyd_final.json'), 'utf8')); } catch (e) { FINAL = {}; } } return FINAL[a]; };
function finishKinds(items, compute = true) { for (const it of items) { const now = (it.vals || {}).vyd_instrumentu || []; if (!now.length) continue;
  const to = finalOf(it.a) || (compute ? kind(it.a, it.title || '', now).to : now); it.vals.vyd_instrumentu = to;
  if (!compute) continue;
  if (to.includes('Викрутка з набором біт') && 'dovzhyna_stryzhnia' in it.vals) it.vals.dovzhyna_stryzhnia = [];
  if ('osoblyvosti_vykrutky' in it.vals && to.some(x => /^Набір|з набором/.test(x)) && withTester(it.a)) it.vals.osoblyvosti_vykrutky = [...new Set([...(it.vals.osoblyvosti_vykrutky || []), 'З індикатором напруги'])]; } return items; }
module.exports = { COMP, has, NEED, ACC, isSet, compText, supports, text, first, parts, ctype, kind, withTester, KIND_OWNER, finishKinds };
