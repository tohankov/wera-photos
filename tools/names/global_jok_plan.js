// Global check «Гайкові ключі Joker» — names (owner 26.10.2026: the WERA series number in the name, as in «Викрутки»). Format as WERA writes the series:
// «6004 Joker XL», «6003 Joker» — the code right before «Joker» («Рожковий ключ із самоналаштуванням 6004 Joker XL 19-24 мм»); the existing
// «Joker 6005, 12×13 мм» -> «6005 Joker 12×13 мм» (one form). Magnetic holder sets 9630–9642 keep «Магнітний тримач 6003 та набір …» (the wrench series
// is named, the set number is not a part of our name — example question). title = mod_title, UA and RU; visible products whose title = mod_title.
//   node names/global_jok_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [], skip = [];
const put = (p, fn, why) => { const a = p.article; if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  const v = { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, why: [why] }; for (const l of ['ua', 'ru']) { const n = fn(p.mod_title[l]); if (n == null || n === p.mod_title[l]) { bad.push(`${a} ${l}: no change (${why})`); return; } v[l] = n; } plan[a] = v; };
for (const p of L) { const d = ds(p.article); if (!d) continue; const code = ((d.series || '').match(/^\d{4}(?:\/\d{4})?/) || [''])[0]; if (!code) continue; const t = p.mod_title.ua;
  if (/^Магнітний тримач/.test(t)) { if (!t.includes(code)) skip.push(`${p.article} «${t}» — набір ${code}`); continue; }
  if (new RegExp('Joker ' + code + ',? ').test(t)) { put(p, s => s.replace(new RegExp('Joker ' + code + ',? '), `${code} Joker `), `${code} перед Joker (одна форма)`); continue; }
  if (t.includes(code)) continue;
  if (!/ Joker\b/.test(t)) { skip.push(`${p.article} «${t}» — нет «Joker»`); continue; }
  put(p, s => s.replace(/ Joker\b/, ` ${code} Joker`), 'номер серии WERA ' + code); }
// UA «Рожковий» (a russism) -> «Ріжковий», as the rest of our UA names; RU stays «Рожковый»
for (const p of L) { if (!/^Рожковий/.test(p.mod_title.ua)) continue; const v = plan[p.article] || { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: p.mod_title.ua, ru: p.mod_title.ru, why: [] };
  v.ua = v.ua.replace(/^Рожковий/, 'Ріжковий'); v.why.push('«Рожковий» → «Ріжковий» (UA)'); plan[p.article] = v; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
const c = {}; for (const v of Object.values(plan)) for (const w of v.why) c[w] = (c[w] || 0) + 1;
console.log('plan', Object.keys(plan).length, c, '| problems', bad.length ? bad : 0, '| skipped', skip.length); skip.forEach(s => console.log('  ', s));
