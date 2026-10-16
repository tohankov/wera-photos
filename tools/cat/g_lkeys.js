// Group definition «Г-подібні ключі» (1152) for cat/import_group.js.
const { out, disputed } = require('./lkeys.js');
const LEN = ['Стандартний', 'Подовжений', 'Короткий'], LEN_RU = { 'Стандартний': 'Стандартный', 'Подовжений': 'Удлинённый', 'Короткий': 'Короткий' };
const COAT = ['Multicolour (кольорове кодування)', 'BlackLaser', 'Хромоване', 'Нержавіюча сталь', 'Цинкове фосфатування'], COAT_RU = { 'Multicolour (кольорове кодування)': 'Multicolour (цветовая кодировка)', 'Хромоване': 'Хромированное', 'Нержавіюча сталь': 'Нержавеющая сталь', 'Цинкове фосфатування': 'Цинковое фосфатирование' };
const FEAT = ['Профіль Hex-Plus', 'Кулькова головка', 'З фіксуючою функцією (HF)', 'З магнітом'], FEAT_RU = { 'Профіль Hex-Plus': 'Профиль Hex-Plus', 'Кулькова головка': 'Шаровая головка', 'З фіксуючою функцією (HF)': 'С фиксирующей функцией (HF)', 'З магнітом': 'С магнитом' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: { vyd_instrumentu: v.vyd, profil: v.profile, rozmir_kliucha: v.size, dovzhyna_kliucha: v.len, pokryttia: v.coat, osoblyvosti_kliucha: v.feat } }));
module.exports = {
  name: 'lkeys', root: 1152, seed: (items.find(i => i.kind && i.vals.pokryttia.length && i.vals.osoblyvosti_kliucha.length) || items[0]).a, testArticle: '05049003001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Г-подібний ключ', 'Набір Г-подібних ключів'], ru: { 'Г-подібний ключ': 'Г-образный ключ', 'Набір Г-подібних ключів': 'Набор Г-образных ключей' } },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir_kliucha', title: 'Розмір ключа', titleRu: 'Размер ключа', order: 'asc' },
    { key: 'dovzhyna_kliucha', title: 'Довжина ключа', titleRu: 'Длина ключа', order: 'given', values: LEN, ru: LEN_RU },
    { key: 'pokryttia', title: 'Покриття', titleRu: 'Покрытие', order: 'given', values: COAT, ru: COAT_RU },
    { key: 'osoblyvosti_kliucha', title: 'Особливості ключа', titleRu: 'Особенности ключа', order: 'given', values: FEAT, ru: FEAT_RU },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'profil', 'rozmir_kliucha', 'dovzhyna_kliucha'] : ['vyd_instrumentu', 'profil'],
  filterOrder: ['Хіти продажів', 'Профіль', 'Ціна', 'Розмір ключа', 'Довжина ключа', 'Покриття', 'Особливості ключа', 'Вид інструменту'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
