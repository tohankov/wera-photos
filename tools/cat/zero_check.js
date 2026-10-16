// Size «0» rename check (Horoshop hides a characteristic whose value is "0" on the product page; the dictionary value is now "0" + NBSP).
// Exports every product that carries size 0 in rozmir / rozmir_nakonechnyka / rozmir_robochoho_kintsia and checks the stored text and value id.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const { ZERO } = require('../lib/valsort.js');
const K = { rozmir: '3', rozmir_nakonechnyka: '3', rozmir_robochoho_kintsia: '1' };
const M = require('./member_vals.json'); for (const p of require('../filters/chars_payload.json').products) M[p.article] = M[p.article] || { vals: p.characteristics };
const arts = Object.keys(M).filter(a => Object.keys(K).some(k => (M[a].vals[k] || []).some(v => v === '0' || v === ZERO)));
(async () => { const out = []; for (let i = 0; i < arts.length; i += 100) { await new Promise(r => setTimeout(r, 1000)); const r = await S.call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: ['article', 'characteristics'], limit: 200, allowLarge: true }); out.push(...r.response.products); }
  let ok = 0; const bad = [];
  for (const a of arts) { const p = out.find(x => x.article === a); const z = p && Object.entries(K).flatMap(([k, id]) => ((p.characteristics || {})[k] || []).filter(x => String(x.id) === id).map(x => [k, x]));
    if (!z || !z.length) { bad.push(a + ' size 0 missing'); continue; } for (const [k, x] of z) { if (x.value.ua === ZERO && x.value.ru === ZERO) ok++; else bad.push(`${a} ${k} ${JSON.stringify(x.value)}`); } }
  console.log('products', arts.length, 'values ok', ok, 'problems', bad.length); if (bad.length) console.log(bad.join('\n'));
  fs.writeFileSync('C:/Users/Techlight/Desktop/wera-photos/backup/zero_after.json', JSON.stringify(out)); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
