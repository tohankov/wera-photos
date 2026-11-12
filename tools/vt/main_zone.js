// Main photo on the product page (owner 12.11.2026): where the main picture sits in the photo zone and whether a click in the zone (away from a thin
// strip — 30 % from the top) opens the photo. Screenshots <out>/<art>[_ru]_zone.png and _click.png.
//   node vt/main_zone.js <out dir> <url> [url ...]
const puppeteer = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/puppeteer-core'); const [, , OUT, ...urls] = process.argv;
(async () => { const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' }); const pg = await b.newPage(); await pg.setViewport({ width: 1300, height: 900 });
  for (const u of urls) { const name = (u.match(/(\d{11})\/?$/) || [, 'page'])[1] + (u.includes('/ru/') ? '_ru' : ''); await pg.goto(u, { waitUntil: 'networkidle2', timeout: 90000 }); await new Promise(r => setTimeout(r, 2500));
    const info = await pg.evaluate(() => { const imgs = [...document.querySelectorAll('img')].filter(i => /\/content\/images\//.test(i.currentSrc || i.src) && i.getBoundingClientRect().width > 300);
      const im = imgs[0]; if (!im) return null; let z = im.parentElement; while (z && z.getBoundingClientRect().height < 300 && z.parentElement) z = z.parentElement;
      const r = im.getBoundingClientRect(), q = z.getBoundingClientRect(); return { img: [r.x, r.y, r.width, r.height].map(Math.round), zone: [q.x, q.y, q.width, q.height].map(Math.round) }; });
    if (!info) { console.log(name, 'no main image'); continue; } await pg.screenshot({ path: `${OUT}/${name}_zone.png` });
    const [zx, zy, zw, zh] = info.zone, [ix, iy, iw, ih] = info.img; const cy = Math.round(iy + ih / 2 - (zy + zh / 2));
    await pg.mouse.click(zx + zw / 2, zy + zh * 0.7); await new Promise(r => setTimeout(r, 1500));
    const open = await pg.evaluate(() => !![...document.querySelectorAll('body *')].find(d => { const s = getComputedStyle(d); return (s.position === 'fixed') && d.getBoundingClientRect().width > window.innerWidth * 0.8 && d.getBoundingClientRect().height > window.innerHeight * 0.8 && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.5; }));
    await pg.screenshot({ path: `${OUT}/${name}_click.png` });
    console.log(name, 'img', info.img.join(','), 'zone', info.zone.join(','), 'img centre - zone centre (y)', cy, 'click at 70% of zone opens photo:', open); await pg.keyboard.press('Escape'); }
  await b.close(); })();
