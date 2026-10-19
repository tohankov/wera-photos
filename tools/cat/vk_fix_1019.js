// Owner «ок» 19.10.2026 after the «Викрутки» storefront check (one-off, resumable by re-running):
//  1) 05059299001 Kompakt 41: title/mod_title without «SL» (the WERA composition has no slot bit);
//  2) 05059297001 Kompakt 62: UA «SPUNNER» -> «SPANNER» (title/mod_title; RU already «SPANNER»);
//  3) 05028074001 (only in the parent «Kraftform Plus – серія 300», which lists no products): + alt_parent «Набори викруток Kraftform Plus – серія 300» (1105), parent kept;
//     its characteristics are already those of the WERA composition (367 TORX HF TX 20/25/27/30 x 300 мм) — checked, not rewritten;
//  4) 6 non-tools of the screwdriver group without «Профіль і розмір»: every value of their screwdriver section(s) (CLAUDE.md non-tools rule).
//   node cat/vk_fix_1019.js plan <live.json> | backup | dry | write | verify
const fs = require('fs'), path = require('path'); const MODE = process.argv[2]; const BK = 'C:/Users/Techlight/Desktop/wera-photos/backup/';
const PLAN = path.join(__dirname, 'vk_fix_1019_plan.json'); const sleep = ms => new Promise(r => setTimeout(r, ms)); let S = null;
const call = async (t, a) => { S = S || require('../lib/session.js').open(); for (let k = 0; k < 20; k++) { await sleep(1000); const r = await S.call(t, a); const m = JSON.stringify(r || '').match(/[Rr]etry after (\d+)/);
  if (m) { console.log('429, wait', +m[1] + 5, 's'); await sleep((+m[1] + 5) * 1000); continue; } return r; } throw new Error('429 loop'); };
const stop = m => { console.log('STOP', m); if (S) S.close(); process.exit(2); };
const K41 = '05059299001', K62 = '05059297001', SET = '05028074001', SETSEC = 1105;
const PEERS = ['05008881001', '05008880001', '05027456001', '05051278001', '05023404001', '05027450001'];
// their sections in the screwdriver group («Викрутки» 1098 subtree); other sections (Kompakt 1060, Мікробіти 1459) give no values
const VK = new Set([1104, 1130, 1138, 1147, 1148]);
const FIELDS = ['article', 'parent', 'alt_parent', 'title', 'mod_title', 'price', 'display_in_showcase', 'characteristics'];
const exp = async arts => { const r = await call('horoshop_catalog_export', { expr: { article: arts }, includedParams: FIELDS, limit: 100, allowLarge: true }); if (!r.response) stop('export ' + JSON.stringify(r).slice(0, 300)); return r.response.products; };
const ARTS = [K41, K62, SET, ...PEERS];
(async () => {
  if (MODE === 'plan') { const L = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); const by = Object.fromEntries(L.map(p => [p.article, p]));
    const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number); const order = require('./pr_size_values.json').dict.rozmir_nakonechnyka;
    const plan = [];
    const t41 = { ua: `Набір Kraftform Kompakt 41 (PH, PZ, TX) WERA ${K41}`, ru: `Набор Kraftform Kompakt 41 (PH, PZ, TX) WERA ${K41}` }; plan.push({ article: K41, title: t41, mod_title: t41 });
    const p62 = by[K62]; const fix = s => s.replace('SPUNNER', 'SPANNER'); if (!/SPUNNER/.test(p62.title.ua)) stop('no SPUNNER in UA title');
    const t62 = { ua: fix(p62.title.ua), ru: p62.title.ru }; plan.push({ article: K62, title: t62, mod_title: t62 });
    plan.push({ article: SET, alt_parent: [...(by[SET].alt_parent || []).map(x => ({ id: x.id })), { id: SETSEC }] });
    for (const a of PEERS) { const p = by[a]; const ss = secs(p).filter(s => VK.has(s));
      const vals = new Set(L.filter(q => q.article !== a && +q.display_in_showcase === 1 && secs(q).some(s => ss.includes(s))).flatMap(q => ((q.characteristics || {}).rozmir_nakonechnyka || []).map(x => x.value.ua)));
      const list = order.filter(v => vals.has(v)); if (list.length !== vals.size) stop(a + ' value not in the dictionary order');
      plan.push({ article: a, characteristics: { rozmir_nakonechnyka: list }, _secs: ss }); }
    fs.writeFileSync(PLAN, JSON.stringify(plan, null, 1)); for (const x of plan) console.log(x.article, JSON.stringify(x.title || x.alt_parent || [x._secs, x.characteristics.rozmir_nakonechnyka.length, x.characteristics.rozmir_nakonechnyka.join(', ')]));
    return; }
  const plan = JSON.parse(fs.readFileSync(PLAN, 'utf8')); const payload = plan.map(({ _secs, ...x }) => x);
  if (MODE === 'backup') { const b = await exp(ARTS); if (b.length !== ARTS.length) stop('backup count ' + b.length); const f = BK + `vk_fix_1019_before_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(b)); console.log('backup', f, b.length); }
  if (MODE === 'dry' || MODE === 'write') { const d = await call('horoshop_catalog_import', { products: payload, dryRun: true }); const bad = [];
    for (const w of d.willChange || []) for (const k of Object.keys(w.changes || w.fields || {})) if (!/^(title|mod_title)\.(ua|ru)$|^alt_parent|^characteristics/.test(k)) bad.push(w.article + ':' + k);
    for (const c of d.characteristics || []) for (const k of Object.keys(c.write || {})) if (k !== 'rozmir_nakonechnyka') bad.push(c.article + ': char ' + k);
    console.log('dry', JSON.stringify(d.summary), 'schema warnings', JSON.stringify(d.characteristicSchemaWarnings || null)); console.log(JSON.stringify(d).slice(0, 2500));
    if (bad.length) stop('unexpected ' + bad.join(', '));
    if (MODE === 'write') { const r = await call('horoshop_catalog_import', { products: payload, dryRun: false }); console.log('write', JSON.stringify(r).slice(0, 600)); } }
  if (MODE === 'verify') { const before = JSON.parse(fs.readFileSync(BK + fs.readdirSync(BK).filter(x => /^vk_fix_1019_before_\d+\.json$/.test(x)).sort().pop(), 'utf8'));
    const after = await exp(ARTS); const B = Object.fromEntries(before.map(p => [p.article, p])); const P = Object.fromEntries(plan.map(x => [x.article, x])); const bad = [];
    const vals = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua); const ids = l => (l || []).map(x => +x.id).sort((a, b) => a - b).join(',');
    for (const p of after) { const b = B[p.article], x = P[p.article];
      for (const f of ['title', 'mod_title']) { const want = x[f] || b[f]; if (p[f].ua !== want.ua || p[f].ru !== want.ru) bad.push(`${p.article} ${f}: ${JSON.stringify(p[f])}`); }
      if (+p.parent.id !== +b.parent.id) bad.push(p.article + ' parent changed');
      const wantAlt = x.alt_parent ? x.alt_parent.map(y => y.id) : (b.alt_parent || []).map(y => y.id); if (ids(p.alt_parent) !== ids(wantAlt.map(id => ({ id })))) bad.push(`${p.article} alt_parent ${ids(p.alt_parent)} want ${ids(wantAlt.map(id => ({ id })))}`);
      for (const k of new Set([...Object.keys(p.characteristics || {}), ...Object.keys(b.characteristics || {})])) { const want = x.characteristics && x.characteristics[k] ? x.characteristics[k] : vals(b, k);
        if (JSON.stringify([...vals(p, k)].sort()) !== JSON.stringify([...want].sort())) bad.push(`${p.article} ${k}: ${vals(p, k).join(', ')}`); }
      if (p.price !== b.price || +p.display_in_showcase !== +b.display_in_showcase) bad.push(p.article + ' price/visibility'); }
    const f = BK + `vk_fix_1019_after_${Date.now()}.json`; fs.writeFileSync(f, JSON.stringify(after)); console.log('verify', after.length, 'problems', bad.length); bad.forEach(x => console.log(' ', x)); }
  if (S) S.close();
})();
