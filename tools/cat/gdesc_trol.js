// «Інструментальний візок та ложементи» (1055) — text facts by the WERA datasheet (rule Б: only the fact), extra for cat/global_desc_plan.js. 11.11.2026.
//  1. «Колеса з навантаженням по 250 кг» — only the 9800 datasheet (05305851001) names 250 кг; the Stainless trolleys (9801 / 9805, 9701 / 9702, 9705 / 9706)
//     say «большими прочными колесами с прецизионными шарикоподшипниками» -> «Великі міцні колеса» / «Большие прочные колёса» (owner 10.11.2026)
//  2. 9805 / 9705 / 9706 (785 мм): «на ящик 25 кг» -> 30 кг (datasheet: «нагрузка на выдвижной ящик - 30 кг»; 25 кг — the 9800)
// owner 12.11.2026: 250 кг is back for the Stainless trolleys (wera.de shows «250 kg» on their pages) — rule 1 is off
const STAINLESS = new Set();
const DRAWER30 = new Set(['05501880001', '05150135001', '05150136001']);
module.exports = (p, l, h) => { const why = []; let x = h; const a = p.article;
  if (STAINLESS.has(a)) { const [o, n] = l === 'ua' ? ['Колеса з навантаженням по 250 кг', 'Великі міцні колеса'] : ['Колёса с нагрузкой по 250 кг', 'Большие прочные колёса'];
    if (x.includes(o)) { x = x.split(o).join(n); why.push('250 кг — только у 9800 (паспорт)'); } }
  if (DRAWER30.has(a)) { const [o, n] = l === 'ua' ? ['на ящик 25 кг', 'на ящик 30 кг'] : ['на ящик 25 кг', 'на ящик 30 кг'];
    if (x.includes(o)) { x = x.split(o).join(n); why.push('нагрузка на ящик 30 кг (паспорт)'); } }
  return { html: x, why }; };
