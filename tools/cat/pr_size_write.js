// Writer of «Профіль і розмір» + sizes in «… у складі» (owner 19.10.2026: format A, docs/profile_size_plan.md steps 1–7; step 8 — deleting old values — NOT here).
//   node cat/pr_size_write.js plan <live.json>   -> cat/pr_size_plan.json (target characteristics per product, dictionary orders, RU titles)
//   node cat/pr_size_write.js backup             -> backup/pr_size_before_<ts>.json (products, dictionaries, template schema, translation rows)
//   node cat/pr_size_write.js rename             -> param 6600 «Розмір наконечника» -> «Профіль і розмір» (schema before/after, values of multi-value products before/after;
//                                                   anything else changed -> title restored and STOP); RU heading «Профиль и размер»
//   node cat/pr_size_write.js seed               -> every new value created in order on the hidden seed product, order checked, RU titles set
//   node cat/pr_size_write.js dry | write        -> dryRun (only the planned characteristics, else STOP) / import in batches of 100 (resumable, 429-safe)
//   node cat/pr_size_write.js verify             -> export of every planned product: planned characteristics equal, everything else equal to the backup
const fs = require('fs'), path = require('path'); const MODE = process.argv[2]; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const PLAN = path.join(__dirname, 'pr_size_plan.json'), STATE = path.join(__dirname, 'pr_size_state.json');
const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {}; const save = () => fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms)); let S = null;
// one MCP call: 1 s apart; «Retry after N» -> wait N+5 s and repeat the same call
const call = async (t, a) => { S = S || require('../lib/session.js').open(); for (let k = 0; k < 20; k++) { await sleep(1000); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/);
  if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { console.log('STOP', m); if (S) S.close(); process.exit(2); };
const valsOf = (p, k) => (((p.characteristics || {})[k]) || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
const KEYS = ['rozmir_nakonechnyka', 'profil', 'osoblyvosti_vykrutky', 'sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'];
const BOOK = { rozmir_nakonechnyka: 392, osoblyvosti_vykrutky: 394, sklad_ph: 418, sklad_pz: 419, sklad_tx: 420, sklad_sl: 421, sklad_hex: 422, sklad_kvadrat: 423, sklad_tx_bo: 424, sklad_plusminus: 425, profil: 382 };
const SEED = '05117689001';   // hidden (display_in_showcase 0) product of the screwdriver group that carries the characteristic; its own values are restored by the import
const BOFEAT = 'З отвором (TX BO)', BOFEAT_RU = 'С отверстием (TX BO)', TX = 'TX (TORX®)', TXBO = 'TX BO (TORX® з отвором)';
const exportArts = async (arts, fields) => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: fields, limit: 200, allowLarge: true });
  if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 300)); out.push(...r.response.products); } return out; };
const FIELDS = ['article', 'parent', 'alt_parent', 'title', 'mod_title', 'price', 'display_in_showcase', 'characteristics'];
(async () => {
  if (MODE === 'plan') { const P = require('./pr_size.js'); const L = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); const ctx = P.build(L); const SK = P.buildSklad(L, ctx); const v = ctx.v;
    const byA = Object.fromEntries(L.map(p => [p.article, p])); const ch = {}; const set = (a, k, vals) => { const now = v(byA[a], k); if (JSON.stringify([...now].sort()) !== JSON.stringify([...vals].sort())) (ch[a] = ch[a] || {})[k] = vals; };
    for (const r of ctx.rows) set(r.a, 'rozmir_nakonechnyka', r.short);
    // TX BO -> TX + «З отвором (TX BO)» in the screwdriver group (no product of it is in another group that gives TX BO — checked in the preview)
    process.env.SETS_FILL = 'off'; const vk = new Set(require('./g_vykrutky.js').items.map(i => i.a));
    for (const p of L.filter(p => vk.has(p.article) && v(p, 'profil').includes(TXBO))) { set(p.article, 'profil', [...new Set(v(p, 'profil').map(x => x === TXBO ? TX : x))]); set(p.article, 'osoblyvosti_vykrutky', [...new Set([...v(p, 'osoblyvosti_vykrutky'), BOFEAT])]); }
    for (const [a, f] of Object.entries(P.PROFIL_FIX)) { const base = (ch[a] || {}).profil || v(byA[a], 'profil'); set(a, 'profil', [...new Set([...base.filter(x => !f.remove.includes(x)), ...f.add])]); }
    for (const r of SK) for (const [k] of P.SK) set(r.a, k, r.next[k]);
    // dictionary orders: 392 by profile then size; «… у складі» by size, «(розмір не вказано)» last
    const d392 = []; const seen = new Set(); for (const r of ctx.rows) r.pairs.forEach((q, i) => { if (!seen.has(r.short[i])) { seen.add(r.short[i]); d392.push({ q, ua: r.short[i], ru: r.shortRu[i] }); } });
    d392.sort((x, y) => P.PR[x.q[0]][2] - P.PR[y.q[0]][2] || P.pcmp(x.q[0], x.q[1], y.q[1]));
    const dict = { rozmir_nakonechnyka: d392.map(d => d.ua) }; const ru = Object.fromEntries(d392.filter(d => d.ru !== d.ua).map(d => [d.ua, d.ru])); ru[BOFEAT] = BOFEAT_RU;
    for (const [k, prof] of P.SK) { const all = [...new Set(SK.flatMap(r => r.next[k]))]; const ns = all.filter(x => /розмір не вказано/.test(x)); const strip = x => x.replace(/^(TX BO|TX|PH|PZ|SL|HEX|Квадрат) /, '');
      dict[k] = [...all.filter(x => !ns.includes(x)).sort((x, y) => P.pcmp(prof, strip(x), strip(y))), ...ns]; for (const x of ns) ru[x] = x.replace(' (розмір не вказано)', P.NOSIZE_RU); }
    const products = Object.entries(ch).map(([article, characteristics]) => ({ article, characteristics }));
    const cnt = {}; for (const p of products) for (const k of Object.keys(p.characteristics)) cnt[k] = (cnt[k] || 0) + 1;
    fs.writeFileSync(PLAN, JSON.stringify({ at: new Date().toISOString(), products, dict, ru, srcWeraDe: Object.fromEntries(SK.filter(r => r.src).map(r => [r.a, r.src])) }, null, 1));
    console.log('products', products.length, cnt, 'dict', Object.fromEntries(Object.entries(dict).map(([k, x]) => [k, x.length])), 'ru', Object.keys(ru).length); return; }
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')); const arts = [...new Set([SEED, ...plan.products.map(p => p.article)])];
  if (MODE === 'backup') { const products = await exportArts(arts, FIELDS); if (products.length !== arts.length) stop(`export ${products.length}/${arts.length}`);
    const dicts = {}; for (const [k, b] of Object.entries(BOOK)) dicts[b] = (await call('horoshop_admin_dictionary_values', { book: b })).values;
    const schema = await call('horoshop_admin_template_schema', { template: 460, allowLarge: true });
    const tr = {}; for (const s of ['Розмір наконечника', 'Профіль і розмір']) tr[s] = (await call('horoshop_admin_interface_translation_get', { search: s })).rows || [];
    const f = BK + `pr_size_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify({ products, dicts, schema, tr }));
    st.backup = f; save(); console.log('backup', f, 'products', products.length, 'dicts', Object.entries(dicts).map(([b, x]) => b + ':' + x.length).join(' ')); }
  if (MODE === 'rename') { const B = JSON.parse(fs.readFileSync(st.backup, 'utf8'));
    const flat = s => s.groups.map(g => ({ g: g.id, t: g.title, p: (g.params || []).map(p => ({ ...p })) }));
    const before = await call('horoshop_admin_template_schema', { template: 460, allowLarge: true }); fs.writeFileSync(BK + `pr_size_schema460_before_${Date.now()}.json`, JSON.stringify(before, null, 1));
    // products with several values: the binding to dictionary 392 and «multi» are visible through their values
    const multi = B.products.filter(p => valsOf(p, 'rozmir_nakonechnyka').length > 3).slice(0, 5).map(p => p.article).concat(['05008720001']);
    const vb = await exportArts(multi, ['article', 'characteristics']);
    const args = { template: 460, group: 1258, paramId: 6600, name: 'rozmir_nakonechnyka', type: 'select', book: 392, multi: true };
    const d = await call('horoshop_admin_template_param_add', { ...args, title: 'Профіль і розмір', dryRun: true }); const w = d.wouldSend || {};
    if (w.table !== 'book_392' || w.multi !== '1' || w.name !== 'rozmir_nakonechnyka' || w.group !== '1258' || w.type !== 'select' || w.id !== '6600') stop('dryRun ' + JSON.stringify(d));
    const r = await call('horoshop_admin_template_param_add', { ...args, title: 'Профіль і розмір', dryRun: false }); console.log('rename', JSON.stringify(r).slice(0, 300));
    const after = await call('horoshop_admin_template_schema', { template: 460, allowLarge: true }); fs.writeFileSync(BK + `pr_size_schema460_after_${Date.now()}.json`, JSON.stringify(after, null, 1));
    const fb = flat(before), fa = flat(after); for (const g of fb) for (const p of g.p) if (p.id === '6600') p.title = 'Профіль і розмір';
    const va = await exportArts(multi, ['article', 'characteristics']); const same = vb.every(p => JSON.stringify(valsOf(p, 'rozmir_nakonechnyka')) === JSON.stringify(valsOf(va.find(x => x.article === p.article), 'rozmir_nakonechnyka')));
    const okSchema = JSON.stringify(fb) === JSON.stringify(fa) && JSON.stringify(before.fieldNames) === JSON.stringify(after.fieldNames);
    console.log('schema identical except the title:', okSchema, '| values of', multi.length, 'products unchanged:', same);
    if (!okSchema || !same) { await call('horoshop_admin_template_param_add', { ...args, title: 'Розмір наконечника', dryRun: false }); stop('schema or values changed — title restored, see backup/pr_size_schema460_*'); }
    st.renamed = true; save();
    // RU heading: interface translation row for the new key (it appears once the storefront renders the heading)
    let row = null; for (let k = 0; k < 3 && !row; k++) { const g = await call('horoshop_admin_interface_translation_get', { search: 'Профіль і розмір', lang: 'ru' }); row = (g.rows || []).find(x => x.key === 'Профіль і розмір' && x.lang === 'ru');
      if (!row) { await require('../vt/fetchpage.js')('https://tl-shop.com.ua/ru/khrestovi-vikrutki-ph-philips-kraftform-plus-seriya-300/'); await sleep(3000); } }
    if (!row) { console.log('RU heading row not found yet — run `rename` again later (only the RU part runs once renamed)'); }
    else { const s = await call('horoshop_admin_interface_translation_set', { id: row.id, value: 'Профиль и размер', dryRun: false }); console.log('RU heading', JSON.stringify(s).slice(0, 200)); st.ruHeading = true; save(); } }
  if (MODE === 'seed') { if (!st.renamed) stop('rename first'); const D = plan.dict; const ch = { ...D, osoblyvosti_vykrutky: [BOFEAT] };
    if (!st.seedImported) { const r = await call('horoshop_catalog_import', { products: [{ article: SEED, characteristics: ch }], dryRun: false }); console.log('seed import', r.status, r.updated, JSON.stringify(r.errors || []).slice(0, 200)); st.seedImported = true; save(); }
    // creation order = value id order; ids come from the export of the seed product (the admin dictionary list is paged by 100 and sorted by its own position)
    const sp = (await exportArts([SEED], ['article', 'characteristics']))[0]; const order = {};
    for (const [k, want] of Object.entries(ch)) { const refs = (sp.characteristics[k] || []).map(x => ({ id: +x.id, value: x.value.ua })); const id = Object.fromEntries(refs.map(x => [x.value, x.id]));
      const ids = want.map(x => id[x]); const inOrder = ids.every((x, i) => x && (i === 0 || x > ids[i - 1])); order[k] = ids;
      console.log(k, 'values', ids.filter(Boolean).length, '/', want.length, 'ids in planned order', inOrder, `${ids[0]}…${ids[ids.length - 1]}`, ids.some(x => x > 255) ? `(${ids.filter(x => x > 255).length} with id > 255)` : '');
      if (!inOrder) stop(k + ' order: ' + JSON.stringify(refs));
      for (const x of refs.filter(x => plan.ru[x.value]).map(x => ({ id: x.id, value: x.value }))) { const s = await call('horoshop_admin_dictionary_value_set', { book: BOOK[k], valueId: x.id, titles: { ru: plan.ru[x.value] }, dryRun: false });
        if (!(s.changes || []).some(c => c.persisted) && !/already|nothing/i.test(JSON.stringify(s))) console.log('  RU not saved', x.value, JSON.stringify(s).slice(0, 200)); } }
    st.seeded = true; st.order = order; save(); }
  if (MODE === 'dry' || MODE === 'write') { if (!st.seeded) stop('seed first'); const B = JSON.parse(fs.readFileSync(st.backup, 'utf8')); const bA = Object.fromEntries(B.products.map(p => [p.article, p]));
    // the seed product gets back what it had (plus its planned values)
    const products = plan.products.map(p => ({ article: p.article, characteristics: Object.fromEntries(Object.entries(p.characteristics).map(([k, x]) => [k, x.length ? x : ''])) }));
    const sp = products.find(p => p.article === SEED) || (products.push({ article: SEED, characteristics: {} }), products[products.length - 1]);
    for (const k of [...Object.keys(plan.dict), 'osoblyvosti_vykrutky']) if (!(k in sp.characteristics)) { const o = valsOf(bA[SEED], k); sp.characteristics[k] = o.length ? o : ''; }
    st.done = st.done || 0; for (let i = MODE === 'write' ? st.done : 0; i < products.length; i += 100) { const batch = products.slice(i, i + 100); const pf = path.join(__dirname, 'pr_size_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products: batch }));
      const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
      const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => k !== 'characteristics')); if (off.length || (dry.summary || {}).newProducts) stop('dryRun outside plan ' + JSON.stringify(off.slice(0, 3)).slice(0, 500));
      // `characteristics[].write` is the exact block that will be posted: only the planned characteristics may be in it
      const chk = (dry.characteristics || []).flatMap(c => Object.keys(c.write || {})).filter(k => !KEYS.includes(k)); if (chk.length) stop('dryRun touches other characteristics ' + [...new Set(chk)]);
      if ((dry.characteristics || []).length !== batch.length) stop(`dryRun characteristics blocks ${(dry.characteristics || []).length} / ${batch.length}`);
      if ((dry.characteristicSchemaWarnings || []).length || (dry.characteristicSchemaUnverified || []).length) stop('schema warnings ' + JSON.stringify(dry.characteristicSchemaWarnings || dry.characteristicSchemaUnverified).slice(0, 300));
      console.log(`batch ${i / 100 + 1}: dryRun ${(dry.willChange || []).length} to change`);
      if (MODE === 'write') { const w = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('  import', w.status, w.updated, '/', w.total, JSON.stringify(w.errors || []).slice(0, 200));
        if ((w.errors || []).length) stop('import errors'); st.done = i + batch.length; save(); } }
    if (MODE === 'write') { fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `pr_size write: ${products.length} products («Профіль і розмір», «… у складі» sizes, TX BO -> TX)` }) + '\n'); st.written = true; save(); } }
  if (MODE === 'verify') { const B = JSON.parse(fs.readFileSync(st.backup, 'utf8')); const bA = Object.fromEntries(B.products.map(p => [p.article, p])); const after = await exportArts(arts, FIELDS);
    fs.writeFileSync(BK + `pr_size_after_${Date.now()}.json`, JSON.stringify(after)); const pA = Object.fromEntries(plan.products.map(p => [p.article, p.characteristics])); const bad = []; const srt = a => JSON.stringify([...a].sort());
    for (const p of after) { const b = bA[p.article], want = pA[p.article] || {};
      for (const k of new Set([...Object.keys(b.characteristics || {}), ...Object.keys(p.characteristics || {})])) { const w = k in want ? want[k] : valsOf(b, k); if (srt(valsOf(p, k)) !== srt(w)) bad.push(`${p.article} ${k}: ${valsOf(p, k).join(', ')} ≠ ${w.join(', ')}`); }
      for (const f of ['parent', 'alt_parent', 'title', 'mod_title', 'price', 'display_in_showcase']) if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${p.article} ${f} changed`); }
    console.log('verify', after.length, 'products, problems', bad.length); if (bad.length) { console.log(bad.slice(0, 30).join('\n')); fs.writeFileSync(path.join(__dirname, 'pr_size_problems.json'), JSON.stringify(bad, null, 1)); } }
  // the written state becomes the source of the group generators (cat/g_vykrutky, g_kk, g_dyn, g_sklad): cat/pr_size_values.json
  if (MODE === 'snapshot') { const f = fs.readdirSync(BK).filter(x => /^pr_size_after_\d+\.json$/.test(x)).sort().pop(); const after = JSON.parse(fs.readFileSync(BK + f, 'utf8'));
    const values = {}; for (const k of KEYS.filter(k => k === 'rozmir_nakonechnyka' || /^sklad_/.test(k))) { values[k] = {}; for (const p of after) values[k][p.article] = valsOf(p, k); }
    fs.writeFileSync(path.join(__dirname, 'pr_size_values.json'), JSON.stringify({ at: new Date().toISOString(), from: f, dict: plan.dict, ru: plan.ru, values }));
    console.log('snapshot', f, Object.entries(values).map(([k, x]) => `${k}: ${Object.values(x).filter(v => v.length).length}`).join(', ')); }
  if (S) S.close(); process.exit(0);
})().catch(e => { console.error(e); if (S) S.close(); process.exit(1); });
