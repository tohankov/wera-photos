// Clear products' own SEO fields so the store templates apply (owner decisions 18.10.2026). node names/seo_clear.js [job] plan | dry | write [batch=100]
//   own  (default): products with their own SEO title / description — seo_title UA/RU cleared on all of them; seo_description cleared only where it is a generated
//        restatement of the name (one sentence ending «довжина / стрижень N мм.») or «Під замовлення.»; the rest kept and listed in inventory/seo_own_descriptions.xlsx.
//   desc: the descriptions «own» kept (inventory/seo_own_descriptions.xlsx stays as their archive) — seo_description UA/RU cleared.
//   h1:   products whose own h1_title differs from the live mod_title (old-format names on the storefront) — h1_title UA/RU cleared, the h1 is then mod_title.
//         plan reads the whole catalog live; the list goes to inventory/h1_own.xlsx.
// Per batch: live export (backup/seo_clear[_<job>]_b<N>_before.json) -> dryRun: only the job's fields may change, to "" -> import -> export after: those fields
// empty, every other exported field unchanged.
const fs = require('fs'), path = require('path'), X = require('xlsx'); const S = require('../lib/session.js').open();
const A = process.argv.slice(2); const JOB = ['own', 'desc', 'h1'].includes(A[0]) ? A.shift() : 'own'; const MODE = A[0] || 'plan', SIZE = +A[1] || 100;
const SFX = JOB === 'own' ? '' : '_' + JOB; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', INV = path.join(__dirname, '../../inventory/');
const SF = path.join(__dirname, `seo_clear${SFX}_state.json`), PF = path.join(__dirname, `seo_clear${SFX}_plan.json`);
const FIELDS = ['article', 'title', 'mod_title', 'slug', 'link', 'price', 'presence', 'parent', 'alt_parent', 'gtin', 'seo_title', 'seo_description', 'seo_keywords', 'h1_title'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const PURE = /^[^.]*\(WERA \d{11}\)[^.]*(довжина|стрижень) [\d,]+(″)? мм\.$/, EXTRA = /—|футляр|візка|ударним|без інструментів|упаковка|:/i;
const generated = d => d === 'Під замовлення.' || (PURE.test(d) && !EXTRA.test(d));
const exportOf = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: FIELDS, limit: 100, allowLarge: true });
  if (!r.response) stop('export failed ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); } return out; };
const sheet = (rows, file, name, cols) => { const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = cols.map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name); X.writeFile(wb, INV + file); };
// plan: {article: [fields to clear]}
const loadPlan = () => { const p = require(PF); return JOB === 'own' ? Object.fromEntries(Object.entries(p).map(([a, v]) => [a, ['seo_title', ...(v.desc ? ['seo_description'] : [])]])) : p; };
(async () => {
  if (MODE === 'plan' && JOB === 'own') { const C = require('./catalog_seo.json').filter(p => ['ua', 'ru'].some(l => p.seo_title[l] || p.seo_description[l]));
    const plan = {}, keep = []; for (const p of C) { const clearDesc = generated(p.seo_description.ua) && generated(p.seo_description.ru.replace(/^Под заказ\.$/, 'Під замовлення.').replace(/\(WERA (\d{11})\)(.*)(длина|стержень) /, '(WERA $1)$2довжина ')) ;
      plan[p.article] = { desc: clearDesc }; if (!clearDesc) keep.push({ 'Артикул': p.article, 'Раздел': p.parent.value, 'Название': p.mod_title.ua, 'Своё описание UA': p.seo_description.ua, 'Своё описание RU': p.seo_description.ru, 'Свой title UA (будет очищен)': p.seo_title.ua }); }
    fs.writeFileSync(PF, JSON.stringify(plan)); sheet(keep, 'seo_own_descriptions.xlsx', 'Свои описания', [14, 40, 60, 80, 80, 60]);
    console.log('products', C.length, 'clear title', C.length, 'clear description', Object.values(plan).filter(x => x.desc).length, 'keep description', keep.length); S.close(); process.exit(0); }
  if (MODE === 'plan' && JOB === 'desc') { const own = require('./seo_clear_plan.json'); const plan = Object.fromEntries(Object.keys(own).filter(a => !own[a].desc).map(a => [a, ['seo_description']]));
    fs.writeFileSync(PF, JSON.stringify(plan)); console.log('descriptions to clear', Object.keys(plan).length); S.close(); process.exit(0); }
  if (MODE === 'plan' && JOB === 'h1') { const all = [];
    for (let off = 0; ; off += 100) { const r = await call('horoshop_catalog_export', { includedParams: ['article', 'title', 'mod_title', 'h1_title', 'parent', 'link'], limit: 100, offset: off, allowLarge: true });
      if (!r.response) stop('export failed ' + JSON.stringify(r).slice(0, 200)); all.push(...r.response.products); if (r.response.products.length < 100) break; }
    const own = all.filter(p => ['ua', 'ru'].some(l => (p.h1_title || {})[l])); const plan = {}, rows = [];
    for (const p of own) { const h = p.h1_title, m = p.mod_title || {}; const diff = ['ua', 'ru'].some(l => (h[l] || '') !== (m[l] || '')); if (diff) plan[p.article] = ['h1_title'];
      rows.push({ 'Артикул': p.article, 'Раздел': (p.parent || {}).value, 'Действие': diff ? 'h1 очищен (= mod_title)' : 'h1 = mod_title, не трогали', 'Свой h1 UA': h.ua, 'mod_title UA': m.ua, 'Свой h1 RU': h.ru, 'mod_title RU': m.ru, 'Ссылка': p.link }); }
    fs.writeFileSync(PF, JSON.stringify(plan)); sheet(rows, 'h1_own.xlsx', 'Свои h1', [14, 40, 26, 70, 70, 70, 70, 60]);
    console.log('catalog', all.length, 'own h1', own.length, 'differs from mod_title', Object.keys(plan).length, 'same', own.length - Object.keys(plan).length); S.close(); process.exit(0); }
  const plan = loadPlan(); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: [], batches: 0 };
  let todo = Object.keys(plan).filter(a => !st.done.includes(a)); if (MODE === 'dry') todo = todo.slice(0, SIZE);
  while (todo.length) { const batch = todo.slice(0, SIZE); todo = todo.slice(SIZE); const n = MODE === 'write' ? ++st.batches : 0;
    const before = await exportOf(batch); if (MODE === 'write') fs.writeFileSync(BK + `seo_clear${SFX}_b${n}_before.json`, JSON.stringify(before)); const live = Object.fromEntries(before.map(p => [p.article, p]));
    const products = batch.map(a => ({ article: a, ...Object.fromEntries(plan[a].map(f => [f, { ua: '', ru: '' }])) }));
    const target = a => plan[a].flatMap(f => [f + '.ua', f + '.ru']);
    const pf = path.join(__dirname, 'seo_clear_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); if (!dry.willChange) stop('dryRun failed ' + JSON.stringify(dry).slice(0, 300)); if (dry.summary.newProducts) stop('new products');
    for (const w of dry.willChange) { const off = Object.keys(w.changes).filter(k => !target(w.article).includes(k)); if (off.length) stop(`dryRun ${w.article}: other fields ${off}`);
      for (const [k, v] of Object.entries(w.changes)) if (v.to !== '' && v.to != null) stop(`dryRun ${w.article} ${k} -> ${JSON.stringify(v.to)}`); }
    console.log(`batch ${n}: dryRun changes ${dry.willChange.length} of ${batch.length}`, MODE === 'dry' ? JSON.stringify(dry.willChange[0]).slice(0, 400) : '');
    if (MODE === 'dry') break;
    const r = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300));
    const after = await exportOf(batch); fs.writeFileSync(BK + `seo_clear${SFX}_b${n}_after.json`, JSON.stringify(after)); const bad = [];
    for (const a of batch) { const b = live[a], p = after.find(x => x.article === a); if (!p) { bad.push(a + ' missing'); continue; }
      for (const f of FIELDS) { const t = target(a).filter(k => k.startsWith(f + '.')); if (t.length) { for (const k of t) if ((p[f] || {})[k.split('.')[1]]) bad.push(`${a} ${k} not empty`); for (const l of ['ua', 'ru']) if (!t.includes(`${f}.${l}`) && (b[f] || {})[l] !== (p[f] || {})[l]) bad.push(`${a} ${f}.${l} changed`); continue; }
        if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${a} ${f} changed`); } }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `seo_clear ${JOB} batch ${n}: ${batch.length} products, problems ${bad.length}` }) + '\n');
    if (bad.length) { fs.writeFileSync(SF, JSON.stringify(st)); stop(`batch ${n} verify: ${bad.length}\n` + bad.slice(0, 10).join('\n')); }
    st.done.push(...batch); fs.writeFileSync(SF, JSON.stringify(st)); console.log(`batch ${n}: cleared and verified ${batch.length}`); }
  console.log(JOB, 'done', st.done.length, 'of', Object.keys(plan).length); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
