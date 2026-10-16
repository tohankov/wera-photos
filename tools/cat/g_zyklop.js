// Group definition «Тріскачки та приладдя Zyklop» (1270) for cat/import_group.js.
const { out, disputed, VYD_RU, DRV_RU } = require('./zyklop.js');
const VYD_ORDER = ['Торцева головка', 'Торцева головка подовжена', 'Торцева головка з фіксуючою функцією', 'Торцева головка ударна Impaktor', 'Торцева головка ударна Impaktor подовжена', 'Викруткова головка', 'Тріскачка', 'Набір з тріскачкою', 'Набір головок', 'Приладдя'];
const DRV_ORDER = ['квадрат 1/4″', 'квадрат 3/8″', 'квадрат 1/2″', 'шестигранник 1/4″', 'Zyklop Mini 2 (пряме приєднання головок)'];
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: {
  vyd_instrumentu: [].concat(v.vyd || []), pryvid: v.drv, profil: v.profile ? [v.profile] : [], rozmir_holovky: v.size[0] ? [v.size[0]] : [], dovzhyna_holovky: v.len[0] ? [v.len[0]] : [] } }));
module.exports = {
  name: 'zyklop', root: 1270, seed: '05003365001', testArticle: '05049002001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', titleRu: 'Вид инструмента', order: 'given', values: VYD_ORDER, ru: VYD_RU, book: 388, newValues: VYD_ORDER }, // shared with other groups since 16.10 (created by this group)
    { key: 'pryvid', title: 'Привід', titleRu: 'Привод', order: 'given', values: DRV_ORDER, ru: DRV_RU },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir_holovky', title: 'Розмір головки', titleRu: 'Размер головки', order: 'asc' },
    { key: 'dovzhyna_holovky', title: 'Довжина головки', titleRu: 'Длина головки', order: 'asc' },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'pryvid', 'profil', 'rozmir_holovky', 'dovzhyna_holovky'] : ['vyd_instrumentu', 'pryvid'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Привід', 'Профіль', 'Розмір головки', 'Довжина головки'],
};
