// Owner 27.10.2026, rule Б: texts are our own wording of WERA facts (SEO), the structure stays. The sentences added on 25.10 (cat/gvyk_phrase_plan.js,
// docs/global_vykrutky_phrases.csv) are the datasheet RU line and its literal UA translation — each is replaced in place by our own sentence with the same
// fact (no new facts, no advertising words). Read-only: builds the plan for cat/desc_write.js.
//   node cat/gvyk_phrase_rewrite.js <export.json> <out plan.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv;
const R = [
  ['З фіксуючою функцією на довгому робочому кінці для надійного утримання гвинта на інструменті.', 'Довгий робочий кінець має фіксуючу функцію: гвинт тримається на інструменті й не випадає.'],
  ['С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте.', 'Длинный рабочий конец имеет фиксирующую функцию: винт держится на инструменте и не выпадает.'],
  ['Викрутка з поперечною ручкою, з фіксуючою функцією на довгій стороні для надійного утримання гвинтів на інструменті.', 'Довга сторона поперечної ручки має фіксуючу функцію, тож гвинт тримається на інструменті.'],
  ['Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте.', 'Длинная сторона поперечной рукоятки имеет фиксирующую функцию, поэтому винт держится на инструменте.'],
  ['З індикатором Take it easy: кольорове маркування профілю та гравіювання розміру.', 'Колір на ручці вказує профіль, а гравіювання — розмір (система Take it easy).'],
  ['С индикатором Take it easy: цветовая маркировка профиля и гравировка размера.', 'Цвет на рукоятке указывает профиль, а гравировка — размер (система Take it easy).'],
  ['Hex-Plus подовжує термін служби гвинтів із внутрішнім шестигранником.', 'Профіль Hex-Plus менше зношує гвинти з внутрішнім шестигранником.'],
  ['Hex-Plus продлевает жизнь винтов с внутренним шестигранником.', 'Профиль Hex-Plus меньше изнашивает винты с внутренним шестигранником.'],
  ['З фіксуючою функцією для гвинтів TORX®.', 'Фіксуюча функція утримує гвинт TORX® на робочому кінці.'],
  ['С фиксирующей функцией для винтов TORX®.', 'Фиксирующая функция удерживает винт TORX® на рабочем конце.'],
  ['З наконечником Lasertip для кращого контакту з головкою гвинта.', 'Наконечник Lasertip міцніше тримається в головці гвинта.'],
  ['С наконечником Lasertip для лучшего контакта с головкой винта.', 'Наконечник Lasertip прочнее держится в головке винта.'],
  ['Викрутка для гвинтів TORX® з фіксуючою функцією.', 'Робочий кінець TORX® має фіксуючу функцію.'],
  ['Отвёртка для винтов TORX® с фиксирующей функцией.', 'Рабочий конец TORX® имеет фиксирующую функцию.'],
  ['Викрутка TORX® з фіксуючою функцією та екстрадовгим стрижнем 300 мм.', 'Стрижень завдовжки 300 мм, робочий кінець TORX® з фіксуючою функцією.'],
  ['Отвёртка TORX® с фиксирующей функцией и экстрадлинным стержнем 300 мм.', 'Стержень длиной 300 мм, рабочий конец TORX® с фиксирующей функцией.'],
  ['Викрутки 350 PH, 355 PZ, 334 і 335 з лазерним наконечником Lasertip, який знижує ризик випадкового вислизання гвинта.', 'У викруток 350 PH, 355 PZ, 334 і 335 наконечник Lasertip — він рідше зісковзує з гвинта.'],
  ['Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта.', 'У отвёрток 350 PH, 355 PZ, 334 и 335 наконечник Lasertip — он реже соскальзывает с винта.'] ];
const CSV = fs.readFileSync(require('path').join(__dirname, '../../docs/global_vykrutky_phrases.csv'), 'utf8'); const ARTS = new Set([...CSV.matchAll(/^"(0\d{10})"/gm)].map(m => m[1]));
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => ARTS.has(p.article) && +p.display_in_showcase === 1);
const plan = { name: 'gvyk_phrase_own', products: {} }; const miss = [], stat = {};
for (const p of L) { const nw = { ua: p.description.ua, ru: p.description.ru }; const why = [];
  for (const [o, n] of R) for (const l of ['ua', 'ru']) if (nw[l].includes(o)) { nw[l] = nw[l].split(o).join(n); why.push(`${l}: «${o.slice(0, 40)}…» → своими словами`); stat[o.slice(0, 30)] = (stat[o.slice(0, 30)] || 0) + 1; }
  if (!why.length) { miss.push(p.article); continue; } plan.products[p.article] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, 'of', ARTS.size, '| no phrase found', miss.length, miss.slice(0, 5)); console.log(stat);
