// Composition table of EVERY product's WERA datasheet (lib/ds_set.mjs), for the «Вид інструменту» audit (cat/vyd_audit.js).
// Cached in cat/ds_comp_all.json ({article: [...] | null}); resumable — run again until «left 0». Sets already in cat/sets_comp.json are copied.
//   node cat/ds_comp_all.js [maxSeconds]
const fs = require('fs'), path = require('path'), { execFile } = require('child_process');
const F = path.join(__dirname, 'ds_comp_all.json'); const C = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
const SC = require('./sets_comp.json'); for (const [a, v] of Object.entries(SC)) if (!(a in C) && v) C[a] = v;
const DS = path.join(__dirname, '../batch/ds'); const arts = fs.readdirSync(DS).filter(f => /^\d{11}\.pdf$/.test(f)).map(f => f.slice(0, 11)).filter(a => !(a in C));
const run = a => new Promise(res => execFile('node', [path.join(__dirname, '../lib/ds_set.mjs'), path.join(DS, a + '.pdf')], { encoding: 'utf8', timeout: 60000 }, (e, out) => { try { res(e ? null : JSON.parse(out)); } catch (x) { res(null); } }));
const until = Date.now() + 1000 * +(process.argv[2] || 500);
(async () => { let n = 0; for (let i = 0; i < arts.length && Date.now() < until; i += 16) { const part = arts.slice(i, i + 16); const r = await Promise.all(part.map(run)); part.forEach((a, k) => C[a] = r[k]); n += part.length; if (n % 192 < 16) fs.writeFileSync(F, JSON.stringify(C)); }
  fs.writeFileSync(F, JSON.stringify(C)); const left = fs.readdirSync(DS).filter(f => /^\d{11}\.pdf$/.test(f)).filter(f => !(f.slice(0, 11) in C)).length;
  console.log('done', n, 'total', Object.keys(C).length, 'with composition', Object.values(C).filter(x => x && x.length).length, 'left', left); })();
