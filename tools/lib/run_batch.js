// Full pipeline for one batch of new products, one MCP session, hard stops.
//   node lib/run_batch.js batches/<name>
// Needs in the batch dir: batch.json, content.js, photosrc.json. Writes there: payload_new.json, ids.json, links.json, report.json.
// Steps: backup neighbours -> photos -> preflight (neighbour tables may change ONLY by links; new table rows = series rows)
//   -> git commit+push photos -> import dryRun (only planned fields, all new) -> import -> ids
//   -> form dryRun (only planned fields) -> form + export before/after (no field may change except link; else restore + defer)
//   -> links dryRun (only description of planned products) -> links -> verify vs backup -> storefront check -> progress.
// Anything outside the plan: the article goes to a422/deferred.json and is not written; a batch-wide failure stops the batch.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const V = require('./vt.js'); const { makeBuilder, REPO } = require('./build.js'); const S = require('./session.js').open();
const D = path.resolve(process.argv[2]), NAME = path.basename(D); let B; // builder is created after the neighbour backup (content.js may read it)
const BK = REPO + 'backup/', DEF = path.join(__dirname, '../a422/deferred.json');
const T = require('../a422/tables.json'), CL = Object.fromEntries(require('../a422/classified.json').map(x => [x.article, x]));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const report = { batch: NAME, started: new Date().toISOString(), deferred: [], steps: {} };
const save = () => fs.writeFileSync(path.join(D, 'report.json'), JSON.stringify(report, null, 1));
function defer(a, reason) { const d = JSON.parse(fs.readFileSync(DEF, 'utf8')); if (!d.some(x => x.article === a)) { d.push({ article: a, reason, group: CL[a]?.group || '', proposal: CL[a]?.section ? CL[a].section.parent + ' ' + CL[a].section.parentName : '' }); fs.writeFileSync(DEF, JSON.stringify(d, null, 1)); } report.deferred.push({ article: a, reason }); log('DEFER', a, reason); }
function stop(msg) { report.stopped = msg; save(); log('STOP', msg); S.close(); process.exit(2); }
const call = async (tool, args) => { const r = await S.call(tool, args); if (r && r.raw && r.isError) throw new Error(tool + ': ' + r.raw.slice(0, 300)); return r; };
// fields the import dryRun is allowed to report for one new product, derived from its own payload
const plannedKeys = p => Object.keys(p).filter(k => k !== 'article').flatMap(k => k === 'title' || k === 'description' ? [k + '.ru', k + '.ua'] : k === 'parent' ? ['parent.id'] : [k]).sort().join(',');
const exportArgs = arts => ({ expr: { article: arts }, includedParams: ['article', 'parent_article', 'title', 'slug', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'], limit: 200, allowLarge: true });
const firstSentences = (s, max) => { const parts = s.match(/[^.!?]+[.!?]+/g) || [s]; let out = ''; for (const p of parts) { if ((out + p).trim().length > max) break; out += p; } return (out || parts[0].slice(0, max)).trim(); };

(async () => {
  const RESUME = process.argv[3] === 'resume';
  let arts = JSON.parse(fs.readFileSync(path.join(D, RESUME ? 'batch_final.json' : 'batch.json'), 'utf8')).filter(a => { const d = JSON.parse(fs.readFileSync(DEF, 'utf8')); return !d.some(x => x.article === a); });
  log(NAME, 'articles', arts.length);
  // 1. backup neighbours
  const nbArts = [...new Set(arts.flatMap(a => (T[a]?.unlinked || [])))];
  const nbExp = !nbArts.length ? { response: { products: [] } } : RESUME ? JSON.parse(fs.readFileSync(BK + NAME + '_neighbours_before.json', 'utf8')) : await call('horoshop_catalog_export', exportArgs(nbArts));
  if (!nbExp.response || nbExp.response.products.length !== nbArts.length) stop('neighbour backup incomplete: ' + (nbExp.response ? nbExp.response.products.length : 'error') + ' of ' + nbArts.length);
  if (!RESUME) fs.writeFileSync(BK + NAME + '_neighbours_before.json', JSON.stringify(nbExp)); log(RESUME ? 'resume: backup from file' : 'backup neighbours', nbArts.length);
  B = makeBuilder(D);
  // 2. preflight: the new product's table rows and every neighbour table may change only by links
  for (const a of [...arts]) { const c = B.content[a]; if (!c || /undefined|NaN/.test(JSON.stringify(c))) { defer(a, 'нет данных для названия/текста (undefined в контенте)'); arts = arts.filter(x => x !== a); continue; } }
  for (const a of [...arts]) { if (B.content[a].noTable) continue; if (!B.nbOf(a).length) { defer(a, 'нет соседа с таблицей серии'); arts = arts.filter(x => x !== a); continue; } if (!B.tableRowsOk(a)) { defer(a, 'таблица нового товара не совпадает со строками серии у соседа'); arts = arts.filter(x => x !== a); } }
  const predicted = Object.fromEntries(arts.map(a => [a, '/' + V.slugOf(B.content[a].title.ua) + '/']));
  const pre = B.payloadLinks(arts, predicted);
  for (const p of pre.problems) for (const a of p.affects) if (arts.includes(a)) { defer(a, `у соседа ${p.neighbour} таблица меняется не только ссылками (${p.problem})`); arts = arts.filter(x => x !== a); }
  if (!arts.length) stop('nothing left after preflight');
  fs.writeFileSync(path.join(D, 'batch_final.json'), JSON.stringify(arts));
  let products;
  if (!RESUME) {
  // 3. photos -> repo, commit, push, check raw URLs
  const sharp = require('sharp'); const src = B.load('photosrc.json'); fs.mkdirSync(REPO + 'images/' + NAME, { recursive: true });
  for (const a of arts) await V.squarePhoto(sharp, src[a], REPO + 'images/' + NAME + '/' + a + '.jpg');
  const git = (...g) => execFileSync('git', ['-C', REPO, ...g], { encoding: 'utf8' });
  git('add', 'images/' + NAME);
  if (git('status', '--porcelain', 'images/' + NAME).trim()) { git('-c', 'user.name=tohankov', '-c', 'user.email=tohankov@gmail.com', 'commit', '-q', '-m', `Group A/B ${NAME} (${arts.length}): product photos (own WERA datasheet photo or WERA series photo)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01Bp5k8vtsLiYyyd6p3K1KeK`); }
  git('push', '-q', 'origin', 'main');
  for (const a of arts) { const r = await fetch(`https://raw.githubusercontent.com/tohankov/wera-photos/main/images/${NAME}/${a}.jpg`); if (r.status !== 200) stop('photo not on GitHub: ' + a); }
  report.steps.photos = arts.length; log('photos pushed', arts.length);
  // 4. import dryRun -> import
  products = B.payloadNew(arts); fs.writeFileSync(path.join(D, 'payload_new.json'), JSON.stringify({ products }, null, 1));
  const dry = await call('horoshop_catalog_import', { productsFile: path.join(D, 'payload_new.json'), dryRun: true });
  const offImport = dry.willChange.filter(w => { const p = products.find(x => x.article === w.article); return !p || !w.isNew || Object.keys(w.changes).sort().join(',') !== plannedKeys(p); });
  if (offImport.length || dry.summary.newProducts !== arts.length) stop('import dryRun outside plan: ' + JSON.stringify(offImport.map(w => w.article)));
  const imp = await call('horoshop_catalog_import', { productsFile: path.join(D, 'payload_new.json'), dryRun: false });
  if ((imp.errors || []).length || (imp.newProducts || []).length !== arts.length) stop('import errors: ' + JSON.stringify(imp.errors || imp).slice(0, 400));
  report.steps.created = arts.length; save(); log('created', arts.length);
  } else { const ex = (await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: ['article'], limit: 200 })).response.products; if (ex.length !== arts.length) stop('resume: not all products exist'); log('resume: products exist', ex.length); }
  // 5. ids
  const ids = {}; for (const a of arts) { const r = await call('horoshop_admin_list', { entity: 'products', search: a }); const rec = (r.records || []).filter(x => x.code === a || (x.cells && x.cells[0] === a) || x.label.split(' · ')[0].split(' ').includes(a)); if (rec.length !== 1) stop('id not unique for ' + a); ids[a] = rec[0].id; }
  fs.writeFileSync(path.join(D, 'ids.json'), JSON.stringify(ids, null, 1));
  // 6. form: slug + SEO + guarantee, only planned fields
  const formSet = a => { const c = B.content[a], core = l => c.title[l].replace(` WERA ${a}`, ''); return { 'modifications[0][alias][slug]': V.slugOf(c.title.ua), 'parent_common[i18n][3][seo_title]': `${core('ua')} — WERA ${a}`, 'parent_common[i18n][1][seo_title]': `${core('ru')} — WERA ${a}`, 'parent_common[guarantee_shop]': '2', 'parent_common[guarantee_length]': '12', 'parent_common[i18n][3][seo_description]': firstSentences(c.intro.ua, 160), 'parent_common[i18n][1][seo_description]': firstSentences(c.intro.ru, 160) }; };
  const formOk = [];
  for (const a of arts) { const set = formSet(a); const r = await call('horoshop_admin_record_save', { entity: 'products', id: +ids[a], dryRun: true, set }); const fields = (r.willChange || []).map(w => w.field); if ((r.unknownFields || []).length || fields.some(f => !(f in set))) defer(a, 'форма: dryRun меняет поле вне плана ' + JSON.stringify(fields.filter(f => !(f in set)))); else formOk.push(a); }
  const before = (await call('horoshop_catalog_export', exportArgs(arts))).response.products; fs.writeFileSync(BK + NAME + '_new_before_form.json', JSON.stringify(before));
  for (const a of formOk) { const r = await call('horoshop_admin_record_save', { entity: 'products', id: +ids[a], dryRun: false, set: formSet(a) }); if (!r.saved) defer(a, 'форма: ошибка записи'); }
  const after = (await call('horoshop_catalog_export', exportArgs(arts))).response.products; fs.writeFileSync(BK + NAME + '_new_after_form.json', JSON.stringify(after));
  const restore = [];
  for (const x of before) { const y = after.find(q => q.article === x.article); const diff = Object.keys(x).filter(k => !['link', 'slug'].includes(k) && JSON.stringify(x[k]) !== JSON.stringify(y[k])); if (diff.length) { restore.push({ article: x.article, ...Object.fromEntries(diff.filter(k => ['alt_parent', 'parent', 'price', 'title', 'description', 'display_in_showcase', 'gtin'].includes(k)).map(k => [k, x[k]])) }); defer(x.article, 'форма изменила поля ' + diff.join(',') + ' — восстановлено импортом'); } }
  if (restore.length) { fs.writeFileSync(path.join(D, 'restore.json'), JSON.stringify({ products: restore })); await call('horoshop_catalog_import', { productsFile: path.join(D, 'restore.json'), dryRun: false }); }
  const links = Object.fromEntries(after.filter(p => formOk.includes(p.article) && !restore.some(r => r.article === p.article)).map(p => [p.article, p.link.replace('https://tl-shop.com.ua', '')]));
  for (const [a, l] of Object.entries(links)) if (l !== predicted[a]) { defer(a, 'адрес после формы не совпал с планом: ' + l); delete links[a]; }
  fs.writeFileSync(path.join(D, 'links.json'), JSON.stringify(links, null, 1)); report.steps.formed = Object.keys(links).length; save();
  const linked = Object.keys(links); if (!linked.length) stop('no product passed the form step');
  // 7. links in tables: dryRun may change only description of the planned products
  const lp = B.payloadLinks(linked, links);
  if (lp.problems.length) stop('neighbour tables changed beyond links at links step: ' + JSON.stringify(lp.problems).slice(0, 400));
  fs.writeFileSync(path.join(D, 'payload_links.json'), JSON.stringify({ products: lp.products }));
  if (!lp.products.length) { log('no tables to link (group Б, noTable)'); } else {
  const ld = await call('horoshop_catalog_import', { productsFile: path.join(D, 'payload_links.json'), dryRun: true });
  const offL = ld.willChange.filter(w => w.isNew || Object.keys(w.changes || {}).some(k => !['description.ua', 'description.ru'].includes(k)));
  if (offL.length) stop('links dryRun outside plan: ' + JSON.stringify(offL.map(w => w.article)));
  const lr = await call('horoshop_catalog_import', { productsFile: path.join(D, 'payload_links.json'), dryRun: false });
  if ((lr.errors || []).length) stop('links write errors: ' + JSON.stringify(lr.errors).slice(0, 300));
  }
  // 8. verify neighbours vs backup: only links changed, every new link present
  const nbAfter = nbArts.length ? (await call('horoshop_catalog_export', exportArgs(nbArts))).response.products : []; fs.writeFileSync(BK + NAME + '_neighbours_after.json', JSON.stringify(nbAfter));
  const nbBefore = nbExp.response.products, bad = []; let placed = 0;
  for (const x of nbBefore) { const y = nbAfter.find(q => q.article === x.article); for (const k of Object.keys(x)) if (k !== 'description' && JSON.stringify(x[k]) !== JSON.stringify(y[k])) bad.push(x.article + ' ' + k);
    for (const l of ['ua', 'ru']) { if (V.stripLinks(y.description[l]).replace(/\s+/g, ' ') !== V.stripLinks(x.description[l]).replace(/\s+/g, ' ')) bad.push(x.article + ' ' + l + ' text'); const pre2 = l === 'ru' ? '/ru' : ''; for (const [a, s] of Object.entries(links).filter(([a]) => (T[a]?.unlinked || []).includes(x.article))) { if (y.description[l].includes('href="' + pre2 + s + '">' + a)) placed++; else bad.push(x.article + ' ' + l + ' no link ' + a); } } }
  if (bad.length) { report.verifyProblems = bad; log('VERIFY PROBLEMS', bad.slice(0, 10)); }
  report.steps.neighbours = nbArts.length; report.steps.linksPlaced = placed;
  // 9. storefront: two products, UA + RU
  const get = require('../vt/fetchpage.js'); report.storefront = [];
  for (const a of linked.slice(0, 2)) for (const pre3 of ['', '/ru']) { const r = await get('https://tl-shop.com.ua' + pre3 + links[a]); const h = r.html || ''; report.storefront.push({ a, lang: pre3 || 'ua', status: r.status, title: ((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim().slice(0, 80), table: /Інші варіанти серії|Другие варианты серии/.test(h), pdf: h.includes(a + '.pdf') }); }
  report.finished = new Date().toISOString(); save();
  fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: report.finished, task: `batch ${NAME}: ${linked.length} new, ${nbArts.length} neighbours, ${placed} links`, deferred: report.deferred, verify: bad }) + '\n');
  S.close();
  execFileSync('node', [path.join(__dirname, '../a422/progress.js')], { stdio: 'inherit' });
  log('DONE', NAME, 'created+linked', linked.length, 'deferred', report.deferred.length, 'neighbours', nbArts.length, 'links', placed, 'verify', bad.length ? bad.length + ' problems' : 'ok');
  for (const s of report.storefront) log('  ', s.a, s.lang, s.status, s.title, 'table', s.table, 'pdf', s.pdf);
  process.exit(0);
})().catch(e => { report.error = String(e && e.stack || e); save(); console.error(e); S.close(); process.exit(1); });
