// Variant tables (Teilenummer + attributes) from wera.de/de series pages of the given articles -> a422/wtable.json {art: {attr [unit]: value, _notes: [..]}}.
// Official WERA data only; ~1.5 s between requests. node a422/wtable.js <arts.json>
const fs = require('fs'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = require('./wscan.json'); const F = __dirname + '/wtable.json'; const out = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
const arts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const clean = s => s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
(async () => {
  const urls = [...new Set(arts.filter(a => !out[a] && W[a] && W[a].url).map(a => W[a].url))];
  for (const u of urls) {
    const h = await (await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36' } })).text();
    const grid = {}; const re = /class="scrollsnaptable-cell[^"]*row-(\d+) column-(\d+)">([\s\S]*?)<\/div>/g; let m;
    while ((m = re.exec(h))) { const [, r, c, html] = m; (grid[r] = grid[r] || {})[c] = c === '0' ? (() => { const l = (html.match(/class='label'>([^<]*)/) || [])[1]; const un = (html.match(/class="unit">([^<]*)/) || [])[1]; return l ? l.trim() + (un ? ' [' + un.trim() + ']' : '') : clean(html); })() : clean(html); }
    if (!grid[0]) { console.log('no table', u); await sleep(1500); continue; }
    const ids = Object.entries(grid[0]).filter(([c]) => c !== '0').map(([c, v]) => [c, v]).filter(([, v]) => /^\d{11}$/.test(v));
    const nt = h.indexOf('Auf den Merkzettel', h.indexOf('row-0 column-0')); const notes = nt > 0 ? (clean(h.slice(nt, h.indexOf('Erfahren Sie mehr', nt) > 0 ? h.indexOf('Erfahren Sie mehr', nt) : nt + 3000)).match(/\(\d\) [^(]+/g) || []).map(x => x.trim()) : [];
    for (const [c, id] of ids) { const o = {}; for (const [r, row] of Object.entries(grid)) if (r !== '0' && row['0'] && row[c] !== undefined) o[row['0']] = row[c]; o._notes = notes; o._url = u; out[id] = o; }
    fs.writeFileSync(F, JSON.stringify(out, null, 1)); console.log(ids.length, u.split('/').pop()); await sleep(1500);
  }
  const miss = arts.filter(a => !out[a]); console.log('missing', miss.length, miss.join(' '));
})();
