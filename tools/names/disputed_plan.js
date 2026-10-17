// Owner-approved titles for the disputed products (names/preview.json «Спорные», groups А–Г, 18.10.2026) -> names/set_plan.json for names/write.js set.
// Old title / mod_title come from a live export, so write.js writes only where the site still holds exactly them; mod_title must be the title or empty.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const { apply } = require('./rules.js'); const { lat } = require('./types.js');
const W = 'WERA'; const T = {};
const put = (a, ua, ru) => { T[a] = { ua: `${ua} ${W} ${a}`, ru: `${ru} ${W} ${a}` }; };
// А. type words
put('05136043001', 'Набір монтажних інструментів для фотогальваніки 1, 7 предметів', 'Набор монтажных инструментов для фотогальваники 1, 7 предметов');
put('05150111001', 'Ложемент з набором головок і тріскачкою 8000 B Zyklop 3/8″ 1, 23 предмети', 'Ложемент с набором головок и трещоткой 8000 B Zyklop 3/8″ 1, 23 предмета');
put('05136405001', 'Сумка-скрутка 6003 Joker 15, неукомплектована', 'Сумка-скрутка 6003 Joker 15, неукомплектованная');
put('05136495001', 'Сумка-скрутка 6003 Joker 8, неукомплектована, 295×95 мм', 'Сумка-скрутка 6003 Joker 8, неукомплектованная, 295×95 мм');
for (const [a, m, s] of [['05104666001', 3, '3×33'], ['05104667001', 4, '4×35'], ['05104668001', 5, '5×36'], ['05104669001', 6, '6×40'], ['05104670001', 8, '8×40']])
  put(a, `Насадка — однопрохідний мітчик 844, M ${m}, ${s} мм`, `Насадка — однопроходный метчик 844, M ${m}, ${s} мм`);
put('05003524001', 'Вороток Zyklop 8789 A 1/4″, 110 мм', 'Вороток Zyklop 8789 A 1/4″, 110 мм');
put('05003581001', 'Вороток Zyklop 8789 B 3/8″, 165 мм', 'Вороток Zyklop 8789 B 3/8″, 165 мм');
put('05004095001', 'Набір тріскачок Zyklop Hybrid, 2 предмети', 'Набор трещоток Zyklop Hybrid, 2 предмета');
put('05003696001', 'Розтискна оправка Koloss 8781 C', 'Разжимная оправка Koloss 8781 C');
put('05136400001', 'Деблокатор для тріскачки Zyklop 8000 E', 'Деблокиратор для трещотки Zyklop 8000 E');
// Б. end of title: «Набір» first, old WERA number in brackets dropped, piece count from the datasheet
const K = (n, ua, ru, prof, pcs) => [`Набір Kraftform Kompakt VDE ${n}${ua}${prof ? ` (${prof})` : ''}, ${pcs} предмет${pcs % 10 >= 2 && pcs % 10 <= 4 && (pcs < 10 || pcs > 20) ? 'и' : 'ів'}`, `Набор Kraftform Kompakt VDE ${n}${ru}${prof ? ` (${prof})` : ''}, ${pcs} предмет${pcs % 10 >= 2 && pcs % 10 <= 4 && (pcs < 10 || pcs > 20) ? 'а' : 'ов'}`];
const P5 = 'SL, PH, PZ, PZ/S, TX', P18 = 'SL, PH, PZ, PH/S, PZ/S';
put('05006600001', ...K('7 Universal 1', '', '', 'SL, PH', 7));
put('05006601001', ...K('7 Universal 2', '', '', 'SL, PZ', 7));
put('05006604001', ...K('7 Imperial 1', '', '', 'SL, PH, квадрат', 7));
put('05006603001', ...K('7 extra slim 1', ' зі зменшеним діаметром робочого кінця', ' с уменьшенным диаметром рабочего конца', 'SL, PH, PZ/S, TX', 7));
put('05006607001', ...K('16 Universal 1', '', '', P5, 16));
put('05006608001', ...K('16 extra slim 1', ' зі зменшеним діаметром робочого кінця', ' с уменьшенным диаметром рабочего конца', P5, 16));
put('05006611001', ...K('17 Universal 1', ' з 2 ручками', ' с 2 ручками', P5, 17));
put('05006612001', ...K('17 extra slim 1', ' з 2 ручками та кліщами KNIPEX 13 96 200', ' с 2 ручками и клещами KNIPEX 13 96 200', P5, 17));
put('05006613001', ...K('18 Universal 1', '', '', P18, 18));
put('05006614001', ...K('18 Universal 2', ' з 2 ручками', ' с 2 ручками', P18, 18));
put('05006616001', ...K('18 Imperial 1', ' з 2 ручками', ' с 2 ручками', 'SL, PH, PH/S, PZ/S, квадрат', 18));
put('05006605001', ...K('15 Torque 1,2–3,0 Нм extra slim 1', ' з динамометричною викруткою', ' с динамометрической отвёрткой', P5, 15));
put('05006609001', ...K('16 Torque 1,2–3,0 Нм extra slim 1', ' з динамометричною викруткою та ручкою-тримачем', ' с динамометрической отвёрткой и ручкой-держателем', P5, 16));
put('05006630001', 'Набір зі стрижнями з нержавіючої сталі TORX® Kraftform Kompakt VDE Stainless 8 extra slim 1, 8 предметів', 'Набор со стержнями из нержавеющей стали TORX® Kraftform Kompakt VDE Stainless 8 extra slim 1, 8 предметов');
put('05006631001', `Набір зі стрижнями з нержавіючої сталі та 2 ручками Kraftform Kompakt VDE Stainless 17 extra slim 1 (${P5}), 17 предметів`, `Набор со стержнями из нержавеющей стали и 2 ручками Kraftform Kompakt VDE Stainless 17 extra slim 1 (${P5}), 17 предметов`);
put('05051017001', 'Набір Kraftform Kompakt 20 Tool Finder 2 із сумкою (PH, PZ, TX), 13 предметів', 'Набор Kraftform Kompakt 20 Tool Finder 2 с сумкой (PH, PZ, TX), 13 предметов');
put('05681419001', "Пояс матер'яний Belt 781 0/5 на 5 інструментів, неукомплектований", 'Пояс матерчатый Belt 781 0/5 на 5 инструментов, неукомплектованный');
// В. sizes from the datasheet
put('05030109001', 'Хрестова викрутка для електронника з електростатичним захистом Kraftform Micro ESD 1550 PH S, PH 1×40 мм', 'Крестовая отвертка для электронщика с электростатической защитой Kraftform Micro ESD 1550 PH S, PH 1×40 мм');
for (const [a, s] of [['05030331001', '1,4'], ['05030330001', '1,1']]) put(a, `Викрутка Pentalobe з електростатичним захистом Kraftform Micro 1573 ESD, PL ${s}×40 мм`, `Отвертка Pentalobe с электростатической защитой Kraftform Micro 1573 ESD, PL ${s}×40 мм`);
for (const [a, s] of [['05117688001', 1], ['05117689001', 2]]) put(a, `Викрутка для гвинтів із внутрішнім квадратом Kraftform Plus 368 квадрат #${s}×25 мм`, `Отвёртка для винтов с внутренним квадратом Kraftform Plus 368 квадрат #${s}×25 мм`);
put('05006470001', 'Набір викруток Kraftform Plus серія 100 165 iS із завуженим стрижнем PZ/S 1 + PZ/S 2, 2 предмети', 'Набор отвёрток Kraftform Plus серия 100 165 iS с зауженным стержнем PZ/S 1 + PZ/S 2, 2 предмета');
// Г. series template keeping the words it would have lost
for (const [a, s] of [['05057505001', '3,0'], ['05057510001', '4,0'], ['05057515001', '5,0'], ['05057520001', '6,0'], ['05057525001', '8,0'], ['05057530001', '10,0'], ['05135084001', '7/32″']])
  put(a, `Біта шестигранна з приводом 5/16″ 840/2 Z HEX ${s}×30 мм`, `Бита шестигранная с приводом 5/16″ 840/2 Z HEX ${s}×30 мм`);
for (const [a, s] of [['05066925001', 55], ['05066920001', 50], ['05066915001', 45], ['05066910001', 40], ['05066905001', 30], ['05066902001', 27], ['05066900001', 25], ['05066901001', 20]])
  put(a, `Біта з шестигранним приводом 5/16″ TORX® 867/2 Z TX ${s}×35 мм`, `Бита с шестигранным приводом 5/16″ TORX® 867/2 Z TX ${s}×35 мм`);
for (const [a, m, sr, pr, sz] of [['05065114001', 'M5', '851/12', 'Phillips', 'PH 2×44,5'], ['05065129001', 'M5', '855/12', 'Pozidriv', 'PZ 2×44,5'], ['05065096001', 'M4', '855/11', 'Pozidriv', 'PZ 2×33']])
  put(a, `Біта хвостовик з різьбленням ${m} для прямого приєднання до машини ${pr} ${sr} ${sz} мм`, `Бита хвостовик с резьбой ${m} для прямого присоединения к машине ${pr} ${sr} ${sz} мм`);
for (const [a, s] of [['05135276001', 'PH 1'], ['05134605001', 'PH 000']]) put(a, `Біта з хвостовиком у формі півмісяця Halfmoon 4 мм 851/9 C J ${s}×44 мм`, `Бита с хвостовиком в форме полумесяца Halfmoon 4 мм 851/9 C J ${s}×44 мм`);
for (const [a, s] of [['05003322001', '6,5'], ['05003320001', '5,5']]) put(a, `Шліцева викруткова головка Zyklop 8700 A FL SL ${s}×28 мм, привід 1/4″`, `Шлицевая отвёрточная головка Zyklop 8700 A FL SL ${s}×28 мм, привод 1/4″`);
const D = Object.fromEntries(require('./preview.json').disputed.map(d => [d['Артикул'], d]));   // 842/1 Z, 851/4 A, 867/4 IP: the template proposal as it is
for (const a of ['05380110001', '05056358001', '05056356001', '05056354001', '05056352001', '05056350001', '05134908001', '05134683001']) T[a] = { ua: D[a]['Предложение UA'], ru: D[a]['Предложение RU'] };
// mechanics only (the type words in UA and RU mean the same)
const MECH = ['05004841001', '05004590001', '05004591001', '05004592001'];
(async () => { const arts = [...Object.keys(T), ...MECH]; for (const a of arts) if (!D[a]) throw new Error('not disputed ' + a);
  const r = await S.call('horoshop_catalog_export', { expr: { article: arts }, includedParams: ['article', 'title', 'mod_title'], limit: 100, allowLarge: true }); const live = Object.fromEntries(r.response.products.map(p => [p.article, p]));
  const plan = {}; const warn = [];
  for (const a of arts) { const p = live[a]; if (!p) { warn.push(a + ' not in export'); continue; }
    if (['ua', 'ru'].some(l => p.mod_title[l] && p.mod_title[l] !== p.title[l])) { warn.push(a + ' mod_title differs'); continue; }
    const t = T[a] || { ua: apply(lat(p.title.ua, 'ua'), a).t, ru: apply(lat(p.title.ru, 'ru'), a).t };
    if (t.ua === p.title.ua && t.ru === p.title.ru) { warn.push(a + ' unchanged'); continue; }
    plan[a] = { oldTitle: p.title, oldMod: p.mod_title, ua: t.ua, ru: t.ru }; }
  fs.writeFileSync(path.join(__dirname, 'set_plan.json'), JSON.stringify(plan, null, 1));
  console.log('plan', Object.keys(plan).length, 'of', arts.length, warn); S.close(); })();
