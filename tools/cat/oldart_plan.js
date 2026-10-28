// Owner 28.10.2026 (rule Г): addresses are NOT changed; a visible product whose address carries the old WERA article (docs/global_urls.csv, «второй
// артикул …») gets the line «Попередній артикул WERA: <old>» / «Предыдущий артикул WERA: <old>» at the end of the text — before the set block, the
// variants table and the PDF link. A description that already names the old article (inserts: «Артикул: … (замінює …)») is left as is and listed.
// Read-only: plan for cat/desc_write.js.   node cat/oldart_plan.js <all.json> <out plan.json> [name]
const fs = require('fs'), path = require('path'); const [, , ALL, OUT, NAME] = process.argv;
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p]));
const rows = fs.readFileSync(path.join(__dirname, '../../docs/global_urls.csv'), 'utf8').replace(/^﻿/, '').split('\n').slice(1).filter(Boolean)
  .map(l => (l.match(/"((?:[^"]|"")*)"/g) || []).map(x => x.slice(1, -1))).filter(r => r[1] === '1' && /второй артикул/.test(r[3]));
const LINE = { ua: 'Попередній артикул WERA', ru: 'Предыдущий артикул WERA' };
const END = /<div class="wsb">|<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)/;
const plan = { name: NAME || 'oldart', products: {} }; const has = [], bad = [];
for (const r of rows) { const a = r[0], old = r[3].match(/\d{11}/)[0], p = A[a]; if (!p || +p.display_in_showcase !== 1) continue;
  if (p.description.ua.includes(old) && p.description.ru.includes(old)) { has.push(a); continue; }
  const nw = {}; for (const l of ['ua', 'ru']) { const h = p.description[l]; const i = h.search(END); if (i < 0) { bad.push(a + ' ' + l); break; }
    nw[l] = h.slice(0, i) + `<p>${LINE[l]}: ${old}</p>` + h.slice(i); }
  if (nw.ua && nw.ru) plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [`${LINE.ua}: ${old}`] }; }
fs.writeFileSync(OUT, JSON.stringify(plan));
console.log('plan', Object.keys(plan.products).length, '| already name the old article', has.length, '| no place found', bad.length, bad);
