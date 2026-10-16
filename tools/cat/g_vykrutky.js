// Group definition «Викрутки» (1098) for cat/import_group.js.
const { out, disputed } = require('./vykrutky.js');
const FEAT = ['З фіксуючою функцією (HF)', 'Шестигранний стрижень', 'Допоміжний шестигранник', 'Кулькова головка', 'Коротка (Stubby)', 'Наконечник Lasertip', 'Порожнистий стрижень'];
const FEAT_RU = { 'З фіксуючою функцією (HF)': 'С фиксирующей функцией (HF)', 'Шестигранний стрижень': 'Шестигранный стержень', 'Допоміжний шестигранник': 'Вспомогательный шестигранник', 'Кулькова головка': 'Шаровая головка', 'Коротка (Stubby)': 'Короткая (Stubby)', 'Наконечник Lasertip': 'Наконечник Lasertip', 'Порожнистий стрижень': 'Полый стержень' };
const VYD_RU = { 'Викрутка': 'Отвёртка', 'Набір викруток': 'Набор отвёрток', 'Ручка-тримач': 'Ручка-держатель', 'Приладдя для викруток': 'Принадлежности для отвёрток' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: { vyd_instrumentu: v.vyd, profil: v.profile, rozmir_nakonechnyka: v.size, dovzhyna_stryzhnia: v.len, osoblyvosti_vykrutky: v.feat } }));
module.exports = {
  name: 'vykrutky', root: 1098, seed: (items.find(i => i.vals.osoblyvosti_vykrutky.length && i.vals.rozmir_nakonechnyka.length && i.vals.dovzhyna_stryzhnia.length) || items[0]).a, testArticle: '05051278001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Викрутка', 'Набір викруток', 'Ручка-тримач', 'Приладдя для викруток'], ru: VYD_RU },
    { key: 'profil', title: 'Профіль', book: 382, newValues: ['Pentalobe'], ru: {} },
    { key: 'rozmir_nakonechnyka', title: 'Розмір наконечника', titleRu: 'Размер наконечника', order: 'asc' },
    { key: 'dovzhyna_stryzhnia', title: 'Довжина стрижня', titleRu: 'Длина стержня', order: 'asc' },
    { key: 'osoblyvosti_vykrutky', title: 'Особливості викрутки', titleRu: 'Особенности отвёртки', order: 'given', values: FEAT, ru: FEAT_RU },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'dovzhyna_stryzhnia'] : ['vyd_instrumentu'],
  filterOrder: ['Хіти продажів', 'Профіль', 'Ціна', 'Розмір наконечника', 'Довжина стрижня', 'Особливості викрутки', 'Вид інструменту'],
};
