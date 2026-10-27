// Global check items 5, 8, 9 for one group (owner 26.10.2026: «в анализе нет пп. 5, 8, 9»), read-only:
//  5 SEO — own seo_title / seo_description (they override the store template), h1 = mod_title is checked on the storefront by the example;
//  8 PDF and EAN — the «Дізнайтеся більше» block with the WERA datasheet PDF of THIS article (UA and RU), gtin = EAN of the datasheet;
//  9 tails — GRN named in texts / picture names, links in the description that do not answer 200 (each distinct URL once, HEAD, 1 s apart).
//   node cat/global_tails.js <group live.json> <out prefix>   -> <out>.json + .xlsx
const fs = require('fs'), path = require('path'); const X = require('xlsx'); const [, , LIVE, OUT] = process.argv;
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const sleep = ms => new Promise(r => setTimeout(r, ms));
const ean = a => { try { const t = fs.readFileSync(path.join(__dirname, '../batch/ds/' + a + '.txt'), 'utf8'); return (t.match(/EAN:\s*\|\s*(\d{13})/) || [])[1] || null; } catch { return undefined; } };
(async () => { const rows = []; const add = (p, item, what, detail = '') => rows.push({ art: p.article, name: p.mod_title.ua, link: p.link, item, what, detail });
  const links = {};
  for (const p of L) { const a = p.article;
    for (const l of ['ua', 'ru']) { if ((p.seo_title || {})[l]) add(p, 5, `свой seo_title (${l})`, p.seo_title[l]); if ((p.seo_description || {})[l]) add(p, 5, `свой seo_description (${l})`, p.seo_description[l].slice(0, 160)); }
    for (const l of ['ua', 'ru']) { const d = (p.description || {})[l] || ''; const pdf = [...d.matchAll(/href="([^"]*hybris-media\.wera\.de[^"]*)"/g)].map(m => m[1]);
      if (!pdf.length) add(p, 8, `нет PDF паспорта WERA (${l})`); else if (!pdf.some(u => u.includes(a))) add(p, 8, `PDF не этого артикула (${l})`, pdf[0]);
      if (/grn/i.test(d.replace(/\/content\/[^"]+/g, ''))) add(p, 9, `GRN в тексте (${l})`);
      for (const m of d.matchAll(/href="([^"#]+)"/g)) (links[m[1]] = links[m[1]] || new Set()).add(a); }
    if ((p.images || []).some(u => /grn/i.test(u.split('/').pop()))) add(p, 9, 'GRN в имени фото');
    const e = ean(a); const g = String(p.gtin || '').trim();
    if (e === undefined) add(p, 8, 'нет паспорта — EAN не сверить', g); else if (!e) add(p, 8, 'в паспорте нет EAN', g); else if (!g) add(p, 8, 'EAN пустой, в паспорте есть', e); else if (g !== e) add(p, 8, 'EAN ≠ паспорт', `${g} / паспорт ${e}`); }
  // links: 4 at a time, 250 ms apart (wera.de PDFs and our pages; a long list must fit in one foreground run)
  const st = {}; const urls = Object.keys(links); const one = async u => { const url = u.startsWith('/') ? 'https://tl-shop.com.ua' + u : u; if (!/^https?:/.test(url)) return;
    let s = 0; try { const r = await fetch(url, { method: /hybris|\.pdf/.test(url) ? 'HEAD' : 'GET', headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' }); s = r.status; } catch (e) { s = 'ERR ' + e.message.slice(0, 40); }
    st[u] = s; if (s !== 200 && !(s === 403 && /tl-shop\.com\.ua/.test(url))) for (const a of links[u]) add(L.find(p => p.article === a), 9, 'битая ссылка', `${s} ${u}`); };
  for (let i = 0; i < urls.length; i += 4) { await Promise.all(urls.slice(i, i + 4).map(one)); await sleep(250); }
  fs.writeFileSync(OUT + '.json', JSON.stringify({ at: new Date().toISOString(), visible: L.length, rows, links: st }, null, 1));
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.length ? rows : [{ art: 'замечаний нет' }]), 'п. 5, 8, 9'); X.writeFile(wb, OUT + '.xlsx');
  const c = {}; for (const r of rows) c[r.item + ' ' + r.what] = (c[r.item + ' ' + r.what] || 0) + 1; console.log('visible', L.length, 'links', Object.keys(st).length, c); })();
