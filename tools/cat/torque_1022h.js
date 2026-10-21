// Owner 22.10.2026 (docs/filters_rule_check.md п. 5, вариант (а)): «Діапазон моменту» = the exact WERA range (cat/torque_exact.json, the dyn generator);
// the recalibration set 05137003001 (no torque in its datasheet) loses the value. Dictionary 401: the 36 values seeded in ascending order (in·lb last) on
// 05027935001 before the write, the 6 old bins deleted after the check.
//   node cat/torque_1022h.js <live.json> -> cat/torque_1022h_plan.json (cat/night_write.js)
const fs = require('fs'), path = require('path'); const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const G = Object.fromEntries(require('./g_dyn.js').items.map(i => [i.a, i.vals.diapazon_momentu || []]));
const products = L.filter(p => (p.characteristics.diapazon_momentu || []).length || (G[p.article] || []).length).map(p => ({ article: p.article, characteristics: { diapazon_momentu: G[p.article] || [] } }));
fs.writeFileSync(path.join(__dirname, 'torque_1022h_plan.json'), JSON.stringify({ name: 'torque_1022h', keys: ['diapazon_momentu'], seedOrder: require('./torque_exact.json').order, products }, null, 1));
console.log('products', products.length, 'cleared', products.filter(x => !x.characteristics.diapazon_momentu.length).map(x => x.article).join(', '));
