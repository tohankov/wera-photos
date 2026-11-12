// Owner 12.11.2026: main photos without background (PNG with alpha) whose sides differ 1.5× or more — a strip stands at the top of the photo zone
// (05057667001). Reads only the PNG header (Range 0-63: IHDR width / height / colour type), visible products, resumable <out>.
//   node photos_audit/aspect_audit.js <all export.json> <out.json>   -> { checked: {art: {w, h, alpha, url}}, summary by group }
const fs = require('fs'), path = require('path'); const [, , ALL, OUT] = process.argv; const A = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const G = require(path.join(__dirname, '../../inventory/global_progress.json')); const T = require('../../inventory/menu_tree.json'); const nm = Object.fromEntries(T.map(x => [x.id, x.path.trim()]));
const st = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { checked: {} }; const sleep = ms => new Promise(r => setTimeout(r, ms)); const T0 = Date.now();
(async () => { for (const p of A) { if (+p.display_in_showcase !== 1 || !(p.images || [])[0] || !/\.png$/i.test(p.images[0])) continue; const c = st.checked[p.article]; if (c && c.url === p.images[0]) continue;
    if (Date.now() - T0 > 540000) break; await sleep(120);
    try { const r = await fetch(p.images[0], { headers: { range: 'bytes=0-63', 'user-agent': 'Mozilla/5.0' } }); const b = Buffer.from(await r.arrayBuffer());
      if (b.toString('ascii', 12, 16) !== 'IHDR') { st.checked[p.article] = { url: p.images[0], err: 'no IHDR ' + r.status }; continue; }
      st.checked[p.article] = { url: p.images[0], w: b.readUInt32BE(16), h: b.readUInt32BE(20), alpha: [4, 6].includes(b[25]) || b[25] === 3 }; } catch (e) { st.checked[p.article] = { url: p.images[0], err: e.message }; }
    if (Object.keys(st.checked).length % 50 === 0) fs.writeFileSync(OUT, JSON.stringify(st)); }
  const L = Object.fromEntries(A.map(p => [p.article, p])); const by = {}; let all = 0, long = 0;
  for (const [a, v] of Object.entries(st.checked)) { if (!v.w || !v.alpha || !L[a] || +L[a].display_in_showcase !== 1) continue; all++; const r = Math.max(v.w, v.h) / Math.min(v.w, v.h); v.ratio = +r.toFixed(2);
    const g = (G.articles[a] || {}).group; const k = nm[g] || ('раздел ' + (L[a].parent && (L[a].parent.id || L[a].parent))); const e = by[k] = by[k] || { all: 0, long: 0, wide: 0, tall: 0, arts: [] }; e.all++;
    if (r >= 1.5) { long++; e.long++; if (v.w > v.h) e.wide++; else e.tall++; e.arts.push(a); } }
  st.summary = { all, long, by }; fs.writeFileSync(OUT, JSON.stringify(st, null, 1)); console.log('PNG with alpha', all, 'ratio >= 1.5:', long, 'checked', Object.keys(st.checked).length);
  for (const [k, e] of Object.entries(by).sort((x, y) => y[1].long - x[1].long)) console.log(e.long, '/', e.all, '(wide', e.wide + ', tall', e.tall + ')', k); })();
