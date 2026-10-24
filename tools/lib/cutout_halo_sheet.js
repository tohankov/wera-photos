// large before / after of the halo fix: per photo — whole photo on the site dark (old | new) and a x4 crop (original | old | new)
// node big.js <photoDir> <out.jpg> art:left,top,w,h ...
const sharp = require('sharp'); const fs = require('fs');
const NEW = require('C:/Users/Techlight/Desktop/wera-photos/tools/lib/cutout.js').cut, OLD = require(process.env.CUTOUT_OLD || __dirname + '/cutout.js').cut;
const [, , dir, out, ...specs] = process.argv; const DARK = '#191816', Z = 4, S = 620;
const txt = (s, w) => Buffer.from(`<svg width="${w}" height="34"><rect width="100%" height="100%" fill="#333"/><text x="10" y="23" font-family="Arial" font-size="18" fill="#eee">${s}</text></svg>`);
(async () => { const parts = []; let y = 0, Wm = 0;
  for (const s of specs) { const [a, b] = s.split(':'); const [left, top, width, height] = b.split(',').map(Number); const box = { left, top, width, height };
    const f = dir + '/' + fs.readdirSync(dir).find(n => n.startsWith(a + '_main')); const o = await OLD(f), n = await NEW(f);
    const whole = async p => sharp(await sharp(p).resize(S, S, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).flatten({ background: DARK }).png().toBuffer();
    parts.push({ input: txt(a + ' — весь снимок на тёмном фоне сайта: слева БЫЛО, справа СТАЛО', 2 * S + 10), left: 0, top: y }); y += 38;
    parts.push({ input: await whole(o.png), left: 0, top: y }, { input: await whole(n.png), left: S + 10, top: y }); y += S + 10; Wm = Math.max(Wm, 2 * S + 10);
    const cw = width * Z, ch = height * Z; const crop = async (p, flat) => sharp(await sharp(p).extract(box).png().toBuffer()).resize(cw, ch, { kernel: 'nearest' }).flatten({ background: flat }).png().toBuffer();
    parts.push({ input: txt(a + ' — край ×' + Z + ': оригинал | БЫЛО | СТАЛО', 3 * cw + 20), left: 0, top: y }); y += 38;
    parts.push({ input: await crop(f, '#ffffff'), left: 0, top: y }, { input: await crop(o.png, DARK), left: cw + 10, top: y }, { input: await crop(n.png, DARK), left: 2 * cw + 20, top: y });
    y += ch + 24; Wm = Math.max(Wm, 3 * cw + 20); console.log(a, 'old', JSON.stringify(o.stats), '\nnew', JSON.stringify(n.stats)); }
  await sharp({ create: { width: Wm, height: y, channels: 3, background: '#555' } }).composite(parts).jpeg({ quality: 92 }).toFile(out); })();
