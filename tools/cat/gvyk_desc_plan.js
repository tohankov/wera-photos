// Global check «Викрутки», step в) 3 — descriptions (owner 24.10.2026), VISIBLE products only. Read-only: builds the plan for cat/desc_write.js.
//   node cat/gvyk_desc_plan.js <group live.json> <all live.json (links, visibility)> <out plan.json>
// Per product, in this order (each change listed in «why»):
//  a) table rows of articles that are NOT on wera.de (page 404 AND not in the series «Daten und Fakten» table) — removed, incl. 05022935001 in the 352 tables
//     (owner: «на wera.de нет — строку убрать»); the rows are re-rendered (zebra of the sticky cell), a footnote no row uses any more goes too
//  b) «Інші варіанти серії» for the 37 products without one — from the wera.de series table (columns as in our other tables, handle colour left out,
//     a column without a WERA pictogram — text only); links only to our visible products
//  c) alt="" on the header icons of the variant tables (the column text stays)
//  d) prose: latin «x» between numbers / sizes -> «×» (text nodes outside tables); 05073680001 diameters by the datasheet (1441 4.5–6, 1442 6.0–8.5 мм)
// The set block (owner's «ок» on the preview pending) and the old screenshots are NOT in this plan.
const fs = require('fs'); const VT = require('../lib/vt.js'); const { table } = require('../vt/table2.js'); const ds = require('../names/ds.js');
const [, , LIVE, ALL, OUT] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1);
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const W = require('../../inventory/wera/pages.json'); const J = require('../../inventory/global_1098.json');
const vis = a => A[a] && +A[a].display_in_showcase === 1; const linkOf = (a, l) => vis(a) ? (l === 'ua' ? A[a].link : A[a].link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/')).replace(/^https?:\/\/[^/]+/, '') : null;
// links in our tables are site-relative? keep the form the existing tables use
const inWeraTable = a => Object.values(W.pages).some(p => p.table && p.table.arts.includes(a));
// ---- a) rows to remove
const REMOVE = new Set(); for (const p of J.products) for (const f of p.list) if (f.item === 4 && /на wera\.de нет|скрытый/.test(f.what)) for (const a of f.detail.match(/0\d{10}/g) || []) REMOVE.add(a);
const notWera = [...REMOVE].filter(a => W.status[a] && W.status[a] !== 404 || inWeraTable(a)); if (notWera.length) { console.log('STOP: on wera.de after all:', notWera); process.exit(2); }
// ---- b) new tables: wera.de row label -> our column
const COL = { 'Klingendicke|mm': { icon: 'icon-blade-thickness', w: 26, ua: 'Товщина робочого кінця', ru: 'Толщина рабочего конца', unit: 'mm' }, 'Klingenbreite|mm': { icon: 'icon-blade-width', w: 26, ua: 'Ширина робочого кінця', ru: 'Ширина рабочего конца', unit: 'mm' },
  'Klingenlänge|mm': { icon: 'icon-length', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: 'mm' }, 'Gesamtlänge Klinge|mm': { icon: null, ua: 'Загальна довжина стрижня', ru: 'Общая длина стержня', unit: 'mm' },
  'Gesamtlänge|mm': { icon: null, ua: 'Загальна довжина', ru: 'Общая длина', unit: 'mm' }, 'Grifflänge|mm': { icon: 'icon-handle', w: 13, ua: 'Довжина ручки', ru: 'Длина ручки', unit: 'mm' },
  'Klingendurchmesser|mm': { icon: 'icon-diameter', w: 26, ua: 'Діаметр робочого кінця', ru: 'Диаметр рабочего конца', unit: 'mm' }, 'Klingenbreite (in Zoll)|inch': { icon: null, ua: 'Ширина робочого кінця', ru: 'Ширина рабочего конца', unit: 'inch' },
  'Klingenlänge (in Zoll)|inch': { icon: 'icon-length-inch', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: 'inch' }, 'Gesamtlänge Klinge in Zoll|inch': { icon: null, ua: 'Загальна довжина стрижня', ru: 'Общая длина стержня', unit: 'inch' } };
const UNIT = { mm: { ua: 'мм', ru: 'мм' }, inch: { ua: 'дюйми', ru: 'дюймы' } };
const PROF_ICON = v => /^PH/.test(v) ? 'icon-ph' : /^PZ/.test(v) ? 'icon-pz' : /^TX/.test(v) ? 'icon-torx' : /IP$/.test(v) ? 'icon-torx-plus' : /^#/.test(v) ? 'icon-square' : null;
const fmt = v => String(v).replace(/"$/, '″').replace(/^#\s?/, '#');
// footnotes of the series table (wera.de «Hinweis»): UA / RU text by hand from the datasheet RU line, keyed by the German note text
const NOTE = { 'Kraftform-Griff, 1-komponentig': { ua: 'Ручка Kraftform, однокомпонентна', ru: 'Рукоятка Kraftform, однокомпонентная' } };
function newTable(a, l) { const wp = W.pages[W.art[a]]; const t = wp.table; const D = ds(a);
  const rows = t.rows.filter(r => r.label !== 'Grifffarbe' && !/^Hinweis/.test(r.label)); const cols = [], keys = [];
  for (const r of rows) { const k = r.label + '|' + r.unit; if (/^Abtriebsgröße/.test(r.label)) { const ic = PROF_ICON(r.vals[0]); cols.push({ icon: ic, w: 26, ua: 'Профіль', ru: 'Профиль' }); keys.push(r); continue; }
    const c = COL[k]; if (!c) throw new Error(`${a}: no column for «${k}»`); cols.push({ ...c, unit: UNIT[c.unit] }); keys.push(r); }
  const hint = t.rows.find(r => /^Hinweis/.test(r.label)); const used = new Set();
  const trows = t.arts.map((x, i) => { const nn = hint ? (hint.vals[i].match(/\d+/g) || []) : []; nn.forEach(n => used.add(n)); return [x, ...keys.map(r => fmt(r.vals[i] || '–')), nn.join(',')]; });
  const notes = { ua: [], ru: [] }; for (const n of [...used].sort()) { const de = wp.notesText[n]; const tr = NOTE[de]; if (!tr) throw new Error(`${a}: footnote ${n} «${de}» has no UA/RU text`); notes.ua.push(`<sup>${n})</sup> ${tr.ua}`); notes.ru.push(`<sup>${n})</sup> ${tr.ru}`); }
  const links = Object.fromEntries(t.arts.map(x => [x, linkOf(x, l)]).filter(([, u]) => u));
  return table({ name: 'WERA ' + (D.series || ''), cols: cols.map(c => ({ icon: c.icon, w: c.w, ua: c.ua, ru: c.ru, unit: c.unit })), rows: trows, notes }, l, a, links); }
// ---- c) + d)
const altEmpty = h => h.replace(/(<th[^>]*>\s*<img src="\/content\/uploads\/images\/icons\/[^"]+"[^>]*?)alt="[^"]*"/g, '$1alt=""');
const proseX = h => h.split(/(<table[\s\S]*?<\/table>)/).map((part, i) => i % 2 ? part : part.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(/(\d|\b[A-Z]{1,2} ?\d+)\s?x\s?(?=\d)/g, (x, a) => a + '×') + '<')).join('');
const FIX = { '05073680001': [['від 6,5 мм до 8,0 мм', 'від 6,0 мм до 8,5 мм'], ['от 6,5 мм до 8,0 мм', 'от 6,0 мм до 8,5 мм']] };
const NOTABLE = new Set(); for (const p of J.products) for (const f of p.list) if (f.item === 4 && f.what === 'нет таблицы вариантов') NOTABLE.add(p.art);
const plan = { name: 'gvyk_desc', at: new Date().toISOString(), products: {} }; const stat = {};
for (const p of L) { const a = p.article; const nw = { ua: p.description.ua, ru: p.description.ru }; const why = new Set();
  for (const l of ['ua', 'ru']) { let h = nw[l];
    // a)
    const sp = VT.splitTable(h); if (sp) { const rows = VT.rowsOf(sp[1]); if (rows.some(r => REMOVE.has(r.art))) { const keep = rows.filter(r => !REMOVE.has(r.art));
        let blk = sp[1]; for (const r of rows.filter(r => REMOVE.has(r.art))) { const re = new RegExp('<tr[^>]*><td[^>]*>(?:(?!</tr>)[\\s\\S])*?\\b' + r.art + '\\b[\\s\\S]*?</tr>'); blk = blk.replace(re, ''); }
        blk = VT.rerender(blk, l, a, Object.fromEntries(Object.entries(VT.linksIn(blk)).filter(([x]) => !REMOVE.has(x))));
        const usedN = new Set(keep.flatMap(r => [...r.sup.matchAll(/(\d+)\)/g)].map(m => m[1])));
        blk = blk.replace(/<sup>(\d+)\)<\/sup>[^<]*(?:<br>)?/g, (m, n) => usedN.has(n) ? m : '');
        h = sp[0] + blk + sp[2]; why.add('строки снятых WERA вариантов: ' + rows.filter(r => REMOVE.has(r.art)).map(r => r.art).join(', ')); } }
    // b)
    if (NOTABLE.has(a) && !VT.splitTable(h)) { const t = newTable(a, l); const i = h.search(/<h3>(?:Дізнайтеся більше|Узнайте больше)/); h = i < 0 ? h + t : h.slice(0, i) + t + h.slice(i); why.add('новая таблица «Інші варіанти серії» (wera.de)'); }
    // c)
    const h2 = altEmpty(h); if (h2 !== h) { h = h2; why.add('alt="" у значков шапки таблицы'); }
    // d)
    const h3 = proseX(h); if (h3 !== h) { h = h3; why.add('«x» → «×» в тексте'); }
    for (const [o, n] of FIX[a] || []) if (h.includes(o)) { h = h.replace(o, n); why.add('диаметры по паспорту 1441 / 1442'); }
    nw[l] = h; }
  if (nw.ua === p.description.ua && nw.ru === p.description.ru) continue;
  plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [...why] }; for (const w of why) { const k = w.replace(/:.*/, ''); stat[k] = (stat[k] || 0) + 1; } }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, stat); console.log('rows removed for', [...REMOVE].join(' '));
