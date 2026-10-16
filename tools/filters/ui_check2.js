const puppeteer = require('puppeteer-core'); const OUT = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 }); await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36');
  const url = 'https://tl-shop.com.ua/biti-dlya-gvintiv-iz-vnutrishnim-shestigrannikom/';
  await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 2500)); if (!(await p.$('.filter-section'))) { await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 2500)); }
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.filter-section[data-filter-id="6591"] li.filter-lv1-i')].filter(e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none').length);
  const r = { before: await vis() };
  const clicked = await p.evaluate(() => { const el = [...document.querySelectorAll('.filter-section[data-filter-id="6591"] *')].find(e => /Показати ще/.test(e.textContent) && e.children.length === 0); if (!el) return null; el.click(); return el.tagName + '.' + el.className; });
  await new Promise(x => setTimeout(x, 800)); r.moreElement = clicked; r.after = await vis();
  const st = () => p.evaluate(() => { const s = document.querySelector('.filter-section[data-filter-id="6592"]'); const l = s.querySelector('.filter-list'); return { exp: s.querySelector('.j-filter-collapse-trigger').getAttribute('aria-expanded'), listH: l.getBoundingClientRect().height }; });
  r.lenBefore = await st(); await p.evaluate(() => document.querySelector('.filter-section[data-filter-id="6592"] .j-filter-collapse-trigger').click()); await new Promise(x => setTimeout(x, 900)); r.lenAfterCollapse = await st();
  await p.evaluate(() => document.querySelector('.filter-section[data-filter-id="6592"] .j-filter-collapse-trigger').click()); await new Promise(x => setTimeout(x, 900)); r.lenAfterExpand = await st();
  console.log(JSON.stringify(r)); await b.close();
})();
