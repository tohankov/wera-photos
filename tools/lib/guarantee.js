// Guarantee «Виробник, 12 міс.» on products created before the rule (pilot + batch 1), via the form with the CLAUDE.md export check.
const fs = require('fs'); const S = require('./session.js').open();
const B = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const ids = { ...Object.fromEntries(require('../batches/pilot/slug_plan.json').map(p => [p.article, p.id])), ...require('../batches/b1/ids.json') };
const exp = { expr: { article: Object.keys(ids) }, includedParams: ['article', 'title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'], limit: 50, allowLarge: true };
const set = { 'parent_common[guarantee_shop]': '2', 'parent_common[guarantee_length]': '12' };
(async () => {
  const dry = [];
  for (const [a, id] of Object.entries(ids)) { const r = await S.call('horoshop_admin_record_save', { entity: 'products', id: +id, dryRun: true, set }); dry.push([a, (r.willChange || []).length, (r.unknownFields || []).length]); }
  const off = dry.filter(d => d[2] > 0 || d[1] > 2); if (off.length) { console.log('dry outside plan', off); S.close(); return; }
  const before = (await S.call('horoshop_catalog_export', exp)).response.products; fs.writeFileSync(B + 'guarantee17_before.json', JSON.stringify(before));
  let ok = 0; for (const [a, id] of Object.entries(ids)) { const r = await S.call('horoshop_admin_record_save', { entity: 'products', id: +id, dryRun: false, set }); if (r.saved) ok++; else console.log('fail', a, JSON.stringify(r).slice(0, 200)); }
  const after = (await S.call('horoshop_catalog_export', exp)).response.products; fs.writeFileSync(B + 'guarantee17_after.json', JSON.stringify(after));
  const bad = []; for (const x of before) { const y = after.find(q => q.article === x.article); for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) bad.push(x.article + ' ' + k); }
  console.log('dry', dry.map(d => d[1]).join(','), '| saved', ok, 'of', dry.length, '| export diff', bad.length ? bad : 'none');
  fs.appendFileSync(B + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: 'guarantee Виробник 12 міс. on pilot 10 + batch 1 (7) via form', ok, bad }) + '\n');
  S.close();
})();
