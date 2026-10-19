// Storefront filters of catalog sections (read-only, 1.5 s between pages): which filter blocks a section shows, their values and counts, value links.
//   node vt/filters_scan.js <out.json> <sectionId,...>   (URL from cat/sec_urls.json, else the section slug from horoshop_admin_page_get)
// A filter link is /<section>/filter/<param name>=<dictionary value id>/ — the value id, not its text.
const fs = require('fs'); const get = require('./fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function parse(h) { const out = [];
  for (const part of h.split(/<div\s+class="filter-section[ "]/).slice(1)) { const id = (part.match(/^[^>]*data-filter-id="(\d+)"/) || [])[1];
    const t = (part.match(/class="filter-section-trigger[^>]*>([\s\S]*?)<\/button>/) || [])[1];
    const vals = [...part.matchAll(/<a\s+class="filter-check[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => ({ text: txt((m[2].match(/filter-title[^>]*>([\s\S]*?)<\/span>/) || [, ''])[1]),
      n: +((m[2].match(/filter-count">(\d+)</) || [])[1] || 0) || null, href: m[1] }));
    if (!t && !vals.length) continue;
    out.push({ id, title: t ? txt(t) : '?', vals }); }
  return out; }
module.exports = { parse };
if (require.main === module) (async () => { const U = require('../cat/sec_urls.json'); const ids = process.argv[3].split(',').map(Number); const out = {};
  let S = null; for (const id of ids) { let url = U[id];
    if (!url) { S = S || require('../lib/session.js').open(); await sleep(1000); const p = await S.call('horoshop_admin_page_get', { id }); url = `https://tl-shop.com.ua/${p.slug}/`; }
    await sleep(1500); let r = null; for (let k = 0; k < 3 && !(r && r.status === 200); k++) { r = await get(url); if (r.status !== 200) await sleep(5000); }
    const cards = (r.html.match(/class="catalogCard j-catalog-card"/g) || []).length; out[id] = { url, status: r.status, cards, filters: parse(r.html) };
    console.log(id, r.status, cards, out[id].filters.map(f => `${f.title}(${f.vals.length})`).join(', ')); }
  if (S) S.close(); fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); })();
