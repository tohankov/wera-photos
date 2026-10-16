// Group «Інструментальний візок та ложементи» (1055) for cat/import_group.js. Every product is a filled set (ложемент / візок з інструментом) or an empty one.
// Filled: values from the WERA composition (cat/comp_expand.js, nested inserts opened): «Інструмент у ложементі» by the component's «Вид інструменту»
// (or the composition text for components not in the catalog: KNIPEX, PICARD, RENNSTEIG, PFERD), «Профіль», «Привід».
// Empty («неукомплектований», «без інструменту»): «Інструмент у ложементі» = what the insert is for — taken from the filled WERA set whose composition
// lists this empty insert; if none lists it, from the WERA datasheet title. Empty trolleys: only «Вид» and «Комплектація».
const fs = require('fs'), path = require('path'); const I = require('./1055_items.json'); const { expand, hasComp } = require('./comp_expand.js'); const C = require('./sets_comp.json');
const ds = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').slice(0, 2).join(' ').replace(/p\d /g, '') : ''; };
const CAT = ['Викрутки', 'Біти', 'Торцеві головки', 'Тріскачки', 'Гайкові ключі', 'Г-подібні ключі', 'Індикатор напруги', 'Плоскогубці та кліщі KNIPEX', 'Молотки', 'Зубила та вибивачі', 'Напилки PFERD'];
const CAT_RU = { 'Викрутки': 'Отвёртки', 'Біти': 'Биты', 'Торцеві головки': 'Торцевые головки', 'Тріскачки': 'Трещотки', 'Гайкові ключі': 'Гаечные ключи', 'Г-подібні ключі': 'Г-образные ключи', 'Індикатор напруги': 'Индикатор напряжения', 'Плоскогубці та кліщі KNIPEX': 'Плоскогубцы и клещи KNIPEX', 'Зубила та вибивачі': 'Зубила и выколотки', 'Напилки PFERD': 'Напильники PFERD' };
const BY_VYD = [[/^(Викрутка|Набір викруток|Ударно-поворотна викрутка|Змінна вставка|Змінний робочий кінець Vario)$/, 'Викрутки'], [/^Набір біт$/, 'Біти'], [/^(Торцева головка.*|Набір головок|Викруткова головка)$/, 'Торцеві головки'],
  [/^(Тріскачка|Набір з тріскачкою)$/, 'Тріскачки'], [/^(Комбінований ключ|Двосторонній ріжковий ключ|Ріжковий ключ|Набір ключів)$/, 'Гайкові ключі'], [/^(Г-подібний ключ|Набір Г-подібних ключів)$/, 'Г-подібні ключі'], [/^Індикатор напруги$/, 'Індикатор напруги']];
const BY_TEXT = [[/KNIPEX/, 'Плоскогубці та кліщі KNIPEX'], [/^Молоток/i, 'Молотки'], [/зубило|ыколотк/i, 'Зубила та вибивачі'], [/^Напильник/i, 'Напилки PFERD'], [/Bit Ratchet|трещотк/i, 'Тріскачки']];
const catOf = x => { const out = new Set(); for (const v of (x.vals.vyd_instrumentu || [])) for (const [r, c] of BY_VYD) if (r.test(v)) out.add(c);
  if (!out.size && (x.vals.khvostovyk || x.vals.typ_bity) && (x.vals.profil || []).length) out.add(/отв[её]рт/i.test(x.head) && !x.art ? 'Викрутки' : 'Біти');
  if (!out.size && !x.known && !/Ложемент|липучк|Щётка/i.test(x.head)) for (const [r, c] of BY_TEXT) if (r.test(x.head)) out.add(c);
  return [...out]; };
const isEmpty = (it, t) => /неукомплект|неукомппл|без інструмент|без инструмент/i.test(it.title + ' ' + t);
const fill = {}; for (const it of I) { const t = ds(it.a); if (isEmpty(it, t) || !hasComp(it.a)) continue; for (const g of C[it.a]) for (const x of g.items) if (x.art) (fill[x.art] = fill[x.art] || []).push(it.a); }
const TITLE_CAT = [[/отв[её]рт(?!очных головок)|Отвёртка-резец/i, 'Викрутки'], [/Г-образн/i, 'Г-подібні ключі'], [/Joker/i, 'Гайкові ключі'], [/трещотк/i, 'Тріскачки'], [/головк/i, 'Торцеві головки'], [/KNIPEX/i, 'Плоскогубці та кліщі KNIPEX'], [/молотк/i, 'Молотки'], [/напильник/i, 'Напилки PFERD']];
// the same WERA set name without «неукомплектованный / без инструментов», item count and dimensions (9821 ↔ 9721 «Ложемент набор 8000 B трещотка 3/8" Zyklop 1»)
// (word order ignored: 9823 «отвёрточных головок 3/8" Zyklop B 1» ↔ 9723 «отвёрточных головок Zyklop 3/8" B 1»)
const norm = t => t.replace(/ EAN:.*/, '').replace(/^\d+ /, '').replace(/,? ?(неукомп+лектованный|без инструментов)/gi, '').replace(/,? ?\d+ предмет\S*/g, '').replace(/,? ?\d+ мм x \d+ мм x \d+ мм/g, '').toLowerCase().split(/[,\s]+/).filter(Boolean).sort().join(' ');
const byName = {}; for (const it of I) { const t = ds(it.a); if (!isEmpty(it, t) && hasComp(it.a)) (byName[norm(t)] = byName[norm(t)] || []).push(it.a); }
const leafVals = a => { const leaf = expand(a).filter(x => !x.nonProduct);
  return { cat: CAT.filter(c => leaf.some(x => catOf(x).includes(c))), profil: [...new Set(leaf.flatMap(x => x.vals.profil || []))], pryvid: [...new Set(leaf.flatMap(x => x.vals.pryvid || []))],
    unknown: leaf.filter(x => !x.known && !x.set && !catOf(x).length && !/Ложемент/.test(x.head)).map(x => x.head.slice(0, 50)) }; };
const items = [], disputed = [];
for (const it of I) { const t = ds(it.a); const trolley = /тележк/i.test(t) || /візок/i.test(it.title); const empty = isEmpty(it, t);
  const vals = { vyd_instrumentu: [trolley ? 'Інструментальний візок' : 'Ложемент'], komplektatsiia: [empty ? 'Без інструменту' : 'З інструментом'], instrument_u_lozhementi: [], profil: [], pryvid: [] };
  let src = '', note = '';
  if (!empty) {
    if (!hasComp(it.a)) disputed.push({ a: it.a, sec: 1055, what: 'Состав', why: 'состав не найден в datasheet WERA', title: it.title });
    else { const v = leafVals(it.a); vals.instrument_u_lozhementi = v.cat; vals.profil = v.profil; vals.pryvid = v.pryvid; src = 'состав datasheet'; if (v.unknown.length) note = 'не распознано: ' + [...new Set(v.unknown)].join('; ');
      if (!v.cat.length) disputed.push({ a: it.a, sec: 1055, what: 'Інструмент у ложементі', why: 'в составе нет распознаваемого инструмента', title: it.title }); } }
  else if (!trolley) { const f = fill[it.a] || byName[norm(t)];
    if (f) { vals.instrument_u_lozhementi = [...new Set(f.flatMap(a => leafVals(a).cat))]; src = (fill[it.a] ? 'набор WERA с этим ложементом: ' : 'набор WERA с тем же названием: ') + f.join(', '); }
    else { vals.instrument_u_lozhementi = [...new Set(TITLE_CAT.filter(([r]) => r.test(t)).map(([, c]) => c))]; src = 'название datasheet WERA'; }
    vals.instrument_u_lozhementi = CAT.filter(c => vals.instrument_u_lozhementi.includes(c));
    if (!vals.instrument_u_lozhementi.length) disputed.push({ a: it.a, sec: 1055, what: 'Інструмент у ложементі', why: 'пустой ложемент: ни набора WERA с ним, ни признака в названии datasheet', title: it.title }); }
  items.push({ a: it.a, title: it.title, secs: it.secs, kind: empty ? 'empty' : 'filled', trolley, src, note, dsTitle: t.replace(/ EAN:.*/, ''), vals }); }
module.exports = {
  name: 'trolley', root: 1055, seed: '05150130001', testArticle: '05150101001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Ложемент', 'Інструментальний візок'], ru: { 'Ложемент': 'Ложемент', 'Інструментальний візок': 'Инструментальная тележка' } },
    { key: 'komplektatsiia', title: 'Комплектація', titleRu: 'Комплектация', order: 'given', values: ['З інструментом', 'Без інструменту'], ru: { 'З інструментом': 'С инструментом', 'Без інструменту': 'Без инструмента' } },
    { key: 'instrument_u_lozhementi', title: 'Інструмент у ложементі', titleRu: 'Инструмент в ложементе', order: 'given', values: CAT, ru: CAT_RU },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'pryvid', title: 'Привід', book: 389 },
  ],
  items, disputed,
  required: it => { const r = ['vyd_instrumentu', 'komplektatsiia']; if (!(it.kind === 'empty' && it.trolley)) r.push('instrument_u_lozhementi'); if (it.kind === 'filled' && it.vals.profil.length) r.push('profil'); return r; },
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Комплектація', 'Ціна', 'Інструмент у ложементі', 'Профіль', 'Привід', 'PH у складі', 'PZ у складі', 'TX у складі', 'SL у складі', 'HEX у складі', 'Квадрат у складі', 'TX BO у складі', 'PlusMinus у складі'],
};
if (require.main === module) {
  console.log('items', items.length, 'filled', items.filter(i => i.kind === 'filled').length, 'empty', items.filter(i => i.kind === 'empty').length, 'disputed', disputed.length);
  for (const i of items) console.log(i.a, i.kind, i.vals.vyd_instrumentu[0], '|', i.vals.instrument_u_lozhementi.join(', '), '|', i.vals.profil.map(p => p.split(' ')[0]).join(','), '|', i.vals.pryvid.join(','), '|', i.src.slice(0, 50), i.note ? '| ' + i.note.slice(0, 80) : '');
  console.log(disputed);
}
