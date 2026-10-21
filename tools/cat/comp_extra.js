// Set compositions that are NOT in a WERA datasheet, with their source (owner's decisions). Injected into the composition caches
// cat/sets_comp.json and cat/ds_comp_all.json (format of lib/ds_set.mjs; every group carries `src`), so sets_fill / comp_expand / g_sklad / vyd_comp read them.
//   node cat/comp_extra.js        (run again after rebuilding a cache)
// TL105 (owner 22.10.2026, п. 9): no WERA datasheet; the composition from the product description on the site («Склад: PH1х25мм - 05072070001 …»), components = catalog bits.
const fs = require('fs'), path = require('path');
const EXTRA = {
  TL105: { src: 'опис товару на сайті: «Склад: PH1х25мм - 05072070001, PH2х25мм - 05072072001, PZ1х25мм - 05072080001, PZ2х25мм - 05072082001, HEX4х25мм - 05056320001, Підставка»',
    groups: [
      { head: '851/1 Z Насадки, PH 1 x 25 мм', code: '851/1 Z', items: [{ art: '05072070001', qty: 1, size: 'PH 1 x 25 мм' }, { art: '05072072001', qty: 1, size: 'PH 2 x 25 мм' }] },
      { head: '855/1 Z Насадки, PZ 1 x 25 мм', code: '855/1 Z', items: [{ art: '05072080001', qty: 1, size: 'PZ 1 x 25 мм' }, { art: '05072082001', qty: 1, size: 'PZ 2 x 25 мм' }] },
      { head: '840/1 Z Насадки, 4 mm x 25 мм', code: '840/1 Z', items: [{ art: '05056320001', qty: 1, size: '4 mm x 25 мм' }] }] },
};
module.exports = EXTRA;
if (require.main === module) for (const f of ['sets_comp.json', 'ds_comp_all.json']) { const p = path.join(__dirname, f); const C = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [a, e] of Object.entries(EXTRA)) C[a] = e.groups.map(g => ({ ...g, src: e.src })); fs.writeFileSync(p, JSON.stringify(C)); console.log(f, 'extra', Object.keys(EXTRA).join(', ')); }
