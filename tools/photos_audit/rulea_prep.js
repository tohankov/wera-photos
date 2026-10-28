// Rule А, write preparation for a group (owner 28.10.2026): from the decisions CSV (photos_audit/cmp_decide.js) — every «главное — …» product gets its new main
// cut out (datasheet picture, or wera.de for a set without one) into <work>/cut/<art>.png, the size rule checked (new ≥ ours by the larger side and ≥ 800 px,
// else kept and listed), a dark sheet for the eye, <work>/list.json for photos_audit/main_replace.js.   node photos_audit/rulea_prep.js <decisions.csv> <cmp dir> <work dir>
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , CSV, W, OUT] = process.argv; fs.mkdirSync(path.join(OUT, 'cut'), { recursive: true }); const c = JSON.parse(fs.readFileSync(path.join(W, 'cmp.json'), 'utf8'));
const rows = fs.readFileSync(CSV, 'utf8').replace(/^\ufeff/, '').split('\n').slice(1).map(l => (l.match(/"((?:[^"]|"")*)"/g) || []).map(x => x.slice(1, -1))).filter(r => /^главное/.test(r[3] || ''));
const cf = u => path.join(W, 'cache', crypto.createHash('md5').update(u).digest('hex') + path.extname(u.split('?')[0]));
(async () => { const list = [], small = [];
  for (const r of rows) { const a = r[0]; let src = /wera\.de/.test(r[3]) ? cf(c[a].wera) : path.join(W, 'ds', a + '.png'); if (!fs.existsSync(src)) { small.push(a + ' нет файла'); continue; }
    if (/\.webp$/.test(src)) { const p = path.join(OUT, a + '_src.png'); await sharp(src).png().toFile(p); src = p; }
    const n = await sharp(src).trim().toBuffer({ resolveWithObject: true }), o = await sharp(cf(c[a].ours)).trim().toBuffer({ resolveWithObject: true });
    const nb = Math.max(n.info.width, n.info.height), ob = Math.max(o.info.width, o.info.height); if (nb < ob || nb < 800) { small.push(`${a} новое ${nb} px, наше ${ob} px`); continue; }
    const out = path.join(OUT, 'cut', a + '.png'); if (!fs.existsSync(out)) { const { png } = await cut(src); fs.writeFileSync(out, png); } list.push(a); }
  fs.writeFileSync(path.join(OUT, 'list.json'), JSON.stringify(list)); fs.writeFileSync(path.join(OUT, 'small.json'), JSON.stringify(small, null, 1));
  for (let s = 0; s * 40 < list.length; s++) { const part = list.slice(s * 40, s * 40 + 40); const comp = [];
    for (const [i, a] of part.entries()) { comp.push({ input: await sharp(path.join(OUT, 'cut', a + '.png')).resize(220, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), left: (i % 8) * 230 + 5, top: Math.floor(i / 8) * 185 + 5 });
      comp.push({ input: Buffer.from(`<svg width="220" height="18"><text x="2" y="13" font-family="Arial" font-size="12" fill="#999">${a}</text></svg>`), left: (i % 8) * 230 + 5, top: Math.floor(i / 8) * 185 + 165 }); }
    await sharp({ create: { width: 1850, height: Math.ceil(part.length / 8) * 185 + 10, channels: 3, background: '#191816' } }).composite(comp).jpeg({ quality: 80 }).toFile(path.join(OUT, 'sheet_' + (s + 1) + '.jpg')); }
  console.log('ready', list.length, '| kept (size)', small.length, small.slice(0, 5)); })();
