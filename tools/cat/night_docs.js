// Night 20–21.10.2026: docs/admin_plan_filters.md — ONE admin plan for the catalog filters, in the order of the catalog menu, from cat/night_plan_<group>.json
// (cat/night_audit.js). Paths by names, no ids. Every listed characteristic is checked to be filled on the products of that section (else STOP).
//   node cat/night_docs.js <live.json> <scan.json>
const fs = require('fs'), path = require('path'); const [, , LIVE, SCAN] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')), SC = JSON.parse(fs.readFileSync(SCAN, 'utf8'));
const ORDER = ['novynky', 'vykrutky', 'vde', 'zyklop', 'joker', 'lkeys', 'kk', 'bags', ['Біти та бітотримачі', ['biti', 'holders', 'bitsets', 'adapters', 'drills', 'stands']], 'dyn', 'trolley', 'bike', 'impact', 'hammers'];
const P = g => JSON.parse(fs.readFileSync(path.join(__dirname, `night_plan_${g}.json`), 'utf8'));
const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number); const vis = p => +p.display_in_showcase === 1;
const has = (id, k) => L.some(p => vis(p) && secs(p).includes(+id) && ((p.characteristics || {})[k] || []).length);
const head = ['Хіти продажів', 'Ціна'];
let checks = 0; const stop = m => { console.log('STOP', m); process.exit(2); };
const out = [];
out.push('# Фильтры каталога — план для админки (22.10.2026)', '',
  'Что сделать в админке, раздел за разделом, в порядке меню каталога. Ночью данные характеристик приведены к правилам; план посчитан по свежей выгрузке и витрине (`tools/cat/night_audit.js`; подробно — `inventory/night_<группа>.xlsx`, лист «Розділи»: что сейчас на витрине, что по плану и почему фильтр не ставим).', '',
  '**Как ставить (для всех групп):**',
  '- «Фільтри» — на разделе группы; подразделы наследуют, пока их список пустой. Заполненный список подраздела заменяет родительский целиком — поэтому для таких подразделов ниже дан ПОЛНЫЙ список.',
  '- Порядок в каждом списке: «Хіти продажів» (стикеры), «Ціна», дальше как написано.',
  '- «Характеристики для сторінки товару» — только на разделе группы. «… у складі» туда не ставить никогда (служебные фильтры наборов).',
  '- «Характеристики з посиланням на фільтр» — на разделе группы, как написано.',
  '- Фильтр без значений в разделе Хорошоп прячет сам. Свой список подраздел получает только там, где унаследованный фильтр был бы с одним значением на все товары или лишним (например, «Профіль» рядом с «Профіль і розмір», размеры в наборах).',
  '- Правило (владелец 22.10.2026): фильтр, где у всех товаров раздела одно и то же значение, не ставится — кроме «Довжина…» в мм; «Довжина ключа» (Стандартний / Подовжений / Короткий) с одним значением — не ставится. Признак («Особливості…», «… у складі», «Тип біт у наборі») — только если он есть хотя бы у 2 товаров раздела. Фильтр не убирается из-за того, что у принадлежности / ручки нет значения. Подразделы «Біти» получают свой список, только где мёртвых фильтров 2 и больше («Довжина» не считается).',
  '- Разделы с 1 товаром наследуют — своего списка не надо.',
  '- Дизайн фильтра (как в «Біти»): вертикальный, размер M, сворачивание включено, все группы развёрнуты, максимум 10 значений + «Показать еще».', '');
let n = 0;
const groupBlock = (g, lvl) => { const plan = P(g); const T = plan.titles; const nm = k => T[k] || k;
  const rootId = plan.roots[0]; const rootPath = ((SC[rootId] && SC[rootId].path) || plan.name).replace(/ +$/, '');
  // checks: every characteristic in a list is filled on products of that section / group
  const groupIds = Object.keys(plan.plans);
  for (const k of plan.rootList) { checks++; if (!groupIds.some(id => has(id, k))) stop(`${plan.name}: ${k} not filled anywhere`); }
  for (const o of plan.own) for (const k of o.list) { checks++; if (!has(o.id, k)) stop(`${o.path}: ${k} not filled`); }
  for (const k of plan.card) { checks++; if (!L.some(p => vis(p) && ((p.characteristics || {})[k] || []).length && groupIds.some(id => secs(p).includes(+id)))) stop(`${plan.name} card: ${k}`); }
  const b = []; b.push(`${lvl} ${plan.name}`, '');
  b.push(`**Раздел «${rootPath}»:**`);
  b.push(`- Фільтри: ${[...head, ...plan.rootList.map(nm)].join(' → ')}`);
  b.push(`- Характеристики для сторінки товару: ${plan.card.length ? plan.card.map(nm).join(', ') : 'не задавать (характеристик у товаров раздела нет)'}`);
  if (plan.link.length) b.push(`- З посиланням на фільтр: ${plan.link.map(nm).join(', ')}`);
  if (plan.own.length) { b.push('', `**Свой список «Фільтри» у подразделов (${plan.own.length}):**`); for (const o of plan.own) b.push(`- ${o.path.replace(rootPath + ' → ', '')}: ${[...head, ...o.list.map(nm)].join(' → ')}`); }
  else if (Object.keys(plan.plans).length > 1) b.push('', 'Подразделы наследуют — своих списков не надо.');
  if (g === 'vykrutky') plan.empty = plan.empty.filter(x => !/TORQ-SET/.test(x));   // owner 20.10.2026: TORQ-SET — he deals with it himself
  if (plan.empty.length) b.push('', `**Пустые разделы (0 товаров) — скрыть (глаз в дереве):** ${plan.empty.map(x => '«' + x + '»').join('; ')}`);
  b.push(''); return b; };
// owner 22.10.2026: «Викрутки» and «Діелектричні» are already set up in the admin — at the top of the plan only WHAT TO CHANGE. What the admin holds now:
// cat/night_plan_<group>_configured.json (the plan the owner set up — the rules before 22.10 (h); the storefront scan matched it) and the storefront scan
// (the filter blocks in their order). Per listing section: own list needed now / no longer needed, or a different effective list. Full paths by names.
const adminDiff = () => { const b = ['## Что поменять в админке — уже настроенные «Викрутки», «Діелектричні інструменти» и «Біти»', ''];
  let cnt = 0; const parts = [];
  for (const g of ['vykrutky', 'vde', 'biti']) { const plan = P(g); const nm = k => plan.titles[k] || k; const rows = []; const cf = path.join(__dirname, `night_plan_${g}_configured.json`);
    const old = fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : null; const rootPath = ((SC[plan.roots[0]] && SC[plan.roots[0]].path) || plan.name).replace(/ +$/, '');
    const rootNew = [...head, ...plan.rootList.map(nm)].join(' → '), rootOld = old ? [...head, ...old.rootList.map(nm)].join(' → ') : null;
    const rootLine = rootOld && rootOld !== rootNew ? `- **${rootPath}** (раздел группы) — поменять «Фільтри».
  Сейчас: ${rootOld}
  Надо: ${rootNew}` : null; if (rootLine) cnt++;
    for (const [id, pl] of Object.entries(plan.plans)) { if (pl.tiny) continue; const keys = pl.inherits ? plan.rootList.filter(k => pl.present.includes(k)) : pl.list;
      const want = keys.filter(k => has(id, k)).map(nm); const now = (SC[id] ? SC[id].ua.filters : []).map(f => f.title).filter(t => t && t !== '?' && t !== 'Бренд' && t !== 'Ціна');
      const op = old && old.plans[id]; const oldOwn = op ? !op.inherits && !op.tiny : false, newOwn = !pl.inherits; const same = JSON.stringify(want) === JSON.stringify(now);
      let act = null; if (same && !rootLine) continue;   // the storefront already shows the planned list and the group list stays — nothing to do
      if (newOwn && !oldOwn) act = 'задать свой список' + (same ? ' (на витрине сейчас так и есть — через наследование; после правки раздела группы без своего списка изменится)' : '');
      else if (newOwn && !same) act = 'заменить свой список';
      else if (!newOwn && oldOwn && !same) act = 'очистить свой список — будет наследовать от «' + rootPath + '»';   // an own list that equals what inheritance gives — left as is
      else if (!newOwn && !same) act = rootLine ? 'изменится сам после правки раздела группы' : 'проверить: наследует от «' + rootPath + '»';
      if (!act) continue; const rem = now.filter(t => !want.includes(t)), add = want.filter(t => !now.includes(t));
      const what = [rem.length ? 'убрать ' + rem.map(x => '«' + x + '»').join(', ') : '', add.length ? 'добавить ' + add.map(x => '«' + x + '»').join(', ') : '', !same && !rem.length && !add.length ? 'поменять порядок' : ''].filter(Boolean).join('; ');
      rows.push(`- **${pl.path}** — ${act}${what ? '; на витрине: ' + what : ''}.
  Сейчас на витрине: ${now.length ? now.join(' → ') : '—'}
  Надо: ${[...head, ...want].join(' → ')}`); }
    cnt += rows.length; parts.push(`**${plan.name}**`, '', ...(rootLine ? [rootLine] : [`- **${rootPath}** (раздел группы) — без изменений: ${rootNew}`]), ...rows, ''); }
  b.push(`Сравнение: что настроено сейчас (прошлый план и витрина UA, порядок блоков) и новый план ниже. Только разделы, где надо что-то сделать — всего ${cnt}. «Хіти продажів» и «Ціна» не сравниваются (всегда первыми; Хорошоп прячет их сам, когда стикеров нет или цена одна). Полные пути — названиями разделов.`, '', ...parts); return b; };
out.push(...adminDiff());
for (const g of ORDER) { n++; if (Array.isArray(g)) { out.push(`## ${n}. ${g[0]}`, ''); for (const s of g[1]) out.push(...groupBlock(s, '###')); }
  else out.push(...groupBlock(g, `## ${n}.`)); }
// owner 22.10.2026 (item 10 of docs/preview_vid.md): sections of «Викрутки», Kraftform Kompakt, «Діелектричні» with products of 2+ kinds after the kinds
// by the WERA composition — the FULL «Фільтри» list (as an own list of the section), the count per kind
{ const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua); const rows = [];
  for (const g of ['vykrutky', 'kk', 'vde']) { const plan = P(g); const nm = k => plan.titles[k] || k;
    for (const [id, pl] of Object.entries(plan.plans)) { const ps = L.filter(p => vis(p) && secs(p).includes(+id)); const c = {}; for (const p of ps) for (const x of v(p, 'vyd_instrumentu')) c[x] = (c[x] || 0) + 1;
      if (Object.keys(c).length < 2) continue; const list = pl.tiny ? null : (pl.inherits ? plan.rootList.filter(k => pl.present.includes(k)) : pl.list);
      for (const k of list || []) { checks++; if (!has(id, k)) stop(`${pl.path}: ${k} not filled`); }
      const why = list && !list.includes('vyd_instrumentu') ? ` «Вид інструменту» не ставится: другого вида ${ps.length - Math.max(...Object.values(c))} из ${ps.length}.` : '';
      rows.push(`- **${pl.path}** — товаров: ${ps.length}; ${Object.entries(c).sort((a, b) => b[1] - a[1]).map(x => `${x[0]} ${x[1]}`).join(', ')}.` + (list ? `\n  Фільтри: ${[...head, ...list.map(nm)].join(' → ')}${pl.inherits ? ' (совпадает с разделом группы — можно оставить пустым)' : ''}.${why}` : '\n  1–2 товара — своего списка не надо.')); } }
  out.push('## Смешанные разделы «Викрутки», Kraftform Kompakt, «Діелектричні» (22.10.2026)', '',
    'Разделы, где после записи видов по составу WERA (22.10) лежат товары разных видов. Список «Фільтри» — полный, его можно ставить как свой список подраздела. «Вид інструменту» — если второй вид или все товары не основного вида ≥ 20 % раздела (и не меньше 2 товаров); «Особливості викрутки» — где у товаров есть особенности (в т. ч. новое «З індикатором напруги»). Количество по видам — после записи; товар с двумя видами считается в обоих.', '', ...rows, ''); }
out.push('---', '', `Проверка плана: каждая характеристика каждого списка заполнена у товаров своего раздела (${checks} проверок, 0 ошибок).`, '');
fs.writeFileSync(path.join(__dirname, '../../docs/admin_plan_filters.md'), out.join('\n'));
console.log('written docs/admin_plan_filters.md', out.length, 'lines, checks', checks);
