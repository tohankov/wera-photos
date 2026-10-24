// one product against its series WERA pictures (photos_audit/series_cmp.js data): node photos_audit/product_cmp.js <group live.json> <work dir> <art:seriesN> ...
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [, , LIVE, WORK, ...pairs] = process.argv; const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const SER = JSON.parse(fs.readFileSync(path.join(WORK, 'series.json'), 'utf8'));
const cf = u => path.join(WORK, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const get = async (u, pause) => { const f = cf(u); if (fs.existsSync(f)) return f; await sleep(pause); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) return null; fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return f; };
const S = 160; const lab = t => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="16"><text x="2" y="12" font-family="Arial" font-size="11" fill="#ddd">${t.slice(0, 26)}</text></svg>`);
(async () => { fs.mkdirSync(path.join(WORK, 'products'), { recursive: true });
  for (const pr of pairs) { const [a, n] = pr.split(':'); const s = SER.find(x => x.n === +n); const ours = []; for (const u of L[a].images || []) ours.push(await get(u, 500)); const wera = []; for (const w of s.wera) wera.push(await get(w.url, 1500));
    const cols = Math.max(ours.length, wera.length); const comp = [];
    for (const [r, list] of [ours, wera].entries()) for (const [i, f] of list.entries()) { if (!f) continue; const x = i * (S + 6), y = 20 + r * (S + 22);
      comp.push({ input: await sharp(f).flatten({ background: '#fff' }).resize(S, S, { fit: 'contain', background: '#fff' }).png().toBuffer(), left: x, top: y }, { input: lab((r ? 'W' : 'наше ') + (i + 1)), left: x, top: y + S + 2 }); }
    comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="18"><text x="2" y="14" font-family="Arial" font-size="13" fill="#fff">${a} (серия ${n}) — ${L[a].mod_title.ua.replace(/&/g, '').slice(0, 80)}</text></svg>`), left: 0, top: 0 });
    await sharp({ create: { width: Math.max(cols * (S + 6), 900), height: 20 + 2 * (S + 22), channels: 3, background: '#333' } }).composite(comp).jpeg({ quality: 80 }).toFile(path.join(WORK, 'products', a + '.jpg')); }
  console.log('done', pairs.length); })();
