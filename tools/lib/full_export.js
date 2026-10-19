// One full live catalog export (pages of 100, 1.5 s apart) -> JSON file. On 429 waits the asked seconds and goes on from the same page.
//   node lib/full_export.js <out.json> field1,field2,...
const fs = require('fs'); const S = require('./session.js').open(); const [, , out, f] = process.argv; const F = f.split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const all = []; for (let off = 0; ; off += 100) { await sleep(1500);
    const r = await S.call('horoshop_catalog_export', { includedParams: F, limit: 100, offset: off, allowLarge: true });
    if (!r.response) { const m = JSON.stringify(r).match(/[Rr]etry after (\d+)/); if (m) { console.log('429, waiting', m[1], 's at offset', off); await sleep((+m[1] + 5) * 1000); off -= 100; continue; }
      console.log('STOP', JSON.stringify(r).slice(0, 300)); S.close(); process.exit(2); }
    all.push(...r.response.products); if (r.response.products.length < 100) break; }
  fs.writeFileSync(out, JSON.stringify(all)); console.log('products', all.length, '->', out); S.close(); })().catch(e => { console.error(e); S.close(); process.exit(1); });
