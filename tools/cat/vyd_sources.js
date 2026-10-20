// «Вид інструменту» per generator: every cat/g_*.js item with its kind after cat/vyd_final.json (as cat/import_group.js writes it) -> cat/vyd_sources.json
// (used by cat/vyd_audit.js; the site value = the union of the generators).   node cat/vyd_sources.js [out.json]
const fs = require('fs'), path = require('path'); const VC = require('./vyd_comp.js');
const out = {}; const log = console.log; console.log = () => {};
for (const f of fs.readdirSync(__dirname).filter(f => /^g_.*\.js$/.test(f))) { const G = require(path.join(__dirname, f)); VC.finishKinds(G.items || [], false);
  for (const it of G.items || []) { const v = (it.vals || {}).vyd_instrumentu; if (v && v.length) (out[it.a] = out[it.a] || []).push({ g: G.name || f, v }); } }
console.log = log; fs.writeFileSync(process.argv[2] || path.join(__dirname, 'vyd_sources.json'), JSON.stringify(out)); console.log('products', Object.keys(out).length);
