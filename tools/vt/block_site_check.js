// Storefront check after a set-block write: every product of the plan, UA and /ru/ — the block (div.wsb) is on the page, its card count = the plan's,
// every picture of the block answers 200 from our domain. Resumable (out file).   node vt/block_site_check.js <plan.json> <all.json> <out.json>
const fs = require('fs'), path = require('path'); const get = require('./fetchpage.js'); const [, , PL, ALL, OUT] = process.argv;
const P = JSON.parse(fs.readFileSync(PL, 'utf8')); const L = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p]));
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}; const sleep = ms => new Promise(r => setTimeout(r, ms)); const seen = {};
const pic = async u => { if (seen[u]) return seen[u]; const r = await fetch(u.startsWith('/') ? 'https://tl-shop.com.ua' + u : u, { method: 'HEAD', headers: { 'user-agent': 'Mozilla/5.0' } }); return seen[u] = r.status; };
(async () => { for (const [a, x] of Object.entries(P.products)) { if (out[a] && out[a].ok) continue; const r = { ok: true };
    for (const l of ['ua', 'ru']) { const link = L[a].link; const u = l === 'ua' ? link : link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/'); await sleep(1500); const h = (await get(u)).html || '';
      const i = h.indexOf('class="wsb"'); const want = (x.new[l].match(/Арт\. /g) || []).length;
      if (i < 0) { r[l] = 'NO BLOCK (cache?)'; r.ok = false; continue; } const end = h.indexOf('</p></div>', h.indexOf(l === 'ua' ? 'Склад — за' : 'Состав — по', i)); const b = h.slice(i, end);
      const cards = (b.match(/Арт\. /g) || []).length; const imgs = [...b.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]); const bad = [];
      for (const s of imgs) { if (!/^(https:\/\/tl-shop\.com\.ua)?\/content\//.test(s)) { bad.push('foreign ' + s); continue; } const st = await pic(s); if (st !== 200) bad.push(st + ' ' + s); }
      r[l] = `cards ${cards}/${want}, pictures ${imgs.length}` + (bad.length ? ', BAD ' + bad.join(' ') : ''); if (cards !== want || bad.length) r.ok = false; }
    out[a] = r; fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); if (!r.ok) console.log(a, JSON.stringify(r)); }
  const v = Object.values(out); console.log('checked', v.length, 'ok', v.filter(x => x.ok).length); })();
