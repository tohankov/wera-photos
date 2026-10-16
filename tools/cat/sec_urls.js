// Storefront URL of catalog sections, read from a product page breadcrumb (read-only, 1.5 s between pages). node cat/sec_urls.js id... -> cat/sec_urls.json
const fs = require('fs'), path = require('path'); const get = require('../vt/fetchpage.js'); const F = path.join(__dirname, 'sec_urls.json');
const U = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {}; const live = require('../audit_cache/live.json'); const T = require('../sections/tree_now.json');
const kids = id => T.filter(c => c.parent == id).map(c => c.id); const sub = id => [id, ...kids(id).flatMap(sub)];
(async () => { for (const id of process.argv.slice(2).map(Number)) { if (U[id]) continue; const p = live.find(x => x.parent.id === id) || live.find(x => sub(id).includes(x.parent.id)); if (!p) { console.log(id, 'no product'); continue; }
    await new Promise(r => setTimeout(r, 1500)); const h = (await get(p.link)).html; const name = T.find(t => t.id === id).title.ua;
    const links = [...h.matchAll(/<a[^>]+href="([^"]+)"[^>]*>\s*(?:<span[^>]*>)?\s*([^<]+?)\s*</g)].filter(m => m[2].trim() === name).map(m => m[1]);
    U[id] = links[0] ? new URL(links[0], 'https://tl-shop.com.ua').href : null; console.log(id, name, U[id]); fs.writeFileSync(F, JSON.stringify(U, null, 1)); } })();
