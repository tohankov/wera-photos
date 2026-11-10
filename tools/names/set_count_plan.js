// Owner 10.11.2026 (whole catalog): every VISIBLE set names its piece count — «, N предметів» / «, N предметов» — the number of the WERA datasheet
// TITLE (page 1 before «EAN:», «Bit-Check 12 Wood TX HF 1, 12 предметов»); no number there — a question, nothing guessed.
// A set = «Вид інструменту» «Набір…» / «Викрутка з набором біт». Placement: before a closing bracket group «(PH, SL)», else at the end (before «WERA <art>»).
// Also, only in these names: «N деталі» -> «N предмети»; «комплект» instead of our «Набір»; the datasheet name where ours is wrong (TOOL-CHECK PLUS new).
//   node names/set_count_plan.js <all.json> <out set.json>   -> for SETPLAN=<out> node names/write.js set
const fs = require('fs'); const ds = require('./ds.js'); const [, , ALL, OUT] = process.argv;
const ua = n => n % 10 === 1 && n % 100 !== 11 ? 'предмет' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'предмети' : 'предметів';
const ru = n => n % 10 === 1 && n % 100 !== 11 ? 'предмет' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'предмета' : 'предметов';
// names that are not in our format — fixed by the datasheet title (UA, RU of the core without «WERA <art>»)
const FIX = {
  '05057460001': ['Набір Kraftform Kompakt 100', 'Набор Kraftform Kompakt 100'],              // «Kraftform Kompakt 100 комплект»; datasheet «Kraftform Kompakt 100, 52 предмета»
  '05049055001': ['Набір Tool-Check PLUS 1', 'Набор Tool-Check PLUS 1'],                      // «Набір TOOL-CHECK PLUS new»; datasheet «Tool-Check PLUS 1, 39 предметов»
};
const vyd = p => ((p.characteristics || {}).vyd_instrumentu || []).map(x => x.value.ua).join('+');
const add = (core, n, word, rx) => { if (rx.test(core)) return core;
  // «11 шт» equal to the datasheet count -> «11 предметів» (no second count); «9 шт., …, 10 предметів» (9 sockets + a holder) — both stay
  const sh = core.match(/^(.*?)(\d+)\s*шт\.?(?=,|\s|$)(.*)$/); if (sh && +sh[2] === n) return `${sh[1].replace(/,?\s*$/, ', ')}${n} ${word}${sh[3]}`;
  const d = core.match(/^(.*?)(,?\s*)(\d+)\s+(?:детал\S*)(.*)$/); if (d && +d[3] === n) return `${d[1]}${d[2]}${n} ${word}${d[4].trim() ? ',' + d[4] : ''}`;
  const b = core.match(/^(.*\S)\s*(\([^()]*\))$/); return b ? `${b[1]}, ${n} ${word} ${b[2]}` : `${core}, ${n} ${word}`; };
const plan = {}, q = [];
for (const p of JSON.parse(fs.readFileSync(ALL, 'utf8'))) { if (+p.display_in_showcase !== 1 || !/^(Набір|Викрутка з набором біт)/.test(vyd(p))) continue;
  if (/предмет/i.test(p.mod_title.ua) && /предмет/i.test(p.mod_title.ru)) continue;
  const d = ds(p.article); const m = d && d.title.match(/(\d+)\s+предмет/); if (!m) { q.push(`${p.article} ${p.mod_title.ua} — ${d ? 'в заголовке паспорта нет числа предметов' : 'нет паспорта WERA'}`); continue; }
  const n = +m[1]; const tail = ` WERA ${p.article}`; const core = l => p.mod_title[l].replace(/\s*WERA\s+\d{11}\s*$/, '').replace(/\s+/g, ' ').trim();
  let cu = FIX[p.article] ? FIX[p.article][0] : core('ua').replace(/^Комплект(?=\s)/, 'Набір').replace(/велепедиста/, 'велосипедиста');
  let cr = FIX[p.article] ? FIX[p.article][1] : core('ru').replace(/^Комплект(?=\s)/, 'Набор');
  const nu = add(cu, n, ua(n), /\d+\s+предмет/i) + tail, nr = add(cr, n, ru(n), /\d+\s+предмет/i) + tail;
  if (nu === p.mod_title.ua && nr === p.mod_title.ru) continue;
  plan[p.article] = { oldTitle: p.title, oldMod: p.mod_title, ua: nu, ru: nr, why: [`число предметов — заголовок паспорта WERA: «${d.title}»`] }; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('names', Object.keys(plan).length, '| questions', q.length); for (const x of q) console.log('  Q', x);
