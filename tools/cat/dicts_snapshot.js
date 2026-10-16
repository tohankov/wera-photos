// Snapshot of every dictionary used by the catalog-filter groups -> cat/dicts_snapshot.json {key: {book, values:[...]}}. node cat/dicts_snapshot.js
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'holders', 'adapters', 'drills'].filter(g => fs.existsSync(path.join(__dirname, `${g}_state.json`)));
const books = { profil: 382, rozmir: 383, dovzhyna: 384, vyd_instrumentu: 388, pryvid: 389 };
for (const g of G) Object.assign(books, require(`./${g}_state.json`).books);
(async () => { const out = {}; for (const [k, b] of Object.entries(books)) { await sleep(800); let d; for (let t = 0; t < 3; t++) { d = await S.call('horoshop_admin_dictionary_values', { book: b, allowLarge: true }); if (d.count) break; await sleep(2000); } out[k] = { book: b, values: d.values.map(v => v.value) }; }
  fs.writeFileSync(path.join(__dirname, 'dicts_snapshot.json'), JSON.stringify(out, null, 0)); console.log(Object.entries(out).map(([k, v]) => k + ':' + v.values.length).join(' ')); S.close(); process.exit(0); })();
