// Review pairs «original | cut-out on the dark site background» (28.10.2026) — 8 pairs per sheet.   node photos_audit/pair_sheets.js <state.json> <cut dir> <out dir> <art ...>
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const [, , ST, CUT, OUT, ...arts] = process.argv; fs.mkdirSync(OUT, { recursive: true }); const st = JSON.parse(fs.readFileSync(ST, 'utf8'));
(async () => { const C = 380, PER = 8;
  for (let s = 0; s * PER < arts.length; s++) { const part = arts.slice(s * PER, s * PER + PER); const comp = [];
    for (const [i, a] of part.entries()) { const x = (i % 2) * (2 * C + 20), y = ((i / 2) | 0) * (C + 22);
      comp.push({ input: await sharp(st[a].orig).resize(C - 10, C - 10, { fit: 'contain', background: '#ffffff' }).png().toBuffer(), left: x + 5, top: y + 5 });
      comp.push({ input: await sharp(path.join(CUT, a + '.png')).resize(C - 10, C - 10, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: x + C + 5, top: y + 5 });
      comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="22"><text x="6" y="16" font-family="Arial" font-size="14" fill="#9a9a9a">${s * PER + i + 1}. ${a}</text></svg>`), left: x, top: y + C }); }
    await sharp({ create: { width: 4 * C + 20, height: Math.ceil(part.length / 2) * (C + 22), channels: 3, background: '#191816' } }).composite(comp).jpeg({ quality: 88 }).toFile(path.join(OUT, `p_${String(s + 1).padStart(2, '0')}.jpg`)); }
  console.log('sheets', Math.ceil(arts.length / PER)); })();
