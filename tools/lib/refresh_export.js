// Refresh some products in a full export file (after a write): export them again with the same fields and replace them in the file.
//   node lib/refresh_export.js <all.json> <plan.json | art,art,...>
const fs = require('fs'); const S = require('./session.js').open(); const [, , ALL, W] = process.argv; const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = JSON.parse(fs.readFileSync(ALL, 'utf8')); const arts = fs.existsSync(W) ? Object.keys(JSON.parse(fs.readFileSync(W, 'utf8')).products) : W.split(',');
(async () => { const F = Object.keys(A[0]); const got = [];
  for (let i = 0; i < arts.length; i += 100) { await sleep(1500); const r = await S.call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: F, limit: 100, allowLarge: true });
    if (!r.response) { console.log('STOP', JSON.stringify(r).slice(0, 300)); process.exit(2); } got.push(...r.response.products); }
  const m = Object.fromEntries(got.map(p => [p.article, p])); let n = 0; for (let i = 0; i < A.length; i++) if (m[A[i].article]) { A[i] = m[A[i].article]; n++; }
  fs.writeFileSync(ALL, JSON.stringify(A)); console.log('refreshed', n, 'of', arts.length); S.close(); })();
