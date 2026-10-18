// Read-only: pixel size of every product photo of the visible products (Google: image ≥ 500×500 from 31.01.2027; 100×100 is the hard minimum today).
// node gm/photos.js <catalog export json (article, mod_title, images, display_in_showcase)> -> gm/data/photos.json (resumable) + inventory/gm_photos_small.xlsx
// Only the first bytes of each file are read (HTTP Range); the size comes from the PNG / JPEG / WebP / GIF header. 4 requests in parallel.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const OUT = path.join(__dirname, 'data/photos.json'); const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
function dims(b) {
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];                                       // PNG IHDR
  if (b.slice(0, 3).toString() === 'GIF') return [b.readUInt16LE(6), b.readUInt16LE(8)];
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') { const t = b.slice(12, 16).toString();
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; }
  if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i + 9 < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; } }
  return null; }
const get = async (u, range) => { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', ...(range ? { Range: 'bytes=0-' + range } : {}) } }); return { status: r.status, b: Buffer.from(await r.arrayBuffer()) }; };
(async () => { const all = require(path.resolve(process.argv[2])).filter(p => +p.display_in_showcase === 1);
  const jobs = all.flatMap(p => (p.images || []).map((u, i) => ({ a: p.article, i, u }))).filter(j => !done[j.u]); let n = 0;
  const worker = async () => { while (jobs.length) { const j = jobs.shift(); try { let { status, b } = await get(j.u, 131071); let d = dims(b); if (!d && status < 400) ({ status, b } = await get(j.u), d = dims(b));
      done[j.u] = d ? { w: d[0], h: d[1] } : { err: 'status ' + status }; } catch (e) { done[j.u] = { err: e.message }; }
    if (++n % 500 === 0) { fs.writeFileSync(OUT, JSON.stringify(done)); console.log(n, 'left', jobs.length); } await new Promise(r => setTimeout(r, 100)); } };
  await Promise.all([1, 2, 3, 4].map(worker)); fs.writeFileSync(OUT, JSON.stringify(done));
  const rows = [], small = d => d && (d.err || d.w < 500 || d.h < 500); let mainSmall = 0, extraSmall = 0, prodExtra = 0, errs = 0;
  for (const p of all) { const im = p.images || []; const sm = im.map((u, i) => ({ u, i, d: done[u] })).filter(x => small(x.d)); errs += im.filter(u => done[u]?.err).length;
    if (sm.some(x => x.i === 0)) mainSmall++; const ex = sm.filter(x => x.i > 0); extraSmall += ex.length; if (ex.length) prodExtra++;
    for (const x of sm) rows.push({ 'Артикул': p.article, 'Название': p.mod_title.ua, 'Фото': x.i === 0 ? 'главное' : 'доп. ' + x.i, 'Ширина': x.d.w ?? '', 'Высота': x.d.h ?? '', 'Ошибка': x.d.err || '', 'Ссылка': x.u }); }
  const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 70, 10, 8, 8, 14, 80].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Фото меньше 500');
  X.writeFile(wb, path.join(__dirname, '../../inventory/gm_photos_small.xlsx'));
  const ws_ = Object.values(done).filter(d => d.w); const hist = { '<100': 0, '100–499': 0, '500–799': 0, '≥800': 0 }; for (const d of ws_) { const m = Math.min(d.w, d.h); hist[m < 100 ? '<100' : m < 500 ? '100–499' : m < 800 ? '500–799' : '≥800']++; }
  console.log('visible products', all.length, 'photos', all.reduce((s, p) => s + (p.images || []).length, 0), 'main <500', mainSmall, 'extra <500', extraSmall, 'in products', prodExtra, 'errors', errs, 'min side', JSON.stringify(hist));
})();
