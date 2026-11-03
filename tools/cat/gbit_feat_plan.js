// «Біти та бітотримачі», global check: features by wera.de «Produktmerkmale» (owner 26.10.2026: «признаки WERA» without questions). Values are ONLY added.
//   bits:      «Diamantbeschichtet» -> «Особливості» (osoblyvosti) «Алмазне покриття» (Impaktor DC — the bits generator took it from the name «алмаз» only);
//   bit sets:  «Diamantbeschichtet» -> «Тип біт у наборі» «Алмазне покриття» (as sets_fill gives it from the bits);
//   holders:   «Magnetisch» -> «Особливості бітотримача» «З магнітом», «Unmagnetisch» -> «Без магніту» (CLAUDE.md: the wera.de property is a direct statement).
// Not written: holders whose datasheet names only a stainless-steel SLEEVE (899/4/1, 893/1/1, 893/4/1 K) — not a stainless tool.
//   node cat/gbit_feat_plan.js <group live.json> <out plan.json>
const fs = require('fs'); const [, , LIVE, OUT] = process.argv; const W = require('../../inventory/wera/pages.json');
const L = JSON.parse(fs.readFileSync(LIVE, 'utf8')).filter(p => +p.display_in_showcase === 1);
const plan = { name: 'gbit_feat', keys: ['osoblyvosti', 'typ_bit_u_nabori', 'osoblyvosti_bitotrymacha'], products: [] }; const stat = {};
for (const p of L) { const a = p.article; const wp = W.pages[W.art[a]]; if (!wp) continue; const m = wp.merkmale || []; const ch = p.characteristics || {};
  const g = k => (ch[k] || []).map(x => x.value.ua); const vyd = g('vyd_instrumentu'); const set = vyd.some(v => /^Набір/.test(v)); const holder = vyd.includes('Бітотримач');
  const add = {}; const put = (k, v, why) => { if (g(k).includes(v)) return; (add[k] = add[k] || { v: [], why: [] }).v.push(v); add[k].why.push(`+ ${v} (wera.de «${why}»)`); stat[k + ': ' + v] = (stat[k + ': ' + v] || 0) + 1; };
  if (m.includes('Diamantbeschichtet')) { if (!vyd.length) put('osoblyvosti', 'Алмазне покриття', 'Diamantbeschichtet'); else if (set && g('typ_bit_u_nabori').length) put('typ_bit_u_nabori', 'Алмазне покриття', 'Diamantbeschichtet'); }
  if (holder && m.includes('Magnetisch') && !m.includes('Unmagnetisch') && !g('osoblyvosti_bitotrymacha').includes('Без магніту')) put('osoblyvosti_bitotrymacha', 'З магнітом', 'Magnetisch');
  if (holder && m.includes('Unmagnetisch') && !m.includes('Magnetisch') && !g('osoblyvosti_bitotrymacha').includes('З магнітом')) put('osoblyvosti_bitotrymacha', 'Без магніту', 'Unmagnetisch');
  if (!Object.keys(add).length) continue;
  plan.products.push({ article: a, characteristics: Object.fromEntries(Object.entries(add).map(([k, x]) => [k, [...g(k), ...x.v]])), why: Object.values(add).flatMap(x => x.why) }); }
fs.writeFileSync(OUT, JSON.stringify(plan, null, 1)); console.log('products', plan.products.length, stat);
