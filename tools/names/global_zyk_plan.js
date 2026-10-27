// Global check «Тріскачки та приладдя Zyklop» — names (owner 26.10.2026: series number / sizes as decided in «Викрутки»; the head format is question 3
// of docs/global_zyklop.md and is shown in the example first). title = mod_title, UA and RU; visible products whose title = mod_title.
//  1. the WERA series number right after «Zyklop» where the name has the drive there and no code: «Викруткова головка Zyklop 1/4″ TORX® TX 10×28 мм»
//     -> «Викруткова головка Zyklop 8767 A 1/4″ TORX® TX 10×28 мм»; «Торцева головка Zyklop 3/8″ …» -> «Торцева головка Zyklop 8790 HMB HF 3/8″ …»
//     (code = the datasheet «№ артикула» up to the first word that is not a WERA code token)
//  2. the head length as in the datasheet title: «… HEX 9,0×38 мм» -> «…×38,5 мм» (datasheet «9 mm x 38.5 мм»)
//  3. slot thickness of 8700 A FL: «SL 5,5×28 мм» -> «SL 0,8×5,5×28 мм» (inventory/global_1270.json item 1 «нет размера», datasheet)
//   node names/global_zyk_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [], skip = [];
const DRIVE = '(?:1\\/4″|3\\/8″|1\\/2″|¼″|⅜″|½″)';
const put = (p, fn, why) => { const a = p.article; if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  const cur = plan[a] || { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: p.mod_title.ua, ru: p.mod_title.ru, why: [] };
  for (const l of ['ua', 'ru']) { const n = fn(cur[l], l); if (n == null) { bad.push(`${a} ${l}: fragment not found (${why})`); return; } cur[l] = n; } cur.why.push(why); plan[a] = cur; };
// 0. the drive written without the inch sign or with a loose quote: «Zyklop 3/8 "дюймова» / «Zyklop 1/2 18,0×37» -> «Zyklop 3/8″ дюймова» / «Zyklop 1/2″ 18,0×37»
for (const p of L) { const f = t => t.replace(/Zyklop (1\/4|3\/8|1\/2) "/, 'Zyklop $1″ ').replace(/Zyklop (1\/4|3\/8|1\/2) (?=[\d])/, 'Zyklop $1″ ');
  if (f(p.mod_title.ua) !== p.mod_title.ua || f(p.mod_title.ru) !== p.mod_title.ru) put(p, f, 'знак дюйма у приводу'); }
// names that are not heads: the series number by hand (as the 97 of «Викрутки»; the form of 05004285001 «Набір Zyklop Pocket 8009 набір 4»)
const OTHER = { '05004284001': [/Zyklop Pocket набір 3/, 'Zyklop Pocket 8009 набір 3', /Zyklop Pocket набор 3/, 'Zyklop Pocket 8009 набор 3'],
  '05073230001': [/^Міні-тріскачка /, 'Міні-тріскачка 8001 A SB SiS ', /^Мини-трещотка /, 'Мини-трещотка 8001 A SB SiS '], '05136420001': [/Магнітний тримач для/, 'Магнітний тримач 9600 для', /Магнитный держатель для/, 'Магнитный держатель 9600 для'],
  '05136421001': [/Магнітний тримач для/, 'Магнітний тримач 9601 для', /Магнитный держатель для/, 'Магнитный держатель 9601 для'], '05136422001': [/Магнітний тримач для/, 'Магнітний тримач 9602 для', /Магнитный держатель для/, 'Магнитный держатель 9602 для'],
  '05003793001': [/Zyklop Mini 3/, 'Zyklop Mini 3 8008 A'], '05003590001': [/Zyklop,/, 'Zyklop 8784 B1,'], '05003529001': [/Zyklop,/, 'Zyklop 8784 A1,'], '05003660001': [/Zyklop Mini 2(?= WERA)/, 'Zyklop Mini 2 8005'] };
for (const [a, r] of Object.entries(OTHER)) { const p = L.find(x => x.article === a); if (!p) continue; put(p, (t, l) => { const [re, to] = l === 'ru' && r[2] ? [r[2], r[3]] : [r[0], r[1]]; return re.test(t) ? t.replace(re, to) : null; }, 'номер серии WERA'); }
for (const p of L) { const d = ds(p.article); if (!d) continue; const ser = (d.series || '').trim();
  const cur = plan[p.article] ? plan[p.article].ua : p.mod_title.ua; if (OTHER[p.article]) continue;
  const code = (ser.match(/^\d{4}(?:\s(?:Deep|SiS|HF|SB|[A-Z]{1,4}\d?)(?=\s|$))*/) || [''])[0].trim();
  // 1. series number after «Zyklop» before the drive
  if (code && !cur.includes(code.split(' ')[0]) && new RegExp('Zyklop ' + DRIVE).test(cur)) {
    if (/^(?:Викруткова|Хрестова викруткова|Шліцева викруткова|Торцева)/.test(cur)) put(p, t => new RegExp('Zyklop (?=' + DRIVE + ')').test(t) ? t.replace(new RegExp('Zyklop (?=' + DRIVE + ')'), `Zyklop ${code} `) : null, 'номер серии WERA ' + code);
    else skip.push(`${p.article} «${cur}» — код ${code}: не головка`); }
  // Zyklop Mini 2 sockets «… Zyklop Mini 2 13,0×18 мм» and the deep socket «Торцева головка 1/4″ подовжена …» — the code before the size / the drive
  else if (code && !cur.includes(code.split(' ')[0]) && /Zyklop Mini 2 (?=\d)/.test(cur)) put(p, t => /Zyklop Mini 2 (?=\d)/.test(t) ? t.replace(/Zyklop Mini 2 (?=\d)/, `Zyklop Mini 2 ${code} `) : null, 'номер серии WERA ' + code);
  else if (code && !cur.includes(code.split(' ')[0]) && /^Торц\S+ головка (?=1\/4″ подовж|1\/4″ удлин)/.test(cur)) put(p, t => t.replace(/^(Торц\S+ головка) (?=1\/4″)/, `$1 Zyklop ${code} `), 'номер серии WERA ' + code);
  else if (code && !cur.includes(code.split(' ')[0])) skip.push(`${p.article} «${cur}» — код ${code}: формат не распознан`);
  // 2. length as in the datasheet title (decimal kept)
  const m = (d.title || '').match(/x\s+(\d+)\.(\d)\s*мм$/); if (m) { const short = `×${m[1]} мм`, full = `×${m[1]},${m[2]} мм`;
    if (p.mod_title.ua.includes(short) && !p.mod_title.ua.includes(full)) put(p, t => t.includes(short) ? t.replace(short, full) : null, `длина ${m[1]} → ${m[1]},${m[2]} мм (паспорт)`); } }
// 3. slot thickness
const J = require('../../inventory/global_1270.json');
for (const g of J.products) { if (!g.vis) continue; for (const f of g.list) { if (f.item !== 1 || f.what !== 'размер в названии: нет размера') continue; const p = L.find(x => x.article === g.art); if (!p) continue;
  const m = f.detail.match(/по паспорту «SL (\d,\d)×(\d+,\d)»/); if (!m) continue; const w = m[2], th = m[1];
  put(p, t => new RegExp('SL ' + w.replace(',', ',') + '×').test(t) && !t.includes(`SL ${th}×${w}`) ? t.replace(`SL ${w}×`, `SL ${th}×${w}×`) : (t.includes(`SL ${th}×${w}`) ? t : null), `толщина шлица ${th} (паспорт)`); } }
for (const [a, v] of Object.entries(plan)) if (v.ua === v.oldMod.ua && v.ru === v.oldMod.ru) delete plan[a];
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
const c = {}; for (const v of Object.values(plan)) for (const w of v.why) { const k = w.replace(/\d[\d,]*/g, '#'); c[k] = (c[k] || 0) + 1; }
console.log('plan', Object.keys(plan).length, c, '| problems', bad.length ? bad : 0, '| skipped', skip.length); skip.forEach(s => console.log('  ', s));
