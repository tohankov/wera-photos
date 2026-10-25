// Owner 25.10.2026: 05300004001 (1013 Kraftform Micro ESD) — the old screenshot of the WERA catalog table (it showed 1") -> our HTML variant table by
// wera.de «Daten und Fakten» = datasheet p. 2 (23 mm / 97 mm / 29/32"), same markup as the other tables (vt/table2.js), header icons alt="".
//   node cat/gvyk_shot1013_plan.js <group export.json> <out plan.json>   -> cat/desc_write.js
const fs = require('fs'); const { table } = require('../vt/table2.js'); const [, , LIVE, OUT] = process.argv; const a = '05300004001';
const p = JSON.parse(fs.readFileSync(LIVE, 'utf8')).find(x => x.article === a);
const series = { name: 'WERA 1013 ESD', cols: [{ icon: 'icon-length', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: { ua: 'мм', ru: 'мм' } },
  { icon: 'icon-handle', w: 13, ua: 'Довжина ручки', ru: 'Длина ручки', unit: { ua: 'мм', ru: 'мм' } }, { icon: 'icon-length-inch', w: 10, ua: 'Довжина робочого кінця', ru: 'Длина рабочего конца', unit: { ua: 'дюйми', ru: 'дюймы' } }],
  rows: [[a, '23', '97', '29/32″', '']], notes: { ua: [], ru: [] } };
const SHOT = /<p><a href="\/content\/uploads\/images\/05300004001\/05300004001-1\.png"><img [^>]*><\/a><\/p>/;
const nw = {}; for (const l of ['ua', 'ru']) { if (!SHOT.test(p.description[l])) { console.log('STOP: screenshot block not found in', l); process.exit(2); }
  const t = table(series, l, a, {}).replace(/(<img src="\/content\/uploads\/images\/icons\/[^"]+"[^>]*?)alt="[^"]*"/g, '$1alt=""'); nw[l] = p.description[l].replace(SHOT, t); }
fs.writeFileSync(OUT, JSON.stringify({ name: 'gvyk_shot1013', products: { [a]: { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: ['скриншот -> HTML-таблица по паспорту'] } } })); console.log('ok');
