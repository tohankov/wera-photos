// Group definition «Бітотримачі» (1081) for cat/import_group.js.
const { out, disputed } = require('./rest3.js').holders();
const FEAT = ['З магнітом', 'Без магніту', 'Магнітне кільце', 'Пружинне стопорне кільце', 'Патрон Rapidaptor', 'BiTorsion', 'Ударний (Impaktor)', 'Нержавіюча сталь', 'Для біт Halfmoon / HIOS', 'Муфта вільного ходу', 'Регульована глибина загвинчування'];
const FEAT_RU = { 'З магнітом': 'С магнитом', 'Без магніту': 'Без магнита', 'Магнітне кільце': 'Магнитное кольцо', 'Пружинне стопорне кільце': 'Пружинное стопорное кольцо', 'Ударний (Impaktor)': 'Ударный (Impaktor)', 'Нержавіюча сталь': 'Нержавеющая сталь', 'Для біт Halfmoon / HIOS': 'Для бит Halfmoon / HIOS', 'Муфта вільного ходу': 'Муфта свободного хода', 'Регульована глибина загвинчування': 'Регулируемая глубина завинчивания' };
module.exports = {
  name: 'holders', root: 1081, seed: '05057676001', testArticle: '05145100001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Бітотримач'], ru: { 'Бітотримач': 'Битодержатель' } },
    { key: 'dovzhyna_bitotrymacha', title: 'Довжина бітотримача', titleRu: 'Длина битодержателя', order: 'asc' },
    { key: 'osoblyvosti_bitotrymacha', title: 'Особливості бітотримача', titleRu: 'Особенности битодержателя', order: 'given', values: FEAT, ru: FEAT_RU },
  ],
  items: out, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'dovzhyna_bitotrymacha'] : ['vyd_instrumentu'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Довжина бітотримача', 'Особливості бітотримача'],
};
