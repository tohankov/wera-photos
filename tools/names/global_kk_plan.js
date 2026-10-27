// Global check «Інструменти серії Kraftform Kompakt» — names. Vario combination ends (81–87, 68): one format from the WERA datasheet title, the series
// number first, the two ends separated by « / », the length once at the end (proposal in the example — the format is new):
//   «82 Комбинированный рабочий конец, PH 1 x 0.6 мм x 4 мм x 175 мм» -> «Комбінований робочий кінець Vario 82 PH 1 / SL 0,6×4,0×175 мм»
//   «84 … 2.5 mm x 2.5 x 175 мм» -> «… Vario 84 HEX 2,5 / HEX 2,5×175 мм»; «87 … TX 10 x TX 15 x 175 мм» -> «… Vario 87 TX 10 / TX 15×175 мм»
// title = mod_title, UA and RU (RU «Комбинированный рабочий конец Vario …»); visible products whose title = mod_title.
//   node names/global_kk_plan.js <group live.json> <out set.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const ds = require('./ds.js');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1); const plan = {}, bad = [];
const d1 = v => { v = v.replace('.', ','); return /,/.test(v) ? v : v + ',0'; };
for (const p of L) { if (!/^Комбінований робочий кінець Vario/.test(p.mod_title.ua)) continue; const d = ds(p.article); if (!d) { bad.push(p.article + ' no datasheet'); continue; }
  if (p.title.ua !== p.mod_title.ua || p.title.ru !== p.mod_title.ru) { bad.push(p.article + ' title ≠ mod_title'); continue; }
  const m = d.title.match(/^(\d+)\s.*?,\s(.+?)\s*x\s*(\d+)\s*мм$/); if (!m) { bad.push(`${p.article} datasheet title not read: ${d.title}`); continue; }
  const [, code, ends, len] = m; const ua = p.mod_title.ua; let a, b;
  const parts = ends.split(/\s+x\s+/).map(s => s.trim()); if (parts.length < 2) { bad.push(`${p.article} the datasheet title has one end only: ${d.title}`); continue; }
  if (code === '82') { a = parts[0]; b = `SL ${d1(parts[1].replace(/\s*мм/, ''))}×${d1(parts[2].replace(/\s*мм/, ''))}`; }                 // PH n x t мм x w мм
  else if (code === '81') { a = `SL ${d1(parts[0].replace(/\s*мм/, ''))}×${d1(parts[1].replace(/\s*мм/, ''))}`; b = `SL ${d1(parts[2].replace(/\s*мм/, ''))}×${d1(parts[3].replace(/\s*мм/, ''))}`; }
  else if (code === '84') { a = `HEX ${d1(parts[0].replace(/\s*mm/, ''))}`; b = `HEX ${d1(parts[1])}`; }
  else if (code === '68') { a = 'квадрат ' + parts[0].replace(/^#\s?/, '#'); b = parts[1].replace(/^#\s?/, '#'); }
  else { a = parts[0]; b = parts[1]; }
  if (!a || !b) { bad.push(`${p.article} ends not read: ${d.title}`); continue; }
  const tail = `Vario ${code} ${a} / ${b}×${len} мм WERA ${p.article}`;
  const v = { oldTitle: { ...p.title }, oldMod: { ...p.mod_title }, ua: `Комбінований робочий кінець ${tail}`, ru: `Комбинированный рабочий конец ${tail.replace('квадрат', 'квадрат')}`, why: [`формат Vario по паспорту: «${d.title}»`] };
  if (v.ua !== ua) plan[p.article] = v; }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('plan', Object.keys(plan).length, '| problems', bad.length ? bad : 0);
for (const [a, v] of Object.entries(plan)) console.log(a, v.oldMod.ua, '→', v.ua);
