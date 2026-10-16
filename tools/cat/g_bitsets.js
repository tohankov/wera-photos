// Group definition «Набори з бітами» (1082) for cat/import_group.js. Every product is a set: values come from its WERA composition (cat/sets_fill.js);
// Bit-Box packs of one bit type take the bit from the datasheet title («Bit-Box 15 Impaktor PH, PH 2 x 25 мм, 15 предметов»).
const fs = require('fs'), path = require('path'); const I = require('./1082_items.json');
const dsTitle = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); if (!fs.existsSync(f)) return ''; const L = fs.readFileSync(f, 'utf8').split('\n').map(s => s.replace(/^p\d /, '')); const k = L.findIndex(s => /^EAN:/.test(s)); return L.slice(0, k > 0 ? k : 2).join(' '); };
const PROF = { PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', TX: 'TX (TORX®)' };
const TYP = ['Стандартна', 'Торсійна', 'Ударна (Impaktor)', 'Алмазне покриття', 'Нержавіюча сталь'], TYP_RU = { 'Стандартна': 'Стандартная', 'Торсійна': 'Торсионная', 'Ударна (Impaktor)': 'Ударная (Impaktor)', 'Алмазне покриття': 'Алмазное покрытие', 'Нержавіюча сталь': 'Нержавеющая сталь' };
const items = I.map(it => { const t = dsTitle(it.a); const vals = { vyd_instrumentu: [/торцевих головок/i.test(it.title) ? 'Набір головок' : 'Набір біт'], profil: [], rozmir: [], dovzhyna: [], typ_bit_u_nabori: [] };
  const m = t.match(/^Bit-Box \d+ (Impaktor )?(PH|PZ|TX)\b[^,]*, (PH|PZ|TX) (\d+) x (\d+) мм, \d+ предмет/);
  if (m) { vals.profil = [PROF[m[3]]]; vals.rozmir = [m[4]]; vals.dovzhyna = [m[5] + ' мм']; vals.typ_bit_u_nabori = [m[1] ? 'Ударна (Impaktor)' : 'Стандартна']; }
  return { a: it.a, title: it.title, secs: it.secs, kind: 'set', single: !!m, vals }; });
const L = require('./sets_list.json'); const one = new Set(items.filter(i => i.single).map(i => i.a)); L.bitsets_fill = (L.bitsets || []).filter(a => !one.has(a));
module.exports = {
  name: 'bitsets', root: 1082, seed: '05057752001', testArticle: '05057752001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Набір біт'], ru: { 'Набір біт': 'Набор бит' } },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir', title: 'Розмір', book: 383 },
    { key: 'dovzhyna', title: 'Довжина', book: 384 },
    { key: 'typ_bit_u_nabori', title: 'Тип біт у наборі', titleRu: 'Тип бит в наборе', order: 'given', values: TYP, ru: TYP_RU },
  ],
  items, disputed: [],
  required: it => it.single || !it.noComp ? ['vyd_instrumentu', 'profil', 'rozmir'] : ['vyd_instrumentu'],
  filterOrder: ['Хіти продажів', 'Профіль', 'Ціна', 'Розмір', 'Довжина', 'Тип біт у наборі', 'Вид інструменту'],
};
// sets get all values of their composition (cat/sets_fill.js); single-type Bit-Box packs are already filled from the datasheet title
{ const one = items.filter(i => i.single); const F = require('./sets_fill.js')('bitsets', items.filter(i => !i.single), module.exports.chars);
  const nc = new Set(F.disputed.map(d => d.a)); module.exports.items = [...one, ...F.items.map(i => nc.has(i.a) ? { ...i, noComp: true } : i)]; module.exports.disputed = F.disputed; module.exports.setsReport = F.report; }
