// Group definition «Діелектричні інструменти» (1224) for cat/import_group.js.
const { out, disputed } = require('./vde.js');
const VYD_NEW = ['Викрутка', 'Змінна вставка', 'Набір викруток', 'Ручка-тримач', 'Торцева головка', 'Викруткова головка', 'Тріскачка', 'Набір головок', 'Приладдя', 'Ріжковий ключ', 'Набір ключів', 'Індикатор напруги'];
const VYD_RU = { 'Змінна вставка': 'Сменная вставка', 'Ріжковий ключ': 'Рожковый ключ', 'Набір ключів': 'Набор ключей', 'Індикатор напруги': 'Индикатор напряжения' };
const PROF_NEW = ['Внутрішній квадрат (шафовий)', 'Тригранник (шафовий)', 'Подвійна борідка (шафова)'], PROF_RU = { 'Внутрішній квадрат (шафовий)': 'Внутренний квадрат (шкафной)', 'Тригранник (шафовий)': 'Трёхгранник (шкафной)', 'Подвійна борідка (шафова)': 'Двойная бородка (шкафная)' };
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, isZyk: v.drv.length > 0, vals: { vyd_instrumentu: v.vyd, profil: v.profile, rozmir_robochoho_kintsia: v.size, dovzhyna_robochoho_kintsia: v.len, pryvid: v.drv, osoblyvosti_vykrutky: v.feat } }));
module.exports = {
  name: 'vde', root: 1224, seed: (items.find(i => i.kind === 'blade' && i.vals.rozmir_robochoho_kintsia.length && i.vals.dovzhyna_robochoho_kintsia.length) || items[0]).a, testArticle: '05003982001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: VYD_NEW, ru: VYD_RU },
    { key: 'profil', title: 'Профіль', book: 382, newValues: PROF_NEW, ru: PROF_RU },
    { key: 'rozmir_robochoho_kintsia', title: 'Розмір робочого кінця', titleRu: 'Размер рабочего конца', order: 'asc' },
    { key: 'dovzhyna_robochoho_kintsia', title: 'Довжина робочого кінця', titleRu: 'Длина рабочего конца', order: 'asc' },
    { key: 'pryvid', title: 'Привід', book: 389 },
    { key: 'osoblyvosti_vykrutky', title: 'Особливості викрутки', book: 394, newValues: ['Звужений робочий кінець'], ru: { 'Звужений робочий кінець': 'Зауженный рабочий конец' } },
  ],
  items, disputed,
  required: it => { const r = ['vyd_instrumentu']; if (it.kind) r.push('profil', 'rozmir_robochoho_kintsia'); if (it.kind === 'blade') r.push('dovzhyna_robochoho_kintsia'); if (it.isZyk) r.push('pryvid'); return r; },
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Профіль', 'Розмір робочого кінця', 'Довжина робочого кінця', 'Привід', 'Особливості викрутки'],
};
