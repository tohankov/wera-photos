// Screenshot of a storefront element (desktop or mobile). node filters/shot.js <url> <selector> <out.png> [mobile]
const puppeteer = require('puppeteer-core'); const [, , url, sel, out, mob] = process.argv;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36');
  await p.setViewport(mob ? { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 } : { width: 1366, height: 900 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); await new Promise(r => setTimeout(r, 2500));
  if (!(await p.$(sel))) await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  const el = await p.$(sel); if (!el) { console.log('selector not found'); await p.screenshot({ path: out, fullPage: false }); } else { await el.scrollIntoView(); await el.screenshot({ path: out }); }
  console.log('saved', out); await b.close();
})();
