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
    { key: 'rozmir_nakonechnyka', title: 'Профіль і розмір', book: 392 },
    { key: 'dovzhyna_robochoho_kintsia', title: 'Довжина робочого кінця', titleRu: 'Длина рабочего конца', order: 'asc' },
    { key: 'pryvid', title: 'Привід', book: 389 },
    { key: 'osoblyvosti_vykrutky', title: 'Особливості викрутки', book: 394, newValues: ['Звужений робочий кінець'], ru: { 'Звужений робочий кінець': 'Зауженный рабочий конец' } },
  ],
  items, disputed,
  required: it => { const r = ['vyd_instrumentu']; if (it.kind) r.push('profil', (it.vals.rozmir_nakonechnyka || []).length || it.tip ? 'rozmir_nakonechnyka' : 'rozmir_robochoho_kintsia'); if (it.kind === 'blade') r.push('dovzhyna_robochoho_kintsia'); if (it.isZyk) r.push('pryvid'); return r; },
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Профіль', 'Профіль і розмір', 'Розмір робочого кінця', 'Довжина робочого кінця', 'Привід', 'Особливості викрутки'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
// profile corrections from the WERA composition (cat/pr_size.js PROFIL_FIX, 19.10.2026)
require('./pr_size.js').fixProfiles(module.exports.items);
// night 20.10.2026 (owner): screw-tip products (Викрутка, Змінна вставка) carry «Профіль і розмір» (392, format A, cat/pr_size.js tipValues) instead of «Розмір робочого кінця»;
// written by cat/night_vde.js + night_write.js. Runs after sets_fill, so sets keep their «Розмір робочого кінця» from the components. Cabinet keys (no format A) keep 399.
// sets_fill above unions every char of the components into a set — «Профіль і розмір» of a VDE set is not this group's (sets: «… у складі»), so it is emptied here (shared char: the group keeps other groups' values)
// sets (night_vde2.js): «Профіль і розмір» = the sizes of their «… у складі» (pr_size skladValues: what is written, else the WERA composition; TX BO -> TX),
// «Розмір робочого кінця» cleared only when every size is covered (socket / cabinet sizes keep it)
const SKK = ['sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus']; const D392 = require('./pr_size_values.json').dict.rozmir_nakonechnyka;
const num = s => { const m = String(s).replace(/\u00a0/g, '').replace(/ мм$/, '').trim().replace(',', '.'); return /^\d+(\.\d+)?$/.test(m) ? String(parseFloat(m)) : m; };
const sizeOf = x => num(x.replace(/^(PH\/S|PZ\/S|PH|PZ|TX|IP|IPR|HEX|Квадрат|Торцева|TRI-WING®) #?/, '').replace(/^SL [\d,]+×/, ''));
{ const P = require('./pr_size.js'); for (const it of module.exports.items) { if (!(it.vals.vyd_instrumentu || []).some(x => x === 'Викрутка' || x === 'Змінна вставка')) { it.vals.rozmir_nakonechnyka = [];
      const uni = new Set(SKK.flatMap(k => (P.SNAP && P.SNAP.values[k] && P.SNAP.values[k][it.a]) || []).filter(x => !/не вказано/.test(x)).map(x => x.replace(/^TX BO /, 'TX ')));
      if (uni.size && [...uni].every(x => D392.includes(x))) { it.vals.rozmir_nakonechnyka = D392.filter(x => uni.has(x)); const cov = new Set(it.vals.rozmir_nakonechnyka.map(sizeOf));
        if ((it.vals.rozmir_robochoho_kintsia || []).every(x => cov.has(num(x)))) it.vals.rozmir_robochoho_kintsia = []; }
      continue; }
    const r = P.tipValues(it.a, it.vals.profil || [], it.vals.rozmir_robochoho_kintsia || []); if (r.length) { it.vals.rozmir_nakonechnyka = r; it.vals.rozmir_robochoho_kintsia = []; it.tip = true; } } }
