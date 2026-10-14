// Compact variant table + datasheet block (tl-shop.com.ua dark theme, minimal inline styles).
// Inherited props live on <table>/<tr>; links use the site's own .text a style; the site wraps tables in its own scroll box.
const LBL = {
  title: { ua: 'Інші варіанти серії', ru: 'Другие варианты серии' },
  art: { ua: 'Артикул', ru: 'Артикул' },
  cur: { ua: 'цей товар', ru: 'этот товар' },
  hint: { ua: 'Натисніть на артикул, щоб перейти до товару', ru: 'Нажмите на артикул, чтобы перейти к товару' },
  more: { ua: 'Дізнайтеся більше про цей товар', ru: 'Узнайте больше об этом товаре' },
  pdf: { ua: 'Завантажити технічний паспорт (PDF)', ru: 'Скачать технический паспорт (PDF)' },
};
const C = { bg: '#191816', head: '#262523', line: '#363434', text: '#ededed', muted: '#999', green: '#1e9676', cur: '#16302a' };
const ICON_DIR = '/content/uploads/images/icons/';
// site zebra: .text tr:nth-child(2n+1) td{background:rgba(237,237,237,.05)} — the sticky cell needs the same colour, but opaque
const zebra = hex => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.substr(i, 2), 16) * 0.95 + 237 * 0.05).toString(16).padStart(2, '0')).join('');

// series: {name, cols:[{icon, w, ua, ru, unit?:{ua,ru}}], rows:[[art, ...values, noteNo]], notes:{ua:[..], ru:[..]}}
function table(series, lang, current, links) {
  const sup = n => n ? `<sup style="color:${C.muted}">${String(n).split(',').map(x => x + ')').join(',')}</sup>` : ''; // "1" -> 1), "1,2" -> 1),2)
  let h = `<h3>${LBL.title[lang]} ${series.name}</h3>`;
  h += `<table style="width:100%;min-width:560px;border-collapse:collapse;text-align:center;white-space:nowrap;font-size:14px">`;
  h += `<thead><tr style="background:${C.head};border-bottom:2px solid ${C.green};vertical-align:bottom">`;
  const th = `text-align:center;color:${C.text};font-weight:600;line-height:1.25`;
  h += `<th style="${th};text-align:left;position:sticky;left:0;background:${C.head}">${LBL.art[lang]}</th>`;
  for (const c of series.cols) {
    const label = c[lang];
    // no WERA pictogram for this column -> text only
    const img = c.icon ? `<img src="${ICON_DIR}${c.icon}.png" width="${c.w}" height="26" alt="${label}" style="display:block;margin:0 auto 4px">` : '';
    h += `<th style="${th};white-space:normal">${img}${label}`
      + (c.unit ? `<span style="display:block;color:${C.muted};font-weight:400">${c.unit[lang]}</span>` : '') + '</th>';
  }
  h += '</tr></thead><tbody>';
  series.rows.forEach((r, i) => {
    const art = r[0], vals = r.slice(1, 1 + series.cols.length), note = r[1 + series.cols.length], isCur = art === current;
    const base = isCur ? C.cur : C.bg, bg = i % 2 === 0 ? zebra(base) : base;
    h += `<tr style="border-top:1px solid ${C.line}${isCur ? ';background:' + C.cur + ';font-weight:700' : ''}">`;
    let first;
    if (isCur) first = `${art}${sup(note)}<br><span style="display:inline-block;margin-top:3px;padding:0 8px;border-radius:10px;background:${C.green};color:#fff;font-size:11px">${LBL.cur[lang]}</span>`;
    else first = (links[art] ? `<a href="${links[art]}">${art}</a>` : art) + sup(note);
    h += `<td style="text-align:left;position:sticky;left:0;background:${bg}${isCur ? ';box-shadow:inset 4px 0 ' + C.green : ''}">${first}</td>`;
    h += vals.map(v => `<td>${v}</td>`).join('') + '</tr>';
  });
  h += '</tbody></table>';
  h += `<p style="font-size:12px;color:${C.muted}">${series.notes[lang].join('<br>')}${series.notes[lang].length ? '<br>' : ''}${LBL.hint[lang]}</p>`;
  return h;
}

function datasheet(lang, art, pdfLang) {
  const url = `https://hybris-media.wera.de/download/pdfgenerator-datasheets/${pdfLang}/${art}.pdf`;
  return `<h3>${LBL.more[lang]}</h3><p><a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:12px;padding:8px 16px 8px 10px;border:1px solid ${C.line};border-radius:8px;color:${C.text}">`
    + `<img src="${ICON_DIR}icon-pdf.png" width="31" height="40" alt="PDF">${LBL.pdf[lang]}</a></p>`;
}
module.exports = { table, datasheet };
