// Zoom sheet: the handle end (right half) of our main photo next to the WERA datasheet picture of the same article — to read the size engraving and the
// colour ring by eye (owner 27.10.2026, rule А.3: a picture with an engraved size only for the product of that size). Two products per row.
//   node photos_audit/zoom_sheet.js <cmp work dir> <out.jpg> <art> [art ...]
const sharp = require('sharp'); const fs = require('fs'), path = require('path'), crypto = require('crypto'); const [, , WORK, OUT, ...arts] = process.argv;
const c = JSON.parse(fs.readFileSync(path.join(WORK, 'cmp.json'), 'utf8')); const cf = u => path.join(WORK, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const label = (t, w) => Buffer.from(`<svg width="${w}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="4" y="16" font-family="Arial" font-size="16" fill="#fff">${t}</text></svg>`);
const W = 450, H = 100, ROW = 22 + H + 6;
(async () => { const ims = [];
  for (const [n, a] of arts.entries()) { const x0 = (n % 2) * (2 * W + 30), y = Math.floor(n / 2) * ROW; ims.push({ input: label(`${a}  (наше | паспорт WERA)`, 2 * W + 10), left: x0, top: y });
    for (const [i, f] of [cf(c[a].ours), path.join(WORK, 'ds', a + '.png')].entries()) { if (!fs.existsSync(f)) continue;
      const b = await sharp(f).flatten({ background: '#fff' }).trim().resize(900).toBuffer(); const m = await sharp(b).metadata();
      ims.push({ input: await sharp(b).extract({ left: 450, top: 0, width: 450, height: m.height }).resize(W, H, { fit: 'contain', background: '#fff' }).toBuffer(), left: x0 + i * (W + 10), top: y + 22 }); } }
  await sharp({ create: { width: 4 * W + 50, height: Math.ceil(arts.length / 2) * ROW, channels: 3, background: '#666' } }).composite(ims).jpeg({ quality: 82 }).toFile(OUT); console.log(OUT); })();
