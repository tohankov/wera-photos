// Read-only: pixel size of every product photo of the visible products (Google: image ≥ 500×500 from 31.01.2027; 100×100 is the hard minimum today).
// node gm/photos.js <catalog export json (article, mod_title, images, display_in_showcase)> -> gm/data/photos.json (resumable) + inventory/gm_photos_small.xlsx
// MAXSEC=<s>: stop after that many seconds (state saved), run again to continue; the xlsx is written when every photo is measured.
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
  const T0 = Date.now(), MAX = (+process.env.MAXSEC || 1e9) * 1000;
  const worker = async () => { while (jobs.length && Date.now() - T0 < MAX) { const j = jobs.shift(); try { let { status, b } = await get(j.u, 131071); let d = dims(b); if (!d && status < 400) ({ status, b } = await get(j.u), d = dims(b));
      done[j.u] = d ? { w: d[0], h: d[1] } : { err: 'status ' + status }; } catch (e) { done[j.u] = { err: e.message }; }
    if (++n % 500 === 0) { fs.writeFileSync(OUT, JSON.stringify(done)); console.log(n, 'left', jobs.length); } await new Promise(r => setTimeout(r, 100)); } };
  await Promise.all([1, 2, 3, 4].map(worker)); fs.writeFileSync(OUT, JSON.stringify(done));
  if (jobs.length) { console.log('stopped on time: measured', Object.keys(done).length, 'left', jobs.length); return; }
  const rows = [], small = d => d && (d.err || d.w < 500 || d.h < 500), sz = d => d ? (d.err ? d.err : d.w + '×' + d.h) : '—'; let mainSmall = 0, extraSmall = 0, prodExtra = 0, errs = 0;
  for (const p of all) { const im = p.images || []; errs += im.filter(u => done[u]?.err).length; const m = done[im[0]], ex = im.slice(1).filter(u => small(done[u]));
    if (im.length && small(m)) mainSmall++; extraSmall += ex.length; if (ex.length) prodExtra++;
    if ((im.length && small(m)) || ex.length || !im.length) rows.push({ 'Артикул': p.article, 'Назва': p.mod_title.ua, 'Головне фото': im.length ? sz(m) : 'немає фото', 'Головне < 500×500': !im.length || small(m) ? 'так' : 'ні',
      'Доп. фото всього': Math.max(im.length - 1, 0), 'Доп. фото < 500×500': ex.length, 'Посилання на головне фото': im[0] || '' }); }
  rows.sort((a, b) => (b['Головне < 500×500'] === 'так') - (a['Головне < 500×500'] === 'так') || a['Артикул'].localeCompare(b['Артикул']));
  const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 70, 14, 10, 10, 10, 80].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Товари з фото < 500');
  const hs = {}; for (const p of all) { const d = done[(p.images || [])[0]]; if (d && d.w) { const k = d.w + '×' + d.h; hs[k] = (hs[k] || 0) + 1; } }
  const sum = [{ 'Показник': 'Видимих товарів', 'Значення': all.length }, { 'Показник': 'Головне фото < 500×500 (товарів)', 'Значення': mainSmall }, { 'Показник': 'Товарів без фото', 'Значення': all.filter(p => !(p.images || []).length).length },
    { 'Показник': 'Доп. фото < 500×500 (фото)', 'Значення': extraSmall }, { 'Показник': 'Товарів з доп. фото < 500×500', 'Значення': prodExtra }, { 'Показник': 'Фото, що не прочиталися', 'Значення': errs },
    ...Object.entries(hs).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ 'Показник': 'Головне фото ' + k, 'Значення': v }))];
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(sum), 'Зведення');
  X.writeFile(wb, path.join(__dirname, '../../inventory/gm_photos_small.xlsx'));
  const ws_ = Object.values(done).filter(d => d.w); const hist = { '<100': 0, '100–499': 0, '500–799': 0, '≥800': 0 }; for (const d of ws_) { const m = Math.min(d.w, d.h); hist[m < 100 ? '<100' : m < 500 ? '100–499' : m < 800 ? '500–799' : '≥800']++; }
  console.log('visible products', all.length, 'photos', all.reduce((s, p) => s + (p.images || []).length, 0), 'main <500', mainSmall, 'extra <500', extraSmall, 'in products', prodExtra, 'errors', errs, 'min side', JSON.stringify(hist));
})();
