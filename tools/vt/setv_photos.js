// main photo of each component (our site, else the WERA picture from «Werkzeuge in diesem Set») -> cut-out -> trimmed 152x92 webp (2x of 76x46).
// Resumable: a downloaded photo is not fetched again. node photos.js <SP/setv>
const fs = require('fs'); const sharp = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/sharp'); const { cut } = require('C:/Users/Techlight/Desktop/wera-photos/tools/lib/cutout.js');
const D = process.argv[2]; const E = require(D + '/exp.json'); const W = require('C:/Users/Techlight/Desktop/wera-photos/tools/vt/wset.js');
// crop to the opaque part (alpha > 8) — sharp trim also looks at the colour of transparent pixels
const alphaCrop = async b => { const { data, info } = await sharp(b).raw().toBuffer({ resolveWithObject: true }); let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return sharp(b).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer(); };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const log = [];
(async () => { const jobs = E.filter(p => !['05150153001', '05051012001'].includes(p.article)).map(p => [p.article, (p.images || [])[0]]);
  for (const s of ['05150153001', '05051012001']) for (const it of W.parse(fs.readFileSync(D + '/w_' + s + '.html', 'utf8')).items) for (const r of it.rows) if (!r.art && it.img) jobs.push(['wera_' + it.img.split('/').pop().replace('.webp', ''), it.img]);
  for (const [a, u] of jobs) { if (!u) { log.push(a + ' NO PHOTO'); continue; } const ext = u.split('.').pop().split('?')[0]; const f = `${D}/img/${a}.${ext}`;
    if (!fs.existsSync(f)) { await sleep(1500); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (r.status === 429) { log.push(a + ' 429'); await sleep(30000); continue; } if (!r.ok) { log.push(a + ' HTTP ' + r.status); continue; } fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
    const c = await cut(f); const png = await alphaCrop(c.png);
    await sharp(png).resize(152, 92, { fit: 'inside', withoutEnlargement: false }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${D}/th/${a}.webp`);
    log.push(`${a} fg ${c.stats.fgShare} bg ${c.stats.bg.join(',')} holes ${c.stats.holes}`); }
  fs.writeFileSync(D + '/photos_log.txt', log.join('\n')); console.log(log.join('\n')); })();
