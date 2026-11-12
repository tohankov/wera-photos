// Impaktor IMP DC bits sold per piece (owner 12.11.2026, «ок» on 05057667001): the main photo = the ONE bit of the bit's own WERA datasheet
// (page 4, lib/ds_images_all.mjs -> <art>_p4_1.png) without background, on a transparent square canvas (lib/square.js); the DIY box (gallery 0) and the
// bit photos on white (gallery 1 and the extra ones in DROP) leave the gallery. Every kept photo is copied into the repository with new bytes (Horoshop
// knows a file by its content and would keep it in its old place — photos_audit/gallery_reorder.js), so the gallery is written in one override in order.
//   node photos_audit/impdc_gal.js <live.json> <dir of ds_images_all> <dir of downloaded gallery <art>_NN.ext> <out plan.json> <art ...>
// -> images/rulea/<art>/i_NN.<ext> (commit + push before the import) + plan for photos_audit/gallery_override.js; sheet of the new mains <out>.jpg
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js'); const { square } = require('../lib/square.js');
const [, , LIVE, DS, GAL, OUT, ...ARTS] = process.argv; const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p]));
const DROP = { '05057605001': [10], '05057616001': [9], '05057621001': [9], '05057625001': [9], '05057631001': [10], '05057661001': [9] };   // one bit again (sheet 12.11)
const RAW = 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/rulea/';
const fresh = async (b, ext) => { if (/jpe?g/i.test(ext) && b[0] === 0xff && b[1] === 0xd8) { const t = Buffer.from('wera-photos impdc ' + Date.now()); const seg = Buffer.alloc(4); seg[0] = 0xff; seg[1] = 0xfe; seg.writeUInt16BE(t.length + 2, 2); return Buffer.concat([b.slice(0, 2), seg, t, b.slice(2)]); }
  return sharp(b).png({ compressionLevel: 9 }).toBuffer(); };
(async () => { const plan = { name: path.basename(OUT, '.json'), products: {} }; const sheet = [];
  for (const a of ARTS) { const p = L[a]; const dir = path.join(__dirname, '../../images/rulea', a); fs.mkdirSync(dir, { recursive: true });
    const src = await sharp(path.join(DS, a + '_p4_1.png')).flatten({ background: '#fff' }).extend({ top: 6, bottom: 6, left: 6, right: 6, background: '#fff' }).png().toBuffer();
    const t = await sharp((await cut(src, { holeMin: 1 })).png).trim().png().toBuffer(); const main = await square(await sharp(t).extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer());
    fs.writeFileSync(path.join(dir, 'i_00.png'), main); sheet.push(main); const links = [RAW + a + '/i_00.png']; const drop = new Set([0, 1, ...(DROP[a] || [])]);
    for (const [i, u] of p.images.entries()) { if (drop.has(i)) continue; const ext = path.extname(u.replace(/\?.*$/, '')); const f = fs.readdirSync(GAL).find(x => x.startsWith(a + '_' + String(i).padStart(2, '0') + '.'));
      if (!f) throw new Error('no download ' + a + ' ' + i); const n = 'i_' + String(links.length).padStart(2, '0') + ext; fs.writeFileSync(path.join(dir, n), await fresh(fs.readFileSync(path.join(GAL, f)), ext)); links.push(RAW + a + '/' + n); }
    plan.products[a] = { links, why: `IMP DC поштучно (владелец 12.11.2026): главное — одна бита из паспорта WERA (стр. 4) без фона на квадратном холсте; убраны коробка DIY и бита на белом (№ ${[...drop].map(x => x + 1).join(', ')}); было ${p.images.length}, стало ${links.length}` };
    console.log(a, p.images.length, '->', links.length); }
  fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
  const T = 220, cols = 6, comp = []; for (const [i, b] of sheet.entries()) comp.push({ input: await sharp(b).resize(T - 10, T - 10).png().toBuffer(), left: (i % cols) * T + 5, top: Math.floor(i / cols) * T + 5 });
  await sharp({ create: { width: cols * T, height: Math.ceil(sheet.length / cols) * T, channels: 3, background: '#191816' } }).composite(comp).jpeg().toFile(OUT.replace(/\.json$/, '.jpg')); })();
