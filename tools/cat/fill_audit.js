// Owner 21.10.2026 (item 6): every product of a section must carry a value in every filter of that section (else it disappears when the filter is used).
// Groups «Викрутки» (1098), «Інструменти серії Kraftform Kompakt» (1057), «Діелектричні інструменти» (1224). Filters of a section = the storefront filters now
// (inventory/sections_map.json) ∪ the admin plan for it (cat/night_plan_<group>.json). Accessories (handles, holders, removers …) get no sizes.
//   node cat/fill_audit.js <live.json>  -> cat/fill_audit.json (missing: article × section × filter, with the product kind)
const fs = require('fs'), path = require('path');
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const MAP = require('../../inventory/sections_map.json'); const TITLE = require('./char_titles.js');
const KEY = Object.fromEntries(Object.entries(TITLE).map(([k, t]) => [t, k])); const C = require('./vyd_comp.js');
const secs = p => [...new Set([p.parent && +p.parent.id, ...(p.alt_parent || []).map(x => +x.id)].filter(Boolean))]; const v = (p, k) => ((p.characteristics || {})[k] || []).map(x => x.value.ua);
const SIZE = new Set(['profil', 'rozmir_nakonechnyka', 'rozmir_robochoho_kintsia', 'rozmir_holovky', 'rozmir', 'sklad_ph', 'sklad_pz', 'sklad_tx', 'sklad_sl', 'sklad_hex', 'sklad_kvadrat', 'sklad_tx_bo', 'sklad_plusminus']);
const ACCV = /^(Ручка-тримач|Знімач|Приладдя|Приладдя для викруток|Підставка \/ тримач|Бітотримач|Перехідник|Індикатор напруги)$/;
const kindOf = p => { const vy = v(p, 'vyd_instrumentu'); if (vy.some(x => /^Набір|Ложемент/.test(x))) return 'набір'; if (vy.length && vy.every(x => ACCV.test(x))) return 'приладдя'; return vy.length ? 'інструмент' : 'без виду'; };
const PLANS = {}; for (const g of ['vykrutky', 'kk', 'vde']) { const P = JSON.parse(fs.readFileSync(path.join(__dirname, `night_plan_${g}.json`), 'utf8'));
  for (const [id, pl] of Object.entries(P.plans)) PLANS[id] = { group: g, keys: pl.tiny ? [] : (pl.inherits ? P.rootList.filter(k => pl.present.includes(k)) : pl.list) }; }
// owner 22.10.2026 (docs/fill_gaps.md): not a gap by the rules — reported apart (cat/fill_audit_skipped.json), not in the gaps
const TORQUE = new Set(['diapazon_momentu', 'nalashtuvannia_momentu', 'osoblyvosti_dynamometra']);
const SCREW = /^(PH|PZ|TX|IP|SL|HEX|Квадрат|PlusMinus|TRI-WING|TORQ-SET|Spanner|Microstix|Pentalobe)/;   // screw profiles («Торцева головка …» is a nut / socket profile)
const NO_DATA = { '05135826001': 'Christmas MIX — один набор из витрины (932 A, 350 PH, 160 iS VDE): размеров и длин у WERA нет (владелец 22.10.2026)' };
// the written profiles of the set first (391 «Отвертка с гибким стержнем, 6 мм» is a nut driver: «Торцева головка …»); no profile — bits / screwdrivers in the composition
const screwSet = p => { const pr = [...v(p, 'profil'), ...v(p, 'rozmir_nakonechnyka')]; if (pr.length) return pr.some(x => SCREW.test(x));
  return (C.COMP[p.article] || []).some(g => ['bit', 'driver'].includes(C.ctype(g.head)) && !/торцов/i.test(g.head)); };
const notGap = (p, k, kind) => { const vy = v(p, 'vyd_instrumentu');
  if (NO_DATA[p.article] && (SIZE.has(k) || /^dovzhyna/.test(k))) return NO_DATA[p.article];
  if (/^sklad_/.test(k) && !screwSet(p)) return 'набір без гвинтових профілів у складі (торцеві головки / торцеві викрутки / тріскачки)';
  if (TORQUE.has(k) && !vy.some(x => /динамометр/i.test(x))) return 'не динамометричний інструмент — моменту немає';
  // owner 22.10.2026 (principle): a property the product does not have is not invented — a ratchet has no tip / bit size
  if (SIZE.has(k) && !/^sklad_/.test(k) && vy.length && vy.every(x => x === 'Тріскачка')) return 'тріскачка — розміру наконечника немає';
  if (/^dovzhyna/.test(k) && kind === 'приладдя') return vy.includes('Ручка-тримач') ? 'ручка-тримач — жала немає' : 'приладдя / перехідник — довжина не пишеться';
  return null; };
const out = [], skipped = [];
for (const [id, pl] of Object.entries(PLANS)) { const sec = MAP.sections[id] || { path: id, filters: [] }; const keys = [...new Set([...sec.filters.map(t => KEY[t]).filter(Boolean), ...pl.keys])];
  for (const p of L.filter(p => +p.display_in_showcase === 1 && secs(p).includes(+id))) { const kind = kindOf(p);
    const sk = keys.filter(k => /^sklad_/.test(k)); const hasSk = sk.some(k => v(p, k).length);
    for (const k of keys) { if (v(p, k).length) continue; if (kind === 'приладдя' && SIZE.has(k)) continue;   // accessories get no sizes (owner 21.10.2026)
      // a set without PZ is rightly not found by «PZ у складі», a tool without a magnet — by «З магнітом»: only a set with NO «… у складі» at all is a gap; features are not gaps
      if (/^sklad_/.test(k) && hasSk) continue; if (/^osoblyvosti/.test(k)) continue;
      // owner 22.10.2026: «Довжина стрижня» is a screwdriver blade length — a «Викрутка з набором біт» has none
      if (k === 'dovzhyna_stryzhnia' && v(p, 'vyd_instrumentu').includes('Викрутка з набором біт')) continue;
      const why = notGap(p, k, kind); if (why) { skipped.push({ a: p.article, title: p.title.ua, sec: +id, path: sec.path, filter: TITLE[k] || k, why }); continue; }
      out.push({ a: p.article, title: p.title.ua, sec: +id, path: sec.path, group: pl.group, filter: TITLE[k] || k, key: k, kind, onSite: sec.filters.includes(TITLE[k]), isSet: C.isSet(p.article) }); } } }
fs.writeFileSync(path.join(__dirname, 'fill_audit.json'), JSON.stringify(out, null, 1)); fs.writeFileSync(path.join(__dirname, 'fill_audit_skipped.json'), JSON.stringify(skipped, null, 1));
{ const c = {}; for (const r of skipped) c[r.why] = (c[r.why] || 0) + 1; console.log('not a gap by the rules:', skipped.length, '| products', new Set(skipped.map(r => r.a)).size); for (const [w, n] of Object.entries(c)) console.log('  ' + n + '  ' + w); }
const c = {}; for (const r of out) { const x = `${r.group} | ${r.filter} | ${r.kind}`; c[x] = (c[x] || 0) + 1; }
console.log('missing (product × section × filter):', out.length, '| products', new Set(out.map(r => r.a)).size); console.log(Object.entries(c).sort((a, b) => b[1] - a[1]).map(x => x[1] + '  ' + x[0]).join('\n'));
