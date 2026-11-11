// KNIPEX article -> our product on techlight-shop.com.ua (search page, product link whose slug ends with the article). Read-only.
//   node vt/knx_find.js "87 11 250" "03 01 160" ...
const get = require('./fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { for (const a of process.argv.slice(2)) { await sleep(1500); const slug = a.toLowerCase().replace(/\s+/g, '-');
  const h = (await get('https://techlight-shop.com.ua/katalog/search/?q=' + encodeURIComponent(a))).html || '';
  const links = [...new Set([...h.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]))].filter(u => new RegExp('-' + slug + '(?:-[a-z]+)?/?$').test(u.replace(/^https?:\/\/[^/]+/, '')));
  console.log(JSON.stringify({ a, links })); } })();
