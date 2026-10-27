// Global check «Г-подібні ключі» — names (owner 26.10.2026: the WERA series number in the name, as the 97 names of «Викрутки»: the code right before
// the size). Single keys: «Г-подібний ключ Multicolour, метричний 10,0 мм» -> «… метричний 950 SPKL 10,0 мм» (code = the datasheet series without
// the words WERA adds to it: Multicolour, inch, TORX®, BlackLaser …); sets: the code before the WERA set name our name already has
// («… Hex-Plus Multicolour Imperial 2» -> «… 950/9 Hex-Plus Multicolour Imperial 2»). title = mod_title, UA and RU; visible products whose title = mod_title.
//   node names/global_lk_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [], skip = [];
const put = (p, fn, why) => { const a = p.article; if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(a + ' title ≠ mod_title'); return; }
  const v = { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, why: [why] }; for (const l of ['ua', 'ru']) { const n = fn(p.mod_title[l]); if (n == null || n === p.mod_title[l]) { bad.push(`${a} ${l}: no change (${why})`); return; } v[l] = n; } plan[a] = v; };
const SIZE = /\s((?:TX \d+)|(?:[\d,]+ мм)|(?:[\d]+(?:\/\d+)?″))(?= WERA \d{11}$)/;
for (const p of L) { const d = ds(p.article); if (!d) continue; const ser = (d.series || '').trim(); const num = (ser.match(/^\d{3,4}(?:\/\d+)?/) || [''])[0]; if (!num || p.mod_title.ua.includes(num)) continue;
  const code = (ser.match(/^\d{3,4}(?:\/\d+)?(?:\s(?:[A-Z]{1,5}|HF|BM|BO)(?=\s|$))*/) || [''])[0].trim();
  if (/^Набір/.test(p.mod_title.ua)) { const tail = ser.slice(num.length).trim(); if (tail && p.mod_title.ua.includes(tail)) put(p, t => t.includes(tail) ? t.replace(tail, `${num} ${tail}`) : null, 'номер серии WERA ' + num);
    else skip.push(`${p.article} «${p.mod_title.ua}» [${ser}] — набор, название WERA не найдено в нашем`); continue; }
  if (!SIZE.test(p.mod_title.ua)) { skip.push(`${p.article} «${p.mod_title.ua}» [${ser}] — размер в конце не найден`); continue; }
  put(p, t => SIZE.test(t) ? t.replace(SIZE, ` ${code} $1`) : null, 'номер серии WERA ' + code); }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));
const c = {}; for (const v of Object.values(plan)) for (const w of v.why) c[w] = (c[w] || 0) + 1;
console.log('plan', Object.keys(plan).length, c, '| problems', bad.length ? bad : 0, '| skipped', skip.length); skip.forEach(s => console.log('  ', s));
