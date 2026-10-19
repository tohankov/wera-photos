// Storefront search check (read-only, 2 s between requests): /katalog/search/?q=… UA and /ru/ -> how many products, first articles, is the expected one found.
//   node vt/search_check.js [query=expectedArticle ...]
const get = require('./fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const Q = process.argv.slice(2).length ? process.argv.slice(2).map(x => x.split('=')) : [['05117689001', '05117689001'], ['05006518001', '05006518001'], ['05066335001', '05066335001'],
  ['05003524001', '05003524001'], ['05051012001', '05051012001'], ['05117689', '05117689001'], ['Kraftform Plus 368', '05117689001']];
(async () => { for (const [q, want] of Q) for (const pre of ['', '/ru']) { await sleep(2000);
  const u = `https://tl-shop.com.ua${pre}/katalog/search/?q=${encodeURIComponent(q)}`; const r = await get(u); const h = r.html;
  // the result cards link to the product page; our slugs end with the article («…-wera-05117689001/»)
  const arts = [...new Set([...h.matchAll(/<a\s+href='([^']+)'\s+class="catalogCard-image/g)].map(x => (x[1].match(/-([0-9a-z]+)\/$/i) || [, x[1]])[1]))];
  const cards = (h.match(/class="catalogCard j-catalog-card"/g) || []).length;
  const empty = /Немає товарів|Нет товаров|ничего не найдено|нічого не знайдено/i.test(h); const total = (h.match(/Знайдено[^<]{0,40}|Найдено[^<]{0,40}/) || [''])[0];
  console.log(`${pre || 'UA '} «${q}» status ${r.status} products ${arts.length} cards ${cards}${empty ? ' (empty text)' : ''} ${total} | expected ${want}: ${arts.includes(want) ? 'FOUND' : 'no'} | ${arts.slice(0, 6).join(' ')}`); } })();
