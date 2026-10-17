// Storefront check of written titles (read-only, 2 s between requests): the product page h1 (UA and /ru/) equals the planned title. node names/page_check.js <articles...>
const fs = require('fs'), path = require('path'); const get = require('../vt/fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const M = require('./final.js').expected(); const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const live = {}; for (const f of fs.readdirSync(BK).filter(f => /^names_(title|both|words)_b\d+_after\.json$/.test(f))) for (const p of JSON.parse(fs.readFileSync(BK + f, 'utf8'))) live[p.article] = p;
const h1 = h => ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
(async () => { let ok = 0, n = 0;
  for (const a of process.argv.slice(2)) { const u = live[a].link; for (const [lang, url] of [['ua', u], ['ru', u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/')]]) { await sleep(2000); n++;
    const r = await get(url); const t = r.status === 200 ? h1(r.html) : `HTTP ${r.status}`; const good = t === M[a][lang]; if (good) ok++; console.log(good ? 'OK ' : 'DIFF', a, lang, t, good ? '' : `\n     want ${M[a][lang]}`); } }
  console.log(`storefront ${ok}/${n}`); })();
