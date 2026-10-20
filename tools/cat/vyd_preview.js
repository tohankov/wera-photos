// Owner 21.10.2026, part 2 (PREVIEW ONLY, nothing is written): «Вид інструменту» for the groups «Викрутки», «Інструменти серії Kraftform Kompakt»,
// «Діелектричні інструменти» by the WERA composition — the new value «Викрутка з набором біт» (item 7), one list of kinds (item 8), «Викрутки → Приладдя» (item 9),
// filter lists of mixed sections (item 10).
//   node cat/vyd_preview.js <live.json>  -> cat/vyd_preview.json + docs/preview_vid.md
const fs = require('fs'), path = require('path'); const C = require('./vyd_comp.js');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const MAP = require('../../inventory/sections_map.json'); const TITLE = require('./char_titles.js');
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua); const secOf = p => MAP.products[p.article].sections;
const GROUPS = { 1098: 'Викрутки', 1057: 'Інструменти серії Kraftform Kompakt', 1224: 'Діелектричні інструменти' };
const inG = id => { const pth = (MAP.sections[id] || {}).path || ''; return Object.values(GROUPS).some(g => pth === g || pth.startsWith(g + ' →')); };
const ps = L.filter(p => secOf(p).some(s => inG(s.id)));
// type of one composition row (RU datasheet head); Latin look-alikes («pучка») are normalised first
function ctype(h) { const s = h.replace(/[pP](?=учк)/g, 'р').replace(/T(?=рещотк)/g, 'Т').replace(/\s+/g, ' ').trim();
  if (!/[A-Za-zА-Яа-яЁёІіЇїЄє]{3}/.test(s)) return 'unknown';                                            // a broken row («, 1/4" x 300 мм»)
  if (/\d+ предмет|набор(?! полосок)/i.test(s) && !/насадк|бит/i.test(s)) return 'set';                // a nested set (Tool Finder, Bit-Safe, «Набор отверток …»)
  if (/липуч|полос|футляр|чехол|сумк|подсумок|контейнер|коробк|органайзер|пояс|belt|holster|прокладк|витрин|пустая|неукомплект|подставк|держатель настенн|зажим для|магнит adk|маркер|открыв|поднос|переходник для 9549|шарнир для 9550|держатель для размещения/i.test(s)) return 'acc';
  if (/тестер|индикатор/i.test(s)) return 'tester';
  if (/динамометр|\d+(,\d+)? ?- ?\d+(,\d+)? ?(nm|нм)\b|x \d+ нм|torque/i.test(s)) return 'dyn';
  if (/ручк|рукоятк/i.test(s) && !/отв[её]р?т?к[аи]? (для|с поперечн|tor|hex|с фикс)|отв[её]ртка с поперечной|шестигранная отв|отв[её]ртка torx|hf отв/i.test(s)) return 'handle';
  if (/битодержатель с поперечной|отв[её]ртка-адаптер|т-образная отв[её]ртка-переходник|814 RA Отвертка Kraftform с механизмом/i.test(s)) return 'handle';
  if (C.has.ratchet(s)) return 'ratchet';
  if (/насадк|\bбит|биты|бита\b/i.test(s)) return 'bit';
  if (/отв[её]р?т?к|торцовый ключ для электронщ|съёмник|инструмент для клеммных/i.test(s)) return 'driver';
  if (/take it easy|Kraftform Kompakt (VDE )?\d+|рабочий конец|^869\b|869\/\d|торцовые головки, магнитные/i.test(s)) return 'bit';   // Kompakt blades, Vario ends, 869 nut bits
  if (/г-образн/i.test(s)) return 'lkey';
  if (/ключ/i.test(s)) return 'key';
  if (/головк|торцов/i.test(s)) return 'socket';
  if (/универсальный держатель|битодержатель|оправка|переходник|удлинитель|соединительн|карданн|адаптер/i.test(s)) return 'holder';
  return 'other'; }
const ACC_SINGLE = [[/підставк|тримач для розміщення|магнітний тримач/i, 'Підставка / тримач'], [/сумк|футляр|чохол|пояс|контейнер|органайзер|ящик/i, 'Сумка / футляр'], [/ложемент/i, 'Ложемент'],
  [/знімач/i, 'Знімач'], [/індикатор напруги/i, 'Індикатор напруги']];
const SINGLE_KEEP = /^(Викрутка|Ручка-тримач|Змінна вставка|Змінний робочий кінець Vario|Торцева головка|Викруткова головка|Тріскачка|Ріжковий ключ|Динамометрична викрутка|Ударно-поворотна викрутка|Індикатор напруги|Знімач|Ложемент|Інструментальний візок)$/;
const rows = [];
for (const p of ps) { const a = p.article, t = p.title.ua, now = v(p, 'vyd_instrumentu'); const comp = C.COMP[a] || []; const first = C.first(a);
  const parts = comp.map(g => ({ head: g.head, type: ctype(g.head), n: g.items.reduce((s, i) => s + (i.qty || 1), 0) })); const cnt = {}; for (const x of parts) cnt[x.type] = (cnt[x.type] || 0) + x.n;
  // the handle is often the product itself — the composition table lists only its bits (Kompakt 20/22/25/28, Stubby RA, Pistol, 838 RA …)
  let implicit = false; if (!cnt.handle && !cnt.driver && cnt.bit && /ручк|ручка-біт|викрутк|отв[её]ртк|Kompakt \d|Kompakt Stubby|Pistol|Turbo/i.test(t + ' ' + first)) { cnt.handle = 1; implicit = true; }
  const accOnly = now.length && now.every(x => /^Приладдя/.test(x)) && !/^Набір/i.test(t);
  const isSet = !accOnly && (C.isSet(a) || now.some(x => /^Набір/.test(x))); let to, rule, border = null;
  const nh = cnt.handle || 0, nb = cnt.bit || 0, nd = cnt.driver || 0, nr = cnt.ratchet || 0, nt = cnt.tester || 0, ndyn = cnt.dyn || 0, nhold = cnt.holder || 0;
  const tools = ['other', 'set', 'key', 'lkey', 'socket'].reduce((s, k) => s + (cnt[k] || 0), 0);
  if (isSet && comp.length && !cnt.unknown && !(cnt.set && parts.every(x => x.type === 'set' || x.type === 'acc'))) {
    if (nr && !(cnt.other || cnt.key || cnt.lkey || cnt.set || nd || nt || ndyn)) { to = 'Набір з тріскачкою'; rule = 'тріскачка + головки / біти / подовжувачі'; }
    else if (nr) { to = 'Набір інструментів'; rule = 'тріскачка + інструменти інших видів (кліщі, ключі, викрутки …)'; }
    else if (ndyn) { to = 'Набір з динамометричним інструментом'; rule = 'у складі динамометричний інструмент'; }
    else if (tools && !nh && !nb && !nd && !nt && (cnt.key || 0) === tools) { to = 'Набір ключів'; rule = 'тільки ключі'; }
    else if (tools && !nh && !nb && !nd && !nt && (cnt.lkey || 0) === tools) { to = 'Набір Г-подібних ключів'; rule = 'тільки Г-подібні ключі'; }
    else if (tools && !nh && !nb && !nd && !nt && (cnt.socket || 0) === tools) { to = 'Набір головок'; rule = 'тільки головки'; }
    else if (tools) { to = 'Набір інструментів'; rule = 'у складі інструменти різних видів'; }
    else if (nh === 1 && nb && !nd && !nt) { to = 'Викрутка з набором біт'; rule = 'одна ручка-тримач + біти / вставки' + (implicit ? ' (ручка — сам товар, у таблиці складу тільки біти)' : '');
      const hs = parts.map(x => x.head).join(' '); if (nhold) border = 'A'; else if (/VDE/i.test(hs)) border = 'C'; else if (/рабочий конец|Vario/i.test(hs)) border = 'D'; }
    else if (nh === 1 && nb && !nd && nt) { to = 'Набір викруток'; rule = 'ручка + вставки + індикатор напруги'; border = 'G'; }
    else if (nh >= 2 && nb && !nd) { to = 'Набір викруток'; rule = `${nh} ручки + біти / вставки`; border = 'B'; }
    else if (nd) { to = 'Набір викруток'; rule = nt ? 'викрутки + індикатор напруги' : nb || nh ? 'викрутки + ручка / біти' : 'викрутки'; if (nh || nb) border = 'E'; }
    else if (nb && !nh) { to = 'Набір біт'; rule = 'біти без ручки'; }
    else { to = now.join(' + '); rule = 'склад не розпізнано — як є'; border = 'F'; } }
  else if (isSet) { to = now.join(' + '); rule = comp.length ? 'склад у паспорті неповний / вкладені набори — як є' : 'складу в паспорті немає — як є'; border = 'F'; }
  else { const acc = now.some(x => /^Приладдя/.test(x)); const m = acc && ACC_SINGLE.find(([re]) => re.test(t)); to = m ? m[1] : acc ? 'Приладдя' : now.filter(x => SINGLE_KEEP.test(x)).join(' + ') || now.join(' + '); rule = m ? 'за назвою / паспортом' : acc ? 'приладдя' : 'одиночний товар — як є'; }
  const quote = (comp.length ? parts.map(x => `${x.n}× ${x.head.replace(/\s+/g, ' ').slice(0, 70)}`).join('; ') : '') + (implicit || !comp.length ? (comp.length ? ' | ' : '') + 'паспорт: ' + first : '');
  rows.push({ a, title: t, vis: +p.display_in_showcase === 1, now: now.join(' + '), to, rule, border, quote, secs: secOf(p).map(s => (s.main ? '' : 'alt: ') + MAP.sections[s.id].path), secIds: secOf(p).map(s => s.id), counts: cnt }); }

fs.writeFileSync(path.join(__dirname, 'vyd_preview.json'), JSON.stringify(rows, null, 1));
// ---- markdown
const md = []; const esc = s => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
const tbl = (list, cols) => { md.push('| ' + cols.map(c => c[0]).join(' | ') + ' |', '|' + cols.map(() => '---').join('|') + '|'); for (const r of list) md.push('| ' + cols.map(c => esc(c[1](r))).join(' | ') + ' |'); md.push(''); };
const COLS = [['Артикул', r => r.a], ['Назва', r => r.title], ['Розділи', r => r.secs.join('; ')], ['Було', r => r.now || '—'], ['Стане', r => r.to], ['Склад / паспорт WERA', r => r.quote.slice(0, 300)]];
md.push('# Превью: «Вид інструменту» — Викрутки, Kraftform Kompakt, Діелектричні (21.10.2026)', '', '**Только превью — на сайт ничего не записано.** Жду «ок». Источник — состав из паспорта WERA (таблица «Содержимое», `tools/cat/ds_comp_all.json`) и первая строка паспорта; скрипт — `tools/cat/vyd_preview.js`.', '',
  `Товаров в трёх группах (с доп. разделами): ${ps.length}, видимых ${ps.filter(p => +p.display_in_showcase === 1).length}. Значение меняется у ${rows.filter(r => r.to !== r.now).length}.`, '');
// item 7
const W = rows.filter(r => r.to === 'Викрутка з набором біт');
md.push('## 7. «Викрутка з набором біт» (RU «Отвёртка с набором бит»)', '', '**Правило:** в составе паспорта WERA ровно одна ручка-тримач (ручка-битодержатель, поперечная ручка-тримач и т. п.) и біти или сменные вставки; других инструментов нет (викруток, тріскачок, ключей, головок, кліщів, тестера). Липучки, футляры, підставки, модульные переходники Tool-Check — не инструменты.', '');
md.push(`### 7.1 Однозначно — ${W.filter(r => !r.border).length}`, ''); tbl(W.filter(r => !r.border), COLS);
const BT = { G: 'Ручка + вставки + індикатор напруги (VDE)', A: 'Ручка + біти + бітотримач / перехідник (889/4/1, 870/1 …)', B: 'Две ручки и больше + біти / вставки', C: 'VDE: одна ручка Kompakt VDE + сменные вставки «Take it easy»', D: 'Kompakt Vario: ручка Vario + комбіновані робочі кінці', E: 'Викрутки + ручка-тримач / біти', F: 'Состава в паспорте нет, он не разобран или там вложенные наборы' };
const REC = { G: '«Набір викруток» — как наборы викруток с тестером (21.10); или «Викрутка з набором біт», если тестер считать приладдям.', A: '«Викрутка з набором біт»: бітотримач / перехідник — это продолжение той же ручки, не отдельный инструмент.', B: '«Набір викруток»: две ручки — это две викрутки.', C: '«Викрутка з набором біт»: правило прямо включает сменные вставки; одна ручка = одна викрутка.', D: '«Викрутка з набором біт»: рабочие концы Vario — это сменные вставки.', E: '«Набір викруток»: в составе есть отдельные викрутки.', F: 'оставить как есть: состава в паспорте нет — «Викрутка з набором біт» не ставлю, пока не увижу состав.' };
md.push('### 7.2 Пограничные — по группам, с рекомендацией', '');
for (const g of 'ABCDEFG') { const list = rows.filter(r => r.border === g); if (!list.length) continue; md.push(`**${g}. ${BT[g]} — ${list.length}.** Рекомендую: ${REC[g]}`, ''); tbl(list, COLS); }
// item 8
const VAL = [['Викрутка', 'одиночная викрутка (паспорт: «Отвертка …»)'], ['Викрутка з набором біт', 'п. 7'], ['Набір викруток', 'в составе ≥ 2 викруток (+ підставка / тестер / ручка с бітами); или ≥ 2 ручки + біти'],
  ['Набір біт', 'біти без ручки'], ['Набір з тріскачкою', 'в составе есть тріскачка (Zyklop, Bit Ratchet)'], ['Набір інструментів', 'в составе инструменты разных видов (ключи, кліщі, головки, рівень …)'],
  ['Ручка-тримач', 'одиночная ручка-тримач / бітотримач с ручкой'], ['Змінна вставка', 'одиночная сменная вставка Kompakt VDE'], ['Змінний робочий кінець Vario', 'одиночный рабочий конец Vario'], ['Знімач', 'знімач 1429 / 1529 ESD'],
  ['Індикатор напруги', 'одиночный тестер'], ['Підставка / тримач', 'підставки и тримачі для викруток / біт (паспорт: «Подставка», «держатель для размещения»)'], ['Сумка / футляр', 'пустые сумки, футляры, пояса, чехлы'],
  ['Ложемент', 'ложемент'], ['Приладдя', 'остальное приладдя: намагнічувачі, фіксатори гвинтів, шило, розширювач, перехідники'],
  ['Торцева головка / Викруткова головка / Тріскачка / Ріжковий ключ / Динамометрична викрутка / Ударно-поворотна викрутка', 'одиночные товары других групп в этих разделах — как есть']];
md.push('## 8. Список «Вид інструменту» для трёх групп', '', '| Значение | Правило | Товаров (стане) | Примеры |', '|---|---|---|---|');
for (const [val, rule] of VAL) { const list = rows.filter(r => r.to.split(' + ').some(x => val.split(' / ').includes(x) || x === val)); md.push(`| ${val} | ${rule} | ${list.length} | ${list.slice(0, 3).map(r => r.a).join(', ')} |`); }
md.push('');
const CH = rows.filter(r => r.to !== r.now && r.to !== 'Викрутка з набором біт'); md.push(`### 8.1 Где меняется (кроме п. 7) — ${CH.length}`, ''); tbl(CH, COLS);
// item 9
const PRI = rows.filter(r => r.secIds.includes(1142)); md.push('## 9. «Викрутки → Приладдя» — все товары', ''); tbl(PRI, [['Артикул', r => r.a], ['Назва', r => r.title], ['Паспорт WERA', r => r.quote.slice(0, 120) || '(паспорта нет — товар TL)'], ['Розділи', r => r.secs.join('; ')], ['Було', r => r.now], ['Стане', r => r.to]]);
// item 9: recommendations per product of «Викрутки → Приладдя»
const P9 = { '05033400001': 'остаётся', '05073984001': 'остаётся', '05033404001': 'остаётся', '05073681001': 'остаётся', '05073680001': 'остаётся (упаковка из 2 фиксаторов — приладдя, не набор)',
  '05136414001': 'остаётся', '05136425001': 'остаётся', '05136424001': 'остаётся', '05136426001': 'остаётся', '05134001001': 'остаётся', '05134002001': 'остаётся',
  'TL64': 'остаётся (и в «Біти → Підставки для біт»)', 'TL32': 'остаётся (и в «Біти → Підставки для біт»)', 'TL6': 'остаётся (и в «Біти → Підставки для біт»)', 'TL15': 'остаётся (и в «Біти → Підставки для біт»)', 'TL10': 'остаётся (и в «Біти → Підставки для біт»)',
  '05136413001': 'тримач для ключей Joker — место в «Гайкові ключі Joker»: alt туда, из «Викрутки → Приладдя» убрать',
  '05005655001': 'однополюсный индикатор напряжения 247 — оставить только в «Діелектричні → … → Однополюсний індикатор напруги» (там его ищут); из «Приладдя» убрать; вид — только «Індикатор напруги»',
  '05008101001': 'инструмент 338 для пружинных клемм — шлицевой наконечник 0,4×2,5 на ручке Kraftform: вид «Викрутка» (как у WERA в каталоге отвёрток) или «Приладдя» — вопрос; место — «Діелектричні»? нет, не VDE; оставить',
  '05008102001': 'как 05008101001', '05008100001': 'набор 2 × 338: «Набір викруток» или «Набір інструментів» — по решению для 338 (спорное)',
  '05027405001': 'шило 1427 и розширювач 1428 — серия Kraftform Micro: alt в «Спеціальні викрутки для електронників, Kraftform Micro» (там знімач 1429), вид «Приладдя»', '05027455001': 'как 05027405001',
  '05136700001': 'ключи MC4 — не к викруткам: место — «Новинки»/отдельный раздел для фотогальваники? пока оставить; вид «Набір інструментів»',
  '05004182001': 'велонабор — уже в «Інструменти для велосипедів»: из «Викрутки → Приладдя» убрать', '05004184001': 'велонабор — уже в «Інструменти для велосипедів»: из «Викрутки → Приладдя» убрать' };
md.push('**Рекомендации по разделу «Викрутки → Приладдя»:**', '', '- Подразделы не нужны: 25 товаров, хватит фильтра «Вид інструменту» (Підставка / тримач — 12, Приладдя — 8, Індикатор напруги, Набір …). Фильтры раздела: Хіти продажів → Ціна → Вид інструменту → Особливості викрутки.', '');
md.push('| Артикул | Что это | Рекомендация |', '|---|---|---|'); for (const r of PRI) md.push(`| ${r.a} | ${esc(r.title)} | ${esc(P9[r.a] || 'остаётся')} |`); md.push('');
// item 10: mixed sections — filter lists after items 7–8
const PL = {}; for (const g of ['vykrutky', 'kk', 'vde']) { const P = JSON.parse(fs.readFileSync(path.join(__dirname, `night_plan_${g}.json`), 'utf8')); for (const [id, pl] of Object.entries(P.plans)) PL[id] = { pl, root: P.rootList, titles: P.titles }; }
const byA = Object.fromEntries(rows.map(r => [r.a, r])); const mixed = [];
for (const [id, { pl, root, titles }] of Object.entries(PL)) { if (pl.tiny) continue; const prs = L.filter(p => +p.display_in_showcase === 1 && MAP.products[p.article].sections.some(s => s.id === +id));
  const kinds = {}; for (const p of prs) for (const k of (byA[p.article] ? byA[p.article].to : v(p, 'vyd_instrumentu').join(' + ')).split(' + ').filter(Boolean)) kinds[k] = (kinds[k] || 0) + 1;
  if (Object.keys(kinds).length < 2) continue; const base = (pl.inherits ? root.filter(k => pl.present.includes(k)) : pl.list).filter(k => k !== 'vyd_instrumentu');
  mixed.push({ id, path: pl.path, n: prs.length, kinds, list: ['Хіти продажів', 'Ціна', 'Вид інструменту', ...base.map(k => titles[k] || TITLE[k] || k)] }); }
md.push('## 10. Смешанные разделы — «Фільтри» с «Вид інструменту» (после п. 7–8)', '', 'Разделы групп «Викрутки», Kraftform Kompakt, «Діелектричні», где после п. 7–8 лежат товары разных видов. Список — полный (для своего списка подраздела); остальные фильтры — из плана админки (правила: фильтр с одним значением у всех не ставится, «Довжина» остаётся; в наборах — «… у складі» вместо профиля и размеров).', '');
md.push('| Раздел | Товаров | Виды (после п. 7–8) | Фільтри |', '|---|---|---|---|');
for (const m of mixed) md.push(`| ${esc(m.path)} | ${m.n} | ${esc(Object.entries(m.kinds).sort((a, b) => b[1] - a[1]).map(x => x[0] + ' ' + x[1]).join(', '))} | ${m.list.join(' → ')} |`);
md.push('');

md.push('## Вопросы', '', '1. «Викрутка з набором біт»: ок на список 7.1 (однозначные)?', '2. Пограничные A (ручка + бітотримач / перехідник), C (VDE: ручка + вставки), D (Vario) — «Викрутка з набором біт»? B (2+ ручки) — «Набір викруток»? G (VDE: ручка + вставки + індикатор) — «Набір викруток»?', '3. Одно значение «Підставка / тримач» для підставок и тримачів викруток и біт — или «Підставка / тримач для біт» только для біт, а для викруток своё?', '4. «Приладдя для викруток» слить в «Приладдя» (одно название во всех группах)?', '5. Инструмент 338 для пружинных клемм (05008101001, 05008102001, набор 05008100001) — «Викрутка» / «Набір викруток» или «Приладдя» / «Набір інструментів»?', '6. Наборы с тріскачкою и другими инструментами (Kompakt SH / M1 / H1 / W, 9532) — «Набір інструментів», а не «Набір з тріскачкою»: ок?', '7. Перенос / alt по п. 9: тримач Joker 05136413001 → «Гайкові ключі Joker»; індикатор 05005655001 — только в «Діелектричні»; шило 1427 и розширювач 1428 → alt «Спеціальні викрутки … Kraftform Micro»; велонаборы 05004182001, 05004184001 — убрать из «Викрутки → Приладдя»?', '');
fs.writeFileSync(path.join(__dirname, '../../docs/preview_vid.md'), md.join('\n'));
const c = {}; for (const r of rows) c[r.to] = (c[r.to] || 0) + 1; console.log('rows', rows.length, 'changing', rows.filter(r => r.to !== r.now).length, '| W', W.length, 'clear', W.filter(r => !r.border).length); console.log(c);
console.log('borders', JSON.stringify(rows.filter(r => r.border).reduce((m, r) => (m[r.border] = (m[r.border] || 0) + 1, m), {})));
