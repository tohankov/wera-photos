// Owner 12.11.2026: a main photo without background always sits on a transparent SQUARE canvas, the object centred (a strip 1006×151 stood at the top of
// the photo zone and only the strip was clickable). side = the longer side, capped at 1400 px (bigger -> resized down first).
//   const { square } = require('./square.js'); await square(buf) -> PNG buffer;   node lib/square.js <in.png> <out.png>
const sharp = require('sharp');
async function square(buf, max = 1400) { let b = buf; let m = await sharp(b).metadata();
  if (Math.max(m.width, m.height) > max) { b = await sharp(b).resize({ width: m.width >= m.height ? max : null, height: m.height > m.width ? max : null }).png().toBuffer(); m = await sharp(b).metadata(); }
  const s = Math.max(m.width, m.height); const l = Math.floor((s - m.width) / 2), t = Math.floor((s - m.height) / 2);
  return sharp(b).ensureAlpha().extend({ top: t, bottom: s - m.height - t, left: l, right: s - m.width - l, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(); }
module.exports = { square };
if (require.main === module) (async () => { const fs = require('fs'); const o = await square(fs.readFileSync(process.argv[2])); fs.writeFileSync(process.argv[3], o); const m = await sharp(o).metadata(); console.log(m.width, m.height); })();
