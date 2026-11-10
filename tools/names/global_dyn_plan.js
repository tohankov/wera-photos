// Global check «Динамометричний інструмент» (1195) — names, analysis 10.11.2026 (not written before the owner's «ок»).
// As decided in the earlier groups (owner 26.10.2026): the WERA series number in the name, sizes in the «Профіль і розмір» format, «×».
//  1. torque indicators 300 / 400 / 400 i VDE — «Індикатор моменту, що крутить» -> «Індикатор крутного моменту», the series after the noun,
//     handle after a comma, size «HEX 4,0» (not «HEX 4,0 мм»), «TORX PLUS® IP 15» (not «TORX PLUS® 15 IP»; the datasheet size IP 15)
//  2. attachments 7770 / 7771 / 7775 / 7776 / 7780 / 7781 / 7786 — the series after the noun («Насадка-ріжковий ключ 7780, 41 мм, для гнізда 14×18 мм»,
//     «Насадка TORX® 7786 TX 24, для гнізда 14×18 мм»); «Насадка накидний» -> «Насадка-накидний»
//  3. 7880 Joker — the 7870 Joker format («Насадка-ріжковий ключ із самоналаштуванням 7880 Joker L, 16-19 мм, кріплення 14×18 мм»)
//  4. single fixes: «з квадратним приєднувальним 1/4″» -> «з приєднувальним квадратом 1/4″»; UA «привод» -> «привід»; UA «затяжки» -> «затягування»;
//     RU «ключём» -> «ключом»; series numbers of the datasheet title (7435 / 7436 ESD, 1430 / 1431 ESD, 7440 / 7441 / 7444 VDE, 9530, 7440/41, 7443 …)
//  5. 05006634001 — the set name like its pair 05006635001 (Basic 2)
//   node names/global_dyn_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const plan = {}, bad = [];
const W = a => ' WERA ' + a; const strip = t => t.replace(/ WERA \d{11}$/, '');
const put = (a, fn, why) => { const p = L[a]; if (!p || +p.display_in_showcase !== 1) return; if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  const cur = plan[a] || { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: p.mod_title.ua, ru: p.mod_title.ru, why: [] };
  const n = {}; for (const l of ['ua', 'ru']) { n[l] = fn(strip(cur[l]), l); if (n[l] === null || n[l] === undefined) { bad.push(`${a} ${l}: не разобрано (${why}) — ${strip(cur[l])}`); return; } }
  for (const l of ['ua', 'ru']) cur[l] = n[l] + W(a); if (!cur.why.includes(why)) cur.why.push(why); plan[a] = cur; };
const vis = Object.values(L).filter(p => +p.display_in_showcase === 1);
// 1. indicators
for (const p of vis) { const a = p.article; if (!/^Індикатор/.test(p.mod_title.ua)) continue; const t = (ds(a) || {}).title || '';
  const sm = t.match(/^(300|400 i VDE|400)\s/); if (!sm) { bad.push(a + ' индикатор: серия не найдена в паспорте — ' + t); continue; }
  const ser = sm[1]; const pist = /пистолет/.test(t), th = /^400/.test(ser);
  put(a, (s, l) => { const nm = s.match(/(\d+,\d+) Нм/); const sz = s.match(/(HEX \d+,\d)(?: мм)?$|(TX \d+)$|TORX PLUS® (\d+) IP$/); if (!nm || !sz) return null;
    const size = sz[1] || sz[2] || 'TORX PLUS® IP ' + sz[3];
    const hand = pist ? (l === 'ua' ? ', з ручкою-пістолетом' : ', с ручкой-пистолетом') : th ? (l === 'ua' ? ', з Т-подібною ручкою' : ', с Т-образной ручкой') : '';
    return `${l === 'ua' ? 'Індикатор крутного моменту' : 'Индикатор крутящего момента'} ${ser}${hand}, ${nm[1]} Нм, ${size}`; }, 'индикатор: серия WERA ' + ser + ', формат размера'); }
// 2. attachments
const KEY = [[/^Насадка[- ]ріжковий ключ /, 'Насадка-ріжковий ключ', /^Насадка-рожковый ключ /, 'Насадка-рожковый ключ'], [/^Насадка[- ]накидний ключ /, 'Насадка-накидний ключ', /^Насадка-накидной ключ /, 'Насадка-накидной ключ']];
for (const p of vis) { const a = p.article; const t = (ds(a) || {}).title || ''; const sm = t.match(/^(77[78]\d)\s/); if (!sm) continue; const ser = sm[1];
  if (/^77(70|71|75|80|81)$/.test(ser)) put(a, (s, l) => { const k = KEY.find(k => (l === 'ua' ? k[0] : k[2]).test(s)); if (!k) return null;
    return s.replace(l === 'ua' ? k[0] : k[2], `${l === 'ua' ? k[1] : k[3]} ${ser}, `).replace(/ мм,? (для гн)/, ' мм, $1'); }, 'насадка: номер серии WERA ' + ser);
  if (/^77(76|86)$/.test(ser)) put(a, s => /^Насадка TORX® TX \d+,? для/.test(s) ? s.replace(/^Насадка TORX® (TX \d+),? (для)/, `Насадка TORX® ${ser} $1, $2`) : null, 'насадка: номер серии WERA ' + ser); }
// 3. 7880 Joker -> the 7870 format
for (const p of vis) { const a = p.article; if (!/7880 Joker/.test(p.mod_title.ua) || /^Насадка-ріжковий ключ із самоналаштуванням/.test(p.mod_title.ua)) continue;
  put(a, (s, l) => { const m = s.match(/7880 (Joker \S+), розмір (\d+-\d+ мм), (14×18 мм)$|7880 (Joker \S+), размер (\d+-\d+ мм), (14×18 мм)$/); if (!m) return null;
    return l === 'ua' ? `Насадка-ріжковий ключ із самоналаштуванням 7880 ${m[1]}, ${m[2]}, кріплення ${m[3]}` : `Насадка-рожковый ключ с самонастройкой 7880 ${m[4]}, ${m[5]}, крепление ${m[6]}`; }, '7880 Joker: формат 7870 Joker'); }
// 4. single fixes
for (const p of vis) { const a = p.article; const u = p.mod_title.ua, r = p.mod_title.ru;
  if (/з квадратним приєднувальним (\S+)/.test(u)) put(a, (s, l) => l === 'ua' ? s.replace(/з квадратним приєднувальним (\S+)/, 'з приєднувальним квадратом $1') : s, '«з приєднувальним квадратом»');
  if (/ привод /.test(u)) put(a, (s, l) => l === 'ua' ? s.replace(/ привод /g, ' привід ') : s, 'UA «привід»');
  if (/^Насадка для зварювання 7790\/\d привід/.test(u)) put(a, (s, l) => s.replace(/(7790\/\d) (привід|привод)/, '$1, $2'), 'запятая перед приводом');
  if (/моментом затяжки/.test(u)) put(a, (s, l) => l === 'ua' ? s.replace('моментом затяжки', 'моментом затягування') : s, 'UA «затягування»');
  if (/ключём/.test(r)) put(a, (s, l) => l === 'ru' ? s.replace(/ключём/g, 'ключом') : s, 'RU «ключом»'); }
// series from the datasheet title, inserted before the range / at the end (the format of the sibling names)
const SER = {
  '05074786001': ['7435 ESD', 'reg'], '05074788001': ['7436 ESD', 'reg'], '05074802001': ['1430 ESD', 'reg'], '05074804001': ['1431 ESD', 'reg'],
  '05074752001': ['7440 VDE', 'vde'], '05074750001': ['7441 VDE', 'vde'], '05074757001': ['7444 VDE', 'vde'],
  '05074738001': ['7440/41', 'kf'], '05074739001': ['7440/41/42', 'kf'], '05074745001': ['7443/61/9', 'tire'], '05074746001': ['7443/12', 'tire'], '05136076001': ['9530', 'heat'] };
for (const [a, [ser, k]] of Object.entries(SER)) { const t = (ds(a) || {}).title || ''; if (!t.includes(ser.replace(/ ESD$| VDE$/, ''))) { bad.push(`${a} серия ${ser} не в паспорте: ${t}`); continue; }
  put(a, (s, l) => {
    // «Регульована динамометрична ESD викрутка 0,10-0,34 Нм із швидкозатискним патроном» -> the sibling format «… (0,10-0,34 Нм) із швидкозатискним патроном Kraftform 7435 ESD»
    if (k === 'reg') { const m = s.match(/^(Регульована динамометрична|Регулируемая динамометрическая) ESD (викрутка|отвертка) ([\d,]+-[\d,]+ Нм) (.+)$/); return m && `${m[1]} ${m[2]} (${m[3]}) ${m[4]} Kraftform${/^14/.test(ser) ? ' Micro' : ''} ${ser}`; }
    if (k === 'vde') { const m = s.match(/^(.+?) (для вставок|для вставок) (Kraftform Kompakt VDE) ([\d,]+-[\d,]+) Nm$/); return m && `${m[1]} ${ser} ${m[2]} ${m[3]}, ${m[4]} Нм`; }
    if (k === 'kf') return / Kraftform ([\d,]+-[\d,]+ Нм)/.test(s) ? s.replace(/ Kraftform ([\d,]+-[\d,]+ Нм)/, ` Kraftform ${ser}, $1`) : null;
    if (k === 'tire') return /^(Система контролю тиску в шинах|Система контроля давления в шинах),/.test(s) ? s.replace(/^(Система контролю тиску в шинах|Система контроля давления в шинах),/, `$1 ${ser},`) : null;
    if (k === 'heat') return /\/(кондиціонерів|кондиционеров),/.test(s) ? s.replace(/\/(кондиціонерів|кондиционеров),/, ` / $1 ${ser},`) : null; }, 'номер серии WERA ' + ser + ' (паспорт)'); }
// the recalibration set: «серии 7400» of the datasheet title
put('05137003001', (s, l) => l === 'ua' ? s + ' серії 7400' : s + ' серии 7400', 'паспорт: «Набор для рекалибровки серии 7400»');
// 5. 05006634001 (owner 18.10: the end of the name was disputed) — like 05006635001; range 2,4-4,0 Нм — «Діапазон моменту» (torque_exact)
put('05006634001', (s, l) => l === 'ua' ? 'Набір динамометричний для розподільчих шаф Kraftform Kompakt VDE Safe-Torque Speed Basic 1, 2,4-4,0 Нм, 11 предметів'
  : 'Набор динамометрический для распределительных шкафов Kraftform Kompakt VDE Safe-Torque Speed Basic 1, 2,4-4,0 Нм, 11 предметов', 'формат набора Basic 2 (05006635001), паспорт: «… набор Basic 1, 11 предметов»');
for (const [a, v] of Object.entries(plan)) if (v.ua === v.oldMod.ua && v.ru === v.oldMod.ru) delete plan[a];
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
const c = {}; for (const v of Object.values(plan)) for (const w of v.why) { const k = w.replace(/ \d{3,4}[^ ]*( ESD| VDE)?.*$/, ''); c[k] = (c[k] || 0) + 1; }
console.log('plan', Object.keys(plan).length, c, '| problems', bad.length); for (const b of bad) console.log('  ', b);
