// Rule Б (owner 28.10.2026: LIGHT changes, WERA terms kept) for the «Діелектричні» WERA phrase plan (cat/gvde_phrase_plan.json, 6 sets — the Take it easy
// sentence): the added sentence is the light wording of the owner's sample («З індикатором Take it easy: профіль позначено кольором, а розмір — гравіюванням»).
// Read-only; write only after the owner's «ок» on rule Б.   node cat/gvde_phrase_light.js <out plan.json>
const fs = require('fs'), path = require('path'); const [, , OUT] = process.argv; const P = require('./gvde_phrase_plan.json');
const R = [
  ['З індикатором Take it easy: кольорове маркування профілю та гравіювання розміру.', 'З індикатором Take it easy: профіль позначено кольором, а розмір — гравіюванням.'],
  ['С индикатором Take it easy: цветовая маркировка профиля и гравировка размера.', 'С индикатором Take it easy: профиль обозначен цветом, а размер — гравировкой.'],
  ['Змінні викрутки VDE з ідентифікатором інструментів Take it easy: кольорове кодування профілю та лазерне гравіювання розміру для простого і швидкого вибору потрібного інструмента.',
    'Змінні викрутки VDE з ідентифікатором інструментів Take it easy: профіль позначено кольором, а розмір — лазерним гравіюванням, тож потрібний інструмент легко й швидко знайти.'],
  ['Сменные отвёртки VDE с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера для простого и быстрого выбора нужного инструмента.',
    'Сменные отвёртки VDE с идентификатором инструментов Take it easy: профиль обозначен цветом, а размер — лазерной гравировкой, поэтому нужный инструмент легко и быстро найти.'],
  ['Змінні викрутки з ідентифікатором інструментів Take it easy: кольорове кодування профілю та лазерне гравіювання розміру.', 'Змінні викрутки з ідентифікатором інструментів Take it easy: профіль позначено кольором, а розмір — лазерним гравіюванням.'],
  ['Сменные отвёртки с идентификатором инструментов Take it easy: цветовая кодировка профиля и лазерная гравировка размера.', 'Сменные отвёртки с идентификатором инструментов Take it easy: профиль обозначен цветом, а размер — лазерной гравировкой.'] ];
const plan = { name: 'gvde_phrase_light', products: {} }; const miss = [];
for (const [a, x] of Object.entries(P.products)) { const nw = { ...x.new }; let n = 0;
  for (const l of ['ua', 'ru']) for (const [o, w] of R) if (nw[l].includes(o)) { nw[l] = nw[l].split(o).join(w); n++; }
  if (n !== 2) miss.push(a + ' ' + n); plan.products[a] = { old: x.old, new: nw, why: ['Take it easy — лёгкая формулировка (правило Б)'] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('plan', Object.keys(plan.products).length, '| not exactly 2 replacements', miss);
