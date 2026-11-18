// «Технічні дані» instead of the WERA spec-row screenshot (owner 17.11.2026, docs/report_1117_descimg.md, variant в): single products whose
// wera.de page shows only this article (no series; the datasheet's other variants are gone from wera.de and are not ours) get the table of
// vt/table2.js tech() — the wera.de row of this article, every value checked against the row of the WERA datasheet table («Другие варианты
// таких изделий», batch/ds/<art>.txt); a value that differs -> STOP. The screenshot paragraph goes (vt/oldpic.js), the table stands before
// «Дізнайтеся більше», the PDF paragraph has the bottom room (PDF_P). A product with a real series (≥ 2 live rows) is not handled here — STOP.
//   node vt/techdata_plan.js <all.json> <out plan.json> <art,art,...>       (wera.de fetched live, 2 s apart; no table there -> inventory/wera/pages.json)
const fs = require('fs'), path = require('path'); const OP = require('./oldpic.js'); const { tech, PDF_P } = require('./table2.js'); const WP = require('./wera_page.js');
const [, , ALL, OUT, ARTS] = process.argv; const arts = ARTS.split(','); const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p]));
const CACHE = require('../../inventory/wera/pages.json'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const U = { mm: { ua: 'мм', ru: 'мм' }, inch: { ua: 'дюйми', ru: 'дюймы' }, nm: { ua: 'Н·м', ru: 'Н·м' }, lbf: { ua: 'lbf·ft', ru: 'lbf·ft' } };
// column headings and icons — as in our existing tables (05042673001 adapters, 05074752001 / 05075670001 torque, 05020313001 Joker, 247-like blades)
const c = (ua, ru, unit, icon, w, x) => ({ ua, ru, unit: U[unit], icon, w, x });
const BASE = {
  'Außenvierkant|inch': c('Привід (зовнішній квадрат)', 'Привод (наружный квадрат)', 'inch'), 'Gesamtlänge|mm': c('Загальна довжина', 'Общая длина', 'mm'),
  'Grifflänge|mm': c('Довжина ручки', 'Длина ручки', 'mm', 'icon-handle', 13),
  'Klingendicke|mm': c('Товщина робочого кінця', 'Толщина рабочего конца', 'mm', 'icon-blade-thickness', 16), 'Klingenbreite|mm': c('Ширина робочого кінця', 'Ширина рабочего конца', 'mm', 'icon-blade-width', 22),
  'Klingenlänge|mm': c('Довжина робочого кінця', 'Длина рабочего конца', 'mm', 'icon-length', 10), 'Klingendurchmesser|mm': c('Діаметр робочого кінця', 'Диаметр рабочего конца', 'mm', 'icon-diameter', 26),
  'Klingenbreite (in Zoll)|inch': c('Ширина робочого кінця', 'Ширина рабочего конца', 'inch', 'icon-blade-width', 22), 'Klingenlänge (in Zoll)|inch': c('Довжина робочого кінця', 'Длина рабочего конца', 'inch', 'icon-length-inch', 10),
  'Schlüsselweite|mm': c('Розмір ключа', 'Размер ключа', 'mm', 'icon-wrench-size', 23), 'Maulschlüssel Joker|inch': c('Розмір ключа', 'Размер ключа', 'inch', 'icon-wrench-size', 23),
  'Kopfdicke|mm': c('Товщина головки', 'Толщина головки', 'mm', 'icon-wrench-thickness', 12),
  'Artikelnummer|art. no.': c('Позначення WERA', 'Обозначение WERA'), 'Aufnahmegröße|inch': c('Приєднання насадки', 'Присоединение насадки', 'inch'),
  'Aufnahmegröße Werkzeugseitig|inch': c('Приєднання до інструмента', 'Присоединение к инструменту', 'inch'),
  'Länge|mm': c('Довжина', 'Длина', 'mm'), 'Durchmesser|mm': c('Діаметр', 'Диаметр', 'mm'),
  'Hauptskalenteilung|Nm': c('Ціна поділки основної шкали', 'Цена деления основной шкалы', 'nm', 'icon-torque-scale-division', 50),
  'Hauptskala Messbereich|Nm': c('Основна шкала / діапазон вимірювання', 'Основная шкала / диапазон измерения', 'nm', 'icon-torque-scale', 50),
  'Nebenskala Messbereich|lbf. ft.': c('Додаткова шкала / діапазон вимірювання', 'Дополнительная шкала / диапазон измерения', 'lbf'),
  'Länge Drehmomentschlüssel|mm': c('Довжина динамометричного ключа', 'Длина динамометрического ключа', 'mm', 'icon-torque-length', 10),
  'Länge Drehmomentschlüssel (in Zoll)|inch': c('Довжина динамометричного ключа', 'Длина динамометрического ключа', 'inch', 'icon-torque-length', 10),
  'Stichmaß Prüfaufsatz|mm': c('Подовження контрольної насадки Sk', 'Удлинение контрольной насадки Sk', 'mm'),
  'Strecke Kraftanlagepunkt/Prüfgerät-Achse|mm': c('Плече від точки прикладання сили до осі lk', 'Плечо от точки приложения силы до оси lk', 'mm'),
  'Länge Griff G2|mm': c('Довжина ручки G2', 'Длина ручки G2', 'mm', 'icon-handle', 13), 'Länge Griff G2 (inch)|inch': c('Довжина ручки G2', 'Длина ручки G2', 'inch', 'icon-handle', 13),
  'Durchmesser Uhr|mm': c('Діаметр циферблата', 'Диаметр циферблата', 'mm'), 'Durchmesser Uhr (inch)|inch': c('Діаметр циферблата', 'Диаметр циферблата', 'inch'),
  'Durchmesser des Kopfes|mm': c('Діаметр головки', 'Диаметр головки', 'mm'), 'Durchmesser des Kopfes(inch)|inch': c('Діаметр головки', 'Диаметр головки', 'inch'),
  'Höhe Ratschenkopf H2|mm': c('Висота головки H2', 'Высота головки H2', 'mm'), 'Höhe Ratschenkopf H2 (inch)|inch': c('Висота головки H2', 'Высота головки H2', 'inch'),
  'Hauptskala Messbereich Min|Nm': c('Основна шкала, мін.', 'Основная шкала, мин.', 'nm'), 'Hauptskala Messbereich Max|Nm': c('Основна шкала, макс.', 'Основная шкала, макс.', 'nm'),
  'Nebenskala Messbereich Min|lbf. ft.': c('Додаткова шкала, мін.', 'Дополнительная шкала, мин.', 'lbf'), 'Nebenskala Messbereich Max|lbf. ft.': c('Додаткова шкала, макс.', 'Дополнительная шкала, макс.', 'lbf'),
  'Antriebsvierkant|mm': c('Привід (під ключ)', 'Привод (под ключ)', 'mm', null, 0, true), 'Abtriebsgröße (in Zoll)|inch': c('Приєднувальний квадрат', 'Присоединительный квадрат', 'inch'),
  'Stichmass|mm': c('Міжосьова відстань', 'Межосевое расстояние', 'mm'), 'Gesamtlänge Kopf|mm': c('Загальна довжина головки', 'Общая длина головки', 'mm'),
  'Breite|mm': c('Ширина', 'Ширина', 'mm'), 'Höhe|mm': c('Висота', 'Высота', 'mm') };
for (let i = 1; i <= 5; i++) BASE[`Voreingestellter Messwert ${i}|Nm`] = c(`Попередньо встановлене значення ${i}`, `Предустановленное значение ${i}`, 'nm', 'icon-torque-preset', 30);
// per product kind (by our title): the same wera.de label means another thing
// square-drive torque wrenches (datasheet: «С присоединительным квадратом ¼"» / «С хвостовиком с квадратной головкой 1/2"») — the drive column
// as BASE «Außenvierkant» with the square pictogram (WERA's row shows a square); Lock A 6 is a 1/4" bit holder (hex) — hex socket as XP
const SQUARE = new Set(['05075690001', '05075692001']);
const KIND = (t, a) => /^Динамометрична викрутка/.test(t) ? 'screwdriver' : /^Динамометрич/.test(t) ? (SQUARE.has(a) ? 'torqueSq' : 'torque') : /Joker/.test(t) ? 'joker'
  : /^Ручка-тримач/.test(t) ? 'handle' : /^Оправ/.test(t) ? 'shank' : '';
const TQ = { 'Aufnahmegröße|inch': c('Розмір затиску', 'Размер зажима', 'inch', 'icon-hex-socket', 26), 'Aufnahmegröße|': c('Розмір затиску', 'Размер зажима', 'mm', 'icon-hex-socket', 26, true) };
const OVER = { torque: TQ, torqueSq: { ...TQ, 'Aufnahmegröße|inch': c('Привід (зовнішній квадрат)', 'Привод (наружный квадрат)', 'inch', 'icon-square', 26) },
  // 7510 Safe-Torque Speed: wera.de «Länge Drehmomentschlüssel» of a screwdriver is its overall length
  screwdriver: { ...TQ, 'Länge Drehmomentschlüssel|mm': c('Загальна довжина', 'Общая длина', 'mm') },
  // 870/7 machine shank — the headings of our 870/4 tables (05050220001)
  shank: { 'Aufnahmegröße|inch': c('Розмір затиску', 'Размер зажима', 'inch', 'icon-square', 26), 'Klingenlänge|mm': c('Довжина робочого кінця', 'Длина рабочего конца', 'mm', 'icon-adapter-length', 15),
    'Klingenlänge (in Zoll)|inch': c('Довжина робочого кінця', 'Длина рабочего конца', 'inch', 'icon-adapter-length', 15),
    'Aufnahmegröße Werkzeugseitig|inch': c('Розмір затиску інструмента', 'Размер зажима инструмента', 'inch', 'icon-hex', 26) },
  joker: { 'Gesamtlänge|mm': c('Загальна довжина', 'Общая длина', 'mm', 'icon-combi-length', 9) },
  handle: { 'Abtriebsgröße|mm': c('Розмір затиску', 'Размер зажима', 'mm', 'icon-hex-socket', 26) } };
// footnotes: the UA / RU of our existing tables (870/4, Click-Torque XP); «not sold in the USA and Canada» (247) is left out — not for our buyers
const NOTE = { 'Mit Stift, für maschinenbetätigte Steckschlüsseleinsätze': { ua: 'Зі штифтом; для торцевих головок із машинним режимом застосування', ru: 'Со штифтом; для торцовых головок с машинным режимом применения' },
  'S k = Stichmaß Prüfaufsatz; l k = Strecke Kraftanlagepunkt bis Prüfgerät-Achse': { ua: 'Sk — подовження контрольної насадки; lk — довжина плеча від точки прикладання сили до осі обертання ключа з контрольною насадкою', ru: 'Sk — удлинение контрольной насадки; lk — длина плеча от точки приложения силы до оси вращения ключа с контрольной насадкой' },
  'Produkt nicht in den USA und Kanada erhältlich.': null };
const fmt = (v, x, k) => { v = String(v).replace(/"/g, '″'); if (x) v = v.replace(/(\d)\s?x\s?(\d)/g, '$1×$2'); if (/Messbereich\|Nm$/.test(k)) v = v.replace(/(\d)\.(\d)/g, '$1,$2'); return v; };
// datasheet row of this article: the cells after the article (247: the values sit on the line above the article, which has no cells)
const dsRow = a => { const L = fs.readFileSync(path.join(__dirname, `../batch/ds/${a}.txt`), 'utf8').split('\n').map(l => l.replace(/^p\d+ /, ''));
  const i = L.findIndex(l => /Другие варианты таких изделий/.test(l)); if (i < 0) return null; const j = L.findIndex((l, k) => k > i && l.includes(a));
  const line = L[j].includes('|') ? L[j] : L.slice(i + 1, j).reverse().find(l => l.includes('|') && !/^(мм|inch|art)/.test(l.trim()));
  return line.split('|').map(s => s.trim()).filter(s => s && s !== a); };
const norm = s => String(s).replace(/[″"]/g, '"').replace(/\s+/g, ' ').trim();
(async () => { const plan = { name: process.env.NAME || 'techdata1117', products: {} };
  for (const a of arts) { const p = A[a]; if (!p || +p.display_in_showcase !== 1) { console.log('STOP not a visible product', a); process.exit(2); }
    await sleep(2000); const r = await fetch('https://www.wera.de/de/' + a, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' }); let page = null; try { page = WP.parse(await r.text()); } catch (e) { }
    let t = page && page.table, notesText = page && page.notesText, src = 'wera.de';
    if (!t || !t.arts) { const cp = CACHE.pages[CACHE.art[a]]; t = cp && cp.table; notesText = cp && cp.notesText; src = 'wera.de (кэш inventory/wera/pages.json)'; }
    if (!t || !t.arts || !t.arts.includes(a)) { console.log('STOP no wera.de row', a); process.exit(2); }
    if (t.arts.length > 1) { console.log('STOP series on wera.de — «Інші варіанти серії», not tech data', a, t.arts.join(' ')); process.exit(2); }
    const kind = KIND(p.title.ua, a), cols = [], vals = []; let noteNo = '';
    for (const row of t.rows) { const k = row.label + '|' + row.unit; if (/^Hinweis/.test(row.label)) { noteNo = (row.vals[0].match(/\d+/g) || []).join(','); continue; }
      if (/^(Farbe|Grifffarbe)$/.test(row.label)) continue; const col = (OVER[kind] || {})[k] || BASE[k]; if (!col) { console.log('STOP no column for', a, k); process.exit(2); }
      cols.push(col); vals.push(fmt(row.vals[0], col.x, k)); }
    // every datasheet cell = the start of one wera.de value (the PDF text cuts long cells: «80-» of «80-400»); the order may differ (7440-like Nm pair)
    const d = dsRow(a); if (!d) { console.log('STOP no datasheet table', a); process.exit(2); } const W = t.rows.filter(x => !/^(Hinweis|Farbe|Grifffarbe)/.test(x.label)).map(x => norm(x.vals[0]));
    if (d.length !== W.length) { console.log('STOP datasheet cells', a, d.length, 'wera.de', W.length, JSON.stringify(d)); process.exit(2); }
    const free = [...W]; for (const cell of d) { const k = free.findIndex(w => w.startsWith(norm(cell).replace(/;$/, ''))); if (k < 0) { console.log('STOP datasheet ≠ wera.de', a, cell, JSON.stringify(W)); process.exit(2); } free.splice(k, 1); }
    const notes = { ua: [], ru: [] }; const used = noteNo ? noteNo.split(',').filter(n => { const de = (notesText || {})[n]; if (!(de in NOTE)) { console.log('STOP footnote without UA/RU', a, n, de); process.exit(2); } return NOTE[de]; }) : [];
    for (const n of used) { const tr = NOTE[notesText[n]]; notes.ua.push(`<sup>${n})</sup> ${tr.ua}`); notes.ru.push(`<sup>${n})</sup> ${tr.ru}`); }
    const spec = { cols, row: [a, ...vals, used.join(',')], notes }; const nw = {}, why = new Set([`скриншот строки WERA → «Технічні дані» (${src} = паспорт)`]);
    for (const l of ['ua', 'ru']) { let h = OP.strip(p.description[l]); if (h === p.description[l]) { console.log('STOP no screenshot', a, l); process.exit(2); }
      if (/min-width:560px/.test(h)) { console.log('STOP already has a table', a, l); process.exit(2); }
      const i = h.search(/<h3>(?:Дізнайтеся більше|Узнайте больше)/); const tb = tech(spec, l); h = i < 0 ? h + tb : h.slice(0, i) + tb + h.slice(i);
      const h2 = h.replace(/<p>(\s*<a\b[^>]*pdfgenerator-datasheets)/g, `<p style="${PDF_P}">$1`); if (h2 !== h) why.add('отступ под кнопкой PDF'); nw[l] = h2; }
    plan.products[a] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [...why] };
    console.log(a, src, cols.length, 'колонок:', cols.map((x, i) => `${x.ua}${x.unit ? ' ' + x.unit.ua : ''} = ${vals[i]}`).join(' | '), used.length ? '| сноска ' + used : ''); }
  fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('plan', Object.keys(plan.products).length); })().catch(e => { console.error(e); process.exit(1); });
