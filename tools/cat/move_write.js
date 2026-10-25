// Section moves approved by the owner (25.10.2026: 05136413001 + 1186; 1267 A main 1128, 1101 off): parent and the FULL alt_parent list.
//   node cat/move_write.js <plan.json> backup|dry|write|verify     plan: { name, products: [{ article, parent: id, alt_parent: [id, ...] }] }
// backup -> backup/move_<name>_before_<ts>.json (whole export); dry — catalog_import dryRun: only parent / alt_parent may change, else STOP;
// write — import; verify — export: parent and alt_parent = plan, every other field = backup.
const fs = require('fs'), path = require('path'); const [, , PF, MODE] = process.argv; const plan = JSON.parse(fs.readFileSync(PF, 'utf8'));
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/'; const SF = path.join(__dirname, `move_${plan.name}_state.json`); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {};
const S = require('../lib/session.js').open(); const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const F = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'slug', 'description', 'characteristics', 'icons', 'short_description', 'seo_title', 'seo_description'];
const arts = plan.products.map(p => p.article); const exp = async () => { const r = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 100, allowLarge: true }); if (!r.response) stop('export'); return r.response.products; };
const TMP = path.join(__dirname, `../fix/move_${plan.name}.json`); const payload = () => fs.writeFileSync(TMP, JSON.stringify({ products: plan.products.map(p => ({ article: p.article, parent: { id: p.parent }, alt_parent: p.alt_parent.map(id => ({ id })) })) }));
(async () => {
  if (MODE === 'backup') { const b = await exp(); const f = BK + `move_${plan.name}_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(b)); st.backup = f; fs.writeFileSync(SF, JSON.stringify(st)); console.log('backup', f, b.length); }
  if (MODE === 'dry' || MODE === 'write') { payload(); const d = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true });
    const off = (d.willChange || []).flatMap(w => Object.keys(w.changes || {}).filter(k => !/^(parent|alt_parent)/.test(k)).map(k => w.article + ':' + k)); if (off.length || (d.summary || {}).newProducts) stop('dry outside plan ' + JSON.stringify(off) + JSON.stringify(d.summary));
    console.log('dry OK', JSON.stringify((d.willChange || []).map(w => [w.article, Object.keys(w.changes || {})])));
    if (MODE === 'write') { const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop('import ' + JSON.stringify(r.errors)); console.log('written', JSON.stringify(r).slice(0, 200)); } }
  if (MODE === 'verify') { const b = JSON.parse(fs.readFileSync(st.backup, 'utf8')); const a = await exp(); const bad = [];
    for (const p of plan.products) { const x = b.find(q => q.article === p.article), y = a.find(q => q.article === p.article);
      if (+y.parent.id !== p.parent) bad.push(`${p.article} parent ${y.parent.id}`); const alt = (y.alt_parent || []).map(q => +q.id).sort().join(); if (alt !== [...p.alt_parent].sort().join()) bad.push(`${p.article} alt ${alt}`);
      for (const k of F) if (!['parent', 'alt_parent'].includes(k) && JSON.stringify(x[k]) !== JSON.stringify(y[k])) bad.push(`${p.article} ${k}`); }
    console.log('verify', plan.products.length, bad.length ? 'PROBLEMS ' + bad.join('; ') : 'problems 0'); }
  S.close(); })();
