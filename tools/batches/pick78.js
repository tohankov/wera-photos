// Items 7-8: main photo of each article from its WERA datasheet (first large image after the 1587x752 banner) + dHash groups of photos shared between articles.
const fs = require('fs'), sharp = require('sharp'), path = require('path');
const DS = path.join(__dirname, '../batch/ds'); const arts = require('./todo78_all.json');
const files = fs.readdirSync(DS);
(async () => {
  const pick = {}, H = {};
  for (const a of arts) {
    const im = files.filter(f => f.startsWith(a + '_') && f.endsWith('.jpg')).map(f => { const m = f.match(/_(\d+)_(\d+)x(\d+)\.jpg$/); return { f, n: +m[1], w: +m[2], h: +m[3] }; }).filter(x => !(x.w === 1587 && x.h === 752)).sort((x, y) => x.n - y.n);
    const big = im.find(x => Math.max(x.w, x.h) >= 600) || im.sort((x, y) => y.w * y.h - x.w * x.h)[0];
    if (!big) { pick[a] = null; continue; }
    pick[a] = big.f;
    const buf = await sharp(path.join(DS, big.f)).trim({ threshold: 20 }).greyscale().resize(65, 16, { fit: 'fill' }).raw().toBuffer();
    let bits = ''; for (let y = 0; y < 16; y++) for (let x = 0; x < 64; x++) bits += buf[y * 65 + x] > buf[y * 65 + x + 1] ? '1' : '0'; H[a] = bits;
  }
  const dist = (x, y) => { let n = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) n++; return n; };
  const grp = {}; for (const a of Object.keys(H)) grp[a] = Object.keys(H).filter(b => b !== a && dist(H[a], H[b]) <= 6);
  fs.writeFileSync(path.join(__dirname, 'pick78.json'), JSON.stringify({ pick, grp }, null, 1));
  console.log('no photo:', Object.entries(pick).filter(([, f]) => !f).map(([a]) => a).join(' ') || 'none');
  const seen = new Set(); for (const [a, l] of Object.entries(grp)) if (l.length) { const g = [a, ...l].sort().join(' '); if (!seen.has(g)) { seen.add(g); console.log('shared:', g); } }
})();
