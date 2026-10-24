// wera.de product (series) page -> facts for the global check (docs/global_plan.md). wera.de/de/<article> redirects to the SERIES page.
//   parse(html) -> { h1, crumbs: [names], gallery: [{file, px}], merkmale: [..], table: { arts: [..], rows: [{label, unit, vals: [..]}], notes: {art: [..]} },
//                    notesText: {n: text}, sets: [names], setItems: vt/wset.js items }
// gallery — slides of the main image swiper in page order, each with its largest size (main 1664/896; application photos 1013x570 — «в работе»;
// details tipp_ / vorteil_ — 416/832). 240x240 pictures are other products (related, sets) and are not in the gallery.
const W = require('./wset.js');
const dec = s => s.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
function gallery(h) {
  const i = h.indexOf('swiper productfinder-image-main'); if (i < 0) return [];
  const j = h.indexOf('thumbs-wrapper', i); const g = h.slice(i, j > 0 ? j : i + 200000); const out = [];
  for (const s of g.split('swiper-slide').slice(1)) { const c = [...s.matchAll(/\/prodimg\/(\d+)x(\d+)\/([^"'\s]+?\.(?:webp|jpg|png))/g)]; if (!c.length) continue;
    const best = c.reduce((a, m) => (+m[1] * +m[2] > +a[1] * +a[2] ? m : a)); if (!out.some(o => o.file === best[3])) out.push({ file: best[3], px: best[1] + 'x' + best[2], url: `https://www.wera.de/prodimg/${best[1]}x${best[2]}/${best[3]}` }); }
  return out; }
function table(h) {
  // «Daten und Fakten» is a grid of divs: class "scrollsnaptable-cell … row-R column-C"; row 0 — Teilenummer
  const i = h.indexOf('Daten und Fakten'); if (i < 0) return null; const t = h.slice(i, i + 400000); const g = {};
  for (const m of t.matchAll(/<div\s+class="scrollsnaptable-cell[^"]*\brow-(\d+) column-(\d+)"[^>]*>([\s\S]*?)<\/div>/g)) {
    const r = +m[1], c = +m[2]; (g[r] = g[r] || [])[c] = c === 0 ? { label: dec((m[3].match(/<span class='label'>([\s\S]*?)<\/span>/) || [, m[3]])[1]), unit: dec((m[3].match(/<span class="unit">([\s\S]*?)<\/span>/) || [, ''])[1]) } : dec(m[3]); }
  if (!g[0]) return null; const arts = g[0].slice(1).filter(a => /^\d{11}$/.test(a)); const out = { arts, rows: [], notes: {} };
  for (const r of Object.keys(g).map(Number).sort((x, y) => x - y)) { if (!r) continue; const row = g[r]; if (!row[0]) continue; out.rows.push({ label: row[0].label, unit: row[0].unit, vals: arts.map((_, k) => row[k + 1] || '') }); }
  const hint = out.rows.find(r => /^Hinweis/.test(r.label)); if (hint) arts.forEach((a, k) => { const v = (hint.vals[k] || '').match(/\d+/g); if (v) out.notes[a] = v; });
  return out; }
// detail pictures (tipp_ / vorteil_ / feature pictures 416 / 832) between the gallery and «Daten und Fakten»; 240 / 160 / 104 / 40 — other products, icons
function details(h, main) {
  // the area ends at the first of «Daten und Fakten» / «Werkzeuge in diesem Set» / «Sets mit diesem Werkzeug» (a set page has no facts table, its tools are 480 px too)
  const i = h.indexOf('thumbs-wrapper'); if (i < 0) return []; const j = Math.min(...['Daten und Fakten', 'Werkzeuge in diesem Set', 'Sets mit diesem Werkzeug'].map(k => h.indexOf(k, i)).filter(x => x > 0), Infinity); const t = h.slice(i, j < Infinity ? j : i + 300000); const best = {};
  for (const m of t.matchAll(/\/prodimg\/(\d+)x(\d+)\/([^"'\s]+?\.(?:webp|jpg|png))/g)) { const w = +m[1]; if (w < 400) continue; const k = m[3]; if (main.some(x => x.file === k)) continue;
    if (!best[k] || w * +m[2] > best[k].w * best[k].h) best[k] = { w, h: +m[2] }; }
  return Object.entries(best).map(([file, v]) => ({ file, px: v.w + 'x' + v.h, url: `https://www.wera.de/prodimg/${v.w}x${v.h}/${file}` })); }
function parse(h) {
  const h1 = dec((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]);
  const ld = (h.match(/"@type":"BreadcrumbList","itemListElement":(\[[\s\S]*?\])\}<\/script>/) || [])[1]; let crumbs = [];
  try { crumbs = JSON.parse(ld).map(x => x.name); } catch { }
  const merkmale = [...h.matchAll(/feature-icon-text[^>]*>([^<]*)</g)].map(m => dec(m[1])).filter(Boolean);
  const notesText = {}; for (const m of dec(h.slice(h.indexOf('Daten und Fakten'), h.indexOf('Daten und Fakten') + 400000)).matchAll(/\((\d+)\)\s([^()]+?)(?=\s\(\d+\)|\sErfahren|$)/g)) if (!notesText[m[1]] || notesText[m[1]].length < m[2].length) notesText[m[1]] = m[2].trim();
  const sets = [...h.matchAll(/product-set-headline[\s\S]*?<a [^>]*>([\s\S]*?)<\/a>[\s\S]*?<div>([^<]*)<\/div>/g)].map(m => dec(m[1]) + (m[2].trim() ? ' — ' + m[2].trim() : ''));
  const gal = gallery(h); return { h1, crumbs, gallery: gal, details: details(h, gal), merkmale, table: table(h), notesText, sets, setItems: W.parse(h).items.filter(i => i.rows.length) }; }
module.exports = { parse, dec };
if (require.main === module) console.log(JSON.stringify(parse(require('fs').readFileSync(process.argv[2], 'utf8')), null, 1).slice(0, 6000));
