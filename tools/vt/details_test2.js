// Admin editor test of the GROUPED set block (owner 24.10.2026): the real block of ложемент 9753 05150153001 (vt/setg_build.js -> <SP/setv>/blocks_g.json)
// goes onto ONE hidden product; the owner opens it in the admin in the visual mode and presses «Зберегти» without changes; then «editor» checks that
// the description is still the block as sent (details / summary / style / icons) and parent / alt_parent are as in the backup; then restore + verify.
// Copy of vt/details_test.js (variant (в) test) with the real block instead of the 3-card snippet.
// Test on ONE hidden product, then the description goes back exactly as it was.
//   node vt/details_test2.js <article> <blocks_g.json> backup|write|site|editor|restore|verify
// backup  — export (description + the fields that must not change) -> backup/details_test_<art>_before.json
// write   — description = old + test snippet; dryRun must change only description.ua/ru, else STOP
// site    — admin export: is the snippet stored as sent? storefront UA and /ru/: which parts are in the page HTML
// restore — description = backup; dryRun only description.ua/ru
// verify  — export = backup in every field
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const get = require('./fetchpage.js');
const [, , art, BLOCKS, step] = process.argv; const BK = path.join(__dirname, '../../backup/details_test2_' + art + '_before.json'), TMP = path.join(__dirname, '../fix/details_test2_' + art + '.json');
const BL = JSON.parse(fs.readFileSync(BLOCKS, 'utf8'))['05150153001'].html;
const fields = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const exp = async () => { const r = await call('horoshop_catalog_export', { expr: { article: [art] }, includedParams: fields, limit: 5, allowLarge: true }); const p = (r.response || {}).products || []; if (p.length !== 1) stop('export: ' + JSON.stringify(r).slice(0, 300)); return p[0]; };
const MARK = 'class="wsb"';
const snippet = (img, lang) => BL[lang];
(async () => {
  if (step === 'backup') { if (fs.existsSync(BK)) stop('backup exists — not overwriting'); const b = await exp(); if (+b.display_in_showcase === 1) stop('product is visible — test only on a hidden one'); fs.writeFileSync(BK, JSON.stringify(b)); console.log('backup', BK, 'ua', b.description.ua.length, 'ru', b.description.ru.length, 'images', (b.images || []).length); }
  const b = JSON.parse(fs.readFileSync(BK, 'utf8'));
  const img = String((b.images || [])[0] || '').replace(/^https?:\/\/[^/]+/, '');
  const want = l => b.description[l] + snippet(img, l);
  const put = async desc => { fs.writeFileSync(TMP, JSON.stringify({ products: [{ article: art, description: desc }] }));
    const dry = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: true }); const w = dry.willChange || [];
    if (w.length !== 1 || w[0].isNew || Object.keys(w[0].changes || {}).sort().join(',') !== 'description.ru,description.ua') stop('dryRun outside plan: ' + JSON.stringify(dry).slice(0, 400));
    const r = await call('horoshop_catalog_import', { productsFile: TMP, dryRun: false }); if ((r.errors || []).length) stop('import errors ' + JSON.stringify(r.errors)); console.log('written'); };
  if (step === 'write') await put({ ua: want('ua'), ru: want('ru') });
  if (step === 'site') { const a = await exp();
    for (const l of ['ua', 'ru']) { const s = a.description[l]; console.log('admin', l, s === want(l) ? 'stored exactly as sent' : 'CHANGED by Horoshop', '| details', /<details/.test(s), 'summary', /<summary/.test(s), 'style-tag', /<style/.test(s), 'max(', /minmax\(max\(/.test(s));
      if (s !== want(l)) fs.writeFileSync(TMP.replace('.json', '_stored_' + l + '.html'), s); }
    for (const [l, u] of [['ua', b.link], ['ru', b.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/')]]) { await sleep(3000); const h = (await get(u)).html;
      const i = h.indexOf(MARK); const part = i < 0 ? '' : h.slice(h.lastIndexOf('<div', i), h.indexOf('</details>', i) + 16);
      fs.writeFileSync(TMP.replace('.json', '_site_' + l + '.html'), part);
      console.log('site', l, i < 0 ? 'snippet NOT on the page (cache?)' : `details ${/<details/.test(part)} summary ${/<summary/.test(part)} style-tag ${/<style/.test(part)} max( ${/minmax\(max\(/.test(part)} more ${/wsb-more/.test(part)}`); } }
  if (step === 'editor') { const a = await exp(); let ok = true;
    for (const l of ['ua', 'ru']) { const s = a.description[l]; const same = s === want(l); ok = ok && same; const ic = (s.match(/images\/icons\/icon-[a-z-]+\.png/g) || []).length, icw = (want(l).match(/images\/icons\/icon-[a-z-]+\.png/g) || []).length;
      console.log('admin', l, same ? 'description = as sent' : 'CHANGED by the editor', '| details', /<details/.test(s), 'summary', /<summary/.test(s), 'style-tag', /<style/.test(s), 'minmax(max(', /minmax\(max\(/.test(s), 'icons', ic + '/' + icw, 'cards', (s.match(/Арт\. /g) || []).length);
      if (!same) fs.writeFileSync(TMP.replace('.json', '_editor_' + l + '.html'), s); }
    for (const k of ['parent', 'alt_parent', 'display_in_showcase', 'images', 'characteristics', 'title', 'mod_title', 'price', 'presence']) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) { ok = false; console.log('FIELD CHANGED', k, JSON.stringify(b[k]).slice(0, 200), '->', JSON.stringify(a[k]).slice(0, 200)); }
    console.log(ok ? 'EDITOR KEEPS THE BLOCK, other fields as in the backup' : 'STOP — see above'); }
  if (step === 'restore') await put({ ua: b.description.ua, ru: b.description.ru });
  if (step === 'verify') { const a = await exp(); const bad = Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); console.log(bad.length ? 'DIFF ' + bad.join(',') : 'export = backup, all fields'); }
  S.close();
})();
