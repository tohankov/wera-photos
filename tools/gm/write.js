// Google Merchant preparation (owner decisions 18.10.2026), product fields through catalog_import. node gm/write.js <job> plan | dry | write [batch=100] [only=article,...]
//   fix:  05049065001 condition «Новий»; 05480172001 price_old cleared (it equalled the price, 70 = 70); mpn = the WERA article (11 digits) on every product
//         whose mpn is still empty — the TL sets (our own bundles) and «Home Kraftform» have no WERA article and get no mpn.
//   feed: «Завантажувати на маркетплейси → Google Feed for Merchant Center» on every product shown on the storefront, except the TL sets (owner: not in the feed);
//         hidden products stay without it. Expected count after: visible − TL.
// Per batch: live export (backup/gm_<job>_b<N>_before.json) -> dryRun: only the job's fields may change, to the planned values -> import ->
// export after (backup/gm_<job>_b<N>_after.json): planned fields read back as planned, every other exported field unchanged.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open();
const [JOB, MODE = 'plan', SZ, ONLY] = process.argv.slice(2); const SIZE = +SZ || 100;
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', PF = path.join(__dirname, `${JOB}_plan.json`), SF = path.join(__dirname, `${JOB}_state.json`);
const FEED = 'Google Feed for Merchant Center';
const FIELDS = ['article', 'parent_article', 'title', 'mod_title', 'price', 'price_old', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'gtin', 'mpn', 'brand', 'condition', 'export_to_marketplace', 'link', 'slug'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const isTL = a => /^TL\d+$/.test(a);
// the value a field reads back as in the export, for comparison with the plan
const norm = (f, v) => f === 'condition' ? (v && v.value ? v.value.ua : v) : f === 'price_old' ? +v || 0 : f === 'export_to_marketplace' ? JSON.stringify([].concat(v || []).map(x => typeof x === 'string' ? x : (x.value && (x.value.ua || x.value)) || x.title || x.id).sort()) : v;
const exportAll = async (expr) => { const out = []; for (let off = 0; ; off += 100) { const r = await call('horoshop_catalog_export', { ...(expr ? { expr } : {}), includedParams: FIELDS, limit: 100, offset: off, allowLarge: true });
  if (!r.response) stop('export failed ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); if (r.response.products.length < 100 || expr) break; } return out; };
const exportOf = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) out.push(...await exportAll({ article: arts.slice(i, i + 100) })); return out; };
(async () => {
  if (MODE === 'plan') { const all = await exportAll(); const plan = {};
    if (JOB === 'fix') { for (const p of all) { const s = {}; if (p.article === '05049065001' && norm('condition', p.condition) !== 'Новий') s.condition = 'Новий';
        if (p.article === '05480172001' && +p.price_old > 0) { if (+p.price_old !== +p.price) stop('05480172001 price_old ' + p.price_old + ' ≠ price ' + p.price); s.price_old = 0; }
        if (/^\d{11}$/.test(p.article) && !p.mpn) s.mpn = p.article; if (Object.keys(s).length) plan[p.article] = s; } }
    else if (JOB === 'feed') { for (const p of all) if (+p.display_in_showcase === 1 && !isTL(p.article) && norm('export_to_marketplace', p.export_to_marketplace) !== JSON.stringify([FEED])) plan[p.article] = { export_to_marketplace: [FEED] };
      const vis = all.filter(p => +p.display_in_showcase === 1); console.log('visible', vis.length, 'TL visible', vis.filter(p => isTL(p.article)).length, 'expected with flag', vis.filter(p => !isTL(p.article)).length); }
    else stop('job fix | feed');
    fs.writeFileSync(PF, JSON.stringify(plan, null, 1)); const cnt = {}; for (const s of Object.values(plan)) for (const k of Object.keys(s)) cnt[k] = (cnt[k] || 0) + 1;
    console.log('catalog', all.length, 'products to change', Object.keys(plan).length, JSON.stringify(cnt)); S.close(); process.exit(0); }
  const plan = require(PF); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: [], batches: 0 };
  let todo = Object.keys(plan).filter(a => !st.done.includes(a)); if (ONLY) todo = todo.filter(a => ONLY.split(',').includes(a)); if (MODE === 'dry') todo = todo.slice(0, SIZE);
  while (todo.length) { const batch = todo.slice(0, SIZE); todo = todo.slice(SIZE); const n = MODE === 'write' ? ++st.batches : 0;
    const before = await exportOf(batch); if (MODE === 'write') fs.writeFileSync(BK + `gm_${JOB}_b${n}_before.json`, JSON.stringify(before)); const live = Object.fromEntries(before.map(p => [p.article, p]));
    const products = batch.map(a => ({ article: a, ...plan[a] })); const pf = path.join(__dirname, `${JOB}_payload.json`); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); if (!dry.willChange) stop('dryRun failed ' + JSON.stringify(dry).slice(0, 300)); if (dry.summary.newProducts) stop('new products');
    for (const w of dry.willChange) { const off = Object.keys(w.changes).filter(k => !(k in plan[w.article])); if (off.length) stop(`dryRun ${w.article}: other fields ${off}`); }
    console.log(`batch ${n}: dryRun changes ${dry.willChange.length} of ${batch.length}`, MODE === 'dry' ? JSON.stringify(dry.willChange.slice(0, 2)).slice(0, 500) : '');
    if (MODE === 'dry') break;
    const r = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300));
    const after = await exportOf(batch); fs.writeFileSync(BK + `gm_${JOB}_b${n}_after.json`, JSON.stringify(after)); const bad = [];
    for (const a of batch) { const b = live[a], p = after.find(x => x.article === a); if (!p) { bad.push(a + ' missing'); continue; }
      for (const f of FIELDS) { if (f in plan[a]) { if (norm(f, p[f]) !== norm(f, plan[a][f])) bad.push(`${a} ${f}: ${JSON.stringify(p[f])} ≠ plan ${JSON.stringify(plan[a][f])}`); continue; }
        if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${a} ${f} changed`); } }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `gm ${JOB} batch ${n}: ${batch.length} products, problems ${bad.length}` }) + '\n');
    if (bad.length) { fs.writeFileSync(SF, JSON.stringify(st)); stop(`batch ${n} verify: ${bad.length}\n` + bad.slice(0, 10).join('\n')); }
    st.done.push(...batch); fs.writeFileSync(SF, JSON.stringify(st)); console.log(`batch ${n}: written and verified ${batch.length}`); }
  console.log(JOB, 'done', st.done.length, 'of', Object.keys(plan).length); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
