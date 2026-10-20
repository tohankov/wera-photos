// Owner 21.10.2026 (night report item 2): Zyklop screwdriver heads -> «Профіль і розмір» (392, format A, the same characteristic as «Викрутки»).
//  1) Zyklop heads (Викруткова головка in «Тріскачки та приладдя Zyklop» 1270): 392 = profile + size (cat/pr_size.js tipValues, the first line of the WERA
//     datasheet wins), «Розмір головки» cleared — it stays only on nut sockets. XZN (no format A) — as is.
//  2) Zyklop VDE heads (Викруткова головка in «Діелектричні інструменти» 1224): 392 the same way, «Розмір робочого кінця» (399) cleared. XZN — as is.
//  3) Zyklop sets (every other product of 1270 with «… у складі»): 392 = the sizes of their «… у складі» (WERA composition; TX BO -> TX; «(розмір не вказано)»
//     skipped), as the sets of «Викрутки» / «Діелектричні»; «Розмір головки» loses the bare head sizes («20», «8,0» — screwdriver heads), nut sizes («8 мм», «1/4″») stay.
//  Every size of a head must stay as it is (else listed, not written); a value missing in the 392 dictionary -> listed, not written (new values would break the order).
//   node cat/zyk_pr.js <live.json> -> cat/zyk_pr_plan.json (for cat/night_write.js) + inventory/zyklop_pr.xlsx
const fs = require('fs'), path = require('path'), X = require('xlsx'); const P = require('./pr_size.js');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const T = require('../sections/tree_now.json'); const name = Object.fromEntries(T.map(p => [p.id, p.title.ua]));
const kids = {}; for (const p of T) (kids[p.parent] = kids[p.parent] || []).push(p.id); const sub = r => { const s = new Set([r]), q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.add(k); q.push(k); } return s; };
const Z = sub(1270), V = sub(1224), secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number), v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const D = require('./pr_size_values.json').dict.rozmir_nakonechnyka; const SK = ['sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'];
const SKIP = new Set(['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001']);
const norm = s => String(s).replace(/\u00a0/g, '').replace(/ мм$/, '').replace(/^#/, '').trim();
const num = s => { const m = norm(s).replace(',', '.'); return /^\d+(\.\d+)?$/.test(m) ? String(parseFloat(m)) : m; };
const sizeOf = x => num(x.replace(/^(PH\/S|PZ\/S|PH|PZ|TX|IP|IPR|HEX|Квадрат|Торцева|TRI-WING®) #?/, '').replace(/^SL [\d,]+×/, ''));
const bare = s => /^\d+(,\d+)?$/.test(norm(s)) && !/мм/.test(s);   // «20», «8,0» — a screwdriver-head size; «8 мм», «1/4″» — a nut size
const plan = [], heads = [], sets = [];
for (const p of L) { const s = secs(p), a = p.article; const inZ = s.some(x => Z.has(x)), inV = s.some(x => V.has(x)); if ((!inZ && !inV) || SKIP.has(a)) continue;
  const vyd = v(p, 'vyd_instrumentu'), prof = v(p, 'profil');
  if (vyd.includes('Викруткова головка')) { if (prof.some(x => /XZN/.test(x))) { heads.push({ a, title: p.title.ua, grp: inZ ? 'Zyklop' : 'VDE', prof: prof.join('; '), old: '', neu: '', res: 'XZN — як є (рішення власника)' }); continue; }
    const key = inZ ? 'rozmir_holovky' : 'rozmir_robochoho_kintsia'; const old = v(p, key); const r = P.tipValues(a, prof, old);
    const row = { a, title: p.title.ua, grp: inZ ? 'Zyklop' : 'VDE', sec: name[p.parent.id], prof: prof.join('; '), old: old.join('; '), neu: r.join('; ') };
    const same = r.length === old.length && r.every((x, i) => sizeOf(x) === num(old[i]) || sizeOf(x).replace(/″$/, '') === num(old[i]).replace(/″$/, ''));
    if (!r.length) row.res = 'НЕ ПИШУ: немає пари профіль+розмір';
    else if (!same) row.res = 'НЕ ПИШУ: розмір у datasheet WERA інший';
    else if (r.some(x => !D.includes(x))) row.res = 'НЕ ПИШУ: значення немає в довіднику — ' + r.filter(x => !D.includes(x)).join(', ');
    else { row.res = 'пишу'; plan.push({ article: a, characteristics: { rozmir_nakonechnyka: r, [key]: [] } }); }
    heads.push(row); continue; }
  if (!inZ) continue;
  const uni = [...new Set(SK.flatMap(k => v(p, k)).filter(x => !/не вказано/.test(x)).map(x => x.replace(/^TX BO /, 'TX ')))]; const old = v(p, 'rozmir_holovky'), had = v(p, 'rozmir_nakonechnyka');
  const bareOld = old.filter(bare); if (!uni.length && !bareOld.length) continue;
  const row = { a, title: p.title.ua, sec: name[p.parent.id], vyd: vyd.join('; '), old: old.join('; '), had: had.join('; ') };
  const miss = uni.filter(x => !D.includes(x)); const neu = D.filter(x => uni.includes(x) || had.includes(x)); const cov = new Set(neu.map(sizeOf));
  const unc = bareOld.filter(x => !cov.has(num(x)));
  if (miss.length) row.res = 'НЕ ПИШУ: значень немає в довіднику — ' + miss.join(', ');
  else if (unc.length) row.res = 'НЕ ПИШУ: голі розміри в «Розмір головки» не покриті складом — ' + unc.join(', ');
  else { const ch = {}; if (neu.join('|') !== had.join('|')) ch.rozmir_nakonechnyka = neu; if (bareOld.length) ch.rozmir_holovky = old.filter(x => !bare(x));
    row.neu = neu.join('; '); row.rh = (ch.rozmir_holovky || old).join('; '); row.res = Object.keys(ch).length ? 'пишу' : 'без змін'; if (Object.keys(ch).length) plan.push({ article: a, characteristics: ch }); }
  sets.push(row); }
// a head section where some head needs a new dictionary value waits as a whole (owner's decision): no half-converted section filter
const holdSec = new Set(heads.filter(r => /довіднику/.test(r.res)).map(r => r.sec)); for (const r of heads) if (r.res === 'пишу' && holdSec.has(r.sec)) { r.res = 'НЕ ПИШУ: розділ чекає рішення (нові значення в довіднику)'; const i = plan.findIndex(x => x.article === r.a); plan.splice(i, 1); }
fs.writeFileSync(path.join(__dirname, 'zyk_pr_plan.json'), JSON.stringify({ name: 'zyk_pr', keys: ['rozmir_nakonechnyka', 'rozmir_holovky', 'rozmir_robochoho_kintsia'], products: plan }, null, 1));
const wb = X.utils.book_new();
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(heads.map(r => ({ Артикул: r.a, Назва: r.title, Група: r.grp, Розділ: r.sec || '', Профіль: r.prof, 'Розмір (було)': r.old, 'Профіль і розмір (стало)': r.neu, Результат: r.res }))), 'Головки');
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(sets.map(r => ({ Артикул: r.a, Назва: r.title, Розділ: r.sec, Вид: r.vyd, 'Розмір головки (було)': r.old, 'Розмір головки (стало)': r.rh || '', 'Профіль і розмір (стало)': r.neu || '', Результат: r.res }))), 'Набори');
X.writeFile(wb, 'C:/Users/Techlight/Desktop/wera-photos/inventory/zyklop_pr.xlsx');
const cnt = rows => { const c = {}; for (const r of rows) { const k = r.res.replace(/ — .*/, ''); c[k] = (c[k] || 0) + 1; } return JSON.stringify(c); };
console.log('heads', heads.length, cnt(heads), '| sets', sets.length, cnt(sets), '| plan', plan.length);
for (const r of [...heads, ...sets].filter(r => /НЕ ПИШУ/.test(r.res) && !/розділ чекає/.test(r.res))) console.log(' ', r.a, r.res, '| было', r.old, '| стало', r.neu || '', '|', r.title.slice(0, 60));
