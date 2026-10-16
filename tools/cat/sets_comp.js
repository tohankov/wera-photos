// Composition of every set from its WERA datasheet (lib/ds_set.mjs), cached in cat/sets_comp.json. node cat/sets_comp.js
const fs = require('fs'), path = require('path'), { execFile } = require('child_process');
const F = path.join(__dirname, 'sets_comp.json'); const C = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
const arts = [...new Set(Object.values(require('./sets_list.json')).flat())].filter(a => !(a in C));
const run = a => new Promise(res => { const pdf = path.join(__dirname, '../batch/ds', a + '.pdf'); if (!fs.existsSync(pdf)) return res(null);
  execFile('node', [path.join(__dirname, '../lib/ds_set.mjs'), pdf], { encoding: 'utf8', timeout: 60000 }, (e, out) => { try { res(e ? null : JSON.parse(out)); } catch (x) { res(null); } }); });
(async () => { for (let i = 0; i < arts.length; i += 6) { const r = await Promise.all(arts.slice(i, i + 6).map(run)); arts.slice(i, i + 6).forEach((a, k) => C[a] = r[k]); fs.writeFileSync(F, JSON.stringify(C)); }
  const v = Object.values(C); console.log('sets', v.length, 'with composition', v.filter(x => x && x.length).length); })();
