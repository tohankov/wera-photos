// Google Merchant preparation (owner decisions 18–19.10.2026), product fields through catalog_import. node gm/write.js <job> plan | dry | write [batch=100] [only=article,...]
//   fix:   05049065001 condition «Новий»; 05480172001 price_old cleared (it equalled the price, 70 = 70); mpn = the WERA article (11 digits) on every product
//          whose mpn is still empty — the TL sets (our own bundles) and «Home Kraftform» have no WERA article and get no mpn.
//   feed:  «Завантажувати на маркетплейси → Google Feed for Merchant Center» on every product shown on the storefront, except the TL sets (owner: not in the feed)
//          and EXCL (articles not confirmed as WERA); hidden products stay without it. Expected count after: visible − TL − EXCL.
//   excl:  EXCL products: mpn and the Google Feed flag removed (05133126001: no WERA datasheet, no wera.de page, not at GRN — not confirmed as a WERA article).
//   combo: «Опис для маркетплейсів» (marketplace_description UA/RU = gm/mdesc.js clean() of the live description, every product) + the feed flag where it is
//          still missing (same rule as feed). Planned per batch from the live export, so the text always comes from the current description.
// Per batch: live export (backup/gm_<job>_b<N>_before.json, never overwritten on a rerun) -> dryRun: only the job's fields may change, to the planned values ->
// import -> export after (backup/gm_<job>_b<N>_after.json): planned fields read back as planned, every other exported field unchanged.
// HTTP 429 (hour requests limit): state is kept, the script prints «RETRY <seconds>» and exits 3; run it again after that time — it continues where it stopped.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const { clean } = require('./mdesc.js');
const [JOB, MODE = 'plan', SZ, ONLY] = process.argv.slice(2); const SIZE = +SZ || 100;
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', PF = path.join(__dirname, `${JOB}_plan.json`), SF = path.join(__dirname, `${JOB}_state.json`);
const FEED = 'Google Feed for Merchant Center', EXCL = ['05133126001'];
const FIELDS = ['article', 'parent_article', 'title', 'mod_title', 'price', 'price_old', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'gtin', 'mpn', 'brand', 'condition', 'export_to_marketplace', 'link', 'slug',
  ...(JOB === 'combo' ? ['description', 'marketplace_description'] : [])];
const sleep = ms => new Promise(r => setTimeout(r, ms)), T0 = Date.now();
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const call = async (t, a) => { await sleep(1500); const r = await S.call(t, a); const m = r && r.raw && /HTTP_ERROR 429[\s\S]*?Retry after (\d+) seconds/.exec(r.raw);
  if (m) { console.log(`RETRY ${m[1]} (429 on ${t}, until ${new Date(Date.now() + m[1] * 1000).toTimeString().slice(0, 5)})`); S.close(); process.exit(3); } return r; };
const isTL = a => /^TL\d+$/.test(a), wantFeed = p => +p.display_in_showcase === 1 && !isTL(p.article) && !EXCL.includes(p.article);
const nl = s => String(s || '').replace(/\r\n?/g, '\n').trim();
// the value a field reads back as in the export, for comparison with the plan
const norm = (f, v) => f === 'condition' ? (v && v.value ? v.value.ua : v) : f === 'price_old' ? +v || 0 : f === 'mpn' ? v || ''
  : f === 'export_to_marketplace' ? JSON.stringify([].concat(v || []).map(x => typeof x === 'string' ? x : (x.value && (x.value.ua || x.value)) || x.title || x.id).sort())
  : f === 'marketplace_description' ? JSON.stringify({ ua: nl(v && v.ua), ru: nl(v && v.ru) }) : v;
const exportAll = async (expr) => { const out = []; for (let off = 0; ; off += 100) { const r = await call('horoshop_catalog_export', { ...(expr ? { expr } : {}), includedParams: FIELDS, limit: 100, offset: off, allowLarge: true });
  if (!r.response) stop('export failed ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); if (r.response.products.length < 100 || expr) break; } return out; };
const exportOf = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) out.push(...await exportAll({ article: arts.slice(i, i + 100) })); return out; };
const comboPlan = p => { const s = {}; const md = { ua: clean(p.description && p.description.ua, 'ua'), ru: clean(p.description && p.description.ru, 'ru') };
  if (norm('marketplace_description', p.marketplace_description) !== norm('marketplace_description', md)) s.marketplace_description = md;
  if (wantFeed(p) && norm('export_to_marketplace', p.export_to_marketplace) !== JSON.stringify([FEED])) s.export_to_marketplace = [FEED]; return s; };
(async () => {
  if (MODE === 'plan') { const all = await exportAll(); const plan = {};
    if (JOB === 'fix') { for (const p of all) { const s = {}; if (p.article === '05049065001' && norm('condition', p.condition) !== 'Новий') s.condition = 'Новий';
        if (p.article === '05480172001' && +p.price_old > 0) { if (+p.price_old !== +p.price) stop('05480172001 price_old ' + p.price_old + ' ≠ price ' + p.price); s.price_old = 0; }
        if (/^\d{11}$/.test(p.article) && !EXCL.includes(p.article) && !p.mpn) s.mpn = p.article; if (Object.keys(s).length) plan[p.article] = s; } }
    else if (JOB === 'feed') { for (const p of all) if (wantFeed(p) && norm('export_to_marketplace', p.export_to_marketplace) !== JSON.stringify([FEED])) plan[p.article] = { export_to_marketplace: [FEED] }; }
    else if (JOB === 'excl') { for (const p of all) if (EXCL.includes(p.article)) { const s = {}; if (p.mpn) s.mpn = ''; if (norm('export_to_marketplace', p.export_to_marketplace) !== '[]') s.export_to_marketplace = [];
        if (Object.keys(s).length) plan[p.article] = s; } }
    else if (JOB === 'combo') { for (const p of all) plan[p.article] = {}; }   // the fields are planned per batch from the live export
    else stop('job fix | feed | excl | combo');
    const vis = all.filter(p => +p.display_in_showcase === 1);
    console.log('visible', vis.length, 'TL visible', vis.filter(p => isTL(p.article)).length, 'excluded visible', vis.filter(p => EXCL.includes(p.article)).length, 'expected with flag', vis.filter(wantFeed).length,
      'with flag now', all.filter(p => norm('export_to_marketplace', p.export_to_marketplace) === JSON.stringify([FEED])).length);
    fs.writeFileSync(PF, JSON.stringify(plan, null, 1)); const cnt = {}; for (const s of Object.values(plan)) for (const k of Object.keys(s)) cnt[k] = (cnt[k] || 0) + 1;
    console.log('catalog', all.length, 'products in plan', Object.keys(plan).length, JSON.stringify(cnt)); S.close(); process.exit(0); }
  const plan = require(PF); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: [], batches: 0 };
  let todo = Object.keys(plan).filter(a => !st.done.includes(a)); if (ONLY) todo = todo.filter(a => ONLY.replace(/^only=/, '').split(',').includes(a)); if (MODE === 'dry') todo = todo.slice(0, SIZE);
  while (todo.length) { const batch = todo.slice(0, SIZE); todo = todo.slice(SIZE); const n = MODE === 'write' ? st.batches + 1 : 0;
    const before = await exportOf(batch); const live = Object.fromEntries(before.map(p => [p.article, p]));
    if (MODE === 'write') { const f = BK + `gm_${JOB}_b${n}_before.json`; fs.writeFileSync(fs.existsSync(f) ? f.replace('_before', '_before_rerun' + Date.now()) : f, JSON.stringify(before)); }
    const want = {}; for (const a of batch) { if (!live[a]) stop(a + ' not in the live export'); want[a] = JOB === 'combo' ? comboPlan(live[a]) : plan[a]; }
    const send = batch.filter(a => Object.keys(want[a]).length); const cnt = {}; for (const a of send) for (const k of Object.keys(want[a])) cnt[k] = (cnt[k] || 0) + 1;
    if (send.length) { const products = send.map(a => ({ article: a, ...want[a] })); const pf = path.join(__dirname, `${JOB}_payload.json`); fs.writeFileSync(pf, JSON.stringify({ products }));
      const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); if (!dry.willChange) stop('dryRun failed ' + JSON.stringify(dry).slice(0, 300)); if (dry.summary.newProducts) stop('new products');
      for (const w of dry.willChange) { const off = Object.keys(w.changes).filter(k => !(k.split('.')[0] in want[w.article])); if (off.length) stop(`dryRun ${w.article}: other fields ${off}`); }
      console.log(`batch ${n}: to send ${send.length} of ${batch.length} ${JSON.stringify(cnt)}, dryRun changes ${dry.willChange.length}`, MODE === 'dry' ? JSON.stringify(dry.willChange.slice(0, 2)).slice(0, 1500) : '');
      if (MODE === 'dry') break;
      const r = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300)); }
    else { console.log(`batch ${n}: nothing to change in ${batch.length}`); if (MODE === 'dry') break; }
    const after = send.length ? await exportOf(batch) : before; fs.writeFileSync(BK + `gm_${JOB}_b${n}_after.json`, JSON.stringify(after)); const bad = [];
    for (const a of batch) { const b = live[a], p = after.find(x => x.article === a); if (!p) { bad.push(a + ' missing'); continue; }
      for (const f of FIELDS) { if (f in want[a]) { if (norm(f, p[f]) !== norm(f, want[a][f])) bad.push(`${a} ${f}: ${JSON.stringify(p[f]).slice(0, 200)} ≠ plan ${JSON.stringify(want[a][f]).slice(0, 200)}`); continue; }
        if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${a} ${f} changed`); } }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `gm ${JOB} batch ${n}: ${batch.length} products, sent ${send.length} ${JSON.stringify(cnt)}, problems ${bad.length}` }) + '\n');
    if (bad.length) stop(`batch ${n} verify: ${bad.length}\n` + bad.slice(0, 10).join('\n'));
    st.batches = n; st.done.push(...batch); st.sent = (st.sent || 0) + send.length; st.cnt = st.cnt || {}; for (const k in cnt) st.cnt[k] = (st.cnt[k] || 0) + cnt[k];
    fs.writeFileSync(SF, JSON.stringify(st)); console.log(`batch ${n}: written and verified ${batch.length} (sent ${send.length})`); if (process.env.ONE || Date.now() - T0 > (+process.env.MAXSEC || 1e9) * 1000) break; }
  console.log(JOB, 'done', st.done.length, 'of', Object.keys(plan).length, 'sent', st.sent || '', JSON.stringify(st.cnt || {})); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
