const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36');
  const r = await p.goto('https://grn-tools.com.ua/robots.txt', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('status', r && r.status());
  const t = await p.evaluate(() => document.body.innerText);
  require('fs').writeFileSync('grn/robots.txt', t); console.log(t.slice(0, 3000));
  await b.close();
})();
