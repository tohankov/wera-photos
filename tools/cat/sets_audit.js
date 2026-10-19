// Audit of every set in the catalog (read-only) -> inventory/sets_audit.xlsx
//   node cat/sets_audit.js <live.json> [pages]
// live.json: full export with characteristics (lib/full_export.js). A set = «Вид інструменту» starts with «Набір», or the title says набір/комплект/Set,
// or the leaf section is a set section — single bits (TORQ-SET) are not sets. «pages»: one product page per section with sets (1.5 s apart) — which
// characteristic rows the product card shows (empty «Характеристики для сторінки товару» = all filled characteristics are shown).
const fs = require('fs'), path = require('path'), X = require('xlsx'); const { expand, hasComp } = require('./comp_expand.js');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const PAGES = process.argv[3] === 'pages'; const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const SK = require('./g_sklad.js'); const SKC = SK.chars; const disp = new Map(SK.disputed.map(d => [d.a, d.why]));
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua ?? x.value.ru).filter(Boolean);
const RX = /набір|набором|комплект|\bSet\b/i; const DS = a => fs.existsSync(path.join(__dirname, '../batch/ds', a + '.pdf'));
const isSet = p => !/^Біта /.test(p.title.ua) && (v(p, 'vyd_instrumentu').some(x => /^Набір/.test(x)) || RX.test(p.title.ua) || /набор|набір|ложемент/i.test(p.parent.value.split('/').pop()));
// datasheet without a composition table, read by hand: no screw profile in them
const CHECKED = { '05042680001': 'перехідники для торцевих головок', '05073200001': 'хвостовики для машинного керування', '05137003001': 'набір для рекалібрування динамометричних викруток',
  '05051276001': 'ручка-тримач (окремий товар)', '05049005001': 'адаптер (окремий товар)', '05049004001': 'шарнір (окремий товар)', '05004866001': 'тріскачка (окремий товар)',
  '05104751001': 'мітчики-біти', '05104754001': 'мітчики-біти' };
const sets = L.filter(isSet); const KEYS = SKC.map(c => c.key); const ttl = Object.fromEntries(SKC.map(c => [c.key, c.title]));
const reason = p => { const t = p.title.ua; const a = p.article;
  if (disp.has(a)) return 'спорный: ' + disp.get(a);
  if (/неукомплект|без інструмент|без інструмента/i.test(t)) return 'порожній ложемент / сумка / тримач / візок — інструмента немає';
  if (/^Ремкомплект|запасн/i.test(t)) return 'ремкомплект / запчастини — не набір інструментів';
  if (hasComp(a)) { const leaf = expand(a).filter(x => !x.nonProduct); const pr = new Set(leaf.flatMap(x => x.vals.profil || []));
    return `у складі немає гвинтових профілів — головки, ключі, тріскачки, приладдя${pr.size ? ' (профіль: ' + [...pr].join(', ') + ')' : ''}`; }
  if (CHECKED[a]) return 'гвинтових профілів немає (перевірено вручну 19.10.2026): ' + CHECKED[a];
  return DS(a) ? 'datasheet є, складу в ньому немає — перевірити' : 'datasheet WERA немає'; };
const rows = sets.map(p => { const sk = KEYS.filter(k => v(p, k).length); const other = Object.keys(p.characteristics || {}).filter(k => !KEYS.includes(k) && v(p, k).length);
  return { 'Артикул': p.article, 'Назва': p.title.ua, 'Розділ': `${p.parent.id} ${p.parent.value.split('/').pop()}`, 'Додаткові розділи': (p.alt_parent || []).map(x => x.id).join(', '), 'Видимий': +p.display_in_showcase ? 'так' : 'ні',
    'Datasheet WERA': DS(p.article) ? 'є' : 'немає', 'Склад з datasheet': hasComp(p.article) ? 'є' : 'немає', '… у складі': sk.map(k => ttl[k].replace(' у складі', '')).join(', '),
    'Інші характеристики': other.length, 'Які': other.join(', '), 'Чому без «… у складі»': sk.length ? '' : reason(p), 'Посилання': p.link || '' }; });
const withSk = rows.filter(r => r['… у складі']), without = rows.filter(r => !r['… у складі']), none = rows.filter(r => !r['… у складі'] && !r['Інші характеристики']);
const byReason = {}; for (const r of without) { const k = r['Чому без «… у складі»'].replace(/ \(.*$/, '').replace(/:.*$/, ''); byReason[k] = (byReason[k] || 0) + 1; }
// other characteristics of sets, by characteristic
const chars = {}; for (const p of sets) for (const k of Object.keys(p.characteristics || {})) if (!KEYS.includes(k) && v(p, k).length) chars[k] = (chars[k] || 0) + 1;
const sum = [['Наборів у каталозі (за ознаками вище)', sets.length], ['з них видимих', sets.filter(p => +p.display_in_showcase).length], ['«… у складі» заповнені', withSk.length],
  ['без «… у складі»', without.length], ['без жодної характеристики', none.length], [], ['Без «… у складі» — причина', 'Наборів'], ...Object.entries(byReason).sort((a, b) => b[1] - a[1]), [],
  ['Інші характеристики наборів', 'Наборів'], ...Object.entries(chars).sort((a, b) => b[1] - a[1])];
(async () => { const pageRows = [];
  if (PAGES) { const get = require('../vt/fetchpage.js'); const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const secs = {}; for (const p of sets.filter(p => +p.display_in_showcase && KEYS.some(k => v(p, k).length))) (secs[p.parent.id] = secs[p.parent.id] || []).push(p);
    for (const [s, ps] of Object.entries(secs).sort((a, b) => a[0] - b[0])) { const p = ps.sort((a, b) => Object.keys(b.characteristics).length - Object.keys(a.characteristics).length)[0];
      await new Promise(r => setTimeout(r, 1500)); let h = ''; for (let k = 0; k < 3 && !h; k++) { const r = await get(p.link); if (r.status === 200) h = r.html; else await new Promise(r => setTimeout(r, 5000)); }
      const i = h.indexOf('product-features'); const blk = i < 0 ? '' : h.slice(i, h.indexOf('</table>', i));
      const shown = [...blk.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => [...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x => txt(x[1]))[0]).filter(Boolean);
      const filled = Object.keys(p.characteristics).filter(k => v(p, k).length).length;
      pageRows.push({ 'Розділ': `${s} ${p.parent.value.split('/').pop()}`, 'Наборів з «… у складі»': ps.length, 'Перевірений товар': p.article, 'Рядків на картці': shown.length, 'Заповнено характеристик': filled,
        '«… у складі» на картці': shown.filter(t => / у складі$/.test(t)).length ? 'так' : 'ні', 'Рядки': shown.join(', '), 'Посилання': p.link });
      console.log(s, p.article, shown.length + '/' + filled, shown.filter(t => / у складі$/.test(t)).length ? 'sklad shown' : 'no sklad'); } }
  const wb = X.utils.book_new(); const add = (r, n, w) => { const ws = Array.isArray(r[0]) || !r.length ? X.utils.aoa_to_sheet(r) : X.utils.json_to_sheet(r); if (w) ws['!cols'] = w.map(x => ({ wch: x })); X.utils.book_append_sheet(wb, ws, n); };
  add(sum, 'Зведення', [60, 10]); add(without, 'Без «… у складі»', [14, 70, 40, 12, 8, 10, 10, 20, 10, 50, 80, 60]); add(none, 'Без характеристик', [14, 70, 40, 12, 8, 10, 10, 20, 10, 50, 80, 60]);
  add(rows, 'Усі набори', [14, 70, 40, 12, 8, 10, 10, 30, 10, 50, 60, 60]); if (pageRows.length) add(pageRows, 'Картка товару', [50, 10, 14, 10, 10, 10, 120, 60]);
  X.writeFile(wb, INV + 'sets_audit.xlsx'); console.log(sum.filter(r => r.length).map(r => r.join(': ')).join('\n')); })();
