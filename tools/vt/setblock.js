// «Склад набору» block for a set's description (owner 24.10.2026, global check item 3 — variant (в); (а) table / (б) cards: docs/pilot/sets_block_preview.html).
// Composition — the WERA datasheet (all pages, cat/ds_comp_all.json) checked against wera.de «Werkzeuge in diesem Set» (vt/wset.js); names — our product names;
// a position links to our product when it is on the site (visible), else plain text and the WERA picture.
// Two columns, one on a phone (grid min width max(260px, 50%) — no media query); picture 76x46 — the main photo WITHOUT background (lib/cutout.js),
// not on a white tile; name — green link; size — bold; «Арт. … · N шт.» — grey. More than 10 positions: the first 8, the rest under <details>
// («Показати весь склад — ще N ▾» / «Згорнути ▴»), no JS. Inline styles + one scoped <style> (summary marker and the two summary texts) —
// Horoshop keeps <details>, <summary>, <style> and the grid in the description, UA and RU, admin and storefront (vt/details_test.js, 24.10.2026).
//   block(items, lang, { count })  items: [{art|null, name:{ua,ru}, size, qty, href|null, img}]  count — «N предметів» (WERA's count), default sum of qty
const C = { line: '#363434', card: '#201f1d', text: '#ededed', muted: '#999', green: '#1e9676' };
const LBL = {
  title: { ua: 'Склад набору', ru: 'Состав набора' },
  more: { ua: n => `Показати весь склад — ще ${n} ▾`, ru: n => `Показать весь состав — ещё ${n} ▾` },
  less: { ua: 'Згорнути ▴', ru: 'Свернуть ▴' },
  pcs: { ua: 'шт.', ru: 'шт.' }, art: { ua: 'Арт.', ru: 'Арт.' },
  hint: { ua: 'Склад — за технічним паспортом WERA. Натисніть на назву, щоб перейти до інструмента.', ru: 'Состав — по техническому паспорту WERA. Нажмите на название, чтобы перейти к инструменту.' },
};
const SHOW = 8, ALL = 10, CLS = 'wsb';
// 1 предмет, 2–4 предмети, 5+ предметів (11–14 — предметів); RU предмет / предмета / предметов
const items_ = (n, lang) => { const d = n % 10, h = n % 100; const k = d === 1 && h !== 11 ? 0 : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 1 : 2; return (lang === 'ua' ? ['предмет', 'предмети', 'предметів'] : ['предмет', 'предмета', 'предметов'])[k]; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const GRID = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(max(260px,calc(50% - 6px)),1fr));gap:10px';
const card = (it, lang) => {
  const pic = `<span style="flex:0 0 76px;width:76px;height:46px;display:flex;align-items:center;justify-content:center">`
    + (it.img ? `<img src="${esc(it.img)}" alt="${esc(it.name[lang])}" loading="lazy" style="max-width:76px;max-height:46px;width:auto;height:auto;display:block">` : '') + '</span>';
  const name = it.href ? `<a href="${esc(it.href)}" style="color:${C.green}">${esc(it.name[lang])}</a>` : `<span style="color:${C.text}">${esc(it.name[lang])}</span>`;
  const meta = [it.art ? `${LBL.art[lang]} ${it.art}` : '', `${it.qty} ${LBL.pcs[lang]}`].filter(Boolean).join(' · ');
  return `<div style="display:flex;gap:12px;align-items:center;min-width:0;padding:8px 10px;border:1px solid ${C.line};border-radius:8px;background:${C.card}">${pic}`
    + `<span style="display:block;min-width:0;font-size:14px;line-height:1.35">${name}${it.size ? `<b style="display:block;margin-top:2px;color:${C.text}">${esc(it.size)}</b>` : ''}`
    + `<span style="display:block;margin-top:2px;color:${C.muted};font-size:12px">${meta}</span></span></div>`; };
function block(items, lang, { count } = {}) {
  const n = count || items.reduce((s, x) => s + (+x.qty || 1), 0);
  const style = `<style>.${CLS} details>summary{list-style:none}.${CLS} details>summary::-webkit-details-marker{display:none}`
    + `.${CLS} details[open]>summary .${CLS}-more{display:none}.${CLS} details:not([open])>summary .${CLS}-less{display:none}</style>`;
  const grid = list => `<div style="${GRID}">${list.map(it => card(it, lang)).join('')}</div>`;
  let h = `<div class="${CLS}">${style}<h3>${LBL.title[lang]} · ${n} ${items_(n, lang)}</h3>`;
  if (items.length <= ALL) h += grid(items);
  else h += grid(items.slice(0, SHOW)) + `<details style="margin-top:10px"><summary style="cursor:pointer;display:inline-block;padding:8px 0;color:${C.green};font-weight:600">`
    + `<span class="${CLS}-more">${LBL.more[lang](items.length - SHOW)}</span><span class="${CLS}-less">${LBL.less[lang]}</span></summary>${grid(items.slice(SHOW))}</details>`;
  return h + `<p style="margin-top:8px;font-size:12px;color:${C.muted}">${LBL.hint[lang]}</p></div>`;
}
// Grouped by profile (owner 24.10.2026, as in the old WERA catalog): a row of chips «icon PH · 4» — only the screwdriver PROFILE groups, only when ≥ 2 of them
// (owner 25.10.2026; groups without a profile are in the list below only), then the groups —
// heading = icon 34 px + «Phillips PH» + grey «· N поз.», under it the same cards and grid. Profile groups in the order of their first position
// in the datasheet, groups without a profile (text heading, vt/setgroup.js CAT) — at the end, also by first appearance. More than 10 positions:
// the cut is at a GROUP boundary (owner 25.10.2026): whole groups are visible while their sum is ≤ 10 positions, so «Згорнути ▴» never stands inside a group;
// only a first group of more than 10 is cut at 8 (it continues under <details> without a new heading).
//   blockG(items, lang, { count, iconBase, iconSrc })  items: as block() + gkey (vt/setgroup.js group().key); iconSrc(name) overrides the icon URL (preview)
const G = require('./setgroup.js');
LBL.pos = { ua: 'поз.', ru: 'поз.' };
function blockG(items, lang, { count, iconBase = '/content/uploads/images/icons/', iconSrc, keepOrder } = {}) {
  const n = count || items.reduce((s, x) => s + (+x.qty || 1), 0); const src = f => iconSrc ? iconSrc(f) : iconBase + f + '.png';
  const keys = []; for (const it of items) if (!keys.includes(it.gkey)) keys.push(it.gkey);
  // keepOrder (variant for the owner, 27.10.2026): the groups in the datasheet order — a ratchet set shows its ratchet and sockets first
  const order = keepOrder ? keys.slice() : [...keys.filter(k => !k.startsWith('c:')), ...keys.filter(k => k.startsWith('c:'))];
  const flat = order.flatMap(k => items.filter(it => it.gkey === k)); const cnt = k => items.filter(it => it.gkey === k).length;
  const title = k => { const d = G.def(k); return cnt(k) === 1 && d.one ? d.one[lang] : d[lang]; };
  const style = `<style>.${CLS} details>summary{list-style:none}.${CLS} details>summary::-webkit-details-marker{display:none}`
    + `.${CLS} details[open]>summary .${CLS}-more{display:none}.${CLS} details:not([open])>summary .${CLS}-less{display:none}</style>`;
  const chip = k => { const d = G.def(k); return `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px ${d.icon ? '3px 4px' : '3px 10px'};border:1px solid ${C.line};border-radius:14px;font-size:13px;color:${C.text};white-space:nowrap">`
    + (d.icon ? `<img src="${esc(src(d.icon))}" alt="" width="20" height="20" style="display:block">` : '') + `${esc(d.chip || title(k))} · ${cnt(k)}</span>`; };
  const head = k => { const d = G.def(k); return `<div style="display:flex;align-items:center;gap:10px;margin:16px 0 8px">`
    + (d.icon ? `<img src="${esc(src(d.icon))}" alt="" width="34" height="34" style="display:block;flex:0 0 34px">` : '')
    + `<span style="font-size:15px;font-weight:600;color:${C.text}">${esc(title(k))}<span style="font-weight:400;color:${C.muted}"> · ${cnt(k)} ${LBL.pos[lang]}</span></span></div>`; };
  // runs of one group inside a slice of flat: heading only where the group starts (not where it continues after the cut)
  const part = (from, to) => { let h = '', cur = null, run = []; const flush = () => { if (run.length) h += `<div style="${GRID}">${run.map(it => card(it, lang)).join('')}</div>`; run = []; };
    for (let i = from; i < to; i++) { const it = flat[i]; if (it.gkey !== cur) { flush(); cur = it.gkey; if (i === 0 || flat[i - 1].gkey !== cur) h += head(cur); } run.push(it); }
    flush(); return h; };
  let h = `<div class="${CLS}">${style}<h3>${LBL.title[lang]} · ${n} ${items_(n, lang)}</h3>`;
  const prof = order.filter(k => !k.startsWith('c:')); if (prof.length >= 2) h += `<div style="display:flex;flex-wrap:wrap;gap:6px">${prof.map(chip).join('')}</div>`;
  // visible part: whole groups while ≤ ALL positions; a first group bigger than ALL — its first SHOW positions
  let cutAt = 0; for (const k of order) { if (cutAt + cnt(k) > ALL) break; cutAt += cnt(k); } if (!cutAt || (keepOrder && cutAt < SHOW)) cutAt = SHOW;   // keepOrder: a small first group (1 ratchet) — fill up to SHOW
  if (flat.length <= ALL || cutAt >= flat.length) h += part(0, flat.length);
  else h += part(0, cutAt) + `<details style="margin-top:10px"><summary style="cursor:pointer;display:inline-block;padding:8px 0;color:${C.green};font-weight:600">`
    + `<span class="${CLS}-more">${LBL.more[lang](flat.length - cutAt)}</span><span class="${CLS}-less">${LBL.less[lang]}</span></summary>${part(cutAt, flat.length)}</details>`;
  return h + `<p style="margin-top:8px;font-size:12px;color:${C.muted}">${LBL.hint[lang]}</p></div>`;
}
// datasheet size -> our format: «1 мм x 5.5 мм x 100 мм» -> «SL 1,0×5,5×100 мм» (slotted by our name), «PH 2 x 100 мм» -> «PH 2×100 мм»,
// «3 mm x 25 мм» -> «HEX 3,0×25 мм» (hex bit by our name), «1/4" x 152 мм» -> «1/4″×152 мм», a list «10; 11; 12; 13 мм x 7/16; 1/2"» stays a list
// prof — the position's profile group (vt/setgroup.js key) when known: our data first, the name only as a fallback
function size(s, name = '', prof = '') {
  const parts = String(s).trim().replace(/(\d)\.(\d)/g, '$1,$2').replace(/\bmm\b/g, 'мм').replace(/"/g, '″').split(/\s+x\s+/).map(p => p.trim()); const raw = parts.slice(); parts.forEach((p, i) => { parts[i] = p.replace(/\s*мм$/, ''); });
  const d1 = v => /^\d+$/.test(v) ? v + ',0' : v; const num = v => /^\d+(?:,\d+)?$/.test(v);
  if ((prof ? prof === 'SL' : /\bSL\b|шліц|шлиц/i.test(name)) && parts.length === 3 && parts.every(num)) return `SL ${d1(parts[0])}×${d1(parts[1])}×${parts[2]} мм`;
  if ((prof ? prof === 'HEX' : /\bHEX\b|шестигран/i.test(name)) && parts.length === 2 && parts.every(num)) return `HEX ${d1(parts[0])}×${parts[1]} мм`;
  const list = parts.some(p => /;/.test(p)); const unit = /мм/.test(String(s).replace(/\bmm\b/g, 'мм')) ? ' мм' : '';
  return list ? raw.join(' × ') : parts.join('×') + unit;
}
// our product name without « WERA <article>» and without the size at the end (the size is its own line)
const baseName = (t, art) => t.replace(new RegExp('\\s+WERA\\s+' + art + '$'), '').replace(/\s+(?:(?:SL|PH|PZ|TX|HEX|IPR?)\s)?[\d,\/\-–]+″?(?:×[\d,]+)*\s?мм$/, '').replace(/[,\s]+$/, '').trim();
// WERA model code in front of our name when our name does not have it («932 A» + «Шліцева ударна викрутка»)
const withCode = (name, code) => { const m = (code || '').match(/^\d+(?:\/\d+)*(?:\s(?:[A-Z]{1,4}\d?|i|iS)(?=\s|$))*/); if (!m) return name; const k = m[0].trim(); return name.includes(k.split(' ')[0]) ? name : `${k} ${name}`; };
module.exports = { block, blockG, size, baseName, withCode, LBL, items_ };
