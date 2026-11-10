// Global check «Інструментальний візок та ложементи» (1055) — names, analysis 10.11.2026 (not written before the owner's «ок»).
// As decided in the earlier groups: the WERA series number after the main noun (owner 26.10.2026), the number of pieces «, N предметів» from the
// datasheet TITLE in every set name (owner 10.11.2026; WERA's number even where it counts the inlay itself: 97110 «7 предметов» = 6 screwdrivers + inlay),
// placed before a trailing bracket group; «неукомплектований / без інструмента під …» -> «…, без інструментів» (as the bags 10.11.2026).
//   node names/global_trol_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [];
const plUa = n => { const d = n % 10, h = n % 100; return d === 1 && h !== 11 ? 'предмет' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'предмети' : 'предметів'; };
const plRu = n => { const d = n % 10, h = n % 100; return d === 1 && h !== 11 ? 'предмет' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'предмета' : 'предметов'; };
// garbled / mixed names — by the datasheet title, the words of our other names
const FIX = {
  '05150183001': ['Ложемент 9783 набір напилків PFERD 1', 'Ложемент 9783 набор напильников PFERD 1'],
  '05137323001': ['Ложемент 9823 набір викруткових головок 3/8″ Zyklop B 1, неукомплектований', 'Ложемент 9823 набор отвёрточных головок 3/8″ Zyklop B 1, неукомплектованный'],
  '05150112001': ['Ложемент 9722 набір 8000 C з тріскачкою 1/2″ Zyklop 1', 'Ложемент 9722 набор 8000 C с трещоткой 1/2″ Zyklop 1'],
  '05150120001': ['Ложемент 9730 набір ключів із тріскачкою 6000 Joker 1', 'Ложемент 9730 набор ключей с трещоткой 6000 Joker 1'],
  '05150102001': ['Ложемент 9711 набір діелектричних викруток VDE 1 (SL, PH, PZ, PZ/S, TX)', 'Ложемент 9711 набор диэлектрических отвёрток VDE 1 (SL, PH, PZ, PZ/S, TX)'],
  '05150130001': ['Інструментальний візок 9700 Tool Rebel 1', 'Инструментальная тележка 9700 Tool Rebel 1'] };
for (const p of L) { const a = p.article; const t = (ds(a) || {}).title || ''; const sm = t.match(/^(9\d{3,4})\s/); if (!sm) { bad.push(a + ' нет номера серии в паспорте: ' + t); continue; }
  const ser = sm[1]; const empty = /неукомп|без инструмент/.test(t); const cnt = (t.match(/(\d+) предмет/) || [])[1];
  if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); continue; }
  const why = []; let ua = p.mod_title.ua.replace(/ WERA \d{11}$/, ''), ru = p.mod_title.ru.replace(/ WERA \d{11}$/, '');
  if (FIX[a]) { [ua, ru] = FIX[a]; why.push('название по паспорту: «' + t.slice(0, 90) + '»'); }
  // series after the main noun
  if (!new RegExp('(^|\\s)' + ser + '(\\s|,|$)').test(ua)) { const ru0 = ru;
    ua = ua.replace(/^(Ложемент|Інструментальний візок)\s/, `$1 ${ser} `); ru = ru.replace(/^(Ложемент|Инструментальная тележка)\s/, `$1 ${ser} `);
    if (!ua.includes(ser) || ru === ru0) { bad.push(a + ' серия не вставлена: ' + ua); continue; } why.push('номер серии WERA ' + ser); }
  // empty inlays: one wording
  if (empty) { const u0 = ua;
    ua = ua.replace(/,\s*неукомплектований$/, ', без інструментів').replace(/^(Ложемент \d+) без інструмента під (.+)$/, '$1 під $2, без інструментів');
    ru = ru.replace(/,\s*неукомплектованный$/, ', без инструментов').replace(/^(Ложемент \d+) без инструмента под (.+)$/, '$1 под $2, без инструментов');
    if (ua !== u0) why.push('«без інструментів» (как у сумок 10.11)'); }
  // pieces from the datasheet title (filled sets, trolleys)
  if (!empty && cnt) { const n = +cnt; const has = ua.match(/,?\s*(\d+) предмет\S*/); const old = has ? +has[1] : null;
    const put = (s, w) => { s = s.replace(/,?\s*\d+ предмет\S*/, ''); const br = s.match(/^(.*?)(\s*\([^()]*\))$/); return br ? `${br[1]}, ${n} ${w}${br[2]}` : `${s}, ${n} ${w}`; };
    const nu = put(ua, plUa(n)), nr = put(ru, plRu(n)); if (nu !== ua || nr !== ru) { why.push(old === null ? `число предметов ${n} (паспорт)` : old !== n ? `число предметов ${old} → ${n} (заголовок паспорта WERA)` : 'формат «, N предметів»'); ua = nu; ru = nr; } }
  else if (!empty && !cnt) bad.push(a + ' в заголовке паспорта нет числа предметов: ' + t);
  // typos
  const u1 = ua.replace('тріскоткою', 'тріскачкою'), r1 = ru.replace('трещёткой', 'трещоткой'); if (u1 !== ua || r1 !== ru) { ua = u1; ru = r1; why.push('опечатка'); }
  ua += ' WERA ' + a; ru += ' WERA ' + a;
  if (ua === p.mod_title.ua && ru === p.mod_title.ru) continue;
  plan[a] = { oldTitle: p.title, oldMod: p.mod_title, ua, ru, ds: t, why }; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('names', Object.keys(plan).length, '| problems', bad.length); for (const b of bad) console.log('  ', b);
