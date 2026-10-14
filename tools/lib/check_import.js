// Compare the live products of a batch with what the import wrote (payload_new.json): every field of the payload + alt_parent.
//   node lib/check_import.js batches/<name> [snapshotName]   -> backup/<snapshotName>.json (live export), exit 2 on any difference
const fs = require('fs'), path = require('path'); const S = require('./session.js').open();
const D = path.resolve(process.argv[2]), BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const pay = JSON.parse(fs.readFileSync(path.join(D, 'payload_new.json'), 'utf8')).products;
(async () => {
  const r = await S.call('horoshop_catalog_export', { expr: { article: pay.map(p => p.article) }, includedParams: ['article', 'parent_article', 'title', 'slug', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'brand'], limit: 200, allowLarge: true });
  const live = r.response.products; if (process.argv[3]) fs.writeFileSync(BK + process.argv[3] + '.json', JSON.stringify(live));
  const bad = [];
  for (const p of pay) {
    const y = live.find(q => q.article === p.article); if (!y) { bad.push(p.article + ' missing'); continue; }
    const eq = (k, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${p.article} ${k}`); };
    eq('title', p.title, { ua: y.title.ua, ru: y.title.ru }); eq('description.ua', p.description.ua, y.description.ua); eq('description.ru', p.description.ru, y.description.ru);
    eq('price', p.price, y.price); eq('parent', p.parent.id, y.parent.id); eq('alt_parent', (p.alt_parent || []).map(x => x.id).sort(), (y.alt_parent || []).map(x => x.id).sort());
    eq('presence', 'В наявності', y.presence.value.ua); eq('display', 1, y.display_in_showcase); eq('gtin', p.gtin, y.gtin); eq('brand', 'WERA', (y.brand && (y.brand.value.ua || y.brand.value)) || '');
    if (!(y.images || []).length) bad.push(p.article + ' no image');
  }
  console.log('checked', pay.length, 'live', live.length, 'differences', bad.length ? bad : 'none');
  S.close(); process.exit(bad.length ? 2 : 0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
