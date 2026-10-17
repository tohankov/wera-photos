// Titles preview (nothing is written to the site): names/catalog.json (live export) -> inventory/names_fix_preview.xlsx, inventory/names_words_review.xlsx,
// names/mech_plan.json (what names/write.js may write).
//   MECHANICAL (format only, the meaning does not change): format rules (names/rules.js) + Latin look-alike letters, applied to the title as it is.
//   WORDS (owner review first): 1. type words (names/types.js), 2. series template: a title without its WERA model code takes the wording of an already
//   correct title of the same WERA series («№ артикула» in the datasheet) with its own size, 3. bits / hex screwdrivers whose series has no correct title:
//   the model code from the datasheet goes right before the size (as in 346 of 358 correct bit titles), 4. double-ended bits «PH 2/PH 2, 45 мм».
//   Sizes always come from the product's own title, checked against its WERA datasheet. Anything ambiguous goes to «Спорные» and is not written at all.
const X = require('xlsx'), path = require('path'), fs = require('fs'); const C = require('./catalog.json'); const { apply, LABEL } = require('./rules.js'); const { fix, lat } = require('./types.js'); const S = require('./series.js');
const INV = path.join(__dirname, '../../inventory/');
const WORDS = { type: 'тип товара по образцу каталога', spell: 'написание («шліцева», «трещотка»)', tpl: 'шаблон серии WERA (по правильному товару той же серии)', series: 'серия WERA из datasheet перед размером (как у правильных бит серии)', dbl: 'двусторонняя бита «PH 2/PH 2, 45 мм»' };
const L2 = { ...LABEL, lat: 'латинская буква в кириллическом слове', ...WORDS };
const sec = p => `${p.parent.id} ${(p.parent.value || '').split('/').pop()}`;
// UA type and RU type disagree — the right type is not known from the title
const CONFLICT = [[/^Біта - /, /^Насадка/], [/^Мітчик однопрохідний/, /^Насадка/], [/^Набір гібридних/, /^Трещ/], [/^Тріскачка для/, /^Деблокиратор/], [/^Цанговий патрон/, /^Разжимная/], [/^(Торцевий ключ|Ключ гайковий)/, /^Вороток/],
  [/^Ключ Bita/, /^Бита/], [/^Набір головок/, /^Ложемент/], [/^Набір подовжених/, /^Набор ударных/], [/^Торцева подовжена/, /^Торцовая ударная/], [/^Набір інструментів/, /^Набор монтажных/], [/^Сумка-скручування/, /./], [/^Набір на /, /^Набор в /]];
// numbers of a size, for the datasheet check: «1,0×5,5×70 мм» -> [1, 5.5, 70]; inch fractions kept as text
const nums = s => (s.match(/\d+\/\d+|\d+(?:[.,]\d+)?/g) || []).map(x => /\//.test(x) ? x : String(+x.replace(',', '.')));
const sizeChunk = t => { const m = t.match(/(?:(?:PH\/S|PZ\/S|PH|PZ|TX|HEX|SL|SW|квадрат) )?#?[\d,/″]+(?: ?IPR?)?(?:×[\d,/″]+(?: ?IPR?)?)+ мм/g); return m ? m[m.length - 1] : ''; };
// double-ended bit: «PH 2 × PH 2×45 мм» (after the format rules) -> «PH 2/PH 2, 45 мм»
const DBL = /\b(PH|PZ|SL|TX) (\d+) × (PH|PZ|SL|TX) (\d+)×(\d+(?:,\d+)?) мм/;
const dbl = t => t.replace(DBL, '$1 $2/$3 $4, $5 мм');
const rows = [], disputed = [], review = [], mech = {}; let same = 0; const ruleCount = {}, wordCount = {};
// pass 1: mechanical (format rules + Latin letters on the title as it is) and full (type words first, then the same rules)
const R = C.map(p => { const a = p.article, mu = apply(lat(p.title.ua, 'ua'), a), mr = apply(lat(p.title.ru, 'ru'), a);
  const mhit = [...new Set([...mu.hit, ...mr.hit, ...(lat(p.title.ua, 'ua') !== p.title.ua || lat(p.title.ru, 'ru') !== p.title.ru ? ['lat'] : [])])];
  const f = fix(p.title.ua, p.title.ru); const u = apply(f.ua, a), r = apply(f.ru, a); const d = /^\d{11}$/.test(a) ? S.facts(a) : null;
  return { p, a, mua: mu.t, mru: mr.t, mhit, ua: u.t, ru: r.t, hit: [...new Set([...f.hit, ...u.hit, ...r.hit])], tailOk: u.tailOk && r.tailOk, d }; });
// correct titles per WERA series: model code present, size in our format, proper ending
const good = {}; for (const x of R) if (x.d && x.d.model && x.d.series && S.hasModel(x.ua, x.d.model) && S.hasModel(x.ru, x.d.model) && sizeChunk(x.ua) && sizeChunk(x.ru) && x.tailOk) (good[x.d.series] = good[x.d.series] || []).push(x);
for (const g of Object.values(good)) g.sort((a, b) => (a.hit.length - b.hit.length) || (a.a < b.a ? -1 : 1));
const tpl = (q, x, lang) => { const qt = q[lang], qc = sizeChunk(qt), xc = sizeChunk(x[lang]); if (!qc || !xc) return null; const qn = nums(qc), xn = nums(xc); if (qn.length !== xn.length) return null;
  // the size chunk is the product's own (profile, numbers, inch marks) — only the wording around it comes from the reference
  return qt.slice(0, qt.lastIndexOf(qc)) + xc + qt.slice(qt.lastIndexOf(qc) + qc.length).replace(new RegExp(String.raw`WERA ${q.a}$`), `WERA ${x.a}`); };
// words compared by stem (6 letters, ё = е): «хвостовик» = «хвостовиком»; «дюймова» is not lost when the size carries ″
const words = t => new Set((t.toLowerCase().replace(/ё/g, 'е').match(/[а-яіїєґ']{4,}/g) || []).filter(w => !(/^дюймов/.test(w) && /″/.test(t))).map(w => w.slice(0, 6)));
// model code right before the size: bits and hex screwdrivers only (the types where correct titles always have it there); TORX PLUS sizes («40 IP×89») excluded
const SERIES_TYPES = [[/^Біта /, /^Бита /], [/^Шестигранна викрутка/, /^Шестигранная отв[её]ртка/]];
const insModel = (t, m) => { const c = t.match(/\b(?:PH|PZ|SL|TX) \d+\/(?:PH|PZ|SL|TX) \d+, [\d,]+ мм/); const chunk = c ? c[0] : sizeChunk(t);
  if (!chunk || /IP/.test(chunk)) return null; const i = t.lastIndexOf(chunk); if (i > 0 && t[i - 1] !== ' ') return null;   // «M8×25»: the size is glued to a letter
  return t.slice(0, i) + m + ' ' + t.slice(i); };
for (const x of R) { const p = x.p; let why = '';
  // 2. series template
  if (x.d && x.d.model && x.d.series && !S.hasModel(x.ua, x.d.model) && good[x.d.series]) { const q = good[x.d.series][0]; const nu = tpl(q, x, 'ua'), nr = tpl(q, x, 'ru');
    if (nu && nr) { const lost = [...words(x.ua)].filter(w => !words(nu).has(w) && !/^(торсій|біти|біта|біт$)/.test(w)); const lostR = [...words(x.ru)].filter(w => !words(nr).has(w) && !/^(торсио|бита|биты)/.test(w));
      if (lost.length || lostR.length) why = `шаблон серии ${x.d.series} (${q.a}) убирает слова: ${[...lost, ...lostR].join(', ')} — проверить`;
      x.ua = nu; x.ru = nr; x.hit.push('tpl'); x.tplFrom = q.a; } }
  // 4. double-ended bit
  if (DBL.test(x.ua) && DBL.test(x.ru)) { x.ua = dbl(x.ua); x.ru = dbl(x.ru); x.hit.push('dbl'); x.mdbl = true; }
  // 3. series code from the datasheet before the size
  if (!x.tplFrom && x.d && x.d.model && /^\d/.test(x.d.model) && !S.hasModel(x.ua, x.d.model) && !S.hasModel(x.ru, x.d.model) && SERIES_TYPES.some(([u, r]) => u.test(x.ua) && r.test(x.ru))) {
    const nu = insModel(x.ua, x.d.model), nr = insModel(x.ru, x.d.model); if (nu && nr) { x.ua = nu; x.ru = nr; x.hit.push('series'); } }
  // checks
  if (!x.tailOk) why = why || 'конец названия не «WERA <артикул>» (старый артикул в скобках / слова после артикула / бренд в середине)';
  for (const [u, r] of CONFLICT) if (u.test(p.title.ua) && r.test(p.title.ru)) why = why || `тип товара в UA («${p.title.ua.split(' ').slice(0, 2).join(' ')}») и RU («${p.title.ru.split(' ').slice(0, 2).join(' ')}») расходится`;
  if (/(?<!\d)\d{1,2}, \d×|PL\d, \d|#0[1-9]|\/S#/.test(x.ua + ' ' + x.ru + ' ' + x.mua + ' ' + x.mru)) why = why || 'размер записан неоднозначно';
  if (/ мм × \d+ мм/.test(x.ua) && /HIOS|Halfmoon/.test(x.ua) && !/\d×\d/.test(x.ua.replace(/4 мм × /, ''))) why = why || 'в названии нет размера (только длина)';
  if (x.d && x.d.size) { const dn = nums(x.d.size), tn = /^(9×12|14×18) мм$/.test(sizeChunk(x.ua)) ? [] : nums(sizeChunk(x.ua) || ''); if (tn.length && dn.length && !dn.slice(0, Math.min(2, dn.length)).every(v => tn.includes(v)) && !tn.every(v => dn.includes(v))) why = why || `размер в названии (${sizeChunk(x.ua)}) не совпадает с datasheet WERA (${x.d.size})`; }
  const changed = x.ua !== p.title.ua || x.ru !== p.title.ru;
  if (why) { disputed.push({ 'Артикул': x.a, 'Раздел': sec(p), 'Старое UA': p.title.ua, 'Предложение UA': x.ua, 'Старое RU': p.title.ru, 'Предложение RU': x.ru, 'Причина': why, 'Название в datasheet WERA': x.d ? x.d.title : '' }); continue; }
  if (!changed) { same++; continue; }
  const hit = [...new Set(x.hit)]; for (const h of hit) ruleCount[h] = (ruleCount[h] || 0) + 1;
  rows.push({ 'Артикул': x.a, 'Раздел': sec(p), 'Старое UA': p.title.ua, 'Новое UA': x.ua, 'Старое RU': p.title.ru, 'Новое RU': x.ru, 'Правила': hit.map(h => L2[h] || h).join('; ') + (x.tplFrom ? ` (эталон ${x.tplFrom})` : '') });
  // mechanical part (written now): the double-ended bit is left as it is until the owner approves its format
  const mua = x.mdbl ? p.title.ua : x.mua, mru = x.mdbl ? p.title.ru : x.mru;
  if (mua !== p.title.ua || mru !== p.title.ru) mech[x.a] = { oldUa: p.title.ua, oldRu: p.title.ru, ua: mua, ru: mru, hit: x.mhit };
  if (mua !== x.ua || mru !== x.ru) { const wh = hit.filter(h => WORDS[h]); for (const h of wh) wordCount[h] = (wordCount[h] || 0) + 1;
    review.push({ 'Артикул': x.a, 'Раздел': sec(p), 'Текущее UA (после механики)': mua, 'Предлагаемое UA': x.ua, 'Текущее RU (после механики)': mru, 'Предлагаемое RU': x.ru, 'Правило': wh.map(h => WORDS[h]).join('; ') + (x.tplFrom ? ` (эталон ${x.tplFrom})` : ''), 'Название в datasheet WERA': x.d ? x.d.title : '' }); } }
const wb = X.utils.book_new(); const add = (b, r, n, w) => { const ws = X.utils.json_to_sheet(r); ws['!cols'] = w.map(x => ({ wch: x })); X.utils.book_append_sheet(b, ws, n); };
add(wb, rows, 'Изменения', [14, 40, 70, 70, 70, 70, 60]); add(wb, disputed, 'Спорные', [14, 40, 70, 70, 70, 70, 70, 60]);
const sum = [{ 'Показатель': 'Товаров в каталоге', 'Кол-во': C.length }, { 'Показатель': 'Без изменений (уже в порядке)', 'Кол-во': same }, { 'Показатель': 'Меняется', 'Кол-во': rows.length }, { 'Показатель': 'Спорные', 'Кол-во': disputed.length },
  ...Object.entries(ruleCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ 'Показатель': 'правило: ' + (L2[k] || k), 'Кол-во': v }))];
add(wb, sum, 'Без изменений', [60, 10]); X.writeFile(wb, INV + 'names_fix_preview.xlsx');
const wr = X.utils.book_new(); add(wr, review, 'На ревью', [14, 34, 70, 70, 70, 70, 50, 60]); X.writeFile(wr, INV + 'names_words_review.xlsx');
fs.writeFileSync(path.join(__dirname, 'mech_plan.json'), JSON.stringify(mech));
fs.writeFileSync(path.join(__dirname, 'preview.json'), JSON.stringify({ rows, disputed, same, ruleCount, review }));
const mc = {}; for (const m of Object.values(mech)) for (const h of m.hit) mc[h] = (mc[h] || 0) + 1;
console.log('total', C.length, 'same', same, 'changed', rows.length, 'disputed', disputed.length, '| mechanical to write', Object.keys(mech).length, '| words review', review.length);
console.log('mechanical', mc); console.log('words', wordCount);
