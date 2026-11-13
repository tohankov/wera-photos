// Storefront check of the square crop in set blocks (owner 13.11.2026): every img.wsq / img.wsc in div.wsb — computed object-fit, rendered 76×46,
// picture loaded (naturalWidth > 0). Opens <details> first.   node vt/wsq_check.js <url> [url ...]
const puppeteer = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/puppeteer-core');
(async () => { const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' }); const pg = await b.newPage(); await pg.setViewport({ width: 1300, height: 900 });
  for (const u of process.argv.slice(2)) { await pg.goto(u, { waitUntil: 'networkidle2', timeout: 90000 });
    const r = await pg.evaluate(async () => { document.querySelectorAll('.wsb details').forEach(d => d.open = true); const im = [...document.querySelectorAll('.wsb img.wsq, .wsb img.wsc')];
      for (const i of im) { i.loading = 'eager'; i.scrollIntoView(); await new Promise(r => setTimeout(r, 60)); } await new Promise(r => setTimeout(r, 1500));
      const bad = im.filter(i => { const s = getComputedStyle(i), q = i.getBoundingClientRect(); return !(i.naturalWidth > 0 && Math.round(q.width) === 76 && Math.round(q.height) === 46 && s.objectFit === (i.classList.contains('wsq') ? 'cover' : 'contain')); });
      return { n: im.length, bad: bad.length, ex: bad.slice(0, 3).map(i => i.src.slice(-30) + ' ' + getComputedStyle(i).objectFit + ' ' + i.naturalWidth) }; });
    console.log(u.slice(-40), JSON.stringify(r)); }
  await b.close(); })();
