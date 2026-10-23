// After the owner sets the filters in the admin: storefront filter blocks (vt/sec_heads.js) vs the admin plan (cat/night_plan_<group>.json), section by section —
// list and order (a filter without values, or with one price, is hidden by Horoshop; «Хіти продажів» shows only where products carry the sticker).
// Owner 23.10.2026: he puts ALL «… у складі» into set sections — an extra «… у складі» on the storefront is not an error (noted as info, order compared without it).
//   node cat/plan_vs_site.js <heads.json> <scan.json> <live.json> <group>   (the filter counts vs the export — cat/sec_check.js)
const path = require('path'); const [, , HF, SF, LF, GK] = process.argv; const T = path.join(__dirname, '..'); const H = require(path.resolve(HF)), S = require(path.resolve(SF)), L = require(path.resolve(LF));
const P = require(path.join(T, 'cat', `night_plan_${GK}.json`)); const TITLE = require(path.join(T, 'cat', 'char_titles.js'));
const secs = p => [p.parent && +p.parent.id, ...(p.alt_parent || []).map(x => +x.id)]; const v = (p, k) => ((p.characteristics || {})[k] || []);
const rows = [];
for (const [id, h] of Object.entries(H)) { const s = S[id]; const vis = L.filter(p => +p.display_in_showcase === 1 && secs(p).includes(+id)); const pl = P.plans[id];
  if (!s.ua.products.length) { rows.push({ id, path: s.path, res: 'плитки (товаров нет)', now: h.ua.heads.join(' → ') }); continue; }
  const keys = !pl ? null : (pl.inherits ? P.rootList : pl.list); const shown = keys && keys.filter(k => vis.some(p => v(p, k).length));
  const want = shown ? shown.map(k => TITLE[k]) : null; const now0 = h.ua.heads.filter(x => x !== 'Хіти продажів' && x !== 'Ціна');
  const sk = now0.filter(x => / у складі$/.test(x) && !(want || []).includes(x)); const now = now0.filter(x => !sk.includes(x));
  const ruOk = h.ru.heads.length === h.ua.heads.length; const priceAt = h.ua.heads.indexOf('Ціна'), hitAt = h.ua.heads.indexOf('Хіти продажів');
  const notes = [];
  if (!want) notes.push('нет в плане');
  else if (JSON.stringify(want) !== JSON.stringify(now)) { const miss = want.filter(x => !now.includes(x)), extra = now.filter(x => !want.includes(x));
    if (miss.length) notes.push('нет: ' + miss.join(', ')); if (extra.length) notes.push('лишний: ' + extra.join(', ')); if (!miss.length && !extra.length) notes.push('порядок'); }
  const info = sk.length ? 'инфо: ещё ' + sk.map(x => '«' + x + '»').join(', ') + ' (правило владельца — все «… у складі»)' : '';
  if (priceAt < 0) notes.push('нет «Ціни»'); else if (priceAt !== (hitAt >= 0 ? 1 : 0)) notes.push('«Ціна» не на месте');
  if (hitAt > 0) notes.push('«Хіти» не первым'); if (!ruOk) notes.push('ru ≠ ua по числу блоков');
  const prices = [...new Set(vis.map(p => p.price))];
  rows.push({ id, path: s.path, n: vis.length, own: pl ? (pl.tiny ? 'tiny' : pl.inherits ? 'наслед.' : 'свой') : '-', want: ['Ціна', ...(want || [])].join(' → '), now: h.ua.heads.join(' → '), ru: h.ru.heads.join(' → '), res: notes.join('; ') || 'OK', info }); }
console.log(JSON.stringify(rows));
