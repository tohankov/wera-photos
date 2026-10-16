// Read-only: which products have a non-product (promo / lifestyle) picture as their MAIN photo.
// Downloads the 110x110 thumbnail of every image of every product (CDN, 300 ms gap, resumable) and scores the frame border:
// product shots sit on a white/near-white background, promo pictures fill the frame. node photos_audit/scan.js [maxMinutes]
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const live = require('../audit_cache/live.json'); const D = path.join(__dirname, 'thumbs'); fs.mkdirSync(D, { recursive: true });
const SF = path.join(__dirname, 'scores.json'); const scores = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {};
const thumb = u => { const m = u.match(/content\/images\/(\d+)\/(\d+)(?:_\+[^.]+)?\.(\w+)/); return m ? { url: `https://tl-shop.com.ua/content/images/${m[1]}/110x110l80nn0/${m[2]}.${m[3]}`, key: m[2] } : null; };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const until = Date.now() + (+process.argv[2] || 9) * 60000;
async function score(file) { const { data, info } = await sharp(file).resize(110, 110, { fit: 'contain', background: '#fff' }).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  let border = 0, white = 0, sat = 0, all = 0; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { const i = (y * info.width + x) * info.channels; const r = data[i], g = data[i + 1], b = data[i + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); all++; if (mx - mn > 60) sat++;
    if (x < 6 || y < 6 || x >= info.width - 6 || y >= info.height - 6) { border++; if (mn > 225) white++; } }
  return { borderWhite: +(white / border).toFixed(3), colorful: +(sat / all).toFixed(3) }; }
(async () => {
  const seen = new Set(); let n = 0;
  for (const p of live) { if (seen.has(p.article)) continue; seen.add(p.article);
    for (const [k, u] of (p.images || []).entries()) { if (k > 0 && !process.env.ALL && !(process.env.ONLY || '').split(',').includes(p.article)) break; const t = thumb(u); if (!t || scores[t.key]) continue; if (Date.now() > until) break;
      const f = path.join(D, t.key + '.jpg'); if (!fs.existsSync(f)) { await sleep(300); try { const r = await fetch(t.url, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/140' } }); if (r.status === 429) { await sleep(10000); continue; } if (r.status !== 200) { scores[t.key] = { err: r.status }; continue; } fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); } catch (e) { continue; } }
      try { scores[t.key] = await score(f); } catch (e) { scores[t.key] = { err: String(e).slice(0, 60) }; } if (++n % 100 === 0) fs.writeFileSync(SF, JSON.stringify(scores)); } }
  fs.writeFileSync(SF, JSON.stringify(scores));
  const total = live.reduce((a, p) => a + (p.images || []).length, 0); console.log('scored', Object.keys(scores).length, 'of image refs', total);
})();
