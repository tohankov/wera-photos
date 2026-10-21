// Group definition «Тріскачки та приладдя Zyklop» (1270) for cat/import_group.js.
const { out, disputed, VYD_RU, DRV_RU } = require('./zyklop.js');
const VYD_ORDER = ['Торцева головка', 'Торцева головка подовжена', 'Торцева головка з фіксуючою функцією', 'Торцева головка ударна Impaktor', 'Торцева головка ударна Impaktor подовжена', 'Викруткова головка', 'Тріскачка', 'Набір з тріскачкою', 'Набір головок', 'Перехідник', 'Приладдя'];
const DRV_ORDER = ['квадрат 1/4″', 'квадрат 3/8″', 'квадрат 1/2″', 'шестигранник 1/4″', 'Zyklop Mini 2 (пряме приєднання головок)'];
const items = out.map(v => ({ a: v.a, title: v.title, secs: v.secs, sec: v.sec, kind: v.kind, vals: {
  vyd_instrumentu: [].concat(v.vyd || []), pryvid: v.drv, profil: v.profile ? [v.profile] : [], rozmir_holovky: v.size[0] ? [v.size[0]] : [], dovzhyna_holovky: v.len[0] ? [v.len[0]] : [] } }));
module.exports = {
  name: 'zyklop', root: 1270, seed: '05003365001', testArticle: '05049002001',
  chars: [
    { key: 'vyd_instrumentu', title: 'Вид інструменту', titleRu: 'Вид инструмента', order: 'given', values: VYD_ORDER, ru: VYD_RU, book: 388, newValues: VYD_ORDER }, // shared with other groups since 16.10 (created by this group)
    { key: 'pryvid', title: 'Привід', titleRu: 'Привод', order: 'given', values: DRV_ORDER, ru: DRV_RU },
    { key: 'profil', title: 'Профіль', book: 382 },
    { key: 'rozmir_holovky', title: 'Розмір головки', titleRu: 'Размер головки', order: 'asc' },
    { key: 'rozmir_nakonechnyka', title: 'Профіль і розмір', book: 392 },   // screwdriver heads and sets since 21.10.2026 (cat/zyk_pr.js)
    { key: 'dovzhyna_holovky', title: 'Довжина головки', titleRu: 'Длина головки', order: 'asc' },
  ],
  items, disputed,
  required: it => it.kind ? ['vyd_instrumentu', 'pryvid', 'profil', (it.vals.rozmir_nakonechnyka || []).length ? 'rozmir_nakonechnyka' : 'rozmir_holovky', 'dovzhyna_holovky'] : ['vyd_instrumentu', 'pryvid'],
  filterOrder: ['Хіти продажів', 'Вид інструменту', 'Ціна', 'Привід', 'Профіль', 'Профіль і розмір', 'Розмір головки', 'Довжина головки'],
};
// sets get all values of their composition (cat/sets_fill.js)
{ const F = require('./sets_fill.js')(module.exports.name, module.exports.items, module.exports.chars); module.exports.items = F.items; module.exports.disputed = [...module.exports.disputed, ...F.disputed]; module.exports.setsReport = F.report; }
// owner 21.10.2026 (night report item 2): screwdriver heads carry «Профіль і розмір» (392, format A, cat/pr_size.js tipValues) instead of «Розмір головки»;
// sets — 392 = the sizes of their «… у складі» (TX BO -> TX), the bare head sizes («20», «8,0») leave «Розмір головки», nut sizes stay. XZN — as is.
// A size missing in the 392 dictionary keeps the old way: the head's whole section (no half-converted filter) and such sets (owner's decision pending). Written by cat/zyk_pr.js.
{ const P = require('./pr_size.js'); const D392 = require('./pr_size_values.json').dict.rozmir_nakonechnyka; const SNAPV = (P.SNAP || {}).values || {};
  const SKK = ['sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'];
  const norm = s => String(s).replace(/\u00a0/g, '').replace(/ мм$/, '').replace(/^#/, '').trim(); const num = s => { const m = norm(s).replace(',', '.'); return /^\d+(\.\d+)?$/.test(m) ? String(parseFloat(m)) : m; };
  const sizeOf = x => num(x.replace(/^(PH\/S|PZ\/S|PH|PZ|TX|IP|IPR|HEX|Квадрат|Торцева|TRI-WING®) #?/, '').replace(/^SL [\d,]+×/, '')); const bare = s => /^\d+(,\d+)?$/.test(norm(s)) && !/мм/.test(s);
  const items = module.exports.items; const heads = items.filter(it => ['TX', 'HEX', 'PH', 'PZ', 'SL'].includes(it.kind)); const tip = new Map(heads.map(it => [it, P.tipValues(it.a, it.vals.profil, it.vals.rozmir_holovky)]));
  const hold = new Set(heads.filter(it => tip.get(it).some(x => !D392.includes(x))).map(it => it.sec));
  for (const it of heads) { const r = tip.get(it); if (r.length && !hold.has(it.sec)) { it.vals.rozmir_nakonechnyka = r; it.vals.rozmir_holovky = []; } }
  for (const it of items) { if (it.kind) continue; const uni = [...new Set(SKK.flatMap(k => (SNAPV[k] || {})[it.a] || []).filter(x => !/не вказано/.test(x)).map(x => x.replace(/^TX BO /, 'TX ')))];
    const old = it.vals.rozmir_holovky || [], bo = old.filter(bare); if (!uni.length && !bo.length) continue; if (uni.some(x => !D392.includes(x))) continue;
    const neu = D392.filter(x => uni.includes(x)); const cov = new Set(neu.map(sizeOf)); if (bo.some(x => !cov.has(num(x)))) continue;
    it.vals.rozmir_nakonechnyka = neu; it.vals.rozmir_holovky = old.filter(x => !bare(x)); } }
