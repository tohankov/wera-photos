// Gallery sheets for rule А (owner 28.10.2026: old-version photos leave the gallery): per product one row — the new main (cut, dark background)
// then every current gallery photo numbered 1…N (storefront files). Looked at by eye; decisions — which numbers are old.
//   node photos_audit/gallery_sheet.js <all.json> <cut dir> <cache dir> <out dir> <art> [art ...]   (8 products per sheet)
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp');
const [, , ALL, CUT, CACHE, OUT, ...arts] = process.argv; const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms)); const cf = u => path.join(CACHE, crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
const get = async u => { const f = cf(u); if (fs.existsSync(f)) return f; await sleep(200); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) return null; fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return f; };
const tile = async (f, lab, bg) => { const b = f ? await sharp(f).flatten({ background: bg }).resize(160, 120, { fit: 'contain', background: bg }).toBuffer() : await sharp({ create: { width: 160, height: 120, channels: 3, background: '#444' } }).png().toBuffer();
  return sharp({ create: { width: 160, height: 140, channels: 3, background: '#000' } }).composite([{ input: b, left: 0, top: 0 }, { input: Buffer.from(`<svg width="160" height="20"><text x="3" y="15" font-family="Arial" font-size="13" fill="#fff">${lab}</text></svg>`), left: 0, top: 120 }]).jpeg().toBuffer(); };
(async () => { for (let s = 0; s * 8 < arts.length; s++) { const part = arts.slice(s * 8, s * 8 + 8); const comp = []; let maxw = 0;
    for (const [i, a] of part.entries()) { const y = i * 168; comp.push({ input: Buffer.from(`<svg width="1800" height="24"><text x="3" y="17" font-family="Arial" font-size="15" fill="#fff">${a} ${A[a].mod_title.ua.slice(0, 90).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`), left: 0, top: y });
      comp.push({ input: await tile(fs.existsSync(path.join(CUT, a + '.png')) ? path.join(CUT, a + '.png') : null, 'НОВОЕ главное', '#191816'), left: 0, top: y + 24 });
      for (const [j, u] of A[a].images.entries()) { comp.push({ input: await tile(await get(u), '№' + (j + 1), '#ffffff'), left: 175 + j * 165, top: y + 24 }); maxw = Math.max(maxw, 175 + (j + 1) * 165); } }
    await sharp({ create: { width: Math.max(maxw, 1800), height: part.length * 168, channels: 3, background: '#222' } }).composite(comp).jpeg({ quality: 78 }).toFile(path.join(OUT, String(s + 1).padStart(2, '0') + '.jpg')); }
  console.log('sheets', Math.ceil(arts.length / 8)); })();
