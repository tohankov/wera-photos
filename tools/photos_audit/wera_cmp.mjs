// Owner 27.10.2026, rule А: the main photo and the gallery = the CURRENT WERA version. For every visible product of a group: our main photo (images[0])
// against WERA's own picture of the article — the datasheet picture (lib/ds_image.mjs, page 1; wera.de shows one picture per series for single tools)
// and, where the wera.de page is the article's own (a set / a one-article page), the first wera.de gallery picture. A first pass by a perceptual
// distance (trimmed, 16×16 RGB, mean absolute difference + aspect ratio); every product is then looked at by eye on the sheets — the distance only
// orders them. Read-only: nothing is uploaded.
//   node photos_audit/wera_cmp.mjs <group live.json> <work dir> [budget s=520] [art ...]   (resumable: <work>/cmp.json, cache in <work>/cache)
// -> <work>/cmp.json {art: {ours, ds, wera, dDs, dWera, ratio}} + sheets <work>/sheets/NN.jpg (8 rows: art | ours | datasheet | wera.de | our gallery)
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const sharp = require('sharp'); const { dsImage } = await import('../lib/ds_image.mjs');
const W = require('../../inventory/wera/pages.json');
const [, , LIVE, WORK, B, ...only] = process.argv; const T0 = Date.now(), BUD = (+B || 520) * 1000; const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const d of ['cache', 'sheets', 'ds']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1 && (!only.length || only.includes(p.article)));
const SF = path.join(WORK, 'cmp.json'); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}; const save = () => fs.writeFileSync(SF, JSON.stringify(st, null, 1));
const cf = u => path.join(WORK, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const get = async (u, pause = 400) => { const f = cf(u); if (fs.existsSync(f)) return f; await sleep(pause); try { const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) return null; fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return f; } catch { return null; } };
// on white, trimmed, 16×16 RGB; transparent pixels become white
const sig = async f => { const b = await sharp(f).flatten({ background: '#ffffff' }).trim({ threshold: 20 }).toBuffer({ resolveWithObject: true });
  const ratio = b.info.width / b.info.height; const g = await sharp(b.data).resize(16, 16, { fit: 'contain', background: '#ffffff' }).removeAlpha().raw().toBuffer();
  // hue histogram of the saturated pixels (12 bins): an old version differs by colour (red / green inserts) while the shape is the same
  const c = await sharp(b.data).resize(64, 64, { fit: 'inside' }).removeAlpha().raw().toBuffer(); const h = new Array(12).fill(0); let n = 0;
  for (let i = 0; i < c.length; i += 3) { const [r, gg, bb] = [c[i] / 255, c[i + 1] / 255, c[i + 2] / 255]; const mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb), d = mx - mn; if (mx < 0.2 || d / mx < 0.35) continue;
    let hu = mx === r ? ((gg - bb) / d) % 6 : mx === gg ? (bb - r) / d + 2 : (r - gg) / d + 4; hu = (hu * 60 + 360) % 360; h[Math.floor(hu / 30)]++; n++; }
  return { g, ratio, hue: n ? h.map(x => x / n) : h, sat: n / (c.length / 3) }; };
// distance 0…100: max of the colour-layout difference and the hue-histogram difference (×50)
const dist = (a, b) => { let s = 0; for (let i = 0; i < a.g.length; i++) s += Math.abs(a.g[i] - b.g[i]); const lay = s / a.g.length;
  const hue = a.sat > 0.01 && b.sat > 0.01 ? a.hue.reduce((t, x, i) => t + Math.abs(x - b.hue[i]), 0) * 50 : Math.abs(a.sat - b.sat) * 200; return Math.round(Math.max(lay, hue)); };
// the wera.de page is the article's own when its variant table has only this article (or there is no table — a set / one product)
const own = a => { const wp = W.pages[W.art[a]]; if (!wp) return null; const t = wp.table; return !t || !t.arts || t.arts.length <= 1 ? wp : null; };
for (const p of L) { const a = p.article; if (st[a]) continue; if (Date.now() - T0 > BUD - 30000) break;
  const r = { ours: p.images[0], gallery: p.images.length };
  const of = await get(p.images[0], 200); const d = await dsImage(a); let df = null;
  if (d.png) { df = path.join(WORK, 'ds', a + '.png'); fs.writeFileSync(df, d.png); r.ds = d.w + 'x' + d.h; } else r.ds = d.why;
  const wp = own(a); let wf = null; if (wp && wp.gallery && wp.gallery[0]) { r.wera = wp.gallery[0].url; wf = await get(wp.gallery[0].url, 600); }
  try { const so = of && await sig(of); if (so && df) { const sd = await sig(df); r.dDs = dist(so, sd); r.ratio = +(so.ratio / sd.ratio).toFixed(2); }
    if (so && wf) { const sw = await sig(wf); r.dWera = dist(so, sw); } } catch (e) { r.err = e.message.slice(0, 80); }
  st[a] = r; save(); }
const done = L.filter(p => st[p.article]).length; console.log('compared', done, 'of', L.length);
if (done < L.length) process.exit(0);
// sheets: the most different first (largest distance to the datasheet picture / wera.de), 8 products per sheet
const order = L.map(p => p.article).sort((x, y) => Math.max(st[y].dDs || 0, st[y].dWera || 0) - Math.max(st[x].dDs || 0, st[x].dWera || 0));
const cell = async (f, w = 220, h = 160, bg = '#ffffff') => f && fs.existsSync(f) ? sharp(f).flatten({ background: bg }).resize(w, h, { fit: 'contain', background: bg }).toBuffer() : sharp({ create: { width: w, height: h, channels: 3, background: '#444' } }).png().toBuffer();
const label = (t, w) => Buffer.from(`<svg width="${w}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="4" y="16" font-family="Arial" font-size="14" fill="#fff">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`);
for (let s = 0; s * 8 < order.length; s++) { if (fs.existsSync(path.join(WORK, 'sheets', String(s + 1).padStart(2, '0') + '.jpg'))) continue; if (Date.now() - T0 > BUD) { console.log('time — run again for the rest of the sheets'); break; } const rows = order.slice(s * 8, s * 8 + 8); const comp = []; let y = 0;
  for (const a of rows) { const r = st[a]; const p = L.find(x => x.article === a);
    comp.push({ input: label(`${a}  d(паспорт)=${r.dDs ?? '—'}  d(wera)=${r.dWera ?? '—'}  фото ${r.gallery}  ${p.mod_title.ua.slice(0, 80)}`, 1600), left: 0, top: y });
    comp.push({ input: await cell(await get(r.ours, 100)), left: 0, top: y + 22 }); comp.push({ input: await cell(path.join(WORK, 'ds', a + '.png')), left: 225, top: y + 22 });
    comp.push({ input: await cell(r.wera ? await get(r.wera) : null), left: 450, top: y + 22 });
    for (const [i, u] of p.images.slice(1, 10).entries()) comp.push({ input: await cell(await get(u, 100), 120, 90), left: 680 + i * 125, top: y + 22 + 35 });
    y += 22 + 165; }
  await sharp({ create: { width: 1800, height: y, channels: 3, background: '#222' } }).composite(comp).jpeg({ quality: 78 }).toFile(path.join(WORK, 'sheets', String(s + 1).padStart(2, '0') + '.jpg')); }
console.log('sheets', Math.ceil(order.length / 8), '->', path.join(WORK, 'sheets'));
