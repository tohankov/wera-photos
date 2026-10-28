// Rule А gallery rebuild files (owner 28.10.2026): for a product whose wera.de page is its own (a set, no variant table), the new gallery = the new main
// (cut, <cut dir>/<art>.png) + the wera.de gallery after its first picture + the wera.de detail pictures, in page order (WERA webp -> JPEG on white).
// Files -> images/rulea/<art>/NN.* (served raw ONLY for the import; no link to them is ever put on the site) + a plan for photos_audit/gallery_override.js.
//   node photos_audit/gallery_wera_files.js <cut dir> <plan name> <art> [art ...]
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const W = require('../../inventory/wera/pages.json');
const [, , CUT, NAME, ...arts] = process.argv; const ROOT = path.join(__dirname, '../../images/rulea'); const RAW = 'https://raw.githubusercontent.com/tohankov/wera-photos/main/images/rulea';
const sleep = ms => new Promise(r => setTimeout(r, ms)); const plan = { name: NAME, products: {} }; const skip = [];
(async () => { for (const a of arts) { const wp = W.pages[W.art[a]]; if (!wp || (wp.table && wp.table.arts && wp.table.arts.length > 1)) { skip.push(a + ' нет своей страницы wera.de'); continue; }
    const dir = path.join(ROOT, a); fs.mkdirSync(dir, { recursive: true }); fs.copyFileSync(path.join(CUT, a + '.png'), path.join(dir, '00_main.png')); const links = [`${RAW}/${a}/00_main.png`];
    for (const [i, g] of [...(wp.gallery || []).slice(1), ...(wp.details || [])].entries()) { const f = path.join(dir, String(i + 1).padStart(2, '0') + '.jpg');
      if (!fs.existsSync(f)) { await sleep(1200); const r = await fetch(g.url, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) { console.log('HTTP', r.status, g.url); continue; }
        await sharp(Buffer.from(await r.arrayBuffer())).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toFile(f); }
      links.push(`${RAW}/${a}/${path.basename(f)}`); }
    plan.products[a] = { links, why: 'правило А: галерея = актуальная версия WERA' }; console.log(a, links.length); }
  fs.writeFileSync(path.join(__dirname, `../cat/gal_${NAME}_plan.json`), JSON.stringify(plan, null, 1)); console.log('plan', Object.keys(plan.products).length, '| skip', skip); })();
