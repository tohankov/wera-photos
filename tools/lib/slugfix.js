// Fix one product slug through the form, then repoint table links on our products to the new address.
//   node lib/slugfix.js <article> <newSlug>
// Export before/after (only link/slug may change), Horoshop's own 301 checked, table links replaced (dryRun: description only), verified.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const S = require('./session.js').open(); const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const [, , art, newSlug] = process.argv;
const T = require('../a422/tables.json');
const ex = async arts => (await S.call('horoshop_catalog_export', { expr: { article: arts }, includedParams: ['article', 'title', 'slug', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'link', 'description'], limit: 200, allowLarge: true })).response.products;
(async () => {
  const before = (await ex([art]))[0]; const oldSlug = process.argv[4] || before.link.replace('https://tl-shop.com.ua/', '').replace(/\/$/, '');
  fs.writeFileSync(BK + `slugfix_${art}_before.json`, JSON.stringify(before));
  const already = before.link.includes('/' + newSlug + '/');
  const oldSlugArg = process.argv[4]; // when the slug was already changed by an earlier run, pass the old slug
  const id = already ? null : (await S.call('horoshop_admin_list', { entity: 'products', search: art })).records.find(r => r.label.includes(art) || (r.cells || [])[0] === art).id;
  const set = { 'modifications[0][alias][slug]': newSlug };
  if (!already) {
  const d = await S.call('horoshop_admin_record_save', { entity: 'products', id: +id, dryRun: true, set });
  if ((d.willChange || []).some(w => !(w.field in set)) || (d.unknownFields || []).length) { console.log('STOP: form dryRun outside plan', JSON.stringify(d.willChange)); process.exit(2); }
  const r = await S.call('horoshop_admin_record_save', { entity: 'products', id: +id, dryRun: false, set }); console.log('saved', r.saved);
  const after = (await ex([art]))[0]; fs.writeFileSync(BK + `slugfix_${art}_after.json`, JSON.stringify(after));
  const diff = Object.keys(before).filter(k => !['link', 'slug'].includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  console.log('old', oldSlug, '-> new', after.link, '| other fields changed:', diff.length ? diff : 'none');
  if (diff.length) { console.log('STOP: form changed other fields'); process.exit(2); }
  }
  for (const pre of ['', '/ru']) { const o = execFileSync('curl', ['-s', '-o', path.join(__dirname, '../tmp_curl.out'), '-w', '%{http_code} %{redirect_url}', '-A', 'Mozilla/5.0 Chrome/140', `https://tl-shop.com.ua${pre}/${oldSlug}/`], { encoding: 'utf8' }); console.log('301 check', pre || 'ua', o); }
  // every product that may carry a table link to the article: neighbours from the plan + all products created in batches
  const cand = new Set([...(T[art]?.linked || []), ...(T[art]?.unlinked || [])]);
  for (const k of (process.env.EXTRA_KEYS || '').split(',').filter(Boolean)) [...(T[k]?.linked || []), ...(T[k]?.unlinked || [])].forEach(a => cand.add(a)); // keys mis-read from a bad href in tables.json
  for (const b of fs.readdirSync(path.join(__dirname, '../batches'))) { const f = path.join(__dirname, '../batches', b, 'links.json'); if (fs.existsSync(f)) Object.keys(JSON.parse(fs.readFileSync(f, 'utf8'))).forEach(a => cand.add(a)); }
  const all = []; const list = [...cand]; for (let i = 0; i < list.length; i += 60) all.push(...await ex(list.slice(i, i + 60)));
  const oldHref = `/${oldSlug}/`, newHref = `/${newSlug}/`; console.log('candidates', cand.size, 'exported', all.length, 'oldHref', oldHref);
  const hit = all.filter(p => ['ua', 'ru'].some(l => p.description[l].includes(`href="${oldHref}"`) || p.description[l].includes(`href="/ru${oldHref}"`)));
  fs.writeFileSync(BK + `slugfix_${art}_links_before.json`, JSON.stringify(hit));
  const products = hit.map(p => ({ article: p.article, description: Object.fromEntries(['ua', 'ru'].map(l => [l, p.description[l].split(`href="${oldHref}"`).join(`href="${newHref}"`).split(`href="/ru${oldHref}"`).join(`href="/ru${newHref}"`)])) }));
  console.log('products linking the old address:', hit.length);
  if (products.length) {
    const pf = path.join(__dirname, `../tmp_slugfix_${art}.json`); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dr = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
    const off = dr.willChange.filter(w => w.isNew || Object.keys(w.changes || {}).some(k => !['description.ua', 'description.ru'].includes(k)));
    if (off.length) { console.log('STOP: links dryRun outside plan', off.map(w => w.article)); process.exit(2); }
    const wr = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('links write', wr.status, wr.updated, '/', wr.total, JSON.stringify(wr.errors || []));
    const chk = await ex(hit.map(p => p.article)); const bad = chk.filter(p => ['ua', 'ru'].some(l => p.description[l].includes(oldHref)));
    console.log('verify: still old link in', bad.length, '| products now linking new:', chk.filter(p => p.description.ua.includes(`href="${newHref}"`)).length);
    fs.unlinkSync(pf);
  }
  fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `slug fix ${art}: ${oldSlug} -> ${newSlug}; table links repointed on ${hit.length}` }) + '\n');
  S.close(); process.exit(0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
