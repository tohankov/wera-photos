// Rule А decisions (made by eye on the photos_audit/cmp_sheets.js sheets, kept in a decisions module {sheet: {old, why, dsWrong, dsOther}}) -> control CSV
// of the group: every visible product — keep ours / main = the WERA datasheet picture / main = wera.de / question.   node photos_audit/cmp_decide.js <live> <cmp dir> <decisions.js> <out.csv>
const fs = require('fs'), path = require('path'); const ds = require('../names/ds.js'); const [, , LIVE, W, DEC, OUT] = process.argv;
const c = JSON.parse(fs.readFileSync(path.join(W, 'cmp.json'), 'utf8')); const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1 && c[p.article]); const D = require(path.resolve(DEC));
const dec = {}; for (const v of Object.values(D)) { for (const a of (v.old || '').split(/\s+/).filter(Boolean)) dec[a] = { d: c[a] && c[a].wera && !/x/.test(c[a].ds || '') ? 'главное — фото WERA (wera.de, без фона)' : 'главное — фото паспорта WERA этого артикула (без фона)', why: v.why || 'старая версия' };
  for (const a of (v.dsWrong || '').split(/\s+/).filter(Boolean)) dec[a] = { d: 'вопрос', why: 'в паспорте фото другого размера' }; for (const a of (v.dsOther || '').split(/\s+/).filter(Boolean)) dec[a] = { d: 'вопрос', why: 'в паспорте гравировка другого артикула' }; }
const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"'; const rows = L.map(p => { const x = dec[p.article] || { d: 'оставить наше (то же фото)', why: '' }; return [p.article, p.mod_title.ua, (ds(p.article) || {}).series || '', x.d, x.why]; });
fs.writeFileSync(OUT, '\ufeff' + ['Артикул;Название;Серия WERA;Решение;Почему', ...rows.map(r => r.map(q).join(';'))].join('\n'));
const cnt = {}; for (const r of rows) cnt[r[3]] = (cnt[r[3]] || 0) + 1; console.log(OUT, cnt);
