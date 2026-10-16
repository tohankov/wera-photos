// Browser check of the filter UI (read-only): «Показать еще», collapse, screenshots desktop + mobile.
const puppeteer = require('puppeteer-core'); const fs = require('fs');
const OUT = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const open = async (b, mobile) => { const p = await b.newPage(); await p.setUserAgent(mobile ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36');
  await p.setViewport(mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { width: 1440, height: 1000 }); return p; };
const go = async (p, url) => { await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); await new Promise(r => setTimeout(r, 2500)); if (!(await p.$('.filter-section'))) { await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }); await new Promise(r => setTimeout(r, 2500)); } };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] }); const res = {};
  // desktop: HEX (26 sizes) — show more + collapse
  const p = await open(b, false); await go(p, 'https://tl-shop.com.ua/biti-dlya-gvintiv-iz-vnutrishnim-shestigrannikom/');
  const sel = '.filter-section[data-filter-id="6591"]';
  res.sizeVisibleBefore = await p.$$eval(sel + ' li.filter-lv1-i', l => l.filter(e => e.offsetParent !== null).length);
  res.sizeTotal = await p.$$eval(sel + ' li.filter-lv1-i', l => l.length);
  const more = await p.$(sel + ' .j-filter-more, ' + sel + ' [class*="more"]'); res.moreButton = !!more; res.moreText = more ? await p.evaluate(e => e.textContent.trim(), more) : null;
  if (more) { await more.click(); await new Promise(r => setTimeout(r, 800)); res.sizeVisibleAfter = await p.$$eval(sel + ' li.filter-lv1-i', l => l.filter(e => e.offsetParent !== null).length); }
  const filt = await p.$('.filter, .catalog-filter, aside'); await p.evaluate(() => window.scrollTo(0, 0));
  const col = await p.$('.filter-section[data-filter-id="6590"]'); const box = await p.evaluate(() => { const s = document.querySelector('.filter-section[data-filter-id="6590"]'); const parent = s.parentElement; const r = parent.getBoundingClientRect(); return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: Math.min(parent.scrollHeight, 2600) }; });
  await p.screenshot({ path: OUT + 'filters_bits_desktop.png', clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 60), width: Math.min(box.w + 20, 420), height: box.h + 60 } });
  const trig = await p.$(sel + ' .j-filter-collapse-trigger'); await trig.click(); await new Promise(r => setTimeout(r, 600));
  res.collapseAfterClick = await p.$eval(sel + ' .j-filter-collapse-trigger', e => e.getAttribute('aria-expanded')); await trig.click(); await new Promise(r => setTimeout(r, 400));
  res.collapseAfterSecond = await p.$eval(sel + ' .j-filter-collapse-trigger', e => e.getAttribute('aria-expanded'));
  // mobile: Phillips, open the filter panel
  const m = await open(b, true); await go(m, 'https://tl-shop.com.ua/khrestovi-biti-phillips/');
  const btn = await m.$('.j-filter-toggle, .filter-toggle, [data-toggle="filter"], .catalog-filter-btn, button[class*="filter"]'); res.mobileFilterButton = btn ? await m.evaluate(e => e.className + ' | ' + e.textContent.trim().slice(0, 40), btn) : null;
  await m.screenshot({ path: OUT + 'filters_bits_mobile_list.png' });
  if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 1500)); }
  await m.screenshot({ path: OUT + 'filters_bits_mobile_panel.png' });
  res.mobileSectionsVisible = await m.$$eval('.filter-section', l => l.filter(e => e.offsetParent !== null).map(e => (e.querySelector('.filter-section-h') || e).textContent.trim().split('\n')[0].trim()));
  fs.writeFileSync(__dirname + '/ui_report.json', JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
