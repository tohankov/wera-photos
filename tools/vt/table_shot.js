// Screenshot of the «Інші варіанти серії» block on the live product page (desktop 1280 or phone 360 with a mobile UA): node vt/table_shot.js <url> <out.png> [phone]
const puppeteer = require('puppeteer-core'); const [, , url, out, mode] = process.argv;
(async () => { const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' }); const p = await b.newPage();
  if (mode === 'phone') await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  await p.setViewport({ width: mode === 'phone' ? 360 : 1280, height: 900, isMobile: mode === 'phone' }); await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  const info = await p.evaluate(() => { const h = [...document.querySelectorAll('h3')].find(x => /Інші варіанти|Другие варианты/.test(x.textContent)); if (!h) return null;
    const t = h.nextElementSibling && h.nextElementSibling.querySelector ? (h.nextElementSibling.matches('table') ? h.nextElementSibling : h.parentElement.querySelector('table')) : null;
    h.scrollIntoView(); const rows = t ? t.querySelectorAll('tbody tr').length : 0; const broken = [...(t ? t.querySelectorAll('img') : [])].filter(i => i.complete && !i.naturalWidth).length; return { h3: h.textContent, rows, broken }; });
  console.log(JSON.stringify(info)); const el = await p.evaluateHandle(() => { const h = [...document.querySelectorAll('h3')].find(x => /Інші варіанти|Другие варианты/.test(x.textContent)); return h ? h.parentElement : document.body; });
  await el.screenshot({ path: out }); await b.close(); })();
