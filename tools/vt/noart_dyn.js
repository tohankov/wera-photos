// «Динамометричний інструмент» sets (11.11.2026) — positions without our product, rule В:
//  - 7443/61/9 05074745001 and 7443/12 05074746001 have no wera.de page (404): the pictures are cut out of their datasheets
//    (lib/ds_images_all.mjs <dir> 05074745001 05074746001 -> <art>_p3_N.png; mapped by eye, sheet scratchpad tireimg/sheet.jpg);
//  - 8894 SC (Click-Torque C 3 Set 2 05075681001, Lock C 3 Set 1 05075790001): the WERA picture of the wera.de row.
//  Names: RU — the datasheet head, UA — ours. Merged into vt/noart.json (heads / arts / names); files -> images/setblock_wera/ for the owner.
//   node vt/noart_dyn.js <dir of ds_images_all>
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , IMG] = process.argv; const DIR = path.join(__dirname, '../../images/setblock_wera/'); const F = path.join(__dirname, 'noart.json');
const H = {
  '300 TX Динамометрический индикатор TORX®, TX 10 x 1.4 нм': ['c:TORQUE', 'Індикатор крутного моменту 300 TX', 'Индикатор крутящего момента 300 TX', '05074745001_p3_6', 'wera_ds_300_tx_10.png'],
  '300 TX Динамометрический индикатор TORX®, TX 10 x 1.25 нм': ['c:TORQUE', 'Індикатор крутного моменту 300 TX', 'Индикатор крутящего момента 300 TX', '05074746001_p3_6', 'wera_ds_300_tx_10b.png'],
  '790 A/50 Вставки торцевых ключей, 11 мм x 50 мм': ['c:SOCKET', 'Торцеві головки 790 A/50', 'Торцевые головки 790 A/50', '05074745001_p3_10', 'wera_ds_790_a_50.png'],
  '867/4 TORX® HF Насадки, TX 15 x 50 мм': ['TX', 'Біти TORX® 867/4 HF з фіксуючою функцією', 'Биты TORX® 867/4 HF с фиксирующей функцией', '05074745001_p3_12', 'wera_ds_867_4_hf.png'],
  'быстрозажимным патроном Rapidaptor, длина ручки 89 мм, 7464 x 3,3 Nm x 3,0-6,0 Nm': ['c:TORQUE', 'Динамометрична викрутка Kraftform 7464', 'Динамометрическая отвёртка Kraftform 7464', '05074746001_p3_4', 'wera_ds_7464.png'],
  '300 V Держатель клапана, 0,25 Nm': ['c:TORQUE', 'Тримач клапана 300 V', 'Держатель клапана 300 V', '05074746001_p3_14', 'wera_ds_300_v.png'] };
// an article of the datasheet that is not ours (comp_state «not ours») — vt/noart.json «arts»
const ART = { '05160111001': ['c:ACC', 'Тримач клапана 327', 'Держатель клапана 327', '05074745001_p3_14', 'wera_ds_327.png'] };
const WN = {
  // 12.11.2026: Photovoltaic set 1 05136043001 (8790 HMC Deep with the shaft cut-out) and 3967/9 TX SXL HF Stainless 1 05022689001 — no our product
  '8790 HMC Deep Steckschlüsseleinsatz mit Ausschnitt am Schaft, mit 1/2"-Antrieb': ['c:SOCKET', 'Торцева головка Zyklop 8790 HMC Deep 1/2″ з вирізом на хвостовику', 'Торцевая головка Zyklop 8790 HMC Deep 1/2″ с вырезом на хвостовике', 'https://www.wera.de/prodimg/480x480/8790_hmc_deep_open.webp', 'wera_8790_hmc_deep_open.png'],
  '3967 SXL TORX® HF Winkelschlüssel Multicolour mit Haltefunktion, lang, Edelstahl': ['TX', 'Г-подібний ключ 3967 SXL TORX® HF Multicolour з фіксуючою функцією, подовжений, нержавіюча сталь', 'Г-образный ключ 3967 SXL TORX® HF Multicolour с фиксирующей функцией, удлинённый, нержавеющая сталь', 'https://www.wera.de/prodimg/480x480/3967_sxl_hf_torx_multicolour.webp', 'wera_3967_sxl_hf_torx_multicolour.png'],
  // 12.11.2026: 2090/17 05072017001 (Ударні) — bits without our product
  '800/2 Schlitz-Bits': ['SL', 'Біти шліцеві 800/2', 'Биты шлицевые 800/2', 'https://www.wera.de/prodimg/480x480/800_2.webp', 'wera_800_2.png'],
  '840/2 Innensechskant-Bits': ['HEX', 'Біти шестигранні 840/2', 'Биты шестигранные 840/2', 'https://www.wera.de/prodimg/480x480/840_2.webp', 'wera_840_2.png'],
  '8894 SC Verlängerung, kurz, 1/2"': ['c:ACC', '8894 SC Подовжувач короткий, 1/2″', '8894 SC Удлинитель короткий, 1/2″', 'https://www.wera.de/prodimg/480x480/8894_sc.webp', 'wera_8894_sc.png'] };
const save = async (buf, file, pad) => { let b = buf; if (pad) b = await sharp(buf).flatten({ background: '#fff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#fff' }).png().toBuffer();
  const t = await sharp((await cut(b)).png).trim().png().toBuffer(); await sharp(t).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(DIR, file)); };
(async () => { const J = JSON.parse(fs.readFileSync(F, 'utf8')); J.heads = J.heads || {};
  const put = async (obj, key, [group, ua, ru, src, file]) => { const web = /^https:/.test(src); obj[key] = { group, ua, ru, file, src: web ? src : 'datasheet ' + src };
    if (fs.existsSync(path.join(DIR, file))) return; if (web) { const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } }); await save(Buffer.from(await r.arrayBuffer()), file, false); }
    else await save(fs.readFileSync(path.join(IMG, src + '.png')), file, true); };
  for (const [k, v] of Object.entries(H)) await put(J.heads, k, v); for (const [k, v] of Object.entries(ART)) await put(J.arts, k, v); for (const [k, v] of Object.entries(WN)) await put(J.names, k, v);
  // wera.de rows WITH an article that is not ours are looked up by the article (setblock_plan: NA.arts)
  const BYART = { '05138007001': '8790 HMC Deep Steckschlüsseleinsatz mit Ausschnitt am Schaft, mit 1/2"-Antrieb' };
  for (let i = 0; i <= 8; i++) BYART['0502268' + i + '001'] = '3967 SXL TORX® HF Winkelschlüssel Multicolour mit Haltefunktion, lang, Edelstahl';
  for (const [a, w] of Object.entries(BYART)) J.arts[a] = { ...J.names[w] };
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); console.log('heads', Object.keys(H).length, 'arts', Object.keys(ART).length, 'names', Object.keys(WN).length); })();
