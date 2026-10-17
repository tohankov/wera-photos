// WERA datasheet facts from batch/ds/<art>.txt (page-1 text): title line, EAN, series («№ артикула»).
const fs = require('fs'), path = require('path'); const DIR = path.join(__dirname, '../batch/ds');
function ds(a) { const f = path.join(DIR, a + '.txt'); if (!fs.existsSync(f)) return null; const L = fs.readFileSync(f, 'utf8').split('\n').map(l => l.replace(/^p\d+ /, ''));
  const all = L.join('\n'); const g = re => ((all.match(re) || [])[1] || '').trim();
  return { title: L.slice(0, Math.max(1, L.findIndex(l => /EAN:/.test(l)))).join(' ').replace(/\s+EAN:.*/, '').replace(/\s+/g, ' ').trim(), ean: g(/EAN:\s*\|\s*(\d{8,14})/), eans: [...all.matchAll(/EAN:\s*\|\s*(\d{8,14})/g)].map(m => m[1]), part: g(/№ детали:\s*\|\s*(\d{11})/), series: g(/№ артикула:\s*\|\s*([^|\n]+?)\s*(?:\||\n|$)/) }; }
module.exports = ds;
if (require.main === module) for (const a of process.argv.slice(2)) console.log(a, ds(a));
