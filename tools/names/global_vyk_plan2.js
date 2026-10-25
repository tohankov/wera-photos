// Global check «Викрутки», owner 25.10.2026: names, second batch — the WERA series number before the size in 97 names (inventory/global_1098_names169.xlsx,
// «нет номера серии WERA»), «SL» in 2 Ball-Grip names, 05030135001 «… TORX PLUS® IPR 1×40 мм з електростатичним захистом». title = mod_title, UA and RU;
// only the size fragment changes (the code goes right before it).  node names/global_vyk_plan2.js <live.json> -> names/set_global_vyk2.json
const fs = require('fs'), path = require('path'), X = require('xlsx'); const [, , LIVE] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const ds = require('./ds.js');
const rows = X.utils.sheet_to_json(X.readFile(path.join(__dirname, '../../inventory/global_1098_names169.xlsx')).Sheets['Названия (169, видимые)']);
const plan = {}, bad = [], out = [];
const put = (a, fn, why) => { const p = L[a]; if (!p || +p.display_in_showcase !== 1) return bad.push(a + ' not visible');
  if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) return bad.push(a + ' title ≠ mod_title');
  const v = { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, why }; for (const l of ['ua', 'ru']) { const n = fn(p.mod_title[l], l); if (!n || n === p.mod_title[l]) return bad.push(`${a} ${l}: no change`); v[l] = n; } plan[a] = v; out.push(`${a} | ${v.ua} | ${v.ru}`); };
for (const r of rows) { const a = r.art; const size = r.our_size;
  if (r.verdict === 'нет номера серии WERA') { const ser = ds(a).series || ''; const code = (ser.match(/^\d+(?:\/\d+)?(?:\s(?:HF|HO|ESD|A|B))*/) || [''])[0];
    put(a, t => t.includes(' ' + size + ' ') && !t.includes(' ' + code + ' ') ? t.replace(' ' + size + ' ', ' ' + code + ' ' + size + ' ') : null, 'номер серии WERA ' + code); }
  if (/^другой формат: SL/.test(r.verdict)) put(a, t => t.includes(' ' + size + ' ') ? t.replace(' ' + size + ' ', ' SL ' + size + ' ') : null, 'SL перед размером'); }
put('05030135001', (t, l) => l === 'ua' ? t.replace('TORX PLUS® IPR з електростатичним захистом', 'TORX PLUS® IPR 1×40 мм з електростатичним захистом') : t.replace('TORX PLUS® IPR с электростатической защитой', 'TORX PLUS® IPR 1×40 мм с электростатической защитой'), 'размер IPR 1×40 мм');
fs.writeFileSync(path.join(__dirname, 'set_global_vyk2.json'), JSON.stringify(plan, null, 1)); console.log(out.slice(0, 12).join('\n')); console.log('...\nplan', Object.keys(plan).length, '| problems', bad.length ? bad : 0);
