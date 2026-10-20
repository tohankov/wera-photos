// Generic writer of a catalog group's filter characteristics (template 460, group «Характеристики» 1258, multiselect, one dictionary each).
//   node cat/import_group.js <group.js> setup|seed|test|full|verify
// group.js exports { name, root, chars:[{key, title, titleRu, book?, order:'asc'|'given', values?:[...], ru:{ua:ru}}], items:[{a, secs, vals:{key:[...]}}], required:(item)=>[keys], disputed:[...] }
// setup: create missing dictionaries + params (dryRun first). seed: create every value in order on one product, RU per value, RU headings.
// test: one product that already carries other characteristics — check they survive. full: backup -> dryRun (only characteristics) -> import -> verify.
// verify: completeness per leaf section from a fresh export -> inventory/filters_progress.json + disputed xlsx.
const fs = require('fs'), path = require('path'), X = require('xlsx'); const S = require('../lib/session.js').open(); const { cmp, fixZero } = require('../lib/valsort.js');
const G = require(path.resolve(process.argv[2]));
// «Вид інструменту» is shared by every group a product sits in: the kind written for the groups «Викрутки», Kompakt, «Діелектричні» (cat/vyd_final.json, owner 22.10.2026) wins in every group
require('./vyd_comp.js').finishKinds(G.items, false);
// size «0» is written as "0" + NBSP (the dictionary value; a plain "0" is hidden on the product page and would become a second value)
// («Профіль і розмір», rozmir_nakonechnyka, has «PH 0» since 19.10.2026 — no NBSP there)
for (const it of G.items) for (const k of ['rozmir', 'rozmir_robochoho_kintsia']) if (it.vals[k]) it.vals[k] = it.vals[k].map(fixZero);
const mode = process.argv[3]; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const STATE = path.join(__dirname, `${G.name}_state.json`); const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { books: {}, params: {} };
const saveState = () => fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1000); const r = await S.call(t, a); return r; };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const allVals = c => { const set = new Set(); for (const it of G.items) for (const v of (it.vals[c.key] || [])) set.add(v); const l = [...set]; return c.order === 'given' && c.values ? c.values.filter(v => set.has(v)) : l.sort(cmp); };
const exportChars = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: ['article', 'parent', 'alt_parent', 'title', 'price', 'display_in_showcase', 'characteristics'], limit: 200, allowLarge: true }); if (!r.response) stop('export failed: ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); } return out; };
const valsOf = (p, k) => (((p.characteristics || {})[k]) || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
(async () => {
  const keys = G.chars.map(c => c.key); const arts = G.items.map(i => i.a);
  if (mode === 'setup') {
    for (const c of G.chars) {
      if (c.book) { st.books[c.key] = c.book; continue; }
      if (!st.books[c.key]) { const d = await call('horoshop_admin_dictionary_create', { title: c.dictTitle || c.title, dryRun: true }); if (!d.wouldCreate) stop('dictionary dryRun ' + JSON.stringify(d));
        const r = await call('horoshop_admin_dictionary_create', { title: c.dictTitle || c.title, dryRun: false }); if (!r.saved) stop('dictionary create ' + JSON.stringify(r)); st.books[c.key] = +r.bookId; saveState(); console.log('dictionary', c.key, r.bookId); }
      if (!st.params[c.key]) { const a = { template: 460, group: 1258, title: c.title, name: c.key, type: 'select', book: st.books[c.key], multi: true };
        const d = await call('horoshop_admin_template_param_add', { ...a, dryRun: true }); if (d.wouldSend.table !== 'book_' + st.books[c.key] || d.wouldSend.multi !== '1') stop('param dryRun ' + JSON.stringify(d));
        const r = await call('horoshop_admin_template_param_add', { ...a, dryRun: false }); st.params[c.key] = r.param && r.param.id; saveState(); console.log('param', c.key, st.params[c.key]); }
    }
    const sch = await call('horoshop_admin_template_schema', { template: 460 }); console.log('template fields', sch.fieldNames.join(', '));
  }
  if (mode === 'seed') {
    const seed = G.seed || arts[0]; const ch = Object.fromEntries(G.chars.filter(c => !c.book).map(c => [c.key, allVals(c)]));
    // reused dictionaries: new values of this group are appended in the group's order (existing values keep their place)
    // shared characteristics on the seed product: existing values (other groups) are kept, the seeded values are recorded as this group's own so `full` drops the ones the product does not need
    const OWN = path.join(__dirname, `${G.name}_own.json`); const own = fs.existsSync(OWN) ? JSON.parse(fs.readFileSync(OWN, 'utf8')) : {}; const sb = (await exportChars([seed]))[0] || {};
    for (const c of G.chars.filter(c => c.book && c.newValues)) { const used = new Set(G.items.flatMap(i => i.vals[c.key] || [])); const nv = c.newValues.filter(v => used.has(v));
      if (nv.length) { ch[c.key] = [...new Set([...valsOf(sb, c.key), ...nv])]; ((own[seed] = own[seed] || {})[c.key] = [...new Set([...((own[seed] || {})[c.key] || []), ...nv.filter(v => !valsOf(sb, c.key).includes(v))])]); } }
    fs.writeFileSync(OWN, JSON.stringify(own));
    const r = await call('horoshop_catalog_import', { products: [{ article: seed, characteristics: ch }], dryRun: false }); console.log('seed', seed, r.status, r.updated);
    for (const c of G.chars.filter(c => c.book && c.newValues && c.ru)) { const d = await call('horoshop_admin_dictionary_values', { book: c.book }); const miss = (ch[c.key] || []).filter(v => !d.values.some(x => x.value === v)); console.log(c.key, 'reused dictionary', c.book, 'new values added', (ch[c.key] || []).length - miss.length, miss.length ? 'MISSING ' + miss : '');
      for (const v of d.values) { const ru = c.ru[v.value]; if (ru && ru !== v.value && (ch[c.key] || []).includes(v.value)) { const s = await call('horoshop_admin_dictionary_value_set', { book: c.book, valueId: v.id, titles: { ru }, dryRun: false }); if (!(s.changes || []).some(x => x.persisted)) console.log('  RU not saved', v.value); } } }
    for (const c of G.chars.filter(c => !c.book)) { const d = await call('horoshop_admin_dictionary_values', { book: st.books[c.key] }); const got = d.values.map(v => v.value), want = allVals(c);
      console.log(c.key, 'dictionary', got.length, 'planned', want.length, 'same order', JSON.stringify(got) === JSON.stringify(want)); if (JSON.stringify(got) !== JSON.stringify(want)) console.log('  got', got.join(' | '));
      for (const v of d.values) { const ru = c.ru && c.ru[v.value]; if (ru && ru !== v.value) { const s = await call('horoshop_admin_dictionary_value_set', { book: st.books[c.key], valueId: v.id, titles: { ru }, dryRun: false }); if (!(s.changes || []).some(x => x.persisted)) console.log('  RU not saved', v.value); } } }
    for (const c of G.chars.filter(c => !c.book && c.titleRu)) { const g = await call('horoshop_admin_interface_translation_get', { search: c.title, lang: 'ru' }); const row = (g.rows || []).find(x => x.key === c.title && x.lang === 'ru');
      if (row && !row.value) { await call('horoshop_admin_interface_translation_set', { id: row.id, value: c.titleRu, dryRun: false }); console.log('heading RU', c.title, '→', c.titleRu); } else console.log('heading RU', c.title, row ? 'already ' + row.value : 'row not found'); }
    st.seeded = seed; saveState();
  }
  if (mode === 'test' || mode === 'full') {
    const list = mode === 'test' ? [G.testArticle] : arts; const before = await exportChars(list); if (before.length !== list.length) stop(`backup export ${before.length}/${list.length}`);
    fs.writeFileSync(BK + `${G.name}_chars_before${mode === 'test' ? '_test' : ''}.json`, JSON.stringify(before));
    // shared characteristics (reused dictionaries) are UNIONS across groups: keep every value the product has, drop only values THIS group wrote earlier
    // and no longer wants (cat/<name>_own.json records what the group wrote; a value equal to another group's value is never dropped on that ground alone)
    const OWN = path.join(__dirname, `${G.name}_own.json`); const own = fs.existsSync(OWN) ? JSON.parse(fs.readFileSync(OWN, 'utf8')) : {};
    const want = (it, k) => { const c = G.chars.find(x => x.key === k); const mine = it.vals[k] || []; if (!c.book) return mine; const b = before.find(x => x.article === it.a);
      const prev = ((own[it.a] || {})[k]) || []; const other = b ? valsOf(b, k).filter(v => !(prev.includes(v) && !mine.includes(v))) : []; return [...new Set([...other, ...mine])]; };
    const products = list.map(a => { const it = G.items.find(i => i.a === a); return { article: a, characteristics: Object.fromEntries(keys.map(k => [k, want(it, k)]).filter(([k, v]) => !G.chars.find(c => c.key === k).book || v.length || valsOf(before.find(x => x.article === a) || {}, k).length).map(([k, v]) => [k, v.length ? v : ''])) }; });
    const pf = path.join(__dirname, `${G.name}_payload.json`); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
    const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => k !== 'characteristics')); if (off.length || dry.summary.newProducts) stop('dryRun outside plan ' + JSON.stringify(off.slice(0, 3)));
    if ((dry.characteristicSchemaWarnings || []).length || (dry.characteristicSchemaUnverified || []).length) stop('schema warnings ' + JSON.stringify(dry.characteristicSchemaWarnings || dry.characteristicSchemaUnverified).slice(0, 300));
    const w = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('import', w.status, w.updated, '/', w.total, JSON.stringify(w.errors || []).slice(0, 200));
    const after = await exportChars(list); fs.writeFileSync(BK + `${G.name}_chars_after${mode === 'test' ? '_test' : ''}.json`, JSON.stringify(after));
    const bad = []; for (const p of after) { const it = G.items.find(i => i.a === p.article), b = before.find(x => x.article === p.article);
      const S_ = a => JSON.stringify([...a].sort());
      for (const k of keys) { const pl = products.find(x => x.article === p.article).characteristics[k]; const w = pl === undefined ? valsOf(b, k) : (pl || []); const got = valsOf(p, k); if (S_(got) !== S_(w)) bad.push(`${p.article} ${k}: ${got} ≠ ${w}`); }
      for (const k of Object.keys(b.characteristics || {})) if (!keys.includes(k) && S_(valsOf(b, k)) !== S_(valsOf(p, k))) bad.push(`${p.article} OTHER characteristic ${k} changed: ${valsOf(b, k)} → ${valsOf(p, k)}`);
      for (const f of ['parent', 'alt_parent', 'title', 'price', 'display_in_showcase']) if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${p.article} ${f} changed`); }
    console.log('verify', after.length, 'problems', bad.length); if (bad.length) { console.log(bad.slice(0, 20).join('\n')); fs.writeFileSync(path.join(__dirname, `${G.name}_problems.json`), JSON.stringify(bad, null, 1)); }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `filters ${G.name} ${mode}: ${after.length} products, problems ${bad.length}` }) + '\n');
    if (bad.length) { S.close(); process.exit(2); }
    for (const a of list) { const it = G.items.find(i => i.a === a); own[a] = Object.fromEntries(G.chars.filter(c => c.book).map(c => [c.key, it.vals[c.key] || []])); } fs.writeFileSync(OWN, JSON.stringify(own));
  }
  if (mode === 'verify') {
    const after = await exportChars(arts); const secs = {};
    for (const p of after) { const it = G.items.find(i => i.a === p.article); const req = G.required(it); for (const s of it.secs) { const o = (secs[s] = secs[s] || { n: 0, ...Object.fromEntries(keys.map(k => [k, 0])), req: {} }); o.n++; for (const k of keys) { if (valsOf(p, k).length) o[k]++; if (req.includes(k)) o.req[k] = (o.req[k] || 0) + 1; } } }
    const rows = [['Раздел', 'Товаров', ...G.chars.map(c => c.title + ' (заполнено / обязательно)')]]; let full = true;
    for (const [s, o] of Object.entries(secs)) { rows.push([s, o.n, ...keys.map(k => `${o[k]} / ${o.req[k] || 0}`)]); for (const k of keys) if ((o.req[k] || 0) > o[k]) full = false; }
    console.log(rows.map(r => r.join(' | ')).join('\n')); console.log('completeness 100% for required:', full);
    const PF = INV + 'filters_progress.json'; const prog = fs.existsSync(PF) ? JSON.parse(fs.readFileSync(PF, 'utf8')) : { groups: {} };
    prog.groups[G.name] = { root: G.root, products: after.length, characteristics: G.chars.map(c => ({ key: c.key, title: c.title, book: st.books[c.key], param: st.params[c.key] })), disputed: G.disputed.length, complete: full, at: new Date().toISOString(), order: G.filterOrder };
    prog.updated = new Date().toISOString(); fs.writeFileSync(PF, JSON.stringify(prog, null, 1));
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Артикул', 'Раздел', 'Чего не хватает', 'Почему', 'Название'], ...G.disputed.map(d => [d.a, d.sec, d.what, d.why, d.title])]), 'Спорные'); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(rows), 'Полнота'); X.writeFile(wb, INV + `filters_${G.name}_disputed.xlsx`);
  }
  S.close(); process.exit(0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
