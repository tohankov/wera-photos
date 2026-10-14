// Contact sheets of the picked photos (items 7-8) for a visual check: inventory/sheet78_<n>.jpg, 6 columns, label = article + datasheet title.
const fs = require('fs'), sharp = require('sharp'), path = require('path');
const { pick } = require('./pick78.json'); const DS = path.join(__dirname, '../batch/ds');
const arts = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : Object.keys(pick);
const title = a => fs.readFileSync(path.join(DS, a + '.txt'), 'utf8').split('\n')[0].slice(3, 60).replace(/[<>&"]/g, '');
const C = 6, W = 300, Hh = 300, per = +process.argv[2] || 36;
(async () => {
  for (let s = 0; s * per < arts.length; s++) {
    const part = arts.slice(s * per, s * per + per); const rows = Math.ceil(part.length / C);
    const comp = [];
    for (const [i, a] of part.entries()) {
      const img = await sharp(path.join(DS, pick[a])).resize(W - 10, Hh - 50, { fit: 'contain', background: '#fff' }).toBuffer();
      const x = (i % C) * W, y = Math.floor(i / C) * Hh;
      comp.push({ input: img, left: x + 5, top: y + 5 });
      const svg = `<svg width="${W}" height="44"><text x="4" y="16" font-size="14" font-family="Arial" font-weight="bold">${a}</text><text x="4" y="36" font-size="11" font-family="Arial">${title(a).slice(0, 48)}</text></svg>`;
      comp.push({ input: Buffer.from(svg), left: x, top: y + Hh - 46 });
    }
    const f = `C:/Users/Techlight/Desktop/wera-photos/inventory/sheet78_${s + 1}.jpg`;
    await sharp({ create: { width: C * W, height: rows * Hh, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 80 }).toFile(f); console.log(f);
  }
})();
