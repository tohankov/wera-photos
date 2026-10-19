// Read-only: products with «під замовлення» / «под заказ» in the title, mod_title or description (UA/RU) -> inventory/gm_pid_zamovlennya.xlsx (owner: list, do not change).
// node gm/order_words.js <live catalog export json (article, title, mod_title, description, display_in_showcase)>
const path = require('path'), X = require('xlsx');
const RE = /під\s+замовлення|под\s+заказ/i, all = require(path.resolve(process.argv[2])); const rows = [];
const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
for (const p of all) { const where = [];
  for (const [f, v] of [['title', p.title], ['mod_title', p.mod_title], ['description', p.description]]) for (const l of ['ua', 'ru']) { const t = strip((v || {})[l]); const m = RE.exec(t);
    if (m) where.push({ f: `${f} ${l.toUpperCase()}`, ctx: '…' + t.slice(Math.max(0, m.index - 90), m.index + m[0].length + 60).trim() + '…' }); }
  if (where.length) rows.push({ 'Артикул': p.article, 'Назва': (p.mod_title || {}).ua, 'Видимий': +p.display_in_showcase === 1 ? 'так' : 'ні', 'Де': where.map(w => w.f).join(', '), 'Фрагмент': where.map(w => `[${w.f}] ${w.ctx}`).join('\n') }); }
const wb = X.utils.book_new(), ws = X.utils.json_to_sheet(rows); ws['!cols'] = [14, 70, 8, 30, 120].map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, 'Під замовлення');
X.writeFile(wb, path.join(__dirname, '../../inventory/gm_pid_zamovlennya.xlsx'));
const by = {}; for (const r of rows) for (const w of r['Де'].split(', ')) by[w] = (by[w] || 0) + 1;
console.log('products', rows.length, JSON.stringify(by)); for (const r of rows) console.log(r['Артикул'], r['Видимий'], r['Де'], '|', r['Фрагмент'].split('\n')[0].slice(0, 230));
