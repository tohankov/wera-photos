// IPR 40/45 (05134706001, 05134707001): length 25 → 35 mm per WERA datasheet (867/1 IPR «40 IPR x 35 мм», «45 IPR x 35 мм»).
// title UA/RU by import -> slug by form -> table links on every product that links the old address -> 301 + verification. Stops on anything outside the plan.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const S = require('./session.js').open();
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', SITE = 'https://tl-shop.com.ua';
const ITEMS = { '05134706001': 6867, '05134707001': 6864 };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1200); return S.call(t, a); };
const F = ['article', 'parent_article', 'title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'];
const ex = async arts => (await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 200, allowLarge: true })).response.products;
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const slugOf = l => l.replace(SITE, '').replace(/^\/|\/$/g, '');
(async () => {
  const arts = Object.keys(ITEMS); const live = JSON.parse(fs.readFileSync(path.join(__dirname, '../audit_cache/live.json'), 'utf8'));
  const before = await ex(arts); fs.writeFileSync(BK + 'ipr_fix_before.json', JSON.stringify(before));
  const old = Object.fromEntries(before.map(p => [p.article, slugOf(p.link)]));
  // 1. titles
  const titles = before.map(p => { const t = { ua: p.title.ua.replace('x25 мм', 'x35 мм'), ru: p.title.ru.replace('x25 мм', 'x35 мм') }; return { article: p.article, title: t, mod_title: t }; });   // the title goes into both title and mod_title (the storefront shows mod_title)
  for (const t of titles) if (!/x35 мм/.test(t.title.ua) || !/x35 мм/.test(t.title.ru)) stop('title pattern not found ' + t.article);
  const d1 = await call('horoshop_catalog_import', { products: titles, dryRun: true });
  if ((d1.willChange || []).some(w => w.isNew || !Object.keys(w.changes).every(k => /^(mod_)?title.(ua|ru)$/.test(k))) || d1.willChange.length !== 2) stop('title dryRun outside plan ' + JSON.stringify(d1.willChange));
  await call('horoshop_catalog_import', { products: titles, dryRun: false }); console.log('titles written', titles.map(t => t.title.ua).join(' | '));
  // 2. slug via the form (export before/after; nothing else may change, alt_parent included)
  const mid = await ex(arts);
  const want = Object.fromEntries(arts.map(a => [a, old[a].replace('x25-mm', 'x35-mm')]));
  for (const a of arts) { const set = { 'modifications[0][alias][slug]': want[a] }; const r = await call('horoshop_admin_record_save', { entity: 'products', id: ITEMS[a], dryRun: true, set });
    const f = (r.willChange || []).map(w => w.field); if ((r.unknownFields || []).length || f.some(x => !(x in set))) stop('form dryRun outside plan ' + a + ' ' + JSON.stringify(f));
    const s = await call('horoshop_admin_record_save', { entity: 'products', id: ITEMS[a], dryRun: false, set }); if (!s.saved) stop('form not saved ' + a); }
  const after = await ex(arts); fs.writeFileSync(BK + 'ipr_fix_after.json', JSON.stringify(after));
  for (const x of mid) { const y = after.find(q => q.article === x.article); const diff = Object.keys(x).filter(k => k !== 'link' && JSON.stringify(x[k]) !== JSON.stringify(y[k])); if (diff.length) stop('form changed ' + x.article + ' ' + diff); if (slugOf(y.link) !== want[x.article]) stop('slug not applied ' + y.link); }
  console.log('slugs', after.map(p => p.link).join(' | '), '| alt_parent', after.map(p => JSON.stringify(p.alt_parent)).join(' '));
  // 3. table links on every product of the catalog that links the old addresses (candidates from the fresh audit export, re-read live)
  const cand = live.filter(p => arts.some(a => p.description.ua.includes(`href="/${old[a]}/"`) || p.description.ru.includes(`href="/ru/${old[a]}/"`))).map(p => p.article);
  const nb = await ex(cand); fs.writeFileSync(BK + 'ipr_fix_links_before.json', JSON.stringify(nb));
  const pay = nb.map(p => { const d = {}; for (const l of ['ua', 'ru']) { let h = p.description[l]; for (const a of arts) { const pre = l === 'ru' ? '/ru' : ''; h = h.split(`href="${pre}/${old[a]}/"`).join(`href="${pre}/${want[a]}/"`); } d[l] = h; } return { article: p.article, description: d }; });
  const pf = path.join(__dirname, '../fix/ipr_links.json'); fs.writeFileSync(pf, JSON.stringify({ products: pay }));
  const d3 = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
  if ((d3.willChange || []).some(w => w.isNew || Object.keys(w.changes).some(k => !/^description\.(ua|ru)$/.test(k)))) stop('links dryRun outside plan');
  await call('horoshop_catalog_import', { productsFile: pf, dryRun: false });
  const chk = await ex(cand); let bad = 0, ok = 0;
  for (const p of chk) { const b = nb.find(x => x.article === p.article); for (const l of ['ua', 'ru']) { if (arts.some(a => p.description[l].includes(`/${old[a]}/"`))) bad++;
    const norm = s => s.replace(/\s+/g, ' ').replace(/> </g, '><'); if (norm(p.description[l].split(want[arts[0]]).join('X').split(want[arts[1]]).join('Y')) !== norm(b.description[l].split(old[arts[0]]).join('X').split(old[arts[1]]).join('Y'))) bad++; else ok++; } }
  console.log(`links: products ${cand.length}, descriptions checked ${ok + bad}, still old or changed beyond links: ${bad}`);
  // 4. 301
  for (const a of arts) for (const pre of ['', '/ru']) { const o = execFileSync('curl', ['-s', '-o', path.join(__dirname, '../tmp_curl.out'), '-w', '%{http_code} %{redirect_url}', '-A', 'Mozilla/5.0 Chrome/140', `${SITE}${pre}/${old[a]}/`], { encoding: 'utf8' }); console.log('301', a, pre || 'ua', o); await sleep(1500); }
  fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: 'IPR 40/45 length 25->35 mm: titles, slugs, table links on ' + cand.length }) + '\n');
  S.close(); process.exit(bad ? 2 : 0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
