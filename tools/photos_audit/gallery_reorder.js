// Gallery order fix (03.11.2026): images {override:true, links} keeps a link that is already in the gallery IN ITS OLD PLACE and appends new ones, so
// «WERA package first, ours second» came out «ours first, package last» (bits 37, L-key SB 05021721001 / 05073599001). Here every photo of the gallery
// is copied into the repository (images/rulea/<art>/g_NN.<ext>) and the gallery is written again with raw links only (all new) in the wanted order.
//   node photos_audit/gallery_reorder.js <live.json> <out plan.json> <name> <art:order ...>   order = comma list of current 1-based positions, e.g. 9,1,2,3
// -> files written (commit + push before the import), plan for photos_audit/gallery_override.js.
const fs = require('fs'), path = require('path'); const [, , LIVE, OUT, NAME, ...ARGS] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); // Horoshop knows a file by its CONTENT (same bytes -> the old file in its old place), so every copy gets new bytes, same pixels:
// JPEG — a comment segment after SOI, PNG — re-encoded losslessly by sharp.
const fresh = async (b, ext) => { if (/jpe?g/i.test(ext) && b[0] === 0xff && b[1] === 0xd8) { const t = Buffer.from('wera-photos order ' + Date.now()); const seg = Buffer.alloc(4); seg[0] = 0xff; seg[1] = 0xfe; seg.writeUInt16BE(t.length + 2, 2); return Buffer.concat([b.slice(0, 2), seg, t, b.slice(2)]); }
  return require('sharp')(b).png({ compressionLevel: 9 }).withMetadata({}).toBuffer(); };
const RAW = 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/rulea/';
(async () => { const plan = { name: NAME, products: {} };
  for (const x of ARGS) { const [a, ord] = x.split(':'); const im = L[a].images; const idx = ord.split(',').map(n => +n - 1);
    if (idx.length !== im.length || new Set(idx).size !== im.length || idx.some(i => !(i >= 0 && i < im.length))) throw new Error(a + ' order must name every photo once');
    const dir = path.join(__dirname, '../../images/rulea', a); fs.mkdirSync(dir, { recursive: true }); const links = [];
    for (const [k, i] of idx.entries()) { const u = im[i]; const ext = path.extname(u.split('?')[0]); const f = `g_${String(k + 1).padStart(2, '0')}${ext}`;
      const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); fs.writeFileSync(path.join(dir, f), await fresh(Buffer.from(await r.arrayBuffer()), ext)); links.push(RAW + a + '/' + f); }
    plan.products[a] = { links, why: 'порядок галереи: ' + ord + ' (все фото заново, т. к. существующая ссылка остаётся на старом месте)' }; }
  fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('plan', Object.keys(plan.products).length); })();
