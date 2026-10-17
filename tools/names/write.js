// Write approved previews to the site in batches, resumable: node names/write.js ean|title [batchSize=200] [maxSeconds=480]
//   ean:   gtin from inventory/ean_preview.xlsx «Найдено» (WERA datasheets) — only products whose live gtin is still empty
//   title: mechanical title fixes from names/mech_plan.json (names/build.js) — only products whose live UA/RU title is still the one the plan was built from
//   modtitle: the same titles into the modification title (mod_title — what the storefront h1 and the admin list show); only the languages whose live
//   mod_title is still the old title (an empty mod_title falls back to the product title and is left empty; any other text is skipped and reported)
// Per batch: live export (backup/) -> dryRun: ONLY gtin / title.ua / title.ru may change, to exactly the planned values, else STOP -> import ->
// export after: the target field reads back as planned and every other exported field (slug, link, price, presence, parent, alt_parent…) is unchanged, else STOP.
// Done articles are kept in names/write_state.json, so a rerun continues where it stopped.
const fs = require('fs'), path = require('path'), X = require('xlsx'); const S = require('../lib/session.js').open();
const MODE = process.argv[2], SIZE = +process.argv[3] || 200, SEC = +process.argv[4] || 480, t0 = Date.now();
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', INV = path.join(__dirname, '../../inventory/'), SF = path.join(__dirname, 'write_state.json');
const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}; const my = st[MODE] = st[MODE] || { done: [], skipped: {}, batches: 0 };
const save = () => fs.writeFileSync(SF, JSON.stringify(st));
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { save(); console.log('STOP', m); S.close(); process.exit(2); };
let plan;
if (MODE === 'ean') plan = Object.fromEntries(X.utils.sheet_to_json(X.readFile(INV + 'ean_preview.xlsx').Sheets['Найдено']).map(r => [r['Артикул'], { gtin: String(r['EAN']) }]));
else if (MODE === 'title' || MODE === 'modtitle') plan = require('./mech_plan.json');
else stop('mode ean|title');
const FIELDS = ['article', 'parent_article', 'title', 'slug', 'link', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'gtin', 'mod_title'];
const exportOf = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: FIELDS, limit: 100, allowLarge: true });
  if (!r.response) stop('export failed: ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); } return out; };
const OWN = { ean: 'gtin', title: 'title', modtitle: 'mod_title' }[MODE]; const send = {};
const target = MODE === 'ean' ? ['gtin'] : [`${OWN}.ua`, `${OWN}.ru`];
const get = (p, f) => f.split('.').reduce((o, k) => (o || {})[k], p);
const want = (a, f) => MODE === 'ean' ? plan[a].gtin : plan[a][f.split('.')[1]];
const checked = (a, f) => MODE !== 'modtitle' || f.split('.')[1] in send[a];
(async () => {
  const done = new Set(my.done); let todo = Object.keys(plan).filter(a => !done.has(a) && !my.skipped[a]); let wrote = 0;
  while (todo.length && (Date.now() - t0) / 1000 < SEC) {
    const batch = todo.slice(0, SIZE); todo = todo.slice(SIZE); const n = ++my.batches;
    const before = await exportOf(batch); fs.writeFileSync(BK + `names_${MODE}_b${n}_before.json`, JSON.stringify(before));
    const live = Object.fromEntries(before.map(p => [p.article, p])); const go = [];
    for (const a of batch) { const p = live[a]; if (!p) { my.skipped[a] = 'нет в выгрузке'; continue; }
      if (MODE === 'ean' && p.gtin) { my.skipped[a] = 'штрихкод уже есть: ' + p.gtin; continue; }
      if (MODE === 'title' && (p.title.ua !== plan[a].oldUa || p.title.ru !== plan[a].oldRu)) { my.skipped[a] = 'название на сайте изменилось после выгрузки'; continue; }
      if (MODE === 'modtitle') { const m = p.mod_title || {}; const old = { ua: plan[a].oldUa, ru: plan[a].oldRu }; send[a] = {};
        for (const l of ['ua', 'ru']) { if (m[l] === old[l]) send[a][l] = plan[a][l]; else if (m[l] && m[l] !== plan[a][l]) my.skipped[a] = `mod_title ${l} отличается от названия: ${m[l]}`; }
        if (my.skipped[a] || !Object.keys(send[a]).length) { if (!my.skipped[a]) my.done.push(a); continue; } }
      go.push(a); }
    if (!go.length) { save(); continue; }
    const products = go.map(a => MODE === 'ean' ? { article: a, gtin: plan[a].gtin } : MODE === 'title' ? { article: a, title: { ua: plan[a].ua, ru: plan[a].ru } } : { article: a, mod_title: send[a] });
    const pf = path.join(__dirname, `write_${MODE}_payload.json`); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); if (!dry.willChange) stop('dryRun failed ' + JSON.stringify(dry).slice(0, 300));
    if (dry.summary.newProducts) stop('dryRun: new products');
    for (const w of dry.willChange) { const off = Object.keys(w.changes).filter(k => !target.includes(k)); if (off.length || w.isNew) stop(`dryRun ${w.article}: other fields ${off}`);
      for (const [k, v] of Object.entries(w.changes)) if (v.to !== want(w.article, k)) stop(`dryRun ${w.article} ${k}: ${v.to} ≠ plan ${want(w.article, k)}`); }
    if (dry.willChange.length !== go.length) console.log(`batch ${n}: dryRun changes ${dry.willChange.length} of ${go.length} (the rest already as planned)`);
    const r = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300));
    const after = await exportOf(go); fs.writeFileSync(BK + `names_${MODE}_b${n}_after.json`, JSON.stringify(after));
    const bad = []; for (const a of go) { const b = live[a], p = after.find(x => x.article === a); if (!p) { bad.push(a + ' missing after'); continue; }
      for (const f of target) if (checked(a, f) && get(p, f) !== want(a, f)) bad.push(`${a} ${f}: «${get(p, f)}» ≠ plan «${want(a, f)}»`);
      for (const f of FIELDS) { if (f === OWN) { if (MODE === 'modtitle') for (const l of ['ua', 'ru']) if (!(l in send[a]) && get(b, f + '.' + l) !== get(p, f + '.' + l)) bad.push(`${a} mod_title ${l} changed unexpectedly`); continue; } if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${a} ${f} changed: ${JSON.stringify(b[f]).slice(0, 80)} → ${JSON.stringify(p[f]).slice(0, 80)}`); } }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `names ${MODE} batch ${n}: ${go.length} products, problems ${bad.length}` }) + '\n');
    if (bad.length) { fs.writeFileSync(path.join(__dirname, `write_${MODE}_problems.json`), JSON.stringify(bad, null, 1)); stop(`batch ${n} verify: ${bad.length} problems\n` + bad.slice(0, 10).join('\n')); }
    my.done.push(...go); wrote += go.length; save(); console.log(`batch ${n}: written and verified ${go.length} (imported ${r.updated}/${r.total ?? go.length})`); }
  const left = Object.keys(plan).filter(a => !my.done.includes(a) && !my.skipped[a]).length;
  console.log(`${MODE}: this run ${wrote}, total done ${my.done.length}, skipped ${Object.keys(my.skipped).length}, left ${left}, ${Math.round((Date.now() - t0) / 1000)} s`);
  S.close(); process.exit(0);
})().catch(e => { console.error(e); save(); S.close(); process.exit(1); });
