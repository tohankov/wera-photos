// Adds to names/set_plan.json (names/write.js set), from a live export of the whole catalog:
//   group Д of the disputed titles (Zyklop HF bit sockets, length 38,5 мм from the WERA datasheet; owner «ок» 18.10.2026);
//   every product whose mod_title is empty in both languages: mod_title = title (title itself unchanged, so dryRun shows mod_title only).
const fs = require('fs'), path = require('path'); const S = require('../lib/session.js').open(); const F = path.join(__dirname, 'set_plan.json');
const D = {
  '05003072001': ['Викруткова головка Zyklop 8767 B HF 3/8″ TORX® TX 50×38,5 мм', 'Отверточная головка Zyklop 8767 B HF 3/8″ TORX® TX 50×38,5 мм'],
  '05003070001': ['Викруткова головка Zyklop 8767 B HF 3/8″ TORX® TX 45×38,5 мм', 'Отверточная головка Zyklop 8767 B HF 3/8″ TORX® TX 45×38,5 мм'],
  '05003093001': ['Викруткова головка Zyklop 8740 B HF 3/8″ шестигранна дюймова HEX 3/8″×38,5 мм', 'Отверточная головка Zyklop 8740 B HF 3/8″ шестигранная дюймовая HEX 3/8″×38,5 мм'],
  '05003091001': ['Викруткова головка Zyklop 8740 B HF 3/8″ шестигранна дюймова HEX 5/16″×38,5 мм', 'Отверточная головка Zyklop 8740 B HF 3/8″ шестигранная дюймовая HEX 5/16″×38,5 мм'] };
(async () => { const all = [];
  for (let off = 0; ; off += 100) { await new Promise(r => setTimeout(r, 1500));
    const r = await S.call('horoshop_catalog_export', { includedParams: ['article', 'title', 'mod_title'], limit: 100, offset: off, allowLarge: true });
    if (!r.response) { console.log('export failed', JSON.stringify(r).slice(0, 200)); S.close(); process.exit(2); } all.push(...r.response.products); if (r.response.products.length < 100) break; }
  const plan = JSON.parse(fs.readFileSync(F, 'utf8')); const live = Object.fromEntries(all.map(p => [p.article, p])); const empty = [], warn = [];
  for (const [a, [ua, ru]] of Object.entries(D)) { const p = live[a]; if (['ua', 'ru'].some(l => p.mod_title[l] && p.mod_title[l] !== p.title[l])) { warn.push(a); continue; }
    plan[a] = { oldTitle: p.title, oldMod: p.mod_title, ua: `${ua} WERA ${a}`, ru: `${ru} WERA ${a}` }; }
  for (const p of all) { const m = p.mod_title || {}; if (m.ua || m.ru || D[p.article]) continue; if (!p.title.ua || !p.title.ru) { warn.push(p.article + ' empty title'); continue; }
    empty.push(p.article); plan[p.article] = { oldTitle: p.title, oldMod: { ua: m.ua ?? '', ru: m.ru ?? '' }, ua: p.title.ua, ru: p.title.ru }; }
  const half = all.filter(p => !!(p.mod_title || {}).ua !== !!(p.mod_title || {}).ru).map(p => p.article);
  fs.writeFileSync(F, JSON.stringify(plan, null, 1)); fs.writeFileSync(path.join(__dirname, 'mod_empty.json'), JSON.stringify(empty));
  console.log('catalog', all.length, 'group Д', Object.keys(D).length - warn.filter(w => D[w]).length, 'empty mod_title', empty.length, 'one language empty', half, 'warn', warn); S.close(); })();
