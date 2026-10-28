// h1 of renamed products on the storefront, UA and /ru/, against a names set plan.   node vt/h1_check.js <set.json> <all.json> [step=1]
const get = require('./fetchpage.js'); const fs = require('fs'); const [, , SET, ALL, STEP] = process.argv; const P = JSON.parse(fs.readFileSync(SET, 'utf8'));
const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const dec = s => s.replace(/<[^>]+>/g, '').replace(/&#8243;|&Prime;/g, '″').replace(/&times;/g, '×').replace(/&#039;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
(async () => { let ok = 0, n = 0; const arts = Object.keys(P).filter((a, i) => i % (+STEP || 1) === 0);
  for (const a of arts) for (const l of ['ua', 'ru']) { const u = l === 'ua' ? A[a].link : A[a].link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/'); await new Promise(r => setTimeout(r, 1500)); n++;
    const h = (await get(u)).html || ''; const m = dec((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]); if (m === P[a][l].replace(/'/g, "'")) ok++; else console.log(a, l, 'h1:', m, '| plan:', P[a][l]); }
  console.log('h1 ok', ok, 'of', n); })();
