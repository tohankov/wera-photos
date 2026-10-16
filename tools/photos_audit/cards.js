// Main photo of every card in a category listing vs the export's first image. node photos_audit/cards.js <slug> [pages]
const get = require('../vt/fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms)); const live = require('../audit_cache/live.json');
const by = Object.fromEntries(live.map(x => [x.link.replace('https://tl-shop.com.ua', ''), x]));
const re = /href='(\/[^']+\/)'\s+class="catalogCard-image[\s\S]{0,900}?class='catalogCard-img'[^>]*?src='([^']+)'/g;
module.exports = async function cards(slug, maxPages = 15) { const rows = [];
  for (let pg = 1; pg <= maxPages; pg++) { await sleep(1500); const r = await get(`https://tl-shop.com.ua/${slug}/` + (pg > 1 ? `filter/page=${pg}/` : '')); if (r.status !== 200) break; let f = 0;
    for (const m of r.html.matchAll(re)) { f++; const p = by[m[1]]; const key = (m[2].match(/\/(\d+)\.\w+$/) || [])[1]; const keys = p ? p.images.map(u => (u.match(/\/(\d+)(?:_\+[^.]+)?\.\w+$/) || [])[1]) : []; rows.push({ a: p ? p.article : m[1], key, pos: keys.indexOf(key) }); }
    if (!f) break; }
  return rows; };
if (require.main === module) module.exports(process.argv[2], +process.argv[3] || 15).then(r => { console.log('cards', r.length, 'main≠first', r.filter(x => x.pos !== 0).length, JSON.stringify(r.filter(x => x.pos !== 0).slice(0, 10))); process.exit(0); });
