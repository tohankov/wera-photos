// Which WERA photos (wera.de gallery + details) a product already has on our site: perceptual hash (dHash 16x16 on a white background, crop to the
// object) of every picture, a WERA picture counts as present when one of ours is close (Hamming distance <= maxDist). Read-only; downloads are cached.
//   match(ours: [url], wera: [url], cacheDir, {maxDist}) -> { pairs: [{wera, ours, dist}], missing: [wera], extra: [ours] }
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function load(url, dir) { const f = path.join(dir, crypto.createHash('md5').update(url).digest('hex') + path.extname(url.split('?')[0]));
  if (!fs.existsSync(f)) { await sleep(1500); const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) throw new Error(r.status + ' ' + url); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  return f; }
async function dhash(file) { const N = 16;
  let buf; try { buf = await sharp(file).flatten({ background: '#ffffff' }).trim({ background: '#ffffff', threshold: 20 }).png().toBuffer(); } catch { buf = await sharp(file).flatten({ background: '#ffffff' }).png().toBuffer(); }
  const { data } = await sharp(buf).resize(N + 1, N, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const bits = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) bits.push(data[y * (N + 1) + x] > data[y * (N + 1) + x + 1] ? 1 : 0); return bits; }
const dist = (a, b) => a.reduce((s, v, i) => s + (v !== b[i]), 0);
async function match(ours, wera, dir, { maxDist = 40 } = {}) { fs.mkdirSync(dir, { recursive: true });
  const ho = []; for (const u of ours) ho.push({ u, h: await dhash(await load(u, dir)) });
  const hw = []; for (const u of wera) hw.push({ u, h: await dhash(await load(u, dir)) });
  const pairs = [], used = new Set();
  for (const w of hw) { let best = null; for (const o of ho) { const d = dist(w.h, o.h); if (!best || d < best.d) best = { o, d }; }
    if (best && best.d <= maxDist) { pairs.push({ wera: w.u, ours: best.o.u, dist: best.d }); used.add(best.o.u); } }
  return { pairs, missing: hw.filter(w => !pairs.some(p => p.wera === w.u)).map(w => w.u), extra: ho.filter(o => !used.has(o.u)).map(o => o.u) }; }
module.exports = { match, dhash, load };
