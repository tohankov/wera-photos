// Adds group Е of the disputed titles to names/set_plan.json (names/write.js set), with the live title / mod_title as the snapshot (owner «ок» 18.10.2026).
// Microstix bits: «m» is the bit size in the WERA datasheet (872/9 Microstix®, m x 44 мм; 872/21 Microstix®, m x 40 мм; sizes m, 00, F, 0, 1), series code added like the siblings.
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const F = path.join(__dirname, 'set_plan.json');
const E = {
  '05066850001': ['Біта Microstix® з приводом Halfmoon 4 мм 872/9 m×44 мм', 'Бита Microstix® с приводом Halfmoon 4 мм 872/9 m×44 мм'],
  '05066860001': ['Біта Microstix® з приводом HIOS 4 мм 872/21 m×40 мм', 'Бита Microstix® с приводом HIOS 4 мм 872/21 m×40 мм'] };
(async () => { const r = await S.call('horoshop_catalog_export', { expr: { article: Object.keys(E) }, includedParams: ['article', 'title', 'mod_title'], limit: 10 });
  if (!r.response) { console.log('export failed', JSON.stringify(r).slice(0, 200)); S.close(); process.exit(2); }
  const plan = JSON.parse(fs.readFileSync(F, 'utf8'));
  for (const p of r.response.products) { const [ua, ru] = E[p.article]; plan[p.article] = { oldTitle: p.title, oldMod: { ua: p.mod_title.ua ?? '', ru: p.mod_title.ru ?? '' }, ua: `${ua} WERA ${p.article}`, ru: `${ru} WERA ${p.article}` };
    console.log(p.article, JSON.stringify(plan[p.article])); }
  fs.writeFileSync(F, JSON.stringify(plan, null, 1)); S.close(); process.exit(0); })();
