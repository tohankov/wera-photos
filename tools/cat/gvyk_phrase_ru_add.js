// Owner 29.10.2026 (rule Б ok): where the WERA hold-function sentence was added only in UA (58 HF — the RU text named the feature in its own words), the RU
// sentence goes in too, at the same place: UA <li> -> RU <li> at the end of the same list (the n-th <ul>), UA <p> -> RU <p> before the same following block.
// Changes cat/gvyk_phrase_own_plan.json in place (only plan.new.ru).   node cat/gvyk_phrase_ru_add.js
const fs = require('fs'), path = require('path'); const F = path.join(__dirname, 'gvyk_phrase_own_plan.json'); const plan = JSON.parse(fs.readFileSync(F, 'utf8'));
const PAIRS = [['З фіксуючою функцією на довгому робочому кінці: гвинт надійно утримується на інструменті.', 'С фиксирующей функцией на длинном рабочем конце: винт надёжно удерживается на инструменте.'],
  ['Викрутка з поперечною ручкою; фіксуюча функція на довгій стороні надійно утримує гвинти на інструменті.', 'Отвёртка с поперечной ручкой; фиксирующая функция на длинной стороне надёжно удерживает винты на инструменте.'],
  ['Фіксуюча функція — для гвинтів TORX®.', 'Фиксирующая функция — для винтов TORX®.'],
  ['Викрутка з фіксуючою функцією для гвинтів TORX®.', 'Отвёртка с фиксирующей функцией для винтов TORX®.'],
  ['Викрутка TORX® з екстрадовгим стрижнем 300 мм і фіксуючою функцією.', 'Отвёртка TORX® с экстрадлинным стержнем 300 мм и фиксирующей функцией.']];
const ANCH = [['<h3>Інші варіанти', '<h3>Другие варианты'], ['<h3>Дізнайтеся більше', '<h3>Узнайте больше'], ['<div class="wsb"', '<div class="wsb"'], ['<table', '<table'], ['<p><strong>Характеристики', '<p><strong>Характеристики']];
let n = 0; const miss = [];
for (const [a, x] of Object.entries(plan.products)) for (const [u, r] of PAIRS) { const ua = x.new.ua; const i = ua.indexOf(u); if (i < 0 || x.new.ru.includes(r)) continue;
  if (ua.slice(i - 4, i) === '<li>') { const k = (ua.slice(0, i).match(/<ul>/g) || []).length; let pos = -1, from = 0; for (let j = 0; j < k; j++) { pos = x.new.ru.indexOf('<ul>', from); from = pos + 4; }
    const end = pos < 0 ? -1 : x.new.ru.indexOf('</ul>', pos); if (end < 0) { miss.push(a + ' li'); continue; } x.new.ru = x.new.ru.slice(0, end) + `<li>${r}</li>` + x.new.ru.slice(end); }
  else { const after = ua.slice(i + u.length + 4); const an = ANCH.find(([au]) => after.startsWith(au)); const j = an ? x.new.ru.indexOf(an[1]) : -1;
    if (j < 0) { miss.push(a + ' p ' + after.slice(0, 30)); continue; } x.new.ru = x.new.ru.slice(0, j) + `<p>${r}</p>` + x.new.ru.slice(j); }
  x.why.push('ru: та же фраза WERA (как в UA)'); n++; }
fs.writeFileSync(F, JSON.stringify(plan)); console.log('RU added', n, '| place not found', miss.length, miss.slice(0, 8));
