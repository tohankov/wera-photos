// The whole catalog menu as [{id, depth, path, kids}] (path — titles UA from «Каталог» down, «A → B → C») for cat/sec_check.js / vt/sec_scan.js:
//   node cat/menu_tree.js <out.json> [root id = 97]   (also every subtree of a group: filter by path prefix)
const fs = require('fs'); const S = require('../lib/session.js').open(); const [, , OUT, R] = process.argv; const ROOT = +R || 97;
(async () => { const r = await S.call('horoshop_pages_export', { parent: 0, allowLarge: true }); const flat = r.response.pages; const by = Object.fromEntries(flat.map(p => [p.id, p]));
  const out = []; const walk = (id, depth, pre) => { for (const c of flat.filter(p => +p.parent === id)) { const path = pre ? pre + ' → ' + c.title.ua : c.title.ua; const kids = flat.filter(p => +p.parent === +c.id).length;
      out.push({ id: +c.id, depth, path, kids }); walk(+c.id, depth + 1, path); } };
  walk(ROOT, 0, ''); fs.writeFileSync(OUT, JSON.stringify(out)); console.log('sections', out.length, '->', OUT); S.close(); process.exit(0); })();
