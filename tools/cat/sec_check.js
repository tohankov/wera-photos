// After a write: check EVERY section the written products are in (main + alt_parent), on the storefront UA and /ru/ (owner 21.10.2026):
// fresh export of every product of those sections + fresh scan of the sections (vt/sec_scan.js) -> every visible product is listed,
// every filter block count = the export.
//   node cat/sec_check.js <live.json> <menu_tree.json> <out_scan.json> <plan.json | article> [...]
// live.json only tells which products sit in which sections (it may be older than the write). Exit code 2 when a problem is found.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [, , LIVE, MENU, OUT, ...WHAT] = process.argv; const L0 = JSON.parse(fs.readFileSync(LIVE, 'utf8')), M = JSON.parse(fs.readFileSync(MENU, 'utf8'));
const TITLE = require('./char_titles.js'); const KEY = Object.fromEntries(Object.entries(TITLE).map(([k, t]) => [t, k]));
const arts = [...new Set(WHAT.flatMap(w => /\.json$/.test(w) ? JSON.parse(fs.readFileSync(w, 'utf8')).products.map(x => x.article) : [w]))];
const secs = p => [...new Set([p.parent && +p.parent.id, ...(p.alt_parent || []).map(x => +x.id)].filter(Boolean))];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const nz = s => String(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
(async () => {
  const S = require('../lib/session.js').open(); const exp = async list => { const out = []; for (let i = 0; i < list.length; i += 100) { await sleep(1200);
      const r = await S.call('horoshop_catalog_export', { expr: { article: list.slice(i, i + 100) }, includedParams: ['article', 'title', 'parent', 'alt_parent', 'display_in_showcase', 'characteristics', 'link'], limit: 100, allowLarge: true });
      if (!r.response) throw new Error('export ' + JSON.stringify(r).slice(0, 200)); out.push(...r.response.products); } return out; };
  const now = await exp(arts); const ids = [...new Set([...now, ...L0.filter(p => arts.includes(p.article))].flatMap(secs))];   // sections before and after the write
  const need = [...new Set([...L0.filter(p => secs(p).some(id => ids.includes(id))).map(p => p.article), ...arts])];
  const L = await exp(need); S.close(); const by = Object.fromEntries(L.map(p => [p.article, p]));
  const tree = ids.map(id => M.find(s => s.id === id) || { id, path: String(id) }); const TREE = OUT.replace(/\.json$/, '_tree.json');
  // SCAN_KEEP=1: continue a scan that did not fit in one foreground run (vt/sec_scan.js resumes from the out file); only right after the write it belongs to
  fs.writeFileSync(TREE, JSON.stringify(tree)); if (fs.existsSync(OUT) && !process.env.SCAN_KEEP) fs.unlinkSync(OUT);
  execFileSync('node', [path.join(__dirname, '../vt/sec_scan.js'), TREE, OUT], { stdio: ['ignore', 'ignore', 'inherit'], timeout: 1800000 });
  const SC = JSON.parse(fs.readFileSync(OUT, 'utf8')); const BY = {}; for (const p of L) BY[(p.link || '').replace(/^https?:\/\/[^/]+/, '')] = p.article; let bad = 0, blocks = 0;
  for (const id of ids) { const s = SC[id]; const name = (tree.find(t => t.id === id) || {}).path; if (!s) { bad++; console.log('NOT SCANNED', id, name); continue; }
    const vis = L.filter(p => secs(p).includes(id) && +p.display_in_showcase === 1);
    for (const lg of ['ua', 'ru']) { const r = s[lg]; if (r.status !== 200) { bad++; console.log('STATUS', id, lg, r.status, name); continue; }
      const got = new Set(r.products.map(x => BY[x] || x)); const lost = vis.filter(p => !got.has(p.article)).map(p => p.article); const extra = [...got].filter(a => !vis.some(p => p.article === a));
      // a section that shows subsection tiles lists no products of its own
      if (r.products.length && (lost.length || extra.length)) { bad++; console.log('PRODUCTS', id, lg, lost.length ? 'немає: ' + lost.join(' ') : '', extra.length ? 'зайві: ' + extra.join(' ') : '', '|', name); }
      for (const f of r.filters) { const t = lg === 'ua' ? f.title : (s.ua.filters.find(x => x.id === f.id) || {}).title; if (!t || t === '?' || t === 'Бренд') continue; const k = KEY[t]; if (!k) { console.log('unknown filter', id, t); continue; } blocks++;
        const cnt = {}; for (const p of vis) for (const x of (p.characteristics || {})[k] || []) { const u = nz(x.value[lg]); cnt[u] = (cnt[u] || 0) + 1; }
        const sf = Object.fromEntries(f.vals.map(x => [nz(x.text), x.n])); const diff = [...new Set([...Object.keys(cnt), ...Object.keys(sf)])].filter(x => cnt[x] !== sf[x]);
        if (diff.length) { bad++; console.log('COUNT', id, lg, t, diff.slice(0, 8).map(x => `${x}: сайт ${sf[x]} / вигрузка ${cnt[x]}`).join('; '), '|', name); } } } }
  console.log(`sec_check: products ${arts.length}, sections ${ids.length} (${ids.join(',')}), filter blocks ${blocks}, problems ${bad}`); process.exit(bad ? 2 : 0);
})();
