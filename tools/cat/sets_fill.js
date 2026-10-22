// Sets get ALL values of their composition (CLAUDE.md filters rule): for each characteristic of the group except «Вид інструменту»,
// a set carries the union of the values of its components (composition from the WERA datasheet, cat/sets_comp.json; component values from
// cat/member_vals.json — every product of every group, bits included). Only values that already exist in the characteristic's dictionary
// are taken (cat/dicts_snapshot.json), so dictionary order stays ascending; the rest are counted as `outside`. No composition -> disputed.
//   fill(name, items, chars) -> { items, disputed, report }      node cat/sets_fill.js build   (rebuild member_vals.json)
const fs = require('fs'), path = require('path'); const { fixZero } = require('../lib/valsort.js');
const J = f => { const p = path.join(__dirname, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const ALT = { rozmir_nakonechnyka: ['rozmir', 'rozmir_robochoho_kintsia'], rozmir_robochoho_kintsia: ['rozmir_nakonechnyka', 'rozmir'], typ_bit_u_nabori: ['typ_bity', 'osoblyvosti'] };
const ALT_ONLY = { osoblyvosti: ['Алмазне покриття', 'Нержавіюча сталь'] }; // from bit features only these describe the bit type
// a component without catalog values is read from the composition text when it is unambiguous: «TX 20 x 25 мм» under a bit/blade head
const PFX = { PH: 'PH (Phillips)', PZ: 'PZ (Pozidriv)', TX: 'TX (TORX®)', IP: 'IP (TORX PLUS®)' };
const dec1 = v => { v = String(v).replace('.', ','); return /,/.test(v) ? v : v + ',0'; };
function fromText(head, size) { const z = String(size).trim().replace(/(\d)\.(\d)/g, '$1,$2'); let m, prof, sz, len; const typ = [];
  if ((m = z.match(/^(PH|PZ|TX|IP) ?(\d+) x (\d+(?:,\d+)?) мм$/))) { prof = PFX[m[1]]; sz = m[2]; len = m[3]; }
  else if ((m = z.match(/^# ?(\d) x (\d+(?:,\d+)?) мм$/)) && /\b(PZ|PH)\/S\b/.test(head)) { prof = 'PlusMinus (PH/PZ + шліц)'; sz = m[1]; len = m[2]; }   // «65 iS PZ/S # 1» is PlusMinus (19.10.2026)
  else if ((m = z.match(/^# ?(\d) x (\d+(?:,\d+)?) мм$/))) { prof = 'Квадрат (Robertson)'; sz = m[1]; len = m[2]; }
  else if (!/футляр|сумк|чехол|витрин|подколен|тестер|индикатор/i.test(head) && (m = z.match(/^(\d+(?:,\d+)?) мм x (\d+(?:,\d+)?) мм x (\d+(?:,\d+)?) мм$/)) && +m[1].replace(',', '.') <= 2.5 && +m[2].replace(',', '.') <= 20) { prof = 'SL (шліц)'; sz = dec1(m[2]); len = m[3]; }   // thickness x width x length — only slotted blades
  else if (/^840\b|^3840\b|^8740\b|шестигран/i.test(head) && (m = z.match(/^(\d+(?:,\d+)?) mm x (\d+(?:,\d+)?) мм$/))) { prof = 'HEX (шестигранник)'; sz = dec1(m[1]); len = m[2]; }   // 8740 Zyklop hex screwdriver heads (22.10 (i))
  else if (/^840\b|^3840\b|^8740\b|шестигран/i.test(head) && (m = z.match(/^(\d+\/\d+)" x (\d+(?:,\d+)?) мм$/))) { prof = 'HEX (шестигранник)'; sz = m[1] + '″'; len = m[2]; }
  else return null;
  if (/Impaktor|\bIMP\b/i.test(head)) typ.push('Ударна (Impaktor)'); else if (/BiTorsion|TorsionBi|торсион/i.test(head)) typ.push('Торсійна'); if (/Diamond|алмаз/i.test(head)) typ.push('Алмазне покриття'); if (/Stainless|нержав/i.test(head)) typ.push('Нержавіюча сталь');
  const L = len + ' мм'; const vals = { profil: [prof], rozmir: [sz], rozmir_nakonechnyka: [sz], rozmir_robochoho_kintsia: [sz], dovzhyna: [L], dovzhyna_robochoho_kintsia: [L], dovzhyna_stryzhnia: [L], typ_bity: typ };
  // a Zyklop screwdriver head's length is «Довжина головки» (Bicycle Set 8: «8767 B TORX® Zyklop отвёрточная головка … TX 25 x 107 мм», «8740 B … 8 mm x 100 мм»; 22.10 (i))
  if (/Zyklop/i.test(head) && /головк/i.test(head)) vals.dovzhyna_holovky = [L];
  return { vals }; }
// accessories give a set no values (owner 21.10.2026); a remover (Знімач 1429 / 1529 ESD) too — its 50 мм is not a blade length (22.10.2026)
const NONPRODUCT = /^(Ручка-тримач|Приладдя|Приладдя для викруток|Бітотримач|Підставка|Знімач)/;
function fill(name, items, chars) {
  if (process.env.SETS_FILL === 'off') return { items, disputed: [], report: null };
  const L = J('sets_list.json') || {}, C = J('sets_comp.json') || {}, M = J('member_vals.json') || {}, D = J('dicts_snapshot.json') || {};
  const sets = new Set(L[name] || []), disputed = [], rep = { sets: 0, filled: 0, noComp: 0, outside: {} };
  const out = items.map(it => { if (!sets.has(it.a)) return it; rep.sets++; const comp = C[it.a];
    if (!comp || !comp.length) { rep.noComp++; disputed.push({ a: it.a, sec: (it.secs || [])[0], what: 'Состав набора', why: 'состав не найден в datasheet WERA — значения по составу не записаны', title: it.title }); return it; }
    const mem = comp.flatMap(g => g.items.map(x => (x.art && M[x.art]) ? (x.art === it.a ? null : M[x.art]) : fromText(g.head, x.size))).filter(m => m && !m.nonProduct);
    // a component that is itself a set with a WERA composition (nested set: Tool-Check Modular 1 inside Modular Set 1) is opened down to its leaves
    // (cat/comp_expand.js; 22.10.2026 — before, only the nested set's own values counted, and those are empty when member_vals.json is built)
    const { expand } = require('./comp_expand.js');
    for (const x of comp.flatMap(g => g.items)) if (x.art && x.art !== it.a && C[x.art] && C[x.art].length) mem.push(...expand(x.art, 1, new Set([it.a, x.art])).filter(r => r.known && !r.set && !r.nonProduct).map(r => ({ vals: r.vals })));
    const vals = { ...it.vals }; let added = 0;
    for (const c of chars.filter(c => c.key !== 'vyd_instrumentu')) { const dict = D[c.key] ? new Set(D[c.key].values) : null; const got = new Set(vals[c.key] || []);
      for (const m of mem) for (const k of [c.key, ...(ALT[c.key] || [])]) for (const v of (m.vals[k] || []).map(fixZero)) { if (got.has(v)) continue;
        if (ALT_ONLY[k] && k !== c.key && !ALT_ONLY[k].includes(v)) continue; if (dict && !dict.has(v)) { if (k === c.key) rep.outside[c.key + ': ' + v] = (rep.outside[c.key + ': ' + v] || 0) + 1; continue; } got.add(v); added++; }
      vals[c.key] = [...got]; }
    const unknown = comp.flatMap(g => g.items.filter(x => !(x.art && M[x.art]) && !fromText(g.head, x.size)).map(x => x.art || x.size));
    if (added) rep.filled++;
    else if (!chars.some(c => c.key !== 'vyd_instrumentu' && (vals[c.key] || []).length)) disputed.push({ a: it.a, sec: (it.secs || [])[0], what: 'Состав набора', why: unknown.length ? `компонентов нет в каталоге (${unknown.length}): ${unknown.slice(0, 6).join(', ')}` : 'в составе из datasheet только принадлежности (ручки, удлинители) — значений нет', title: it.title });
    if (unknown.length) rep.partial = (rep.partial || 0) + 1;
    return { ...it, vals, setFilled: added }; });
  return { items: out, disputed, report: rep }; }
module.exports = fill; module.exports.fromText = fromText;
if (require.main === module && process.argv[2] === 'build') { process.env.SETS_FILL = 'off'; const M = {};
  for (const g of ['zyklop', 'vykrutky', 'lkeys', 'vde', 'dyn', 'joker', 'kk', 'holders', 'adapters', 'drills']) { if (!fs.existsSync(path.join(__dirname, `g_${g}.js`))) continue;
    for (const i of require(`./g_${g}.js`).items) { const m = M[i.a] = M[i.a] || { vals: {}, nonProduct: false }; for (const [k, v] of Object.entries(i.vals)) m.vals[k] = [...new Set([...(m.vals[k] || []), ...v])];
      if ((i.vals.vyd_instrumentu || []).some(v => NONPRODUCT.test(v)) && !(i.vals.vyd_instrumentu || []).some(v => /^Набір/.test(v))) m.nonProduct = true; } }
  const NB = ['TL64', '05049002001', '05051278001'];
  for (const p of require('../filters/chars_payload.json').products) { const m = M[p.article] = M[p.article] || { vals: {}, nonProduct: false }; for (const [k, v] of Object.entries(p.characteristics)) if (Array.isArray(v)) m.vals[k] = [...new Set([...(m.vals[k] || []), ...v])]; if (NB.includes(p.article)) m.nonProduct = true; }
  fs.writeFileSync(path.join(__dirname, 'member_vals.json'), JSON.stringify(M)); console.log('member_vals', Object.keys(M).length, 'nonProduct', Object.values(M).filter(m => m.nonProduct).length); }
