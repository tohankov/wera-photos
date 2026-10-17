// Content builder for one batch of new products (module). Used by batch.js (CLI) and run_batch.js (full pipeline).
// A batch dir holds: batch.json [articles], content.js {art: {title{ua,ru}, intro{ua,ru}, feat{ua[],ru[]}}}, photosrc.json {art: image file}.
// Neighbours = our products whose variant table already lists the article (a422/tables.json), read from backup/<name>_neighbours_before.json.
const fs = require('fs'), path = require('path');
const V = require('./vt.js');
const { datasheet } = require('../vt/table2.js');
const REPO = 'C:/Users/Techlight/Desktop/wera-photos/';
const COUNTRY = { CZ: ['Чехія', 'Чехия'], DE: ['Німеччина', 'Германия'], TW: ['Тайвань', 'Тайвань'], CN: ['Китай', 'Китай'], IT: ['Італія', 'Италия'], PT: ['Португалія', 'Португалия'], JP: ['Японія', 'Япония'], AT: ['Австрія', 'Австрия'] };
const T = require('../a422/tables.json'), P = require('../a422/price.json'), CL = Object.fromEntries(require('../a422/classified.json').map(x => [x.article, x]));
const DS = a => { const f = path.join(__dirname, '../batch/ds', a + '.txt'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const facts = a => { const t = DS(a); const g = re => (t.match(re) || [])[1]; return { ean: g(/EAN: \| (\d{13})/), weight: +(g(/Вес: \| ([\d,.]+) g/) || 0), country: g(/Страна \| ([A-Z]{2})\b/) }; };

function makeBuilder(dir) {
  const D = path.resolve(dir), NAME = path.basename(D);
  const load = f => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
  const content = require(path.join(D, 'content.js'));
  const nbFile = REPO + 'backup/' + NAME + '_neighbours_before.json';
  const NB = () => Object.fromEntries(JSON.parse(fs.readFileSync(nbFile, 'utf8')).response.products.map(p => [p.article, p]));
  let nbCache = null; const nb = () => (nbCache = nbCache || NB());
  const nbOf = a => (T[a]?.unlinked || []).map(x => nb()[x]).filter(p => p && V.splitTable(p.description.ua) && V.splitTable(p.description.ru));
  const block = (a, lang) => V.splitTable(nbOf(a)[0].description[lang])[1];
  // group Б: no series table on the site — characteristics come from content.js (chars), composition optional
  function descriptionNoTable(a, lang) {
    const c = content[a], f = facts(a);
    const L = lang === 'ua' ? { ch: 'Характеристики', w: 'Вага', g: 'г', co: 'Країна виробництва', feat: 'Особливості', set: 'Склад набору' } : { ch: 'Характеристики', w: 'Вес', g: 'г', co: 'Страна производства', feat: 'Особенности', set: 'Состав набора' };
    const ch = (c.chars ? c.chars[lang] : []).map(x => `<li>${x}</li>`);
    if (f.weight) ch.push(`<li>${L.w}: ${f.weight} ${L.g}</li>`);
    if (f.country && COUNTRY[f.country]) ch.push(`<li>${L.co}: ${COUNTRY[f.country][lang === 'ua' ? 0 : 1]}</li>`);
    if (f.ean) ch.push(`<li>EAN: ${f.ean}</li>`);
    return `<p>${c.intro[lang]}</p><p><strong>${L.feat}:</strong></p><ul>${c.feat[lang].map(x => `<li>${x}</li>`).join('')}</ul>`
      + (c.set ? `<p><strong>${L.set}:</strong></p><ul>${c.set[lang].map(x => `<li>${x}</li>`).join('')}</ul>` : '')
      + `<p><strong>${L.ch}:</strong></p><ul>${ch.join('')}</ul>` + datasheet(lang, a, 'ru');
  }
  function description(a, lang, links) {
    if (content[a].noTable) return descriptionNoTable(a, lang);
    const c = content[a], f = facts(a), b = block(a, lang), hdr = V.headers(b), row = V.rowOf(b, a);
    const L = lang === 'ua' ? { ch: 'Характеристики', w: 'Вага', g: 'г', co: 'Країна виробництва', feat: 'Особливості' } : { ch: 'Характеристики', w: 'Вес', g: 'г', co: 'Страна производства', feat: 'Особенности' };
    const ch = hdr.map((h, i) => [h, row.vals[i]]).filter(([, v]) => v && v !== '-').map(([h, v]) => `<li>${h.label}: ${v}${h.unit && !/[″"]$/.test(v) && h.unit !== 'дюйми' && h.unit !== 'дюймы' ? ' ' + h.unit : ''}</li>`);
    for (const n of row.notes) ch.push(`<li>${n}</li>`);
    if (f.weight) ch.push(`<li>${L.w}: ${f.weight} ${L.g}</li>`);
    if (f.country && COUNTRY[f.country]) ch.push(`<li>${L.co}: ${COUNTRY[f.country][lang === 'ua' ? 0 : 1]}</li>`);
    if (f.ean) ch.push(`<li>EAN: ${f.ean}</li>`);
    return `<p>${c.intro[lang]}</p><p><strong>${L.feat}:</strong></p><ul>${c.feat[lang].map(x => `<li>${x}</li>`).join('')}</ul>`
      + `<p><strong>${L.ch}:</strong></p><ul>${ch.join('')}</ul>`
      + V.rerender(b, lang, a, links[lang]) + datasheet(lang, a, 'ru');
  }
  function linkMap(a, newLinks) {
    const out = {};
    for (const lang of ['ua', 'ru']) { out[lang] = { ...V.linksIn(block(a, lang)) }; const n0 = nbOf(a)[0]; out[lang][n0.article] = (lang === 'ru' ? '/ru/' : '/') + n0.slug + '/'; for (const [x, s] of Object.entries(newLinks)) out[lang][x] = (lang === 'ru' ? '/ru' : '') + s; }
    return out;
  }
  function payloadNew(arts) {
    return arts.map(a => {
      const c = content[a], f = facts(a), sec = c.parent ? { parent: c.parent, alt: c.alt || [] } : CL[a].section;
      const lm = c.noTable ? {} : linkMap(a, {});
      const p = { article: a, title: c.title, mod_title: c.title, description: { ua: description(a, 'ua', lm), ru: description(a, 'ru', lm) }, price: P[a].price, brand: 'WERA', parent: { id: sec.parent }, presence: 'В наявності', display_in_showcase: 1,
        images: { override: true, links: [`https://raw.githubusercontent.com/tohankov/wera-photos/main/images/${NAME}/${a}.jpg`] } };
      if (sec.alt && sec.alt.length) p.alt_parent = sec.alt.map(id => ({ id }));
      if (f.ean) p.gtin = f.ean;
      return p;
    });
  }
  // new products + every neighbour; a neighbour whose table would change beyond links is reported, not included
  function payloadLinks(arts, L) {
    const products = [], problems = [];
    for (const a of arts.filter(x => !content[x].noTable)) { const lm = linkMap(a, L); products.push({ article: a, description: { ua: description(a, 'ua', lm), ru: description(a, 'ru', lm) } }); }
    const nbs = [...new Set(arts.flatMap(a => (T[a]?.unlinked || [])))].map(x => nb()[x]).filter(Boolean);
    for (const p of nbs) {
      const desc = {}; let bad = null;
      for (const lang of ['ua', 'ru']) {
        const parts = V.splitTable(p.description[lang]); if (!parts) { bad = lang + ' no table'; break; }
        const own = V.linksIn(parts[1]);
        const add = Object.fromEntries(Object.entries(L).map(([x, s]) => [x, (lang === 'ru' ? '/ru' : '') + s]));
        const html = V.rerender(parts[1], lang, p.article, { ...own, ...add });
        if (V.stripLinks(html) !== V.stripLinks(parts[1])) { bad = lang + ' differs beyond links'; break; }
        desc[lang] = parts[0] + html + parts[2];
      }
      if (bad) problems.push({ neighbour: p.article, problem: bad, affects: arts.filter(a => (T[a]?.unlinked || []).includes(p.article)) }); else products.push({ article: p.article, description: desc });
    }
    return { products, problems };
  }
  // the new product's table must list exactly the rows of the series table it was taken from
  function tableRowsOk(a) { if (content[a].noTable) return true; for (const lang of ['ua', 'ru']) { const ref = V.rowsOf(block(a, lang)).map(r => r.art); const mine = V.rowsOf(V.splitTable(description(a, lang, linkMap(a, {})))[1]).map(r => r.art); if (ref.join() !== mine.join() || ref.some(x => !x)) return false; } return true; }
  return { D, NAME, content, nbOf, payloadNew, payloadLinks, tableRowsOk, load, neighboursOf: arts => [...new Set(arts.flatMap(a => (T[a]?.unlinked || [])))] };
}
module.exports = { makeBuilder, REPO, facts };
