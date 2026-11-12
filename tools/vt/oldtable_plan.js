// Owner 12.11.2026: old WERA variant-table screenshots in SINGLE products (05057667001: the picture-table above our «Інші варіанти серії») — where our
// HTML variant table is in the description, a <p> holding only the screenshot (bare <img> or <a href><img></a>) is removed, UA and RU. A screenshot =
// our upload /content/uploads/images/<n>/<11-digit article>[-N].png (vt/oldpic.js SHOT); photos in use and any other picture stay (stricter than
// vt/oldpic.js for sets: a bare picture counts only when it is a SHOT file too). Sets are not touched here (their screenshots went with the blocks).
//   node vt/oldtable_plan.js <all export.json> <out plan.json> [name]
const fs = require('fs'); const { SHOT } = require('./oldpic.js'); const [, , ALL, OUT, NAME] = process.argv; const A = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const P = /<p>((?:\s*(?:<a\b[^>]*>\s*)?<img\b[^>]*>(?:\s*<\/a>)?\s*)+)<\/p>/g;
const isShot = inner => { const s = [...inner.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m => m[1].replace(/^https?:\/\/[^/]+/, '')); return s.length && s.every(x => SHOT.test(x)); };
const plan = { name: NAME || 'oldtable', products: {} }; const rows = [];
for (const p of A) { if (+p.display_in_showcase !== 1) continue; const d = p.description || {}; if (!/<table\b/.test(d.ua || '') || /class="wsb"/.test(d.ua || '')) continue;
  const nw = {}, srcs = []; for (const l of ['ua', 'ru']) nw[l] = (d[l] || '').replace(P, (m, inner) => { if (!isShot(inner)) return m; srcs.push(l + ':' + (inner.match(/src="([^"]+)"/) || [])[1]); return ''; });
  if (!srcs.length) continue; plan.products[p.article] = { old: { ua: d.ua, ru: d.ru }, new: nw, why: ['старая картинка-таблица WERA над нашей таблицей вариантов (владелец 12.11.2026): ' + srcs.join(', ')] };
  rows.push(`${p.article} | ${p.mod_title.ua.replace(/ WERA \d+$/, '').slice(0, 70)} | ${[...new Set(srcs.map(s => s.replace(/^\w+:/, '')))].join(', ')}`); }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', rows.length); for (const r of rows) console.log(r);
