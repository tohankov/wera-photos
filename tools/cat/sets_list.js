// Sets of every completed group: articles whose «Вид інструменту» is a set or whose title says it is one. node cat/sets_list.js
const fs = require('fs'), path = require('path');
const RX = /набір|набором|комплект|календар|\bSet \d|\bSet\b(?!.*Mplus)/i;
const isSet = (i, title) => (i.vals ? (i.vals.vyd_instrumentu || []) : []).some(v => /^Набір|^Ударно-поворотна викрутка$/.test(v) && RX.test(title)) || ((i.vals ? (i.vals.vyd_instrumentu || []) : []).some(v => /^Набір/.test(v))) || (RX.test(title) && !/TORQ-SET/i.test(title));
const all = {};
for (const g of ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk']) { const G = require(`./g_${g}.js`); all[g] = G.items.filter(i => isSet(i, i.title)).map(i => i.a); }
all.bits = require('../filters/bits_final.json').items.filter(i => isSet({}, i.title || '')).map(i => i.a);
fs.writeFileSync(path.join(__dirname, 'sets_list.json'), JSON.stringify(all));
if (require.main === module) { const u = new Set(Object.values(all).flat()); for (const [g, l] of Object.entries(all)) console.log(g, l.length); console.log('unique', u.size); }
module.exports = all;
