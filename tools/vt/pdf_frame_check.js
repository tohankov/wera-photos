// The «Завантажити технічний паспорт (PDF)» button on the storefront (owner 17.11.2026, 05056305001): the description box
// (.product-description) has overflow:hidden and ended exactly at the bottom border of the button — the bottom line was cut off.
// Opens each page in Chrome (desktop 1280 and phone 375), finds the datasheet link, measures the room between each border edge
// of the button and the nearest clipping ancestor (overflow hidden), checks what is drawn on all 4 border lines, screenshots the button.
//   node vt/pdf_frame_check.js <out dir> <url> [url ...]   (MODES=desk,phone by default, DPR=1)  -> exit 2 when a frame side is cut
const puppeteer = require('C:/Users/Techlight/Desktop/wera-photos/tools/node_modules/puppeteer-core'); const fs = require('fs');
const [, , OUT, ...urls] = process.argv; const MODES = (process.env.MODES || 'desk,phone').split(','); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA_PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
(async () => { const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' }); let bad = 0;
  for (const mode of MODES) { const p = await b.newPage(); const ph = mode === 'phone'; if (ph) await p.setUserAgent(UA_PHONE);
    await p.setViewport({ width: ph ? 375 : 1280, height: 900, isMobile: ph, deviceScaleFactor: +(process.env.DPR || 1) });
    for (const u of urls) { await p.goto(u, { waitUntil: 'networkidle2', timeout: 90000 }); await sleep(2500);
      const r = await p.evaluate(() => { const a = [...document.querySelectorAll('.text a')].find(x => /pdfgenerator-datasheets/.test(x.href)); if (!a) return null;
        a.scrollIntoView({ block: 'center' }); const q = a.getBoundingClientRect(); let e = a.parentElement, clip = null;
        while (e && e !== document.body) { const s = getComputedStyle(e); if (/hidden|clip|auto|scroll/.test(s.overflow + s.overflowY + s.overflowX)) { clip = e; break; } e = e.parentElement; }
        const c = clip ? clip.getBoundingClientRect() : { top: -1e9, bottom: 1e9, left: -1e9, right: 1e9 };
        const room = { top: q.top - c.top, bottom: c.bottom - q.bottom, left: q.left - c.left, right: c.right - q.right };
        const pp = a.parentElement, ps = getComputedStyle(pp);
        return { room, p: { style: pp.getAttribute('style'), mb: ps.marginBottom, pb: ps.paddingBottom }, border: getComputedStyle(a).borderBottom,
          box: { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height } }; });
      const tag = `${ph ? 'phone' : 'desk'} ${/\/ru\//.test(u) ? 'ru' : 'ua'} ${u.replace(/\/$/, '').split('/').pop().slice(-11)}`;
      if (!r) { bad++; console.log('NO PDF BUTTON', tag, u); continue; }
      // a side outside the clip box is cut; the bottom line also when it sits on the clip edge (0.1 px at 05056305001 — pixel rounding hides it)
      const cut = Object.entries(r.room).filter(([k, v]) => v < (k === 'bottom' ? 2 : 0)).map(([k, v]) => `${k} ${v.toFixed(2)}px`);
      if (cut.length) bad++;
      console.log(cut.length ? 'CUT' : 'OK ', tag, 'room', Object.entries(r.room).map(([k, v]) => k + ' ' + (Math.abs(v) > 1e6 ? '∞' : v.toFixed(1))).join(', '), '| <p>', r.p.style || '-', 'mb', r.p.mb, 'pb', r.p.pb);
      const W = ph ? 375 : 1280; const file = `${OUT}/${u.replace(/\/$/, '').split('/').pop().slice(-11)}${/\/ru\//.test(u) ? '_ru' : ''}_${ph ? 'phone' : 'desk'}.png`;
      await p.screenshot({ path: file, clip: { x: 0, y: Math.max(0, r.box.y - 70), width: W, height: r.box.h + 150 } }); }
    await p.close(); }
  await b.close(); process.exit(bad ? 2 : 0); })().catch(e => { console.error(e); process.exit(1); });
