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
// datasheet size -> our format: «1 мм x 5.5 мм x 100 мм» -> «SL 1,0×5,5×100 мм» (slotted by our name), «PH 2 x 100 мм» -> «PH 2×100 мм»,
// «3 mm x 25 мм» -> «HEX 3,0×25 мм» (hex bit by our name), «1/4" x 152 мм» -> «1/4″×152 мм», a list «10; 11; 12; 13 мм x 7/16; 1/2"» stays a list
function size(s, name = '') {
  const parts = String(s).trim().replace(/(\d)\.(\d)/g, '$1,$2').replace(/\bmm\b/g, 'мм').replace(/"/g, '″').split(/\s+x\s+/).map(p => p.trim()); const raw = parts.slice(); parts.forEach((p, i) => { parts[i] = p.replace(/\s*мм$/, ''); });
  const d1 = v => /^\d+$/.test(v) ? v + ',0' : v; const num = v => /^\d+(?:,\d+)?$/.test(v);
  if (/\bSL\b|шліц|шлиц/i.test(name) && parts.length === 3 && parts.every(num)) return `SL ${d1(parts[0])}×${d1(parts[1])}×${parts[2]} мм`;
  if (/\bHEX\b|шестигран/i.test(name) && parts.length === 2 && parts.every(num)) return `HEX ${d1(parts[0])}×${parts[1]} мм`;
  const list = parts.some(p => /;/.test(p)); const unit = /мм/.test(String(s).replace(/\bmm\b/g, 'мм')) ? ' мм' : '';
  return list ? raw.join(' × ') : parts.join('×') + unit;
}
// our product name without « WERA <article>» and without the size at the end (the size is its own line)
const baseName = (t, art) => t.replace(new RegExp('\\s+WERA\\s+' + art + '$'), '').replace(/\s+(?:(?:SL|PH|PZ|TX|HEX|IPR?)\s)?[\d,\/\-–]+(?:×[\d,]+)*\s?мм$/, '').replace(/[,\s]+$/, '').trim();
// WERA model code in front of our name when our name does not have it («932 A» + «Шліцева ударна викрутка»)
const withCode = (name, code) => { const m = (code || '').match(/^\d+(?:\/\d+)*(?:\s(?:[A-Z]{1,4}\d?|i|iS)(?=\s|$))*/); if (!m) return name; const k = m[0].trim(); return name.includes(k.split(' ')[0]) ? name : `${k} ${name}`; };
module.exports = { block, size, baseName, withCode, LBL, items_ };
