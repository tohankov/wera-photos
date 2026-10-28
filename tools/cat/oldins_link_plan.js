// Owner 28.10.2026: old Kompakt VDE inserts (0500343x …) keep «Попередня версія … Нова версія Take it easy — арт. <new>.» and the article becomes a link to
// our product (UA page -> UA link, RU -> /ru/, relative path as in our variant tables). Only a visible product of the group, only when the new article is
// our visible product and not already linked. Read-only: plan for cat/desc_write.js.   node cat/oldins_link_plan.js <group live.json> <all.json> <out> [name]
const fs = require('fs'); const [, , LIVE, ALL, OUT, NAME] = process.argv;
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p]));
const G = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1);
const RX = { ua: /(Нова версія Take it easy — арт\. )(\d{11})(\.)/, ru: /(Новая версия Take it easy — арт\. )(\d{11})(\.)/ };
const rel = (u, l) => { const s = u.replace(/^https:\/\/[^/]+/, ''); return l === 'ru' ? '/ru' + s : s; };
const plan = { name: NAME || 'oldins_link', products: {} }; const skip = [];
for (const p of G) { const nw = {}; let n = 0;
  for (const l of ['ua', 'ru']) { const h = p.description[l]; const m = h.match(RX[l]); if (!m) { nw[l] = h; continue; } const t = A[m[2]];
    if (!t || +t.display_in_showcase !== 1) { skip.push(`${p.article} ${l}: ${m[2]} не наш видимый`); nw[l] = h; continue; }
    nw[l] = h.replace(RX[l], `$1<a href="${rel(t.link, l)}">$2</a>$3`); n++; }
  if (n) plan.products[p.article] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: ['ссылка на новую версию Take it easy'] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('plan', Object.keys(plan.products).length, '| skipped', skip.length, skip.slice(0, 5));
