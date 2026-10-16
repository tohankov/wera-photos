// Product-page check of a group's characteristics (read-only, 1.5 s between requests). node cat/page_check.js cat/g_<name>.js [articles...]
const path = require('path'); const get = require('../vt/fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const G = require(path.resolve(process.argv[2])); const live = Object.fromEntries(require('../audit_cache/live.json').map(p => [p.article, p]));
const pick = process.argv.slice(3).length ? process.argv.slice(3) : [...new Set(G.chars.map(c => (G.items.find(i => (i.vals[c.key] || []).length && live[i.a]) || {}).a).filter(Boolean))].slice(0, 5);
async function page(url) { for (let k = 0; k < 3; k++) { await sleep(1500 + 5000 * k); const r = await get(url); if (r.status === 200) return r.html; } return null; }
const txt = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
(async () => { let bad = 0;
  for (const a of pick) { const it = G.items.find(i => i.a === a); const h = await page(live[a].link); if (!h) { console.log(a, 'page not loaded'); bad++; continue; }
    const i = h.indexOf('product-features'); const blk = i < 0 ? '' : h.slice(i, h.indexOf('</table>', i));
    const rows = Object.fromEntries([...blk.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => [...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x => txt(x[1]))).filter(r => r.length >= 2).map(r => [r[0], r[1]]));
    console.log(a, live[a].link); for (const c of G.chars) { const want = (it.vals[c.key] || []); if (!want.length) continue; const got = rows[c.title] || '';
      const ok = want.every(v => got.includes(v)); if (!ok) bad++; console.log(`  ${ok ? 'OK ' : 'НЕТ'} ${c.title}: ${got || '—'}  (ожидалось ${want.join(', ')})`); } }
  console.log('problems', bad); process.exit(0); })().catch(e => { console.error(e); process.exit(1); });
