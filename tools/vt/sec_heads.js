// Order of the filter blocks in the storefront sidebar of every section of a scan (vt/sec_scan.js), UA and /ru/ (read-only, 1.5 s between pages; resumable):
//   node vt/sec_heads.js <scan.json> <out.json>
// Blocks: «Хіти продажів» (promo stickers block, no heading), price, characteristic filters (data-filter-id + title)
const fs = require('fs'), path = require('path'); const get = require('./fetchpage.js'); const S = require(path.resolve(process.argv[2])); const OUT = process.argv[3];
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}; const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const RE = /<div class="filter-section __promo">([\s\S]*?)<\/ul>|data-filer-name="price"[\s\S]*?<div class="filter-section-h">([\s\S]*?)<\/div>|data-filter-id="(\d+)"[\s\S]*?filter-section-trigger[^>]*>([\s\S]*?)<\/button>/g;
(async () => { for (const [id, s] of Object.entries(S)) { if (out[id]) continue; const rec = {};
  for (const pre of ['', 'ru/']) { let r = null; for (let k = 0; k < 4 && !(r && r.status === 200); k++) { await sleep(1500 + k * 4000); r = await get(s.url.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre)); }
    const h = r.html; const a = h.indexOf('catalog__sidebar'); const side = a >= 0 ? h.slice(a, h.indexOf('</aside>', a)) : '';
    const heads = []; for (const m of side.matchAll(RE)) heads.push(m[1] !== undefined ? 'Хіти продажів' : m[2] !== undefined ? txt(m[2]).replace(/, \S+$/, '') : txt(m[4]));
    rec[pre ? 'ru' : 'ua'] = { status: r.status, heads }; }
  out[id] = rec; fs.writeFileSync(OUT, JSON.stringify(out)); console.log(id, rec.ua.heads.join(' → '), '| ru:', rec.ru.heads.join(' → ')); } })();
