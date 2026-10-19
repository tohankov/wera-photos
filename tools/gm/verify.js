// Read-only check after the Google Merchant writes: one full live export -> counts (feed flag = visible − TL − EXCL, marketplace description filled,
// mpn), saved to the given file for the other checks. node gm/verify.js <out.json>
const fs = require('fs'); const S = require('../lib/session.js').open();
const F = ['article', 'title', 'mod_title', 'display_in_showcase', 'export_to_marketplace', 'marketplace_description', 'description', 'mpn', 'parent', 'alt_parent'];
const FEED = 'Google Feed for Merchant Center', EXCL = ['05133126001'], isTL = a => /^TL\d+$/.test(a);
(async () => { const all = []; for (let off = 0; ; off += 100) { await new Promise(r => setTimeout(r, 1500));
    const r = await S.call('horoshop_catalog_export', { includedParams: F, limit: 100, offset: off, allowLarge: true }); if (!r.response) { console.log('STOP', JSON.stringify(r).slice(0, 300)); S.close(); process.exit(2); }
    all.push(...r.response.products); if (r.response.products.length < 100) break; }
  fs.writeFileSync(process.argv[2], JSON.stringify(all)); S.close();
  const flag = p => JSON.stringify([].concat(p.export_to_marketplace || []).map(x => typeof x === 'string' ? x : x.value)) === JSON.stringify([FEED]);
  const vis = all.filter(p => +p.display_in_showcase === 1), exp = vis.filter(p => !isTL(p.article) && !EXCL.includes(p.article));
  console.log('catalog', all.length, 'visible', vis.length, 'TL visible', vis.filter(p => isTL(p.article)).map(p => p.article).join(','), 'excluded', EXCL.join(','));
  console.log('feed flag: total', all.filter(flag).length, 'expected (visible − TL − excluded)', exp.length, 'expected without flag', exp.filter(p => !flag(p)).map(p => p.article).join(',') || 0,
    'flag on hidden/TL/excluded', all.filter(p => flag(p) && !exp.includes(p)).map(p => p.article).join(',') || 0);
  const md = p => p.marketplace_description || {}; console.log('marketplace description: UA filled', all.filter(p => (md(p).ua || '').trim()).length, 'RU filled', all.filter(p => (md(p).ru || '').trim()).length,
    'max length', Math.max(...all.flatMap(p => [(md(p).ua || '').length, (md(p).ru || '').length])), 'with <tag', all.filter(p => /<[a-z]/i.test((md(p).ua || '') + (md(p).ru || ''))).length);
  for (const a of EXCL) { const p = all.find(x => x.article === a); console.log(a, 'mpn', JSON.stringify(p && p.mpn), 'flag', p && flag(p)); }
  console.log('mpn = article', all.filter(p => p.mpn === p.article).length, 'without mpn', all.filter(p => !p.mpn).map(p => p.article).join(','));
})();
