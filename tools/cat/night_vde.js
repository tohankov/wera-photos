// Night 20.10.2026, group «Діелектричні інструменти» (1224): «Профіль і розмір» (rozmir_nakonechnyka, 392, format A — the same characteristic as «Викрутки»)
// for the screw-tip products — Викрутка and Змінна вставка (vde.js kind 'blade'); their «Розмір робочого кінця» (399) moves there (owner's night rule: → «Профіль і розмір»).
// Values by cat/pr_size.js tipValues (the same rules as «Викрутки»: profile + size, first line of the WERA datasheet wins, SL thickness from the datasheet/title).
// Sets keep «Розмір робочого кінця» and their «… у складі»; Zyklop VDE heads keep 399 (a new format there is the owner's decision); cabinet keys (no format A) -> disputed.
//   node cat/night_vde.js <live.json>  -> cat/night_vde_plan.json (for cat/night_write.js) + inventory/night_vde.xlsx sheet «Профіль і розмір»
const fs = require('fs'), path = require('path'); const P = require('./pr_size.js'); const X = require('xlsx');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const T = require('../sections/tree_now.json');
const kids = {}; for (const p of T) (kids[p.parent] = kids[p.parent] || []).push(p.id); const sub = r => { const s = new Set([r]), q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.add(k); q.push(k); } return s; };
const G = sub(1224), secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number), v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const SKIP = new Set(['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001']); const name = Object.fromEntries(T.map(p => [p.id, p.title.ua]));
const norm = s => String(s).replace(/\u00a0/g, '').replace(/ мм$/, '').replace(/^#/, '').trim().replace(/^0(\d)$/, '$1');
const plan = [], rows = [], disp = [];
for (const p of L) { if (!secs(p).some(s => G.has(s)) || SKIP.has(p.article)) continue; const vyd = v(p, 'vyd_instrumentu'); if (!vyd.some(x => x === 'Викрутка' || x === 'Змінна вставка')) continue;
  const prof = v(p, 'profil'), old = v(p, 'rozmir_robochoho_kintsia'), had = v(p, 'rozmir_nakonechnyka'); const r = P.tipValues(p.article, prof, old);
  if (!r.length) { disp.push({ a: p.article, title: p.title.ua, sec: name[p.parent.id], prof: prof.join('; '), old: old.join('; '), why: prof.some(x => P.PR[x]) ? 'немає пари профіль+розмір' : 'профіль поза форматом А (шафовий ключ)' }); continue; }
  // the size part of the new value must be today's size (SL: its width) — otherwise the datasheet changed it: listed, not written
  const sz = r.map(x => norm(x.replace(/^(PH\/S|PZ\/S|PH|PZ|TX|IP|IPR|HEX|Квадрат|Торцева|TRI-WING®|Microstix®|Pentalobe) /, '').replace(/^SL [\d,]+×/, '')));
  const same = sz.length === old.length && sz.every((s, i) => s === norm(old[i]).replace(/^(\d+)$/, '$1') || s.replace(/,0$/, '') === norm(old[i]).replace(/,0$/, ''));
  const row = { a: p.article, title: p.title.ua, sec: name[p.parent.id], prof: prof.join('; '), old: old.join('; '), had: had.join('; '), neu: r.join('; '), check: same ? 'розмір = як був' : 'РОЗМІР ІНШИЙ — не пишу' };
  rows.push(row); if (!same) { disp.push({ a: p.article, title: p.title.ua, sec: row.sec, prof: row.prof, old: row.old, why: 'розмір у datasheet WERA інший: ' + row.neu }); continue; }
  plan.push({ article: p.article, characteristics: { rozmir_nakonechnyka: r, rozmir_robochoho_kintsia: [] } }); }
fs.writeFileSync(path.join(__dirname, 'night_vde_plan.json'), JSON.stringify({ name: 'vde', keys: ['rozmir_nakonechnyka', 'rozmir_robochoho_kintsia'], products: plan }, null, 1));
const F = 'C:/Users/Techlight/Desktop/wera-photos/inventory/night_vde.xlsx'; const wb = fs.existsSync(F) ? X.readFile(F) : X.utils.book_new();
const put = (n, data) => { if (wb.Sheets[n]) { delete wb.Sheets[n]; wb.SheetNames = wb.SheetNames.filter(x => x !== n); } X.utils.book_append_sheet(wb, X.utils.json_to_sheet(data), n); };
put('Профіль і розмір', rows.map(r => ({ Артикул: r.a, Назва: r.title, Розділ: r.sec, Профіль: r.prof, 'Розмір робочого кінця (було)': r.old, 'Профіль і розмір (стало)': r.neu, Перевірка: r.check })));
put('Спірні ПіР', disp.map(d => ({ Артикул: d.a, Назва: d.title, Розділ: d.sec, Профіль: d.prof, Розмір: d.old, Чому: d.why }))); X.writeFile(wb, F);
console.log('rows', rows.length, 'plan', plan.length, 'disputed', disp.length); for (const d of disp) console.log('DISP', d.a, d.why, '|', d.title.slice(0, 70));
const c = {}; for (const x of plan) for (const y of x.characteristics.rozmir_nakonechnyka) c[y] = (c[y] || 0) + 1; console.log(Object.entries(c).map(x => x.join(':')).join(' '));
