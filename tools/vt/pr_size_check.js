// Storefront check after «Профіль і розмір» / «… у складі» sizes (read-only, 1.5 s between pages), UA and /ru/:
//   node vt/pr_size_check.js <after.json> <out.json>   (after.json: backup/pr_size_after_*.json — value ids of the written values)
// 1) filter blocks «Профіль і розмір» and «… у складі» of the given sections (values in storefront order, counts);
// 2) AND queries «PH у складі: PH 1» + «PZ у складі: PZ 2» as /<section>/filter/sklad_ph=<id>;sklad_pz=<id>/ (value id, not text);
// 3) product cards: rows of the characteristics block with their filter links.
const fs = require('fs'); const get = require('./fetchpage.js'); const { parse } = require('./filters_scan.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const A = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const U = require('../cat/sec_urls.json');
const ID = {}; for (const p of A) for (const [k, refs] of Object.entries(p.characteristics || {})) for (const x of refs) (ID[k] = ID[k] || {})[x.value.ua] = x.id;
const SEC = { 1108: 'khrestovi-vikrutki-ph-philips-kraftform-plus-seriya-300', 1101: 'vikrutki-torx-kraftform-plus-seriya-300', 1106: null, 1113: null, 1148: null, 1129: null, 1146: null, 1105: null, 1115: null, 1123: null, 1137: null, 1059: null, 1196: null, 1204: null };
const Q = [[1105, 'sklad_ph', 'PH 1', 'sklad_pz', 'PZ 2'], [1129, 'sklad_ph', 'PH 0', 'sklad_tx', 'TX 6'], [1146, 'sklad_ph', 'PH 1', 'sklad_tx', 'TX 5'], [1115, 'sklad_ph', 'PH 2', 'sklad_sl', 'SL 1,2×7,0'],
  [1123, 'sklad_ph', 'PH 2', 'sklad_sl', 'SL 0,8×4,0'], [1137, 'sklad_tx', 'TX 20', 'sklad_hex', 'HEX 5,0']];
const CARDS = ['05051012001', '05008720001', '05138258001', '05028210001', '05022800001', '05030331001', '05006631001', '05057114001', '05059299001', '05051028001', '05027935001'];
const txt = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const card = h => { const i = h.indexOf('product-features'); if (i < 0) return []; const b = h.slice(i, h.indexOf('</table>', i));
  return [...b.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => { const c = [...m[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(x => x[1]); return { name: txt(c[0] || ''), value: txt(c[1] || ''), links: [...(c[1] || '').matchAll(/href='([^']+)'/g)].map(x => x[1]) }; }); };
(async () => { const out = { sections: {}, queries: [], cards: {} }; const S = require('../lib/session.js').open(); const url = async id => { if (U[id]) return U[id]; await sleep(1000); const p = await S.call('horoshop_admin_page_get', { id }); return `https://tl-shop.com.ua/${p.slug}/`; };
  for (const id of Object.keys(SEC)) { const u = await url(id); for (const pre of ['', 'ru/']) { await sleep(1500); const r = await get(u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre)); const f = parse(r.html).filter(x => x.id === '6600' || /у складі|в составе/.test(x.title));
      (out.sections[id] = out.sections[id] || { url: u })[pre ? 'ru' : 'ua'] = { status: r.status, cards: (r.html.match(/class="catalogCard j-catalog-card"/g) || []).length, filters: f.map(x => ({ title: x.title, vals: x.vals.map(v => `${v.text} (${v.n})`) })) };
      console.log(id, pre || 'ua', r.status, f.map(x => `${x.title}: ${x.vals.length}`).join('; ')); } }
  for (const [s, k1, v1, k2, v2] of Q) { const u = await url(s); for (const pre of ['', 'ru/']) { await sleep(1500); const q = `${u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre)}filter/${k1}=${ID[k1][v1]};${k2}=${ID[k2][v2]}/`; const r = await get(q);
      const arts = [...new Set([...r.html.matchAll(/<a\s+href='([^']+)'\s+class="catalogCard-image/g)].map(x => (x[1].match(/(05\d{9})\/$/) || [, x[1]])[1]))];
      out.queries.push({ section: s, query: `${k1}: ${v1} + ${k2}: ${v2}`, lang: pre ? 'ru' : 'ua', url: q, status: r.status, n: arts.length, arts }); console.log('Q', s, pre || 'ua', v1, '+', v2, r.status, arts.length, arts.join(' ')); } }
  const L = Object.fromEntries(A.map(p => [p.article, p])); const links = JSON.parse(fs.readFileSync(process.argv[4] || '', 'utf8') || '{}');
  for (const a of CARDS) { const link = links[a]; if (!link) { console.log('no link', a); continue; } for (const pre of ['', 'ru/']) { await sleep(1500); const r = await get(link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre));
      (out.cards[a] = out.cards[a] || {})[pre ? 'ru' : 'ua'] = card(r.html); } console.log('card', a, out.cards[a].ua.map(x => `${x.name}: ${x.value}${x.links.length ? ' [' + x.links.length + ' links]' : ''}`).join(' | ')); }
  S.close(); fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1)); })();
