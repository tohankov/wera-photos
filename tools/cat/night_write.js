// Night work 20–21.10.2026: one writer for every planned characteristics change (one group at a time, foreground, resumable).
//   node cat/night_write.js <plan.json> backup|dry|write|verify
// plan.json: { name, keys: [characteristic keys allowed to change], products: [{ article, characteristics: { key: [values] } }] }  (an empty list clears the key)
// backup -> backup/night_<name>_before_<ts>.json (products with every field the verify compares);
// dry    -> catalog_import dryRun per batch of 100: STOP if anything but characteristics, or a characteristic outside plan.keys, would change;
// write  -> dryRun + import per batch (state cat/night_<name>_state.json: done batches; 429 -> wait and go on);
// verify -> fresh export of the plan products: planned keys = plan, every other characteristic / title / mod_title / parent / alt_parent / price / visibility = backup.
const fs = require('fs'), path = require('path'); const [, , PLANF, MODE] = process.argv; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const plan = JSON.parse(fs.readFileSync(PLANF, 'utf8')); const NAME = plan.name; const STATE = path.join(__dirname, `night_${NAME}_state.json`);
const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { done: {} }; const save = () => fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms)); let S = null;
const call = async (t, a) => { S = S || require('../lib/session.js').open(); for (let k = 0; k < 30; k++) { await sleep(1200); let r; try { r = await S.call(t, a); } catch (e) { r = { error: String(e && e.message || e) }; }
  const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { console.log('STOP', m); if (S) S.close(); process.exit(2); };
const FIELDS = ['article', 'parent', 'alt_parent', 'title', 'mod_title', 'price', 'display_in_showcase', 'characteristics'];
const ARTS = plan.products.map(x => x.article); if (new Set(ARTS).size !== ARTS.length) stop('duplicate articles in the plan');
for (const x of plan.products) for (const k of Object.keys(x.characteristics)) if (!plan.keys.includes(k)) stop(`${x.article}: ${k} not in plan.keys`);
const batches = []; for (let i = 0; i < plan.products.length; i += 100) batches.push(plan.products.slice(i, i + 100));
const exp = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: FIELDS, limit: 100, allowLarge: true }); if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 300)); out.push(...r.response.products); } return out; };
const vals = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const dryCheck = d => { const bad = []; if (d.error || d.isError) bad.push('dry error ' + JSON.stringify(d).slice(0, 300));
  for (const w of d.willChange || []) for (const k of Object.keys(w.changes || w.fields || {})) if (!/^characteristics/.test(k)) bad.push(w.article + ':' + k);
  for (const c of d.characteristics || []) for (const k of Object.keys(c.write || {})) if (!plan.keys.includes(k)) bad.push(c.article + ': char ' + k);
  if ((d.summary || {}).newProducts) bad.push('new products ' + d.summary.newProducts); return bad; };
(async () => {
  if (MODE === 'backup') { const b = await exp(ARTS); if (b.length !== ARTS.length) stop('backup count ' + b.length + ' of ' + ARTS.length); const f = BK + `night_${NAME}_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(b)); st.backup = f; save(); console.log('backup', f, b.length); }
  if (MODE === 'dry') { let n = 0; for (const b of batches) { const d = await call('horoshop_catalog_import', { products: b, dryRun: true }); const bad = dryCheck(d); console.log('dry batch', ++n, JSON.stringify(d.summary), 'schema warnings', JSON.stringify(d.characteristicSchemaWarnings || null)); if (bad.length) stop(bad.slice(0, 20).join(', ')); }
    console.log('dry OK', plan.products.length, 'products'); }
  if (MODE === 'write') { if (!st.backup) stop('no backup'); for (let i = 0; i < batches.length; i++) { if (st.done[i]) continue; const d = await call('horoshop_catalog_import', { products: batches[i], dryRun: true }); const bad = dryCheck(d); if (bad.length) stop('batch ' + i + ' ' + bad.slice(0, 20).join(', '));
      const r = await call('horoshop_catalog_import', { products: batches[i], dryRun: false }); if (r.error || r.isError || r.status !== 'OK') stop('batch ' + i + ' ' + JSON.stringify(r).slice(0, 400));
      st.done[i] = r.updated; save(); console.log('batch', i, 'updated', r.updated, r.note || ''); } console.log('write done', Object.keys(st.done).length, 'batches'); }
  if (MODE === 'verify') { if (!st.backup) stop('no backup'); const before = JSON.parse(fs.readFileSync(st.backup, 'utf8')); const after = await exp(ARTS); const B = Object.fromEntries(before.map(p => [p.article, p])); const P = Object.fromEntries(plan.products.map(x => [x.article, x]));
    const ids = l => (l || []).map(x => +x.id).sort((a, b) => a - b).join(','); const bad = []; if (after.length !== ARTS.length) bad.push('export count ' + after.length);
    for (const p of after) { const b = B[p.article], x = P[p.article];
      for (const f of ['title', 'mod_title']) if (JSON.stringify(p[f]) !== JSON.stringify(b[f])) bad.push(p.article + ' ' + f);
      if (+p.parent.id !== +b.parent.id || ids(p.alt_parent) !== ids(b.alt_parent)) bad.push(p.article + ' parent/alt_parent');
      if (p.price !== b.price || +p.display_in_showcase !== +b.display_in_showcase) bad.push(p.article + ' price/visibility');
      for (const k of new Set([...Object.keys(p.characteristics || {}), ...Object.keys(b.characteristics || {}), ...Object.keys(x.characteristics)])) { const want = k in x.characteristics ? x.characteristics[k] : vals(b, k);
        if (JSON.stringify([...vals(p, k)].sort()) !== JSON.stringify([...want].sort())) bad.push(`${p.article} ${k}: ${vals(p, k).join(', ')} want ${want.join(', ')}`); } }
    const f = BK + `night_${NAME}_after_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(after)); st.verify = { at: new Date().toISOString(), problems: bad.length, after: f }; save();
    console.log('verify', after.length, 'problems', bad.length); bad.slice(0, 40).forEach(x => console.log(' ', x)); }
  if (S) S.close();
})();
