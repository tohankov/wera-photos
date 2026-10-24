// export the components of the preview sets: node exp.js <out.json> <set...>
const S = require('C:/Users/Techlight/Desktop/wera-photos/tools/lib/session.js').open(); const C = require('C:/Users/Techlight/Desktop/wera-photos/tools/cat/ds_comp_all.json'); const fs = require('fs');
const [, , out, ...sets] = process.argv; const arts = [...new Set([...sets, ...sets.flatMap(s => C[s].flatMap(g => g.items.map(x => x.art)).filter(Boolean))])];
(async () => { const r = await S.call('horoshop_catalog_export', { expr: { article: arts }, includedParams: ['article', 'title', 'mod_title', 'link', 'images', 'display_in_showcase', 'parent'], limit: 200, allowLarge: true });
  const p = r.response.products; fs.writeFileSync(out, JSON.stringify(p, null, 1)); console.log('asked', arts.length, 'got', p.length); S.close(); })();
