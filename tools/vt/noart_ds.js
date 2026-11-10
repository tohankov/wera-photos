// Set positions with neither our product nor a wera.de row (owner 03.11.2026): the picture is cut out of the SET's datasheet — the product picture of the
// «Содержимое» row (lib/ds_images_all.mjs: page / number of the raster image; one picture per datasheet row, WERA's series picture — the colour ring shows
// one size of the row). Background removed (white margin 6 px first — light metal touches the frame), trimmed, 4 px transparent margin ->
// images/setblock_wera/<file>; vt/noart.json «heads» {datasheet head: {group, ua, ru, file, src}} — read by vt/setblock_plan.js; the owner uploads the files
// to /content/uploads/images/icons/ (vt/noart_files.js check marks them).   node vt/noart_ds.js <dir of lib/ds_images_all.mjs output>
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , IMG] = process.argv; const DIR = path.join(__dirname, '../../images/setblock_wera/'); const F = path.join(__dirname, 'noart.json');
const H = {
  // 05059303001 Kraftform Kompakt 60 Tool Finder, page 3
  '851/4 Z PH Биты Take it easy, PH 1 x 89 мм': { src: '05059303001_p3_4', file: 'wera_851_4_z_ph.png', group: 'PH', ua: 'Біти 851/4 Z PH Take it easy', ru: 'Биты 851/4 Z PH Take it easy' },
  '851/4 Биты PH Ni, PH 3 x 89 мм': { src: '05059303001_p3_6', file: 'wera_851_4_ph_ni.png', group: 'PH', ua: 'Біти 851/4 PH, нікельовані', ru: 'Биты 851/4 PH, никелированные' },
  '855/4 Z PZ Биты Take it easy, PZ 2 x 89 мм': { src: '05059303001_p3_8', file: 'wera_855_4_z_pz.png', group: 'PZ', ua: 'Біти 855/4 Z PZ Take it easy', ru: 'Биты 855/4 Z PZ Take it easy' },
  '855/4 Насадки PZ Ni, PZ 3 x 89 мм': { src: '05059303001_p3_10', file: 'wera_855_4_pz_ni.png', group: 'PZ', ua: 'Біти 855/4 PZ, нікельовані', ru: 'Биты 855/4 PZ, никелированные' },
  '867/4 Z TORX® BO Биты с отверстием, Take it easy, TX 10 x 89 мм': { src: '05059303001_p3_12', file: 'wera_867_4_z_bo.png', group: 'TXBO', ua: 'Біти 867/4 Z TORX® BO з отвором, Take it easy', ru: 'Биты 867/4 Z TORX® BO с отверстием, Take it easy' },
  '840/4 Z Насадки Take it easy, 4 mm x 89 мм': { src: '05059303001_p3_14', file: 'wera_840_4_z.png', group: 'HEX', ua: 'Біти 840/4 Z HEX Take it easy', ru: 'Биты 840/4 Z HEX Take it easy' },
  '840/4 Насадки Ni, 6 mm x 89 мм': { src: '05059303001_p3_16', file: 'wera_840_4_ni.png', group: 'HEX', ua: 'Біти 840/4 HEX, нікельовані', ru: 'Биты 840/4 HEX, никелированные' },
  '800/4 Z Насадки Take it easy, 1 мм x 5.5 мм x 89 мм': { src: '05059303001_p3_18', file: 'wera_800_4_z.png', group: 'SL', ua: 'Біти 800/4 Z SL Take it easy', ru: 'Биты 800/4 Z SL Take it easy' },
  // 05073665001 Kraftform Kompakt Vario RA, page 4 (80 RA — discontinued by WERA, still in the set's datasheet)
  '80 RA Vario Ручка-битодержатель с трещоткой, 6 мм x 115 мм': { src: '05073665001_p4_2', file: 'wera_80_ra_vario.png', group: 'c:HANDLE', ua: '80 RA Vario Ручка-тримач із тріскачкою', ru: '80 RA Vario Ручка-держатель с трещоткой' },
  // 10.11.2026 (owner: positions without our product and without a wera.de row — cut out of the set datasheet); «reuse» — the WERA file of the same series
  // 05136609001 Christmas calendar 2024, pages 4–8
  "9544 Трещоточная головка Zyklop Mini, 1/4\", 1/4\" x 50 мм": { src: '05136609001_p4_2', file: 'wera_9544.png', group: 'c:RATCHET', ua: "9544 Тріскачка Zyklop Mini 1/4″", ru: "9544 Трещоточная головка Zyklop Mini 1/4″" },
  "815/1 Ручка-битодержатель, 1/4\", 1/4\" x 92 мм": { src: '05136609001_p4_4', file: 'wera_815_1.png', group: 'c:HANDLE', ua: "815/1 Ручка-тримач 1/4″", ru: "815/1 Ручка-битодержатель 1/4″" },
  "800/4 BTZ Насадки, 0.8 мм x 5.5 мм x 50 мм": { src: '05136609001_p5_2', file: 'wera_800_4_btz_08.png', group: 'SL', ua: "Біти 800/4 BTZ", ru: "Насадки 800/4 BTZ" },
  "Bit-Check 7 BiTorsion, неукомплектованный": { src: '05136609001_p5_5', file: 'wera_bc7_bitorsion.png', group: 'c:ACC', ua: "Bit-Check 7 BiTorsion, без біт", ru: "Bit-Check 7 BiTorsion, неукомплектованный" },
  "9542 Солонка": { src: '05136609001_p5_6', file: 'wera_9542.png', group: 'c:ACC', ua: "9542 Сільничка", ru: "9542 Солонка" },
  "9543 Перечница": { src: '05136609001_p5_7', file: 'wera_9543.png', group: 'c:ACC', ua: "9543 Перечниця", ru: "9543 Перечница" },
  "9501 Мини-открывашка, 86": { src: '05136609001_p5_8', file: 'wera_9501.png', group: 'c:ACC', ua: "9501 Міні-відкривачка", ru: "9501 Мини-открывашка" },
  "9495 Мягкий футляр, 200 мм x 95 мм": { src: '05136609001_p8_9', file: 'wera_9495.png', group: 'c:ACC', ua: "9495 Мʼякий футляр", ru: "9495 Мягкий футляр" },
  // 05136607001 Christmas calendar 2023, pages 4–5
  "Держатель настенный/настольный и зажим для Г-образных ключей ADK 2023": { src: '05136607001_p4_1', file: 'wera_adk23_holder.png', group: 'c:ACC', ua: "Настінний / настільний тримач і затискач для Г-подібних ключів ADK 2023", ru: "Держатель настенный / настольный и зажим для Г-образных ключей ADK 2023" },
  "Магнит ADK 2023": { src: '05136607001_p4_2', file: 'wera_adk23_magnet.png', group: 'c:ACC', ua: "Магніт ADK 2023", ru: "Магнит ADK 2023" },
  "Зажим для Г-образных ключей ADK 2023": { src: '05136607001_p4_3', file: 'wera_adk23_clip.png', group: 'c:ACC', ua: "Затискач для Г-подібних ключів ADK 2023", ru: "Зажим для Г-образных ключей ADK 2023" },
  "950 L Ni Г-образный ключ, метрический, химическое никелирование, 1.5 мм x 90 мм": { src: '05136607001_p4_5', file: 'wera_950_l_ni.png', group: 'HEX', ua: "950 L Ni Г-подібний ключ, метричний, хімічне нікелювання", ru: "950 L Ni Г-образный ключ, метрический, химическое никелирование" },
  "80 ADK 2023 Руча Vario, 6 мм x 98 мм": { src: '05136607001_p4_7', file: 'wera_80_adk23.png', group: 'c:HANDLE', ua: "80 ADK 2023 Ручка Vario", ru: "80 ADK 2023 Ручка Vario" },
  "86 Ni Комбинированный рабочий конец, PZ 1 x PZ 2 x 175 мм": { src: '05136607001_p4_11', file: 'wera_86_ni.png', group: 'PZ', ua: "86 Ni Комбінований робочий кінець Vario", ru: "86 Ni Комбинированный рабочий конец Vario" },
  "87 Ni Комбинированный рабочий конец, TX 10 x TX 15 x 175 мм": { src: '05136607001_p4_13', file: 'wera_87_ni.png', group: 'TX', ua: "87 Ni Комбінований робочий кінець Vario", ru: "87 Ni Комбинированный рабочий конец Vario" },
  "81 Ni Комбинированный рабочий конец, 0.6 мм x 4 мм x 1 мм x 6 мм x 175 мм": { src: '05136607001_p5_2', file: 'wera_81_ni.png', group: 'SL', ua: "81 Ni Комбінований робочий кінець Vario", ru: "81 Ni Комбинированный рабочий конец Vario" },
  "822 Ручка-битодержатель, 4 мм x 78 мм": { src: '05136607001_p5_4', file: 'wera_822.png', group: 'c:HANDLE', ua: "822 Ручка-тримач", ru: "822 Ручка-битодержатель" },
  "05136607001|мм": { src: '05136607001_p5_11', file: 'wera_1440_adk23.png', group: 'c:ACC', ua: "1440 Фіксатор гвинтів ADK 2023", ru: "1440 Фиксатор винтов ADK 2023" },
  "Складная сумка ADK 2023, 200 мм x 95 мм": { src: '05136607001_p5_12', file: 'wera_adk23_bag.png', group: 'c:ACC', ua: "Складна сумка ADK 2023", ru: "Складная сумка ADK 2023" },
  "Открывашка ADK 2023, 145": { src: '05136607001_p5_13', file: 'wera_adk23_opener.png', group: 'c:ACC', ua: "Відкривачка ADK 2023", ru: "Открывашка ADK 2023" },
  // Bicycle sets 05004183001 / 05004172001 / 05073220001 — the same WERA files as in the other bicycle sets
  "8001 A Bit Ratchet 1/4\", 1/4\" x 87 мм": { src: 'reuse', file: 'wera_8001_a.png', group: 'c:RATCHET', ua: "8001 A Тріскачка для біт Bit Ratchet 1/4″", ru: "8001 A Трещотка для бит Bit Ratchet 1/4″" },
  "3899/4/1 Универсальный держатель, нержавеющая сталь, 1/4\" x 100 мм": { src: 'reuse', file: 'wera_3899_4_1.png', group: 'c:ACC', ua: "3899/4/1 Універсальний тримач, нержавіюча сталь", ru: "3899/4/1 Универсальный держатель, нержавеющая сталь" },
  "9502 Лопатка-монтировка с битодержателем, 105 мм": { src: 'reuse', file: 'wera_9502.png', group: 'c:ACC', ua: "9502 Лопатка-монтажка з бітотримачем", ru: "9502 Лопатка-монтировка с битодержателем" },
  "9503 Лопатка-монтировка с узлом для вывинчивания ниппеля, 105 мм": { src: 'reuse', file: 'wera_9503.png', group: 'c:ACC', ua: "9503 Лопатка-монтажка з вузлом для викручування ніпеля", ru: "9503 Лопатка-монтировка с узлом для вывинчивания ниппеля" },
  "9513 Выжимка цепи": { src: 'reuse', file: 'wera_9513.png', group: 'c:ACC', ua: "9513 Вичавка ланцюга", ru: "9513 Выжимка цепи" },
  "9512 Крючок для цепи": { src: 'reuse', file: 'wera_9512.png', group: 'c:ACC', ua: "9512 Гачок для ланцюга", ru: "9512 Крючок для цепи" },
  "9481 Сумка для инструментов, 203 мм x 85 мм": { src: 'reuse', file: 'wera_9481.png', group: 'c:ACC', ua: "9481 Сумка для інструментів", ru: "9481 Сумка для инструментов" },
  "9480 Футляр на молнии, 90 мм x 135 мм": { src: 'reuse', file: 'wera_9480.png', group: 'c:ACC', ua: "9480 Футляр на блискавці", ru: "9480 Футляр на молнии" },
  // Kraftform Micro sets
  "867/9 Насадки для винтов IPR TORX PLUS®, 1 IPR x 44 мм x 1.5 мм": { src: '05073676001_p3_10', file: 'wera_867_9_ipr_15.png', group: 'IPR', ua: "Біти 867/9 TORX PLUS® IPR", ru: "Насадки 867/9 TORX PLUS® IPR" },
  "867/9 Насадки для винтов IPR TORX PLUS®, 1 IPR x 44 мм x 1.8 мм": { src: '05073671001_p3_14', file: 'wera_867_9_ipr_18.png', group: 'IPR', ua: "Біти 867/9 TORX PLUS® IPR", ru: "Насадки 867/9 TORX PLUS® IPR" },
  "869/9 Торцовые головки, 2.5 mm x 44 мм": { src: '05073676001_p3_16', file: 'wera_869_9_ds.png', group: 'c:SOCKET', ua: "Торцеві головки 869/9", ru: "Торцовые головки 869/9" },
  "816 RA Ручка-битодержатель с трещоткой, 1/4\" x 142 мм": { src: '05051040001_p4_2', file: 'wera_816_ra.png', group: 'c:HANDLE', ua: "816 RA Ручка-тримач з тріскачкою", ru: "816 RA Ручка-битодержатель с трещоткой" },
  "Рожковый ключ с трещеткой 6000 Joker Ring, Black Edition, 8 мм x 144 мм": { src: '05020017001_p3_1', file: 'wera_6000_joker_be.png', group: 'c:KEY', ua: "Комбінований ключ з тріскачкою 6000 Joker, Black Edition", ru: "Рожковый ключ с трещоткой 6000 Joker, Black Edition" },
  // Tool-Check Modular Set 1 / 2: nested sets — one position, group «Набори» (owner 29.10.2026)
  ", 7 предметов": { src: '05049020001_p3_2', file: 'wera_tcm_hexplus_1.png', group: 'c:SET', ua: "Набір Г-подібних ключів Tool-Check Modular Hex-Plus 1", ru: "Г-образный ключ Tool-Check Modular Hex-Plus 1" },
  "Tool-Check Modular Micro 1 bez adaptera, 21 предмет": { src: '05049020001_p3_3', file: 'wera_tcm_micro_1.png', group: 'c:SET', ua: "Tool-Check Modular Micro 1", ru: "Tool-Check Modular Micro 1" },
  "335 Шлицевая отвертка, 0.5 мм x 3 мм x 80 мм": { src: '05150128001_p3_6', file: 'wera_335.png', group: 'SL', ua: "335 Шліцева викрутка", ru: "335 Шлицевая отвёртка" },
  "9817 Ложемент серии Kraftform 300, набор отверток 1, без инструментов, 172 мм x 30 мм x 392 мм": { src: '05150128001_p3_7', file: 'wera_9817.png', group: 'c:ACC', ua: "9817 Ложемент Kraftform 300 для набору викруток 1, без інструментів", ru: "9817 Ложемент серии Kraftform 300, набор отвёрток 1, без инструментов" },
  "867/1 TORX® HF Насадки с фиксирующей функцией, TX 20 x 25 мм": { src: 'reuse', file: 'wera_867_1_torx_hf.png', group: 'TX', ua: "Біти TORX® 867/1 HF з фіксуючою функцією", ru: "Насадки TORX® 867/1 HF с фиксирующей функцией" },
  "867/1 TORX® HF Насадки с фиксирующей функцией, TX 25 x 25 мм": { src: 'reuse', file: 'wera_867_1_torx_hf.png', group: 'TX', ua: "Біти TORX® 867/1 HF з фіксуючою функцією", ru: "Насадки TORX® 867/1 HF с фиксирующей функцией" },
  // 05136601001 Christmas calendar 2020, pages 4–5 (8740 A: the datasheet picture shows the size 2 engraving — noted for the owner)
  "8740 A Отверточная головка Zyklop с приводом 1/4\", 4 mm x 28 мм": { src: '05136601001_p4_6', file: 'wera_8740_a.png', group: 'HEX', ua: "Викруткова головка Zyklop 8740 A 1/4″, шестигранна", ru: "Отвёрточная головка Zyklop 8740 A 1/4″, шестигранная" },
  "818/1 Stubby, 1/4\" x 65 мм": { src: '05136601001_p4_12', file: 'wera_818_1_stubby.png', group: 'c:HANDLE', ua: "818/1 Stubby Ручка-тримач 1/4″", ru: "818/1 Stubby Ручка-битодержатель 1/4″" },
  "323 Открывалки Stubby, 104 мм": { src: '05136601001_p5_3', file: 'wera_323_stubby.png', group: 'c:ACC', ua: "323 Відкривачка Stubby", ru: "323 Открывалка Stubby" },
  "Текстильная коробка pождественский календарь2020, 131.5 мм x 40 мм x 110 мм": { src: '05136601001_p5_4', file: 'wera_adk20_box.png', group: 'c:ACC', ua: "Текстильна коробка «Різдвяний календар 2020»", ru: "Текстильная коробка «Рождественский календарь 2020»" },
};
(async () => { const J = JSON.parse(fs.readFileSync(F, 'utf8')); J.heads = J.heads || {};
  for (const [head, e] of Object.entries(H)) { const out = path.join(DIR, e.file);
    if (!fs.existsSync(out)) { if (e.src === 'reuse') throw new Error('reuse file missing: ' + e.file); const pad = await sharp(path.join(IMG, e.src + '.png')).flatten({ background: '#ffffff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#ffffff' }).png().toBuffer();
      const c = (await cut(pad, { noise: 1, hi: 3, grad: 2, holeMin: 1 })).png;
      fs.writeFileSync(out, await sharp(c).trim({ threshold: 0 }).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()); }
    J.heads[head] = { group: e.group, ua: e.ua, ru: e.ru, file: e.file, src: 'datasheet ' + e.src, uploaded: (J.heads[head] || {}).uploaded || false }; }
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); console.log('heads', Object.keys(J.heads).length); })();
