// Global check, step а) — analysis of ONE group without writing (docs/global_plan.md, items 1–9). Read-only.
//   node cat/global_check.js <groupId> <group live.json> <catalog live.json (all products)> <out prefix>
//   -> <out>.json (per article findings) + <out>.xlsx (a sheet per item)
// Sources: WERA datasheet (batch/ds, all pages: names/ds.js, cat/ds_comp_all.json), wera.de series page (inventory/wera/pages.json — cat/global_wera.js),
// our export. Nothing is guessed: a finding names its source; «спорное» goes to the owner.
const fs = require('fs'), path = require('path'); const X = require('xlsx');
const ds = require('../names/ds.js'); const { apply, LABEL } = require('../names/rules.js'); const VT = require('../lib/vt.js');
const [, , gid, liveFile, allFile, out] = process.argv;
const L = JSON.parse(fs.readFileSync(liveFile, 'utf8')); const ALL = JSON.parse(fs.readFileSync(allFile, 'utf8')); const byAll = Object.fromEntries(ALL.map(p => [p.article, p]));
const W = require('../../inventory/wera/pages.json'); const COMP = require('./ds_comp_all.json');
const MET = require('../photos_audit/metrics.json'); const met = Object.fromEntries((Array.isArray(MET) ? MET : Object.values(MET)).map(m => [m.a, m]));
const disputed = (() => { try { return X.utils.sheet_to_json(X.readFile(path.join(__dirname, '../../inventory/names_fix_preview.xlsx')).Sheets['Спорные']); } catch { return []; } })();
const DIS = Object.fromEntries(disputed.map(r => [String(r['Артикул']), r]));
const vis = a => byAll[a] && +byAll[a].display_in_showcase === 1;
const ch = (p, k) => (p.characteristics[k] || []).map(v => v.value.ua);
const num = s => String(s).replace(/(\d)\.(\d)/g, '$1,$2'); const nz = v => num(v).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// wera.de «Produktmerkmale» -> our «Особливості викрутки» value (same meaning only); a footnote «Keine …» of the article removes it
const MERK = [[/Sechskantschlüsselhilfe/, 'Допоміжний шестигранник', /Keine Sechskant-Schlüsselhilfe/], [/Sechskantklinge/, 'Шестигранний стрижень', /Keine (?:durchgehende )?Sechskantklinge/],
  [/Haltefunktion/, 'З фіксуючою функцією (HF)', /ohne Haltefunktion/i], [/^ESD/, 'ESD', null], [/^Rostfrei/, 'Нержавіюча сталь', null], [/^Kugelkopf/, 'Кулькова головка', /ohne Kugelkopf/i],
  [/Rapidaptor/, 'Патрон Rapidaptor', null], [/Hohlschaft/, 'Порожнистий стрижень', null]];
const res = []; const sets = []; const vtRows = []; const crumbs = {};
for (const p of L) { const a = p.article; const f = { art: a, name: p.mod_title.ua, sec: p.parent.id, alt: (p.alt_parent || []).map(x => x.id), vis: +p.display_in_showcase === 1, link: p.link, n: {}, list: [] };
  const add = (item, what, detail, src) => f.list.push({ item, what, detail: detail || '', src: src || '' });
  const D = /^\d{11}$/.test(a) ? ds(a) : null; const url = W.art[a]; const wp = url ? W.pages[url] : null;
  const row = {}; if (wp && wp.table && wp.table.arts.includes(a)) { const k = wp.table.arts.indexOf(a); for (const r of wp.table.rows) row[r.label + (r.unit ? ' ' + r.unit : '')] = r.vals[k]; }
  const notes = wp && wp.table && wp.table.notes[a] ? wp.table.notes[a].map(n => wp.notesText[n]).filter(Boolean) : [];
  const vyd = ch(p, 'vyd_instrumentu'); const isSet = vyd.some(v => /^Набір|набором/.test(v)); f.vyd = vyd.join(', '); f.isSet = isSet;
  // ---- 1. names
  for (const l of ['ua', 'ru']) if (p.title[l] !== p.mod_title[l]) add(1, `title ≠ mod_title (${l})`, `title «${p.title[l]}» / mod_title «${p.mod_title[l]}»`);
  for (const l of ['ua', 'ru']) { const r = apply(p.mod_title[l], a); if (r.t !== p.mod_title[l]) add(1, `формат названия (${l})`, `«${p.mod_title[l]}» → «${r.t}» (${r.hit.map(h => LABEL[h] || h).join(', ')})`, 'names/rules.js'); }
  for (const l of ['ua', 'ru']) if (/\((?:SL|PH|PZ|TX|HEX|IP|квадрат)[^)]*,(?=\S)[^)]*\)/.test(p.mod_title[l])) add(1, `нет пробела после запятой в скобках (${l})`, p.mod_title[l], 'формат CLAUDE.md «(SL, PH, PZ)»');
  if (/[A-Za-z0-9]х\d|\dх[A-Za-z0-9]/.test(p.mod_title.ua + ' ' + p.mod_title.ru)) add(1, 'кириллическая «х» в размере', p.mod_title.ua, 'формат «×»');
  const pr = ch(p, 'rozmir_nakonechnyka'), len = ch(p, 'dovzhyna_stryzhnia');
  if (!isSet && pr.length === 1 && D) { // the size in the name = «Профіль і розмір» × length, the numbers = the datasheet line
    const exp = pr[0] + (len.length === 1 ? '×' + len[0].replace(' мм', '') + ' мм' : '');
    // the size at the end of our name, right before «WERA <article>»: an optional profile word + «#2», «5 IP», «1,0×5,5×100 мм», «1/4″×125 мм», «m×40 мм»
    const base = p.mod_title.ua.replace(new RegExp('\\s+WERA\\s+' + a + '$'), '');
    const nameSz = (base.match(/(?:(?:SL|PH|PZ|TX|HEX|IPR?|PL|PH\/S|PZ\/S|Квадрат|TRI-WING®|TORQ-SET®|Pentalobe|Microstix®)\s)?#?(?:\d[\d,\/″]*|[mFх])(?:\s?IPR?)?(?:×#?[\d,\/″]+)+(?:\s?мм)?$|(?:SL|PH|PZ|TX|HEX)\s#?[\d,\/″]+(?:\s?мм)?$/) || [])[0];
    const dsNums = (D.title.match(/\d+(?:[.,]\d+)?/g) || []).map(nz); const expNums = (exp.match(/\d+(?:,\d+)?/g) || []).map(nz);
    const miss = expNums.filter(x => !dsNums.includes(x));
    if (miss.length) add(1, 'размер ≠ паспорт', `ожидалось по характеристикам «${exp}», паспорт «${D.title}»; нет в паспорте: ${miss.join(', ')}`, 'паспорт');
    else if (!nameSz || nameSz.replace(/\s/g, '') !== exp.replace(/\s/g, '')) { const nn = ((nameSz || '').match(/\d+(?:,\d+)?/g) || []).map(nz);
      const kind = !nameSz ? 'размер в названии: нет размера' : nn.join() === expNums.join() ? 'размер в названии: другой формат' : /^SL /.test(pr[0]) && nn.join() === expNums.slice(1).join() ? 'размер в названии: нет толщины шлица' : 'размер в названии ≠ паспорт';
      add(1, kind, `в названии «${nameSz || '—'}», по паспорту «${exp}» (паспорт: «${D.title}»)`, 'паспорт + «Профіль і розмір»'); } }
  if (DIS[a]) add(1, 'спорное название (18.10)', `${DIS[a]['Причина'] || ''} — сейчас «${p.mod_title.ua}», предложение было «${DIS[a]['Предложение UA'] || ''}»`, 'inventory/names_fix_preview.xlsx');
  // ---- 2. characteristics: wera.de facts
  if (wp && !isSet) { const have = ch(p, 'osoblyvosti_vykrutky');
    for (const [re, val, neg] of MERK) { if (!wp.merkmale.some(m => re.test(m))) continue; if (neg && notes.some(n => neg.test(n))) continue;
      if (val === 'Шестигранний стрижень' && ch(p, 'profil').some(v => /HEX|шестигран/i.test(v))) { if (!have.includes(val)) add(2, 'спорно: «Sechskantklinge» у шестигранної викрутки', 'у викрутки HEX шестигранний сам робочий кінець — не особливість', url); continue; }
      if (!have.includes(val)) add(2, 'особенность по wera.de', `«${val}» — wera.de «${wp.merkmale.find(m => re.test(m))}»${notes.length ? '; сноски: ' + notes.join('; ') : ''}`, url); }
    const kl = row['Klingenlänge mm']; if (kl && len.length === 1 && nz(kl) !== nz(len[0].replace(' мм', ''))) add(2, 'длина стрижня ≠ wera.de', `у нас ${len[0]}, wera.de Klingenlänge ${kl} мм`, url);
    if (kl && !len.length) add(2, 'нет «Довжина стрижня»', `wera.de Klingenlänge ${kl} мм`, url); }
  if (!url && /^\d{11}$/.test(a)) add(2, 'нет страницы wera.de', 'wera.de/de/' + a + ' — 404', 'wera.de');
  // ---- 3. sets
  if (isSet || (COMP[a] && COMP[a].flatMap(g => g.items).length > 1)) { const seen = new Set(); const items = [];
    for (const g of COMP[a] || []) for (const x of g.items) { const k = x.art || g.head; if (seen.has(k)) continue; seen.add(k); items.push({ art: x.art, qty: x.qty, head: g.head }); }
    const wi = wp ? wp.setItems.flatMap(i => i.rows.map(r => ({ art: r.art, qty: r.qty, name: i.name }))) : [];
    const k1 = items.filter(i => i.art).map(i => i.art + ':' + i.qty).sort(), k2 = wi.filter(i => i.art).map(i => i.art + ':' + i.qty).sort();
    const cmp = !COMP[a] ? 'нет состава в паспорте' : !wi.length ? (wp ? 'на wera.de нет «Werkzeuge in diesem Set»' : 'нет страницы wera.de') : k1.join() === k2.join() ? 'совпадает' : 'расходится';
    const onSite = items.filter(i => i.art && vis(i.art)).length, noArt = items.filter(i => !i.art).length;
    const shots = [...p.description.ua.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(s => !/\/icons\//.test(s));
    sets.push({ art: a, name: p.mod_title.ua, sec: p.parent.id, positions: items.length, onSite, notOnSite: items.length - onSite - noArt, noArt, cmp,
      onlyDs: k1.filter(x => !k2.includes(x)).join(' '), onlyWera: k2.filter(x => !k1.includes(x)).join(' '), oldShots: shots.length, block: /class="wsb"/.test(p.description.ua) });
    if (cmp === 'расходится') add(3, 'состав: паспорт ≠ wera.de', `только в паспорте: ${k1.filter(x => !k2.includes(x)).join(' ') || '—'}; только на wera.de: ${k2.filter(x => !k1.includes(x)).join(' ') || '—'}`, url);
    if (cmp === 'нет состава в паспорте') add(3, 'нет состава в паспорте', '', 'паспорт');
    if (shots.length) add(3, 'старые картинки в описании', shots.length + ' шт.: ' + shots.slice(0, 3).join(' '), 'описание'); }
  // ---- 4. variant tables
  for (const l of ['ua', 'ru']) { const t = VT.splitTable(p.description[l]); f.n['vt_' + l] = !!t; if (!t) continue;
    const rows = VT.rowsOf(t[1]); const ours = rows.map(r => r.art).filter(Boolean);
    if (l === 'ua') { const wa = wp && wp.table ? wp.table.arts : [];
      for (const r of rows) { if (!r.art || r.art === a) continue; const linked = /<a /.test(r.sup + r.rest) || new RegExp('<a [^>]*>' + r.art).test(t[1]);
        if (!linked && vis(r.art)) add(4, 'нет ссылки на наш товар', r.art + ' есть на сайте', 'таблица'); if (linked && !vis(r.art)) add(4, 'ссылка на скрытый / отсутствующий', r.art, 'таблица'); }
      const missing = wa.filter(x => !ours.includes(x)), extra = ours.filter(x => wa.length && !wa.includes(x));
      if (missing.length) add(4, 'в таблице нет вариантов WERA', missing.map(x => x + (byAll[x] ? (vis(x) ? ' (у нас есть)' : ' (у нас скрыт)') : ' (у нас нет)')).join(', '), url);
      if (extra.length) add(4, 'в таблице есть, на wera.de нет', extra.join(', '), url);
      vtRows.push(...wa.filter(x => !byAll[x]).map(x => ({ series: wp.h1, art: x, from: a }))); }
    if (/<img src="\/content\/uploads\/images\/icons\/[^"]+"[^>]*alt="[^"]+"/.test(t[1]) && l === 'ua') add(8, 'alt у иконок шапки таблицы не пустой', '', 'таблица'); }
  if (f.n.vt_ua !== f.n.vt_ru) add(4, 'таблица только в одном языке', `UA ${f.n.vt_ua ? 'есть' : 'нет'}, RU ${f.n.vt_ru ? 'есть' : 'нет'}`, 'описание');
  if (!f.n.vt_ua && wp && wp.table && wp.table.arts.length > 1 && !isSet) add(4, 'нет таблицы вариантов', `wera.de серия «${wp.h1}», вариантов ${wp.table.arts.length}`, url);
  // ---- 5. description, SEO
  for (const l of ['ua', 'ru']) { const d = p.description[l] || ''; const txt = strip(d.replace(/<h3>(Інші варіанти серії|Другие варианты серии)[\s\S]*?<\/table>[\s\S]*?<\/p>/, ''));
    if (txt.length < 80) add(5, `короткое / пустое описание (${l})`, txt.length + ' знаков', 'описание');
    if (p.seo_title[l]) add(5, `свой SEO title (${l})`, p.seo_title[l], 'товар'); if (p.seo_description[l]) add(5, `свой SEO description (${l})`, p.seo_description[l].slice(0, 120), 'товар');
    if (p.short_description[l]) add(5, `краткое описание заполнено (${l})`, strip(p.short_description[l]).slice(0, 120), 'товар');
    for (const [re, what] of [[/wera\.com\.ua/i, 'ссылка на wera.com.ua'], [/grn-tools|grn\b/i, 'упоминание GRN'], [/<font\b/i, 'тег <font>'], [/font-family/i, 'font-family в стилях'], [/(?:&nbsp;\s*){3,}/, 'цепочка &nbsp;'], [/<p>\s*(?:&nbsp;)?\s*<\/p>/, 'пустой абзац'], [/<span[^>]*style="[^"]*color:\s*(?:#0{3,6}|black)/i, 'чёрный цвет текста (на тёмном сайте не видно)']])
      if (re.test(d)) add(5, `${what} (${l})`, '', 'описание'); }
  if (strip(p.description.ua).slice(0, 200) === strip(p.description.ru).slice(0, 200) && strip(p.description.ua).length > 50) add(5, 'RU описание = UA (не переведено)', '', 'описание');
  // ---- 6. sections: wera.de category
  if (wp) { const c = wp.crumbs.slice(2, -1).join(' › '); f.crumb = c; (crumbs[p.parent.id] = crumbs[p.parent.id] || {})[c] = ((crumbs[p.parent.id] || {})[c] || 0) + 1; }
  // ---- 7. photos
  const ours = (p.images || []).length; f.photos = ours; if (!ours) add(7, 'нет фото', '', 'товар');
  // WERA photos of the product: gallery + details (wide 2026x1140 / 1013x570 — application, «в работе»); pictures of a set's tools («Werkzeuge in diesem Set», 480 px) and related sets are other products
  if (wp) { const other = new Set(wp.setItems.map(i => (i.img || '').split('/').pop()));
    const det = wp.details.filter(d => !other.has(d.file) && !/^\d+x\d+$/.test(d.file) && !/480x480/.test(d.url)); const wm = wp.gallery.length, wide = d => { const [w, h] = d.px.split('x').map(Number); return w / h > 1.4; }, wd = det.filter(d => !wide(d)).length, wa = det.length - wd; f.wera = { main: wm, details: wd, work: wa };
    if (ours < wm + wd + wa) add(7, 'у WERA фото больше', `у нас ${ours}, WERA: главное ${wm}, детали ${wd}, «в работе» ${wa}`, url); }
  const m = met[a]; if (m && m.white > 0.25) add(7, 'главное фото на белом — снять фон', `белого ${Math.round(m.white * 100)} % (снимок 16.10)`, 'photos_audit/metrics.json');
  // ---- 8. misc
  for (const l of ['ua', 'ru']) if (!/\.pdf"/i.test(p.description[l] || '')) add(8, `нет ссылки на паспорт PDF (${l})`, '', 'описание');
  if (D && D.ean) { if (!p.gtin) add(8, 'нет EAN', 'паспорт ' + D.ean, 'паспорт'); else if (p.gtin !== D.ean) add(8, 'EAN ≠ паспорт', `у нас ${p.gtin}, паспорт ${D.ean}`, 'паспорт'); }
  else if (/^\d{11}$/.test(a) && !D) add(8, 'нет паспорта в кэше', '', 'batch/ds');
  // ---- 9. tails
  for (const l of ['ua', 'ru']) for (const s of [...(p.description[l] || '').matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1])) if (!/^(https?:)?\/\//.test(s) && !s.startsWith('/')) add(9, `битый относительный путь картинки (${l})`, s, 'описание');
  if ((p.icons || []).length) add(9, 'стикер', JSON.stringify(p.icons), 'товар');
  res.push(f); }
// sections: products whose wera.de category is not the main one of their section
const secRows = []; for (const f of res) { if (!f.crumb) continue; const c = crumbs[f.sec]; const top = Object.entries(c).sort((x, y) => y[1] - x[1])[0];
  if (top[0] !== f.crumb && top[1] >= 2) { secRows.push({ art: f.art, name: f.name, sec: f.sec, crumb: f.crumb, main: top[0] + ' (' + top[1] + ')' }); f.list.push({ item: 6, what: 'категория wera.de ≠ основная категория раздела', detail: `wera.de «${f.crumb}», у раздела чаще «${top[0]}»`, src: 'wera.de' }); } }
fs.writeFileSync(out + '.json', JSON.stringify({ at: new Date().toISOString(), group: gid, products: res, sets, newVariants: vtRows, crumbs }, null, 1));
const wb = X.utils.book_new(); const NAMES = { 1: '1 Названия', 2: '2 Характеристики', 3: '3 Наборы', 4: '4 Таблицы', 5: '5 Описание SEO', 6: '6 Разделы', 7: '7 Фото', 8: '8 Прочее', 9: '9 Хвосты' };
for (const k of Object.keys(NAMES)) { const rows = res.flatMap(f => f.list.filter(x => x.item === +k).map(x => ({ 'Артикул': f.art, 'Название': f.name, 'Раздел': f.sec, 'Видим': f.vis ? 'да' : 'нет', 'Что': x.what, 'Подробно': x.detail, 'Источник': x.src, 'Ссылка': f.link })));
  X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.length ? rows : [{ 'Артикул': '—' }]), NAMES[k]); }
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(sets), 'Наборы состав'); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(vtRows.length ? vtRows : [{}]), 'Нет у нас (WERA)');
X.utils.book_append_sheet(wb, X.utils.json_to_sheet(secRows.length ? secRows : [{}]), 'Разделы wera.de');
X.writeFile(wb, out + '.xlsx');
const cnt = {}; for (const f of res) for (const x of f.list) { const k = x.item + ' ' + x.what; cnt[k] = (cnt[k] || 0) + 1; }
console.log(Object.entries(cnt).sort().map(([k, v]) => v + '\t' + k).join('\n'));
console.log('sets', sets.length, 'compare', JSON.stringify(sets.reduce((o, s) => (o[s.cmp] = (o[s.cmp] || 0) + 1, o), {})), '| WERA variants not on our site', new Set(vtRows.map(r => r.art)).size);
