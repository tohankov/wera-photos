const puppeteer = require('puppeteer-core'); const OUT = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const go = async (p, url) => { await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 3000)); if (!(await p.$('.filter-section'))) { await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 3000)); } };
  // desktop: after «Показати ще»
  const d = await b.newPage(); await d.setViewport({ width: 1440, height: 1000 }); await go(d, 'https://tl-shop.com.ua/biti-dlya-gvintiv-iz-vnutrishnim-shestigrannikom/');
  await d.evaluate(() => { const el = [...document.querySelectorAll('.filter-section[data-filter-id="6591"] a.filter-toggle')][0]; el && el.click(); }); await new Promise(r => setTimeout(r, 1000));
  const bx = await d.evaluate(() => { const s = document.querySelector('.filter-section[data-filter-id="6591"]').getBoundingClientRect(); return { x: s.left + scrollX, y: s.top + scrollY, w: s.width, h: s.height }; });
  await d.screenshot({ path: OUT + 'filters_bits_desktop_more.png', clip: { x: bx.x - 10, y: bx.y - 10, width: bx.w + 20, height: bx.h + 20 } });
  // mobile
  const m = await b.newPage(); await m.emulate(puppeteer.KnownDevices['iPhone 13']); await go(m, 'https://tl-shop.com.ua/khrestovi-biti-phillips/');
  const info = await m.evaluate(() => ({ w: innerWidth, btns: [...document.querySelectorAll('button, a')].filter(e => /фільтр/i.test(e.textContent) && e.getBoundingClientRect().height > 0).map(e => e.tagName + '.' + e.className + ' | ' + e.textContent.trim().slice(0, 30)).slice(0, 5) }));
  console.log(JSON.stringify(info));
  await m.screenshot({ path: OUT + 'filters_bits_mobile_list.png' });
  const ok = await m.evaluate(() => { const e = [...document.querySelectorAll('button, a, div')].find(e => /^Фільтр/i.test(e.textContent.trim()) && e.getBoundingClientRect().height > 0 && e.children.length < 4); if (e) { e.click(); return e.tagName + '.' + e.className; } return null; });
  await new Promise(r => setTimeout(r, 1500)); console.log('clicked', ok); await m.screenshot({ path: OUT + 'filters_bits_mobile_panel.png' });
  await b.close();
})();
