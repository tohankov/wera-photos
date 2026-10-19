// PREVIEW ONLY (owner 19.10.2026, tasks 1 and 2; nothing is written to the site):
//   1) «Розмір наконечника» -> «Профіль і розмір» («PH 2», «SL 1,0×5,5»…), TX BO -> TX + «З отвором (TX BO)»  -> inventory/vikrutky_size_preview.xlsx
//   2) «… у складі» get the sizes of their profile instead of «Так» (AND across profiles)                        -> inventory/sets_sizes_preview.xlsx
//   node cat/pr_size_preview.js <live.json> <filters_scan.json> <pages_export.json> [summary.json]
// live.json: lib/full_export.js (article,title,mod_title,parent,alt_parent,display_in_showcase,characteristics,link); filters_scan.json: vt/filters_scan.js
// (what the storefront shows today); pages_export.json: horoshop_pages_export (section tree).
const fs = require('fs'), X = require('xlsx'); const P = require('./pr_size.js');
const [, , LF, FF, PF, OUT] = process.argv; const L = JSON.parse(fs.readFileSync(LF, 'utf8')); const SCAN = JSON.parse(fs.readFileSync(FF, 'utf8'));
const PAGES = JSON.parse(fs.readFileSync(PF, 'utf8')).response.pages; const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const par = Object.fromEntries(PAGES.map(p => [p.id, p.parent])), nm = Object.fromEntries(PAGES.map(p => [p.id, p.title.ua.trim()]));
const path_ = id => { const ch = []; let x = +id; while (x && x !== 97 && x !== 1) { ch.unshift(nm[x]); x = par[x]; } return ch.join(' → '); };
const under = (id, r) => { let x = +id; while (x) { if (x === r) return true; x = par[x]; } return false; };
const order = []; const walk = id => { order.push(id); for (const c of PAGES.filter(p => p.parent === id)) walk(c.id); };
const ctx = P.build(L); const { rows } = ctx; const v = ctx.v; const S = P.buildSklad(L, ctx); const byA = Object.fromEntries(L.map(p => [p.article, p]));
const secOf = p => [p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number); const vis = p => +p.display_in_showcase === 1;
process.env.SETS_FILL = 'off'; const grp = {}; for (const g of ['vykrutky', 'kk', 'dyn', 'vde', 'bitsets', 'zyklop', 'lkeys', 'trolley']) for (const i of require(`./g_${g}.js`).items) (grp[i.a] = grp[i.a] || new Set()).add(g);
const TXBO = 'TX BO (TORX® з отвором)', TX = 'TX (TORX®)', BOFEAT = 'З отвором (TX BO)', BOFEAT_RU = 'С отверстием (TX BO)';
// task 1, item 6: «Профіль» of the screwdriver group — TX BO becomes TX, the hole goes to «Особливості викрутки». Only products of the Викрутки group (1098);
// a product of another group keeps TX BO if that group gives it (profile is a union across groups).
const vk = new Set(require('./g_vykrutky.js').items.map(i => i.a));
const boRows = L.filter(p => vk.has(p.article) && v(p, 'profil').includes(TXBO)).map(p => { const other = [...(grp[p.article] || [])].filter(g => g !== 'vykrutky');
  const prof = v(p, 'profil'); const next = [...new Set(prof.map(x => x === TXBO && !other.length ? TX : x))]; const feat = v(p, 'osoblyvosti_vykrutky');
  return { a: p.article, title: p.title.ua, sec: path_(p.parent.id), vis: vis(p) ? 'так' : 'ні', other: other.join(', '), profNow: prof.join(', '), profNext: next.join(', '), featNow: feat.join(', '), featNext: [...feat, BOFEAT].join(', ') }; });
const profAfter = p => { const b = boRows.find(r => r.a === p.article); return b ? b.profNext.split(', ') : v(p, 'profil'); };
const rowOf = Object.fromEntries(rows.map(r => [r.a, r]));
// ---------- task 1 workbook ----------
const wb = X.utils.book_new(); const add = (b, data, name, w) => { const ws = Array.isArray(data[0]) ? X.utils.aoa_to_sheet(data) : X.utils.json_to_sheet(data); if (w) ws['!cols'] = w.map(x => ({ wch: x })); X.utils.book_append_sheet(b, ws, name); };
// dictionary 392 after the change, in order
const dict = new Map(); for (const r of rows) r.pairs.forEach((q, i) => { const k = r.short[i]; const d = dict.get(k) || { q, short: k, shortRu: r.shortRu[i], full: r.full[i], fullRu: r.fullRu[i], n: 0, nv: 0 }; d.n++; if (vis(r.p)) d.nv++; dict.set(k, d); });
const dictRows = [...dict.values()].sort((x, y) => P.PR[x.q[0]][2] - P.PR[y.q[0]][2] || P.pcmp(x.q[0], x.q[1], y.q[1]));
const EX_V = ['PH 2', 'PZ 1', 'TX 20', 'IP 5', 'IPR 8', 'SL 1,0×5,5', 'HEX 5,0', 'HEX 3/16″', 'Квадрат #2', 'Торцева 7 мм', 'PZ/S 2', 'Microstix® m', 'Pentalobe 1,4', 'TRI-WING® 2'].filter(x => dict.has(x));
const fmtRows = [['Варіант', 'UA (фільтр і картка)', 'RU', 'Як виглядає у фільтрі «Профіль і розмір» (розділ)', 'Як виглядає на картці товару']];
for (const k of EX_V) { const d = dict.get(k); fmtRows.push(['А — короткий', d.short, d.shortRu, `☐ ${d.short}  (${d.nv})`, `Профіль і розмір: ${d.short}`]); }
for (const k of EX_V) { const d = dict.get(k); fmtRows.push(['Б — з повною назвою профілю', d.full, d.fullRu, `☐ ${d.full}  (${d.nv})`, `Профіль і розмір: ${d.full}`]); }
add(wb, fmtRows, 'Формат', [26, 46, 46, 50, 60]);
add(wb, [['№', 'А — короткий UA', 'А — RU', 'Б — повний UA', 'Б — RU', 'Товарів', 'з них видимих'], ...dictRows.map((d, i) => [i + 1, d.short, d.shortRu, d.full, d.fullRu, d.n, d.nv])], 'Довідник 392 (порядок)', [5, 22, 22, 50, 50, 9, 9]);
// sections: the screwdriver tree, then Kraftform Kompakt and the torque tree (same characteristic)
walk(1098); walk(1057); walk(1195); const tally = (ps, f) => { const m = new Map(); for (const p of ps) for (const x of f(p)) m.set(x, (m.get(x) || 0) + 1); return m; };
const fmtT = m => [...m].map(([k, n]) => `${k} (${n})`).join(', ');
const secRows = [], single = [];
for (const s of order) { const ps = L.filter(p => vis(p) && secOf(p).includes(s)); const sc = SCAN[s]; if (!ps.length && !(sc && sc.filters.length)) continue;
  const fl = sc ? sc.filters.map(f => f.title).filter(t => t !== '?') : []; const pnow = tally(ps, p => v(p, 'profil')), pnext = tally(ps, profAfter);
  const rnext = new Map(); for (const d of dictRows) { const n = ps.filter(p => rowOf[p.article] && rowOf[p.article].short.includes(d.short)).length; if (n) rnext.set(d.short, n); }
  const shownProf = sc && sc.filters.find(f => f.title === 'Профіль'); const oneProf = pnext.size === 1 && ps.length > 0;
  secRows.push({ 'Розділ (повний шлях)': path_(s), 'Група': under(s, 1098) ? 'Викрутки' : under(s, 1057) ? 'Kraftform Kompakt' : 'Динамометричний', 'Видимих товарів': ps.length,
    'Фільтри зараз (вітрина)': fl.join(', '), 'Профіль зараз': fmtT(pnow), 'Профіль стане': fmtT(pnext), 'Розмір наконечника зараз': fmtT(tally(ps, p => v(p, 'rozmir_nakonechnyka').map(x => x.replace(/\u00a0/g, '')))),
    'Профіль і розмір стане': fmtT(rnext), 'Один профіль': oneProf ? 'так' : '' });
  if (oneProf && shownProf) single.push({ 'Розділ (повний шлях)': path_(s), 'Профіль (одне значення)': [...pnext.keys()][0], 'Фільтри зараз': fl.join(', '),
    'Задати свій список фільтрів': fl.filter(t => t !== 'Профіль').map(t => t === 'Розмір наконечника' ? 'Профіль і розмір' : t).join(', ') }); }
add(wb, secRows, 'Розділи', [80, 16, 9, 70, 50, 50, 70, 90, 8]);
add(wb, single, 'Один профіль', [90, 30, 80, 80]);
add(wb, boRows.map(r => ({ 'Артикул': r.a, 'Назва': r.title, 'Розділ': r.sec, 'Видимий': r.vis, 'Профіль зараз': r.profNow, 'Профіль стане': r.profNext, 'Особливості зараз': r.featNow, 'Особливості стане': r.featNext, 'Інша група (TX BO лишається)': r.other })), 'TX BO', [14, 70, 60, 7, 40, 40, 40, 50, 20]);
const prodRows = rows.map(r => ({ 'Артикул': r.a, 'Назва': r.title, 'Групи': [...(grp[r.a] || [])].join(', '), 'Розділ': path_(r.p.parent.id), 'Видимий': vis(r.p) ? 'так' : 'ні', 'Профіль зараз': r.profOld.join(', '),
  'Розмір наконечника зараз': r.sizeOld.join(', '), 'Профіль і розмір (А)': r.short.join(', '), 'Профіль і розмір (Б)': r.full.join(', '), 'Джерело': r.src, 'Статус': r.status, 'Примітка': r.note.join(' / '),
  'Розміри без пари (зникнуть)': r.lost.join(', '), 'Додано зі складу WERA': r.gained.join(', ') }));
add(wb, prodRows, 'Товари', [14, 70, 14, 60, 7, 40, 40, 70, 90, 34, 9, 60, 20, 50]);
add(wb, prodRows.filter(r => r['Статус'] !== 'ok' || r['Примітка'] || r['Розміри без пари (зникнуть)'] || r['Додано зі складу WERA']), 'Спірні та зміни', [14, 70, 14, 60, 7, 40, 40, 70, 90, 34, 9, 60, 20, 50]);
// product card: before -> after (the list on «Викрутки»: Вид інструменту, Профіль, Розмір наконечника, Довжина стрижня, Особливості викрутки; after: «Профіль» removed)
const EXP = ['05008720001', '05009310001', '05028001001', '05028030001', '05110000001', '05022800001', '05117681001', '05028210001', '05138258001', '05051012001', '05030331001'];
const card = []; for (const a of EXP) { const p = byA[a], r = rowOf[a]; if (!p || !r) continue; const b = boRows.find(x => x.a === a);
  const before = [['Вид інструменту', v(p, 'vyd_instrumentu').join(', ')], ['Профіль', v(p, 'profil').join(', ')], ['Розмір наконечника', v(p, 'rozmir_nakonechnyka').map(x => x.trim()).join(', ')], ['Довжина стрижня', v(p, 'dovzhyna_stryzhnia').join(', ')], ['Особливості викрутки', v(p, 'osoblyvosti_vykrutky').join(', ')]].filter(x => x[1]);
  const after = [['Вид інструменту', v(p, 'vyd_instrumentu').join(', ')], ['Профіль і розмір', r.short.join(', ')], ['Довжина стрижня', v(p, 'dovzhyna_stryzhnia').join(', ')], ['Особливості викрутки', (b ? b.featNext : v(p, 'osoblyvosti_vykrutky').join(', '))]].filter(x => x[1]);
  card.push([`${a} ${p.title.ua}`, '', '']); for (let i = 0; i < Math.max(before.length, after.length); i++) card.push(['', before[i] ? `${before[i][0]}: ${before[i][1]}` : '', after[i] ? `${after[i][0]}: ${after[i][1]}` : '']); card.push(['', '', '']); }
add(wb, [['Товар', 'Картка зараз', 'Картка після (варіант А)'], ...card], 'Картка було-стало', [70, 70, 90]);
X.writeFile(wb, INV + 'vikrutky_size_preview.xlsx');
// ---------- task 2 workbook ----------
const wb2 = X.utils.book_new(); const SK = P.SK, SKT = P.SKT;
const setRows = S.map(r => { const o = { 'Артикул': r.a, 'Назва': r.title, 'Розділ': path_(r.p.parent.id), 'Видимий': r.vis ? 'так' : 'ні' };
  for (const [k] of SK) { o[`${SKT[k]} — зараз`] = r.now[k].join(', '); o[`${SKT[k]} — стане`] = r.next[k].join(', ') || (r.now[k].length ? '— (розміру немає в datasheet)' : ''); }
  o['Статус'] = SK.map(([k]) => r.status[k] && r.status[k] !== 'ok' ? `${SKT[k]}: ${r.status[k]}` : '').filter(Boolean).join('; '); return o; });
add(wb2, setRows, 'Набори', [14, 70, 60, 7, ...SK.flatMap(() => [8, 40]), 60]);
add(wb2, setRows.filter(r => /розміру немає/.test(r['Статус'])), 'Без розміру', [14, 70, 60, 7, ...SK.flatMap(() => [8, 40]), 60]);
add(wb2, setRows.filter(r => /новий профіль/.test(r['Статус'])), 'Новий профіль зі складу', [14, 70, 60, 7, ...SK.flatMap(() => [8, 40]), 60]);
// sections with sets: values of each «… у складі» filter (visible sets only), today's filters
const setSecs = [...new Set(S.filter(r => r.vis).flatMap(r => r.secs))].filter(s => S.filter(r => r.vis && r.secs.includes(s)).length >= 2).sort((a, b) => order.indexOf(a) - order.indexOf(b) || a - b);
const secRows2 = []; for (const s of setSecs) { const ss = S.filter(r => r.vis && r.secs.includes(s)); const all = L.filter(p => vis(p) && secOf(p).includes(s)).length; const sc = SCAN[s];
  const o = { 'Розділ (повний шлях)': path_(s), 'Видимих наборів / товарів': `${ss.length} / ${all}`, 'Фільтри зараз (вітрина)': sc ? sc.filters.map(f => f.title).filter(t => t !== '?').join(', ') : 'не перевірявся' };
  for (const [k, prof] of SK) { const m = new Map(); for (const r of ss) for (const x of r.next[k]) m.set(x, (m.get(x) || 0) + 1); o[SKT[k]] = [...m].sort((x, y) => P.pcmp(prof, x[0].replace(/^(TX BO|TX|PH|PZ|SL|HEX|Квадрат) /, ''), y[0].replace(/^(TX BO|TX|PH|PZ|SL|HEX|Квадрат) /, ''))).map(([x, n]) => `${x} (${n})`).join(', '); }
  secRows2.push(o); }
add(wb2, secRows2, 'Розділи наборів', [80, 12, 70, ...SK.map(() => 60)]);
// check queries: two values in two filters = AND; today the same two profiles can only be asked as «PH у складі: Так» + «PZ у складі: Так»
const Q = [[1105, 'sklad_ph', 'PH 1', 'sklad_pz', 'PZ 2'], [1129, 'sklad_ph', 'PH 0', 'sklad_tx', 'TX 6'], [1146, 'sklad_ph', 'PH 1', 'sklad_tx', 'TX 5'], [1115, 'sklad_ph', 'PH 2', 'sklad_sl', 'SL 1,2×7,0'], [1059, 'sklad_ph', 'PH 2', 'sklad_tx', 'TX 20']];
const qRows = []; for (const [s, k1, x1, k2, x2] of Q) { const ss = S.filter(r => r.vis && r.secs.includes(s)); const today = ss.filter(r => r.now[k1].length && r.now[k2].length); const next = ss.filter(r => r.next[k1].includes(x1) && r.next[k2].includes(x2));
  const orNow = ss.filter(r => { const p = byA[r.a]; const rs = v(p, 'rozmir_nakonechnyka').map(x => x.trim()); return rs.includes(x1.split(' ').pop()) || rs.includes(x2.split(' ').pop()); });
  qRows.push([path_(s), `${SKT[k1]}: ${x1}  +  ${SKT[k2]}: ${x2}`, `${next.length}`, next.map(r => `${r.a} ${r.title}`).join('\n'), `${today.length}`, `${orNow.length}`]); }
add(wb2, [['Розділ', 'Запит (після запису)', 'Наборів після', 'Які набори залишаться', `Зараз «${'…'} у складі: Так» + «Так» (лише профілі)`, 'Зараз «Розмір наконечника» 1 АБО 2 (без профілю)'], ...qRows], 'Перевірочні запити', [60, 50, 10, 110, 22, 22]);
// examples
const EX2 = ['05051012001', '05006631001', '05057114001', '05073677001', '05059303001', '05022210001', '05004182001', '05135824001', '05136607001', '05118154001'];
add(wb2, [['Набір', 'Характеристика', 'Зараз', 'Стане'], ...EX2.flatMap(a => { const r = S.find(x => x.a === a); if (!r) return []; return [[`${a} ${r.title}`, '', '', ''], ...SK.filter(([k]) => r.now[k].length || r.next[k].length).map(([k]) => ['', SKT[k], r.now[k].join(', ') || '—', r.next[k].join(', ') || '— (розміру немає в datasheet)']), ['', '', '', '']]; })], 'Приклади', [80, 20, 12, 110]);
// dictionaries of the 8 characteristics after the change, in order
const dRows = []; for (const [k, prof] of SK) { const m = new Map(); for (const r of S) for (const x of r.next[k]) m.set(x, (m.get(x) || 0) + 1);
  const vals = [...m.keys()].sort((x, y) => P.pcmp(prof, x.replace(/^(TX BO|TX|PH|PZ|SL|HEX|Квадрат) /, ''), y.replace(/^(TX BO|TX|PH|PZ|SL|HEX|Квадрат) /, ''))); dRows.push([SKT[k], vals.length, vals.map(x => `${x} (${m.get(x)})`).join(', ')]); }
add(wb2, [['Характеристика', 'Значень', 'Значення по порядку (наборів)'], ...dRows], 'Довідники 418-425', [22, 9, 200]);
X.writeFile(wb2, INV + 'sets_sizes_preview.xlsx');
const sum = { task1: { products: rows.length, status: rows.reduce((o, r) => (o[r.status] = (o[r.status] || 0) + 1, o), {}), lost: rows.filter(r => r.lost.length).length, gained: rows.filter(r => r.gained.length).length,
    dict: dictRows.length, single: single.length, bo: boRows.length, boOther: boRows.filter(r => r.other).length, groups: rows.reduce((o, r) => { const g = [...(grp[r.a] || ['—'])].sort().join('+'); o[g] = (o[g] || 0) + 1; return o; }, {}) },
  task2: { sets: S.length, visible: S.filter(r => r.vis).length, status: S.reduce((o, r) => { for (const [k] of SK) if (r.status[k]) o[r.status[k]] = (o[r.status[k]] || 0) + 1; return o; }, {}), noSize: S.filter(r => Object.values(r.status).includes('розміру немає')).length,
    newProf: S.filter(r => Object.values(r.status).includes('новий профіль зі складу')).length, dict: dRows.map(r => [r[0], r[1]]), queries: qRows.map(q => [q[0], q[1], q[2], q[4], q[5], q[3]]) }, single, ex: EX_V.map(k => dict.get(k)) };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(sum, null, 1)); console.log(JSON.stringify({ t1: sum.task1, t2: { ...sum.task2, queries: undefined } }, null, 0));
