// Global check «Викрутки», step в) 1 — names (owner 24.10.2026: ок on the blade thickness in 82 + 5 names; sizes / «х» / brackets from docs/global_vykrutky.md п. 1).
// From inventory/global_1098.json item-1 findings, VISIBLE products only; only the size fragment (or the bracket list) changes, title = mod_title, UA and RU.
//   node names/global_vyk_plan.js <group live.json>  -> names/set_global_vyk.json (names/write.js set, SETPLAN) + a printed list
const fs = require('fs'), path = require('path'); const [, , LIVE] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = require('../../inventory/global_1098.json');
// no size in the name: where the size goes (datasheet: 2067 «1 IPR x 40 мм», 1567 IPR ESD «1 IPR x 40 мм», 2072 «m x 40 мм»)
// 05030160001 ends with «TORX PLUS® IPR» — only «1×40 мм» after it (= «IPR 1×40 мм»); 05030135001 has «IPR» in the middle — question to the owner, not written
const APPEND = { '05030160001': '1×40 мм', '05118145001': 'm×40 мм' };
const plan = {}, out = [], bad = [];
const put = (a, fn, why) => { const p = L[a]; if (!p || +p.display_in_showcase !== 1) return; const cur = plan[a] || { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: p.mod_title.ua, ru: p.mod_title.ru, why: [] };
  if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  for (const l of ['ua', 'ru']) { const n = fn(cur[l], l); if (n === null) { bad.push(`${a} ${l}: fragment not found (${why})`); return; } cur[l] = n; } cur.why.push(why); plan[a] = cur; };
for (const p of J.products) { if (!p.vis) continue; for (const f of p.list) { if (f.item !== 1) continue; const m = f.detail.match(/в названии «([^»]*)», по паспорту «([^»]*)»/);
  if (f.what === 'размер в названии: нет толщины шлица' || f.what === 'размер в названии ≠ паспорт') put(p.art, t => t.includes(' ' + m[1] + ' ') ? t.replace(' ' + m[1] + ' ', ' ' + m[2] + ' ') : null, `${m[1]} → ${m[2]}`);
  if (f.what === 'кириллическая «х» в размере') put(p.art, t => t.replace(/([A-Za-z0-9])х(\d)/g, '$1×$2'), '«х» → «×»');
  if (f.what === 'размер в названии: нет размера' && APPEND[p.art]) put(p.art, t => /\sWERA \d{11}$/.test(t) && !t.includes(APPEND[p.art]) ? t.replace(/\s(WERA \d{11})$/, ' ' + APPEND[p.art] + ' $1') : null, '+ ' + APPEND[p.art]);
  if (/^нет пробела после запятой в скобках \(ua\)$/.test(f.what) || /^нет пробела после запятой в скобках \(ru\)$/.test(f.what)) if (!(plan[p.art] || {}).why || !plan[p.art].why.includes('пробел в скобках')) put(p.art, t => t.replace(/\(((?:SL|PH|PZ|TX|HEX|IP)[^)]*)\)/g, (x, s) => '(' + s.replace(/,(?=\S)/g, ', ') + ')'), 'пробел в скобках'); } }
for (const [a, v] of Object.entries(plan)) { for (const l of ['ua', 'ru']) if (v[l] === v.oldMod[l]) delete v['same_' + l]; if (v.ua === v.oldMod.ua && v.ru === v.oldMod.ru) { delete plan[a]; continue; } out.push(`${a} | ${v.oldMod.ua} → ${v.ua} | RU → ${v.ru}`); }
fs.writeFileSync(path.join(__dirname, 'set_global_vyk.json'), JSON.stringify(plan, null, 1));
console.log(out.join('\n')); console.log('plan', Object.keys(plan).length, '| problems', bad.length ? bad : 0);
