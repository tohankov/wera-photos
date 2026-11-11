// «Інструментальний візок та ложементи» (1055) — positions of other brands in the inlays (owner 11.11.2026, as Wera 2go SHK 1):
//  KNIPEX — our product on techlight-shop.com.ua, EXACT article only (vt/knx_find.js; «95 05 155 SB», «70 06 160 T» are other articles) -> h1 UA / /ru/,
//  link, main photo without background (the RU h1 empty -> the datasheet head); not there -> the WERA picture of the wera.de row, no link.
//  Other brands (PICARD, RENNSTEIG, PFERD, STABILA) and the bottle opener 05030005001 — the WERA picture of the wera.de row, no link.
//  Entries both by the datasheet head (heads) and by the wera.de name (names) — a set takes one or the other composition. Merged into vt/noart.json.
//   node vt/noart_trol.js
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js'); const get = require('./fetchpage.js');
const DIR = path.join(__dirname, '../../images/setblock_wera/'); const F = path.join(__dirname, 'noart.json'); const sleep = ms => new Promise(r => setTimeout(r, ms)); const WI = 'https://www.wera.de/prodimg/480x480/';
const KNX = { '03 05 180': '/ploskohubtsi-kombinovani-knipex-03-05-180/', '87 05 250': '/vysokotekhnolohichni-santekhnichni-klishchi-cobra-knipex-87-05-250/',
  '74 05 160': '/kusachky-bokovi-osoblyvoi-potuzhnosti-knipex-74-05-160/', '26 15 200': '/ploski-kruhlohubtsi-z-rizhuchymy-kraikamy-knipex-26-15-200/',
  '38 25 200': '/ploskohubtsi-mekhanika-knipex-38-25-200/', '70 06 160': '/kusachky-bokovi-knipex-70-06-160/' };
const RUH = { '03 05 180': 'Плоскогубцы комбинированные KNIPEX 03 05 180, 180 мм', '87 05 250': 'Сантехнические клещи KNIPEX Cobra® 87 05 250, 250 мм', '74 05 160': 'Боковые кусачки особой мощности KNIPEX 74 05 160, 160 мм',
  '26 15 200': 'Длинногубцы с режущей кромкой KNIPEX 26 15 200, 200 мм', '38 25 200': 'Плоскогубцы механика KNIPEX 38 25 200, 200 мм', '70 06 160': 'Боковые кусачки KNIPEX 70 06 160' };
const WPICK = { '03 05 180': 'knipex_kombizange_03_05_180.webp', '87 05 250': 'knipex_cobra_hightech_wasserpumpenzange_87_05_250.webp', '74 05 160': 'knipex_kraft-seitenschneider_74_05_160.webp',
  '26 15 200': 'knipex_flachrundzange_mit_schneide__storchschnabelzange__26_15_200.webp', '38 25 200': 'knipex_mechanikerzange_38_25_200.webp', '70 06 160': 'knipex_seitenschneider_70_06_160.webp' };
const WKNX = { '95 05 155': { src: WI + 'knipex_elektrikerschere_95_05_155.webp', ua: 'KNIPEX 95 05 155 Ножиці електрика, 155 мм', ru: 'Ножницы электрика KNIPEX 95 05 155, 155 мм' } };
// [group, UA, RU, wera.de picture, datasheet head(s), wera.de name]
const P = [
  ['METAL', 'Молоток слюсарний PICARD® 500 г, 0000101-500', 'Молоток слесарный PICARD® 500 г, 0000101-500', 'picard_schlosserhammer_500_g__0000101-500.webp', ['Молоток слесарный PICARD® 500 г, 0000101-500, 500 gr'], 'PICARD® Schlosserhammer 500 g, 0000101-500'],
  ['METAL', 'Виколотки для шплінтів RENNSTEIG Exklusiv, 452 003 6 RC', 'Выколотки для шплинтов RENNSTEIG Exklusiv, 452 003 6 RC', 'rennsteig_splintentreiber_exklusiv.webp', ['Bыколотки для шплинтов RENNSTEIG Exklusiv, 452 003 6 RC x 3 мм x 150 мм'], 'RENNSTEIG Splintentreiber Exklusiv'],
  ['METAL', 'Плоске зубило RENNSTEIG 310 250 1', 'Плоское зубило RENNSTEIG 310 250 1', 'rennsteig_flachmeissel_310_250_1.webp', ['Плоское зубило RENNSTEIG 310 250 1, 25 мм x 13 мм x 23 мм'], 'RENNSTEIG Flachmeißel 310 250 1'],
  ['FILE', 'Напилок квадратний PFERD PF1142 250 H2', 'Напильник квадратный PFERD PF1142 250 H2', 'pferd_werkstattfeile_vierkant_pf1142_250_h2.webp', ['Напильник квадратный PFERD PF1142 250 H2, 250'], 'PFERD Werkstattfeile vierkant PF1142 250 H2'],
  ['FILE', 'Напилок напівкруглий PFERD 1152SP 250 H2', 'Напильник полукруглый PFERD 1152SP 250 H2', 'pferd_werkstattfeile_halbrund-spitz_1152sp_250_h2.webp', ['Напильник полукруглый PFERD 1152SP 250 H2, 250'], 'PFERD Werkstattfeile halbrund-spitz 1152SP 250 H2'],
  ['FILE', 'Напилок круглий PFERD 1162 250 H2', 'Напильник круглый PFERD 1162 250 H2', 'pferd_werkstattfeile_rund_1162_250_h2.webp', ['Напильник круглый PFERD 1162 250 H2, 250'], 'PFERD Werkstattfeile rund 1162 250 H2'],
  ['FILE', 'Напилок плоский PFERD 1112 250 H2', 'Напильник плоский PFERD 1112 250 H2', 'pferd_werkstattfeile_flachstumpf_1112_250_h2.webp', ['Напильник плоский PFERD 1112 250 H2, 250'], 'PFERD Werkstattfeile flachstumpf 1112 250 H2'],
  ['FILE', 'Напилок тригранний PFERD 1132 250 H2', 'Напильник трёхгранный PFERD 1132 250 H2', 'pferd_werkstattfeile_dreikant_1132_250_h2.webp', ['Напильник трёхгранный PFERD 1132 250 H2, 250'], 'PFERD Werkstattfeile dreikant 1132 250 H2'],
  ['FILE', 'Щітка PFERD HBF для очищення напилків, сталевий дріт Ø 0,30', 'Щётка PFERD HBF для очистки напильников, стальная проволока Ø 0,30', 'pferd_feilenbuerste_hbf_stahl-draht_ø_0_30.webp', ['Щётка PFERD HBF, для очистки напильников, стальная проволока Ø 0,30, 232'], 'PFERD Feilenbürste HBF Stahl-Draht Ø 0,30'],
  ['MEASURE', 'STABILA® кишенькова рулетка BM 100, 3 м, 19570', 'STABILA® карманная рулетка BM 100, 3 м, 19570', 'stabila_taschenbandmass.webp', [], 'STABILA® Taschenbandmaß BM 100, 3 m, Artikel 19570'] ];
const ART = { '05030005001': ['ACC', 'Відкривачка Wera Kraftform', 'Открывашка Wera Kraftform', 'flaschenoeffner___bottle_opener.webp', 'Flaschenöffner'] };
const fileOf = w => 'wera_' + w.replace(/\.webp$/, '.png').replace(/ø/g, 'o');
const save = async (buf, file, pad) => { let b = buf; if (pad) b = await sharp(buf).flatten({ background: '#fff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#fff' }).png().toBuffer();
  const t = await sharp((await cut(b)).png).trim().png().toBuffer(); await sharp(t).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(DIR, file)); };
const fetchBuf = async u => { await sleep(1200); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return Buffer.from(await r.arrayBuffer()); };
const USE_WERA_PIC = new Set((process.env.WPIC || '03 05 180,87 05 250,74 05 160,26 15 200,38 25 200,70 06 160').split(',').filter(Boolean));   // 11.11.2026: all 6 — white residue on the techlight JPEGs   // KNIPEX whose techlight photo cuts badly -> WERA picture (decided by eye on the sheet)
(async () => { const J = JSON.parse(fs.readFileSync(F, 'utf8')); J.heads = J.heads || {}; const miss = [];
  for (const [k, p] of Object.entries(KNX)) { const file = 'knipex_' + k.replace(/ /g, '_') + '.png'; const e = { group: 'c:PLIERS', file, href: { ua: 'https://techlight-shop.com.ua' + p, ru: 'https://techlight-shop.com.ua/ru' + p } };
    for (const l of ['ua', 'ru']) { await sleep(1500); const h = (await get(e.href[l])).html; e[l] = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
      if (l === 'ua') e.src = ((h.match(/property="og:image" content="([^"]+)"/) || [])[1] || ''); }
    if (!e.ru) e.ru = RUH[k]; if (!e.ua || !e.src) { miss.push('KNIPEX ' + k); continue; }
    if (USE_WERA_PIC.has(k)) { e.src = WI + WPICK[k]; if (fs.existsSync(path.join(DIR, file))) fs.unlinkSync(path.join(DIR, file)); }
    if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(e.src), file, !USE_WERA_PIC.has(k)); J.knipex[k] = e; }
  for (const [k, w] of Object.entries(WKNX)) { const file = 'knipex_' + k.replace(/ /g, '_') + '.png'; J.knipex[k] = { group: 'c:PLIERS', file, ua: w.ua, ru: w.ru, src: w.src };
    if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(w.src), file, false); }
  for (const [g, ua, ru, pic, heads, wname] of P) { const file = fileOf(pic); const e = { group: 'c:' + g, ua, ru, file, src: WI + pic };
    for (const h of heads) J.heads[h] = e; J.names[wname] = e; if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(WI + pic), file, false); }
  for (const [a, [g, ua, ru, pic, wname]] of Object.entries(ART)) { const file = fileOf(pic); const e = { group: 'c:' + g, ua, ru, file, src: WI + pic }; J.arts[a] = e; J.names[wname] = e;
    if (!fs.existsSync(path.join(DIR, file))) await save(await fetchBuf(WI + pic), file, false); }
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); console.log('knipex', Object.keys(KNX).length + Object.keys(WKNX).length, 'other', P.length + Object.keys(ART).length, '| problems', miss); })();
