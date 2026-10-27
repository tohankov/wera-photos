// «Г-подібні ключі», global check: «Особливості ключа» by wera.de «Produktmerkmale» of the series (owner 26.10.2026: «признаки WERA» without questions) —
// «Кулькова головка» (Kugelkopf; the article's footnote «ohne Kugelkopf» removes it) and «Профіль Hex-Plus» (Hex-Plus; footnote «Herkömmliches
// Sechskantprofil» removes it). Values are ONLY added (the existing ones stay). Plan for cat/night_write.js (characteristics only).
//   node cat/glk_feat_plan.js <group live.json> <out plan.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const W = require('../../inventory/wera/pages.json');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1);
const RULES = [['Kugelkopf', 'Кулькова головка', /ohne (?:Bohrung und )?Kugelkopf/i], ['Hex-Plus', 'Профіль Hex-Plus', /Herkömmliches Sechskantprofil/i]];
const plan = { name: 'glk_feat', keys: ['osoblyvosti_kliucha'], products: [] }; const stat = {};
for (const p of L) { const a = p.article; const wp = W.pages[W.art[a]]; if (!wp) continue; const notes = wp.table && wp.table.notes && wp.table.notes[a] ? wp.table.notes[a].map(n => wp.notesText[n]).filter(Boolean) : [];
  const has = ((p.characteristics || {}).osoblyvosti_kliucha || []).map(x => x.value.ua); const add = [];
  for (const [m, val, neg] of RULES) if ((wp.merkmale || []).includes(m) && !notes.some(n => neg.test(n)) && !has.includes(val)) add.push(val);
  // Hex-Plus is a hex profile: only keys whose «Профіль» is HEX
  const hex = ((p.characteristics || {}).profil || []).some(x => /^HEX/.test(x.value.ua)); const add2 = add.filter(v => v !== 'Профіль Hex-Plus' || hex);
  if (!add2.length) continue; for (const v of add2) stat[v] = (stat[v] || 0) + 1;
  plan.products.push({ article: a, characteristics: { osoblyvosti_kliucha: [...has, ...add2] }, why: add2.map(v => `+ ${v} (wera.de «${RULES.find(r => r[1] === v)[0]}»)`) }); }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('products', plan.products.length, stat);
