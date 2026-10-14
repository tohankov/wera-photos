// wera.de/de/<art> for the 422: status, final url, title, product ids on the page, main image name. Resumable (wscan.json). ~1.5 s per request.
const fs = require('fs'); const sleep = ms => new Promise(r => setTimeout(r, ms));
const F = __dirname + '/wscan.json'; const out = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F)) : {};
const dec = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
(async () => {
  for (const { article: a } of require('./list.json')) {
    if (out[a] && (out[a].status === 200 || out[a].status === 404)) continue;
    try {
      const r = await fetch('https://www.wera.de/de/' + a, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
      const h = await r.text();
      const pid = (h.match(/data-productid="([^"]*)"/) || [, ''])[1].split(',').filter(Boolean);
      const bm = [...new Set((h.match(/data-product-id="(05\d{9})"/g) || []).map(s => s.slice(17, 28)))];
      const i = h.indexOf('productfinder-image-main');
      const img = i >= 0 ? (h.slice(i).match(/\/prodimg\/\d+x\d+\/([^"'\s/]+)\.webp/) || [])[1] : null;
      out[a] = { status: r.status, url: r.url, title: r.status === 200 ? dec((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]) : '', pid, bm, img };
    } catch (e) { out[a] = { status: 'ERR ' + e.message }; }
    fs.writeFileSync(F, JSON.stringify(out, null, 1));
    await sleep(1500);
  }
  console.log('done', Object.keys(out).length);
})();
