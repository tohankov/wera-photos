// Group definition «Перехідники та адаптери» (1089) for cat/import_group.js.
const { out, disputed } = require('./rest3.js').adapters();
const CON = ['квадрат 1/4″', 'квадрат 3/8″', 'квадрат 1/2″', 'шестигранник 1/4″', 'шестигранник 5/16″', 'шестигранник 7/16″', 'SDS plus'];
module.exports = {
  name: 'adapters', root: 1089, seed: '05050650001', testArticle: '05003590001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: ['Перехідник', 'Оправка-хвостовик', 'Набір перехідників'], ru: { 'Перехідник': 'Переходник', 'Набір перехідників': 'Набор переходников' } },
    { key: 'pryiednannia_do_instrumenta', title: 'Приєднання до інструмента', titleRu: 'Присоединение к инструменту', order: 'given', values: CON },
    { key: 'pryiednannia_nasadky', title: 'Приєднання насадки', titleRu: 'Присоединение насадки', order: 'given', values: CON },
  ],
  items: out, disputed,
  required: () => ['vyd_instrumentu', 'pryiednannia_do_instrumenta', 'pryiednannia_nasadky'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Приєднання до інструмента', 'Приєднання насадки'],
};
