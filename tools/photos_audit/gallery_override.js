// Rule А (owner 28.10.2026): the WHOLE gallery of a product replaced by import — images {override: true, links: [...]} — when old-version photos have to leave
// the gallery (one photo cannot be deleted through the API). links = the new main first, then the photos to keep (their storefront URLs) and new WERA
// photos (raw files of this repository, images/rulea/<art>/), in the planned order.
//   node photos_audit/gallery_override.js <plan.json> backup|dry|write|verify
// plan: { name, products: { art: { links: [url ...], why } } }. verify: images count = links, every other field = backup (characteristics, alt_parent,
// description, SEO, title, price …); a field that differs is put back from the backup by import (characteristics / alt_parent), else STOP.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const [, , PL, STEP] = process.argv;
const plan = JSON.parse(fs.readFileSync(PL, 'utf8')); const BK = path.join(__dirname, `../../backup/gallery_${plan.name}_before.json`); const arts = Object.keys(plan.products);
const F = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics', 'icons', 'short_description', 'seo_title', 'seo_description', 'slug', 'brand'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { for (let k = 0; k < 20; k++) { await sleep(1500); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { await sleep((+m[1] + 5) * 1000); continue; } return r; } };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const exp = async () => { const r = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 100, allowLarge: true }); return Object.fromEntries(r.response.products.map(p => [p.article, p])); };
const TMP = path.join(__dirname, `../fix/gallery_${plan.name}.json`);
(async () => {
  if (STEP === 'backup') { if (fs.existsSync(BK)) stop('backup exists'); fs.writeFileSync(BK, JSON.stringify(await exp())); console.log('backup', BK); }
  const b = JSON.parse(fs.readFileSync(BK, 'utf8'));
  if (STEP === 'dry' || STEP === 'write') { fs.writeFileSync(TMP, JSON.stringify({ products: arts.map(a => ({ article: a, images: { override: true, links: plan.products[a].links } })) }));
    const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes || {}).some(f => !/^images/.test(f)));
    if (off.length || (dry.willChange || []).length !== arts.length) stop('dryRun outside plan ' + JSON.stringify(dry).slice(0, 400)); console.log('dry OK', arts.length);
    if (STEP === 'write') { const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop('errors ' + JSON.stringify(r.errors)); console.log('written'); } }
  if (STEP === 'verify') { const n = await exp(); let bad = 0;
    for (const a of arts) { const want = plan.products[a].links.length; const got = (n[a].images || []).length; const diff = F.filter(k => k !== 'images' && JSON.stringify(b[a][k]) !== JSON.stringify(n[a][k]));
      console.log(a, 'photos', (b[a].images || []).length, '->', got, 'planned', want, '| other fields changed:', diff.join(',') || 'none'); if (got !== want || diff.length) bad++; }
    console.log('verify problems', bad); }
  S.close(); })();
