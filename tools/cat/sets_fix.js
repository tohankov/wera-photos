// Sets whose WERA composition the parsers missed (19.10.2026 audit, cat/sets_audit.js): the composition is prose in the datasheet, or its rows have no
// catalog article (combination ends, L-keys, bit sockets). Values are ADDED to what the product has (unions; nothing removed, other characteristics untouched).
//   node cat/sets_fix.js dry | write   -> backup/sets_fix_before_<ts>.json, dryRun (only characteristics), import, export check
// Sources: tools/batch/ds/<article>.txt (WERA datasheet, ru) unless said otherwise.
const fs = require('fs'); const MODE = process.argv[2] || 'dry'; let S;
const PH = 'PH (Phillips)', PZ = 'PZ (Pozidriv)', TX = 'TX (TORX®)', SL = 'SL (шліц)', HEX = 'HEX (шестигранник)', Y = ['Так'];
const FIX = {
  // Bicycle Set 5 2025: datasheet composition table (batch/ds/05004186001.set.json) 3851/1 TS PH 1; 3867/1 TS TX 10, TX 25; 3840/1 TS 2.5, 3, 4, 5 mm
  '05004186001': { profil: [PH, TX, HEX], sklad_ph: Y, sklad_tx: Y, sklad_hex: Y },
  // Bicycle Set 15: «Бит "4-в-1" 9506 - винты с внутренним шестигранником четырёх размеров (3,0; 4,0; 5,0; 6,0), бит "4-в-1" 9507 - винты с внутренним
  // шестигранником трёх размеров (2,5; 5,0; 6,0) и TORX® (TX 25)»
  '05004182001': { profil: [HEX, TX], rozmir_nakonechnyka: ['2,5', '3,0', '4,0', '5,0', '6,0', '25'], sklad_hex: Y, sklad_tx: Y },
  // Christmas 2026 screwdriver mix: «Отвертка-долото 932 A (с прорезью)… Отвертка 350 PH… Отвертка 160 iS (шлицевая)»
  '05135826001': { profil: [SL, PH], sklad_sl: Y, sklad_ph: Y },
  // Bit-Check 30 Christmas 2026: «29 … битов универсальных для винтов Phillips, Pozidriv и TORX®»
  '05135824001': { profil: [PH, PZ, TX], sklad_ph: Y, sklad_pz: Y, sklad_tx: Y },
  // Advent calendar 2023, rows without article: 85 PH 1 x PH 2, 86 Ni PZ 1 x PZ 2, 87 Ni TX 10 x TX 15 / TX 20 x TX 25, 81 Ni 0.6x4 / 1x6 (slot),
  // 950 L Ni L-keys (hex) 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 mm
  '05136607001': { profil: [PZ, HEX], rozmir_nakonechnyka: ['1', '2', '10', '15', '20', '25', '4,0', '6,0', '1,5', '2,0', '2,5', '3,0', '5,0', '8,0', '10,0'], sklad_pz: Y, sklad_hex: Y },
  // Bicycle Set 8 (3/8″ bit sockets), rows not in the catalog: 8767 B TX 25, TX 30 x 107 mm; 8740 B (hex) 4, 5, 6 x 107 mm, 8, 10 x 100 mm
  '05004176001': { profil: [HEX], rozmir_holovky: ['4,0', '5,0', '6,0', '8,0', '10,0', '25', '30'], dovzhyna_holovky: ['107 мм', '100 мм'], sklad_hex: Y },
};
const arts = Object.keys(FIX); const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const valsOf = (p, k) => (((p.characteristics || {})[k]) || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
const exp = async () => { const r = await S.call('horoshop_catalog_export', { expr: { article: arts }, includedParams: ['article', 'parent', 'alt_parent', 'title', 'display_in_showcase', 'characteristics'], limit: 50, allowLarge: true });
  if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 300)); return r.response.products; };
if (require.main === module) (async () => { S = require('../lib/session.js').open(); const before = await exp(); if (before.length !== arts.length) stop('export ' + before.length);
  const want = {}; for (const p of before) want[p.article] = Object.fromEntries(Object.entries(FIX[p.article]).map(([k, add]) => [k, [...new Set([...valsOf(p, k), ...add])]]));
  for (const p of before) console.log(p.article, Object.entries(want[p.article]).map(([k, v]) => `${k}: +${v.filter(x => !valsOf(p, k).includes(x)).join('/') || '—'}`).join('; '));
  const pf = __dirname + '/sets_fix_payload.json'; fs.writeFileSync(pf, JSON.stringify({ products: arts.map(a => ({ article: a, characteristics: want[a] })) }));
  const dry = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
  const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => k !== 'characteristics'));
  if (off.length || (dry.summary || {}).newProducts) stop('dryRun outside plan ' + JSON.stringify(off).slice(0, 300));
  if ((dry.characteristicSchemaWarnings || []).length || (dry.characteristicSchemaUnverified || []).length) stop('schema ' + JSON.stringify(dry.characteristicSchemaWarnings || dry.characteristicSchemaUnverified).slice(0, 300));
  console.log('dryRun: change', (dry.willChange || []).length, 'only characteristics');
  if (MODE !== 'write') { S.close(); return; }
  fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/sets_fix_before_${Date.now()}.json`, JSON.stringify(before));
  const w = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('import', w.status, w.updated, '/', w.total, JSON.stringify(w.errors || []).slice(0, 200));
  await new Promise(r => setTimeout(r, 2000)); const after = await exp(); const bad = []; const st = a => JSON.stringify([...a].sort());
  for (const p of after) { const b = before.find(x => x.article === p.article);
    for (const k of new Set([...Object.keys(b.characteristics || {}), ...Object.keys(p.characteristics || {})])) { const exp_ = want[p.article][k] || valsOf(b, k); if (st(valsOf(p, k)) !== st(exp_)) bad.push(`${p.article} ${k}: ${valsOf(p, k)} ≠ ${exp_}`); }
    for (const f of ['parent', 'alt_parent', 'title', 'display_in_showcase']) if (JSON.stringify(b[f]) !== JSON.stringify(p[f])) bad.push(`${p.article} ${f} changed`); }
  console.log('verify', after.length, 'problems', bad.length, bad.join('\n')); S.close(); if (bad.length) process.exit(2);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
module.exports = FIX;
