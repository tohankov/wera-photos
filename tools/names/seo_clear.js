// Products with their own SEO title / description (owner decision 18.10.2026): seo_title UA/RU is cleared on all of them, so the store template applies;
// seo_description is cleared only where it is a generated restatement of the name (one sentence ending «довжина / стрижень N мм.») or «Під замовлення.» —
// a description with any fact beyond the name is kept and listed in inventory/seo_own_descriptions.xlsx.
// node names/seo_clear.js plan | dry | write [batch=100]. Per batch: live export (backup/seo_clear_b<N>_before.json) -> dryRun: only seo_title.* / seo_description.*
// may change, to "" -> import -> export after: those fields empty, every other exported field unchanged.
const fs = require('fs'), path = require('path'), X = require('xlsx'); const S = require('../lib/session.js').open();
const MODE = process.argv[2] || 'plan', SIZE = +process.argv[3] || 100; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', SF = path.join(__dirname, 'seo_clear_state.json');
const FIELDS = ['article', 'title', 'mod_title', 'slug', 'link', 'price', 'presence', 'parent', 'alt_parent', 'gtin', 'seo_title', 'seo_description', 'seo_keywords', 'h1_title'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const PURE = /^[^.]*\(WERA \d{11}\)[^.]*(довжина|стрижень) [\d,]+(″)? мм\.$/, EXTRA = /—|футляр|візка|ударним|без інструментів|упаковка|:/i;
const generated = d => d === 'Під замовлення.' || (PURE.test(d) && !EXTRA.test(d));
const exportOf = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: FIELDS, limit: 100, allowLarge: true });
  if (!r.response) stop('export failed ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); } return out; };
(async () => {
  if (MODE === 'plan') { const C = require('./catalog_seo.json').filter(p => ['ua', 'ru'].some(l => p.seo_title[l] || p.seo_description[l]));
    const plan = {}, keep = []; for (const p of C) { const clearDesc = generated(p.seo_description.ua) && generated(p.seo_description.ru.replace(/^Под заказ\.$/, 'Під замовлення.').replace(/\(WERA (\d{11})\)(.*)(длина|стержень) /, '(WERA $1)$2довжина ')) ;
      plan[p.article] = { desc: clearDesc }; if (!clearDesc) keep.push({ 'Артикул': p.article, 'Раздел': p.parent.value, 'Название': p.mod_title.ua, 'Своё описание UA': p.seo_description.ua, 'Своё описание RU': p.seo_description.ru, 'Свой title UA (будет очищен)': p.seo_title.ua }); }
    fs.writeFileSync(path.join(__dirname, 'seo_clear_plan.json'), JSON.stringify(plan));
    const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(keep); ws['!cols'] = [14, 40, 60, 80, 80, 60].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Свои описания'); X.writeFile(wb, path.join(__dirname, '../../inventory/seo_own_descriptions.xlsx'));
    console.log('products', C.length, 'clear title', C.length, 'clear description', Object.values(plan).filter(x => x.desc).length, 'keep description', keep.length); S.close(); process.exit(0); }
  const plan = require('./seo_clear_plan.json'); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: [], batches: 0 };
  let todo = Object.keys(plan).filter(a => !st.done.includes(a)); if (MODE === 'dry') todo = todo.slice(0, SIZE);
  while (todo.length) { const batch = todo.slice(0, SIZE); todo = todo.slice(SIZE); const n = MODE === 'write' ? ++st.batches : 0;
    const before = await exportOf(batch); if (MODE === 'write') fs.writeFileSync(BK + `seo_clear_b${n}_before.json`, JSON.stringify(before)); const live = Object.fromEntries(before.map(p => [p.article, p]));
    const products = batch.map(a => ({ article: a, seo_title: { ua: '', ru: '' }, ...(plan[a].desc ? { seo_description: { ua: '', ru: '' } } : {}) }));
    const target = a => ['seo_title.ua', 'seo_title.ru', ...(plan[a].desc ? ['seo_description.ua', 'seo_description.ru'] : [])];
    const pf = path.join(__dirname, 'seo_clear_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); if (!dry.willChange) stop('dryRun failed ' + JSON.stringify(dry).slice(0, 300)); if (dry.summary.newProducts) stop('new products');
    for (const w of dry.willChange) { const off = Object.keys(w.changes).filter(k => !target(w.article).includes(k)); if (off.length) stop(`dryRun ${w.article}: other fields ${off}`);
      for (const [k, v] of Object.entries(w.changes)) if (v.to !== '' && v.to != null) stop(`dryRun ${w.article} ${k} -> ${JSON.stringify(v.to)}`); }
    console.log(`batch ${n}: dryRun changes ${dry.willChange.length} of ${batch.length}`, MODE === 'dry' ? JSON.stringify(dry.willChange[0]).slice(0, 400) : '');
    if (MODE === 'dry') break;
    const r = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300));
    const after = await exportOf(batch); fs.writeFileSync(BK + `seo_clear_b${n}_after.json`, JSON.stringify(after)); const bad = [];
    for (const a of batch) { const b = live[a], p = after.find(x => x.article === a); if (!p) { bad.push(a + ' missing'); continue; }
      for (const f of FIELDS) { const t = target(a).filter(k => k.startsWith(f + '.')); if (t.length) { for (const k of t) if ((p[f] || {})[k.split('.')[1]]) bad.push(`${a} ${k} not empty`); for (const l of ['ua', 'ru']) if (!t.includes(`${f}.${l}`) && (b[f] || {})[l] !== (p[f] || {})[l]) bad.push(`${a} ${f}.${l} changed`); continue; }
        if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${a} ${f} changed`); } }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `seo_clear batch ${n}: ${batch.length} products, problems ${bad.length}` }) + '\n');
    if (bad.length) { fs.writeFileSync(SF, JSON.stringify(st)); stop(`batch ${n} verify: ${bad.length}\n` + bad.slice(0, 10).join('\n')); }
    st.done.push(...batch); fs.writeFileSync(SF, JSON.stringify(st)); console.log(`batch ${n}: cleared and verified ${batch.length}`); }
  console.log('done', st.done.length, 'of', Object.keys(plan).length); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
