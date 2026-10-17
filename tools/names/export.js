// Read-only: all products with article, title (UA/RU), section, gtin, barcode -> names/catalog.json (walks offset by 100 with pauses).
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open();
(async () => { const out = []; let missing;
  for (let off = 0; ; off += 100) { await new Promise(r => setTimeout(r, 1500));
    const r = await S.call('horoshop_catalog_export', { includedParams: ['article', 'parent_article', 'title', 'parent', 'alt_parent', 'gtin', 'barcode', 'display_in_showcase', 'link'], limit: 100, offset: off, allowLarge: true });
    const p = (r.response || {}).products || []; if (off === 0) { missing = r.missingParams || r.warnings || null; console.log('first page keys', Object.keys(p[0] || {}), JSON.stringify(r).slice(0, 0)); }
    out.push(...p); process.stdout.write(off + ' '); if (p.length < 100) break; }
  fs.writeFileSync(path.join(__dirname, 'catalog.json'), JSON.stringify(out)); console.log('\nproducts', out.length, 'with gtin', out.filter(p => p.gtin).length, 'with barcode', out.filter(p => p.barcode).length);
  S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
