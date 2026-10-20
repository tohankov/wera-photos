// Owner 22.10.2026 — decisions on docs/preview_vid.md, groups «Викрутки» (1098), «Інструменти серії Kraftform Kompakt» (1057), «Діелектричні інструменти» (1224):
//  - «Вид інструменту» by the WERA composition (cat/vyd_comp.js kind()): «Викрутка з набором біт» = one or more handles + bits / Kompakt blades / Vario ends
//    (869/4 nut bits are bits), no screwdrivers or other tools; «Набір викруток» = screwdrivers (+ stand / tester / bag); «Набір з тріскачкою» = a ratchet in the
//    composition (ratchet-function handles 416 RA, 838 RA … are not ratchets); «Набір інструментів» = tools of different kinds, no ratchet; F (no / unparsed
//    composition) and torque sets — as is; «Приладдя для викруток» -> «Приладдя»; stands / holders -> «Підставка / тримач»; owner's list KIND_OWNER;
//  - «Довжина стрижня» is the blade length of a screwdriver only: a «Викрутка з набором біт» does not get it (bit length is not a blade length);
//  - «Особливості викрутки»: + «З індикатором напруги» on every set with a voltage tester in the WERA composition (only added).
// Sections (parent / alt_parent) are not touched.
//   node cat/vyd_1022.js <live.json>  -> cat/vyd_final.json (kind per article for the generators, always); cat/vyd_1022_plan.json (night_write plan)
//   and cat/vyd_1022_rows.json — only when something is to change (a rerun on the written site keeps the plan of 22.10)
const fs = require('fs'), path = require('path'); const C = require('./vyd_comp.js');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const MAP = require('../../inventory/sections_map.json');
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const GROUPS = ['Викрутки', 'Інструменти серії Kraftform Kompakt', 'Діелектричні інструменти'];
const secs = p => [...new Set([p.parent && +p.parent.id, ...(p.alt_parent || []).map(x => +x.id)].filter(Boolean))];
const inG = id => { const pth = (MAP.sections[id] || {}).path || ''; return GROUPS.some(g => pth === g || pth.startsWith(g + ' →')); };
const ps = L.filter(p => secs(p).some(inG));
const TESTER = 'З індикатором напруги';
const rows = [], plan = [], final = {};
for (const p of ps) { const a = p.article, now = v(p, 'vyd_instrumentu'); const k = C.kind(a, p.title.ua, now);
  const ch = {}; const S_ = x => JSON.stringify([...x].sort());
  if (S_(k.to) !== S_(now)) ch.vyd_instrumentu = k.to;
  const len = v(p, 'dovzhyna_stryzhnia'); if (k.to.includes('Викрутка з набором біт') && len.length) ch.dovzhyna_stryzhnia = [];
  const feat = v(p, 'osoblyvosti_vykrutky'); const isSetK = k.to.some(x => /^Набір|з набором/.test(x));
  if (isSetK && C.withTester(a) && !feat.includes(TESTER)) ch.osoblyvosti_vykrutky = [...feat, TESTER];
  final[a] = k.to;
  rows.push({ a, title: p.title.ua, vis: +p.display_in_showcase === 1, now: now.join(' + '), to: k.to.join(' + '), rule: k.rule, border: k.border, len: len.join(', '), lenOff: !!ch.dovzhyna_stryzhnia,
    tester: !!ch.osoblyvosti_vykrutky, feat: feat.join(', '), secs: secs(p).map(id => (id === +p.parent.id ? '' : 'alt: ') + ((MAP.sections[id] || {}).path || id)), secIds: secs(p),
    quote: '' });
  if (Object.keys(ch).length) plan.push({ article: a, characteristics: ch }); }
// a datasheet quote per changed product (composition heads or the first line)
for (const r of rows) { const g = C.COMP[r.a] || []; r.quote = g.length ? g.map(x => `${x.items.reduce((s, i) => s + (i.qty || 1), 0)}× ${x.head.replace(/\s+/g, ' ').slice(0, 70)}`).join('; ') : 'паспорт: ' + C.first(r.a); }
if (plan.length) fs.writeFileSync(path.join(__dirname, 'vyd_1022_plan.json'), JSON.stringify({ name: 'vyd_1022', keys: ['vyd_instrumentu', 'dovzhyna_stryzhnia', 'osoblyvosti_vykrutky'], products: plan }, null, 1));
fs.writeFileSync(path.join(__dirname, 'vyd_final.json'), JSON.stringify(final, null, 0));
if (plan.length) fs.writeFileSync(path.join(__dirname, 'vyd_1022_rows.json'), JSON.stringify(rows, null, 1));
const c = {}; for (const r of rows) c[r.to] = (c[r.to] || 0) + 1;
console.log('products', ps.length, '| plan', plan.length, '| vyd changes', plan.filter(x => x.characteristics.vyd_instrumentu).length, '| length off', plan.filter(x => x.characteristics.dovzhyna_stryzhnia).length, '| tester feature', plan.filter(x => x.characteristics.osoblyvosti_vykrutky).length);
console.log(c);
