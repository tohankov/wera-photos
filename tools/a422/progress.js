// inventory/add_422_progress.json + created_today.xlsx + deferred.xlsx.
// Created = every article of tools/batches/<name>/batch.json that has a final URL in that batch's links.json.
// Deferred = tools/a422/deferred.json (appended by lib/run_batch.js and by hand) + articles with no price anywhere.
const ExcelJS = require('exceljs'), fs = require('fs'), path = require('path');
const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const CL = require('./classified.json'), P = require('./price.json');
const BD = path.join(__dirname, '../batches');
const batches = fs.readdirSync(BD).filter(n => fs.existsSync(path.join(BD, n, 'batch.json'))).sort((a, b) => (a === 'pilot' ? -1 : b === 'pilot' ? 1 : a.localeCompare(b, 'en', { numeric: true })))
  .map(n => ({ name: n, dir: path.join(BD, n), arts: require(path.join(BD, n, 'batch.json')), links: path.join(BD, n, 'links.json') }));
const titleOf = (b, a) => { const f = path.join(b.dir, 'payload_new.json'); if (!fs.existsSync(f)) return ''; const p = require(f).products.find(x => x.article === a); return p ? p.title.ua : ''; };
const DEF = path.join(__dirname, 'deferred.json');
const grp = Object.fromEntries(CL.map(r => [r.article, r.group]));
(async () => {
  const created = [];
  for (const b of batches) { if (!fs.existsSync(b.links)) continue; const L = JSON.parse(fs.readFileSync(b.links, 'utf8')); for (const a of b.arts) if (L[a]) created.push({ batch: b.name, article: a, group: grp[a], title: titleOf(b, a), price: P[a]?.price, url: 'https://tl-shop.com.ua' + L[a] }); }
  const done = new Set(created.map(c => c.article));
  const deferred = [...JSON.parse(fs.readFileSync(DEF, 'utf8')).filter(d => !done.has(d.article)),
    ...CL.filter(r => r.group !== 'Знятий' && P[r.article]?.price == null).map(r => ({ article: r.article, reason: 'нет цены ни на сайте GRN, ни в прайсе', group: r.group, proposal: r.section ? r.section.parent + ' ' + r.section.parentName : '' }))];
  const def = new Set(deferred.map(d => d.article));
  const part = g => { const all = CL.filter(r => r.group === g); return { total: all.length, created: all.filter(r => done.has(r.article)).length, deferred: all.filter(r => def.has(r.article)).length, remaining: all.filter(r => !done.has(r.article) && !def.has(r.article)).map(r => r.article) }; };
  const A = part('А'), B = part('Б');
  const prog = { updated: new Date().toISOString(), created: created.length, createdByBatch: Object.fromEntries(batches.map(b => [b.name, created.filter(c => c.batch === b.name).length])),
    groupA: A, groupB: B, groupV: { total: CL.filter(r => r.group === 'В').length, note: 'не создаём; предложение в group_v_proposal.xlsx' },
    deferred: deferred.length, nextStep: A.remaining.length ? 'группа А: remaining' : B.remaining.length ? 'группа Б: remaining' : 'всё',
    howTo: 'tools/README.md; бэкапы соседей backup/<batch>_neighbours_before.json' };
  fs.writeFileSync(INV + 'add_422_progress.json', JSON.stringify(prog, null, 1));
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Создано'); ws.columns = [['batch', 'Партия', 10], ['article', 'Артикул', 14], ['group', 'Группа', 7], ['title', 'Название UA', 80], ['price', 'Цена', 9], ['url', 'Ссылка', 90]].map(([key, header, width]) => ({ key, header, width }));
  created.forEach(c => ws.addRow(c)); ws.getRow(1).font = { bold: true }; ws.views = [{ state: 'frozen', ySplit: 1 }]; await wb.xlsx.writeFile(INV + 'created_today.xlsx');
  const wd = new ExcelJS.Workbook(); const wsd = wd.addWorksheet('Отложено'); wsd.columns = [['article', 'Артикул', 14], ['group', 'Группа', 7], ['reason', 'Причина', 70], ['proposal', 'Предложенный раздел', 70]].map(([key, header, width]) => ({ key, header, width }));
  deferred.forEach(d => wsd.addRow(d)); wsd.getRow(1).font = { bold: true }; wsd.views = [{ state: 'frozen', ySplit: 1 }]; await wd.xlsx.writeFile(INV + 'deferred.xlsx');
  const why = {}; for (const d of deferred) { const k = d.reason.split(':')[0].slice(0, 70); why[k] = (why[k] || 0) + 1; }
  console.log(JSON.stringify({ created: prog.created, byBatch: prog.createdByBatch, A: { ...A, remaining: A.remaining.length }, B: { ...B, remaining: B.remaining.length }, deferred: deferred.length, why }));
})();
