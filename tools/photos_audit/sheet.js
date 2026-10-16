// Contact sheets of candidate main photos: node photos_audit/sheet.js <threshold>
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const live = require('../audit_cache/live.json'); const S = require('./scores.json'); const th = +process.argv[2] || 0.9;
const seen = new Set(); const C = [];
for (const p of live) { if (seen.has(p.article)) continue; seen.add(p.article); if (!(p.images || []).length) continue; const m = p.images[0].match(/content\/images\/(\d+)\/(\d+)(?:_\+[^.]+)?\.(\w+)/); const s = S[m[2]]; if (s && !s.err && s.borderWhite < th) C.push({ a: p.article, dir: m[1], key: m[2], ext: m[3], s, title: p.title.ua, sec: p.parent.id, n: p.images.length }); }
fs.writeFileSync(path.join(__dirname, 'candidates.json'), JSON.stringify(C, null, 1)); console.log('candidates', C.length);
(async () => {
  const W = 200, H = 230, cols = 8, per = 48;
  for (let s = 0; s * per < C.length; s++) { const part = C.slice(s * per, s * per + per); const comp = [];
    for (const [i, c] of part.entries()) { const f = path.join(__dirname, 'thumbs', c.key + '.jpg'); let buf; const big = path.join(__dirname, 'thumbs', c.key + '_200.jpg');
      if (!fs.existsSync(big)) { await new Promise(r => setTimeout(r, 300)); const r = await fetch(`https://tl-shop.com.ua/content/images/${c.dir}/200x200l80nn0/${c.key}.${c.ext}`); if (r.status === 200) fs.writeFileSync(big, Buffer.from(await r.arrayBuffer())); }
      buf = await sharp(fs.existsSync(big) ? big : f).resize(W - 10, H - 40, { fit: 'contain', background: '#fff' }).toBuffer();
      const x = (i % cols) * W, y = Math.floor(i / cols) * H; comp.push({ input: buf, left: x + 5, top: y + 5 });
      comp.push({ input: Buffer.from(`<svg width="${W}" height="34"><text x="4" y="13" font-size="12" font-family="Arial" font-weight="bold">${c.a} · ${c.sec} · ${c.n}ф</text><text x="4" y="28" font-size="10" font-family="Arial">${c.title.replace(/[<>&"]/g, '').slice(0, 34)}</text></svg>`), left: x, top: y + H - 36 }); }
    const out = `C:/Users/Techlight/Desktop/wera-photos/inventory/mainphoto_check_${s + 1}.jpg`;
    await sharp({ create: { width: cols * W, height: Math.ceil(part.length / cols) * H, channels: 3, background: '#ddd' } }).composite(comp).jpeg({ quality: 80 }).toFile(out); console.log(out); }
})();
