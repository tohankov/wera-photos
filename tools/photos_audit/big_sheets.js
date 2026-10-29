// Large review sheets of cut-outs on the site's dark background (28.10.2026: a 300 px thumbnail hides an eaten light edge) — 12 per sheet, 400 px cells.
//   node photos_audit/big_sheets.js <cut dir> <out dir> [art ...]   (no articles — every PNG of the dir)
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const [, , CUT, OUT, ...only] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const arts = only.length ? only : fs.readdirSync(CUT).filter(f => /\.png$/.test(f)).map(f => f.slice(0, -4)).sort();
(async () => { const C = 400, COLS = 3, PER = 12;
  for (let s = 0; s * PER < arts.length; s++) { const part = arts.slice(s * PER, s * PER + PER); const comp = [];
    for (const [i, a] of part.entries()) { const x = (i % COLS) * C, y = ((i / COLS) | 0) * (C + 22);
      comp.push({ input: await sharp(path.join(CUT, a + '.png')).resize(C - 10, C - 10, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: x + 5, top: y + 5 });
      comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="22"><text x="6" y="16" font-family="Arial" font-size="14" fill="#9a9a9a">${s * PER + i + 1}. ${a}</text></svg>`), left: x, top: y + C }); }
    await sharp({ create: { width: C * COLS, height: Math.ceil(part.length / COLS) * (C + 22), channels: 3, background: '#191816' } }).composite(comp).jpeg({ quality: 88 }).toFile(path.join(OUT, `b_${String(s + 1).padStart(2, '0')}.jpg`)); }
  console.log('sheets', Math.ceil(arts.length / PER), 'items', arts.length); })();
