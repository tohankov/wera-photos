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
};
(async () => { const J = JSON.parse(fs.readFileSync(F, 'utf8')); J.heads = J.heads || {};
  for (const [head, e] of Object.entries(H)) { const out = path.join(DIR, e.file);
    if (!fs.existsSync(out)) { const pad = await sharp(path.join(IMG, e.src + '.png')).flatten({ background: '#ffffff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#ffffff' }).png().toBuffer();
      const c = (await cut(pad, { noise: 1, hi: 3, grad: 2, holeMin: 1 })).png;
      fs.writeFileSync(out, await sharp(c).trim({ threshold: 0 }).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()); }
    J.heads[head] = { group: e.group, ua: e.ua, ru: e.ru, file: e.file, src: 'datasheet ' + e.src, uploaded: (J.heads[head] || {}).uploaded || false }; }
  fs.writeFileSync(F, JSON.stringify(J, null, 1)); console.log('heads', Object.keys(J.heads).length); })();
