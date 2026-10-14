// Rewrite truncated SEO meta descriptions (UA/RU) of the products of ONE batch, through the product form.
//   node lib/meta_fix.js <batch> <articles.json>
// Export before -> per product form dryRun (only the two meta fields may change, else STOP) -> save -> export after:
// every exported field incl. alt_parent must be unchanged (else restore by import + STOP) -> read back the meta.
const fs = require('fs'), path = require('path'); const { metaOf } = require('./meta.js'); const S = require('./session.js').open();
const [, , NAME, listFile] = process.argv; const D = path.join(__dirname, '../batches', NAME);
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const arts = JSON.parse(fs.readFileSync(listFile, 'utf8'));
const content = require(path.join(D, 'content.js')); const ids = JSON.parse(fs.readFileSync(path.join(D, 'ids.json'), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const call = async (t, a) => { await sleep(1000); return S.call(t, a); };
const exportArgs = { expr: { article: arts }, includedParams: ['article', 'parent_article', 'title', 'slug', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'], limit: 200, allowLarge: true };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
(async () => {
  const plan = {};
  for (const a of arts) { const c = content[a]; if (!c || !ids[a]) stop('no content/id for ' + a); const t = c.seo || c.intro;
    plan[a] = { 'parent_common[i18n][3][seo_description]': metaOf(t.ua), 'parent_common[i18n][1][seo_description]': metaOf(t.ru) };
    for (const v of Object.values(plan[a])) if (v.length > 160 || !/[.!?…]$/.test(v)) stop('bad meta for ' + a + ': ' + v); }
  const before = (await call('horoshop_catalog_export', exportArgs)).response.products; if (before.length !== arts.length) stop('export before incomplete');
  fs.writeFileSync(BK + `meta_fix_${NAME}_before.json`, JSON.stringify(before));
  for (const a of arts) { const r = await call('horoshop_admin_record_save', { entity: 'products', id: +ids[a], dryRun: true, set: plan[a] }); const f = (r.willChange || []).map(w => w.field);
    if ((r.unknownFields || []).length || f.some(x => !(x in plan[a]))) stop(`form dryRun outside plan for ${a}: ${JSON.stringify(f)}`); }
  let saved = 0; for (const a of arts) { const r = await call('horoshop_admin_record_save', { entity: 'products', id: +ids[a], dryRun: false, set: plan[a] }); if (r.saved) saved++; else console.log('not saved (no change?)', a); }
  const after = (await call('horoshop_catalog_export', exportArgs)).response.products; fs.writeFileSync(BK + `meta_fix_${NAME}_after.json`, JSON.stringify(after));
  const diffs = []; for (const x of before) { const y = after.find(q => q.article === x.article); for (const k of Object.keys(x)) if (JSON.stringify(x[k]) !== JSON.stringify(y && y[k])) diffs.push(`${x.article} ${k}`); }
  if (diffs.length) { const restore = before.filter(x => diffs.some(d => d.startsWith(x.article))).map(x => ({ article: x.article, alt_parent: x.alt_parent, parent: x.parent, title: x.title, description: x.description, price: x.price, display_in_showcase: x.display_in_showcase }));
    fs.writeFileSync(path.join(D, 'meta_restore.json'), JSON.stringify({ products: restore })); await call('horoshop_catalog_import', { productsFile: path.join(D, 'meta_restore.json'), dryRun: false }); stop('form changed other fields (restored): ' + diffs.join(', ')); }
  let ok = 0; for (const a of arts) { const r = await call('horoshop_admin_record_get', { entity: 'products', id: +ids[a], fields: ['seo_description'] });
    if (Object.entries(plan[a]).every(([k, v]) => r.fields[k] === v)) ok++; else console.log('read-back differs', a); }
  console.log(`DONE ${NAME}: products ${arts.length}, saved ${saved}, other fields unchanged (incl. alt_parent), meta read back ok ${ok}/${arts.length}`);
  fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `meta fix ${NAME}: ${arts.length} products, whole-phrase SEO meta` }) + '\n');
  S.close(); process.exit(ok === arts.length ? 0 : 2);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
