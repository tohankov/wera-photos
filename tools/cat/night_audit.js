// Night 20–21.10.2026: audit of one catalog group + the admin plan for its filters (read-only; data from a full export and a storefront scan).
//   node cat/night_audit.js <group> <live.json> <scan.json> <menu_tree.json>   -> inventory/night_<group>.xlsx + cat/night_plan_<group>.json
// live.json: lib/full_export.js (article,title,mod_title,parent,alt_parent,display_in_showcase,characteristics,link); scan.json: vt/sec_scan.js of the
// catalog in menu order; menu_tree.json: [{id, depth, path}] in the admin menu order.
// Plan rules (owner, night task): «Хіти продажів» and «Ціна» first; a filter is useful in a section when its products carry it and NOT all of them carry the
// same value set («Довжина…» in mm stays); set sections (most products carry «… у складі») get ALL «… у складі» (23.10.2026) instead of «Профіль» and of the
// tip/bit size characteristics; «… у складі» never on the product page. The group section gets the list most of its listing sections can inherit;
// a section whose useful list differs gets its own full list. Filters without values in a section are hidden by Horoshop, so they do not force an own list.
const fs = require('fs'), path = require('path'), X = require('xlsx');
const [, , GK, LIVE, SCAN, TREE] = process.argv; const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')), SC = JSON.parse(fs.readFileSync(SCAN, 'utf8')), MT = JSON.parse(fs.readFileSync(TREE, 'utf8'));
const TITLE = { vyd_instrumentu: 'Вид інструменту', profil: 'Профіль', rozmir_nakonechnyka: 'Профіль і розмір', rozmir_robochoho_kintsia: 'Розмір робочого кінця', dovzhyna_robochoho_kintsia: 'Довжина робочого кінця',
  dovzhyna_stryzhnia: 'Довжина стрижня', osoblyvosti_vykrutky: 'Особливості викрутки', pryvid: 'Привід', rozmir_holovky: 'Розмір головки', dovzhyna_holovky: 'Довжина головки', rozmir_pid_kliuch: 'Розмір під ключ',
  systema_rozmiriv: 'Система розмірів', osoblyvosti_haikovoho_kliucha: 'Особливості гайкового ключа', rozmir_kliucha: 'Розмір ключа', dovzhyna_kliucha: 'Довжина ключа', pokryttia: 'Покриття', osoblyvosti_kliucha: 'Особливості ключа',
  rozmir: 'Розмір', dovzhyna: 'Довжина', typ_bity: 'Тип біти', khvostovyk: 'Хвостовик', osoblyvosti: 'Особливості', dovzhyna_bitotrymacha: 'Довжина бітотримача', osoblyvosti_bitotrymacha: 'Особливості бітотримача',
  pryiednannia_do_instrumenta: 'Приєднання до інструмента', pryiednannia_nasadky: 'Приєднання насадки', diametr_sverdla: 'Діаметр свердла', rizba: 'Різьба', typ_bit_u_nabori: 'Тип біт у наборі',
  diapazon_momentu: 'Діапазон моменту', nalashtuvannia_momentu: 'Налаштування моменту', typ_nasadky: 'Тип насадки', rozmir_nasadky: 'Розмір насадки', osoblyvosti_dynamometra: 'Особливості динамометра',
  komplektatsiia: 'Комплектація', instrument_u_lozhementi: 'Інструмент у ложементі',
  sklad_ph: 'PH у складі', sklad_pz: 'PZ у складі', sklad_tx: 'TX у складі', sklad_sl: 'SL у складі', sklad_hex: 'HEX у складі', sklad_kvadrat: 'Квадрат у складі', sklad_tx_bo: 'TX BO у складі', sklad_plusminus: 'PlusMinus у складі' };
const SKLAD = ['sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'];
const SETSIZE = new Set(['profil', 'rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'rozmir']);   // replaced by «… у складі» in set sections
const CORE = new Set(['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'rozmir_holovky', 'rozmir_kliucha', 'rozmir_pid_kliuch', 'rozmir', 'diapazon_momentu']);   // a product without it disappears when it is filtered
// owner's own lists (22.10.2026, docs/filters_rule_check.md п. 6, 7; 1231 + «Особливості викрутки» — as the owner set it in the admin, 22.10 (i)): Ручки-тримачі Kompakt VDE, Спеціальні вставки Kompakt VDE; «Спеціальні викрутки … Kraftform Micro» (+ ESD) — the list of 20.10
const OWNER_LIST = { 1231: ['vyd_instrumentu', 'diapazon_momentu', 'osoblyvosti_vykrutky'], 1232: ['vyd_instrumentu', 'profil', 'dovzhyna_robochoho_kintsia'],
  1130: ['vyd_instrumentu', 'rozmir_nakonechnyka', 'dovzhyna_stryzhnia'], 1148: ['vyd_instrumentu', 'rozmir_nakonechnyka', 'dovzhyna_stryzhnia'],
  // owner 23.10.2026: «Поперечна ручка-тримач Rapidaptor» (серія 400) and «Тріскачки та набори Zyklop VDE ¼» — «Хіти продажів → Ціна»; Zyklop Pocket — as he set it:
  // no «Привід», «PH у складі» after «TX у складі»
  // owner 23.10.2026: «Інструментальний візок та ложементи» is a set section — all 8 «… у складі» after «Комплектація» and «Інструмент у ложементі», as he set it
  1055: ['komplektatsiia', 'instrument_u_lozhementi', 'sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus'],
  1138: [], 1456: [], 1271: ['sklad_pz', 'sklad_tx', 'sklad_ph', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus', 'rozmir_holovky', 'dovzhyna_holovky'] };
const SET_SEC = new Set([1055]);   // owner 23.10.2026: set sections whose products are not «Набір…» by kind (trolleys / inlays)
const VYD_KEEP = new Set([1129, 1130, 1148]);   // owner 21.10.2026: «Набори викруток для електронників, серія Kraftform Micro» keeps «Вид інструменту» (4 kinds); owner 20.10 / 22.10.2026: both «Спеціальні викрутки … Kraftform Micro» (1130) and «… Micro ESD» (1148) — with «Вид»
const SIZE = ['rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'rozmir_holovky', 'rozmir_kliucha', 'rozmir_pid_kliuch', 'rozmir', 'rozmir_nasadky'];
const GROUPS = {
  vde: { root: 1224, name: 'Діелектричні інструменти', order: ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'dovzhyna_robochoho_kintsia', 'pryvid', 'osoblyvosti_vykrutky'], link: ['profil', 'rozmir_nakonechnyka', 'rozmir_robochoho_kintsia'] },
  // 21.10.2026: screwdriver heads and sets carry «Профіль і розмір» (cat/zyk_pr.js), «Розмір головки» — nut sockets
  zyklop: { root: 1270, name: 'Тріскачки та приладдя Zyklop', order: ['vyd_instrumentu', 'pryvid', 'profil', 'rozmir_nakonechnyka', 'rozmir_holovky', 'dovzhyna_holovky'], link: ['pryvid', 'rozmir_nakonechnyka', 'rozmir_holovky'] },
  joker: { root: 1185, name: 'Гайкові ключі Joker', order: ['vyd_instrumentu', 'rozmir_pid_kliuch', 'systema_rozmiriv', 'osoblyvosti_haikovoho_kliucha'], link: ['rozmir_pid_kliuch'] },
  lkeys: { root: 1152, name: 'Г-подібні ключі', order: ['vyd_instrumentu', 'profil', 'rozmir_kliucha', 'dovzhyna_kliucha', 'pokryttia', 'osoblyvosti_kliucha'], link: ['profil', 'rozmir_kliucha'] },
  kk: { root: 1057, name: 'Інструменти серії Kraftform Kompakt', order: ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'osoblyvosti_vykrutky'], link: ['profil', 'rozmir_nakonechnyka'] },
  bits: { root: 1061, name: 'Біти та бітотримачі', order: ['vyd_instrumentu', 'profil', 'rozmir', 'dovzhyna', 'typ_bity', 'khvostovyk', 'osoblyvosti', 'dovzhyna_bitotrymacha', 'osoblyvosti_bitotrymacha', 'pryiednannia_do_instrumenta', 'pryiednannia_nasadky', 'diametr_sverdla', 'rizba', 'typ_bit_u_nabori'], link: ['profil', 'rozmir', 'dovzhyna'], subRoots: [1062, 1081, 1082, 1089, 1090, 1460] },
  biti: { root: 1062, name: 'Біти', order: ['profil', 'rozmir', 'dovzhyna', 'typ_bity', 'khvostovyk', 'osoblyvosti', 'vyd_instrumentu'], link: ['profil', 'rozmir', 'dovzhyna'] },
  holders: { root: 1081, name: 'Бітотримачі', order: ['vyd_instrumentu', 'dovzhyna_bitotrymacha', 'osoblyvosti_bitotrymacha'], link: ['osoblyvosti_bitotrymacha'] },
  bitsets: { root: 1082, name: 'Набори з бітами', order: ['vyd_instrumentu', 'typ_bit_u_nabori', 'dovzhyna', 'rozmir', 'profil'], link: [] },
  adapters: { root: 1089, name: 'Перехідники та адаптери', order: ['vyd_instrumentu', 'pryiednannia_do_instrumenta', 'pryiednannia_nasadky'], link: ['pryiednannia_do_instrumenta', 'pryiednannia_nasadky'] },
  drills: { root: 1090, name: 'Свердла та мітчики', order: ['vyd_instrumentu', 'diametr_sverdla', 'rizba'], link: ['diametr_sverdla', 'rizba'] },
  stands: { root: 1460, name: 'Підставки для біт', order: ['vyd_instrumentu'], link: [], card: ['vyd_instrumentu'] },   // TL64 carries the bit values only for the filters of «Мікробіти»
  dyn: { root: 1195, name: 'Динамометричний інструмент', order: ['vyd_instrumentu', 'diapazon_momentu', 'nalashtuvannia_momentu', 'pryvid', 'typ_nasadky', 'rozmir_nasadky', 'profil', 'rozmir_nakonechnyka', 'osoblyvosti_dynamometra'], link: ['diapazon_momentu', 'pryvid'] },
  trolley: { root: 1055, name: 'Інструментальний візок та ложементи', order: ['vyd_instrumentu', 'komplektatsiia', 'instrument_u_lozhementi', 'profil', 'pryvid'], link: ['instrument_u_lozhementi'] },
  vykrutky: { root: 1098, name: 'Викрутки', order: ['vyd_instrumentu', 'profil', 'rozmir_nakonechnyka', 'dovzhyna_stryzhnia', 'osoblyvosti_vykrutky'], link: ['profil', 'rozmir_nakonechnyka'] },
  rest: { roots: [1267, 1269, 1056, 1313, 1268], name: 'Інші розділи', order: ['vyd_instrumentu', 'profil', 'pryvid'], link: [] },
  novynky: { root: 1267, name: 'Новинки і лімітовані серії', order: ['vyd_instrumentu', 'profil', 'pryvid'], link: [] },
  bags: { root: 1269, name: 'Сумки для інструментів Wera 2go', order: ['vyd_instrumentu'], link: [] },
  bike: { root: 1056, name: 'Інструменти для велосипедів та електробайків', order: ['vyd_instrumentu', 'profil', 'pryvid'], link: [] },
  impact: { root: 1313, name: 'Ударні гвинтоверти', order: ['vyd_instrumentu', 'profil', 'pryvid'], link: [] },
  hammers: { root: 1268, name: 'Молотки та приладдя', order: ['vyd_instrumentu'], link: [] } };
const G = GROUPS[GK]; if (!G) throw new Error('group?');
const byId = Object.fromEntries(MT.map(t => [t.id, t])); const kids = {}; { const st = []; for (const t of MT) { while (st.length && st[st.length - 1].depth >= t.depth) st.pop(); if (st.length) (kids[st[st.length - 1].id] = kids[st[st.length - 1].id] || []).push(t.id); st.push(t); } }
const sub = r => { const s = [r], q = [r]; while (q.length) for (const k of kids[q.shift()] || []) { s.push(k); q.push(k); } return s; };
const roots = G.roots || [G.root]; const SECS = roots.flatMap(sub); const inG = new Set(SECS);
const secs = p => [p.parent && p.parent.id, ...(p.alt_parent || []).map(x => x.id)].map(Number); const vis = p => +p.display_in_showcase === 1;
const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const listing = id => SC[id] && SC[id].ua.status === 200 && SC[id].ua.products.length > 0;
const prodIn = id => L.filter(p => vis(p) && secs(p).includes(id));
const isSet = p => SKLAD.some(k => v(p, k).length) || v(p, 'vyd_instrumentu').some(x => /^Набір|Набор|^Викрутка з набором біт$/.test(x));   // 22.10.2026: a handle + bits is a set
// characteristics a section's products carry, in the group's order, then the others met there
const ALLK = [...new Set([...G.order, ...Object.keys(TITLE).filter(k => !SKLAD.includes(k))])];
// a feature (признак): «Особливості …» (incl. «Особливості динамометра», owner 22.10.2026), «… у складі», «Тип біт у наборі», «Інструмент у ложементі» — partial by nature
const isAcc = p => { const vy = v(p, 'vyd_instrumentu').join(', '); return /Приладдя|Ручка-тримач|Футляр|Підставка|Тримач|Сумка|Знімач|Бітотримач/i.test(vy) && !/Набір/.test(vy); };
const ISFEAT = k => /^osoblyvosti/.test(k) || SKLAD.includes(k) || k === 'typ_bit_u_nabori' || k === 'instrument_u_lozhementi';
// owner 22.10.2026 (docs/filters_rule_check.md п. 6): a filter where every product carrying it has the same single value is not set — except «Довжина …» in mm;
// «Довжина ключа» (Стандартний / Подовжений / Короткий — a category, not mm) with one value is not set; a feature stays even on 1 product (owner 22.10 (i); before — 2+), not when all are the same.
// A filter is NOT dropped because an accessory / handle has no value (a product without the property is not invented a value).
function useful(ps, k) { const n = ps.filter(p => v(p, k).length).length; if (n && !G.order.includes(k) && !SKLAD.includes(k) && n * 2 < ps.length) return { n, d: 0, use: false, why: `чужа характеристика, лише у ${n} з ${ps.length}` }; const vals = new Set(ps.flatMap(p => v(p, k))); if (!n) return { n, d: 0, use: false, why: 'немає значень' };
  // any filter but a feature («Особливості…», partial by nature) and «… у складі» needs at least half of the section (21.10.2026: «Привід» on 1 of 28 VDE sets)
  // owner 22.10.2026: a length («Довжина …») stays wherever some products carry it (ESD sets: 3 screwdriver sets of 7 have blade lengths, handle + bits sets have none)
  // owner 22.10 (i): a feature or a length on 1 product is NOT dropped (it starts working by itself with new products) — only a filter where ALL products have the same value
  if (/^dovzhyna/.test(k) && [...vals].every(x => / мм$/.test(x))) return { n, d: vals.size, use: true };
  if (ISFEAT(k)) { if (n === ps.length && new Set(ps.map(p => JSON.stringify(v(p, k).sort()))).size === 1) return { n, d: vals.size, use: false, why: `у всіх однакове значення «${v(ps[0], k).join(' + ')}»` }; return { n, d: vals.size, use: true }; }
  // 22.10 (i): accessories (holders, belts, bags, handles …) do not vote in «half of the section» — a filter is not dropped because an accessory has no value
  // («Набори головок Zyklop ¼»: «Розмір головки» on 6 of 14, of 11 without the 3 «Приладдя»); only where accessories are a minority — in a section of
  // accessories / handles they are the main products and vote
  const acn = ps.filter(isAcc).length, base = acn * 2 < ps.length ? ps.length - acn : ps.length;
  if (n * 2 < base) return { n, d: vals.size, use: false, why: `лише у ${n} з ${ps.length} товарів${base < ps.length ? ` (без приладдя — з ${base})` : ''}` };
  // owner 23.10.2026: «one value for all» = every product carrying it has the same SET of values (Zyklop Pocket: «Привід» квадрат 3/8″ + шестигранник 1/4″ on all 6) —
  // the products' value sets are compared, not the number of distinct values
  const sets = new Set(ps.filter(p => v(p, k).length).map(p => JSON.stringify(v(p, k).sort())));
  if (sets.size === 1) { const one = JSON.parse([...sets][0]); return { n, d: vals.size, use: false, why: `у всіх ${one.length > 1 ? 'однаковий набір' : 'одне значення'} «${one.join(' + ')}»${n < ps.length ? ` (у ${n} з ${ps.length}, решта без значення)` : ''}` }; }
  return { n, d: vals.size, use: true }; }
const secRows = [], missing = [], single = []; const plans = {};
for (const id of SECS) { const t = byId[id]; const sc = SC[id]; const ps = prodIn(id); const hid = L.filter(p => !vis(p) && secs(p).includes(id)).length;
  const row = { id, path: t.path, depth: t.depth, status: sc ? sc.ua.status : '-', shows: listing(id) ? 'товари' : (kids[id] || []).length ? 'плитки підрозділів' : 'порожньо', vis: ps.length, hid, filtersNow: sc ? sc.ua.filters.filter(f => f.title !== '?').map(f => `${f.title}(${f.vals.length})`).join(', ') : '' };
  secRows.push(row); if (!listing(id)) continue;
  const setSec = SET_SEC.has(+id) || ps.filter(isSet).length * 2 >= ps.length; row.kind = setSec ? 'набори' : 'товари';
  const cand = setSec ? [...ALLK.filter(k => !SETSIZE.has(k)).slice(0, 1), ...SKLAD, ...ALLK.filter(k => !SETSIZE.has(k)).slice(1)] : ALLK;
  // owner 23.10.2026: a section of 1 product — no own list (inherits); 2 products — by the general rules (the «2 → Хіти → Ціна» rule of 23.10 (k) is cancelled,
  // owner's exceptions in OWNER_LIST: 1138, 1456); a set section gets ALL «… у складі» (PH … PlusMinus), with or without values: Horoshop hides an empty one
  const use = [], drop = [];
  if (ps.length <= 1) drop.push(`розділ з ${ps.length} товаром — фільтри не потрібні`);
  else for (const k of cand) { if (setSec && SKLAD.includes(k)) { use.push(k); continue; } const u = useful(ps, k); if (u.use) use.push(k); else if (u.n) { drop.push(`${TITLE[k]}: ${u.why}`); if (!SKLAD.includes(k)) single.push({ path: t.path, char: TITLE[k], why: u.why, n: ps.length }); } }
  // «Профіль» next to «Профіль і розмір» repeats it (the owner's «Викрутки» have no «Профіль»)
  { const i = use.indexOf('profil'); if (i >= 0 && use.includes('rozmir_nakonechnyka')) { use.splice(i, 1); drop.push('Профіль: є «Профіль і розмір»'); } }
  // «Вид інструменту»: only when the second kind is at least a fifth of the section (19 screwdrivers + 2 handles is not a choice),
  // or the products outside the main kind are at least a fifth (22.10.2026: «Набори Kraftform Kompakt» 57 + 14 + 11), or the owner kept it (VYD_KEEP)
  { const i = use.indexOf('vyd_instrumentu'); if (i >= 0) { const c = {}; for (const p of ps) for (const x of v(p, 'vyd_instrumentu')) c[x] = (c[x] || 0) + 1; const s = Object.values(c).sort((a, b) => b - a);
    const main = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0], rest = ps.filter(p => v(p, 'vyd_instrumentu').length && !v(p, 'vyd_instrumentu').includes(main)).length;   // a product without a kind is no choice
    if (!(s[1] >= Math.max(2, ps.length * 0.2) || rest >= Math.max(2, ps.length * 0.2) || VYD_KEEP.has(+id))) { use.splice(i, 1); drop.push(`Вид інструменту: майже всі одного виду (${Object.entries(c).sort((a, b) => b[1] - a[1]).map(x => x.join(' ')).join(', ')})`); } } }
  // «Розмір робочого кінця» / «Розмір» (bare sizes) duplicate a main size filter of the section: not both
  for (const k of ['rozmir_robochoho_kintsia', 'rozmir']) { const i = use.indexOf(k); if (i >= 0 && use.some(x => x !== k && SIZE.includes(x) && x !== 'rozmir_nasadky')) { use.splice(i, 1); drop.push(`${TITLE[k]}: дублює основний розмір розділу`); } }
  // set sections: a bare size / profile is not a filter there (sizes are in «… у складі»)
  if (setSec) for (const k of SETSIZE) { if (ps.some(p => v(p, k).length)) drop.push(`${TITLE[k]}: у наборах — «… у складі»`); }
  if (OWNER_LIST[id]) { use.length = 0; use.push(...OWNER_LIST[id].filter(k => (setSec && SKLAD.includes(k)) || ps.some(p => v(p, k).length))); drop.push('список власника'); }
  plans[id] = { path: t.path, setSec, tiny: ps.length <= 1, owner: !!OWNER_LIST[id], use, drop, present: [...cand, ...SETSIZE].filter(k => ps.some(p => v(p, k).length)) };
  row.planned = use.map(k => TITLE[k]).join(', '); row.notUsed = drop.join('; ');
  for (const p of ps) for (const k of use.filter(k => CORE.has(k) && G.order.includes(k) && (k === 'vyd_instrumentu' || !isSet(p)))) if (!v(p, k).length) missing.push({ path: t.path, a: p.article, title: p.title.ua, char: TITLE[k], vyd: v(p, 'vyd_instrumentu').join(', ') }); }
// the group list: per characteristic, in the group's order — taken when more listing sections use it than have it but do not use it
const ids = Object.keys(plans).map(Number); const rootList = [];
// a set section has its own list anyway («… у складі» instead of profile/sizes): it does not vote against a profile/size key of the group list (21.10.2026)
const keysAll = [...new Set(ids.flatMap(id => [...plans[id].use, ...plans[id].present]))];
const orderKey = k => { const i = [...G.order, ...SKLAD].indexOf(k); return i < 0 ? 100 + ALLK.indexOf(k) : i; };
const nSet = ids.filter(id => plans[id].setSec).length;
// an empty «… у складі» of a set section (all of them are listed there, 23.10.2026) does not vote for the group list
for (const k of keysAll.sort((a, b) => orderKey(a) - orderKey(b))) { const u = ids.filter(id => plans[id].use.includes(k) && (!SKLAD.includes(k) || plans[id].present.includes(k))).length, bad = ids.filter(id => !plans[id].use.includes(k) && plans[id].present.includes(k) && !(plans[id].setSec && SETSIZE.has(k))).length;
  if (SKLAD.includes(k) ? nSet * 2 < ids.length : !G.order.includes(k)) continue; if (u >= 2 && u > bad) rootList.push(k); }
// a group the owner has already set up (cat/night_plan_<group>_configured.json, 22.10.2026): its group list stays as configured while every key of it is still
// used by 2+ listing sections — fewer changes in the admin; the subsections' own lists are computed against it
{ const cf = path.join(__dirname, `night_plan_${GK}_configured.json`); if (fs.existsSync(cf)) { const cr = JSON.parse(fs.readFileSync(cf, 'utf8')).rootList;
    if (cr.every(k => ids.filter(id => plans[id].use.includes(k)).length >= 2) && JSON.stringify(cr) !== JSON.stringify(rootList)) { console.log('group list kept as configured:', cr.join(', '), '(rules gave', rootList.join(', ') + ')'); rootList.length = 0; rootList.push(...cr); } } }
// a group of one listing section (the group section itself lists the products): its list is that section's list
if (ids.length === 1) { rootList.length = 0; const P1 = plans[ids[0]]; rootList.push(...(P1.setSec && !P1.owner ? [...P1.use.filter(k => k === 'vyd_instrumentu'), ...P1.use.filter(k => SKLAD.includes(k)), ...P1.use.filter(k => k !== 'vyd_instrumentu' && !SKLAD.includes(k))] : P1.use)); }
// set keys go after «Вид інструменту»: in the group list only when most listing sections are set sections
const own = []; for (const id of ids) { const P0 = plans[id]; const inh = rootList.filter(k => P0.present.includes(k)); const want = [...P0.use].sort((a, b) => (P0.setSec && SKLAD.includes(a) !== SKLAD.includes(b) ? 0 : 0) || orderKey(a) - orderKey(b));
  // set sections: «Вид інструменту», then «… у складі», then the rest
  const ordered = P0.setSec ? [...want.filter(k => k === 'vyd_instrumentu'), ...want.filter(k => SKLAD.includes(k)), ...want.filter(k => k !== 'vyd_instrumentu' && !SKLAD.includes(k))] : want;
  // inherit or not — by what the storefront would show: an empty «… у складі» of the own list is hidden anyway
  const wantP = want.filter(k => P0.present.includes(k));
  P0.list = P0.owner ? want.slice().sort((a, b) => OWNER_LIST[id].indexOf(a) - OWNER_LIST[id].indexOf(b)) : ordered; P0.inherits = P0.tiny || JSON.stringify([...inh].sort()) === JSON.stringify([...wantP].sort()) && !P0.owner;
  // «Біти» (owner 22.10.2026): a subsection gets its own list only where 2+ inherited filters are dead (one value), «Довжина» not counted; only «Профіль» dead — as is
  if (GK === 'biti' && !P0.inherits && wantP.every(k => inh.includes(k)) && inh.filter(k => !wantP.includes(k) && !/^dovzhyna/.test(k)).length < 2) P0.inherits = true;
  if (!P0.inherits) own.push(id); }
// product page: what the group's products carry (main section in the group), «… у складі» never
const mains = L.filter(p => vis(p) && inG.has(+p.parent.id)); const card = G.card || ALLK.filter(k => mains.filter(p => v(p, k).length).length >= Math.max(1, mains.length * 0.02)).sort((a, b) => orderKey(a) - orderKey(b));
const link = G.link.filter(k => rootList.includes(k));
// products visible but in no section that lists products (only in a parent that shows tiles)
const orphan = L.filter(p => vis(p) && secs(p).some(s => inG.has(s)) && !secs(p).some(s => listing(s))).map(p => ({ a: p.article, title: p.title.ua, sections: secs(p).map(s => (byId[s] || { path: s }).path).join(' | ') }));
// accessories / holders carrying tip or key sizes
const acc = []; for (const p of L.filter(p => vis(p) && secs(p).some(s => inG.has(s)))) { const vy = v(p, 'vyd_instrumentu').join(', '); if (!/Приладдя|Ручка-тримач|Футляр|Підставка|Тримач|Сумка/i.test(vy) || /Набір/.test(vy)) continue;
  const sz = SIZE.filter(k => v(p, k).length); if (sz.length) acc.push({ a: p.article, title: p.title.ua, vyd: vy, what: sz.map(k => `${TITLE[k]}: ${v(p, k).length} знач. (${v(p, k).slice(0, 4).join(', ')}${v(p, k).length > 4 ? '…' : ''})`).join('; ') }); }
// name <-> characteristics (profile tokens and features), only where the group has the characteristic
const nameChk = []; const FEAT = { osoblyvosti_vykrutky: 1, osoblyvosti_kliucha: 1, osoblyvosti_haikovoho_kliucha: 1, osoblyvosti_bitotrymacha: 1, osoblyvosti: 1, osoblyvosti_dynamometra: 1 };
const PROFT = [[/\bPH\b(?!\/S)/, /^PH /], [/\bPZ\b(?!\/S)/, /^PZ /], [/\bTX\b(?! BO)|TORX®(?! PLUS| BO)/, /^TX /], [/\bSL\b|шліц/i, /^SL /], [/\bHEX\b|шестигран(?!н\S* стриж)/i, /^HEX/], [/квадрат/i, /^Квадрат/]];
for (const p of L.filter(p => vis(p) && inG.has(+p.parent.id))) { const n = p.title.ua; const pr = v(p, 'profil'); const fk = Object.keys(FEAT).filter(k => G.order.includes(k)); const f = [...fk.flatMap(k => v(p, k)), ...v(p, 'pokryttia')]; const issues = [];
  if (pr.length && !isSet(p)) for (const [re, pv] of PROFT) if (re.test(n) && !(pr.some(x => /PlusMinus/.test(x)) && /PH|PZ|SL|шліц/.test(re.source)) && !(/квадрат/.test(re.source) && /внутрішній квадрат/i.test(n)) && !pr.some(x => pv.test(x)) && !/(для|під|на) (біт|бит|насад)|шестигранн\S* (привод|хвостовик)/i.test(n)) issues.push(`у назві ${re.source.slice(0, 12)}, профілю немає (${pr.join(', ')})`);
  if (fk.length && !(GK === 'bits' && isSet(p))) { const want = [[/\bHF\b|фіксуюч/i, /HF|фіксуюч/i, 'HF'], [/\bESD\b/, /ESD/, 'ESD'], [/(?<!не)магніт/i, /магніт/i, 'магніт'], [/Stubby/i, /Stubby|Коротк/i, 'Stubby'], [/нержав/i, /нержав/i, 'нержавіюча сталь']];
    for (const [rn, rf, w] of want) if (rn.test(n) && !/без магніт/i.test(n) && !f.some(x => rf.test(x))) issues.push(`у назві ${w}, в «Особливостях» немає`); }
  if (issues.length) nameChk.push({ a: p.article, title: n, profil: pr.join(', '), feat: f.join(', '), issue: issues.join('; ') }); }
const empty = secRows.filter(r => r.shows === 'порожньо' && r.status === 200).map(r => r.path);
const out = { group: GK, name: G.name, roots, titles: TITLE, single: single.length, rootList, link, card, own: own.map(id => ({ id, path: plans[id].path, setSec: plans[id].setSec, list: plans[id].list })), plans, empty, orphan, counts: { sections: SECS.length, listing: ids.length, own: own.length, missing: missing.length, single: single.length, acc: acc.length, name: nameChk.length, orphan: orphan.length, empty: empty.length } };
fs.writeFileSync(path.join(__dirname, `night_plan_${GK}.json`), JSON.stringify(out, null, 1));
const F = `C:/Users/Techlight/Desktop/wera-photos/inventory/night_${GK}.xlsx`; const wb = fs.existsSync(F) ? X.readFile(F) : X.utils.book_new();
const put = (n, data) => { if (wb.Sheets[n]) { delete wb.Sheets[n]; wb.SheetNames = wb.SheetNames.filter(x => x !== n); } X.utils.book_append_sheet(wb, X.utils.json_to_sheet(data.length ? data : [{ '—': 'немає' }]), n); };
put('Розділи', secRows.map(r => ({ Розділ: r.path, Вітрина: r.shows, Видимих: r.vis, Прихованих: r.hid, 'Тип': r.kind || '', 'Фільтри зараз на вітрині': r.filtersNow, 'Фільтри за планом': r.planned || '', 'Не ставимо (чому)': r.notUsed || '', 'Свій список': plans[r.id] ? (plans[r.id].inherits ? 'ні (успадковує)' : 'ТАК') : '' })));
put('Без значення', missing.map(m => ({ Розділ: m.path, Артикул: m.a, Назва: m.title, 'Вид інструменту': m.vyd, 'Немає значення в': m.char })));
put('Одне значення', single.map(s => ({ Розділ: s.path, Фільтр: s.char, Чому: s.why, Товарів: s.n })));
put('Приладдя з розмірами', acc.map(x => ({ Артикул: x.a, Назва: x.title, 'Вид інструменту': x.vyd, Розміри: x.what })));
put('Назва ↔ характеристики', nameChk.map(x => ({ Артикул: x.a, Назва: x.title, Профіль: x.profil, Особливості: x.feat, Розбіжність: x.issue })));
put('Тільки в батьківському', orphan.map(x => ({ Артикул: x.a, Назва: x.title, Розділи: x.sections })));
X.writeFile(wb, F);
console.log(GK, JSON.stringify(out.counts)); console.log('group list:', ['Хіти продажів', 'Ціна', ...rootList.map(k => TITLE[k])].join(' → ')); console.log('links:', link.map(k => TITLE[k]).join(', '), '| card:', card.map(k => TITLE[k]).join(', '));
for (const o of out.own) console.log('OWN', o.path, '|', ['Хіти продажів', 'Ціна', ...o.list.map(k => TITLE[k])].join(' → '));
if (empty.length) console.log('EMPTY', empty.join(' | ')); if (orphan.length) console.log('ORPHAN', orphan.map(o => o.a + ' ' + o.sections).join(' || '));
module.exports = { TITLE };
