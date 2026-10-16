// Owner's admin checklist for catalog filters -> inventory/filters_admin_checklist.xlsx (sheets: Фильтры, Характеристики страницы товара, Проверить на сайте, Спорные)
// and the 1055 preview -> inventory/filters_1055_preview.xlsx. Offline (cat/sec_urls.json for section URLs). node cat/checklist_xlsx.js
const X = require('xlsx'), fs = require('fs'), path = require('path'); const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const T = require('../sections/tree_now.json'); const name = id => ((T.find(t => t.id === +id) || {}).title || {}).ua || ''; const U = require('./sec_urls.json');
const live = Object.fromEntries(require('../audit_cache/live.json').map(p => [p.article, p]));
const url = id => U[id] || ''; const G = g => require(`./g_${g}.js`); const SK = G('sklad'); const SKC = SK.chars; // «… у складі»
const LINKS = { bits: ['Профіль', 'Розмір', 'Довжина'], zyklop: ['Вид інструменту', 'Розмір головки'], vykrutky: ['Профіль', 'Розмір наконечника'], lkeys: ['Профіль', 'Розмір ключа'], vde: ['Профіль', 'Розмір робочого кінця'],
  dyn: ['Діапазон моменту', 'Привід'], joker: ['Розмір під ключ'], kk: ['Профіль'], holders: ['Особливості бітотримача'], adapters: ['Приєднання до інструмента', 'Приєднання насадки'], drills: ['Діаметр свердла', 'Різьба'],
  bitsets: ['Профіль', 'Розмір'], trolley: ['Інструмент у ложементі'] };
const ROOTS = [['bits', 1062, 'Біти (+1459 Мікробіти, 1078 Торцеві головки — наследуют)'], ['zyklop', 1270], ['vykrutky', 1098], ['lkeys', 1152], ['vde', 1224], ['dyn', 1195], ['joker', 1185], ['kk', 1057], ['holders', 1081], ['adapters', 1089], ['drills', 1090], ['bitsets', 1082], ['trolley', 1055]];
const BITS_ORDER = ['Хіти продажів', 'Профіль', 'Ціна', 'Розмір', 'Довжина', 'Тип біти', 'Хвостовик', 'Особливості'];
const order = g => g === 'bits' ? BITS_ORDER : G(g).filterOrder.filter(f => !SKC.some(c => c.title === f));
// set sections that get «… у складі»: mostly sets, at least two different profiles among their sets (1082 — on the root, its subsections inherit)
const SETSEC = [[1055, 'trolley'], [1082, 'bitsets'], [1059, 'kk'], [1105, 'vykrutky'], [1115, 'vykrutky'], [1123, 'vykrutky'], [1129, 'vykrutky'], [1137, 'vykrutky'], [1146, 'vykrutky'], [1208, 'dyn'],
  [1230, 'vde'], [1239, 'vde'], [1246, 'vde'], [1271, 'zyklop'], [1274, 'zyklop'], [1282, 'zyklop'], [1295, 'zyklop'], [1307, 'zyklop']];
const sub = id => [id, ...T.filter(c => c.parent == id).flatMap(c => sub(c.id))];
const inSec = id => { const s = new Set(sub(id)); return SK.items.filter(i => i.secs.some(x => s.has(x))); };
const skladIn = id => SKC.filter(c => inSec(id).some(i => i.vals[c.key].length));
const both = (id, a, b) => inSec(id).filter(i => i.vals[a].length && i.vals[b].length).length; const one = (id, a) => inSec(id).filter(i => i.vals[a].length).length;
const withSklad = (g, id) => { const o = order(g), sk = skladIn(id).map(c => c.title); const i = o.indexOf('Профіль'); return i < 0 ? [...o.slice(0, 3), ...sk, ...o.slice(3)] : [...o.slice(0, i), ...sk, ...o.slice(i + 1)]; };
// --- sheet 1: filters
const F = [];
for (const [g, id, label] of ROOTS) { const set = SETSEC.find(s => s[0] === id);
  F.push({ 'Раздел': `${id} ${label || name(id)}`, 'URL': url(id), 'Где': id === 1062 ? 'уже настроено владельцем — не менять' : 'на разделе группы; подразделы наследуют (свой список у подраздела пустой)', 'Фильтры по порядку': (set ? withSklad(g, id) : order(g)).join(' → '),
    'Характеристики со ссылкой на фильтр': LINKS[g].filter(x => !(set && x === 'Профіль')).join(', '), 'Примечание': g === 'vykrutky' ? '«Вид інструменту» перенесён на 2-е место (п. 7)' : set ? '«Профіль» заменён фильтрами «… у складі» (логика И): все товары раздела — наборы' : '' }); }
for (const [id, g] of SETSEC.filter(s => !ROOTS.some(r => r[1] === s[0]))) F.push({ 'Раздел': `${id} ${name(id)} (подраздел наборов группы ${ROOTS.find(r => r[0] === g)[1]})`, 'URL': url(id), 'Где': 'СВОЙ список фильтров на этом подразделе (заполненный список подраздела заменяет родительский — поэтому список полный)',
  'Фильтры по порядку': withSklad(g, id).join(' → '), 'Характеристики со ссылкой на фильтр': LINKS[g].filter(x => x !== 'Профіль').join(', ') || '—', 'Примечание': '«Профіль» заменён фильтрами «… у складі»: отметил PH у складі + PZ у складі → только наборы, где есть оба' });
F.push({ 'Раздел': 'Оформление (все разделы)', 'URL': '', 'Где': 'Дизайн фильтра', 'Фильтры по порядку': 'вертикальный, размер M, сворачивание включено, по умолчанию развёрнуты ВСЕ группы, максимум 10 значений + «Показать еще»', 'Характеристики со ссылкой на фильтр': '', 'Примечание': '' });
F.push({ 'Раздел': 'Ссылки на фильтр не выводятся (п. 6)', 'URL': url(1080), 'Где': 'Сайт → Страницы → раздел',
  'Фильтры по порядку': 'Причина: ссылка строится в ОСНОВНОМ разделе товара (у бит — 1079, 1080 …, не 1062), а у этих подразделов списки пустые и только наследуются от 1062. Ссылки механизм темы выводит (на странице товаров 1055 «Бренд» уже ссылка — там список задан прямо на разделе). ' +
    'Сделать: 1) на подразделе 1080 «Хрестові біти Pozidriv» прямо заполнить: Фильтры (как у 1062), «Характеристики для страницы товара» (Профіль, Розмір, Довжина, Тип біти, Хвостовик, Особливості) и «Характеристики со ссылкой на фильтр» (Профіль, Розмір, Довжина); сохранить. 2) Открыть bity-pz0x25-mm-wera-05056805001 — «PZ (Pozidriv)» и «25 мм» должны стать ссылками. 3) Если стали — повторить на остальных подразделах бит (и так же в других группах для их основных подразделов); если нет — написать в поддержку Хорошопа (условия из справки: тип характеристики «список», фильтр включён).',
  'Характеристики со ссылкой на фильтр': '', 'Примечание': 'Индексация («Маркетинг → SEO → Фильтры для индексации», сейчас 0 записей) нужна только поисковикам, на вывод ссылок для покупателя не влияет (справка Хорошопа)' });
// --- sheet 2: product page characteristics
const P = []; const titles = g => G(g).chars.map(c => c.title);
for (const [g, id] of ROOTS.filter(r => SETSEC.some(s => s[1] === r[0]) || ['zyklop', 'lkeys', 'vykrutky', 'vde', 'dyn', 'kk'].includes(r[0]))) {
  P.push({ 'Раздел': `${id} ${name(id)}`, 'URL': url(id), 'Поставить в «Характеристики для страницы товара»': [...new Set(titles(g))].join(', ') + ' (+ «Бренд», если нужен)', 'Убрать / не ставить': SKC.map(c => c.title).join(', '),
    'Почему': 'пустой список = наследование, а если пусто и у родителя — показываются ВСЕ заполненные характеристики шаблона; у наборов тогда появятся строки «PH у складі: Так». Подразделы с пустым списком унаследуют этот' + (g === 'trolley' ? '. Сейчас у 1055 в списке только «Бренд» — новые характеристики 1055 на странице не видны, пока их не добавить' : '') }); }
P.push({ 'Раздел': '1460 Підставки для біт', 'URL': url(1460), 'Поставить в «Характеристики для страницы товара»': 'Бренд (или другое нужное, но не характеристики бит)', 'Убрать / не ставить': 'Профіль, Розмір, Довжина, Тип біти, Хвостовик, Особливості', 'Почему': 'TL64 (подставка) несёт значения всех бит только чтобы не пропадать из фильтров бит; на её странице им не место. Проверить TL64' });
P.push({ 'Раздел': '1060 Ручки-тримачі', 'URL': url(1060), 'Поставить в «Характеристики для страницы товара»': 'Вид інструменту, Особливості викрутки (+ Бренд)', 'Убрать / не ставить': 'Профіль, Розмір, Довжина, Тип біти, Хвостовик, Особливості', 'Почему': '05051278001 (ручка Micro) несёт значения бит для фильтра; на странице — только свои. Проверить 05051278001' });
// --- sheet 3: what to check on the site
const C = []; const pl = a => (live[a] || {}).link || a;
const chk = (grp, link, what) => C.push({ 'Группа': grp, 'Ссылка': link, 'Что проверить': what });
chk('Біти', pl('05056805001'), 'строка «Розмір: 0» видна (п. 4 — исправлено, проверено). После п. 6: «Профіль», «Розмір», «Довжина» — ссылки');
chk('Біти', url(1080) + 'filter/rozmir=3/', 'фильтр «Розмір: 0» — 2 товара (PZ 0 x 25, мікробіта PZ 0)');
chk('Біти', pl('TL64'), 'после настройки 1460 — строк характеристик бит нет');
for (const [id, g] of SETSEC) { const sk = skladIn(id); if (!url(id)) continue; const a = sk.find(c => c.key === 'sklad_ph') ? 'sklad_ph' : sk[0].key, b = sk.find(c => c.key === 'sklad_pz') ? 'sklad_pz' : (sk.find(c => c.key !== a) || sk[0]).key;
  const ta = SKC.find(c => c.key === a).title, tb = SKC.find(c => c.key === b).title;
  chk(`${name(id)} (${id})`, url(id) + `filter/${a}=1;${b}=1/`, `«${ta}» + «${tb}» → ${both(id, a, b)} наборов (только где есть оба); одно «${ta}» → ${one(id, a)}; в списке фильтров только: ${sk.map(c => c.title).join(', ')}; «Профіль» в этом разделе нет`); }
const SAMPLE = { zyklop: ['05003590001'], vykrutky: ['05008750001'], lkeys: [], vde: ['05006160001'], dyn: [], joker: [], kk: [], holders: [], adapters: [], drills: [] };
for (const [g, id] of ROOTS.filter(r => !['bits', 'bitsets', 'trolley'].includes(r[0]))) { const M = G(g); const it = (SAMPLE[g] || []).find(a => live[a]) || (M.items.find(i => i.kind && live[i.a] && Object.values(i.vals).filter(v => v.length).length >= Math.min(4, M.chars.length)) || M.items.find(i => live[i.a])).a;
  chk(`${name(id)} (${id})`, url(id), `фильтры в порядке: ${order(g).join(' → ')}; значения по возрастанию; «Показать еще» после 10`);
  chk(`${name(id)} (${id})`, pl(it), `строки: ${M.chars.map(c => c.title).filter(t => (M.items.find(i => i.a === it).vals[M.chars.find(c => c.title === t).key] || []).length).join(', ')}; строк «… у складі» нет`); }
chk('Інструментальний візок та ложементи (1055)', url(1055) + 'filter/komplektatsiia=1/', `«Комплектація: З інструментом» → ${G('trolley').items.filter(i => i.kind === 'filled').length} товаров; «Без інструменту» (komplektatsiia=2) → ${G('trolley').items.filter(i => i.kind === 'empty').length}`);
chk('Інструментальний візок та ложементи (1055)', pl('05150102001'), 'после добавления характеристик в список страницы 1055: Вид інструменту: Ложемент; Комплектація: З інструментом; Інструмент у ложементі: Викрутки; Профіль: PH, PZ, PlusMinus, SL, TX');
chk('Наборы (общая логика)', url(1059) + 'filter/sklad_ph=1;sklad_pz=1/', 'разные фильтры = И, значения одного фильтра = ИЛИ (проверено на Мікробіти: PH 7, PZ 5, PH+PZ 9 — ИЛИ внутри «Профіль»)');
// --- sheet 4: disputed, all groups
const D = []; for (const [g, id] of ROOTS.filter(r => r[0] !== 'bits')) { const f = INV + `filters_${g}_disputed.xlsx`; if (!fs.existsSync(f)) continue;
  for (const r of X.utils.sheet_to_json(X.readFile(f).Sheets['Спорные'])) D.push({ 'Группа': `${id} ${name(id)}`, ...r }); }
for (const d of SK.disputed) D.push({ 'Группа': '«… у складі»', 'Артикул': d.a, 'Раздел': d.sec, 'Чего не хватает': d.what, 'Почему': d.why, 'Название': d.title });
const wb = X.utils.book_new(); const add = (rows, n, cols) => { const ws = X.utils.json_to_sheet(rows); ws['!cols'] = cols.map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, n); };
add(F, 'Фильтры', [44, 48, 40, 120, 40, 50]); add(P, 'Характеристики страницы товара', [40, 48, 90, 60, 80]); add(C, 'Проверить на сайте', [40, 90, 110]); add(D, 'Спорные', [36, 14, 8, 26, 70, 80]);
X.writeFile(wb, INV + 'filters_admin_checklist.xlsx'); console.log('Фильтры', F.length, 'Страница', P.length, 'Проверить', C.length, 'Спорные', D.length);
// --- 1055 preview
const TR = G('trolley'); const skl = Object.fromEntries(SK.items.map(i => [i.a, SKC.filter(c => i.vals[c.key].length).map(c => c.title.replace(' у складі', '')).join(', ')]));
const R = TR.items.map(i => ({ 'Артикул': i.a, 'Название': i.title, 'Тип': i.kind === 'filled' ? 'с инструментом' : 'пустой', 'Вид інструменту': i.vals.vyd_instrumentu.join(', '), 'Комплектація': i.vals.komplektatsiia.join(', '),
  'Інструмент у ложементі': i.vals.instrument_u_lozhementi.join(', '), 'Профіль': i.vals.profil.join(', '), 'Привід': i.vals.pryvid.join(', '), '… у складі (Так)': skl[i.a] || '', 'Источник': i.src, 'Не распознано в составе': i.note.replace(/^не распознано: /, ''), 'Название datasheet WERA': i.dsTitle, 'Ссылка': pl(i.a) }));
const wp = X.utils.book_new(); const ws = X.utils.json_to_sheet(R); ws['!cols'] = [14, 70, 14, 22, 16, 50, 50, 26, 40, 50, 60, 70, 60].map(w => ({ wch: w })); X.utils.book_append_sheet(wp, ws, '1055');
const V = [['Характеристика', 'Значение', 'Товаров'], ...TR.chars.flatMap(c => { const n = {}; for (const i of TR.items) for (const v of i.vals[c.key]) n[v] = (n[v] || 0) + 1; return Object.entries(n).map(([v, k]) => [c.title, v, k]); })];
X.utils.book_append_sheet(wp, X.utils.aoa_to_sheet(V), 'Значения'); X.writeFile(wp, INV + 'filters_1055_preview.xlsx'); console.log('1055 preview', R.length);
