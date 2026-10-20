// Group definition «Викрутки» (1098) for cat/import_group.js.
const { out, disputed } = require('./vykrutky.js');
const P = require('./pr_size.js'); const SNAP = P.SNAP || {};
// «З отвором (TX BO)» (19.10.2026): a TX BO screwdriver has profile TX, the hole is a feature
const FEAT = ['З фіксуючою функцією (HF)', 'Шестигранний стрижень', 'Допоміжний шестигранник', 'Кулькова головка', 'Коротка (Stubby)', 'Наконечник Lasertip', 'Порожнистий стрижень', P.BOFEAT];
const FEAT_RU = { [P.BOFEAT]: 'С отверстием (TX BO)','З фіксуючою функцією (HF)': 'С фиксирующей функцией (HF)', 'Шестигранний стрижень': 'Шестигранный стержень', 'Допоміжний шестигранник': 'Вспомогательный шестигранник', 'Кулькова головка': 'Шаровая головка', 'Коротка (Stubby)': 'Короткая (Stubby)', 'Наконечник Lasertip': 'Наконечник Lasertip', 'Порожнистий стрижень': 'Полый стержень' };
const VYD_RU = { 'Викрутка': 'Отвёртка', 'Набір викруток': 'Набор отвёрток', 'Ручка-тримач': 'Ручка-держатель', 'Приладдя': 'Принадлежности', 'Викрутка з набором біт': 'Отвёртка с набором бит', 'Підставка / тримач': 'Подставка / держатель', 'Знімач': 'Съёмник' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: { vyd_instrumentu: v.vyd, profil: v.profile, rozmir_nakonechnyka: v.size, dovzhyna_stryzhnia: v.len, osoblyvosti_vykrutky: v.feat } }));
module.exports = {
  name: 'vykrutky', root: 1098, seed: (items.find(i => i.vals.osoblyvosti_vykrutky.length && i.vals.rozmir_nakonechnyka.length && i.vals.dovzhyna_stryzhnia.length) || items[0]).a, testArticle: '05051278001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Викрутка', 'Набір викруток', 'Ручка-тримач', 'Приладдя', 'Викрутка з набором біт', 'Підставка / тримач', 'Знімач'], ru: VYD_RU },
    { key: 'profil', title: 'Профіль', book: 382, newValues: ['Pentalobe'], ru: {} },
    // «Профіль і розмір» («PH 2», «SL 1,0×5,5»; renamed from «Розмір наконечника» 19.10.2026): dictionary order as written (cat/pr_size_values.json)
    { key: 'rozmir_nakonechnyka', title: 'Профіль і розмір', titleRu: 'Профиль и размер', order: 'given', values: (SNAP.dict || {}).rozmir_nakonechnyka || [], ru: SNAP.ru || {} },
    { key: 'dovzhyna_stryzhnia', title: 'Довжина стрижня', titleRu: 'Длина стержня', order: 'asc' },
    // book 394 (22.10.2026): a union with the values written outside the generator (magnet / ring feat_1020, ESD / stainless d1021, tester vyd_1022) — never dropped by a rerun
    { key: 'osoblyvosti_vykrutky', title: 'Особливості викрутки', titleRu: 'Особенности отвёртки', book: 394, order: 'given', values: FEAT, newValues: [...FEAT, 'З індикатором напруги'], ru: { ...FEAT_RU, 'З індикатором напруги': 'С индикатором напряжения' } },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'dovzhyna_stryzhnia'] : ['vyd_instrumentu'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Профіль', 'Профіль і розмір', 'Довжина стрижня', 'Особливості викрутки'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
// «Профіль і розмір» from the written values / the WERA composition; TX BO -> TX + «З отвором (TX BO)»; profile corrections (cat/pr_size.js, 19.10.2026)
P.finishGroup(module.exports.items, { bo: true });
// owner 22.10.2026: «Довжина стрижня» is the blade length of a screwdriver only — a «Викрутка з набором біт» does not get it (the 25 мм of 21.10 on
// 05057471001 / 05135942001 removed); kinds of the three groups by the WERA composition — cat/vyd_comp.js finishKinds (cat/vyd_final.json)
require('./vyd_comp.js').finishKinds(module.exports.items);
