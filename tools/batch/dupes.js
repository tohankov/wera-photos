// Same datasheet photo reused for different sizes = generic series photo, not this article's own.
// Difference hash on a trimmed 64x16 greyscale; distance <= 6 bits counts as the same picture. -> dupes.json {art: [other arts with same photo]}
const sharp = require('sharp'), fs = require('fs');
const P = require('./photos.json');
const all = { ...P };
// pilot series photos too, so the 867/4 Z set is compared with the rest

(async () => {
  const H = {};
  for (const [a, f] of Object.entries(all)) {
    if (!f) continue;
    const buf = await sharp('ds/' + f).trim({ threshold: 20 }).greyscale().resize(65, 16, { fit: 'fill' }).raw().toBuffer();
    let bits = ''; for (let y = 0; y < 16; y++) for (let x = 0; x < 64; x++) bits += buf[y * 65 + x] > buf[y * 65 + x + 1] ? '1' : '0';
    H[a] = bits;
  }
  const dist = (x, y) => { let n = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) n++; return n; };
  const out = {};
  for (const a of Object.keys(H)) out[a] = Object.keys(H).filter(b => b !== a && dist(H[a], H[b]) <= 6);
  fs.writeFileSync('dupes.json', JSON.stringify(out, null, 1));
  const shared = Object.entries(out).filter(([a, l]) => l.length && P[a] !== undefined);
  console.log('batch articles', Object.keys(P).length, 'with a photo shared by another article', shared.length);
  const seen = new Set(); for (const [a, l] of shared) { const g = [a, ...l].sort().join(' '); if (!seen.has(g)) { seen.add(g); console.log('  same photo:', g); } }
})();
