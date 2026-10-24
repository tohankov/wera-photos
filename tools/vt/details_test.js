// Does Horoshop keep <details>/<summary>, <style> and inline grid styles in a product description? (owner 24.10.2026, set block variant (в))
// Test on ONE hidden product, then the description goes back exactly as it was.
//   node vt/details_test.js <article> backup|write|site|restore|verify
// backup  — export (description + the fields that must not change) -> backup/details_test_<art>_before.json
// write   — description = old + test snippet; dryRun must change only description.ua/ru, else STOP
// site    — admin export: is the snippet stored as sent? storefront UA and /ru/: which parts are in the page HTML
// restore — description = backup; dryRun only description.ua/ru
// verify  — export = backup in every field
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const get = require('./fetchpage.js');
const [, , art, step] = process.argv; const BK = path.join(__dirname, '../../backup/details_test_' + art + '_before.json'), TMP = path.join(__dirname, '../fix/details_test_' + art + '.json');
const fields = ['article', 'parent_article', 'title', 'mod_title', 'price', 'presence', 'display_in_showcase', 'parent', 'alt_parent', 'images', 'gtin', 'link', 'description', 'characteristics'];
const sleep = ms => new Promise(r => setTimeout(r, ms)); const call = async (t, a) => { await sleep(1500); return S.call(t, a); };
const stop = m => { console.log('STOP', m); S.close(); process.exit(2); };
const exp = async () => { const r = await call('horoshop_catalog_export', { expr: { article: [art] }, includedParams: fields, limit: 5, allowLarge: true }); const p = (r.response || {}).products || []; if (p.length !== 1) stop('export: ' + JSON.stringify(r).slice(0, 300)); return p[0]; };
const MARK = 'wsb-test-1024';
const snippet = (img, lang) => {
  const t = lang === 'ua' ? { h: 'Склад набору · 3 предмети', more: 'Показати весь склад — ще 1 ▾', less: 'Згорнути ▴' } : { h: 'Состав набора · 3 предмета', more: 'Показать весь состав — ещё 1 ▾', less: 'Свернуть ▴' };
  const item = n => `<div style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid #363434;border-radius:8px"><img src="${img}" alt="" style="width:76px;height:46px;object-fit:contain"><span style="display:block;font-size:14px"><a href="#">Тест ${n}</a><b style="display:block">PH 2×100 мм</b><span style="color:#999;font-size:12px">Арт. 0000000000${n} · 1 шт.</span></span></div>`;
  const grid = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(max(260px,calc(50% - 6px)),1fr));gap:10px';
  return `<div class="${MARK}" data-wsb="1"><style>.${MARK} details>summary{list-style:none}.${MARK} details>summary::-webkit-details-marker{display:none}.${MARK} details[open]>summary .wsb-more{display:none}.${MARK} details:not([open])>summary .wsb-less{display:none}</style>`
    + `<h3 style="font-size:18px">${t.h}</h3><div style="${grid}">${item(1)}${item(2)}</div>`
    + `<details style="margin-top:10px"><summary style="cursor:pointer;color:#1e9676;font-weight:600;padding:8px 0"><span class="wsb-more">${t.more}</span><span class="wsb-less">${t.less}</span></summary><div style="${grid}">${item(3)}</div></details></div>`;
};
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
  if (step === 'restore') await put({ ua: b.description.ua, ru: b.description.ru });
  if (step === 'verify') { const a = await exp(); const bad = Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); console.log(bad.length ? 'DIFF ' + bad.join(',') : 'export = backup, all fields'); }
  S.close();
})();
