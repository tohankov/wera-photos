// Site search by an article (owner 28.10.2026, rule Г: does the storefront search find a product by its OLD WERA article?): /katalog/search/?q=<query>,
// UA and /ru/ — is the product's link in the results.   node vt/search_check.js <all.json> <out.json> <query>=<article> [...]
const fs = require('fs'); const get = require('./fetchpage.js'); const [, , ALL, OUT, ...Q] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const res = {};
  for (const x of Q) { const [q, a] = x.split('='); const slug = L[a].link.replace(/^https:\/\/[^/]+/, ''); const r = {};
    for (const [l, base] of [['ua', 'https://tl-shop.com.ua'], ['ru', 'https://tl-shop.com.ua/ru']]) { await sleep(1500);
      const h = (await get(`${base}/katalog/search/?q=${encodeURIComponent(q)}`)).html || ''; r[l] = h.includes(l === 'ua' ? slug : '/ru' + slug); }
    res[a] = { q, ...r }; console.log(a, 'q', q, 'UA', r.ua ? 'found' : 'NOT found', 'RU', r.ru ? 'found' : 'NOT found'); }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1)); const v = Object.values(res); console.log('found UA', v.filter(x => x.ua).length, 'RU', v.filter(x => x.ru).length, 'of', v.length); })();
