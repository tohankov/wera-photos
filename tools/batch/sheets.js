// Contact sheets of the datasheet product photo for each remaining group-А article, ordered by series, with the size the datasheet title expects.
// node sheets.js -> batch/sheet_NN.jpg (12 per sheet) + photos.json {art: file}
const sharp = require('sharp'), fs = require('fs');
const T = require('../a422/tables.json');
const list = require('./list.json');
const title = a => (fs.readFileSync(`ds/${a}.txt`, 'utf8').match(/^p1 (.+)$/m) || [])[1] || '';
// product photo = largest embedded JPEG except the 1587x752 header banner and small pictograms
const photo = a => fs.readdirSync('ds').filter(f => f.startsWith(a + '_') && f.endsWith('.jpg')).map(f => { const [w, h] = f.match(/_(\d+)x(\d+)\.jpg$/).slice(1).map(Number); return { f, w, h }; })
  .filter(x => !(x.w === 1587 && x.h === 752) && Math.max(x.w, x.h) >= 300).sort((x, y) => y.w * y.h - x.w * x.h)[0];
(async () => {
  const items = list.map(a => ({ a, t: title(a), p: photo(a), key: T[a].unlinked.slice().sort().join(',') })).sort((x, y) => x.key.localeCompare(y.key) || x.t.localeCompare(y.t, 'ru', { numeric: true }));
  fs.writeFileSync('photos.json', JSON.stringify(Object.fromEntries(items.map(i => [i.a, i.p ? i.p.f : null])), null, 1));
  fs.writeFileSync('order.json', JSON.stringify(items.map(i => ({ a: i.a, t: i.t }))));
  for (let s = 0; s * 12 < items.length; s++) {
    const part = items.slice(s * 12, s * 12 + 12), comp = []; let y = 0;
    for (const it of part) {
      comp.push({ input: Buffer.from(`<svg width="1200" height="34"><text x="6" y="26" font-size="22" font-family="Arial" fill="#c00">${it.a}  —  ${it.t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`), left: 0, top: y }); y += 36;
      if (!it.p) { comp.push({ input: Buffer.from('<svg width="600" height="40"><text x="6" y="28" font-size="24" fill="#000">НЕТ ФОТО В ДАТАШИТЕ</text></svg>'), left: 0, top: y }); y += 44; continue; }
      const img = await sharp('ds/' + it.p.f).resize({ width: 1150, height: 260, fit: 'inside' }).toBuffer(); const m = await sharp(img).metadata();
      comp.push({ input: img, left: 0, top: y }); y += m.height + 10;
    }
    await sharp({ create: { width: 1200, height: y, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 82 }).toFile(`sheet_${String(s + 1).padStart(2, '0')}.jpg`);
    console.log('sheet', s + 1, part.length, part[0].t.slice(0, 40));
  }
})();
