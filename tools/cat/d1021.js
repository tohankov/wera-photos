// Owner's answers 21.10.2026 to docs/night_report.md (items 1, 6, 7, 8, 9) -> plans for cat/night_write.js:
//  d1021_vk   («Викрутки»): 1) 2055 PZ / 1555 PZ ESD stored as PH -> «Профіль» PZ, «Профіль і розмір» «PZ 0» / «PZ 1» (WERA datasheet first line);
//             05030109001 (1550 PH S ESD, «# 1 x 40») -> «Профіль і розмір: PH 1» (owner); 7) «Особливості викрутки» + «ESD» (title says ESD / «з електростатичним
//             захистом» and the WERA datasheet says ESD / «электростатически безопасный»; remover 05027450001 — not touched) and + «Нержавіюча сталь»
//             (title + datasheet «нержаве»); values only added.
//  d1021_misc: 8) adapter 9549 / hinge 9550 -> «Вид інструменту: Приладдя»; 6) Zyklop belts in «Набори головок» -> + alt_parent «Приладдя Zyklop» of their drive
//             (magnetic holders already have it as the main section); 9) 950 SPKL 05022514001 (8 × 195, EAN 4013288036803) is not 950 PKL BM 05027108001
//             (8 × 200, EAN 4013288095060) -> + alt_parent «Г-подібний ключ з кульковою головкою, метричний, BlackLaser» and «Особливості ключа: Кулькова головка»
//             (datasheet: «С шестигранным шариковым наконечником на длинной стороне ключа»), the other ball-head keys of that section carry it.
//   node cat/d1021.js <live.json>
const fs = require('fs'), path = require('path'); const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const T = require('../sections/tree_now.json');
const kids = {}; for (const p of T) (kids[p.parent] = kids[p.parent] || []).push(p.id); const sub = r => { const s = new Set([r]), q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.add(k); q.push(k); } return s; };
const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number), v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const by = Object.fromEntries(L.map(p => [p.article, p])); const ds = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const stop = m => { console.log('STOP', m); process.exit(2); };
const SKIP = new Set(['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001']);
// --- d1021_vk
const vk = {}; const put = (a, k, val) => { (vk[a] = vk[a] || { article: a, characteristics: {} }).characteristics[k] = val; };
const PZ = { '05118030001': 'PZ 0', '05118032001': 'PZ 1', '05030115001': 'PZ 0', '05030116001': 'PZ 1' };
for (const [a, val] of Object.entries(PZ)) { const p = by[a]; const d = (ds(a) || '').split('\n')[0]; if (!new RegExp(val.replace(' ', ' ') + ' x').test(d) || !v(p, 'profil').includes('PH (Phillips)')) stop(a + ' datasheet/now: ' + d);
  put(a, 'profil', ['PZ (Pozidriv)']); put(a, 'rozmir_nakonechnyka', [val]); }
{ const a = '05030109001', d = (ds(a) || '').split('\n')[0]; if (!/PH S ESD .*# 1 x 40/.test(d) || v(by[a], 'rozmir_nakonechnyka').length) stop(a + ' ' + d); put(a, 'rozmir_nakonechnyka', ['PH 1']); }
const G = sub(1098); const rows = [];
for (const p of L) { const a = p.article; if (!secs(p).some(s => G.has(s)) || SKIP.has(a)) continue; const t = p.title.ua, f = v(p, 'osoblyvosti_vykrutky'), d = ds(a); const add = [];
  if (/ESD|електростатичн/i.test(t) && !f.includes('ESD')) { const ok = d && /ESD|электростатич/i.test(d); rows.push({ a, t, what: 'ESD', res: ok ? '+' : 'нема даташита / ESD у ньому' }); if (ok) add.push('ESD'); }
  if (/нержав/i.test(t) && !f.includes('Нержавіюча сталь')) { const ok = d && /нержаве/i.test(d); rows.push({ a, t, what: 'Нержавіюча сталь', res: ok ? '+' : 'нема даташита / «нержаве» у ньому' }); if (ok) add.push('Нержавіюча сталь'); }
  if (add.length) put(a, 'osoblyvosti_vykrutky', [...f, ...add]); }
fs.writeFileSync(path.join(__dirname, 'd1021_vk_plan.json'), JSON.stringify({ name: 'd1021_vk', keys: ['profil', 'rozmir_nakonechnyka', 'osoblyvosti_vykrutky'], products: Object.values(vk) }, null, 1));
console.log('d1021_vk', Object.keys(vk).length, '| ESD +', rows.filter(r => r.what === 'ESD' && r.res === '+').length, '| stainless +', rows.filter(r => r.what !== 'ESD' && r.res === '+').length);
for (const r of rows.filter(r => r.res !== '+')) console.log('  not written', r.a, r.what, r.res, '|', r.t.slice(0, 70));
fs.writeFileSync(path.join(__dirname, 'd1021_vk_rows.json'), JSON.stringify(rows, null, 1));
// --- d1021_misc
const misc = [];
for (const a of ['05049005001', '05049004001']) { if (!v(by[a], 'vyd_instrumentu').includes('Набір з тріскачкою')) stop(a + ' vyd'); misc.push({ article: a, characteristics: { vyd_instrumentu: ['Приладдя'] } }); }
const ACC = { 1281: 1284, 1306: 1309, 1294: 1298 };   // «Набори головок Zyklop» of a drive -> «Приладдя Zyklop» of the same drive
for (const a of ['05136420001', '05136421001', '05136422001', '05003890001', '05003891001', '05003980001', '05003981001', '05003982001', '05003892001', '05003893001']) { const p = by[a], s = secs(p);
  const hs = s.filter(x => ACC[x]); if (hs.length !== 1) stop(a + ' head-set sections ' + hs); const want = ACC[hs[0]]; if (s.includes(want)) { console.log('  already in «Приладдя»:', a, p.title.ua.slice(0, 50)); continue; }
  misc.push({ article: a, alt_parent: [...(p.alt_parent || []).map(x => ({ id: +x.id })), { id: want }], characteristics: {} }); }
{ const a = '05022514001', p = by[a], d = ds(a); if (!/шариковым наконечником/.test(d) || !/4013288036803/.test(d) || /4013288036803/.test(ds('05027108001'))) stop('950 SPKL check');
  misc.push({ article: a, alt_parent: [...(p.alt_parent || []).map(x => ({ id: +x.id })), { id: 1176 }], characteristics: { osoblyvosti_kliucha: [...v(p, 'osoblyvosti_kliucha'), 'Кулькова головка'] } }); }
fs.writeFileSync(path.join(__dirname, 'd1021_misc_plan.json'), JSON.stringify({ name: 'd1021_misc', keys: ['vyd_instrumentu', 'osoblyvosti_kliucha'], alt: true, products: misc }, null, 1));
console.log('d1021_misc', misc.length, misc.map(x => x.article + (x.alt_parent ? ' alt ' + x.alt_parent.map(y => y.id).join('+') : '') + ' ' + JSON.stringify(x.characteristics)).join('\n  '));
