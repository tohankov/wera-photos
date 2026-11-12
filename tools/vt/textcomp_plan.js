// Owner 12.11.2026: a text composition list next to a written «Склад набору» block is removed (the block replaces it), UA and RU, the rest untouched —
// any heading «Склад набору», «Состав набора», «Комплектація», «Комплектация» (also «… (38 предметів)», «… (основне)», with a colon) as <p>/<h2-4>
// [<strong>] followed by <ul>. Lines that are not composition — «Артикул», «Кількість предметів», «Розміри», «Вага», «Країна», «EAN» — stay, under
// «Характеристики» (as cat/komp_remove.js for the inlays 11.11.2026). Only text BEFORE the block (div.wsb) is touched.
//   node vt/textcomp_plan.js <all export.json> <out plan.json> [name]   -> plan for cat/desc_write.js + the list printed
const fs = require('fs'); const [, , ALL, OUT, NAME] = process.argv; const A = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const HEAD = /^(Склад набору|Состав набора|Комплектаці[яи]|Комплектация)(\s*\([^)]*\))?:?$/i;
const KEEP = /^(Артикул|Кількість предметів|Количество предметов|Розміри|Размеры|Вага|Вес|Країна|Страна|EAN)/;
const plan = { name: NAME || 'textcomp', products: {} }; const rows = [];
for (const p of A) { if (+p.display_in_showcase !== 1) continue; const nw = {}; const found = [];
  for (const l of ['ua', 'ru']) { const h = (p.description || {})[l] || ''; const i = h.indexOf('<div class="wsb"'); if (i < 0) { nw[l] = h; continue; }
    const pre = h.slice(0, i).replace(/<(p|h[2-4])>\s*(?:<strong>|<b>)?([^<]{0,60}?)(?:<\/strong>|<\/b>)?\s*<\/\1>\s*<ul>([\s\S]*?)<\/ul>/g, (m, tag, t, ul) => {
      if (!HEAD.test(t.trim())) return m; const lis = [...ul.matchAll(/<li>[\s\S]*?<\/li>/g)].map(x => x[0]);
      const keep = lis.filter(x => KEEP.test(x.replace(/^<li>/, '').replace(/<[^>]+>/g, '').trim())); found.push(`${l}: «${t.trim()}» ${lis.length - keep.length} строк${keep.length ? ', оставлено ' + keep.length : ''}`);
      return keep.length ? '<p><strong>Характеристики</strong></p><ul>' + keep.join('') + '</ul>' : ''; });
    nw[l] = pre + h.slice(i); }
  if (!found.length) continue; plan.products[p.article] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: ['текстовый список состава рядом с блоком — убран (владелец 12.11.2026): ' + found.join('; ')] };
  rows.push(`${p.article} | ${p.mod_title.ua.replace(/ WERA \d+$/, '').slice(0, 80)} | ${found.join('; ')}`); }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', rows.length); for (const r of rows) console.log(r);
