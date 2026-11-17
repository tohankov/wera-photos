// «Завантажити технічний паспорт (PDF)» — room under the button (owner 17.11.2026, 05056305001): the storefront description box has
// overflow:hidden and ended right on the bottom border line of the button. The <p> that holds the datasheet link gets
// style="margin:0 0 16px;padding-bottom:4px" (vt/table2.js datasheet() writes the same); the link and its text stay as they are. UA and RU, visible products.
//   node vt/pdfgap_plan.js <all.json> <out plan.json> [article,article ...]   -> plan for cat/desc_write.js
const fs = require('fs'); const [, , ALL, OUT, ONLY] = process.argv; const { PDF_P } = require('./table2.js');
const only = ONLY ? ONLY.split(',') : null; const RE = /<p>(\s*<a\b[^>]*pdfgenerator-datasheets)/g;
const fix = h => String(h || '').replace(RE, `<p style="${PDF_P}">$1`);
const plan = { name: process.env.NAME || 'pdfgap1117', products: {} }; let left = 0;
for (const p of JSON.parse(fs.readFileSync(ALL, 'utf8'))) { if (+p.display_in_showcase !== 1 || (only && !only.includes(p.article))) continue; const d = p.description || {};
  const nw = { ua: fix(d.ua), ru: fix(d.ru) }; if (nw.ua === (d.ua || '') && nw.ru === (d.ru || '')) continue;
  for (const l of ['ua', 'ru']) if (/pdfgenerator-datasheets/.test(nw[l]) && !nw[l].includes(`<p style="${PDF_P}"><a`)) left++;
  plan.products[p.article] = { old: { ua: d.ua, ru: d.ru }, new: nw, why: ['отступ под кнопкой PDF: <p style="' + PDF_P + '">'] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log('plan', Object.keys(plan.products).length, 'products; PDF paragraph of another form', left);
