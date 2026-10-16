// Bits pilot: write the 6 characteristics (template 460, dictionaries 382-387) to every bit + the 3 accessories in 1459.
//   node filters/import_chars.js seed     — create every dictionary value in the preview order (one product carries all values once)
//   node filters/import_chars.js full     — backup -> dryRun (only `characteristics` may change) -> import -> verify by export
//   node filters/import_chars.js verify   — completeness per subsection from a fresh export
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open();
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/'; const mode = process.argv[2];
const { items } = require('./bits_final.json'); const L = require('./bits_lists.json');
const live = require('./bits_live.json');
const C = { 'Профіль': 'profil', 'Розмір': 'rozmir', 'Довжина': 'dovzhyna', 'Тип біти': 'typ_bity', 'Хвостовик': 'khvostovyk', 'Особливості': 'osoblyvosti' };
const NONBITS = ['TL64', '05049002001', '05051278001']; const SEED = '05134740001';
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1200); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const uniq = a => [...new Set(a)];
// planned values (UA text; import mirrors it to every language, RU is set on the dictionary afterwards)
function plan() {
  const P = {};
  for (const v of items) { P[v.a] = { profil: [v.profile[0]], rozmir: [require('../lib/valsort.js').fixZero(v.size)], dovzhyna: [v.length], typ_bity: [v.type[0]], khvostovyk: [v.shank[0]] }; if (v.features.length) P[v.a].osoblyvosti = v.features.map(f => f[0]); }
  // accessories in 1459 carry every value the bits of 1459 have (decision 15.10: visible under any filter in 1459)
  const in1459 = items.filter(v => v.secs.includes(1459)); const order = (k, vals) => L[Object.keys(C).find(x => C[x] === k)].map(e => e[0]).filter(x => vals.includes(x));
  const all = k => order(k, uniq(in1459.flatMap(v => P[v.a][k] || [])));
  for (const a of NONBITS) P[a] = Object.fromEntries(Object.values(C).map(k => [k, all(k)]).filter(([, v]) => v.length));
  return P;
}
const exportChars = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: ['article', 'parent', 'alt_parent', 'title', 'price', 'display_in_showcase', 'characteristics'], limit: 200, allowLarge: true }); out.push(...r.response.products); } return out; };
const valsOf = p => Object.fromEntries(Object.values(C).map(k => [k, ((p.characteristics || {})[k] || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean)]));
(async () => {
  const P = plan(); const arts = Object.keys(P);
  if (mode === 'seed') {
    const ch = Object.fromEntries(Object.entries(C).map(([n, k]) => [k, L[n].map(e => e[0])]));
    const r = await call('horoshop_catalog_import', { products: [{ article: SEED, characteristics: ch }], dryRun: false });
    console.log('seed', JSON.stringify(r).slice(0, 200));
    for (const [n, k] of Object.entries(C)) { const book = { profil: 382, rozmir: 383, dovzhyna: 384, typ_bity: 385, khvostovyk: 386, osoblyvosti: 387 }[k]; const d = await call('horoshop_admin_dictionary_values', { book });
      const got = d.values.map(v => v.value), want = L[n].map(e => e[0]); console.log(n, 'dictionary', got.length, 'planned', want.length, 'same order:', JSON.stringify(got) === JSON.stringify(want)); if (JSON.stringify(got) !== JSON.stringify(want)) console.log('  got', got.join(' | ')); }
  }
  if (mode === 'full') {
    const before = await exportChars(arts); if (before.length !== arts.length) stop(`backup export ${before.length} of ${arts.length}`);
    fs.writeFileSync(BK + 'bits_chars_before.json', JSON.stringify(before));
    const products = arts.map(a => ({ article: a, characteristics: { ...Object.fromEntries(Object.values(C).map(k => [k, ''])), ...P[a] } })); // unset fields cleared explicitly (the seed product carried every value)
    const pf = path.join(__dirname, 'chars_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
    const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => k !== 'characteristics'));
    if (off.length || dry.summary.newProducts) stop('dryRun outside plan: ' + JSON.stringify(off.slice(0, 5)));
    if ((dry.characteristicSchemaWarnings || []).length || (dry.characteristicSchemaUnverified || []).length) stop('schema warnings: ' + JSON.stringify(dry.characteristicSchemaWarnings || dry.characteristicSchemaUnverified).slice(0, 400));
    console.log('dryRun ok:', dry.summary);
    const w = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('import', JSON.stringify(w).slice(0, 300));
    const after = await exportChars(arts); fs.writeFileSync(BK + 'bits_chars_after.json', JSON.stringify(after));
    let bad = []; for (const p of after) { const got = valsOf(p), want = P[p.article]; for (const k of Object.values(C)) if (JSON.stringify(got[k]) !== JSON.stringify(want[k] || [])) bad.push(`${p.article} ${k}: ${got[k]} ≠ ${want[k] || []}`);
      const b = before.find(x => x.article === p.article); for (const f of ['parent', 'alt_parent', 'title', 'price', 'display_in_showcase']) if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${p.article} ${f} changed`); }
    console.log('verify: products', after.length, 'problems', bad.length); if (bad.length) { console.log(bad.slice(0, 20).join('\n')); fs.writeFileSync(path.join(__dirname, 'chars_problems.json'), JSON.stringify(bad, null, 1)); }
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `bits characteristics: ${after.length} products, problems ${bad.length}` }) + '\n');
  }
  if (mode === 'verify') {
    const after = await exportChars(arts); const secs = {};
    for (const p of after) { const s = [p.parent.id, ...(p.alt_parent || []).map(x => x.id)]; const v = valsOf(p);
      for (const id of s) { const it = items.find(x => x.a === p.article); if (it && !it.secs.includes(id)) continue; if (!it && id !== 1459) continue; const k = NONBITS.includes(p.article) ? id + ' (не-біти)' : String(id);
        const o = (secs[k] = secs[k] || { n: 0, profil: 0, rozmir: 0, dovzhyna: 0, typ_bity: 0, khvostovyk: 0, osoblyvosti: 0 }); o.n++; for (const c of Object.values(C)) if (v[c].length) o[c]++; } }
    console.log('section | products | Профіль | Розмір | Довжина | Тип | Хвостовик | Особливості');
    for (const [k, o] of Object.entries(secs).sort()) console.log([k, o.n, o.profil, o.rozmir, o.dovzhyna, o.typ_bity, o.khvostovyk, o.osoblyvosti].join(' | '));
    fs.writeFileSync(path.join(__dirname, 'chars_verify.json'), JSON.stringify(secs, null, 1));
  }
  S.close(); process.exit(0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
