const puppeteer = require('puppeteer-core'); const OUT = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const m = await b.newPage(); await m.emulate(puppeteer.KnownDevices['iPhone 13']);
  for (const u of ['https://tl-shop.com.ua/khrestovi-biti-phillips/?v=mobile', 'https://tl-shop.com.ua/khrestovi-biti-phillips/?v=mobile', 'https://tl-shop.com.ua/khrestovi-biti-phillips/']) { await m.goto(u, { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 2500)); }
  const info = await m.evaluate(() => ({ w: document.documentElement.clientWidth, mobile: window.SETTINGS ? window.SETTINGS.isMobile : null, filt: [...document.querySelectorAll('a,button,div,span')].filter(e => /фільтр/i.test(e.textContent) && e.children.length <= 2 && e.getBoundingClientRect().height > 0).map(e => e.tagName + '.' + e.className + '|' + e.textContent.trim().slice(0, 25)).slice(0, 6) }));
  console.log(JSON.stringify(info)); await m.screenshot({ path: OUT + 'filters_bits_mobile_list.png' });
  const clicked = await m.evaluate(() => { const e = [...document.querySelectorAll('a,button,div,span')].find(e => /^фільтр/i.test(e.textContent.trim()) && e.children.length <= 2 && e.getBoundingClientRect().height > 0); if (!e) return null; e.click(); return e.className; });
  await new Promise(r => setTimeout(r, 2000)); console.log('clicked', clicked);
  await m.screenshot({ path: OUT + 'filters_bits_mobile_panel.png', fullPage: false });
  const secs = await m.$$eval('.filter-section', l => l.filter(e => e.getBoundingClientRect().height > 0).map(e => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)));
  console.log(JSON.stringify(secs)); await b.close();
})();
