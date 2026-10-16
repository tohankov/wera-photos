// Group definition «Динамометричний інструмент» (1195) for cat/import_group.js.
const { out, disputed, BUCKETS } = require('./dyn.js');
const VYD_NEW = ['Динамометричний ключ', 'Динамометрична викрутка', 'Індикатор крутного моменту', 'Набір з динамометричним інструментом', 'Змінна насадка', 'Ручка-вороток', 'Ремкомплект / запчастина'];
const VYD_RU = { 'Динамометричний ключ': 'Динамометрический ключ', 'Динамометрична викрутка': 'Динамометрическая отвёртка', 'Індикатор крутного моменту': 'Индикатор крутящего момента', 'Набір з динамометричним інструментом': 'Набор с динамометрическим инструментом', 'Змінна насадка': 'Сменная насадка', 'Ручка-вороток': 'Рукоятка-вороток', 'Ремкомплект / запчастина': 'Ремкомплект / запчасть' };
const DRV_NEW = ['квадрат 3/4″', '9×12 мм (змінні насадки)', '14×18 мм (змінні насадки)', 'Halfmoon / HIOS 4 мм', 'Kraftform Kompakt VDE (вставки)'];
const DRV_RU = { '9×12 мм (змінні насадки)': '9×12 мм (сменные насадки)', '14×18 мм (змінні насадки)': '14×18 мм (сменные насадки)' };
const SET = ['Регульований', 'Встановлений (фіксований)'], SET_RU = { 'Регульований': 'Регулируемый', 'Встановлений (фіксований)': 'Установленный (фиксированный)' };
const NAS = ['Ріжковий ключ', 'Ріжковий ключ Joker (самоналаштування)', 'Накидний ключ', 'Накидний ключ з прорізом', 'TORX®', 'З квадратом', 'Тріскачка з квадратом', 'Адаптер', 'Для зварювання'];
const NAS_RU = { 'Ріжковий ключ': 'Рожковый ключ', 'Ріжковий ключ Joker (самоналаштування)': 'Рожковый ключ Joker (самонастройка)', 'Накидний ключ': 'Накидной ключ', 'Накидний ключ з прорізом': 'Накидной ключ с прорезью', 'З квадратом': 'С квадратом', 'Тріскачка з квадратом': 'Трещотка с квадратом', 'Для зварювання': 'Для сварки' };
const FEAT = ['ESD', 'VDE (ізольований)', 'Тріскачка з реверсом', 'Для правої та лівої різьби', 'Функція Torque Lock', 'Шкала в дюйм-фунтах (in·lb)', 'Пістолетна ручка', 'Т-подібна ручка'];
const FEAT_RU = { 'VDE (ізольований)': 'VDE (изолированный)', 'Тріскачка з реверсом': 'Трещотка с реверсом', 'Для правої та лівої різьби': 'Для правой и левой резьбы', 'Функція Torque Lock': 'Функция Torque Lock', 'Пістолетна ручка': 'Пистолетная рукоятка', 'Т-подібна ручка': 'Т-образная рукоятка' };
const TQ = BUCKETS.map(b => b[0]), TQ_RU = { 'понад 400 Н·м': 'свыше 400 Н·м' };
// insert sizes: mm, then ranges, then TORX — by number
const nk = v => { const m = v.match(/^(\d+)(?:–(\d+))? мм$/); if (m) return (m[2] ? 1000 : 0) + +m[1]; const t = v.match(/^TX (\d+)$/); return t ? 2000 + +t[1] : 9999; };
const NSIZE = [...new Set(out.flatMap(v => v.nsize))].sort((a, b) => nk(a) - nk(b));
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, kind: v.kind, sec: v.sec, vals: { vyd_instrumentu: v.vyd, diapazon_momentu: v.torque, nalashtuvannia_momentu: v.set, pryvid: v.drv, typ_nasadky: v.nas, rozmir_nasadky: v.nsize, profil: v.profile, rozmir_nakonechnyka: v.tip, osoblyvosti_dynamometra: v.feat } }));
// non-products inside a product section get all values of that section (CLAUDE.md filters rule)
for (const it of items.filter(i => !i.kind && i.vals.vyd_instrumentu[0] === 'Приладдя')) { const peers = items.filter(p => p.kind && p.secs[0] === it.secs[0]);
  for (const k of ['diapazon_momentu', 'nalashtuvannia_momentu', 'pryvid']) it.vals[k] = [...new Set(peers.flatMap(p => p.vals[k]))]; }
module.exports = {
  name: 'dyn', root: 1195, seed: '05027935001', testArticle: '05006605001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', book: 388, newValues: VYD_NEW, ru: VYD_RU },
    { key: 'diapazon_momentu', title: 'Діапазон моменту', titleRu: 'Диапазон момента', order: 'given', values: TQ, ru: TQ_RU },
    { key: 'nalashtuvannia_momentu', title: 'Налаштування моменту', titleRu: 'Настройка момента', order: 'given', values: SET, ru: SET_RU },
    { key: 'pryvid', title: 'Привід', book: 389, newValues: DRV_NEW, ru: DRV_RU },
    { key: 'typ_nasadky', title: 'Тип насадки', titleRu: 'Тип насадки', order: 'given', values: NAS, ru: NAS_RU },
    { key: 'rozmir_nasadky', title: 'Розмір насадки', titleRu: 'Размер насадки', order: 'given', values: NSIZE },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir_nakonechnyka', title: 'Розмір наконечника', book: 392 },
    { key: 'osoblyvosti_dynamometra', title: 'Особливості динамометра', titleRu: 'Особенности динамометра', order: 'given', values: FEAT, ru: FEAT_RU },
  ],
  items, disputed,
  required: it => { const r = ['vyd_instrumentu']; if (it.kind === 'ind') r.push('diapazon_momentu', 'nalashtuvannia_momentu', 'profil', 'rozmir_nakonechnyka');
    if (it.kind === 'key' || it.kind === 'drv') r.push('diapazon_momentu', 'nalashtuvannia_momentu', 'pryvid');
    if (it.kind === 'nas') { r.push('typ_nasadky', 'pryvid'); if (it.sec >= 1210 && it.sec <= 1217) r.push('rozmir_nasadky'); } return r; },
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Діапазон моменту', 'Налаштування моменту', 'Привід', 'Тип насадки', 'Розмір насадки', 'Профіль', 'Розмір наконечника', 'Особливості динамометра'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
