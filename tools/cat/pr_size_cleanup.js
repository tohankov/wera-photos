// Step 8 of docs/profile_size_plan.md (owner «ок» 19.10.2026): delete the old values of «Профіль і розмір» (392, the 87 bare sizes «1», «2,0»… ids 1–87)
// and «Так» of the 8 «… у складі» dictionaries (418–425, id 1) — only values no product carries any more.
//   node cat/pr_size_cleanup.js check <live.json>   -> candidates: not used in the full export AND deletable:true in the dictionary listing; any old value in use -> listed, not deleted
//   node cat/pr_size_cleanup.js backup              -> backup/pr_size_dicts_before_<ts>.json (listing of every dictionary + UA/RU of every candidate value)
//   node cat/pr_size_cleanup.js delete              -> dryRun, then delete, one value at a time (resumable: cat/pr_size_cleanup_state.json; 429-safe)
//   node cat/pr_size_cleanup.js verify <live2.json> <live.json>  -> candidates gone from the listing; characteristics of every product equal before/after
const fs = require('fs'), path = require('path'); const MODE = process.argv[2]; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const STATE = path.join(__dirname, 'pr_size_cleanup_state.json'); const st = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {}; const save = () => fs.writeFileSync(STATE, JSON.stringify(st, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms)); let S = null;
const call = async (t, a) => { S = S || require('../lib/session.js').open(); for (let k = 0; k < 20; k++) { await sleep(1000); let r; try { r = await S.call(t, a); } catch (e) { r = { error: String(e && e.message || e) }; }
  const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/); if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { console.log('STOP', m); if (S) S.close(); process.exit(2); };
const OLD = { 392: { key: 'rozmir_nakonechnyka', ids: Array.from({ length: 87 }, (_, i) => i + 1) } };
for (const [b, k] of [[418, 'ph'], [419, 'pz'], [420, 'tx'], [421, 'sl'], [422, 'hex'], [423, 'kvadrat'], [424, 'tx_bo'], [425, 'plusminus']]) OLD[b] = { key: 'sklad_' + k, ids: [1], text: 'Так' };
const list = async b => { const r = await call('horoshop_admin_dictionary_values', { book: b, allowLarge: true }); const v = r.values || (r.response && r.response.values); if (!v) stop('listing ' + b + ' ' + JSON.stringify(r).slice(0, 300)); return v; };
(async () => {
  if (MODE === 'check') { const L = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); const cand = [], used = [];
    const B = require(BK + 'pr_size_before_1792420820881.json').dicts;
    for (const [b, o] of Object.entries(OLD)) { const inUse = new Map(); for (const p of L) for (const [k, refs] of Object.entries(p.characteristics || {})) if (k === o.key) for (const x of refs) if (o.ids.includes(+x.id)) inUse.set(+x.id, [...(inUse.get(+x.id) || []), p.article]);
      const lv = await list(b); const LV = Object.fromEntries(lv.map(v => [+v.id, v])); const old = Object.fromEntries(B[b].map(v => [+v.id, v.value]));
      for (const id of o.ids) { const v = LV[id]; if (!v) { used.push({ book: b, id, why: 'not in the listing (first 100 rows)' }); continue; }
        if (v.value !== old[id]) { used.push({ book: b, id, value: v.value, why: `text differs from the backup «${old[id]}»` }); continue; }
        if (inUse.has(id)) { used.push({ book: b, id, value: v.value, why: 'products: ' + inUse.get(id).join(',') }); continue; }
        if (v.deletable !== true) { used.push({ book: b, id, value: v.value, why: 'deletable:' + v.deletable }); continue; }
        cand.push({ book: b, id, value: v.value }); } }
    st.candidates = cand; st.kept = used; st.live = process.argv[3]; save();
    console.log('candidates', cand.length, Object.entries(cand.reduce((a, c) => (a[c.book] = (a[c.book] || 0) + 1, a), {})).map(x => x.join(':')).join(' '), '| kept', used.length); for (const u of used) console.log(' kept', JSON.stringify(u));
    S && S.close(); return; }
  if (MODE === 'backup') { const out = { at: new Date().toISOString(), listing: {}, values: [] };
    for (const b of Object.keys(OLD)) out.listing[b] = await list(b);
    for (const c of st.candidates) { const r = await call('horoshop_admin_dictionary_value_set', { book: c.book, valueId: c.id, titles: { ua: c.value }, dryRun: true }); out.values.push({ ...c, current: r.current || r.before || r }); }
    const f = BK + `pr_size_dicts_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(out, null, 1)); st.backup = f; save(); console.log('backup', f, out.values.length, 'values; sample', JSON.stringify(out.values[0]).slice(0, 400)); S && S.close(); return; }
  if (MODE === 'delete') { if (!st.backup) stop('no backup'); st.done = st.done || {};
    for (const c of st.candidates) { const k = c.book + ':' + c.id; if (st.done[k]) continue;
      const d = await call('horoshop_admin_dictionary_value_delete', { book: c.book, valueId: c.id, dryRun: true }); if (d.error || d.isError) stop(k + ' dryRun ' + JSON.stringify(d).slice(0, 300));
      const r = await call('horoshop_admin_dictionary_value_delete', { book: c.book, valueId: c.id, dryRun: false }); if (r.error || r.isError || !(r.deleted || r.alreadyGone)) stop(k + ' delete ' + JSON.stringify(r).slice(0, 300));
      st.done[k] = r.deleted ? 'deleted' : 'alreadyGone'; save(); process.stdout.write(k + ' '); }
    console.log('\ndeleted', Object.keys(st.done).length); S && S.close(); return; }
  if (MODE === 'verify') { const A = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')), B = JSON.parse(fs.readFileSync(process.argv[4], 'utf8')); const BM = Object.fromEntries(B.map(p => [p.article, p]));
    let diff = 0; const ch = p => JSON.stringify(Object.fromEntries(Object.entries(p.characteristics || {}).sort().map(([k, v]) => [k, v.map(x => x.id + ':' + x.value.ua + '/' + x.value.ru).sort()])));
    for (const p of A) { const q = BM[p.article]; if (!q || ch(p) !== ch(q)) { diff++; if (diff < 10) console.log('DIFF', p.article); } } console.log('products', A.length, 'vs', B.length, 'characteristics differ', diff);
    let left = 0; for (const b of Object.keys(OLD)) { const lv = await list(b); const ids = new Set(lv.map(v => +v.id)); const l = st.candidates.filter(c => String(c.book) === String(b) && ids.has(+c.id)); left += l.length;
      console.log(b, 'values now', lv.length, lv.length >= 100 ? '(first 100 rows)' : '', 'candidates left', l.length, 'first rows:', lv.slice(0, 4).map(v => v.id + ':' + v.value).join(', ')); }
    console.log(left ? 'NOT CLEAN' : 'CLEAN'); S && S.close(); return; }
  stop('mode?');
})();
