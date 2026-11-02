// Per photo, pick between the strict cut (light metal keeps its edge) and the default cut (no white JPEG fringe on coloured sleeves) — 02.11.2026, L-keys:
// strict leaves near-white opaque pixels on the outline of coloured Multicolour sleeves; default eats the light top edge of chrome. Rule: take the default
// when the strict cut has a white fringe (near-white opaque pixels touching transparency) and the default keeps ≥ 90 % of the strict object (the lost part is the fringe itself).
//   node photos_audit/cut_pick.js <src dir or state.json> <out cut dir> <art ...>   (src: <dir>/<art>.png, or state.json «orig»)
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , SRC, OUT, ...arts] = process.argv; const MC = new Set((process.env.MC || '').split(',').filter(Boolean));   // MC (env): coloured-sleeve articles — default cut always
const st = /\.json$/.test(SRC) ? JSON.parse(fs.readFileSync(SRC, 'utf8')) : null;
const stats = async png => { const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const W = info.width, H = info.height; let obj = 0, fr = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (data[i * 4 + 3] < 128) continue; obj++;
    if (Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) > 215 && [i - 1, i + 1, i - W, i + W].some(j => data[j * 4 + 3] < 128)) fr++; }
  return { obj, fr }; };
(async () => { const res = {};
  for (const a of arts) { const src = st ? st[a].orig : path.join(SRC, a + '.png');
    const pad = await sharp(src).flatten({ background: '#fff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#ffffff' }).png().toBuffer();
    const s = (await cut(pad, { noise: 1, hi: 3, grad: 2 })).png, d = (await cut(pad)).png; const S = await stats(s), D = await stats(d);
    const pick = MC.has(a) ? 'default' : S.fr > 15 && D.obj >= 0.995 * S.obj ? 'default' : 'strict';
    const c = await sharp(pick === 'default' ? d : s).trim({ threshold: 0 }).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    fs.writeFileSync(path.join(OUT, a + '.png'), c); res[a] = { pick, strictFringe: S.fr, defaultFringe: D.fr, keep: +(D.obj / S.obj).toFixed(3) }; }
  const c = {}; for (const v of Object.values(res)) c[v.pick] = (c[v.pick] || 0) + 1; console.log(c); fs.writeFileSync(path.join(OUT, '../pick.json'), JSON.stringify(res, null, 1)); })();
