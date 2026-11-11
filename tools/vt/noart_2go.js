// Wera 2go SHK 1 (05136071001), E 1 (05134025001), H 1 (05134011001) — positions of other brands (owner 11.11.2026):
//  KNIPEX — our product on techlight-shop.com.ua (h1 UA / /ru/, link, main photo without background), only on the EXACT article (vt/knx_find.js;
//  «87 26 250 T» / «16 95 01 SB» are other articles); else the WERA picture of the wera.de row, no link. Other brands — the WERA picture without a link:
//  the wera.de row (SHK 1 / E 1), H 1 has no wera.de page (404) — cut out of its datasheet (lib/ds_images_all.mjs <dir> 05134011001: page_n below).
//  Names: RU — the datasheet head, UA — ours. Merged into vt/noart.json (knipex / heads); files -> images/setblock_wera/ for the owner to upload.
//   node vt/noart_2go.js <dir of ds_images_all for 05134011001>
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js'); const get = require('./fetchpage.js');
const [, , IMG] = process.argv; const DIR = path.join(__dirname, '../../images/setblock_wera/'); const F = path.join(__dirname, 'noart.json'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const WI = 'https://www.wera.de/prodimg/480x480/';
const KNX = { '03 01 160': '/ploskohubtsi-kombinovani-knipex-03-01-160/', '14 26 160': '/kusachky-bichni-dlia-vydalennia-izoliatsii-knipex-14-26-160/',
  '01 06 160': '/ploskohubtsi-kombinovani-khrom-vanadiievi-knipex-01-06-160/', '26 16 200': '/ploski-kruhlohubtsi-z-rizhuchymy-kraikamy-knipex-26-16-200/',
  '98 52': '/rizak-dlia-kabeliv-knipex-98-52/', '50 00 210': '/klishchi-tesliarski-knipex-50-00-210/' };
// the techlight-shop photo of these is a JPEG with a light reflection — the cut eats the chrome jaw / leaves a white band (11.11.2026, sheet):
// the picture is the WERA photo of the same KNIPEX article (wera.de E 1 row); name and link stay techlight-shop
const WPIC = { '14 26 160': 'knipex_abisolier-seitenschneider_14_26_160.webp', '01 06 160': 'knipex_kombizange_160_mm_01_06_160.webp', '26 16 200': 'knipex_flachrundzange_mit_schneide__storchschnabelzange__26_16_200.webp' };
const RUH = { '14 26 160': 'KNIPEX боковые кусачки 14 26 160', '98 52': 'KNIPEX нож для кабеля 98 52', '50 00 210': 'KNIPEX клещи плотницкие 210 мм 50 00 210' };
const WKNX = { '87 11 250': { src: WI + 'knipex_wasserpumpenzange_cobra_250_mm_87_11_250.webp', ua: 'KNIPEX Cobra® 87 11 250 Сантехнічні кліщі 250 мм', ru: 'KNIPEX клещи сантехнические COBRA® 250 мм 87 11 250' },
  '001104': { group: 'c:KEY', src: WI + 'knipex_profi-key_fuer_gaengige_absperrsysteme.webp', ua: 'Ключ KNIPEX Profi-Key 001104 для більшості систем замикання', ru: 'Ключ KNIPEX Profi-Key 001104 для большинства систем запирания' },
  '87 26 250': { src: WI + 'knipex_cobra_vde_hightech_wasserpumpenzange__isoliert__87_26_250.webp', ua: 'KNIPEX Cobra® VDE сантехнічні кліщі, ізольовані 87 26 250', ru: 'KNIPEX Cobra® VDE сантехнические клещи, изолированные 87 26 250' },
  '16 95 01': { src: WI + 'knipex_ergostrip_universal-abmantelungswerkzeug_16_95_01.webp', ua: 'KNIPEX ErgoStrip® інструмент для видалення ізоляції 16 95 01', ru: 'KNIPEX ErgoStrip® инструмент для удаления изоляции 16 95 01' } };
// datasheet head -> group, UA, picture (wera.de file or the H 1 datasheet picture «p5_2»)
const H = {
  'STABILA® строительный уровень тип 70, 30 см, 02281': ['MEASURE', 'STABILA® будівельний рівень тип 70, 30 см, 02281', 'stabila_wasserwaage_type_70__30_cm__02281.webp'],
  'STABILA® складной метр тип 607, 2 м, светло-жёлтый, 01104': ['MEASURE', 'STABILA® складаний метр тип 607, 2 м, світло-жовтий, 01104', 'stabila_holz-gliedermassstab_type_607__2_m__hellgelb__01104.webp'],
  'STABILA® строительный уровень, карманный 17775': ['MEASURE', 'STABILA® будівельний рівень, кишеньковий 17775', 'stabila_wasserwaage_pocket_electric_17775.webp'],
  'Lyra® маркер для глубоких отверстий DRY PROFI 4494202': ['MEASURE', 'Lyra® маркер для глибоких отворів DRY PROFI 4494202', 'lyra_tiefloch-markierer_4494202.webp'],
  'PICARD® слесарный молоток 400 г, немецкая форма, 000101-0400': ['HAMMER', 'PICARD® слюсарний молоток 400 г, німецька форма, 000101-0400', 'picard_schlosserhammer_400_g__deutsche_form__000101-0400.webp'],
  'PUK® 2200 мини-ножовка': ['CUT', 'PUK® 2200 міні-ножівка', 'puk_2200_kleinsaegebogen.webp'],
  'Складной нож BESSEY® DBKPH-EU': ['CUT', 'Складаний ніж BESSEY® DBKPH-EU', 'bessey_klingen_klappmesser_dbkph-eu.webp'],
  'Чашка для раствора, Jung, 127 мм, 946 127 00': ['ACC', 'Чашка для розчину, Jung, 127 мм, 946 127 00', 'jung_gipsbecher__127_mm__946_127_00.webp'],
  'Шпатель малярный с деревянной ручкой, Jung 922 050 00': ['ACC', "Шпатель малярний з дерев'яною ручкою, Jung 922 050 00", 'jung_malerspachtel_mit_naturholzheft__922_050_00.webp'],
  // H 1 — the datasheet pictures (pages 4–5)
  'Bit-Safe 61 Wood 1, 61 предмет': ['SET', 'Bit-Safe 61 Wood 1, 61 предмет', 'p4_3', 'wera_bit_safe_61_wood_1.png'],
  'Stabila® строительный уровень тип 81 25 см 02500 Torpedo': ['MEASURE', 'Stabila® будівельний рівень тип 81, 25 см, 02500 Torpedo', 'p5_2', 'stabila_81_02500.png'],
  'Киянка 105 мм 52-1 P': ['HAMMER', 'Киянка 105 мм 52-1 P', 'p5_3', 'mallet_52_1_p.png'],
  'Стамеска "KIRSCHEN"® 10 мм 1001010': ['CUT', 'Стамеска «KIRSCHEN»® 10 мм 1001010', 'p5_4', 'kirschen_1001010.png'],
  'Стамеска "KIRSCHEN"® 16 мм 1001016': ['CUT', 'Стамеска «KIRSCHEN»® 16 мм 1001016', 'p5_5', 'kirschen_1001016.png'],
  'Стамеска "KIRSCHEN"® 20 мм 1001020': ['CUT', 'Стамеска «KIRSCHEN»® 20 мм 1001020', 'p5_6', 'kirschen_1001020.png'],
  'Стамеска "KIRSCHEN"® 26 мм 1001026': ['CUT', 'Стамеска «KIRSCHEN»® 26 мм 1001026', 'p5_7', 'kirschen_1001026.png'],
  'Stabila® складной метр деревянный, тип 601 N-S 2 м 18206': ['MEASURE', "Stabila® складаний метр дерев'яний, тип 601 N-S, 2 м, 18206", 'p5_8', 'stabila_601_18206.png'],
  'Picard молоток столяра 400 г, французская форма 0008501-28': ['HAMMER', 'Picard молоток столяра 400 г, французька форма 0008501-28', 'p5_9', 'picard_0008501_28.png'] };
// Wera 2go E 1 takes the wera.de composition (datasheet ≠ wera.de) — its rows are looked up by the wera.de name (vt/noart.json «names»)
const WNAME = { 'STABILA® Wasserwaage Type 70, 30 cm, 02281': 'STABILA® строительный уровень тип 70, 30 см, 02281', 'STABILA® Holz-Gliedermaßstab Type 607, 2 m, gelb, 01104': 'STABILA® складной метр тип 607, 2 м, светло-жёлтый, 01104',
  'STABILA® Wasserwaage Pocket Electric 17775': 'STABILA® строительный уровень, карманный 17775', 'Lyra® Tieflochmarkierer DRY PROFI 4494202': 'Lyra® маркер для глубоких отверстий DRY PROFI 4494202',
  'PICARD® Schlosserhammer 400 g, Deutsche Form, 000101-0400': 'PICARD® слесарный молоток 400 г, немецкая форма, 000101-0400', 'PUK® 2200 Kleinsägebogen': 'PUK® 2200 мини-ножовка',
  'BESSEY® Klingen-Klappmesser DBKPH-EU': 'Складной нож BESSEY® DBKPH-EU', 'Jung Gipsbecher, 127 mm, 946 127 00': 'Чашка для раствора, Jung, 127 мм, 946 127 00',
  'Jung Malerspachtel mit Naturholzheft, 922 050 00': 'Шпатель малярный с деревянной ручкой, Jung 922 050 00' };
const RUFIX = { 'Стамеска "KIRSCHEN"® 10 мм 1001010': 'Стамеска «KIRSCHEN»® 10 мм 1001010', 'Стамеска "KIRSCHEN"® 16 мм 1001016': 'Стамеска «KIRSCHEN»® 16 мм 1001016',
  'Стамеска "KIRSCHEN"® 20 мм 1001020': 'Стамеска «KIRSCHEN»® 20 мм 1001020', 'Стамеска "KIRSCHEN"® 26 мм 1001026': 'Стамеска «KIRSCHEN»® 26 мм 1001026' };
const save = async (buf, file, pad) => { let b = buf; if (pad) b = await sharp(buf).flatten({ background: '#fff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#fff' }).png().toBuffer();
  const c = await cut(b); const t = await sharp(c.png).trim().png().toBuffer();
  await sharp(t).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(DIR, file)); };
const fetchBuf = async u => { await sleep(1200); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return Buffer.from(await r.arrayBuffer()); };
(async () => { const J = JSON.parse(fs.readFileSync(F, 'utf8')); J.knipex = J.knipex || {}; J.heads = J.heads || {}; const miss = [];
  for (const [k, p] of Object.entries(KNX)) { const file = 'knipex_' + k.replace(/ /g, '_') + '.png'; const e = { group: 'c:PLIERS', file, href: { ua: 'https://techlight-shop.com.ua' + p, ru: 'https://techlight-shop.com.ua/ru' + p } };
    for (const l of ['ua', 'ru']) { await sleep(1500); const h = (await get(e.href[l])).html; e[l] = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
      if (l === 'ua') e.src = ((h.match(/property="og:image" content="([^"]+)"/) || [])[1] || '').replace(/\/content\/images\/(\d+)\/[^/]+\//, '/content\/images\/$1/'); }
    // techlight-shop /ru/ h1 empty (14 26 160, 98 52, 50 00 210): RU — the WERA datasheet head
    if (!e.ru) e.ru = RUH[k];
    if (!e.ua || !e.ru || !e.src) { miss.push('KNIPEX ' + k + ': h1 / photo not found'); continue; }
    if (WPIC[k]) e.src = WI + WPIC[k];
    if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(e.src), file, !WPIC[k]); J.knipex[k] = e; }
  for (const [k, w] of Object.entries(WKNX)) { const file = 'knipex_' + k.replace(/ /g, '_') + '.png'; J.knipex[k] = { group: w.group || 'c:PLIERS', file, ua: w.ua, ru: w.ru, src: w.src };
    if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(w.src), file, false); }
  for (const [head, [g, ua, src, f0]] of Object.entries(H)) { const ds = /^p\d+_\d+$/.test(src); const file = f0 || 'wera_' + src.replace(/\.webp$/, '.png');
    J.heads[head] = { group: 'c:' + g, ua, ru: RUFIX[head] || head, file, src: ds ? 'datasheet 05134011001_' + src : WI + src };
    if (fs.existsSync(path.join(DIR, file))) continue;
    if (ds) await save(fs.readFileSync(path.join(IMG, '05134011001_' + src + '.png')), file, true); else await save(await fetchBuf(WI + src), file, false); }
  for (const [w, h] of Object.entries(WNAME)) J.names[w] = { ...J.heads[h] };
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); console.log('knipex', Object.keys(KNX).length + Object.keys(WKNX).length, 'heads', Object.keys(H).length, '| problems', miss.length, miss); })();
