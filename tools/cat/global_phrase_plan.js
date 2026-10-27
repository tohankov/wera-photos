// Owner 25.10.2026: one sentence from the WERA datasheet (page 1, the product's own bullets) for a feature our text does not name — Lasertip, Take it easy,
// Hex-Plus, Black Point, VDE / ударний / магніт / HF. Only the WERA fact, no advertising; UA — translation of the datasheet RU line; RU — the datasheet line
// (obvious typo fixed). A language gets the sentence only when its own text lacks the feature. Placed as the last item of the prose <ul> when there is one,
// else as a <p> before the variant table / datasheet block. Not touched: Christmas MIX 05135826001, the screw fixers (not HF), hidden products.
// Generalised 27.10.2026 for every group (copy of cat/gvyk_phrase_plan.js): the translations of all groups below; our text already naming the feature
// in another wording («захисною ізоляцією», «фіксувальною функцією») counts; a compatibility line («Подходит для ручки-держателя 817 VDE») is not a feature.
//   node cat/global_phrase_plan.js <group export.json> <phrases.json (cat/gvyk_phrase_scan.js)> <out plan.json>   -> cat/desc_write.js
const fs = require('fs'), path = require('path'); const [, , LIVE, PH, OUT] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = JSON.parse(fs.readFileSync(PH, 'utf8'));
// the datasheet sentence starts on the line before the one the scan found (05006640001: «… Сменные отвёртки / VDE с идентификатором …»)
const FULL = { '05006640001': 'Сменные отвёртки VDE с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера для простого и быстрого отбора нужного инструмента' };
const T = {
  'Сменные отвёртки VDE с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера для простого и быстрого отбора нужного инструмента': ['Змінні викрутки VDE з ідентифікатором інструментів Take it easy: кольорове кодування профілю та лазерне гравіювання розміру для простого і швидкого вибору потрібного інструмента', 'Сменные отвёртки VDE с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера для простого и быстрого выбора нужного инструмента'],
  'Сменные отвёртки с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера': ['Змінні викрутки з ідентифікатором інструментів Take it easy: кольорове кодування профілю та лазерне гравіювання розміру', 'Сменные отвёртки с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера'],
  'С индикатором Take it easy: Цветовая маркировка профиля и гравировка размера': ['З індикатором Take it easy: кольорове маркування профілю та гравіювання розміру', 'С индикатором Take it easy: цветовая маркировка профиля и гравировка размера'],
  'С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте': ['З фіксуючою функцією на довгому робочому кінці для надійного утримання гвинта на інструменті', 'С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте'],
  'Hex-Plus продлевает жизнь винтов с внутренним шестигранником': ['Hex-Plus подовжує термін служби гвинтів із внутрішнім шестигранником', 'Hex-Plus продлевает жизнь винтов с внутренним шестигранником'],
  'С фиксирующей функцией для винтов TORX®': ['З фіксуючою функцією для гвинтів TORX®', 'С фиксирующей функцией для винтов TORX®'],
  'Отвёртка для винтов TORX®, с фиксирующей функцией': ['Викрутка для гвинтів TORX® з фіксуючою функцією', 'Отвёртка для винтов TORX® с фиксирующей функцией'],
  'Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте': ['Викрутка з поперечною ручкою, з фіксуючою функцією на довгій стороні для надійного утримання гвинтів на інструменті', 'Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте'],
  'С наконечником Lasertip для лучшего контакта с головокой винта': ['З наконечником Lasertip для кращого контакту з головкою гвинта', 'С наконечником Lasertip для лучшего контакта с головкой винта'],
  'Отвёртка TORX®, с фиксирующей функцией и с экстрадлинным стержнем 300 мм': ['Викрутка TORX® з фіксуючою функцією та екстрадовгим стрижнем 300 мм', 'Отвёртка TORX® с фиксирующей функцией и экстрадлинным стержнем 300 мм'],
  'Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта': ['Викрутки 350 PH, 355 PZ, 334 і 335 з лазерним наконечником Lasertip, який знижує ризик випадкового вислизання гвинта', 'Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта'] };
// not a feature of the tool: Tool-Check holding clips («зелёные фиксирующие элементы»), a component's own description in a set («Магнитный держатель бит …»),
// a long mixed paragraph (Take it easy + profiles + Tool-Check) — not one fact
const SKIP = new Set(['05135826001']); const SKIPLINE = /^Насадка, фиксирующая винты|^Подходит для ручки-держателя|зелен\S* фиксирующ|^Магнитный держатель бит|^Take it easy: цветовая кодировка с помощью штамповки/i;
Object.assign(T, {
  'Каждый Г-образный ключ имеет идентификатор инструментов Take it easy с цветовой кодировкой размера': ['Кожен Г-подібний ключ має ідентифікатор інструментів Take it easy з кольоровим кодуванням розміру', 'Каждый Г-образный ключ имеет идентификатор инструментов Take it easy с цветовой кодировкой размера'],
  'Универсальный держатель с гильзой из специальной стали и сильным постоянным магнитом': ['Універсальний тримач із гільзою зі спеціальної сталі та сильним постійним магнітом', 'Универсальный держатель с гильзой из специальной стали и сильным постоянным магнитом'],
  'Индикатор Take it easy: цветовая кодировка размера': ['Індикатор Take it easy: кольорове кодування розміру', 'Индикатор Take it easy: цветовая кодировка размера'],
  'Набор торцовых головок, с фиксирующей функцией для особенно комфортной работы с минимальным риском потерять винт до начала завинчивания.': ['Набір торцевих головок із фіксуючою функцією для особливо комфортної роботи з мінімальним ризиком втратити гвинт до початку загвинчування', 'Набор торцовых головок с фиксирующей функцией для особенно комфортной работы с минимальным риском потерять винт до начала завинчивания'],
  'Головки с идентификатором инструментов Take it easy: цветовая кодировка по размеру и тиснению размеров': ['Головки з ідентифікатором інструментів Take it easy: кольорове кодування за розміром і тиснення розміру', 'Головки с идентификатором инструментов Take it easy: цветовая кодировка по размеру и тиснение размера'] });
const HAS = { ua: { Lasertip: /Lasertip/i, 'Take it easy': /Take it easy/i, 'Hex-Plus': /Hex-Plus/i, HF: /фіксуюч|фіксувальн|\bHF\b/i, VDE: /\bVDE\b|ізольован|ізоляц/i, 'ударний': /ударн/i, 'магніт': /магніт/i, 'Black Point': /Black Point/i },
  ru: { Lasertip: /Lasertip/i, 'Take it easy': /Take it easy/i, 'Hex-Plus': /Hex-Plus/i, HF: /фиксирующ|фиксирован|\bHF\b/i, VDE: /\bVDE\b|изолирован|изоляц/i, 'ударний': /ударн/i, 'магніт': /магнит/i, 'Black Point': /Black Point/i } };
const prose = h => String(h || '').replace(/<table[\s\S]*?<\/table>/g, '').replace(/<div class="wsb"[\s\S]*$/, '').replace(/<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)[\s\S]*$/, '');
const full = (a, line) => { if (FULL[a]) return FULL[a]; const ds = fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8').split('\n').filter(s => s.startsWith('p1 ')).map(s => s.slice(3)); const i = ds.indexOf(line);
  let s = line; for (let k = i + 1; k < ds.length && /^[a-zа-яё]/.test(ds[k]); k++) s += ' ' + ds[k]; return s; };
const insert = (h, sentences) => { const cut = h.search(/<div class="wsb"|<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)/); const head = cut < 0 ? h : h.slice(0, cut), tail = cut < 0 ? '' : h.slice(cut);
  const ul = head.lastIndexOf('</ul>'); if (ul >= 0) return head.slice(0, ul) + sentences.map(s => `<li>${s}</li>`).join('') + head.slice(ul) + tail;
  return head + sentences.map(s => `<p>${s}</p>`).join('') + tail; };
const plan = { name: 'gvyk_phrase', products: {} }; const report = [], miss = new Set();
for (const [a, list] of Object.entries(J.products)) { if (SKIP.has(a)) continue; const p = L[a]; if (!p || +p.display_in_showcase !== 1) continue; const nw = { ua: p.description.ua, ru: p.description.ru }; const why = [];
  for (const l of ['ua', 'ru']) { const add = []; for (const x of list) { if (SKIPLINE.test(x.line)) continue; if (HAS[l][x.f].test(prose(p.description[l]))) continue;
      const line = full(a, x.line); const tr = T[line]; if (!tr) { miss.add(line); continue; } const s = tr[l === "ua" ? 0 : 1] + "."; /* a full stop, as the neighbouring sentences */ if (!add.includes(s)) { add.push(s); why.push(`${l}: ${x.f}`); } }
    if (add.length) nw[l] = insert(nw[l], add); }
  if (nw.ua === p.description.ua && nw.ru === p.description.ru) continue;
  plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why }; report.push({ art: a, name: p.mod_title.ua, add: why.join('; '), ua: list.map(x => T[full(a, x.line)] ? T[full(a, x.line)][0] : '').filter(Boolean).join(' | ') }); }
if (miss.size) { console.log('STOP: no translation for', [...miss]); process.exit(2); }
fs.writeFileSync(OUT, JSON.stringify(plan)); fs.writeFileSync(OUT.replace(/\.json$/, '_report.json'), JSON.stringify(report, null, 1));
const c = {}; for (const r of report) for (const w of r.add.split('; ')) c[w] = (c[w] || 0) + 1; console.log('products', report.length, c);
