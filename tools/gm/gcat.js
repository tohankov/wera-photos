// PREVIEW ONLY: our catalog categories -> Google product category (google_product_category, the official taxonomy with ids:
// https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt, RU names from taxonomy-with-ids.ru-RU.txt, both saved in gm/data/; there is no uk-UA file).
// Rules on the category's own title, then its path; the first match wins. Where the category mixes kinds of products a second variant is given.
// node gm/gcat.js <catalog export json (parent, display_in_showcase)> -> inventory/gm_google_categories.xlsx + a summary by Google category.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const tax = l => Object.fromEntries(fs.readFileSync(path.join(__dirname, `data/tax_${l}.txt`), 'utf8').split('\n').filter(s => /^\d+ - /.test(s)).map(s => [s.split(' - ')[0], s.slice(s.indexOf(' - ') + 3).trim()]));
const EN = tax('en-US'), RU = tax('ru');
const R = [  // [test on title, test on path (or null), main id, alternative id, note]
  [/велосипед/i, null, '505668', '6965', 'інструменти для велосипеда'],
  [/./, /Серія вставних/, '3650', '1632', 'змінні вставки (головки) до динамометричних ключів Click-Torque X'],
  [/гвинтоверт/i, null, '1221', null],
  [/молот/i, null, '2208', null],
  [/сумк|2go/i, null, '6876', '3974'],
  [/візок|ложемент/i, null, '3280', '500103', 'візок — шафи для інструментів; ложементи — вкладки'],
  [/підставк/i, null, '3974', '500103'],
  [/ремкомплект|запчастин/i, null, '3650', null],
  [/свердл|мітчик/i, null, '1540', '1184', 'свердла — 1540, мітчики — 1184'],
  [/бітотрим|ручки-тримач/i, null, '3944', '6471'],
  [/перехідник|адаптер/i, null, '3944', '5571'],
  [/набір|набори|набор/i, null, '6965', null],
  [/біт|насадк|мікробіт/i, null, '1540', null],
  [/індикатор напруги/i, null, '503737', null, 'індикатор напруги'],
  [/індикатор/i, null, '1305', '1203', 'індикатори крутного моменту'],
  [/вставних/i, null, '3650', '5571', 'змінні вставки до динамометричних ключів'],
  [/динамометричн.*викрут|Safe-Torque Speed/i, null, '1203', null],
  [/динамометричн|Click-Torque|Safe-Torque/i, null, '1632', '1305'],
  [/головк|торцев/i, null, '5571', null],
  [/Joker/i, null, '1632', null],
  [/приладдя|подовжувач/i, /Zyklop/, '3650', '5571', 'подовжувачі, адаптери, ручки до тріскачок'],
  [/тріскачк|Zyklop/i, null, '1632', null, 'тріскачки (у батьківському розділі є й головки)'],
  [/Г-подібн/i, null, '1632', '1439', 'Г-подібні (шестигранні / TORX) ключі'],
  [/ключ|Joker/i, null, '1632', null],
  [/приладдя/i, /Викрутки/, '3650', null],
  [/вставк/i, null, '1203', '1540', 'змінні вставки до ручок-тримачів'],
  [/викрут|Kraftform|ESD|Micro|Ball-Grip|поперечн|VDE|Vario/i, null, '1203', null],
  [/новинк/i, null, '6965', '1203', 'змішаний розділ'],
  [/./, /Викрутки|Діелектрич/, '1203', null], [/./, /Біти/, '1540', null], [/./, /Тріскачки|Zyklop/, '1632', '5571'], [/./, /Г-подібні|Joker/, '1632', null], [/./, /Динамометрич/, '1632', '1203'] ];
const t = require('../sections/tree_now.json'); const byId = Object.fromEntries(t.map(c => [c.id, c])); const all = require(path.resolve(process.argv[2]));
const own = {}; for (const p of all) if (+p.display_in_showcase === 1) own[p.parent.id] = (own[p.parent.id] || 0) + 1;
const pathOf = id => { const out = []; for (let c = byId[id]; c && c.id !== 97 && c.id !== 1; c = byId[c.parent]) out.unshift(c.title.ua); return out.join(' / '); };
const under = id => { for (let c = byId[id]; c; c = byId[c.parent]) if (c.id === 97) return true; return false; };
const rows = [];
for (const c of t.filter(c => under(c.id) && c.id !== 97)) { const ttl = c.title.ua, pth = pathOf(c.id); const r = R.find(([a, b]) => a.test(ttl) && (!b || b.test(pth)));
  rows.push({ 'ID розділу': c.id, 'Розділ': pth, 'Товарів (основний розділ)': own[c.id] || 0, 'Google ID': r ? r[2] : '', 'Google категорія (EN)': r ? EN[r[2]] : '', 'Google категорія (RU)': r ? RU[r[2]] : '',
    'Варіант 2: ID': r && r[3] || '', 'Варіант 2 (EN)': r && r[3] ? EN[r[3]] : '', 'Примітка': r && r[4] || '' }); }
const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [10, 70, 10, 10, 60, 60, 10, 60, 40].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Google категорії');
X.writeFile(wb, path.join(__dirname, '../../inventory/gm_google_categories.xlsx'));
const sum = {}; for (const r of rows) { const k = r['Google ID'] || '—'; sum[k] = sum[k] || { cats: 0, prods: 0, alt: new Set() }; sum[k].cats++; sum[k].prods += r['Товарів (основний розділ)']; if (r['Варіант 2: ID']) sum[k].alt.add(r['Варіант 2: ID']); }
console.log('categories', rows.length, 'unmapped', rows.filter(r => !r['Google ID']).map(r => r['ID розділу'] + ' ' + r['Розділ']));
for (const [k, v] of Object.entries(sum).sort((a, b) => b[1].prods - a[1].prods)) console.log(`${k} | ${EN[k] || ''} | розділів ${v.cats} | товарів ${v.prods} | варіант 2: ${[...v.alt].join(', ')}`);
if (process.argv[3]) for (const r of rows.filter(r => r['Розділ'].split(' / ').length <= +process.argv[3])) console.log(`${r['ID розділу']} ${r['Розділ']} [${r['Товарів (основний розділ)']}] -> ${r['Google ID']}${r['Варіант 2: ID'] ? ' / ' + r['Варіант 2: ID'] : ''}`);
