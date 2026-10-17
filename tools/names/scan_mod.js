// Read-only: all products with title and mod_title (UA/RU) -> names/catalog_mod.json; lists products whose mod_title is not empty and differs from title.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open();
(async () => { const out = [];
  for (let off = 0; ; off += 100) { await new Promise(r => setTimeout(r, 1500));
    const r = await S.call('horoshop_catalog_export', { includedParams: ['article', 'parent_article', 'title', 'mod_title', 'parent', 'link', 'display_in_showcase'], limit: 100, offset: off, allowLarge: true });
    if (!r.response) { console.log('export failed', JSON.stringify(r).slice(0, 200)); S.close(); process.exit(2); }
    const p = r.response.products || []; out.push(...p); if (p.length < 100) break; }
  fs.writeFileSync(path.join(__dirname, 'catalog_mod.json'), JSON.stringify(out));
  const diff = out.filter(p => ['ua', 'ru'].some(l => (p.mod_title || {})[l] && p.mod_title[l] !== (p.title || {})[l]));
  console.log('products', out.length, 'mod_title differs', diff.length); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
