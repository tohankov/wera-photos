// Description writer for a planned change (global check, owner 24.10.2026): node cat/desc_write.js <plan.json> [size=50] [budget s=500]
// plan: { name, products: { article: { old: {ua, ru}, new: {ua, ru}, why: [..] } } }. Per chunk: export (backup/<name>_c<k>_before.json) — the live description
// must be exactly plan.old (else the product is skipped and reported) -> import dryRun: only description.ua/ru of these products, else STOP -> import ->
// export after (backup/<name>_c<k>_after.json): description = plan.new (whitespace collapsed by Horoshop accepted and logged), every other field = before, else STOP.
// Resumable: cat/desc_<name>_state.json (done / skipped).
const fs = require('fs'), path = require('path'); const [, , PLANF, SZ, BUD] = process.argv; const plan = JSON.parse(fs.readFileSync(PLANF, 'utf8'));
const size = +SZ || 50, budget = (+BUD || 500) * 1000, T0 = Date.now(); const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const SF = path.join(__dirname, `desc_${plan.name}_state.json`); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : { done: [], skipped: {}, chunks: 0 };
const save = () => fs.writeFileSync(SF, JSON.stringify(st, null, 1)); const S = require('../lib/session.js').open();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const call = async (t, a) => { for (let k = 0; k < 20; k++) { await sleep(1500); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { save(); console.log('STOP', m); S.close(); process.exit(2); };
const fields = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics'];
const exp = async arts => { const r = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: fields, limit: 200, allowLarge: true }); if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 200)); return r.response.products; };
const ws = s => s.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
// the import may return the values of a multi-select characteristic in another order (26.10.2026: «PH 2, PH 1» -> «PH 1, PH 2») — the same values are the same
const same = (f, v) => f !== 'characteristics' || !v ? JSON.stringify(v) : JSON.stringify(Object.keys(v).sort().map(k => [k, Array.isArray(v[k]) ? v[k].map(x => JSON.stringify(x)).sort() : v[k]]));
(async () => {
  const todo = Object.keys(plan.products).filter(a => !st.done.includes(a) && !st.skipped[a]);
  while (todo.length && Date.now() - T0 < budget - 60000) { const k = st.chunks; const arts = todo.splice(0, size);
    const before = await exp(arts); if (before.length !== arts.length) stop(`export before: ${before.length} of ${arts.length}`); fs.writeFileSync(BK + `${plan.name}_c${k}_before.json`, JSON.stringify(before));
    const go = []; for (const p of before) { const o = plan.products[p.article].old; if (p.description.ua !== o.ua || p.description.ru !== o.ru) { st.skipped[p.article] = 'описание на сайте изменилось после плана'; continue; } go.push(p.article); }
    if (!go.length) { st.chunks++; save(); continue; }
    const TMP = path.join(__dirname, `../fix/${plan.name}_c${k}.json`); fs.writeFileSync(TMP, JSON.stringify({ products: go.map(a => ({ article: a, description: plan.products[a].new })) }));
    const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const w = dry.willChange || [];
    const off = w.filter(x => x.isNew || !go.includes(x.article) || Object.keys(x.changes || {}).some(f => !/^description\.(ua|ru)$/.test(f)));
    if (off.length || w.length !== go.length) stop('dryRun outside plan: ' + JSON.stringify(off.map(x => [x.article, Object.keys(x.changes || {})])) + ` (willChange ${w.length} of ${go.length})`);
    const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors).slice(0, 300));
    const after = await exp(go); fs.writeFileSync(BK + `${plan.name}_c${k}_after.json`, JSON.stringify(after)); const bad = [];
    for (const a of go) { const b = before.find(x => x.article === a), y = after.find(x => x.article === a); if (!y) { bad.push(a + ' missing'); continue; }
      for (const f of fields) if (f !== 'description' && same(f, b[f]) !== same(f, y[f])) bad.push(`${a} ${f}`);
      for (const l of ['ua', 'ru']) { const e = plan.products[a].new[l]; if (y.description[l] === e) continue; if (ws(y.description[l]) === ws(e)) console.log(`note: ${a} ${l}: only whitespace normalised`); else bad.push(`${a} description.${l} ≠ plan`); } }
    if (bad.length) stop('verify: ' + bad.slice(0, 10).join('; '));
    st.done.push(...go); st.chunks++; save(); fs.unlinkSync(TMP);
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `${plan.name} chunk ${k}: ${go.length} descriptions` }) + '\n');
    console.log(`chunk ${k}: written and verified ${go.length}`); }
  console.log(`done ${st.done.length} of ${Object.keys(plan.products).length}, skipped ${Object.keys(st.skipped).length}`, Object.keys(st.skipped).length ? st.skipped : ''); S.close();
})().catch(e => { console.error(e); save(); S.close(); process.exit(1); });
