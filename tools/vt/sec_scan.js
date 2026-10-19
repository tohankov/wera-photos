// Storefront scan of a section subtree, UA and /ru/ (read-only, 1.5 s between pages; resumable — the out file is written after every section):
//   node vt/sec_scan.js <tree.json> <out.json>   (tree.json: [{id, path}], from horoshop_pages_export)
// Per section and language: HTTP status, filter blocks (title, values with counts), every product of the listing (all pages /filter/page=N/, product path).
const fs = require('fs'); const get = require('./fetchpage.js'); const { parse } = require('./filters_scan.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [, , treeFile, outFile] = process.argv; const tree = JSON.parse(fs.readFileSync(treeFile, 'utf8'));
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {}; const U = require('../cat/sec_urls.json');
const page = async url => { let r = null; for (let k = 0; k < 4 && !(r && (r.status === 200 || r.status === 404)); k++) { if (k) await sleep(5000 * k); await sleep(1500); r = await get(url); } return r; };
const cards = h => [...h.matchAll(/<a\s+href='([^']+)'\s+class="catalogCard-image/g)].map(m => m[1]);
(async () => { let S = null;
  for (const s of tree) { if (out[s.id] && out[s.id].ru) continue; let url = U[s.id];
    if (!url) { S = S || require('../lib/session.js').open(); await sleep(1000); const p = await S.call('horoshop_admin_page_get', { id: s.id }); url = `https://tl-shop.com.ua/${p.slug}/`; }
    const rec = { path: s.path, url };
    for (const pre of ['', 'ru/']) { const base = url.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre); const r = await page(base);
      const last = Math.max(1, ...[...r.html.matchAll(/filter\/page=(\d+)\//g)].map(m => +m[1])); const prods = cards(r.html);
      for (let n = 2; n <= last; n++) { const q = await page(`${base}filter/page=${n}/`); prods.push(...cards(q.html)); }
      rec[pre ? 'ru' : 'ua'] = { status: r.status, pages: last, products: [...new Set(prods.map(p => p.replace(/^\/ru\//, '/')))], filters: parse(r.html).map(f => ({ id: f.id, title: f.title, vals: f.vals.map(v => ({ text: v.text, n: v.n })) })) }; }
    out[s.id] = rec; fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
    console.log(s.id, rec.ua.status, rec.ua.products.length, rec.ru.products.length, rec.ua.filters.map(f => `${f.title}(${f.vals.length})`).join(', ')); }
  if (S) S.close(); })();
