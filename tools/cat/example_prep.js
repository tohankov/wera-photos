// Example preparation (step б), nothing is written to the site): main photos of the given products downloaded and cut (lib/cutout.js) ->
// <dir>/<art>_before.jpg (white tile) / <art>_after.jpg (the site's dark background) / <art>_cut.png; for every set given with «set:» the grouped
// «Склад набору» block (vt/setblock.js blockG) with its positions' cut-out photos embedded — <dir>/block_<art>.json {ua, ru} + the positions without our
// product (their WERA picture from the wera.de set page when there is one — a file for the owner to upload) in <dir>/block_<art>_extra.json.
//   node cat/example_prep.js <all.json> <dir> <art> [art ...] [set:<art> ...]
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const SB = require('../vt/setblock.js'); const G = require('../vt/setgroup.js'); const C = require('./ds_comp_all.json'); const W = require('../../inventory/wera/pages.json');
const [, , ALL, D, ...args] = process.argv; const A = Object.fromEntries(JSON.parse(fs.readFileSync(ALL, 'utf8')).map(p => [p.article, p]));
// NAMES=<set.json> (names plan of the group): the block shows the names as they will be after the names step
if (process.env.NAMES) for (const [a, v] of Object.entries(JSON.parse(fs.readFileSync(process.env.NAMES, 'utf8')))) if (A[a]) A[a] = { ...A[a], mod_title: { ua: v.ua, ru: v.ru } }; fs.mkdirSync(D, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function photo(a) { const cf = path.join(D, a + '_cut.png'); if (fs.existsSync(cf)) return cf; const u = A[a].images[0]; const f = path.join(D, a + '_orig.' + u.split('.').pop());
  if (!fs.existsSync(f)) { await sleep(300); const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } }); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  const { png } = await cut(f); fs.writeFileSync(cf, png);
  await sharp({ create: { width: 600, height: 600, channels: 3, background: '#191816' } }).composite([{ input: await sharp(png).resize(560, 560, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), left: 20, top: 20 }]).jpeg({ quality: 85 }).toFile(path.join(D, a + '_after.jpg'));
  await sharp(f).resize(600, 600, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 85 }).toFile(path.join(D, a + '_before.jpg')); return cf; }
const thumb = async f => 'data:image/png;base64,' + (await sharp(f).trim().resize(152, 92, { fit: 'inside' }).png().toBuffer()).toString('base64');
(async () => {
  for (const x of args.filter(x => !x.startsWith('set:'))) { await photo(x); console.log('photo', x); }
  for (const s of args.filter(x => x.startsWith('set:')).map(x => x.slice(4))) { await photo(s); const items = [], extra = [], q = []; const seen = new Set();
    const wp = W.pages[W.art[s]]; const wItems = wp && wp.setItems || [];
    for (const g of C[s]) for (const x of g.items) { const key = (x.art || g.head) + '|' + x.size; if (seen.has(key)) continue; seen.add(key);
      if (x.art && A[x.art]) { const c = A[x.art]; const gr = G.group(c, g.head); if (gr.question) { q.push(`${x.art}: ${gr.question}`); continue; }
        const nm = l => SB.withCode(SB.baseName(c.mod_title[l], x.art), g.code);
        items.push({ art: x.art, qty: x.qty, gkey: gr.key, size: SB.size(x.size, c.mod_title.ua, gr.key), name: { ua: nm('ua'), ru: nm('ru') }, href: +c.display_in_showcase === 1 ? { ua: c.link, ru: c.link.replace('tl-shop.com.ua/', 'tl-shop.com.ua/ru/') } : null, img: await thumb(await photo(x.art)) }); }
      else { const wi = wItems.find(i => i.rows.some(r => x.art ? r.art === x.art : !r.art)); extra.push({ head: g.head, size: x.size, art: x.art, wera: wi ? { name: wi.name, img: wi.img } : null }); q.push(`${x.art || '—'} ${g.head}: нет нашего товара`); } }
    const count = (() => { const t = fs.readFileSync(path.join(__dirname, '../batch/ds/' + s + '.txt'), 'utf8').split('\n').filter(l => l.startsWith('p1 ')).map(l => l.slice(3)); const e = t.findIndex(l => /^EAN:/.test(l)); const m = t.slice(0, e < 0 ? 3 : e).join(' ').match(/(\d+)\s+предмет/); return m ? +m[1] : undefined; })();
    const out = {}; for (const l of ['ua', 'ru']) out[l] = SB.blockG(items.map(i => ({ ...i, href: i.href && i.href[l] })), l, { count });
    fs.writeFileSync(path.join(D, 'block_' + s + '.json'), JSON.stringify(out));
    const outB = {}; for (const l of ['ua', 'ru']) outB[l] = SB.blockG(items.map(i => ({ ...i, href: i.href && i.href[l] })), l, { count, keepOrder: true });
    fs.writeFileSync(path.join(D, 'block_' + s + '_B.json'), JSON.stringify(outB));   // variant: groups in the datasheet order fs.writeFileSync(path.join(D, 'block_' + s + '_extra.json'), JSON.stringify({ extra, questions: q }, null, 1));
    console.log('block', s, 'positions', items.length, 'groups', [...new Set(items.map(i => i.gkey))].join(','), '| without our product', extra.length, '| questions', q.length); } })();
