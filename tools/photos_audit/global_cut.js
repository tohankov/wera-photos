// Global check item 7 (owner 24.10.2026): the MAIN photo of every visible product of a group without background — local part only, nothing is uploaded here.
//   node photos_audit/global_cut.js <group live.json> <global_<gid>.json> <work dir> [budget s=520]   (resumable)
// For each visible product the analysis marked «главное фото на белом — снять фон»: download the main photo as stored (images[0]) -> backup/global_photo_orig/<art>.<ext>
// (the original, kept before any upload) -> lib/cutout.js -> <work>/cut/<art>.png; skipped: already transparent (PNG with transparent corners), a wide picture
// (w/h > 1.4 — «в работе», not touched). Then sheets of 20 on the site's dark background (#191816) -> <work>/sheets/sheet_NN.jpg, each cell labelled with
// the article; every sheet is looked at by eye, a doubtful photo goes to <work>/doubt.json and keeps its original.
const fs = require('fs'), path = require('path'); const sharp = require('sharp'); const { cut } = require('../lib/cutout.js');
const [, , LIVE, GJ, WORK, B] = process.argv; const T0 = Date.now(), BUD = (+B || 520) * 1000; const sleep = ms => new Promise(r => setTimeout(r, ms));
const ORIG = 'C:/Users/Techlight/Desktop/wera-photos/backup/global_photo_orig/'; fs.mkdirSync(ORIG, { recursive: true }); for (const d of ['cut', 'sheets']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const L = Object.fromEntries(JSON.parse(fs.readFileSync(LIVE, 'utf8')).map(p => [p.article, p])); const J = JSON.parse(fs.readFileSync(GJ, 'utf8'));
const todo = J.products.filter(p => p.vis && p.list.some(f => f.item === 7 && /снять фон/.test(f.what))).map(p => p.art);
const SF = path.join(WORK, 'state.json'); const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : {}; const save = () => fs.writeFileSync(SF, JSON.stringify(st, null, 1));
(async () => {
  for (const a of todo) { if (st[a]) continue; if (Date.now() - T0 > BUD - 20000) break; const p = L[a]; const url = (p.images || [])[0]; if (!url) { st[a] = { skip: 'нет фото' }; continue; }
    const ext = path.extname(url.split('?')[0]).toLowerCase() || '.jpg'; const of = ORIG + a + ext;
    if (!fs.existsSync(of)) { await sleep(700); const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } }); if (!r.ok) { st[a] = { skip: 'HTTP ' + r.status, url }; save(); continue; } fs.writeFileSync(of, Buffer.from(await r.arrayBuffer())); }
    const m = await sharp(of).metadata();
    if (m.width / m.height > 1.4) { st[a] = { skip: 'широкое фото («в работе»)', url, w: m.width, h: m.height }; save(); continue; }
    if (m.hasAlpha) { const { data, info } = await sharp(of).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const W = info.width, H = info.height;
      const corners = [0, W - 1, (H - 1) * W, H * W - 1].map(i => data[i * 4 + 3]); if (corners.every(x => x < 10)) { st[a] = { skip: 'уже без фона', url }; save(); continue; } }
    const r = await cut(of); fs.writeFileSync(path.join(WORK, 'cut', a + '.png'), r.png); st[a] = { url, orig: of, w: m.width, h: m.height, stats: r.stats }; save(); }
  const done = todo.filter(a => st[a] && !st[a].skip); console.log('todo', todo.length, '| cut', done.length, '| skipped', todo.filter(a => st[a] && st[a].skip).length, '| left', todo.filter(a => !st[a]).length);
  if (todo.some(a => !st[a])) return;
  // sheets: 5 x 4 cells of 300 x 300 on #191816, label = article
  const CELL = 300, COLS = 5, ROWS = 4, PER = COLS * ROWS; const sheets = [];
  for (let s = 0; s * PER < done.length; s++) { const part = done.slice(s * PER, s * PER + PER); const comp = [];
    for (const [i, a] of part.entries()) { const x = (i % COLS) * CELL, y = ((i / COLS) | 0) * (CELL + 24);
      comp.push({ input: await sharp(path.join(WORK, 'cut', a + '.png')).resize(CELL - 16, CELL - 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: x + 8, top: y + 8 });
      comp.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="24"><text x="8" y="17" font-family="Arial" font-size="15" fill="#9a9a9a">${s * PER + i + 1}. ${a}</text></svg>`), left: x, top: y + CELL }); }
    const f = path.join(WORK, 'sheets', `sheet_${String(s + 1).padStart(2, '0')}.jpg`);
    await sharp({ create: { width: COLS * CELL, height: ROWS * (CELL + 24), channels: 3, background: '#191816' } }).composite(comp).jpeg({ quality: 88 }).toFile(f); sheets.push(f); }
  fs.writeFileSync(path.join(WORK, 'order.json'), JSON.stringify(done)); console.log('sheets', sheets.length);
})().catch(e => { console.error(e); save(); process.exit(1); });
