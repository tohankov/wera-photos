// Global check «Біти та бітотримачі» — names (owner 26.10.2026: the WERA series number in the name, right after the main noun as in
// «Перехідник 780 B/1 …», «Оправлення-хвостовик (перехідник) 870/4 …»; owner 03.11.2026: taps «Насадка — однопрохідний мітчик 844 M 8×40 мм» —
// no repeated «8 мм», the M size is the diameter; the same format for 847 «… 847 HSS Ø8,5 мм M 10×59 мм» — Ø8,5 is the drill part, not a repeat).
// Also: Cyrillic «М» before a thread size -> Latin «M», Cyrillic «х» -> «×», «Насадки - » / «Насадки » -> «Насадки — ». Lengths and the variant
// code (781 B/C, 784 C/2, 780 A/1) — the datasheet title. title = mod_title, UA and RU; visible products whose title = mod_title.
//   node names/global_bit_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [], skip = [];
const W = ' WERA '; const num = s => s.replace('.', ',').replace(/(,d*?)0+$/, '$1').replace(/,$/, '');
const d1 = s => { s = num(s); return /,/.test(s) ? s : s + ',0'; };
// one rule per series: (ua, ru, datasheet title, series) -> [ua, ru] or null
const ins = (re, code) => t => re.test(t) ? t.replace(re, m => `${m} ${code}`) : null;   // insert the code after the noun phrase
const R = [
  [/^781 [ABC]$/, (u, r, t) => { const c = (t.match(/781 [ABC]\/[ABC]/) || [])[0]; return c && [ins(/^Перехідник/, c)(u), ins(/^Переходник/, c)(r)]; }],
  [/^781\/5/, () => ['Набір перехідників 781/5 для торцевих головок, 6 предметів', 'Набор переходников 781/5 для торцовых головок, 6 предметов']],
  [/^881\/4\/1/, (u, r) => [ins(/^Бітоутримувач/, '881/4/1')(u), ins(/^Битодержатель/, '881/4/1')(r)]],
  [/^84[89] HSS$/, (u, r, t, s) => { const m = t.match(/,\s([\d.]+) мм x (\d+) мм$/); if (!m) return null; const sz = `${s} ${d1(m[1])}×${m[2]} мм`;
    const re = / [\d,]+ мм(?= WERA)/; return re.test(u) && re.test(r) && [u.replace(re, ' ' + sz), r.replace(re, ' ' + sz)]; }],
  [/^846 HSS$/, (u, r) => { const f = x => x.replace(/^Насадки(?: -| —)? /, 'Насадки — ').replace(/ із 3 /, ' з 3 ').replace(/(канавками) (Ø)/, '$1 846 HSS $2'); return [f(u), f(r).replace(/(канавками) (Ø)/, '$1 846 HSS $2')]; }],
  [/^847 HSS$/, (u, r, t) => { const m = t.match(/,\s([\d.]+) мм x (\d+) мм x M (\d+)$/); if (!m) return null; const sz = `847 HSS Ø${d1(m[1])} мм M ${m[3]}×${m[2]} мм`;
    const re = / Ø[\d,]+ мм [MМ]\d+(?= WERA)/; return re.test(u) && re.test(r) && [u.replace(re, ' ' + sz), r.replace(re, ' ' + sz)]; }],
  [/^845$/, (u, r) => { const f = x => x.replace(/^Насадка - /, 'Насадка — ').replace(/(зенкер) (Ø)/, '$1 845 $2'); return [f(u), f(r)]; }],
  [/^844$/, (u, r, t) => { const m = t.match(/,\s([\d.]+) мм x (\d+) мм x M (\d+)$/); if (!m || num(m[1]) !== m[3]) return null;
    return [`Насадка — однопрохідний мітчик 844 M ${m[3]}×${m[2]} мм`, `Насадка — однопроходный метчик 844 M ${m[3]}×${m[2]} мм`]; }],
  [/^843$/, (u, r) => [ins(/^Насадка-східчасте свердло/, '843')(u), ins(/^Насадка-ступенчатое сверло/, '843')(r)]],
  [/^84[56]\/8$/, (u, r, t, s) => [ins(/^Набір (?:насадок-конічних|одноканавкових конічних) зенкерів/, s)(u) + '', ins(/^Набор (?:насадок-конических|одноканавочных конических) зенкеров/, s)(r) + ''].map((x, i) => x.replace(/ WERA/, i ? ', 8 предметов WERA' : ', 8 предметів WERA'))],
  [/^780 A$/, (u, r, t) => { const c = (t.match(/780 A\/\d/) || [])[0]; return c && [ins(/^Перехідник/, c)(u), ins(/^Переходник/, c)(r)]; }],
  [/^784 /, (u, r, t, s) => { const c = (t.match(/784 [ABC]\/\d/) || [])[0] || (/^784 [ABC]\/\d$/.test(s) ? s : null); return c && [ins(/^Перехідник/, c)(u), ins(/^Переходник/, c)(r)]; }],
  [/^870\/4\/7/, (u, r) => [ins(/^Набір хвостовиків/, '870/4/7')(u).replace(/ WERA/, ', 3 предмети WERA'), ins(/^Набор хвостовиков/, '870/4/7')(r).replace(/ WERA/, ', 3 предмета WERA')]],
  [/^870\/(\d+)( A)?$/, (u, r, t, s) => { const c = s.replace(/ A$/, ''); return [ins(/^Оправ(?:ка|лення)-хвостовик \(перехідник\)/, c)(u), ins(/^Оправка-хвостовик \(переходник\)/, c)(r)]; }],
  [/^879\/4$/, (u, r) => { const f = x => x.replace(/(шпильок|шпилек) М(\d)/, '$1 879/4 M$2'); return [f(u), f(r)]; }],
  [/^3869\/4$/, (u, r) => [ins(/^Торцева головка (?:з|із) нержавіючої сталі/, '3869/4')(u), ins(/^Торцевая головка из нержавеющей стали/, '3869/4')(r)]],
  [/^872\/9$/, (u, r) => { const f = x => x.replace(/ Fх44/, ' 872/9 F×44'); return [f(u), f(r)]; }],
  [/^860\/1 XZN$/, (u, r) => [ins(/^Біта багатозубцова/, '860/1 XZN')(u), ins(/^Бита многозубцовая/, '860/1 XZN')(r)]],
  [/^867\/1 IPR$/, (u, r) => { const f = x => x.replace(/ IPR (\d+) IPR×/, ' IPR 867/1 IPR $1×'); return [f(u), f(r)]; }],
  [/^867\/1 IP TORX PLUS®$/, (u, r) => { const f = x => x.replace(/® (\d+) IP×/, '® 867/1 IP $1×'); return [f(u), f(r)]; }],
  [/^893\/1\/1$/, (u, r) => { const f = x => x.replace(/ 893\/1,/, ' 893/1/1,'); return [f(u), f(r)]; }],
];
const tidy = s => s.replace(/(^|[\s(])М(\s?\d)/g, '$1M$2');                                       // Cyrillic М before a thread size
for (const p of L) { const a = p.article, d = ds(a); if (!d) continue; const ser = (d.series || '').trim(); const n0 = (ser.match(/^\d{3,4}(?:\/\d+)*/) || [''])[0];
  const t2 = p.mod_title.ua + ' ' + p.mod_title.ru, need = !p.mod_title.ua.includes(n0) || /^84[47]( HSS)?$/.test(ser) || /(^|[\s(])М\s?\d|[\dA-Z]х\d/.test(t2); if (!n0 || !need) continue;
  if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); continue; }
  const r = R.find(([re]) => re.test(ser)); if (!r) { skip.push(`${a} «${p.mod_title.ua}» [${ser}] — правила нет`); continue; }
  let out = r[1](p.mod_title.ua, p.mod_title.ru, d.title, ser); if (!out || out.some(x => !x || /null|undefined/.test(x))) { bad.push(`${a} «${p.mod_title.ua}» [${ser}] «${d.title}» — не разобрано`); continue; }
  out = out.map(tidy).map(x => x.endsWith(W + a) ? x : x.replace(/ WERA \S+$/, '') + W + a);
  if (out[0] === p.mod_title.ua && out[1] === p.mod_title.ru) continue;
  plan[a] = { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: out[0], ru: out[1], why: ['номер серии WERA / формат по паспорту: «' + d.title + '»'] }; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
console.log('plan', Object.keys(plan).length, '| problems', bad.length ? bad : 0, '| skipped', skip.length); skip.forEach(s => console.log('  ', s));
for (const [a, v] of Object.entries(plan)) console.log(a, v.oldMod.ua, '→', v.ua, '||', v.ru);
