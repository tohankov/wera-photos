// Audit of shared characteristics across groups: every product that belongs to more than one group must carry the UNION of the values
// all groups (bits included) assign to the shared characteristics. node cat/shared_audit.js [fix]  (fix: dryRun -> import of actual ∪ expected)
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const sleep = ms => new Promise(r => setTimeout(r, ms));
const call = async (t, a) => { await sleep(1000); return S.call(t, a); }; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const GROUPS = ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'holders', 'adapters', 'drills', 'bitsets'].filter(g => fs.existsSync(path.join(__dirname, `g_${g}.js`)));
const exp = {}, src = {}; const add = (g, a, k, vs) => { ((exp[a] = exp[a] || {})[k] = exp[a][k] || new Set()); for (const v of vs) exp[a][k].add(v); (src[a] = src[a] || new Set()).add(g); };
const SHARED = new Set(['vyd_instrumentu', 'profil', 'pryvid', 'osoblyvosti_vykrutky', 'rozmir_nakonechnyka']);
for (const g of GROUPS) { const G = require(`./g_${g}.js`); for (const it of G.items) { src[it.a] = (src[it.a] || new Set()).add(g); for (const c of G.chars.filter(c => SHARED.has(c.key))) add(g, it.a, c.key, it.vals[c.key] || []); } }
for (const p of require('../filters/chars_payload.json').products) add('bits', p.article, 'profil', Array.isArray(p.characteristics.profil) ? p.characteristics.profil : []);
const multi = Object.keys(src).filter(a => src[a].size > 1);
const valsOf = (p, k) => (((p.characteristics || {})[k]) || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
(async () => { const cur = []; for (let i = 0; i < multi.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: multi.slice(i, i + 100) }, includedParams: ['article', 'characteristics'], limit: 200, allowLarge: true }); cur.push(...r.response.products); }
  const miss = [], fix = [];
  for (const p of cur) { const ch = {}; for (const [k, set] of Object.entries(exp[p.article] || {})) { const have = valsOf(p, k); const lack = [...set].filter(v => !have.includes(v)); if (lack.length) { miss.push(`${p.article} [${[...src[p.article]].join('+')}] ${k}: нет ${lack.join(', ')} (есть: ${have.join(', ') || '—'})`); ch[k] = [...new Set([...have, ...set])]; } }
    if (Object.keys(ch).length) fix.push({ article: p.article, characteristics: ch }); }
  console.log('multi-group products', multi.length, 'exported', cur.length, 'missing values on', fix.length); console.log(miss.join('\n'));
  if (process.argv[2] === 'fix' && fix.length) { fs.writeFileSync(BK + 'shared_audit_before.json', JSON.stringify(cur)); const pf = path.join(__dirname, 'shared_fix_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products: fix }));
    const dry = await call('horoshop_catalog_import', { productsFile: pf, dryRun: true }); const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => k !== 'characteristics'));
    if (off.length || (dry.characteristicSchemaWarnings || []).length) { console.log('STOP dryRun', JSON.stringify(off.slice(0, 3)), JSON.stringify(dry.characteristicSchemaWarnings || []).slice(0, 300)); S.close(); process.exit(2); }
    const w = await call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('import', w.status, w.updated, '/', w.total, JSON.stringify(w.errors || []).slice(0, 200));
    fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `filters shared audit fix: ${fix.length} products` }) + '\n'); }
  S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
