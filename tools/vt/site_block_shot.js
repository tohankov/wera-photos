// Screenshot of the «Склад набору» block (div.wsb) on the storefront page, opened by Chrome (the site gives plain fetch a JS check):
//   node vt/site_block_shot.js <out dir> <url> [url ...]   -> <out dir>/<last path part>[_ru].png ; prints the block's pictures that did not load
const puppeteer = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/puppeteer-core'); const fs = require('fs'), path = require('path');
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(f => fs.existsSync(f)); const [, , OUT, ...urls] = process.argv;
const sleep = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await puppeteer.launch({ executablePath: exe, headless: 'new' }); const p = await b.newPage(); await p.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  for (const u of urls) { await p.goto(u, { waitUntil: 'networkidle2', timeout: 90000 }); await sleep(2500);
    const el = await p.$('.wsb'); const name = u.replace(/\/$/, '').split('/').pop() + (/\/ru\//.test(u) ? '_ru' : '') + '.png';
    if (!el) { console.log('NO BLOCK', u); continue; }
    await p.evaluate(() => { document.querySelectorAll('.wsb img').forEach(i => { i.loading = 'eager'; }); document.querySelectorAll('.wsb details').forEach(d => { d.open = true; }); });
    await el.scrollIntoView(); await sleep(2500);
    const bad = await p.evaluate(() => [...document.querySelectorAll('.wsb img')].filter(i => !i.complete || !i.naturalWidth).map(i => i.src));
    await el.screenshot({ path: path.join(OUT, name) }); console.log(name, 'pictures not loaded:', bad.length, bad.slice(0, 3).join(' ')); await sleep(1500); }
  await b.close(); })();
