// Read-only storefront check: <title>, meta description and h1 of the given URLs (UA, and /ru/ for each), 2 s between requests. node names/seo_check.js <url|article>...
const get = require('../vt/fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const ent = s => s.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pick = (h, re) => ent(((h.match(re) || [])[1] || '').replace(/<[^>]+>/g, ''));
let C = null; const link = a => { if (/^https?:/.test(a)) return a; C = C || require('./catalog_seo.json'); return (C.find(p => p.article === a) || {}).link; };
(async () => { for (const a of process.argv.slice(2)) { const u = link(a); if (!u) { console.log('no link', a); continue; }
    for (const url of [u, u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/')]) { await sleep(2000); const r = await get(url); const h = r.html || '';
      const t = pick(h, /<title>([\s\S]*?)<\/title>/), d = pick(h, /<meta name="description" content="([^"]*)"/);
      console.log(r.status, url, `\n  title (${t.length}): ${t}\n  desc  (${d.length}): ${d}\n  h1: ${pick(h, /<h1[^>]*>([\s\S]*?)<\/h1>/)}`); } } })();
