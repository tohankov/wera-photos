// Product photos of given articles on grn-tools.com.ua (only for the photo check of deferred group-А articles).
// robots.txt: product pages allowed, Crawl-delay 10 -> one request every >=10 s (pages and images alike). Plain Chrome via puppeteer.
// node grn/photos.js <batch.json>  -> grn_img/<art>_<n>.<ext> + grn_img/index.json
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path');
const arts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = require('C:/Users/Techlight/Desktop/wera-photos/inventory/grn_progress.json').rows;
const OUT = path.join(__dirname, '../grn_img'); fs.mkdirSync(OUT, { recursive: true });
const IDX = path.join(OUT, 'index.json'); const index = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, 'utf8')) : {};
let last = 0; const gap = async () => { const w = last + 10500 - Date.now(); if (w > 0) await new Promise(r => setTimeout(r, w)); last = Date.now(); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36');
  await p.setRequestInterception(true); p.on('request', r => (['image', 'media', 'font'].includes(r.resourceType()) ? r.abort() : r.continue())); // page only; images fetched one by one below
  for (const a of arts) {
    if (index[a] && index[a].done) continue;
    const url = (rows[a] || {}).url || `https://grn-tools.com.ua/ru/${a}`;
    await gap(); const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const imgs = await p.evaluate(() => { const s = new Set(); document.querySelectorAll('#content .thumbnails a[href], #content a.thumbnail[href], #content [data-zoom-image], #content .product-image a[href]').forEach(e => { const u = e.getAttribute('data-zoom-image') || e.getAttribute('href'); if (u && /\.(jpe?g|png|webp)(\?|$)/i.test(u)) s.add(new URL(u, location.href).href); });
      if (!s.size) document.querySelectorAll('#content img').forEach(i => { const u = i.getAttribute('src'); if (u && /\/image\/(cache\/)?catalog\//.test(u)) s.add(new URL(u, location.href).href); });
      return [...s]; });
    const files = [];
    for (const [n, u] of imgs.slice(0, 4).entries()) {
      await gap(); const res = await p.evaluate(async u => { const r = await fetch(u); const b = new Uint8Array(await r.arrayBuffer()); return { s: r.status, t: r.headers.get('content-type'), d: Array.from(b) }; }, u);
      if (res.s === 200 && /image/.test(res.t)) { const ext = /png/.test(res.t) ? 'png' : /webp/.test(res.t) ? 'webp' : 'jpg'; const f = `${a}_${n + 1}.${ext}`; fs.writeFileSync(path.join(OUT, f), Buffer.from(res.d)); files.push({ f, url: u }); }
    }
    index[a] = { page: url, status: r && r.status(), images: files, done: true }; fs.writeFileSync(IDX, JSON.stringify(index, null, 1));
    console.log(a, r && r.status(), 'images', imgs.length, 'saved', files.length);
  }
  await b.close();
})();
