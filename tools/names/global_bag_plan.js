// Global check «Сумки для інструментів Wera 2go» (1269) — names, analysis 10.11.2026 (not written before the owner's «ок»).
// The datasheet title is the source: «9446 Мягкий футляр Click-Torque A 6 Set 1, неукомплектованный, 320 мм x 97 мм x 42 мм».
// Format (the WERA series number right after the main noun, as in «Перехідник 780 B/1 …», owner 26.10.2026):
//   <type by the datasheet> <94xx / 95xx> [для] <what it is for>, без інструментів, <A×B×C мм> WERA <article>
// «неукомплектованный / пустой / без инструментов» -> one wording «без інструментів» / «без инструментов» (as the Zyklop belts, 29.10.2026);
// the sizes — all of the datasheet title, «×». Wera 2go modules, velcro strips and products without a series number keep their names.
//   node names/global_bag_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, skip = [];
// datasheet type -> UA / RU (RU typos of the datasheet fixed: «Складнаяя»)
const TYPES = [[/^Сумка с кармашком/, 'Сумка з кишенькою', 'Сумка с кармашком'], [/^Футляр из текстиля/, 'Футляр із текстилю', 'Футляр из текстиля'],
  [/^Мягкая сумка/, "М'яка сумка", 'Мягкая сумка'], [/^Мягкий футляр/, "М'який футляр", 'Мягкий футляр'], [/^Кожух/, 'Кожух', 'Кожух'], [/^Пояс/, 'Пояс', 'Пояс'],
  [/^Складная?я? сумка/, 'Складна сумка', 'Складная сумка'], [/^Сумка-скрутка/, 'Сумка-скрутка', 'Сумка-скрутка'], [/^Складной чехол/, 'Складний чохол', 'Складной чехол'],
  [/^Чехол для инструмента/, 'Чохол для інструментів', 'Чехол для инструментов'], [/^Текстильная коробка/, 'Текстильна коробка', 'Текстильная коробка'], [/^Сумка/, 'Сумка', 'Сумка']];
// RU phrase -> UA (the part after the type); applied in order
const PH = [[/для размещения до (\d+) предметов набора/g, 'для розміщення до $1 предметів набору'], [/для размещения до (\d+) предметов/g, 'для розміщення до $1 предметів'], [/для набора из не более (\d+) предметов/g, 'для набору не більше $1 предметів'],
  [/для наборов (.+?) на макс\.\s?(\d+) предмет(?:ов|а)/g, 'для наборів $1 до $2 предметів'], [/для размещения до (\d+) предметов набора/g, 'для розміщення до $1 предметів набору'],
  [/предметов набора/g, 'предметів набору'], [/на (\d+) рожковых ключей/g, 'на $1 ріжкових ключів'], [/на (\d+) рожковых ключа/g, 'на $1 ріжкові ключі'],
  [/для (\d+) гаечн\S+ ключей с трещоткой/g, 'для $1 гайкових ключів із тріскачкою'], [/для (\d+) гаечных ключей с самонастройкой/g, 'для $1 гайкових ключів із самоналаштуванням'],
  [/с самонастройкой/g, 'із самоналаштуванням'], [/набор для замены автомобильных колес/g, 'набір для заміни автомобільних коліс'],
  [/для набора динамометрических ключей для трубных фитингов/g, 'для набору динамометричних ключів для трубних фітингів'], [/Набор Impaktor/g, 'набір Impaktor'],
  [/Г-образные ключи/g, 'Г-подібні ключі'], [/\(метрические\)/g, '(метричні)'], [/набор (\d)/g, 'набір $1']];
const RUFIX = [[/Складнаяя/g, 'Складная'], [/неукомплетованная/g, 'неукомплектованная'], [/макс\.(\d)/g, 'макс. $1'], [/(\d)набор/g, '$1, набор'], [/гаечный ключей/g, 'гаечных ключей'], [/"/g, '″']];
const NOTOOLS = /,?\s*(?:неукомплект\S*|неукомплет\S*|пуст(?:ой|ая)|без инструментов)\s*(?=,|$)/;
for (const p of L) { const a = p.article; const d = ds(a); const t = d && d.title; const m = t && t.match(/^(9[45]\d\d)\s+(.+)$/);
  if (!m) { skip.push(`${a} ${p.mod_title.ua.slice(0, 60)} — ${t ? 'в паспорте нет номера серии 94xx / 95xx' : 'нет паспорта'}`); continue; }
  let rest = m[2]; for (const [re, b] of RUFIX) rest = rest.replace(re, b);
  // «Kraftform Kompakt 20 Сумка, 155 мм x 65 мм» — the type stands after the set name
  const tail = rest.match(/^(Kraftform Kompakt \d+) Сумка(.*)$/); if (tail) rest = 'Сумка ' + tail[1] + tail[2];
  const ty = TYPES.find(([re]) => re.test(rest)); if (!ty) { skip.push(`${a} тип не распознан: ${t}`); continue; }
  rest = rest.replace(ty[0], '').trim();
  const dims = [...rest.matchAll(/(\d+(?:[.,]\d+)?)\s*мм/g)].map(x => x[1].replace('.', ','));
  rest = rest.replace(/,?\s*\d+(?:[.,]\d+)?\s*мм(?:\s*x\s*\d+(?:[.,]\d+)?\s*мм)*/g, '').replace(NOTOOLS, '').replace(/,\s*$/, '').trim();
  // a set series of the keys / tools before «для / на» («6000 для 11 гаечных ключей … Joker», «6001 для Joker Switch 4», «9558 для набора …»):
  // after «Joker» when it is named, else at the end — not next to the bag's own number
  const lead = rest.match(/^(\d{4}) (для|на) (.+)$/);
  if (lead) rest = /Joker Switch/.test(lead[3]) ? `${lead[2]} ${lead[1]} ${lead[3]}` : /Joker/.test(lead[3]) ? `${lead[2]} ${lead[3].replace('Joker', 'Joker ' + lead[1])}` : `${lead[2]} ${lead[3]} ${lead[1]}`;
  const forRu = /^(для|на|под)\s/.test(rest) || !rest ? '' : 'для ';
  let restUa = rest; for (const [re, b] of PH) restUa = restUa.replace(re, b); restUa = restUa.replace(/^для /, 'для ').replace(/^на /, 'на ');
  // the drive of our current name («8006 SC 1 1/2″», «8100 SA Zyklop Speed 1/4″») is not in the datasheet title — kept, after a comma
  // («для 8006 SC 1, 1/2″»: «1 1/2″» would read as one and a half inches)
  const drv = (p.mod_title.ua.match(/(\d\/\d″)/) || [])[1]; if (drv && !/″/.test(rest)) { rest += ', ' + drv; restUa += ', ' + drv; }
  const sz = dims.length ? `, ${dims.join('×')} мм` : '';
  const ua = `${ty[1]} ${m[1]} ${forRu ? 'для ' : ''}${restUa}, без інструментів${sz} WERA ${a}`.replace(/\s+/g, ' ').replace(/ ,/g, ',');
  const ru = `${ty[2]} ${m[1]} ${forRu}${rest}, без инструментов${sz} WERA ${a}`.replace(/\s+/g, ' ').replace(/ ,/g, ',');
  if (ua === p.mod_title.ua && ru === p.mod_title.ru) continue;
  plan[a] = { oldTitle: p.title, oldMod: p.mod_title, ua, ru, ds: t, why: [`паспорт WERA: «${t}»`] }; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('names', Object.keys(plan).length, '| kept', skip.length); for (const s of skip) console.log('  ', s);
