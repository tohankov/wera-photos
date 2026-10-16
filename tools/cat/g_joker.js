// Group definition «Гайкові ключі Joker» (1185) for cat/import_group.js.
const { out, disputed } = require('./joker.js');
const VYD_NEW = ['Комбінований ключ', 'Двосторонній ріжковий ключ'], VYD_RU = { 'Комбінований ключ': 'Комбинированный ключ', 'Двосторонній ріжковий ключ': 'Двусторонний рожковый ключ' };
const SYS = ['Метрична', 'Дюймова'], SYS_RU = { 'Метрична': 'Метрическая', 'Дюймова': 'Дюймовая' };
const FEAT = ['З тріскачкою', 'З реверсною тріскачкою (Switch)', 'Подовжений', 'Самоналаштування', 'VDE (ізольований)', 'З магнітним тримачем', 'Black Edition'];
const FEAT_RU = { 'З тріскачкою': 'С трещоткой', 'З реверсною тріскачкою (Switch)': 'С реверсной трещоткой (Switch)', 'Подовжений': 'Удлинённый', 'Самоналаштування': 'Самонастройка', 'VDE (ізольований)': 'VDE (изолированный)', 'З магнітним тримачем': 'С магнитным держателем' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: { vyd_instrumentu: v.vyd, rozmir_pid_kliuch: v.size, systema_rozmiriv: v.sys, osoblyvosti_haikovoho_kliucha: v.feat } }));
module.exports = {
  name: 'joker', root: 1185, seed: '05020313001', testArticle: '05020153001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: VYD_NEW, ru: VYD_RU },
    { key: 'rozmir_pid_kliuch', title: 'Розмір під ключ', titleRu: 'Размер под ключ', order: 'asc' },
    { key: 'systema_rozmiriv', title: 'Система розмірів', titleRu: 'Система размеров', order: 'given', values: SYS, ru: SYS_RU },
    { key: 'osoblyvosti_haikovoho_kliucha', title: 'Особливості гайкового ключа', titleRu: 'Особенности гаечного ключа', order: 'given', values: FEAT, ru: FEAT_RU },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'rozmir_pid_kliuch', 'systema_rozmiriv'] : ['vyd_instrumentu', 'systema_rozmiriv'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Розмір під ключ', 'Система розмірів', 'Особливості гайкового ключа'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
