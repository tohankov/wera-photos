// Global check item 7 — missing WERA photos, compared BY EYE per wera.de series page (owner 24.10.2026: «недостающие WERA — после сверки наши | WERA глазами»).
//   node photos_audit/series_cmp.js <group live.json> <global_<gid>.json> <work dir> [budget s=520]   (resumable, downloads cached in <work>/cache)
// For each series page of the products marked «у WERA фото больше»: the visible product with the most photos is the representative; sheet
// <work>/series/NN.jpg — row 1 our photos (storefront, in gallery order), row 2 WERA gallery + detail pictures (wera.de, page order), each labelled.
// <work>/series.json: [{ n, url, rep, products: [{art, photos}], wera: [{file, url, px}] }] — the decision (which WERA pictures are missing) is made by eye.
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp');
const [, , LIVE, GJ, WORK, B] = process.argv; const T0 = Date.now(), BUD = (+B || 520) * 1000; const sleep = ms => new Promise(r => setTimeout(r, ms));
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = JSON.parse(fs.readFileSync(GJ, 'utf8')); const W = require('../../inventory/wera/pages.json');
for (const d of ['cache', 'series']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const cf = u => path.join(WORK, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const get = async (u, pause) => { const f = cf(u); if (fs.existsSync(f)) return f; await sleep(pause); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) return null; fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return f; };
const need = J.products.filter(p => p.vis && p.list.some(f => f.item === 7 && /у WERA фото больше/.test(f.what))).map(p => p.art);
const by = {}; for (const a of need) { const u = W.art[a]; if (u) (by[u] = by[u] || []).push(a); }
const series = Object.entries(by).map(([url, arts], i) => { const prods = arts.map(a => ({ art: a, photos: (L[a].images || []).length })).sort((x, y) => y.photos - x.photos);
  const pg = W.pages[url]; return { n: i + 1, url, rep: prods[0].art, products: prods, wera: [...pg.gallery, ...pg.details].map(x => ({ file: x.file, url: x.url, px: x.px })) }; });
fs.writeFileSync(path.join(WORK, 'series.json'), JSON.stringify(series, null, 1));
const S = 180; const lab = (t, w) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="18"><text x="2" y="13" font-family="Arial" font-size="11" fill="#ddd">${t.replace(/&/g, '&amp;').replace(/</g, '').slice(0, 30)}</text></svg>`);
(async () => { let made = 0;
  for (const s of series) { const out = path.join(WORK, 'series', String(s.n).padStart(2, '0') + '.jpg'); if (fs.existsSync(out)) continue; if (Date.now() - T0 > BUD - 20000) break;
    const ours = []; for (const u of L[s.rep].images || []) ours.push(await get(u, 500)); const wera = []; for (const w of s.wera) wera.push(await get(w.url, 1500));
    const cols = Math.max(ours.length, wera.length); const comp = [];
    for (const [r, list] of [ours, wera].entries()) for (const [i, f] of list.entries()) { const x = i * (S + 6), y = 22 + r * (S + 26); if (!f) continue;
      let img; try { img = await sharp(f).flatten({ background: '#ffffff' }).resize(S, S, { fit: 'contain', background: '#ffffff' }).png().toBuffer(); } catch { continue; }
      comp.push({ input: img, left: x, top: y }, { input: lab((r ? 'W' : 'наше ') + (i + 1) + ' ' + (r ? s.wera[i].file : ''), S), left: x, top: y + S + 3 }); }
    comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (S + 6)}" height="20"><text x="2" y="15" font-family="Arial" font-size="13" fill="#fff">${s.n}. ${s.url.split('/').pop().slice(0, 70)} — товаров ${s.products.length}, представитель ${s.rep} (фото у товаров: ${[...new Set(s.products.map(p => p.photos))].join('/')})</text></svg>`), left: 0, top: 0 });
    await sharp({ create: { width: Math.max(cols * (S + 6), 900), height: 22 + 2 * (S + 26), channels: 3, background: '#333' } }).composite(comp).jpeg({ quality: 82 }).toFile(out); made++; }
  console.log('series', series.length, 'sheets made now', made, 'total', fs.readdirSync(path.join(WORK, 'series')).length); })();
