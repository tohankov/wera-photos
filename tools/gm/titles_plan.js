// The 28 owner-approved titles ≤150 (gm/titles_new.json from gm/long_titles.js) -> gm/titles_set_plan.json for names/write.js set (title AND mod_title UA/RU).
// node gm/titles_plan.js <live catalog export json (article, title, mod_title)>
// Stops without a plan if any new title is over 150 characters, or repeats another new title or any live title / mod_title of another product (UA or RU,
// case and spaces ignored). oldTitle / oldMod = the live values: names/write.js set writes only while the site still holds exactly them.
const fs = require('fs'), path = require('path');
const NEW = require('./titles_new.json'), all = require(path.resolve(process.argv[2]));
const key = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); const bad = [];
const seen = {}; for (const [a, t] of Object.entries(NEW)) for (const l of ['ua', 'ru']) { if (t[l].length > 150) bad.push(`${a} ${l} ${t[l].length} > 150`);
  const k = l + ':' + key(t[l]); if (seen[k]) bad.push(`${a} ${l} = new title of ${seen[k]}`); seen[k] = a; }
for (const p of all) for (const l of ['ua', 'ru']) for (const f of ['title', 'mod_title']) { const k = l + ':' + key((p[f] || {})[l]); if (seen[k] && seen[k] !== p.article) bad.push(`${seen[k]} ${l} = ${f} of ${p.article}`); }
const plan = {}; for (const a of Object.keys(NEW)) { const p = all.find(x => x.article === a); if (!p) { bad.push(a + ' not in the catalog'); continue; }
  plan[a] = { oldTitle: { ua: p.title.ua, ru: p.title.ru }, oldMod: { ua: (p.mod_title || {}).ua || '', ru: (p.mod_title || {}).ru || '' }, ua: NEW[a].ua, ru: NEW[a].ru }; }
if (bad.length) { console.log('STOP — not written:\n' + bad.join('\n')); process.exit(2); }
fs.writeFileSync(path.join(__dirname, 'titles_set_plan.json'), JSON.stringify(plan, null, 1));
console.log('titles', Object.keys(plan).length, 'max UA', Math.max(...Object.values(plan).map(t => t.ua.length)), 'max RU', Math.max(...Object.values(plan).map(t => t.ru.length)), 'unique within the 28 and against', all.length, 'products: ok');
