// Group definition «Kraftform Kompakt» (1057) for cat/import_group.js.
const { out, disputed } = require('./kk.js');
const VYD_NEW = ['Змінний робочий кінець Vario', 'Ударно-поворотна викрутка', 'Набір інструментів'], VYD_RU = { 'Змінний робочий кінець Vario': 'Сменный рабочий конец Vario', 'Ударно-поворотна викрутка': 'Ударно-поворотная отвёртка', 'Набір інструментів': 'Набор инструментов' };
const FEAT_NEW = ['З тріскачкою', 'Магазин біт у ручці', 'Патрон Rapidaptor', 'ESD', 'Нержавіюча сталь', 'Дюймовий (Imperial)', 'Гнучкий стрижень', 'З магнітом'];
const FEAT_RU = { 'З тріскачкою': 'С трещоткой', 'Магазин біт у ручці': 'Магазин бит в рукоятке', 'Патрон Rapidaptor': 'Патрон Rapidaptor', 'Нержавіюча сталь': 'Нержавеющая сталь', 'Дюймовий (Imperial)': 'Дюймовый (Imperial)', 'Гнучкий стрижень': 'Гибкий стержень', 'З магнітом': 'С магнитом' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, vals: { vyd_instrumentu: v.vyd[0] === 'Ударно-поворотна викрутка' && /набором/i.test(v.title) ? ['Ударно-поворотна викрутка', 'Набір інструментів'] : v.vyd, profil: v.profile, rozmir_nakonechnyka: v.size, osoblyvosti_vykrutky: v.feat } }));
module.exports = {
  name: 'kk', root: 1057, seed: '05002970001', testArticle: '05051278001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: VYD_NEW, ru: VYD_RU },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir_nakonechnyka', title: 'Розмір наконечника', book: 392 },
    { key: 'osoblyvosti_vykrutky', title: 'Особливості викрутки', book: 394, newValues: FEAT_NEW, ru: FEAT_RU },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka'] : ['vyd_instrumentu'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Профіль', 'Розмір наконечника', 'Особливості викрутки'],
};
