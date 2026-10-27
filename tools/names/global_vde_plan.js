// Global check «Діелектричні інструменти» — names (owner 26.10.2026: as decided in «Викрутки»; Zyklop VDE heads — one format, shown in the example).
// title = mod_title, UA and RU; only visible products whose title = mod_title.
//  1. blade thickness: «SL 5,5×125 мм» -> «SL 1,0×5,5×125 мм» (inventory/global_1224.json item 1, datasheet + «Профіль і розмір»)
//  2. «(SL,PH, квадрат)» -> «(SL, PH, квадрат)»
//  3. the WERA series number where the size has no profile (as the 97 names of «Викрутки»): 190 i VDE socket screwdrivers, 168 i VDE square,
//     8790 … VDE sockets — «Kraftform Plus VDE 5,5×125 мм» -> «Kraftform Plus 190 i VDE 5,5×125 мм», «Zyklop VDE, привід» -> «Zyklop 8790 B VDE, привід»
//  4. Zyklop VDE screwdriver heads 8740 / 8767 A / B VDE HF — one format (like «Викруткова головка Zyklop 8767 B HF 3/8″ TORX® TX 50×38,5 мм»):
//     «Викруткова головка Zyklop 8740 B VDE HF Hex-Plus ізольована з фіксуючою функцією, привід 3/8″, HEX 4,0×55 мм» (Hex-Plus — wera.de Produktmerkmale of 8740 A / B VDE HF);
//     size = «Профіль і розмір», length = the datasheet title «… x 55 мм»
//   node names/global_vde_plan.js <group live.json> <out set.json>
const fs = require('fs'), path = require('path'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = require('../../inventory/global_1224.json');
const plan = {}, bad = [];
const put = (a, fn, why) => { const p = L[a]; if (!p || +p.display_in_showcase !== 1) return; if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  const cur = plan[a] || { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: p.mod_title.ua, ru: p.mod_title.ru, why: [] };
  for (const l of ['ua', 'ru']) { const n = fn(cur[l], l); if (n === null || n === undefined) { bad.push(`${a} ${l}: fragment not found (${why})`); return; } cur[l] = n; } cur.why.push(why); plan[a] = cur; };
for (const p of J.products) { if (!p.vis) continue; for (const f of p.list) { if (f.item !== 1) continue;
  if (f.what === 'размер в названии: нет толщины шлица') { const m = f.detail.match(/в названии «([^»]*)», по паспорту «([^»]*)»/); put(p.art, t => t.includes(' ' + m[1] + ' ') ? t.replace(' ' + m[1] + ' ', ' ' + m[2] + ' ') : null, `${m[1]} → ${m[2]}`); }
  if (f.what === 'нет пробела после запятой в скобках (ua)') put(p.art, t => t.replace(/\(((?:SL|PH|PZ|TX|HEX|IP)[^)]*)\)/g, (x, s) => '(' + s.replace(/,(?=\S)/g, ', ') + ')'), 'пробел в скобках'); } }
// 3. series number
for (const p of Object.values(L)) { if (+p.display_in_showcase !== 1) continue; const a = p.article; const d = ds(a); if (!d) continue; const ser = (d.series || '').trim();
  if (/^190 i VDE$/.test(ser) && !/ 190 i /.test(p.mod_title.ua)) put(a, t => / VDE (?=[\d\/,]+(?:″)?×)/.test(t) ? t.replace(/ VDE (?=[\d\/,]+(?:″)?×)/, ' 190 i VDE ') : null, 'номер серии WERA 190 i VDE');
  if (/^168 i VDE$/.test(ser) && !/ 168 i /.test(p.mod_title.ua)) put(a, t => / VDE (?=квадрат #)/.test(t) ? t.replace(/ VDE (?=квадрат #)/, ' 168 i VDE ') : null, 'номер серии WERA 168 i VDE');
  if (/^8790 [AB] VDE$/.test(ser) && !t8790(p.mod_title.ua)) put(a, t => /Zyklop VDE,/.test(t) ? t.replace('Zyklop VDE,', `Zyklop ${ser},`) : null, 'номер серии WERA ' + ser); }
function t8790(t) { return / 8790 /.test(t); }
// 4. Zyklop VDE screwdriver heads
const HEAD = /^(?:Викруткова головка|Отвёрточная головка|Отверточная головка)/;
for (const p of Object.values(L)) { if (+p.display_in_showcase !== 1 || !HEAD.test(p.mod_title.ua + '') && !/^Викруткова головка/.test(p.mod_title.ua)) continue;
  const m = p.mod_title.ua.match(/\b(87(?:40|67) [AB] VDE HF)\b/); if (!m) continue; const code = m[1]; const a = p.article;
  const size = ((p.characteristics || {}).rozmir_nakonechnyka || []).map(x => x.value.ua); if (size.length !== 1) { bad.push(a + ' «Профіль і розмір» ≠ 1 value'); continue; }
  const len = ((ds(a) || {}).title || '').match(/x\s+(\d+(?:[.,]\d+)?)\s*мм$/); if (!len) { bad.push(a + ' no length in the datasheet title'); continue; }
  const drive = / B VDE/.test(code) ? '3/8″' : '1/4″'; const hp = /^8740/.test(code) ? ' Hex-Plus' : ''; const sz = size[0].replace(/^TX /, 'TORX® TX ') + '×' + len[1].replace('.', ',') + ' мм';
  const W = ' WERA ' + a;
  put(a, (t, l) => (l === 'ua' ? `Викруткова головка Zyklop ${code}${hp} ізольована з фіксуючою функцією, привід ${drive}, ${sz}` : `Отвёрточная головка Zyklop ${code}${hp} изолированная с фиксирующей функцией, привод ${drive}, ${sz}`) + W, 'формат головок Zyklop VDE'); }
for (const [a, v] of Object.entries(plan)) if (v.ua === v.oldMod.ua && v.ru === v.oldMod.ru) delete plan[a];
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
const c = {}; for (const v of Object.values(plan)) for (const w of v.why) { const k = w.replace(/«[^»]*»|SL [\d,×]+ мм|[\d,]+×[\d,]+ мм/g, '…').replace(/ → .*/, ' → …'); c[k] = (c[k] || 0) + 1; }
console.log('plan', Object.keys(plan).length, c, '| problems', bad.length ? bad : 0);
