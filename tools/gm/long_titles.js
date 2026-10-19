// PREVIEW ONLY: the titles longer than 150 characters (Google Merchant title limit; Хорошоп leaves such products out of the feed) -> a variant ≤150 in the same
// title format (type, series / model, features, size, «WERA article»), nothing about type, series, size or the article dropped. node gm/long_titles.js <export json>
// -> inventory/gm_long_titles.xlsx + gm/titles_new.json; prints was -> proposed with lengths. Owner's «ок» 19.10.2026 with one change: no «під замовлення» / «под заказ» in the torque screwdriver titles (written by gm/titles_plan.js + names/write.js set).
const path = require('path'), X = require('xlsx');
const TQ = (m, r, ext, ch, short) => [`Динамометрична викрутка Kraftform ${m}, заводська уставка моменту ${r.replace('дюйм фунт-сила', 'дюйм фунт-сила')}${ext ? ', пістолетна ручка' : ''}, ${ch ? 'швидкозатискний патрон' : short ? 'Rapidaptor' : 'патрон Rapidaptor'}`,
  `Динамометрическая отвёртка Kraftform ${m}, заводская уставка момента ${r}${ext ? ', пистолетная ручка' : ''}, ${ch ? 'быстрозажимной патрон' : short ? 'Rapidaptor' : 'патрон Rapidaptor'}`];
const P = {
  '05075692001': ['Динамометричний ключ Click-Torque C 3 Lock, регульований, реверсна тріскачка, функція відключення Torque Lock, 40-200 Нм', 'Динамометрический ключ Click-Torque C 3 Lock, регулируемый, реверсная трещотка, функция отключения Torque Lock, 40-200 Нм'],
  '05075691001': ['Динамометричний ключ Click-Torque Lock A 6, регульований, функція Torque Lock, реверсна тріскачка, права затяжка, 2,5-25 Нм', 'Динамометрический ключ Click-Torque Lock A 6, регулируемый, функция Torque Lock, реверсная трещотка, правая затяжка, 2,5-25 Нм'],
  '05075690001': ['Динамометричний ключ Click-Torque Lock A 5, регульований, функція Torque Lock, реверсна тріскачка, права затяжка, 2,5-25 Нм', 'Динамометрический ключ Click-Torque Lock A 5, регулируемый, функция Torque Lock, реверсная трещотка, правая затяжка, 2,5-25 Нм'],
  '05006619001': ['Набір Kraftform Kompakt VDE 17 RA Imperial 1, 2 ручки (одна з тріскачкою), кольорове маркування вставок, 17 предметів', 'Набор Kraftform Kompakt VDE 17 RA Imperial 1, 2 ручки (одна с трещоткой), цветовая маркировка вставок, 17 предметов'],
  '05022699001': ['Набір Г-подібних ключів 3950/9 Hex-Plus Multicolour HF Stainless 1, метричні, нержавіюча сталь, з фіксацією, 9 предметів', 'Набор Г-образных ключей 3950/9 Hex-Plus Multicolour HF Stainless 1, метрические, нержавеющая сталь, с фиксацией, 9 предметов'],
  '05006631001': ['Набір Kraftform Kompakt VDE Stainless 17 extra slim 1, стрижні з нержавіючої сталі, 2 ручки (SL, PH, PZ, PZ/S, TX), 17 предметів', 'Набор Kraftform Kompakt VDE Stainless 17 extra slim 1, стержни из нержавеющей стали, 2 ручки (SL, PH, PZ, PZ/S, TX), 17 предметов'],
  '05006480001': ['Набір ізольованих викруток Kraftform Plus Серія 100 160 iS/7 Rack, звужені кінці, індикатор напруги, підставка (SL, PH, PZ/S)', 'Набор изолированных отвёрток Kraftform Plus Серия 100 160 iS/7 Rack, зауженные концы, индикатор напряжения, подставка (SL, PH, PZ/S)'],
  '05135961001': ['Набір ізольованих викруток Kraftform Plus Серія 100 160 iSS/7, звужені робочі кінці, частина з тонкою ручкою (SL, PH, PZ/S)', 'Набор изолированных отвёрток Kraftform Plus Серия 100 160 iSS/7, зауженные рабочие концы, часть с тонкой ручкой (SL, PH, PZ/S)'],
  '05006609001': ['Набір Kraftform Kompakt VDE 16 Torque 1,2–3,0 Нм extra slim 1, з динамометричною викруткою (SL, PH, PZ, PZ/S, TX), 16 предметів', 'Набор Kraftform Kompakt VDE 16 Torque 1,2–3,0 Нм extra slim 1, с динамометрической отвёрткой (SL, PH, PZ, PZ/S, TX), 16 предметов'],
  '05074715010': TQ('7460', '0,3–1,2 Нм'), '05074716010': TQ('7461', '1,2–3,0 Нм'), '05074717010': TQ('7462', '3,0–6,0 Нм', 1), '05074720010': TQ('7465', '2,5–11,5 дюйм фунт-сила'),
  '05074721010': TQ('7467', '25–55 дюйм фунт-сила', 1, 0, 1), '05074722010': TQ('7466', '11–29 дюйм фунт-сила'), '05074728010': TQ('7463', '4,0–8,8 Нм', 1), '05074790010': TQ('7450', '0,1–0,34 Нм'),
  '05074792010': TQ('7451', '0,3–1,0 Нм'), '05074794010': TQ('7452', '0,9–1,5 Нм'), '05074820010': TQ('7450 ESD', '0,1–0,34 Нм'), '05074822010': TQ('7451 ESD', '0,3–1,0 Нм'),
  '05074824010': TQ('7452 ESD', '0,9–1,5 Нм'), '05074826010': TQ('7455 ESD', '0,1–0,34 Нм'), '05074828010': TQ('7456 ESD', '0,3–1,0 Нм'), '05074840010': TQ('7460 ESD', '0,3–1,2 Нм'),
  '05074842010': TQ('7461 ESD', '1,2–3,0 Нм'), '05074800010': TQ('1460 ESD', '0,02–0,06 Нм', 0, 1), '05074810010': TQ('1461 ESD', '0,05–0,11 Нм', 0, 1) };
const all = require(path.resolve(process.argv[2])); const rows = [];
for (const p of all.filter(p => +p.display_in_showcase === 1 && (p.mod_title.ua.length > 150 || p.mod_title.ru.length > 150))) {
  const [ua, ru] = (P[p.article] || ['', '']).map(t => t && `${t} WERA ${p.article}`);
  rows.push({ 'Артикул': p.article, 'Было UA': p.mod_title.ua, 'Было UA, симв.': p.mod_title.ua.length, 'Стало UA': ua, 'Стало UA, симв.': ua.length, 'Было RU': p.mod_title.ru, 'Было RU, симв.': p.mod_title.ru.length, 'Стало RU': ru, 'Стало RU, симв.': ru.length }); }
const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 80, 8, 80, 8, 80, 8, 80, 8].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Названия >150');
X.writeFile(wb, path.join(__dirname, '../../inventory/gm_long_titles.xlsx'));
require('fs').writeFileSync(path.join(__dirname, 'titles_new.json'), JSON.stringify(Object.fromEntries(rows.filter(r => r['Стало UA']).map(r => [r['Артикул'], { ua: r['Стало UA'], ru: r['Стало RU'] }])), null, 1));   // input of gm/titles_plan.js
console.log('titles', rows.length, 'no proposal', rows.filter(r => !r['Стало UA']).length, 'still >150', rows.filter(r => r['Стало UA, симв.'] > 150 || r['Стало RU, симв.'] > 150).map(r => r['Артикул']));
for (const r of rows) console.log(`${r['Артикул']} | ${r['Стало UA']} (${r['Стало UA, симв.']}) | ${r['Стало RU']} (${r['Стало RU, симв.']})`);
