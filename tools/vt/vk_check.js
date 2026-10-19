// Storefront check of the «Викрутки» filters after the owner's admin setup (read-only, 1.5 s between pages), UA and /ru/:
//   node vt/vk_check.js <live.json> <scan.json> <out.json>   (live.json: lib/full_export.js with characteristics,link,parent,alt_parent,display_in_showcase; scan.json: vt/sec_scan.js)
// 1) AND queries in the set sections (/<section>/filter/sklad_ph=<id>;sklad_pz=<id>/) against the same query computed from the export;
// 2) product cards: rows of the characteristics block (name, value, filter links);
// 3) the «Профіль і розмір» row heading on one card of every section that has the filter.
const fs = require('fs'); const get = require('./fetchpage.js'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const [, , liveF, scanF, outF] = process.argv; const L = JSON.parse(fs.readFileSync(liveF, 'utf8')); const SC = JSON.parse(fs.readFileSync(scanF, 'utf8'));
const ID = {}; for (const p of L) for (const [k, refs] of Object.entries(p.characteristics || {})) for (const x of refs) (ID[k] = ID[k] || {})[x.value.ua] = x.id;
const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number);
const has = (p, k, v) => ((p.characteristics || {})[k] || []).some(x => x.value.ua === v);
const Q = [[1105, 'sklad_ph', 'PH 1', 'sklad_pz', 'PZ 2'], [1129, 'sklad_ph', 'PH 0', 'sklad_tx', 'TX 6'], [1146, 'sklad_ph', 'PH 1', 'sklad_tx', 'TX 5'], [1115, 'sklad_ph', 'PH 2', 'sklad_sl', 'SL 1,2×7,0'],
  [1123, 'sklad_ph', 'PH 2', 'sklad_sl', 'SL 0,8×4,0'], [1137, 'sklad_tx', 'TX 20', 'sklad_hex', 'HEX 5,0']];
const CARDS = ['05008720001', '05138258001', '05022800001', '05051012001'];
const txt = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const card = h => { const i = h.indexOf('product-features'); if (i < 0) return []; const b = h.slice(i, h.indexOf('</table>', i));
  return [...b.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => { const c = [...m[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(x => x[1]); return { name: txt(c[0] || ''), value: txt(c[1] || ''), links: [...(c[1] || '').matchAll(/href='([^']+)'/g)].map(x => x[1]) }; }); };
const arts = h => { const BY = {}; for (const p of L) BY[(p.link || '').replace(/^https?:\/\/[^/]+/, '')] = p.article;
  return [...new Set([...h.matchAll(/<a\s+href='([^']+)'\s+class="catalogCard-image/g)].map(x => BY[x[1].replace(/^\/ru\//, '/')] || x[1]))]; };
const loc = (u, pre) => u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/' + pre);
(async () => { const out = { queries: [], cards: {}, headings: {} };
  for (const [s, k1, v1, k2, v2] of Q) { const exp = L.filter(p => +p.display_in_showcase === 1 && secs(p).includes(s) && has(p, k1, v1) && has(p, k2, v2)).map(p => p.article).sort();
    for (const pre of ['', 'ru/']) { await sleep(1500); const url = `${loc(SC[s].url, pre)}filter/${k1}=${ID[k1][v1]};${k2}=${ID[k2][v2]}/`; const r = await get(url); const got = arts(r.html).sort();
      const ok = r.status === 200 && JSON.stringify(got) === JSON.stringify(exp); out.queries.push({ section: s, path: SC[s].path, query: `${v1} + ${v2}`, lang: pre ? 'ru' : 'ua', status: r.status, got, exp, ok });
      console.log('Q', s, pre || 'ua', v1, '+', v2, r.status, got.length, ok ? 'OK' : 'DIFF exp ' + exp.join(',')); } }
  const LM = Object.fromEntries(L.map(p => [p.article, p]));
  for (const a of CARDS) for (const pre of ['', 'ru/']) { await sleep(1500); const r = await get(loc(LM[a].link, pre)); (out.cards[a] = out.cards[a] || {})[pre ? 'ru' : 'ua'] = card(r.html);
    console.log('card', a, pre || 'ua', out.cards[a][pre ? 'ru' : 'ua'].map(x => `${x.name}: ${x.value}${x.links.length ? ' [' + x.links.length + ']' : ''}`).join(' | ')); }
  for (const [id, s] of Object.entries(SC)) { if (!s.ua.filters.some(f => f.id === '6600')) continue;
    const p = L.find(p => +p.display_in_showcase === 1 && p.parent && +p.parent.id === +id && ((p.characteristics || {}).rozmir_nakonechnyka || []).length); if (!p) continue;
    for (const pre of ['', 'ru/']) { await sleep(1500); const r = await get(loc(p.link, pre)); const row = card(r.html).find(x => /розмір|размер/i.test(x.name));
      (out.headings[id] = out.headings[id] || { path: s.path, article: p.article })[pre ? 'ru' : 'ua'] = row ? { name: row.name, value: row.value, links: row.links.length } : null; }
    console.log('H', id, p.article, JSON.stringify(out.headings[id].ua), JSON.stringify(out.headings[id].ru && out.headings[id].ru.name)); }
  fs.writeFileSync(outF, JSON.stringify(out, null, 1)); })();
