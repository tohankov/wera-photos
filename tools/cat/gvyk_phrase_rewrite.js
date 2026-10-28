// Owner 27.10.2026, rule Б: texts are our own wording of WERA facts (SEO), the structure stays. The sentences added on 25.10 (cat/gvyk_phrase_plan.js,
// docs/global_vykrutky_phrases.csv) are the datasheet RU line and its literal UA translation — each is replaced in place by our own sentence with the same
// fact (no new facts, no advertising words). Read-only: builds the plan for cat/desc_write.js.
//   node cat/gvyk_phrase_rewrite.js <export.json> <out plan.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv;
const R = [   // owner 28.10.2026: LIGHT changes only — WERA terms kept, order / a couple of words, same meaning and length
  ['З фіксуючою функцією на довгому робочому кінці для надійного утримання гвинта на інструменті.', 'З фіксуючою функцією на довгому робочому кінці: гвинт надійно утримується на інструменті.'],
  ['С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте.', 'С фиксирующей функцией на длинном рабочем конце: винт надёжно удерживается на инструменте.'],
  ['Викрутка з поперечною ручкою, з фіксуючою функцією на довгій стороні для надійного утримання гвинтів на інструменті.', 'Викрутка з поперечною ручкою; фіксуюча функція на довгій стороні надійно утримує гвинти на інструменті.'],
  ['Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте.', 'Отвёртка с поперечной ручкой; фиксирующая функция на длинной стороне надёжно удерживает винты на инструменте.'],
  ['З індикатором Take it easy: кольорове маркування профілю та гравіювання розміру.', 'З індикатором Take it easy: профіль позначено кольором, а розмір — гравіюванням.'],
  ['С индикатором Take it easy: цветовая маркировка профиля и гравировка размера.', 'С индикатором Take it easy: профиль обозначен цветом, а размер — гравировкой.'],
  ['Hex-Plus подовжує термін служби гвинтів із внутрішнім шестигранником.', 'З Hex-Plus гвинти з внутрішнім шестигранником служать довше.'],
  ['Hex-Plus продлевает жизнь винтов с внутренним шестигранником.', 'С Hex-Plus винты с внутренним шестигранником служат дольше.'],
  ['З фіксуючою функцією для гвинтів TORX®.', 'Фіксуюча функція — для гвинтів TORX®.'],
  ['С фиксирующей функцией для винтов TORX®.', 'Фиксирующая функция — для винтов TORX®.'],
  ['З наконечником Lasertip для кращого контакту з головкою гвинта.', 'Наконечник Lasertip — для кращого контакту з головкою гвинта.'],
  ['С наконечником Lasertip для лучшего контакта с головкой винта.', 'Наконечник Lasertip — для лучшего контакта с головкой винта.'],
  ['Викрутка для гвинтів TORX® з фіксуючою функцією.', 'Викрутка з фіксуючою функцією для гвинтів TORX®.'],
  ['Отвёртка для винтов TORX® с фиксирующей функцией.', 'Отвёртка с фиксирующей функцией для винтов TORX®.'],
  ['Викрутка TORX® з фіксуючою функцією та екстрадовгим стрижнем 300 мм.', 'Викрутка TORX® з екстрадовгим стрижнем 300 мм і фіксуючою функцією.'],
  ['Отвёртка TORX® с фиксирующей функцией и экстрадлинным стержнем 300 мм.', 'Отвёртка TORX® с экстрадлинным стержнем 300 мм и фиксирующей функцией.'],
  ['Викрутки 350 PH, 355 PZ, 334 і 335 з лазерним наконечником Lasertip, який знижує ризик випадкового вислизання гвинта.', 'Викрутки 350 PH, 355 PZ, 334 і 335 мають лазерний наконечник Lasertip, що знижує ризик випадкового вислизання гвинта.'],
  ['Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта.', 'Отвертки 350 PH, 355 PZ, 334 и 335 имеют лазерный наконечник Lasertip, снижающий риск случайного выскальзывания винта.'] ];
const CSV = fs.readFileSync(require('path').join(__dirname, '../../docs/global_vykrutky_phrases.csv'), 'utf8'); const ARTS = new Set([...CSV.matchAll(/^"(0\d{10})"/gm)].map(m => m[1]));
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => ARTS.has(p.article) && +p.display_in_showcase === 1);
const plan = { name: 'gvyk_phrase_own', products: {} }; const miss = [], stat = {};
for (const p of L) { const nw = { ua: p.description.ua, ru: p.description.ru }; const why = [];
  for (const [o, n] of R) for (const l of ['ua', 'ru']) if (nw[l].includes(o)) { nw[l] = nw[l].split(o).join(n); why.push(`${l}: «${o.slice(0, 40)}…» → своими словами`); stat[o.slice(0, 30)] = (stat[o.slice(0, 30)] || 0) + 1; }
  if (!why.length) { miss.push(p.article); continue; } plan.products[p.article] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, 'of', ARTS.size, '| no phrase found', miss.length, miss.slice(0, 5)); console.log(stat);
