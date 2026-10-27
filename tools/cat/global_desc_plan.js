// Global check, step в) — descriptions of ONE group (generalised from cat/gvyk_desc_plan.js «Викрутки», owner 24–26.10.2026), VISIBLE products only.
// Read-only: builds the plan for cat/desc_write.js.
//   node cat/global_desc_plan.js <group live.json> <all live.json (links, visibility)> <global_<gid>.json> <out plan.json> [extra.js]
// Per product, in this order (each change listed in «why»):
//  a) table rows of articles that are NOT on wera.de (page 404 AND not in a series «Daten und Fakten» table) and NOT our visible products — removed
//     (owner 26.10.2026: «снятые WERA варианты — убрать, кроме наших видимых товаров»); rows re-rendered (zebra of the sticky cell), an unused footnote goes too
//  b) «Інші варіанти серії» for products without one — from the wera.de series table (columns as in our other tables, handle colour left out,
//     a column without a WERA pictogram — text only); links only to our visible products
//  c) alt="" on the header icons of the variant tables (the column text stays)
//  d) prose: latin «x» between numbers / sizes -> «×» (text nodes outside tables)
//  e) [extra.js] group text fixes: module.exports = (product, lang, html) => ({ html, why: [..] }) — e.g. cat/gdesc_vde.js (154 -> 157 мм by the datasheet)
// The set block (vt/setblock_plan.js) and the WERA phrases (cat/gvyk_phrase_plan.js) are separate plans.
const fs = require('fs'), path = require('path'); const VT = require('../lib/vt.js'); const { table } = require('../vt/table2.js'); const ds = require('../names/ds.js');
const [, , LIVE, ALL, GJ, OUT, EXTRA] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const extra = EXTRA ? require(path.resolve(EXTRA)) : null;
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const W = require('../../inventory/wera/pages.json'); const J = JSON.parse(fs.readFileSync(GJ, 'utf8'));
const vis = a => A[a] && +A[a].display_in_showcase === 1; const linkOf = (a, l) => vis(a) ? (l === 'ua' ? A[a].link : A[a].link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/')).replace(/^https?:\/\/[^/]+/, '') : null;
// links in our tables are site-relative? keep the form the existing tables use
const inWeraTable = a => Object.values(W.pages).some(p => p.table && p.table.arts.includes(a));
// ---- a) rows to remove
const REMOVE = new Set(); for (const p of J.products) for (const f of p.list) if (f.item === 4 && /на wera\.de нет|скрытый/.test(f.what)) for (const a of f.detail.match(/0\d{10}/g) || []) if (!vis(a)) REMOVE.add(a);
const notWera = [...REMOVE].filter(a => W.status[a] && W.status[a] !== 404 || inWeraTable(a)); if (notWera.length) { console.log('STOP: on wera.de after all:', notWera); process.exit(2); }
// ---- b) new tables: wera.de row label -> our column
const COL = { 'Klingendicke|mm': { icon: 'icon-blade-thickness', w: 26, ua: 'Товщина робочого кінця', ru: 'Толщина рабочего конца', unit: 'mm' }, 'Klingenbreite|mm': { icon: 'icon-blade-width', w: 26, ua: 'Ширина робочого кінця', ru: 'Ширина рабочего конца', unit: 'mm' },
  'Klingenlänge|mm': { icon: 'icon-length', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: 'mm' }, 'Gesamtlänge Klinge|mm': { icon: null, ua: 'Загальна довжина стрижня', ru: 'Общая длина стержня', unit: 'mm' },
  'Gesamtlänge|mm': { icon: null, ua: 'Загальна довжина', ru: 'Общая длина', unit: 'mm' },
  'Außenmaß (d1)|mm': { icon: 'icon-socket-d1', w: 26, ua: 'Зовнішній розмір (d1)', ru: 'Наружный размер (d1)', unit: 'mm' }, 'Durchmesser hinten (d2)|mm': { icon: 'icon-socket-d2', w: 26, ua: 'Задній діаметр (d2)', ru: 'Задний диаметр (d2)', unit: 'mm' },
  'Höhe Abtrieb|mm': { icon: 'icon-socket-depth', w: 26, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: 'mm' },
  // Joker combination wrenches — as our tables of the series (05020198001)
  'Schlüsselweite|mm': { icon: 'icon-wrench-size', w: 23, ua: 'Розмір ключа', ru: 'Размер ключа', unit: 'mm' }, 'Schlüsselweite|inch': { icon: 'icon-wrench-size', w: 23, ua: 'Розмір ключа', ru: 'Размер ключа', unit: 'inch' },
  'Schlüsselweite inch|inch': { icon: 'icon-wrench-size', w: 23, ua: 'Розмір ключа', ru: 'Размер ключа', unit: 'inch' },
  'Außenmaß (b) Maul|mm': { icon: 'icon-wrench-b', w: 20, ua: 'Зовнішній розмір ріжкової частини (b)', ru: 'Наружный размер рожковой части (b)', unit: 'mm' },
  'Kopfdicke|mm': { icon: 'icon-wrench-thickness', w: 12, ua: 'Товщина головки', ru: 'Толщина головки', unit: 'mm' },
  'Außenmaß (b1) - Ratschenringschlüssel|mm': { icon: 'icon-ring-b1', w: 19, ua: 'Зовнішній розмір накидної частини з тріскачкою (b1)', ru: 'Наружный размер накидной части с трещоткой (b1)', unit: 'mm' },
  'Max. Kopfhöhe - Ratschenringschlüssel|mm': { icon: 'icon-ring-height', w: 12, ua: 'Макс. висота головки накидної частини з тріскачкою', ru: 'Макс. высота головки накидной части с трещоткой', unit: 'mm' }, 'Grifflänge|mm': { icon: 'icon-handle', w: 13, ua: 'Довжина ручки', ru: 'Длина ручки', unit: 'mm' },
  'Klingendurchmesser|mm': { icon: 'icon-diameter', w: 26, ua: 'Діаметр робочого кінця', ru: 'Диаметр рабочего конца', unit: 'mm' }, 'Klingenbreite (in Zoll)|inch': { icon: null, ua: 'Ширина робочого кінця', ru: 'Ширина рабочего конца', unit: 'inch' },
  'Klingenlänge (in Zoll)|inch': { icon: 'icon-length-inch', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: 'inch' }, 'Gesamtlänge Klinge in Zoll|inch': { icon: null, ua: 'Загальна довжина стрижня', ru: 'Общая длина стержня', unit: 'inch' } };
const UNIT = { mm: { ua: 'мм', ru: 'мм' }, inch: { ua: 'дюйми', ru: 'дюймы' } };
const PROF_ICON = v => /^PH/.test(v) ? 'icon-ph' : /^PZ/.test(v) ? 'icon-pz' : /^TX/.test(v) ? 'icon-torx' : /IP$/.test(v) ? 'icon-torx-plus' : /^#/.test(v) ? 'icon-square' : null;
const fmt = v => String(v).replace(/"$/, '″').replace(/^#\s?/, '#');
// footnotes of the series table (wera.de «Hinweis»): UA / RU text by hand from the datasheet RU line, keyed by the German note text
const NOTE = { 'Kraftform-Griff, 1-komponentig': { ua: 'Ручка Kraftform, однокомпонентна', ru: 'Рукоятка Kraftform, однокомпонентная' } };
// icon widths as in our existing tables (height 26)
const ICON_W = { 'icon-hex': 26, 'icon-hex-socket': 26, 'icon-socket-vde-length': 22, 'icon-socket-d1': 21, 'icon-socket-d2': 26, 'icon-socket-length': 26, 'icon-socket-depth': 19, 'icon-wrench-size': 23, 'icon-combi-length': 9, 'icon-wrench-b': 20, 'icon-wrench-thickness': 12, 'icon-ring-b1': 19, 'icon-ring-height': 12, 'icon-length': 10, 'icon-length-inch': 10, 'icon-handle': 13 };
function newTable(a, l) { const wp = W.pages[W.art[a]]; const t = wp.table; const D = ds(a);
  const rows = t.rows.filter(r => r.label !== 'Grifffarbe' && !/^Hinweis/.test(r.label)); const cols = [], keys = [];
  // sockets and screwdriver heads (Zyklop, VDE) — the columns of our existing tables of the same series (05004950001 sockets, 05004900001 heads)
  // Zyklop (27.10.2026): «Farbe» is left out as the handle colour; a column without a value in any row («-» — the metric heads' inch size) too
  const t0 = A[a].mod_title.ua; const kind = /викруткова головка/i.test(t0) ? 'head' : /торцев\S* (?:[^ ]+ ){0,3}?головк/i.test(t0) ? 'socket' : /Joker/.test(t0) && /ключ/i.test(t0) ? 'wrench' : '';
  const KCOL = { socket: { 'Abtriebsgröße (metrisch)|mm': { icon: 'icon-hex-socket', w: 26, ua: 'Розмір', ru: 'Размер', unit: 'mm' }, 'Abtriebsgröße (in Zoll)|inch': { icon: 'icon-hex-socket', w: 26, ua: 'Розмір', ru: 'Размер', unit: 'inch' }, 'Gesamtlänge|mm': { icon: 'icon-socket-vde-length', w: 26, ua: 'Загальна довжина', ru: 'Общая длина', unit: 'mm' } },
    wrench: { 'Gesamtlänge|mm': { icon: 'icon-combi-length', w: 9, ua: 'Загальна довжина', ru: 'Общая длина', unit: 'mm' } },
    head: { 'Abtriebsgröße (metrisch)|mm': { icon: 'icon-hex', w: 26, ua: 'Розмір', ru: 'Размер', unit: 'mm' }, 'Abtriebsgröße (in Zoll)|inch': { icon: 'icon-hex', w: 26, ua: 'Розмір', ru: 'Размер', unit: 'inch' }, 'Gesamtlänge|mm': { icon: 'icon-socket-length', w: 26, ua: 'Загальна довжина', ru: 'Общая длина', unit: 'mm' } } };
  for (const r of rows) { const k = r.label + '|' + r.unit; if (r.label === 'Farbe' || r.vals.every(v => !v || v === '-' || v === '–')) continue; const kc = (KCOL[kind] || {})[k]; if (kc) { cols.push({ ...kc, unit: UNIT[kc.unit] }); keys.push(r); continue; }
    if (k === 'Abtriebsgröße (metrisch)|mm') { cols.push({ icon: 'icon-hex', w: 26, ua: 'Розмір', ru: 'Размер', unit: UNIT.mm }); keys.push(r); continue; }   // Kompakt VDE 64 i hex blades — as our [icon-hex] «Розмір мм»
    if (/^Abtriebsgröße/.test(r.label)) { const ic = PROF_ICON(r.vals[0]); cols.push({ icon: ic, w: 26, ua: 'Профіль', ru: 'Профиль' }); keys.push(r); continue; }
    const c = COL[k]; if (!c) throw new Error(`${a}: no column for «${k}»`); cols.push({ ...c, unit: UNIT[c.unit] }); keys.push(r); }
  const hint = t.rows.find(r => /^Hinweis/.test(r.label)); const used = new Set();
  const trows = t.arts.map((x, i) => { const nn = hint ? (hint.vals[i].match(/\d+/g) || []) : []; nn.forEach(n => used.add(n)); return [x, ...keys.map(r => fmt(r.vals[i] || '–')), nn.join(',')]; });
  const notes = { ua: [], ru: [] }; for (const n of [...used].sort()) { const de = wp.notesText[n]; const tr = NOTE[de]; if (!tr) throw new Error(`${a}: footnote ${n} «${de}» has no UA/RU text`); notes.ua.push(`<sup>${n})</sup> ${tr.ua}`); notes.ru.push(`<sup>${n})</sup> ${tr.ru}`); }
  const links = Object.fromEntries(t.arts.map(x => [x, linkOf(x, l)]).filter(([, u]) => u));
  return table({ name: 'WERA ' + (D.series || ''), cols: cols.map(c => ({ icon: c.icon, w: ICON_W[c.icon] || c.w, ua: c.ua, ru: c.ru, unit: c.unit })), rows: trows, notes }, l, a, links); }
// ---- c) + d)
const altEmpty = h => h.replace(/(<th[^>]*>\s*<img src="\/content\/uploads\/images\/icons\/[^"]+"[^>]*?)alt="[^"]*"/g, '$1alt=""');
const proseX = h => h.split(/(<table[\s\S]*?<\/table>)/).map((part, i) => i % 2 ? part : part.replace(/>([^<]+)</g, (m, t) => '>' + t.replace(/(\d|\d″|\b[A-Z]{1,2} ?\d+)\s?x\s?(?=\d)/g, (x, a) => a + '×') + '<')).join('');
const FIX = {};
const NOTABLE = new Set(); for (const p of J.products) for (const f of p.list) if (f.item === 4 && f.what === 'нет таблицы вариантов') NOTABLE.add(p.art);
const plan = { name: path.basename(OUT).replace(/_plan\.json$|\.json$/, ''), at: new Date().toISOString(), products: {} }; const stat = {};
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
    for (const [o, n] of FIX[a] || []) if (h.includes(o)) { h = h.replace(o, n); why.add('по паспорту'); }
    // e)
    if (extra) { const e = extra(p, l, h); if (e.html !== h) { h = e.html; e.why.forEach(w => why.add(w)); } }
    nw[l] = h; }
  if (nw.ua === p.description.ua && nw.ru === p.description.ru) continue;
  plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [...why] }; for (const w of why) { const k = w.replace(/:.*/, ''); stat[k] = (stat[k] || 0) + 1; } }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('products', Object.keys(plan.products).length, stat); console.log('rows removed for', [...REMOVE].join(' '));
