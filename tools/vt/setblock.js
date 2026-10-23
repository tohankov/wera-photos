// «Склад набору» block for a set's description (owner 23.10.2026, global check item 3; PILOT 05051012001 — two variants to choose from).
// Composition — the WERA datasheet (all pages, cat/ds_comp_all.json) checked against wera.de «Werkzeuge in diesem Set»; names — our product names;
// a row links to our product when it is on the site (visible), else plain text and a WERA picture. Inline styles only (the site's description editor),
// the dark theme of the variant tables (vt/table2.js), a light picture tile so photos with and without a white background look the same.
//   block(items, lang, variant)  items: [{art, code, name:{ua,ru}, size, qty, href|null, img}]  variant: 'table' | 'cards'
const C = { bg: '#191816', head: '#262523', line: '#363434', text: '#ededed', muted: '#999', green: '#1e9676', tile: '#ffffff' };
const LBL = {
  title: { ua: 'Склад набору', ru: 'Состав набора' },
  name: { ua: 'Інструмент', ru: 'Инструмент' }, size: { ua: 'Розмір', ru: 'Размер' }, qty: { ua: 'К-сть', ru: 'Кол-во' },
  pcs: { ua: 'шт.', ru: 'шт.' }, art: { ua: 'Арт.', ru: 'Арт.' },
  hint: { ua: 'Натисніть на назву, щоб перейти до інструмента. Склад — за технічним паспортом WERA.', ru: 'Нажмите на название, чтобы перейти к инструменту. Состав — по техническому паспорту WERA.' },
  hintCard: { ua: 'Натисніть на картку, щоб перейти до інструмента. Склад — за технічним паспортом WERA.', ru: 'Нажмите на карточку, чтобы перейти к инструменту. Состав — по техническому паспорту WERA.' },
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tile = (it, w, h, lang) => `<span style="display:flex;align-items:center;justify-content:center;width:${w};height:${h}px;background:${C.tile};border-radius:6px;overflow:hidden">`
  + `<img src="${esc(it.img)}" alt="${esc(it.name[lang])}" loading="lazy" style="max-width:92%;max-height:${h - 8}px;width:auto;height:auto;display:block"></span>`;
const nameHtml = (it, lang) => { const n = `${it.code ? esc(it.code) + ' ' : ''}${esc(it.name[lang])}`; return it.href ? `<a href="${esc(it.href)}">${n}</a>` : `<span style="color:${C.text}">${n}</span>`; };

function table(items, lang) {
  let h = `<h3>${LBL.title[lang]}</h3><table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.35">`;
  const th = `color:${C.text};font-weight:600;padding:8px 10px;text-align:left`;
  h += `<thead><tr style="background:${C.head};border-bottom:2px solid ${C.green}"><th style="${th};width:64px"></th><th style="${th}">${LBL.name[lang]}</th>`
    + `<th style="${th};white-space:nowrap">${LBL.size[lang]}</th></tr></thead><tbody>`;
  for (const it of items) h += `<tr style="border-top:1px solid ${C.line}"><td style="padding:6px 6px 6px 0">${tile(it, '64px', 36, lang)}</td>`
    + `<td style="padding:6px 8px;white-space:normal;min-width:96px">${nameHtml(it, lang)}<span style="display:block;color:${C.muted};font-size:12px">${LBL.art[lang]} ${it.art}</span></td>`
    + `<td style="padding:6px 0 6px 6px;white-space:nowrap;font-size:13px">${esc(it.size)}<span style="display:block;color:${C.muted};font-size:12px">${it.qty} ${LBL.pcs[lang]}</span></td></tr>`;
  return h + `</tbody></table><p style="font-size:12px;color:${C.muted}">${LBL.hint[lang]}</p>`;
}

function cards(items, lang) {
  let h = `<h3>${LBL.title[lang]}</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 8px">`;
  for (const it of items) { const inner = `${tile(it, '100%', 96, lang)}<span style="display:block;margin-top:8px;font-size:13px;line-height:1.3;color:${C.text}">${it.code ? esc(it.code) + ' ' : ''}${esc(it.name[lang])}</span>`
      + `<span style="display:block;margin-top:4px;font-size:13px;color:${C.text};font-weight:600">${esc(it.size)}${it.qty > 1 ? ` · ${it.qty} ${LBL.pcs[lang]}` : ''}</span>`
      + `<span style="display:block;margin-top:2px;font-size:12px;color:${it.href ? C.green : C.muted}">${LBL.art[lang]} ${it.art}</span>`;
    const box = `display:block;padding:8px;border:1px solid ${C.line};border-radius:8px;background:${C.head};text-decoration:none`;
    h += it.href ? `<a href="${esc(it.href)}" style="${box}">${inner}</a>` : `<div style="${box}">${inner}</div>`; }
  return h + `</div><p style="font-size:12px;color:${C.muted}">${LBL.hintCard[lang]}</p>`;
}
const block = (items, lang, variant) => (variant === 'cards' ? cards : table)(items, lang);
// datasheet size «1 мм x 5.5 мм x 100 мм» / «PH 2 x 100 мм» / «30 мм x 400 мм» -> «1,0×5,5×100 мм», «PH 2×100 мм», «30×400 мм»
function size(s) { let z = String(s).trim().replace(/(\d)\.(\d)/g, '$1,$2'); const sl = z.match(/^(\d+(?:,\d+)?) мм x (\d+(?:,\d+)?) мм x (\d+(?:,\d+)?) мм$/);
  const d1 = v => /,/.test(v) ? v : v + ',0'; if (sl) return `SL ${d1(sl[1])}×${d1(sl[2])}×${sl[3]} мм`;
  return z.replace(/ мм x /g, '×').replace(/ x /g, '×'); }
module.exports = { block, table, cards, size, LBL };
