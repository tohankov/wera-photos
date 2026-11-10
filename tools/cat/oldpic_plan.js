// Owner 10.11.2026: a set description that already has the «Склад набору» block but still shows the old composition picture above it
// (the linked WERA screenshot <p><a href><img></a></p> — vt/setblock_plan.js missed that form). Only the picture paragraph goes (vt/oldpic.js), the text stays.
//   node cat/oldpic_plan.js <all.json> <out plan.json>   -> plan for cat/desc_write.js + the list (article — picture)
const fs = require('fs'); const OP = require('../vt/oldpic.js'); const [, , ALL, OUT] = process.argv;
const plan = { name: 'oldpic1110', products: {} }; const list = [];
for (const p of JSON.parse(fs.readFileSync(ALL, 'utf8'))) { const d = p.description || {}; if (!/class="wsb"/.test((d.ua || '') + (d.ru || ''))) continue;
  const nw = { ua: OP.strip(d.ua), ru: OP.strip(d.ru) }; if (nw.ua === d.ua && nw.ru === d.ru) continue;
  const pics = [...new Set([...OP.find(d.ua), ...OP.find(d.ru)])]; list.push(`${p.article} — ${pics.join(', ')}`);
  plan.products[p.article] = { old: { ua: d.ua, ru: d.ru }, new: nw, why: ['убрана старая картинка состава над блоком: ' + pics.map(s => s.split('/').pop()).join(', ')] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', list.length); for (const l of list) console.log('  ', l);
