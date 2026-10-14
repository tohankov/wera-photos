// Append the datasheet block («Технічний паспорт (PDF)», same markup as on our other products) to the END of the UA/RU description
// of existing products that have none. One chunk per run:  node lib/pdf_add.js <listFile> <chunkNo> [size=50]
// Backup -> payload = old + block (checked) -> import dryRun: only description.ua/ru of these products, else STOP -> import ->
// export after: description must be exactly old + block, every other field unchanged, else STOP.
const fs = require('fs'), path = require('path'); const { datasheet } = require('../vt/table2.js'); const S = require('./session.js').open();
const [, , listFile, chunkNo, sizeArg] = process.argv; const size = +(sizeArg || 50), k = +chunkNo;
const all = JSON.parse(fs.readFileSync(listFile, 'utf8')); const arts = all.slice(k * size, k * size + size);
const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', TMP = path.join(__dirname, `../fix/pdf_add_${k}.json`);
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const fields = ['article', 'parent_article', 'title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description'];
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
(async () => {
  if (!arts.length) stop('empty chunk');
  const before = (await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: fields, limit: 200, allowLarge: true })).response.products;
  if (before.length !== arts.length) stop(`export before: ${before.length} of ${arts.length}`);
  fs.writeFileSync(BK + `pdf_add_${k}_before.json`, JSON.stringify(before));
  const block = (a, l) => datasheet(l, a, 'ru');
  const products = before.map(p => { if (/\.pdf"/i.test(p.description.ua + p.description.ru)) stop('already has a PDF link: ' + p.article); return { article: p.article, description: { ua: p.description.ua + block(p.article, 'ua'), ru: p.description.ru + block(p.article, 'ru') } }; });
  for (const q of products) { const b = before.find(x => x.article === q.article); for (const l of ['ua', 'ru']) if (!q.description[l].startsWith(b.description[l]) || q.description[l].slice(b.description[l].length) !== block(q.article, l)) stop('payload is not old+block: ' + q.article); }
  fs.writeFileSync(TMP, JSON.stringify({ products }));
  const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true });
  const off = (dry.willChange || []).filter(w => w.isNew || !arts.includes(w.article) || Object.keys(w.changes || {}).sort().join(',') !== 'description.ru,description.ua');
  if (off.length || (dry.willChange || []).length !== arts.length) stop('dryRun outside plan: ' + JSON.stringify(off.map(w => [w.article, Object.keys(w.changes || {})])) + ` (willChange ${(dry.willChange || []).length})`);
  const w = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false });
  if ((w.errors || []).length) stop('import errors: ' + JSON.stringify(w.errors).slice(0, 300));
  const after = (await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: fields, limit: 200, allowLarge: true })).response.products;
  fs.writeFileSync(BK + `pdf_add_${k}_after.json`, JSON.stringify(after));
  const bad = [];
  for (const b of before) { const y = after.find(x => x.article === b.article); if (!y) { bad.push(b.article + ' missing'); continue; }
    for (const f of Object.keys(b)) if (f !== 'description' && JSON.stringify(b[f]) !== JSON.stringify(y[f])) bad.push(`${b.article} ${f}`);
    // Horoshop collapses raw CR/LF/TAB between tags into spaces on save (seen on 05049055001) — accepted, logged; any other difference stops
    const ws = s => s.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
    for (const l of ['ua', 'ru']) { const e = b.description[l] + block(b.article, l); if (y.description[l] === e) continue;
      if (ws(y.description[l]) === ws(e)) console.log(`note: ${b.article} ${l}: only whitespace normalised by Horoshop`); else bad.push(`${b.article} description.${l} ≠ old+block`); } }
  if (bad.length) stop('verify: ' + bad.slice(0, 10).join('; ') + (bad.length > 10 ? ` (+${bad.length - 10})` : ''));
  fs.unlinkSync(TMP);
  fs.appendFileSync(BK + 'variants_log.jsonl', JSON.stringify({ at: new Date().toISOString(), task: `pdf block added, chunk ${k}: ${arts.length} products` }) + '\n');
  console.log(`DONE chunk ${k}: ${arts.length} products, PDF block appended UA+RU, rest of description and all other fields unchanged`);
  S.close(); process.exit(0);
})().catch(e => { console.error(e); S.close(); process.exit(1); });
