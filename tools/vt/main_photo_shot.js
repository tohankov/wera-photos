// Screenshot of the product gallery (main photo) on the live page: node vt/main_photo_shot.js <url> <out.png>
const puppeteer = require('puppeteer-core'); const [, , url, out] = process.argv;
(async () => { const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' }); const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 }); await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  const el = await p.$('.product__section--gallery') || await p.$('body'); const src = await p.evaluate(() => (document.querySelector('.gallery__photo-img') || {}).src); console.log('main img', src);
  await el.screenshot({ path: out }); await b.close(); })();
