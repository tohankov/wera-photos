// GRN WERA crawl: sitemap (all product URLs) then WERA listing pages (price/stock). robots.txt: Crawl-delay 10 -> one request per 10 s.
// Resumable: inventory/grn_progress.json (done URLs), inventory/grn_wera.csv (rows), grn/sitemap_urls.json. Stops itself at STOP_AT.
const puppeteer = require('puppeteer-core'), fs = require('fs');
const INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const PROG = INV + 'grn_progress.json', CSV = INV + 'grn_wera.csv', SMAP = 'grn/sitemap_urls.json';
const STOP_AT = process.env.STOP_AT || '17:15';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toTimeString().slice(0, 5);
const prog = fs.existsSync(PROG) ? JSON.parse(fs.readFileSync(PROG, 'utf8')) : { done: [], queue: [], rows: {} };
const save = () => {
  fs.writeFileSync(PROG, JSON.stringify(prog, null, 1));
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  fs.writeFileSync(CSV, '\ufeffarticle;price;stock;grn_section;grn_url\n' + Object.values(prog.rows).map(r => [r.article, r.price, r.stock, r.section, r.url].map(esc).join(';')).join('\n'));
};
const norm = s => { const m = String(s).replace(/\s/g, '').match(/(?:^|\D)0?(5\d{9})(?!\d)/); return m ? '0' + m[1] : null; };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36');
  let last = 0;
  const go = async url => { const w = 10500 - (Date.now() - last); if (w > 0) await sleep(w); last = Date.now(); const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); lastResp = r; return r ? r.status() : 0; };
let lastResp = null;
  // 1) sitemap: every product URL (the GRN product URL is the article itself)
  if (!fs.existsSync(SMAP)) {
    const urls = new Set(), maps = ['https://grn-tools.com.ua/ru/sitemap.xml'];
    for (let i = 0; i < maps.length && i < 12; i++) {
      const st = await go(maps[i]); const x = lastResp ? await lastResp.text() : '';
      const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
      console.log(now(), 'sitemap', maps[i], st, locs.length);
      for (const l of locs) { if (/\.xml/.test(l)) { if (!maps.includes(l)) maps.push(l); } else urls.add(l); }
    }
    fs.writeFileSync(SMAP, JSON.stringify([...urls]));
    console.log(now(), 'sitemap urls', urls.size, 'article-like', [...urls].filter(u => norm(u.split('/').pop())).length);
  }
  // 2) WERA listing pages
  if (!prog.queue.length && !prog.done.length) prog.queue.push('https://grn-tools.com.ua/ru/ruchniy-instrument/ruchniy-instrument-wera/');
  while (prog.queue.length && now() < STOP_AT) {
    const url = prog.queue.shift(); if (prog.done.includes(url)) continue;
    let st; try { st = await go(url); } catch (e) { console.log('ERR', url, e.message); prog.queue.push(url); continue; }
    if (st === 403 || st === 429) { console.log(now(), 'BLOCKED', st, url); prog.blocked = st; save(); break; }
    const r = await p.evaluate(() => {
      const section = (document.querySelector('h1') || {}).textContent?.trim() || document.title;
      const cards = [...document.querySelectorAll('#content .product-thumb')].map(c => {
        const a = c.querySelector('.caption a') || c.querySelector('a'); const t = c.innerText;
        const price = (c.querySelector('p.price .price-new') || c.querySelector('p.price') || {}).innerText || '';
        const stock = ((c.querySelector('p.text-stock') || {}).innerText || '').trim();
        return { href: a && a.href, title: a && a.textContent.trim(), price, stock, sku: ((c.querySelector('.sku') || {}).innerText || '').trim() };
      });
      const links = [...document.querySelectorAll('a')].map(a => a.href.split('#')[0]).filter(h => /\/ru\/ruchniy-instrument\/ruchniy-instrument-wera\//.test(h) && !/[?&](sort|order|limit|filter|mfp|search|tag)=/.test(h));
      return { section, cards, links };
    });
    for (const c of r.cards) { const art = norm(c.sku) || norm(c.href ? c.href.split('/').pop() : '') || norm(c.title || ''); if (!art) continue;
      const price = (c.price.match(/[\d\s]+(?:[.,]\d+)?/g) || []).map(x => +x.replace(/\s/g, '').replace(',', '.')).filter(Boolean).pop();
      const old = prog.rows[art]; if (!old || old.price === '' || old.price === undefined) prog.rows[art] = { article: art, price: price ?? '', stock: c.stock, section: (old && old.section !== 'WERA' ? old.section : r.section), url: c.href }; }
    for (const l of r.links) if (!prog.done.includes(l) && !prog.queue.includes(l) && l !== url) prog.queue.push(l);
    prog.done.push(url); save();
    console.log(now(), st, url.replace('https://grn-tools.com.ua/ru/ruchniy-instrument/ruchniy-instrument-wera/', ''), 'cards', r.cards.length, 'rows', Object.keys(prog.rows).length, 'queue', prog.queue.length);
  }
  save(); console.log(now(), 'stopped; done pages', prog.done.length, 'queue left', prog.queue.length, 'rows', Object.keys(prog.rows).length);
  await b.close();
})();
