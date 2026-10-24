// Global check: wera.de facts for one group (vt/wera_page.js). wera.de/de/<article> redirects to the SERIES page, so one page covers every article of its
// «Daten und Fakten» table — an article already covered is not fetched again. 2 s between requests, resumable, stops by itself before maxSeconds.
//   node cat/global_wera.js <live.json of the group> [maxSeconds=540]  ->  inventory/wera/pages.json { pages: {url: parsed}, art: {article: url|null}, status: {article: code} }
const fs = require('fs'), path = require('path'); const P = require('../vt/wera_page.js');
const [, , liveFile, maxS] = process.argv; const live = JSON.parse(fs.readFileSync(liveFile, 'utf8')); const T0 = Date.now(), MAX = (+maxS || 540) * 1000;
const F = path.join(__dirname, '../../inventory/wera/pages.json'); fs.mkdirSync(path.dirname(F), { recursive: true });
const db = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : { pages: {}, art: {}, status: {} };
const sleep = ms => new Promise(r => setTimeout(r, ms)); const save = () => fs.writeFileSync(F, JSON.stringify(db));
(async () => { let fetched = 0;
  for (const p of live) { const a = p.article; if (!/^\d{11}$/.test(a) || a in db.art) continue; if (Date.now() - T0 > MAX) { console.log('time limit — run again to continue'); break; }
    await sleep(2000); let r;
    try { r = await fetch('https://www.wera.de/de/' + a, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' }); } catch (e) { console.log(a, 'ERR', e.message); continue; }
    if (r.status === 429 || r.status === 403) { console.log(a, r.status, '— waiting 60 s'); await sleep(60000); continue; }
    db.status[a] = r.status; fetched++;
    if (r.status !== 200) { db.art[a] = null; save(); continue; }
    const h = await r.text(); const url = r.url; if (!db.pages[url]) db.pages[url] = P.parse(h);
    db.art[a] = url; for (const x of (db.pages[url].table || {}).arts || []) if (!(x in db.art)) db.art[x] = url; save(); }
  const g = live.filter(p => /^\d{11}$/.test(p.article)); const left = g.filter(p => !(p.article in db.art)).length;
  console.log('fetched', fetched, '| group articles', g.length, 'covered', g.length - left, 'left', left, '| pages', Object.keys(db.pages).length); })();
