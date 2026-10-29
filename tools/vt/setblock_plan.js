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
// the datasheet has no composition table (950/9 Hex-Plus Multicolour 1 …): the composition of wera.de «Werkzeuge in diesem Set» — also WERA (27.10.2026)
const compOf = s => { const c = (C[s] || []).filter(g => g.items && g.items.length); if (c.length) return c; const wp = W.pages[W.art[s]]; if (!wp || !wp.setItems) return [];
  return wp.setItems.filter(i => i.rows.length).map(i => ({ head: i.name, code: (i.name.match(/^\d{3,4}(?:\/\d+)?(?:\s[A-Z]{1,5}(?=\s|$))*/) || [''])[0], items: i.rows.map(r => ({ art: r.art, qty: r.qty, size: r.size.replace(/(\d),(\d)/g, '$1.$2').replace(/ mm$/, ' мм') })) })); };
const NR = require('./noart_resolve.js'); const NA = fs.existsSync(path.join(__dirname, 'noart.json')) ? require('./noart.json') : { names: {}, arts: {} };
const OKST = ['cut', 'knipex', 'no article', 'not ours'];
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
// CLAUDE.md «не трогать»: Bit-Check 30 Christmas, Christmas MIX, 05133126001
const NOTOUCH = new Set(['05135824001', '05135826001', '05133126001']);
const sets = (only.length ? only : Object.keys(ST.sets)).filter(s => !NOTOUCH.has(s));
for (const s of sets) { const v = ST.sets[s]; const p = L[s]; if (!v || !p || +p.display_in_showcase !== 1) continue;
  // positions without our product ('no article' / 'not ours') are resolved below (wera.de article / WERA picture, vt/noart.json); others wait
  if (v.comps.some(c => !OKST.includes(c.state))) { wait.push({ art: s, name: v.name, why: v.comps.filter(c => !OKST.includes(c.state)).map(c => (c.art || c.head.slice(0, 40)) + ': ' + c.state) }); continue; }
  if (/class="wsb"/.test(p.description.ua + p.description.ru)) notes.push(`${s}: блок уже есть — заменяется`);
  const items = []; const seen = new Set(); const q = [], pend = [];
  for (const g of compOf(s)) for (const x of g.items) { const key = x.art || g.head + '|' + x.size; if (seen.has(key)) continue; seen.add(key);
    let art = x.art, c = x.art ? L[x.art] : null;
    if (!c) { const { w } = NR.wmatch(s, g, x); if (w && w.art && L[w.art]) { art = w.art; c = L[w.art]; } // the wera.de row names our product (CLAUDE.md)
      else { // KNIPEX — matched by its article in the head (28.10.2026: before, any KNIPEX head took the 87 01 250 card); else the WERA picture
        const kk = /KNIPEX/i.test(g.head) && Object.keys(NA.knipex || {}).find(k => g.head.includes(k));
        const e = kk ? NA.knipex[kk] : (w && !w.art && NA.names[w.name]) || NA.arts[x.art || (w && w.art)];
        if (!e || !e.group) { q.push(`${x.art || '—'} ${g.head}: немає нашого товару${/KNIPEX/i.test(g.head) ? ' (KNIPEX — немає в списку KNX, vt/noart_files.js)' : w ? ', назва / група не задані (vt/noart_files.js)' : ' і рядка wera.de'}`); continue; }
        if (!e.uploaded) { pend.push(`${x.art || (w && w.art) || kk || '—'} ${g.head.slice(0, 50)}: файл ${e.file} не завантажено`); continue; }
        items.push({ art: kk || x.art || (w && w.art) || null, qty: x.qty, gkey: e.group, size: kk ? '' : SB.size(x.size, e.ua, e.group), name: { ua: e.ua, ru: e.ru }, href: e.href || null, img: 'https://tl-shop.com.ua/content/uploads/images/icons/' + e.file }); continue; } }
    const gr = G.group(c, g.head); if (gr.question) { q.push(`${x.art || '—'} ${g.head}: ${gr.question}`); continue; }
    // a straight quote in a name (1" ) is written as ″: Horoshop turns &quot; inside alt="" back into " and the attribute breaks (29.10.2026, 05005581001)
    const nm = l => SB.withCode(SB.baseName(c.mod_title[l], art), g.code).replace(/(\d)\s?"/g, '$1″').replace(/"/g, '″');
    items.push({ art, qty: x.qty, gkey: gr.key, size: SB.size(x.size, c.mod_title.ua, gr.key), name: { ua: nm('ua'), ru: nm('ru') }, href: +c.display_in_showcase === 1 ? { ua: c.link, ru: ru(c.link) } : null, img: c.images[0] }); }
  if (pend.length && !q.length) { wait.push({ art: s, name: v.name, why: pend }); continue; }
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
