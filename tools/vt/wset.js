// wera.de product page -> «Werkzeuge in diesem Set»: [{name, img (series picture, 480px), href, rows: [{qty, size, art|null}]}] in page order; title.
// node vt/wset.js <page.html>
const dec = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
function parse(h) {
  const title = dec((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]);
  const i = h.indexOf('Werkzeuge in diesem Set'); if (i < 0) return { title, items: [] };
  const parts = h.slice(i).split('tools-in-kit-item').slice(1); const items = [];
  for (const p of parts) { const name = dec((p.match(/<p class="subheadline[^"]*">([\s\S]*?)<\/p>/) || [, ''])[1]); if (!name) continue;
    const img = (p.match(/\/prodimg\/480x480\/[^"'\s]+\.webp/) || p.match(/\/prodimg\/240x240\/[^"'\s]+\.webp/) || [null])[0];
    const href = (p.match(/<a href="([^"]+)" class="stretched-link/) || [, null])[1];
    const rows = [...p.matchAll(/additional-items[^"]*"><div><span class="me-16px">([^<]*)<\/span><span>([^<]*)<\/span><\/div><div><span class="me-16px">[^<]*<\/span><span>([^<]*)<\/span>/g)]
      .map(m => ({ qty: +dec(m[1]) || 1, size: dec(m[2]), art: /^\d{11}$/.test(dec(m[3])) ? dec(m[3]) : null }));
    items.push({ name, img: img ? 'https://www.wera.de' + img : null, href, rows }); if (/<\/section>/.test(p.slice(0, p.indexOf('tools-in-set') + 4000)) && false) break; }
  return { title, items };
}
module.exports = { parse };
if (require.main === module) { const r = parse(require('fs').readFileSync(process.argv[2], 'utf8')); console.log(r.title); for (const it of r.items) console.log(it.name, '|', it.img, '|', it.rows.map(x => `${x.qty}× ${x.size} ${x.art}`).join('; ')); }
