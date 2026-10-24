// screenshots of docs/pilot/sets_block_v.html: node shots.js <html> <outDir>
const puppeteer = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/puppeteer-core'); const fs = require('fs');
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe'].find(f => fs.existsSync(f)); const [, , html, out] = process.argv;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { const b = await puppeteer.launch({ executablePath: exe, headless: 'new' }); const p = await b.newPage(); await p.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
  await p.goto('file:///' + html, { waitUntil: 'load' }); await p.addStyleTag({ content: '.bar{position:static}' }); await p.evaluate(() => document.querySelectorAll('img[loading]').forEach(i => { i.loading = 'eager'; })); await sleep(1500);
  const shot = async (lang, w, set, open, name) => { await p.click(`[data-l="${lang}"]`); await p.click(`[data-w="${w}"]`);
    await p.evaluate((o) => document.querySelectorAll('.wsb details').forEach(d => d.open = o), open); await sleep(300);
    const el = (await p.$$('.set'))[set]; await el.screenshot({ path: `${out}/${name}.png` });
    const info = await p.evaluate((set, lang) => { const f = document.querySelectorAll('.set')[set].querySelector('.text.' + lang); const g = f.querySelector('div[style*="grid"]'); const s = f.querySelector('summary');
      return { cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, summary: s ? s.innerText.trim() : '-', overflow: f.scrollWidth > f.clientWidth }; }, set, lang);
    console.log(name, JSON.stringify(info)); };
  await shot('ua', 590, 0, false, 'v_big_ua_desktop_closed'); await shot('ua', 590, 0, true, 'v_big_ua_desktop_open');
  await shot('ua', 328, 0, false, 'v_big_ua_phone_closed'); await shot('ua', 328, 0, true, 'v_big_ua_phone_open');
  await shot('ru', 590, 0, false, 'v_big_ru_desktop_closed'); await shot('ru', 328, 0, true, 'v_big_ru_phone_open');
  await shot('ua', 590, 1, false, 'v_9650_ua_desktop'); await shot('ua', 328, 1, false, 'v_9650_ua_phone'); await shot('ru', 590, 1, false, 'v_9650_ru_desktop');
  await b.close(); })();
