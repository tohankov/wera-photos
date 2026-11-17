// Final check of description pictures, the whole catalog (owner 17.11.2026): every <img> in the UA / RU description of every VISIBLE product,
// except our icons (/content/uploads/images/icons/, icon-pdf too), the pictures of the «Склад набору» block (inside <div class="wsb">) and photos
// «в работе» (a linked picture whose file is not the WERA screenshot named by article — vt/oldpic.js SHOT; 05134015001 vorteil_*.jpeg).
// Where the description has the block or our variant table (min-width:560px), the old composition / table screenshots go:
// <p> of only pictures (vt/oldpic.js) and the old HTML composition table <table class="table …"> with pictures (05136609001, calendar 2024).
// Everything else — to the list (product, link, picture), owner decides.
//   node vt/descimg_plan.js <all.json> <out plan.json> [list.json]
const fs = require('fs'); const OP = require('./oldpic.js'); const [, , ALL, OUT, LIST] = process.argv;
const blockRanges = h => { const out = [], re = /<div\b[^>]*class="[^"]*\bwsb\b[^"]*"[^>]*>/g; let m;
  while ((m = re.exec(h))) { const t = /<\/?div\b[^>]*>/g; t.lastIndex = m.index; let x, d = 0;
    while ((x = t.exec(h))) { d += x[0][1] === '/' ? -1 : 1; if (!d) { out.push([m.index, t.lastIndex]); re.lastIndex = t.lastIndex; break; } } } return out; };
const loc = s => s.replace(/^https?:\/\/(www\.)?tl-shop\.com\.ua/, '');
// pictures that count: not an icon, not in the block, not a photo «в работе»
const pics = h => { const R = blockRanges(h); return [...h.matchAll(/<img\b[^>]*>/g)].map(m => ({ at: m.index, src: (m[0].match(/src="([^"]*)"/) || [])[1] || '',
  linked: /<a\b[^>]*>\s*$/.test(h.slice(Math.max(0, m.index - 300), m.index)) }))
  .filter(x => !/\/images\/icons\//.test(x.src) && !R.some(([a, b]) => x.at >= a && x.at < b) && !(x.linked && !OP.SHOT.test(loc(x.src)))); };
const OLDTAB = /<table\b(?![^>]*min-width:560px)[^>]*>[\s\S]*?<\/table>/g;
const strip = h => OP.strip(h).replace(OLDTAB, t => /<img\b/.test(t) && [...t.matchAll(/src="([^"]*)"/g)].some(m => !/\/images\/icons\//.test(m[1])) ? '' : t);
const plan = { name: process.env.NAME || 'descimg1117', products: {} }, list = [];
for (const p of JSON.parse(fs.readFileSync(ALL, 'utf8'))) { if (+p.display_in_showcase !== 1) continue; const d = p.description || {};
  const has = { ua: pics(d.ua || ''), ru: pics(d.ru || '') }; if (!has.ua.length && !has.ru.length) continue;
  const block = /class="wsb"/.test(d.ua + d.ru), table = /min-width:560px/.test(d.ua + d.ru);
  if (block || table) { const nw = { ua: strip(d.ua || ''), ru: strip(d.ru || '') }; const left = { ua: pics(nw.ua), ru: pics(nw.ru) };
    if (nw.ua !== d.ua || nw.ru !== d.ru) plan.products[p.article] = { old: { ua: d.ua, ru: d.ru }, new: nw,
      why: ['убраны старые картинки состава / таблиц: ' + [...new Set([...has.ua, ...has.ru].map(x => x.src.split('/').pop()))].join(', ')] };
    if (left.ua.length || left.ru.length) list.push({ article: p.article, title: p.title.ua, link: p.link, block, table, srcs: [...new Set([...left.ua, ...left.ru].map(x => x.src))], note: 'осталось после плана' });
  } else list.push({ article: p.article, title: p.title.ua, link: p.link, block, table, srcs: [...new Set([...has.ua, ...has.ru].map(x => x.src))] }); }
fs.writeFileSync(OUT, JSON.stringify(plan)); if (LIST) fs.writeFileSync(LIST, JSON.stringify(list, null, 1));
console.log('plan', Object.keys(plan.products).length, Object.keys(plan.products).join(' ')); console.log('list', list.length);
for (const x of list) console.log('  ', x.article, x.block ? 'блок' : '', x.table ? 'таблица' : '', x.srcs.map(s => s.split('/').pop()).join(', '), x.note || '');
