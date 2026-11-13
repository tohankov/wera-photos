// Owner 12–13.11.2026: a «Склад набору» block must not depend on an old file (Horoshop may delete it). Every card of every written block (div.wsb, UA and
// RU) whose picture is not the CURRENT main photo of its product gets the current one — the product of a card: the name link (href = our product page),
// else the article in «Арт. …». A main photo on a square transparent canvas (vt/square_ratio.js) is shown cropped to the centre of the 76×46 cell —
// class wsq (object-fit: cover) when its content is >= 1.62 : 1, else wsc (contain); the two rules are added to the block's own <style> (as vt/setblock.js).
// Only the <img> of such cards and the <style> change; KNIPEX / WERA files under /icons/ are not touched.
//   node vt/blocks_resrc.js <all export.json> <out plan.json> [name] [photos_audit replace_state.json]   -> plan for cat/desc_write.js
const fs = require('fs'); const [, , ALL, OUT, NAME, STATE] = process.argv; const RS = STATE ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : null;   // [replace_state.json]: a square class only where the square is uploaded
const A =JSON.parse(fs.readFileSync(ALL, 'utf8')); const SQR = require('./square_ratio.js');
const L = Object.fromEntries(A.map(p => [p.article, p])); const byPath = {}; for (const p of A) if (p.link) byPath[p.link.replace(/^https?:\/\/[^/]+/, '').replace(/^\/ru\//, '/')] = p.article;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SQCSS = '.wsb img.wsq{width:76px;height:46px;object-fit:cover;object-position:center}.wsb img.wsc{width:76px;height:46px;object-fit:contain;object-position:center}';
const PIC = '<span style="flex:0 0 76px;width:76px;height:46px;display:flex;align-items:center;justify-content:center">';
const plan = { name: NAME || 'blocks_resrc', products: {} }; const st = { blocks: 0, cards: 0, changed: 0, wsq: 0, wsc: 0, plain: 0, unknown: 0 }; const unk = [];
for (const p of A) { const d = p.description || {}; if (!/class="wsb"/.test(d.ua || '')) continue; const nw = {}; let ch = 0;
  for (const l of ['ua', 'ru']) { let h = d[l] || ''; const parts = h.split(PIC); let used = false;
    for (let i = 1; i < parts.length; i++) { const seg = parts[i]; const m = seg.match(/^(<img\b[^>]*>)/); if (!m) continue; st.cards++; const img = m[1]; const src = (img.match(/src="([^"]+)"/) || [])[1] || '';
      if (/\/icons\//.test(src)) continue; const href = (seg.match(/<a href="([^"]+)"/) || [])[1]; const art = (seg.match(/Арт\. (\d{11})\b/) || [])[1];
      let a = href && byPath[href.replace(/^https?:\/\/[^/]+/, '').replace(/^\/ru\//, '/')]; if (!a && art && L[art]) a = art;
      if (!a || !(L[a].images || [])[0]) { st.unknown++; if (unk.length < 20) unk.push(p.article + ' ' + l + ' ' + src.slice(-30)); continue; }
      const cur = L[a].images[0]; const r = SQR[a] && (!RS || (RS[a] && RS[a].done)) && SQR[a]; const cls = r ? (r[0] / r[1] >= 1.62 ? 'wsq' : 'wsc') : ''; if (cls) used = true;
      const want = cls ? `<img class="${cls}" src="${esc(cur)}" alt="${(img.match(/alt="([^"]*)"/) || [, ''])[1]}" loading="lazy" style="display:block">`
        : (src === cur ? img : img.replace(src, esc(cur)));
      if (want !== img) { parts[i] = want + seg.slice(img.length); ch++; st.changed++; st[cls || 'plain']++; } }
    h = parts.join(PIC); if (used && !h.includes('img.wsq')) h = h.replace(/(<div class="wsb"><style>[\s\S]*?)(<\/style>)/, `$1${SQCSS}$2`); nw[l] = h; }
  st.blocks++; if (ch) plan.products[p.article] = { old: { ua: d.ua, ru: d.ru }, new: nw, why: [`блок: ${ch} картинок → текущее главное фото компонента (квадрат — обрезка по центру), владелец 12–13.11.2026`] }; }
fs.writeFileSync(OUT, JSON.stringify(plan)); console.log(JSON.stringify(st), 'products', Object.keys(plan.products).length); if (unk.length) console.log('unknown cards (left as is):\n' + unk.join('\n'));
