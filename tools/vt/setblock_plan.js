// Grouped «Склад набору» block into the descriptions of a group's sets (owner 26.10.2026, «ок» on docs/pilot/sets_block_g.html) -> plan for cat/desc_write.js.
// Only sets whose every position already has a main photo WITHOUT background on our site (state from comp_state: PNG, transparent corners) or is the
// KNIPEX position; the others wait for the photos of their groups and are listed in <out>_wait.json. Pictures — only from our domain (owner 26.10.2026):
// a position = the main photo of our product (images[0]), KNIPEX 87 01 250 = /content/uploads/images/icons/knipex_87_01_250.png (uploaded by the owner).
// Composition — the datasheet (cat/ds_comp_all.json, all pages) = wera.de «Werkzeuge in diesem Set» (inventory/wera/pages.json); articles + qty differ, or a
// position without a group (vt/setgroup.js question) -> the set is not written, it goes to the questions. No wera.de page — the datasheet alone (noted).
// Placement: before «Інші варіанти / Другие варианты» or «Дізнайтеся більше / Узнайте больше» (h3), else at the end; old composition pictures in the prose
// (a <p> with only <img> not from /icons/) are removed — the block replaces them. A description that already has the block is skipped.
//   node vt/setblock_plan.js <all.json> <comp_state.json> <out plan.json> [name] [set ...]
const fs = require('fs'), path = require('path'); const T = path.join(__dirname, '..') + '/';
const SB = require('./setblock.js'); const G = require('./setgroup.js'); const C = require(T + 'cat/ds_comp_all.json'); const W = require(T + '../inventory/wera/pages.json');
const [, , ALL, STF, OUT, NAME, ...only] = process.argv;
const L = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p])); const ST = JSON.parse(fs.readFileSync(STF, 'utf8'));
const KN = 'https://techlight-shop.com.ua/vysokotekhnolohichni-santekhnichni-klishchi-cobra-knipex-87-01-250/';
const NOART = { KNIPEX: { art: '87 01 250', ua: 'Високотехнологічні сантехнічні кліщі Cobra® 250 мм KNIPEX', ru: 'Высокотехнологичные сантехнические клещи 250 мм KNIPEX Cobra®',
  href: { ua: KN, ru: KN.replace('techlight-shop.com.ua/', 'techlight-shop.com.ua/ru/') }, img: 'https://tl-shop.com.ua/content/uploads/images/icons/knipex_87_01_250.png' } };
const ru = u => u.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/');
const ANCHOR = /<h3>(?:Інші варіанти|Другие варианты|Дізнайтеся більше|Узнайте больше)/;
const OLDPIC = /<p>(?:\s*<img(?![^>]*\/icons\/)[^>]*>\s*)+<\/p>/g;
// WERA's count «N предметів» — from the datasheet TITLE (page 1 lines before «EAN:»), not from the page footers («1 предметов»); none — the sum of qty
const dsCount = a => { const t = fs.readFileSync(T + 'batch/ds/' + a + '.txt', 'utf8').split('\n').filter(l => l.startsWith('p1 ')).map(l => l.slice(3)); const e = t.findIndex(l => /^EAN:/.test(l));
  const m = t.slice(0, e < 0 ? 3 : e).join(' ').match(/(\d+)\s+предмет/); return m ? +m[1] : undefined; };
// a block already in the description (an earlier write) is replaced, at the same place
const strip = h => { const i = h.indexOf('<div class="wsb">'); if (i < 0) return h; const k = h.search(/(Склад — за|Состав — по) технічн|(Склад — за|Состав — по) техническ/); const j = h.indexOf('</p></div>', k); if (k < i || j < 0) throw new Error('block end not found'); return h.slice(0, i) + h.slice(j + 10); };
const place = (h, blk) => { const s = strip(h).replace(OLDPIC, ''); const i = s.search(ANCHOR); return i < 0 ? s + blk : s.slice(0, i) + blk + s.slice(i); };
const plan = { name: NAME || 'setblock', products: {} }; const wait = [], questions = [], notes = [];
const sets = only.length ? only : Object.keys(ST.sets);
for (const s of sets) { const v = ST.sets[s]; const p = L[s]; if (!v || !p || +p.display_in_showcase !== 1) continue;
  if (!v.ready) { wait.push({ art: s, name: v.name, why: v.comps.filter(c => !['cut', 'knipex'].includes(c.state)).map(c => (c.art || c.head.slice(0, 40)) + ': ' + c.state) }); continue; }
  if (/class="wsb"/.test(p.description.ua + p.description.ru)) notes.push(`${s}: блок уже есть — заменяется`);
  const items = []; const seen = new Set(); const q = [];
  for (const g of C[s]) for (const x of g.items) { const key = x.art || g.head; if (seen.has(key)) continue; seen.add(key);
    const c = x.art ? L[x.art] : null; const gr = G.group(c, g.head); if (gr.question) { q.push(`${x.art || '—'} ${g.head}: ${gr.question}`); continue; }
    if (x.art) { const nm = l => SB.withCode(SB.baseName(c.mod_title[l], x.art), g.code);
      items.push({ art: x.art, qty: x.qty, gkey: gr.key, size: SB.size(x.size, c.mod_title.ua, gr.key), name: { ua: nm('ua'), ru: nm('ru') }, href: +c.display_in_showcase === 1 ? { ua: c.link, ru: ru(c.link) } : null, img: c.images[0] }); }
    else { const k = Object.keys(NOART).find(k => g.head.includes(k)); if (!k) { q.push(`— ${g.head}: позиція без артикула`); continue; }
      items.push({ art: NOART[k].art, qty: x.qty, gkey: gr.key, size: '', name: { ua: NOART[k].ua, ru: NOART[k].ru }, href: NOART[k].href, img: NOART[k].img }); } }
  const wu = W.art[s]; const wp = wu && W.pages[wu]; const w = wp && wp.setItems && wp.setItems.length ? wp.setItems.flatMap(i => i.rows) : null;
  const da = items.filter(i => /^\d{11}$/.test(i.art)).map(i => i.art + ':' + i.qty).sort().join(','), wa = w ? w.filter(r => r.art).map(r => r.art + ':' + r.qty).sort().join(',') : null;
  if (w && da !== wa) q.push(`паспорт ≠ wera.de: только паспорт ${da.split(',').filter(x => !wa.split(',').includes(x)).join(' ') || '—'}; только wera.de ${wa.split(',').filter(x => !da.split(',').includes(x)).join(' ') || '—'}`);
  if (!w) notes.push(`${s}: на wera.de нет «Werkzeuge in diesem Set» — состав по паспорту`);
  if (q.length) { questions.push({ art: s, name: v.name, q }); continue; }
  const count = dsCount(s);
  const html = l => SB.blockG(items.map(i => ({ ...i, href: i.href && i.href[l] })), l, { count });
  const nw = { ua: place(p.description.ua, html('ua')), ru: place(p.description.ru, html('ru')) };
  const removed = (p.description.ua.match(OLDPIC) || []).length;
  plan.products[s] = { old: { ua: p.description.ua, ru: p.description.ru }, new: nw, why: [`блок состава: ${items.length} поз., групп ${new Set(items.map(i => i.gkey)).size}` + (removed ? `, убрано старых картинок ${removed}` : '')] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); fs.writeFileSync(OUT.replace(/\.json$/, '_wait.json'), JSON.stringify({ wait, questions, notes }, null, 1));
// every picture of a planned block must be on our domain
const foreign = Object.entries(plan.products).flatMap(([a, x]) => ['ua', 'ru'].flatMap(l => [...x.new[l].matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(u => !/^(https:\/\/tl-shop\.com\.ua)?\/content\//.test(u)).map(u => a + ' ' + u)));
console.log('plan', Object.keys(plan.products).length, '| wait (photos of other groups)', wait.length, '| questions', questions.length, '| notes', notes.length, '| foreign pictures', foreign.length);
for (const f of foreign.slice(0, 5)) console.log('  FOREIGN', f); for (const x of questions) console.log('  Q', x.art, x.q.join(' | ')); for (const n of notes) console.log('  ', n);
