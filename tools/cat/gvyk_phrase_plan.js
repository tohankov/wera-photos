// Owner 25.10.2026: one sentence from the WERA datasheet (page 1, the product's own bullets) for a feature our text does not name — Lasertip, Take it easy,
// Hex-Plus, Black Point, VDE / ударний / магніт / HF. Only the WERA fact, no advertising; UA — translation of the datasheet RU line; RU — the datasheet line
// (obvious typo fixed). A language gets the sentence only when its own text lacks the feature. Placed as the last item of the prose <ul> when there is one,
// else as a <p> before the variant table / datasheet block. Not touched: Christmas MIX 05135826001, the screw fixers (not HF), hidden products.
//   node cat/gvyk_phrase_plan.js <group export.json> <phrases.json (cat/gvyk_phrase_scan.js)> <out plan.json>   -> cat/desc_write.js
const fs = require('fs'), path = require('path'); const [, , LIVE, PH, OUT] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = JSON.parse(fs.readFileSync(PH, 'utf8'));
const T = {
  'С индикатором Take it easy: Цветовая маркировка профиля и гравировка размера': ['З індикатором Take it easy: кольорове маркування профілю та гравіювання розміру', 'С индикатором Take it easy: цветовая маркировка профиля и гравировка размера'],
  'С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте': ['З фіксуючою функцією на довгому робочому кінці для надійного утримання гвинта на інструменті', 'С фиксирующей функцией на длинном рабочем конце для надёжного удержания винта на инструменте'],
  'Hex-Plus продлевает жизнь винтов с внутренним шестигранником': ['Hex-Plus подовжує термін служби гвинтів із внутрішнім шестигранником', 'Hex-Plus продлевает жизнь винтов с внутренним шестигранником'],
  'С фиксирующей функцией для винтов TORX®': ['З фіксуючою функцією для гвинтів TORX®', 'С фиксирующей функцией для винтов TORX®'],
  'Отвёртка для винтов TORX®, с фиксирующей функцией': ['Викрутка для гвинтів TORX® з фіксуючою функцією', 'Отвёртка для винтов TORX® с фиксирующей функцией'],
  'Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте': ['Викрутка з поперечною ручкою, з фіксуючою функцією на довгій стороні для надійного утримання гвинтів на інструменті', 'Отвёртка с поперечной ручкой, с фиксирующей функцией на длинной стороне для надёжного удержания винтов на инструменте'],
  'С наконечником Lasertip для лучшего контакта с головокой винта': ['З наконечником Lasertip для кращого контакту з головкою гвинта', 'С наконечником Lasertip для лучшего контакта с головкой винта'],
  'Отвёртка TORX®, с фиксирующей функцией и с экстрадлинным стержнем 300 мм': ['Викрутка TORX® з фіксуючою функцією та екстрадовгим стрижнем 300 мм', 'Отвёртка TORX® с фиксирующей функцией и экстрадлинным стержнем 300 мм'],
  'Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта': ['Викрутки 350 PH, 355 PZ, 334 і 335 з лазерним наконечником Lasertip, який знижує ризик випадкового вислизання гвинта', 'Отвертки 350 PH, 355 PZ, 334 и 335 с лазерным наконечником Lasertip, который снижает риск случайного выскальзывания винта'] };
const SKIP = new Set(['05135826001']); const SKIPLINE = /^Насадка, фиксирующая винты/;
const HAS = { ua: { Lasertip: /Lasertip/i, 'Take it easy': /Take it easy/i, 'Hex-Plus': /Hex-Plus/i, HF: /фіксуюч|\bHF\b/i, VDE: /\bVDE\b|ізольован/i, 'ударний': /ударн/i },
  ru: { Lasertip: /Lasertip/i, 'Take it easy': /Take it easy/i, 'Hex-Plus': /Hex-Plus/i, HF: /фиксирующ|\bHF\b/i, VDE: /\bVDE\b|изолирован/i, 'ударний': /ударн/i } };
const prose = h => String(h || '').replace(/<table[\s\S]*?<\/table>/g, '').replace(/<div class="wsb"[\s\S]*$/, '').replace(/<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)[\s\S]*$/, '');
const full = (a, line) => { const ds = fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8').split('\n').filter(s => s.startsWith('p1 ')).map(s => s.slice(3)); const i = ds.indexOf(line);
  let s = line; for (let k = i + 1; k < ds.length && /^[a-zа-яё]/.test(ds[k]); k++) s += ' ' + ds[k]; return s; };
const insert = (h, sentences) => { const cut = h.search(/<div class="wsb"|<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)/); const head = cut < 0 ? h : h.slice(0, cut), tail = cut < 0 ? '' : h.slice(cut);
  const ul = head.lastIndexOf('</ul>'); if (ul >= 0) return head.slice(0, ul) + sentences.map(s => `<li>${s}</li>`).join('') + head.slice(ul) + tail;
  return head + sentences.map(s => `<p>${s}</p>`).join('') + tail; };
const plan = { name: 'gvyk_phrase', products: {} }; const report = [], miss = new Set();
for (const [a, list] of Object.entries(J.products)) { if (SKIP.has(a)) continue; const p = L[a]; if (!p || +p.display_in_showcase !== 1) continue; const nw = { ua: p.description.ua, ru: p.description.ru }; const why = [];
  for (const l of ['ua', 'ru']) { const add = []; for (const x of list) { if (SKIPLINE.test(x.line)) continue; const line = full(a, x.line); const tr = T[line]; if (!tr) { miss.add(line); continue; }
      if (HAS[l][x.f].test(prose(p.description[l]))) continue; const s = tr[l === "ua" ? 0 : 1] + "."; /* a full stop, as the neighbouring sentences */ if (!add.includes(s)) { add.push(s); why.push(`${l}: ${x.f}`); } }
    if (add.length) nw[l] = insert(nw[l], add); }
  if (nw.ua === p.description.ua && nw.ru === p.description.ru) continue;
  plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why }; report.push({ art: a, name: p.mod_title.ua, add: why.join('; '), ua: list.map(x => T[full(a, x.line)] ? T[full(a, x.line)][0] : '').filter(Boolean).join(' | ') }); }
if (miss.size) { console.log('STOP: no translation for', [...miss]); process.exit(2); }
fs.writeFileSync(OUT, JSON.stringify(plan)); fs.writeFileSync(OUT.replace(/\.json$/, '_report.json'), JSON.stringify(report, null, 1));
const c = {}; for (const r of report) for (const w of r.add.split('; ')) c[w] = (c[w] || 0) + 1; console.log('products', report.length, c);
