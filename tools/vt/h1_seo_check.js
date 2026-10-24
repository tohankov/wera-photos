// Storefront check after a name write (read-only, 2 s between requests, resumable): h1 (UA and /ru/) = the planned name; and for the SEO check
// (owner 24.10.2026, item д) the page <title>, meta description, the main photo alt — saved as they are, the template's output.
//   node vt/h1_seo_check.js <plan.json {art:{ua,ru}}> <after export.json (links)> <out.json> [budget s=540]
const fs = require('fs'); const get = require('./fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [, , PLAN, AFTER, OUT, B] = process.argv; const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')); const link = Object.fromEntries(JSON.parse(fs.readFileSync(AFTER, 'utf8')).map(p => [p.article, p.link]));
const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}; const T0 = Date.now(), BUD = (+B || 540) * 1000;
const dec = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
(async () => { for (const a of Object.keys(plan)) for (const l of ['ua', 'ru']) { const k = a + ' ' + l; if (res[k] && res[k].ok) continue; if (Date.now() - T0 > BUD - 15000) break;
    const u = l === 'ua' ? link[a] : link[a].replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/'); await sleep(2000); const r = await get(u); const h = r.html || '';
    const h1 = dec((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]); const title = dec((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const desc = dec((h.match(/<meta\s+name="description"\s+content="([^"]*)"/) || h.match(/<meta\s+content="([^"]*)"\s+name="description"/) || [])[1]);
    const alt = dec((h.match(/<img[^>]+class="[^"]*(?:gallery|product)[^"]*"[^>]*alt="([^"]*)"/) || h.match(/<img[^>]+alt="([^"]*)"[^>]+class="[^"]*(?:gallery|product)[^"]*"/) || [])[1]);
    res[k] = { status: r.status, ok: r.status === 200 && h1 === plan[a][l], h1, want: plan[a][l], title, desc, alt }; fs.writeFileSync(OUT, JSON.stringify(res, null, 1)); }
  const v = Object.values(res); console.log('checked', v.length, 'of', Object.keys(plan).length * 2, '| h1 ok', v.filter(x => x.ok).length, '| diff', v.filter(x => !x.ok).length);
  for (const [k, x] of Object.entries(res)) if (!x.ok) console.log('DIFF', k, x.status, x.h1, '| want', x.want); })();
