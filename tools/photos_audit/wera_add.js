// Global check item 7 (owner 24.10.2026): add the missing WERA photos (decided by eye per series sheet, <work>/decisions.json) to the END of each gallery.
//   node photos_audit/wera_add.js <group live.json> <work dir> plan|files|upload [list.json] [budget s=520]
// plan   -> <work>/add_plan.json {art: [{n, w, file, url}]}: the series' generic W pictures (or the per-product override), plus a «sized» picture (an engraved
//           size) only for the product whose «Профіль і розмір» matches; series in «skip» and products not visible are left out
// files  -> <work>/add/<art>@<k>.jpg (WERA webp at its largest size, flattened on white, JPEG q90), k after the product's current photos
// upload -> per product: export before -> horoshop_admin_import_images (dryRun: every file matched to this article; then the real run, keepExistingGallery) ->
//           export after: the old photos unchanged and in place, exactly the new ones added at the end, every other field identical (else STOP). Resumable.
const fs = require('fs'), path = require('path'); const sharp = require('sharp');
const [, , LIVE, WORK, MODE, LISTF, B] = process.argv; const T0 = Date.now(), BUD = (+B || 520) * 1000; const sleep = ms => new Promise(r => setTimeout(r, ms));
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const SER = JSON.parse(fs.readFileSync(path.join(WORK, 'series.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(WORK, 'decisions.json'), 'utf8')); const PF = path.join(WORK, 'add_plan.json');
// products whose gallery differs from the series representative (own sheets, photos_audit/product_cmp.js)
// decisions.json may carry its own per-product list (29.10.2026, Zyklop 8790 FA 6 mm: the size sits in «Розмір головки», not in «Профіль і розмір»)
const OVERRIDE = { ...(D.override || {}), '05007671001': [7], '05007670001': [7], '05008750001': [7], '05009340001': [7, 9], '05009305001': [7, 10], '05110011001': [3, 4, 5, 6, 7, 8, 9, 10] };
const sizes = a => ((L[a].characteristics || {}).rozmir_nakonechnyka || []).map(v => v.value.ua);
const fits = (a, spec) => { const s = sizes(a); const m = spec.match(/^SL ×([\d,]+)$/); return m ? s.some(v => new RegExp('^SL [\\d,]+×' + m[1] + '$').test(v)) : s.includes(spec); };
if (MODE === 'plan') { const plan = {}; const log = [];
  for (const s of SER) { if (D.skip[s.n]) continue; for (const p of s.products) { const a = p.art; if (!L[a] || +L[a].display_in_showcase !== 1) continue;
      const ws = new Set([...(OVERRIDE[a] ? [...OVERRIDE[a], ...(D.generic[s.n] || [])] : D.generic[s.n] || [])]);
      for (const [w, spec] of Object.entries(D.sized[s.n] || {})) if (fits(a, spec)) ws.add(+w);
      const list = [...ws].sort((x, y) => x - y).map(w => ({ n: s.n, w, file: s.wera[w - 1].file, url: s.wera[w - 1].url })).filter(x => x.file);
      if (list.length) plan[a] = list; } }
  fs.writeFileSync(PF, JSON.stringify(plan, null, 1)); const n = Object.values(plan).flat().length;
  console.log('products', Object.keys(plan).length, 'photos', n); for (const s of Object.keys(D.sized)) for (const [w, spec] of Object.entries(D.sized[s])) { const got = SER.find(x => x.n === +s).products.filter(p => fits(p.art, spec)).map(p => p.art); console.log(`sized series ${s} W${w} ${spec}: ${got.join(', ') || 'NO PRODUCT'}`); }
  process.exit(0); }
const plan = JSON.parse(fs.readFileSync(PF, 'utf8')); const ADD = path.join(WORK, 'add'); fs.mkdirSync(ADD, { recursive: true });
const SF = path.join(WORK, 'add_state.json'); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}; const save = () => fs.writeFileSync(SF, JSON.stringify(st, null, 1));
const fileOf = (a, i) => path.join(ADD, `${a}@${(L[a].images || []).length + i + 1}.jpg`);
(async () => {
  if (MODE === 'files') { let n = 0; for (const [a, list] of Object.entries(plan)) for (const [i, x] of list.entries()) { const f = fileOf(a, i); if (fs.existsSync(f)) continue; if (Date.now() - T0 > BUD) break;
      await sleep(1200); const r = await fetch(x.url, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) { console.log('HTTP', r.status, x.url); continue; }
      await sharp(Buffer.from(await r.arrayBuffer())).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toFile(f); n++; }
    const all = Object.entries(plan).flatMap(([a, l]) => l.map((_, i) => fileOf(a, i))); console.log('files now', n, 'ready', all.filter(f => fs.existsSync(f)).length, 'of', all.length); return; }
  if (MODE !== 'upload') return console.log('mode plan|files|upload');
  const S = require('../lib/session.js').open(); const stop = m => { save(); console.log('STOP', m); S.close(); process.exit(2); };
  const call = async (t, a) => { for (let k = 0; k < 20; k++) { await sleep(1500); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { console.log('429, wait', +m[1] + 5); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
  const F = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics', 'icons', 'short_description', 'seo_title', 'seo_description', 'slug'];
  const exp = async a => { const r = await call('horoshop_catalog_export', { expr: { article: [a] }, includedParams: F, limit: 5, allowLarge: true }); const p = ((r.response || {}).products || [])[0]; if (!p) stop('export ' + a); return p; };
  const fname = u => u.split('/').pop();
  // characteristics: the order of values inside one characteristic is not a change (Horoshop reorders them, 29.10.2026 05006611001)
  const same = (k, x, y) => k === 'characteristics' ? JSON.stringify(Object.fromEntries(Object.entries(x || {}).map(([c, v]) => [c, v.map(z => z.value.ua).sort()]))) === JSON.stringify(Object.fromEntries(Object.entries(y || {}).map(([c, v]) => [c, v.map(z => z.value.ua).sort()]))) : JSON.stringify(x) === JSON.stringify(y); const list = LISTF ? JSON.parse(fs.readFileSync(LISTF, 'utf8')) : Object.keys(plan);
  // batches of 25 (the API allows few requests per hour: 4 requests per batch instead of 4 per product); a product cut off mid-batch keeps its
  // add_before_<art>.json and is finished one by one below (resume)
  const linksOf = a => plan[a].map((_, i) => 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/global_add/' + encodeURIComponent(path.basename(fileOf(a, i))));
  const fresh = list.filter(a => !(st[a] && st[a].done) && !fs.existsSync(path.join(WORK, 'add_before_' + a + '.json')));
  for (let i = 0; i < fresh.length; i += 25) { if (Date.now() - T0 > BUD - 120000) break; const arts = fresh.slice(i, i + 25);
    const r0 = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 100, allowLarge: true }); const B0 = Object.fromEntries(((r0.response || {}).products || []).map(p => [p.article, p]));
    if (Object.keys(B0).length !== arts.length) stop('batch export ' + Object.keys(B0).length + ' of ' + arts.length);
    for (const a of arts) { if (B0[a].images.length !== (L[a].images || []).length) stop(`${a}: photos ${B0[a].images.length} now, ${(L[a].images || []).length} when planned`); fs.writeFileSync(path.join(WORK, 'add_before_' + a + '.json'), JSON.stringify(B0[a])); for (const u of linksOf(a)) { const h = await fetch(u); if (h.status !== 200) stop(`${a}: not on GitHub ${u}`); } }
    const TMP = path.join(__dirname, `../fix/wera_add_batch.json`); fs.writeFileSync(TMP, JSON.stringify({ products: arts.map(a => ({ article: a, images: { override: false, links: linksOf(a) } })) }));
    const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const w = dry.willChange || [];
    if (w.length !== arts.length || w.some(x => !arts.includes(x.article) || x.isNew || Object.keys(x.changes || {}).some(k => !/^images/.test(k)))) stop(`batch dry ${JSON.stringify(dry).slice(0, 400)}`);
    const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop(`batch import ${JSON.stringify(r.errors).slice(0, 300)}`); fs.unlinkSync(TMP);
    await sleep(4000); const r1 = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 100, allowLarge: true }); const A1 = Object.fromEntries(((r1.response || {}).products || []).map(p => [p.article, p]));
    for (const a of arts) { const before = B0[a], after = A1[a]; if (!after) stop(a + ' missing after'); const bi = before.images.map(fname), ai = after.images.map(fname); const n = plan[a].length;
      const bad = F.filter(k => k !== 'images' && same(k, before[k], after[k]) === false); if (ai.slice(0, bi.length).join() !== bi.join()) bad.push('old photos changed or moved'); if (ai.length !== bi.length + n) bad.push(`photos ${bi.length} -> ${ai.length}, planned +${n}`);
      if (bad.length) stop(`${a}: ${bad.join('; ')}`); st[a] = { done: true, added: n, files: plan[a].map(x => x.file), at: new Date().toISOString() }; }
    save(); console.log(`batch ${arts[0]}…: ${arts.length} products, +${arts.reduce((s, a) => s + plan[a].length, 0)} photos, checked`); }
  for (const a of list) { if (st[a] && st[a].done) continue; if (Date.now() - T0 > BUD - 60000) break; const files = plan[a].map((_, i) => fileOf(a, i)); if (files.some(f => !fs.existsSync(f))) { console.log(a, 'files missing'); continue; }
    const BF = path.join(WORK, 'add_before_' + a + '.json'); const resumed = fs.existsSync(BF); const before = resumed ? JSON.parse(fs.readFileSync(BF, 'utf8')) : await exp(a); if (!resumed) fs.writeFileSync(BF, JSON.stringify(before));
    if (before.images.length !== (L[a].images || []).length) stop(`${a}: photos ${before.images.length} now, ${(L[a].images || []).length} when planned`);
    let after = resumed ? await exp(a) : null;
    if (!after || after.images.length === before.images.length) {
      // «Імпорт зображень» is not open to this login (24.10.2026) — catalog_import by URL from the public repo (images/global_add/, as run_batch does), appended
      const links = files.map(f => 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/global_add/' + encodeURIComponent(path.basename(f)));
      for (const u of links) { const h = await fetch(u); if (h.status !== 200) stop(`${a}: not on GitHub ${u}`); }
      const TMP = path.join(__dirname, `../fix/wera_add_${a}.json`); fs.writeFileSync(TMP, JSON.stringify({ products: [{ article: a, images: { override: false, links } }] }));
      const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const w = dry.willChange || [];
      if (w.length !== 1 || w[0].article !== a || w[0].isNew || Object.keys(w[0].changes || {}).some(k => !/^images/.test(k))) stop(`${a}: dry ${JSON.stringify(dry).slice(0, 400)}`);
      const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop(`${a}: import ${JSON.stringify(r.errors).slice(0, 300)}`); fs.unlinkSync(TMP);
      await sleep(2500); after = await exp(a); }
    const bi = before.images.map(fname), ai = after.images.map(fname); const bad = F.filter(k => k !== 'images' && same(k, before[k], after[k]) === false);
    if (ai.slice(0, bi.length).join() !== bi.join()) bad.push('old photos changed or moved'); if (ai.length !== bi.length + files.length) bad.push(`photos ${bi.length} -> ${ai.length}, planned +${files.length}`);
    if (bad.length) stop(`${a}: ${bad.join('; ')}`);
    st[a] = { done: true, added: files.length, files: plan[a].map(x => x.file), at: new Date().toISOString() }; save(); console.log(a, '+' + files.length); }
  console.log('done', Object.values(st).filter(x => x.done).length, 'of', list.length); S.close(); process.exit(0); })().catch(e => { console.error(e); save(); process.exit(1); });
