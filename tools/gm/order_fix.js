// «Під замовлення» out of the 22 products of inventory/gm_pid_zamovlennya.xlsx (owner 19.10.2026: everything is in stock).
// Description UA/RU: the made-to-order sentence and the «Уставка: під замовлення, значення вказує покупець» line are rewritten; the WERA fact (factory setting,
// range) stays. «за бажанням замовника / по желанию заказчика» goes too (same meaning). «Опис для маркетплейсів» = gm/mdesc.js clean() of the new description.
// Click-Torque XP 1/2/3 titles (title AND mod_title UA/RU): the format of the 19 torque screwdrivers — «…, заводська уставка моменту <range> WERA <article>».
//   node gm/order_fix.js plan <live export json>   -> inventory/gm_pid_zamovlennya_plan.xlsx + gm/order_fix_plan.json (nothing written to the site)
//   node gm/order_fix.js dry|write                  -> after the owner's «ок»: backup -> dryRun (only these fields) -> import -> export check
const fs = require('fs'), path = require('path'), X = require('xlsx'); const { clean } = require('./mdesc.js');
const [, , MODE, LIVE] = process.argv; const PLAN = path.join(__dirname, 'order_fix_plan.json'); const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const R = [ // [regexp, replacement] — every one must match in every product it is meant for (counted below)
  [/Виготовляється під замовлення: WERA налаштовує момент затягування на заводі під ваше значення в межах діапазону ([^—<\n]+?) — вкажіть потрібний момент при оформленні замовлення\./g, 'WERA налаштовує момент затягування на заводі в межах діапазону $1.'],
  [/Изготавливается под заказ: WERA настраивает момент затяжки на заводе под ваше значение в пределах диапазона ([^—<\n]+?) — укажите нужный момент при оформлении заказа\./g, 'WERA настраивает момент затяжки на заводе в пределах диапазона $1.'],
  [/Уставка: під замовлення, значення вказує покупець/g, 'Уставка: заводська (WERA)'], [/Уставка: под заказ, значение указывает покупатель/g, 'Уставка: заводская (WERA)'],
  [/ за бажанням замовника/g, ''], [/ по желанию заказчика/g, ''] ];
const XP = new Set(['05075670010', '05075671010', '05075672010']);
// number, socket and range are read from the live title: «… Click-Torque XP 1 з уставкою моменту, для змінних інструментів 9×12 мм, 2,5–25 Нм, під замовлення WERA …»
const XPRX = { ua: /Click-Torque XP (\d) з уставкою моменту, для змінних інструментів (\S+ мм), (\S+ Нм), під замовлення WERA/, ru: /Click-Torque XP (\d) с уставкой момента, для сменных инструментов (\S+ мм), (\S+ Нм), под заказ WERA/ };
const xpTitle = (a, t, l) => { const m = t.match(XPRX[l]); if (!m) return null; return l === 'ua' ? `Динамометричний ключ Click-Torque XP ${m[1]} для змінних інструментів ${m[2]}, заводська уставка моменту ${m[3]} WERA ${a}`
  : `Динамометрический ключ Click-Torque XP ${m[1]} для сменных инструментов ${m[2]}, заводская уставка момента ${m[3]} WERA ${a}`; };
const BAD = /під замовлення|под заказ|замовника|заказчика/i;
if (MODE === 'plan') {
  const all = JSON.parse(fs.readFileSync(LIVE, 'utf8')); const by = Object.fromEntries(all.map(p => [p.article, p]));
  const wb0 = X.readFile(INV + 'gm_pid_zamovlennya.xlsx'); const arts = [...new Set(X.utils.sheet_to_json(wb0.Sheets[wb0.SheetNames[0]]).map(r => r['Артикул']))];
  const plan = {}, rows = [], problems = [];
  for (const a of arts) { const p = by[a]; if (!p) { problems.push(a + ' not in export'); continue; } const set = {};
    for (const l of ['ua', 'ru']) { let d = p.description[l]; for (const [re, to] of R) d = d.replace(re, to); if (BAD.test(d)) problems.push(`${a} description ${l} still: ${d.match(BAD)[0]}`);
      if (d !== p.description[l]) { (set.description = set.description || {})[l] = d; }
      const md = clean(d, l); if (BAD.test(md)) problems.push(`${a} md ${l} still has the words`); if (md !== p.marketplace_description[l]) (set.marketplace_description = set.marketplace_description || {})[l] = md; }
    if (XP.has(a)) { set.title = { ua: xpTitle(a, p.title.ua, 'ua'), ru: xpTitle(a, p.title.ru, 'ru') }; if (!set.title.ua || !set.title.ru) problems.push(`${a} XP title not in the expected form`); set.mod_title = { ...set.title }; }
    plan[a] = { set, old: Object.fromEntries(Object.keys(set).map(f => [f, p[f]])) };
    for (const [f, v] of Object.entries(set)) for (const l of ['ua', 'ru']) { if (f === 'description' || f === 'marketplace_description') {
        // only the changed sentences / lines: было → стало
        const o = p[f][l].split(f === 'description' ? /(?<=<\/p>|<\/li>)/ : /\n/), n = v[l].split(f === 'description' ? /(?<=<\/p>|<\/li>)/ : /\n/);
        o.forEach((s, i) => { if (s !== n[i]) rows.push({ 'Артикул': a, 'Назва': p.title.ua, 'Поле': f === 'description' ? 'Опис' : 'Опис для маркетплейсів', 'Мова': l.toUpperCase(),
          'Було': s.replace(/<[^>]+>/g, ''), 'Стало': (n[i] || '').replace(/<[^>]+>/g, '') }); }); if (o.length !== n.length) problems.push(`${a} ${f} ${l} line count changed`); }
      else if (f === 'title') rows.push({ 'Артикул': a, 'Назва': p.title.ua, 'Поле': 'Назва (title і mod_title)', 'Мова': l.toUpperCase(), 'Було': p.title[l], 'Стало': v[l], 'Символів': v[l].length }); } }
  // titles: ≤150 and unique (among themselves and against every live title / mod_title, case and spaces ignored)
  const key = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); const seen = {};
  for (const [a, { set }] of Object.entries(plan)) if (set.title) for (const l of ['ua', 'ru']) { if (set.title[l].length > 150) problems.push(`${a} ${l} title ${set.title[l].length} > 150`); const k = l + key(set.title[l]); if (seen[k]) problems.push(`${a} ${l} title = ${seen[k]}`); seen[k] = a; }
  for (const p of all) for (const l of ['ua', 'ru']) for (const f of ['title', 'mod_title']) { const k = l + key((p[f] || {})[l]); if (seen[k] && seen[k] !== p.article) problems.push(`${seen[k]} ${l} title = ${f} of ${p.article}`); }
  const n = re => Object.values(plan).filter(x => x.old.description && ['ua', 'ru'].some(l => { re.lastIndex = 0; return re.test(x.old.description[l]); })).length;
  console.log('products', Object.keys(plan).length, 'rule hits (products):', R.map(([re]) => n(re)).join(' / '), 'titles', Object.values(plan).filter(x => x.set.title).length, 'problems', problems.length, problems.join('\n'));
  if (problems.length) process.exit(2);
  fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
  const wb = X.utils.book_new(); const ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 60, 22, 6, 90, 90, 8].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Було → стало'); X.writeFile(wb, INV + 'gm_pid_zamovlennya_plan.xlsx');
  console.log('rows', rows.length, '-> inventory/gm_pid_zamovlennya_plan.xlsx, gm/order_fix_plan.json');
} else if (MODE === 'dry' || MODE === 'write') {
  const S = require('../lib/session.js').open(); const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')); const arts = Object.keys(plan);
  const F = ['article', 'title', 'mod_title', 'description', 'marketplace_description', 'parent', 'alt_parent', 'display_in_showcase'];
  const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
  const exp = async () => { const r = await S.call('horoshop_catalog_export', { expr: { article: arts }, includedParams: F, limit: 50, allowLarge: true }); if (!r.response) stop(JSON.stringify(r).slice(0, 300)); return r.response.products; };
  const norm = s => String(s || '').replace(/\r\n/g, '\n').trim();
  (async () => { const before = await exp();
    for (const p of before) for (const [f, v] of Object.entries(plan[p.article].old)) for (const l of ['ua', 'ru']) if (norm(p[f][l]) !== norm(v[l])) stop(`${p.article} ${f} ${l} changed on the site since the plan`);
    const pf = path.join(__dirname, 'order_fix_payload.json'); fs.writeFileSync(pf, JSON.stringify({ products: arts.map(a => ({ article: a, ...plan[a].set })) }));
    const dry = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: true });
    const off = (dry.willChange || []).filter(w => w.isNew || Object.keys(w.changes).some(k => !(k.split('.')[0] in plan[w.article].set))); if (off.length) stop('dryRun outside plan ' + JSON.stringify(off).slice(0, 300));
    console.log('dryRun', (dry.willChange || []).length, 'products, only planned fields'); if (MODE !== 'write') { S.close(); return; }
    fs.writeFileSync(`C:/Users/Techlight/Desktop/wera-photos/backup/order_fix_before_${Date.now()}.json`, JSON.stringify(before));
    const w = await S.call('horoshop_catalog_import', { productsFile: pf, dryRun: false }); console.log('import', w.status, w.updated, '/', w.total, JSON.stringify(w.errors || []).slice(0, 200));
    await new Promise(r => setTimeout(r, 2000)); const after = await exp(); const bad = [];
    for (const p of after) { const b = before.find(x => x.article === p.article); for (const f of F.slice(1)) { const want = plan[p.article].set[f] || b[f];
      if (['parent', 'alt_parent', 'display_in_showcase'].includes(f) ? JSON.stringify(p[f]) !== JSON.stringify(want) : ['ua', 'ru'].some(l => norm(p[f][l]) !== norm(want[l]))) bad.push(`${p.article} ${f}`); } }
    console.log('verify', after.length, 'problems', bad.length, bad.join(', ')); S.close(); if (bad.length) process.exit(2); })().catch(e => { console.error(e); S.close(); process.exit(1); });
}
