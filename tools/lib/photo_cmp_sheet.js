// our photos (row 1) vs WERA photos (row 2) of one product: node cmp_sheet.js <SP/g2> <art> <out.jpg>
const sharp = require('sharp'); const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , D, a, out] = process.argv; const P = require(D + '/ex/pm.json')[a]; const S = 200;
const f = u => path.join(D, 'ex/cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const lab = (t, w) => Buffer.from(`<svg width="${w}" height="18"><text x="2" y="13" font-family="Arial" font-size="11" fill="#ddd">${t.replace(/&/g, '&amp;').slice(0, 34)}</text></svg>`);
(async () => { const comp = []; const rows = [P.ours, P.wera]; const W = Math.max(P.ours.length, P.wera.length) * (S + 6);
  for (const [r, list] of rows.entries()) for (const [i, u] of list.entries()) { const x = i * (S + 6), y = r * (S + 26);
    comp.push({ input: await sharp(f(u)).flatten({ background: '#fff' }).resize(S, S, { fit: 'contain', background: '#fff' }).png().toBuffer(), left: x, top: y },
      { input: lab((r ? 'WERA ' : 'наше ') + (i + 1) + ' ' + u.split('/').pop(), S), left: x, top: y + S + 4 }); }
  await sharp({ create: { width: W, height: 2 * (S + 26), channels: 3, background: '#333' } }).composite(comp).jpeg({ quality: 85 }).toFile(out); })();
