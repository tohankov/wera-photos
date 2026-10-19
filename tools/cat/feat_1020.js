// Owner task 20.10.2026: «Особливості викрутки» (osoblyvosti_vykrutky, book 394) in the groups «Викрутки» (1098), Kraftform Kompakt (1057), «Діелектричні інструменти» (1224):
//  «З магнітом» (RU «С магнитом») where the WERA name or datasheet says the tool / its bit holder has a magnet; «Зі стопорним кільцем» (RU «Со стопорным кольцом») where it has a locking ring for the bit.
//  Values are only added (existing ones kept). Ambiguous datasheet text -> disputed, not written. The 6 handles/removers of vk_fix_1019 are not touched (owner).
//   node cat/feat_1020.js plan <live.json>   -> cat/feat_1020_plan.json + inventory/feat_1020.xlsx (было -> стало, quote, disputed)
//   node cat/feat_1020.js backup | dry | write | ru | verify
// Owner decisions on the 26 disputed (20.10.2026) — none written: magnetic wall racks and the Kompakt 20 A/20/22/25/26 and 20/25/26/28 RA ring — no;
//  12 Rapidaptor-only — wera.de de/en checked: only «hebt den Bit vom Magneten ab» / «lifts the bit off the magnet» (Rapidaptor text), no «mit Magnet / magnetic / Dauermagnet»;
//  05059303001 has no wera.de page (404) — no. Sources: inventory/feat_1020.xlsx, sheet «Спірні».
const fs = require('fs'), path = require('path'); const MODE = process.argv[2]; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/', INV = 'C:/Users/Techlight/Desktop/wera-photos/inventory/';
const PLAN = path.join(__dirname, 'feat_1020_plan.json'); const sleep = ms => new Promise(r => setTimeout(r, ms)); let S = null;
const call = async (t, a) => { S = S || require('../lib/session.js').open(); for (let k = 0; k < 20; k++) { await sleep(1000); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/);
  if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { console.log('STOP', m); if (S) S.close(); process.exit(2); };
const K = 'osoblyvosti_vykrutky', BOOK = 394, MAG = 'З магнітом', RING = 'Зі стопорним кільцем', RU = { [MAG]: 'С магнитом', [RING]: 'Со стопорным кольцом' };
const SKIP = new Set(['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001']); // vk_fix_1019 handles/removers — owner: do not touch
const ROOTS = { vk: 1098, kk: 1057, vde: 1224 };
// magnet: explicit WERA phrases about the tool / its bit holder; «без магніту» excluded; magnetic wall racks (the magnet holds the rack, not the bit) -> disputed
const MAG_T = /з магнітом|із сильним магнітом|з сильним магнітом/i, MAG_D = /постоянн\S* магнит|с магнитом|сильный магнит|магнитн\S* (битодержател|держател\S* бит)|битодержател\S* с магнитом|магнитное, для насадок/i;
const RACK = /Магнітний тримач для розміщення|Магнітний тримач та набір/i, NOMAG = /без магніт|без магнит/i;
const MAG_Q = /приподним\S* насадку с магнита/i; // Rapidaptor text fragment only -> disputed
// locking ring for the bit: explicit; «стопорное кольцо» that releases the telescopic blade (Kompakt 20/22/25/26/28 RA) -> disputed
const RING_T = /стопорним кільцем/i, RING_D = /(со|с пружинным) стопорным кольцом|подать вперед стопорное кольцо|установленное стопорное кольцо/i, RING_Q = /стопорн\S* кольц/i;
const FIELDS = ['article', 'parent', 'alt_parent', 'title', 'mod_title', 'price', 'display_in_showcase', 'characteristics'];
const vals = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
(async () => {
  if (MODE === 'plan') { const L = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); const t = require('../sections/tree_now.json'); const kids = {}; for (const p of t) (kids[p.parent] = kids[p.parent] || []).push(p.id);
    const sub = r => { const s = new Set([r]), q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.add(k); q.push(k); } return s; }; const G = Object.fromEntries(Object.entries(ROOTS).map(([k, r]) => [k, sub(r)]));
    const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number); const name = Object.fromEntries(t.map(p => [p.id, p.title.ua]));
    const ds = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/^p\d+ /gm, '').replace(/ \| /g, ' ').replace(/\s+/g, ' ') : ''; };
    const quote = (s, re) => { const m = s.match(new RegExp('.{0,60}(' + re.source + ').{0,50}', 'i')); return m ? m[0].trim() : ''; };
    const plan = [], rows = [], disp = [];
    for (const p of L) { const g = Object.keys(G).filter(k => secs(p).some(s => G[k].has(s))); if (!g.length) continue;
      const T = p.title.ua + ' | ' + p.title.ru, D = ds(p.article), had = vals(p, K), add = [], why = [];
      if (!NOMAG.test(T)) { if (RACK.test(T)) disp.push({ a: p.article, what: MAG, why: 'магнит держит сам тримач на металле, не биту', q: quote(D, /сильного магнита/) });
        else if (MAG_T.test(T)) { add.push(MAG); why.push('название: ' + quote(T, MAG_T)); } else if (MAG_D.test(D)) { add.push(MAG); why.push('даташит: ' + quote(D, MAG_D)); }
        else if (MAG_Q.test(D)) disp.push({ a: p.article, what: MAG, why: 'в даташите только обрывок текста Rapidaptor', q: quote(D, MAG_Q) }); }
      if (RING_T.test(T)) { add.push(RING); why.push('название: ' + quote(T, RING_T)); } else if (RING_D.test(D)) { add.push(RING); why.push('даташит: ' + quote(D, RING_D)); }
      else if (RING_Q.test(D)) disp.push({ a: p.article, what: RING, why: 'кольцо выдвигает стержень/фиксирует ручку, а не биту', q: quote(D, RING_Q) });
      const nw = add.filter(v => !had.includes(v)); if (!add.length) continue; for (const d of disp.filter(d => d.a === p.article)) d.title = p.title.ua;
      const r = { a: p.article, g: g.join('+'), vis: +p.display_in_showcase, sec: name[p.parent.id], title: p.title.ua, before: had, after: [...had, ...nw], add: nw, why: why.join(' / '), skip: SKIP.has(p.article) };
      rows.push(r); if (nw.length && !r.skip) plan.push({ article: p.article, characteristics: { [K]: r.after } }); }
    for (const d of disp) if (!d.title) d.title = (L.find(p => p.article === d.a) || {}).title.ua;
    fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1));
    const X = require('xlsx'), wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows.map(r => ({ Артикул: r.a, Група: r.g, Видимий: r.vis, Розділ: r.sec, Назва: r.title, Було: r.before.join('; '), Стало: r.skip ? '(не чіпаємо — власник)' : r.after.join('; '), Додається: r.skip ? '' : r.add.join('; '), Джерело: r.why }))), 'Було → стало');
    X.utils.book_append_sheet(wb, X.utils.json_to_sheet(disp.map(d => ({ Артикул: d.a, Назва: d.title, Значення: d.what, Чому: d.why, Цитата: d.q }))), 'Спірні');
    X.writeFile(wb, INV + 'feat_1020.xlsx');
    const c = v => plan.filter(x => !rows.find(r => r.a === x.article).before.includes(v) && x.characteristics[K].includes(v)).length;
    console.log('rows', rows.length, 'to write', plan.length, '| +', MAG, c(MAG), '| +', RING, c(RING), '| already', rows.filter(r => !r.add.length).length, '| skipped (owner)', rows.filter(r => r.skip).map(r => r.a + (r.add.length ? ' would +' + r.add : '')).join(', '), '| disputed', disp.length);
    for (const r of rows) console.log(r.a, r.g, 'v' + r.vis, r.skip ? 'SKIP' : '', '|', r.title.slice(0, 60), '|', r.before.join(';') || '—', '->', r.add.length ? '+' + r.add.join(' +') : '(есть)', '|', r.why.slice(0, 110));
    for (const d of disp) console.log('DISP', d.a, d.what, '|', d.title.slice(0, 60), '|', d.why, '|', d.q.slice(0, 100));
    return; }
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')); const ARTS = plan.map(x => x.article);
  const exp = async arts => { const out = []; for (let i = 0; i < arts.length; i += 100) { const r = await call('horoshop_catalog_export', { expr: { article: arts.slice(i, i + 100) }, includedParams: FIELDS, limit: 100, allowLarge: true }); if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 300)); out.push(...r.response.products); } return out; };
  if (MODE === 'backup') { const b = await exp(ARTS); if (b.length !== ARTS.length) stop('backup count ' + b.length); const d = await call('horoshop_admin_dictionary_values', { book: BOOK, allowLarge: true });
    const f = BK + `feat_1020_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify({ products: b, dict394: d.values })); console.log('backup', f, b.length, 'products, dict', d.values.length); }
  if (MODE === 'dry' || MODE === 'write') { const d = await call('horoshop_catalog_import', { products: plan, dryRun: true }); const bad = [];
    for (const w of d.willChange || []) for (const k of Object.keys(w.changes || w.fields || {})) if (!/^characteristics/.test(k)) bad.push(w.article + ':' + k);
    for (const c of d.characteristics || []) for (const k of Object.keys(c.write || {})) if (k !== K) bad.push(c.article + ': char ' + k);
    console.log('dry', JSON.stringify(d.summary), 'schema warnings', JSON.stringify(d.characteristicSchemaWarnings || null)); console.log(JSON.stringify(d).slice(0, 1500));
    if (bad.length) stop('unexpected ' + bad.join(', '));
    if (MODE === 'write') { const r = await call('horoshop_catalog_import', { products: plan, dryRun: false }); console.log('write', JSON.stringify(r).slice(0, 600)); } }
  if (MODE === 'ru') { const d = await call('horoshop_admin_dictionary_values', { book: BOOK, allowLarge: true });
    for (const v of d.values.filter(v => RU[v.value])) { const x = await call('horoshop_admin_dictionary_value_set', { book: BOOK, valueId: v.id, titles: { ru: RU[v.value] }, dryRun: true }); console.log(v.id, v.value, 'dry', JSON.stringify(x).slice(0, 300));
      if ((x.willChange || x.changes || []).length) { const w = await call('horoshop_admin_dictionary_value_set', { book: BOOK, valueId: v.id, titles: { ru: RU[v.value] }, dryRun: false }); console.log('  write', JSON.stringify(w).slice(0, 300)); } } }
  if (MODE === 'verify') { const before = JSON.parse(fs.readFileSync(BK + fs.readdirSync(BK).filter(x => /^feat_1020_before_\d+\.json$/.test(x)).sort().pop(), 'utf8')).products;
    const after = await exp(ARTS); const B = Object.fromEntries(before.map(p => [p.article, p])); const P = Object.fromEntries(plan.map(x => [x.article, x])); const bad = []; const ids = l => (l || []).map(x => +x.id).sort((a, b) => a - b).join(',');
    for (const p of after) { const b = B[p.article], x = P[p.article];
      for (const f of ['title', 'mod_title']) if (JSON.stringify(p[f]) !== JSON.stringify(b[f])) bad.push(p.article + ' ' + f);
      if (+p.parent.id !== +b.parent.id || ids(p.alt_parent) !== ids(b.alt_parent)) bad.push(p.article + ' parent/alt_parent changed');
      for (const k of new Set([...Object.keys(p.characteristics || {}), ...Object.keys(b.characteristics || {})])) { const want = k === K ? x.characteristics[K] : vals(b, k);
        if (JSON.stringify([...vals(p, k)].sort()) !== JSON.stringify([...want].sort())) bad.push(`${p.article} ${k}: ${vals(p, k).join(', ')}`); }
      for (const v of (p.characteristics || {})[K] || []) if (RU[v.value.ua] && v.value.ru !== RU[v.value.ua]) bad.push(`${p.article} RU ${v.value.ua} = ${v.value.ru}`);
      if (p.price !== b.price || +p.display_in_showcase !== +b.display_in_showcase) bad.push(p.article + ' price/visibility'); }
    const f = BK + `feat_1020_after_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(after)); console.log('verify', after.length, 'problems', bad.length); bad.forEach(x => console.log(' ', x)); }
  if (S) S.close();
})();
