// Night 20.10.2026, «Діелектричні інструменти» step 2 (after night_vde.js):
//  1) sets of the group: «Профіль і розмір» (392) = the sizes of their «… у складі» (WERA composition, already on the site; TX BO -> TX; «(розмір не вказано)» skipped),
//     as the sets of «Викрутки» carry it (CLAUDE.md: a set gets every value of its composition in each characteristic of the group); «Розмір робочого кінця» (399)
//     is cleared only when every size in it is covered by the new values (socket / cabinet sizes «5 мм», «6,3 мм» keep it); sets that already carry 392 (written by
//     the torque / Kompakt groups) are not touched;
//  2) «Особливості викрутки» + «Нержавіюча сталь» where the name says stainless and the WERA datasheet confirms it («нержавеющ»), values only added.
//   node cat/night_vde2.js <live.json> -> cat/night_vde2_plan.json + inventory/night_vde.xlsx sheets «Набори ПіР», «Нержавіюча сталь»
const fs = require('fs'), path = require('path'), X = require('xlsx');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const T = require('../sections/tree_now.json');
const kids = {}; for (const p of T) (kids[p.parent] = kids[p.parent] || []).push(p.id); const sub = r => { const s = new Set([r]), q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.add(k); q.push(k); } return s; };
const G = sub(1224), secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number), v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const D = require('./pr_size_values.json').dict.rozmir_nakonechnyka; const SK = ['sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'];
const SKIP = new Set(['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001']);
const num = s => { const m = String(s).replace(/\u00a0/g, '').replace(/ мм$/, '').trim().replace(',', '.'); return /^\d+(\.\d+)?$/.test(m) ? String(parseFloat(m)) : m; };
const sizeOf = x => num(x.replace(/^(PH\/S|PZ\/S|PH|PZ|TX|IP|IPR|HEX|Квадрат|Торцева|TRI-WING®) #?/, '').replace(/^SL [\d,]+×/, ''));
const plan = {}, setRows = [], ssRows = [];
for (const p of L) { if (!secs(p).some(s => G.has(s)) || SKIP.has(p.article)) continue; const a = p.article;
  const uni = [...new Set(SK.flatMap(k => v(p, k)).filter(x => !/не вказано/.test(x)).map(x => x.replace(/^TX BO /, 'TX ')))];
  if (uni.length) { const had = v(p, 'rozmir_nakonechnyka'), old = v(p, 'rozmir_robochoho_kintsia'); const row = { a, title: p.title.ua, old: old.join('; '), had: had.join('; ') };
    if (had.length) { row.res = 'не чіпаю: «Профіль і розмір» уже є (інша група)'; setRows.push(row); }
    else { const miss = uni.filter(x => !D.includes(x)); if (miss.length) { row.res = 'не пишу: значень немає в довіднику — ' + miss.join(', '); setRows.push(row); }
      else { const neu = D.filter(x => uni.includes(x)); const cov = new Set(neu.map(sizeOf)); const left = old.filter(s => !cov.has(num(s)));
        const ch = { rozmir_nakonechnyka: neu }; if (!left.length) ch.rozmir_robochoho_kintsia = []; (plan[a] = plan[a] || { article: a, characteristics: {} }).characteristics = { ...plan[a].characteristics, ...ch };
        row.neu = neu.join('; '); row.res = left.length ? 'Розмір робочого кінця лишається (не покрито: ' + left.join(', ') + ')' : 'Розмір робочого кінця → знято'; setRows.push(row); } } }
  if (/нержав/i.test(p.title.ua) && !v(p, 'osoblyvosti_vykrutky').includes('Нержавіюча сталь')) { const f = path.join(__dirname, '../batch/ds', a + '.txt'); const ok = fs.existsSync(f) && /нержаве/i.test(fs.readFileSync(f, 'utf8'));
    ssRows.push({ a, title: p.title.ua, before: v(p, 'osoblyvosti_vykrutky').join('; '), res: ok ? '+ Нержавіюча сталь' : 'не пишу: у даташиті немає' });
    if (ok) (plan[a] = plan[a] || { article: a, characteristics: {} }).characteristics.osoblyvosti_vykrutky = [...v(p, 'osoblyvosti_vykrutky'), 'Нержавіюча сталь']; } }
const products = Object.values(plan); fs.writeFileSync(path.join(__dirname, 'night_vde2_plan.json'), JSON.stringify({ name: 'vde2', keys: ['rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'osoblyvosti_vykrutky'], products }, null, 1));
const F = 'C:/Users/Techlight/Desktop/wera-photos/inventory/night_vde.xlsx'; const wb = X.readFile(F); const put = (n, data) => { if (wb.Sheets[n]) { delete wb.Sheets[n]; wb.SheetNames = wb.SheetNames.filter(x => x !== n); } X.utils.book_append_sheet(wb, X.utils.json_to_sheet(data), n); };
put('Набори ПіР', setRows.map(r => ({ Артикул: r.a, Назва: r.title, 'Розмір робочого кінця (було)': r.old, 'Профіль і розмір (було)': r.had, 'Профіль і розмір (стало)': r.neu || '', Результат: r.res })));
put('Нержавіюча сталь', ssRows.map(r => ({ Артикул: r.a, Назва: r.title, 'Особливості (було)': r.before, Результат: r.res }))); X.writeFile(wb, F);
console.log('plan', products.length, '| sets', setRows.length, 'written', setRows.filter(r => r.neu).length, '399 kept', setRows.filter(r => /лишається/.test(r.res)).length, '| stainless', ssRows.filter(r => /^\+/.test(r.res)).length, 'of', ssRows.length);
for (const r of setRows.filter(r => !r.neu || /лишається/.test(r.res))) console.log(' ', r.a, r.res, '|', r.title.slice(0, 60));
