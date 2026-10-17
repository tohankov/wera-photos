// Read-only: SEO fields (seo_title, seo_description, h1) of every site page and catalog category -> names/pages_seo.json (resumable, 1.2 s between reads).
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const F = path.join(__dirname, 'pages_seo.json');
const P = require('./pages_export.json').response.pages; const out = fs.existsSync(F) ? JSON.parse(fs.readFileSync(F, 'utf8')) : {};
(async () => { for (const p of P) { if (out[p.id]) continue; await new Promise(r => setTimeout(r, 1200));
    const r = await S.call('horoshop_admin_page_get', { id: p.id, allowLarge: true }); if (!r || r.error) { console.log('fail', p.id, JSON.stringify(r).slice(0, 200)); break; }
    out[p.id] = r; fs.writeFileSync(F, JSON.stringify(out)); }
  console.log('read', Object.keys(out).length, 'of', P.length); S.close(); process.exit(0); })().catch(e => { console.error(e); S.close(); process.exit(1); });
